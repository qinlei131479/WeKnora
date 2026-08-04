<template>
  <el-card shadow="never" class="terminal-card">
    <div class="card-main">
      <div class="avatar-column">
        <el-avatar :size="96" :src="avatarUrl" :alt="terminal.name || ''" />
        <el-tag type="info" effect="plain" class="tag-bold" round>{{ terminalTypeMeta.label }}</el-tag>
      </div>

      <div class="card-content">
        <div class="card-header">
          <div class="terminal-name" :title="terminal.name || ''">{{ terminal.name || '' }}</div>
          <div class="terminal-status">
            <span>启动</span>
            <el-switch
              v-model="statusValue"
              :active-value="1"
              :inactive-value="0"
              :loading="statusLoading"
              :disabled="!configurationComplete"
              @change="handleStatusChange"
            />
          </div>
        </div>

        <div class="credential-box">
          <span class="credential-label">{{ credentialLabel }}</span>
          <strong class="credential-value" :title="credentialValue">{{ credentialValue }}</strong>
          <el-button v-if="credentialValue" text circle title="复制" @click="handleCopy(credentialValue)">
            <el-icon>
              <Check v-if="copiedToken === credentialValue" />
              <Copy v-else />
            </el-icon>
          </el-button>
        </div>

        <div class="brain-list">
          <div class="brain-row">
            <span class="brain-label">基础</span>
            <div class="brain-content base-brain">
              <strong :title="terminal.baseAgentic?.name || '基础半脑'">{{ terminal.baseAgentic?.name || '基础半脑' }}</strong>
              <el-tag v-if="baseCategoryLabel" type="primary2" :title="baseCategoryLabel">
                {{ baseCategoryLabel }}
              </el-tag>
            </div>
          </div>

          <div class="brain-row">
            <span class="brain-label">业务</span>
            <div class="brain-content business-brain">
              <strong :title="terminal.businessAgentic?.name || '业务半脑'">{{ terminal.businessAgentic?.name || '业务半脑' }}</strong>
              <el-tag v-if="businessCategoryLabel" type="blue" :title="businessCategoryLabel">
                {{ businessCategoryLabel }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card-actions">
      <span class="debug-status">调试就绪</span>

      <el-button text circle class="delete-button" title="删除终端" @click="handleDelete">
        <el-icon>
          <Trash2 />
        </el-icon>
      </el-button>

      <div class="action-buttons">
        <btn type="primary" @click="handleTest">
          <el-icon>
            <svg-icon icon-class="play-filled" color="#ffffff" />
          </el-icon>
          对话测试
        </btn>

        <router-link v-if="$auth.hasPermi('agentic:terminal:edit')" class="card-action-link" :to="`/agentic/terminals/edit?id=${terminal.id}`">
          <btn plain :icon="SlidersHorizontal">参数配置</btn>
        </router-link>
        <btn v-else plain :icon="SlidersHorizontal" disabled>参数配置</btn>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Check, Copy, Play, SlidersHorizontal, Trash2 } from 'lucide-vue-next';
import { ElMessage } from 'element-plus';
import { agiClient } from '@/api/agentic/agiClient';
import type { AgiClientVO } from '@/types';
import robotIcon from '@/assets/icons/svg/robot.svg';

const props = defineProps<{
  terminal: AgiClientVO;
  baseCategoryLabel?: string;
  businessCategoryLabel?: string;
}>();

const emit = defineEmits<{
  delete: [terminal: AgiClientVO];
  test: [terminal: AgiClientVO];
}>();

const staticApi = import.meta.env.VITE_APP_STATIC_API || '';
const statusValue = ref<0 | 1>(props.terminal.status ?? 0);
const statusLoading = ref(false);
const copiedToken = ref<string | null>(null);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

type TerminalType = 1 | 2 | 3 | 4;

const typeMeta: Record<TerminalType, { label: string }> = {
  1: { label: '钉钉机器人' },
  2: { label: '企业微信机器人' },
  3: { label: 'H5对话机器人' },
  4: { label: '数字人互动终端' }
};

const terminalTypeMeta = computed(() => typeMeta[(props.terminal.type || 1) as TerminalType] || typeMeta[1]);
const credentialLabel = computed(() => (props.terminal.type === 3 ? 'TOKEN' : 'APP KEY'));
const credentialValue = computed(() => (props.terminal.type === 3 ? props.terminal.clientToken || '' : props.terminal.appKey || ''));

const avatarUrl = computed(() => {
  const icon = props.terminal.icon || '';
  if (!icon) return robotIcon;
  if (/^(https?:|data:|blob:)/i.test(icon) || (staticApi && icon.startsWith(staticApi))) return icon;
  return `${staticApi}${icon}`;
});

