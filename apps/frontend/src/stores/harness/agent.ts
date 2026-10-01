import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { agentApi } from '@/api/chat-work/agent'
import { listKnowledgeBases } from '@/api/knowledge-base'
import { mcpApi } from '@/api/chat-work/mcp'
import { skillApi } from '@/api/chat-work/skill'
import { isDefaultAllAgentResourceKind } from '@/utils/harness/agentConfigUtils'
import { handleChatError } from '@/utils/harness/errorHandler'

interface AgentConfigOption {
  id?: string
  name?: string
  [key: string]: unknown
}

interface AgentConfigItem {
  kind?: string
  type?: string
  default?: unknown
  options?: AgentConfigOption[]
  x_oap_ui_config?: Record<string, unknown>
  [key: string]: unknown
}

interface Agent {
  id: string
  agent_id?: string
  slug?: string
  name?: string
  is_builtin?: boolean
  is_subagent?: boolean
  config_json?: Record<string, unknown>
  configurable_items?: Record<string, AgentConfigItem>
  [key: string]: unknown
}

function normalizeAgent(agent: Agent): Agent {
  const agentId = agent?.agent_id || agent?.slug || agent?.id
  return agentId
    ? { ...agent, id: agentId, agent_id: agentId, slug: agent?.slug || agentId }
    : agent
}

export const BUILTIN_AGENT_ID = 'default-chatbot'

export function isBuiltinAgent(agent: Agent | null | undefined): boolean {
  return agent?.is_builtin || agent?.id === BUILTIN_AGENT_ID || agent?.slug === BUILTIN_AGENT_ID
}

function sortAgents(agents: Agent[]): Agent[] {
  return [...agents].sort((a, b) => {
    if (isBuiltinAgent(a) !== isBuiltinAgent(b)) return isBuiltinAgent(a) ? -1 : 1
    return String(a.name || a.id).localeCompare(String(b.name || b.id), 'zh-CN')
  })
}

function getPreferredAgentId(agents: Agent[], persistedId?: string | null): string | null {
  const chatAgents = agents.filter((agent) => !agent.is_subagent)
  if (persistedId && chatAgents.some((agent) => agent.id === persistedId)) return persistedId
  return chatAgents.find(isBuiltinAgent)?.id || chatAgents[0]?.id || null
}

function extractContext(agent: Agent | null | undefined): Record<string, unknown> {
  const configJson = (agent?.config_json || {}) as Record<string, unknown>
  return { ...((configJson.context || configJson || {}) as Record<string, unknown>) }
}

