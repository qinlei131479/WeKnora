<template>
  <el-dialog
    v-model="visible"
    width="640px"
    append-to-body
    align-center
    modal
    :show-close="false"
    class="terminal-test-dialog"
    modal-class="terminal-test-dialog-overlay"
    @closed="handleClosed"
  >
    <template #header>
      <div class="dialog-header">
        <div class="dialog-title">
          <strong>{{ terminal?.name || '' }}</strong>
          <span>在线调试测试</span>
        </div>
        <button type="button" class="dialog-close" aria-label="关闭" @click="closeSandbox">
          <X />
        </button>
      </div>
    </template>

    <div class="terminal-test-body">
      <div ref="chatScrollRef" class="chat-scroll">
        <div v-for="(message, index) in chatMessages" :key="index" class="message-row" :class="{ 'is-user': message.sender === 'user' }">
          <el-avatar :size="32" :src="message.sender === 'user' ? userAvatar : terminalAvatar" />
          <div class="message-bubble">{{ message.text }}</div>
        </div>

        <div v-if="isTyping" class="message-row">
          <el-avatar :size="32" :src="terminalAvatar" />
          <div class="message-bubble typing-bubble">
            <span>大脑搜索中</span>
            <span class="typing-dots"><i /><i /><i /></span>
          </div>
        </div>
      </div>

      <div class="suggestion-list">
        <button v-for="question in suggestedQuestions" :key="question" type="button" :disabled="isTyping" @click="handleSendSuggested(question)">
          {{ question }}
        </button>
      </div>

      <form class="chat-form" @submit.prevent="handleSendMessage">
        <input-round v-model="chatInput" :disabled="isTyping" clearable placeholder="在此输入测试问题，敲击回车发送..." />
        <btn type="primary" circle native-type="submit" :icon="Send" :disabled="isTyping" />
      </form>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { Send, X } from 'lucide-vue-next';
import type { AgiClientVO } from '@/types';
import userAvatar from '@/assets/images/model/avatar-mockuser.png';
import robotIcon from '@/assets/icons/svg/robot.svg';

type ChatMessage = {
  sender: 'user' | 'bot';
  text: string;
};

const props = withDefaults(
  defineProps<{
    row?: AgiClientVO | null;
  }>(),
  {
    row: null
  }
);

const emit = defineEmits<{
  close: [];
}>();

const visible = ref(false);
const terminal = ref<AgiClientVO | null>(null);
const chatMessages = ref<ChatMessage[]>([]);
const chatInput = ref('');
const isTyping = ref(false);
const chatScrollRef = ref<HTMLDivElement | null>(null);
const staticApi = import.meta.env.VITE_APP_STATIC_API || '';
let responseTimer: ReturnType<typeof setTimeout> | undefined;

const suggestedQuestions = ['你好，请介绍一下你自己', '请问企业 WiFi 密码是多少？', '如何向系统申请请假流程'];
const DEMO_REPLY = '对话测试功能不在本期开发计划内，所以此回复仅为样式演示。';

const terminalAvatar = computed(() => {
  const icon = terminal.value?.icon || '';
  if (!icon) return robotIcon;
  if (/^(https?:|data:|blob:)/i.test(icon) || (staticApi && icon.startsWith(staticApi))) return icon;
  return `${staticApi}${icon}`;
});

const resetConversation = () => {
  if (responseTimer) {
    clearTimeout(responseTimer);
    responseTimer = undefined;
  }
  chatMessages.value = [];
  chatInput.value = '';
  isTyping.value = false;
};

watch(
  () => props.row,
  (row: AgiClientVO | null | undefined) => {
    resetConversation();
    terminal.value = row || null;
    visible.value = Boolean(row);

    if (row) {
      chatMessages.value = [
        {
          sender: 'bot',
          text: `您好！我是「${row.name || '智能体交互终端'}」。由于对话测试功能不在本期开发计划内，所以此回复仅为样式演示。`
        }
      ];
    }
  },
  { immediate: true }
);

