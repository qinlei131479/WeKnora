<script setup lang="ts">
import {
  Search, Plus, Trash2, Edit, CheckCircle2, XCircle, UploadCloud, HelpCircle,
  Info, X, ChevronRight, ChevronDown, RefreshCw, Sparkles, Check, FileText,
  AlertCircle, BookOpen, Layers, Undo2, ArrowRight, Eye, ShieldAlert, BadgeCheck,
  FolderTree, Settings2, Shield, Lock, ShieldCheck, UserCheck, KeyRound, Globe,
  Database, User as UserIcon, Play, Loader2, Save, Send, EyeOff, Terminal,
  Bold, Italic, Underline, ImageIcon, Video, Paperclip, Link, Type, MessageSquare
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { getDomains, getFlatDomains, isDomainMatch } from '@/lib/domain-store'
import { getFAQKBs, saveFAQKBs, addFAQKB, deleteFAQKB, type FAQKnowledgeBase, type FAQItem, type FAQCategory } from '@/lib/faq-store'
import { getUsers, getDepartments, getPositions, getUserGroups, type User } from '@/lib/org-store'
import { getDefaultPermissions, type KBPermissions } from '@/lib/kb-store'

import DomainSelect from '@/components/common/DomainSelect2.vue'

import { addKnowledgeFaqApi } from '@/api/knowledgeLib/knowledgeFaq'
import type { KnowledgeLibFileListEntity, AjaxResult, KnowledgeFaqBatchAddParams, KnowledgeFaqSaveParams, KnowledgeFaqUploadResultData, KnowledgeFaqUploadResultItem } from '@/types'
import { uploadFile } from '@/utils/request'
import { batchAddFaqQuestionsApi } from '@/api/knowledgeLib/knowledgeFaqQuestion'

const { proxy } = getCurrentInstance();

const emit = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  categoryId: {
    type: [Number, String],
    default: ''
  },
  knowledgeId: {
    type: [Number, String],
    default: ''
  },
  categoryTreeData: {
    type: Array as PropType<KnowledgeLibFileListEntity[]>,
    default: () => []
  },
})

watch(
  () => props.modelValue,
  (newVal: boolean) => {
    if (newVal) {
      nextTick(onOpen)
    } else {
      nextTick(onClose)
    }
  }
)

const onOpen = () => {
  importStep.value = 1
  extractedFaqs.value = []
  importedFile.value = null
  uploading.value = false
  dragActive.value = false
  changeFlag = false;
  categoryId.value = props.categoryId
}
const onClose = () => {
  if (intervalId) clearInterval(intervalId)
  intervalId = null
}

const close = () => {
  emit('update:modelValue', false)
  if (changeFlag) {
    emit('change', true)
  }
}

const fileInput = ref<HTMLInputElement>()
// const showFAQImportModal = ref(false)
const importStep = ref(1)
const importedFile = ref<{ name: string, size: string, extension: string } | null>(null)
const parsingLogs = ref<string[]>([])
const extractedFaqs = ref<{ question: string, answer: string, category: string, selected: boolean }[]>([])
const dragActive = ref(false)
const uploading = ref(false)
let intervalId: any = null
let changeFlag = false;

const categoryId = ref(props.categoryId)
const treeDataProps = {
  children: 'children',
  label: 'fileName',
  value: 'id',
}

