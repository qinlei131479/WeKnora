export interface ToolCallChunk {
  index?: number
  id?: string
  name?: string
  args?: string
  [key: string]: unknown
}

export interface StreamChunkAdditionalKwargs {
  reasoning_content?: string
  [key: string]: unknown
}

export interface StreamChunk {
  id?: string
  type?: string
  content?: string
  reasoning_content?: string
  additional_kwargs?: StreamChunkAdditionalKwargs
  tool_call_chunks?: ToolCallChunk[]
  run_id?: string
  thread_id?: string
  request_id?: string
  extra_metadata?: Record<string, unknown>
  role?: string
  status?: string
  [key: string]: unknown
}

export interface InterruptInfo {
  questions?: unknown[]
  source?: string
  approval?: Record<string, unknown>
  [key: string]: unknown
}

export interface StreamEventChunk {
  status?: string
  type?: string
  request_id?: string
  run_id?: string
  thread_id?: string
  message?: string
  msg?: StreamChunk
  error_message?: string
  error_type?: string
  retryable?: boolean
  job_try?: string | number
  agent_state?: Record<string, unknown>
  compression?: Record<string, unknown>
  stream_event?: Record<string, unknown>
  event?: Record<string, unknown>
  interrupt_info?: InterruptInfo
  questions?: unknown[]
  source?: string
  approval?: Record<string, unknown>
  [key: string]: unknown
}

export interface OnGoingConv {
  msgChunks: Record<string, StreamChunk[]>
  currentRequestKey: string | null
  currentAssistantKey: string | null
  toolCallBuffers: Record<string, unknown>
}

export interface QueuedRequest {
  request_id: string
  queue_position?: number
  status?: string
  [key: string]: unknown
}

export interface QueueSnapshot {
  status: string
  paused_reason: string | null
  blocking_run_id: string | null
  can_continue: boolean
}

export interface RequestStreamEntry {
  controller: AbortController | null
  position: number
  status: string
}

export interface PendingQuestion {
  questionId?: string
  question: string
  options?: Array<{ label: string; value: string }>
  multiSelect?: boolean
  allowOther?: boolean
  operation?: string
}

export interface PendingInterrupt {
  kind: string
  questions?: PendingQuestion[]
  actionRequests?: Array<Record<string, unknown>>
  source?: string
  status?: string
  threadId?: string | null
  interruptedRunId?: string | null
}

export interface ThreadState {
  isStreaming: boolean
  runStreamAbortController: AbortController | null
  activeRunId: string | null
  activeRunSteerable: boolean
  runLastSeq: string
  lastRetryableJobTry: number | null
  replyLoadingVisible: boolean
  pendingRequestId: string | null
  pendingInterrupt: PendingInterrupt | null
  agentStateRequestVersion: number
  onGoingConv: OnGoingConv
  agentState: Record<string, unknown> | null
  contextCompressing: boolean
  queuedRequests: QueuedRequest[]
  queueSnapshot: QueueSnapshot
  continueQueueInFlight: boolean
  requestStreams: Record<string, RequestStreamEntry>
}

const createOnGoingConvState = (): OnGoingConv => ({
  msgChunks: {},
  currentRequestKey: null,
  currentAssistantKey: null,
  toolCallBuffers: {}
})

const IDLE_QUEUE_SNAPSHOT = Object.freeze({
  status: 'idle',
  paused_reason: null,
  blocking_run_id: null,
  can_continue: false
})

export function useAgentThreadState({
  chatState,
  getCurrentThreadId,
  onStopThread = null,
  onBeforeResetThread = null,
  onBeforeCleanupThread = null
}: {
  chatState: { threadStates: Record<string, ThreadState> }
  getCurrentThreadId: () => string | null
  onStopThread?: ((threadId: string) => void) | null
  onBeforeResetThread?: ((threadId: string) => void) | null
  onBeforeCleanupThread?: ((threadId: string) => void) | null
}) {
  const resetThreadUiState = (threadState: ThreadState) => {
    if (!threadState) return
    threadState.replyLoadingVisible = false
    threadState.pendingRequestId = null
  }

  const getThreadState = (threadId: string | null): ThreadState | null => {
    if (!threadId) return null
    if (!chatState.threadStates[threadId]) {
      chatState.threadStates[threadId] = {
        isStreaming: false,
        runStreamAbortController: null,
        activeRunId: null,
        activeRunSteerable: false,
        runLastSeq: '0-0',
        lastRetryableJobTry: null,
        replyLoadingVisible: false,
        pendingRequestId: null,
        pendingInterrupt: null,
        agentStateRequestVersion: 0,
        onGoingConv: createOnGoingConvState(),
        agentState: null,
        contextCompressing: false,
        queuedRequests: [],
        queueSnapshot: { ...IDLE_QUEUE_SNAPSHOT },
        continueQueueInFlight: false,
        requestStreams: {}
      }
    }
    return chatState.threadStates[threadId]
  }

  const stopThreadStream = (threadId: string) => {
    if (!threadId) return
    if (typeof onStopThread === 'function') {
      onStopThread(threadId)
    }
  }

  const abortAllRequestStreams = (threadState: ThreadState | null) => {
    if (!threadState?.requestStreams) return
    for (const entry of Object.values(threadState.requestStreams)) {
      entry.controller?.abort()
    }
  }

  const cleanupThreadState = (threadId: string) => {
    if (!threadId) return
    const threadState = chatState.threadStates[threadId]
    if (!threadState) return

    if (typeof onBeforeCleanupThread === 'function') {
      onBeforeCleanupThread(threadId)
    }

    if (threadState.runStreamAbortController) {
      threadState.runStreamAbortController.abort()
    }
    abortAllRequestStreams(threadState)
    delete chatState.threadStates[threadId]
  }

  const resetOnGoingConv = (
    threadId: string | null = null,
    { preserveRunStream = false, preserveRequestStreams = false }: {
      preserveRunStream?: boolean
      preserveRequestStreams?: boolean
    } = {}
  ) => {
    const targetThreadId =
      threadId || (typeof getCurrentThreadId === 'function' ? getCurrentThreadId() : null)

    if (targetThreadId) {
      const threadState = getThreadState(targetThreadId)
      if (!threadState) return

      if (typeof onBeforeResetThread === 'function') {
        onBeforeResetThread(targetThreadId)
      }

      if (!preserveRunStream && threadState.runStreamAbortController) {
        threadState.runStreamAbortController.abort()
        threadState.runStreamAbortController = null
      }
      if (!preserveRequestStreams && threadState.requestStreams) {
        abortAllRequestStreams(threadState)
        threadState.requestStreams = {}
      }

      threadState.onGoingConv = createOnGoingConvState()
      resetThreadUiState(threadState)
      return
    }

    Object.keys(chatState.threadStates).forEach((id) => {
      cleanupThreadState(id)
    })
  }

  return {
    getThreadState,
    cleanupThreadState,
    resetOnGoingConv,
    stopThreadStream
  }
}

export { IDLE_QUEUE_SNAPSHOT }
