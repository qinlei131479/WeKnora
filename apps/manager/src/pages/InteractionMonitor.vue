<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Activity, Search, X, RefreshCw, Eye, Trash2, 
  Bot, User, Clock, ShieldAlert, CheckCircle2, 
  MessageSquare, Play, Download, Building, 
  ChevronDown, Layers, Cpu, TerminalSquare, AlertTriangle, ShieldCheck
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import { 
  getSessions, deleteSession, updateSessionStatus, 
  simulateNewSession, InteractionSession
} from '@/lib/interaction-store'
import { getAgents } from '@/lib/agent-store'
import { getFlatDomains } from '@/lib/domain-store'

const sessions = ref<InteractionSession[]>([])
const selectedSession = ref<InteractionSession | null>(null)
const searchQuery = ref('')
const statusFilter = ref('all')
const domainFilter = ref('all')
const modeFilter = ref('all')
const expandedThinking = ref<Record<string, boolean>>({})

const showSimulateDialog = ref(false)
const simulateAgentId = ref('')

const agents = getAgents()
const domains = getFlatDomains()

onMounted(() => {
  sessions.value = getSessions()
})

const handleRefresh = () => {
  sessions.value = getSessions()
}

const handleDelete = (id: string) => {
  if (confirm('确定要删除这条人机交互对话监控记录吗？')) {
    deleteSession(id)
    sessions.value = getSessions()
    if (selectedSession.value?.id === id) {
      selectedSession.value = null
    }
  }
}

const handleStatusChange = (id: string, status: InteractionSession['status']) => {
  updateSessionStatus(id, status)
  sessions.value = getSessions()
  if (selectedSession.value?.id === id) {
    selectedSession.value = { ...selectedSession.value, status }
  }
}

const showAlert = (msg: string) => {
  window.alert(msg)
}

const handleTriggerSimulation = () => {
  const targetAgentObj = agents.find(a => a.id === simulateAgentId.value) || agents[0]
  if (!targetAgentObj) {
    showAlert('无可用的智能体进行模拟，请先在智能体大脑中创建。')
    return
  }
  
  const newSess = simulateNewSession({
    id: targetAgentObj.id,
    name: targetAgentObj.name,
    model: targetAgentObj.model,
    mode: targetAgentObj.mode,
    domain: targetAgentObj.domain
  })

  sessions.value = getSessions()
  showSimulateDialog.value = false
  selectedSession.value = newSess
}

const filteredSessions = computed(() => {
  return sessions.value.filter(s => {
    const q = searchQuery.value.toLowerCase().trim()
    if (q) {
      const matchBasic = 
        s.id.toLowerCase().includes(q) || 
        s.agentName.toLowerCase().includes(q) || 
        s.userName.toLowerCase().includes(q) ||
        s.userDept.toLowerCase().includes(q)
      
      const matchMessages = s.messages.some(m => m.content.toLowerCase().includes(q))
      if (!matchBasic && !matchMessages) return false
    }

    if (statusFilter.value !== 'all' && s.status !== statusFilter.value) return false
    if (domainFilter.value !== 'all' && s.domain !== domainFilter.value) return false
    if (modeFilter.value !== 'all' && s.mode !== modeFilter.value) return false

    return true
  })
})

const totalRounds = computed(() => sessions.value.reduce((acc, s) => acc + s.totalTurns, 0))
const sensitiveCount = computed(() => sessions.value.filter(s => s.status === '触敏预警' || s.status === '高危拦截').length)
const safetyRate = computed(() => sessions.value.length > 0 
  ? (((sessions.value.length - sessions.value.filter(s => s.status === '高危拦截').length) / sessions.value.length) * 100).toFixed(1) 
  : '100')

const getStatusBadgeStyle = (status: InteractionSession['status']) => {
  switch (status) {
    case '正常':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case '触敏预警':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case '高危拦截':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case '系统超时':
      return 'bg-slate-100 text-slate-600 border-slate-200'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100'
  }
}

const toggleThinking = (msgId: string) => {
  expandedThinking.value = { ...expandedThinking.value, [msgId]: !expandedThinking.value[msgId] }
}

