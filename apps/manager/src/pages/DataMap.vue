<script setup lang="ts">
import { ref, computed } from 'vue'
import { Map, Search, Database, Table2, GitBranch, FileText, Layers, Box, ChevronRight, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

interface TableNode {
  id: number
  name: string
  source: string
  rows: string
  fields: number
  category: 'core' | 'transaction' | 'log' | 'dim'
  x: number
  y: number
  connections: number[]
}

const tables = ref<TableNode[]>([
  { id: 1, name: 'customer', source: 'CRM 客户主数据', rows: '128K', fields: 24, category: 'core', x: 80, y: 120, connections: [2, 3, 5] },
  { id: 2, name: 'order', source: 'ERP 订单数据', rows: '892K', fields: 32, category: 'transaction', x: 280, y: 60, connections: [3, 4, 7] },
  { id: 3, name: 'order_item', source: 'ERP 订单数据', rows: '3.2M', fields: 18, category: 'transaction', x: 280, y: 180, connections: [4, 5] },
  { id: 4, name: 'product', source: 'ERP 订单数据', rows: '12K', fields: 28, category: 'dim', x: 480, y: 60, connections: [6] },
  { id: 5, name: 'payment', source: '财务核算接口', rows: '892K', fields: 22, category: 'transaction', x: 480, y: 180, connections: [6, 7] },
  { id: 6, name: 'invoice', source: '财务核算接口', rows: '680K', fields: 30, category: 'transaction', x: 680, y: 120, connections: [8] },
  { id: 7, name: 'employee', source: '人力资源系统', rows: '4.6K', fields: 20, category: 'dim', x: 280, y: 300, connections: [8] },
  { id: 8, name: 'audit_log', source: '生产制造数据', rows: '12M', fields: 16, category: 'log', x: 680, y: 280, connections: [] },
])

const searchTerm = ref('')
const selectedId = ref<number | null>(1)
const selectedTable = computed(() => tables.value.find((t) => t.id === selectedId.value))

const categoryColor = {
  core: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', ring: 'ring-blue-400' },
  transaction: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', ring: 'ring-emerald-400' },
  log: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', ring: 'ring-amber-400' },
  dim: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-300', ring: 'ring-violet-400' },
}

const categoryLabel = {
  core: '核心表',
  transaction: '事务表',
  log: '日志表',
  dim: '维度表',
}

const filteredTables = computed(() => {
  if (!searchTerm.value) return tables.value
  const t = searchTerm.value.toLowerCase()
  return tables.value.filter((tb) => tb.name.toLowerCase().includes(t) || tb.source.toLowerCase().includes(t))
})

const stats = computed(() => ({
  total: tables.value.length,
  core: tables.value.filter((t) => t.category === 'core').length,
  transaction: tables.value.filter((t) => t.category === 'transaction').length,
  dim: tables.value.filter((t) => t.category === 'dim').length,
  log: tables.value.filter((t) => t.category === 'log').length,
}))

const getLineCoords = (from: TableNode, to: TableNode) => {
  return { x1: from.x + 90, y1: from.y + 30, x2: to.x + 90, y2: to.y + 30 }
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 pb-8">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">数据地图</h1>
        <p class="text-sm text-slate-500 mt-1">可视化企业全域数据资产、表关系血缘与流转链路</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" class="h-9 w-9"><ZoomOut class="w-4 h-4" /></Button>
        <Button variant="outline" size="icon" class="h-9 w-9"><ZoomIn class="w-4 h-4" /></Button>
        <Button variant="outline" size="icon" class="h-9 w-9"><Maximize2 class="w-4 h-4" /></Button>
        <Button variant="outline" class="h-9 px-4 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold">
          <Download class="w-4 h-4 mr-2" /> 导出地图
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card class="p-3 border-slate-200">
        <div class="flex items-center gap-2 text-xs text-slate-500 font-bold"><Layers class="w-3.5 h-3.5" /> 全部表</div>
        <div class="text-2xl font-extrabold text-slate-800 mt-1">{{ stats.total }}</div>
      </Card>
      <Card class="p-3 border-slate-200">
        <div class="flex items-center gap-2 text-xs text-blue-600 font-bold"><Box class="w-3.5 h-3.5" /> 核心表</div>
        <div class="text-2xl font-extrabold text-blue-700 mt-1">{{ stats.core }}</div>
      </Card>
      <Card class="p-3 border-slate-200">
        <div class="flex items-center gap-2 text-xs text-emerald-600 font-bold"><GitBranch class="w-3.5 h-3.5" /> 事务表</div>
        <div class="text-2xl font-extrabold text-emerald-700 mt-1">{{ stats.transaction }}</div>
      </Card>
      <Card class="p-3 border-slate-200">
        <div class="flex items-center gap-2 text-xs text-violet-600 font-bold"><Database class="w-3.5 h-3.5" /> 维度表</div>
        <div class="text-2xl font-extrabold text-violet-700 mt-1">{{ stats.dim }}</div>
      </Card>
      <Card class="p-3 border-slate-200">
        <div class="flex items-center gap-2 text-xs text-amber-600 font-bold"><FileText class="w-3.5 h-3.5" /> 日志表</div>
        <div class="text-2xl font-extrabold text-amber-700 mt-1">{{ stats.log }}</div>
      </Card>
    </div>

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-h-0">
      <Card class="border-slate-200 overflow-hidden relative bg-slate-50">
        <!-- 图例 -->
        <div class="absolute top-3 left-3 z-10 bg-white border border-slate-200 rounded-lg shadow-sm p-2 space-y-1.5">
          <div class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">图例</div>
          <div v-for="(c, k) in categoryColor" :key="k" class="flex items-center gap-2 text-xs">
            <span :class="['w-3 h-3 rounded', c.bg, 'border', c.border]"></span>
            <span class="text-slate-700">{{ categoryLabel[k as keyof typeof categoryLabel] }}</span>
          </div>
        </div>

        <div class="relative w-full h-[520px] overflow-auto">
          <svg class="absolute inset-0 w-full h-full pointer-events-none" :viewBox="`0 0 850 400`" preserveAspectRatio="xMinYMin meet">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
              </marker>
            </defs>
            <template v-for="t in tables" :key="t.id">
              <line
                v-for="cId in t.connections"
                :key="`${t.id}-${cId}`"
                :x1="t.x + 90"
                :y1="t.y + 30"
                :x2="(tables.find(x => x.id === cId)?.x ?? 0) + 90"
                :y2="(tables.find(x => x.id === cId)?.y ?? 0) + 30"
                stroke="#cbd5e1"
                stroke-width="1.5"
                stroke-dasharray="4 4"
                marker-end="url(#arrow)"
              />
            </template>
          </svg>

          <div
            v-for="t in tables"
            :key="t.id"
            :class="['absolute cursor-pointer transition-all', categoryColor[t.category].bg, 'border-2 rounded-xl shadow-sm p-3 w-[180px]', selectedId === t.id ? `${categoryColor[t.category].border} ring-2 ${categoryColor[t.category].ring}` : categoryColor[t.category].border, 'hover:shadow-md']"
            :style="{ left: `${t.x}px`, top: `${t.y}px` }"
            @click="selectedId = t.id"
          >
            <div class="flex items-center gap-1.5 mb-1">
              <Table2 :class="['w-3.5 h-3.5', categoryColor[t.category].text]" />
              <span :class="['font-bold text-sm truncate', categoryColor[t.category].text]">{{ t.name }}</span>
            </div>
            <div class="text-[10px] text-slate-500 truncate">{{ t.source }}</div>
            <div class="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-mono">
              <span>{{ t.rows }} 行</span>
              <span>·</span>
              <span>{{ t.fields }} 字段</span>
            </div>
          </div>
        </div>
      </Card>

      <!-- 详情面板 -->
      <Card class="p-4 border-slate-200 overflow-y-auto">
        <div class="flex items-center gap-2 mb-3">
          <Map class="w-5 h-5 text-blue-600" />
          <h2 class="font-bold text-slate-800">表详情</h2>
        </div>
        <div v-if="selectedTable">
          <div :class="['p-3 rounded-xl border-2', categoryColor[selectedTable.category].bg, categoryColor[selectedTable.category].border, 'mb-4']">
            <div :class="['text-[10px] font-extrabold uppercase tracking-widest mb-1', categoryColor[selectedTable.category].text]">{{ categoryLabel[selectedTable.category] }}</div>
            <div :class="['text-lg font-extrabold', categoryColor[selectedTable.category].text]">{{ selectedTable.name }}</div>
            <div class="text-xs text-slate-600 mt-1">{{ selectedTable.source }}</div>
          </div>

          <div class="grid grid-cols-2 gap-2 mb-4">
            <div class="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div class="text-[10px] text-slate-500 font-bold">数据行数</div>
              <div class="text-lg font-extrabold text-slate-800 font-mono mt-0.5">{{ selectedTable.rows }}</div>
            </div>
            <div class="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div class="text-[10px] text-slate-500 font-bold">字段数</div>
              <div class="text-lg font-extrabold text-slate-800 font-mono mt-0.5">{{ selectedTable.fields }}</div>
            </div>
          </div>

          <div class="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">关联表 ({{ selectedTable.connections.length }})</div>
          <div class="space-y-1.5">
            <div
              v-for="cId in selectedTable.connections"
              :key="cId"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
              @click="selectedId = cId"
            >
              <Table2 class="w-3.5 h-3.5 text-slate-400" />
              <span class="text-sm text-slate-700 flex-1">{{ tables.find(t => t.id === cId)?.name }}</span>
              <ChevronRight class="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div v-if="selectedTable.connections.length === 0" class="text-xs text-slate-400 text-center py-3">无关联表</div>
          </div>
        </div>
        <div v-else class="text-sm text-slate-400 text-center py-10">选择左侧表格节点查看详情</div>

        <div class="mt-4 pt-4 border-t border-slate-200">
          <div class="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">搜索</div>
          <div class="relative">
            <Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input v-model="searchTerm" placeholder="搜索表名..." class="pl-8 h-8 text-sm border-slate-200" />
          </div>
          <div class="mt-2 space-y-1 max-h-40 overflow-y-auto">
            <div
              v-for="t in filteredTables"
              :key="t.id"
              :class="['px-2 py-1.5 rounded text-xs flex items-center gap-1.5 cursor-pointer', selectedId === t.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600']"
              @click="selectedId = t.id"
            >
              <Table2 class="w-3 h-3" />
              <span class="flex-1">{{ t.name }}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
