/** Backend messages shown as-is in toasts; map them to UI locale. */
export const BACKEND_ERROR_I18N_KEYS: Record<string, string> = {
  'No permission to operate on this knowledge base': 'error.kb.noPermissionOperate',
  'No permission to operate': 'error.kb.noPermissionOperate',
  'No permission to delete knowledge': 'error.kb.noPermissionDelete',
  'No permission to modify knowledge': 'error.kb.noPermissionModify',
  'No permission to update knowledge base': 'error.kb.noPermissionUpdate',
  'No permission to create knowledge': 'error.kb.noPermissionCreate',
  'No permission to update knowledge tags': 'error.kb.noPermissionUpdateTags',
  'Source and target knowledge bases must be the same type': 'error.kb.moveTypeMismatch',
  'Source and target must use the same embedding model': 'error.kb.moveEmbeddingMismatch',
  'reuse_vectors move across different vector stores is not supported; use reparse mode to move into a different store':
    'error.kb.moveReuseAcrossStores',
}

const PARSE_STATUS_I18N: Record<string, string> = {
  failed: 'knowledgeBase.statusFailed',
  pending: 'knowledgeBase.statusProcessing',
  processing: 'knowledgeBase.statusProcessing',
  finalizing: 'knowledgeBase.statusFinalizing',
  completed: 'knowledgeBase.statusCompleted',
  cancelled: 'knowledgeBase.statusCancelled',
  draft: 'knowledgeBase.statusDraft',
}

type Translate = (key: string, params?: Record<string, string>) => string

type PatternRule = {
  test: RegExp
  key: string
  params?: (match: RegExpExecArray, translate: Translate) => Record<string, string>
}

const BACKEND_ERROR_PATTERNS: PatternRule[] = [
  {
    test: /^(?:Knowledge item|knowledge) .+ is not in completed status \(current: ([^)]+)\)$/,
    key: 'error.kb.moveNotCompleted',
    params: (match, translate) => ({
      status: localizeParseStatus(match[1], translate),
    }),
  },
  {
    test: /^reuse_vectors move across different vector stores is not supported/,
    key: 'error.kb.moveReuseAcrossStores',
  },
]

function localizeParseStatus(status: string, translate: Translate): string {
  const key = PARSE_STATUS_I18N[status.trim().toLowerCase()]
  if (!key) return status
  const localized = translate(key)
  return !localized || localized === key ? status : localized
}

export function localizeBackendErrorMessage(
  message: string | undefined,
  translate: Translate,
): string | undefined {
  if (!message) return message

  const exactKey = BACKEND_ERROR_I18N_KEYS[message]
  if (exactKey) {
    const localized = translate(exactKey)
    if (localized && localized !== exactKey) return localized
  }

  for (const rule of BACKEND_ERROR_PATTERNS) {
    const match = rule.test.exec(message)
    if (!match) continue
    const localized = translate(rule.key, rule.params?.(match, translate))
    if (localized && localized !== rule.key) return localized
  }

  return message
}
