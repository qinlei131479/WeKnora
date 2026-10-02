#!/usr/bin/env bash
# L0 主干一键端口（WeKnora 企业侧，技能 weknora-upstream-sync 的一部分）
#
# 背景：git merge 只更新影子目录（internal/ frontend/ website-docs/），企业活代码
# apps/ 是人工 fork，不会自动跟上。同步的真正工作量不是解冲突，而是「把 A 的增量搬到 B」。
#
# 本脚本做两件事：
#   1) L0 整文件端口（企业未改造、纯滞后的文件）—— 见下方三路判断
#   2) --3way：对企业改造过的文件做三向合并，自动吃掉不冲突的增量（见下）
#
# 三路判断（对每个映射文件）：
#   企业内容 == 归一化(上游 OLD 版本)  且 上游 OLD != 上游 NEW
#       → 企业停在旧上游、且从未改造 → 【可整文件端口】，直接写入上游 NEW 版本
#   企业内容 != 归一化(上游 OLD 版本)
#       → 企业改造过 → 【需人工】，只报告不动（避免覆盖企业资产）
#   企业内容 == 归一化(上游 NEW 版本)
#       → 已同步 → 无动作
#
# --3way（取代已废弃的补丁队列）：对每个「企业改造过」的文件跑
#   git merge-file  ours=企业当前  base=上游OLD(归一化)  theirs=上游NEW(归一化)
# 结果 = 企业定制 + 上游 OLD→NEW 的增量。干净的自动写回，冲突的留 <<<<<<< 标记落盘待人工。
# 为什么不预先物化成补丁文件：补丁 = diff(上游某版本 → 企业)，上游一升版就全部失效，
# 是纯派生物；三向合并零存储，且冲突时能精确标位（实测 89 个双改文件：34 个自动干净、
# 43 个留标记，其中 15 个只有 1 个冲突块）。
#
# 与 upstream_sync_check.sh 的分工：
#   C1 只「报告」滞后，本脚本「修复」其中可安全自动修复的那部分。
#   本脚本不碰：上游新增文件（C2 管）、i18n/env/配置变体（C4-C6）。
#
# 用法（脚本住在技能目录里，作用于「目标仓库」）：
#   cd <weknora仓库> && <skill>/scripts/port_trunk.sh --old <rev> --new <rev>            # 预演，不写盘
#   ... --old <rev> --new <rev> --apply                                                  # 实际端口
#   ... --old <rev> --new <rev> --docs --apply                                           # 含文档站
#   ... --repo /path/to/weknora ...                                                      # 指定仓库
#   WEKNORA_REPO=/path/to/weknora <skill>/scripts/port_trunk.sh ...
#
#   ... --3way [--out <dir>] [--apply] [--filter <子串>]
#       对企业改造过的文件做三向合并。默认只报告；--apply 把「干净」的结果写回企业文件；
#       冲突结果一律写到 --out（默认 .workbuddy/outputs/port-3way/），绝不覆盖企业原文件。
#
#   --old 缺省：上次合并提交的第二父（上游基线）；--new 缺省：upstream/master
#
# 文档站（website-docs → apps/docs）默认不端口：整文件端口后必须跑术语替换
# （空间→租户等），否则会造成术语回退。需显式 --docs。
#
# 退出码：0 = 无可端口项或全部端口成功；1 = 有可端口项但处于预演模式（提示需 --apply）；
#         3 = --3way 存在冲突未解决；2 = 参数/环境错误。
set -uo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

