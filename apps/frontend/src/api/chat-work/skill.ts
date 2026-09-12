import { apiDelete, apiGet, apiPost, apiPut } from './base'

const BASE_URL = '/api/system/skills'
const USER_BASE_URL = '/api/skills'

// 技能不再支持资源分享/权限配置，统一按租户全局共享安装。
export const TENANT_GLOBAL_SHARE_CONFIG = {
  version: 2,
  read_scope: { access_level: 'global', department_ids: [], user_uids: [] },
  manage_scope: null,
}

export const listSkills = () => apiGet(BASE_URL)

export const listSkillCards = ({ refreshPersonal = false } = {}) => {
  const query = refreshPersonal ? '?refresh_personal=true' : ''
  return apiGet(`${USER_BASE_URL}${query}`)
}

export const listAccessibleSkills = () => apiGet(`${USER_BASE_URL}/accessible`)

export const prepareSkillUpload = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return apiPost(`${USER_BASE_URL}/import/prepare`, formData)
}

export const listRemoteSkills = (source: unknown) => apiPost(`${USER_BASE_URL}/remote/list`, { source })

export const prepareRemoteSkills = (payload: unknown) => apiPost(`${USER_BASE_URL}/remote/prepare`, payload)

export const searchRemoteSkills = (query: string) => apiPost(`${USER_BASE_URL}/remote/search`, { query })

export const confirmSkillInstallDraft = (draftId: string, slugs: unknown) =>
  apiPost(`${USER_BASE_URL}/install-drafts/${encodeURIComponent(draftId)}/confirm`, {
    share_config: TENANT_GLOBAL_SHARE_CONFIG,
    slugs,
  })

export const discardSkillInstallDraft = (draftId: string) =>
  apiDelete(`${USER_BASE_URL}/install-drafts/${encodeURIComponent(draftId)}`)

export const getSkillDependencyOptions = (slug?: string) => {
  const query = slug ? `?slug=${encodeURIComponent(slug)}` : ''
  return apiGet(`${BASE_URL}/dependency-options${query}`)
}

export const getSkillTree = (slug: string) => apiGet(`${BASE_URL}/${encodeURIComponent(slug)}/tree`)

export const getSkillFile = (slug: string, path: string) =>
  apiGet(`${BASE_URL}/${encodeURIComponent(slug)}/file?path=${encodeURIComponent(path)}`)

export const getPersonalSkillFile = (slug: string, path: string) =>
  apiGet(`${USER_BASE_URL}/personal/${encodeURIComponent(slug)}/file?path=${encodeURIComponent(path)}`)

export const createSkillFile = (slug: string, payload: unknown) =>
  apiPost(`${BASE_URL}/${encodeURIComponent(slug)}/file`, payload)

export const updateSkillFile = (slug: string, payload: unknown) =>
  apiPut(`${BASE_URL}/${encodeURIComponent(slug)}/file`, payload)

export const updateSkillDependencies = (slug: string, payload: unknown) =>
  apiPut(`${BASE_URL}/${encodeURIComponent(slug)}/dependencies`, payload)

export const updateSkillEnabled = (slug: string, enabled: boolean) =>
  apiPut(`${BASE_URL}/${encodeURIComponent(slug)}/enabled`, { enabled })

export const deleteSkillFile = (slug: string, path: string) =>
  apiDelete(`${BASE_URL}/${encodeURIComponent(slug)}/file?path=${encodeURIComponent(path)}`)

export const exportSkill = (slug: string) =>
  apiGet(`${BASE_URL}/${encodeURIComponent(slug)}/export`, {}, true, 'blob')

export const deleteSkill = (slug: string) => apiDelete(`${BASE_URL}/${encodeURIComponent(slug)}`)

export const deletePersonalSkill = (slug: string) =>
  apiDelete(`${USER_BASE_URL}/personal/${encodeURIComponent(slug)}`)

export const deleteSkillsBatch = (slugs: unknown) => apiPost(`${BASE_URL}/delete-batch`, { slugs })

export const skillApi = {
  listSkills,
  listSkillCards,
  listAccessibleSkills,
  prepareSkillUpload,
  listRemoteSkills,
  prepareRemoteSkills,
  searchRemoteSkills,
  confirmSkillInstallDraft,
  discardSkillInstallDraft,
  getSkillDependencyOptions,
  getSkillTree,
  getSkillFile,
  getPersonalSkillFile,
  createSkillFile,
  updateSkillFile,
  updateSkillDependencies,
  updateSkillEnabled,
  deleteSkillFile,
  exportSkill,
  deleteSkill,
  deletePersonalSkill,
  deleteSkillsBatch,
}

export default skillApi
