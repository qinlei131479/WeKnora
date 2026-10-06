import { onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Keep a chat pinned to the bottom when asynchronously rendered content grows.
 *
 * Streaming text already requests scrolling when chunks arrive, but images,
 * Mermaid diagrams, and other rich content can change height later. Observe the
 * content wrapper and scroll viewport so delayed content, drawer resizing, and
 * composer height changes share the same behavior.
 * A user who has intentionally scrolled up is never pulled back down.
 */
export function useStickyBottomOnResize(
  scrollContainer: Ref<HTMLElement | null>,
  userHasScrolledUp: Ref<boolean>,
  contentElement?: Ref<HTMLElement | null>,
): void {
  let resizeObserver: ResizeObserver | null = null

  const followResize = () => {
    if (userHasScrolledUp.value) return
    const container = scrollContainer.value
    if (!container) return

    // ResizeObserver runs after layout, before paint. Deferring to rAF here
    // paints one frame with a trailing steer bubble displaced by the growing
    // answer, then snaps it back on the next frame. Correct the scroll offset
    // now; changing scrollTop does not resize the observed content wrapper.
    container.scrollTop = container.scrollHeight
  }

  onMounted(() => {
    const container = scrollContainer.value
    if (!container || typeof ResizeObserver === 'undefined') return
    // 企业定制：调用方可显式传入内容元素，否则退回容器首个子元素
    const messageList = contentElement?.value ?? container.firstElementChild

    resizeObserver = new ResizeObserver(followResize)
    resizeObserver.observe(container)
    if (messageList) resizeObserver.observe(messageList)
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })
}
