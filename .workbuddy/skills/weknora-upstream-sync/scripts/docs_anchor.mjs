#!/usr/bin/env node
// 文档站锚点机制（WeKnora 企业侧，技能 weknora-upstream-sync 的一部分）
//
// 背景：apps/docs 是从上游 website-docs/ fork 来的企业版（轨道 B）。每次同步都要
// 「全文 diff → 人工判断」，而 71 篇 md 里绝大部分差异其实是同三类重复劳动：
//   ① 术语替换（空间→租户）  ② 未交付能力整章删除  ③ 企业入口/参数补充说明
// 全文 diff 会让三类混在一起，无法区分「该保留」和「该跟上」。
//
// 锚点机制：先按**标题路径**把文档切成块（# H1 > ## H2 > ### H3 下第 n 段），
// 企业定制以「锚点 + 上游原文 + 企业原文」三元组登记。同步时：
//   1. 整文件端口回上游最新版
//   2. 跑术语表（默认 <skill>/references/docs-terms.json，随技能入库）
//   3. 按锚点回填定制块 —— 锚点基于标题路径而非行号，只要标题不变就能命中；
//      命中不上才升格为「需人工」，人工只看锚点、不再 diff 全文
//
// 用法（脚本住在技能目录里，作用于「目标仓库」）：
//   node <skill>/scripts/docs_anchor.mjs build                      # 生成锚点索引
//   node <skill>/scripts/docs_anchor.mjs build --learn-terms        # 顺带 Learn 词级术语表
//   node <skill>/scripts/docs_anchor.mjs verify                     # 零落盘自检（推荐）
//   node <skill>/scripts/docs_anchor.mjs check                      # 端口后校验锚点是否漂移
//   node <skill>/scripts/docs_anchor.mjs apply                      # 回填尚未生效的定制块
//   ... --repo <路径> / WEKNORA_REPO=<路径> / --file <相对路径> 只看一篇
//
// verify 的意义：把「上游原文 + 术语 + 锚点条目」在内存里重算一遍，与目标文件逐字节比对。
// 它不写任何磁盘，却能证明索引没漏、也没多 —— 这是 check/apply 不能给出的保证。
//
// 退出码：0 成功；1 build 索引为空 / verify 不等价 / check 有漂移且未豁免；2 参数错误。
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const argv = process.argv.slice(2)
const argOf = (n) => {
  const i = argv.indexOf(n)
  return i >= 0 ? argv[i + 1] : undefined
}
const has = (f) => argv.includes(f)
const CMD = ['build', 'verify', 'check', 'apply'].find((c) => argv.includes(c)) || 'build'

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
if (!ROOT || !fs.existsSync(path.join(ROOT, 'apps/docs'))) {
  console.error(
    `错误：找不到目标仓库（当前解析为 ${ROOT || '<空>'}）。` +
      `请 cd 到 WeKnora 仓库内运行，或用 --repo <路径> / WEKNORA_REPO=<路径>`
  )
  process.exit(2)
}

const UP_REV = argOf('--up') || 'bccb4b151'
const UP_DIR = 'website-docs'
const ENT_DIR = 'apps/docs'
import crypto from 'node:crypto'
// apply 的硬保险：索引里记下企业版全文 sha256，写入前比对，不一致就拒绝写该文件。
// 没有它时，重放顺序尚有瑕疵的文件会被静默改坏（这是自动工具最不能犯的错）。
const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex')
// 两个数据文件的落点相反，别搞混：
//   锚点索引 = 派生物（从「上游 docs + 企业 docs」实时算出，1.8MB，每次改文档都要重算）
//              → 默认 .workbuddy/outputs/（已 gitignore），要跨机器复用用 --index 指向别处
//   术语表   = 人工沉淀的资产（454B，空间→租户 等 5 条）→ 随技能入库
// 术语表按「脚本自身位置」解析，不跟仓库根走：它是技能的输入数据，不属于任何被同步的仓库。
const INDEX_PATH =
  argOf('--index') || path.join(ROOT, '.workbuddy/outputs/docs-anchors.json')
