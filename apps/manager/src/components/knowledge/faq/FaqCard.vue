<template>
  <div :key="item.id" class="faq-card" @click="handleClick">
    <div class="flex items-start justify-between">
      <span class="faq-card-type-tag">FAQ知识库</span>
      <div class="flex items-center gap-2">
        <button v-hasPermi="['knowledge:faq:edit']" @click.stop="handleEdit"
          class="cursor-pointer p-1 text-slate-400 hover:text-rose-600">
          <Edit class="w-4 h-4" />
        </button>
        <button v-hasPermi="['knowledge:faq:remove']" @click.stop="handleDelete"
          class="cursor-pointer p-1 text-slate-400 hover:text-rose-600">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
    <div class="name-row flex-1">
      <g-text class="faq-name" :line="2" :content="item.name" popper-class="tooltip-short">{{ item.name }}</g-text>
      <g-text class="faq-description" :line="2" :content="item.description" popper-class="tooltip-short">{{
        item.description }}</g-text>
    </div>
    <div class="faq-footer">
      <span class="faq-footer-left">
        <svg-icon icon-class="mp-question-point" /> {{ item.faqs?.length }} 问答点
      </span>
      <!-- <span v-hasPermi="['knowledge:faq:setup']"
        class="faq-footer-right text-blue-600 font-bold group-hover:underline">管理配置
        &rarr;</span> -->
      <btn v-hasPermi="['knowledge:faq:setup']" class="faq-manage-btn">
        <svg-icon icon-class="mp-manage" />
        管理配置
      </btn>
    </div>
  </div>
</template>
<script setup lang="ts">
// import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import {
  Search, Plus, Trash2, Edit, CheckCircle2, XCircle, UploadCloud, HelpCircle,
  Info, X, ChevronRight, ChevronDown, RefreshCw, Sparkles, Check, FileText,
  AlertCircle, BookOpen, Layers, Undo2, ArrowRight, Eye, ShieldAlert, BadgeCheck,
  FolderTree, Settings2, Shield, Lock, ShieldCheck, UserCheck, KeyRound, Globe,
  Database, User as UserIcon, Play, Loader2, Save, Send, EyeOff, Terminal,
  Bold, Italic, Underline, ImageIcon, Video, Paperclip, Link, Type, MessageSquare
} from 'lucide-vue-next'

import type { KnowledgeFaqEntity } from '@/types'


const props = defineProps({
  item: {
    type: Object as () => KnowledgeFaqEntity,
    default: () => ({})
  }
})

const emit = defineEmits(['click', 'delete', 'edit'])

const handleClick = () => {
  // selectedKBId = props.item.id
  emit('click', props.item)
}

const handleDelete = () => {
  emit('delete', props.item)
}

const handleEdit = () => {
  emit('edit', props.item)
}

</script>
<style scoped lang="scss">
.faq-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 24px 24px 24px 24px;
  height: 280px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  overflow: hidden;
  padding: 24px;
}

.faq-card-type-tag {
  background: #EBF3F5;
  border-radius: 4px 4px 4px 4px;
  padding: 3px 8px;
  font-size: 12px;
  color: var(--el-color-primary, #3297A0);
  line-height: 18px;
}

.name-row {
  flex-grow: 1;
  margin: 20px 0px;

  .faq-name {
    font-weight: bold;
    font-size: 18px;
    color: #2B2F33;
    line-height: 27px;
  }

  .faq-description {
    font-weight: 400;
    font-size: 14px;
    color: #B0BAC6;
    line-height: 21px;
    margin-top: 16px;
  }
}

.faq-footer {
  margin-top: auto;
  border-top: 1px solid #E1E6EC;
  padding: 12px 0 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .faq-footer-left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #77838F;
    line-height: 16px;

    .svg-icon {
      color: var(--el-color-primary, #3297A0);
      font-size: 16px;
    }
  }

  .faq-footer-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .faq-manage-btn {
    .svg-icon {
      font-size: 24px;
    }
  }
}
</style>