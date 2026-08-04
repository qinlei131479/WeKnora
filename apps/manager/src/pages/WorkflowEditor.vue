<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Save,
  Play,
  ArrowLeft,
  Plus,
  Trash2,
  Settings,
  Bot,
  Wrench,
  GitBranch,
  Database,
  Code,
  Globe,
  MessageSquare,
  CheckCircle2,
  Circle,
  Square,
  Zap,
  Sparkles,
  FileText,
  Send,
  Clock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MousePointer2,
  Hand,
  Layers,
  Download,
  Upload,
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const router = useRouter()

const workflowName = ref('智能客服工作流')
const workflowDesc = ref('接收用户问题 → 意图识别 → 知识库检索 → 生成回答')
const isRunning = ref(false)
const zoom = ref(100)
const tool = ref<'select' | 'pan'>('select')

interface WorkflowNode {
  id: number
  type: string
  label: string
  icon: any
  color: string
  x: number
  y: number
  config?: Record<string, any>
}

interface NodeType {
  type: string
  label: string
  icon: any
  color: string
  category: string
}

const nodePalette: NodeType[] = [
  { type: 'start', label: '开始', icon: Play, color: 'emerald', category: '基础' },
  { type: 'end', label: '结束', icon: CheckCircle2, color: 'slate', category: '基础' },
  { type: 'input', label: '输入', icon: MessageSquare, color: 'blue', category: '基础' },
  { type: 'output', label: '输出', icon: Send, color: 'blue', category: '基础' },
  { type: 'llm', label: '大模型', icon: Bot, color: 'violet', category: 'AI' },
  { type: 'knowledge', label: '知识库', icon: Database, color: 'amber', category: 'AI' },
  { type: 'intent', label: '意图识别', icon: Sparkles, color: 'pink', category: 'AI' },
  { type: 'tool', label: '工具调用', icon: Wrench, color: 'cyan', category: '执行' },
  { type: 'api', label: 'API 请求', icon: Globe, color: 'sky', category: '执行' },
  { type: 'code', label: '代码执行', icon: Code, color: 'indigo', category: '执行' },
  { type: 'condition', label: '条件分支', icon: GitBranch, color: 'orange', category: '逻辑' },
  { type: 'loop', label: '循环', icon: Zap, color: 'rose', category: '逻辑' },
  { type: 'delay', label: '延时', icon: Clock, color: 'gray', category: '逻辑' },
  { type: 'variable', label: '变量赋值', icon: FileText, color: 'teal', category: '逻辑' },
]

const colorMap: Record<string, { bg: string; border: string; text: string; ring: string; dot: string }> = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', ring: 'ring-emerald-400', dot: 'bg-emerald-500' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-600', ring: 'ring-slate-400', dot: 'bg-slate-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', ring: 'ring-blue-400', dot: 'bg-blue-500' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', ring: 'ring-violet-400', dot: 'bg-violet-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', ring: 'ring-amber-400', dot: 'bg-amber-500' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700', ring: 'ring-pink-400', dot: 'bg-pink-500' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', ring: 'ring-cyan-400', dot: 'bg-cyan-500' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-700', ring: 'ring-sky-400', dot: 'bg-sky-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', ring: 'ring-indigo-400', dot: 'bg-indigo-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', ring: 'ring-orange-400', dot: 'bg-orange-500' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', ring: 'ring-rose-400', dot: 'bg-rose-500' },
  gray: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', ring: 'ring-gray-400', dot: 'bg-gray-500' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700', ring: 'ring-teal-400', dot: 'bg-teal-500' },
}

