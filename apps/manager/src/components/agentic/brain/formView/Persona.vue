<template>
  <div class="form-view rounded-xl border text-slate-900 shadow-sm p-6 border-slate-200">
    <h2 class="form-title text-lg font-medium text-slate-800 mb-6">基础信息</h2>
    <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px" label-position="top">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="大脑名称" prop="name">
            <el-input placeholder="例如：行政巡检机器人助理" v-model="formData.name" />
          </el-form-item>
          <el-form-item label="归属领域分类" prop="categoryId">
            <DomainSelect v-model="formData.categoryId" check-strictly :allow-all="false"
              :root-domain-id="businessCategoryId" class="w-full" />
          </el-form-item>
        </div>
        <el-form-item label="简述" prop="description">
          <!-- <textarea v-model="formData.description"
            class="w-full h-20 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="简述该智能体大脑的认知与处理职责..." /> -->
          <el-input type="textarea" autosize v-model="formData.description"
            class="focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="简述该智能体大脑的认知与处理职责..." />
        </el-form-item>
        <el-form-item label="角色提示词" prop="prompt">
          <!-- <textarea v-model="formData.prompt"
            class="w-full h-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="你是一个专业的行政管理专家，负责指导人形机器人完成巡检..." /> -->
          <el-input type="textarea" autosize v-model="formData.prompt"
            class="focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="你是一个专业的行政管理专家，负责指导人形机器人完成巡检..." />
        </el-form-item>
        <el-form-item label="开场白 (欢迎语)" prop="welcomeMessage">
          <!-- <Input v-model="formData.welcomeMessage" placeholder="你好，我是您的助理，请问有什么可以帮您？" /> -->
          <el-input type="textarea" autosize v-model="formData.welcomeMessage" placeholder="你好，我是您的助理，请问有什么可以帮您？" />
          <p class="text-xs text-slate-400 mt-1.5">用户打开智能体时自动发送的第一句话。</p>
        </el-form-item>
      </div>
    </el-form>
    <div v-if="context.id" v-hasPermi="['agentic:brain:edit']" class="mt-4 text-right">
      <btn type="primary" :disabled="!context.editing" :loading="context.saveing" @click="submitForm" round>保存</btn>
    </div>
    <div v-else v-hasPermi="['agentic:brain:add']" class="mt-4 text-right">
      <btn type="primary" :disabled="!context.editing" :loading="context.saveing" @click="submitForm" round>保存</btn>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  Save, Plus, Clock, Zap, Search, Bot, Database, Calendar, List, ChevronLeft, ChevronRight, Shield, User, BookOpen, Wrench, Trash, ArrowLeft
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DomainSelect from '@/components/common/DomainSelect2.vue'
// import { addAgent } from '@/lib/agent-store'
// import {
//   addBusinessAgentBrainApi
// } from '@/api/agentic/agentBrain'

import type { AgentBrainPersona, AgentBrainSavePersona, AjaxResult } from '@/types'
import { businessCategoryId } from '@/api/settings/category'
import { addBusinessAgentBrainApi, updateBusinessAgentBrainPersonaApi } from '@/api/agentic/agentBrain'
import { GuideGroupItem } from './guide-question/guideGroup'
import GuideGroup from './guide-question/GuideGroup.vue'

const context = inject('agentFormContext')
const formData: ComputedRef<AgentBrainPersona> = computed(() => context.persona as AgentBrainPersona);
const formRef = ref(null);
const rules = reactive({
  name: [{ required: true, message: '请输入大脑名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择归属领域分类', trigger: 'change' }],
  description: [{ required: true, message: '请输入简述', trigger: 'blur' }],
  prompt: [{ required: true, message: '请输入角色提示词', trigger: 'blur' }],
  welcomeMessage: [{ required: true, message: '请输入开场白', trigger: 'blur' }],
})

const guideGroups = ref<GuideGroupItem[]>([])
guideGroups.value.push({ name: '', questions: [] })


const submitForm = () => {
  if (!context.editing || context.isBase) return
  formRef.value.validate((valid: boolean) => {
    if (!valid) {
      return
    }
    doSubmit()
  })
}
const doSubmit = () => {
  const isAdd = !context.id;
  const apiService = isAdd ? addBusinessAgentBrainApi : updateBusinessAgentBrainPersonaApi
  const params: AgentBrainSavePersona = {
    id: context.id!,
    ...formData.value,
  }
  context.saveing = true
  apiService(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      ElMessage({
        message: '保存成功',
        type: 'success'
      });
      if (isAdd) {
        context.id = res.data!.id
        context.data = res.data!
      }
      context.applyPersona()
    }
  }).finally(() => {
    context.saveing = false
  })
}
</script>
<style scoped lang="scss">
@use './form.scss';

.group-add-row {
  margin-top: 12px;

  .el-button {
    width: 100%;
  }
}
</style>
