<script setup lang="ts">
// import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
// import {
//   Save, Plus, Clock, Zap, Search, Bot, Database, Calendar, List, ChevronLeft, ChevronRight, Shield, User, BookOpen, Wrench, Trash, ArrowLeft
// } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
// import Input from '@/components/ui/Input.vue'
// import Button from '@/components/ui/Button.vue'
// import Card from '@/components/ui/Card.vue'
// import Dialog from '@/components/ui/Dialog.vue'
// import DialogContent from '@/components/ui/DialogContent.vue'
// import DomainSelect from '@/components/common/DomainSelect.vue'
// import { addAgent } from '@/lib/agent-store'

import SubPageHeader from '@/components/page/SubPageHeader.vue'

import {
  addBusinessAgentBrainApi,
  getBusinessAgentBrainApi,
} from '@/api/agentic/agentBrain'
import {
  getBaseAgentBrainApi,
} from '@/api/agentic/baseAgentBrain'

import { allCategoryId, businessCategoryId } from '@/service/domainService'

import type {
  BusinessAgentBrainSaveParams,
  // BaseAgentBrainSaveParams,
  AgentBrainEntity,
  AgentBrainPersona,
  AgentBrainModel,
  KnowledgeLibEntity,
  AgentBrainDataSourceItem,
  AgentBrainToolItem,
  AgentBrainSkillItem,
  AgentBrainTaskItem,
  AgentBrainAuthItem
} from '@/types'
import Persona from './formView/Persona.vue'
import Model from './formView/Model.vue'
import Knowledge from './formView/Knowledge.vue'
import DataAccess from './formView/DataAccess.vue'
import Tool from './formView/Tool.vue'
import Capability from './formView/Capability.vue'
import Permission from './formView/Permission.vue'
import Task from './formView/Task.vue'

import { AuthTypes } from '@/api/knowledgeLib/knowledgeAuth'

interface Props {
  isBase?: boolean
  id?: number
  domain?: number
}

const props = withDefaults(defineProps<Props>(), {
  isBase: false,
})

const router = useRouter()

type TabKey = 'persona' | 'model' | 'knowledge' | 'data' | 'tool' | 'capability' | 'task' | 'permission'

const activeTab = ref<TabKey>(props.isBase ? 'model' : 'persona')

// tab启用的最小索引
const enableTabMinIndex = ref(0);
const tabs = computed(() => {
  if (props.isBase) {
    return [
      { id: 'model' as TabKey, label: '模型', icon: 'mp-model' },
      { id: 'knowledge' as TabKey, label: '知识', icon: 'mp-knowledge' },
      // { id: 'data' as TabKey, label: '数据访问', icon: 'mp-db' },
      // { id: 'tool' as TabKey, label: '工具', icon: 'mp-tool' },
      { id: 'capability' as TabKey, label: '能力', icon: 'mp-skill' },
    ]
  } else {
    return [
      { id: 'persona' as TabKey, label: '人设', icon: 'mp-persona' },
      { id: 'model' as TabKey, label: '模型', icon: 'mp-model' },
      { id: 'knowledge' as TabKey, label: '知识', icon: 'mp-knowledge' },
      // { id: 'data' as TabKey, label: '数据访问', icon: 'mp-db' },
      // { id: 'tool' as TabKey, label: '工具', icon: 'mp-tool' },
      { id: 'capability' as TabKey, label: '能力', icon: 'mp-skill' },
      { id: 'task' as TabKey, label: '任务', icon: 'mp-task' },
      { id: 'permission' as TabKey, label: '权限', icon: 'mp-auth' },
    ]
  }
})

const buildTask = (taskList: AgentBrainTaskItem[]) => {
  // const taskList = [
  //   { id: 1, taskName: '每日员工生日提醒', execType: 0, content: '每天 18:00 自动调取"ERP 查询分析大脑"获取近一周过生日员工，并通过智能体端推送到业务群。', startDate: '2024-01-01', endDate: '2024-12-31', repeatPeriod: 0, repeatTime: '2' },
  //   { id: 2, taskName: '员工离职审批面谈派发', execType: 1, content: "监听 OA 系统的 'hr.resign' 事件，自动抽取内容交由分析规则判定异常，推待办通知所在部门主管。", startDate: '2024-01-01', endDate: '2024-12-31', repeatPeriod: 0, repeatTime: '3' },
  // ] as AgentBrainTaskItem[]
  return {
    taskViewMode: 'calendar',
    list: taskList,
    isAdd: false,
    taskItem: {} as AgentBrainTaskItem,
    showTaskModal: false,
  }
}

