#!/usr/bin/env node
// i18n 工具集（WeKnora 企业侧，技能 weknora-upstream-sync 的一部分）
//
// 四个子命令，共享同一套 locale 解析/序列化/树操作：
//   format   统一三个 locale 目录的结构与键顺序，使五语言文件逐行一致
//   overlay  生成企业叠加层 locales_kjsc/（主 locales/ = 上游原文，叠加层 = 企业定制）
//   align    补齐叠加层的键集缺口（企业术语只在部分语言生效时）
//   check    C6 四方比对（由 upstream_sync_check.sh 调用），叠加层模式下做三项检查
//
// 不变式（改动本文件前必读，详见 references/sync-playbook.md）：
//   1. 主 locales/*.ts     == 上游（AST 等价，允许键顺序/注释不同）
//   2. 企业内容只在 locales_kjsc/*.ts，运行时 index.ts 做 deepMerge(trunk, overlay, backend)
//   3. 三个 locale 目录 × 五语言的**行数必须完全一致**——行数不齐会掩盖真正的语义缺陷
//
// 用法（脚本住在技能目录里，作用于「目标仓库」）：
//   node <skill>/scripts/i18n.mjs format [--apply] [--dirs locales,locales_kjsc,...] [--order zh-CN]
//   node <skill>/scripts/i18n.mjs overlay [--apply] [--port-trunk] [--verify --ent-rev <rev>]
//   node <skill>/scripts/i18n.mjs align  [--apply] [--fill-equal | --prune-equal] [--todo-out <csv>]
//   node <skill>/scripts/i18n.mjs check  --old <rev> --new <rev> [--base <rev>] [--allow-reg <key>]
//   node <skill>/scripts/i18n.mjs check --self-test          # 反向验证：pathConflicts 真能报错
//   ... --repo <路径> / WEKNORA_REPO=<路径>
//
// 退出码：0 = 成功；1 = 校验失败/未对齐/有缺键回退；2 = 参数/环境错误。
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------- 公共：CLI 与仓库定位
const argv = process.argv.slice(2)
const argOf = (n) => {
  const i = argv.indexOf(n)
  return i >= 0 ? argv[i + 1] : undefined
}
const has = (f) => argv.includes(f)
const COMMANDS = ['format', 'overlay', 'align', 'check']
const CMD = COMMANDS.find((c) => argv[0] === c)
if (!CMD) {
  console.error(`错误：第一个参数必须是子命令之一 ${COMMANDS.join(' / ')}\n用法见文件头注释或 --help`)
  process.exit(2)
}

const cwdTop = (() => {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
})()
const ROOT = path.resolve(argOf('--repo') || process.env.WEKNORA_REPO || cwdTop)
if (!ROOT || !fs.existsSync(path.join(ROOT, 'apps/frontend/src/i18n/locales'))) {
  console.error(
    `错误：找不到目标仓库（当前解析为 ${ROOT || '<空>'}）。` +
      `请 cd 到 WeKnora 仓库内运行，或用 --repo <路径> / WEKNORA_REPO=<路径>`
  )
  process.exit(2)
}
const I18N_DIR = path.join(ROOT, 'apps/frontend/src/i18n')
const ENT_DIR = path.join(I18N_DIR, 'locales')
const KJSC_DIR = path.join(I18N_DIR, 'locales_kjsc')
const LANGS = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'ru-RU']
const UP_REV = argOf('--up') || 'bccb4b151'
const APPLY = has('--apply')

