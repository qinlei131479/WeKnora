<script setup lang="ts">
// import { ref, computed, onMounted } from 'vue'
import {
  Search, Plus, CheckCircle2, Bot, Loader2, MessageSquare, Trash,
  BrainCircuit, Settings2, Zap, Calendar, BookOpen, Database, Wrench,
  Cpu, Layers, Send
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DomainSidebar from '@/components/common/DomainSidebar.vue'
import { isDomainMatch, getFlatDomains } from '@/lib/domain-store'
import { getAgents, deleteAgent, type Agent } from '@/lib/agent-store'
import AgentForm from './AgentForm.vue'

const testAgent = ref<Agent | null>(null)
const message = ref('')
const chatLog = ref<{ role: 'user' | 'model'; content: string }[]>([])
const isTyping = ref(false)

const searchTerm = ref('')
const selectedDomain = ref('business')
const agents = ref<Agent[]>([])
const activeTab = ref<'business' | 'base'>('business')

onMounted(() => {
  agents.value = getAgents()
})

const getDomainLabel = (domainId: string) => {
  const flat = getFlatDomains()
  const found = flat.find((f) => f.id === domainId)
  return found ? found.label : '公共分类'
}

const handleTest = (agent: Agent) => {
  testAgent.value = agent
  chatLog.value = [
    { role: 'model', content: `你好，我是 "${agent.name}" 控制中枢。已加载完整特化业务半脑，我可以开始接收您的输入与指令。` },
  ]
  message.value = ''
}

const sendMessage = () => {
  if (!message.value.trim()) return
  const newLog = [...chatLog.value, { role: 'user' as const, content: message.value }]
  chatLog.value = newLog
  message.value = ''
  isTyping.value = true

  setTimeout(() => {
    chatLog.value = [
      ...newLog,
      {
        role: 'model',
        content: `[智能体大脑协同测试] 您好！左脑（基础通用半脑）已协助拦截并执行安全词过滤，右脑（特化业务半脑「${testAgent.value?.name}」）调用了大语言思考模型 [${testAgent.value?.model}]、专属知识库、外部API及定时任务。当前中枢网络延迟 14ms，解析运转一切良好！`,
      },
    ]
    isTyping.value = false
  }, 1100)
}

const handleDelete = (id: string) => {
  if (confirm('确定要删除该智能体大脑吗？对应的设备和终端关联可能受到影响。')) {
    deleteAgent(id)
    agents.value = getAgents()
  }
}

const filteredAgents = computed(() => {
  return agents.value.filter((agent: Agent) => {
    const isBase = agent.brainType === 'base'
    if (activeTab.value === 'base' && !isBase) return false
    if (activeTab.value === 'business' && isBase) return false

    if (selectedDomain.value !== 'all' && !isDomainMatch(agent.domain, selectedDomain.value)) return false
    if (searchTerm.value) {
      const term = searchTerm.value.toLowerCase()
      if (!agent.name.toLowerCase().includes(term) && !agent.description.toLowerCase().includes(term)) return false
    }
    return true
  })
})
</script>

<template>
  <my-page>
    <div class="h-full flex flex-col space-y-6 pb-8">
      <Dialog :open="!!testAgent" @update:open="(open: boolean) => !open && (testAgent = null)">
        <DialogContent :title="`测试大脑装配: ${testAgent?.name || ''}`" class="h-[600px] flex flex-col max-w-3xl">
          <div class="flex-1 overflow-y-auto mb-4 space-y-4 pr-1">
            <div v-for="(msg, i) in chatLog" :key="i"
              :class="['flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start']">
              <div v-if="msg.role === 'model'"
                class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Bot class="w-4.5 h-4.5" />
              </div>
              <div :class="[
                'p-3 rounded-lg max-w-[80%] text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/50 shadow-sm',
              ]">
                {{ msg.content }}
              </div>
              <div v-if="msg.role === 'user'"
                class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <span class="text-xs font-bold font-mono">U</span>
              </div>
            </div>
            <div v-if="isTyping" class="flex gap-3 justify-start">
              <div
                class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 shrink-0 border border-slate-200">
                <Loader2 class="w-4 h-4 animate-spin" />
              </div>
              <div
                class="p-3 rounded-lg bg-slate-50 text-slate-500 rounded-bl-none flex items-center gap-2 border border-slate-100">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                <span>大脑神经突触传递与大模型推理中...</span>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <Input placeholder="输入测试指令..." :model-value="message" @input="(e: string) => (message = e)"
              @keydown="(e: KeyboardEvent) => e.key === 'Enter' && sendMessage()" />
            <Button size="icon" class="shrink-0 bg-indigo-600 hover:bg-indigo-700 h-10 w-10 text-white"
              @click="sendMessage">
              <Send class="w-4.5 h-4.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div class="flex flex-col gap-4">
        <div class="flex bg-slate-100 p-1 rounded-xl w-max border border-slate-200/60 font-semibold shadow-inner">
          <button :class="[
            'px-6 py-2 rounded-lg text-sm font-bold transition-all',
            activeTab === 'business'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/30'
              : 'text-slate-500 hover:text-slate-700',
          ]" @click="activeTab = 'business'">
            业务半脑配置
          </button>
          <button :class="[
            'px-6 py-2 rounded-lg text-sm font-bold transition-all',
            activeTab === 'base'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/30'
              : 'text-slate-500 hover:text-slate-700',
          ]" @click="activeTab = 'base'">
            基础半脑配置
          </button>
        </div>

        <div v-if="activeTab === 'business'" class="flex items-center justify-between gap-4 flex-wrap">
          <div class="relative w-96 max-w-full">
            <Search class="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
            <Input placeholder="搜索业务大脑名称/描述/人设定位..."
              class="pl-10 h-11 bg-white rounded-xl border-slate-200 focus-visible:ring-blue-600"
              :model-value="searchTerm" @input="(e: string) => (searchTerm = e)" />
          </div>
          <Button v-if="selectedDomain === 'business'" disabled
            class="bg-slate-200 text-slate-400 font-bold cursor-not-allowed h-11 px-5 rounded-xl border border-slate-300">
            <Plus class="mr-2 h-4 w-4" />
            请先在下方左侧选择特定业务分类
          </Button>
          <router-link v-else :to="`/agents/new?domain=${selectedDomain}`">
            <Button
              class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-11 px-5 rounded-xl shadow-md shadow-blue-500/10">
              <Plus class="mr-2 h-4 w-4" />
              新建业务半脑
            </Button>
          </router-link>
        </div>
      </div>

      <div v-if="activeTab === 'base'"
        class="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-2">
        <AgentForm :is-base="true" />
      </div>

      <div v-else class="flex flex-1 gap-6 min-h-0 flex-col lg:flex-row">
        <div
          class="w-full lg:w-56 shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-fit">
          <DomainSidebar v-model="selectedDomain" root-domain-id="business" root-label="全部业务脑" />
        </div>

        <div class="flex-1 overflow-y-auto space-y-6 pr-1 font-sans">
          <div v-if="filteredAgents.length === 0"
            class="py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
            <BrainCircuit class="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
            <p class="font-bold text-slate-600">当前分类下暂无已注册的业务半脑</p>
            <p class="text-xs text-slate-400 mt-1">您可以点击右上方按钮为此业务分类装载一个新的思考元</p>
          </div>

          <div v-for="(agent, i) in filteredAgents" :key="agent.id || i"
            class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all duration-300 relative overflow-hidden group">
            <div
              class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50/40 to-transparent rounded-bl-full opacity-80 pointer-events-none transition-transform duration-500 group-hover:scale-105">
            </div>
            <div
              class="absolute top-3 right-3 text-slate-300 opacity-20 pointer-events-none group-hover:opacity-30 transition-all duration-500 group-hover:rotate-6">
              <BrainCircuit class="w-24 h-24 stroke-[1]" />
            </div>

            <div class="flex flex-col xl:flex-row gap-8 relative z-10">
              <div class="w-full xl:w-[35%] flex flex-col justify-between">
                <div>
                  <div class="flex justify-between items-start mb-4">
                    <div class="flex gap-4 items-center">
                      <div
                        class="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform">
                        <span class="relative z-10">{{ agent.name.substring(0, 1) }}</span>
                        <span class="absolute inset-0 bg-white/10 animate-pulse"></span>
                      </div>
                      <div>
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                          <h3
                            class="text-base font-extrabold text-slate-800 tracking-tight group-hover:text-indigo-650 transition-colors">
                            {{ agent.name }}</h3>
                          <span v-if="agent.status === '已发布'"
                            class="flex items-center text-emerald-605 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                            <CheckCircle2 class="w-3 h-3 mr-1 text-emerald-500" /> 已装配生效
                          </span>
                        </div>
                        <div class="flex items-center gap-2 text-[11px] text-slate-500 font-medium font-mono">
                          <span class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {{ getDomainLabel(agent.domain) }}
                          </span>
                          <span>•</span>
                          <span class="truncate">Creator: {{ agent.creator }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p
                    class="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Layers class="w-3.5 h-3.5" /> 专属业务半脑规格书
                  </p>
                  <p class="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-6 font-medium">
                    {{ agent.description }}
                  </p>
                </div>

                <div class="mt-6 flex items-center gap-3">
                  <Button
                    class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-9 shrink-0 font-bold text-white text-xs px-4 rounded-xl shadow-md shadow-indigo-600/10"
                    @click="handleTest(agent)">
                    <MessageSquare class="w-3.5 h-3.5 mr-1.5" />
                    对话测试
                  </Button>
                  <router-link :to="`/agents/edit/${agent.id}`" class="flex-1">
                    <Button variant="outline"
                      class="h-9 w-full border-slate-200 hover:bg-slate-50 text-slate-700 bg-white font-bold text-xs rounded-xl">
                      <Settings2 class="w-3.5 h-3.5 mr-1.5" />
                      参数配置
                    </Button>
                  </router-link>
                </div>
              </div>

              <div class="hidden xl:block w-px bg-slate-100 my-2"></div>

              <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  class="col-span-2 bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden group/card hover:border-indigo-200 transition-colors bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-50/10 via-slate-50 to-slate-50">
                  <div class="flex items-center gap-2 text-slate-500 mb-2.5">
                    <Cpu class="w-4 h-4 text-indigo-500 animate-pulse" />
                    <span class="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">大模型思考引擎</span>
                  </div>
                  <div class="text-slate-800 font-extrabold text-base mb-1 truncate">{{ agent.model }}</div>
                  <span class="text-[10px] text-indigo-600 font-black flex items-center gap-1 mt-0.5">
                    🧠 异构思维并发量：350 tok/s
                  </span>
                </div>

                <div
                  class="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-center items-center text-center group/card hover:border-amber-300 transition-colors">
                  <Zap class="w-4.5 h-4.5 text-amber-500 mb-1 animate-pulse" />
                  <div class="text-xl font-bold text-slate-800 leading-none mb-1 font-mono">{{
                    agent.config?.capabilityCount || 0 }}</div>
                  <div class="text-[9px] text-slate-400 font-bold tracking-wide uppercase">专享能力工作流</div>
                </div>

                <div
                  class="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-center items-center text-center group/card hover:border-purple-300 transition-colors">
                  <Calendar class="w-4.5 h-4.5 text-purple-500 mb-1" />
                  <div class="text-xl font-bold text-slate-800 leading-none mb-1 font-mono">{{ agent.config?.taskCount
                    || 0 }}</div>
                  <div class="text-[9px] text-slate-400 font-bold tracking-wide uppercase">挂载自动任务</div>
                </div>

                <div
                  class="col-span-2 md:col-span-4 bg-white border border-slate-150 shadow-inner rounded-xl p-4.5 flex gap-6 divide-x divide-slate-100 group/card hover:border-emerald-300 transition-colors justify-between">
                  <div class="flex-1 flex flex-col items-center justify-center">
                    <div class="flex items-center gap-1.5 text-slate-500 mb-1">
                      <BookOpen class="w-3.5 h-3.5 text-emerald-505 text-emerald-500" />
                      <span class="text-[10px] font-bold text-slate-500">专属知识库</span>
                    </div>
                    <div class="text-slate-805 font-extrabold font-mono text-[13px]">
                      <span class="text-base text-slate-800">{{ agent.config?.knowledgeCount || 0 }}</span>
                      <span class="text-[10px] text-slate-400 font-sans font-medium">个文档</span>
                    </div>
                  </div>
                  <div class="flex-1 flex flex-col items-center justify-center">
                    <div class="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Database class="w-3.5 h-3.5 text-indigo-500" />
                      <span class="text-[10px] font-bold text-slate-500">访问数据源</span>
                    </div>
                    <div class="text-slate-805 font-extrabold font-mono text-[13px]">
                      <span class="text-base text-slate-800">{{ agent.config?.dataCount || 0 }}</span>
                      <span class="text-[10px] text-slate-400 font-sans font-medium">个单元</span>
                    </div>
                  </div>
                  <div class="flex-1 flex flex-col items-center justify-center">
                    <div class="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Wrench class="w-3.5 h-3.5 text-rose-500" />
                      <span class="text-[10px] font-bold text-slate-500">绑定外设工具</span>
                    </div>
                    <div class="text-slate-805 font-extrabold font-mono text-[13px]">
                      <span class="text-base text-slate-800">{{ agent.config?.toolCount || 0 }}</span>
                      <span class="text-[10px] text-slate-400 font-sans font-medium">个组件</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  @click="handleDelete(agent.id)">
                  <Trash class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </my-page>
</template>
