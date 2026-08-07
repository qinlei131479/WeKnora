/**
 * 侧栏可折叠分组最多同时展开 MAX_OPEN 个。
 *
 * 崩溃根因（旧实现）：
 * while + element.click() 关闭「最远」分组时，若该组含当前页，
 * VitePress watchPostEffect 会立刻把 collapsed 强制设回 false，
 * open.length 永不下降 → 同步死循环拖垮标签页。
 *
 * 修复：不关 has-active；关失败则跳过；程序化点击抑制重入；迭代硬上限。
 */

const MAX_OPEN = 2

let ignoreClicks = false
let bound = false
let scheduled = false

function getGroups(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '#VPSidebarNav .VPSidebarItem.level-0.collapsible',
    ),
  )
}

function isOpen(el: HTMLElement): boolean {
  return !el.classList.contains('collapsed')
}

function isActiveGroup(el: HTMLElement): boolean {
  return el.classList.contains('has-active') || el.classList.contains('is-active')
}

/** @returns 是否已成功折叠 */
function collapseGroup(el: HTMLElement): boolean {
  if (!isOpen(el) || isActiveGroup(el)) return false

  const caret = el.querySelector<HTMLElement>(':scope > .item > .caret')
  const item = el.querySelector<HTMLElement>(':scope > .item')
  const trigger = caret || item
  if (!trigger) return false

  ignoreClicks = true
  try {
    trigger.click()
  } finally {
    ignoreClicks = false
  }

  return !isOpen(el)
}

function pickFarthest(
  groups: HTMLElement[],
  open: HTMLElement[],
  anchor: HTMLElement,
  skip: Set<HTMLElement>,
): HTMLElement | undefined {
  const anchorIndex = groups.indexOf(anchor)
  let farthest: HTMLElement | undefined
  let maxDist = -1

  for (const g of open) {
    if (g === anchor || isActiveGroup(g) || skip.has(g)) continue
    const dist = Math.abs(groups.indexOf(g) - anchorIndex)
    if (dist > maxDist) {
      maxDist = dist
      farthest = g
    }
  }
  return farthest
}

export function enforceSidebarMaxOpen(preferKeep?: HTMLElement | null): void {
  const groups = getGroups()
  if (groups.length <= MAX_OPEN) return

  let open = groups.filter(isOpen)
  if (open.length <= MAX_OPEN) return

  let anchor = preferKeep && open.includes(preferKeep) ? preferKeep : undefined
  if (!anchor) anchor = open.find(isActiveGroup)
  if (!anchor) anchor = open[open.length - 1]

  const skip = new Set<HTMLElement>()
  const maxAttempts = groups.length + 2

  for (let i = 0; i < maxAttempts && open.length > MAX_OPEN; i++) {
    const farthest = pickFarthest(groups, open, anchor, skip)
    if (!farthest) break

    if (!collapseGroup(farthest)) {
      skip.add(farthest)
      continue
    }
    open = groups.filter(isOpen)
  }
}

function scheduleEnforce(preferKeep?: HTMLElement | null): void {
  if (scheduled || ignoreClicks) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    if (preferKeep && !isOpen(preferKeep)) return
    enforceSidebarMaxOpen(preferKeep)
  })
}

/** 是否点击在一级分组标题行（非子项链接） */
function isGroupHeaderClick(target: Element): boolean {
  const group = target.closest('.VPSidebarItem.level-0.collapsible') as HTMLElement | null
  if (!group) return false

  const header = group.querySelector(':scope > .item')
  if (!header?.contains(target)) return false

  // 标题行内的链接仍算折叠交互区域之外的导航时：若点的是 link 且分组本身有 link，交给默认行为
  // 无 link 的分组点整行都会 toggle，需要约束
  return true
}

export function bindSidebarAccordion(): void {
  if (bound || typeof document === 'undefined') return
  bound = true

  document.addEventListener(
    'click',
    (e) => {
      if (ignoreClicks) return
      const target = e.target as Element | null
      if (!target || !isGroupHeaderClick(target)) return

      const group = target.closest(
        '.VPSidebarItem.level-0.collapsible',
      ) as HTMLElement
      scheduleEnforce(group)
    },
    false,
  )
}
