<template>
  <div class="terminal-form-page">
    <div class="page-header">
      <div class="header-title">
        <el-button :icon="ArrowLeft" text circle @click="handleBack" />
        <div>
          <h1>智能体交互终端配置</h1>
          <p>终端触角中心 / 终端设备集成装配</p>
        </div>
      </div>

      <btn class="cancel-button" @click="handleBack">取消</btn>
    </div>

    <el-tabs v-model="statusContext.activeStep" stretch class="terminal-step-tabs" :before-leave="beforeTabLeave">
      <el-tab-pane :name="1" lazy>
        <template #label>
          <span class="step-label">
            <span class="step-index" :class="{ 'is-complete': statusContext.activeStep > 1 }">
              <Check v-if="statusContext.activeStep > 1" />
              <template v-else>01</template>
            </span>
            <span>外壳形象</span>
          </span>
        </template>
        <TerminalFormShell ref="shellFormRef" @save="handleSave" />
      </el-tab-pane>

      <el-tab-pane :name="2" :disabled="!props.id" lazy>
        <template #label>
          <span class="step-label">
            <span class="step-index" :class="{ 'is-complete': statusContext.activeStep > 2 }">
              <Check v-if="statusContext.activeStep > 2" />
              <template v-else>02</template>
            </span>
            <span>智能体大脑</span>
          </span>
        </template>
        <TerminalFormBrain ref="brainFormRef" @save="handleSave" />
      </el-tab-pane>

      <el-tab-pane :name="3" :disabled="!props.id" lazy>
        <template #label>
          <span class="step-label">
            <span class="step-index">03</span>
            <span>通信通道及凭证密钥</span>
          </span>
        </template>
        <TerminalFormCredentials ref="credentialsFormRef" @save="handleSave" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ArrowLeft, Check } from 'lucide-vue-next';

import TerminalFormShell from './TerminalFormShell.vue';
import TerminalFormBrain from './TerminalFormBrain.vue';
import TerminalFormCredentials from './TerminalFormCredentials.vue';

import { agiClient } from '@/api/agi';
import { ElMessage } from 'element-plus';

const router = useRouter();
const shellFormRef = ref();
const brainFormRef = ref();
const credentialsFormRef = ref();

const props = defineProps({
  id: {
    type: String,
    default: ''
  }
});

const statusContext = reactive({
  isEdit: Boolean(props.id),
  activeStep: (window.history.state?.activeStep === 2 ? 2 : 1) as 1 | 2 | 3,
  form: {
    name: '',
    type: undefined as any,
    icon: '',
    boundAgentId: '',
    appKey: '',
    appSecret: '',
    address: '',
    avatarThemeId: 'avatar_smart_blue',
    avatarTitle: 'IT-BOT',
    customUploadedImage: '',
    terminalToken: '',
    avatarTab: 'preset'
  },
  buildInRobots: [
    { id: 'avatar_smart_zhi', name: '小智', description: '智能常识专家', icon: '/client/zhi.png' },
    { id: 'avatar_smart_hui', name: '小慧', description: '常理通讯专家', icon: '/client/hui.png' },
    { id: 'avatar_smart_chuang', name: '小创', description: '党政思政专家', icon: '/client/chuang.png' }
  ]
});
provide('statusContext', statusContext);

const { form } = statusContext;

const handleBack = () => {
  router.push('/agentic/terminalslist');
};

const initializeStep = async (step: 1 | 2 | 3) => {
  await nextTick();
  if (step === 1) {
    return shellFormRef.value?.initialize?.();
  }
  if (step === 2) {
    return brainFormRef.value?.initialize?.();
  }
  return credentialsFormRef.value?.initialize?.();
};

const beforeTabLeave = (nextName: string | number) => {
  const step = Number(nextName) as 1 | 2 | 3;
  if (step === 1) {
    return true;
  }
  if (!props.id) {
    ElMessage.warning('请先完成「第1步，外壳形象」保存');
    return false;
  }
  if (!form.name.trim()) {
    ElMessage.error('请先在第1步输入“终端专属名称」');
    return false;
  }
  return true;
};

