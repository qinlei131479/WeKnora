<template>
  <div class="w-full flex flex-col bg-white h-full shrink-0 overflow-hidden">
    <div>
      <el-tabs v-model="activePreviewTab" class="demo-tabs">
        <el-tab-pane name="original">
          <template #label>
            <span class="flex items-center gap-1.5">
              <Eye class="w-3.5 h-3.5" /> 原始物理文件预览
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="markdown">
          <template #label>
            <span class="flex items-center gap-1.5">
              <svg-icon icon-class="mp-alignment-left"></svg-icon> MD-智能对齐说明
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="flex-1 overflow-y-auto relative">

      <template v-if="!selectedDoc">
        <div class="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
          <HardDrive class="w-12 h-12 text-slate-200 mb-3" />
          <p class="text-xs font-bold text-slate-600">文档预览与说明编辑器</p>
          <p class="text-[11px] text-slate-400 mt-2 max-w-xs leading-relaxed">
            请在左侧列表中点击选择任一本地物理文档，以便在线预览物理脱敏结构，并同步对齐高精度的智能大纲说明 (.md) 约束文件。
          </p>
        </div>
      </template>

      <template v-else>
        <div class="space-y-4 h-full flex flex-col">
          <div class="file-info-area space-y-1">
            <div class="file-info-row">
              <!-- <span
                class="file-info-icon text-[10px] bg-blue-600 text-white font-extrabold px-1.5 py-0.2 rounded font-mono shrink-0">
                {{ selectedDoc.fileName?.split('.').pop()?.toUpperCase() || 'FILE' }}
              </span> -->
              <svg-icon :icon-class="getIconByFileType(checkFileType(selectedDoc.fileName))" class="file-info-icon"></svg-icon>
              <span class="file-info-name truncate">{{ selectedDoc.fileName }}</span>
            </div>
            <div class="file-info-extra flex items-center justify-between">
              <span>审计大小: {{ formatSize(selectedDoc.fileSize) }}</span>
              <span>全局标记版本: {{ selectedDoc.versionCode }}</span>
            </div>
          </div>

          <template v-if="activePreviewTab === 'original'">
            <div class="flex-1 flex flex-col min-h-0">
              <div v-if="selectedDoc.fileStatus < FileStatus.PARSE_SUCCESS"
                class="flex-1 bg-slate-900 rounded-xl p-4 font-mono text-[10px] text-emerald-400 space-y-2 overflow-y-auto leading-relaxed border border-slate-800">
                <!-- 显示原始文件内容 -->
                <div
                  class="flex items-center gap-2 text-blue-400 font-bold border-b border-slate-800 pb-2 mb-2 animate-pulse">
                  <Loader2 class="w-3.5 h-3.5 animate-spin" />
                  <span>物理底座双通道 RAG OCR 正在自动检测中...</span>
                </div>
                <!-- <div v-for="(log, i) in simulationLogs" :key="i" class="animate-in fade-in duration-150">{{ log }}</div> -->
                <!-- <div class="text-slate-500 text-[9px] mt-2 animate-pulse">
                  (系统正在模拟 1次异常崩溃报警 与 2次冗余自适应微调救治，重连耗时约 4~5 秒...)
                </div> -->
              </div>

              <div v-else-if="selectedDoc.fileStatus == FileStatus.FAILED"
                class="flex-1 bg-rose-50 border border-rose-150 rounded-xl p-5 flex flex-col justify-center items-center text-center space-y-3">
                <AlertTriangle class="w-12 h-12 text-rose-500 animate-bounce" />
                <div>
                  <h4 class="text-xs font-bold text-rose-800">该物理文档解析救治崩溃</h4>
                  <p class="text-[10px] text-rose-600 mt-1.5 max-w-xs leading-relaxed">
                    <!-- [故障定位]: 检测到严重物理噪点或语法树深度极限溢出。本系统在第1次/第2次自动救治尝试中皆告撞线，宣告损坏。 -->
                    {{ selectedDoc.message }}
                  </p>
                </div>
                <!-- <div class="bg-white p-3 rounded border border-rose-100 text-left font-mono text-[9px] text-rose-500 w-full max-w-sm">
                  [SYS_ERR]: CONFLICT_OCR_SEGMENT_FAULT_CORE30 (重试2次告败)
                </div> -->
                <!-- <Button
                  size="sm"
                  class="bg-rose-600 hover:bg-rose-700 text-white font-bold h-8 text-xs"
                  @click="handleRetry"
                >
                  🔄 净化异常噪音并一键重新检测
                </Button> -->
              </div>

              <div v-else
                class="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-700 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                <FilePreview :path="selectedDoc?.filePath" />
                <!-- {{ (selectedDoc as any).originalPreviewContent || `这是《${selectedDoc.fileName}》的物理文档原始脱敏预览，可在上面点击切换 Markdown 说明编辑。` }} -->
              </div>
            </div>
          </template>

          <template v-else>
            <div class="flex-1 flex flex-col min-h-0 space-y-3">
              <div v-if="selectedDoc.fileStatus < FileStatus.PARSE_SUCCESS"
                class="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-6 bg-slate-50/50 border border-dashed rounded-xl">
                <Loader2 class="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <p class="text-xs font-bold">RAG OCR 自动解析中...</p>
                <p class="text-[10px] text-slate-400 mt-1">
                  物理原稿提取对准完成后，方可由人工编辑对应的 Markdown 说明文件。
                </p>
              </div>

              <div v-else-if="selectedDoc.fileStatus == FileStatus.FAILED"
                class="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-6 bg-slate-50/50 border border-dashed rounded-xl">
                <AlertTriangle class="w-8 h-8 text-rose-500 mb-2" />
                <p class="text-xs font-bold text-rose-700">物理文档损坏</p>
                <p class="text-[10px] text-rose-500 mt-1">
                  无法建立对应的智能说明。请优先在"原始文件预览"中点击一键重新检测净化。
                </p>
              </div>

              <div v-else class="flex-1 flex flex-col min-h-0 space-y-3">
                <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <label class="md-tip">
                    智能说明内容 (.md 可在此直接修改和扩展)：
                  </label>
                  <!-- <textarea
                    :value="mdDraft"
                    @input="e => mdDraft.value = (e.target as HTMLTextAreaElement).value"
                    class="flex-1 w-full bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] leading-relaxed border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none min-h-[220px]"
                    placeholder="# 自定义说明..."
                  /> -->
                  <!-- Markdown 说明内容 -->
                  <MdEditor v-model="mdDraft" @save="handleSaveMarkdown" class="flex-1" />
                  <!-- <v-md-editor v-model="mdDraft" class="flex-1 md-editor"></v-md-editor> -->
                </div>

                <btn @click="handleSaveMarkdown" type="primary" round class="save-btn">
                  <!-- <Check class="w-4 h-4" /> -->
                  <svg-icon icon-class="mp-save" />
                  保存人工订正并发布新版知识
                </btn>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  UploadCloud, Search, MoreHorizontal, ChevronRight, FileText, File, HardDrive, Filter, RefreshCw,
  Edit2, Eye, CheckCircle2, AlertTriangle, Loader2, Check, X, AlertCircle, Folder
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Card from '@/components/ui/Card.vue'

