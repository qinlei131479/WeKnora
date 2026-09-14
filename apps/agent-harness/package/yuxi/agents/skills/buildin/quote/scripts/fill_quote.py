#!/usr/bin/env python3
"""Generate a quote workbook from a JSON row list. Do not invent layout."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, Side

ALLOWED_RESULTS = {"已匹配", "部分匹配", "未匹配"}
HEADERS = [
    "一级功能",
    "二级功能",
    "三级功能",
    "核心功能描述",
    "产品时效",
    "研发时效",
    "交付时效",
    "时效总计",
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
    "I": 15.25,
    "J": 15.75,
    "K": 33.38,
    "L": 26.12,
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


def validate(rows: list[dict]) -> list[str]:
    errors = []
    if not rows:
        errors.append("rows 为空")
        return errors
    for i, row in enumerate(rows, 1):
        for key in ("l1", "l2", "l3", "desc", "match_result", "match_module", "match_reason", "match_source"):
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
        for num_key in ("product", "dev", "delivery"):
            try:
                float(row.get(num_key))
            except (TypeError, ValueError):
                errors.append(f"第{i}行 {num_key} 不是数字")
        l3 = str(row.get("l3", ""))
        if l3.endswith(" *") or l3.endswith("＊"):
            errors.append(f"第{i}行依赖标记应为名称后直接加 *，无空格")
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
        cell.alignment = wrap_center if col in (4, 10, 11, 12) else center
        cell.border = bottom

    n = len(rows)
    for i, row in enumerate(rows, 2):
        values = [
            row["l1"],
            row["l2"],
            row["l3"],
            row["desc"],
            float(row["product"]),
            float(row["dev"]),
            float(row["delivery"]),
            f"=E{i}+F{i}+G{i}",
            row["match_result"],
            row["match_module"],
            row["match_reason"],
            row["match_source"],
        ]
        desc_len = len(str(row["desc"]))
        ws.row_dimensions[i].height = 44 if desc_len < 40 else 58 if desc_len < 80 else 72
        for col, val in enumerate(values, 1):
            cell = ws.cell(i, col, val)
            cell.font = data_font
            cell.alignment = wrap_center if col in (4, 10, 11, 12) else center
            cell.border = bottom

    last = n + 1
    total_row = n + 2
    ws.merge_cells(start_row=total_row, start_column=1, end_row=total_row, end_column=4)
    ws.cell(total_row, 1, "合计").font = total_font
    ws.cell(total_row, 1).alignment = center
    for col, letter in enumerate(["E", "F", "G", "H"], 5):
        cell = ws.cell(total_row, col, f"=SUM({letter}2:{letter}{last})")
        cell.font = total_font
        cell.alignment = center
    ws.row_dimensions[total_row].height = 16.5

    for col, width in COL_WIDTHS.items():
        ws.column_dimensions[col].width = width

    output.parent.mkdir(parents=True, exist_ok=True)
    wb.save(output)

    prod = sum(float(r["product"]) for r in rows)
    dev = sum(float(r["dev"]) for r in rows)
    delivery = sum(float(r["delivery"]) for r in rows)
    return {
        "ok": True,
        "rows": n,
        "product": prod,
        "dev": dev,
        "delivery": delivery,
        "total": prod + dev + delivery,
        "output": str(output),
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
