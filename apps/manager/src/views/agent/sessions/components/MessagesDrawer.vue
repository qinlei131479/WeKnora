<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue';
import MarkdownIt from 'markdown-it';
import { API } from '@/api';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import type { MessagesPageDTO, MessagesVO, PageDomain, SessionsVO } from '@/types';

interface MessageView extends MessagesVO {
  contentHtml: string;
}

const PAGE_SIZE = 30;

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    session?: SessionsVO;
  }>(),
  {
    modelValue: false,
    session: () => ({})
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

// 将 <kb> 知识库引用转换为 Markdown 标签，并还原 doc 属性中的 HTML 转义字符
const convertKnowledgeBaseCitationToMarkdown = (content: string): string => {
  const decoder = document.createElement('textarea');

  return content.replace(/<kb(?=\s)([^>]*)\/\s*>/gi, (tag, attributes: string) => {
    const docMatch = attributes.match(/(?:^|\s)doc\s*=\s*(["'])(.*?)\1(?=\s|$)/i);
    if (!docMatch) return tag;

    decoder.innerHTML = docMatch[2];
    return t('page.agent.sessions.message.knowledgeBaseCitation', { doc: decoder.value }, '[[知识库] {doc}](#)');
  });
};

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
});

const messagesContentRef = ref<HTMLElement>();
const scrollContainerRef = ref<HTMLElement>();
const state = reactive({
  messages: [] as MessageView[],
  pageNum: 0,
  total: 0,
  hasMore: false,
  loading: false
});

let requestToken = 0;

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const drawerTitle = computed(() => props.session.title || t('page.agent.sessions.table.newSession', '新对话'));

const bindScrollContainer = () => {
  scrollContainerRef.value?.removeEventListener('scroll', handleScroll);
  scrollContainerRef.value = messagesContentRef.value?.parentElement || undefined;
  scrollContainerRef.value?.addEventListener('scroll', handleScroll, { passive: true });
};

const unbindScrollContainer = () => {
  scrollContainerRef.value?.removeEventListener('scroll', handleScroll);
  scrollContainerRef.value = undefined;
};

const isCurrentRequest = (token: number, sessionId: string) => {
  return token === requestToken && visible.value && props.session.id === sessionId;
};

const createMessageViews = (rows: MessagesVO[]): MessageView[] => {
  return rows
    .slice()
    .reverse()
    .map((message) => ({
      ...message,
      contentHtml: markdown.render(convertKnowledgeBaseCitationToMarkdown(message.content || ''))
    }));
};

const loadMessages = (pageNum: number, initial: boolean) => {
  const sessionId = props.session.id;
  if (!sessionId || state.loading) return;

  const token = requestToken;
  const scrollContainer = scrollContainerRef.value;
  const previousScrollHeight = scrollContainer?.scrollHeight || 0;
  const previousScrollTop = scrollContainer?.scrollTop || 0;
  const dto = { sessionId } as MessagesPageDTO;
  const page = {
    pageNum,
    pageSize: PAGE_SIZE,
    orderByColumn: 'createdAt',
    isAsc: 'desc'
  } as PageDomain;
  let loaded = false;

  state.loading = true;
  API.Messages.list(dto, page)
    .then((res) => {
      if (!isCurrentRequest(token, sessionId)) return;

      const messages = createMessageViews(res.rows || []);
      if (initial) {
        state.messages.length = 0;
        state.messages.push(...messages);
      } else {
        state.messages.unshift(...messages);
      }

      state.pageNum = pageNum;
      state.total = res.total || 0;
      state.hasMore = messages.length > 0 && state.messages.length < state.total;
      loaded = true;
    })
    .catch((error) => {
      if (isCurrentRequest(token, sessionId)) {
        console.error('--> --> Error:', error);
      }
    })
    .finally(() => {
      if (!isCurrentRequest(token, sessionId)) return;

      state.loading = false;
      if (!loaded) return;

      nextTick(() => {
        const target = scrollContainerRef.value;
        if (!target) return;

        if (initial) {
          target.scrollTop = target.scrollHeight;
        } else {
          target.scrollTop = previousScrollTop + target.scrollHeight - previousScrollHeight;
        }

        if (state.hasMore && target.scrollHeight <= target.clientHeight) {
          loadMessages(state.pageNum + 1, false);
        }
      });
    });
};

const resetMessages = () => {
  requestToken += 1;
  unbindScrollContainer();
  state.messages.length = 0;
  state.pageNum = 0;
  state.total = 0;
  state.hasMore = false;
  state.loading = false;
};

const loadInitialMessages = () => {
  resetMessages();
  bindScrollContainer();
  loadMessages(1, true);
};

function handleScroll(event: Event) {
  const target = event.currentTarget as HTMLElement;
  if (target.scrollTop > 1 || state.loading || !state.hasMore) return;
  loadMessages(state.pageNum + 1, false);
}

onBeforeUnmount(resetMessages);
</script>

<template>
  <KjscRtlDrawer
    v-model="visible"
    :size="860"
    :title="drawerTitle"
    :show-cancel="false"
    :show-confirm="false"
    @opened="loadInitialMessages"
    @closed="resetMessages"
  >
    <template #header>
      <el-text v-if="props.session.title">{{ props.session.title }}</el-text>
      <el-text v-else type="info" style="font-style: italic">{{ $t('page.agent.sessions.table.newSession', '新对话') }}</el-text>
    </template>

    <div ref="messagesContentRef">
      <el-row v-if="state.loading" justify="center">
        <el-icon class="is-loading"><Loading /></el-icon>
      </el-row>

      <el-space v-if="state.messages.length" direction="vertical" fill :size="16">
        <el-row v-for="message in state.messages" :key="message.id" :justify="message.role === 'user' ? 'end' : 'start'">
          <div v-if="message.role === 'user'" v-html="message.contentHtml" class="message message-user"></div>
          <el-col v-else :span="24">
            <div v-html="message.contentHtml" class="message message-assistant"></div>
          </el-col>
        </el-row>
      </el-space>
    </div>
  </KjscRtlDrawer>
</template>

<style lang="scss" scoped>
/** 参考前端网页，尽量还原呈现消息样式 */
.message {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 1.625;
  letter-spacing: normal;
  word-break: normal;
  overflow-wrap: normal;
  -webkit-font-smoothing: antialiased;

  :deep(p) {
    margin: 0 0 0.25em;
    line-height: 1.625;
  }

  :deep(p + p) {
    margin-top: 0.75em;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(p + ul),
  :deep(p + ol),
  :deep(ul + p),
  :deep(ol + p),
  :deep(blockquote + p),
  :deep(p + blockquote) {
    margin-top: 0.75em;
  }

  :deep(strong) {
    font-weight: 600;
  }

  :deep(em) {
    font-style: italic;
  }

  :deep(del) {
    text-decoration: line-through;
    opacity: 0.72;
  }

  :deep(h1) {
    margin: 0 0 0.375em;
    font-size: 1.5em;
    font-weight: 600;
    line-height: 1.333;
  }

  :deep(h2) {
    margin: 1em 0 0.25em;
    font-size: 1.25em;
    font-weight: 600;
    line-height: 1.4;
  }

  :deep(h3) {
    margin: 0.875em 0 0.25em;
    font-size: 1.125em;
    font-weight: 600;
    line-height: 1.556;
  }

  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 1em 0 0;
    font-weight: 600;
    line-height: 1.5;
  }

  :deep(h4) {
    font-size: 1em;
  }

  :deep(h5) {
    font-size: 0.9375em;
  }

  :deep(h6) {
    font-size: 0.875em;
  }

  :deep(h1:first-child),
  :deep(h2:first-child),
  :deep(h3:first-child),
  :deep(h4:first-child),
  :deep(h5:first-child),
  :deep(h6:first-child) {
    margin-top: 0;
  }

  :deep(ul) {
    margin: 0.35em 0 0.75em;
    padding-left: 1.625em;
    list-style-position: outside;
    list-style-type: disc;
  }

  :deep(ol) {
    margin: 0.35em 0 0.75em;
    padding-left: 1.625em;
    list-style-position: outside;
    list-style-type: decimal;
  }

  :deep(ul ul),
  :deep(ol ol) {
    margin: 0.25em 0 0;
    padding-left: 1.25em;
  }

  :deep(li) {
    margin: 0;
    padding-left: 0.375em;
    line-height: 1.625;
  }

  :deep(li + li) {
    margin-top: 0.375em;
  }

  :deep(li::marker) {
    font-weight: 700;
  }

  :deep(li > p) {
    margin: 0;
  }

  :deep(li > p + p) {
    margin-top: 0.25em;
  }

  :deep(li > ul),
  :deep(li > ol) {
    margin-top: 0.25em;
    margin-bottom: 0;
  }

  :deep(blockquote) {
    margin: 0.5em 0 0.75em;
    padding: 0.5em 0 0.5em 1.25em;
    font-style: normal;
    font-weight: 400;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
    background-color: var(--el-fill-color-light);
    border-left: 2px solid var(--el-border-color);
  }

  :deep(blockquote blockquote) {
    margin-top: 0.35em;
    margin-bottom: 0;
  }

  :deep(blockquote p) {
    line-height: 1.5;
  }

  :deep(pre) {
    margin: 0.75em 0;
    padding: 14px 16px;
    overflow-x: auto;
    font-family: monospace;
    font-size: 13px;
    line-height: 1.55;
    background-color: var(--el-fill-color-light);
    border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
    border-radius: var(--el-border-radius-base);
  }

  :deep(code) {
    padding: 0.15em 0.3em;
    font-family: monospace;
    font-size: 0.875em;
    font-weight: 500;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
  }

  :deep(pre code) {
    display: block;
    padding: 0;
    font-size: inherit;
    font-weight: 400;
    white-space: pre;
    background-color: transparent;
    border-radius: 0;
  }

  :deep(table) {
    display: table;
    width: 100%;
    min-width: max-content;
    margin: 0.875em 0 1em;
    overflow: hidden;
    font-size: 14px;
    line-height: 1.55;
    word-break: initial;
    border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
    border-collapse: separate;
    border-spacing: 0;
    border-radius: var(--el-border-radius-base);
  }

  :deep(th),
  :deep(td) {
    margin: 0;
    padding: 8px 12px;
    text-align: left;
    border-top: 0;
    border-right: var(--el-border-width) var(--el-border-style) var(--el-border-color);
    border-bottom: var(--el-border-width) var(--el-border-style) var(--el-border-color);
    border-left: 0;
  }

  :deep(th) {
    font-weight: 600;
    white-space: nowrap;
    vertical-align: middle;
    background-color: var(--el-fill-color-light);
  }

  :deep(td) {
    vertical-align: top;
  }

  :deep(th:last-child),
  :deep(td:last-child) {
    border-right: 0;
  }

  :deep(tbody tr:last-child td) {
    border-bottom: 0;
  }

  :deep(th[align='center']),
  :deep(td[align='center']) {
    text-align: center;
  }

  :deep(th[align='right']),
  :deep(td[align='right']) {
    text-align: right;
  }

  :deep(a) {
    color: var(--el-color-primary);
    text-decoration-line: underline;
    text-underline-offset: 0.18em;
  }

  :deep(img) {
    display: block;
    width: auto;
    height: auto;
    max-width: 80%;
    max-height: 300px;
    margin: 1.25em 0;
    object-fit: contain;
    border: 0.5px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
  }

  :deep(p:has(> img:only-child)) {
    margin: 1.25em 0;
    line-height: 0;
  }

  :deep(hr) {
    margin: 1.75em 0;
    border-top: var(--el-border-width) var(--el-border-style) var(--el-border-color);
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
  }

  &-user {
    background-color: var(--el-bg-color-page);
    border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    width: max-content;
    max-width: 580px;
    padding: 10px;

    :deep(p) {
      margin-block-start: 0;
      margin-block-end: 0;
    }
  }

  &-assistant {
    width: 820px;
  }
}
</style>
