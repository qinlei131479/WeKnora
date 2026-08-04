<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :validate-on-rule-change="false" class="credentials-page">
    <div v-if="form.type === 3" class="h5-layout">
      <section class="credentials-card h5-guide-card">
        <header class="section-header">
          <strong>多端渠道物理 / 逻辑通信凭证</strong>
          <p>钉钉或企业微信等平台级参数填写。针对 H5 网页，系统会自动分发终端独享的安全通信网络密件。</p>
        </header>

        <div class="h5-guide">
          <strong>Web H5 沙盒无阻连机制</strong>
          <p>
            对于「H5 网页对话端」或「数字人互动终端」场景，无需填写繁琐多样的企微钉钉第三方 Secret。
            系统开箱自增一条长效通信线路，研发团队只需复制右侧生成的 “Terminal-Token” 并作为入参置于网页初始化脚本，就能立刻在网页中获取即时交互应答！
          </p>
        </div>

        <div class="credentials-actions">
          <btn type="primary" @click="emit('save')">保存</btn>
        </div>
      </section>

      <section class="credentials-card token-card">
        <header class="section-header token-header">
          <strong>专属核心 Terminal-Token 密钥</strong>
          <p>这是唯一的企业终端通信签名，用作该终端身份识别，不应泄漏此 Token。</p>
        </header>

        <el-form-item prop="terminalToken" class="token-form-item">
          <div class="token-value">
            <span class="token-label">TOKEN</span>
            <code :title="form.terminalToken || ''">{{ form.terminalToken || '' }}</code>
            <el-button text circle class="copy-button" :title="copied ? '已复制' : '复制 Token'" @click="handleCopyToken">
              <el-icon>
                <Check v-if="copied" />
                <Copy v-else />
              </el-icon>
            </el-button>
          </div>
        </el-form-item>

        <footer class="token-footer">
          <InfoFilled />
          <p>该通信节点默认在 Cloud Run 隔离区激活。协议底层选用 HTTPS 多端分子路由，最大支持 2,500 级高吞吐并发吞吐。</p>
        </footer>
      </section>
    </div>

    <section v-else class="credentials-card platform-card">
      <header class="section-header">
        <strong>多端渠道物理 / 逻辑通信凭证</strong>
        <p>钉钉或企业微信等平台级参数填写。针对不同渠道，请配置对应的应用凭证和异步推送地址。</p>
      </header>

      <div class="credentials-form">
        <div class="form-row">
          <el-form-item label="应用客户端标识(AppKey/AgentId)" prop="appKey" required>
            <input-radius v-model="form.appKey" placeholder="钉钉 or 企微后台的应用 Key / Id" />
          </el-form-item>
          <el-form-item label="多端凭证书密文(AppSecret/AccessToken)" prop="appSecret" required>
            <input-radius v-model="form.appSecret" type="password" show-password placeholder="应用对应的 AppSecret 私钥密文" />
          </el-form-item>
        </div>

        <el-form-item label="异步推送Webhook地址(钉钉/企微特定接受回调端)" prop="address" class="address-item">
          <input-radius v-model="form.address" placeholder="https://api.dingtalk.com/robot/send?access_token=..." />
          <div class="field-tip">
            <InfoFilled />
            <span>一旦设置该钩子，基础左脑的审核规则及右脑应答结果将异步推送该特定端点。</span>
          </div>
        </el-form-item>
      </div>

      <div class="credentials-actions">
        <btn type="primary" @click="emit('save')">保存</btn>
      </div>
    </section>
  </el-form>
</template>

<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue';
import { Check, Copy } from 'lucide-vue-next';
import { ElMessage } from 'element-plus';

const statusContext: any = inject('statusContext');
const form = statusContext.form;
const emit = defineEmits<{ save: [] }>();
const formRef = ref();
const copied = ref(false);
const rules = {
  appKey: [{ required: true, message: '请填写应用客户端标识', trigger: 'submit' }],
  appSecret: [{ required: true, message: '请填写多端凭证书密文', trigger: 'submit' }]
};

