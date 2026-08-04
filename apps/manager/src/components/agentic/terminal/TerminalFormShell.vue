<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :validate-on-rule-change="false" class="shell-form">
    <el-card shadow="never" class="shell-card shell-config-card">
      <template #header>
        <div class="panel-header">
          <h2>终端触角形态定义</h2>
          <p>设置本智能体外壳的前置呈现文本和挂载形态。</p>
        </div>
      </template>

      <div class="config-fields">
        <el-form-item label="终端专属呈现名称" prop="name" required>
          <input-radius v-model="form.name" maxlength="50" placeholder="推荐如：智慧教学研究微校智能、高级行政工作保障..." />
        </el-form-item>

        <el-form-item label="对外多外设渠道挂载形态" prop="type" required>
          <el-radio-group v-model="form.type" class="robot-type-group" :class="{ 'is-readonly': statusContext.isEdit }">
            <el-radio v-for="type in robotTypes" :key="type.id" :value="type.id" :disabled="type.id === 4" border>
              <span class="robot-type-content">
                <strong>{{ type.name }}</strong>
                <small>{{ type.desc }}</small>
              </span>
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </div>

      <div class="card-actions">
        <btn type="primary" @click="handleSave">保存</btn>
      </div>
    </el-card>

    <el-card shadow="never" class="shell-card shell-avatar-card">
      <template #header>
        <div class="panel-header">
          <h2>终端专属形象</h2>
          <p>设置本网络渠道终端在各类协同系统中的专属图标视觉。</p>
        </div>
      </template>

      <div class="avatar-preview">
        <span class="preview-title">实时形象预览</span>
        <div class="preview-avatar">
          <img
            v-if="previewImage || activePresetTheme"
            :src="previewImage || `${staticApi}${activePresetTheme?.icon || ''}`"
            :alt="form.avatarTitle || activePresetTheme?.name || ''"
          />
          <button v-if="previewImage" type="button" class="clear-avatar" @click="clearCustomImage">清除自定义</button>
        </div>
        <strong>{{ form.avatarTitle || activePresetTheme?.name || 'IT-BOT' }}</strong>
        <p>挂载形态：{{ selectedRobotType?.name }}</p>
      </div>

      <radio-group v-model="form.avatarTab" class="avatar-mode-switch" @change="handleAvatarTabChange">
        <el-radio-button value="preset">选择系统内置形象预设</el-radio-button>
        <el-radio-button value="custom">
          <span class="avatar-mode-option">
            <Upload />
            上传自定义形象
          </span>
        </el-radio-button>
      </radio-group>

      <el-radio-group v-if="form.avatarTab === 'preset'" v-model="form.icon" class="avatar-preset-group" @change="handlePresetChange">
        <el-radio v-for="robot in statusContext.buildInRobots" :key="robot.id" :value="robot.icon" border>
          <span class="avatar-preset-content">
            <span class="avatar-preset-info">
              <strong>{{ robot.name }}</strong>
              <small>{{ robot.description }}</small>
            </span>
            <img :src="`${staticApi}${robot.icon}`" :alt="robot.name" />
          </span>
        </el-radio>
      </el-radio-group>

      <div v-else class="custom-avatar-panel">
        <div class="upload-requirements">
          <h3>自定义形象规格要求</h3>
          <div class="requirement-grid">
            <span>推荐比例：<strong>1:1（正方形）</strong></span>
            <span>推荐尺寸：<strong>≥200×200 px</strong></span>
            <span>支持格式：<strong>PNG、JPG、JPEG</strong></span>
            <span>大小限制：<strong class="danger-text">不超过 2 MB</strong></span>
          </div>
        </div>

        <div ref="elUploadWrapper" class="el-upload-wrapper">
          <el-upload
            ref="uploadInstance"
            class="avatar-upload"
            :action="uploadFileUrl"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImageChange"
            :on-success="handleSuccess"
            :on-error="handleError"
            accept="image/*"
            :limit="1"
            :on-exceed="handleExceed"
            :headers="{ Authorization: getBearerToken() }"
          >
            <div class="upload-dropzone">
              <Upload />
              <strong>点击选择本地图片上传</strong>
              <span>支持正方形、透明背景 PNG 以获得更佳视觉形态</span>
            </div>
          </el-upload>
        </div>

        <div v-if="previewImage" class="uploaded-note">
          <Upload />
          <span>您已上传自定义底图。如需更换，请点击上方虚线框重新选择，或切回系统内置形象。</span>
        </div>
      </div>
    </el-card>
  </el-form>
