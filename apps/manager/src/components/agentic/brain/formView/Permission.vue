<template>
  <div class="form-view p-6 border-slate-200 font-sans shadow-sm rounded-2xl bg-white">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-105 pb-4">
      <div>
        <h2 class="form-title">
          <!-- <Shield class="w-4.5 h-4.5 text-indigo-500" /> -->
          业务使用权限与授权范围
        </h2>
        <p class="sub-title">设置当前业务半脑可被哪些部门、岗位或用户组使用。本部分已接入智慧点选机制，防止数据冗余难选。
        </p>
      </div>
      <!-- <Button variant="outline"
        class="h-10 px-4 border-indigo-150 hover:bg-indigo-50/45 text-indigo-700 font-bold text-xs bg-white rounded-xl shadow-sm hover:border-indigo-200"
        @click="context.showPermissionModal = true">
        <Plus class="w-4 h-4 mr-1" />
        点选授权可用范围
      </Button> -->
      <btn type="success" @click="context.showPermissionModal = true" round>
        <Plus class="w-4 h-4 mr-1" />
        点选授权可用范围
      </btn>
    </div>
    <div class="space-y-3.5">
      <div v-if="
        formData.deptList.length === 0 &&
        formData.positionList.length === 0 &&
        formData.groupList.length === 0
      "
        class="py-12 text-center border-2 border-dashed border-slate-150 rounded-2xl bg-slate-50 text-slate-400 text-xs">
        <Shield class="w-10 h-10 text-slate-300 mx-auto mb-2 animate-bounce" />
        <p class="font-bold text-slate-600">无可用的授权使用范围</p>
        <p class="text-[11px] text-slate-400 mt-0.5">任何人都将无法查看或使用此大脑。点击上方按钮快速导入授权。</p>
      </div>
      <div v-for="item in formData.deptList" :key="'dept_' + item.id" class="list-row">
        <div class="list-item-main">
          <div class="list-icon dept-icon-bg dept-icon-text">
            部门
          </div>
          <div class="list-item-texts">
            <div class="list-item-text-0 truncate">{{ deptService.dataMap[item.authId]?.deptName || '' }}</div>
            <div class="list-item-text-1 truncate">{{ deptService.dataMap[item.authId]?.remark ||
              '' }}</div>
          </div>
        </div>
        <el-button class="cancel-btn" @click="handleDelete(item, 'deptList')">取消授权</el-button>
      </div>
      <div v-for="item in formData.positionList" :key="'position_' + item.id" class="list-row">
        <div class="list-item-main">
          <div class="list-icon position-icon-bg position-icon-text">
            岗位
          </div>
          <div class="list-item-texts">
            <div class="list-item-text-0 truncate">{{ positionService.dataMap[item.authId]?.postName || '' }}
            </div>
            <div class="list-item-text-1 truncate">{{ positionService.dataMap[item.authId]?.remark
              || '' }}</div>
          </div>
        </div>
        <el-button class="cancel-btn" @click="handleDelete(item, 'positionList')">取消授权</el-button>
      </div>
      <div v-for="item in formData.groupList" :key="'group_' + item.id" class="list-row">
        <div class="list-item-main">
          <div class="list-icon group-icon-bg group-icon-text">
            用户组
          </div>
          <div class="list-item-texts">
            <div class="list-item-text-0 truncate">{{ groupService.dataMap[item.authId]?.groupName || '' }}</div>
            <div class="list-item-text-1 truncate">{{ groupService.dataMap[item.authId]?.remark ||
              '' }}</div>
          </div>
        </div>
        <el-button class="cancel-btn" @click="handleDelete(item, 'groupList')">取消授权</el-button>
      </div>
    </div>
    <div v-hasPermi="['agentic:brain:edit']" class="mt-4 text-right">
      <btn type="primary" :disabled="!context.editing" :loading="context.saveing" @click="submitForm" round>保存</btn>
    </div>
  </div>
  <PermissionDialog :dservice="deptService" :pservice="positionService" :gservice="groupService" />
</template>
<script setup lang="ts">
import {
  Save, Plus, Clock, Zap, Search, Bot, Database, Calendar, List, ChevronLeft, ChevronRight, Shield, User, BookOpen, Wrench, Trash, ArrowLeft
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
// import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
// import Dialog from '@/components/ui/Dialog.vue'
// import DialogContent from '@/components/ui/DialogContent.vue'
// import DomainSelect from '@/components/common/DomainSelect.vue'
import PermissionDialog from './PermissionDialog.vue'
import positionServiceFactory, { PositionEntity } from '@/service/positionService'
import groupServiceFactory, { GroupEntity } from '@/service/groupService'
import DeptServiceFactory, { TreeDept } from '@/service/deptService'
import { updateBusinessAgentBrainAuthApi } from '@/api/agentic/agentBrain.js'
// import { addAgent } from '@/lib/agent-store'
// import {
//   addBusinessAgentBrainApi
// } from '@/api/agentic/agentBrain'
import DataTypeIcon from './task/DataTypeIcon.vue';
import { DataTypes } from './task/task';

import type { AgentBrainAuthBaseItem, AgentBrainAuthItem, AgentBrainSaveAuth, AjaxResult } from '@/types'

const context = inject('agentFormContext')
const formData = computed(() => context.permission);
const deptService = DeptServiceFactory()
const positionService = positionServiceFactory()
const groupService = groupServiceFactory()

const handleDelete = (item: any, listName: string) => {
  formData.value[listName] = formData.value[listName].filter((i: any) => i != item)
}

const submitForm = () => {
  if (!context.editing) return
  const apiService = updateBusinessAgentBrainAuthApi
  const auths: AgentBrainAuthBaseItem[] = [];
  const formDataValue = formData.value
  formDataValue.deptList.forEach((item: AgentBrainAuthItem) => {
    auths.push(item)
  })
  formDataValue.positionList.forEach((item: AgentBrainAuthItem) => {
    auths.push(item)
  })
  formDataValue.groupList.forEach((item: AgentBrainAuthItem) => {
    auths.push(item)
  })
  const params: AgentBrainSaveAuth = {
    id: context.id!,
    auths: auths
  }
  context.saveing = true
  apiService(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      ElMessage({
        message: '保存成功',
        type: 'success'
      });
      context.applyPermission()
      // context.cancelEditingIfBase()
    }
  }).finally(() => {
    context.saveing = false
  })
}

</script>
<style scoped lang="scss">
@use './form.scss';
</style>
