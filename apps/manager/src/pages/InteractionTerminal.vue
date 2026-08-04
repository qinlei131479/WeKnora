<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Search, Plus, MonitorPlay, Bot, Trash, Settings2, Sparkles, 
  ArrowRight, Activity, Copy, Check, X, Send
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

interface TerminalItem {
  id: string
  name: string
  type: 'dingtalk' | 'wecom' | 'h5'
  typeName: string
  status: 'active' | 'draft'
  boundAgent: string
  boundAgentId?: string
  created: string
  avatarIcon: string
  avatarTitle: string
  avatarStyle: string
  terminalToken: string
  metrics: {
    messagesTotal: number
    latency: string
    successRate: string
  }
}

const INITIAL_TERMINALS: TerminalItem[] = [
  {
    id: 'term-1',
    name: 'IT智能行政问答助手',
    type: 'dingtalk',
    typeName: '钉钉机器人',
    status: 'active',
    boundAgent: 'IT互联网通识与运维问答大脑',
    boundAgentId: 'agent-1',
    created: '2026-05-12',
    avatarIcon: '⚡',
    avatarTitle: 'IT-BOT',
    avatarStyle: 'from-cyan-550 via-cyan-500 to-blue-600 shadow-cyan-500/10',
    terminalToken: 'tk_ding_it_0019284fa92x83',
    metrics: { messagesTotal: 2840, latency: '1.2s', successRate: '99.8%' }
  },
  {
    id: 'term-2',
    name: '企微HR政策智能问答',
    type: 'wecom',
    typeName: '企业微信机器人',
    status: 'active',
    boundAgent: 'HR招聘与简历初步核查筛选助手',
    boundAgentId: 'agent-2',
    created: '2026-05-29',
    avatarIcon: '🌱',
    avatarTitle: 'HR-BOT',
    avatarStyle: 'from-emerald-450 via-teal-500 to-emerald-650 shadow-emerald-500/10',
    terminalToken: 'tk_wecom_hr_029471abdf82h1',
    metrics: { messagesTotal: 1950, latency: '1.4s', successRate: '99.2%' }
  },
  {
    id: 'term-3',
    name: '智慧教学辅助智能体',
    type: 'h5',
    typeName: 'H5对话机器人',
    status: 'active',
    boundAgent: '媒体通识及内容一键生成大脑',
    boundAgentId: 'agent-3',
    created: '2026-05-30',
    avatarIcon: '🎓',
    avatarTitle: 'EDU-OS',
    avatarStyle: 'from-amber-450 via-orange-500 to-rose-500 shadow-amber-500/10',
    terminalToken: 'tk_h5_edu_98243105dfas9',
    metrics: { messagesTotal: 4120, latency: '0.8s', successRate: '100%' }
  },
  {
    id: 'term-4',
    name: '高级学习助手智能体',
    type: 'h5',
    typeName: 'H5对话机器人',
    status: 'active',
    boundAgent: '通用行政问答大脑_V1',
    boundAgentId: 'agent-4',
    created: '2026-06-01',
    avatarIcon: '🔮',
    avatarTitle: 'STUDY',
    avatarStyle: 'from-violet-500 via-indigo-500 to-purple-650 shadow-indigo-505/10',
    terminalToken: 'tk_h5_learn_39201a74dffae2',
    metrics: { messagesTotal: 830, latency: '1.1s', successRate: '99.5%' }
  },
  {
    id: 'term-5',
    name: '党团建设智能体',
    type: 'h5',
    typeName: 'H5对话机器人',
    status: 'active',
    boundAgent: '党团组织大纲知识大脑',
    boundAgentId: 'agent-5',
    created: '2026-06-03',
    avatarIcon: '⭐',
    avatarTitle: 'RED-ST',
    avatarStyle: 'from-red-650 via-rose-500 to-amber-500 shadow-red-500/10',
    terminalToken: 'tk_h5_red_02184920cd7aff',
    metrics: { messagesTotal: 1420, latency: '0.9s', successRate: '99.9%' }
  }
]

const router = useRouter()

