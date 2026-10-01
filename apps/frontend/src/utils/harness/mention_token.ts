export const mentionTypePrefixMap: Record<string, string> = {
  file: 'file',
  knowledge: 'knowledge',
  mcp: 'mcp',
  skill: 'skill',
  subagent: 'subagent'
}

export const formatMentionToken = (type: string, value: unknown) => {
  const prefix = mentionTypePrefixMap[type] || type
  const rawValue = String(value ?? '')
  if (/\s|["\\]/.test(rawValue)) {
    return `@${prefix}:"${rawValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  return `@${prefix}:${rawValue}`
}
