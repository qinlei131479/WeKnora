<template>
  <div class="space-y-6">
    <Card class="form-view p-6 border-slate-200">
      <h2 class="form-title text-lg font-medium text-slate-800 mb-6">
        {{ context.isBase ? '对话与推理业务半脑备用模型' : '对话与推理' }}
        <span v-if="context.isBase" class="base-sub-title">（当业务半脑模型不可使用时，此处模型作为备用）</span>
      </h2>
      <el-form :model="formData" :rules="rules" ref="modelFormRef" label-width="120px" label-position="top">
        <div class="space-y-4">
          <div class="grid gap-4 grid-cols-1">
            <el-form-item prop="defaultChatMode" label="默认对话模式">
              <el-select-v2 v-model="formData.defaultChatMode" :options="modeOptions" clearable />
            </el-form-item>
            <el-form-item prop="fastModelId" label="即时响应大模型">
              <el-select-v2 v-model="formData.fastModelId" :options="instantModelOptions" :props="modelProps"
                clearable />
            </el-form-item>
            <el-form-item prop="slowModelId" label="深度思考大模型">
              <el-select-v2 v-model="formData.slowModelId" :options="modelOptions" :props="modelProps" clearable />
            </el-form-item>
          </div>
          <el-form-item v-if="!context.isBase" prop="memoryFlag">
            <el-checkbox v-model="formData.memoryFlag" class="memory-flag" :true-value="1" :false-value="0"
              label="开启长期记忆" />
            <div class="memory-flag-tip">
              开启后，固定重复的会话内容将被缓存至记忆库。后续调用大模型仅需传递对话摘要，无需传输完整历史，可同时实现 token 消耗降低与推理准确性提升。
            </div>
          </el-form-item>
        </div>
      </el-form>
      <div v-hasPermi="['agentic:brain:edit']" class="mt-4 text-right">
        <btn type="primary" :disabled="!context.editing" :loading="context.saveing" @click="submitForm" round>保存</btn>
      </div>
    </Card>

    <!-- <Card class="p-6 border-slate-200">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-medium text-slate-800">{{ context.isBase ? '模型' : '其它模型' }}</h2>
          <p class="text-xs text-slate-500 mt-1">{{ context.isBase ?
            '关联模型仓内的底层通用能力模型，让基础半脑具备处理底层事务和跨模态解析能力（如文本向量化、通用光学字符识别等）。' :
            '关联模型仓内的定制化垂类模型，让智能体具备视觉、语音或特定业务场景解析能力（如简历提取、发票识别）。' }}</p>
        </div>
        <Button :disabled="context.editing" variant="outline" size="sm" class="h-8 shadow-sm" @click="showModelModal(true)">
          <Plus class="w-3.5 h-3.5 mr-1" /> {{ context.isBase ? '引入模型' : '引入业务模型' }}
        </Button>
      </div>
      <div v-if="formData.models?.length > 0" class="grid grid-cols-2 gap-4 max-h-[400px] overflow-auto">
        <div v-for="m in formData.models" :key="m.id"
          class="p-4 border rounded-lg bg-white flex items-center justify-between shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
              <Bot class="w-4 h-4" />
            </div>
            <div class="text-sm font-medium text-slate-800">{{ m.name }}</div>
          </div>
          <Button v-if="context.editing" variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50" @click="handleDeleteModel(m)">
            <Trash class="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div v-else
        class="p-4 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 flex flex-col items-center justify-center py-8 text-slate-500">
        <Bot class="w-10 h-10 text-slate-300 mb-2" />
        <p class="text-sm font-medium text-slate-600">暂无关联的拓展模型</p>
        <p class="text-xs text-slate-400">点击右上角按钮从"模型仓"引入</p>
      </div>
      <div class="mt-4 text-right">
        <el-button type="primary"
          :disabled="!context.editing"
          :loading="context.saveing"
          @click="submitForm">保存</el-button>
      </div>
    </Card> -->
  </div>
  <ModelDialog />