const searchTerm = ref('')
const activeTab = ref<'all' | 'dingtalk' | 'wecom' | 'h5'>('all')
const terminals = ref<TerminalItem[]>([])
const copiedToken = ref<string | null>(null)

const sandboxTerminal = ref<TerminalItem | null>(null)
const chatMessages = ref<{ sender: 'user' | 'bot'; text: string }[]>([])
const chatInput = ref('')
const isTyping = ref(false)
const chatScrollRef = ref<HTMLDivElement | null>(null)

watch([chatMessages, isTyping], async () => {
  await nextTick()
  if (chatScrollRef.value) {
    chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
  }
})

onMounted(() => {
  const saved = localStorage.getItem('ai-studio-terminals-v3')
  if (saved) {
    try {
      terminals.value = JSON.parse(saved)
    } catch {
      terminals.value = INITIAL_TERMINALS
    }
  } else {
    localStorage.setItem('ai-studio-terminals-v3', JSON.stringify(INITIAL_TERMINALS))
    terminals.value = INITIAL_TERMINALS
  }
})

const handleDelete = (id: string) => {
  if (confirm('确定要删除此交互终端吗？(对应的智能体大脑配置不会受损)')) {
    const updated = terminals.value.filter(t => t.id !== id)
    terminals.value = updated
    localStorage.setItem('ai-studio-terminals-v3', JSON.stringify(updated))
  }
}

const handleCopy = async (token: string) => {
  await navigator.clipboard.writeText(token)
  copiedToken.value = token
  setTimeout(() => { copiedToken.value = null }, 1500)
}

const filtered = computed(() => {
  return terminals.value
    .filter(t => activeTab.value === 'all' || t.type === activeTab.value)
    .filter(t => t.name.toLowerCase().includes(searchTerm.value.toLowerCase()))
})

const totalLogsCount = computed(() => {
  return terminals.value.reduce((acc, curr) => acc + (curr.metrics?.messagesTotal || 0), 0)
})

const getScreenFace = (t: TerminalItem): string => {
  if (t.avatarTitle.includes('IT')) return '[o ‿ o]'
  if (t.avatarTitle.includes('HR')) return '^ ‿ ^'
  if (t.avatarTitle.includes('EDU')) return '۞ ‿ ۞'
  if (t.avatarTitle.includes('STUDY')) return '☄ ‿ ☄'
  if (t.avatarTitle.includes('RED') || t.name.includes('党团')) return '★ ‿ ★'
  return '• ‿ •'
}

const getStatusLights = (t: TerminalItem): string => {
  if (t.avatarTitle.includes('IT')) return 'bg-cyan-400'
  if (t.avatarTitle.includes('HR')) return 'bg-emerald-400'
  if (t.avatarTitle.includes('EDU')) return 'bg-amber-400'
  if (t.avatarTitle.includes('STUDY')) return 'bg-violet-400'
  if (t.avatarTitle.includes('RED') || t.name.includes('党团')) return 'bg-red-500'
  return 'bg-emerald-400'
}

