import { apiDelete, apiGet, apiPost, apiPut } from './base'

function buildQuery(params: Record<string, unknown>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  return query.toString()
}

export const getWorkspaceTree = (path = '/', recursive = false, filesOnly = false) => {
  const query = buildQuery({ path, recursive, files_only: filesOnly })
  return apiGet(`/api/workspace/tree?${query}`)
}

export const getWorkspaceFileContent = (path: string) => {
  const query = buildQuery({ path })
  return apiGet(`/api/workspace/file?${query}`, {}, true, 'blob')
}

export const getWorkspaceKnowledgeTree = (kbId: string, params: Record<string, any> = {}) => {
  const query = buildQuery({
    kb_id: kbId,
    parent_id: params.parentId,
    path_prefix: params.pathPrefix,
    page: params.page,
    page_size: params.pageSize,
    recursive: params.recursive || false,
    files_only: params.filesOnly || false,
  })
  return apiGet(`/api/workspace/knowledge/tree?${query}`)
}

export const getWorkspaceKnowledgeFileContent = (kbId: string, fileId: string) => {
  const query = buildQuery({ kb_id: kbId, file_id: fileId })
  return apiGet(`/api/workspace/knowledge/file?${query}`, {}, true, 'blob')
}

export const downloadWorkspaceKnowledgeFile = (kbId: string, fileId: string, variant = 'original') => {
  const query = buildQuery({ kb_id: kbId, file_id: fileId, variant })
  return apiGet(`/api/workspace/knowledge/download?${query}`, {}, true, 'blob')
}

export const saveWorkspaceFileContent = (path: string, content: string) => {
  return apiPut('/api/workspace/file', { path, content })
}

export const deleteWorkspacePath = (path: string) => {
  const query = buildQuery({ path })
  return apiDelete(`/api/workspace/file?${query}`)
}

export const createWorkspaceDirectory = (parentPath: string, name: string) => {
  return apiPost('/api/workspace/directory', {
    parent_path: parentPath,
    name,
  })
}

export const uploadWorkspaceFiles = (parentPath: string, files: File[]) => {
  const formData = new FormData()
  formData.append('parent_path', parentPath)
  files.forEach((file) => formData.append('files', file))
  return apiPost('/api/workspace/upload', formData)
}

export const downloadWorkspaceFile = (path: string) => {
  const query = buildQuery({ path })
  return apiGet(`/api/workspace/download?${query}`, {}, true, 'blob')
}
