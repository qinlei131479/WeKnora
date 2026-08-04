<script setup lang="ts">
import {
  ShieldCheck, CheckCircle2, SlidersHorizontal, Building, Briefcase, Users, User as UserIcon
} from 'lucide-vue-next'
// import Button from '@/components/ui/Button.vue'

import MatrixTab from './components/MatrixTab.vue'
import DeptAuditTab from './components/DeptAuditTab.vue'
import PosAuditTab from './components/PosAuditTab.vue'
import GroupAuditTab from './components/GroupAuditTab.vue'
import UserAuditTab from './components/UserAuditTab.vue'

type TabType = 'matrix' | 'dept-audit' | 'pos-audit' | 'group-audit' | 'audit'

const activeTab = ref<TabType>('matrix')
const subtitle = ref('全景审视并集中管理"文档知识、网页知识、环境数据"的「管理上传、智能问答、原件下载」安全沙箱受众。')
</script>

<template>
  <my-page>
    <page-layout gap="8">
      <template #start>
        <page-name title="系统级知识库安全授权与管辖矩阵" :subtitle="subtitle" />
      </template>
      <page-layout gap="5">
        <template #start>
          <el-tabs v-model="activeTab" class="demo-tabs">
            <el-tab-pane label="多维度管辖矩阵配置" name="matrix">
              <template #label>
                <span class="custom-tabs-label">
                  <svg-icon icon-class="mp-manage" />
                  <span>多维度管辖矩阵配置</span>
                </span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="部门权限审计" name="dept-audit">
              <template #label>
                <span class="custom-tabs-label">
                  <svg-icon icon-class="mp-dept" />
                  <span>部门权限审计</span>
                </span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="岗位权限审计" name="pos-audit">
              <template #label>
                <span class="custom-tabs-label">
                  <svg-icon icon-class="mp-post" />
                  <span>岗位权限审计</span>
                </span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="用户组权限审计" name="group-audit">
              <template #label>
                <span class="custom-tabs-label">
                  <svg-icon icon-class="mp-group" />
                  <span>用户组权限审计</span>
                </span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="用户权限审计" name="audit">
              <template #label>
                <span class="custom-tabs-label">
                  <svg-icon icon-class="mp-user" />
                  <span>用户权限审计</span>
                </span>
              </template>
            </el-tab-pane>
          </el-tabs>
        </template>
        <Transition name="fade">
          <MatrixTab v-if="activeTab === 'matrix'" />
          <DeptAuditTab v-else-if="activeTab === 'dept-audit'" />
          <PosAuditTab v-else-if="activeTab === 'pos-audit'" />
          <GroupAuditTab v-else-if="activeTab === 'group-audit'" />
          <UserAuditTab v-else-if="activeTab === 'audit'" />
        </Transition>
      </page-layout>
    </page-layout>
    <!-- <div class="h-full flex flex-col max-w-7xl mx-auto space-y-6">

      <div class="power-tabs flex border-b border-slate-200 gap-1 overflow-x-auto whitespace-nowrap">
        <button @click="activeTab = 'matrix'"
          :class="['px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2', activeTab === 'matrix' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300']">
          <SlidersHorizontal class="w-3.5 h-3.5" />
          多维度管辖矩阵配置
        </button>
        <button @click="activeTab = 'dept-audit'"
          :class="['px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2', activeTab === 'dept-audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300']">
          <Building class="w-3.5 h-3.5 text-blue-600" />
          部门权限审计
        </button>
        <button @click="activeTab = 'pos-audit'"
          :class="['px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2', activeTab === 'pos-audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300']">
          <Briefcase class="w-3.5 h-3.5 text-teal-600" />
          岗位权限审计
        </button>
        <button @click="activeTab = 'group-audit'"
          :class="['px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2', activeTab === 'group-audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300']">
          <Users class="w-3.5 h-3.5 text-indigo-600" />
          用户组权限审计
        </button>
        <button @click="activeTab = 'audit'"
          :class="['px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2', activeTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300']">
          <UserIcon class="w-3.5 h-3.5" />
          独立用户权限审计
        </button>
      </div>



    </div> -->
  </my-page>
</template>
<style scoped lang="scss">
.custom-tabs-label {
  display: flex;
  align-items: center;
  justify-content: center;

  .svg-icon {
    width: 24px;
    height: 24px;
  }
}
</style>