<script setup lang="ts">
import {
  Search, Plus, Trash2, Edit, CheckCircle2, XCircle, UploadCloud, HelpCircle,
  Info, X, ChevronRight, ChevronDown, RefreshCw, Sparkles, Check, FileText,
  AlertCircle, BookOpen, Layers, Undo2, ArrowRight, Eye, ShieldAlert, BadgeCheck,
  FolderTree, Settings2, Shield, Lock, ShieldCheck, UserCheck, KeyRound, Globe,
  Database, User as UserIcon, Play, Loader2, Save, Send, EyeOff, Terminal,
  Bold, Italic, Underline, ImageIcon, Video, Paperclip, Link, Type, MessageSquare
} from 'lucide-vue-next'
// import Input from '@/components/ui/Input.vue'
// import Button from '@/components/ui/Button.vue'
// import Card from '@/components/ui/Card.vue'
// import { getDomains, getFlatDomains, isDomainMatch } from '@/lib/domain-store'
// import { getFAQKBs, saveFAQKBs, addFAQKB, deleteFAQKB, type FAQKnowledgeBase, type FAQItem, type FAQCategory } from '@/lib/faq-store'
// import { getUsers, getDepartments, getPositions, getUserGroups, type User } from '@/lib/org-store'
// import { getDefaultPermissions, type KBPermissions } from '@/lib/kb-store'

// import { listKnowledgeFaqApi } from '@/api/knowledgeLib/knowledgeFaq'
import type { KnowledgeFaqQueryParams, KnowledgeFaqEntity, KnowledgeLibFileListEntity, AjaxResult, KnowledgeFaqQuestionSaveParams, KnowledgeFaqQuestionEntity } from '@/types'

// import type { CategoryVO } from '@/types'
// import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'
import { uploadFile, uploadUrl as uploadFileUrl } from '@/utils/request'
import { resolveStaticPath } from '@/utils/index'
import { addKnowledgeFaqQuestionApi, updateKnowledgeFaqQuestionApi } from '@/api/knowledgeLib/knowledgeFaqQuestion'


const { proxy } = getCurrentInstance();
const formRef = ref(null)

const emit = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  knowledgeId: {
    type: [Number, String],
    default: ''
  },
  categoryId: {
    type: Number,
    default: 0
  },
  categoryTreeData: {
    type: Array as PropType<KnowledgeLibFileListEntity[]>,
    default: () => []
  },
  item: {
    type: Object as PropType,
    default: () => null
  }
})

const treeDataProps = {
  children: 'children',
  label: 'fileName',
  value: 'id',
}

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
  const item: KnowledgeFaqQuestionEntity | null = props.item
  editingFAQ.value = item
  if (item) {
    faqForm.question = item.question || ''
    faqForm.answer = item.answer || ''
    faqForm.categoryId = item.categoryId || ''
  } else {
    faqForm.question = ''
    faqForm.answer = ''
    faqForm.categoryId = props.categoryId
  }
}
const onClose = () => {
}

const close = (change: boolean = false) => {
  emit('update:modelValue', false)
  if (change) {
    emit('change', true)
  }
}


const faqAnswerTextarea = ref<HTMLTextAreaElement | null>(null)

const editingFAQ = ref<KnowledgeFaqQuestionEntity | null>(null)
const faqForm = reactive<KnowledgeFaqQuestionSaveParams>({
  question: '',
  answer: '',
  categoryId: '',
})
const faqRules = reactive({
  question: [{ required: true, message: '请输入标准问题', trigger: ['blur'] }],
  answer: [{ required: true, message: '请输入标准回答', trigger: ['blur'] }],
})


const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingFileType = ref<'image' | 'video' | 'file' | null>(null)

