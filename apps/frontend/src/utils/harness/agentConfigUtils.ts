export const DEFAULT_ALL_AGENT_RESOURCE_KINDS = Object.freeze([
  'tools',
  'knowledges',
  'mcps',
  'skills',
  'subagents'
])

export const MENTION_AGENT_RESOURCE_KINDS = Object.freeze([
  'knowledges',
  'mcps',
  'skills',
  'subagents'
])

interface AgentConfigItem {
  options?: unknown[]
  type?: string
}

export const isDefaultAllAgentResourceKind = (kind: string) =>
  DEFAULT_ALL_AGENT_RESOURCE_KINDS.includes(kind)

export const isMentionAgentResourceKind = (kind: string) => MENTION_AGENT_RESOURCE_KINDS.includes(kind)

export const getAgentConfigOptions = (item: AgentConfigItem): unknown[] =>
  Array.isArray(item?.options) ? item.options : []

export const isSingleSelectAgentConfig = (item: AgentConfigItem) =>
  getAgentConfigOptions(item).length > 0 && ['str', 'string', 'select'].includes(item?.type ?? '')

export const getAgentConfigOptionValue = (option: unknown) => {
  if (typeof option !== 'object' || option === null) return option
  const record = option as Record<string, unknown>
  return (
    record.key ||
    record.id ||
    record.value ||
    record.name ||
    record.db_id ||
    record.slug ||
    record.label
  )
}

export const getAgentConfigOptionLabel = (option: unknown) => {
  if (typeof option !== 'object' || option === null) return option
  const record = option as Record<string, unknown>
  return record.name || record.label || getAgentConfigOptionValue(option)
}

export const getAgentConfigOptionDescription = (option: unknown) =>
  typeof option === 'object' && option !== null
    ? (option as Record<string, unknown>).description || ''
    : ''