const SKILL_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const TERMS_PATH =
  argOf('--terms') || path.join(SKILL_DIR, 'references/docs-terms.json')
const ONLY_FILE = argOf('--file')
const LEARN = has('--learn-terms')
const MIN_TERM_FREQ = Number(argOf('--min-freq') || 3)
// 结构对齐度门槛：低于它的文档判为「企业整篇重写」，不参与锚点（见 structureRatio 注释）
const MIN_RATIO = Number(argOf('--min-ratio') || 0.6)

const gshow = (rev, p) => {
  try {
    return execFileSync('git', ['show', `${rev}:${p}`], {
      encoding: 'utf8',
      maxBuffer: 1 << 28,
    })
  } catch {
    return null
  }
}

/** 按标题路径把 md 切成块。返回 [{key, headingPath, idx, kind, text}] */
function parseBlocks(text) {
  const lines = text.split('\n')
  const blocks = []
  const stack = []
  let buf = []
  let idx = 0
  let prevKey = null
  const flush = () => {
    if (!buf.length) return
    const joined = buf.join('\n')
    if (joined.trim() === '') {
      buf = []
      return
    }
    idx += 1
    blocks.push({
      key: `${stack.join(' > ')}::${idx}`,
      prevKey,
      headingPath: stack.join(' > '),
      idx,
      kind: 'text',
      text: joined,
    })
    prevKey = blocks[blocks.length - 1].key
    buf = []
  }
  for (const ln of lines) {
    const h = /^(#{1,6})\s+(.*)$/.exec(ln)
    if (h) {
      flush()
      const level = h[1].length
      stack.length = level - 1
      stack[level - 1] = h[2].trim()
      idx = 0
      blocks.push({
        key: `H:${stack.join(' > ')}`,
        prevKey,
        headingPath: stack.join(' > '),
        idx: 0,
        kind: 'heading',
        text: ln,
      })
      prevKey = blocks[blocks.length - 1].key
      continue
    }
    if (ln.trim() === '') {
      flush()
      continue
    }
    buf.push(ln)
  }
  flush()
  return blocks
}

/** 结构对齐度：标题重合比例。低于阈值的文档是「企业整篇重写」，锚点机制不适用 ——
 *  实测 67 篇里有 25 篇标题结构完全不同（如 01-introduction.md 上游「核心概念/租户与身份」
 *  vs 企业「核心价值/产品能力」），对它们做行级/块级锚点只会产出成百上千条伪「删除/插入」。
 *  这类文件应判为「企业自有文档」，不参与端口，单独登记在 index.rewritten 里。 */
/** 位置无关的最小差异对齐。
 *  不能只按 key 做集合查表：企业在某节插了一段，后面所有块的序号都会 +1，
 *  于是「后面全部块」被误判成 删除+插入（实测一次炸出 912 条 delete）。
 *  用 LCS 把两边按 key 对齐后，真正不同的只剩下的最小集合。 */
function alignBlocks(upBlocks, entBlocks) {
  const upKeys = upBlocks.map((b) => b.key)
  const entKeys = entBlocks.map((b) => b.key)
  const n = upKeys.length
  const m = entKeys.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = upKeys[i] === entKeys[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const ops = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (upKeys[i] === entKeys[j]) {
      ops.push({ type: 'same', i, j })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'del', i })
      i++
    } else {
      ops.push({ type: 'ins', j })
      j++
    }
  }
  while (i < n) ops.push({ type: 'del', i: i++ })
  while (j < m) ops.push({ type: 'ins', j: j++ })
  return ops
}

function replaceFirst(text, from, to) {
  const idx = text.indexOf(from)
  if (idx < 0) return text
  return text.slice(0, idx) + to + text.slice(idx + from.length)
}

function structureRatio(upBlocks, entBlocks) {
  const upH = new Set(upBlocks.filter((b) => b.kind === 'heading').map((b) => b.text.trim()))
  const entH = new Set(entBlocks.filter((b) => b.kind === 'heading').map((b) => b.text.trim()))
  if (!upH.size || !entH.size) return 0
  let hit = 0
  for (const h of upH) if (entH.has(h)) hit++
  return hit / Math.max(upH.size, entH.size)
}

