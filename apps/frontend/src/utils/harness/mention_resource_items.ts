import { formatMentionToken } from './mention_token.js'

interface MentionResource {
  name?: string
  label?: string
  id?: string
  value?: string
  slug?: string
  kb_id?: string
  description?: string
}

interface MentionData {
  knowledgeBases?: MentionResource[]
  mcps?: MentionResource[]
  skills?: MentionResource[]
  subagents?: MentionResource[]
}

interface ResourceItemSource {
  value?: string
  label?: string
  extra?: Record<string, unknown>
}

const toResourceItem = (
  type: string,
  { value, label, extra = {} }: ResourceItemSource = {}
) => {
  if (!value && !label) return null
  const resolvedValue = value || label
  return {
    value: resolvedValue,
    label: label || resolvedValue,
    type,
    tokenLabel: formatMentionToken(type, label || resolvedValue),
    ...extra
  }
}

export const buildMentionResourceItems = (mention: MentionData = {}) => {
  const { knowledgeBases = [], mcps = [], skills = [], subagents = [] } = mention

  return {
    knowledgeBases: knowledgeBases
      .map((kb) =>
        toResourceItem('knowledge', {
          value: kb.name,
          label: kb.name,
          extra: { description: kb.description || '', resourceId: kb.kb_id }
        })
      )
      .filter(Boolean),
    mcps: mcps
      .map((m) =>
        toResourceItem('mcp', {
          value: m.slug || m.value || m.id || m.name,
          label: m.name || m.label,
          extra: { description: m.description || '' }
        })
      )
      .filter(Boolean),
    skills: skills
      .map((s) =>
        toResourceItem('skill', {
          value: s.slug || s.value || s.id || s.name,
          label: s.name || s.label,
          extra: { description: s.description || '' }
        })
      )
      .filter(Boolean),
    subagents: subagents
      .map((s) =>
        toResourceItem('subagent', {
          value: s.id || s.value || s.slug || s.name,
          label: s.name || s.label,
          extra: { description: s.description || '' }
        })
      )
      .filter(Boolean)
  }
}