</template>

<script setup lang="ts">
import { Upload } from 'lucide-vue-next';
import { uploadFileUrl } from '@/utils/api';
import { getBearerToken } from '@/utils/auth';
import { checkFileTypeAndSize, imgTypeArr, getFilesUrl } from '@/utils/common';
import { genFileId, ElMessage } from 'element-plus';

const elUploadWrapper = ref<HTMLElement | null>(null);
const uploadInstance = ref<any>();
const pendingImageFile = ref<any>();
const localPreviewUrl = ref('');
let resolveUpload: ((path: string) => void) | undefined;
let rejectUpload: ((reason?: any) => void) | undefined;

const emit = defineEmits<{
  save: [];
}>();

const statusContext = inject('statusContext');
const form = statusContext.form;
const staticApi = import.meta.env.VITE_APP_STATIC_API || '';
const formRef = ref();
const rules = {
  name: [{ required: true, message: '请填写终端专属呈现名称', trigger: 'submit' }],
  type: [{ required: true, message: '请选择对外多外设渠道挂载形态', trigger: 'submit' }]
};
const robotTypes = [
  { id: 1, name: '钉钉机器人', desc: '钉钉网页钩子与卡片' },
  { id: 2, name: '企业微信机器人', desc: '企业微信应用消息与对话' },
  { id: 3, name: 'H5 对话机器人', desc: '独立网页交互对话沙盒' },
  { id: 4, name: '数字人互动终端', desc: '虚拟形象主播声音和合成' }
];
const selectedRobotType = computed(() => robotTypes.find((item) => item.id === form.type));

const handleClickCustom = () => {
  form.avatarTab = 'custom';
  if (!previewImage.value) {
    triggerUpload();
  }
};

const clearPendingImage = () => {
  uploadInstance.value?.clearFiles();
  pendingImageFile.value = undefined;
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value);
    localPreviewUrl.value = '';
  }
};

const clearCustomImage = () => {
  clearPendingImage();
  form.customUploadedImage = '';
  form.icon = '';
};

const handlePresetTab = () => {
  clearPendingImage();
  form.avatarTab = 'preset';
  form.customUploadedImage = '';
  if (!statusContext.buildInRobots.some((item: any) => item.icon === form.icon)) {
    form.icon = statusContext.buildInRobots[0]?.icon || '';
  }
};

const handleAvatarTabChange = (value: string | number | boolean | undefined) => {
  if (value === 'preset') {
    handlePresetTab();
  } else if (value === 'custom') {
    handleClickCustom();
  }
};
const triggerUpload = () => {
  nextTick(() => elUploadWrapper.value?.querySelector<HTMLInputElement>('input[type="file"]')?.click());
};

const activePresetTheme = computed(
  () =>
    statusContext.buildInRobots.find((item: any) => item.icon === form.icon) ||
    statusContext.buildInRobots.find((item: any) => item.id === form.avatarThemeId) ||
    statusContext.buildInRobots[0]
);

const previewImage = computed(() => {
  if (localPreviewUrl.value) {
    return localPreviewUrl.value;
  }
  return form.avatarTab === 'custom' && form.customUploadedImage ? getFilesUrl(form.customUploadedImage) : '';
});

const handleSuccess = (response: any) => {
  const result = response || { code: 500 };
  if (result.resultCode === '-1' || result.code >= 400) {
    ElMessage.error(result.resultMsg || result.msg || '系统错误');
    rejectUpload?.(result.msg || '上传失败');
    return;
  }
  const path = result.data?.url;
  if (!path) {
    rejectUpload?.('上传结果中缺少图片路径');
    return;
  }
  form.icon = path;
  form.customUploadedImage = path;
  clearPendingImage();
  const resolve = resolveUpload;
  resolveUpload = undefined;
  rejectUpload = undefined;
  resolve?.(path);
};