const agentFormContext = reactive({
  id: undefined,
  data: null as AgentBrainEntity | null, // 原始数据
  // 显示数据
  persona: {
    name: '',
    categoryId: allCategoryId,
    description: '',
    prompt: '',
    welcomeMessage: '',
  } as AgentBrainPersona,
  model: {
    defaultChatMode: undefined,
    fastModelId: undefined,
    slowModelId: undefined,
    memoryFlag: 0,
    fastModel: undefined,
    slowModel: undefined,
    models: [],
    // modelIds: [],
    // modelList: []
  } as AgentBrainModel,
  knowledge: {
    list: [
      { id: 1, name: '新媒体知识库', knowledgeType: 0, categoryName: '行政管理制度及SOP规范文档汇编.pdf', description: '已向量化：5,230 词嵌入 • 运行在 text-embedding-004' },
      { id: 2, name: '新媒体知识库', knowledgeType: 1, categoryName: '行政管理制度及SOP规范文档汇编.pdf', description: '已向量化：5,230 词嵌入 • 运行在 text-embedding-004' },
    ] as KnowledgeLibEntity[]
  },
  dataAccess: {
    list: [
      {
        id: 1, name: 'ERP 核心业务从库实时视图', dsType: 1, description: '关系型数据只读能力授权，Agent可自主通过 SQL/RAG 查询',
        // tables: [{name:'hr_employees'}, {name:'property_inspections'}, {name:'finance_invoices'}]
      },
    ] as AgentBrainDataSourceItem[],
    activeInfo: null,
  },
  tool: {
    list: [
      { id: 1, name: 'OA 系统标准审批与查阅', toolType: 0, description: '调用: [{"{\"action\": \"approve\"}"}] • 访问 OA Open API' },
    ] as AgentBrainToolItem[],
  },
  capability: {
    list: [
      { id: 1, name: 'OA 系统标准审批与查阅', description: '调用: [{"{\"action\": \"approve\"}"}] • 访问 OA Open API' },
    ] as AgentBrainSkillItem[],
  },
  task: buildTask([
    { id: 1, taskName: '每日员工生日提醒', execType: 0, content: '每天 18:00 自动调取"ERP 查询分析大脑"获取近一周过生日员工，并通过智能体端推送到业务群。', startDate: '2024-01-01', endDate: '2024-12-31', repeatPeriod: 0, repeatTime: '2' },
    { id: 2, taskName: '员工离职审批面谈派发', execType: 1, content: "监听 OA 系统的 'hr.resign' 事件，自动抽取内容交由分析规则判定异常，推待办通知所在部门主管。", startDate: '2024-01-01', endDate: '2024-12-31', repeatPeriod: 0, repeatTime: '3' },
  ]),
  permission: {
    deptList: [],
    positionList: [],
    groupList: [],
    // allList: [
    //   { id: 1, authType: 0, authId: 1001, },
    //   { id: 2, authType: 1, authId: 1002, },
    // ] as AgentBrainAuthItem[],
  },

  saveing: false,
  editing: !props.isBase,
  isBase: props.isBase,
  showModelModal: false,

  showKbModal: false,

  showDataModal: false,
  showDataPreviewModal: false,

  showToolModal: false,

  showCapabilityModal: false,

  showTaskModal: false,
})
provide('agentFormContext', agentFormContext)
agentFormContext.dataAccess_setActiveInfo = (table: string, item: any) => {
  agentFormContext.dataAccess.activeInfo = {
    table: table,
    item: item,
  }
  agentFormContext.showDataPreviewModal = true
}
agentFormContext.applyPersona = () => {
  const entity: AgentBrainEntity = agentFormContext.data!
  Object.assign(entity, agentFormContext.persona)
  goNextAddTab('persona')
}
agentFormContext.applyModel = () => {
  Object.assign(agentFormContext.data, agentFormContext.model)
  goNextAddTab('model')
}
agentFormContext.applyKnowledge = () => {
  const entity: AgentBrainEntity = agentFormContext.data!
  entity.knowledges = agentFormContext.knowledge.list
  goNextAddTab('knowledge')
}
// 取消数据访问Tab
agentFormContext.applyDataAccess = () => {
  const entity: AgentBrainEntity = agentFormContext.data!
  entity.datasources = agentFormContext.dataAccess.list
  goNextAddTab('data')
}
// 取消工具Tab
agentFormContext.applyTool = () => {
  const entity: AgentBrainEntity = agentFormContext.data!
  entity.tools = agentFormContext.tool.list
  goNextAddTab('tool')
}
agentFormContext.applyCapability = () => {
  const entity: AgentBrainEntity = agentFormContext.data!
  entity.skills = agentFormContext.capability.list
  if (agentFormContext.isBase) {
    return
  }
  goNextAddTab('capability')
}
agentFormContext.applyTask = () => {
  // const entity: AgentBrainEntity = agentFormContext.data!
  // entity.tasks = agentFormContext.task.list
  if (agentFormContext.isBase) {
    return
  }
  goNextAddTab('task')
}
agentFormContext.applyPermission = () => {
  const entity: AgentBrainEntity = agentFormContext.data!
  const auths: AgentBrainAuthItem[] = [
    ...agentFormContext.permission.deptList,
    ...agentFormContext.permission.positionList,
    ...agentFormContext.permission.groupList
  ];
  entity.auths = auths || []
  if (agentFormContext.isBase) {
    return
  }
  goNextAddTab('permission')
}
agentFormContext.cancelEditingIfBase = () => {
  if (agentFormContext.isBase) {
    agentFormContext.editing = false
  }
}
const goNextAddTab = (curTab: TabKey) => {
  const nextIndex = tabs.value.findIndex((tab: any) => tab.id === curTab) + 1
  if (nextIndex < tabs.value.length) {
    if (enableTabMinIndex.value < nextIndex) {
      enableTabMinIndex.value = nextIndex;
      activeTab.value = tabs.value[nextIndex].id
    }
  }
}

