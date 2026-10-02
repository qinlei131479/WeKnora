#!/usr/bin/env bash
# 上游同步验收（WeKnora 企业侧，技能 weknora-upstream-sync 的一部分）
#
# 背景：企业活代码在 apps/（apps/app-core ← internal，apps/frontend ← frontend），
# 上游原路径 internal/、frontend/ 只是「被动接收合并」的影子目录。因此
# git merge 成功 ≠ 内容已同步：影子目录会自动跟上，apps/ 下的 fork 不会。
# 本脚本把「同步后的人工复查」变成机械检查，覆盖 AGENTS.md 三步校验之外的缺口。
#
# 检查项：
#   C1 映射时效性（硬门槛）上游改过、但企业 fork 仍等于旧上游的文件 —— 静默回退
#   C2 映射缺失（仅报告）  上游有、企业 fork 无对应文件
#   C3 冲突标记（硬门槛）  apps/ 下的 <<<<<<< / >>>>>>> 残留
#   C4 env 全集差集（硬门槛）官方 .env.example 有而 .env.kjsc.example 没有的变量
#   C5 配置变体对齐（硬门槛）prompt_templates 文件集、config.yaml↔_kjsc 键路径
#   C6 i18n 四方比对（硬门槛）缺键 + 值级回退，脚本 i18n_quad_check.mjs
#   C7 docs 侧（仅报告）    根 docs/ 混入企业文件、上游 docs 改动提示
#   C8 migrations（仅报告） 上游新增迁移，提示企业 version_kjsc 是否需跟进
#
# 用法（脚本住在技能目录里，作用于「目标仓库」）：
#   cd <weknora仓库> && <skill>/scripts/upstream_sync_check.sh            # 自动推导基准
#   <skill>/scripts/upstream_sync_check.sh --repo /path/to/weknora
#   WEKNORA_REPO=/path/to/weknora <skill>/scripts/upstream_sync_check.sh
#   ... --old d823ef61a --new bccb4b151        # 显式指定基准（全量体检）
#   ... --skip i18n,config                     # 跳过指定检查
#
# 退出码：0 = 全部硬门槛通过；1 = 有硬门槛未通过；2 = 参数/环境错误。
set -uo pipefail

# 本脚本在技能目录里，不能用自身路径反推仓库，只能靠显式指定或当前目录推导
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

OLD_UP=""
NEW_UP=""
BASE_ENT=""
OUT=""
SKIP=""
ROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)     ROOT="${2:-}"; shift ;;
    --old)      OLD_UP="${2:-}"; shift ;;
    --new)      NEW_UP="${2:-}"; shift ;;
    --base)     BASE_ENT="${2:-}"; shift ;;
    -o|--output) OUT="${2:-}"; shift ;;
    --skip)     SKIP="${2:-}"; shift ;;
    -h|--help)  sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "未知参数: $1（-h 看用法）" >&2; exit 2 ;;
  esac
  shift
done

# 目标仓库：--repo > 环境变量 WEKNORA_REPO > 当前目录所在 git 仓库顶层
if [[ -z "$ROOT" ]]; then
  ROOT="${WEKNORA_REPO:-}"
fi
if [[ -z "$ROOT" ]]; then
  ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
fi
if [[ -z "$ROOT" || ! -d "$ROOT" ]]; then
  echo "错误：无法确定 WeKnora 仓库路径。请 cd 到仓库内运行，或用 --repo <路径> / WEKNORA_REPO=<路径>" >&2
  exit 2
fi
cd "$ROOT"

skip_of() {
  case ",${SKIP}," in
    *",$1,"*) return 0 ;;
    *) return 1 ;;
  esac
}

# ---------- 基准推导 ----------
# 新上游：优先 upstream/master，其次 upstream/main
if [[ -z "$NEW_UP" ]]; then
  for b in upstream/master upstream/main; do
    if git rev-parse --verify -q "$b" >/dev/null; then NEW_UP="$b"; break; fi
  done
fi
if [[ -z "$NEW_UP" ]]; then
  echo "错误：找不到 upstream/master 或 upstream/main，请先 git fetch upstream" >&2
  exit 2
fi

# 旧上游 + 企业基线：找最近一个「第二父属于上游」的合并提交
if [[ -z "$OLD_UP" || -z "$BASE_ENT" ]]; then
  while read -r hash p1 p2; do
    [[ -z "${p2:-}" ]] && continue
    if git merge-base --is-ancestor "$p2" "$NEW_UP" 2>/dev/null; then
      [[ -z "$OLD_UP" ]]   && OLD_UP="$p2"
      [[ -z "$BASE_ENT" ]] && BASE_ENT="$p1"
      break
    fi
  done < <(git log --merges -n 200 --format='%H %P')
