<script setup lang="ts">
import { ref, computed } from 'vue'
import { Shield, ShieldCheck, ShieldAlert, Activity, Eye, Lock, Unlock, AlertTriangle, CheckCircle2, XCircle, Clock, Search, Filter } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

interface AuditEvent {
  id: number
  time: string
  user: string
  action: 'query' | 'export' | 'modify' | 'login' | 'access'
  target: string
  ip: string
  result: 'success' | 'denied' | 'warning'
  risk: 'low' | 'medium' | 'high'
}

const events = ref<AuditEvent[]>([
  { id: 1, time: '2026-06-17 10:45:23', user: '张伟', action: 'query', target: 'CRM 客户主数据 / customer 表', ip: '192.168.10.45', result: 'success', risk: 'low' },
  { id: 2, time: '2026-06-17 10:42:18', user: '李娜', action: 'export', target: 'ERP 订单数据 / order 表', ip: '192.168.10.78', result: 'success', risk: 'medium' },
  { id: 3, time: '2026-06-17 10:38:55', user: 'guest_001', action: 'access', target: '财务核算接口', ip: '203.156.88.21', result: 'denied', risk: 'high' },
  { id: 4, time: '2026-06-17 10:30:12', user: '王强', action: 'modify', target: '人力资源系统 / employee 表', ip: '192.168.10.32', result: 'success', risk: 'medium' },
  { id: 5, time: '2026-06-17 10:25:08', user: '赵敏', action: 'export', target: '生产制造数据 / 全量', ip: '192.168.10.91', result: 'warning', risk: 'high' },
  { id: 6, time: '2026-06-17 10:18:42', user: 'admin', action: 'login', target: '管理后台', ip: '192.168.10.1', result: 'success', risk: 'low' },
  { id: 7, time: '2026-06-17 10:15:30', user: '钱涛', action: 'query', target: 'CRM 客户主数据 / payment 表', ip: '192.168.10.66', result: 'denied', risk: 'high' },
  { id: 8, time: '2026-06-17 10:12:05', user: '孙丽', action: 'export', target: '财务核算接口 / invoice', ip: '192.168.10.55', result: 'success', risk: 'low' },
])

const searchTerm = ref('')
const actionFilter = ref<'all' | 'query' | 'export' | 'modify' | 'login' | 'access'>('all')

const securityStats = computed(() => ({
  total: events.value.length,
  success: events.value.filter((e) => e.result === 'success').length,
  denied: events.value.filter((e) => e.result === 'denied').length,
  warning: events.value.filter((e) => e.result === 'warning').length,
  highRisk: events.value.filter((e) => e.risk === 'high').length,
}))

const filtered = computed(() => {
  return events.value.filter((e) => {
    if (actionFilter.value !== 'all' && e.action !== actionFilter.value) return false
    if (searchTerm.value) {
      const t = searchTerm.value.toLowerCase()
      if (!e.user.toLowerCase().includes(t) && !e.target.toLowerCase().includes(t) && !e.ip.includes(t)) return false
    }
    return true
  })
})

const actionLabels: Record<string, { label: string; color: string; icon: any }> = {
  query: { label: '查询', color: 'bg-blue-50 text-blue-700', icon: Eye },
  export: { label: '导出', color: 'bg-amber-50 text-amber-700', icon: Activity },
  modify: { label: '修改', color: 'bg-violet-50 text-violet-700', icon: Shield },
  login: { label: '登录', color: 'bg-slate-50 text-slate-700', icon: Lock },
  access: { label: '访问', color: 'bg-emerald-50 text-emerald-700', icon: Unlock },
}

