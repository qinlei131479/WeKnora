<template>
  <my-page class="skill-edit-my-page">
    <div class="page-header">
      <div class="header-title">
        <el-button :icon="ArrowLeft" text circle @click="handleCancel" />
        <div>
          <h1>导入 Agent Skills（智能体能力包）</h1>
          <p>导入遵循 Anthropic Agent Skill 规范标准的能力包，一键为大模型赋予垂直领域专业能力。</p>
        </div>
      </div>

      <div class="header-actions">
        <btn @click="handleCancel">取消</btn>
        <btn type="primary" :icon="Send" :loading="ui.saving" :disabled="!ui.parsed || ui.saving" @click="handleSave"> 确认无误并发布 </btn>
      </div>
    </div>

    <el-form ref="formRef" :model="formModel" :rules="rules" :validate-on-rule-change="false" label-position="top" class="skill-edit-page">
      <Step1 v-model="formModel" :categories="categories" />

      <el-card shadow="never" class="form-panel source-panel">
        <div class="source-grid">
          <button
            class="source-card"
            :class="{ 'is-active': ui.sourceType === 1 }"
            type="button"
            :aria-pressed="ui.sourceType === 1"
            :disabled="ui.uploading || ui.gitLoading"
            @click="selectSource(1)"
          >
            <CloudUpload />
            <span class="source-card-content">
              <strong>上传本地 ZIP 资源包</strong>
              <span>直接上传打包好的 Agent Skill 规范压缩包。适用于内网受限隔离环境，无需 network 外联。</span>
            </span>
          </button>

          <button
            class="source-card"
            :class="{ 'is-active': ui.sourceType === 2 }"
            type="button"
            :aria-pressed="ui.sourceType === 2"
            :disabled="ui.uploading || ui.gitLoading"
            @click="selectSource(2)"
          >
            <GitBranch />
            <span class="source-card-content">
              <strong>远端代码仓库直连</strong>
              <span>通过 HTTPS/SSH 连接企业内部 GitLab/GitHub 节点，支持从指定分支或目录解析能力包。</span>
            </span>
          </button>
        </div>

        <section v-if="ui.sourceType === 1" class="action-section upload-section">
          <h2 class="section-title">上传本地构建包</h2>
          <p class="package-tip">
            <Info />
            <span>
              系统在接收上传后，会自动解析包根目录的
              <el-tag size="small" type="primary2" effect="light">SKILL.md</el-tag>
              文件。请确保该文件包含正确的 YAML Frontmatter 描述。
            </span>
          </p>

          <button
            class="upload-dropzone"
            :class="{ 'is-uploading': ui.uploading }"
            :disabled="ui.uploading"
            type="button"
            @click="triggerZipSelect"
            @dragover.prevent
            @drop.prevent="handleZipDrop"
          >
            <CloudUpload />
            <strong>{{ ui.uploadResolved ? `已选择：${ui.selectedZipName}` : '点击或拖拽上传 .ZIP 文件' }}</strong>
            <span>{{ ui.uploadResolved ? '重新选择或拖拽文件以替换' : '内含 SKILL.md、配置与脚手架源码等' }}</span>
            <span class="upload-select-button">
              <LoaderCircle v-if="ui.uploading" class="is-loading" />
              {{ ui.uploadResolved ? '重新上传并解析' : '选择 .ZIP 文件' }}
            </span>
          </button>

          <input
            ref="zipInputRef"
            class="zip-input"
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            @change="handleZipChange"
          />
        </section>

        <section v-else class="action-section git-section">
          <h2 class="section-title">配置 Git 仓库源</h2>

          <div class="repo-form">
            <div class="repo-url-row">
              <el-form-item label="代码仓克隆地址 (HTTPS/SSH)" required class="repo-url">
                <input-radius
                  v-model="repo.url"
                  :disabled="ui.gitLoading"
                  placeholder="https://github.com/org/your-awesome-skill.git"
                  @update:model-value="handleRepoChange"
                />
              </el-form-item>
              <btn class="oauth-button" plain :icon="KeyRound">OAuth 授权浏览</btn>
            </div>

            <el-form-item label="分支或标签 (Branch/Tag)">
              <input-radius v-model="repo.branch" :disabled="ui.gitLoading" placeholder="main" @update:model-value="handleRepoChange" />
            </el-form-item>

            <el-form-item label="Skill 根目录限制">
              <input-radius v-model="repo.path" :disabled="ui.gitLoading" placeholder="/（默认仓库根目录）" @update:model-value="handleRepoChange" />
            </el-form-item>
          </div>

          <div class="panel-actions">
            <btn type="primary" :icon="GitBranch" :loading="ui.gitLoading" :disabled="ui.gitLoading" @click="handleImportGit">
              连接并解析根目录配置
            </btn>
          </div>
        </section>

        <Step2 v-if="ui.parsed" v-model="formModel" :source-type="ui.sourceType" :domain-label="domainLabel" />
      </el-card>
    </el-form>
  </my-page>
</template>