const handleFileSelected = (file: File) => {
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  const approved = ['.xlsx']
  if (!approved.includes(ext)) return alert('仅限于 Excel(.xlsx) 文件')
  importedFile.value = { name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', extension: ext }
  const uploadOver = (data: KnowledgeFaqUploadResultData | null) => {
    uploading.value = false
    if (intervalId) clearInterval(intervalId)
    intervalId = null
    importStep.value = 3
    const items = data?.items;
    if (items) {
      extractedFaqs.value = items.map((item: KnowledgeFaqUploadResultItem) => ({
        question: item.question,
        answer: item.answer,
        selected: true
      }))
      changeFlag = extractedFaqs.value.length > 0;
    } else {
      extractedFaqs.value = []
    }
    // extractedFaqs.value = [
    //   { question: '业务问题A如何处理？', answer: '解答指引<strong>加粗点</strong>...', category: insideSubcatId.value !== 'all' ? insideSubcatId.value : 'default', selected: true },
    //   { question: '特殊故障现象排除', answer: '请核对环境参数重试。', category: insideSubcatId.value !== 'all' ? insideSubcatId.value : 'default', selected: true }
    // ]
  };
  startExtractionSimulation(file.name, ext)
  const uploadUrl = '/business/agiKnowledgeFileTask/faq/parse';
  const formData = new FormData(); // 声明一个FormDate对象
  formData.append('file', file);
  formData.append('knowledgeId', props.knowledgeId);
  uploading.value = true
  uploadFile(uploadUrl, formData).then((res: AjaxResult) => {
    uploadOver(res.data)
  }, () => {
    uploadOver(null)
  })
}

const startExtractionSimulation = (fileName: string, ext: string) => {
  importStep.value = 2
  // parsingLogs.value = []
  // const logs = [
  //   `[解析接入] 读取文件：${fileName}...`,
  //   `[底座引擎] 格式化通过 [${ext.toUpperCase()}]，探测字符。`,
  //   `[中台模型] 启动 Q&A 意图解析 (Gemini UI)...`,
  //   `[结构化] 识别多维对抗话术，剥离无用标签...`,
  //   `[校验评估] 自动映射业务分类，生成待审定草案`
  // ]
  // let cursor = 0
  // intervalId = setInterval(() => {
  //   if (cursor < logs.length) {
  //     parsingLogs.value = [...parsingLogs.value, logs[cursor]]
  //     cursor++
  //   } else {
  //     clearInterval(intervalId)
  //     intervalId = null
  //     // extractedFaqs.value = [
  //     //   { question: '业务问题A如何处理？', answer: '解答指引<strong>加粗点</strong>...', category: insideSubcatId.value !== 'all' ? insideSubcatId.value : 'default', selected: true },
  //     //   { question: '特殊故障现象排除', answer: '请核对环境参数重试。', category: insideSubcatId.value !== 'all' ? insideSubcatId.value : 'default', selected: true }
  //     // ]
  //     // importStep.value = 3
  //   }
  // }, 400)
}

const toggleExtractedFaq = (faq: any) => {
  faq.selected = !faq.selected
}

const updateExtractedFaqQuestion = (faq: any, question: string) => {
  faq.question = question
}

const updateExtractedFaqAnswer = (faq: any, answer: string) => {
  faq.answer = answer
}

const handleCommitAIImport = () => {
  const activeToImport = extractedFaqs.value.filter((item: any) => item.selected)
  if (activeToImport.length === 0) {
    proxy.$modal.msgError('请勾选有效条目')
    return
  }
  importStep.value = 4

  const params: KnowledgeFaqBatchAddParams = {
    knowledgeId: props.knowledgeId,
    fileName: importedFile.value?.name,
    categoryId: categoryId.value,
    categoryCode: props.categoryCode,
    items: activeToImport
  }
  batchAddFaqQuestionsApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      changeFlag = true
      close()
    }
  })
}

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId)
  intervalId = null
})
</script>

