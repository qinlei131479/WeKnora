<template>
  <section class="models-ollama-manage-page">
    <page-name class="page-name">
      <!-- <button class="add-btn" v-hasPermi="['business:ollama:edit']" @click="showDownloadForm">+ {{ $t('page.ollama.add') }}</button> -->
      <el-button type="primary" icon="Plus" @click="showDownloadForm" v-hasPermi="['business:ollama:edit']">{{ $t('page.ollama.add') }}</el-button>
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.name"
              class="search-bar__input"
              clearable
              :placeholder="$t('page.ollama.searchPlaceholder')"
              @keyup.enter="handleQuery"
            />
          </div>

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>

          <div class="status-display">
            <el-tag v-if="testing">
              <svg-icon name="loading" class="status-icon spinning" />
              {{ $t('page.ollama.status.testing') }}
            </el-tag>
            <el-tag v-else-if="connectionStatus === true" type="success">
              <svg-icon name="check-circle-filled" />
              {{ $t('page.ollama.status.available') }}
            </el-tag>
            <el-tag v-else-if="connectionStatus === false" type="danger">
              <svg-icon name="close-circle-filled" />
              {{ $t('page.ollama.status.unavailable') }}
            </el-tag>
            <el-tag v-else type="default">
              <svg-icon name="help-circle" />
              {{ $t('page.ollama.status.untested') }}
            </el-tag>
            <el-button type="info" class="manage-btn" @click="testConnection">
              <svg-icon name="refresh" />
              {{ $t('page.ollama.status.retest') }}
            </el-button>
          </div>
        </div>
      </template>
      <el-table ref="userTableRef" v-loading="loading" :data="tableData" height="100%" @selection-change="handleSelectionChange">
        <template #empty>
          <kjsc-empty />
        </template>
        <!-- <el-table-column type="selection" width="50" align="center" /> -->
        <el-table-column :label="$t('page.ollama.name')" align="left" key="name" prop="name" :min-width="$dim('page.ollama.name', 160)" />
        <el-table-column
          :label="$t('page.ollama.size')"
          align="left"
          key="size"
          prop="size"
          :min-width="$dim('page.ollama.size', 120)"
          v-if="columns.size.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ formatSize(scope.row.size) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.ollama.digest')"
          key="digest"
          prop="digest"
          :min-width="$dim('page.ollama.digest', 300)"
          v-if="columns.digest.visible"
          align="left"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.ollama.modifiedAt')"
          align="left"
          prop="modifiedAt"
          :min-width="$dim('page.ollama.modifiedAt', 170)"
          v-if="columns.modifiedAt.visible"
        >
          <template #default="scope">
            <span>{{ scope.row.modifiedAt }}</span>
          </template>
        </el-table-column>
        <!-- <el-table-column label="操作" align="left" width="180" fixed="right">
          <template #default="scope">
            <template v-if="scope.row.userId !== 1">
              <el-button link class="action-link action-link--primary" @click="handleUpdate(scope.row)"
                v-hasPermi="['buz:ollama:edit']">
                {{ $t('form.button.edit') }}
              </el-button>
              <el-button link class="action-link action-link--danger" @click="handleDelete(scope.row)"
                v-hasPermi="['buz:ollama:remove']">
                {{ $t('form.button.delete') }}
              </el-button>
              <el-button link class="action-link action-link--primary" @click="handleResetPwd(scope.row)"
                v-hasPermi="['system:user:edit']">
                {{ $t('form.button.reset') }}
              </el-button>
            </template>
          </template>
        </el-table-column> -->
      </el-table>
      <!-- <template #footer>
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </template> -->
    </page-content>

    <KJSCDialogV2
      :title="$t('page.ollama.download.title')"
      v-model="downloadOpen"
      width="800px"
      append-to-body
      @close="onDownloadClose"
      custom-class="manage-dialog ollama-download-form-dialog"
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form
        :model="downloadForm"
        :rules="downloadFormRules"
        @submit.native.prevent
        ref="downloadRef"
        label-position="top"
        class="download-form"
        hide-required-asterisk
      >
        <el-form-item label="模型名称" prop="name">
          <el-input v-model="downloadForm.name" :placeholder="$t('page.ollama.download.namePlaceholder')" maxlength="99" show-word-limit />
        </el-form-item>
        <div v-if="downloadModelName" class="download-progress">
          <div class="progress-info">
            <span>{{ $t('page.ollama.download.downloading', { name: downloadModelName }) }}</span>
            <!-- <span>{{ downloadProgress.toFixed(2) }}%</span> -->
          </div>
          <el-progress :percentage="downloadProgress" size="small" />
        </div>
      </el-form>
      <template #prefixFooter>
        <div class="manage-dialog-footer">
          <el-button type="primary" class="submit-btn" :disabled="downloadFormSubmitDisabled" @click="submitDownloadForm">
            {{ $t('page.ollama.download.confirm') }}
          </el-button>
        </div>
      </template>
    </KJSCDialogV2>
  </section>
