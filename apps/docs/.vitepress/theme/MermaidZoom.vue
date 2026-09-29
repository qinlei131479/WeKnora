<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useData } from 'vitepress'

const MIN = 0.3
const MAX = 8
const { isDark } = useData()

const open = ref(false)
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const stage = ref<HTMLElement>()

let dragging = false
let originX = 0
let originY = 0

function reset() {
  scale.value = 1
  tx.value = 0
  ty.value = 0
}

function close() {
  open.value = false
  document.documentElement.style.removeProperty('overflow')
}

async function prepareStage() {
  reset()
  open.value = true
  document.documentElement.style.overflow = 'hidden'
  await nextTick()
  const host = stage.value
  if (!host) return null
  host.replaceChildren()
  return host
}

async function showSvg(source: SVGElement) {
  const host = await prepareStage()
  if (!host) return

  // mermaid 的 svg 内联样式以 #id 作用域，且插件会对同 id 元素重新渲染，
  // 因此副本必须换一个 id 并同步改写内部样式表
  const clone = source.cloneNode(true) as SVGElement
  const oldId = source.id
  if (oldId) {
    const newId = `${oldId}-zoom`
    clone.id = newId
    clone.querySelectorAll('style').forEach((s) => {
      s.textContent = (s.textContent ?? '').split(`#${oldId}`).join(`#${newId}`)
    })
  }
  clone.removeAttribute('width')
  clone.removeAttribute('height')
  clone.style.maxWidth = 'none'
  clone.style.width = '100%'
  clone.style.height = '100%'
  host.appendChild(clone)
}

async function showImage(src: string, alt = '') {
  const host = await prepareStage()
  if (!host) return
  const img = document.createElement('img')
  img.src = src
  img.alt = alt
  img.draggable = false
  img.className = 'zoom-img'
  host.appendChild(img)
}

function isZoomableImage(el: Element | null): el is HTMLImageElement {
  if (!(el instanceof HTMLImageElement)) return false
  if (!el.src || el.closest('a')) return false
  if (el.classList.contains('wk-shot-img')) return true
  if (el.closest('.vp-doc') && !el.closest('.VPNav, .VPSidebar, button, .copy')) return true
  return false
}

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  if (!target || open.value) return

  const mermaid = target.closest?.('.vp-doc .mermaid')
  if (mermaid) {
    const svg = mermaid.querySelector('svg')
    if (svg) {
      e.preventDefault()
      showSvg(svg as SVGElement)
    }
    return
  }

  const shot = target.closest?.('.wk-shot-frame')
  if (shot) {
    const img = shot.querySelector('img.wk-shot-img') as HTMLImageElement | null
    if (img?.src) {
      e.preventDefault()
      showImage(img.currentSrc || img.src, img.alt)
    }
    return
  }

  const img = target.closest?.('img')
  if (isZoomableImage(img)) {
    e.preventDefault()
    showImage(img.currentSrc || img.src, img.alt)
  }
}

function onKey(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') close()
  if (e.key === '0') reset()
  if (e.key === '+' || e.key === '=') zoomBy(1.35)
  if (e.key === '-' || e.key === '_') zoomBy(1 / 1.35)
}

function zoomBy(factor: number) {
  scale.value = Math.min(MAX, Math.max(MIN, scale.value * factor))
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12)
}

function onDown(e: MouseEvent) {
  dragging = true
  originX = e.clientX - tx.value
  originY = e.clientY - ty.value
}

function onMove(e: MouseEvent) {
  if (!dragging) return
  tx.value = e.clientX - originX
  ty.value = e.clientY - originY
}

function onUp() {
  dragging = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onUp)
  document.documentElement.style.removeProperty('overflow')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="zoom-fade">
      <div v-if="open" class="zoom" :class="{ 'is-dark': isDark }" @wheel="onWheel" @mousedown.self="close">
        <div
          ref="stage"
          class="zoom-stage"
          :style="{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }"
          @mousedown.stop="onDown"
        />

        <div class="zoom-bar" @mousedown.stop>
          <button type="button" title="缩小" @click="zoomBy(1 / 1.35)">−</button>
          <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
          <button type="button" title="放大" @click="zoomBy(1.35)">+</button>
          <span class="zoom-sep" />
          <button type="button" class="zoom-word" @click="reset">重置</button>
          <button type="button" class="zoom-word" @click="close">关闭</button>
        </div>

        <p class="zoom-hint">滚轮缩放 · 拖拽平移 · Esc 关闭</p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.zoom {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(29, 29, 31, 0.88);
  backdrop-filter: saturate(140%) blur(20px);
  -webkit-backdrop-filter: saturate(140%) blur(20px);
  cursor: zoom-out;
  overscroll-behavior: contain;
}

.zoom-stage {
  width: min(1400px, 92vw);
  height: 84vh;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  transform-origin: center center;
}

.zoom-stage:active {
  cursor: grabbing;
}

.zoom-stage :deep(.zoom-img),
.zoom-stage :deep(svg) {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  border-radius: 8px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

/* 图的字色跟当前外观走：浅色是黑字，深色是浅字。放大层遮罩始终是深的，
   透明区域会透出底色。底板要与正文里的图一致，两种模式分开铺。
   不要加 padding，否则会裁掉超出视口的节点。 */
.zoom-stage :deep(svg) {
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.55), transparent 55%),
    linear-gradient(180deg, #ececf1 0%, #e3e3e8 100%);
}

.zoom.is-dark .zoom-stage :deep(svg) {
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.04), transparent 55%),
    linear-gradient(180deg, #2c2c2e 0%, #1d1d1f 100%);
}

.zoom-bar {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 980px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  cursor: default;
}

.zoom-bar button {
  min-width: 32px;
  height: 30px;
  padding: 0 10px;
  border-radius: 980px;
  font-size: 15px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.88);
  transition: background-color 0.18s ease, color 0.18s ease;
}

.zoom-bar button:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.zoom-word {
  font-size: 12.5px !important;
}

.zoom-level {
  min-width: 48px;
  text-align: center;
  font-family: var(--wk-font-mono);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.62);
}

.zoom-sep {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.18);
}

.zoom-hint {
  position: fixed;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.55);
}

.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: opacity 0.2s ease;
}

.zoom-fade-enter-from,
.zoom-fade-leave-to {
  opacity: 0;
}
</style>
