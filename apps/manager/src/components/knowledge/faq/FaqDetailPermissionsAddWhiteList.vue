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
// import { getUsers, getDepartments, getPositions, getUserGroups, type User } from '@/lib/org-store'
import { getDefaultPermissions, type KBPermissions } from '@/lib/kb-store'


import { listKnowledgeFaqApi } from '@/api/knowledgeLib/knowledgeFaq'
import type { KnowledgeFaqQueryParams, KnowledgeFaqEntity, AjaxResult, KnowledgeAuthEntity, KnowledgeAuthSingleSave, KnowledgeAuthType, KnowledgeAuthBatchSaveParam } from '@/types'

import type { SysDept, SysPost, BusinessRoleEntity } from '@/types'
// import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'

import type { CardConfig, CardPermissions } from './Permission'

import positionServiceFactory, { PositionEntity } from '@/service/positionService'
import groupServiceFactory, { GroupEntity } from '@/service/groupService'

import DeptCheckTree from '@/components/SubCheckTree/index.vue'
import { TreeDept } from '@/service/deptService'
import { updateFaqAuthApi, updateKnowledgeAuthApi } from '@/api/knowledgeLib/knowledgeAuth'
import { walkTreeData } from '@/utils'
const deptTreeProps = {
  // key: 'id',
  label: 'deptName',
  children: 'children',
}
const authTypeDept = 0;
const authTypePosition = 1;
const authTypeUserGroup = 2;

const { proxy } = getCurrentInstance();

const emit = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
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
  },
  permType: {
    type: String,
    default: 'Depts'
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
  setActivePermType(props.permType)
  changeFlag.value = false
  // props.deptService.load();
  // positionService.load();
  // groupService.load();

  const permissions: CardPermissions = props.permissions || {}

  const deptPermissions: KnowledgeAuthEntity[] = permissions.deptPermissions || []
  const permMap0 = deptPermissions.reduce((acc, cur) => {
    acc[cur.authId!] = cur
    return acc
  }, {} as Record<string, KnowledgeAuthEntity>);

  const positionPermissions: KnowledgeAuthEntity[] = permissions.positionPermissions || []
  const permMap1 = positionPermissions.reduce((acc, cur) => {
    acc[cur.authId!] = cur
    return acc
  }, {} as Record<string, KnowledgeAuthEntity>);

  const groupPermissions: KnowledgeAuthEntity[] = permissions.groupPermissions || []
  const permMap2 = groupPermissions.reduce((acc, cur) => {
    acc[cur.authId!] = cur
    return acc
  }, {} as Record<string, KnowledgeAuthEntity>);
  deptPermMap.value = permMap0
  positionPermMap.value = permMap1
  groupPermMap.value = permMap2
}
const onClose = () => {
}

const close = () => {
  emit('update:modelValue', false)
  if (changeFlag.value) {
    emit('change', true)
  }
}

const positionPermMap = ref<Record<string, KnowledgeAuthEntity>>({})
const groupPermMap = ref<Record<string, KnowledgeAuthEntity>>({})
const deptPermMap = ref<Record<string, KnowledgeAuthEntity>>({})

const changeFlag = ref(false)
const deptList = ref<any[]>([])
const positionList = ref<any[]>([])
const userGroupList = ref<any[]>([])
const checkedDeptList = ref<any[]>([])
const checkedPositionList = ref<any[]>([])
const checkedUserGroupList = ref<any[]>([])
const permSearchKeyword = ref('')
const activePermType = ref<'Depts' | 'Positions' | 'UserGroups'>('')
const setActivePermType = (type: 'Depts' | 'Positions' | 'UserGroups') => {
  activePermType.value = type
  permSearchKeyword.value = ''
  if (type === 'Depts') {
    props.deptService.load();
  } else if (type === 'Positions') {
    positionService.load();
  } else if (type === 'UserGroups') {
    groupService.load();
  }
}
const activePermTypeChange = (type: 'Depts' | 'Positions' | 'UserGroups') => {
  console.log('activePermTypeChange', type)
  setActivePermType(type)
}

const positionService = positionServiceFactory({})
const groupService = groupServiceFactory({})

interface AuthTreeDept extends TreeDept {
  authItem?: KnowledgeAuthEntity
}
const deptTreeData = computed(() => {
  const permMap = deptPermMap.value;
  const deptData = props.deptService.treeData || []
  const authProp = props.config.type as keyof KnowledgeAuthEntity;
  const toNewItem = (item: TreeDept) => {
    const authItem = permMap[item.deptId!]
    const newItem: AuthTreeDept = {
      ...item,
      authItem,
      checked: authItem?.[authProp] === 1
    }
    if (item.children) {
      newItem.children = item.children.map(toNewItem)
    }
    return newItem
  }
  const newDeptData = deptData.map(toNewItem)
  return newDeptData
});