</template>

<script setup lang="ts" name="Models">
import { useI18n } from 'vue-i18n';
import { downloadOllamaModelApi, getOllamaDownloadProgressApi, getOllamaModelsApi, getOllamaStatusApi } from '@/api/model/ollama';
import { OllamaDownloadResp, OllamaModelsResp, TableShowColumns } from '@/types';

// const pageLangConfig: Record<string, string> = {
//   'page.ollama.add': '下载新模型',
//   'page.ollama.download.title': '下载模型',
//   'page.ollama.download.namePlaceholder': '请输入模型名称',
//   'page.ollama.download.confirm': '确认下载',
//   'page.ollama.download.downloading': '正在下载${name}',
//   'page.ollama.status.testing': '检测中',
//   'page.ollama.status.available': '可用',
//   'page.ollama.status.unavailable': '不可用',
//   'page.ollama.status.untested': '未检测',
//   'page.ollama.status.retest': '重新检测',
//   'page.ollama.searchPlaceholder': '通过模型ID、模型名称、创建人进行模糊搜索',
//   'page.ollama.range_separator': '至',
//   'page.ollama.start_date.placeholder': '开始时间',
//   'page.ollama.end_date.placeholder': '结束时间',
//   'page.ollama.reset': '重置',
//   'page.ollama.search': '搜索',
//   'form.button.reset': '重置',
//   'form.button.edit': '编辑',
//   'form.button.delete': '删除',
//   'page.ollama.toasts.listFailed': '获取模型列表失败',
//   'page.ollama.toasts.connected': '连接成功',
//   'page.ollama.toasts.connectFailed': '连接失败，请检查 Ollama 是否运行',
//   'page.ollama.toasts.downloadFailed': '下载失败，请稍后重试',
//   'page.ollama.toasts.downloadStarted': '已开始下载模型',
//   'page.ollama.toasts.downloadCompleted': '模型 下载完成',
//   'page.ollama.toasts.progressFailed': '查询下载进度失败'
// };

const { proxy } = getCurrentInstance();
const { t } = useI18n();

// 列显隐信息
const columns = ref<Record<string, TableShowColumns>>({
  name: { label: '模型名称', visible: true },
  size: { label: '模型大小（字节）', visible: true },
  modifiedAt: { label: '修改时间', visible: true },
  digest: { label: '模型摘要', visible: true }
});

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  name: undefined
});
const loading = ref<boolean>(true);
const ids = ref<number[]>([]);
const single = ref<boolean>(true);
const multiple = ref<boolean>(true);
const total = ref<number>(0);

const localBaseUrl = ref('');
const testing = ref(false);
const connectionStatus = ref<boolean | null>(null);
const loadingModels = ref(false);
const downloadedModels = ref<OllamaModelsResp[]>([]);
const downloading = ref(false);
const downloadModelName = ref('');
const downloadProgress = ref(50);
const downloadOpen = ref(false);
const downloadForm = ref({
  name: ''
});
const downloadFormRules = ref({
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }]
});
const downloadRef = ref();
const downloadFormSubmitDisabled = computed(() => {
  let flag = false;
  if (!downloadForm.value.name) {
    flag = true;
  }
  return flag;
});
const tableData = computed(() => {
  const queryName = (queryParams.value.name || '').toLowerCase();
  let datas: OllamaModelsResp[] = downloadedModels.value || [];
  if (queryName) {
    datas = datas.filter((model) => model.name.toLowerCase().includes(queryName));
  }
  // 不显示翻页
  // total.value = datas.length;
  return datas;
});
const submitDownloadForm = () => {
  // downloadFormSubmitDisabled.value = true
  downloadRef.value.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    downloadModel();
  });
};
const showDownloadForm = () => {
  downloadOpen.value = true;
  downloadForm.value.name = '';
  downloadRef.value?.resetFields();
};
const onDownloadClose = () => {
  downloadOpen.value = false;
  downloadForm.value.name = '';
  downloadModelName.value = '';
  downloadProgress.value = 0;
  downloading.value = false;
};