const isBaseEditing = computed(() => agentFormContext.isBase && agentFormContext.editing)

const handleSaveBase = () => { }
const handleSaveBusiness = () => {
  const persona = agentFormContext.persona
  if (!persona.name.trim()) {
    ElMessage.warning('请输入智能体名称')
    return
  }
  const params: BusinessAgentBrainSaveParams = {
    ...persona,

    // defaultChatMode: number // 默认对话模式: 1-即时响应 2-深度思考与推理
    // fastModel?: string // 即时响应大模型
    // slowModel?: string // 深度思考与推理大模型
    // memoryFlag?: number // 开启长期记忆标识: 0-不开启 1-开启
    // domain: props.isBase ? 'base' : (domain.value || 'business'),
    // status: '已发布',
    // mode: mode.value,
    // model: model.value,
    // brainType: props.isBase ? 'base' : 'business',
  };
  addBusinessAgentBrainApi(params).then((res) => {
    if (res.code === 200) {
      if (!props.isBase) {
        router.back()
      } else {
        ElMessage.success('基础半脑配置已保存生效！')
      }
    }
  })
}
const handleSave = () => {
  if (props.isBase) {
    handleSaveBase()
  } else {
    handleSaveBusiness()
  }
}
const cancelEdit = () => {
  agentFormContext.editing = false
  initTabForms()
}

const initTabForms = () => {
  const data: AgentBrainEntity = agentFormContext.data
  agentFormContext.persona = {
    name: data.name || '',
    categoryId: data.categoryId || allCategoryId,
    description: data.description || '',
    prompt: data.prompt || '',
    welcomeMessage: data.welcomeMessage || '',
  }
  agentFormContext.model = {
    defaultChatMode: data.defaultChatMode,
    fastModelId: data.fastModelId,
    slowModelId: data.slowModelId,
    memoryFlag: data.memoryFlag || 0,
    fastModel: data.fastModel,
    slowModel: data.slowModel,
    models: data.models || [],
  } as AgentBrainModel
  agentFormContext.knowledge = {
    list: data.knowledges || [],
  }
  agentFormContext.dataAccess = {
    list: data.datasources || [],
  }
  agentFormContext.tool = {
    list: data.tools || [],
  }
  agentFormContext.capability = {
    list: data.skills || [],
  }
  agentFormContext.task = buildTask(data.tasks || [])
  const authList = data.auths || []
  const deptList: AgentBrainAuthItem[] = [];
  const positionList: AgentBrainAuthItem[] = [];
  const groupList: AgentBrainAuthItem[] = [];
  authList.forEach((item) => {
    if (item.authType === AuthTypes.DEPT) {
      deptList.push(item)
    } else if (item.authType === AuthTypes.POST) {
      positionList.push(item)
    } else if (item.authType === AuthTypes.USERGROUP) {
      groupList.push(item)
    }
  })
  agentFormContext.permission = {
    // allList: authList,
    deptList: deptList as AgentBrainAuthItem[],
    positionList: positionList as AgentBrainAuthItem[],
    groupList: groupList as AgentBrainAuthItem[],
  }
}
const initByData = (data: AgentBrainEntity) => {
  // agentFormContext.baseAgentBrain = {...data}
  agentFormContext.data = data
  initTabForms()
}
// 新建业务半脑
const preAdd = (domain: number) => {
  initByData({
    categoryId: domain > businessCategoryId ? domain : undefined,
  } as AgentBrainEntity)
}
// const preEdit = (data: AgentBrainEntity) => {
//   agentFormContext.businessAgentBrain = data
// }