const getSimulatedBotResponse = (terminalName: string, text: string): string => {
  const q = text.trim().toLowerCase()

  if (terminalName.includes('IT') || terminalName.toLowerCase().includes('it') || terminalName.includes('行政')) {
    if (q.includes('你好') || q.includes('hello') || q.includes('谁') || q.includes('介绍') || q.includes('您好')) {
      return '您好！我是行政IT智能保障专家。我已绑定基础审核安全大脑及IT运维专篇领域，可以为您秒级答复：电脑故障申报、网关密码、企业邮箱配置、打印机连接方式。请问您需要处理哪类业务？'
    }
    if (q.includes('网') || q.includes('wifi') || q.includes('网络') || q.includes('登录')) {
      return '当前公司主办公区域WiFi为「AIS-HQ-Office5G」，员工可使用预留的双因子域账号一键验证授权。访客则需点击自助前台屏幕生成专属的单日时效性动态访客认证密钥。'
    }
    if (q.includes('打印') || q.includes('打印机')) {
      return '中心办公区配备了高负荷双面黑白/彩色激光打印机。请直接在浏览器访问企业打印共享地址 http://print.local 自动加载端口驱动。3楼A仓侧及5楼茶水间背侧均配备了扫码自助打印站。'
    }
    return `【IT信息部】: 收到关于「${text}」的提问。正在通过内置的行政常理脑为您寻优。您可进一步反馈打印机连接故障、网关不通或VPN账户冻结。`
  }

  if (terminalName.includes('HR') || terminalName.toLowerCase().includes('hr') || terminalName.includes('人事') || terminalName.includes('政策')) {
    if (q.includes('你好') || q.includes('hello') || q.includes('谁') || q.includes('介绍') || q.includes('您好')) {
      return '您好！我是HR政策智能助手。专属的招聘、简历初审及劳动报酬政策大脑已装配完成。我能随时为您解释有关：带薪假扣减规则、年度体检福利、社保申报时间、加班调休补正等事项。有什么可以为您效劳？'
    }
    if (q.includes('假') || q.includes('请假') || q.includes('年假')) {
      return '根据公休国家规定，转正员工服务满1年后享有5天足额带薪年假。请至少提前2个工作日在企微「审批-请假申请」提起流转流程，提报时请务必填写工作紧急交接人。'
    }
    if (q.includes('公积金') || q.includes('社保') || q.includes('福利') || q.includes('保险')) {
      return '公司按全额基数为全员购买五险一金，公积金比例设置为高标准12%。每月15日为薪水足额结算发放及社保扣划时点。'
    }
    return `【人力资源服务中心】: 识别您的诉求为「${text}」，当前匹配的人事及员工手册章节为公考条例，您可以提问关于：假别划定、体检报销流程、社保公积金比例。`
  }

  if (terminalName.includes('教学') || terminalName.toLowerCase().includes('edu') || terminalName.includes('学校') || terminalName.includes('教授')) {
    if (q.includes('你好') || q.includes('hello') || q.includes('介绍') || q.includes('您好')) {
      return '您好！我是智慧教学辅助智能体终端。教学教研和提纲生成专属大脑已装在内部。我可以帮助您快速生成专业授课提纲、教改项目申报草案，或进行常规教学反馈分析。'
    }
    if (q.includes('课') || q.includes('提纲') || q.includes('教学')) {
      return '教学提纲已根据国家高等教育质量导则编译完毕。当前的DAG教学任务链可以通过系统左侧「能力流控」栏进行可视化追踪管理。'
    }
  }

  return `您好！我是终端 [${terminalName}] 的对话测试。我的后台参数及密文Token连接正常。虽然当前处于极简测试环境，但我已具备即时响应推理能力，很高兴能与您展开高效交互！`
}

const handleSendSuggested = (qs: string) => {
  if (!sandboxTerminal.value) return
  chatMessages.value = [...chatMessages.value, { sender: 'user', text: qs }]
  isTyping.value = true

  setTimeout(() => {
    const resp = getSimulatedBotResponse(sandboxTerminal.value!.name, qs)
    chatMessages.value = [...chatMessages.value, { sender: 'bot', text: resp }]
    isTyping.value = false
  }, 850)
}

const handleSendMessage = () => {
  if (!chatInput.value.trim() || !sandboxTerminal.value) return

  const userText = chatInput.value
  chatMessages.value = [...chatMessages.value, { sender: 'user', text: userText }]
  chatInput.value = ''
  isTyping.value = true

  setTimeout(() => {
    const resp = getSimulatedBotResponse(sandboxTerminal.value!.name, userText)
    chatMessages.value = [...chatMessages.value, { sender: 'bot', text: resp }]
    isTyping.value = false
  }, 850)
}

