#!/usr/bin/env bash
# internal ↔ apps/app-core 漂移检测（KJSC 企业侧维护工具）
#
# 背景：apps/app-core 是 internal/ 的整目录 fork，两侧靠人工同步。
# 本脚本把「人工比对」变成机械检查，分三层：
#   1) 文件级清单：上游新增未端口的文件（Only in internal）、企业独有文件、分叉文件计数
#   2) 注册点断言（CI 硬门槛，失败退出码 1）：
#      a. 网络搜索 provider：container.go 里 registry.Register("name", ...) 的字符串键集合
#      b. 容器接线 import：internal 引用而 app-core 缺失的包（会漏掉 gitlab/ima/exa 这类「文件在、注册缺」）
#   3) --deep：对分叉文件做 import 路径归一化比对，区分「仅 import 路径差异」与「实质差异」
#
# 用法（脚本住在技能目录里，作用于「目标仓库」）：
#   cd <weknora仓库> && <skill>/scripts/drift_report.sh              # 汇总 + 注册点断言
#   ... --deep                                                       # 额外做归一化内容比对（较慢，1-2 分钟）
#   ... -o report.md                                                 # 同时写 markdown 报告
#   ... --repo /path/to/weknora                                      # 指定仓库
#   WEKNORA_REPO=/path/to/weknora <skill>/scripts/drift_report.sh ...
#
# 退出码：0 = 注册点一致（文件分叉仅记录不拦截）；1 = 注册点漂移，需要人工端口；2 = 参数/环境错误。
set -uo pipefail

# 目标仓库：--repo > 环境变量 WEKNORA_REPO > 当前目录所在 git 仓库顶层。
# 脚本住在技能目录（不在仓库内），所以不能再靠 ../../ 推导，必须与同目录其它脚本口径一致。

UP="internal"
ENT="apps/app-core"
UP_CONTAINER="$UP/container/container.go"
ENT_CONTAINER="$ENT/container/container.go"

# 白名单：internal 有、app-core 刻意不接线的 import 路径（归一化到 apps/app-core 前缀后）。
# 新增条目必须写明原因，否则视为漂移。
WIRING_WHITELIST=(
  # 示例（未启用）："github.com/Tencent/WeKnora/apps/app-core/sandbox/_legacy"  # 企业已禁用 Local 沙箱
)

DEEP=0
OUT=""
ROOT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --deep) DEEP=1 ;;
    --repo) ROOT="${2:-}"; shift ;;
    -o|--output) OUT="${2:-}"; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "未知参数: $1（-h 看用法）" >&2; exit 2 ;;
  esac
  shift
done

if [[ -z "$ROOT" ]]; then ROOT="${WEKNORA_REPO:-}"; fi
if [[ -z "$ROOT" ]]; then ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"; fi
if [[ -z "$ROOT" || ! -d "$ROOT" ]]; then
  echo "错误：无法确定 WeKnora 仓库路径。请 cd 到仓库内运行，或用 --repo <路径> / WEKNORA_REPO=<路径>" >&2
  exit 2
fi
ROOT="$(cd "$ROOT" && pwd)"
cd "$ROOT"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

RED=''; GRN=''; YLW=''; NC=''
if [[ -t 1 ]]; then RED=$'\033[31m'; GRN=$'\033[32m'; YLW=$'\033[33m'; NC=$'\033[0m'; fi

FAIL=0
{
# ============================================================
echo "# internal ↔ apps/app-core 漂移报告"
echo
echo "- 生成时间：$(date '+%Y-%m-%d %H:%M:%S')"
echo "- 对照：\`internal/\`（上游）↔ \`apps/app-core/\`（企业 fork）"
echo
} > "$TMP/header.md"

# ------------------------------------------------------------
# 1. 文件级清单
# ------------------------------------------------------------
only_up_list="$TMP/only_up.txt"
only_ent_list="$TMP/only_ent.txt"
differ_list="$TMP/differ.txt"
: > "$only_up_list"; : > "$only_ent_list"; : > "$differ_list"

# 用 find + comm 做文件清单（比 diff -rq 快一个量级，7 万文件也能秒级完成）
# 输出为「相对目录的前缀」+「相对路径」，便于两侧对齐。
find "$UP"    -type f ! -name '.DS_Store' | sed "s|^$UP/||" | sort > "$TMP/files_up.txt"
find "$ENT"   -type f ! -name '.DS_Store' | sed "s|^$ENT/||" | sort > "$TMP/files_ent.txt"