fi
if [[ -z "$OLD_UP" ]]; then
  echo "错误：历史里找不到第二父为上游提交的合并提交，请用 --old 显式指定（同步必须是真合并）" >&2
  exit 2
fi

OLD_UP="$(git rev-parse "$OLD_UP")"
NEW_UP="$(git rev-parse "$NEW_UP")"
BASE_ENT="${BASE_ENT:-$OLD_UP}"

echo "=================== 上游同步验收 ==================="
echo "旧上游 OLD_UP  = ${OLD_UP:0:9}"
echo "新上游 NEW_UP  = ${NEW_UP:0:9}"
echo "企业基线 BASE  = ${BASE_ENT:0:9}"
echo

if ! command -v python3 >/dev/null; then
  echo "错误：需要 python3" >&2
  exit 2
fi

# ---------- C1 ~ C5、C7、C8 ----------
python3 - "$OLD_UP" "$NEW_UP" "$SKIP" <<'PY'
import subprocess, os, re, sys

OLD, NEW, SKIP = sys.argv[1], sys.argv[2], sys.argv[3]
SKIPPED = {s.strip() for s in SKIP.split(',') if s.strip()}

def git_text(*a):
    # -c core.quotePath=false：避免中文文件名被转义成八进制
    return subprocess.run(['git', '-c', 'core.quotePath=false'] + list(a),
                          capture_output=True).stdout.decode('utf-8', 'replace')

def show(rev, path):
    r = subprocess.run(['git', '-c', 'core.quotePath=false', 'show', f'{rev}:{path}'],
                       capture_output=True)
    return r.stdout if r.returncode == 0 else None

fail = 0

def head(title, key, hard):
    tag = '硬门槛' if hard else '仅报告'
    if key in SKIPPED:
        print(f'{title}（{tag}）—— 已用 --skip 跳过')
        print()
        return False
    print(f'{title}（{tag}）')
    return True

# 上游路径 -> 企业 fork 路径 -> 归一化方式（消掉 import 路径 / 目录前缀差异）
# 注意：website-docs -> apps/docs 也是一条 fork 映射（企业文档站是上游 website-docs
# 的深度定制 fork，93/97 文件被企业改写过），上游影子目录 website-docs/ 随 merge 自动跟上，
# apps/docs 不会 —— 与 internal/frontend 同理。C1 对它只管得住「从未定制」的文件
# （如 scripts/check-links.mjs），深度定制文件靠 C7 的缺口/改动报告提示语义跟进。
MAPS = [
    ('internal',       'apps/app-core',       'go'),
    ('frontend/src',   'apps/frontend/src',   'fe'),
    ('frontend/tests', 'apps/frontend/tests', 'fe'),
    ('website-docs',   'apps/docs',           'plain'),
]
MAP_PREFIXES = [m[0] for m in MAPS]

def norm(b, kind):
    s = b.decode('utf-8', 'replace')
    if kind == 'go':
        s = s.replace('github.com/Tencent/WeKnora/apps/app-core', 'MOD')
        s = s.replace('github.com/Tencent/WeKnora/internal', 'MOD')
    elif kind == 'fe':
        s = s.replace('apps/frontend/', 'FE/').replace('"frontend/', '"FE/')
    # kind == 'plain'：markdown / 文档站脚本，无 import 路径需要归一化
    return s

# ---- C1 映射时效性 ----
if head('[C1] 映射时效性', 'map', True):
    changed = git_text('diff', '--name-only', OLD, NEW, '--', *MAP_PREFIXES).split()
    stale, added_no_ent, ported, unmapped = [], [], 0, 0
    for f in changed:
        hit = None
        for up, ent, kind in MAPS:
            if f.startswith(up + '/'):
                hit = (up, ent, kind)
                break
        if not hit:
            unmapped += 1
            continue
        up, ent, kind = hit
        p = ent + '/' + f[len(up) + 1:]
        if not os.path.exists(p):
            added_no_ent.append((f, p))
            continue
        o, n = show(OLD, f), show(NEW, f)
        if n is None:            # 上游本次删除
            continue
        if o is None:            # 上游本次新增，企业已有同名文件
            continue
        cur = norm(open(p, 'rb').read(), kind)
        o, n = norm(o, kind), norm(n, kind)
        if n == o:
            continue
        if cur == o:
            stale.append(p)
        else:
            ported += 1
    print(f'     上游改动文件 {len(changed)}：已跟上 {ported}，无对应 {len(added_no_ent)}，'
          f'上游新增/删除或无法比对 {len(changed) - ported - len(added_no_ent) - len(stale)}')
    if stale:
        print(f'     !! 仍等于旧上游（静默回退）{len(stale)} 个：')
        for s in stale:
            print(f'        - {s}')
        fail = 1
    else:
        print('     OK 无滞后')