const nodes = ref<WorkflowNode[]>([
  { id: 1, type: 'start', label: '开始', icon: Play, color: 'emerald', x: 80, y: 240 },
  { id: 2, type: 'input', label: '接收用户问题', icon: MessageSquare, color: 'blue', x: 280, y: 240, config: { timeout: '30s' } },
  { id: 3, type: 'intent', label: '意图识别', icon: Sparkles, color: 'pink', x: 500, y: 240, config: { model: 'GPT-4o' } },
  { id: 4, type: 'knowledge', label: '知识库检索', icon: Database, color: 'amber', x: 720, y: 140, config: { kb: '产品手册' } },
  { id: 5, type: 'tool', label: '查询订单', icon: Wrench, color: 'cyan', x: 720, y: 340, config: { tool: '订单系统' } },
  { id: 6, type: 'llm', label: '生成回答', icon: Bot, color: 'violet', x: 940, y: 240, config: { model: 'GPT-4o', temperature: '0.7' } },
  { id: 7, type: 'output', label: '返回结果', icon: Send, color: 'blue', x: 1160, y: 240 },
  { id: 8, type: 'end', label: '结束', icon: CheckCircle2, color: 'slate', x: 1340, y: 240 },
])

const selectedNodeId = ref<number | null>(3)
const selectedNode = computed(() => nodes.value.find((n) => n.id === selectedNodeId.value) || null)

const connections = ref([
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 3, to: 5 },
  { from: 4, to: 6 },
  { from: 5, to: 6 },
  { from: 6, to: 7 },
  { from: 7, to: 8 },
])

const canvasOffset = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, ox: 0, oy: 0 })
const isDraggingNode = ref(false)
const draggedNodeId = ref<number | null>(null)
const dragNodeStart = ref({ x: 0, y: 0, nx: 0, ny: 0 })

const canvas = ref<HTMLElement | null>(null)

const onCanvasMouseDown = (e: MouseEvent) => {
  if (tool.value === 'pan' || e.button === 1 || e.shiftKey) {
    isDragging.value = true
    dragStart.value = { x: e.clientX, y: e.clientY, ox: canvasOffset.value.x, oy: canvasOffset.value.y }
  }
}

const onNodeMouseDown = (e: MouseEvent, id: number) => {
  e.stopPropagation()
  selectedNodeId.value = id
  const node = nodes.value.find((n) => n.id === id)
  if (node) {
    isDraggingNode.value = true
    draggedNodeId.value = id
    dragNodeStart.value = { x: e.clientX, y: e.clientY, nx: node.x, ny: node.y }
  }
}

const onMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    canvasOffset.value = {
      x: dragStart.value.ox + (e.clientX - dragStart.value.x),
      y: dragStart.value.oy + (e.clientY - dragStart.value.y),
    }
  }
  if (isDraggingNode.value && draggedNodeId.value !== null) {
    const node = nodes.value.find((n) => n.id === draggedNodeId.value)
    if (node) {
      node.x = Math.max(0, dragNodeStart.value.nx + (e.clientX - dragNodeStart.value.x) / (zoom.value / 100))
      node.y = Math.max(0, dragNodeStart.value.ny + (e.clientY - dragNodeStart.value.y) / (zoom.value / 100))
    }
  }
}