const resultLabels: Record<string, { label: string; color: string; icon: any }> = {
  success: { label: '成功', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  denied: { label: '拒绝', color: 'bg-rose-100 text-rose-700', icon: XCircle },
  warning: { label: '告警', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
}

const riskLabels: Record<string, { label: string; color: string }> = {
  low: { label: '低风险', color: 'bg-slate-100 text-slate-600' },
  medium: { label: '中风险', color: 'bg-amber-100 text-amber-700' },
  high: { label: '高风险', color: 'bg-rose-100 text-rose-700' },
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 pb-8">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">数据安全审计</h1>
        <p class="text-sm text-slate-500 mt-1">实时监控数据访问、导出、变更行为,识别风险与异常</p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" class="h-10 px-4 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold">
          <Activity class="w-4 h-4 mr-2" /> 实时监控
        </Button>
        <Button class="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold h-10 px-5 rounded-xl shadow-md">
          <ShieldAlert class="w-4 h-4 mr-2" /> 风险预警
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card class="p-4 border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center"><Activity class="w-5 h-5" /></div>
          <div>
            <div class="text-xs text-slate-500 font-bold">总事件</div>
            <div class="text-xl font-extrabold text-slate-800 mt-0.5">{{ securityStats.total }}</div>
          </div>
        </div>
      </Card>
      <Card class="p-4 border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 class="w-5 h-5" /></div>
          <div>
            <div class="text-xs text-slate-500 font-bold">成功</div>
            <div class="text-xl font-extrabold text-emerald-700 mt-0.5">{{ securityStats.success }}</div>
          </div>
        </div>
      </Card>
      <Card class="p-4 border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><XCircle class="w-5 h-5" /></div>
          <div>
            <div class="text-xs text-slate-500 font-bold">拒绝</div>
            <div class="text-xl font-extrabold text-rose-700 mt-0.5">{{ securityStats.denied }}</div>
          </div>
        </div>
      </Card>
      <Card class="p-4 border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><AlertTriangle class="w-5 h-5" /></div>
          <div>
            <div class="text-xs text-slate-500 font-bold">告警</div>
            <div class="text-xl font-extrabold text-amber-700 mt-0.5">{{ securityStats.warning }}</div>
          </div>
        </div>
      </Card>
      <Card class="p-4 border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center"><ShieldAlert class="w-5 h-5" /></div>
          <div>
            <div class="text-xs text-slate-500 font-bold">高风险</div>
            <div class="text-xl font-extrabold text-rose-700 mt-0.5">{{ securityStats.highRisk }}</div>
          </div>
        </div>
      </Card>
    </div>

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 min-h-0">
      <!-- 侧边栏 -->
      <Card class="p-4 border-slate-200 space-y-5 h-fit">
        <div>
          <div class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Filter class="w-3 h-3" /> 操作类型
          </div>
          <div class="space-y-1">
            <button
              v-for="a in [
                { id: 'all', label: '全部操作', icon: Shield },
                { id: 'query', label: '查询', icon: Eye },
                { id: 'export', label: '导出', icon: Activity },
                { id: 'modify', label: '修改', icon: Shield },
                { id: 'access', label: '访问', icon: Unlock },
                { id: 'login', label: '登录', icon: Lock },
              ]"
              :key="a.id"
              :class="['w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors', actionFilter === a.id ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-600 hover:bg-slate-50']"
              @click="actionFilter = a.id as any"
            >
              <component :is="a.icon" class="w-3.5 h-3.5" />
              <span class="flex-1 text-left">{{ a.label }}</span>
            </button>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-200">
          <div class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">安全策略</div>
          <div class="space-y-2">
            <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <div class="flex items-center gap-2"><ShieldCheck class="w-3.5 h-3.5 text-emerald-600" /><span class="text-xs text-slate-700">动态脱敏</span></div>
              <span class="text-[10px] font-bold text-emerald-600">已启用</span>
            </div>
            <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <div class="flex items-center gap-2"><ShieldCheck class="w-3.5 h-3.5 text-emerald-600" /><span class="text-xs text-slate-700">行级权限</span></div>
              <span class="text-[10px] font-bold text-emerald-600">已启用</span>
            </div>
            <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50/50 border border-amber-100">
              <div class="flex items-center gap-2"><ShieldAlert class="w-3.5 h-3.5 text-amber-600" /><span class="text-xs text-slate-700">导出审批</span></div>
              <span class="text-[10px] font-bold text-amber-600">部分启用</span>
            </div>
            <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/50 border border-slate-100">
              <div class="flex items-center gap-2"><Shield class="w-3.5 h-3.5 text-slate-400" /><span class="text-xs text-slate-700">IP 白名单</span></div>
              <span class="text-[10px] font-bold text-slate-500">已禁用</span>
            </div>
          </div>
        </div>
      </Card>

      <!-- 审计日志 -->
      <Card class="border-slate-200 overflow-hidden flex flex-col">
        <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-2">
            <Shield class="w-4 h-4 text-rose-600" />
            <h2 class="font-bold text-slate-800">审计日志</h2>
            <span class="text-xs text-slate-500">实时事件流</span>
          </div>
          <div class="relative w-72 max-w-full">
            <Search class="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input v-model="searchTerm" placeholder="搜索用户/对象/IP..." class="pl-9 h-9 bg-slate-50 border-slate-200 text-sm" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 sticky top-0">
              <tr class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                <th class="px-4 py-2.5 text-left">时间</th>
                <th class="px-4 py-2.5 text-left">用户</th>
                <th class="px-4 py-2.5 text-left">操作</th>
                <th class="px-4 py-2.5 text-left">目标对象</th>
                <th class="px-4 py-2.5 text-left">来源 IP</th>
                <th class="px-4 py-2.5 text-center">结果</th>
                <th class="px-4 py-2.5 text-center">风险</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="e in filtered"
                :key="e.id"
                :class="['border-b border-slate-100 hover:bg-slate-50/50 transition-colors', e.risk === 'high' ? 'bg-rose-50/30' : '']"
              >
                <td class="px-4 py-2.5 text-slate-600 font-mono text-xs whitespace-nowrap">
                  <div class="flex items-center gap-1.5">
                    <Clock class="w-3 h-3 text-slate-400" />
                    {{ e.time }}
                  </div>
                </td>
                <td class="px-4 py-2.5 font-bold text-slate-800">{{ e.user }}</td>
                <td class="px-4 py-2.5">
                  <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold', actionLabels[e.action].color]">
                    <component :is="actionLabels[e.action].icon" class="w-3 h-3" />
                    {{ actionLabels[e.action].label }}
                  </span>
                </td>
                <td class="px-4 py-2.5 text-slate-700 font-mono text-xs truncate max-w-xs">{{ e.target }}</td>
                <td class="px-4 py-2.5 text-slate-500 font-mono text-xs">{{ e.ip }}</td>
                <td class="px-4 py-2.5 text-center">
                  <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold', resultLabels[e.result].color]">
                    <component :is="resultLabels[e.result].icon" class="w-3 h-3" />
                    {{ resultLabels[e.result].label }}
                  </span>
                </td>
                <td class="px-4 py-2.5 text-center">
                  <span :class="['px-2 py-0.5 rounded text-[10px] font-bold', riskLabels[e.risk].color]">
                    {{ riskLabels[e.risk].label }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  </div>
</template>