const closeSandbox = () => {
  sandboxTerminal.value = null
  chatMessages.value = []
  chatInput.value = ''
  isTyping.value = false
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 pb-12 font-sans">
    <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
      <div class="flex items-center gap-3">
        <div class="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/15 text-white animate-pulse">
          <MonitorPlay class="w-6 h-6 stroke-[2]" />
        </div>
        <div>
          <h1 class="text-2xl font-black tracking-tight text-slate-800">智能体交互终端</h1>
          <p class="text-xs text-slate-500 mt-1">负责管理与发布面向企业不同触角端（钉钉、企微、自主H5网页端、数字人主播）的渠道外壳，双向透传中台左右半脑的大脑神经元。</p>
        </div>
      </div>

      <router-link to="/terminals/new">
        <Button class="bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/15 px-5 h-11 rounded-xl font-bold border border-blue-600/20 text-xs">
          <Plus class="w-4 h-4 mr-1.5" /> 注册智能交互终端
        </Button>
      </router-link>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
      <div class="lg:col-span-4 relative">
        <Search class="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
        <Input 
          v-model="searchTerm"
          placeholder="搜索终端名称 / 绑定大脑 / Token..." 
          class="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-blue-600 font-medium"
        />
      </div>

      <div class="lg:col-span-8 flex flex-wrap items-center justify-between gap-4">
        <div class="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 font-semibold shadow-inner">
          <button
            v-for="tab in [{ id: 'all', label: '全部多端渠道' }, { id: 'dingtalk', label: '钉钉机器人' }, { id: 'wecom', label: '企业微信机器人' }, { id: 'h5', label: 'H5对话机器人' }]"
            :key="tab.id"
            @click="activeTab = tab.id as any"
            :class="[
              'px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/20' 
                : 'text-slate-500 hover:text-slate-800'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="flex gap-4 items-center text-[11px] text-slate-400 font-bold">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>已部署端口: <strong class="text-slate-700">{{ terminals.length }}</strong></span>
          </div>
          <span>•</span>
          <div class="flex items-center gap-1">
            <Activity class="w-3.5 h-3.5 text-indigo-500" />
            <span>中枢流控调度活跃</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card 
        v-for="t in filtered" 
        :key="t.id" 
        class="bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col justify-between"
      >
        <div class="relative p-6 flex flex-col sm:flex-row gap-6 items-start flex-1">
          <div class="flex flex-col items-center shrink-0 mx-auto sm:mx-0">
            <div :class="['relative w-32 h-32 shrink-0 rounded-2xl bg-gradient-to-tr', t.avatarStyle, 'p-1.5 shadow-xl group-hover:scale-105 transition-transform duration-300 flex flex-col justify-between overflow-hidden border border-white/20']">
              <div class="absolute top-0 inset-x-0 h-1/2 bg-white/10 skew-y-12 transform origin-top-left pointer-events-none" />
              
              <div class="flex justify-center -mt-1.5 relative z-10">
                <div class="w-2 h-4 rounded-full bg-slate-700 relative">
                  <span :class="['absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full', getStatusLights(t), 'animate-ping']" />
                  <span :class="['absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full', getStatusLights(t)]" />
                </div>
              </div>

              <div class="flex-1 rounded-xl bg-slate-950 p-2 flex flex-col justify-between border border-slate-800">
                <div class="flex justify-between items-center text-[7.5px] font-mono text-slate-500 scale-90 origin-top">
                  <span>SYS_READY</span>
                  <div class="flex gap-0.5">
                    <span :class="['w-1 h-1 rounded-full', getStatusLights(t)]" />
                    <span class="w-1 h-1 rounded-full bg-slate-700 animate-pulse" />
                  </div>
                </div>

                <div class="text-center font-mono font-black text-white text-[16px] tracking-tight py-1 filter drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]">
                  {{ getScreenFace(t) }}
                </div>

                <div class="text-center">
                  <span class="text-[7.5px] tracking-widest bg-white/10 px-1.5 py-0.5 rounded font-sans uppercase font-extrabold text-slate-300 inline-block max-w-[90px] truncate leading-none">
                    {{ t.avatarIcon }} {{ t.avatarTitle }}
                  </span>
                </div>
              </div>

              <span class="absolute bottom-1 right-1 flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
              </span>
            </div>

            <span class="mt-3.5 px-3 py-0.5 rounded-full inline-flex font-mono font-extrabold text-[10px] bg-slate-100 text-slate-650 border border-slate-200 shadow-sm">
              {{ t.typeName }}
            </span>
          </div>

          <div class="flex-1 flex flex-col justify-between h-full w-full">
            <div>
              <div class="flex justify-between items-start gap-4">
                <div>
                  <h3 class="font-black text-slate-800 text-lg tracking-tight group-hover:text-blue-600 transition-colors leading-snug">
                    {{ t.name }}
                  </h3>
                </div>
              </div>

              <div class="mt-3.5 bg-slate-50 p-2 text-xs rounded-xl border border-slate-150/80 flex items-center justify-between font-mono">
                <div class="truncate flex-1 pr-3">
                  <span class="text-slate-400 font-bold uppercase text-[9px] mr-1.5 bg-slate-200 px-1 py-0.2 rounded">Token</span>
                  <span class="text-slate-650 font-semibold select-all text-[11px]">{{ t.terminalToken }}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-6 w-6 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors shrink-0" 
                  @click="handleCopy(t.terminalToken)"
                  title="复制密钥"
                >
                  <Check v-if="copiedToken === t.terminalToken" class="w-3.5 h-3.5 text-emerald-500" />
                  <Copy v-else class="w-3.5 h-3.5 text-slate-500" />
                </Button>
              </div>

              <div class="mt-4 space-y-2.5">
                <div class="flex items-center gap-2">
                  <div class="w-12 text-[10px] font-bold text-slate-400 tracking-wider">基础</div>
                  <div class="flex-1 bg-blue-50/50 px-2.5 py-1.5 rounded-lg border border-blue-100 flex items-center justify-between text-blue-800 leading-none">
                    <span class="font-extrabold flex items-center gap-1 text-[11px]"><Sparkles class="w-3.5 h-3.5 text-blue-500 animate-pulse" /> 基础半脑</span>
                    <span class="text-[8.5px] bg-blue-100/80 text-blue-800 px-1.5 py-0.5 rounded uppercase font-extrabold font-mono">基座强绑定</span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <div class="w-12 text-[10px] font-bold text-slate-400 tracking-wider">业务</div>
                  <div class="flex-1 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between text-slate-800 leading-none">
                    <span class="font-extrabold flex items-center gap-1.5 text-[11px]"><Bot class="w-3.5 h-3.5 text-indigo-500" /> {{ t.boundAgent }}</span>
                    <span class="text-[8.5px] bg-indigo-50 text-indigo-750 px-1.5 py-0.5 rounded uppercase font-extrabold font-mono border border-indigo-100 text-indigo-805">业务装载</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
              <div class="text-[10px] text-slate-400 font-bold font-mono">调试就绪</div>

              <div class="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100" 
                  title="删除终端" 
                  @click="handleDelete(t.id)"
                >
                  <Trash class="w-4 h-4" />
                </Button>

                <router-link :to="`/terminals/${t.id}/edit`">
                  <Button 
                    variant="outline" 
                    class="h-8.5 text-xs font-semibold px-3 border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/10 active:scale-95 transition-all duration-150 bg-white shadow-sm rounded-lg"
                  >
                    <Settings2 class="w-3.5 h-3.5 mr-1" /> 参数配置
                  </Button>
                </router-link>

                <Button 
                  class="bg-indigo-600 hover:bg-indigo-700 text-white h-8.5 text-xs font-bold px-3.5 rounded-lg shadow-sm hover:shadow-md hover:shadow-indigo-500/10 active:scale-95 transition-all duration-150" 
                  @click="() => {
                    sandboxTerminal = t
                    chatMessages = [{ sender: 'bot', text: `您好！我是 [${t.name}]。我已经成功加载业务脑“${t.boundAgent}”与安全机制，现在可以使用极简测试环境开始调试我。请随便对我说些什么吧！` }]
                    chatInput = ''
                    isTyping = false
                  }"
                >
                  <ArrowRight class="w-3.5 h-3.5 mr-1" /> 对话测试
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div :class="['h-1.5 w-full bg-gradient-to-r', t.avatarStyle]" />
      </Card>
    </div>

    <div v-if="filtered.length === 0" class="py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed max-w-lg mx-auto w-full mt-6">
      <MonitorPlay class="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 class="text-slate-500 font-bold text-base">未搜索到相关触端设备</h3>
      <p class="text-xs text-slate-400 mt-1">您可以试着清空过滤搜索选项，或者点击右上角新增一个交互终端配置</p>
    </div>

    <Teleport to="body">
      <div v-if="sandboxTerminal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
        <div class="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-150 flex flex-col h-[580px] relative animate-scale-up">
          <div :class="['p-4 bg-gradient-to-tr', sandboxTerminal.avatarStyle, 'text-white flex justify-between items-center relative overflow-hidden shrink-0']">
            <div class="absolute top-0 inset-x-0 h-1/2 bg-white/10 skew-y-12 transform origin-top-left pointer-events-none" />
            <div class="flex items-center gap-3 relative z-10">
              <div class="w-10 h-10 rounded-xl bg-slate-950 p-0.5 border border-white/20 flex items-center justify-center shrink-0">
                <span class="text-sm">{{ sandboxTerminal.avatarIcon }}</span>
              </div>
              <div>
                <h3 class="font-extrabold text-sm leading-none">{{ sandboxTerminal.name }}</h3>
                <p class="text-[10px] text-white/80 font-mono tracking-wider flex items-center gap-1 mt-1 font-bold">
                  <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  在线调试测试
                </p>
              </div>
            </div>
            <button 
              @click="closeSandbox"
              class="p-1.5 rounded-lg bg-black/20 text-white hover:bg-black/35 transition-all text-xs font-bold leading-none shrink-0"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <div ref="chatScrollRef" class="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            <div v-for="(msg, idx) in chatMessages" :key="idx" :class="['flex', msg.sender === 'user' ? 'justify-end' : 'justify-start']">
              <div :class="[
                'max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed font-medium',
                msg.sender === 'user' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md shadow-blue-500/10 rounded-tr-none' 
                  : 'bg-white border border-slate-150 text-slate-800 shadow-sm rounded-tl-none'
              ]">
                {{ msg.text }}
              </div>
            </div>

            <div v-if="isTyping" class="flex justify-start">
              <div class="bg-white border border-slate-150 max-w-[80%] rounded-2xl p-3 text-xs text-slate-400 rounded-tl-none flex items-center gap-2">
                <span class="font-bold flex items-center gap-1">大脑搜索中</span>
                <span class="flex gap-1">
                  <span class="w-1 h-1 rounded-full bg-slate-400 animate-bounce" />
                  <span class="w-1 h-1 rounded-full bg-slate-400 animate-bounce delay-100" />
                  <span class="w-1 h-1 rounded-full bg-slate-400 animate-bounce delay-200" />
                </span>
              </div>
            </div>
          </div>

          <div class="px-4 py-2 bg-slate-100/50 border-t border-slate-100 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
            <button
              v-for="(qs, i) in ['你好，请介绍一下你自己', '请问企业WiFi密码是多少', '如何向系统申请请假流程', '怎么连接办公室打印机设备']"
              :key="i"
              type="button"
              @click="handleSendSuggested(qs)"
              class="shrink-0 text-[10.5px] font-bold text-slate-500 hover:text-indigo-600 bg-white hover:bg-indigo-50/50 px-3 py-1 rounded-full border border-slate-200 hover:border-indigo-200 transition-colors leading-none"
            >
              {{ qs }}
            </button>
          </div>

          <div class="px-4 py-2 bg-indigo-50/40 text-[9px] text-slate-400 border-t border-slate-100 flex items-center gap-2 font-semibold">
            <span class="bg-indigo-100 text-indigo-700 px-1 py-0.2 rounded font-mono">DEBUG</span>
            <span>数据安全通过测试底网脱敏；支持钉钉应答/企业微信工作流/数字人语义合成实时测试。</span>
          </div>

          <form @submit.prevent="handleSendMessage" class="p-3 bg-white border-t border-slate-150 flex gap-2 items-center shrink-0">
            <Input 
              v-model="chatInput"
              placeholder="在此输入测试问题，敲击回车发送..."
              class="flex-1 rounded-xl h-10 border-slate-200 focus-visible:ring-indigo-600 text-xs font-semibold pl-3"
              :disabled="isTyping"
            />
            <Button 
              type="submit" 
              :disabled="isTyping || !chatInput.trim()"
              class="h-10 w-10 p-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 flex items-center justify-center shrink-0"
            >
              <Send class="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
