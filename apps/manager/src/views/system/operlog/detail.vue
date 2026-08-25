<template>
  <KJSCDialogV2 title="操作日志详细" v-model="dialogVisible" width="800px" append-to-body showCloseBtn closeBtnText="关闭" :showSubitBtn="false">
    <section class="operlog-detail-wrap">
      <div class="detail-section">
        <div class="detail-section__title">
          <el-icon color="var(--el-color-primary)"><Info /></el-icon>
          基本信息
        </div>
        <div class="detail-section__body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-item__label">操作模块</span>
              <span class="detail-item__value">{{ form.title || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">业务类型</span>
              <span class="detail-item__value">{{ typeLabel }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">操作时间</span>
              <span class="detail-item__value">{{ form.operTime || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">执行状态</span>
              <span class="detail-item__value">
                <el-tag v-if="form.status === 0" type="success">正常</el-tag>
                <el-tag v-else type="danger">异常</el-tag>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">
          <el-icon color="var(--el-color-primary)"><User /></el-icon>
          操作人员
        </div>
        <div class="detail-section__body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-item__label">操作人员</span>
              <span class="detail-item__value">{{ form.operName || '-' }}</span>
            </div>
            <div class="detail-item" v-if="form.deptName">
              <span class="detail-item__label">所属部门</span>
              <span class="detail-item__value">{{ form.deptName }}</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-item__label">操作地址</span>
              <span class="detail-item__value">
                {{ form.operIp || '-' }}
                <span v-if="form.operLocation" class="detail-item__sub">{{ form.operLocation }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">
          <el-icon color="var(--el-color-primary)"><ArrowDownUp /></el-icon>
          请求信息
        </div>
        <div class="detail-section__body">
          <div class="detail-list">
            <div class="detail-item detail-item--full">
              <span class="detail-item__label">请求地址</span>
              <span class="detail-item__value">
                <span :class="'method-tag method-tag--' + (form.requestMethod || '').toLowerCase()">{{ form.requestMethod }}</span>
                {{ form.operUrl }}
              </span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-item__label">操作方法</span>
              <span class="detail-item__value detail-item__value--mono">{{ form.method || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">消耗时间</span>
              <span class="detail-item__value">{{ form.costTime }} 毫秒</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">
          <el-icon color="var(--el-color-primary)"><ArrowUpFromLine /></el-icon>
          请求参数
        </div>
        <div class="detail-section__body">
          <div class="code-block">
            <el-button size="small" class="code-block__copy" @click="copyText(form.operParam)">复制</el-button>
            <pre class="code-block__pre">{{ formatJson(form.operParam) }}</pre>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">
          <el-icon color="var(--el-color-primary)"><ArrowDownToLine /></el-icon>
          返回参数
        </div>
        <div class="detail-section__body">
          <div class="code-block">
            <el-button size="small" class="code-block__copy" @click="copyText(form.jsonResult)">复制</el-button>
            <pre class="code-block__pre">{{ formatJson(form.jsonResult) }}</pre>
          </div>
        </div>
      </div>

      <div class="detail-section detail-section--error" v-if="form.status !== 0">
        <div class="detail-section__title detail-section__title--error">
          <el-icon color="var(--el-color-primary)"><FileWarning /></el-icon>
          异常信息
        </div>
        <div class="detail-section__body">
          <div class="error-msg">{{ form.errorMsg || '（无异常信息）' }}</div>
        </div>
      </div>
    </section>
  </KJSCDialogV2>
</template>

<script setup lang="ts">
import type { SysOperLog } from '@/types/api/system/operlog';
import { ArrowDownToLine, ArrowDownUp, ArrowUpFromLine, FileWarning, Info, User } from 'lucide-vue-next';

const { proxy } = getCurrentInstance();

const props = defineProps<{
  visible: boolean;
  row: SysOperLog;
}>();

const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val)
});

const { sys_oper_type } = proxy.useDict('sys_oper_type');

const form = computed<SysOperLog>(() => props.row || {});
const typeLabel = computed<string>(() => proxy.selectDictLabel(sys_oper_type.value, form.value.businessType) || '-');

function formatJson(str?: string): string {
  if (!str) return '（无数据）';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function copyText(str?: string): void {
  const text = formatJson(str);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => proxy.$modal.msgSuccess({ message: '已复制', type: 'success', duration: 1500 }));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    proxy.$modal.msgSuccess({ message: '已复制', type: 'success', duration: 1500 });
  }
}
</script>

<style lang="scss" scoped>
.operlog-detail-wrap {
  max-height: 65vh;
  overflow-y: auto;
  padding-bottom: 8px;

  .detail-section {
    border: var(--border);
    border-radius: var(--el-border-radius-base);
    overflow: hidden;

    &__title {
      display: flex;
      gap: 0.25em;
      align-items: center;
      font-weight: bold;
      padding: 0.75em;
      background-color: var(--el-menu-hover-bg-color);
      border-bottom: var(--border);
    }

    &__body {
      padding: 16px;
    }

    .detail {
      &-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px 24px;
      }

      &-item {
        display: flex;
        gap: 12px;

        &__label {
          flex-shrink: 0;
          width: 72px;
          color: var(--el-text-color-secondary);
        }

        &__value {
          flex: 1;
          min-width: 0;
          word-break: break-all;
          color: var(--el-text-color-primary);
        }
      }
    }

    .code-block {
      position: relative;
      background: #fbfcfd;
      border: var(--border);
      border-radius: 8px;

      &__pre {
        padding: 0 0.75em;
      }

      &__copy {
        position: absolute;
        top: 5px;
        right: 5px;
        z-index: 1;
      }
    }
  }

  .detail-section:not(:last-child) {
    margin-bottom: 16px;
  }
}
</style>