const insertRichTextFormat = (token: string) => {
  const textarea = faqAnswerTextarea.value
  if (!textarea) return

  if (token === 'image' || token === 'video' || token === 'file') {
    pendingFileType.value = token
    fileInputRef.value?.click()
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selectedText = text.substring(start, end)

  let wrap = ''
  switch (token) {
    case 'bold': wrap = `<strong>${selectedText || '加粗内容'}</strong>`; break
    case 'italic': wrap = `<em>${selectedText || '斜体内容'}</em>`; break
  }

  const newVal = text.substring(0, start) + wrap + text.substring(end)
  faqForm.answer = newVal
  setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + wrap.length, start + wrap.length) }, 50)
}

const handleFilePicked = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  target.value = ''

  handleUploadFile(file)

}
const handleUploadFile = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const uploadUrl = uploadFileUrl
  uploadFile(uploadUrl, formData).then((res: AjaxResult) => {
    if (res.code === 200) {
      const url = resolveStaticPath(res.data?.url)

      const fakeUrl = url
      const textarea = faqAnswerTextarea.value
      const start = textarea ? textarea.selectionStart : faqForm.answer.length
      const text = faqForm.answer

      let wrap = ''
      if (pendingFileType.value === 'image') {
        wrap = `<img src="${fakeUrl}" alt="${file.name}" class="max-w-xs rounded-md shadow-sm border border-slate-200 my-2" />`
      } else if (pendingFileType.value === 'video') {
        wrap = `<video controls class="max-w-sm rounded-md shadow my-2"><source src="${fakeUrl}" type="${file.type || 'video/mp4'}">不支持播放</video>`
      } else {
        wrap = `<a href="${fakeUrl}" download="${file.name}" class="text-blue-600 underline flex items-center gap-1 my-1">附件：${file.name}（${(file.size / 1024).toFixed(1)}KB）</a>`
      }

      const newVal = text.substring(0, start) + wrap + text.substring(start)
      faqForm.answer = newVal
      if (textarea) {
        setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + wrap.length, start + wrap.length) }, 50)
      }
      pendingFileType.value = null
    }
  })
}

const handleSaveFAQItem = () => {
  formRef.value?.validate().then((valid: boolean) => {
    if (valid) {
      doSave()
    }
  })
}
const doSave = () => {
  const params: KnowledgeFaqQuestionSaveParams = {
    ...faqForm,
  }
  const question = params.question?.trim() || '';
  if (!question) {
    proxy.$modal.msgError('请输入问题')
    return;
  }
  const answer = params.answer?.trim() || '';
  if (!answer) {
    proxy.$modal.msgError('请输入答案')
    return;
  }
  const categoryId = params.categoryId;
  if (!categoryId) {
    proxy.$modal.msgError('请选择归属业务域')
    return;
  }
  // const params: KnowledgeFaqQuestionSaveParams = {
  //   knowledgeId: props.knowledgeId,
  //   question: question,
  //   answer: answer,
  //   categoryId: categoryId
  // }
  params.question = question
  params.answer = answer
  params.categoryId = categoryId
  if (props.item) {
    params.id = props.item.id
    updateKnowledgeFaqQuestionApi(params).then((res: AjaxResult) => {
      if (res.code === 200) {
        proxy.$modal.msgSuccess('更新成功')
        close(true)
      }
    })
  } else {
    params.knowledgeId = props.knowledgeId
    addKnowledgeFaqQuestionApi(params).then((res: AjaxResult) => {
      if (res.code === 200) {
        proxy.$modal.msgSuccess('新增成功')
        close(true)
      }
    });
  }
}

</script>

