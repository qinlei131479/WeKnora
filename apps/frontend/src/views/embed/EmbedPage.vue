<template>
  <div class="embed-page" :style="pageStyle">
    <!-- 限流：保留聊天壳，顶部友好提示；其它致命错误仍走空白错误页 -->
    <div v-if="rateLimited" class="embed-rate-banner" role="status">
      {{ $t('embedPublish.rateLimited') }}
    </div>

    <div v-if="loadError && !rateLimited" class="embed-error">{{ loadError }}</div>

    <template v-else-if="config || rateLimited">
      <header class="embed-header">
        <span class="embed-header__badge" :style="badgeStyle">
          <span v-if="config?.agent_avatar" class="embed-header__avatar">{{ config.agent_avatar }}</span>
          <t-icon v-else :name="headerIcon" size="18px" />
        </span>
        <div class="embed-header__text">
          <h1 class="embed-header__title">{{ headerTitle }}</h1>
          <p v-if="headerSubtitle" class="embed-header__subtitle">{{ headerSubtitle }}</p>
        </div>
        <t-button
          variant="text"
          shape="square"
          size="small"
          class="embed-header__action"
          :disabled="rateLimited || !chatHasMessages"
          :title="$t('embedPublish.newChat')"
          :aria-label="$t('embedPublish.newChat')"
          @click="handleNewChat"
        >
          <template #icon><t-icon name="add" /></template>
        </t-button>
      </header>

      <EmbedChatView
        v-if="sessionId && config"
        :session-id="sessionId"
        :session-sig="sessionSig"
        :visitor-id="visitorId"
        :channel-id="channelId"
        :token="token"
        :agent-id="config.agent_id"
        :kb-ids="kbIds"
        :welcome-message="config.welcome_message"
        :show-suggested-questions="!rateLimited && config.show_suggested_questions !== false"
        :allow-web-search="config.allow_web_search === true"
        :agent-web-search-enabled="config.agent_web_search_enabled === true"
        :allow-file-upload="config.allow_file_upload === true"
        :agent-image-upload-enabled="config.agent_image_upload_enabled === true"
        :use-session-header-title="useSessionHeaderTitle"
        :host-context="hostContext"
        :send-blocked="rateLimited"
        @session-title="sessionTitle = $event"
        @messages-state="chatHasMessages = $event"
        @rate-limited="markRateLimited"
      />
      <!-- 限流发生在拿到会话之前：仍展示输入区，发送按钮禁用并提示 -->
      <div v-else-if="rateLimited" class="embed-degraded">
        <div class="embed-degraded__body">
          <p v-if="welcomeFallback" class="embed-degraded__welcome">{{ welcomeFallback }}</p>
        </div>
        <div class="embed-degraded__input">
          <EmbedInputField :is-replying="false" :send-blocked="true" />
        </div>
      </div>
      <div v-else class="embed-loading">{{ $t('embedPublish.loading') }}</div>
    </template>
    <div v-else-if="awaitingToken" class="embed-loading">{{ $t('embedPublish.awaitingToken') }}</div>
    <div v-else-if="bootstrapping" class="embed-loading">{{ $t('embedPublish.loading') }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import EmbedChatView from '@/views/embed/EmbedChatView.vue'
import EmbedInputField from '@/components/EmbedInputField.vue'
import { useEmbedBridge } from '@/composables/useEmbedBridge'
import { setDefaultProtectedFileAccess } from '@/utils/protectedFileAccess'

const { t } = useI18n()
const route = useRoute()
const channelId = ref(String(route.params.channelId || ''))
const sessionTitle = ref('')
const chatHasMessages = ref(false)

const {
  token,
  config,
  sessionId,
  sessionSig,
  visitorId,
  loadError,
  rateLimited,
  awaitingToken,
  bootstrapping,
  hostContext,
  startNewSession,
  markRateLimited,
} = useEmbedBridge(channelId)

// An embed visitor has no Bearer/tenant credentials, so every protected file in
// this document must go through the channel-scoped proxy. Registering the plane
// once here keeps deeply nested renderers (agent stream, references, wiki
// drawer) from having to thread the channel/token down as props.
watchEffect(() => {
  setDefaultProtectedFileAccess(
    channelId.value && token.value
      ? { mode: 'embed', channelId: channelId.value, token: token.value }
      : null,
  )
})

onUnmounted(() => setDefaultProtectedFileAccess(null))

const handleNewChat = () => {
  // The current session is already empty — reuse it instead of spawning yet
  // another blank session (which would otherwise pile up server-side).
  if (rateLimited.value || !chatHasMessages.value) return
  sessionTitle.value = ''
  startNewSession()
}

const kbIds = computed(() => config.value?.knowledge_base_ids ?? [])

const pageStyle = computed(() => {
  const color = config.value?.primary_color
  if (!color) return {}
  return {
    '--embed-primary': color,
    '--td-brand-color': color,
    '--td-brand-color-hover': color,
    '--td-brand-color-active': color,
  } as Record<string, string>
})

const badgeStyle = computed(() => {
  const color = config.value?.primary_color
  if (!color) return {}
  return {
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
    color,
  } as Record<string, string>
})

const channelDisplayTitle = computed(() => {
  const cfg = config.value
  if (!cfg) return t('embedPublish.defaultChatTitle')
  return (
    cfg.display_title?.trim()
    || cfg.page_title?.trim()
    || cfg.name?.trim()
    || cfg.agent_name?.trim()
    || t('embedPublish.defaultChatTitle')
  )
})

const useSessionHeaderTitle = computed(
  () => config.value?.header_title_mode === 'session',
)

const headerTitle = computed(() => {
  if (useSessionHeaderTitle.value && sessionTitle.value.trim()) {
    return sessionTitle.value.trim()
  }
  return channelDisplayTitle.value
})

const headerSubtitle = computed(() => {
  const cfg = config.value
  if (!cfg?.agent_name) return ''
  if (useSessionHeaderTitle.value && sessionTitle.value.trim()) {
    const fallback = channelDisplayTitle.value
    if (fallback && fallback !== sessionTitle.value.trim()) {
      return fallback
    }
    return cfg.agent_name
  }
  const channelName = cfg.name?.trim()
  if (!channelName || channelName === channelDisplayTitle.value) return ''
  return cfg.agent_name
})

const headerIcon = computed(() => {
  const agentId = config.value?.agent_id || ''
  return agentId && agentId !== 'builtin-quick-answer' ? 'control-platform' : 'chat'
})

const welcomeFallback = computed(() => config.value?.welcome_message?.trim() || '')

watch(headerTitle, (title) => {
  if (title) document.title = title
}, { immediate: true })
</script>

<style scoped lang="less">
.embed-page {
  /* 不用 100vh：iframe 里 vh 可能按外层窗口算，页面会高出预览框，
     文档和外层抽屉一起滚，滑动时整屏闪、抖。 */
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--td-bg-color-container);
  overflow: hidden;
  overscroll-behavior: none;
  /* 子组件（含 AgentStreamDisplay）内凡用 --td-brand-color 的 loading / 强调色均跟随渠道主题 */
  --td-brand-color: var(--embed-primary, var(--td-brand-color));
  --td-brand-color-hover: var(--embed-primary, var(--td-brand-color-hover));
  --td-brand-color-active: var(--embed-primary, var(--td-brand-color-active));

  :deep(.t-button--theme-primary) {
    --td-brand-color: var(--embed-primary, var(--td-brand-color));
    --td-brand-color-hover: var(--embed-primary, var(--td-brand-color-hover));
    --td-brand-color-active: var(--embed-primary, var(--td-brand-color-active));
  }

  :deep(.embed-input-box:focus-within) {
    border-color: var(--embed-primary, var(--td-brand-color));
  }

  :deep(.embed-send-btn:not(.disabled)) {
    background: var(--embed-primary, var(--td-brand-color));
  }
}

