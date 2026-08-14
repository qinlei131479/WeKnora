import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Landing from './Landing.vue'
import Layout from './Layout.vue'
import Screenshot from './Screenshot.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('Landing', Landing)
    app.component('Screenshot', Screenshot)
  },
} satisfies Theme
