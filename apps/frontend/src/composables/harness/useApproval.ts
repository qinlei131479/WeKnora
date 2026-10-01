import { reactive } from 'vue'
import { normalizeQuestions } from '@/utils/harness/questionUtils'
import { hasPendingInterruptPayload } from '@/utils/harness/toolApproval'
import type {
  PendingInterrupt,
  PendingQuestion,
  StreamEventChunk,
  ThreadState
} from '@/composables/harness/useAgentThreadState'

const APPROVAL_REQUIRED_STATUSES = new Set([
  'ask_user_question_required',
  'human_approval_required'
])

const extractQuestionPayload = (
  chunk: StreamEventChunk
): { questions: PendingQuestion[]; source: string } => {
  const interruptInfo = chunk?.interrupt_info || {}
  const rawQuestions = chunk?.questions || interruptInfo?.questions || []
  const source = chunk?.source || interruptInfo?.source || 'interrupt'
  const questions = normalizeQuestions(rawQuestions) as unknown as PendingQuestion[]

  return {
    questions,
    source
  }
}

const extractToolApprovalPayload = (chunk: StreamEventChunk) => {
  const approval = chunk?.approval || chunk?.interrupt_info?.approval || {}
  const actionRequests = Array.isArray(approval.action_requests) ? approval.action_requests : []
  const reviewConfigs = Array.isArray(approval.review_configs) ? approval.review_configs : []
  // action_requests 与 review_configs 一一对应，前端只消费 action_requests
  if (!actionRequests.length || actionRequests.length !== reviewConfigs.length) return null
  return { actionRequests }
}

export const extractPendingInterrupt = (
  chunk: StreamEventChunk,
  threadId: string
): PendingInterrupt | null => {
  if (chunk?.status === 'human_approval_required') {
    const approval = extractToolApprovalPayload(chunk)
    if (!approval) return null
    return {
      kind: 'tool_approval',
      ...approval,
      status: chunk.status,
      threadId: chunk?.thread_id || threadId,
      interruptedRunId: chunk?.run_id || null
    }
  }
  const payload = extractQuestionPayload(chunk)
  if (!payload.questions.length) return null

  return {
    kind: 'question',
    questions: payload.questions,
    source: payload.source,
    status: chunk?.status || '',
    threadId: chunk?.thread_id || threadId,
    interruptedRunId: chunk?.run_id || null
  }
}

export function useApproval({
  getThreadState,
  fetchThreadMessages
}: {
  getThreadState: (threadId: string | null) => ThreadState | null
  fetchThreadMessages: (params: { agentId: string | null; threadId: string; delay?: number }) => unknown
}) {
  const approvalState = reactive({
    showModal: false,
    questions: [] as PendingQuestion[],
    kind: '',
    actionRequests: [] as Array<Record<string, unknown>>,
    status: '',
    threadId: null as string | null,
    interruptedRunId: null as string | null
  })

  const applyInterruptToApprovalState = (pendingInterrupt: PendingInterrupt, fallbackThreadId: string) => {
    approvalState.showModal = true
    approvalState.questions = pendingInterrupt.questions || []
    approvalState.kind = pendingInterrupt.kind || 'question'
    approvalState.actionRequests = pendingInterrupt.actionRequests || []
    approvalState.status = pendingInterrupt.status || ''
    approvalState.threadId = pendingInterrupt.threadId || fallbackThreadId
    approvalState.interruptedRunId = pendingInterrupt.interruptedRunId || null
  }

  const clearApprovalState = () => {
    approvalState.showModal = false
    approvalState.questions = []
    approvalState.kind = ''
    approvalState.actionRequests = []
    approvalState.status = ''
    approvalState.threadId = null
    approvalState.interruptedRunId = null
  }

  const processApprovalInStream = (
    chunk: StreamEventChunk,
    threadId: string,
    currentAgentId: string | null
  ): boolean => {
    if (!chunk.status || !APPROVAL_REQUIRED_STATUSES.has(chunk.status)) {
      return false
    }

    const threadState = getThreadState(threadId)
    if (!threadState) return false

    const pendingInterrupt = extractPendingInterrupt(chunk, threadId)
    if (!pendingInterrupt) return false

    threadState.isStreaming = false
    threadState.pendingInterrupt = pendingInterrupt

    applyInterruptToApprovalState(pendingInterrupt, threadId)

    fetchThreadMessages({ agentId: currentAgentId, threadId })

    return true
  }

  const restoreInterruptFromThreadState = (threadId: string) => {
    const threadState = getThreadState(threadId)
    const pendingInterrupt = threadState?.pendingInterrupt
    if (!hasPendingInterruptPayload(pendingInterrupt)) return false

    threadState!.isStreaming = false
    threadState!.replyLoadingVisible = false
    threadState!.pendingRequestId = null
    applyInterruptToApprovalState(pendingInterrupt!, threadId)
    return true
  }

  const hideApprovalState = () => {
    clearApprovalState()
  }

  const resetApprovalState = () => {
    const threadState = getThreadState(approvalState.threadId)
    if (threadState) {
      threadState.pendingInterrupt = null
    }
    clearApprovalState()
  }

  return {
    approvalState,
    processApprovalInStream,
    restoreInterruptFromThreadState,
    hideApprovalState,
    resetApprovalState
  }
}
