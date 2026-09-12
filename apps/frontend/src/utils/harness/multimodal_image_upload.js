import { MessagePlugin } from 'tdesign-vue-next'
import { multimodalApi } from '@/api/chat-work/agent'

const MAX_IMAGE_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024

export const uploadMultimodalImage = async (file) => {
  if (!file) return null

  if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
    MessagePlugin.error('图片文件过大，请选择小于10MB的图片')
    return null
  }

  if (!file.type?.startsWith('image/')) {
    MessagePlugin.error('请选择有效的图片文件')
    return null
  }

  // TDesign 没有 antd 那种按 key 复用/覆盖同一条消息的能力，
  // 这里改为持有 loading 消息的 Promise 句柄，处理完成后手动关闭再弹最终结果。
  const loadingMessage = MessagePlugin.loading('正在处理图片...', 0)

  try {
    const result = await multimodalApi.uploadImage(file)
    MessagePlugin.close(loadingMessage)

    if (!result.success) {
      MessagePlugin.error(`图片处理失败: ${result.error}`)
      return null
    }

    MessagePlugin.success({ content: '图片处理成功', duration: 2000 })

    return {
      success: true,
      imageContent: result.image_content,
      thumbnailContent: result.thumbnail_content,
      width: result.width,
      height: result.height,
      format: result.format,
      mimeType: result.mime_type || file.type,
      sizeBytes: result.size_bytes,
      originalName: file.name || result.original_filename || 'pasted-image'
    }
  } catch (error) {
    MessagePlugin.close(loadingMessage)
    console.error('图片上传失败:', error)
    MessagePlugin.error(`图片上传失败: ${error.message || '未知错误'}`)
    return null
  }
}
