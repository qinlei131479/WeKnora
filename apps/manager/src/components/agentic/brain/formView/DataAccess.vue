<template>
  <Card class="form-view p-6 border-slate-200">
    <div class="flex items-center justify-between mb-6">
      <h2 class="form-title text-lg font-medium text-slate-800 font-sans">结构化与多模态数据访问</h2>
    </div>
    <div class="space-y-6">
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-slate-700">关联环境数据与多源接入 (Data Source)</label>
          <!-- <Button variant="outline" size="sm" class="h-8 shadow-sm" @click="context.showDataModal = true">
            <Plus class="w-3.5 h-3.5 mr-1" /> 引入接入数据源
          </Button> -->
          <btn type="primary" @click="context.showDataModal = true" round>
            <Plus class="w-3.5 h-3.5 mr-1" /> 引入接入数据源
          </btn>
        </div>
        <div class="space-y-3 max-h-[400px] overflow-auto">
          <div v-for="item in formData.list" :key="item.id"
            class="p-4 border rounded-lg bg-white shadow-sm hover:border-indigo-300 transition-colors">
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-8 h-8 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {{ getDataSourceType(item.dsType) }}</div>
              <div>
                <div class="text-sm font-medium text-slate-800">{{ item.name }}</div>
                <div class="text-xs text-slate-400">{{ item.description }}</div>
              </div>
              <div class="ml-auto">
                <Button variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50" @click="handleDelete(item)">
                  <Trash class="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div class="pl-11 space-y-2 text-sm text-slate-600">
              <div v-for="table in item.tables" :key="table.name"
                class="flex items-center justify-between p-2 hover:bg-slate-50 rounded group cursor-pointer"
                @click="context.dataAccess_setActiveInfo(table, item)">
                <div class="flex items-center gap-2">
                  <Database class="w-4 h-4 text-slate-400" /> {{ table.name }}
                </div>
                <Button variant="ghost" size="sm"
                  class="h-6 px-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100"
                  @click.stop="context.dataAccess_setActiveInfo(table, item)">预览数据</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-hasPermi="['agentic:brain:edit']" class="mt-4 text-right">
      <btn type="primary" :disabled="!context.editing" :loading="context.saveing" @click="submitForm" round>保存</btn>
    </div>
  </Card>
  <DataAccessDialog />
  <DataPreviewDialog />
</template>
<script setup lang="ts">
import {
  Save, Plus, Clock, Zap, Search, Bot, Database, Calendar, List, ChevronLeft, ChevronRight, Shield, User, BookOpen, Wrench, Trash, ArrowLeft
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import DataAccessDialog from './DataAccessDialog.vue'
import DataPreviewDialog from './DataPreviewDialog.vue'
// import { addAgent } from '@/lib/agent-store'

import {
  updateBusinessAgentBrainDsApi
} from '@/api/agentic/agentBrain'
import { updateBaseAgentBrainDsApi } from '@/api/agentic/baseAgentBrain.js'
import type { AgentBrainDataSourceItem, AgentBrainSaveDataSource, AjaxResult } from '@/types'

const context = inject('agentFormContext')
const formData = computed(() => context.dataAccess);

const handleDelete = (item: AgentBrainDataSourceItem) => {
  formData.value.list = formData.value.list.filter((i: AgentBrainDataSourceItem) => i !== item)
}

const getDataSourceType = (type: number) => {
  switch (type) {
    case 1:
      return 'M'
    case 2:
      return 'P'
    // case 3:
    //   return 'API'
    default:
      return '未知'
  }
}

const submitForm = () => {
  if (!context.editing) return
  const apiService = context.isBase ? updateBaseAgentBrainDsApi : updateBusinessAgentBrainDsApi
  const params: AgentBrainSaveDataSource = {
    id: context.id!,
    dsIds: formData.value.list?.map((item: AgentBrainDataSourceItem) => item.id!) || [],
  }
  context.saveing = true
  apiService(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      ElMessage({
        message: '保存成功',
        type: 'success'
      });
      context.applyDataAccess()
      context.cancelEditingIfBase()
    }
  }).finally(() => {
    context.saveing = false
  })
}

</script>
<style scoped lang="scss">
.el-checkbox {
  white-space: break-spaces;
}
</style>
