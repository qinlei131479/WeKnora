<template>
  <Card class="form-view p-6 border-slate-200">
    <div class="flex items-center justify-between mb-6">
      <h2 class="form-title text-lg font-medium text-slate-800 font-sans">关联纯文档与FAQ知识库</h2>
      <btn type="success" :disabled="context.isBase && !context.editing" @click="context.showKbModal = true" round>
        <Plus class="w-3.5 h-3.5 mr-1" /> 添加知识库
      </btn>
    </div>
    <div class="space-y-6">
      <div>
        <div class="space-y-3 max-h-[400px] overflow-auto">
          <div v-for="item in formData.list" :key="item.id" class="list-row">
            <div class="list-item-main">
              <KnowledegIcon :type="item.knowledgeType" short class="list-icon" />
              <div class="list-item-texts">
                <div class="list-item-text-0 truncate">{{ item.name }}</div>
                <div class="list-item-text-1 truncate">{{ item.description }}</div>
              </div>
            </div>
            <!-- <Button variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50"
              @click="handleDelete(item)">取消关联</Button> -->
            <el-button class="cancel-btn" @click="handleDelete(item)">取消关联</el-button>
          </div>
        </div>
      </div>
    </div>
    <div v-hasPermi="['agentic:brain:edit']" class="mt-4 text-right">
      <btn type="primary" :disabled="!context.editing" :loading="context.saveing" @click="submitForm" round>保存</btn>
    </div>
  </Card>
  <KnowledgeDialog />
</template>
<script setup lang="ts">
import {
  Save, Plus, Clock, Zap, Search, Bot, Database, Calendar, List, ChevronLeft, ChevronRight, Shield, User, BookOpen, Wrench, Trash, ArrowLeft
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import KnowledgeDialog from './KnowledgeDialog.vue'
// import { addAgent } from '@/lib/agent-store'
import {
  updateBusinessAgentBrainKnowledgeApi
} from '@/api/agentic/agentBrain'
import { updateBaseAgentBrainKnowledgeApi } from '@/api/agentic/baseAgentBrain.js'
// import { getKnowledgeTypeBadgeStyle } from '@/api/knowledgeLib/knowledgeAuth'
import KnowledegIcon from '@/components/knowledge/KnowledegIcon.vue'

import type { AgentBrainSaveKnowledge, AjaxResult } from '@/types'


const context = inject('agentFormContext')
const formData = computed(() => context.knowledge);

const handleDelete = (item: any) => {
  formData.value.list = formData.value.list.filter((i: any) => i !== item)
}
const submitForm = () => {
  if (!context.editing) return
  // if (context.isBase) {
  //   doSubmitBase()
  // } else {
  //   doSubmitBusiness()
  // }
  const apiService = context.isBase ? updateBaseAgentBrainKnowledgeApi : updateBusinessAgentBrainKnowledgeApi
  const params: AgentBrainSaveKnowledge = {
    id: context.id!,
    knowledgeIds: formData.value.list?.map((item: any) => item.id!) || [],
  }
  context.saveing = true
  apiService(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      ElMessage({
        message: '保存成功',
        type: 'success'
      });
      context.applyKnowledge()
      context.cancelEditingIfBase()
    }
  }).finally(() => {
    context.saveing = false
  })
}
// const doSubmitBase = () => {
//   const params: AgentBrainSaveKnowledge = {
//     id: context.id!,
//     knowledgeIds: formData.value.list?.map((item: any) => item.id!) || [],
//   }
//   updateBaseAgentBrainKnowledgeApi(params).then((res: AjaxResult) => {
//     if (res.code === 200) {
//       ElMessage({
//         message: '保存成功',
//         type: 'success'
//       });
//       context.applyKnowledge()
//     }
//   })
// }

// const doSubmitBusiness = () => {
//   const formDataValue = formData.value;
//   const params: AgentBrainSaveKnowledge = {
//     id: context.id!,
//     knowledgeIds: formDataValue.list?.map((item: any) => item.id!) || [],
//   }
//   updateBusinessAgentBrainKnowledgeApi(params).then((res: AjaxResult) => {
//     if (res.code === 200) {
//       ElMessage({
//         message: '保存成功',
//         type: 'success'
//       });
//       context.applyKnowledge()
//     }
//   })
// }


</script>
<style scoped lang="scss">
@use './form.scss';

.el-checkbox {
  white-space: break-spaces;
}
</style>
