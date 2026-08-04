<script setup lang="ts">
import { Database, X } from 'lucide-vue-next'
// import {
//   Search, Plus, Trash2, Edit, CheckCircle2, XCircle, UploadCloud, HelpCircle,
//   Info, X, ChevronRight, ChevronDown, RefreshCw, Sparkles, Check, FileText,
//   AlertCircle, BookOpen, Layers, Undo2, ArrowRight, Eye, ShieldAlert, BadgeCheck,
//   FolderTree, Settings2, Shield, Lock, ShieldCheck, UserCheck, KeyRound, Globe,
//   Database, User as UserIcon, Play, Loader2, Save, Send, EyeOff, Terminal,
//   Bold, Italic, Underline, ImageIcon, Video, Paperclip, Link, Type, MessageSquare
// } from 'lucide-vue-next'
// import Input from '@/components/ui/Input.vue'
// import Button from '@/components/ui/Button.vue'
// import Card from '@/components/ui/Card.vue'
// import { getDomains, getFlatDomains, isDomainMatch } from '@/lib/domain-store'
// import { getFAQKBs, saveFAQKBs, addFAQKB, deleteFAQKB, type FAQKnowledgeBase, type FAQItem, type FAQCategory } from '@/lib/faq-store'
// import { getUsers, getDepartments, getPositions, getUserGroups, type User } from '@/lib/org-store'
// import { getDefaultPermissions, type KBPermissions } from '@/lib/kb-store'

import DomainSelect from '@/components/common/DomainSelect2.vue'

import { addKnowledgeFaqApi, updateKnowledgeFaqApi } from '@/api/knowledgeLib/knowledgeFaq'
import type { AjaxResult, KnowledgeFaqEntity, KnowledgeFaqSaveParams } from '@/types'
import Btn from '@/components/controls/Btn.vue';

const { proxy } = getCurrentInstance();

const emit = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object as () => KnowledgeFaqEntity,
    default: () => null
  }
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
  const item: KnowledgeFaqEntity | null = props.item
  if (item) {
    formData.name = item.name
    formData.description = item.description
    formData.categoryId = item.categoryId
  }
}
const onClose = () => {
  formData.name = ''
  formData.description = ''
  formData.categoryId = null
}

const close = (change: boolean = false) => {
  emit('update:modelValue', false)
  if (change) {
    emit('change', true)
  }
}

const formRef = ref(null)
const formData = reactive({
  name: '',
  description: '',
  categoryId: null,
})
const formRules = reactive({
  name: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择归属业务域', trigger: 'blur' }],
  description: [{ required: false, message: '请输入描述与管控备注', trigger: 'blur' }],
})

const handleCreateKB = () => {
  formRef.value.validate().then((valid: boolean) => {
    if (valid) {
      doSave()
    }
  })
}

const doSave = () => {
  const params: KnowledgeFaqSaveParams = {
    name: formData.name,
    description: formData.description,
    categoryId: formData.categoryId,
    knowledgeType: 1,
  };
  const item: KnowledgeFaqEntity | null = props.item as KnowledgeFaqEntity
  if (item) {
    params.id = item.id!
    updateKnowledgeFaqApi(params).then((res: AjaxResult) => {
      if (res.code === 200) {
        close(true)
      }
    })
  } else {
    addKnowledgeFaqApi(params).then((res: AjaxResult) => {
      if (res.code === 200) {
        close(true)
      }
    })
  }
}

</script>

<template>
  <div v-if="props.modelValue"
    class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <h3 class="dialog-title">
          {{ props.item ? '编辑FAQ知识库' : '创建新FAQ知识库' }}
        </h3>
        <button @click="close" class="dialog-close">
          <X class="w-5 h-5" />
        </button>
      </div>
      <el-form class="faq-save-form" :model="formData" :rules="formRules" ref="formRef" label-position="top">
        <el-form-item label="知识库名称" prop="name">
          <el-input v-model="formData.name" placeholder="如：人资差旅FAQ2025版" />
        </el-form-item>
        <el-form-item label="归属业务域" prop="categoryId">
          <DomainSelect v-model="formData.categoryId" check-strictly />
        </el-form-item>
        <el-form-item label="描述与管控备注" prop="description">
          <el-input v-model="formData.description" placeholder="输入该FAQ库的安全边界要求..." />
        </el-form-item>
        <!-- <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">知识库名称 *</label>
          <el-input placeholder="如：人资差旅FAQ2025版" v-model="newKBTitle" />
        </div> -->
        <!-- <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">归属业务域 *</label>
          <DomainSelect v-model="newKBDomain" check-strictly />
        </div> -->
        <!-- <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">描述与管控备注</label>
          <el-input v-model="newKBDesc" placeholder="输入该FAQ库的安全边界要求..." />
        </div> -->
        <div class="pt-4 flex justify-end gap-3">
          <!-- <Button type="button" variant="ghost" @click="close()">取消</Button>
          <Button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white">保存</Button> -->
          <btn @click="close" round>取消</btn>
          <btn type="primary" @click="handleCreateKB" round>保存</btn>
        </div>
      </el-form>
    </div>
  </div>
</template>
<style scoped lang="scss">
@use "../../../assets/styles/dialog.scss";

.faq-save-form {
  padding: 20px 40px;
}
</style>