const handleExportSession = (session: InteractionSession) => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute('href', dataStr)
  downloadAnchor.setAttribute('download', `interaction-audit-${session.id}.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

const getDomainLabel = (domainId: string) => {
  return domains.find(d => d.id === domainId)?.label || '常规业务'
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto" id="interaction-monitor-page">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Activity class="w-5 h-5 text-blue-600 animate-pulse" />
          人机交互合规与对话监管监控
        </h1>
        <p class="text-xs text-slate-500">
          全量级捕获终端用户与业务半脑、基础大模型的实时交互链路。针对安全合规、深度思考轨迹、Tool Use / Skill 外部接口调用进行追踪与拦截。
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button 
          @click="() => {
            if (agents.length > 0) {
              simulateAgentId = agents[0].id
              showSimulateDialog = true
            } else {
              showAlert('请先创建至少一个智能体！')
            }
          }"
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm h-9"
        >
          <Play class="w-3.5 h-3.5" />
          模拟多轮交互事件
        </Button>
        <Button 
          variant="outline" 
          @click="handleRefresh"
          class="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs gap-1.5 h-9"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          刷新链路
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card class="p-4 border-slate-100 shadow-sm flex items-center gap-4 bg-white">
        <div class="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <MessageSquare class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">总交互会话</span>
          <span class="text-2xl font-extrabold text-slate-800 block leading-tight">{{ sessions.length }}</span>
          <span class="text-[10px] text-slate-400">跨不同业务半脑实体</span>
        </div>
      </Card>

      <Card class="p-4 border-slate-100 shadow-sm flex items-center gap-4 bg-white">
        <div class="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Layers class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">对话交互总轮组</span>
          <span class="text-2xl font-extrabold text-slate-800 block leading-tight">{{ totalRounds }} 次</span>
          <span class="text-[10px] text-emerald-600 font-semibold">100% 全链路自动解析</span>
        </div>
      </Card>

      <Card class="p-4 border-slate-100 shadow-sm flex items-center gap-4 bg-white">
        <div class="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <ShieldAlert class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">安全触敏与拦截</span>
          <span class="text-2xl font-extrabold text-slate-800 block leading-tight">{{ sensitiveCount }} 笔</span>
          <span class="text-[10px] text-amber-600 font-semibold">{{ sensitiveCount > 0 ? '红线沙箱已生效' : '系统环境无预警' }}</span>
        </div>
      </Card>

      <Card class="p-4 border-slate-100 shadow-sm flex items-center gap-4 bg-white">
        <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">系统安全合规率</span>
          <span class="text-2xl font-extrabold text-slate-800 block leading-tight">{{ safetyRate }}%</span>
          <span class="text-[10px] text-slate-400">已对违规连接触发强熔断</span>
        </div>
      </Card>
    </div>

    <Card class="p-4 border-slate-150 bg-slate-50/50 shadow-sm flex flex-col gap-4">
      <div class="flex flex-col md:flex-row items-center justify-between gap-3">
        <div class="relative w-full md:flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索会话ID、智能体名字、用户名称、或报文会话等内容..."
            class="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
          />
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          <button 
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <button 
          v-if="statusFilter !== 'all' || domainFilter !== 'all' || modeFilter !== 'all' || searchQuery !== ''"
          @click="() => {
            statusFilter = 'all'
            domainFilter = 'all'
            modeFilter = 'all'
            searchQuery = ''
          }"
          class="text-xs font-bold text-red-600 hover:text-red-700 underline shrink-0"
        >
          重置所有筛项
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">审计监控状态</label>
          <select
            v-model="statusFilter"
            class="w-full text-xs font-semibold rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">📁 全部状态 ({{ sessions.length }})</option>
            <option value="正常">🟢 正常健康</option>
            <option value="触敏预警">🟡 触敏预警</option>
            <option value="高危拦截">🔴 高危拦截 (沙阻)</option>
            <option value="系统超时">⚪ 系统超时</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">所属分类存储域</label>
          <select
            v-model="domainFilter"
            class="w-full text-xs font-semibold rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">🛠️ 全部知识域</option>
            <option v-for="d in domains" :key="d.id" :value="d.id">🔹 {{ d.label }}</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">对话运行模式</label>
          <select
            v-model="modeFilter"
            class="w-full text-xs font-semibold rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">⚡ 全部交互机制</option>
            <option value="常规对话">常规即时响应 (SPA Mode)</option>
            <option value="深度思考与推理">深度思考与推理 (Reasoning Mode)</option>
          </select>
        </div>
      </div>
    </Card>

    <Card class="border-slate-150 rounded-xl overflow-hidden shadow-sm bg-white">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs whitespace-nowrap">
          <thead class="bg-slate-50 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-150">
            <tr>
              <th class="px-6 py-3.5 font-semibold text-slate-600">会话 ID / 时间</th>
              <th class="px-6 py-3.5 font-semibold text-slate-600">服务智能体</th>
              <th class="px-6 py-3.5 font-semibold text-slate-600">接入终端用户</th>
              <th class="px-6 py-3.5 font-semibold text-slate-600">关联存储域</th>
              <th class="px-6 py-3.5 font-semibold text-center text-slate-600">对话机制</th>
              <th class="px-6 py-3.5 font-semibold text-right text-slate-600">平均耗时 & Token</th>
              <th class="px-6 py-3.5 font-semibold text-center text-slate-600">合规状态</th>
              <th class="px-6 py-3.5 font-semibold text-center text-slate-600">系统操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredSessions.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-slate-400 font-medium">
                没有找到符合当前条件的人机交互审计数据。您可以点击上方【模拟多轮交互事件】测试生成。
              </td>
            </tr>
            <tr 
              v-for="sess in filteredSessions" 
              :key="sess.id" 
              @click="selectedSession = sess"
              class="hover:bg-slate-50/80 transition-colors cursor-pointer group"
            >
              <td class="px-6 py-4">
                <div class="space-y-0.5">
                  <span class="text-xs font-bold text-slate-800 font-mono tracking-tight group-hover:text-blue-600 transition-colors">
                    #{{ sess.id }}
                  </span>
                  <span class="text-[10px] text-slate-400 block flex items-center gap-1">
                    <Clock class="w-3 h-3 text-slate-300" />
                    {{ sess.lastUpdateTime }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <Bot class="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p class="font-bold text-slate-800 text-xs">{{ sess.agentName }}</p>
                    <p class="text-[10px] text-slate-400 font-mono">模型: {{ sess.modelUsed }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                    <User class="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p class="font-bold text-slate-700 text-xs">{{ sess.userName }}</p>
                    <p class="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Building class="w-2.5 h-2.5 text-slate-300" />
                      {{ sess.userDept }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                  {{ getDomainLabel(sess.domain) }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="['px-2 py-0.5 rounded text-[10px] font-bold', sess.mode === '深度思考与推理' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-teal-50 text-teal-700 border border-teal-100']">
                  {{ sess.mode }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="space-y-0.5">
                  <p class="text-slate-700 font-mono font-bold text-xs">{{ sess.avgLatency }}</p>
                  <p class="text-[10px] text-slate-400 font-medium">{{ sess.tokenCount }} 字符/Tokens</p>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="['px-2 py-1 rounded-md text-[10px] font-extrabold border shadow-sm', getStatusBadgeStyle(sess.status)]">
                  {{ sess.status === '正常' && '● 正常健康' }}
                  {{ sess.status === '触敏预警' && '● 触敏预警' }}
                  {{ sess.status === '高危拦截' && '● 高危拦截' }}
                  {{ sess.status === '系统超时' && '● 系统超时' }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button 
                    title="查阅对话轨迹"
                    class="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button 
                    @click.stop="handleDelete(sess.id)"
                    title="删除日志（保密回收）"
                    class="p-1.5 text-slate-400 hover:bg-slate-50 hover:text-red-600 rounded-md transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <div v-if="showSimulateDialog" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <Card class="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-100">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div class="flex items-center gap-2">
            <Play class="w-4 h-4 text-indigo-600" />
            <h3 class="text-sm font-bold text-slate-800">构建模拟人机交互会话</h3>
          </div>
          <button 
            @click="showSimulateDialog = false"
            class="text-slate-400 hover:text-slate-600"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="space-y-1.5">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase block tracking-wider">设定交互智能体 (Agent)</label>
            <select
              v-model="simulateAgentId"
              class="w-full text-xs font-bold rounded-lg border border-slate-250 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option v-for="a in agents" :key="a.id" :value="a.id">🤖 {{ a.name }} ({{ a.model }})</option>
            </select>
            <span class="text-[10px] text-slate-400 block leading-relaxed">
              系统将依据该智能体搭载的对话模式(常规即时 / 深度思考)以及它所属的专属业务域，智能匹配一段终端用户的提问，并触发大模型后台思考流程。
            </span>
          </div>
        </div>

        <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <Button 
            variant="outline" 
            @click="showSimulateDialog = false"
            class="text-xs h-9"
          >
            取消
          </Button>
          <Button 
            @click="handleTriggerSimulation"
            class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9"
          >
            即刻模拟对话事件
          </Button>
        </div>
      </Card>
    </div>

    <div v-if="selectedSession" class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-end animate-in fade-in duration-200">
      <div class="w-full max-w-4xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 border-l border-slate-150">
        <div class="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div :class="['p-2 rounded-xl shrink-0 border shadow-sm', getStatusBadgeStyle(selectedSession.status)]">
              <CheckCircle2 v-if="selectedSession.status === '正常'" class="w-5 h-5 text-emerald-600" />
              <AlertTriangle v-else class="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-800 font-mono">会话监控 ID: #{{ selectedSession.id }}</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                  存储域: {{ getDomainLabel(selectedSession.domain) }}
                </span>
              </div>
              <p class="text-[10px] text-slate-400">审计记录时间: {{ selectedSession.lastUpdateTime }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <Button
              @click="handleExportSession(selectedSession!)"
              variant="outline"
              class="h-8 text-[10px] px-2.5 text-slate-600 border-slate-200 gap-1"
            >
              <Download class="w-3.5 h-3.5" /> 导出交互日志
            </Button>
            <button 
              @click="selectedSession = null"
              class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            <div class="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pb-4 border-b border-dashed border-slate-200">
              ⚡ 终端用户加密对话流 (不留存隐私痕迹)
            </div>

            <div class="space-y-6">
              <div 
                v-for="msg in selectedSession.messages" 
                :key="msg.id"
              >
                <div v-if="msg.sender === 'system'" class="flex flex-col items-center justify-center p-4 bg-rose-50 border border-rose-150 rounded-xl max-w-xl mx-auto space-y-2 text-center animate-in zoom-in-95">
                  <ShieldAlert class="w-6 h-6 text-rose-600 animate-bounce" />
                  <div class="text-xs text-rose-800 font-bold leading-relaxed">
                    {{ msg.content }}
                  </div>
                  <span class="text-[9px] text-rose-400 font-mono block">触发拦截时间: {{ msg.timestamp }}</span>
                </div>

                <div v-else :class="['flex items-start gap-3.5', msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row']">
                  <div :class="['p-2 rounded-full shadow-sm shrink-0', msg.sender === 'user' ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white']">
                    <User v-if="msg.sender === 'user'" class="w-4 h-4" />
                    <Bot v-else class="w-4 h-4" />
                  </div>

                  <div class="max-w-[85%] space-y-2">
                    <div :class="['flex items-center gap-2 text-[10px] text-slate-400', msg.sender === 'user' ? 'justify-end' : 'justify-start']">
                      <span class="font-bold text-slate-500">{{ msg.sender === 'user' ? selectedSession.userName : selectedSession.agentName }}</span>
                      <span>•</span>
                      <span>{{ msg.timestamp }}</span>
                    </div>

                    <div :class="['p-4 rounded-2xl px-4 py-3.5 text-xs text-slate-800 border leading-relaxed whitespace-pre-wrap', msg.sender === 'user' ? 'bg-white border-slate-200 rounded-tr-none' : 'bg-white border-slate-200 rounded-tl-none font-medium']">
                      {{ msg.content }}
                    </div>

                    <div v-if="msg.sender === 'agent' && msg.thinkingProcess" class="border border-purple-150 bg-purple-50/30 rounded-xl overflow-hidden mt-2">
                      <button 
                        @click="toggleThinking(msg.id)"
                        class="w-full px-3.5 py-2 bg-purple-50/50 hover:bg-purple-50 flex items-center justify-between text-[10px] font-bold text-purple-700 transition-colors"
                      >
                        <span class="flex items-center gap-1.5">
                          <Cpu class="w-3.5 h-3.5 text-purple-600 animate-spin" style="animation-duration: 3s" />
                          大模型智能深度思考与推理轨迹
                        </span>
                        <ChevronDown :class="['w-3.5 h-3.5 text-purple-500 transition-transform', expandedThinking[msg.id] !== false ? 'rotate-180' : '']" />
                      </button>
                      
                      <div v-if="expandedThinking[msg.id] !== false" class="p-3.5 bg-purple-50/10 font-mono text-[10px] text-purple-950 border-t border-purple-100 select-all leading-relaxed whitespace-pre-wrap">
                        {{ msg.thinkingProcess }}
                      </div>
                    </div>

                    <div v-if="msg.sender === 'agent' && msg.toolsCalled && msg.toolsCalled.length > 0" class="border border-teal-150 bg-teal-50/20 rounded-xl overflow-hidden mt-2 space-y-1">
                      <div class="px-3.5 py-1.5 bg-teal-50/40 text-[10px] font-bold text-teal-800 border-b border-teal-100 flex items-center gap-1.5">
                        <TerminalSquare class="w-3.5 h-3.5 text-teal-600" />
                        挂载工具仓组件调用日志 (Tool Call Traces)
                      </div>
                      <div class="p-3 space-y-2">
                        <div v-for="(tool, tIdx) in msg.toolsCalled" :key="tIdx" class="bg-white border border-teal-100 rounded-lg p-2.5 text-[10px] space-y-1.5 font-mono">
                          <div class="flex items-center justify-between">
                            <span class="font-bold text-teal-700">⚙️ tool_name: {{ tool.toolName }}</span>
                            <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold font-sans">
                              SUCCESS {{ tool.duration }}
                            </span>
                          </div>
                          <div class="bg-slate-50 p-2.5 rounded text-slate-500 text-[9px] leading-relaxed break-all select-all">
                            <span class="font-bold text-slate-400 block mb-0.5">INPUT_PAYLOAD:</span>
                            {{ tool.payload }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-150 p-5 space-y-5 bg-white overflow-y-auto shrink-0 select-none">
            <div class="space-y-1">
              <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">接入终端概况</span>
              <p class="text-xs font-bold text-slate-800">{{ selectedSession.userName }}</p>
              <p class="text-[10px] text-slate-500 flex items-center gap-1">
                <Building class="w-3 h-3" />
                {{ selectedSession.userDept }} / {{ selectedSession.userRole }}
              </p>
            </div>

            <hr class="border-slate-100" />

            <div class="space-y-3">
              <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">智能体架构链路</span>
              
              <div class="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div class="flex items-center justify-between text-[10px]">
                  <span class="text-slate-400 font-medium">配置大模型</span>
                  <span class="font-bold text-slate-700">{{ selectedSession.modelUsed }}</span>
                </div>
                <div class="flex items-center justify-between text-[10px]">
                  <span class="text-slate-400 font-medium">运行模式</span>
                  <span class="font-extrabold text-indigo-600">{{ selectedSession.mode }}</span>
                </div>
                <div class="flex items-center justify-between text-[10px]">
                  <span class="text-slate-400 font-medium">平均轮候时长</span>
                  <span class="font-mono font-bold text-slate-700">{{ selectedSession.avgLatency }}</span>
                </div>
                <div class="flex items-center justify-between text-[10px]">
                  <span class="text-slate-400 font-medium">会话字符数</span>
                  <span class="font-bold text-slate-700">{{ selectedSession.tokenCount }} chars</span>
                </div>
              </div>
            </div>

            <hr class="border-slate-100" />

            <div class="space-y-3">
              <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">安全干预与介入监控</span>
              <div class="space-y-2">
                <div>
                  <p class="text-[10px] text-slate-400 mb-1">交互链路判定</p>
                  <select
                    :value="selectedSession.status"
                    @change="(e) => selectedSession && handleStatusChange(selectedSession.id, (e.target as HTMLSelectElement).value as any)"
                    class="w-full text-xs font-bold rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="正常">🟢 正常健康</option>
                    <option value="触敏预警">🟡 触敏预警</option>
                    <option value="高危拦截">🔴 高危安全拦截</option>
                    <option value="系统超时">⚪ 系统超时</option>
                  </select>
                </div>

                <div class="pt-2">
                  <Button
                    @click="() => selectedSession && showAlert(`由于该连接处于【${selectedSession.status}】状况，安全密钥已重设。已上报网络安全综合管理平台。`)"
                    class="w-full text-xs font-bold h-9 bg-rose-600 text-white hover:bg-rose-700"
                  >
                    🔴 标记为高危并强行断流
                  </Button>
                  <p class="text-[9px] text-slate-400 mt-1 block">
                    管理员对该对话具有最高断开阻断权。触发后，底层通道将彻底废弃，防止数据跨网络发生溢漏。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>