comm -23 "$TMP/files_up.txt"  "$TMP/files_ent.txt" > "$TMP/only_up.txt"
comm -13 "$TMP/files_up.txt"  "$TMP/files_ent.txt" > "$TMP/only_ent.txt"
# 同名文件集合：内容是否分叉需逐个 cmp（仅对两侧都存在的文件，数量远小于全量）
comm -12 "$TMP/files_up.txt"  "$TMP/files_ent.txt" > "$TMP/common_files.txt"
: > "$differ_list"
while IFS= read -r rel; do
  cmp -s "$UP/$rel" "$ENT/$rel" || printf '%s\n' "$rel" >> "$differ_list"
done < "$TMP/common_files.txt"

n_only_up=$(wc -l < "$only_up_list" | tr -d ' ')
n_only_ent=$(wc -l < "$only_ent_list" | tr -d ' ')
n_differ=$(wc -l < "$differ_list" | tr -d ' ')

{
echo "## 1. 文件级清单"
echo
echo "| 类别 | 数量 | 含义 |"
echo "|---|---:|---|"
echo "| 上游新增未端口（Only in internal） | $n_only_up | 上游新文件，需要端口到 app-core |"
echo "| 企业独有（Only in app-core） | $n_only_ent | 预期内，企业定制 |"
echo "| 同名文件内容分叉 | $n_differ | 仅记录，不拦截 |"
echo
} > "$TMP/section1.md"

if [[ "$n_only_up" -gt 0 ]]; then
  {
  echo "**上游新增未端口的文件（需人工评估）：**"
  echo
  echo '```'
  cat "$only_up_list"
  echo '```'
  echo
  } >> "$TMP/section1.md"
fi

# ------------------------------------------------------------
# 2a. 网络搜索 provider 注册断言
# ------------------------------------------------------------
extract_search_keys() {
  grep -oE 'registry\.Register\("[a-z0-9_-]+"' "$1" | cut -d'"' -f2 | sort -u
}
extract_search_keys "$UP_CONTAINER" > "$TMP/keys_up.txt"
extract_search_keys "$ENT_CONTAINER" > "$TMP/keys_ent.txt"
comm -23 "$TMP/keys_up.txt" "$TMP/keys_ent.txt" > "$TMP/keys_missing.txt"
comm -13 "$TMP/keys_up.txt" "$TMP/keys_ent.txt" > "$TMP/keys_extra.txt"

{
echo "## 2. 注册点断言（CI 硬门槛）"
echo
echo "### 2a. 网络搜索 provider（container.go registry.Register 字符串键）"
echo
echo "- internal 注册：$(wc -l < "$TMP/keys_up.txt" | tr -d ' ') 个"
echo "- app-core 注册：$(wc -l < "$TMP/keys_ent.txt" | tr -d ' ') 个"
echo
} > "$TMP/section2.md"

if [[ -s "$TMP/keys_missing.txt" ]]; then
  FAIL=1
  {
  echo "**${RED}缺失的 provider（internal 有、app-core 没有）：${NC}**"
  echo
  echo '```'
  cat "$TMP/keys_missing.txt"
  echo '```'
  echo
  } >> "$TMP/section2.md"
else
  echo "- ${GRN}✓ provider 集合一致${NC}" >> "$TMP/section2.md"
fi
if [[ -s "$TMP/keys_extra.txt" ]]; then
  {
  echo "- 企业侧额外 provider（预期内）：$(paste -sd, "$TMP/keys_extra.txt" -)"
  echo
  } >> "$TMP/section2.md"
fi

# ------------------------------------------------------------
# 2b. 容器接线 import 断言（会抓「文件在、注册缺」的连接器/引擎）
# ------------------------------------------------------------
norm_import() {
  # 提取本模块 import，并把 internal 前缀归一化到 apps/app-core，便于两侧集合比较
  grep -oE '"github\.com/Tencent/WeKnora/[a-zA-Z0-9_./-]+"' "$1" \
    | tr -d '"' \
    | sed 's|^github.com/Tencent/WeKnora/internal/|github.com/Tencent/WeKnora/apps/app-core/|' \
    | sort -u
}
norm_import "$UP_CONTAINER" > "$TMP/imp_up.txt"
norm_import "$ENT_CONTAINER" > "$TMP/imp_ent.txt"
comm -23 "$TMP/imp_up.txt" "$TMP/imp_ent.txt" > "$TMP/imp_missing_raw.txt"
comm -13 "$TMP/imp_up.txt" "$TMP/imp_ent.txt" > "$TMP/imp_extra.txt"