print()

# ---- C2 映射缺失 ----
if head('[C2] 映射缺失', 'missing', False):
    upstream_all = git_text('ls-tree', '-r', '--name-only', NEW).split()
    for up, ent, kind in MAPS:
        files = [f for f in upstream_all if f.startswith(up + '/')]
        miss = [f[len(up) + 1:] for f in files
                if not os.path.exists(ent + '/' + f[len(up) + 1:])]
        tests = [m for m in miss if re.search(r'\.(test|spec)\.(ts|mjs|js|go)$', m)]
        other = [m for m in miss if m not in tests]
        print(f'     {up + "/":<16} 上游 {len(files)} 个，企业缺 {len(miss)} 个'
              f'（测试 {len(tests)} / 非测试 {len(other)}）')
        for m in other[:15]:
            print(f'        非测试缺失: {m}')
        if len(other) > 15:
            print(f'        ... 另有 {len(other) - 15} 个非测试缺失')
print()

# ---- C3 冲突标记 ----
if head('[C3] 冲突标记残留', 'conflict', True):
    r = subprocess.run(['git', 'grep', '-nE', r'^(<<<<<<<|>>>>>>>)', '--', 'apps/'],
                       capture_output=True, text=True)
    hits = [l for l in (r.stdout or '').splitlines() if l.strip()]
    if hits:
        print(f'     !! {len(hits)} 处：')
        for l in hits[:20]:
            print('        ' + l)
        fail = 1
    else:
        print('     OK 无残留')
print()

# ---- C4 env 全集差集 ----
if head('[C4] env 全集差集', 'env', True):
    def env_keys(p):
        out = {}
        if not os.path.exists(p):
            return out
        for line in open(p, encoding='utf-8', errors='replace'):
            m = re.match(r'^(#\s*)?([A-Z][A-Z0-9_]*)\s*=', line)
            if m:
                out[m.group(2)] = (m.group(1) is not None)
        return out
    off, kj = env_keys('.env.example'), env_keys('.env.kjsc.example')
    miss = [k for k in off if k not in kj]
    commented = [k for k, v in off.items() if not v and kj.get(k)]
    if miss:
        print(f'     !! 官方有、企业完全没有 {len(miss)} 个：')
        for k in miss:
            print(f'        - {k}')
        fail = 1
    else:
        print('     OK 无完全缺失变量')
    if commented:
        print(f'     !  官方启用但企业被注释 {len(commented)} 个（确认是否有意保持关闭）：')
        for k in commented:
            print(f'        - {k}')
    print(f'     官方变量 {len(off)} 个，企业变量 {len(kj)} 个')
print()

# ---- C5 配置变体对齐 ----
if head('[C5] 配置变体对齐', 'config', True):
    def yaml_keypaths(p):
        """缩进栈提取键路径，不依赖 pyyaml（CI 环境常没有）。"""
        keys, stack = set(), []
        if not os.path.exists(p):
            return keys
        for line in open(p, encoding='utf-8', errors='replace'):
            if not line.strip() or line.lstrip().startswith('#'):
                continue
            s = line.strip()
            if s.startswith('- ') or s == '-':
                continue
            indent = len(line) - len(line.lstrip())
            m = re.match(r'^([A-Za-z_][A-Za-z0-9_\-]*)\s*:', s)
            if not m:
                continue
            while stack and stack[-1][0] >= indent:
                stack.pop()
            stack.append((indent, m.group(1)))
            keys.add('.'.join(k for _, k in stack))
        return keys
    cfg_changed = [f for f in git_text('diff', '--name-only', OLD, NEW, '--', 'config/').split()
                   if not f.endswith('_kjsc.yaml') and '_kjsc' not in f]
    if cfg_changed:
        print(f'     上游本次改动 config/ 下 {len(cfg_changed)} 个文件，需人工确认 KJSC 变体是否跟进：')
        for f in cfg_changed[:20]:
            print(f'        - {f}')
    a, b = yaml_keypaths('config/config.yaml'), yaml_keypaths('config/config_kjsc.yaml')
    if a and b:
        gap = sorted(a - b)
        if gap:
            print(f'     !! config_kjsc.yaml 缺 {len(gap)} 个键路径（若属企业有意裁剪请 --skip config）：')
            for k in gap[:20]:
                print(f'        - {k}')
            if len(gap) > 20:
                print(f'        ... 另有 {len(gap) - 20} 个')
            fail = 1
        else:
            print(f'     OK config_kjsc.yaml 键路径无缺失（{len(b)} 个）')
    up_tpl, kj_tpl = 'config/prompt_templates', 'config/prompt_templates_kjsc'
    if os.path.isdir(up_tpl) and os.path.isdir(kj_tpl):
        a = {f for f in os.listdir(up_tpl) if f.endswith(('.yaml', '.yml'))}
        b = {f for f in os.listdir(kj_tpl) if f.endswith(('.yaml', '.yml'))}
        gap = sorted(a - b)
        if gap:
            print(f'     !! {kj_tpl} 缺 {len(gap)} 个模板（变体是整目录回退，缺模板即静默失效）：')
            for k in gap:
                print(f'        - {k}')
            fail = 1
        else:
            print(f'     OK {kj_tpl} 模板文件无缺失（{len(b)} 个）')