watch(
  () => [props.id, props.isBase],
  (newVal: any[]) => {
    if (newVal[1]) {
      enableTabMinIndex.value = tabs.value.length
      getBaseAgentBrainApi().then((res) => {
        agentFormContext.id = res.data!.id
        initByData(res.data!)
      })
    } else {
      if (props.id) {
        enableTabMinIndex.value = tabs.value.length
        getBusinessAgentBrainApi(props.id).then((res) => {
          agentFormContext.id = res.data!.id || props.id
          initByData(res.data!)
        })
      } else {
        enableTabMinIndex.value = 0
        agentFormContext.id = undefined
        if (props.domain) {
          preAdd(+props.domain)
        }
      }
    }
  }, { immediate: true }
)
</script>

<template>
  <div class="agent-form h-full flex flex-col default-bg">
    <SubPageHeader @back="handleBack" :back="!props.isBase"
      :title="props.isBase ? '基础半脑配置' : (agentFormContext.id ? '编辑业务半脑' : '新建业务半脑')"
      :desc="props.isBase ? '基础半脑配置将在所有智能体中生效' : '配置智能体大脑的思考模式、模型及可调用的工具与知识资源'">
      <template v-if="props.isBase">
        <btn v-if="agentFormContext.editing" type="success" @click="cancelEdit" round>取消配置</btn>
        <btn v-else type="success" @click="agentFormContext.editing = true" round>编辑基础半脑</btn>
      </template>
      <template v-else>
        <btn @click="router.back()">取消</btn>
      </template>
    </SubPageHeader>
    <div class="top-space"></div>
    <div class="flex-1 flex min-h-0">
      <div style="width: 130px;"></div>
      <div class="tab-btns w-48 border-r border-slate-200 flex flex-col p-4 space-y-2 shrink-0">
        <button v-for="(tab, index) in tabs" :key="tab.id" :disabled="index > enableTabMinIndex || isBaseEditing"
          :class="[
            'flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all',
            (index > enableTabMinIndex || isBaseEditing) ? 'cursor-not-allowed' : 'cursor-pointer',
            activeTab === tab.id
              ? 'active-btn'
              : 'normal-btn',
          ]" @click="activeTab = tab.id">
          <!-- <component :is="tab.icon" class="w-5 h-5" /> -->
          <svg-icon :icon-class="tab.icon" class="btn-icon" />
          <span class="text-sm font-medium">{{ tab.label }}</span>
        </button>
      </div>

      <div class="agent-form-right flex-1 overflow-y-auto">
        <fieldset :disabled="!agentFormContext.editing"
          class="agent-form-fieldset max-w-5xl space-y-6 border-0 p-0 m-0 min-w-0 w-full">
          <Persona v-if="activeTab === 'persona'" />

          <Model v-if="activeTab === 'model'" />

          <Knowledge v-if="activeTab === 'knowledge'" />

          <DataAccess v-if="activeTab === 'data'" />

          <Tool v-if="activeTab === 'tool'" />

          <Permission v-if="activeTab === 'permission'" />

          <Task v-if="activeTab === 'task'" />

          <Capability v-if="activeTab === 'capability'" />
        </fieldset>
      </div>
    </div>
    <div class="bottom-space"></div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-input) {
  --el-date-editor-width: 100%;
}

.cancel-btn {
  border-radius: 20px;
  background-color: #fff;
}

.top-space {
  height: 20px;
}

.bottom-space {
  height: 20px;
}


.page-title {
  font-weight: bold;
  font-size: 20px;
  color: #2B2F33;
}

.page-title-desc {
  font-size: 14px;
  color: #77838F;
  line-height: 20px;
}

.tab-btns {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  width: 200px;

  button {
    border: none;

    &:not([disabled]) {
      cursor: pointer;

      &:hover {
        background: #c5e4eb;
        color: var(--el-color-primary);
      }
    }
  }

  .active-btn {
    color: var(--el-color-primary);
    background: #EBF3F5;
    font-weight: bold;
    font-size: 14px;
  }
}

.agent-form-right {
  margin-left: 20px;
}

.agent-form-fieldset {
  background-color: #fff;
  border-radius: 24px;

  :deep(.form-view) {
    border-radius: 24px;
  }
}

.btn-icon {
  width: 24px;
  height: 24px;
}
</style>