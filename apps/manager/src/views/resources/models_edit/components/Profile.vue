service-note--full-row
<template>
  <el-card shadow="never" class="form-panel">
    <template #header>
      <div class="panel-header">
        <div class="panel-title">服务接口配置</div>
      </div>
    </template>

    <div class="service-note">
      <el-icon class="service-note-icon">
        <Server />
      </el-icon>
      <div class="service-note-content">
        <div class="service-note-title">内置接入方式：Web / 互联网 API 接入</div>
        <div class="service-note-desc">采用标准的 RESTful 网络协议进行通信，系统会统一通过待机鉴权将请求下发至模型服务端接口。</div>
      </div>
    </div>

    <div class="form-grid">
      <el-form-item label="接口规范标准">
        <el-select v-model="model.interfaceType">
          <el-option label="OpenAI 兼容协议" :value="1" />
          <!-- <el-option label="Ollama 本地模型协议" :value="2" /> -->
          <!-- <el-option label="自定义网关代理标准" :value="3" /> -->
        </el-select>
      </el-form-item>

      <el-form-item class="form-item--col-2_3">
        <template #label>
          <span>&nbsp;</span>
        </template>
        <input-radius
          value="如果是局域网内部部署的模型，请检查本系统容器所在子网、安全组与端口路由规则，并填写可被正常访问的路由地址。"
          disabled
        ></input-radius>
      </el-form-item>

      <el-form-item label="Base URL" prop="baseUrl" required>
        <input-radius v-model="model.baseUrl" maxlength="255" placeholder="例如：https://api.deepseek.com/v1" />
      </el-form-item>
      <el-form-item label="Model ID" prop="modelCode" required>
        <input-radius v-model="model.modelCode" maxlength="255" placeholder="例如：deepseek-chat" />
      </el-form-item>
      <el-form-item label="API Key / Token" prop="apiKey" required>
        <input-radius v-model="model.apiKey" type="password" maxlength="255" placeholder="sk-..." show-password />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { ModelVO } from '@/types';
import { Server } from 'lucide-vue-next';

const model = defineModel<ModelVO>({ required: true });

if (!model.value.interfaceType) {
  model.value.interfaceType = 1;
}
</script>

<style scoped lang="less">
.form-panel {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  border: 0;
  border-radius: 24px;

  :deep(.el-card__header) {
    padding: 20px 40px;
    border: 0;
  }

  :deep(.el-card__body) {
    padding: 0 60px 32px 60px;
  }

  :deep(.el-select) {
    width: 100%;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.panel-title {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 700;
}

.sandbox-tag {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;
  border-color: var(--el-color-primary-light-5);
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  white-space: nowrap;

  :deep(.el-tag__content) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
}

.service-note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 18px;
  padding: 12px 16px;
  border: 1px solid #e1e6ec;
  border-radius: 8px;
  background: rgba(235, 243, 245, 0.6);

  &--two-columns {
    grid-column: span 2;
    padding-top: 22px;
  }

  &-icon {
    flex: none;
    color: var(--el-color-primary);
    font-size: 24px;
    margin-top: 6px;
  }

  &-content {
    padding-top: 8px;
  }

  &-title {
    color: #2b2f33;
    font-size: 14px;
    font-weight: bold;
  }

  &-desc {
    margin-top: 8px;
    color: #77838f;
    font-size: 12px;
  }
}
</style>
