<script setup lang="ts">
// import {
//   Search, Plus, Trash2, Edit, CheckCircle2, XCircle, UploadCloud, HelpCircle,
//   Info, X, ChevronRight, ChevronDown, RefreshCw, Sparkles, Check, FileText,
//   AlertCircle, BookOpen, Layers, Undo2, ArrowRight, Eye, ShieldAlert, BadgeCheck,
//   FolderTree, Settings2, Shield, Lock, ShieldCheck, UserCheck, KeyRound, Globe,
//   Database, User as UserIcon, Play, Loader2, Save, Send, EyeOff, Terminal,
//   Bold, Italic, Underline, ImageIcon, Video, Paperclip, Link, Type, MessageSquare
// } from 'lucide-vue-next'
// import Button from '@/components/ui/Button.vue'

import SubPageHeader from '@/components/page/SubPageHeader.vue'
import FaqDetailFaq from './FaqDetailFaq.vue'
import FaqDetailPermissions from './FaqDetailPermissions.vue'
import { detailKnowledgeFaqApi } from '@/api/knowledgeLib/knowledgeFaq'
import type { KnowledgeFaqEntity, AjaxResult } from '@/types'

const emit = defineEmits(['back'])

const props = defineProps({
  dataId: {
    type: [String, Number],
    default: ''
  }
})
const selectedKB = ref<KnowledgeFaqEntity | null>(null)
const activeTab = ref<'faq' | 'permissions'>('faq')

const handleBack = () => {
  // selectedKBId = null
  emit('back')
}

const getById = (id: string | number) => {
  const idNum = Number(id)
  detailKnowledgeFaqApi(idNum).then((res: AjaxResult) => {
    if (res.code === 200) {
      selectedKB.value = res.data as KnowledgeFaqEntity
    }
  }).catch(() => { })
}



onMounted(() => {
  getById(props.dataId)
})
</script>

<template>
  <page-layout class="faq-detail default-bg" gap="20">
    <template #start>
      <SubPageHeader :handleBack="handleBack" :back="true" :title="selectedKB?.name" :desc="selectedKB?.description" />
    </template>
    <page-layout row gap="80">
      <template #start>
        <div></div>
      </template>
      <page-layout gap="5">
        <template #start>
          <el-tabs v-model="activeTab" class="demo-tabsTab">
            <el-tab-pane label="FAQ数据管理" name="faq"></el-tab-pane>
            <el-tab-pane label="权限与授权设置" name="permissions"></el-tab-pane>
          </el-tabs>
        </template>
        <FaqDetailFaq v-if="activeTab === 'faq'" :item="selectedKB" />
        <FaqDetailPermissions v-if="activeTab === 'permissions'" :item="selectedKB" />
      </page-layout>
      <template #end>
        <div></div>
      </template>
    </page-layout>
    <template #end>
      <div style="height: 20px;"></div>
    </template>
  </page-layout>
</template>
<style scoped lang="scss">
.faq-detail {
  height: 100%;
}
</style>