OLD_UP=""
NEW_UP=""
ROOT=""
APPLY=0
DO_DOCS=0
AGG=0
OUT=""
ONLY=""
THREEWAY=0
TW_OUT=""
TW_FILTER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)  ROOT="${2:-}"; shift ;;
    --old)   OLD_UP="${2:-}"; shift ;;
    --new)   NEW_UP="${2:-}"; shift ;;
    --only)  ONLY="${2:-}"; shift ;;
    --apply) APPLY=1 ;;
    --docs)  DO_DOCS=1 ;;
    --3way)  THREEWAY=1 ;;
    --out)   TW_OUT="${2:-}"; shift ;;
    --filter) TW_FILTER="${2:-}"; shift ;;
    --aggressive) AGG=1 ;;   # 连 B 档（企业内容 ≤3 行且远少于滞后量）一起端口
    -o|--output) OUT="${2:-}"; shift ;;
    -h|--help)  sed -n '2,47p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "未知参数: $1（用 --help 查看用法）" >&2; exit 2 ;;
  esac
  shift
done

if [[ -z "$ROOT" ]]; then ROOT="${WEKNORA_REPO:-}"; fi
if [[ -z "$ROOT" ]]; then ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"; fi
# 注意：git worktree 的 .git 是「文件」不是目录，不能用 -d 判断
if [[ -z "$ROOT" ]]; then
  echo "错误：无法确定目标仓库。用 --repo <路径> 或 WEKNORA_REPO=<路径>，或在仓库内运行。" >&2
  exit 2
fi
ROOT="$(git -C "$ROOT" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$ROOT" ]]; then
  echo "错误：$ROOT 不是 git 仓库。" >&2
  exit 2
fi
cd "$ROOT"

# 自动推导基线：--old 取最近合并提交的第二父，--new 取 upstream/master
if [[ -z "$OLD_UP" ]]; then
  OLD_UP="$(git log --merges --format='%H' -20 2>/dev/null | while read -r c; do
    p="$(git log -1 --format='%P' "$c" 2>/dev/null | awk '{print $2}')"
    [[ -n "$p" ]] && echo "$p" && break
  done)"
fi
if [[ -z "$NEW_UP" ]]; then
  NEW_UP="$(git rev-parse upstream/master 2>/dev/null || echo '')"
fi
if [[ -z "$OLD_UP" || -z "$NEW_UP" ]]; then
  echo "错误：无法确定 --old/--new 基线，请显式指定。" >&2
  exit 2
fi
if ! git cat-file -e "$OLD_UP^{commit}" 2>/dev/null || ! git cat-file -e "$NEW_UP^{commit}" 2>/dev/null; then
  echo "错误：--old 或 --new 不是有效提交。" >&2
  exit 2
fi

# 落盘比对：逐文件 git show 在上千文件时极慢（曾 600s 超时），改用 archive 一次性展开
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
for side in old new; do
  rev="$OLD_UP"; [[ "$side" == "new" ]] && rev="$NEW_UP"
  for d in internal frontend/src website-docs; do
    mkdir -p "$WORK/$side/$(dirname "$d")"
    git archive "$rev" "$d" 2>/dev/null | tar -x -C "$WORK/$side" 2>/dev/null
  done
done

export PT_OLD="$OLD_UP" PT_NEW="$NEW_UP" PT_ROOT="$ROOT" PT_APPLY="$APPLY" PT_DOCS="$DO_DOCS" PT_OUT="$OUT" PT_ONLY="$ONLY" PT_WORK="$WORK" PT_AGG="$AGG"
export PT_3WAY="$THREEWAY" PT_TW_OUT="$TW_OUT" PT_TW_FILTER="$TW_FILTER"

python3 - <<'PY'
import os, subprocess, sys, difflib, hashlib, json, tempfile

OLD = os.environ["PT_OLD"]; NEW = os.environ["PT_NEW"]
AGG = os.environ.get("PT_AGG", "0") == "1"
ROOT = os.environ["PT_ROOT"]; APPLY = os.environ["PT_APPLY"] == "1"
DOCS = os.environ["PT_DOCS"] == "1"; OUT = os.environ["PT_OUT"]
ONLY = os.environ.get("PT_ONLY", ""); WORK = os.environ["PT_WORK"]
THREEWAY = os.environ.get("PT_3WAY", "0") == "1"
TW_OUT = os.environ.get("PT_TW_OUT", "") or os.path.join(ROOT, ".workbuddy/outputs/port-3way")
TW_FILTER = os.environ.get("PT_TW_FILTER", "")

