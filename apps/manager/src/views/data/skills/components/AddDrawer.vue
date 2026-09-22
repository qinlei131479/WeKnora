<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus/es/components/form';
import type { UploadFile, UploadUserFile } from 'element-plus/es/components/upload';
import type { SkillCatalogVO } from '@/types';
import { FileCode, UploadCloud } from 'lucide-vue-next';
import { API } from '@/api';
import { t } from '@/i18n';
import modal from '@/plugins/modal';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';

interface SkillForm {
  source: string;
  file?: File;
}

const emit = defineEmits<{ (event: 'success'): void }>();
const formRef = ref<FormInstance>();
const state = reactive({
  visible: false,
  step: 1,
  saving: false,
  skill: {} as SkillCatalogVO,
  fileList: [] as UploadUserFile[],
  form: { source: '' } as SkillForm
});
let requestId = 0;
const rules = computed<FormRules<SkillForm>>(() => ({
  source: [
    {
      validator: (_rule, value: string, callback) => {
        callback(
          state.form.file || value.trim() ? undefined : new Error(t('page.data.skills.error.sourceOrFileRequired', '请填写技能来源或选择文件'))
        );
      },
      trigger: 'blur'
    }
  ]
}));

const handleAdd = () => {
  ++requestId;
  state.step = 1;
  state.form = { source: '' };
  state.fileList = [];
  state.skill = {};
  state.saving = false;
  state.visible = true;
  nextTick(() => formRef.value?.clearValidate());
};

const handleFileChange = (file: UploadFile) => {
  const raw = file.raw;
  if (!raw) return;
  if (raw.name !== 'SKILL.md' && !/\.zip$/i.test(raw.name)) {
    state.fileList = [];
    state.form.file = undefined;
    modal.msgError(t('page.data.skills.error.fileType', '仅支持 .zip 或 SKILL.md 文件'));
    return;
  }
  state.form.file = raw;
  formRef.value?.clearValidate();
};

const handleFileRemove = () => {
  state.form.file = undefined;
  formRef.value?.clearValidate();
};

const submit = () => {
  if (!formRef.value || state.step !== 1 || state.saving) return;
  const currentRequest = requestId;
  state.saving = true;
  return formRef.value
    .validate()
    .then((valid) => {
      if (!valid || currentRequest !== requestId || !state.visible) return;
      // 来源和文件同时存在时，只提交上传文件。
      const request = state.form.file ? API.Skills.upload(state.form.file) : API.Skills.pull({ source: state.form.source.trim() });
      return request.then((res) => {
        // 第一步成功即已新增，立即刷新列表；第二步完成时不再提交。
        emit('success');
        if (currentRequest !== requestId || !state.visible) return;
        state.skill = res.data || {};
        state.step = 2;
        modal.msgSuccess(t('page.normal.confirmInfo.addSuccess', '新增成功'));
      });
    })
    .catch(() => {
      // 表单展示校验结果，请求错误由全局拦截器提示。
    })
    .finally(() => {
      if (currentRequest === requestId) state.saving = false;
    });
};

watch(
  () => state.visible,
  (visible) => {
    if (!visible) ++requestId;
  },
  { flush: 'sync' }
);

defineExpose({ handleAdd });
</script>