function applyTerms(text, terms) {
  if (!terms?.length) return text
  let out = text
  // 长串优先，避免子串先命中
  const list = [...terms].sort((a, b) => b.from.length - a.from.length)
  for (const t of list) out = out.split(t.from).join(t.to)
  return out
}

/** Learn 词级术语：取「同锚点上下游 text 不同」的块对，用最长公共前后缀提取最小差异，
 *  按出现频次收敛。门槛借鉴 align_i18n_overlay.mjs：频次>=3、from 长度>=2。 */
function learnTerms(pairs) {
  const byPair = new Map()
  for (const { up, ent } of pairs) {
    if (up === ent) continue
    if (typeof up !== 'string' || typeof ent !== 'string') continue
    let p = 0
    const n = Math.min(up.length, ent.length)
    while (p < n && up[p] === ent[p]) p++
    let s = 0
    while (s < n - p && up[up.length - 1 - s] === ent[ent.length - 1 - s]) s++
    const from = up.slice(p, up.length - s)
    const to = ent.slice(p, ent.length - s)
    if (!from || !to) continue
    if (from.length < 2) continue
    if (from.length > 12) continue // 太长基本是整句改写，不是术语
    if (to.includes('@:') || to.includes('${')) continue
    // 不是术语而是代码片段的残留：曾从这里冒出 s_knowledge→r（来自被整段删掉的
    // internal/router/routes_knowledge.go 路径），一旦被自动应用会腐蚀整批文档。
    if (/[_\/\\.]/.test(from)) continue
    // 关键门槛：这条替换必须能「完整解释」该块的差异。
    // 没有它时会 Learn 出上面那种垃圾（最小diff恰好落在无关字符上）。
    if (up.split(from).join(to) !== ent) continue
    const k = `${from}\u0000${to}`
    const rec = byPair.get(k) || { from, to, n: 0 }
    rec.n++
    byPair.set(k, rec)
  }
  let learned = [...byPair.values()].filter((t) => t.n >= MIN_TERM_FREQ).sort((a, b) => b.n - a.n)
  // 互斥剔除：两条术语的 from 互相包含却指向不同的 to 时，保留频次最高的那条，其余标记为待人工。
  // 实测出现过 "WeKnora "→"平台" 与 "WeKnora"→"Agentic" 同时候选 —— 先后应用会互相污染。
  const kept = []
  const dropped = []
  for (const t of learned) {
    const conflict = kept.find((k) => k.from.includes(t.from) || t.from.includes(k.from))
    if (conflict && conflict.to !== t.to) {
      dropped.push(t)
      continue
    }
    kept.push(t)
  }
  if (dropped.length) {
    console.log('  术语互斥剔除（保留频次更高的那条，其余需人工判断）：')
    for (const d of dropped) console.log(`    · "${d.from}" → "${d.to}" (${d.n}×)`)
  }
  return kept
}

function collectFiles() {
  const list = execFileSync('git', ['ls-tree', '-r', '--name-only', `${UP_REV}`, UP_DIR], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  })
    .split('\n')
    .filter(Boolean)
  return list
    .filter((p) => p.endsWith('.md'))
    .map((p) => ({ rel: p.slice(UP_DIR.length + 1), upPath: p }))
    .filter((f) => {
      if (ONLY_FILE && f.rel !== ONLY_FILE) return false
      return fs.existsSync(path.join(ROOT, ENT_DIR, f.rel))
    })
}

function loadIndex() {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error(`错误：锚点索引不存在 ${INDEX_PATH}，先跑 build。`)
    process.exit(2)
  }
  return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'))
}
function loadTerms() {
  return fs.existsSync(TERMS_PATH) ? JSON.parse(fs.readFileSync(TERMS_PATH, 'utf8')).terms : []
}