const onMouseUp = () => {
  isDragging.value = false
  isDraggingNode.value = false
  draggedNodeId.value = null
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

const addNode = (type: NodeType) => {
  const newId = Math.max(0, ...nodes.value.map((n) => n.id)) + 1
  const offset = nodes.value.length * 20
  nodes.value.push({
    id: newId,
    type: type.type,
    label: type.label,
    icon: type.icon,
    color: type.color,
    x: 200 + offset,
    y: 400 + offset,
  })
  selectedNodeId.value = newId
}

const removeNode = () => {
  if (selectedNodeId.value === null) return
  nodes.value = nodes.value.filter((n) => n.id !== selectedNodeId.value)
  connections.value = connections.value.filter((c) => c.from !== selectedNodeId.value && c.to !== selectedNodeId.value)
  selectedNodeId.value = nodes.value[0]?.id || null
}

const findNode = (id: number) => nodes.value.find((n) => n.id === id)

const getNodeCenter = (id: number) => {
  const n = findNode(id)
  if (!n) return { x: 0, y: 0 }
  return { x: n.x + 100, y: n.y + 36 }
}

const getNodePath = (fromId: number, toId: number) => {
  const from = getNodeCenter(fromId)
  const to = getNodeCenter(toId)
  const dx = (to.x - from.x) * 0.5
  return `M ${from.x + 100} ${from.y} C ${from.x + 100 + Math.max(50, dx)} ${from.y}, ${to.x - Math.max(50, dx)} ${to.y}, ${to.x} ${to.y}`
}

const handleZoom = (delta: number) => {
  zoom.value = Math.max(40, Math.min(200, zoom.value + delta))
}

const handleSave = () => {
  alert(`工作流"${workflowName.value}"已保存(演示)`)
  router.push('/capabilities')
}

const handleRun = () => {
  isRunning.value = true
  setTimeout(() => {
    isRunning.value = false
    alert('运行完成(演示)')
  }, 1500)
}

const handleBack = () => {
  router.push('/capabilities')
}

const groupedPalette = computed(() => {
  const groups: Record<string, NodeType[]> = {}
  nodePalette.forEach((n) => {
    if (!groups[n.category]) groups[n.category] = []
    groups[n.category].push(n)
  })
  return groups
})
</script>

<template>
  <div class="-m-6 h-[calc(100vh-3.5rem)] flex flex-col bg-slate-50">
    <!-- 顶部工具栏 -->
    <div class="flex items-center justify-between border-b bg-white px-4 py-2.5 shrink-0">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="sm" @click="handleBack">
          <ArrowLeft class="h-4 w-4 mr-1" />
          返回
        </Button>
        <div class="h-5 w-px bg-slate-200" />
        <input
          v-model="workflowName"
          class="text-base font-semibold text-slate-800 bg-transparent border-none outline-none focus:bg-slate-50 rounded px-2 py-1 -ml-2"
        />
        <span class="text-xs text-slate-400">v1.2 · {{ nodes.length }} 节点 · {{ connections.length }} 连线</span>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Upload class="h-4 w-4 mr-1" />
          导入
        </Button>
        <Button variant="outline" size="sm">
          <Download class="h-4 w-4 mr-1" />
          导出
        </Button>
        <Button variant="outline" size="sm" :disabled="isRunning" @click="handleRun">
          <Play class="h-4 w-4 mr-1" />
          {{ isRunning ? '运行中...' : '试运行' }}
        </Button>
        <Button size="sm" @click="handleSave">
          <Save class="h-4 w-4 mr-1" />
          保存
        </Button>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧节点面板 -->
      <div class="w-60 border-r bg-white flex flex-col shrink-0">
        <div class="border-b px-4 py-3">
          <h3 class="text-sm font-semibold text-slate-700">节点库</h3>
          <p class="text-xs text-slate-400 mt-0.5">点击节点添加到画布</p>
        </div>
        <div class="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          <div v-for="(items, category) in groupedPalette" :key="category">
            <div class="text-xs font-medium text-slate-400 mb-2 px-1 uppercase tracking-wider">{{ category }}</div>
            <div class="space-y-1.5">
              <button
                v-for="node in items"
                :key="node.type"
                class="w-full flex items-center gap-2.5 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-left text-sm hover:border-blue-400 hover:shadow-sm transition-all"
                @click="addNode(node)"
              >
                <span
                  :class="[
                    'flex h-7 w-7 items-center justify-center rounded-md',
                    colorMap[node.color].bg,
                    colorMap[node.color].text,
                  ]"
                >
                  <component :is="node.icon" class="h-3.5 w-3.5" />
                </span>
                <span class="text-slate-700 text-xs font-medium">{{ node.label }}</span>
                <Plus class="ml-auto h-3.5 w-3.5 text-slate-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间画布 -->
      <div class="flex-1 relative overflow-hidden">
        <!-- 画布工具条 -->
        <div class="absolute left-1/2 top-3 z-10 -translate-x-1/2 flex items-center gap-1 rounded-lg border bg-white p-1 shadow-sm">
          <button
            :class="['rounded p-1.5 transition-colors', tool === 'select' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100']"
            @click="tool = 'select'"
            title="选择"
          >
            <MousePointer2 class="h-4 w-4" />
          </button>
          <button
            :class="['rounded p-1.5 transition-colors', tool === 'pan' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100']"
            @click="tool = 'pan'"
            title="拖拽"
          >
            <Hand class="h-4 w-4" />
          </button>
          <div class="h-5 w-px bg-slate-200 mx-1" />
          <button class="rounded p-1.5 text-slate-500 hover:bg-slate-100" @click="handleZoom(-10)" title="缩小">
            <ZoomOut class="h-4 w-4" />
          </button>
          <span class="text-xs font-medium text-slate-600 w-10 text-center">{{ zoom }}%</span>
          <button class="rounded p-1.5 text-slate-500 hover:bg-slate-100" @click="handleZoom(10)" title="放大">
            <ZoomIn class="h-4 w-4" />
          </button>
          <button class="rounded p-1.5 text-slate-500 hover:bg-slate-100" @click="zoom = 100" title="适配">
            <Maximize2 class="h-4 w-4" />
          </button>
        </div>

        <div
          ref="canvas"
          class="absolute inset-0 cursor-default"
          :class="tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : ''"
          @mousedown="onCanvasMouseDown"
        >
          <!-- 网格背景 -->
          <div
            class="absolute inset-0"
            :style="{
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: `${20 * (zoom / 100)}px ${20 * (zoom / 100)}px`,
              backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
            }"
          />

          <!-- 工作流画布 -->
          <div
            class="absolute"
            :style="{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom / 100})`,
              transformOrigin: '0 0',
            }"
          >
            <!-- 连线 SVG -->
            <svg
              class="absolute pointer-events-none"
              :width="1600"
              :height="900"
              :viewBox="`0 0 1600 900`"
              style="overflow: visible;"
            >
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                </marker>
                <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                </marker>
              </defs>
              <path
                v-for="(conn, i) in connections"
                :key="i"
                :d="getNodePath(conn.from, conn.to)"
                fill="none"
                stroke="#94a3b8"
                stroke-width="2"
                stroke-dasharray="0"
                marker-end="url(#arrow)"
              />
            </svg>

            <!-- 节点 -->
            <div
              v-for="node in nodes"
              :key="node.id"
              class="absolute select-none"
              :style="{ left: node.x + 'px', top: node.y + 'px' }"
              @mousedown="(e) => onNodeMouseDown(e, node.id)"
            >
              <div
                :class="[
                  'group flex items-center gap-2 rounded-lg border-2 bg-white px-3 py-2.5 shadow-sm cursor-pointer transition-all w-[200px]',
                  colorMap[node.color].border,
                  selectedNodeId === node.id ? `ring-2 ${colorMap[node.color].ring} shadow-md` : 'hover:shadow-md',
                ]"
              >
                <span
                  :class="[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                    colorMap[node.color].bg,
                    colorMap[node.color].text,
                  ]"
                >
                  <component :is="node.icon" class="h-4 w-4" />
                </span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-slate-800 truncate">{{ node.label }}</div>
                  <div class="text-[10px] text-slate-400 uppercase tracking-wider">{{ node.type }}</div>
                </div>
                <!-- 连接点 -->
                <div
                  v-if="node.type !== 'start'"
                  class="absolute -left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-white bg-slate-300"
                />
                <div
                  v-if="node.type !== 'end'"
                  class="absolute -right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-white bg-slate-300 group-hover:bg-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- 底部状态栏 -->
          <div class="absolute bottom-3 left-3 flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 shadow-sm text-xs text-slate-500">
            <span>画布: 1600 × 900</span>
            <span class="text-slate-300">|</span>
            <span>缩放: {{ zoom }}%</span>
            <span class="text-slate-300">|</span>
            <span>已选: {{ selectedNode ? selectedNode.label : '无' }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="w-72 border-l bg-white flex flex-col shrink-0">
        <div class="border-b px-4 py-3 flex items-center gap-2">
          <Settings class="h-4 w-4 text-slate-500" />
          <h3 class="text-sm font-semibold text-slate-700">节点配置</h3>
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="selectedNode">
            <div class="mb-4 flex items-center gap-2.5">
              <span
                :class="[
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  colorMap[selectedNode.color].bg,
                  colorMap[selectedNode.color].text,
                ]"
              >
                <component :is="selectedNode.icon" class="h-5 w-5" />
              </span>
              <div>
                <Input v-model="selectedNode.label" class="font-semibold" />
                <div class="text-xs text-slate-400 mt-1">类型: {{ selectedNode.type }}</div>
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <label class="text-xs font-medium text-slate-600 mb-1 block">描述</label>
                <textarea
                  v-model="workflowDesc"
                  rows="2"
                  class="w-full text-sm rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <template v-if="selectedNode.type === 'llm'">
                <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">模型</label>
                  <select class="w-full h-9 text-sm rounded-md border border-slate-200 px-3 outline-none focus:border-blue-500">
                    <option>GPT-4o</option>
                    <option>GPT-4 Turbo</option>
                    <option>Claude 3.5 Sonnet</option>
                    <option>通义千问 Max</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">温度 (Temperature)</label>
                  <input type="range" min="0" max="2" step="0.1" value="0.7" class="w-full" />
                  <div class="text-xs text-slate-500 mt-1">当前: 0.7</div>
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">系统提示词</label>
                  <textarea
                    rows="3"
                    placeholder="你是一个专业的..."
                    class="w-full text-sm rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  >你是一个专业的客服助手，请根据上下文回答用户问题。</textarea>
                </div>
              </template>

              <template v-else-if="selectedNode.type === 'knowledge'">
                <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">知识库</label>
                  <select class="w-full h-9 text-sm rounded-md border border-slate-200 px-3 outline-none focus:border-blue-500">
                    <option>产品手册</option>
                    <option>HR 政策库</option>
                    <option>财务制度库</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">召回数量</label>
                  <Input type="number" placeholder="3" />
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">相似度阈值</label>
                  <input type="range" min="0" max="1" step="0.05" value="0.7" class="w-full" />
                  <div class="text-xs text-slate-500 mt-1">当前: 0.70</div>
                </div>
              </template>

              <template v-else-if="selectedNode.type === 'tool'">
                <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">工具</label>
                  <select class="w-full h-9 text-sm rounded-md border border-slate-200 px-3 outline-none focus:border-blue-500">
                    <option>订单查询</option>
                    <option>用户查询</option>
                    <option>工单创建</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">输入参数</label>
                  <textarea
                    rows="3"
                    placeholder='{"order_id": "${input.order_id}"}'
                    class="w-full text-sm rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono resize-none"
                  ></textarea>
                </div>
              </template>

              <template v-else-if="selectedNode.type === 'condition'">
                <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">条件表达式</label>
                  <textarea
                    rows="2"
                    placeholder='${intent} == "查询订单"'
                    class="w-full text-sm rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono resize-none"
                  ></textarea>
                </div>
              </template>

              <template v-else>
                <div class="text-xs text-slate-400 italic">该节点暂无可配置项</div>
              </template>

              <div class="pt-3 border-t">
                <Button variant="destructive" size="sm" class="w-full" @click="removeNode">
                  <Trash2 class="h-3.5 w-3.5 mr-1" />
                  删除节点
                </Button>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-slate-400 text-sm py-10">
            <MousePointer2 class="h-8 w-8 mx-auto mb-2 text-slate-300" />
            点击画布中的节点进行配置
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
