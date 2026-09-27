<template>
  <el-dialog :title="title ?? $t('component.excelImportDialog.importData', '数据导入')" v-model="visible" :width="width" append-to-body @close="handleClose">
    <el-upload ref="uploadRef" :limit="1" accept=".xlsx, .xls" :headers="headers" :action="uploadUrl" :disabled="isUploading" :on-progress="handleProgress" :on-change="handleFileChange" :on-remove="handleFileRemove" :on-success="handleSuccess" :auto-upload="false" drag>
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        <i18n-t keypath="component.excelImportDialog.uploadHint" scope="global">
          <template #action><em>{{ $t('component.excelImportDialog.clickToUpload', '点击上传') }}</em></template>
        </i18n-t>
      </div>
      <template #tip>
        <div class="el-upload__tip text-center">
          <div class="el-upload__tip">
            <el-checkbox v-model="updateSupport"> {{ updateSupportLabel ?? $t('component.excelImportDialog.updateExistingData', '是否更新已经存在的数据') }} </el-checkbox>
          </div>
          <span>{{ $t('component.excelImportDialog.onlyXlsAndXlsxFilesAreSupported', '仅允许导入xls、xlsx格式文件。') }}</span>
          <el-link v-if="templateUrl" type="primary" underline="never" style="font-size: 12px; vertical-align: baseline" @click="handleDownloadTemplate">{{ $t('component.excelImportDialog.downloadTemplate', '下载模板') }}</el-link>
        </div>
      </template>
    </el-upload>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleSubmit">{{ $t('component.excelImportDialog.confirm', '确 定') }}</el-button>
        <el-button @click="visible = false">{{ $t('component.excelImportDialog.cancel', '取 消') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { t } from '@/i18n';
import type {  AjaxResult } from '@/types/api/common'
import { getToken } from '@/utils/auth'

const { proxy } = getCurrentInstance()

const props = defineProps({
  // 对话框标题
  title: {
    type: String,
    default: undefined
  },
  // 对话框宽度
  width: {
    type: String,
    default: '400px'
  },
  // 上传接口地址（必传）
  action: {
    type: String,
    required: true
  },
  // 模板下载接口地址，不传则不显示下载模板链接
  templateAction: {
    type: String,
    default: ''
  },
  // 模板文件名前缀
  templateFileName: {
    type: String,
    default: 'template'
  },
  // 覆盖更新勾选框的说明文字
  updateSupportLabel: {
    type: String,
    default: undefined
  }
})

const emit = defineEmits(['success'])

const uploadRef = ref<any>()
const visible = ref<boolean>(false)
const selectedFile = ref<any>(null)
const isUploading = ref<boolean>(false)
const updateSupport = ref<boolean>(false)
const headers = { Authorization: 'Bearer ' + getToken() }

const uploadUrl = computed(() => {
  return import.meta.env.VITE_APP_BASE_API + props.action + '?updateSupport=' + (updateSupport.value ? 1 : 0)
})

const templateUrl = computed(() => !!props.templateAction)

// 打开对话框（供父组件通过 ref 调用）
function open(): void {
  updateSupport.value = false
  isUploading.value = false
  visible.value = true
  nextTick(() => {
    selectedFile.value = null
    uploadRef.value?.clearFiles()
  })
}

// 关闭时清理
function handleClose(): void {
  isUploading.value = false
  selectedFile.value = null
  uploadRef.value?.clearFiles()
}

// 下载模板
function handleDownloadTemplate(): void {
  proxy.download(props.templateAction, {}, `${props.templateFileName}_${new Date().getTime()}.xlsx`)
}

// 上传进度
function handleProgress(): void {
  isUploading.value = true
}

/** 文件选择处理 */
const handleFileChange = (file: any): void => {
  selectedFile.value = file
}

/** 文件删除处理 */
const handleFileRemove = (file: any) => {
  selectedFile.value = null
}

// 上传成功
function handleSuccess(response: AjaxResult) {
  visible.value = false
  isUploading.value = false
  selectedFile.value = null
  uploadRef.value?.clearFiles()
  proxy.$alert("<div style='overflow:auto;overflow-x:hidden;max-height:70vh;padding:10px 20px 0;'>" + response.msg + '</div>', t('component.excelImportDialog.importResults', '导入结果'), { dangerouslyUseHTMLString: true })
  emit('success')
}

// 提交上传
function handleSubmit() {
  const file = selectedFile.value
  if (!file || file.length === 0 || !file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.xlsx')) {
    proxy.$modal.msgError(t('component.excelImportDialog.selectAnXlsOrXlsxFile', '请选择后缀为 “xls”或“xlsx”的文件。'))
    return
  }
  uploadRef.value.submit()
}

defineExpose({ open })
</script>