function applyEntries(text, list) {
  // 多处插入锚在同一个「上游块」上时，若每次都插在该块正后方，后插的会排到前面（顺序反转）。
  // 实测代价：代码块、整节内容前后颠倒。这里给锚点做累加——每次插入后锚点变成「已插入的内容」。
  const anchorState = new Map()
  for (const e of list) {
    if (e.type === 'replace') {
      if (!text.includes(e.upstream)) continue
      text = replaceFirst(text, e.upstream, e.enterprise)
    } else if (e.type === 'delete') {
      if (!text.includes(e.upstream)) continue
      text = replaceFirst(text, e.upstream, '')
    } else if (e.type === 'insert') {
      if (text.includes(e.enterprise)) continue
      if (!e.anchorAfter) {
        text = `${e.enterprise}\n\n${text}`
        continue
      }
      const cur = anchorState.get(e.anchorAfter) || e.anchorAfter
      if (!text.includes(cur)) continue
      const next = `${cur}\n\n${e.enterprise}`
      text = replaceFirst(text, cur, next)
      anchorState.set(e.anchorAfter, next)
    }
  }
  return text
}

/** 用「上游 + 术语 + 锚点条目」重算目标文件内容（内存里，不落盘） */
function reconstruct(upRaw, terms, fileEntries) {
  let text = applyTerms(upRaw, terms)
  text = applyEntries(text, fileEntries)
  // 删除/清空块会留下连续空行，收敛成单个空行（与企业现文的排版习惯一致）
  return text.split('\n').filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n')
}

// ==================== build ====================
if (CMD === 'build') {
  const files = collectFiles()
  let terms = loadTerms()
  const entries = []
  let scanned = 0
  // 第一遍：先判定每个文件的结构对齐度，把「企业整篇重写」的挑出去，只对能做到锚点的
  // 文件做 Learn —— 否则重写的那批会污染术语表（它们不是术语问题，是结构问题）。
  const classified = []
  for (const f of files) {
    const upRaw = gshow(UP_REV, f.upPath)
    const entRaw = fs.readFileSync(path.join(ROOT, ENT_DIR, f.rel), 'utf8')
    if (upRaw == null) continue
    const upB = parseBlocks(applyTerms(upRaw, terms))
    const entB = parseBlocks(entRaw)
    const ratio = structureRatio(upB, entB)
    classified.push({ ...f, upRaw, entRaw, upB, entB, ratio })
  }
  const alignedFiles = classified.filter((f) => f.ratio >= MIN_RATIO)
  const rewritten = classified.filter((f) => f.ratio < MIN_RATIO)

  if (LEARN) {
    const pairs = []
    for (const f of alignedFiles) {
      const upMap = new Map(f.upB.map((b) => [b.key, b.text]))
      for (const b of f.entB) if (upMap.has(b.key)) pairs.push({ up: upMap.get(b.key), ent: b.text })
    }
    const learned = learnTerms(pairs)
    if (learned.length) {
      fs.writeFileSync(
        TERMS_PATH,
        JSON.stringify({ note: 'Learn 生成，人工确认后再用于 build', terms: learned }, null, 2) + '\n',
        'utf8',
      )
      console.log(`Learn 到 ${learned.length} 条术语 → ${TERMS_PATH}`)
      for (const t of learned.slice(0, 12)) console.log(`   ${String(t.n).padStart(3)}× "${t.from}" → "${t.to}"`)
      terms = learned
      // 术语变了，重算一遍 upstream 侧
      for (const f of alignedFiles) f.upB = parseBlocks(applyTerms(f.upRaw, terms))
    } else {
      console.log('Learn：没有满足门槛的术语（可能已经是干净的定制差异）')
    }
  }

  for (const f of alignedFiles) {
    const upBlocks = f.upB
    const entBlocks = f.entB
    const ops = alignBlocks(upBlocks, entBlocks)
    let lastUp = null // 上一个「两边都有」的上游块，用于给 insert 做内容锚点
    for (const op of ops) {
      if (op.type === 'same') {
        const upB = upBlocks[op.i]
        const entB = entBlocks[op.j]
        lastUp = upB
        if (upB.text !== entB.text) {
          entries.push({
            file: f.rel,
            anchor: upB.key,
            headingPath: upB.headingPath,
            type: 'replace',
            upstream: upB.text,
            enterprise: entB.text,
          })
        }
        continue
      }
      if (op.type === 'del') {
        const upB = upBlocks[op.i]
        entries.push({
          file: f.rel,
          anchor: upB.key,
          headingPath: upB.headingPath,
          type: 'delete',
          upstream: upB.text,
          enterprise: '',
        })
        continue
      }
      const entB = entBlocks[op.j]
      entries.push({
        file: f.rel,
        anchor: entB.key,
        anchorAfter: lastUp ? lastUp.text : '',
        headingPath: entB.headingPath,
        type: 'insert',
        upstream: '',
        enterprise: entB.text,
      })
    }
  }
  scanned = alignedFiles.length
  const idx = {
    upstreamRev: UP_REV,
    termsUsed: terms.length,
    generatedBy: 'docs_anchor.mjs',
    note: '企业定制按标题路径锚点登记。replace/delete/insert 均可重放；整篇重写的文件不在此索引内',
    filesScanned: scanned,
    fileHashes: Object.fromEntries(alignedFiles.map((f) => [f.rel, sha256(f.entRaw)])),
    rewritten: rewritten.map((f) => ({ file: f.rel, structureRatio: Number(f.ratio.toFixed(2)) })),
    entries,
  }
  fs.mkdirSync(path.dirname(INDEX_PATH), { recursive: true })
  fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2) + '\n', 'utf8')
  const byType = entries.reduce((m, e) => ((m[e.type] = (m[e.type] || 0) + 1), m), {})
  console.log(`\n结构对齐 ${scanned} 篇（可用锚点），企业整篇重写 ${rewritten.length} 篇（已登记，不走锚点）`)
  if (rewritten.length) {
    console.log('  重写文件（应判为企业自有文档，不参与端口）：')
    for (const f of rewritten.slice(0, 20)) console.log(`    - ${f.rel}  对齐度 ${f.ratio.toFixed(2)}`)
  }
  console.log(`\n锚点条目 ${entries.length} 条 → ${INDEX_PATH}`)
  console.log(`  replace ${byType.replace || 0}   delete ${byType.delete || 0}   insert ${byType.insert || 0}`)
  process.exit(entries.length ? 0 : 1)
}

