export const TOOL_APPROVAL_MODES = ['default', 'always_trust']
export const TOOL_APPROVAL_MODE_STORAGE_KEY = 'yuxi_tool_approval_mode'

interface PendingInterrupt {
  kind?: string
  actionRequests?: unknown[]
  questions?: unknown[]
}

interface ThreadStateLike {
  pendingInterrupt?: PendingInterrupt | null
  queueSnapshot?: { status?: string } | null
}

export const isToolApprovalMode = (value: unknown): value is string =>
  TOOL_APPROVAL_MODES.includes(value as string)

export const resolveToolApprovalMode = ({
  hasThread,
  threadMode,
  agentMode,
  savedMode
}: {
  hasThread: boolean
  threadMode: unknown
  agentMode: unknown
  savedMode: unknown
}): string => {
  const candidates = hasThread ? [threadMode] : [savedMode, agentMode]
  return candidates.find(isToolApprovalMode) || TOOL_APPROVAL_MODES[0]
}

const resolveStorage = (storage: Storage | null | undefined): Storage | null =>
  storage || (typeof window !== 'undefined' ? window.localStorage : null)

export const readToolApprovalModePreference = (storage?: Storage | null): string | null => {
  const targetStorage = resolveStorage(storage)
  if (!targetStorage) return null

  try {
    const value = targetStorage.getItem(TOOL_APPROVAL_MODE_STORAGE_KEY)
    return isToolApprovalMode(value) ? value : null
  } catch {
    return null
  }
}

export const writeToolApprovalModePreference = (mode: unknown, storage?: Storage | null): boolean => {
  if (!isToolApprovalMode(mode)) return false
  const targetStorage = resolveStorage(storage)
  if (!targetStorage) return false

  try {
    targetStorage.setItem(TOOL_APPROVAL_MODE_STORAGE_KEY, mode)
    return true
  } catch {
    return false
  }
}

export const buildToolApprovalDecisions = (
  selectedDecisions: string[],
  actionCount: number
): Array<{ type: string; message?: string }> =>
  Array.from({ length: actionCount }, (_, index) =>
    selectedDecisions[index] === 'approve'
      ? { type: 'approve' }
      : { type: 'reject', message: '用户拒绝执行该操作' }
  )

export const formatToolApprovalArgs = (args: unknown): string =>
  typeof args === 'string' ? args : JSON.stringify(args ?? {}, null, 2)

const parseToolApprovalArgs = (args: unknown): unknown => {
  if (typeof args !== 'string') return args ?? {}

  try {
    return JSON.parse(args)
  } catch {
    return args
  }
}

export const getToolApprovalSummary = (
  request: { name?: string; args?: unknown } | null | undefined
): string => {
  const name = request?.name
  const args = parseToolApprovalArgs(request?.args)

  if (typeof args === 'string') return args
  if (args === null || typeof args !== 'object') return String(args ?? '')
  const argObj = args as Record<string, unknown>
  if (name === 'execute') {
    return String(argObj.command || argObj.cmd || formatToolApprovalArgs(argObj))
  }
  if (name === 'write_file' || name === 'edit_file') {
    return String(argObj.file_path || argObj.path || formatToolApprovalArgs(argObj))
  }

  return formatToolApprovalArgs(argObj).replace(/\s+/g, ' ').trim()
}

export const hasPendingInterruptPayload = (pendingInterrupt: PendingInterrupt | null | undefined): boolean => {
  if (!pendingInterrupt) return false
  if (pendingInterrupt.kind === 'tool_approval') {
    return (
      Array.isArray(pendingInterrupt.actionRequests) && pendingInterrupt.actionRequests.length > 0
    )
  }
  return Array.isArray(pendingInterrupt.questions) && pendingInterrupt.questions.length > 0
}

export const isThreadWaitingForUserAction = (
  threadState: ThreadStateLike | null | undefined
): boolean =>
  hasPendingInterruptPayload(threadState?.pendingInterrupt) ||
  threadState?.queueSnapshot?.status === 'interrupted'

export const isRunInterruptedConflict = (
  error: {
    response?: { status?: number; data?: { detail?: { code?: string } } } | null
  } | null
  | undefined
): boolean =>
  error?.response?.status === 409 && error?.response?.data?.detail?.code === 'run_interrupted'