</template>
<script setup lang="ts">
import {
  Save, Plus, Clock, Zap, Search, Bot, Database, Calendar, List, ChevronLeft, ChevronRight, Shield, User, BookOpen, Wrench, Trash, ArrowLeft
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import Card from '@/components/ui/Card.vue'
import ModelDialog from './ModelDialog.vue'
import {
  updateBusinessAgentBrainModelApi
} from '@/api/agentic/agentBrain'

import { agiModel } from '@/api/resources/model'

import type { AgentBrainModel, AgentBrainModelItem, AgentBrainSaveModel, AjaxResult, ModelVO } from '@/types'
import { updateBaseAgentBrainModelApi } from '@/api/agentic/baseAgentBrain.js'

const modelProps = {
  label: 'name',
  value: 'id',
}

const emit = defineEmits(['success'])
const context = inject('agentFormContext')
// const formData: AgentBrainModel = context.model as AgentBrainModel;
const formData = computed(() => context.model as AgentBrainModel)

const showModelModal = (val: boolean) => {
  context.showModelModal = val
}

const rules = reactive({
  defaultChatMode: [{ required: false, message: '请选择默认对话模式', trigger: 'change' }],
  fastModelId: [{ required: true, message: '请选择即时响应大模型', trigger: 'change' }],
  slowModelId: [{ required: false, message: '请选择深度思考大模型', trigger: 'change' }],
  memoryFlag: [{ required: false, message: '请选择开启长期记忆', trigger: 'change' }]
})

const modeOptions = [
  { label: '即时响应', value: 1 },
  { label: '深度思考与推理', value: 2 },
]
const instantModelOptions = ref<ModelVO[]>([
  // { id: 1, name: 'gemini-1.5-pro' },
  // { id: 2, name: 'gpt-4o' },
  // { id: 3, name: 'claude-3.5-sonnet' },
])
const modelOptions = ref<ModelVO[]>([
  // { id: 1, name: 'deepseek-r1' },
  // { id: 2, name: 'o3-mini' },
  // { id: 3, name: 'qwen-max' },
])

const handleDeleteModel = (m: AgentBrainModelItem) => {
  formData.value.models = formData.value.models?.filter((item: AgentBrainModelItem) => item !== m)
}
// const handleUpdateModels = (items: ModelVO[]) => {
//   formData.value.models = items.map((item) => ({
//     id: item.id!,
//     name: item.name!,
//   }))
// }



const submitForm = () => {
  if (!context.editing) return
  if (context.isBase) {
    doSubmitBase()
  } else {
    doSubmitBusiness()
  }
}
const doSubmitBase = () => {
  const formDataValue = formData.value;
  const params: AgentBrainSaveModel = {
    defaultChatMode: formDataValue.defaultChatMode,
    fastModelId: formDataValue.fastModelId,
    slowModelId: formDataValue.slowModelId,
    memoryFlag: formDataValue.memoryFlag,
    id: context.id!,
    modelIds: formDataValue.models?.map((item: AgentBrainModelItem) => item.id!) || [],
  }
  context.saveing = true
  updateBaseAgentBrainModelApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      ElMessage({
        message: '保存成功',
        type: 'success'
      });
      // emit('success')
      context.applyModel()
      context.cancelEditingIfBase()
    }
  }).finally(() => {
    context.saveing = false
  })
}

const doSubmitBusiness = () => {
  const formDataValue = formData.value;
  const params: AgentBrainSaveModel = {
    defaultChatMode: formDataValue.defaultChatMode,
    fastModelId: formDataValue.fastModelId,
    slowModelId: formDataValue.slowModelId,
    memoryFlag: formDataValue.memoryFlag,
    id: context.id!,
    modelIds: formDataValue.models?.map((item: AgentBrainModelItem) => item.id!) || [],
  }
  context.saveing = true
  updateBusinessAgentBrainModelApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      ElMessage({
        message: '保存成功',
        type: 'success'
      });
      // emit('success')
      context.applyModel()
      context.cancelEditingIfBase()
    }
  }).finally(() => {
    context.saveing = false
  })
}

const loadModelOptions = () => {
  agiModel.list({
    status: 1, // 状态: 0-部署中 1-上线 2-下线
    modelType: 1 // 大语言模型
  }, {
    pageNum: 1,
    pageSize: 9999,
  }).then((res) => {
    if (res.code === 200) {
      modelOptions.value = res.rows || []
      instantModelOptions.value = (res.rows || []).map((item) => ({
        id: item.id!,
        name: item.name!,
      }))
    }
  })
}
// if (!context.isBase) {
loadModelOptions();
// }
</script>
<style scoped lang="scss">
@use './form.scss';

.el-checkbox {
  white-space: break-spaces;
}

.base-sub-title {
  font-size: 13px;
  color: var(--color-slate-500);
}

.memory-flag {
  font-weight: bold;
}

.memory-flag-tip {
  font-size: 14px;
  color: #B0BAC6;
}
</style>
