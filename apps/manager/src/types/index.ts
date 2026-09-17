/**
 * 类型统一导出
 */

export * from "./api";

declare module 'vue' {
  interface ComponentCustomProperties {
    $dim: typeof import('@/i18n').dim;
    parseTime: typeof import('@/utils/ruoyi').parseTime;
  }
}