<template>
  <div v-if="props.modelValue"
    class="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="dialog-container " @click.stop>
      <div class="dialog-header">
        <h2 class="dialog-title">
          {{ editingFAQ ? '编辑 FAQ 问题卡片' : '新增标准问题 (Q&A)' }}
        </h2>
        <button @click="close" class="dialog-close">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="dialog-content">
        <el-form ref="formRef" :model="faqForm" :rules="faqRules" label-position="top">
          <input type="file" ref="fileInputRef" class="hidden" @change="handleFilePicked" />
          <!-- <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">标准问题</label>
              <textarea required
                class="w-full h-24 text-sm border-slate-200 border rounded-lg p-3 focus:outline-blue-500 resize-none bg-slate-50/50"
                placeholder="标准疑问句。如：如何申请年鉴补签休假..." v-model="faqForm.question" />
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">归属细分业务</label>
                <el-tree-select v-model="faqForm.categoryId" :props="treeDataProps" :data="props.categoryTreeData"
                  :render-after-expand="false" check-strictly class="w-full bg-slate-50" />
              </div>
            </div>
          </div> -->

          <el-form-item label="标准问题" prop="question">
            <el-input v-model="faqForm.question" placeholder="标准疑问句。如：如何申请年鉴补签休假..."></el-input>
          </el-form-item>
          <el-form-item label="归属细分业务" prop="categoryId">
            <el-tree-select v-model="faqForm.categoryId" :props="treeDataProps" :data="props.categoryTreeData"
              :render-after-expand="false" check-strictly class="w-full bg-slate-50" />
          </el-form-item>
          <el-form-item label="标准话术解答 (Rich Response)" prop="answer">
            <template #label>
              <div class="w-full flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-slate-700 flex items-center gap-2">
                  标准话术解答 (Rich Response)
                </label>
                <div class="tools flex items-center bg-slate-100 rounded-md border border-slate-200 p-1 gap-1">
                  <button type="button" @click="insertRichTextFormat('bold')"
                    class="p-1.5 hover:bg-white rounded text-slate-600">
                    <Bold class="w-3.5 h-3.5" />
                  </button>
                  <button type="button" @click="insertRichTextFormat('italic')"
                    class="p-1.5 hover:bg-white rounded text-slate-600">
                    <Italic class="w-3.5 h-3.5" />
                  </button>
                  <div class="w-px h-4 bg-slate-300 mx-1"></div>
                  <button type="button" @click="insertRichTextFormat('image')"
                    class="p-1.5 hover:bg-white rounded text-slate-600 flex items-center gap-1 text-[10px]">
                    <ImageIcon class="w-3.5 h-3.5" />插图
                  </button>
                  <button type="button" @click="insertRichTextFormat('video')"
                    class="p-1.5 hover:bg-white rounded text-slate-600 flex items-center gap-1 text-[10px]"><Video
                      class="w-3.5 h-3.5" />视频</button>
                  <button type="button" @click="insertRichTextFormat('file')"
                    class="p-1.5 hover:bg-white rounded text-slate-600 flex items-center gap-1 text-[10px]">
                    <Paperclip class="w-3.5 h-3.5" />附件
                  </button>
                </div>
              </div>
            </template>
            <textarea ref="faqAnswerTextarea" required
              class="answer-textarea w-full h-48 sm:h-64 text-sm border-slate-200 border rounded-lg p-3 resize-none shadow-inner"
              placeholder="支持直接在此书写 HTML 富文本标记。如需插入图片点击上方工具..." v-model="faqForm.answer" />
          </el-form-item>

          <!-- <el-form-item>
            <div class="operation-btns">
              <btn @click="close" round>
                取消
              </btn>
              <btn type="primary" @click="handleSaveFAQItem" round>
                保存
              </btn>
            </div>
          </el-form-item> -->
          <!-- <div class="pt-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
            <Button type="button" variant="outline" class="px-6" @click="close">取消</Button>
            <Button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-8">
              <Save class="w-4 h-4 mr-2" /> 保存
            </Button>
          </div> -->
        </el-form>
      </div>
      <div class="dialog-footer">
        <btn @click="close" round>
          取消
        </btn>
        <btn type="primary" @click="handleSaveFAQItem" round>
          保存
        </btn>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
@use "../../../assets/styles/dialog.scss";

.dialog-content {
  padding-bottom: 2px;

  :deep(.el-form-item__label) {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
}

.answer-textarea {
  outline: none;

  &:hover {
    outline: 1px solid var(--el-color-primary);
  }
}

.tools {
  button {
    cursor: pointer;
  }
}

.operation-btns {
  text-align: right;
  width: 100%;

  .el-button+.el-button {
    margin-left: 20px;
  }
}
</style>