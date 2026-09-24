#!/usr/bin/env python3
"""Generate a quote workbook from a JSON row list. Do not invent layout."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, Side

ALLOWED_RESULTS = {"已匹配", "未匹配"}
EFFORT_KEYS = ("product", "dev", "delivery")
EFFORT_LABELS = {"product": "产品", "dev": "研发", "delivery": "交付"}
EFFORT_LABEL_RE = re.compile(r"(产品|研发|交付)\s*=\s*(--|\d+(?:\.\d+)?)")
EFFORT_ITEM_RE = re.compile(
    r"「(?P<name>[^」]+)」\s*(?P<value>\d+(?:\.\d+)?)\s*（(?P<evidence>[^）]+)）"
)
HEADERS = [
    "一级功能",
    "二级功能",
    "三级功能",
    "核心功能描述",
    "产品时效",
    "研发时效",
    "交付时效",
    "时效总计",
    "工时说明",
    "功能匹配结果",
    "匹配模块/功能",
    "匹配依据说明",
    "匹配来源",
]
COL_WIDTHS = {
    "A": 14.37,
    "B": 16.13,
    "C": 14.63,
    "D": 48.0,
    "E": 14.37,
    "F": 12.0,
    "G": 16.37,
    "H": 12.0,
    "I": 48.0,
    "J": 15.25,
    "K": 15.75,
    "L": 33.38,
    "M": 26.12,
}


def _font(bold=False, size=11, name=None):
    kw = {"bold": bold, "size": size, "color": "FF0F1115"}
    if name:
        kw["name"] = name
    return Font(**kw)


def _data_font():
    return Font(size=11, color="FF0F1115")


def _thin_bottom():
    return Border(bottom=Side(style="thin"))


def _numeric_effort(row: dict, key: str) -> float | None:
    value = row.get(key)
    if isinstance(value, str) and value.strip() == "--":
        return None
    return float(value)


def _validate_effort_reason(row: dict, i: int) -> list[str]:
    errors: list[str] = []
    reason = str(row.get("effort_reason", "")).strip()
    matches = list(EFFORT_LABEL_RE.finditer(reason))
    if [match.group(1) for match in matches] != ["产品", "研发", "交付"]:
        return [f"第{i}行工时说明必须按 产品=...；研发=...；交付=... 逐列写取数式"]

    for index, match in enumerate(matches):
        label = match.group(1)
        key = next(original_key for original_key, original_label in EFFORT_LABELS.items() if original_label == label)
        declared = match.group(2)
        segment = reason[match.start() : matches[index + 1].start() if index + 1 < len(matches) else len(reason)]
        try:
            row_value = _numeric_effort(row, key)
        except (TypeError, ValueError):
            row_value = "invalid"

        if declared == "--":
            if row_value is not None:
                errors.append(f"第{i}行{label}工时为数字，但工时说明写 --")
            if not any(marker in segment for marker in ("未获得可追溯源行", "无法评估")):
                errors.append(f"第{i}行{label}为 -- 时必须说明未获得可追溯源行，无法评估")
            if EFFORT_ITEM_RE.search(segment):
                errors.append(f"第{i}行{label}为 -- 时不得列数字项")
            continue

        declared_value = float(declared)
        if row_value == "invalid":
            errors.append(f"第{i}行{label}工时不是数字或 --")
            continue
        if row_value is None or abs(row_value - declared_value) > 0.051:
            errors.append(f"第{i}行{label}工时说明与 {key} 不一致")

        items = list(EFFORT_ITEM_RE.finditer(segment))
        if not items:
            errors.append(f"第{i}行{label}必须列出「功能/原子任务」数值（来源或AI评估定级原因）")
            continue

        item_total = 0.0
        for item in items:
            name = item.group("name")
            value = float(item.group("value"))
            evidence = item.group("evidence")
            item_total += value
            if value < 0:
                errors.append(f"第{i}行{label}取数项 {name} 不能小于 0")
            if "AI原子任务" in name or "AI评估" in evidence:
                if "AI评估" not in evidence or not any(
                    level in evidence for level in ("L1", "L2", "L3", "T0", "T1", "T2", "T3")
                ):
                    errors.append(f"第{i}行{label}AI取数项 {name} 必须写 AI评估、定级和原因")
                if len(evidence.replace("AI评估", "").replace("，", "").strip()) < 4:
                    errors.append(f"第{i}行{label}AI取数项 {name} 缺少定级原因")
            elif "Sheet：" not in evidence or "行：" not in evidence:
                errors.append(f"第{i}行{label}取数项 {name} 必须写 Sheet 和行号")
        if abs(item_total - declared_value) > 0.051:
            errors.append(f"第{i}行{label}取数项之和必须等于 {label} 工时")

    return errors


def _validate_merge_groups(rows: list[dict]) -> list[str]:
    errors: list[str] = []
    groups: dict[str, list[int]] = {}
    for i, row in enumerate(rows, 1):
        group = row.get("merge_group")
        if group in (None, ""):
            continue
        if not isinstance(group, str):
            errors.append(f"第{i}行 merge_group 必须是非空字符串")
            continue
        groups.setdefault(group, []).append(i)

    for group, row_numbers in groups.items():
        if len(row_numbers) != 2:
            errors.append(f"拆分组 {group} 必须恰好有 2 行")
            continue
        if row_numbers[1] - row_numbers[0] != 1:
            errors.append(f"拆分组 {group} 的 2 行必须相邻")
            continue
        first, second = rows[row_numbers[0] - 1], rows[row_numbers[1] - 1]
        if first.get("l1") != second.get("l1") or first.get("l2") != second.get("l2"):
            errors.append(f"拆分组 {group} 的一级、二级功能必须一致")
        results = sorted(str(row.get("match_result", "")) for row in (first, second))
        if results != ["已匹配", "未匹配"]:
            errors.append(f"拆分组 {group} 必须分别包含已匹配和未匹配")
    return errors


def validate(rows: list[dict]) -> list[str]:
    errors = []
    if not rows:
        errors.append("rows 为空")
        return errors
    for i, row in enumerate(rows, 1):
        for key in (
            "l1",
            "l2",
            "l3",
            "desc",
            "effort_reason",
            "match_result",
            "match_module",
            "match_reason",
            "match_source",
        ):
            if key not in row or row[key] in (None, ""):
                errors.append(f"第{i}行缺少 {key}")
        result = row.get("match_result")
        if result not in ALLOWED_RESULTS:
            errors.append(f"第{i}行 match_result 非法: {result!r}")
        if result == "未匹配":
            if row.get("match_module") != "-":
                errors.append(f"第{i}行未匹配时 match_module 必须为 '-'")
            if row.get("match_reason") != "未从标准产品功能清单和历史项目库中找到匹配项":
                errors.append(f"第{i}行未匹配依据必须使用固定原文")
            if row.get("match_source") != "AI评估" and "AI评估" not in str(row.get("match_source", "")):
                errors.append(f"第{i}行未匹配来源应含 AI评估")
            if "P3" not in str(row.get("effort_reason", "")) and "原子任务" not in str(row.get("effort_reason", "")):
                errors.append(f"第{i}行未匹配工时说明必须写 P3 原子任务依据")
        if result == "已匹配":
            match_reason = str(row.get("match_reason", ""))
            if "已支持" not in match_reason or "复用" not in match_reason:
                errors.append(f"第{i}行已匹配依据必须写已支持和复用")
        errors.extend(_validate_effort_reason(row, i))
        for num_key in ("product", "dev", "delivery"):
            try:
                value = _numeric_effort(row, num_key)
            except (TypeError, ValueError):
                errors.append(f"第{i}行 {num_key} 不是数字或 --")
            else:
                if value is not None and value < 0:
                    errors.append(f"第{i}行 {num_key} 不能小于 0")
        l3 = str(row.get("l3", ""))
        if l3.endswith(" *") or l3.endswith("＊"):
            errors.append(f"第{i}行依赖标记应为名称后直接加 *，无空格")
        match_source = str(row.get("match_source", ""))
        effort_reason = str(row.get("effort_reason", ""))
        if (
            result == "已匹配"
            and "标准" in match_source
            and "三项缺失，按规则0" in effort_reason
        ):
            try:
                values = [_numeric_effort(row, key) for key in EFFORT_KEYS]
            except (TypeError, ValueError):
                errors.append(f"第{i}行标准三项缺失按规则0时，三列时效必须是数字")
            else:
                if any(value != 0 for value in values):
                    errors.append(f"第{i}行标准三项缺失按规则0时，三列时效必须都是 0")
        if result == "已匹配" and "历史" in match_source:
            if not any(marker in effort_reason for marker in ("直读", "累加", "求和", "+")):
                errors.append(f"第{i}行历史工时说明必须写直读、累加或求和计算式")
    errors.extend(_validate_merge_groups(rows))
    return errors


def fill(output: Path, rows: list[dict]) -> dict:
    errors = validate(rows)
    if errors:
        return {"ok": False, "errors": errors}

    wb = Workbook()
    ws = wb.active
    ws.title = "报价单"

    header_font = _font(bold=True)
    data_font = _data_font()
    total_font = Font(name="等线", size=10)
    wrap_center = Alignment(vertical="center", wrap_text=True)
    center = Alignment(vertical="center")
    bottom = _thin_bottom()

    for col, header in enumerate(HEADERS, 1):
        cell = ws.cell(1, col, header)
        cell.font = header_font
        cell.alignment = wrap_center if col in (4, 9, 10, 11, 12, 13) else center
        cell.border = bottom

    n = len(rows)
    merge_ranges: list[tuple[int, int]] = []
    merge_start: tuple[str, int] | None = None
    for i, row in enumerate(rows, 2):
        group = row.get("merge_group")
        if isinstance(group, str) and group:
            if merge_start and merge_start[0] == group:
                merge_ranges.append((merge_start[1], i))
                merge_start = None
            else:
                merge_start = (group, i)
        else:
            merge_start = None
        product = _numeric_effort(row, "product")
        dev = _numeric_effort(row, "dev")
        delivery = _numeric_effort(row, "delivery")
        effort_values = [product, dev, delivery]
        if all(value is not None for value in effort_values):
            total_formula = f"=E{i}+F{i}+G{i}"
        else:
            total_formula = f'=IF(COUNT(E{i}:G{i})=3,E{i}+F{i}+G{i},"--")'
        values = [
            row["l1"],
            row["l2"],
            row["l3"],
            row["desc"],
            effort_values[0] if effort_values[0] is not None else "--",
            effort_values[1] if effort_values[1] is not None else "--",
            effort_values[2] if effort_values[2] is not None else "--",
            total_formula,
            row["effort_reason"],
            row["match_result"],
            row["match_module"],
            row["match_reason"],
            row["match_source"],
        ]
        desc_len = max(len(str(row["desc"])), len(str(row["effort_reason"])))
        ws.row_dimensions[i].height = 44 if desc_len < 40 else 58 if desc_len < 80 else 72
        for col, val in enumerate(values, 1):
            cell = ws.cell(i, col, val)
            cell.font = data_font
            cell.border = bottom
            cell.alignment = wrap_center if col in (4, 9, 10, 11, 12, 13) else center

    for start, end in merge_ranges:
        ws.merge_cells(start_row=start, start_column=1, end_row=end, end_column=1)
        ws.merge_cells(start_row=start, start_column=2, end_row=end, end_column=2)

    last = n + 1
    total_row = n + 2
    ws.merge_cells(start_row=total_row, start_column=1, end_row=total_row, end_column=4)
    ws.cell(total_row, 1, "合计").font = total_font
    ws.cell(total_row, 1).alignment = center
    for col, letter in enumerate(["E", "F", "G", "H"], 5):
        cell = ws.cell(
            total_row,
            col,
            f'=IF(COUNT({letter}2:{letter}{last})={n},SUM({letter}2:{letter}{last}),"--")',
        )
        cell.font = total_font
        cell.alignment = center
    ws.row_dimensions[total_row].height = 16.5

    for col, width in COL_WIDTHS.items():
        ws.column_dimensions[col].width = width

    output.parent.mkdir(parents=True, exist_ok=True)
    wb.save(output)

    totals = {}
    for key in EFFORT_KEYS:
        numbers = [_numeric_effort(row, key) for row in rows]
        totals[key] = sum(numbers) if all(value is not None for value in numbers) else "--"
    total = (
        totals["product"] + totals["dev"] + totals["delivery"]
        if all(isinstance(totals[key], float) for key in EFFORT_KEYS)
        else "--"
    )
    return {
        "ok": True,
        "rows": n,
        "product": totals["product"],
        "dev": totals["dev"],
        "delivery": totals["delivery"],
        "total": total,
        "output": str(output),
        "merged_groups": len(merge_ranges),
    }


def main():
    parser = argparse.ArgumentParser(description="按固化列定义生成工时报价单")
    parser.add_argument("--input", required=True, help="rows JSON 路径，或 - 表示 stdin")
    parser.add_argument("--output", required=True, help="交付 xlsx 路径")
    args = parser.parse_args()

    raw = sys.stdin.read() if args.input == "-" else Path(args.input).read_text(encoding="utf-8")
    payload = json.loads(raw)
    rows = payload["rows"] if isinstance(payload, dict) else payload
    result = fill(Path(args.output), rows)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result.get("ok") else 1)


if __name__ == "__main__":
    main()
