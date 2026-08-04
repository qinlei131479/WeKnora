<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Delete, Plus, Promotion } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import MarkdownIt from 'markdown-it'
import dayjs from 'dayjs'
import { useText2Sql } from '@/composables/useText2Sql'

const md = new MarkdownIt({ breaks: false, linkify: true, typographer: true })
md.disable('hr')

const {
  sessions,
  activeId,
  activeSession,
  sending,
  clientOptions,
  selectedClientToken,
  setSelectedClientToken,
  init,
  createSession,
  selectSession,
  deleteSession,
  send,
  stop,
} = useText2Sql()

const input = ref('')
const listRef = ref<HTMLElement | null>(null)

const displayMessages = computed(() => activeSession.value?.messages ?? [])

function renderMarkdown(text: string) {
  return text ? md.render(text) : ''
}

function showInitialDots(msg: { role: string; content?: string; streaming?: boolean }) {
  return msg.streaming && msg.role === 'assistant' && !msg.content?.trim()
}

function showStreamingDots(msg: { role: string; content?: string; streaming?: boolean }) {
  return msg.streaming && msg.role === 'assistant' && !!msg.content?.trim()
}

function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  })
}

watch(
  () => activeSession.value?.messages.map((m) => `${m.id}:${m.content?.length ?? 0}:${m.streaming}`).join('|'),
  scrollToBottom,
)

async function onDeleteSession(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该会话？删除后不可恢复。', '删除会话', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    deleteSession(id)
  } catch {
    // cancelled
  }
}

function onSend() {
  const text = input.value.trim()
  if (!text || sending.value) return
  send(text)
  input.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    onSend()
  }
}

onMounted(() => init())
</script>