# (上游目录, 企业目录, 类型, 是否需要后处理)
MAPPINGS = [
    ("internal",      "apps/app-core",      "go",  False),
    ("frontend/src",  "apps/frontend/src",  "fe",  False),
    ("website-docs",  "apps/docs",          "doc", True),   # 端口后需术语替换
]
SKIP_DIRS = {"node_modules", "dist", "cache", "out"}
BIN_EXT = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".lock")

def norm(b, kind):
    """Go 侧 import 路径归一化：上游 internal/ 在企业侧是 apps/app-core/"""
    if kind != "go":
        return b
    return (b.replace(b'"internal/', b'"apps/app-core/')
             .replace(b'"github.com/Tencent/WeKnora/internal',
                      b'"github.com/Tencent/WeKnora/apps/app-core'))

def read(path):
    try:
        with open(path, "rb") as fh:
            return fh.read()
    except Exception:
        return None

def walk(base):
    """返回 base 下所有文件的相对路径（企业侧从工作区读，故需排除构建产物）"""
    out = []
    for dp, dn, fn in os.walk(base):
        dn[:] = [d for d in dn if d not in SKIP_DIRS]
        for f in fn:
            out.append(os.path.relpath(os.path.join(dp, f), base))
    return out

def sha256(b):
    return hashlib.sha256(b or b"").hexdigest()


def merge3(ours_b, base_b, theirs_b, tag):
    """git merge-file 三向合并。返回 (rc, 合并后 bytes, 冲突块数)
    ours=企业当前  base=上游OLD(归一化)  theirs=上游NEW(归一化)
    rc=0 表示干净合并（无冲突标记）。"""
    with tempfile.TemporaryDirectory() as td:
        p = {k: os.path.join(td, k) for k in ("ours", "base", "theirs")}
        for k, b in (("ours", ours_b), ("base", base_b), ("theirs", theirs_b)):
            with open(p[k], "wb") as fh:
                fh.write(b)
        r = subprocess.run(
            ["git", "merge-file", "-p", "-L", "企业", "-L", "上游OLD", "-L", "上游NEW",
             p["ours"], p["base"], p["theirs"]],
            capture_output=True,
        )
    out = r.stdout
    # git merge-file 的冲突行数是退出码，但为稳妥直接用标记数统计
    conflicts = sum(1 for l in out.split(b"\n") if l.startswith(b"<<<<<<<"))
    return r.returncode, out, conflicts


report = []
tw_jobs = []             # 企业改造过、待三向合并的: (kind, ups, ent, rel)
total_port = total_manual = total_synced = total_missing = 0
ported = []

