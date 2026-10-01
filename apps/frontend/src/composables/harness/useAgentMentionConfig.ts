import { computed } from 'vue'
import type { Ref } from 'vue'
import {
  getAgentConfigOptionDescription,
  getAgentConfigOptionLabel,
  getAgentConfigOptions,
  getAgentConfigOptionValue,
  isDefaultAllAgentResourceKind,
  isMentionAgentResourceKind
} from '@/utils/harness/agentConfigUtils'

type MentionResourceKind = 'knowledges' | 'mcps' | 'skills' | 'subagents'

interface AgentConfigItem {
  kind?: string
  type?: string
  options?: Array<Record<string, unknown>>
  [key: string]: unknown
}

interface MentionFile {
  path: string
  size?: number
  modified_at?: string
  artifact_url?: string
  file_name?: string
  status?: string
  [key: string]: unknown
}

interface ThreadAttachment {
  path?: string
  file_size?: number
  uploaded_at?: string
  artifact_url?: string
  file_name?: string
  status?: string
  [key: string]: unknown
}

interface MentionResource {
  name: string
  description: string
  slug?: string
  kb_id?: string
  id?: string
}

const createResourceMap = <T>(createValue: () => T) => ({
  knowledges: createValue(),
  mcps: createValue(),
  skills: createValue(),
  subagents: createValue()
})

const getMentionResourceKind = (
  key: string,
  kind: string | undefined
): MentionResourceKind | null => {
  if (isMentionAgentResourceKind(kind ?? '')) return kind as MentionResourceKind
  if (isMentionAgentResourceKind(key)) return key as MentionResourceKind
  return null
}

const normalizeMentionResource = (
  option: Record<string, unknown>,
  kind: MentionResourceKind
): MentionResource | null => {
  const value = getAgentConfigOptionValue(option) as string
  if (!value) return null

  const name = (getAgentConfigOptionLabel(option) as string) || value
  const description = getAgentConfigOptionDescription(option) as string

  if (kind === 'knowledges') {
    return {
      kb_id: value,
      name,
      description
    }
  }

  if (kind === 'subagents') {
    return {
      id: value,
      slug: typeof option === 'object' && option !== null ? (option.slug as string) || value : value,
      name,
      description
    }
  }

  return {
    slug: value,
    name,
    description
  }
}

export function useAgentMentionConfig({
  currentAgentState,
  currentThreadAttachments,
  configurableItems,
  agentConfig
}: {
  currentAgentState: Ref<Record<string, unknown> | null>
  currentThreadAttachments: Ref<ThreadAttachment[]>
  configurableItems: Ref<Record<string, AgentConfigItem>>
  agentConfig: Ref<Record<string, unknown>>
}) {
  const mentionConfig = computed(() => {
    const rawFiles = currentAgentState.value?.files || {}
    const files: MentionFile[] = []
    const seenPaths = new Set<string>()

    const pushFile = (entry: MentionFile) => {
      const path = entry?.path || ''
      if (!path || seenPaths.has(path)) return
      seenPaths.add(path)
      files.push(entry)
    }

    if (typeof rawFiles === 'object' && !Array.isArray(rawFiles) && rawFiles !== null) {
      Object.entries(rawFiles).forEach(([filePath, fileData]) => {
        pushFile({
          path: filePath,
          ...fileData
        })
      })
    }

    const attachments = Array.isArray(currentThreadAttachments?.value)
      ? currentThreadAttachments.value
      : []
    attachments.forEach((attachment) => {
      const path = attachment?.path || ''
      if (!path) return
      pushFile({
        path,
        size: attachment.file_size,
        modified_at: attachment.uploaded_at,
        artifact_url: attachment.artifact_url,
        file_name: attachment.file_name,
        status: attachment.status
      })
    })

    const configItems = configurableItems.value || {}
    const currentConfig = agentConfig.value || {}
    const includeAllByKind = createResourceMap(() => false)
    const selectedByKind = createResourceMap(() => new Set<string>())
    const optionsByKind = createResourceMap(() => new Map<string, MentionResource>())
    const resourceItems: Array<{ kind: MentionResourceKind; item: AgentConfigItem }> = []

    Object.entries(configItems).forEach(([key, item]) => {
      const kind = getMentionResourceKind(key, item?.kind)
      if (!kind) return

      resourceItems.push({ kind, item })
      const val = currentConfig[key]
      if (val === null && isDefaultAllAgentResourceKind(kind)) {
        includeAllByKind[kind] = true
      } else if (Array.isArray(val)) {
        val.forEach((value) => selectedByKind[kind].add(value))
      }
    })

    resourceItems.forEach(({ kind, item }) => {
      const selectedValues = selectedByKind[kind]
      if (!includeAllByKind[kind] && !selectedValues.size) return

      getAgentConfigOptions(item).forEach((option) => {
        const value = getAgentConfigOptionValue(option) as string
        if (!value || (!includeAllByKind[kind] && !selectedValues.has(value))) return

        const normalized = normalizeMentionResource(option as Record<string, unknown>, kind)
        if (normalized) optionsByKind[kind].set(value, normalized)
      })
    })

    const selectOptions = (kind: MentionResourceKind): MentionResource[] => {
      const result: MentionResource[] = []
      const optionMap = optionsByKind[kind]

      if (includeAllByKind[kind]) {
        optionMap.forEach((option) => result.push(option))
        return result
      }

      selectedByKind[kind].forEach((value) => {
        const option = optionMap.get(value)
        if (option) result.push(option)
      })
      return result
    }

    const knowledgeBases = selectOptions('knowledges')
    const mcps = selectOptions('mcps')
    const skills = selectOptions('skills')
    const subagents = selectOptions('subagents')

    return {
      files,
      knowledgeBases,
      mcps,
      skills,
      subagents
    }
  })

  return {
    mentionConfig
  }
}
