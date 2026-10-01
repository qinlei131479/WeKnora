import { apiPost } from '@/api/chat-work/base'

export const userApi = {
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiPost('/api/user/upload-image', formData)
  }
}