print()

# ---- C7 docs 侧 ----
if head('[C7] docs 侧', 'docs', False):
    # (a) 根 docs/ 混入企业文件检查（根 docs/ 属上游领地，docs/plan/ 例外）
    up_docs = {f[len('docs/'):] for f in git_text('ls-tree', '-r', '--name-only', NEW).split()
               if f.startswith('docs/')}
    ent_docs = [f[len('docs/'):] for f in git_text('ls-files', 'docs').split()]
    extra = [f for f in ent_docs if f not in up_docs and not f.startswith('plan/')]
    if extra:
        print(f'     !! 根 docs/ 下有 {len(extra)} 个非 plan/ 的企业独有文件'
              f'（AGENTS.md：根 docs/ 属上游领地）：')
        for f in extra[:20]:
            print(f'        - docs/{f}')
    else:
        print('     OK 根 docs/ 未混入企业文件（docs/plan/ 除外）')

    # (b) 影子目录 website-docs/ 应与上游逐字节一致（轨道 A，merge 自动跟上）
    up_wd = {f[len('website-docs/'):] for f in git_text('ls-tree', '-r', '--name-only', NEW).split()
             if f.startswith('website-docs/')}
    wd_diff = []
    for f in sorted(up_wd):
        a = show(NEW, 'website-docs/' + f)
        cur = show('HEAD', 'website-docs/' + f)
        if cur is None or (a is not None and a != cur):
            wd_diff.append(f)
    if wd_diff:
        print(f'     ?  影子目录 website-docs/ 与上游 {NEW[:12]} 有 {len(wd_diff)} 个文件不同'
              f'（merge 完成后应为 0；若尚未 merge 属正常）')
    else:
        print(f'     OK 影子目录 website-docs/ 与上游 {NEW[:12]} 逐字节一致（轨道 A 正常）')

    # (c) website-docs -> apps/docs 的文件缺口报告（企业 fork 缺失的上游文件）
    # 读工作区实目录而非 HEAD：同步过程中新搬入的文件尚未提交，若按 HEAD 统计会
    # 把刚补齐的文件误报成缺口（踩过一次：搬入 77 个文件后 C7 仍报 107 缺口）。
    # 只排 node_modules 与构建产物，.vitepress/ 是源码目录必须计入。
    SKIP_DIRS = {'node_modules', 'dist', 'cache', 'out', '.vitepress-dist'}
    ent_ad = set()
    for dirpath, dirnames, filenames in os.walk('apps/docs'):
        dirnames[:] = [d for d in dirnames
                        if d not in SKIP_DIRS and not d.endswith('.vitepress-dist')]
        for fn in filenames:
            if fn == '.DS_Store' or fn.endswith('.log'):
                continue
            ent_ad.add(os.path.relpath(os.path.join(dirpath, fn), 'apps/docs'))
    missing_wd = sorted(up_wd - ent_ad)
    extra_ad = sorted(ent_ad - up_wd)
    from collections import Counter
    if missing_wd:
        grp = Counter(f.split('/')[0] for f in missing_wd)
        print(f'     !! 上游 website-docs 有而 apps/docs 没有 {len(missing_wd)} 个文件'
              f'（按顶层: {dict(grp.most_common(8))}）—— 逐个判断是否需要语义移植')
        for f in missing_wd[:15]:
            print(f'        - website-docs/{f}')
        if len(missing_wd) > 15:
            print(f'        ... 另有 {len(missing_wd) - 15} 个')
    else:
        print('     OK apps/docs 文件清单与上游 website-docs 无缺口')
    if extra_ad:
        grp = Counter(f.split('/')[0] for f in extra_ad)
        print(f'     -  apps/docs 企业独有 {len(extra_ad)} 个（{dict(grp.most_common(5))}）')

    # (d) 上游 website-docs 本次改动量 → 语义跟进提示
    changed_wd = git_text('diff', '--name-only', OLD, NEW, '--', 'website-docs/').split()
    if changed_wd:
        print(f'     上游本次改动 website-docs {len(changed_wd)} 个文件'
              f'（apps/docs 深度定制，需人工判断语义跟进；上游不拆的文件企业绝不拆）：')
        for f in changed_wd[:10]:
            print(f'        - {f}')
        if len(changed_wd) > 10:
            print(f'        ... 另有 {len(changed_wd) - 10} 个')
    else:
        print('     上游本次未改动 website-docs')
