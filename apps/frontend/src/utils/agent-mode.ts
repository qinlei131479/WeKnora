import {
  BUILTIN_QUICK_ANSWER_ID,
  BUILTIN_SMART_REASONING_ID,
} from '@/api/agent'

/** Whether the selected agent id is the builtin quick-answer (RAG) mode. */
export function isQuickAnswerAgentId(agentId: string | null | undefined): boolean {
  return (agentId || BUILTIN_QUICK_ANSWER_ID) === BUILTIN_QUICK_ANSWER_ID
}

/** Whether requests should use the Agent stream pipeline (not quick-answer RAG). */
export function isAgentStreamAgentId(
  agentId: string | null | undefined,
  isAgentEnabled: boolean,
): boolean {
  const id = agentId || BUILTIN_QUICK_ANSWER_ID
  if (id === BUILTIN_QUICK_ANSWER_ID) return false
  if (id === BUILTIN_SMART_REASONING_ID) return true
  return isAgentEnabled
}

/**
 * Localized label for the two chat-mode builtins. Other agents keep their stored name.
 * The closed input dropdown must use this — API `agent.name` is seeded in one language
 * and will not follow UI locale changes.
 */
export function localizedBuiltinAgentName(
  agentId: string | null | undefined,
  t: (key: string) => string,
  fallbackName?: string,
): string {
  if (agentId === BUILTIN_QUICK_ANSWER_ID) return t('input.normalMode')
  if (agentId === BUILTIN_SMART_REASONING_ID) return t('input.agentMode')
  return fallbackName || t('input.normalMode')
}

/** Reconcile builtin agent id with isAgentEnabled after localStorage reload. */
export function reconcileBuiltinAgentMode(settings: {
  selectedAgentId?: string
  isAgentEnabled: boolean
}): boolean {
  const agentId = settings.selectedAgentId || BUILTIN_QUICK_ANSWER_ID
  if (agentId === BUILTIN_QUICK_ANSWER_ID && settings.isAgentEnabled) {
    settings.isAgentEnabled = false
    return true
  }
  if (agentId === BUILTIN_SMART_REASONING_ID && !settings.isAgentEnabled) {
    settings.isAgentEnabled = true
    return true
  }
  return false
}
