import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'
import mediumZoom, { type Zoom } from 'medium-zoom'
import { nextTick, onMounted, watch } from 'vue'
import {
  bindSidebarAccordion,
  enforceSidebarMaxOpen,
} from './sidebarAccordion'
import './custom.css'

let zoom: Zoom | undefined

function refreshZoom() {
  const images = document.querySelectorAll<HTMLElement>('.vp-doc img')
  if (!zoom) {
    zoom = mediumZoom({
      background: 'rgba(0, 0, 0, 0.78)',
      margin: 24,
    })
  }
  zoom.detach()
  if (images.length) {
    zoom.attach(images)
  }
}

export default {
  extends: DefaultTheme,
  setup() {
    const route = useRoute()
    onMounted(() => {
      bindSidebarAccordion()
      refreshZoom()
      nextTick(() => enforceSidebarMaxOpen())
    })
    watch(
      () => route.path,
      () =>
        nextTick(() => {
          refreshZoom()
          // 路由切换后 VitePress 会展开当前分组，再压回最多 2 个
          enforceSidebarMaxOpen()
        }),
    )
  },
} satisfies Theme