<template>
  <div v-if="props.modelValue"
    class="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 text-left"
    @click="close()">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <h2 class="dialog-title">AI批量解析原件生成FAQ</h2>
        <button @click="close()" class="dialog-close">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="dialog-content">
        <div v-if="importStep === 1" class="space-y-6">
          <div @dragover.prevent="dragActive = true" @dragleave="dragActive = false"
            @drop.prevent="dragActive = false; const files = ($event as DragEvent).dataTransfer?.files; if (files && files[0]) handleFileSelected(files[0])"
            class="upload-area"
            :class="['p-10 flex flex-col items-center justify-center text-center transition-colors', dragActive ? 'active' : '']">
            <UploadCloud class="upload-icon w-12 h-12 mb-4" />
            <p class="text-sm font-bold text-slate-700 mb-2">拖拽或点击上传文件</p>
            <p class="text-xs text-slate-500 mb-6 max-w-sm">支持 Excel (.xlsx) 格式文件</p>
            <input ref="fileInput" type="file" id="faq-file-upload-input" class="hidden" accept=".xlsx"
              @change="($event.target as HTMLInputElement).files && handleFileSelected(($event.target as HTMLInputElement).files?.[0])" />
            <!-- <Button @click="fileInput?.click()" class="bg-amber-500 hover:bg-amber-600">选择文件解析</Button> -->
            <el-button type="primary" class="select-file-btn" @click="fileInput?.click()">选择文件解析</el-button>
          </div>
        </div>

        <div v-if="importStep === 2" class="py-12 flex flex-col items-center justify-center">
          <div class="relative mb-8">
            <Loader2 class="w-16 h-16 text-amber-500 animate-spin" />
            <div class="absolute inset-0 flex items-center justify-center">
              <FileText class="w-6 h-6 text-slate-700" />
            </div>
          </div>
          <h3 class="text-lg font-extrabold text-slate-800 mb-6">上传中...</h3>
          <!-- <h3 class="text-lg font-extrabold text-slate-800 mb-6">正在通读推演原件：{{ importedFile?.name }}</h3> -->
          <!-- <div class="w-full max-w-md bg-slate-900 rounded-lg p-4 font-mono text-[10px] text-emerald-400 h-48 overflow-y-auto space-y-2">
            <div v-for="(log, i) in parsingLogs" :key="i">{{ log }}</div>
            <div class="animate-pulse">_</div>
          </div> -->
        </div>

        <div v-if="importStep === 3" class="space-y-4 max-h-[60vh] overflow-y-auto">
          <div class="bg-blue-50 border border-blue-200 rounded p-4 flex gap-4 min-w-0">
            <FileText class="w-10 h-10 text-blue-500 shrink-0" />
            <div class="min-w-0">
              <h4 class="font-extrabold text-blue-900 text-sm">{{ importedFile?.name }}</h4>
              <p class="mt-2 text-xs text-blue-700">AI 从该原件中解析出了 {{ extractedFaqs.length }} 个 FAQ，请您审定或微调：</p>
            </div>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded p-4 flex gap-4 min-w-0 items-center">
            <label class="block text-sm font-bold text-slate-700">归属细分业务</label>
            <div class="flex-1">
              <el-tree-select v-model="categoryId" :props="treeDataProps" :data="props.categoryTreeData"
                :render-after-expand="false" check-strictly class="w-full bg-slate-50" />
            </div>
          </div>

          <div class="space-y-4">
            <div v-for="(faq, i) in extractedFaqs" :key="i"
              :class="['border rounded-xl p-4 transition-all', faq.selected ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200 opacity-60']">
              <div class="flex items-start gap-4">
                <input type="checkbox" :checked="faq.selected" @change="toggleExtractedFaq(faq)"
                  class="mt-1 w-4 h-4 text-amber-500" />
                <div class="flex-1 space-y-3">
                  <el-input v-model="faq.question" />
                  <el-input type="textarea" class="w-full" v-model="faq.answer" />
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white shadow-[0_-10px_10px_white]">
            <btn @click="close">取消</btn>
            <btn type="success" @click="handleCommitAIImport">
              将勾选项正式物理保存入库</btn>
          </div>
        </div>

        <div v-if="importStep === 4" class="py-12 flex flex-col items-center justify-center text-center">
          <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 class="w-10 h-10 text-emerald-600" />
          </div>
          <h3 class="text-xl font-black text-slate-800 mb-2">批处理入库成功！</h3>
          <p class="text-slate-500 mb-8 max-w-xs text-sm">这些 QA 意图现在已受本知识库配置监控，大模型问答若命中匹配即会被自动直接应用（Bypass）。</p>
          <btn @click="close" type="success">确定关闭</btn>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
@use "../../../assets/styles/dialog.scss";

.dialog-content {
  padding-bottom: 32px;

  .upload-area {
    background: rgba(235, 243, 245, 0.6);
    border-radius: 16px 16px 16px 16px;
    border: 1px solid #E1E6EC;

    &.active {
      border-color: var(--el-color-primary);
      background-color: #F5F7FA;
    }
  }

  .upload-icon {
    color: var(--el-color-primary);
  }

  .select-file-btn {
    width: 200px;
    height: 40px;
    border-radius: 20px 20px 20px 20px;
    font-size: 14px;
    color: #FFFFFF;
  }
}
</style>