<script setup lang="ts">
import { ArrowLeft, CloudUpload, GitBranch, Info, KeyRound, LoaderCircle, Send } from 'lucide-vue-next';
import { ElMessage } from 'element-plus';
import type { FormInstance as ElFormInstance } from 'element-plus/es/components/form';
import type { FormRules as ElFormRules } from 'element-plus/es/components/form/src/types';
import { agiSkill } from '@/api/agi';
import { agiCategory } from '@/api/settings/category';
import type { CategoryVO, SkillImportVO } from '@/types';
import Step1 from './components/Step1.vue';
import Step2 from './components/Step2.vue';

const router = useRouter();
const formRef = ref<ElFormInstance>();
const zipInputRef = ref<HTMLInputElement>();
const categories = ref<CategoryVO[]>([]);
const stateSkill = history.state?.skill as { categoryId?: number } | undefined;

const formModel = reactive({
  categoryId: stateSkill?.categoryId,
  owner: 'System',
  version: 'v1.0.0',
  name: '',
  description: '',
  uuid: ''
});

const ui = reactive({
  sourceType: 1 as 1 | 2,
  parsed: false,
  uploading: false,
  uploadResolved: false,
  selectedZipName: '',
  gitLoading: false,
  saving: false
});

const repo = reactive({
  url: '',
  branch: '',
  path: ''
});

const rules = computed<ElFormRules<typeof formModel>>(() => ({
  categoryId: [{ required: true, message: '请选择归属领域分类', trigger: 'submit' }],
  owner: [{ required: true, message: '请填写维护者', trigger: 'submit' }],
  version: [{ required: true, message: '请填写版本号', trigger: 'submit' }]
}));

const domainLabel = computed(() => {
  const stack = categories.value.map((item: any) => ({ item, path: [item.name || ''] }));

  while (stack.length) {
    const current = stack.shift();
    if (!current) continue;
    if (current.item.id === formModel.categoryId) return current.path.filter(Boolean).join(' / ');

    (current.item.childrenList || []).forEach((child: any) => {
      stack.push({ item: child, path: [...current.path, child.name || ''] });
    });
  }

  return '';
});

const resetImportResult = () => {
  ui.parsed = false;
  formModel.uuid = '';
};

const applyImportResult = (data?: SkillImportVO) => {
  formModel.name = data?.name || '';
  formModel.description = data?.description || '';
  formModel.uuid = data?.uuid || '';
  ui.parsed = Boolean(formModel.uuid);
};

const handleCancel = () => {
  router.back();
};

const selectSource = (sourceType: 1 | 2) => {
  if (ui.sourceType === sourceType) return;

  ui.sourceType = sourceType;
  ui.uploading = false;
  ui.gitLoading = false;
  resetImportResult();
};

const triggerZipSelect = () => {
  if (!ui.uploading) zipInputRef.value?.click();
};

const handleRepoChange = () => {
  if (ui.parsed || formModel.uuid) resetImportResult();
};

const importZipFile = async (file: File) => {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    ElMessage.warning('请选择 ZIP 格式的能力资源包');
    return;
  }

  resetImportResult();
  ui.uploading = true;
  ui.uploadResolved = false;
  ui.selectedZipName = file.name;

  try {
    const res = await agiSkill.importZip(file);
    if (res.code !== 200) {
      return Promise.reject(res.msg);
    }

    ui.uploadResolved = true;
    applyImportResult(res.data);
  } catch (err) {
    console.error('--> --> 导入 ZIP 资源包失败', err);
    ElMessage.closeAll();
    ElMessage.warning('导入 ZIP 资源包失败');
    ui.uploadResolved = false;
    ui.selectedZipName = '';
  } finally {
    ui.uploading = false;
  }
};

const handleZipChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  void importZipFile(file).finally(() => {
    target.value = '';
  });
};

const handleZipDrop = (event: DragEvent) => {
  if (ui.uploading) return;

  const file = event.dataTransfer?.files?.[0];
  if (file) {
    void importZipFile(file);
  }
};

const handleImportGit = () => {
  const gitUrl = repo.url.trim();
  if (!gitUrl) {
    ElMessage.warning('请填写代码仓库克隆地址');
    return;
  }

  resetImportResult();
  ui.gitLoading = true;

  agiSkill
    .importGit({
      categoryId: formModel.categoryId,
      url: gitUrl,
      branch: repo.branch.trim() || undefined,
      skillRootPath: repo.path.trim() || undefined
    })
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      applyImportResult(res.data);
    })
    .catch((err) => {
      console.error('--> --> 克隆 GIT 仓库失败', err);
      ElMessage.closeAll();
      ElMessage.warning('克隆 GIT 仓库失败');
    })
    .finally(() => {
      ui.gitLoading = false;
    });
};

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    ElMessage.warning('校验未通过，请检查');
    return;
  }
  if (!formModel.uuid) {
    ElMessage.warning('请上传本地 ZIP 资源包或连接远端代码仓库');
    return;
  }

  ui.saving = true;
  agiSkill
    .insert(
      {
        categoryId: formModel.categoryId,
        entryMethod: ui.sourceType,
        entryInfo:
          ui.sourceType === 1
            ? ui.selectedZipName
            : JSON.stringify({
                url: repo.url.trim(),
                branch: repo.branch.trim() || undefined,
                skillRootPath: repo.path.trim() || undefined
              }),
        name: formModel.name,
        version: formModel.version.trim(),
        owner: formModel.owner.trim(),
        description: formModel.description,
        status: 2
      },
      formModel.uuid
    )
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success('保存成功');
      router.push('/resources/skills');
    })
    .catch((err) => {
      console.error('--> --> 保存能力包失败', err);
      // ElMessage.closeAll();
      // ElMessage.warning(`保存能力包失败：${err}`);
    })
    .finally(() => {
      ui.saving = false;
    });
};

