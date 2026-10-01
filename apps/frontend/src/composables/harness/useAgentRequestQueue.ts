import { agentApi } from '@/api/chat-work/agent'
import { processRunSseResponse } from '@/composables/harness/useAgentRunStream'
import { IDLE_QUEUE_SNAPSHOT } from '@/composables/harness/useAgentThreadState'
import type { QueuedRequest, QueueSnapshot, ThreadState } from '@/composables/harness/useAgentThreadState'
import { handleChatError } from '@/utils/harness/errorHandler'

interface RequestEventData {
  position?: number
  run_id?: string
  [key: string]: unknown
}

const dedupeQueuedRequests = (requests: QueuedRequest[]): QueuedRequest[] => {
  const requestById = new Map<string, QueuedRequest>()
  requests.forEach((request) => {
    const requestId = String(request?.request_id || '')
    if (!requestId) return
    requestById.set(requestId, request)
  })
  return [...requestById.values()]
}

export function useAgentRequestQueue({
  getThreadState,
  resetOnGoingConv,
  startRunStream,
  onStreamError
}: {
  getThreadState: (threadId: string | null) => ThreadState | null
  resetOnGoingConv: (
    threadId: string,
    options?: { preserveRunStream?: boolean; preserveRequestStreams?: boolean }
  ) => void
  startRunStream: (
    threadId: string,
    runId: string,
    afterSeq?: string,
    options?: { steerable?: boolean }
  ) => Promise<void>
  onStreamError?: (threadId: string, requestId: string, event: string) => void
}) {
  const removeRequestFromQueue = (ts: ThreadState | null, requestId: string) => {
    if (!ts || !ts.queuedRequests) return
    ts.queuedRequests = ts.queuedRequests.filter((r) => r.request_id !== requestId)
  }

  const stopRequestStream = (threadId: string, requestId: string) => {
    const ts = getThreadState(threadId)
    const entry = ts?.requestStreams?.[requestId]
    if (!entry) return
    entry.controller?.abort()
    delete ts!.requestStreams[requestId]
  }

  const stopAllRequestStreams = (threadId: string) => {
    const ts = getThreadState(threadId)
    if (!ts?.requestStreams) return
    for (const rid of Object.keys(ts.requestStreams)) {
      stopRequestStream(threadId, rid)
    }
  }

  const cancelRequest = async (threadId: string, requestId: string): Promise<boolean> => {
    const ts = getThreadState(threadId)
    if (!ts || !requestId) return false
    try {
      await agentApi.cancelRequest(requestId)
      stopRequestStream(threadId, requestId)
      removeRequestFromQueue(ts, requestId)
      if (ts.onGoingConv?.msgChunks) {
        delete ts.onGoingConv.msgChunks[requestId]
      }
      return true
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        handleChatError(error as Error, 'cancel')
      }
      return false
    }
  }

  const syncQueuedRequests = async (threadId: string, agentSlug: string) => {
    const ts = getThreadState(threadId)
    if (!ts) return
    try {
      const resp = (await agentApi.listThreadQueuedRequests(threadId, agentSlug)) as {
        requests?: QueuedRequest[]
        queue?: QueueSnapshot
      } | null
      ts.queuedRequests = dedupeQueuedRequests(resp?.requests || [])
      ts.queueSnapshot = resp?.queue || { ...IDLE_QUEUE_SNAPSHOT }
    } catch (e) {
      console.warn('Failed to sync queued requests:', e)
    }
  }

  const startRequestStream = async (threadId: string, requestId: string) => {
    if (!threadId || !requestId) return
    const ts = getThreadState(threadId)
    if (!ts) return

    ts.requestStreams = ts.requestStreams || {}
    if (ts.requestStreams[requestId]) return

    const controller = new AbortController()
    const entry = { controller, position: 0, status: 'queued' }
    ts.requestStreams[requestId] = entry

    try {
      const response = await agentApi.streamRequestEvents(requestId, {
        signal: controller.signal
      })
      if (!response.ok) {
        throw new Error(`Request SSE response not ok: ${response.status}`)
      }

      const handleEvent = (event: string, data: RequestEventData) => {
        // 一次性取 ts/entry，避免每个分支重复 getThreadState 触发响应式追踪。
        const tsInner = getThreadState(threadId)
        const innerEntry = tsInner?.requestStreams?.[requestId]
        if (!tsInner || innerEntry?.controller !== controller) return

        if (event === 'queued' && data) {
          entry.position = data.position || entry.position
          const queuedRequest = tsInner.queuedRequests?.find((r) => r.request_id === requestId)
          if (queuedRequest) queuedRequest.queue_position = entry.position
        } else if (event === 'run_created' && data) {
          entry.status = 'dispatched'
          if (data.run_id) {
            removeRequestFromQueue(tsInner, requestId)
            stopRequestStream(threadId, requestId)

            // 旧 Run 尚未 finalize 时保留已渲染内容；startRunStream 会 flush 并中止旧订阅。
            // 若旧 Run 已 finalize，则其 history 刷新已在途，可以清理残留的 ongoing 状态。
            if (!tsInner.activeRunId) {
              resetOnGoingConv(threadId, { preserveRequestStreams: true })
            }
            tsInner.pendingRequestId = requestId
            void startRunStream(threadId, data.run_id, '0-0')
          }
        } else if (event === 'cancelled' || event === 'rejected' || event === 'failed') {
          entry.status = event
          tsInner.isStreaming = false
          tsInner.replyLoadingVisible = false
          tsInner.pendingRequestId = null
          delete tsInner.onGoingConv.msgChunks[requestId]
          removeRequestFromQueue(tsInner, requestId)
          stopRequestStream(threadId, requestId)
          if (typeof onStreamError === 'function') {
            onStreamError(threadId, requestId, event)
          }
        }
      }

      await processRunSseResponse<RequestEventData>(response, handleEvent)
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        console.error('Request SSE stream error:', error)
        handleChatError(error as Error, 'stream')
      }
    } finally {
      const tsFinal = getThreadState(threadId)
      if (tsFinal?.requestStreams?.[requestId]?.controller === controller) {
        delete tsFinal.requestStreams[requestId]
      }
    }
  }

  const continueQueue = async (threadId: string, agentSlug: string): Promise<boolean> => {
    const ts = getThreadState(threadId)
    if (!ts || !threadId || !agentSlug || ts.continueQueueInFlight) return false

    ts.continueQueueInFlight = true
    try {
      const response = (await agentApi.continueThreadQueue(threadId, agentSlug)) as {
        request_id?: string
      } | null
      await syncQueuedRequests(threadId, agentSlug)
      if (response?.request_id) {
        void startRequestStream(threadId, response.request_id)
      }
      return true
    } catch (error) {
      handleChatError(error as Error, 'continue_queue')
      return false
    } finally {
      ts.continueQueueInFlight = false
    }
  }

  const steerRequest = async (
    threadId: string,
    agentSlug: string,
    requestId: string
  ): Promise<boolean> => {
    const ts = getThreadState(threadId)
    if (!ts || !threadId || !agentSlug || !requestId) return false

    try {
      await agentApi.steerRequest(requestId)
      await syncQueuedRequests(threadId, agentSlug)
      void startRequestStream(threadId, requestId)
      return true
    } catch (error) {
      handleChatError(error as Error, 'steer')
      return false
    }
  }

  return {
    startRequestStream,
    stopAllRequestStreams,
    cancelRequest,
    syncQueuedRequests,
    continueQueue,
    steerRequest
  }
}
