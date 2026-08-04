<script setup lang="ts">
import { ref, computed } from 'vue'
import { Activity, Download, FileSpreadsheet } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

interface AuditLog {
  id: string
  user: string
  action: string
  target: string
  time: string
  status: 'success' | 'warning' | 'failed'
  ip: string
}

const searchTerm = ref('')

const logs = ref<AuditLog[]>([
  { id: 'log-101', user: '陈总编', action: '新闻稿范本库一键重排切片', target: '融媒体新闻稿历史范本库', time: '2026-06-01 07:44:12', status: 'success', ip: '192.168.2.45' },
  { id: 'log-102', user: '肖经理 (大屏运维)', action: '下载了 IPTV 按键响应时延文档', target: 'IPTV 遥控器大屏交互规范及高频问题标准词表', time: '2026-05-31 23:20:15', status: 'success', ip: '192.168.1.189' },
  { id: 'log-103', user: '李总监 (集团HR)', action: '修改了 绩效评价分类 访问与下载权限', target: '集团2025人力资源社会招聘及薪酬绩效政策汇编', time: '2026-05-30 15:10:04', status: 'warning', ip: '10.0.4.56' },
  { id: 'log-104', user: '叶教授 (外语教研)', action: '修改了 教学质量 向量参数', target: '新版员工手册库', time: '2026-05-30 08:44:00', status: 'success', ip: '192.168.2.112' },
  { id: 'log-105', user: '廖老师 (临时账号)', action: '试图下载 政治主题融媒体融合稿源 (被拒)', target: '融媒体新闻稿历史范本库', time: '2026-05-29 14:02:10', status: 'failed', ip: '172.16.89.5' }
])

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    return log.user.toLowerCase().includes(searchTerm.value.toLowerCase()) || 
           log.action.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
           log.target.toLowerCase().includes(searchTerm.value.toLowerCase())
  })
})

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'success': return { label: '安全无异常', color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' }
    case 'warning': return { label: '权限变更行为', color: 'bg-amber-50 text-amber-700 border border-amber-100' }
    case 'failed': return { label: '拦截不安全访问', color: 'bg-rose-50 text-rose-700 border border-rose-100' }
    default: return { label: status, color: 'bg-slate-50 text-slate-600 border border-slate-100' }
  }
}

const handleExport = () => {
  alert('审计数据已安全导出到 CSV')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Activity class="w-5 h-5 text-emerald-600 animate-pulse" />
          系统安全与合规审计日志
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          监控并详细记录所有知识库管理、访问行为、问答及物理实体原本的下载轨迹
        </p>
      </div>

      <Button variant="outline" class="text-xs bg-white border-slate-200" @click="handleExport">
        <FileSpreadsheet class="w-3.5 h-3.5 mr-1" />
        导出全部审计数据
      </Button>
    </div>

    <div class="flex items-center gap-2 mb-4">
      <Input 
        v-model="searchTerm"
        placeholder="按照操作员, 事件内容, 目标知识库搜索..." 
        class="text-xs max-w-sm h-9 bg-white"
      />
    </div>

    <Card class="p-0 border-slate-200 overflow-hidden bg-white shadow-sm">
      <table class="w-full text-left text-xs divide-y divide-slate-100">
        <thead class="bg-slate-50 text-slate-500 font-medium">
          <tr>
            <th class="p-3">事件流水ID</th>
            <th class="p-3">操作员</th>
            <th class="p-3">操作事件内容</th>
            <th class="p-3">目标知识库实体</th>
            <th class="p-3">访问来源IP</th>
            <th class="p-3 font-mono">操作时间</th>
            <th class="p-3 text-right">状态判定</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-sans">
          <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-slate-50/50 transition-colors">
            <td class="p-3 font-mono text-[10.5px] text-slate-400">#{{ log.id }}</td>
            <td class="p-3 font-semibold text-slate-800">{{ log.user }}</td>
            <td class="p-3 text-slate-600 font-medium flex items-center gap-1.5">
              <Download v-if="log.action.includes('下载')" class="w-3 h-3 text-blue-500" />
              {{ log.action }}
            </td>
            <td class="p-3 text-slate-500">{{ log.target }}</td>
            <td class="p-3 font-mono text-[10.5px] text-slate-500">{{ log.ip }}</td>
            <td class="p-3 font-mono text-slate-500">{{ log.time }}</td>
            <td class="p-3 text-right">
              <span :class="['px-1.5 py-0.5 rounded text-[9.5px] font-bold', getStatusInfo(log.status).color]">
                {{ getStatusInfo(log.status).label }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  </div>
</template>