const handleCopyToken = () => {
  const token = form.terminalToken || '';
  const fallbackCopy = () => {
    const textarea = document.createElement('textarea');
    textarea.value = token;
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
      if (!success) {
        return Promise.reject('复制失败');
      }
      copied.value = true;
      ElMessage.success('Token 已复制');
      window.setTimeout(() => {
        copied.value = false;
      }, 500);
    })
    .catch(() => {
      ElMessage.warning('Token 复制失败');
    });
};

const validate = () => formRef.value.validate();
const initialize = () => {
  copied.value = false;
  formRef.value?.clearValidate?.();
};

defineExpose({ validate, initialize });
</script>

<style lang="scss" scoped>
.credentials-page {
  width: 100%;
  padding-bottom: 20px;
  color: #2b2f33;
  font-size: 12px;
}

.h5-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 1fr);
  align-items: stretch;
  gap: 20px;
}

.credentials-card {
  min-width: 0;
  padding: 24px 40px 28px;
  border: 0;
  border-radius: 24px;
  background: var(--el-color-white);
}

.h5-guide-card,
.token-card {
  min-height: 300px;
}

.section-header {
  > strong {
    display: block;
    color: #2b2f33;
    font-size: 16px;
    font-weight: bold;
    line-height: 24px;
  }

  > p {
    margin: 8px 0 0;
    color: #b0bac6;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
  }
}

.h5-guide {
  margin-top: 20px;
  padding: 12px 16px;
  border: 1px solid #bbdfe8;
  border-radius: 12px;
  background: rgba(235, 243, 245, 0.6);

  > strong {
    color: #2b2f33;
    font-size: 14px;
    font-weight: bold;
    line-height: 20px;
  }

  p {
    margin: 8px 0 0;
    color: #77838f;
    font-size: 12px;
    font-weight: 400;
    line-height: 20px;
  }
}

.credentials-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 36px;

  :deep(.btn) {
    min-width: 84px;
  }
}

.token-card {
  display: flex;
  flex-direction: column;
}

.token-form-item {
  margin: 52px 0 0;

  :deep(.el-form-item__content) {
    width: 100%;
  }
}

.token-value {
  display: flex;
  width: 100%;
  min-height: 40px;
  align-items: center;
  gap: 10px;
  padding: 0 10px 0 12px;
  border: 1px solid var(--el-color-primary);
  border-radius: 8px;
  background: var(--el-color-white);

  .token-label {
    flex: none;
    padding: 4px 8px;
    border-radius: 2px;
    background: rgba(235, 243, 245, 0.8);
    color: #77838f;
    font-size: 11px;
    line-height: 18px;
  }

  code {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    color: #2b2f33;
    font-family: inherit;
    font-size: 12px;
    font-weight: 400;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-button {
    width: 28px;
    height: 28px;
    flex: none;
    padding: 0;
    color: #77838f;
  }
}

.token-footer {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 40px;

  > svg {
    width: 16px;
    height: 16px;
    flex: none;
    margin-top: 1px;
    color: #77838f;
  }

  p {
    margin: 0;
    color: #77838f;
    font-size: 12px;
    font-weight: 400;
    line-height: 20px;
  }
}

.platform-card {
  width: 100%;
}

.credentials-form {
  width: auto;
  margin-top: 20px;

  .form-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  :deep(.el-form-item) {
    width: 100%;
    margin-bottom: 20px;

    .el-form-item__label {
      height: auto;
      padding-bottom: 8px;
      color: #77838f;
      font-size: 14px;
      font-weight: 400;
      line-height: 20px;
    }
  }

  .address-item {
    margin-bottom: 0;
  }
}

.field-tip {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 8px;
  margin-top: 8px;
  color: #b0bac6;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;

  > svg {
    width: 14px;
    height: 14px;
    flex: none;
    margin-top: 2px;
    color: #77838f;
  }
}

.credentials-form,
.credentials-actions,
.h5-guide,
.token-form-item {
  margin-right: 20px;
  margin-left: 20px;
}

@media (max-width: 992px) {
  .h5-layout {
    grid-template-columns: 1fr;
  }

  .credentials-form .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
