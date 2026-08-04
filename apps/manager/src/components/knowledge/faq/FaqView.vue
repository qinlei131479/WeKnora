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


import { listKnowledgeFaqApi } from '@/api/knowledgeLib/knowledgeFaq'
import type { KnowledgeFaqQueryParams, KnowledgeFaqEntity } from '@/types'

import type { CategoryVO } from '@/types'
import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'


const { proxy } = getCurrentInstance();

const emit = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object as () => FAQItem,
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

}
const onClose = () => {
}

const close = (change: boolean = false) => {
  emit('update:modelValue', false)
  if (change) {
    emit('change', true)
  }
}


</script>

<template>
  <div v-if="props.modelValue"
    class="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 text-left"
    @click="close">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <h2 class="dialog-title">
          查看 FAQ
        </h2>
        <button @click="close" class="dialog-close">
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="dialog-content">
        <div class="dialog-content-item">
          <h3 class="content-title">标准问题</h3>
          <div class="content-desc">
            {{ props.item?.question }}
          </div>
        </div>
        <div class="dialog-content-item">
          <h3 class="content-title">完整答案</h3>
          <div class="content-desc" v-html="props.item?.answer" />
        </div>
      </div>
      <div class="dialog-footer">
        <btn @click="close" type="primary">关闭</btn>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
@use "../../../assets/styles/dialog.scss";

.dialog-content-item {
  font-size: 14px;
  color: #2B2F33;
  line-height: 20px;

  &+.dialog-content-item {
    margin-top: 20px;
  }

  .content-title {
    margin-bottom: 9px;
  }

  .content-desc {
    padding: 8px 16px;
    background: rgba(235, 243, 245, 0.6);
    border-radius: 8px 8px 8px 8px;
    border: 1px solid #E1E6EC;
    box-sizing: border-box;
    white-space: wrap;
    word-break: break-all;
    max-height: 200px;
    overflow: auto;
  }
}
</style>