.embed-rate-banner {
  flex-shrink: 0;
  padding: 10px 16px;
  font-size: var(--app-text-md);
  line-height: 1.5;
  text-align: center;
  color: var(--td-warning-color);
  background: color-mix(in srgb, var(--td-warning-color) 10%, var(--td-bg-color-container));
  border-bottom: 1px solid color-mix(in srgb, var(--td-warning-color) 22%, var(--td-component-stroke));
}

.embed-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--td-component-stroke);
  background: var(--td-bg-color-container);
  flex-shrink: 0;

  &__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--app-radius-lg);
    flex-shrink: 0;
    background: color-mix(in srgb, var(--td-brand-color) 10%, transparent);
    color: var(--td-brand-color);
  }

  &__avatar {
    font-size: var(--app-text-3xl);
    line-height: 1;
  }

  &__text {
    min-width: 0;
    flex: 1;
  }

  &__action {
    flex-shrink: 0;
    color: var(--td-text-color-secondary);

    &:hover {
      color: var(--td-brand-color);
    }
  }

  &__title {
    margin: 0;
    font-size: var(--app-text-lg);
    font-weight: 600;
    line-height: 1.35;
    color: var(--td-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__subtitle {
    margin: 2px 0 0;
    font-size: var(--app-text-sm);
    line-height: 1.4;
    color: var(--td-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.embed-degraded {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.embed-degraded__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
}

.embed-degraded__welcome {
  margin: 0;
  max-width: min(88%, 520px);
  padding: 10px 14px;
  font-size: var(--app-text-base);
  line-height: 1.55;
  color: var(--td-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
  background: color-mix(
    in srgb,
    var(--embed-primary, var(--td-brand-color)) 7%,
    var(--td-bg-color-container)
  );
  border: 1px solid color-mix(
    in srgb,
    var(--embed-primary, var(--td-brand-color)) 14%,
    var(--td-component-stroke)
  );
  border-radius: 4px 14px 14px 14px;
}

.embed-degraded__input {
  flex-shrink: 0;
  padding: 8px 16px 16px;
  box-sizing: border-box;
}

.embed-error,
.embed-loading {
  padding: 24px;
  text-align: center;
  color: var(--td-text-color-placeholder);
}
</style>