for ups, ent, kind, need_post in MAPPINGS:
    if ONLY and ONLY not in ups:
        continue
    if kind == "doc" and not DOCS:
        print(f"\n=== {ups} → {ent} ===")
        print("     已跳过（文档站端口后必须跑术语替换，需显式 --docs）")
        continue
    new_base = os.path.join(WORK, "new", ups)
    old_base = os.path.join(WORK, "old", ups)
    if not os.path.isdir(new_base):
        print(f"\n=== {ups} → {ent} ===\n     上游 {NEW} 无此目录，跳过")
        continue
    port, manual, synced, missing = [], [], 0, []
    for rel in walk(new_base):
        ent_path = os.path.join(ROOT, ent, rel)
        cur = read(ent_path)
        if cur is None:
            missing.append(rel)
            continue
        # 判据：企业内容是否为上游 NEW 的「子集」。
        #   minus = 上游 NEW 有、企业没有的行 → 企业缺上游内容 = 滞后
        #   plus  = 企业有、上游 NEW 没有的行 → 企业自造内容 = 改造
        # 曾试过「企业 == 上游 OLD」和「企业 == OLD..NEW 间某个历史版本」两种判据，
        # 实测全部漏判：企业 fork 常是「OLD + 部分中间改动」的混合，不等于任何单一上游版本。
        # 子集判据（plus≈0）是唯一能覆盖这种情况的，M1 手工端口的那批文件均符合。
        n_new = norm(read(os.path.join(new_base, rel)) or b"", kind)
        if n_new == cur:
            synced += 1
            continue
        if rel.lower().endswith(BIN_EXT):
            manual.append(rel)         # 二进制/资源不做行级判断
            continue
        try:
            la = n_new.decode("utf8", "replace").split("\n")
            lb = cur.decode("utf8", "replace").split("\n")
            d = [l for l in difflib.unified_diff(la, lb, lineterm="", n=0)
                 if l[:1] in ("+", "-") and not l.startswith(("+++", "---"))]
        except Exception:
            manual.append(rel)
            continue
        minus = sum(1 for l in d if l[0] == "-")
        plus = sum(1 for l in d if l[0] == "+")
        if minus == 0:
            manual.append(rel)         # 上游无新增，差异纯来自企业改造
            tw_jobs.append((kind, ups, ent, rel))
        elif plus == 0:
            port.append(rel)           # A 档：纯滞后，企业是上游的严格子集
        elif AGG and plus <= 3 and minus >= plus * 10:
            port.append(rel)           # B 档：企业内容极少，多为注释/位置差异
        else:
            manual.append(rel)         # C 档：企业有实质改造，需人工
            tw_jobs.append((kind, ups, ent, rel))
    print(f"\n=== {ups} → {ent} ===")
    print(f"     可整文件端口 {len(port)}    需人工(已改造) {len(manual)}    已同步 {synced}    企业缺失 {len(missing)}")
    if port:
        print("     待端口前 15 个：")
        for r in port[:15]:
            print(f"       - {r}")
        if len(port) > 15:
            print(f"       ... 另有 {len(port) - 15} 个")
    if APPLY and port:
        for rel in port:
            src = os.path.join(new_base, rel)
            dst = os.path.join(ROOT, ent, rel)
            b = read(src)
            if b is None:
                continue
            os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
            with open(dst, "wb") as fh:
                fh.write(norm(b, kind))
            ported.append(dst)
        print(f"     >> 已端口 {len(port)} 个文件")
    total_port += len(port); total_manual += len(manual)
    total_synced += synced; total_missing += len(missing)
    report.append((ups, ent, port, manual, missing))

print("\n=================== 汇总 ===================")
print(f"  可整文件端口 {total_port}    需人工(已改造) {total_manual}    已同步 {total_synced}    企业缺失 {total_missing}")