watch(
  [chatMessages, isTyping],
  async () => {
    await nextTick();
    if (chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
    }
  },
  { deep: true }
);

const sendQuestion = (question: string) => {
  if (!terminal.value || isTyping.value) return;

  chatMessages.value = [...chatMessages.value, { sender: 'user', text: question }];
  isTyping.value = true;

  responseTimer = setTimeout(() => {
    chatMessages.value = [...chatMessages.value, { sender: 'bot', text: DEMO_REPLY }];
    isTyping.value = false;
    responseTimer = undefined;
  }, 850);
};

const handleSendSuggested = (question: string) => {
  sendQuestion(question);
};

const handleSendMessage = () => {
  const question = chatInput.value.trim();
  if (!question) return;

  chatInput.value = '';
  sendQuestion(question);
};

const closeSandbox = () => {
  visible.value = false;
};

const handleClosed = () => {
  resetConversation();
  terminal.value = null;
  emit('close');
};

onBeforeUnmount(resetConversation);
</script>

<style lang="scss" scoped>
:global(.terminal-test-dialog-overlay) {
  background-color: var(--el-overlay-color);
  backdrop-filter: blur(4px);
}

:global(.terminal-test-dialog.el-dialog) {
  display: flex;
  width: min(640px, calc(100vw - 32px)) !important;
  height: min(560px, calc(100vh - 32px));
  margin: auto;
  flex-direction: column;
  border-radius: 24px;
  overflow: hidden;
}

:global(.terminal-test-dialog .el-dialog__header) {
  flex: none;
  margin: 0;
  padding: 20px 32px 16px;
  border-bottom: 1px solid #e1e6ec;
}

:global(.terminal-test-dialog .el-dialog__body) {
  display: flex;
  min-height: 0;
  flex: 1;
  padding: 16px 32px 24px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.dialog-title {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 12px;

  strong {
    overflow: hidden;
    color: #2b2f33;
    font-size: 16px;
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    flex: none;
    color: #77838f;
    font-size: 12px;
  }
}

.dialog-close {
  display: inline-flex;
  width: 28px;
  height: 28px;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #77838f;
  cursor: pointer;

  svg {
    width: 22px;
    height: 22px;
  }
}

.terminal-test-body {
  display: flex;
  width: 100%;
  min-height: 0;
  flex-direction: column;
}

.chat-scroll {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;

  :deep(.el-avatar) {
    flex: none;
    background: rgba(235, 243, 245, 0.6);
  }

  &.is-user {
    flex-direction: row-reverse;

    .message-bubble {
      background: rgba(255, 255, 255, 0.6);
    }
  }
}

.message-bubble {
  max-width: calc(100% - 84px);
  padding: 14px 16px;
  border: 1px solid #e1e6ec;
  border-radius: 12px;
  background: rgba(235, 243, 245, 0.6);
  color: #2b2f33;
  font-size: 12px;
  line-height: 20px;
}

.typing-bubble {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #77838f;
}

.typing-dots {
  display: inline-flex;
  gap: 4px;

  i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #77838f;
    animation: typing 0.8s infinite alternate;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

.suggestion-list {
  display: flex;
  flex: none;
  gap: 8px;
  margin-top: 16px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  button {
    height: 28px;
    flex: none;
    padding: 0 12px;
    border: 0;
    border-radius: 6px;
    background: #f5f5f5;
    color: #2b2f33;
    cursor: pointer;
    font-family: inherit;
    font-size: 11px;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
}

.chat-form {
  display: flex;
  flex: none;
  align-items: center;
  gap: 16px;
  margin-top: 8px;

  :deep(.input-round) {
    min-width: 0;
    flex: 1;
  }
}

@keyframes typing {
  from {
    transform: translateY(0);
    opacity: 0.45;
  }

  to {
    transform: translateY(-3px);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  :global(.terminal-test-dialog .el-dialog__header) {
    padding-right: 20px;
    padding-left: 20px;
  }

  :global(.terminal-test-dialog .el-dialog__body) {
    padding-right: 20px;
    padding-left: 20px;
  }
}
</style>