export const useAgentStore = defineStore(
  'agent',
  () => {
    const agents = ref<Agent[]>([])
    const selectedAgentId = ref<string | null>(null)

    const availableKnowledgeBases = ref<Record<string, unknown>[]>([])
    const availableMcps = ref<Record<string, unknown>[]>([])
    const availableSkills = ref<Record<string, unknown>[]>([])

    const agentConfig = ref<Record<string, unknown>>({})
    const originalAgentConfig = ref<Record<string, unknown>>({})
    const agentDetails = ref<Record<string, Agent>>({})

    const isLoadingAgents = ref(false)
    const isLoadingConfig = ref(false)
    const isLoadingAgentDetail = ref(false)
    const error = ref<string | null>(null)
    const isInitialized = ref(false)
    const isInitializing = ref(false)

    const selectedAgent = computed<Agent | null>(() => {
      const agentId = selectedAgentId.value
      return agentId
        ? agentDetails.value[agentId] || agents.value.find((a) => a.id === agentId) || null
        : null
    })

    const agentsList = computed(() => agents.value)

    const configurableItems = computed<Record<string, AgentConfigItem>>(() => {
      const items: Record<string, AgentConfigItem> = { ...(selectedAgent.value?.configurable_items || {}) }
      Object.keys(items).forEach((key) => {
        const item = items[key]
        if (item?.x_oap_ui_config) {
          items[key] = { ...item, ...item.x_oap_ui_config }
          delete items[key].x_oap_ui_config
        }
      })
      return items
    })

    const availableTools = computed<AgentConfigOption[]>(
      () => configurableItems.value.tools?.options || []
    )
    const hasConfigChanges = computed(
      () => JSON.stringify(agentConfig.value) !== JSON.stringify(originalAgentConfig.value)
    )

    async function fetchMentionResources() {
      try {
        const [dbsRes, mcpsRes, skillsRes] = await Promise.all([
          listKnowledgeBases().catch(() => ({ data: [] })),
          mcpApi.getMcpServers().catch(() => ({ data: [] })),
          skillApi.listAccessibleSkills().catch(() => ({ data: [] }))
        ])
        availableKnowledgeBases.value = Array.isArray(dbsRes?.data) ? dbsRes.data : []
        availableMcps.value = (mcpsRes as { data?: Record<string, unknown>[] }).data || []
        availableSkills.value = (skillsRes as { data?: Record<string, unknown>[] }).data || []
      } catch (e) {
        console.warn('Failed to fetch mention resources:', e)
      }
    }

    async function initialize() {
      if (isInitialized.value || isInitializing.value) return
      isInitializing.value = true
      try {
        await Promise.all([fetchAgents(), fetchMentionResources()])

        const targetAgentId = getPreferredAgentId(agents.value, selectedAgentId.value)
        if (targetAgentId) {
          await selectAgent(targetAgentId)
        }
        isInitialized.value = true
      } catch (err) {
        console.error('Failed to initialize agent store:', err)
        handleChatError(err as Error, 'initialize')
        error.value = (err as Error).message
      } finally {
        isInitializing.value = false
      }
    }

    async function fetchAgents({ includeSubagents = false }: { includeSubagents?: boolean } = {}) {
      isLoadingAgents.value = true
      error.value = null
      try {
        const response = (await agentApi.getAgents({ includeSubagents })) as { agents?: Agent[] }
        agents.value = sortAgents((response.agents || []).map(normalizeAgent))
      } catch (err) {
        console.error('Failed to fetch agents:', err)
        handleChatError(err as Error, 'fetch')
        error.value = (err as Error).message
        throw err
      } finally {
        isLoadingAgents.value = false
      }
    }

    function applyConfigDefaults(
      loadedConfig: Record<string, unknown>,
      configItems: Record<string, AgentConfigItem> = configurableItems.value
    ): Record<string, unknown> {
      const items = { ...configItems }
      Object.keys(items).forEach((key) => {
        const item = items[key]?.x_oap_ui_config
          ? { ...items[key], ...items[key].x_oap_ui_config }
          : items[key]
        const isDefaultAllList = isDefaultAllAgentResourceKind(item?.kind as string)
        if (loadedConfig[key] === undefined || (loadedConfig[key] === null && !isDefaultAllList)) {
          if (item.default !== undefined) loadedConfig[key] = item.default
        }
        if (
          loadedConfig[key] !== undefined &&
          loadedConfig[key] !== null &&
          loadedConfig[key] !== '' &&
          (item?.type === 'number' || item?.type === 'int' || item?.type === 'float')
        ) {
          const numericValue = Number(loadedConfig[key])
          if (!Number.isNaN(numericValue)) {
            loadedConfig[key] = item.type === 'int' ? Math.trunc(numericValue) : numericValue
          }
        }
      })
      return loadedConfig
    }

    async function fetchAgentDetail(agentId: string, forceRefresh = false): Promise<Agent | null> {
      if (!agentId) return null
      if (!forceRefresh && agentDetails.value[agentId]) return agentDetails.value[agentId]

      isLoadingAgentDetail.value = true
      error.value = null
      try {
        const response = (await agentApi.getAgentDetail(agentId)) as { agent?: Agent }
        const agent = normalizeAgent((response.agent || response) as Agent)
        agentDetails.value[agent.id] = agent
        return agent
      } catch (err) {
        console.error(`Failed to fetch agent detail for ${agentId}:`, err)
        handleChatError(err as Error, 'fetch')
        error.value = (err as Error).message
        throw err
      } finally {
        isLoadingAgentDetail.value = false
      }
    }

    async function selectAgent(agentId: string, { allowSubagent = false }: { allowSubagent?: boolean } = {}) {
      if (!agentId) return
      let knownAgent: Agent | null | undefined =
        agentDetails.value[agentId] || agents.value.find((a) => a.id === agentId)
      if (!knownAgent) {
        knownAgent = await fetchAgentDetail(agentId)
      }
      if (knownAgent?.is_subagent && !allowSubagent) return
      isLoadingConfig.value = true
      try {
        const detail = agentDetails.value[agentId] || (await fetchAgentDetail(agentId))
        const loadedConfig = applyConfigDefaults(
          extractContext(detail),
          detail?.configurable_items || {}
        )
        selectedAgentId.value = agentId
        agentConfig.value = loadedConfig
        originalAgentConfig.value = { ...loadedConfig }
      } finally {
        isLoadingConfig.value = false
      }
    }

    async function saveAgentConfig() {
      const targetAgentId = selectedAgentId.value
      if (!targetAgentId) return
      try {
        const response = (await agentApi.updateAgent(targetAgentId, {
          config_json: { context: agentConfig.value }
        })) as { agent?: Agent }
        const updated = normalizeAgent(response.agent as Agent)
        agentDetails.value[targetAgentId] = updated
        const index = agents.value.findIndex((item) => item.id === targetAgentId)
        if (index >= 0) agents.value.splice(index, 1, updated)
        originalAgentConfig.value = { ...agentConfig.value }
      } catch (err) {
        console.error('Failed to save agent config:', err)
        handleChatError(err as Error, 'save')
        error.value = (err as Error).message
        throw err
      }
    }

    async function createAgent(payload: Record<string, unknown>) {
      const response = (await agentApi.createAgent(payload)) as { agent?: Agent }
      const created = normalizeAgent(response.agent as Agent)
      if (created?.id) {
        agentDetails.value[created.id] = created
        agents.value = sortAgents([
          created,
          ...agents.value.filter((item) => item.id !== created.id)
        ])
        if (!created.is_subagent) await selectAgent(created.id)
      }
      return created
    }

    async function updateAgentProfile(agentId: string, payload: Record<string, unknown>) {
      const response = (await agentApi.updateAgent(agentId, payload)) as { agent?: Agent }
      const updated = normalizeAgent(response.agent as Agent)
      agentDetails.value[updated.id] = updated
      const index = agents.value.findIndex((item) => item.id === updated.id)
      if (index >= 0) agents.value.splice(index, 1, updated)
      return updated
    }

    async function deleteAgent(agentId: string) {
      await agentApi.deleteAgent(agentId)
      agents.value = agents.value.filter((item) => item.id !== agentId)
      delete agentDetails.value[agentId]
      if (selectedAgentId.value === agentId) {
        selectedAgentId.value = null
        agentConfig.value = {}
        originalAgentConfig.value = {}
        const nextAgentId = getPreferredAgentId(agents.value)
        if (nextAgentId) await selectAgent(nextAgentId)
      }
    }

    function resetAgentConfig() {
      agentConfig.value = { ...originalAgentConfig.value }
    }

    function updateAgentConfig(updates: Record<string, unknown>) {
      Object.assign(agentConfig.value, updates)
    }

    function reset() {
      agents.value = []
      selectedAgentId.value = null
      availableKnowledgeBases.value = []
      availableMcps.value = []
      availableSkills.value = []
      agentConfig.value = {}
      originalAgentConfig.value = {}
      agentDetails.value = {}
      isLoadingAgents.value = false
      isLoadingConfig.value = false
      isLoadingAgentDetail.value = false
      error.value = null
      isInitialized.value = false
      isInitializing.value = false
    }

    return {
      agents,
      selectedAgentId,
      availableKnowledgeBases,
      availableMcps,
      availableSkills,
      agentConfig,
      originalAgentConfig,
      agentDetails,
      isLoadingAgents,
      isLoadingConfig,
      isLoadingAgentDetail,
      error,
      isInitialized,
      selectedAgent,
      agentsList,
      configurableItems,
      availableTools,
      hasConfigChanges,
      initialize,
      fetchAgents,
      fetchAgentDetail,
      fetchMentionResources,
      selectAgent,
      saveAgentConfig,
      createAgent,
      updateAgentProfile,
      deleteAgent,
      resetAgentConfig,
      updateAgentConfig,
      reset
    }
  },
  {
    persist: {
      key: 'agent-store',
      storage: localStorage,
      pick: ['selectedAgentId']
    }
  }
)
