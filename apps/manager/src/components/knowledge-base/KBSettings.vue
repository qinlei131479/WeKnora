<script setup lang="ts">
import { computed } from 'vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import DomainSelect from '@/components/common/DomainSelect.vue'
import type { KnowledgeBase } from '@/lib/kb-store'
import { getDepartments, getPositions, getUserGroups } from '@/lib/org-store'

interface Props {
  kb: KnowledgeBase
  settingsTab: 'base' | 'permissions' | 'more'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:settingsTab', value: 'base' | 'permissions' | 'more'): void
  (e: 'handleTogglePerm', category: 'manage' | 'query' | 'download', type: 'depts' | 'positions' | 'usergroups', targetId: string): void
  (e: 'updateKb', updatedKb: KnowledgeBase): void
}>()

const depts = computed(() => getDepartments())
const positions = computed(() => getPositions())
const groups = computed(() => getUserGroups())

const safePermissions = computed(() => props.kb.permissions || {
  manageDepts: [], managePositions: [], manageUserGroups: [],
  accessQueryDepts: ["all_depts"], accessQueryPositions: [], accessQueryUserGroups: [],
  accessDownloadDepts: [], accessDownloadPositions: [], accessDownloadUserGroups: []
})
</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
    <div class="px-8 py-6 bg-white border-b">
      <h2 class="text-xl font-bold text-slate-800">知识库设置</h2>
      <div class="flex items-center gap-6 mt-6">
        <div
          :class="[
            'text-sm font-medium pb-2 cursor-pointer border-b-2 transition-colors',
            settingsTab === 'base' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
          @click="emit('update:settingsTab', 'base')"
        >
          基础信息
        </div>
        <div
          :class="[
            'text-sm font-medium pb-2 cursor-pointer border-b-2 transition-colors',
            settingsTab === 'permissions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
          @click="emit('update:settingsTab', 'permissions')"
        >
          权限管理
        </div>
        <div
          :class="[
            'text-sm font-medium pb-2 cursor-pointer border-b-2 transition-colors',
            settingsTab === 'more' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
          @click="emit('update:settingsTab', 'more')"
        >
          更多设置
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-auto p-8">
      <div v-if="settingsTab === 'base'" class="max-w-2xl bg-white p-6 rounded-xl border border-slate-200">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">知识库名称</label>
            <Input class="h-10 text-sm" :value="kb.title" readonly />
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">归属业务垂直领域</label>
            <DomainSelect
              :model-value="kb.domain"
              @update:model-value="(newDomain) => emit('updateKb', { ...kb, domain: newDomain })"
            />
          </div>
        </div>
      </div>

      <div v-if="settingsTab === 'permissions'" class="max-w-4xl bg-white p-6 rounded-xl border border-slate-200 space-y-6">
        <div class="flex flex-col gap-1 border-b pb-4">
          <h3 class="text-base font-bold text-slate-850">沙箱隔离可见度与权限指标矩阵</h3>
          <p class="text-[11px] text-slate-400">勾选对应主体赋予可见及特定检索查看权；取消勾选则对该主体及名下团队深度隔离阻断。</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs whitespace-nowrap border rounded-lg">
            <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th class="px-4 py-3 border-b text-slate-700 font-bold">授权可见主体 (对象)</th>
                <th class="px-4 py-3 border-b text-slate-700 font-bold">形态</th>
                <th class="px-4 py-3 border-b text-center text-slate-700 font-bold">👑 可管理 (Manage)</th>
                <th class="px-4 py-3 border-b text-center text-slate-700 font-bold">💬 问答检索 (Query)</th>
                <th class="px-4 py-3 border-b text-center text-slate-700 font-bold">📥 原始下载 (Download)</th>
              </tr>
            </thead>
            <tbody class="bg-white">
              <tr v-for="dept in depts" :key="dept.id" class="border-b hover:bg-slate-50">
                <td class="px-4 py-3 font-semibold text-slate-800">{{ dept.name }}</td>
                <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-bold border border-blue-100">集团部门</span></td>
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="safePermissions.manageDepts?.includes(dept.id)"
                    @change="emit('handleTogglePerm', 'manage', 'depts', dept.id)"
                    class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="safePermissions.accessQueryDepts?.includes(dept.id) || safePermissions.accessQueryDepts?.includes('all_depts')"
                    @change="emit('handleTogglePerm', 'query', 'depts', dept.id)"
                    class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="safePermissions.accessDownloadDepts?.includes(dept.id)"
                    @change="emit('handleTogglePerm', 'download', 'depts', dept.id)"
                    class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </td>
              </tr>

              <tr v-for="pos in positions" :key="pos.id" class="border-b hover:bg-slate-50">
                <td class="px-4 py-3 font-semibold text-slate-800">{{ pos.title }}</td>
                <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-[10px] bg-teal-50 text-teal-700 font-bold border border-teal-100">职务岗位</span></td>
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="safePermissions.managePositions?.includes(pos.id)"
                    @change="emit('handleTogglePerm', 'manage', 'positions', pos.id)"
                    class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="safePermissions.accessQueryPositions?.includes(pos.id)"
                    @change="emit('handleTogglePerm', 'query', 'positions', pos.id)"
                    class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="safePermissions.accessDownloadPositions?.includes(pos.id)"
                    @change="emit('handleTogglePerm', 'download', 'positions', pos.id)"
                    class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </td>
              </tr>

              <tr v-for="group in groups" :key="group.id" class="border-b hover:bg-slate-50">
                <td class="px-4 py-3 font-semibold text-slate-800">{{ group.name }}</td>
                <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 font-bold border border-purple-100">核验群组</span></td>
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="safePermissions.manageUserGroups?.includes(group.id)"
                    @change="emit('handleTogglePerm', 'manage', 'usergroups', group.id)"
                    class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="safePermissions.accessQueryUserGroups?.includes(group.id)"
                    @change="emit('handleTogglePerm', 'query', 'usergroups', group.id)"
                    class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="safePermissions.accessDownloadUserGroups?.includes(group.id)"
                    @change="emit('handleTogglePerm', 'download', 'usergroups', group.id)"
                    class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="settingsTab === 'more'" class="max-w-2xl bg-white p-6 rounded-xl border border-slate-200">
        <Button variant="destructive" class="font-bold">删除知识库</Button>
        <p class="mt-2 text-xs text-slate-500">删除后，所有向量数据及原文件将移入回收站中保存30天。</p>
      </div>
    </div>
  </div>
</template>