<template>
  <div class="text2sql-page">
    <aside class="sidebar">
      <div class="sidebar__brand">
        <span class="sidebar__logo">问数</span>
        <span class="sidebar__brand-text">智能助手</span>
      </div>
      <div class="sidebar__header">
        <span class="sidebar__title">历史会话</span>
        <el-button type="primary" :icon="Plus" size="small" round @click="createSession">新建</el-button>
      </div>
      <div class="sidebar__list">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: session.id === activeId }"
          @click="selectSession(session.id)"
        >
          <div class="session-item__main">
            <div class="session-item__title">{{ session.title }}</div>
            <div class="session-item__time">{{ dayjs(session.updatedAt).format('MM-DD HH:mm') }}</div>
          </div>
          <el-button
            class="session-item__delete"
            :icon="Delete"
            link
            type="danger"
            @click.stop="onDeleteSession(session.id)"
          />
        </div>
        <el-empty v-if="!sessions.length" description="暂无会话" :image-size="60" />
      </div>
      <router-link class="sidebar__back" to="/login">返回登录</router-link>
    </aside>

    <section class="chat-panel">
      <header class="chat-panel__header">
        <div>
          <h1>{{ activeSession?.title || '智能问数' }}</h1>
          <span class="chat-panel__subtitle">智能对话查询与分析</span>
        </div>
      </header>

      <div class="chat-panel__toolbar">
        <span class="chat-panel__toolbar-label">智能体客户端</span>
        <el-select
          :model-value="selectedClientToken"
          :disabled="sending"
          size="small"
          placeholder="请选择智能体客户端"
          class="chat-panel__client-select"
          @update:model-value="setSelectedClientToken"
        >
          <el-option
            v-for="opt in clientOptions"
            :key="opt.clientToken"
            :label="opt.label"
            :value="opt.clientToken"
          />
        </el-select>
      </div>

      <div ref="listRef" class="message-list">
        <div
          v-for="msg in displayMessages"
          :key="msg.id"
          class="message-bubble"
          :class="msg.role"
        >
          <div class="message-bubble__avatar" :class="msg.role">
            <span>{{ msg.role === 'user' ? '我' : 'AI' }}</span>
          </div>
          <div class="message-bubble__body">
            <div v-if="msg.role === 'user'" class="message-bubble__text">{{ msg.content }}</div>
            <template v-else>
              <div class="message-bubble__text markdown-body">
                <span v-if="showInitialDots(msg)" class="streaming-dots">...</span>
                <template v-else-if="msg.content">
                  <span v-html="renderMarkdown(msg.content)" />
                  <div v-if="showStreamingDots(msg)" class="streaming-dots streaming-dots--ongoing">...</div>
                </template>
              </div>
            </template>
          </div>
        </div>
        <el-empty v-if="!displayMessages.length" description="开始提问吧" />
      </div>

      <div class="chat-input">
        <div class="chat-input__box">
          <el-input
            v-model="input"
            type="textarea"
            :rows="3"
            placeholder="输入问题，Enter 发送，Shift+Enter 换行"
            :disabled="sending"
            resize="none"
            class="chat-input__textarea"
            @keydown="onKeydown"
          />
          <div class="chat-input__toolbar">
            <el-button v-if="sending" type="warning" size="small" round @click="stop">停止</el-button>
            <el-button v-else type="primary" size="small" :icon="Promotion" round @click="onSend">
              发送
            </el-button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.text2sql-page {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 272px;
  border-right: 1px solid #e8ecf1;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  box-shadow: 2px 0 8px rgba(15, 23, 42, 0.03);

  &__brand {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    padding: 0 4px;
  }

  &__logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #409eff, #66b1ff);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
  }

  &__brand-text {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding: 0 4px;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #606266;
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__back {
    margin-top: 12px;
    font-size: 13px;
    color: #409eff;
    text-align: center;
    text-decoration: none;

    &:hover {
      color: #66b1ff;
    }
  }
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;

  &:hover {
    background: #f5f7fa;
    border-color: #e8ecf1;
  }

  &.active {
    background: #ecf5ff;
    border-color: #b3d8ff;
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 13px;
    color: #303133;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }

  &__time {
    margin-top: 4px;
    font-size: 11px;
    color: #909399;
  }

  &__delete {
    opacity: 0.6;
  }
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f5f7fa;

  &__header {
    padding: 18px 28px;
    background: #fff;
    border-bottom: 1px solid #e8ecf1;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);

    h1 {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
  }

  &__subtitle {
    font-size: 12px;
    color: #909399;
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 28px;
    background: #fff;
    border-bottom: 1px solid #e8ecf1;
  }

  &__toolbar-label {
    font-size: 13px;
    color: #606266;
    flex-shrink: 0;
  }

  &__client-select {
    width: 220px;
  }
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  background: linear-gradient(180deg, #f0f4f8 0%, #f5f7fa 100%);
}

.message-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: flex-start;

  &.user {
    flex-direction: row-reverse;

    .message-bubble__body {
      background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
      color: #fff;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
    }
  }

  &.assistant .message-bubble__body {
    background: #fff;
    border: 1px solid #e8ecf1;
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.user {
      background: linear-gradient(135deg, #409eff, #66b1ff);
      color: #fff;
    }

    &.assistant {
      background: linear-gradient(135deg, #67c23a, #85ce61);
      color: #fff;
    }
  }

  &__body {
    max-width: 72%;
    padding: 14px 18px;
    border-radius: 14px;
    font-size: 14px;
    line-height: 1.7;
    min-width: 0;
  }

  &__text {
    word-break: break-word;
  }
}

.streaming-dots {
  color: #909399;
  font-size: 15px;
  letter-spacing: 1px;
  line-height: 1.75;

  &--ongoing {
    margin-top: 10px;
  }
}

.chat-input {
  padding: 16px 28px 20px;
  border-top: 1px solid #e8ecf1;
  background: #fff;

  &__box {
    position: relative;
    border: 1px solid #dcdfe6;
    border-radius: 12px;
    background: #fafbfc;

    &:focus-within {
      border-color: #409eff;
      background: #fff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
    }
  }

  &__textarea :deep(.el-textarea__inner) {
    border: none;
    box-shadow: none;
    background: transparent;
    padding: 12px 14px 44px;
    line-height: 1.6;
    resize: none;
  }

  &__toolbar {
    position: absolute;
    right: 10px;
    bottom: 8px;
  }
}

:deep(.markdown-body) {
  font-size: 15px;
  line-height: 1.8;
  word-break: break-word;
  color: #1f2937;

  p {
    margin: 0 0 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    font-weight: 600;
    color: #111827;
  }

  ul, ol {
    margin: 8px 0 12px;
    padding-left: 22px;
  }

  li {
    margin-bottom: 6px;
  }

  blockquote {
    margin: 10px 0;
    padding: 8px 12px;
    border-left: 3px solid #dcdfe6;
    background: #f9fafb;
    color: #606266;
    font-size: 14px;
  }

  pre {
    background: #f3f4f6;
    padding: 10px 12px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 13px;
  }

  code {
    font-size: 13px;
    background: #f3f4f6;
    padding: 1px 4px;
    border-radius: 4px;
  }

  table {
    border-collapse: collapse;
    margin: 10px 0 12px;
    font-size: 14px;
    width: 100%;
  }

  th, td {
    border: 1px solid #e5e7eb;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
  }

  hr {
    display: none;
  }
}
</style>