onMounted(() => {
  agiCategory
    .tree()
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      categories.value = res.data || [];
    })
    .catch((err) => {
      console.error('--> --> 获取能力分类失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取能力分类失败');
    });
});
</script>

<style lang="scss" scoped>
:deep(.el-card__header) {
  padding: 20px 40px !important;
  border-width: 0 !important;
}

:deep(.el-card__body) {
  padding: 0 60px 32px !important;
}

:deep(.el-card__header .panel-title) {
  color: #2b2f33;
  font-size: 16px;
  font-weight: bold;
}

div.my-page.skill-edit-my-page {
  height: auto;
  min-height: 100%;

  & > :deep(.my-page-content) {
    height: auto;
    overflow: visible;
  }
}

.page-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.header-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 20px;

  :deep(.el-button) {
    width: 36px;
    height: 36px;
    padding: 0;
  }

  :deep(.el-button .el-icon) {
    font-size: 24px;
  }

  h1 {
    margin: 0;
    color: #2b2f33;
    font-size: 20px;
    font-weight: bold;
  }

  p {
    margin: 8px 0 0;
    color: #77838f;
    font-size: 14px;
  }
}

.header-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
}

.skill-edit-page {
  display: flex;
  width: 100%;
  min-width: 860px;
  max-width: 1420px;
  margin: 0 auto;
  flex-direction: column;
  gap: 20px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    justify-content: flex-start;
    margin-bottom: 8px;
    padding: 0;
    color: #77838f;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
  }
}

.form-panel {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  border: 0;
  border-radius: 24px;
}

.source-panel {
  :deep(.el-card__body) {
    padding: 16px 40px 32px !important;
  }
}

.source-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.source-card {
  display: flex;
  min-width: 0;
  min-height: 60px;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e1e6ec;
  border-radius: 12px;
  background: var(--el-color-white);
  color: #77838f;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  > svg {
    width: 18px;
    height: 18px;
    flex: none;
  }

  &:hover,
  &.is-active {
    border-color: var(--el-color-primary);
    background: rgba(235, 243, 245, 0.6);
    color: var(--el-color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.source-card-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;

  strong {
    color: #2b2f33;
    font-size: 14px;
    font-weight: bold;
    line-height: 20px;
  }

  span {
    overflow: hidden;
    color: #77838f;
    font-size: 12px;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.action-section {
  padding: 20px 16px;
  border: 1px solid #e1e6ec;
  border-radius: 12px;
  background: var(--el-color-white);
}

.section-title {
  margin: 0;
  color: #2b2f33;
  font-size: 16px;
  font-weight: bold;
  line-height: 24px;
}

.package-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 8px 0 0;
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 20px;

  > svg {
    width: 13px;
    height: 13px;
    flex: none;
    margin-top: 3px;
  }
}

.upload-dropzone {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-height: 212px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  padding: 24px;
  border: 1px dashed #e1e6ec;
  border-radius: 8px;
  background: rgba(235, 243, 245, 0.6);
  color: #77838f;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary);
    background: rgba(235, 243, 245, 0.9);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.75;
  }

  > svg {
    width: 32px;
    height: 32px;
    color: var(--el-color-primary);
  }

  strong {
    margin-top: 12px;
    color: #2b2f33;
    font-size: 14px;
    font-weight: bold;
    line-height: 20px;
  }

  > span:not(.upload-select-button) {
    margin-top: 6px;
    font-size: 12px;
    line-height: 18px;
  }
}

.upload-select-button {
  display: inline-flex;
  min-width: 168px;
  height: 36px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 0 20px;
  border-radius: 999px;
  background-image: linear-gradient(to bottom, #31aba0, #2897be);
  color: var(--el-color-white);
  font-size: 14px;
  font-weight: bold;

  svg {
    width: 16px;
    height: 16px;
  }
}

.zip-input {
  display: none;
}

.repo-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.repo-url-row {
  display: flex;
  grid-column: 1 / -1;
  align-items: flex-end;
  gap: 16px;

  .repo-url {
    min-width: 0;
    flex: 1;
  }
}

.oauth-button {
  min-width: 136px;
  flex: none;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.is-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .source-grid,
  .repo-form {
    grid-template-columns: 1fr;
  }

  .repo-url-row {
    align-items: stretch;
    flex-direction: column;
  }

  .oauth-button {
    align-self: flex-end;
  }
}
</style>