// ==================== verify ====================
if (CMD === 'verify') {
  const idx = loadIndex()
  const terms = loadTerms()
  const byFile = new Map()
  for (const e of idx.entries) {
    if (!byFile.has(e.file)) byFile.set(e.file, [])
    byFile.get(e.file).push(e)
  }
  let same = 0
  let diff = 0
  const diffs = []
  const passList = []
  const VERBOSE = has('--verbose')
  for (const [file, list] of byFile) {
    const upRaw = gshow(idx.upstreamRev, `${UP_DIR}/${file}`)
    const entRaw = fs.readFileSync(path.join(ROOT, ENT_DIR, file), 'utf8')
    if (upRaw == null) continue
    const rebuilt = reconstruct(upRaw, terms, list)
    if (rebuilt === entRaw) { same++; passList.push(file) }
    else {
      diff++
      diffs.push(file)
      if (ONLY_FILE) {
        const a = rebuilt.split('\n')
        const b = entRaw.split('\n')
        let shown = 0
        for (let i = 0; i < Math.max(a.length, b.length) && shown < 6; i++) {
          if (a[i] !== b[i]) {
            console.log(`   行 ${i + 1}`)
            console.log(`     重算: ${JSON.stringify((a[i] ?? '<无>').slice(0, 90))}`)
            console.log(`     现文: ${JSON.stringify((b[i] ?? '<无>').slice(0, 90))}`)
            shown++
          }
        }
      }
    }
  }
  console.log(`零落盘自检：用「上游原文 + 术语 + 锚点条目」重算，与企业现文逐字节比对`)
  console.log(`  完全一致 ${same} 篇    不一致 ${diff} 篇（共 ${byFile.size} 篇）`)
  if (VERBOSE) {
    console.log('  可精确重建的文档：')
    for (const f of passList) console.log(`    - ${f}`)
  }
  if (diffs.length) {
    console.log('  不一致的文件（多为重放顺序尚可优化的篇章，见 apply 的拒写保护）：')
    for (const f of diffs.slice(0, 15)) console.log(`    - ${f}`)
  }
  process.exit(diff ? 1 : 0)
}

