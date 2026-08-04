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


import { detailKnowledgeFaqApi, listKnowledgeFaqApi } from '@/api/knowledgeLib/knowledgeFaq'
import type { KnowledgeFaqQueryParams, KnowledgeFaqEntity, AjaxResult, SysDept, SysPost, SysUser, KnowledgeAuthEntity, KnowledgeAuthSingleSave } from '@/types'
import { CardConfig, CardPermissions } from './Permission'
import { TreeDept } from '@/service/deptService'
import { updateKnowledgeAuthApi } from '@/api/knowledgeLib/knowledgeAuth'

const isDev = import.meta.env.DEV;
const { proxy } = getCurrentInstance();

const emit = defineEmits(['back', 'add', 'change'])

const props = defineProps({
  item: {
    type: Object as () => KnowledgeFaqEntity,
    default: () => ({})
  },
  config: {
    type: Object as () => CardConfig,
    default: () => ({})
  },
  permissions: {
    type: Object as () => CardPermissions,
    default: () => null
  },
  deptService: {
    type: Object,
    default: () => null
  }
})

const dv = computed(() => {
  const permissions = props.permissions || {}
  const positionItems = permissions.positionPermissions || []
  const groupItems = permissions.groupPermissions || []

  const deptDataMap = props.deptService?.dataMap || {}
  const deptItems = (permissions.deptPermissions || []).map((v: KnowledgeAuthEntity) => {
    const item = { ...v };
    const deptNames = [];
    let deptItem: TreeDept | undefined = deptDataMap[item.authId]
    while (deptItem) {
      deptNames.unshift(deptItem.deptName)
      deptItem = deptItem.parentId && deptDataMap[deptItem.parentId]
    }
    item.authName = deptNames.join('-') || item.authName
    return item;
  })
  return {
    deptItems,
    positionItems,
    groupItems
  }
});

const handleAddClick = () => {
  emit('add', { config: props.config })
}

const emitChange = () => {
  emit('change')
}

const removeAuth = (kb: KnowledgeAuthEntity, flag: keyof KnowledgeAuthEntity) => {
  // const value = (kb as any)[flag];
  const params: KnowledgeAuthSingleSave = {
    knowledgeId: kb.knowledgeId!,
    authId: kb.authId!,
    authType: kb.authType!,
    [flag]: 0,
  }
  return updateKnowledgeAuthApi(params).then((res) => {
    if (res.code == 200) {
      emitChange()
    }
  }, () => {
    emitChange()
  })
}

const handleRemoveDept = (item: KnowledgeAuthEntity) => {
  removeAuth(item, props.config.type)
}
const handleRemovePosition = (item: KnowledgeAuthEntity) => {
  removeAuth(item, props.config.type)
}
const handleRemoveUser = (item: KnowledgeAuthEntity) => {
  removeAuth(item, props.config.type)
}



</script>

<template>
  <div class="FaqDetailPermissionsCard" :class="{
    'manageFlag': config.type === 'manageFlag',
    'queryFlag': config.type === 'queryFlag',
    'downloadFlag': config.type === 'downloadFlag',
  }">
    <div class="card-header">
      <div class="left">
        <div class="title">{{ config.title }}</div>
        <div class="desc">{{ config.description }}</div>
      </div>
      <btn class="right" @click="handleAddClick">
        + 添加白名单
      </btn>
    </div>
    <div class="card-content">
      <el-scrollbar>
        <div class="subject-area">
          <div class="subject-title">授权部门</div>
          <div class="subject-items">
            <span v-for="d in dv.deptItems" :key="d.id" class="subject-item">
              {{ d.authName }}
              <X @click="handleRemoveDept(d)" class="close-icon" />
            </span>
          </div>
        </div>
        <div class="subject-area">
          <div class="subject-title">授权岗位</div>
          <div class="subject-items">
            <span v-for="p in dv.positionItems" :key="p.id" class="subject-item">
              {{ p.authName }}
              <X @click="handleRemovePosition(p)" class="close-icon" />
            </span>
          </div>
        </div>
        <div class="subject-area">
          <div class="subject-title">用户组</div>
          <div class="subject-items">
            <span v-for="u in dv.groupItems" :key="u.id" class="subject-item">
              {{ u.authName }}
              <X @click="handleRemoveUser(u)" class="close-icon" />
            </span>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>
<style scoped lang="scss">
.FaqDetailPermissionsCard {
  overflow: hidden;
  background: #FFFFFF;
  border-radius: 24px 24px 24px 24px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.card-header {
  flex-shrink: 0;
  padding: 24px 32px;
  // background: rgba(235, 243, 245, 0.6);
  border-radius: 24px 24px 0px 0px;
  border: 1px solid #FFFFFF;
  box-sizing: border-box;

  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-weight: bold;
    font-size: 16px;
    line-height: 24px;
  }

  .desc {
    margin-top: 8px;
    font-size: 14px;
    color: #77838F;
    line-height: 20px;
  }
}

.FaqDetailPermissionsCard.manageFlag {
  .card-header {
    background: rgba(235, 243, 245, 0.6);
  }

  .title {
    color: #3297A0;
  }
}

.FaqDetailPermissionsCard.queryFlag {
  .card-header {
    background: #ECFBF5;
  }

  .title {
    color: #29B276;
  }
}

.FaqDetailPermissionsCard.downloadFlag {
  .card-header {
    background: #F5F5FF;
  }

  .title {
    color: #2015B9;
  }
}

.card-content {
  flex-grow: 1;
  overflow: auto;
  min-height: 0;
  padding: 20px 32px;
}

.subject-area {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  .subject-title {
    font-weight: 400;
    font-size: 14px;
    color: #77838F;
    line-height: 20px;
  }

  .subject-items {
    // margin-top: 8px;

    .subject-item {
      background: rgba(235, 243, 245, 0.6);
      border-radius: 8px 8px 8px 8px;
      border: 1px solid #E1E6EC;
      box-sizing: border-box;
      font-weight: 400;
      font-size: 14px;
      color: #2B2F33;
      line-height: 20px;
      padding: 6px 12px;
      margin: 8px 8px 0 0;
      vertical-align: middle;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      .close-icon {
        background: #B0BAC6;
        width: 12px;
        height: 12px;
        margin-left: 12px;
        cursor: pointer;
        border-radius: 50%;
        color: #FFFFFF;

        &:hover {
          color: var(--el-color-primary);
          background: #e4dbdb;
        }
      }

      &:last-child {
        margin-right: 0;
      }
    }
  }
}
</style>