# ---- --3way：对企业改造过的文件做三向合并 ----
# 不预先物化任何补丁文件：base/theirs 都从 git 实时取，ours 就是工作区里的企业文件。
# 干净的合并 = 企业定制 + 上游 OLD→NEW 增量；冲突的留 <<<<<<< 标记写到 --out，人工解。
tw_conflicts = []
if THREEWAY:
    # i18n 语言包不走三向合并：它们有专门的叠加层流程（i18n.mjs），主文件必须与上游
    # AST 等价、企业内容只在 locales_kjsc/ 里。用 merge-file 处理会把上游译文和企业
    # 术语混进同一个文件，破坏该不变式（实测 zh-CN 会炸出 53 个冲突块）。
    TW_EXCLUDE = ("i18n/locales/", "i18n/locales_kjsc/", "i18n/locales_backend/")
    filtered = [j for j in sorted(set(tw_jobs)) if TW_FILTER in f"{j[2]}/{j[3]}"]
    jobs = [j for j in filtered if not any(x in j[3] for x in TW_EXCLUDE)]
    excluded = len(filtered) - len(jobs)
    print(f"\n===== 三向合并（{len(jobs)} 个企业改造文件）=====")
    print(f"  base=上游 {OLD[:10]}   theirs=上游 {NEW[:10]}   ours=企业当前")
    if excluded:
        print(f"  已排除 i18n 语言包 {excluded} 个（走 i18n.mjs 叠加层流程，不参与三向合并）")
    clean = nodiff = nofile = 0
    for kind, ups, ent, rel in jobs:
        ent_path = os.path.join(ROOT, ent, rel)
        ours_b = read(ent_path)
        base_src = os.path.join(WORK, "old", ups, rel)
        new_src = os.path.join(WORK, "new", ups, rel)
        base_b = norm(read(base_src) or b"", kind)
        theirs_b = norm(read(new_src) or b"", kind)
        if ours_b is None:
            nofile += 1
            continue
        if base_b == theirs_b:
            nodiff += 1            # 上游没动过这个文件，无需合并
            continue
        rc, merged, nconf = merge3(ours_b, base_b, theirs_b, rel)
        if nconf == 0:
            clean += 1
            if APPLY:
                with open(ent_path, "wb") as fh:
                    fh.write(merged)
        else:
            tw_conflicts.append((f"{ent}/{rel}", nconf))
            dst = os.path.join(TW_OUT, ent, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(dst, "wb") as fh:
                fh.write(merged)
    print(f"  自动合并干净 {clean}{'（已写回）' if APPLY else '（预演，未写盘）'}"
          f"    有冲突 {len(tw_conflicts)}    上游未改动 {nodiff}    文件缺失 {nofile}")
    if tw_conflicts:
        print(f"  冲突结果已写入 {TW_OUT}（带 <<<<<<< 标记，企业原文件未被改动）：")
        for p, n in sorted(tw_conflicts, key=lambda x: -x[1])[:15]:
            print(f"    - {p}  ({n} 个冲突块)")
        if len(tw_conflicts) > 15:
            print(f"    ... 另有 {len(tw_conflicts) - 15} 个")
        print("  提示：多数冲突只有 1-2 个块，人工解的成本远低于整文件重做。")
if need_post_hint := [u for u, e, p, m, _ in report if p and (u == "website-docs")]:
    print("  !! 文档站已端口，下一步必须跑术语替换（空间→租户 等），否则术语回退")
if OUT:
    with open(OUT, "w") as fh:
        fh.write("# L0 主干端口报告\n\n")
        fh.write(f"OLD(上次合并第二父)={OLD}  NEW(上游)={NEW}  APPLY={APPLY}\n\n")
        for ups, ent, port, manual, missing in report:
            fh.write(f"## {ups} → {ent}\n\n")
            fh.write(f"- 可整文件端口 {len(port)}\n- 需人工 {len(manual)}\n- 企业缺失 {len(missing)}\n\n")
            if port:
                fh.write("### 可端口清单\n\n")
                for r in port:
                    fh.write(f"- `{ent}/{r}`\n")
                fh.write("\n")
            if manual:
                fh.write("### 需人工清单（企业已改造，不可自动覆盖）\n\n")
                for r in manual[:200]:
                    fh.write(f"- `{ent}/{r}`\n")
                fh.write("\n")
    print(f"  报告已写入 {OUT}")

if total_port > 0 and not APPLY:
    print("\n预演模式：有可端口项但未写入。加 --apply 执行端口。")
    sys.exit(1)

if tw_conflicts:
    print(f"\n--3way 留下 {len(tw_conflicts)} 个冲突待人工解（企业原文件未被改动）。")
    sys.exit(3)

if APPLY and ported:
    print("\n!! 端口后必须跑构建验证，本脚本不保证编译通过。已知边界：")
    print("   企业若把上游单文件拆成多个文件（如 tenant.go → tenant_sandbox_config.go），")
    print("   端口主文件会导致类型重复声明。判据：上游无此拆分文件 → 按「上游不拆、企业不拆」删除。")
    print("   建议：go build ./apps/app-core/... ./cmd/app-core/... && (cd apps/frontend && npx vue-tsc --build --force)")
sys.exit(0)
PY

PT_EXIT=$?
exit $PT_EXIT