// ==================== check ====================
if (CMD === 'check') {
  const idx = loadIndex()
  const byFile = new Map()
  for (const e of idx.entries) {
    if (!byFile.has(e.file)) byFile.set(e.file, [])
    byFile.get(e.file).push(e)
  }
  let ok = 0
  const drifted = []
  for (const [file, list] of byFile) {
    const cur = fs.readFileSync(path.join(ROOT, ENT_DIR, file), 'utf8')
    for (const e of list) {
      const anchorPresent = parseBlocks(cur).some((b) => b.key === e.anchor)
      const textPresent = e.upstream ? cur.includes(e.upstream) : false
      if (e.type === 'insert') continue // 插入类只看锚点是否存在
      if (textPresent) ok++
      else drifted.push({ file, anchor: e.anchor, anchorPresent, type: e.type })
    }
  }
  console.log(`锚点漂移检查（端口后应先跑 build 再跑 check）`)
  console.log(`  命中 ${ok} 条    漂移 ${drifted.length} 条`)
  for (const d of drifted.slice(0, 20)) {
    console.log(`    - [${d.type}] ${d.file}  ${d.anchor}${d.anchorPresent ? '（标题还在，内容已变）' : '（标题已消失）'}`)
  }
  process.exit(drifted.length ? 1 : 0)
}

// ==================== apply ====================
if (CMD === 'apply') {
  const idx = loadIndex()
  const terms = loadTerms()
  const byFile = new Map()
  for (const e of idx.entries) {
    if (!byFile.has(e.file)) byFile.set(e.file, [])
    byFile.get(e.file).push(e)
  }
  let written = 0
  let refused = 0
  const skipped = []
  for (const [file, list] of byFile) {
    if (ONLY_FILE && file !== ONLY_FILE) continue
    const abs = path.join(ROOT, ENT_DIR, file)
    const cur = fs.readFileSync(abs, 'utf8')
    const wantHash = idx.fileHashes?.[file]
    if (wantHash && sha256(cur) === wantHash) continue // 已经是企业版
    // 流水线必须与 reconstruct 完全一致：先跑术语表，再按锚点回填，最后收敛空行。
    // 只跑后半段会漏掉术语替换（实测端口回填后仍残留「空间」），且哈希对不上。
    let text = applyTerms(cur, terms)
    text = applyEntries(text, list)
    text = text.split('\n').filter((ln, i, a) => !(ln === '' && a[i - 1] === '')).join('\n')
    // 硬保险：重放结果必须与企业登记版本逐字节一致才落盘。
    // 否则宁可不写 —— 静默改坏文档比交给人工更糟。
    if (wantHash && sha256(text) !== wantHash) {
      refused++
      skipped.push([file, '(整文件)', '重放结果与登记的企业版不一致，已拒绝写入（该篇需人工）'])
      continue
    }
    if (text === cur) continue
    fs.writeFileSync(abs, text, 'utf8')
    written++
  }
  console.log(`回填完成：写入 ${written} 篇，拒写 ${refused} 篇，跳过 ${skipped.length} 条（需人工）`)
  for (const s of skipped.slice(0, 15)) console.log(`  · ${s[0]}  ${s[1]}  ${s[2]}`)
  console.log('下一步：跑 verify（应全部一致），再 build 文档站确认渲染正常')
  console.log('注：拒写的篇章说明其差异无法由锚点无歧义重建，需走人工或改用章节级锚点')
  process.exit(skipped.length ? 1 : 0)
}
