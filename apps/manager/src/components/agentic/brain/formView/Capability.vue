<template>
  <Card class="form-view p-6 border-slate-200">
    <div class="flex items-center justify-between mb-6">
      <h2 class="form-title text-lg font-medium text-slate-800 font-sans">已引用的能力</h2>
      <!-- <Button variant="outline" size="sm"
        class="h-8 shadow-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold"
        @click="context.showCapabilityModal = true">
        <Plus class="w-3.5 h-3.5 mr-1" /> 引入能力 (Skill/工作流)
      </Button> -->
      <btn type="success" :disabled="context.isBase && !context.editing" @click="context.showCapabilityModal = true"
        round>
        <Plus class="w-3.5 h-3.5 mr-1" />引入能力 (Skill)
      </btn>
    </div>
    <div class="space-y-4">
      <div v-for="item in formData.list" :key="item.id" class="list-row">
        <div class="list-item-main">
          <div class="list-icon">
            <!-- {{ getTypeLabel(item.entryMethod) }} -->
            <svg-icon icon-class="mp-skill" />
          </div>
          <div class="list-item-texts">
            <div class="list-item-text-0 truncate">{{ item.name }}</div>
            <div class="list-item-text-1 truncate">{{ item.description }}</div>
          </div>
        </div>
        <!-- <Button variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50 font-bold"
          @click="handleDelete(item)">取消挂载</Button> -->
        <el-button class="cancel-btn" @click="handleDelete(item)">取消挂载</el-button>
      </div>
    </div>
    <div v-hasPermi="['agentic:brain:edit']" class="mt-4 text-right">
      <btn type="primary" :disabled="!context.editing" :loading="context.saveing" @click="submitForm" round>保存</btn>
    </div>
  </Card>
  <CapabilityDialog />
</template>
<script setup lang="ts">
import {
  Save, Plus, Clock, Zap, Search, Bot, Database, Calendar, List, ChevronLeft, ChevronRight, Shield, User, BookOpen, Wrench, Trash, ArrowLeft
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
// import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CapabilityDialog from './CapabilityDialog.vue'
// import { addAgent } from '@/lib/agent-store'
import {
  updateBusinessAgentBrainSkillApi
} from '@/api/agentic/agentBrain'
import { updateBaseAgentBrainSkillApi } from '@/api/agentic/baseAgentBrain.js'
import type { AgentBrainSaveSkill, AgentBrainSkillItem, AjaxResult } from '@/types'

const context = inject('agentFormContext')
const formData = computed(() => context.capability);

const handleDelete = (item: any) => {
  formData.value.list = formData.value.list.filter((i: any) => i !== item)
}

const getTypeLabel = (type: number) => {
  return 'Skill'
  // if (type === 1) {
  //   return '本地ZIP资源包'
  // }
  // if (type === 2) {
  //   return '远端代码仓库直连'
  // }
  // return '未知'
}
const submitForm = () => {
  if (!context.editing) return
  const apiService = context.isBase ? updateBaseAgentBrainSkillApi : updateBusinessAgentBrainSkillApi
  const params: AgentBrainSaveSkill = {
    id: context.id!,
    skillIds: formData.value.list?.map((item: AgentBrainSkillItem) => item.id!) || [],
  }
  context.saveing = true
  apiService(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      ElMessage({
        message: '保存成功',
        type: 'success'
      });
      context.applyCapability()
      context.cancelEditingIfBase()
    }
  }).finally(() => {
    context.saveing = false
  })
}


</script>
<style scoped lang="scss">
@use './form.scss';

.el-checkbox {
  white-space: break-spaces;
}
</style>