// ---------------------------------------------------------------- 公共：locale 树操作
function gitShow(rev, rel) {
  try {
    return execFileSync('git', ['-C', ROOT, 'show', `${rev}:${rel}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1 << 28,
    })
  } catch {
    return null
  }
}

/** 把 `export default {...}` 的 TS 源码求值成对象。locale 文件是纯字面量，eval 足够且最快。 */
function parse(text) {
  if (!text) return null
  const i = text.indexOf('export default')
  let body = i >= 0 ? text.slice(i + 'export default'.length) : text
  body = body.trim().replace(/;\s*$/, '')
  try {
    // eslint-disable-next-line no-eval
    return eval(`(${body})`)
  } catch {
    return null
  }
}

/** 摊平成 { 'a.b.c': value }，只含叶子（数组也算叶子） */
function leaves(o, p = '', out = {}) {
  if (!o || typeof o !== 'object') return out
  for (const k of Object.keys(o)) {
    const v = o[k]
    const q = p ? `${p}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) leaves(v, q, out)
    else out[q] = v
  }
  return out
}

function deepMerge(base, over) {
  if (over === null || over === undefined) return base
  const bIsObj = base !== null && typeof base === 'object' && !Array.isArray(base)
  const oIsObj = typeof over === 'object' && !Array.isArray(over) && over !== null
  if (!bIsObj || !oIsObj) return over
  const out = { ...base }
  for (const k of Object.keys(over)) out[k] = deepMerge(out[k], over[k])
  return out
}

/** 按 a.b.c 路径写值（自动建中间对象） */
function setPath(tree, dotted, value) {
  const segs = dotted.split('.')
  let cur = tree
  for (let i = 0; i < segs.length - 1; i++) {
    if (typeof cur[segs[i]] !== 'object' || cur[segs[i]] === null || Array.isArray(cur[segs[i]])) {
      cur[segs[i]] = {}
    }
    cur = cur[segs[i]]
  }
  cur[segs[segs.length - 1]] = value
}

/** 按路径删除，并递归清理空掉的对象 */
function removePath(tree, dotted) {
  const segs = dotted.split('.')
  const walk = (node, i) => {
    if (i === segs.length - 1) {
      delete node[segs[i]]
      return Object.keys(node).length === 0
    }
    if (!node[segs[i]] || typeof node[segs[i]] !== 'object') return false
    if (walk(node[segs[i]], i + 1) && Object.keys(node[segs[i]]).length === 0) delete node[segs[i]]
    return false
  }
  walk(tree, 0)
}

/** 最长公共前后缀 → 提取最小差异对 {from, to} */
function diffPair(upV, ovV) {
  if (typeof upV !== 'string' || typeof ovV !== 'string' || upV === ovV) return null
  let s = 0
  const maxS = Math.min(upV.length, ovV.length)
  while (s < maxS && upV[s] === ovV[s]) s++
  let e = 0
  const maxE = Math.min(upV.length - s, ovV.length - s)
  while (e < maxE && upV[upV.length - 1 - e] === ovV[ovV.length - 1 - e]) e++
  const from = upV.slice(s, upV.length - e)
  const to = ovV.slice(s, ovV.length - e)
  if (!from || !to || from.length > 24 || to.length > 24) return null
  return { from, to }
}

// ---------------------------------------------------------------- 公共：序列化（五语言一致）
function escapeLocaleString(value) {
  return `'${String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')}'`
}
function quoteLocaleKey(key) {
  return /^[A-Za-z_][\w]*$/.test(key) ? key : escapeLocaleString(key)
}
function serializeLocaleValue(value, indent = 0) {
  const pad = '  '.repeat(indent)
  if (typeof value === 'string') return escapeLocaleString(value)
  if (Array.isArray(value)) {
    const items = value.map((i) => `${pad}  ${serializeLocaleValue(i, indent + 1)}`)
    return `[\n${items.join(',\n')}\n${pad}]`
  }
  if (!value || typeof value !== 'object') return 'null'
  const entries = Object.entries(value).map(
    ([k, c]) => `${pad}  ${quoteLocaleKey(k)}: ${serializeLocaleValue(c, indent + 1)}`,
  )
  return `{\n${entries.join(',\n')}\n${pad}}`
}

const OVERLAY_HEADER = (L) =>
  `// 企业叠加层（自动生成，勿手工编辑）：由 weknora-upstream-sync 技能的 i18n.mjs 生成、\n` +
  `// 同技能的 align 子命令补齐键集缺口。\n` +
  `// 内容 = 企业独有键 + 与上游不同的值覆盖；运行时与 locales/${L}.ts 深合并。\n` +
  `// 主文件 locales/${L}.ts 与上游逐字节一致，同步时整文件端口，不要手工改。\n`

// ================================================================ format
// 背景：同为 6546 键、628 对象，五语言主文件行数却差 6 行。归因：注释跨行数不同、
// 顶层块顺序不同、个行长值写成多行拼接。三者都不含语义，却让「行数不齐」掩盖真缺陷。
function cmdFormat() {
  const DIRS = (argOf('--dirs') || 'locales,locales_kjsc,locales_backend')
    .split(',')
    .map((s) => s.trim())
  const ORDER_LANG = argOf('--order') || 'zh-CN'
  const KEEP_COMMENTS = !has('--no-comments')

  /** 按基准对象的键顺序递归重排；基准里没有的键保持原相对顺序排在后面 */
  const reorder = (node, ref) => {
    if (Array.isArray(node) || !node || typeof node !== 'object') return node
    const own = Object.keys(node)
    const refKeys = ref && typeof ref === 'object' && !Array.isArray(ref) ? Object.keys(ref) : []
    const rank = (k) => {
      const i = refKeys.indexOf(k)
      return i === -1 ? refKeys.length + own.indexOf(k) : i
    }
    const out = {}
    for (const k of [...own].sort((a, b) => rank(a) - rank(b))) {
      out[k] = reorder(node[k], ref ? ref[k] : undefined)
    }
    return out
  }

  /** 行注释块 → 锚定到「注释结束后第一个出现的键名」，多行压成单行 */
  function extractComments(text) {
    const blocks = []
    let buf = []
    for (const ln of text.split('\n')) {
      if (/^\s*\/\//.test(ln)) {
        buf.push(ln.replace(/^\s*\/\/\/?/, '').trim())
        continue
      }
      if (buf.length) {
        const km = /^\s*(['"]?)([^:'"\s]+)\1\s*:/.exec(ln)
        blocks.push({
          keyHint: km ? km[2] : null,
          indent: (ln.match(/^\s*/) || [''])[0],
          text: buf.filter(Boolean).join(' '),
        })
        buf = []
      }
    }
    return blocks
  }

  /**
   * 抽取 export default 之前的整行前置注释（如「自动生成，勿手工编辑」头）。
   * 这类注释不锚定任何键，extractComments 会遗漏，不保留会出现
   * 「脚本写了文件头、格式化后又消失」的自相矛盾。
   */
  function extractPrelude(text) {
    const out = []
    for (const ln of text.split('\n')) {
      if (/^\s*\/\//.test(ln)) out.push(ln.trimEnd())
      else if (ln.trim() === '') continue
      else break
    }
    return out
  }

  let bad = 0
  for (const dir of DIRS) {
    const dirPath = path.join(I18N_DIR, dir)
    if (!fs.existsSync(dirPath)) {
      console.log(`\n${dir}: 不存在，跳过`)
      continue
    }
    const raw = {}
    const trees = {}
    for (const L of LANGS) {
      const p = path.join(dirPath, `${L}.ts`)
      if (!fs.existsSync(p)) continue
      raw[L] = fs.readFileSync(p, 'utf8')
      trees[L] = parse(raw[L]) || {}
    }
    const ref = trees[ORDER_LANG] || trees[LANGS.find((L) => trees[L])] || {}
    const comments = {}
    if (KEEP_COMMENTS) for (const L of Object.keys(raw)) comments[L] = extractComments(raw[L])

    console.log(`\n########## ${dir} ##########`)
    const before = {}
    const after = {}
    for (const L of Object.keys(raw)) {
      before[L] = raw[L].split('\n').length
      const body = serializeLocaleValue(reorder(trees[L], ref), 0)
      const prelude = KEEP_COMMENTS ? extractPrelude(raw[L]) : []
      let out = `${prelude.length ? prelude.join('\n') + '\n' : ''}export default ${body}\n`
      if (KEEP_COMMENTS && comments[L]?.length) {
        const lines = out.split('\n')
        // 倒序插入，避免行号漂移
        for (const c of [...comments[L]].reverse()) {
          if (!c.keyHint) continue
          const esc = c.keyHint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const idx = lines.findIndex(
            (ln, i) => i > 0 && new RegExp(`^\\s*['"]?${esc}['"]?\\s*:`).test(ln),
          )
          if (idx > 0) lines.splice(idx, 0, `${c.indent}/* ${c.text} */`)
        }
        out = lines.join('\n')
      }
      after[L] = out.split('\n').length
      if (APPLY) fs.writeFileSync(path.join(dirPath, `${L}.ts`), out, 'utf8')
    }
    const vals = Object.values(after)
    const aligned = new Set(vals).size === 1
    console.log('语言      改前行数   改后行数')
    for (const L of Object.keys(raw)) {
      console.log(`${L.padEnd(8)} ${String(before[L]).padStart(7)}   ${String(after[L]).padStart(7)}`)
    }
    console.log(
      aligned ? `OK 五语言行数完全一致（${vals[0]} 行）` : `!! 仍未对齐: ${[...new Set(vals)].join(' / ')}`,
    )
    if (!aligned) bad++
  }
  if (APPLY) console.log('\n已写入。注意：主 locales/*.ts 从此不再与上游逐字节一致，check 改用 AST 等价判据。')
  process.exit(bad ? 1 : 0)
}

// ================================================================ overlay
// 背景：五语言 locales/*.ts 里混装了上游文案与企业文案，每次同步都要人工三方合并
// （差异曾达 15656 行）。改为「主文件 = 上游原文 + 叠加层 = 企业定制」后，主文件可整文件端口。
function cmdOverlay() {
  const ENT_REV = argOf('--ent-rev')
  const ALIGN_OUT = argOf('--align-out')
  const PORT_TRUNK = has('--port-trunk')
  const VERIFY = has('--verify')
  if (ENT_REV && APPLY) {
    console.error('错误：--ent-rev 是只读校验模式（企业原版取自 git rev），不能与 --apply 同用。')
    process.exit(2)
  }

  /** 取「企业有而上游没有 / 与上游不同」的部分，其余剪掉。undefined = 整枝无需保留。 */
  function diffNode(entNode, upNode) {
    if (entNode === null || entNode === undefined) return undefined
    const entIsObj = typeof entNode === 'object' && !Array.isArray(entNode)
    const upIsObj =
      upNode !== null && upNode !== undefined && typeof upNode === 'object' && !Array.isArray(upNode)
    if (!entIsObj) {
      if (upNode === undefined) return entNode
      const same = Array.isArray(entNode)
        ? JSON.stringify(entNode) === JSON.stringify(upNode)
        : entNode === upNode
      return same ? undefined : entNode
    }
    const out = {}
    for (const k of Object.keys(entNode)) {
      const child = diffNode(entNode[k], upIsObj ? upNode[k] : undefined)
      if (child !== undefined) out[k] = child
    }
    return Object.keys(out).length ? out : undefined
  }

  let exit = 0
  console.log(
    `上游基线: ${UP_REV}    企业原版: ${ENT_REV ? `${ENT_REV} (git)` : '工作区 locales/'}    ` +
      `模式: ${APPLY ? '写入' : '预演'}${PORT_TRUNK ? ' + 端口主文件' : ''}${VERIFY ? ' + 校验' : ''}\n`,
  )
  console.log('语言     上游键   企业键   叠加层条目(独有/覆盖)')

  const overlayLeaves = {}
  const upLeaves = {}
  // 磁盘上真正生效的叠加层（运行时用的就是它）。必须提前加载供校验使用——否则校验会用
  // 「本次从企业原版算出的 overlay」，而 overlay 衍生自企业原版，deepMerge(up, overlay) === ent
  // 恒成立，构成假绿（--verify 应用后恒真的根因）。
  const diskOv = {}
  for (const L of LANGS) {
    const f = path.join(KJSC_DIR, `${L}.ts`)
    diskOv[L] = fs.existsSync(f) ? leaves(parse(fs.readFileSync(f, 'utf8')) || {}) : null
  }

  for (const L of LANGS) {
    const entPath = path.join(ENT_DIR, `${L}.ts`)
    // 企业原版：默认取工作区 locales/；--ent-rev 时取改造前的 git rev（校验才有意义）
    const entTxt = ENT_REV
      ? gitShow(ENT_REV, `apps/frontend/src/i18n/locales/${L}.ts`)
      : fs.readFileSync(entPath, 'utf8')
    const upTxt = gitShow(UP_REV, `frontend/src/i18n/locales/${L}.ts`)
    if (!upTxt) {
      console.log(`${L}: 上游无此语言文件，跳过`)
      continue
    }
    const ent = parse(entTxt)
    const up = parse(upTxt)
    if (!ent || !up) {
      console.error(`${L}: 解析失败`)
      exit = 2
      continue
    }

    const overlay = diffNode(ent, up) || {}
    const el = leaves(ent)
    const ul = leaves(up)
    const ol = leaves(overlay)
    overlayLeaves[L] = ol
    upLeaves[L] = ul
    const onlyEnt = Object.keys(el).filter((k) => !(k in ul)).length
    const changed = Object.keys(el).filter((k) => k in ul && el[k] !== ul[k]).length
    console.log(
      `${L.padEnd(8)} ${String(Object.keys(ul).length).padStart(6)} ${String(Object.keys(el).length).padStart(8)} ${String(Object.keys(ol).length).padStart(10)} (${onlyEnt}/${changed})`,
    )

    // 校验对象必须是运行时真正生效的那份叠加层：APPLY 时校验本次算出的（写盘前自检），
    // 非 APPLY 时校验磁盘现有的（这才是真正要验的东西）。
    const checkOv = APPLY || !diskOv[L] ? overlay : diskOv[L]
    if (VERIFY || APPLY) {
      const merged = deepMerge(up, checkOv)
      const ml = leaves(merged)
      const problems = []
      const intentional = []
      for (const k of Object.keys(el)) {
        const same =
          typeof el[k] === 'object' && el[k] !== null
            ? JSON.stringify(el[k]) === JSON.stringify(ml[k])
            : el[k] === ml[k]
        if (same) continue
        // 企业原版与上游同值、但叠加层改了 → align 补齐术语造成的**有意变更**，只报告不拦截
        if (el[k] === ul[k]) intentional.push(k)
        else problems.push(k)
      }
      for (const k of Object.keys(ml)) if (!(k in el)) problems.push(`多余: ${k}`)
      const src = APPLY ? '本次生成' : '磁盘现有'
      if (problems.length) {
        console.error(`  !! ${L} 深合并校验失败 ${problems.length} 处（${src}叠加层），例: ${problems.slice(0, 5)}`)
        exit = 1
      } else {
        let line = `  ✓ ${L} 企业定制全部还原（${Object.keys(el).length} 键，${src}叠加层）`
        if (intentional.length) line += `；另有 ${intentional.length} 键为有意覆盖（术语补齐）`
        console.log(line)
      }
    }

    if (APPLY) {
      fs.mkdirSync(KJSC_DIR, { recursive: true })
      fs.writeFileSync(
        path.join(KJSC_DIR, `${L}.ts`),
        `${OVERLAY_HEADER(L)}export default ${serializeLocaleValue(overlay, 0)}\n`,
        'utf8',
      )
      if (PORT_TRUNK) fs.writeFileSync(entPath, upTxt, 'utf8')
    }
  }

  if (APPLY) {
    console.log(`\n已写入 ${KJSC_DIR}/`)
    if (PORT_TRUNK) console.log('主 locales/*.ts 已端口为上游版本')
  }

  // ---- 键集对齐度 ----
  // 统计磁盘上真正生效的叠加层，而不是本次预演算出的 overlay —— 否则 align 补齐后
  // 这里仍显示旧数字，会误导。
  for (const L of LANGS) if (!diskOv[L]) diskOv[L] = overlayLeaves[L] || {}
  const unionList = [...new Set(LANGS.flatMap((L) => Object.keys(diskOv[L])))]
  const zhOv = overlayLeaves['zh-CN'] || {}
  const zhUp = upLeaves['zh-CN'] || {}

  console.log(`\n叠加层键集对齐度（五语言并集 ${unionList.length} 键）`)
  console.log('语言     叠加层键   缺键   其中上游沿用zh-CN(待翻译)')
  const alignRows = []
  let worst = 0
  for (const L of LANGS) {
    const ov = diskOv[L]
    const up = upLeaves[L] || {}
    const miss = unionList.filter((k) => !(k in ov))
    worst = Math.max(worst, miss.length)
    const untranslated = miss.filter((k) => up[k] !== undefined && up[k] === zhUp[k])
    console.log(
      `${L.padEnd(8)} ${String(Object.keys(ov).length).padStart(7)} ${String(miss.length).padStart(6)}   ${String(untranslated.length).padStart(8)}`,
    )
    for (const k of miss) alignRows.push([L, k, up[k] ?? '', zhOv[k] ?? ''])
  }
  console.log(
    worst === 0
      ? 'OK 五语言叠加层键集完全一致'
      : `· 最大缺口 ${worst} 键：这些键企业该语言与上游同值，运行时回落上游译文。` +
          `若术语（如 空间→租户）需在该语言生效，应补齐叠加层（用 --align-out 导出清单）。`,
  )

  if (ALIGN_OUT) {
    const esc = (v) => `"${String(v).replace(/"/g, '""').replace(/\r?\n/g, '\\n')}"`
    const csv = [
      ['lang', 'key', 'upstreamValueThisLang', 'zhCNOverlayValue'].map(esc).join(','),
      ...alignRows.map((r) => r.map(esc).join(',')),
    ].join('\n')
    fs.writeFileSync(path.resolve(ROOT, ALIGN_OUT), `${csv}\n`, 'utf8')
    console.log(`\n待补齐清单已写入 ${ALIGN_OUT}（${alignRows.length} 行）`)
  }
  process.exit(exit)
}

// ================================================================ align
// 背景：五语言叠加层键数不齐（如 ja-JP 921 / zh-CN 1134）。缺的键不是漏生成，而是
// 「企业该语言当时与上游同值」——中文把「空间→租户」改了，英文仍 workspace、日文仍 ワークスペース。
// 做法：从已有覆盖反推各语言的术语替换表，再应用到缺失键的上游值。
function cmdAlign() {
  const MIN_FREQ = Number(argOf('--min-freq') || 3)
  const CORPUS_MIN = Number(argOf('--corpus-min') || 3)
  const DOMINANT = Number(argOf('--dominant') || 0.7)
  const TODO_OUT = argOf('--todo-out')
  const FILL_EQUAL = has('--fill-equal')
  const PRUNE_EQUAL = has('--prune-equal')
  const ALIGN_LANGS = (argOf('--langs') || LANGS.join(',')).split(',').map((s) => s.trim())

  if (!fs.existsSync(KJSC_DIR)) {
    console.error(`错误：找不到 ${KJSC_DIR}，请先跑 overlay 子命令生成叠加层。`)
    process.exit(2)
  }

  const up = {}
  const ovTree = {}
  const ov = {}
  for (const L of ALIGN_LANGS) {
    up[L] = leaves(parse(gitShow(UP_REV, `frontend/src/i18n/locales/${L}.ts`)) || {})
    ovTree[L] = parse(fs.readFileSync(path.join(KJSC_DIR, `${L}.ts`), 'utf8')) || {}
    ov[L] = leaves(ovTree[L])
  }
  const unionKeys = [...new Set(ALIGN_LANGS.flatMap((L) => Object.keys(ov[L])))]

  console.log(`上游基线: ${UP_REV}    模式: ${APPLY ? '写入' : '预演'}    术语最小频次: ${MIN_FREQ}`)
  console.log(`叠加层键集并集: ${unionKeys.length} 键\n`)

  const todoRows = []
  let exit = 0

  for (const L of ALIGN_LANGS) {
    // ---- 1) 反推术语表 ----
    const byFrom = new Map() // from -> Map(to -> {n, sample})
    for (const k of Object.keys(ov[L])) {
      if (!(k in up[L])) continue // 企业独有键，无上游对照，不参与术语反推
      const d = diffPair(up[L][k], ov[L][k])
      if (!d) continue
      if (!byFrom.has(d.from)) byFrom.set(d.from, new Map())
      const tos = byFrom.get(d.from)
      const rec = tos.get(d.to) || { n: 0, sample: k }
      rec.n++
      rec.sample = k
      tos.set(d.to, rec)
    }
    // 语料频次：区分真术语（出现数十次）vs 整句改写（只出现 1~2 次）
    const corpus = Object.values(up[L]).filter((v) => typeof v === 'string')
    const corpusCount = (from) => corpus.reduce((n, v) => n + (v.includes(from) ? 1 : 0), 0)

    const terms = []
    const ambiguous = []
    const skipped = []
    for (const [from, tos] of byFrom) {
      const list = [...tos.entries()]
        .map(([to, r]) => ({ to, n: r.n, sample: r.sample }))
        .sort((a, b) => b.n - a.n)
      const total = list.reduce((s, x) => s + x.n, 0)
      let chosen = list[0]
      if (list.length > 1) {
        if (chosen.n / total < DOMINANT) {
          ambiguous.push({ from, tos: list })
          continue
        }
        for (const alt of list.slice(1)) {
          skipped.push({ from, to: alt.to, n: alt.n, sample: alt.sample, why: '次要变体' })
        }
      }
      const { to, n, sample } = chosen
      if (n < MIN_FREQ) {
        skipped.push({ from, to, n, sample, why: `覆盖频次<${MIN_FREQ}` })
        continue
      }
      // i18n 链接语法（@:{'brand.name'}）是品牌名引用，按上下文选用，不做泛化替换
      if (to.includes('@:')) {
        skipped.push({ from, to, n, sample, why: 'i18n 链接语法 @: 目标' })
        continue
      }
      const cc = corpusCount(from)
      if (cc < CORPUS_MIN) {
        skipped.push({ from, to, n, sample, why: `语料频次 ${cc}<${CORPUS_MIN}（疑似整句改写）` })
        continue
      }
      // 最小长度 2：单字术语上下文不可判定。实测误伤：zh「新」→「创」来自「不能新建→不能创建」，
      // 泛化会把「刷新 Tools」改成「刷创 Tools」。
      if (from.length < 2) {
        skipped.push({ from, to, n, sample, why: '单字术语，上下文不可判定' })
        continue
      }
      terms.push({ from, to, n, corpus: cc })
    }

    // 子串扩展：低频变体（如 ja「スペース」只出现 1 次）直接泛化风险大，要求跨语言语境确认——
    // 该变体唯一证据键的 zh-CN 企业值必须含「租户」，证明这个语境确实是「空间→租户」。
    for (const s of skipped) {
      if (!/^(覆盖频次|语料频次)/.test(s.why)) continue
      const host = terms.find((t) => t.to === s.to && (t.from.includes(s.from) || s.from.includes(t.from)))
      if (!host) continue
      if (terms.some((t) => t.from === s.from)) continue
      const zhVal = ov['zh-CN']?.[s.sample]
      if (!zhVal || typeof zhVal !== 'string' || !zhVal.includes('租户')) continue
      terms.push({ from: s.from, to: s.to, n: s.n, corpus: corpusCount(s.from), ext: s.sample })
    }
    terms.sort((a, b) => b.from.length - a.from.length) // 长的先替换，避免部分命中

    // ---- 2) 补齐缺失键 ----
    // 「空间→租户」术语族只在**中文该键确实做了这个定制**时才套用，避免把其它语境的
    // space / スペース 之类通用词误改（英文 space 是通用词，语料 300+ 处）。
    const TENANT_WORD = {
      'zh-CN': '租户',
      'en-US': 'tenant',
      'ja-JP': 'テナント',
      'ko-KR': '테넌트',
      'ru-RU': 'тенант',
    }
    const isTenantTerm = (t) => {
      const w = TENANT_WORD[L]
      return !!w && String(t.to).toLowerCase().includes(w.toLowerCase())
    }
    const zhCustomizedSpace = (k) => {
      const d =
        typeof up['zh-CN']?.[k] === 'string' ? diffPair(up['zh-CN'][k], ov['zh-CN']?.[k]) : null
      return !!d && d.from.includes('空间') && d.to.includes('租户')
    }

    // 跨语言桥接：用「中/英都做过定制的共同键」建立 源语言改法 → 本语言改法 的映射。
    // 解决术语表覆盖不到的措辞类定制，如 中文「新建→创建」↔ 英文「New→Create」。
    const SRC = L === 'zh-CN' ? 'en-US' : 'zh-CN'
    const bridge = new Map()
    for (const k of Object.keys(ov[SRC])) {
      if (!(k in up[SRC]) || !(k in up[L]) || !(k in ov[L])) continue
      const ds = diffPair(up[SRC][k], ov[SRC][k])
      const dl = diffPair(up[L][k], ov[L][k])
      if (!ds || !dl) continue
      const sk = `${ds.from}\u0000${ds.to}`
      if (!bridge.has(sk)) bridge.set(sk, new Map())
      const m = bridge.get(sk)
      const lk = `${dl.from}\u0000${dl.to}`
      m.set(lk, (m.get(lk) || 0) + 1)
    }
    // 每个源改法只保留占比 >= 0.6 且出现 >= 2 次的主映射，避免噪声
    const bridgeMain = new Map()
    let bridgeNoisy = 0
    for (const [sk, m] of bridge) {
      const list = [...m.entries()].sort((a, b) => b[1] - a[1])
      const total = list.reduce((s, [, n]) => s + n, 0)
      if (list[0][1] < 2 || list[0][1] / total < 0.6) {
        bridgeNoisy++
        continue
      }
      bridgeMain.set(sk, list[0][0].split('\u0000'))
    }

    const miss = unionKeys.filter((k) => !(k in ov[L]))
    let filled = 0
    let noTerm = 0
    let noUpstream = 0
    let viaBridge = 0
    let filledEqual = 0
    let pruned = 0

    // --prune-equal：移除叠加层里与上游同值的条目，恢复纯差异叠加层（--fill-equal 的逆操作）
    if (PRUNE_EQUAL) {
      for (const k of Object.keys(ov[L])) {
        if (up[L][k] !== undefined && ov[L][k] === up[L][k]) {
          delete ov[L][k]
          removePath(ovTree[L], k)
          pruned++
        }
      }
    }

    for (const k of miss) {
      const base = up[L][k]
      if (base === undefined || typeof base !== 'string') {
        noUpstream++
        todoRows.push([L, k, '上游无此键/非字符串', ov['zh-CN']?.[k] ?? '', ''])
        continue
      }
      let v = base
      for (const t of terms) {
        if (!v.includes(t.from)) continue
        if (isTenantTerm(t) && !zhCustomizedSpace(k)) continue
        v = v.split(t.from).join(t.to)
      }
      if (v === base && typeof up[SRC]?.[k] === 'string' && ov[SRC]?.[k] !== undefined) {
        const ds = diffPair(up[SRC][k], ov[SRC][k])
        if (ds) {
          const pair = bridgeMain.get(`${ds.from}\u0000${ds.to}`)
          if (pair && v.includes(pair[0])) {
            const nv = v.split(pair[0]).join(pair[1])
            if (nv !== v) {
              v = nv
              viaBridge++
            }
          }
        }
      }
      if (v === base) {
        if (FILL_EQUAL) {
          // 目标语言本来就符合企业意图，写同值条目只为键集对齐（可用 --prune-equal 回退）
          filledEqual++
          ov[L][k] = v
          setPath(ovTree[L], k, v)
          todoRows.push([L, k, '同值占位（目标语言无需定制，用于键集对齐）', ov['zh-CN']?.[k] ?? '', base])
          continue
        }
        noTerm++
        todoRows.push([L, k, '术语未命中（需人工判断）', ov['zh-CN']?.[k] ?? '', base])
        continue
      }
      filled++
      ov[L][k] = v
      setPath(ovTree[L], k, v)
    }

    console.log(`----- ${L} -----`)
    console.log(`  术语表 ${terms.length} 条（歧义排除 ${ambiguous.length} 条）`)
    for (const t of terms.slice(0, 10)) {
      console.log(
        `    ${String(t.n).padStart(4)}× 语料${String(t.corpus).padStart(4)}  "${t.from}" → "${t.to}"` +
          (t.ext ? `   [子串扩展，证据键 ${t.ext}]` : ''),
      )
    }
    if (terms.length > 10) console.log(`    ... 另有 ${terms.length - 10} 条`)
    for (const a of ambiguous) {
      console.log(`    · 歧义跳过: "${a.from}" → ${a.tos.map((t) => `"${t.to}"(${t.n})`).join(' / ')}`)
    }
    for (const s of skipped.slice(0, 6)) {
      console.log(`    · 跳过: "${s.from}" → "${s.to}" (${s.n}×, ${s.why})`)
    }
    if (skipped.length > 6) console.log(`    ... 另有 ${skipped.length - 6} 条跳过`)
    console.log(`  跨语言桥接 ${bridgeMain.size} 条映射（噪声丢弃 ${bridgeNoisy} 条），本次用上 ${viaBridge}`)
    console.log(
      `  缺键 ${miss.length} → 补齐 ${filled} / 同值占位 ${filledEqual} / 清理同值 ${pruned}` +
        ` / 术语未命中 ${noTerm} / 上游无此键 ${noUpstream}`,
    )
    console.log(`  叠加层键数 ${Object.keys(ov[L]).length - filled} → ${Object.keys(ov[L]).length}`)
  }

  if (APPLY) {
    for (const L of ALIGN_LANGS) {
      fs.writeFileSync(
        path.join(KJSC_DIR, `${L}.ts`),
        `${OVERLAY_HEADER(L)}export default ${serializeLocaleValue(ovTree[L], 0)}\n`,
        'utf8',
      )
    }
    console.log(`\n已写入 ${KJSC_DIR}/（${ALIGN_LANGS.length} 个语言）`)
  }

  console.log(`\n仍需人工处理: ${todoRows.length} 条`)
  if (TODO_OUT) {
    const esc = (v) => `"${String(v).replace(/"/g, '""').replace(/\r?\n/g, '\\n')}"`
    const csv = [
      ['lang', 'key', 'reason', 'zhCNOverlayValue', 'upstreamValueThisLang'].map(esc).join(','),
      ...todoRows.map((r) => r.map(esc).join(',')),
    ].join('\n')
    fs.writeFileSync(path.resolve(ROOT, TODO_OUT), `${csv}\n`, 'utf8')
    console.log(`人工清单已写入 ${TODO_OUT}`)
  }
  process.exit(exit)
}

// ================================================================ check（C6）
// 同步上游时 i18n 最容易出两类静默问题：缺键（页面显示键名）、值级回退（文案悄悄倒退）。
// 二者都无法靠 vue-tsc 或构建发现，必须做值级比对。
function cmdCheck() {
  const allowReg = new Set(
    argv
      .filter((a, i) => argv[i - 1] === '--allow-reg' || a.startsWith('--allow-reg='))
      .map((a) => (a.startsWith('--allow-reg=') ? a.slice('--allow-reg='.length) : a))
      .filter((a) => a && !a.startsWith('--')),
  )
  const OLD = argOf('--old')
  const NEW = argOf('--new')
  const BASE = argOf('--base')

  /** 路径类型冲突：叠加层叶子键落在上游对象的位置上（或反之），深合并会静默覆盖。 */
  function pathConflicts(upTree, overTree) {
    const bad = []
    const walk = (up, over, prefix) => {
      if (!over || typeof over !== 'object' || Array.isArray(over)) return
      for (const k of Object.keys(over)) {
        const p = prefix ? `${prefix}.${k}` : k
        const ov = over[k]
        const uv = up && typeof up === 'object' && !Array.isArray(up) ? up[k] : undefined
        const ovIsObj = ov !== null && typeof ov === 'object' && !Array.isArray(ov)
        const uvIsObj = uv !== null && typeof uv === 'object' && !Array.isArray(uv)
        if (uv === undefined) {
          if (ovIsObj) walk(undefined, ov, p)
          continue
        }
        if (ovIsObj && !uvIsObj) bad.push(`${p}（上游是值，叠加层是对象）`)
        else if (!ovIsObj && uvIsObj) bad.push(`${p}（上游是对象，叠加层是值）`)
        else if (ovIsObj && uvIsObj) walk(uv, ov, p)
      }
    }
    walk(upTree, overTree, '')
    return bad
  }

  /**
   * AST 等价比较：返回差异键列表。主 locales/*.ts 经 format 统一顺序与注释后不再与上游
   * 逐字节一致，故漂移判据从「文本相等」升级为「结构 + 值相等」（忽略键顺序与注释）。
   */
  function treeDiff(aTree, bTree) {
    const al = leaves(aTree || {})
    const bl = leaves(bTree || {})
    const diff = []
    for (const k of Object.keys(bl)) {
      const av = al[k]
      const eq =
        av && typeof av === 'object' ? JSON.stringify(av) === JSON.stringify(bl[k]) : av === bl[k]
      if (!(k in al)) diff.push(`缺: ${k}`)
      else if (!eq) diff.push(`值不同: ${k}`)
    }
    for (const k of Object.keys(al)) if (!(k in bl)) diff.push(`多余: ${k}`)
    return diff
  }

  // 上游语言包路径随版本变化，逐个候选尝试
  const upstreamLocale = (rev, L) => {
    for (const c of [
      `frontend/src/i18n/locales/${L}.ts`,
      `frontend/src/i18n/${L}.ts`,
      `apps/frontend/src/i18n/locales/${L}.ts`,
    ]) {
      const t = gitShow(rev, c)
      if (t) return t
    }
    return null
  }

  // --self-test：反向验证 pathConflicts 真能报出冲突。写检查类脚本必须做反向验证，
  // 否则它和实现一起错时看起来仍然是绿的。
  if (has('--self-test')) {
    const cases = [
      { name: '叠加层值覆盖上游对象（应报）', up: { a: { b: 'x' } }, over: { a: 'y' }, expect: 1 },
      { name: '叠加层对象覆盖上游值（应报）', up: { a: 'y' }, over: { a: { b: 'x' } }, expect: 1 },
      { name: '嵌套同构（不应报）', up: { a: { b: '1' } }, over: { a: { b: '2' } }, expect: 0 },
      { name: '叠加层新增分支（不应报）', up: {}, over: { z: { b: '1' } }, expect: 0 },
    ]
    let bad = 0
    for (const c of cases) {
      const got = pathConflicts(c.up, c.over).length
      const ok = c.expect === 0 ? got === 0 : got > 0
      console.log(`     ${ok ? '✓' : '✗'} ${c.name} → 报出 ${got}（期望 ${c.expect ? '>0' : '0'}）`)
      if (!ok) bad++
    }
    console.log(bad === 0 ? '     self-test 通过' : `     self-test 失败 ${bad} 项`)
    process.exit(bad === 0 ? 0 : 1)
  }

  // 叠加层模式：主文件与上游 AST 等价、企业内容只在 locales_kjsc/，此时「缺键/回退」恒为 0
  // （主文件本来就等价于上游），旧语义失效，换成三项叠加层检查。
  const OVERLAY = fs.existsSync(KJSC_DIR)
  if (OVERLAY) console.log('     （叠加层模式：locales_kjsc/ 存在，改用三项叠加层检查）')

  let fail = 0
  for (const L of LANGS) {
    const curPath = path.join(ENT_DIR, `${L}.ts`)
    if (!fs.existsSync(curPath)) {
      console.log(`     !! ${L} 企业语言包不存在`)
      fail = 1
      continue
    }

    if (OVERLAY) {
      const kPath = path.join(KJSC_DIR, `${L}.ts`)
      if (!fs.existsSync(kPath)) {
        console.log(`     !! ${L} 叠加层缺失（${path.relative(ROOT, kPath)}）`)
        fail = 1
        continue
      }
      const nTree = parse(upstreamLocale(NEW, L))
      const oTree = parse(upstreamLocale(OLD, L))
      const overTree = parse(fs.readFileSync(kPath, 'utf8'))
      const nU = leaves(nTree)
      const oU = leaves(oTree)
      const ovL = leaves(overTree)

      // 1) 主文件必须与上游 AST 等价
      const curTree = parse(fs.readFileSync(curPath, 'utf8'))
      const drift = !nTree || !curTree ? ['解析失败'] : treeDiff(curTree, nTree)
      const drifted = drift.length > 0
      // 2) 路径冲突
      const conflicts = pathConflicts(nTree, overTree)
      // 3) 上游改动的键被叠加层覆盖 → 需人工复核
      const overlapped = Object.keys(oU)
        .filter((k) => k in nU && oU[k] !== nU[k] && k in ovL)
        .filter((k) => !allowReg.has(k))

      console.log(
        `     ${L}: 主文件${drifted ? '【已漂移!】' : '与上游一致'}` +
          `  叠加层 ${Object.keys(ovL).length} 键` +
          `  路径冲突 ${conflicts.length}  上游改动且被覆盖 ${overlapped.length}`,
      )
      if (drifted) {
        console.log(`        !! 主 locales/${L}.ts 内容与上游不一致（同步时整文件端口后应跑 format）`)
        for (const d of drift.slice(0, 5)) console.log(`           ${d}`)
        if (drift.length > 5) console.log(`           ... 另有 ${drift.length - 5} 个`)
        fail = 1
      }
      if (conflicts.length) {
        for (const c of conflicts.slice(0, 8)) console.log(`        !! 路径冲突 ${c}`)
        if (conflicts.length > 8) console.log(`        ... 另有 ${conflicts.length - 8} 个`)
        fail = 1
      }
      if (overlapped.length) {
        console.log(`        · 上游已改、叠加层仍覆盖（复核覆盖值是否仍适用，前 5）:`)
        for (const k of overlapped.slice(0, 5)) {
          console.log(`           ${k}\n             上游新: ${String(nU[k]).slice(0, 60)}`)
          console.log(`             叠加层: ${String(ovL[k]).slice(0, 60)}`)
        }
        if (overlapped.length > 5) console.log(`           ... 另有 ${overlapped.length - 5} 个`)
        // 只报告不拦截：覆盖值多为企业术语（空间→租户），上游改动不代表覆盖失效
      }
      continue
    }

    const cur = leaves(parse(fs.readFileSync(curPath, 'utf8')))
    const base = leaves(parse(gitShow(BASE, `apps/frontend/src/i18n/locales/${L}.ts`)))
    const oU = leaves(parse(upstreamLocale(OLD, L)))
    const nU = leaves(parse(upstreamLocale(NEW, L)))
    if (!nU || Object.keys(nU).length === 0) {
      console.log(`     ?  ${L} 上游 ${String(NEW).slice(0, 9)} 无语言包，跳过`)
      continue
    }

    const missing = Object.keys(nU).filter((k) => !(k in cur))
    // 值级比对只在旧上游也有该语言时才有意义
    const hasOld = Object.keys(oU).length > 0
    const reg = []
    const custom = []
    const follow = []
    for (const k of Object.keys(oU)) {
      if (!(k in nU) || oU[k] === nU[k] || !(k in cur)) continue
      const c = cur[k]
      const b = base[k]
      if (c === oU[k]) reg.push(k)
      else if (c === nU[k]) follow.push(k)
      else if (b !== undefined && c === b && b !== oU[k] && b !== nU[k]) custom.push(k)
    }

    const realReg = reg.filter((k) => !allowReg.has(k))
    const tag = hasOld ? '' : '（旧上游无此语言，跳过值级比对）'
    console.log(
      `     ${L}: 企业键 ${Object.keys(cur).length} / 上游键 ${Object.keys(nU).length}` +
        `  缺键 ${missing.length}  回退 ${realReg.length} / 企业定制 ${custom.length} / 已跟随 ${follow.length}${tag}`,
    )
    if (missing.length) {
      const show = missing.slice(0, 10)
      console.log(`        !! 缺键（前 ${show.length}/${missing.length}）: ${show.join(', ')}`)
      fail = 1
    }
    if (realReg.length) {
      for (const k of realReg.slice(0, 10)) {
        console.log(`        !! 回退 ${k}`)
        console.log(`           现/旧: ${String(oU[k]).slice(0, 60)}`)
        console.log(`           上游新: ${String(nU[k]).slice(0, 60)}`)
      }
      if (realReg.length > 10) console.log(`        ... 另有 ${realReg.length - 10} 个`)
      fail = 1
    }
  }

  console.log(
    fail === 0
      ? OVERLAY
        ? '     OK 主文件未漂移、叠加层无路径冲突'
        : '     OK 无缺键、无未豁免的值级回退'
      : OVERLAY
        ? '     !! 主文件漂移或叠加层存在路径冲突'
        : '     !! 存在缺键或值级回退（确认为企业有意保留时用 --allow-reg <key> 豁免）',
  )
  process.exit(fail === 0 ? 0 : 1)
}

// ---------------------------------------------------------------- dispatch
;({ format: cmdFormat, overlay: cmdOverlay, align: cmdAlign, check: cmdCheck })[CMD]()