# 应用白名单
: > "$TMP/imp_missing.txt"
while IFS= read -r imp; do
  skip=0
  for w in "${WIRING_WHITELIST[@]:-}"; do
    [[ -n "$w" && "$imp" == "$w"* ]] && { skip=1; break; }
  done
  [[ $skip -eq 0 ]] && printf '%s\n' "$imp" >> "$TMP/imp_missing.txt"
done < "$TMP/imp_missing_raw.txt"

{
echo "### 2b. 容器接线 import（internal 引用而 app-core 缺失 = 能力漏端口）"
echo
} >> "$TMP/section2.md"

if [[ -s "$TMP/imp_missing.txt" ]]; then
  FAIL=1
  {
  echo "**${RED}app-core 缺失的接线（文件可能已复制但未注册）：${NC}**"
  echo
  echo '```'
  cat "$TMP/imp_missing.txt"
  echo '```'
  echo
  } >> "$TMP/section2.md"
else
  echo "- ${GRN}✓ 容器接线集合一致${NC}（企业侧额外 $(wc -l < "$TMP/imp_extra.txt" | tr -d ' ') 个属预期定制）" >> "$TMP/section2.md"
fi
echo >> "$TMP/section2.md"

# ------------------------------------------------------------
# 3. --deep：归一化内容比对
# ------------------------------------------------------------
if [[ "$DEEP" -eq 1 ]]; then
  import_only=0; real_drift=0
  : > "$TMP/real_drift_files.txt"
  while IFS= read -r rel; do
    up_file="$UP/$rel"; ent_file="$ENT/$rel"
    sed 's|github.com/Tencent/WeKnora/apps/app-core/|github.com/Tencent/WeKnora/internal/|g' "$ent_file" > "$TMP/norm_b"
    if cmp -s "$up_file" "$TMP/norm_b"; then
      import_only=$((import_only+1))
    else
      real_drift=$((real_drift+1))
      printf '%s\n' "$up_file" >> "$TMP/real_drift_files.txt"
    fi
  done < "$differ_list"
  {
  echo "## 3. 归一化内容比对（--deep）"
  echo
  echo "| 类别 | 数量 | 含义 |"
  echo "|---|---:|---|"
  echo "| 仅 import 路径差异 | $import_only | 与上游语义一致，无需处理 |"
  echo "| 实质差异 | $real_drift | 企业定制或未回灌的上游改动 |"
  echo
  if [[ -s "$TMP/real_drift_files.txt" ]]; then
    echo "**实质差异文件清单（同步上游时的人工比对范围）：**"
    echo
    echo '```'
    cat "$TMP/real_drift_files.txt"
    echo '```'
    echo
  fi
  } > "$TMP/section3.md"
else
  {
  echo "## 3. 归一化内容比对"
  echo
  echo "（未启用。加 \`--deep\` 区分「仅 import 路径差异」与「实质差异」。）"
  echo
  } > "$TMP/section3.md"
fi

# ------------------------------------------------------------
# 汇总输出
# ------------------------------------------------------------
{
echo "## 结论"
echo
if [[ $FAIL -eq 0 ]]; then
  echo "- ${GRN}注册点一致，无需端口动作。${NC}同名文件分叉 $n_differ 个属常态，仅记录。"
else
  echo "- ${RED}检测到注册点漂移：见第 2 节缺失清单，需按 docs/plan/20260930-upstream-sync.md 端口。${NC}"
fi
} > "$TMP/section4.md"

cat "$TMP/header.md" "$TMP/section1.md" "$TMP/section2.md" "$TMP/section3.md" "$TMP/section4.md" > "$TMP/report.md"
cat "$TMP/report.md"

if [[ -n "$OUT" ]]; then
  mkdir -p "$(dirname "$OUT")"
  cp "$TMP/report.md" "$OUT"
  echo "" >&2
  echo "报告已写入: $OUT" >&2
fi

exit $FAIL
