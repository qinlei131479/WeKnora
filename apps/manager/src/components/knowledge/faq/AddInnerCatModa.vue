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
// import Card from '@/components/ui/Card.vue'
// import { getDomains, getFlatDomains, isDomainMatch } from '@/lib/domain-store'
// import { getFAQKBs, saveFAQKBs, addFAQKB, deleteFAQKB, type FAQKnowledgeBase, type FAQItem, type FAQCategory } from '@/lib/faq-store'
// import { getUsers, getDepartments, getPositions, getUserGroups, type User } from '@/lib/org-store'
// import { getDefaultPermissions, type KBPermissions } from '@/lib/kb-store'


// import { listKnowledgeFaqApi } from '@/api/knowledgeLib/knowledgeFaq'
import { addFolderApi, updateSingleApi } from '@/api/knowledgeLib/knowledgeFile'



import type { KnowledgeLibFileListEntity, KnowledgeLibFileAddFolderApiParams, AjaxResult, KnowledgeLibFileSaveParams } from '@/types'

const { proxy } = getCurrentInstance();

const emit = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  libId: {
    type: [String, Number],
    default: ''
  },
  parent: {
    type: Object as () => KnowledgeLibFileListEntity,
    default: null
  },
  item: {
    type: Object as () => KnowledgeLibFileListEntity,
    default: null
  }
})

const nameInput = ref<HTMLInputElement>()

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

const newInnerCatName = ref('')
const parentName = ref('')
const title = ref('新建分类节点')

const onOpen = () => {
  const item: KnowledgeLibFileListEntity = props.item
  if (item && item.id) {
    newInnerCatName.value = item.fileName || ''
    title.value = '修改分类节点'
  } else {
    newInnerCatName.value = ''
    title.value = '新建分类节点'
  }
  const parent: KnowledgeLibFileListEntity = props.parent
  if (parent) {
    parentName.value = parent.fileName || parent.id
  } else {
    parentName.value = '作为根分类'
  }
  focusNameInput()
}
const onClose = () => {
  newInnerCatName.value = ''
  parentName.value = '作为根分类'
}

const close = (change: boolean = false) => {
  emit('update:modelValue', false)
  if (change) {
    emit('change', true)
  }
}

const focusNameInput = () => {
  nameInput.value?.$el.focus()
}

const handleCreateInnerCat = () => {
  const name = newInnerCatName.value.trim()
  if (!name) {
    proxy.$modal.msgError('请输入分类名称')
    focusNameInput()
    return
  }
  const parent: KnowledgeLibFileListEntity = props.parent
  const item: KnowledgeLibFileListEntity = props.item
  if (item && item.id) {
    const params: KnowledgeLibFileSaveParams = {
      id: item.id,
      fileName: name
    }
    updateSingleApi(params).then((res: AjaxResult) => {
      if (res.code === 200) {
        proxy.$modal.msgSuccess('分类已修改')
        close(true)
      }
    }).catch(() => { })
  } else {
    const params: KnowledgeLibFileAddFolderApiParams = {
      knowledgeId: props.libId!,
      parentCode: parent?.code || '',
      name: name
    }
    addFolderApi(params).then((res: AjaxResult) => {
      if (res.code === 200) {
        proxy.$modal.msgSuccess('分类已添加')
        close(true)
      }
    })
  }
  // triggerToast('分类已添加')
}


</script>

<template>
  <Teleport to="body">
    <div v-if="props.modelValue"
      class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" @click="close">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm" @click.stop>
        <div class="p-4 border-b flex items-center justify-between">
          <h3 class="font-bold text-sm text-slate-800">{{ title }}</h3>
          <button @click="close" class="cursor-pointer">
            <X class="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <form @submit.prevent="handleCreateInnerCat" class="p-5 space-y-4">
          <div>
            <label class="block text-xs text-slate-500 mb-1">上级节点</label>
            <div class="text-sm px-3 py-2 bg-slate-50 border border-slate-100 rounded text-slate-700">
              {{ parentName }}
            </div>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">分类名称</label>
            <Input ref="nameInput" autoFocus v-model="newInnerCatName" class="h-9 text-sm" placeholder="如：报销规范" />
          </div>
          <btn type="primary" class="w-full" @click="handleCreateInnerCat">确定保存</btn>
        </form>
      </div>
    </div>
  </Teleport>
</template>