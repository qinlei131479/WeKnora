<template>
  <el-dialog
    v-model="visible"
    width="720px"
    append-to-body
    class="history-dialog"
    modal-class="interaction-monitor-history-modal"
  >
    <div v-loading="loading" class="history-list">
      <template v-if="records.length">
        <article v-for="item in records" :key="item.id" class="history-item">
          <time>{{ item.questionTime || item.createTime || '' }}</time>

          <div v-if="item.question" class="message-row user-message">
            <div class="message-bubble">{{ item.question }}</div>
            <span class="message-avatar">
              <el-icon>
                <UserFilled />
              </el-icon>
            </span>
          </div>

          <div v-if="item.answer" class="message-row agent-message">
            <span class="message-avatar">
              <el-icon>
                <Cpu />
              </el-icon>
            </span>
            <div class="message-bubble">{{ item.answer }}</div>
          </div>
        </article>
      </template>
      <el-empty v-else description="暂无历史对话记录" />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { Cpu, UserFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { agiChatRecord } from '@/api/agentic/agiChatRecord';
import type { AgiChatRecordVO } from '@/types';

const props = defineProps<{
  modelValue: boolean;
  record?: AgiChatRecordVO;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});
const loading = ref(false);
const records = ref<any[]>([]);

const loadHistory = () => {
  if (!props.record?.id || !props.record.userId) {
    records.value = [];
    return;
  }

  loading.value = true;
  records.value = [];

  (
    agiChatRecord.listByHistory({
      id: props.record.id,
      userId: props.record.userId,
      beforeNum: 20,
      afterNum: 20
    }) as Promise<any>
  )
    .then((res: any) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      records.value = Array.isArray(res.data) ? res.data : [];
    })
    .catch((err: any) => {
      console.error('--> --> 获取历史对话失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取历史对话失败');
    })
    .finally(() => {
      loading.value = false;
    });
};

watch([() => props.modelValue, () => props.record?.id], ([isVisible]: [boolean, number | undefined]) => {
  if (isVisible) {
    loadHistory();
  }
});
</script>

<style lang="less">
.interaction-monitor-history-modal {
  .el-overlay-dialog {
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
  }

  .history-dialog {
    display: flex;
    max-height: min(838px, 100vh);
    flex-direction: column;
    margin: 0;
    overflow: hidden;
    border-radius: 16px;

    .el-dialog__header {
      margin-right: 0;
      padding: 18px 20px;
    }

    .el-dialog__body {
      min-height: 0;
      flex: 1;
      padding: 0;
    }
  }

  .history-list {
    min-height: 320px;
    max-height: calc(min(838px, 100vh) - 56px);
    padding: 20px 24px;
    overflow-y: auto;
  }

  .history-item {
    time {
      display: block;
      margin: 0 0 14px;
      color: var(--el-text-color-placeholder);
      font-size: 12px;
      text-align: center;
    }

    + .history-item {
      margin-top: 20px;
    }
  }

  .message-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;

    + .message-row {
      margin-top: 16px;
    }

    .message-avatar {
      display: inline-flex;
      width: 32px;
      height: 32px;
      flex: none;
      align-items: center;
      justify-content: center;
      border: 1px solid currentColor;
      border-radius: 8px;
      background: transparent;
      color: var(--el-color-primary);

      .el-icon {
        font-size: 20px;
      }
    }

    .message-bubble {
      max-width: min(78%, 520px);
      padding: 12px 14px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      background: var(--color-white);
      color: var(--el-text-color-primary);
      font-size: 13px;
      line-height: 1.75;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    &.user-message {
      justify-content: flex-end;

      .message-avatar {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary);
        color: var(--color-white);
      }

      .message-bubble {
        border-color: var(--el-color-primary-light-8);
        background: var(--el-color-primary-light-9);
      }
    }
  }
}
</style>