print()

# ---- C8 migrations ----
if head('[C8] migrations', 'migrate', False):
    added = [f for f in git_text('diff', '--name-only', '--diff-filter=A', OLD, NEW,
                                 '--', 'migrations/').split()]
    print(f'     上游本次新增迁移 {len(added)} 个')
    for f in added[:10]:
        print(f'        - {f}')
    if added:
        print('     企业迁移在 migrations/version_kjsc，确认是否需要对应变更')

sys.exit(1 if fail else 0)
PY
C_PY=$?

# ---------- C6：i18n 四方比对 ----------
C6=0
if ! skip_of i18n; then
  echo "[C6] i18n 四方比对（硬门槛）"
  if command -v node >/dev/null && [[ -f "$SKILL_DIR/scripts/i18n.mjs" ]]; then
    node "$SKILL_DIR/scripts/i18n.mjs" check --repo "$ROOT" \
      --old "$OLD_UP" --new "$NEW_UP" --base "$BASE_ENT"
    C6=$?
  else
    echo "     ?  node 不可用或脚本缺失，跳过"
  fi
  echo
fi

# ---------- C9：影子目录污染（硬门槛，同步前也可单独跑） ----------
# 影子目录 internal/ frontend/ website-docs/ 由 git merge 自动跟上，企业构建不引用。
# 一旦有人在里面就地改代码，下次同步必被上游覆盖（白干），还会制造大量冲突。
# 本次 0.8.2 同步的 648 处冲突里 549 处（85%）就是这么来的。
# 硬性要求：HEAD 的影子目录必须与上游 NEW_UP 逐字节一致。
C9=0
if ! skip_of shadow; then
  echo "[C9] 影子目录污染（硬门槛）"
  # macOS 自带 bash 3.2 没有 mapfile / readarray，这里用 while read 保证兼容
  for d in internal frontend website-docs; do
    dirty_n=$(git diff --name-only "$NEW_UP" HEAD -- "$d/" | wc -l | tr -d ' ')
    dirty_n=${dirty_n:-0}
    if [[ "$dirty_n" -gt 0 ]]; then
      C9=1
      echo "     !! 影子目录 $d/ 被就地改动 $dirty_n 个文件（下次同步必被覆盖 + 制造冲突）"
      git diff --name-only "$NEW_UP" HEAD -- "$d/" | head -10 | while IFS= read -r f; do
        echo "        - $f"
      done
      if [[ "$dirty_n" -gt 10 ]]; then
        echo "        ... 另有 $(( dirty_n - 10 )) 个"
      fi
      echo "     修复：git checkout $NEW_UP -- $d"
    fi
  done
  if [[ $C9 -eq 0 ]]; then
    echo "     OK internal/ frontend/ website-docs/ 与上游 $NEW_UP 逐字节一致"
  fi
  echo
fi

EXIT=0
[[ $C_PY -ne 0 ]] && EXIT=1
[[ $C6 -ne 0 ]] && EXIT=1
[[ $C9 -ne 0 ]] && EXIT=1

echo "=================== 结论 ==================="
if [[ $EXIT -eq 0 ]]; then
  echo "全部硬门槛通过。仍建议跑一次构建："
  echo "  go build ./apps/app-core/... && (cd apps/frontend && npx vue-tsc --build --force)"
else
  echo "有硬门槛未通过，见上方 !! 条目。"
fi
exit $EXIT
