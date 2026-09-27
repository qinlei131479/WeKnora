import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite';

import createAutoImport from './auto-import'
import createSvgIcon from './svg-icon'
import createCompression from './compression'
import createSetupExtend from './setup-extend'
import { PluginOption } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default function createVitePlugins(viteEnv: Record<string, string>, isBuild = false) {
  const vitePlugins: PluginOption[] = [vue()]
  // 旧版浏览器提示页不能运行 Vue，直接注入全局资源，开发与构建使用相同文案。
  const localizeBrowserNotice = (html: string) => {
    const messages = Object.fromEntries(['zh-CN', 'en-US'].map(locale => [
      locale,
      JSON.parse(readFileSync(resolve('src/i18n/messages', locale + '.json'), 'utf8')).plugins.browser
    ]))
    return html.replace('/* __BROWSER_MESSAGES__ */ {}', () => JSON.stringify(messages).replace(/</g, '\\u003c'))
  }
  vitePlugins.push({
    name: 'manager-browser-notice-i18n',
    transformIndexHtml(html, context) {
      return context.path === '/html/ie.html' ? localizeBrowserNotice(html) : html
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'html/ie.html',
        source: localizeBrowserNotice(readFileSync(resolve('html/ie.html'), 'utf8'))
      })
    }
  })
  vitePlugins.push(createAutoImport())
  vitePlugins.push(createSetupExtend())
  vitePlugins.push(createSvgIcon(isBuild))
  vitePlugins.push(vueDevTools())
  vitePlugins.push(tailwindcss())
  isBuild && vitePlugins.push(...createCompression(viteEnv))
  return vitePlugins
}