import type { KnowledgeLibFileListEntity } from '@/types'
import { FileStatus, getMdContent, updateMdContent } from '@/api/knowledge/knowledgeApi'
import FilePreview from '@/components/filePreview/index.vue'
import MdEditor from '@/components/MdEditor/index.vue'
import { formatSize } from '@/utils/index'
import { getIconByFileType } from "../constance.js";

// import axios from 'axios'
// const getFileText = async (path: string) => {
//   const res = await axios.get(path, {
//     responseType: 'text',
//     timeout: 30000
//   })
//   return res
// }
const proxy = getCurrentInstance()?.proxy
const props = defineProps({
  selectedDoc: {
    type: Object as () => KnowledgeLibFileListEntity,
    default: () => null
  }
})

const checkFileType = (fileName: string) => {
  const flieArr = fileName?.split(".") || [];
  const type = flieArr[flieArr.length - 1];
  return type;
};

const activePreviewTab = ref<'original' | 'markdown'>('original')
const changeActivePreviewTab = (tab: 'original' | 'markdown') => {
  activePreviewTab.value = tab
}
// const selectedDoc: ComputedRef<KnowledgeLibFileListEntity> = computed(() => {
//   const selectedDoc = props.selectedDoc
//   if (!selectedDoc) {
//     return null
//   }
//   return {
//     ...selectedDoc,
//     fileStatus: FileStatus.PARSE_SUCCESS
//   }
// })
const selectedDoc = ref(null)
const mdDraft = ref('')
const mdDataId = ref('')
// const simulationLogs = ref([]);

const getMdDraft = (selectedDoc: KnowledgeLibFileListEntity) => {
  // mdDraft.value = selectedDoc.mdDraft || ''
  getMdContent(selectedDoc.knowledgeId, selectedDoc.id).then((res: any) => {
    mdDraft.value = res.data?.content || ''
    mdDataId.value = res.data?.id || ''
  }, () => {
    mdDraft.value = ''
    mdDataId.value = ''
    // getFileText('/file/f5.md').then((res: any) => {
    //   mdDraft.value = res.data || ''
    // })
  })
}


const handleRetry = () => {
  // if (selectedDoc.value.fileStatus == FileStatus.FAILED) {
  //   proxy.$modal.msgError('请先在"原始文件预览"中点击一键重新检测净化。')
  //   return
  // }
}
const handleSaveMarkdown = () => {
  const value = mdDraft.value
  const id = mdDataId.value
  if (!id) {
    return;
  }
  updateMdContent(id, value).then((res: any) => {
    if (res.code == 200) {
      proxy.$modal.msgSuccess('保存成功')
    }
  })
}
watch(
  () => props.selectedDoc,
  (newSelectedDoc: KnowledgeLibFileListEntity) => {
    selectedDoc.value = newSelectedDoc
    if (newSelectedDoc) {
      // newSelectedDoc.fileStatus = FileStatus.PARSE_SUCCESS
      if (newSelectedDoc.fileStatus == FileStatus.PARSE_SUCCESS) {
        getMdDraft(newSelectedDoc)
      }
    }
  },
  { immediate: true }
)
</script>
<style scoped lang="scss">
.file-info-area {
  padding: 18px 16px 16px;
  background: rgba(235, 243, 245, 0.6);
  border-radius: 16px 16px 16px 16px;
  border: 1px solid #BBDFE8;

  .file-info-row {
    display: flex;
    align-items: center;

  }

  .file-info-icon {
    width: 16px;
    height: 16px;
  }

  .file-info-name {
    margin-left: 8px;
    flex-grow: 1;
    font-weight: bold;
    font-size: 14px;
    color: #2B2F33;
    line-height: 24px;
  }

  .file-info-extra {
    margin-top: 8px;
    font-weight: 400;
    font-size: 14px;
    color: #77838F;
    line-height: 24px;
  }
}

.md-tip {
  font-weight: 400;
  font-size: 14px;
  color: #77838F;
  line-height: 24px;
  // margin-top: 20px;
  margin-bottom: 12px;
}

.save-btn {
  width: 282px;

  :deep(.svg-icon) {
    width: 24px;
    height: 24px;
  }
}
</style>