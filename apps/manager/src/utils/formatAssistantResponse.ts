/** 与 harness AgentResponseSanitizer.lightClean 对齐的 Unicode 轻量清理。 */

const INVISIBLE_FORMAT_CHARS = /[\u200B-\u200D\uFEFF\u00AD\u2060\uFFF9-\uFFFB]/g
const GARBLED_CHARS = /[\uFFFD\uFFFE\uFFFF\uE000-\uF8FF]/g

/** 流式阶段只清理乱码/不可见字符，禁止改动 Markdown 标题、表格、列表与换行。 */
export function lightCleanAssistantResponse(text: string): string {
  if (!text) return text ?? ''
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(GARBLED_CHARS, '')
    .replace(/\uFFFD/g, '')
    .replace(INVISIBLE_FORMAT_CHARS, '')
}