watch(
  () => statusContext.activeStep,
  (step: 1 | 2 | 3) => {
    void initializeStep(step);
  }
);
const handleSave = () => {
  if (statusContext.activeStep == 1) {
    shellFormRef.value
      .validate()
      .then(() => shellFormRef.value.uploadImage())
      .then((icon: string) => {
        if (statusContext.isEdit) {
          return agiClient.updateInfo({
            id: Number(props.id),
            name: form.name,
            type: form.type,
            icon
          });
        }
        return agiClient.insert({ name: form.name, type: form.type, icon });
      })
      .then((res: any) => {
        if (res.code !== 200) {
          return Promise.reject(res.msg);
        }
        if (statusContext.isEdit) {
          ElMessage.success('保存成功');
          statusContext.activeStep = 2;
          return;
        }
        const id = res.data?.id;
        if (!id) {
          return Promise.reject('新增终端应答中缺少 id');
        }
        ElMessage.success('注册成功');
        return router.push({
          path: '/agentic/terminals/edit',
          query: { id },
          state: { activeStep: 2 }
        });
      })
      .catch((err: any) => {
        console.error('--> --> 保存外壳形象失败', err);
      });
  }
  if (statusContext.activeStep == 2) {
    brainFormRef.value
      .validate()
      .then(() =>
        agiClient.updateAgentic({
          id: Number(props.id),
          agenticId: form.boundAgentId ? Number(form.boundAgentId) : undefined
        })
      )
      .then((res: any) => {
        if (res.code !== 200) {
          return Promise.reject(res.msg);
        }
        ElMessage.success('保存成功');
        statusContext.activeStep = 3;
      })
      .catch((err: any) => {
        console.error('--> --> 保存智能体大脑失败', err);
      });
  }
  if (statusContext.activeStep == 3) {
    if (form.type === 3) {
      ElMessage.closeAll();
      ElMessage.success('保存成功');
    }

    credentialsFormRef.value
      .validate()
      .then(() =>
        agiClient.updateSecret({
          id: Number(props.id),
          appKey: form.appKey,
          appSecret: form.appSecret,
          address: form.address,
          clientToken: form.terminalToken
        })
      )
      .then((res: any) => {
        if (res.code !== 200) {
          return Promise.reject(res.msg);
        }
        ElMessage.closeAll();
        ElMessage.success('保存成功');
      })
      .catch((err: any) => {
        console.error('--> --> 保存通信凭证失败', err);
      });
  }
};

const getTerminalDetail = () => {
  agiClient
    .single(Number(props.id))
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      const data: any = res.data || {};
      Object.assign(form, data);
      form.type = data.type == null ? undefined : Number(data.type);
      form.boundAgentId = data.agenticId || '';
      form.address = data.address || '';
      form.terminalToken = data.clientToken || '';
      if (data.icon?.startsWith('/client')) {
        const fileName = data.icon.split('/').pop();
        const preset = statusContext.buildInRobots.find((item: any) => item.icon.split('/').pop() === fileName);
        form.avatarTab = 'preset';
        form.avatarThemeId = preset?.id || '';
        form.avatarTitle = preset?.name || '';
        form.customUploadedImage = '';
      } else if (data.icon) {
        form.avatarTab = 'custom';
        form.customUploadedImage = data.icon;
      }
    })
    .catch((err) => {
      console.error('--> --> 获取终端信息失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取终端信息失败');
    });
};

onMounted(() => {
  if (props.id) {
    getTerminalDetail();
  } else {
    form.avatarThemeId = statusContext.buildInRobots[0].id;
    form.icon = statusContext.buildInRobots[0].icon;
    form.terminalToken = `tk_h5_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString().slice(-6)}`;
  }

  void initializeStep(statusContext.activeStep);
});
</script>

<style lang="scss" scoped>
.terminal-form-page {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
}

.page-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 20px;
}

.header-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 20px;

  :deep(.el-button) {
    width: 36px;
    height: 36px;
    flex: none;
    padding: 0;
    color: #77838f;
  }

  :deep(.el-button .el-icon) {
    font-size: 24px;
  }

  h1 {
    margin: 0;
    color: #2b2f33;
    font-size: 20px;
    font-weight: bold;
    line-height: 28px;
  }

  p {
    margin: 8px 0 0;
    color: #77838f;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
  }
}

.cancel-button {
  width: 84px;
  flex: none;
}

.terminal-step-tabs {
  display: flex;
  width: 100%;
  min-width: 860px;
  max-width: 1420px;
  min-height: 0;
  margin: 18px auto 0;
  flex: 1;
  flex-direction: column;

  :deep(.el-tabs__header) {
    flex: none;
    margin: 0 0 18px;
    border-radius: 12px;
    background: var(--el-color-white);
  }

  :deep(.el-tabs__nav-wrap::after),
  :deep(.el-tabs__active-bar) {
    display: none;
  }

  :deep(.el-tabs__nav-scroll),
  :deep(.el-tabs__nav),
  :deep(.el-tabs__item) {
    height: 44px;
  }

  :deep(.el-tabs__item) {
    position: relative;
    color: #77838f;
    font-size: 14px;
    font-weight: 400;

    &.is-active {
      color: var(--el-color-primary);
      font-weight: bold;
    }

    &.is-disabled {
      color: #b0bac6;
      cursor: not-allowed;
    }
  }

  :deep(.el-tabs__content) {
    min-height: 0;
    flex: 1;
    overflow-y: auto;
  }

  :deep(.el-tab-pane) {
    min-height: 100%;
  }
}

.step-label {
  position: relative;
  display: inline-flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &::after {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: calc(100% + 24px);
    height: 4px;
    border-radius: 4px 4px 0 0;
    background: transparent;
    content: '';
    transform: translateX(-50%);
  }
}

.step-index {
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e1e6ec;
  color: #77838f;
  font-size: 11px;
  font-weight: bold;
  line-height: 1;

  svg {
    width: 14px;
    height: 14px;
  }

  &.is-complete {
    background: var(--el-color-primary);
    color: var(--el-color-white);
  }
}

:deep(.el-tabs__item.is-active) .step-index {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

:deep(.el-tabs__item.is-active) .step-label::after {
  background: var(--el-color-primary);
}

:deep(.el-tabs__item.is-disabled) .step-index {
  background: #e1e6ec;
  color: #b0bac6;
}
</style>
