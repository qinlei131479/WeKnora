import {
  ref,
  reactive,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
  type Ref,
} from 'vue'
import { useStream } from '@/api/chat/streame'
import {
  ensureFreshEmbedToken,
  getEmbedMessageList,
  postEmbedMessageSent,
  postEmbedMessageReceived,
  relayEmbedWebhookEvent,
  stopEmbedSession,
} from '@/api/embed'
import { embedToast } from '@/utils/embedToast'
import { buildQueryWithHostContext } from '@/utils/embedContext'
import { fileToDataURI } from '@/utils/embedFile'
import { useI18n } from 'vue-i18n'
import { useChatStreamHandler } from '@/composables/useChatStreamHandler'
import { useStickyBottomOnResize } from '@/composables/useStickyBottomOnResize'
import { isEmbedRateLimitError } from '@/composables/useEmbedBridge'

export function useEmbedChatSession(options: {
  sessionId: Ref<string>
  sessionSig: Ref<string>
  visitorId: Ref<string>
  channelId: string
  token: string
  agentId: string
  kbIds: string[]
  allowWebSearch?: boolean
  allowFileUpload?: boolean
  hostContext?: Ref<Record<string, unknown>>
  onMessagesChange?: (has: boolean) => void
  onSessionTitle?: (title: string) => void
  onTurnComplete?: (message: Record<string, unknown>) => void
  onMessagesLoaded?: (messages: Record<string, unknown>[]) => void
  onRateLimited?: () => void
}) {
  const { t } = useI18n()
  const { onChunk, error, startStream, stopStream } = useStream()

  const isAgentStreamSession = () =>
    !!(options.agentId && options.agentId !== 'builtin-quick-answer')

  const limit = ref(20)
  const messagesList = reactive<Record<string, unknown>[]>([])
  watch(
    () => messagesList.length,
    (len) => options.onMessagesChange?.(len > 0),
    { immediate: true },
  )

  const isReplying = ref(false)
  const currentAssistantMessageId = ref('')
  const isFirstEnter = ref(true)
  const loading = ref(false)
  const historyLoading = ref(true)
  const historyLoadingMore = ref(false)
  const hasMoreHistory = ref(true)
  const created_at = ref('')
  const fullContent = ref('')
  let pendingSuggestionAttribution: { suggestion_set_id: string; question_id: string } | null = null
  const scrollContainer = ref<HTMLElement | null>(null)
  const userHasScrolledUp = ref(false)
  // 重新贴底的距离要收得很小。80px 内就恢复跟随的话，用户还在上下滑动，
  // 内容一变高就会被拉回底部，看起来像整屏抖一下。
  const STICK_TO_BOTTOM_THRESHOLD = 8

  const distanceToBottom = () => {
    if (!scrollContainer.value) return 0
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
    return scrollHeight - scrollTop - clientHeight
  }

  const getUserQuery = (index: number) => {
    if (index <= 0) return ''
    const previous = messagesList[index - 1]
    if (previous && previous.role === 'user') {
      return String(previous.content || '')
    }
    return ''
  }

  const scrollToBottom = (force = false) => {
    if (!force && userHasScrolledUp.value) return
    nextTick(() => {
      if (scrollContainer.value) {
        scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
      }
    })
  }

  const onClickScrollToBottom = () => {
    userHasScrolledUp.value = false
    scrollToBottom(true)
  }

  useStickyBottomOnResize(scrollContainer, userHasScrolledUp)

  const debounce = <T extends (...args: never[]) => void>(fn: T, delay: number) => {
    let timer: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
      clearTimeout(timer)
      timer = setTimeout(() => fn(...args), delay)
    }
  }

  const notifyEmbedReceived = (content: string) => {
    if (!content?.trim()) return
    postEmbedMessageReceived(options.channelId, options.sessionId.value, content)
    relayEmbedWebhookEvent(
      options.channelId,
      options.token,
      options.sessionId.value,
      options.sessionSig.value,
      { type: 'message_received', content },
    )
  }

  const {
    shouldRenderAssistantMessage,
    shouldShowGlobalTypingIndicator,
    handleMsgList,
    processStreamChunk,
    prepareForNewOutgoingMessage,
    markInFlightAssistantStopped,
  } = useChatStreamHandler({
    messagesList,
    loading,
    isReplying,
    currentAssistantMessageId,
    fullContent,
    isAgentStreamSession,
    scrollToBottom,
    onReplyComplete: notifyEmbedReceived,
    onTurnComplete: options.onTurnComplete,
    onAfterMsgList: () => options.onMessagesLoaded?.(messagesList),
    onError: embedToast,
    // 历史里的未完成助手行必须保持响应式并初始化事件容器，continue-stream
    // 重挂的事件才能写进这一行（否则 markRaw 后流内容静默丢失）。
    preserveIncompleteStreamReactive: true,
    isFirstEnter,
    scrollContainer,
  })

  const onChatScrollTop = () => {
    if (historyLoadingMore.value || !hasMoreHistory.value) return
    if (!scrollContainer.value) return
    const { scrollTop, scrollHeight } = scrollContainer.value
    isFirstEnter.value = false
    if (scrollTop <= 0) {
      getmsgList(
        {
          session_id: options.sessionId.value,
          created_at: created_at.value,
          limit: limit.value,
        },
        true,
        scrollHeight,
      )
    }
  }

  const debouncedScrollTop = debounce(onChatScrollTop, 500)

  let lastScrollTop = 0
  const handleScroll = () => {
    const el = scrollContainer.value
    if (el) {
      const currentTop = el.scrollTop
      // 内容变高时 scrollTop 不变，不能当成用户上滑。只有真的往上滑才脱离贴底，
      // 并且要滑到最底才重新贴住，否则滑动过程中会被拉回去，整屏抖动。
      if (currentTop < lastScrollTop - 1) {
        userHasScrolledUp.value = true
      } else if (distanceToBottom() <= STICK_TO_BOTTOM_THRESHOLD) {
        userHasScrolledUp.value = false
      }
      lastScrollTop = currentTop
    }
    debouncedScrollTop()
  }

  const getmsgList = (
    data: { session_id: string; created_at?: string; limit: number },
    isScrollType = false,
    scrollHeight?: number,
  ) => {
    if (isScrollType) {
      if (historyLoadingMore.value || !hasMoreHistory.value) return
      historyLoadingMore.value = true
    }

    getEmbedMessageList(
      options.channelId,
      options.token,
      data.session_id,
      data.limit,
      data.created_at || undefined,
      options.sessionSig.value,
    )
      .then(async (res) => {
        const batch = res?.data as Record<string, unknown>[] | undefined
        if (!batch?.length) {
          // No (more) server history. Crucially this also covers the initial
          // load of a brand-new session: leaving hasMoreHistory true here would
          // let a later scroll-to-top re-fetch with an empty cursor (= "latest"),
          // pulling back the just-sent messages and duplicating them.
          hasMoreHistory.value = false
          return
        }
        const nextCursor = String(batch[0].created_at)
        if (isScrollType && created_at.value && nextCursor === created_at.value) {
          hasMoreHistory.value = false
          return
        }
        if (batch.length < limit.value) hasMoreHistory.value = false
        created_at.value = nextCursor
        await handleMsgList(batch, isScrollType, scrollHeight)
        // 初次加载后发现末尾还有未完成的回答，说明生成期间访客离开过页面，
        // 尝试重挂到进行中的生成（内部自带失败降级）。
        if (!isScrollType) {
          void attachContinueStreamIfPending()
        }
      })
      .catch((err) => {
        console.error('Failed to load messages:', err)
        if (isScrollType) hasMoreHistory.value = false
      })
      .finally(() => {
        historyLoading.value = false
        historyLoadingMore.value = false
      })
  }

  // ---- 未完成回答的重挂与降级轮询 ---------------------------------------
  // 访客在生成期间离开页面（iframe 卸载只断开本地 SSE，服务端继续生成并
  // 落库），回来后历史里会有一条 is_completed=false 的助手占位。此时用
  // continue-stream 端点重挂到仍在进行的生成，从 offset 0 重放事件续流；
  // 若流缓冲已不在（生成早已结束、或服务重启丢失），退化为轻量轮询探测
  // 完成后整页重拉历史。
  let attachingContinueStream = false
  let incompletePollTimer: number | null = null
  const INCOMPLETE_POLL_INTERVAL_MS = 3000
  const INCOMPLETE_POLL_MAX_MS = 10 * 60 * 1000

  const stopIncompletePolling = () => {
    if (incompletePollTimer !== null) {
      window.clearInterval(incompletePollTimer)
      incompletePollTimer = null
    }
  }

  const findTrailingIncompleteAssistant = () => {
    for (let i = messagesList.length - 1; i >= 0; i--) {
      const item = messagesList[i]
      if (item.role === 'assistant') return item.is_completed ? undefined : item
    }
    return undefined
  }

  const startIncompletePolling = () => {
    if (incompletePollTimer !== null || !options.sessionId.value) return
    const deadline = Date.now() + INCOMPLETE_POLL_MAX_MS
    incompletePollTimer = window.setInterval(async () => {
      const sid = options.sessionId.value
      if (!sid || Date.now() > deadline) {
        stopIncompletePolling()
        return
      }
      try {
        const res = await getEmbedMessageList(
          options.channelId,
          options.token,
          sid,
          1,
          undefined,
          options.sessionSig.value,
        )
        const latest = (res?.data as Record<string, unknown>[] | undefined)?.[0]
        if (latest && latest.role === 'assistant' && latest.is_completed) {
          stopIncompletePolling()
          // 生成已结束：只摘掉末尾的未完成占位行再增量拉回（已存在的行按 id
          // 去重跳过，仅占位行以完整内容追加）。不能走 resetAndLoad——它会
          // 清空整表并亮出加载骨架，视觉上整页闪烁。
          const idx = messagesList.findIndex(
            (m) => m.role === 'assistant' && !m.is_completed,
          )
          if (idx >= 0) messagesList.splice(idx, 1)
          getmsgList({ session_id: sid, created_at: '', limit: limit.value })
        }
      } catch {
        // 网络抖动下一轮再试，不打断轮询。
      }
    }, INCOMPLETE_POLL_INTERVAL_MS)
  }

  const attachContinueStreamIfPending = async () => {
    if (attachingContinueStream || isReplying.value) return
    if (!options.sessionId.value) return
    const trailing = findTrailingIncompleteAssistant()
    const messageId = trailing ? String(trailing.id || '') : ''
    if (!messageId) return
    attachingContinueStream = true
    isReplying.value = true
    loading.value = true
    currentAssistantMessageId.value = messageId
    // 回来看进度的访客默认贴着底部跟随输出，重放的既有内容一次滚到底。
    userHasScrolledUp.value = false
    scrollToBottom(true)
    try {
      await startStream({
        session_id: options.sessionId.value,
        query: messageId,
        method: 'GET',
        // SSE 客户端按 "<url>/<session_id>?message_id=" 拼接，session_id 必须
        // 是末段，因此路由形状是 /continue-stream/:session_id（与主站一致）。
        url: `/api/v1/embed/${options.channelId}/continue-stream`,
        embed_token: await ensureFreshEmbedToken(options.channelId, options.token),
        embed_session_sig: options.sessionSig.value,
        embed_visitor_id: options.visitorId.value,
      })
    } catch {
      // startStream 内部已把异常写入 error ref，这里无需处理。
    } finally {
      attachingContinueStream = false
    }
    if (error.value) {
      // 重挂失败（最常见：流缓冲已清理，404）属于常态而非故障，静默降级
      // 为轮询，避免向访客弹出无意义的错误提示。
      error.value = null
      isReplying.value = false
      loading.value = false
      currentAssistantMessageId.value = ''
      startIncompletePolling()
    }
  }

  const handleStopGeneration = () => {
    stopStream()
    markInFlightAssistantStopped(currentAssistantMessageId.value)
    const messageId = currentAssistantMessageId.value
    if (messageId) {
      stopEmbedSession(
        options.channelId,
        options.token,
        options.sessionId.value,
        messageId,
        options.sessionSig.value,
      ).catch((err) => console.error('Failed to stop embed generation:', err))
    }
    loading.value = false
    isReplying.value = false
  }

  const sendMsg = async (
    value: string,
    opts: { webSearchEnabled?: boolean; imageFiles?: File[]; attachmentFiles?: File[] } = {},
  ) => {
    stopStream()
    stopIncompletePolling()
    prepareForNewOutgoingMessage()
    const outboundQuery = buildQueryWithHostContext(value, options.hostContext?.value)
    const visitorWebSearchEnabled = opts.webSearchEnabled ?? false
    const imageFiles = (options.allowFileUpload ? opts.imageFiles : undefined) || []
    const attachmentFiles = (options.allowFileUpload ? opts.attachmentFiles : undefined) || []
    isReplying.value = true
    loading.value = true

    const imageAttachments: Array<{ data: string }> = []
    const displayImages: Array<{ url: string }> = []
    const attachmentUploads: Array<{ data: string; file_name: string; file_size: number }> = []
    const displayAttachments: Array<{ file_name: string; file_size: number }> = []
    try {
      for (const file of imageFiles) {
        const dataURI = String(await fileToDataURI(file))
        imageAttachments.push({ data: dataURI })
        displayImages.push({ url: dataURI })
      }
      for (const file of attachmentFiles) {
        const dataURI = String(await fileToDataURI(file))
        attachmentUploads.push({ data: dataURI, file_name: file.name, file_size: file.size })
        displayAttachments.push({ file_name: file.name, file_size: file.size })
      }
    } catch (err) {
      console.error('Failed to read attachment:', err)
      embedToast(t('chat.imageReadFailed'))
      isReplying.value = false
      loading.value = false
      return
    }

    messagesList.push({
      content: value,
      role: 'user',
      mentioned_items: [],
      images: displayImages,
      attachments: displayAttachments,
      channel: 'embed',
      created_at: new Date().toISOString(),
    })
    postEmbedMessageSent(options.channelId, options.sessionId.value, value)
    relayEmbedWebhookEvent(
      options.channelId,
      options.token,
      options.sessionId.value,
      options.sessionSig.value,
      { type: 'message_sent', query: value },
    )
    userHasScrolledUp.value = false
    scrollToBottom(true)

    const agentEnabled = isAgentStreamSession()
    const endpoint = agentEnabled
      ? `/api/v1/embed/${options.channelId}/agent-chat`
      : `/api/v1/embed/${options.channelId}/knowledge-chat`

    const suggestionAttribution = pendingSuggestionAttribution
    pendingSuggestionAttribution = null
    await startStream({
      session_id: options.sessionId.value,
      knowledge_base_ids: options.kbIds,
      knowledge_ids: [],
      agent_enabled: agentEnabled,
      agent_id: options.agentId,
      web_search_enabled: (options.allowWebSearch ?? false) && visitorWebSearchEnabled,
      summary_model_id: '',
      mcp_service_ids: [],
      mentioned_items: [],
      images: imageAttachments.length > 0 ? imageAttachments : undefined,
      attachment_uploads: attachmentUploads.length > 0 ? attachmentUploads : undefined,
      query: outboundQuery,
      suggestion_attribution: suggestionAttribution || undefined,
      method: 'POST',
      url: endpoint,
      // options.token 是初始化时的快照，会话 Token 可能已到期；发出前先换
      // 取当期有效的 Token，避免长停留后第一条消息被 401 拒绝。
      embed_token: await ensureFreshEmbedToken(options.channelId, options.token),
      embed_session_sig: options.sessionSig.value,
      embed_visitor_id: options.visitorId.value,
    })
  }

  watch(error, (newError) => {
    if (newError) {
      // 重挂 continue-stream 失败（缓冲过期/服务重启）由 attach 流程自行静默
      // 降级为轮询，不走全局错误提示。
      if (attachingContinueStream) return
      if (isEmbedRateLimitError({ message: newError })) {
        embedToast(t('embedPublish.rateLimited'))
        options.onRateLimited?.()
      } else {
        embedToast(newError)
      }
      isReplying.value = false
      loading.value = false
      currentAssistantMessageId.value = ''
    }
  })

  onChunk((data) => {
    if (data.response_type === 'session_title') {
      const title = String(data.content || (data.data as { title?: string })?.title || '').trim()
      if (title) {
        options.onSessionTitle?.(title)
      }
      return
    }
    processStreamChunk(data)
  })

  const resetAndLoad = (sid: string) => {
    stopStream()
    stopIncompletePolling()
    messagesList.splice(0)
    historyLoading.value = true
    historyLoadingMore.value = false
    hasMoreHistory.value = true
    created_at.value = ''
    loading.value = false
    isReplying.value = false
    currentAssistantMessageId.value = ''
    userHasScrolledUp.value = false
    isFirstEnter.value = true
    fullContent.value = ''
    if (!sid) {
      historyLoading.value = false
      return
    }
    getmsgList({ session_id: sid, created_at: '', limit: limit.value })
  }

  watch(
    () => options.sessionId.value,
    (sid) => resetAndLoad(sid),
    { immediate: true },
  )

  onMounted(() => {
    loading.value = false
    isReplying.value = false
  })

  onUnmounted(() => {
    stopStream()
    stopIncompletePolling()
    fullContent.value = ''
  })

  return {
    messagesList,
    loading,
    isReplying,
    historyLoading,
    scrollContainer,
    userHasScrolledUp,
    isFirstEnter,
    shouldRenderAssistantMessage,
    shouldShowGlobalTypingIndicator,
    getUserQuery,
    handleScroll,
    scrollToBottom,
    onClickScrollToBottom,
    sendMsg,
    handleStopGeneration,
    setSuggestionAttribution: (suggestionSetId: string, questionId: string) => {
      pendingSuggestionAttribution = { suggestion_set_id: suggestionSetId, question_id: questionId }
    },
  }
}
