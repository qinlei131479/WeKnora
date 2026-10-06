import { apiDelete, apiGet, apiPost, apiPut, apiRequest } from './base'

const BASE_URL = '/api/system/skills'
const USER_BASE_URL = '/api/skills'

// 技能不再支持资源分享/权限配置，统一按租户全局共享安装。
export const TENANT_GLOBAL_SHARE_CONFIG = {
  version: 2,
  read_scope: { access_level: 'global', department_ids: [], user_uids: [] },
  manage_scope: null,
}

export const listSkills = () => apiGet(BASE_URL)

export const listSkillCards = () => apiGet(USER_BASE_URL)

export const listAccessibleSkills = () => apiGet(`${USER_BASE_URL}/accessible`)

export const prepareSkillUpload = (file: File, usageSource = 'chat'): Promise<any> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('usage_source', usageSource)
  return apiPost(`${USER_BASE_URL}/import/prepare`, formData)
}

export const listRemoteSkills = (source: unknown): Promise<any> => apiPost(`${USER_BASE_URL}/remote/list`, { source })

export const prepareRemoteSkills = (payload: unknown): Promise<any> => apiPost(`${USER_BASE_URL}/remote/prepare`, payload)

export const confirmSkillInstallDraft = (draftId: string, slugs: unknown): Promise<any> =>
  apiPost(`${USER_BASE_URL}/install-drafts/${encodeURIComponent(draftId)}/confirm`, {
    share_config: TENANT_GLOBAL_SHARE_CONFIG,
    slugs,
  })

export const listSkillSandboxBoard = (): Promise<any> => apiGet(`${USER_BASE_URL}/sandbox-board`)

const sandboxSkillUrl = (configId: string, skillId = '') => {
  const base = `${USER_BASE_URL}/sandbox-configs/${encodeURIComponent(configId)}/skills`
  return skillId ? `${base}/${encodeURIComponent(skillId)}` : base
}

export const listHarnessConfigSkills = async (configId: string) => {
  const res: any = await apiGet(sandboxSkillUrl(configId))
  return { data: res?.data || [] }
}

export const patchHarnessConfigSkill = async (
  configId: string,
  skillId: string,
  payload: { enabled?: boolean; envs?: Record<string, string> },
) => {
  const res: any = await apiRequest(sandboxSkillUrl(configId, skillId), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return { data: res?.data }
}

export const stopHarnessConfigSkill = async (configId: string, skillId: string) => {
  const res: any = await apiPost(`${sandboxSkillUrl(configId, skillId)}/stop`, {})
  return { data: res?.data }
}

export const deleteHarnessConfigSkill = (configId: string, skillId: string) =>
  apiDelete(sandboxSkillUrl(configId, skillId))

export const reinstallHarnessConfigSkill = (configId: string, skillId: string) =>
  apiPost(`${sandboxSkillUrl(configId, skillId)}/reinstall`, {})

export const getHarnessConfigSkillGuidance = (configId: string, skillId: string) =>
  apiGet(`${sandboxSkillUrl(configId, skillId)}/guidance`)

export const getHarnessConfigSkillMessages = async (configId: string, skillId: string) => {
  const res: any = await apiGet(`${sandboxSkillUrl(configId, skillId)}/messages`)
  return { data: res?.data || [] }
}

export const getSkillDependencyOptions = (slug?: string) => {
  const query = slug ? `?slug=${encodeURIComponent(slug)}` : ''
  return apiGet(`${BASE_URL}/dependency-options${query}`)
}

export const getSkillTree = (slug: string) => apiGet(`${BASE_URL}/${encodeURIComponent(slug)}/tree`)

export const getSkillFile = (slug: string, path: string) =>
  apiGet(`${BASE_URL}/${encodeURIComponent(slug)}/file?path=${encodeURIComponent(path)}`)

export const createSkillFile = (slug: string, payload: unknown) =>
  apiPost(`${BASE_URL}/${encodeURIComponent(slug)}/file`, payload)

export const updateSkillFile = (slug: string, payload: unknown) =>
  apiPut(`${BASE_URL}/${encodeURIComponent(slug)}/file`, payload)

export const updateSkillDependencies = (slug: string, payload: unknown) =>
  apiPut(`${BASE_URL}/${encodeURIComponent(slug)}/dependencies`, payload)

export const updateSkillEnabled = (slug: string, enabled: boolean) =>
  apiPut(`${BASE_URL}/${encodeURIComponent(slug)}/enabled`, { enabled })

export const exportSkill = (slug: string) =>
  apiGet(`${BASE_URL}/${encodeURIComponent(slug)}/export`, {}, true, 'blob')

export const deleteSkill = (slug: string) => apiDelete(`${BASE_URL}/${encodeURIComponent(slug)}`)

export const skillApi = {
  listSkills,
  listSkillCards,
  listAccessibleSkills,
  prepareSkillUpload,
  listRemoteSkills,
  prepareRemoteSkills,
  confirmSkillInstallDraft,
  listSkillSandboxBoard,
  getSkillDependencyOptions,
  getSkillTree,
  getSkillFile,
  createSkillFile,
  updateSkillFile,
  updateSkillDependencies,
  updateSkillEnabled,
  exportSkill,
  deleteSkill,
}

export default skillApi