// 测试连接
const testConnection = async () => {
  testing.value = true;
  connectionStatus.value = null;

  try {
    // 调用真实 Ollama API 测试连接
    const result = await getOllamaStatusApi();

    // 如果接口返回了 endpoint 且与当前输入框的值不同，更新为接口返回的值
    if (result.data && result.data.endpoint !== localBaseUrl.value) {
      localBaseUrl.value = result.data.endpoint;
    }

    connectionStatus.value = result.data?.available || false;

    if (connectionStatus.value) {
      proxy.$modal.msgSuccess(t('page.ollama.toasts.connected'));
      refreshModels();
    } else {
      proxy.$modal.msgError(result.msg || t('page.ollama.toasts.connectFailed'));
    }
  } catch (error: any) {
    connectionStatus.value = false;
    proxy.$modal.msgError(error.message || t('page.ollama.toasts.connectFailed'));
  } finally {
    testing.value = false;
  }
};
// 刷新模型列表
const refreshModels = async () => {
  loadingModels.value = true;
  loading.value = true;
  try {
    // 调用真实 Ollama API 获取模型列表（现在返回完整的模型信息）
    const resp = await getOllamaModelsApi();
    downloadedModels.value = resp.data || [];
  } catch (error: any) {
    console.error('获取模型列表失败:', error);
    proxy.$modal.msgError(error.message || t('page.ollama.toasts.listFailed'));
  } finally {
    loadingModels.value = false;
    loading.value = false;
  }
};
// 格式化文件大小
const formatSize = (bytes: number): string => {
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// 格式化日期
const formatDate = (dateStr: string): string => {
  if (!dateStr) return t('page.ollama.unknown');

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return t('page.ollama.unknown');

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return t('page.ollama.today');
  if (days === 1) return t('page.ollama.yesterday');
  if (days < 7) return t('page.ollama.daysAgo', { days });
  return date.toLocaleDateString();
};

// 下载模型
const downloadModel = async () => {
  const model = downloadForm.value.name;

  downloading.value = true;
  downloadProgress.value = 0;
  downloadModelName.value = model;

  try {
    // 调用真实 Ollama API 下载模型
    const result = await downloadOllamaModelApi({ model: model });

    if (result.code != 200) {
      proxy.$modal.msgError(result.msg || t('page.ollama.toasts.downloadFailed'));
      downloading.value = false;
      downloadProgress.value = 0;
      downloadOpen.value = false;
      return;
    }

    proxy.$modal.msgSuccess(t('page.ollama.toasts.downloadStarted', { name: model }));

    const data: OllamaDownloadResp = result.data || ({} as OllamaDownloadResp);
    // 查询下载进度
    const taskId = data.id;
    const progressInterval = setInterval(async () => {
      if (!downloadModelName.value) {
        // 对话框关闭时，清除定时器并返回
        clearInterval(progressInterval);
        return;
      }
      try {
        const result = await getOllamaDownloadProgressApi(taskId);
        if (!downloadModelName.value) {
          // 对话框关闭时，清除定时器并返回
          clearInterval(progressInterval);
          return;
        }
        const task: OllamaDownloadResp = result.data || ({} as OllamaDownloadResp);
        downloadProgress.value = task.progress;

        if (task.progress >= 100) {
          clearInterval(progressInterval);
          proxy.$modal.msgSuccess(t('page.ollama.toasts.downloadCompleted', { name: model }));
          downloadProgress.value = 0;
          downloading.value = false;
          downloadOpen.value = false;
          refreshModels();
        } else if (task.status === 'failed') {
          clearInterval(progressInterval);
          proxy.$modal.msgError(task.message || t('page.ollama.toasts.downloadFailed'));
          downloading.value = false;
          downloadProgress.value = 0;
          downloadOpen.value = false;
        }
      } catch (error) {
        clearInterval(progressInterval);
        proxy.$modal.msgError(t('page.ollama.toasts.progressFailed'));
        downloading.value = false;
        downloadProgress.value = 0;
        downloadOpen.value = false;
      }
    }, 1000);
  } catch (error: any) {
    console.error('下载失败:', error);
    proxy.$modal.msgError(error.message || t('page.ollama.toasts.downloadFailed'));
    downloading.value = false;
    downloadProgress.value = 0;
    downloadOpen.value = false;
  }
};
// 初始化 Ollama 服务地址
const initOllamaBaseUrl = async () => {
  try {
    const result = await getOllamaStatusApi();
    localBaseUrl.value = result.data?.endpoint || '';
    // 直接使用初始化时获取的状态，避免重复调用
    connectionStatus.value = result.data?.available || false;
    if (connectionStatus.value) {
      refreshModels();
    }
    return result;
  } catch (error) {
    console.error('初始化 Ollama 地址失败:', error);
    return null;
  }
};

// 组件挂载时自动检查连接
onMounted(async () => {
  // 初始化服务地址，如果启用则直接使用返回的状态，避免重复调用
  await initOllamaBaseUrl();
});

/** 查询用户列表 */
function getList() {
  refreshModels();
}

/** 搜索按钮操作 */
function handleQuery() {
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  handleQuery();
}

/** 选择条数  */
function handleSelectionChange(selection: OllamaModelsResp[]) {
  ids.value = selection.map((item) => item.name!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
</script>

<style scoped lang="scss">
.status-display {
  margin-left: auto;
  .manage-btn {
    margin-left: 8px;
  }
  .svg-icon {
    display: none;
  }
}
.download-progress {
  // padding: 16px;
  // background: var(--td-bg-color-secondarycontainer);
  // border-radius: 8px;
  // border: 1px solid var(--td-component-stroke);

  .progress-info {
    // display: flex;
    // justify-content: space-between;
    // margin-bottom: 10px;
    font-size: 14px;
    // color: var(--td-text-color-primary);
    font-weight: 500;
  }
}
</style>

<style lang="scss">
// .ollama-download-form-dialog .el-dialog__footer {
//   padding-top: 0;
// }

.user-form-dialog.kjsc-dialog-v2 {
  .password-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    color: #77838f;
    font-size: 13px;
    line-height: 20px;

    &__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border: 1px solid #a8abb2;
      border-radius: 50%;
      color: #77838f;
      font-size: 11px;
      font-style: italic;
      font-weight: 600;
      flex-shrink: 0;
    }
  }
}

.reset-pwd-dialog.kjsc-dialog-v2 {
  .el-dialog__body {
    padding: 24px 32px 8px;
  }

  .el-dialog__footer {
    padding: 24px 32px 32px;
  }

  .reset-pwd-form {
    &__label {
      margin: 0 0 16px;
      font-size: 14px;
      line-height: 22px;
      color: #2b2f33;
    }

    &__input {
      .el-input__wrapper {
        min-height: 44px;
        padding: 0 16px;
        border-radius: 999px;
        box-shadow: 0 0 0 1px #31aba0 inset !important;
      }

      .el-input__inner {
        font-size: 14px;
        color: #2b2f33;

        &::placeholder {
          color: #a8abb2;
        }
      }
    }

    &__error {
      margin: 8px 0 0;
      font-size: 12px;
      line-height: 18px;
      color: #fe595d;
    }
  }

  .reset-pwd-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .reset-pwd-dialog-cancel,
  .reset-pwd-dialog-submit {
    min-width: 88px;
    height: 40px;
    padding: 0 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition:
      opacity 0.2s,
      border-color 0.2s;
  }

  .reset-pwd-dialog-cancel {
    border: 1px solid #e1e6ec;
    border-radius: 8px;
    background: #ffffff;
    color: #2b2f33;

    &:hover {
      border-color: #c8ced6;
    }
  }

  .reset-pwd-dialog-submit {
    border: none;
    border-radius: 8px;
    background: linear-gradient(180deg, #31aba0 0%, #2897be 100%);
    color: #ffffff;

    &:hover {
      opacity: 0.92;
    }
  }
}
</style>