const validateImage = (file: any) => {
  const fileType = imgTypeArr;
  const fileSize = 2;
  const res = checkFileTypeAndSize(file, fileSize, fileType);
  if (!res.isType) {
    ElMessage.error('只能上传【' + fileType.join('、') + '】类型的文件!');
    return false;
  }

  if (!res.isLt) {
    ElMessage.error('上传图片大小不能超过' + fileSize + 'MB!');
    return false;
  }
  return true;
};

const handleExceed = (files: any) => {
  uploadInstance.value!.clearFiles();
  const file = files[0];
  file.uid = genFileId();
  uploadInstance.value!.handleStart(file);
};

const handleImageChange = (file: any) => {
  pendingImageFile.value = file;
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value);
  }
  localPreviewUrl.value = URL.createObjectURL(file.raw);
};

const handleError = (error: any) => {
  ElMessage.error('上传失败！');
  const reject = rejectUpload;
  resolveUpload = undefined;
  rejectUpload = undefined;
  reject?.(error);
};

const handlePresetChange = (icon: string) => {
  clearPendingImage();
  form.avatarTab = 'preset';
  form.customUploadedImage = '';
  const robot = statusContext.buildInRobots.find((item: any) => item.icon === icon);
  if (robot) {
    form.avatarThemeId = robot.id;
    form.avatarTitle = robot.name;
  }
};

const validate = () => formRef.value.validate();

const initialize = () => nextTick(() => formRef.value?.clearValidate());

const handleSave = () => {
  emit('save');
};

const uploadImage = () => {
  if (form.avatarTab === 'preset') {
    const robot = statusContext.buildInRobots.find((item: any) => item.icon === form.icon);
    form.icon = robot?.icon || '';
    return Promise.resolve(form.icon);
  }
  if (statusContext.isEdit && form.customUploadedImage && !pendingImageFile.value) {
    return Promise.resolve(form.icon);
  }
  if (!pendingImageFile.value) {
    ElMessage.warning('请选择本地图片');
    return Promise.reject('未选择本地图片');
  }
  if (!validateImage(pendingImageFile.value.raw)) {
    return Promise.reject('图片校验未通过');
  }
  return new Promise<string>((resolve, reject) => {
    resolveUpload = resolve;
    rejectUpload = reject;
    uploadInstance.value.submit();
  });
};

defineExpose({ validate, uploadImage, initialize });

if (!statusContext.isEdit) {
  form.type = robotTypes[0].id;
}

onBeforeUnmount(() => {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value);
  }
});
</script>

<style lang="scss" scoped>
.shell-form {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  padding-bottom: 20px;
}

.shell-card {
  width: 100%;
  border: 0;
  border-radius: 24px;
  background: var(--el-color-white);

  :deep(.el-card__header) {
    padding: 24px 36px 0;
    border: 0;
  }

  :deep(.el-card__body) {
    padding: 20px 36px 28px;
  }
}

.shell-config-card {
  min-height: 446px;
}

.panel-header {
  h2 {
    margin: 0;
    color: #2b2f33;
    font-size: 16px;
    font-weight: bold;
    line-height: 24px;
  }

  p {
    margin: 8px 0 0;
    color: #b0bac6;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
  }
}

.config-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

:deep(.el-form-item__label) {
  height: auto;
  margin-bottom: 8px;
  padding: 0;
  color: #77838f;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

:deep(.el-form-item__content),
:deep(.input-radius) {
  width: 100%;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 36px;

  :deep(.btn) {
    min-width: 84px;
  }
}

.robot-type-group {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  &.is-readonly {
    pointer-events: none;
  }

  :deep(.el-radio.is-bordered) {
    display: flex;
    width: 100%;
    height: 68px;
    align-items: center;
    margin: 0;
    padding: 12px 14px;
    border-color: transparent;
    border-radius: 14px;
    background-color: #f3f8f9;

    .el-radio__input {
      display: none;
    }

    .el-radio__label {
      min-width: 0;
      flex: 1;
      padding-left: 0;
    }

    &.is-checked {
      border-color: var(--el-color-primary);
      background-color: #ebf3f5;
      background-image: url('@/assets/images/brain/checked.png');
      background-position: right top;
      background-repeat: no-repeat;
      background-size: 24px 24px;
    }

    &.is-disabled {
      border-color: transparent;
      background-color: #f5f5f5;

      .robot-type-content strong,
      .robot-type-content small {
        color: #b0bac6;
      }
    }
  }
}

.robot-type-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: #2b2f33;
    font-size: 14px;
    font-weight: bold;
    line-height: 20px;
  }

  small {
    color: #b0bac6;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
  }
}

