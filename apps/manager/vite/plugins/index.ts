import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteMockServe } from 'vite-plugin-mock'
import tailwindcss from '@tailwindcss/vite';

import createAutoImport from './auto-import'
import createSvgIcon from './svg-icon'
import createCompression from './compression'
import createSetupExtend from './setup-extend'
import { PluginOption } from 'vite'

export default function createVitePlugins(viteEnv: Record<string, string>, isBuild = false) {
  const vitePlugins: PluginOption[] = [vue()]
  vitePlugins.push(createAutoImport())
  vitePlugins.push(createSetupExtend())
  vitePlugins.push(createSvgIcon(isBuild))
  vitePlugins.push(vueDevTools())
  vitePlugins.push(tailwindcss())
  vitePlugins.push(viteMockServe({
    enable: !isBuild,
    mockPath: './mock',
    watchFiles: true,
    logger: true,
    cors: true
  }))
  isBuild && vitePlugins.push(...createCompression(viteEnv))
  return vitePlugins
}
