<template>
  <Card class="form-view p-6 border-slate-200">
    <div class="flex items-center justify-between mb-6">
      <h2 class="form-title text-lg font-medium text-slate-800 font-sans">已挂载的工具</h2>
    </div>
    <div class="space-y-6">
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-slate-700">关联文档与FAQ知识库</label>
          <!-- <Button variant="outline" size="sm"
            class="h-8 shadow-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            @click="context.showToolModal = true">
            <Plus class="w-3.5 h-3.5 mr-1" /> 挂载工具
          </Button> -->
          <btn type="success" @click="context.showToolModal = true" round>
            <Plus class="w-3.5 h-3.5 mr-1" /> 挂载工具
          </btn>
        </div>
        <div class="space-y-3">
          <div v-for="item in formData.list" :key="item.id"
            class="p-4 border rounded-lg bg-white flex items-center justify-between shadow-sm">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                {{ getToolType(item.toolType) }}</div>
              <div>
                <div class="text-sm font-medium text-slate-800">{{ item.name }}</div>
                <div class="text-xs text-slate-400 font-mono">{{ item.description }}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50"
              @click="handleDelete(item)">取消关联</Button>
            <!-- <el-button type="danger" @click="handleDelete(item)">取消关联</el-button> -->
          </div>
        </div>
      </div>
    </div>
    <div v-hasPermi="['agentic:brain:edit']" class="mt-4 text-right">
      <btn type="primary" :disabled="!context.editing" :loading="context.saveing" @click="submitForm" round>保存</btn>
    </div>
  </Card>
  <ToolDialog />
</template>
<script setup lang="ts">
import {
  Save, Plus, Clock, Zap, Search, Bot, Database, Calendar, List, ChevronLeft, ChevronRight, Shield, User, BookOpen, Wrench, Trash, ArrowLeft
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import ToolDialog from './ToolDialog.vue'
// import { addAgent } from '@/lib/agent-store'

import type { AgentBrainSaveTool, AgentBrainToolItem, AjaxResult } from '@/types'
import {
  updateBusinessAgentBrainToolApi
} from '@/api/agentic/agentBrain'
import { updateBaseAgentBrainToolApi } from '@/api/agentic/baseAgentBrain.js'

const context = inject('agentFormContext')
const formData = computed(() => context.tool);

const handleDelete = (item: AgentBrainToolItem) => {
  formData.value.list = formData.value.list.filter((i: AgentBrainToolItem) => i !== item)
}
const getToolType = (type: number) => {
  switch (type) {
    case 1:
      return 'MCP'
    default:
      return '未知'
  }
}

const submitForm = () => {
  if (!context.editing) return
  const apiService = context.isBase ? updateBaseAgentBrainToolApi : updateBusinessAgentBrainToolApi
  const params: AgentBrainSaveTool = {
    id: context.id!,
    toolIds: formData.value.list?.map((item: AgentBrainToolItem) => item.id!) || [],
  }
  context.saveing = true
  apiService(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      ElMessage({
        message: '保存成功',
        type: 'success'
      });
      context.applyTool()
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