.avatar-preview {
  position: relative;
  display: flex;
  min-height: 280px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 12px;
  background: #f3f8f9;

  .preview-title {
    position: absolute;
    top: 20px;
    left: 20px;
    color: #2b2f33;
    font-size: 12px;
    font-weight: 400;
  }

  > strong {
    margin-top: 14px;
    color: #2b2f33;
    font-size: 14px;
    font-weight: bold;
    line-height: 20px;
  }

  > p {
    margin: 6px 0 0;
    color: #77838f;
    font-size: 12px;
    line-height: 18px;
  }
}

.preview-avatar {
  position: relative;
  width: 120px;
  height: 120px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--el-color-white);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .clear-avatar {
    position: absolute;
    inset: 0;
    border: 0;
    background: rgba(43, 47, 51, 0.68);
    color: var(--el-color-white);
    cursor: pointer;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .clear-avatar {
    opacity: 1;
  }
}

.avatar-mode-switch.radio-group {
  display: flex;
  width: 100%;
  max-width: 100%;
  margin-top: 20px;

  :deep(.el-radio-button) {
    min-width: 0;
    flex: 1 1 50%;
  }

  :deep(.el-radio-button__inner) {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
  }
}

.avatar-mode-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  svg {
    width: 16px;
    height: 16px;
  }
}

.avatar-preset-group {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;

  :deep(.el-radio.is-bordered) {
    display: flex;
    width: 100%;
    height: 68px;
    align-items: center;
    margin: 0;
    padding: 10px 14px;
    border-color: transparent;
    border-radius: 13px;
    background-color: #f3f8f9;

    .el-radio__input {
      display: none;
    }

    .el-radio__label {
      width: 100%;
      min-width: 0;
      padding-left: 0;
    }

    &.is-checked {
      border-color: var(--el-color-primary);
      background-color: #ebf3f5;
      background-image: url('@/assets/images/brain/checked.png');
      background-position: right top;
      background-repeat: no-repeat;
      background-size: 24px 24px;
    }
  }
}

.avatar-preset-content {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  img {
    width: 36px;
    height: 36px;
    flex: none;
    border-radius: 50%;
    object-fit: cover;
  }
}

.avatar-preset-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: #2b2f33;
    font-size: 13px;
    font-weight: bold;
  }

  small {
    color: #b0bac6;
    font-size: 11px;
    font-weight: 400;
  }
}

.custom-avatar-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.upload-requirements {
  padding: 16px 20px;
  border: 1px solid #e1e6ec;
  border-radius: 12px;
  background: var(--el-color-white);

  h3 {
    margin: 0 0 12px;
    color: #2b2f33;
    font-size: 14px;
    font-weight: bold;
  }
}

.requirement-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 24px;
  color: #77838f;
  font-size: 12px;
  line-height: 18px;

  strong {
    color: #2b2f33;
    font-weight: 400;
  }

  .danger-text {
    color: var(--el-color-danger);
  }
}

.el-upload-wrapper,
.avatar-upload,
:deep(.avatar-upload .el-upload) {
  width: 100%;
}

.upload-dropzone {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-height: 156px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  border: 1px dashed #e1e6ec;
  border-radius: 12px;
  background: #f3f8f9;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
  }

  svg {
    width: 24px;
    height: 24px;
    color: var(--el-color-primary);
  }

  strong {
    color: #2b2f33;
    font-size: 14px;
    font-weight: bold;
  }

  span {
    color: #77838f;
    font-size: 12px;
  }
}

.uploaded-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid #e1e6ec;
  border-radius: 8px;
  background: #f3f8f9;
  color: #77838f;
  font-size: 12px;
  line-height: 18px;

  svg {
    width: 16px;
    height: 16px;
    flex: none;
    color: var(--el-color-primary);
  }
}

@media (max-width: 1100px) {
  .shell-form {
    grid-template-columns: 1fr;
  }
}
</style>