const handleDeptTreeCheckChange = (data: TreeDept, selfOnly: boolean = false) => {
  const newChecked = data.checked;
  const libItem: KnowledgeFaqEntity = props.item;
  const flag = props.config.type as keyof KnowledgeAuthEntity;
  if (selfOnly) {
    const params: KnowledgeAuthSingleSave = {
      knowledgeId: libItem.id!,
      authId: data.deptId!,
      authType: authTypeDept,
      [flag]: newChecked ? 1 : 0,
    }
    return updateKnowledgeAuthApi(params).then((res) => {
      if (res.code === 200) {
        changeFlag.value = true
      }
    })
  }

  const authList: KnowledgeAuthType[] = []
  const params: KnowledgeAuthBatchSaveParam = {
    knowledgeId: libItem.id!,
    authList,
    [flag]: newChecked ? 1 : 0,
  };
  authList.push({
    authId: data.deptId!,
    authType: authTypeDept,
  });
  walkTreeData(data.children, (item: TreeDept) => {
    item.checked = newChecked
    authList.push({
      authId: item.deptId!,
      authType: authTypeDept,
    });
  })

  updateFaqAuthApi(params).then((res) => {
    if (res.code == 200) {
      changeFlag.value = true
    }
  })
}
const handleDeptTreeSubClick = (data: TreeDept) => {
  const newChecked = !data.checked
  data.checked = newChecked
  handleDeptTreeCheckChange(data, false)
};
const handleDeptTreeItemClick = (data: TreeDept) => {
  const newChecked = !data.checked
  data.checked = newChecked
  handleDeptTreeCheckChange(data, true)
};
const handleDeptTreeCheckClick = (data: TreeDept) => {
  handleDeptTreeCheckChange(data, true)
};



const handleAuthChange = (data: PositionEntity | GroupEntity) => {
  const flag = props.config.type as keyof KnowledgeAuthEntity;
  const newChecked = data.checked;
  const knowledgeItem: KnowledgeFaqEntity = props.item;
  const knowledgeId = knowledgeItem.id!
  let authId: any = '';
  let authType: any = '';
  const permType = activePermType.value
  if (permType === 'Positions') {
    authId = (data as PositionEntity).postId!;
    authType = authTypePosition;
  } else if (permType === 'UserGroups') {
    authId = (data as GroupEntity).id!;
    authType = authTypeUserGroup;
  }
  const params: KnowledgeAuthSingleSave = {
    knowledgeId,
    authId,
    authType,
    [flag]: newChecked ? 1 : 0,
  }
  return updateKnowledgeAuthApi(params).then((res) => {
    if (res.code === 200) {
      changeFlag.value = true
    }
  })
}
const rowList = ref<PositionEntity[] | GroupEntity[]>([]);
watchEffect(() => {
  const type = activePermType.value
  // console.log('rowList', type)
  const flag = props.config.type as keyof KnowledgeAuthEntity;
  let dataList: (PositionEntity | GroupEntity)[] = [];
  const keyword = permSearchKeyword.value.trim().toLowerCase();
  if (type === 'Positions') {
    const permMap = positionPermMap.value;
    positionService.listData.forEach((item: PositionEntity) => {
      if (item.postName && item.postName.toLowerCase().includes(keyword)) {
        const newItem = {
          ...item,
          checked: permMap[item.postId!]?.[flag] === 1
        };
        dataList.push(newItem)
      }
    })
  } else if (type === 'UserGroups') {
    const permMap = groupPermMap.value;
    groupService.listData.forEach((item: GroupEntity) => {
      if (item.groupName && item.groupName.toLowerCase().includes(keyword)) {
        const newItem = {
          ...item,
          checked: permMap[item.id!]?.[flag] === 1
        };
        dataList.push(newItem)
      }
    })
  } else if (type === 'Depts') {
    deptTreeRef.value?.filter(keyword)
  }
  rowList.value = dataList
})

const deptTreeRef = ref(null);




const handleToggle = (item: PositionEntity | GroupEntity) => {
  item.checked = !item.checked
  handleAuthChange(item)
}



// const kbs = ref<FAQKnowledgeBase[]>([])

// const showPermPickerModal = ref(false)
// const activePermCategory = ref<'manage' | 'accessQuery' | 'accessDownload'>('manage')


// const getSelectedPerms = (cat: 'manage' | 'accessQuery' | 'accessDownload', type: 'Depts' | 'Positions' | 'UserGroups') => {
//   if (!selectedKB.value) return []
//   const p = selectedKB.value.permissions || getDefaultPermissions()
//   const key = `${cat}${type}` as keyof KBPermissions
//   return (p[key] as string[]) || []
// }

// const handleToggleKBPermission = (
//   category: 'manage' | 'accessQuery' | 'accessDownload',
//   type: 'Depts' | 'Positions' | 'UserGroups',
//   id: string
// ) => {
//   if (!selectedKB.value) return
//   if (activeUser.value.role === 'viewer') return alert('🔒 只读权限拒绝设置')

