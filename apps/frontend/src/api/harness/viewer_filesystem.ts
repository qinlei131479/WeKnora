import { apiDelete, apiGet } from '@/api/chat-work/base'

const buildQuery = (params: Record<string, unknown>) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  return query.toString()
}

const buildViewerQuery = (threadId: string, path: string) => {
  return buildQuery({
    thread_id: threadId,
    path
  })
}

export const getViewerFileSystemTree = (threadId: string, path: string = '/') => {
  const query = buildViewerQuery(threadId, path)
  return apiGet(`/api/viewer/filesystem/tree?${query}`)
}

export const getViewerFileContent = (threadId: string, path: string) => {
  const query = buildViewerQuery(threadId, path)
  return apiGet(`/api/viewer/filesystem/file?${query}`, {}, true, 'blob')
}

export const downloadViewerFile = (threadId: string, path: string) => {
  const query = buildViewerQuery(threadId, path)
  return apiGet(`/api/viewer/filesystem/download?${query}`, {}, true, 'blob')
}

export const deleteViewerFile = (threadId: string, path: string) => {
  const query = buildViewerQuery(threadId, path)
  return apiDelete(`/api/viewer/filesystem/file?${query}`)
}