<template>
  <KjscRtlDrawer v-model="state.visible" :class="$style.drawer" :title="$t('page.data.skills.add.title', '新增技能')" :size="800" append-to-body>
    <template #header>
      <div>
        <div class="add-title">{{ $t('page.data.skills.add.title', '新增技能') }}</div>
        <p class="add-hint">
          {{
            state.step === 1
              ? $t('page.data.skills.add.subtitle', '粘贴来源或上传文件，先将技能添加到目录。')
              : $t('page.data.skills.add.completedHint', '技能已添加到目录。')
          }}
        </p>
      </div>
    </template>

    <el-form
      v-if="state.step === 1"
      ref="formRef"
      :model="state.form"
      :rules="rules"
      :validate-on-rule-change="false"
      :disabled="state.saving"
      label-position="top"
      @submit.prevent="submit"
    >
      <el-form-item prop="source">
        <template #label
          ><span class="section-title">{{ $t('page.data.skills.add.source', '从来源添加') }}</span></template
        >
        <p class="section-hint">
          {{ $t('page.data.skills.add.sourceHint', "支持 {'@'}slug、skills-sh:owner/repo/slug、GitHub/GitLab URL、zip 或 SKILL.md 直链") }}
        </p>
        <el-input
          v-model="state.form.source"
          clearable
          :placeholder="$t('page.data.skills.add.sourcePlaceholder', '粘贴技能来源链接或输入技能标识')"
        />
      </el-form-item>

      <el-divider>{{ $t('page.data.skills.add.or', '或者') }}</el-divider>

      <el-form-item>
        <template #label
          ><span class="section-title">{{ $t('page.data.skills.add.upload', '上传本地文件') }}</span></template
        >
        <p class="section-hint">{{ $t('page.data.skills.add.uploadHint', '支持 .zip 技能包或 SKILL.md 文件') }}</p>
        <el-upload
          v-model:file-list="state.fileList"
          class="skill-upload"
          drag
          :auto-upload="false"
          :multiple="false"
          :limit="1"
          :disabled="state.saving"
          accept=".zip,.md"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :on-exceed="() => modal.msgWarning($t('page.data.skills.error.oneFile', '一次只能选择一个技能文件'))"
        >
          <el-icon class="upload-icon" :size="30"><UploadCloud /></el-icon>
          <div class="upload-title">{{ $t('page.data.skills.add.uploadText', '点击上传 .zip 或 SKILL.md 文件') }}</div>
          <p class="add-hint">{{ $t('page.data.skills.add.dropHint', '或将文件拖到此处') }}</p>
        </el-upload>
      </el-form-item>
    </el-form>

    <el-card v-else shadow="never" class="skill-summary">
      <div class="skill-summary-title">
        <el-icon :size="20"><FileCode /></el-icon>
        <span>{{ state.skill.name }}</span>
      </div>
      <p v-if="state.skill.description" class="skill-description">{{ state.skill.description }}</p>
    </el-card>

    <template #footer>
      <template v-if="state.step === 1">
        <el-button @click="state.visible = false">{{ $t('page.normal.cancel', '取消') }}</el-button>
        <el-button type="primary" :loading="state.saving" :disabled="!state.form.file && !state.form.source.trim()" @click="submit">{{
          $t('page.data.skills.add.next', '下一步')
        }}</el-button>
      </template>
      <el-button v-else type="primary" @click="state.visible = false">{{ $t('page.data.skills.add.finish', '完成') }}</el-button>
    </template>
  </KjscRtlDrawer>
</template>

<style lang="scss" module>
.drawer {
  max-width: 100vw;

  :global(.el-drawer__header) {
    padding-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :global(.el-drawer__footer) {
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>

<style scoped lang="scss">
.skill-summary-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.add-title {
  color: var(--el-text-color-primary);
  font-size: 16px;
}

.add-hint,
.section-hint {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.add-hint {
  margin: 4px 0 0;
}

.section-hint {
  width: 100%;
  margin: 0 0 12px;
}

.section-title {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.skill-upload {
  width: 100%;

  :deep(.el-upload-dragger) {
    padding: 24px 20px;
  }
}

.upload-icon {
  width: 56px;
  height: 56px;
  margin-bottom: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 50%;
}

.upload-title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.6;
}

.skill-summary {
  border-radius: var(--layout-radius);
}

.skill-summary-title {
  color: var(--el-text-color-primary);
  font-weight: 600;
  overflow-wrap: anywhere;

  .el-icon {
    flex-shrink: 0;
    color: var(--el-color-primary);
  }
}

.skill-description {
  margin: 12px 0 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