const configurationComplete = computed(() =>
  Boolean(
    props.terminal.name &&
    props.terminal.agenticId &&
    ((props.terminal.appKey && props.terminal.appSecret && props.terminal.address) || props.terminal.clientToken)
  )
);

watch(
  () => props.terminal.status,
  (status: 0 | 1 | undefined) => {
    statusValue.value = status ?? 0;
  }
);

const handleStatusChange = (status: 0 | 1) => {
  statusLoading.value = true;
  const request = status === 1 ? agiClient.enable : agiClient.disable;

  request(props.terminal.id as number)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
    })
    .catch((err) => {
      console.error('--> --> 更新终端状态失败', err);
      statusValue.value = status === 1 ? 0 : 1;
      ElMessage.closeAll();
      ElMessage.warning('更新终端状态失败');
    })
    .finally(() => {
      statusLoading.value = false;
    });
};

const handleCopy = (token: string) => {
  const fallbackCopy = () => {
    const textarea = document.createElement('textarea');
    textarea.value = token;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    return result;
  };

  const copyPromise = navigator.clipboard?.writeText
    ? navigator.clipboard
        .writeText(token)
        .then(() => true)
        .catch(() => fallbackCopy())
    : Promise.resolve(fallbackCopy());

  copyPromise
    .then((success) => {
      if (!success) return Promise.reject('复制失败');

      copiedToken.value = token;
      if (copiedTimer) clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => {
        copiedToken.value = null;
      }, 500);
      ElMessage.success('复制成功');
    })
    .catch((err) => {
      console.error('--> --> 复制密钥失败', err);
      ElMessage.warning('复制失败');
    });
};

const handleDelete = () => {
  emit('delete', props.terminal);
};

const handleTest = () => {
  emit('test', props.terminal);
};

onBeforeUnmount(() => {
  if (copiedTimer) clearTimeout(copiedTimer);
});
</script>

<style lang="scss" scoped>
.terminal-card {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  border: 0;
  border-radius: 24px;
  background: var(--el-color-white);

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    padding: 24px !important;
  }
}

.card-main {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 20px;
}

.avatar-column {
  display: flex;
  width: 96px;
  flex: none;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  :deep(.el-avatar) {
    background: rgba(235, 243, 245, 0.6);
  }

  :deep(.el-avatar img) {
    object-fit: cover;
  }
}

.card-content {
  min-width: 0;
  flex: 1;
}

.card-header {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.terminal-name {
  min-width: 0;
  overflow: hidden;
  color: #2b2f33;
  font-size: 18px;
  font-weight: bold;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terminal-status {
  font-size: 14px;
  font-weight: bold;
  color: var(--el-color-primary);

  span {
    padding-right: 10px;
  }
}

.credential-box {
  display: flex;
  height: 40px;
  min-width: 0;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 0 8px 0 12px;
  border: 1px solid var(--el-color-primary);
  border-radius: 8px;
  background: var(--el-color-white);

  :deep(.el-button) {
    width: 28px;
    height: 28px;
    flex: none;
    color: #77838f;
  }
}

.credential-label {
  flex: none;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(235, 243, 245, 0.8);
  color: #77838f;
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
}

.credential-value {
  min-width: 0;
  overflow: hidden;
  flex: 1;
  color: #2b2f33;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brain-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.brain-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.brain-label {
  width: 36px;
  flex: none;
  color: #77838f;
  font-size: 12px;
}

.brain-content {
  display: flex;
  height: 30px;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  border-radius: 8px;

  strong {
    min-width: 0;
    overflow: hidden;
    font-size: 12px;
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.base-brain {
  background: #f1f6f8;
  color: var(--el-color-primary);
}

.business-brain {
  background: #ebf3fc;
  color: #4296ec;

  strong {
    color: #4296ec;
  }
}

.card-actions {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e1e6ec;
}

.debug-status {
  flex: none;
  color: #77838f;
  font-size: 12px;
}

.delete-button.el-button {
  width: 32px;
  height: 32px;
  flex: none;
  color: var(--el-text-color-danger);
}

.action-buttons {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-wrap: wrap;
  gap: 16px;

  > :deep(.btn),
  .card-action-link {
    min-width: 150px;
    flex: 1 1 150px;
  }

  :deep(.btn) {
    width: 100%;
  }
}

.card-action-link {
  display: flex;
  text-decoration: none;
}

@media (max-width: 640px) {
  .card-main {
    flex-direction: column;
  }

  .avatar-column {
    width: 100%;
  }

  .card-content {
    width: 100%;
  }

  .card-actions {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .action-buttons {
    width: 100%;
    flex-basis: 100%;
  }
}

:deep(.tag-bold .el-tag__content) {
  color: #2b2f33;
  font-weight: bold !important;
}
</style>
