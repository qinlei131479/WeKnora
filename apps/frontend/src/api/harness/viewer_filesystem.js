import { apiDelete, apiGet } from './base'

const buildQuery = (params) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  return query.toString()
}

const buildViewerQuery = (threadId, path) => {
  return buildQuery({
    thread_id: threadId,
    path
  })
}

export const getViewerFileSystemTree = (threadId, path = '/') => {
  const query = buildViewerQuery(threadId, path)
  return apiGet(`/api/viewer/filesystem/tree?${query}`)
}

export const getViewerFileContent = (threadId, path) => {
  const query = buildViewerQuery(threadId, path)
  return apiGet(`/api/viewer/filesystem/file?${query}`, {}, true, 'blob')
}

export const downloadViewerFile = (threadId, path) => {
  const query = buildViewerQuery(threadId, path)
  return apiGet(`/api/viewer/filesystem/download?${query}`, {}, true, 'blob')
}

export const deleteViewerFile = (threadId, path) => {
  const query = buildViewerQuery(threadId, path)
  return apiDelete(`/api/viewer/filesystem/file?${query}`)
}
