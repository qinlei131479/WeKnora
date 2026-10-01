/**
 * Chunk 工具函数
 */

export const DEFAULT_CHUNK_PRESET_ID = 'general'

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export const buildChunkParserConfigPayload = (
  source: unknown,
  { includeSizeOverlap = true }: { includeSizeOverlap?: boolean } = {}
): Record<string, unknown> => {
  if (!isPlainObject(source)) {
    return {}
  }

  const config: Record<string, unknown> = {}
  if (includeSizeOverlap) {
    if (source.chunk_token_num !== undefined && source.chunk_token_num !== null) {
      config.chunk_token_num = source.chunk_token_num
    }
    if (source.overlapped_percent !== undefined && source.overlapped_percent !== null) {
      config.overlapped_percent = source.overlapped_percent
    }
  }
  if (source.delimiter) {
    config.delimiter = source.delimiter
  }

  return config
}

export const buildChunkParamsPayload = (
  source: unknown,
  options: { includeSizeOverlap?: boolean } = {}
): Record<string, unknown> => {
  if (!isPlainObject(source)) {
    return {}
  }

  const payload: Record<string, unknown> = {}
  const chunkParserConfig = buildChunkParserConfigPayload(source.chunk_parser_config, options)
  if (Object.keys(chunkParserConfig).length > 0) {
    payload.chunk_parser_config = chunkParserConfig
  }
  if (source.chunk_preset_id) {
    payload.chunk_preset_id = source.chunk_preset_id
  }

  return payload
}

/**
 * 查找两个字符串的重叠部分
 * @param {string} str1 - 第一个字符串
 * @param {string} str2 - 第二个字符串
 * @returns {string} - 重叠部分的内容
 */
export function findOverlap(str1: string, str2: string): string {
  if (!str1 || !str2) return ''

  const maxOverlap = Math.min(str1.length, str2.length)
  let overlap = ''

  // 从最长可能的重叠开始检查
  for (let i = maxOverlap; i > 10; i--) {
    const endStr1 = str1.slice(-i)
    const startStr2 = str2.slice(0, i)

    if (endStr1 === startStr2) {
      overlap = endStr1
      break
    }
  }

  return overlap
}

/**
 * 合并chunks并处理重叠内容
 * @param {Array} chunks - chunk数组，每个chunk包含id, content, chunk_order_index
 * @returns {Object} - 合并结果，包含content和chunks数组
 */
interface ChunkInput {
  content: string
  chunk_order_index: number
  [key: string]: unknown
}

interface MergedChunk extends ChunkInput {
  startOffset: number
  endOffset: number
}

export function mergeChunks(chunks: ChunkInput[]): { content: string; chunks: MergedChunk[] } {
  if (!chunks || chunks.length === 0) {
    return { content: '', chunks: [] }
  }

  // 按order排序
  const sorted = [...chunks].sort((a, b) => a.chunk_order_index - b.chunk_order_index)
  const merged: MergedChunk[] = []
  let currentContent = ''

  for (let i = 0; i < sorted.length; i++) {
    const chunk = sorted[i]
    const content = chunk.content

    if (i === 0) {
      // 第一个chunk直接添加
      currentContent = content
      merged.push({
        ...chunk,
        startOffset: 0,
        endOffset: content.length
      })
    } else {
      // 查找重叠部分
      const overlap = findOverlap(currentContent, content)
      const newContent = content.slice(overlap.length)

      if (newContent.length > 0) {
        const startOffset = currentContent.length
        if (overlap.length > 0) {
          currentContent += newContent
        } else {
          currentContent += `\n${newContent}`
        }
        merged.push({
          ...chunk,
          startOffset,
          endOffset: currentContent.length
        })
      }
    }
  }

  return { content: currentContent, chunks: merged }
}

/**
 * 将文本分割成段落
 * @param {string} content - 文本内容
 * @returns {Array} - 段落数组
 */
export function splitIntoParagraphs(content: string): string[] {
  if (!content) return []

  // 按换行符分割，保留空段落
  return content.split(/\n\n+/).filter((para) => para.trim() !== '')
}

/**
 * 为每个段落找到对应的chunk
 * @param {Array} paragraphs - 段落数组
 * @param {Array} mappedChunks - 映射后的chunks
 * @returns {Array} - 包含chunk信息的段落
 */
export function mapParagraphsToChunks(
  paragraphs: string[],
  mappedChunks: MergedChunk[]
): Array<{ content: string; chunk: MergedChunk; startOffset: number; endOffset: number }> {
  if (!paragraphs || !mappedChunks) return []

  let currentOffset = 0
  return paragraphs.map((paragraph) => {
    const paragraphLength = paragraph.length + 2 // +2 for the \n\n

    // 找到包含此位置的chunk
    const chunk =
      mappedChunks.find(
        (chunk) => currentOffset >= chunk.startOffset && currentOffset < chunk.endOffset
      ) || mappedChunks[0]

    const result = {
      content: paragraph,
      chunk,
      startOffset: currentOffset,
      endOffset: currentOffset + paragraphLength
    }

    currentOffset += paragraphLength
    return result
  })
}

/**
 * 获取chunk的预览文本
 * @param {string} content - chunk内容
 * @param {number} maxLength - 最大长度
 * @returns {string} - 预览文本
 */
export function getChunkPreview(content: string, maxLength = 100): string {
  if (!content) return ''

  const text = content.replace(/\n+/g, ' ').trim()
  if (text.length <= maxLength) return text

  return text.slice(0, maxLength) + '...'
}
