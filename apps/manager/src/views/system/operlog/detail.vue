<template>
  <KJSCDialogV2
    title="操作日志详细"
    v-model="dialogVisible"
    width="800px"
    append-to-body
    custom-class="operlog-detail-dialog"
    :showCloseBtn="false"
    :showSubitBtn="false"
  >
    <div class="operlog-detail-wrap">
      <div class="detail-section">
        <div class="detail-section__title">
          <el-icon class="detail-section__icon"><InfoFilled /></el-icon>
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
                <span v-if="form.status === 0" class="status-tag status-tag--success">正常</span>
                <span v-else class="status-tag status-tag--danger">异常</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">
          <el-icon class="detail-section__icon"><User /></el-icon>
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
          <el-icon class="detail-section__icon"><Sort /></el-icon>
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
          <el-icon class="detail-section__icon"><Upload /></el-icon>
          请求参数
        </div>
        <div class="detail-section__body">
          <div class="code-block">
            <button type="button" class="code-block__copy" @click="copyText(form.operParam)">复制</button>
            <pre class="code-block__pre">{{ formatJson(form.operParam) }}</pre>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">
          <el-icon class="detail-section__icon"><Download /></el-icon>
          返回参数
        </div>
        <div class="detail-section__body">
          <div class="code-block">
            <button type="button" class="code-block__copy" @click="copyText(form.jsonResult)">复制</button>
            <pre class="code-block__pre">{{ formatJson(form.jsonResult) }}</pre>
          </div>
        </div>
      </div>

      <div class="detail-section detail-section--error" v-if="form.status !== 0">
        <div class="detail-section__title detail-section__title--error">
          <el-icon class="detail-section__icon"><Warning /></el-icon>
          异常信息
        </div>
        <div class="detail-section__body">
          <div class="error-msg">{{ form.errorMsg || '（无异常信息）' }}</div>
        </div>
      </div>
    </div>
  </KJSCDialogV2>
</template>

<script setup lang="ts">
import type { SysOperLog } from '@/types/api/monitor/operlog'

const { proxy } = getCurrentInstance()

const props = defineProps<{
  visible: boolean
  row: SysOperLog
}>()

const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val)
})

const { sys_oper_type } = proxy.useDict('sys_oper_type')

const form = computed<SysOperLog>(() => props.row || {})
const typeLabel = computed<string>(() => proxy.selectDictLabel(sys_oper_type.value, form.value.businessType) || '-')

function formatJson(str?: string): string {
  if (!str) return '（无数据）'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

function copyText(str?: string): void {
  const text = formatJson(str)
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => proxy.$modal.msgSuccess({ message: '已复制', type: 'success', duration: 1500 }))
  } else {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    proxy.$modal.msgSuccess({ message: '已复制', type: 'success', duration: 1500 })
  }
}
</script>

<style scoped lang="scss">
.operlog-detail-wrap {
  max-height: 65vh;
  overflow-y: auto;
  padding-bottom: 8px;
}

.detail-section {
  border: 1px solid #e1e6ec;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  background: #ffffff;

  &:last-child {
    margin-bottom: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #ebf3f5;
    font-size: 14px;
    font-weight: 600;
    color: #2b2f33;
    border-bottom: 1px solid #e1e6ec;

    &--error {
      background: #fff5f5;
      color: #fe595d;
    }
  }

  &__icon {
    font-size: 16px;
    color: #3297a0;
  }

  &__title--error &__icon {
    color: #fe595d;
  }

  &__body {
    padding: 16px;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  line-height: 20px;

  &--full {
    grid-column: 1 / -1;
  }

  &__label {
    flex-shrink: 0;
    width: 72px;
    color: #77838f;
  }

  &__value {
    flex: 1;
    min-width: 0;
    color: #2b2f33;
    word-break: break-all;

    &--mono {
      font-family: Consolas, 'SFMono-Regular', monospace;
      font-size: 13px;
    }
  }

  &__sub {
    margin-left: 8px;
    color: #a8abb2;
    font-size: 13px;
  }
}

.status-tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;

  &--success {
    background: rgba(49, 171, 160, 0.12);
    color: #31aba0;
  }

  &--danger {
    background: rgba(254, 89, 93, 0.12);
    color: #fe595d;
  }
}

.method-tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  margin-right: 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  vertical-align: middle;

  &--get {
    background: rgba(50, 151, 160, 0.12);
    color: #3297a0;
  }

  &--post {
    background: rgba(41, 178, 118, 0.12);
    color: #29b276;
  }

  &--put {
    background: rgba(255, 153, 0, 0.12);
    color: #e68a00;
  }

  &--delete {
    background: rgba(254, 89, 93, 0.12);
    color: #fe595d;
  }
}

.code-block {
  position: relative;
  background: #fbfcfd;
  border: 1px solid #e1e6ec;
  border-radius: 8px;
  overflow: hidden;
  max-height: 240px;

  &__copy {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1;
    min-width: 56px;
    height: 28px;
    padding: 0 12px;
    border: 1px solid #e1e6ec;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.95);
    color: #77838f;
    font-size: 12px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;

    &:hover {
      border-color: #3297a0;
      color: #3297a0;
    }
  }

  &__pre {
    margin: 0;
    padding: 16px;
    overflow: auto;
    max-height: 240px;
    font-family: Consolas, 'SFMono-Regular', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #2b2f33;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.error-msg {
  padding: 12px 16px;
  border-radius: 8px;
  background: #fff5f5;
  color: #fe595d;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-all;
}
</style>

<style lang="scss">
.operlog-detail-dialog.kjsc-dialog-v2 {
  border-radius: 24px;
  overflow: hidden;
  padding: 0;

  .el-dialog__header {
    padding: 24px 32px 20px;
    margin-right: 0;
    border-bottom: 1px solid #ebeef5;

    .el-dialog__title {
      font-size: 20px;
      font-weight: 600;
      color: #2b2f33;
      line-height: 26px;
    }

    .el-dialog__headerbtn {
      top: 24px;
      right: 24px;
      width: 24px;
      height: 24px;

      .el-dialog__close {
        color: #77838f;
        font-size: 18px;
      }
    }
  }

  .el-dialog__body {
    padding: 20px 32px 32px;
  }

  .el-dialog__footer {
    display: none;
  }
}
</style>