//   const nextKBs = kbs.value.map(kb => {
//     if (kb.id !== selectedKB.value!.id) return kb
//     const p = kb.permissions || getDefaultPermissions()
//     const key = `${category}${type}` as keyof KBPermissions
//     const listing = (p[key] as string[]) || []
//     const updatedList = listing.includes(id) ? listing.filter(v => v !== id) : [...listing, id]
//     return { ...kb, permissions: { ...p, [key]: updatedList } }
//   })
//   kbs.value = nextKBs
//   saveFAQKBs(nextKBs)
// }


</script>

<template>
  <div v-if="props.modelValue"
    class="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="dialog-container max-w-2xl min-h-[500px] max-h-[90vh]" @click.stop>
      <div class="dialog-header">
        <h3 class="dialog-title">选定并分配权限目标</h3>
        <button @click="close" class="dialog-close">
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="dialog-content">
        <!-- <div class="tab-row flex border-b border-slate-100 shrink-0">
          <button @click="setActivePermType('Depts')"
            :class="['flex-1 py-3 text-xs font-bold transition-colors', activePermType === 'Depts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50']">组织部门</button>
          <button @click="setActivePermType('Positions')"
            :class="['flex-1 py-3 text-xs font-bold transition-colors', activePermType === 'Positions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50']">特定岗位</button>
          <button @click="setActivePermType('UserGroups')"
            :class="['flex-1 py-3 text-xs font-bold transition-colors', activePermType === 'UserGroups' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50']">特定用户组</button>
        </div> -->
        <el-tabs v-model="activePermType" class="demo-tabs" @tab-change="activePermTypeChange">
          <el-tab-pane label="组织部门" name="Depts"></el-tab-pane>
          <el-tab-pane label="特定岗位" name="Positions"></el-tab-pane>
          <el-tab-pane label="特定用户组" name="UserGroups"></el-tab-pane>
        </el-tabs>

        <!-- <div class="p-3 border-b border-slate-100 shrink-0 bg-slate-50">
          <div class="relative">
            <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              :placeholder="`搜索${activePermType === 'Depts' ? '组织部门' : activePermType === 'Positions' ? '特定岗位' : '特定用户组'}...`"
              class="pl-9 h-9 text-xs border-slate-200 bg-white" v-model="permSearchKeyword" />
          </div>
        </div> -->

        <div class="search-area">
          <el-input v-model="permSearchKeyword" clearable :suffix-icon="Search" class="mp__search-input small"
            :placeholder="`搜索${activePermType === 'Depts' ? '组织部门' : activePermType === 'Positions' ? '特定岗位' : '特定用户组'}...`" />
        </div>

        <div class="list-area">
          <div v-if="activePermType === 'Depts'" class="list-view dept-view">
            <DeptCheckTree ref="deptTreeRef" :data="deptTreeData" :props="deptTreeProps" @sub="handleDeptTreeSubClick"
              @item="handleDeptTreeItemClick" @check="handleDeptTreeCheckClick" node-key="deptId" size="big" />
          </div>
          <div v-else class="list-view grid-view grid grid-cols-2 sm:grid-cols-3">
            <el-tooltip v-for="d in rowList" :key="d.id || d.postId" :content="d.groupName || d.postName"
              popper-class="tooltip-short">
              <button @click="handleToggle(d)" class="list-item" :class="[d.checked ? 'checked' : '']">{{
                d.groupName || d.postName }}</button>
            </el-tooltip>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <btn type="primary" @click="close">确认</btn>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
@use "../../../assets/styles/dialog.scss";

.mp__search-input {
  width: 100%;
}

.list-area {
  margin-top: 20px;
  background: rgba(235, 243, 245, 0.6);
  border-radius: 16px 16px 16px 16px;
  height: 262px;
  padding: 20px 10px 20px 20px;
}

.list-view {
  padding-right: 4px;
  height: 222px;
  overflow-y: auto;
}

.grid-view {
  gap: 16px;
}

.list-item {
  // width: 216px;
  height: 36px;
  background: #FFFFFF;
  border-radius: 12px 12px 12px 12px;
  border: 1px solid #E1E6EC;
  box-sizing: border-box;
  line-height: 34px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  font-weight: 400;
  font-size: 14px;
  color: #2B2F33;
  padding: 0 12px;
  cursor: pointer;

  &:hover {
    border: 1px solid #7EBEC4;
  }

  &.checked {
    background: #EBF3F5;
    border: 1px solid #7EBEC4;
    color: #3297A0;
    font-weight: bold;
  }
}

.dept-tree {
  :deep(.el-tree-node__content) {
    border-bottom: 1px solid #E1E6EC;
    box-sizing: border-box;
  }
}
</style>
