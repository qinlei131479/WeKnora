<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  ArrowLeft, Save, MonitorPlay, Sparkles, Upload, Cpu, 
  KeyRound, Copy, Check
  // , Zap, Calendar, Shield, Trash, Plus, HelpCircle
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const router = useRouter()
const route = useRoute()
const id = route.params.id as string | undefined

const fileInputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)

const activeStep = ref<'shell' | 'brain' | 'credentials'>('shell')
const copiedToken = ref(false)
const avatarTab = ref<'preset' | 'custom'>('preset')
const searchQuery = ref("")
const isDropdownOpen = ref(false)

interface Agent {
  id: string
  name: string
  description: string
  status: string
  creator: string
  date: string
  mode: string
  model: string
  domain: string
  brainType?: 'base' | 'business'
  config: {
    knowledgeCount: number
    dataCount: number
    toolCount: number
    capabilityCount: number
    taskCount: number
  }
}

const agents = ref<Agent[]>([
  {
    id: "agent-1",
    name: "融媒体新闻稿智能编写助手",
    description: "专为融媒体行业定制的新闻稿初稿生成与事实核查机器人。对接每日央视热点与地方资讯库。",
    status: "已发布",
    creator: "张融媒",
    date: "2026-05-28 10:15:30",
    mode: "深度思考",
    model: "DeepSeek R1",
    domain: "biz-media-news",
    config: { knowledgeCount: 5, dataCount: 2, toolCount: 4, capabilityCount: 2, taskCount: 3 }
  },
  {
    id: "agent-2",
    name: "IPTV 智能内容推荐与运营助手",
    description: "根据用户收视数据和标签包进行电视内容企划推荐与编排，智能生成轮播频道运营策略。",
    status: "已发布",
    creator: "李视频",
    date: "2026-05-29 14:20:00",
    mode: "即时响应",
    model: "Gemini 1.5 Pro",
    domain: "biz-ott-iptv",
    config: { knowledgeCount: 3, dataCount: 5, toolCount: 2, capabilityCount: 4, taskCount: 1 }
  },
  {
    id: "agent-3",
    name: "HR 招聘与简历初步核查筛选助手",
    description: "专门进行校园招聘及社会招聘简历筛选、面试问题生成以及招聘分析报告。",
    status: "已保存",
    creator: "赵小姐",
    date: "2026-05-30 08:30:00",
    mode: "深度思考",
    model: "DeepSeek R1",
    domain: "biz-hr-recruit",
    config: { knowledgeCount: 2, dataCount: 1, toolCount: 1, capabilityCount: 3, taskCount: 2 }
  }
])

const AGENT_COMPREHENSIVE_DETAILS: Record<string, {
  workflows: { name: string; desc: string; callDetails: string; type: '工作流' | 'Skill' }[]
  knowledge: { name: string; desc: string; type: '知识库' }[]
  tools: { name: string; desc: string; type: '工具' }[]
  dataSources: { name: string; desc: string; type: '数据源' }[]
  tasks: { name: string; desc: string; type: '定时任务' }[]
  permissions: { type: string; name: string; detail: string }[]
}> = {
  "agent-1": {
    workflows: [
      { name: "融媒体文风对校流程", desc: "自动校验政务公文词汇纠偏、敏感错别字检测纠错并生成备选建议", callDetails: "调用: filterRules_v2 • 自动拦截1500+高敏政心字眼并安全加注", type: "工作流" },
      { name: "中文新闻初稿润色组件", desc: "分析上下文并提取新闻导语、核心摘要、美化成新华社文风笔调", callDetails: "执行: rewriteAgentText_v1.2 • 套用智慧新闻行业标准模板与语境", type: "Skill" }
    ],
    knowledge: [
      { name: "政务公文标准行文规范常识库", desc: "官方公文常用词汇、禁用语敏感词及官方编撰标准规则知识集合", type: "知识库" },
      { name: "地方融媒体舆情热点参考资料库", desc: "内含融媒体多维度行业知识点、高频常识答问与社论素材大盘", type: "知识库" }
    ],
    tools: [
      { name: "今日央视新闻API接口", desc: "实时拉取最近24小时重大评论、焦点播报及新闻联播主干文本", type: "工具" },
      { name: "全网热搜舆情动态捕捉器", desc: "每小时全自动聚合微博热搜、百度新闻的高热度舆情关键词", type: "工具" }
    ],
    dataSources: [
      { name: "融媒体中心本地内容推荐库 (PostgreSQL)", desc: "流式拉取已归档与审核中的草稿以防采编人员撞车冲突", type: "数据源" }
    ],
    tasks: [
      { name: "每日清晨 07:00 舆情资讯智能生成", desc: "执行 cron: 0 7 * * * • 主动拉取头条事件并整理成精简汇报草稿", type: "定时任务" }
    ],
    permissions: [
      { type: "部门", name: "融媒体文案部、总编校对办、宣传工作组", detail: "包含下属所有子级成员与协助岗位" },
      { type: "岗位", name: "内容主审专员、媒体运营主管", detail: "已匹配对应部门岗位体系" },
      { type: "用户组", name: "高敏政治红线核校特权用户组", detail: "享有安全拦截词快速核校跳过通道" }
    ]
  },
  "agent-2": {
    workflows: [
      { name: "收视大屏播放流智能编排机制", desc: "动态重构轮播频道播放序列、自适应高强度冷热度内容混插", callDetails: "调用: scheduleIPTV_v4 • 自适应各个地区终端的分辨率与机顶盒型号", type: "工作流" },
      { name: "个性收视人群大盘 analysis 算法", desc: "关联地区收视群年龄分布，高精度产出喜好和分类概率聚类", callDetails: "执行: generateTags_cluster_v3 • 热重载用户最近一周 of 喜好收视指纹", type: "Skill" }
    ],
    knowledge: [
      { name: "IPTV 观众典型收视画像特征分析库", desc: "不同省份与时段的观众点击指标、流向分布研究大纲", type: "知识库" },
      { name: "全国轮播频道标准排期规范模板库", desc: "规范轮播节目间隙、安全巡检机制及播放编栏标准格式指南", type: "知识库" }
    ],
    tools: [
      { name: "广电节目实时收视率监控API", desc: "实时获取当前全渠道机顶盒在线驻留、峰值以及切台平均周期", type: "工具" },
      { name: "全网高分影视资源情报爬虫", desc: "聚合豆瓣、微博新近上映或播出的热门作品受众口碑评分", type: "工具" }
    ],
    dataSources: [
      { name: "IPTV 广电系统联接总表大盘监控库 (Oracle)", desc: "对接全网设备心跳监控及状态表，实时回传收视热度原始信息", type: "数据源" }
    ],
    tasks: [
      { name: "每周五 17:00 收视周度大盘图表 analysis 自动生成", desc: "执行 cron: 0 17 * * 5 • 提炼全网节目收视峰值，发至运营看板", type: "定时任务" }
    ],
    permissions: [
      { type: "部门", name: "电视排片运营部、节目分发运维组、内容策划科", detail: "全员及所属各层级人员" },
      { type: "岗位", name: "排播调度主管、大屏分析总监", detail: "匹配运营线排期与调度对应岗级" },
      { type: "用户组", name: "IPTV数据大盘运维协同用户组", detail: "支持大屏同步生效与远程重载权限" }
    ]
  },
  "agent-3": {
    workflows: [
      { name: "HRBP 面谈流编排", desc: "自动建立离职面谈引导、反馈分析、敏感度安全预警话术树", callDetails: "调用: [{\"employeeId\": \"1002\"}] • 自适应输出对话大纲、离退面谈表", type: "工作流" },
      { name: "简历高精度结构化解析组件", desc: "深入识别多格式简历，完美打码并结构化核心技能 and 工作年限", callDetails: "执行: parseResumeAttachment • 直读本地附件文本通过大模型归纳输出为 JSON", type: "Skill" }
    ],
    knowledge: [
      { name: "核心要职胜任力标准与技能模型库", desc: "通用前端开发、产品经理、运营管理职位的技术能力分级考量指标", type: "知识库" },
      { name: "校园招聘主流名校及考纲基线知识库", desc: "针对重点直属院校毕业生初筛标准、学科优势分布与往届笔试淘汰概率", type: "知识库" }
    ],
    tools: [
      { name: "Boss直聘/猎聘接收消息直连外部件", desc: "即时抓取外部候选人最新投递流，一键发送初始邀约与预审考题", type: "工具" },
      { name: "Outlook 智能考官协作排期接口", desc: "交叉比对候选人与多位业务线负责人空闲历，自动化占用日程发送通知", type: "工具" }
    ],
    dataSources: [
      { name: "企业主干 HR-SaaS 数据库 (MySQL)", desc: "按部门最小限权只读读取员工主档情况、所属部门结构、职级审批现状", type: "数据源" }
    ],
    tasks: [
      { name: "工作日 18:30 简历统一解析提拔分发", desc: "执行 cron: 30 18 * * 1-5 • 合并当日新提交的通过简历卡片抄送对应岗位主管", type: "定时任务" }
    ],
    permissions: [
      { type: "部门", name: "人力资源部、招聘交付中心", detail: "所有成员及下属层级" },
      { type: "岗位", name: "招聘专员、HRBP团队主管", detail: "已匹配全局岗位体系" },
      { type: "用户组", name: "企业核心管理总办协作者组", detail: "全权支配候选人全流程交付与面谈协作" }
    ]
  }
}

const getFallbackDetails = (agent: any) => {
  const kmC = agent.config?.knowledgeCount || 0
  const tlC = agent.config?.toolCount || 0
  const cpC = agent.config?.capabilityCount || 0
  const dtC = agent.config?.dataCount || 0
  const tsC = agent.config?.taskCount || 0

  const workflows: { name: string; desc: string; callDetails: string; type: '工作流' | 'Skill' }[] = []
  for (let i = 0; i < Math.max(1, cpC); i++) {
    if (i === 0) {
      workflows.push({ name: `${agent.name} 主轴推理决策多级流`, desc: `管理及分发复杂会话应答路由`, callDetails: `调用: wf_main_${agent.id} • 执行全局指令映射、状态回溯与兜底处理`, type: '工作流' })
    } else {
      workflows.push({ name: `${agent.name} 场景对谈辅助组件 (Skill_0${i})`, desc: `处理特定的语义净化或对齐`, callDetails: `执行: skill_addon_0${i} • 根据参数进行数据安全格式清洗`, type: 'Skill' })
    }
  }

  const knowledge: { name: string; desc: string; type: '知识库' }[] = []
  for (let i = 0; i < kmC; i++) {
    knowledge.push({ name: `${agent.name} 专有业务融合知识库 (0${i + 1})`, desc: `针对本大模型应用场景导入的主干常识与特异业务操作规范汇编`, type: '知识库' })
  }

  const tools: { name: string; desc: string; type: '工具' }[] = []
  for (let i = 0; i < tlC; i++) {
    tools.push({ name: `联网通用 API 外接工具_${i + 1}`, desc: `联动第三方接口协助大模型终端进行联网实时抓取与校验计算`, type: '工具' })
  }

  const dataSources: { name: string; desc: string; type: '数据源' }[] = []
  for (let i = 0; i < dtC; i++) {
    dataSources.push({ name: `受权生产业务数据源Channel_${i + 1}`, desc: `完成特定物理数据源的行权限隔离抽取与多维度融合审计`, type: '数据源' })
  }

  const tasks: { name: string; desc: string; type: '定时任务' }[] = []
  for (let i = 0; i < tsC; i++) {
    tasks.push({ name: `周期性长效同步数据任务_${i + 1}`, desc: `在后台循环运行特定时间间隔的增量汇总、通知推送或检查`, type: '定时任务' })
  }

  const permissions: { type: string; name: string; detail: string }[] = [
    { type: "部门", name: `${agent.name || '通用智能体'} 业务对接常务组`, detail: "对应协作部门人员及下属范围" },
    { type: "岗位", name: "通用运营专业、业务校验负责人", detail: "已自动匹配各岗位身份白名单机制" },
    { type: "用户组", name: "端侧交互高频白名单限权用户群", detail: "赋予该智能体大脑交互终端可用特许权" }
  ]

  return { workflows, knowledge, tools, dataSources, tasks, permissions }
}

const form = reactive({
  name: "",
  type: "h5",
  boundAgentId: "",
  appKey: "",
  appSecret: "",
  webhook: "",
  avatarIcon: "🤖",
  avatarThemeId: "avatar_smart_blue",
  avatarTitle: "IT-BOT",
  customUploadedImage: "",
  terminalToken: ""
})

const selectedAgent = computed(() => agents.value.find(a => a.id === form.boundAgentId))
const selectedAgentDetails = computed(() => selectedAgent.value ? (AGENT_COMPREHENSIVE_DETAILS[selectedAgent.value.id] || getFallbackDetails(selectedAgent.value)) : null)

const groupedAgents = computed(() => {
  const map: Record<string, { label: string; items: Agent[] }> = {
    "biz-media-news": { label: "新闻与媒体通识类", items: [] },
    "biz-ott-iptv": { label: "企业视频运营类", items: [] },
    "biz-hr-recruit": { label: "人力资源招聘类", items: [] },
    "other": { label: "通用特化业务类", items: [] }
  }

  agents.value.filter(a => a.brainType !== 'base').forEach(agent => {
    const dom = agent.domain
    if (dom && map[dom]) {
      map[dom].items.push(agent)
    } else {
      map["other"].items.push(agent)
    }
  })

  return Object.entries(map).filter(([_, group]) => group.items.length > 0)
})

const activePresetTheme = computed(() => BUILTIN_ROBOTS.find(r => r.id === form.avatarThemeId) || BUILTIN_ROBOTS[0])

interface Robot {
  id: string
  name: string
  icon: string
  themeClass: string
  svg: any
}

const BUILTIN_ROBOTS: Robot[] = [
  {
    id: "avatar_smart_blue",
    name: "小智 (智能常识专家)",
    icon: "🤖",
    themeClass: "from-blue-600 via-indigo-600 to-indigo-805",
    svg: () => h('svg', { viewBox: '0 0 100 100', class: 'w-16 h-16' }, [
      h('defs', [
        h('linearGradient', { id: 'blue_bot_grad', x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, [
          h('stop', { offset: '0%', stopColor: '#4F46E5' }),
          h('stop', { offset: '100%', stopColor: '#06B6D4' })
        ])
      ]),
      h('rect', { x: '20', y: '25', width: '60', height: '50', rx: '15', fill: 'url(#blue_bot_grad)', stroke: '#ffffff', strokeWidth: '2.5' }),
      h('circle', { cx: '16', cy: '50', r: '6', fill: '#1E293B' }),
      h('circle', { cx: '84', cy: '50', r: '6', fill: '#1E293B' }),
      h('line', { x1: '50', y1: '25', x2: '50', y2: '12', stroke: '#4F46E5', strokeWidth: '3' }),
      h('circle', { cx: '50', cy: '10', r: '4', fill: '#06B6D4', class: 'animate-ping', style: { transformOrigin: '50% 10%' } }),
      h('circle', { cx: '50', cy: '10', r: '3', fill: '#ffffff' }),
      h('rect', { x: '28', y: '33', width: '44', height: '26', rx: '8', fill: '#020617' }),
      h('circle', { cx: '40', cy: '45', r: '4.5', fill: '#22D3EE' }),
      h('circle', { cx: '60', cy: '45', r: '4.5', fill: '#22D3EE' }),
      h('path', { d: 'M 44 52 Q 50 56 56 52', stroke: '#22D3EE', strokeWidth: '2', fill: 'none', strokeLinecap: 'round' })
    ])
  },
  {
    id: "avatar_wise_green",
    name: "小慧 (常理通识专家)",
    icon: "🔋",
    themeClass: "from-emerald-600 via-teal-650 to-emerald-805",
    svg: () => h('svg', { viewBox: '0 0 100 100', class: 'w-16 h-16' }, [
      h('defs', [
        h('linearGradient', { id: 'green_bot_grad', x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, [
          h('stop', { offset: '0%', stopColor: '#059669' }),
          h('stop', { offset: '100%', stopColor: '#10B981' })
        ])
      ]),
      h('rect', { x: '22', y: '22', width: '56', height: '52', rx: '20', fill: 'url(#green_bot_grad)', stroke: '#ffffff', strokeWidth: '2.5' }),
      h('circle', { cx: '16', cy: '48', r: '7', fill: '#34D399' }),
      h('circle', { cx: '84', cy: '48', r: '7', fill: '#34D399' }),
      h('ellipse', { cx: '50', cy: '12', rx: '12', ry: '5', stroke: '#10B981', strokeWidth: '2', fill: 'none' }),
      h('line', { x1: '50', y1: '22', x2: '50', y2: '15', stroke: '#FFFFFF', strokeWidth: '2' }),
      h('rect', { x: '30', y: '32', width: '40', height: '26', rx: '10', fill: '#000000' }),
      h('path', { d: 'M36,44 L39,44 L37.5,41 Z', fill: '#34D399' }),
      h('circle', { cx: '37.5', cy: '44', r: '2.5', fill: '#34D399' }),
      h('path', { d: 'M60,44 L63,44 L61.5,41 Z', fill: '#34D399' }),
      h('circle', { cx: '61.5', cy: '44', r: '2.5', fill: '#34D399' }),
      h('path', { d: 'M 46 51 Q 50 54 54 51', stroke: '#34D399', strokeWidth: '2', fill: 'none' })
    ])
  },
  {
    id: "avatar_creative_red",
    name: "小创 (党政思政专篇)",
    icon: "🔥",
    themeClass: "from-rose-600 via-red-500 to-amber-600",
    svg: () => h('svg', { viewBox: '0 0 100 100', class: 'w-16 h-16' }, [
      h('defs', [
        h('linearGradient', { id: 'red_bot_grad', x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, [
          h('stop', { offset: '0%', stopColor: '#E11D48' }),
          h('stop', { offset: '100%', stopColor: '#F59E0B' })
        ])
      ]),
      h('path', { d: 'M22,30 C22,22 40,16 50,16 C60,16 78,22 78,30 L74,60 C74,68 50,78 50,78 C50,78 26,68 26,60 Z', fill: 'url(#red_bot_grad)', stroke: '#ffffff', strokeWidth: '2.5' }),
      h('path', { d: 'M50,22 L51.5,25 L55,25 L52,27 L53,30 L50,28 L47,30 L48,27 L45,25 L48.5,25 Z', fill: '#FBBF24' }),
      h('path', { d: 'M32,38 L68,38 L64,58 L36,58 Z', fill: '#0F172A' }),
      h('ellipse', { cx: '43', cy: '47', rx: '5', ry: '3.5', fill: '#F59E0B' }),
      h('ellipse', { cx: '57', cy: '47', rx: '5', ry: '3.5', fill: '#F59E0B' }),
      h('line', { x1: '48', y1: '47', x2: '52', y2: '47', stroke: '#F59E0B', strokeWidth: '2' }),
      h('path', { d: 'M 45 53 T 50 54 T 55 53', stroke: '#FFFFFF', strokeWidth: '2', fill: 'none' })
    ])
  }
]

// const { h } = require('vue')

const handleImageFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    alert("上传失败：专属形象底图不能大于 2MB")
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    if (event.target?.result) {
      form.customUploadedImage = event.target.result as string
      avatarTab.value = 'custom'
    }
  }
  reader.readAsDataURL(file)
}

const handleCopyToken = () => {
  navigator.clipboard.writeText(form.terminalToken)
  copiedToken.value = true
  setTimeout(() => copiedToken.value = false, 2000)
}

const handleSave = () => {
  if (!form.name.trim()) {
    activeStep.value = 'shell'
    return alert("请先填写「1. 智能交互终端名称」")
  }
  if (!form.boundAgentId) {
    activeStep.value = 'brain'
    return alert("请选择对应的 业务 cerveau / 业务大脑配置")
  }

  const activeBuiltin = BUILTIN_ROBOTS.find(r => r.id === form.avatarThemeId) || BUILTIN_ROBOTS[0]
  const boundAgentName = agents.value.find(a => a.id === form.boundAgentId)?.name || "安全基础大脑"

  const saved = localStorage.getItem("ai-studio-terminals-v3")
  let list = saved ? JSON.parse(saved) : []

  let typeLabel = "H5对话机器人"
  if (form.type === "dingtalk") typeLabel = "钉钉机器人"
  else if (form.type === "wecom") typeLabel = "企业微信机器人"
  else if (form.type === "digital") typeLabel = "数字人外设终端"

  const dataObj = {
    id: id || "term-" + Math.random().toString(36).substr(2, 9),
    name: form.name.trim(),
    type: form.type,
    typeName: typeLabel,
    status: "active",
    boundAgent: boundAgentName,
    boundAgentId: form.boundAgentId,
    created: id ? (list.find((x: any) => x.id === id)?.created || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    avatarStyle: activeBuiltin.themeClass,
    avatarIcon: activeBuiltin.icon,
    avatarTitle: form.avatarTitle.trim() || activeBuiltin.name.substring(0, 3).toUpperCase(),
    customUploadedImage: form.customUploadedImage,
    terminalToken: form.terminalToken,
    appKey: form.appKey,
    appSecret: form.appSecret,
    webhook: form.webhook,
    metrics: id ? (list.find((x: any) => x.id === id)?.metrics || { messagesTotal: 120, latency: "1.1s", successRate: "100%" }) : { messagesTotal: 0, latency: "1.0s", successRate: "100%" }
  }

  if (id) {
    list = list.map((item: any) => item.id === id ? dataObj : item)
    alert("智能交互终端配置更新成功！")
  } else {
    list.push(dataObj)
    alert("智能交互终端注册成功！已将其安全集成至系统。")
  }

  localStorage.setItem("ai-studio-terminals-v3", JSON.stringify(list))
  router.push('/terminals')
}

const goToStep = (step: 'shell' | 'brain' | 'credentials') => {
  if (step === 'brain' || step === 'credentials') {
    if (!form.name.trim()) {
      alert("请先在第1步输入“终端专属名称”")
      activeStep.value = 'shell'
      return
    }
  }
  activeStep.value = step
}

const selectPresetAvatar = (robot: Robot) => {
  form.avatarThemeId = robot.id
  form.avatarIcon = robot.icon
  form.avatarTitle = robot.name.substring(0, 3).toUpperCase()
}

const selectAgent = (agent: Agent) => {
  form.boundAgentId = agent.id
  isDropdownOpen.value = false
  searchQuery.value = ""
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  if (!form.terminalToken) {
    form.terminalToken = "tk_h5_" + Math.random().toString(36).substr(2, 8) + "_" + Date.now().toString().substr(-6)
  }

  if (!id && agents.value.length > 0) {
    const firstBiz = agents.value.find(a => a.brainType !== 'base')
    if (firstBiz) {
      form.boundAgentId = firstBiz.id
    }
  }

  if (id) {
    const saved = localStorage.getItem("ai-studio-terminals-v3")
    if (saved) {
      try {
        const list = JSON.parse(saved)
        const found = list.find((item: any) => item.id === id)
        if (found) {
          let matchedThemeId = "avatar_smart_blue"
          if (found.avatarStyle?.includes("emerald")) {
            matchedThemeId = "avatar_wise_green"
          } else if (found.avatarStyle?.includes("red") || found.avatarStyle?.includes("rose")) {
            matchedThemeId = "avatar_creative_red"
          }

          Object.assign(form, {
            name: found.name || "",
            type: found.type || "h5",
            boundAgentId: found.boundAgentId || "",
            appKey: found.appKey || "",
            appSecret: found.appSecret || "",
            webhook: found.webhook || "",
            avatarIcon: found.avatarIcon || "🤖",
            avatarThemeId: matchedThemeId,
            avatarTitle: found.avatarTitle || "BOT",
            customUploadedImage: found.customUploadedImage || "",
            terminalToken: found.terminalToken || "tk_" + Math.random().toString(36).substring(2, 10)
          })
          avatarTab.value = found.customUploadedImage ? 'custom' : 'preset'
        }
      } catch (e) {
        console.error("Hydration error", e)
      }
    }
  }

  document.addEventListener("mousedown", handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside)
})
</script>

<template>
  <div class="h-full flex flex-col space-y-6 max-w-6xl mx-auto pb-16 font-sans">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
      <div class="flex items-center gap-3">
        <Button variant="outline" size="icon" @click="router.push('/terminals')" class="rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50">
          <ArrowLeft class="h-5 w-5 text-slate-600" />
        </Button>
        <div>
          <div class="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
            <span>终端触角中心</span>
            <span>/</span>
            <span>终端设备集成装配</span>
          </div>
          <h1 class="text-xl font-extrabold text-slate-800 tracking-tight mt-1">
            {{ id ? '修改智能体交互终端配置' : '注册并配置智能体交互终端' }}
          </h1>
        </div>
      </div>

      <div class="flex gap-2 shrink-0">
        <Button variant="outline" @click="router.push('/terminals')" class="h-10 px-4 rounded-xl border-slate-200 text-slate-700 font-bold bg-white text-xs">
          取消并返回
        </Button>
        <Button @click="handleSave" class="bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold shadow-md shadow-blue-500/10 px-5 h-10 rounded-xl text-xs">
          <Save class="w-4 h-4 mr-1.5" />
          保存并生效
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/50 shadow-inner">
      <button
        @click="activeStep = 'shell'"
        :class="['flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all', activeStep === 'shell' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/20' : 'text-slate-500 hover:text-slate-800']"
      >
        <div :class="['w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black font-mono', activeStep === 'shell' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600']">01</div>
        <span>外壳形象</span>
      </button>

      <button
        @click="goToStep('brain')"
        :class="['flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all', activeStep === 'brain' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/20' : 'text-slate-500 hover:text-slate-800']"
      >
        <div :class="['w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black font-mono', activeStep === 'brain' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600']">02</div>
        <span>智能体大脑</span>
      </button>

      <button
        @click="goToStep('credentials')"
        :class="['flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all', activeStep === 'credentials' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/20' : 'text-slate-500 hover:text-slate-800']"
      >
        <div :class="['w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black font-mono', activeStep === 'credentials' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600']">03</div>
        <span>通信通道与凭证密钥</span>
      </button>
    </div>

    <div class="min-h-[420px]" ref="dropdownRef">
      <div v-if="activeStep === 'shell'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-7 space-y-6">
          <Card class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
            <div>
              <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MonitorPlay class="w-4.5 h-4.5 text-blue-600 shrink-0" />
                终端触角形态定义
              </h2>
              <p class="text-[11px] text-slate-400 mt-1">设置本智能体外壳的前置呈现文本和挂载形态。</p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1.5">终端专属呈现名称 *</label>
                <Input 
                  placeholder="推荐如：智慧教学研究微校智能、高级行政工作保障..." 
                  v-model="form.name"
                  @change="()=>{}"
                  class="mmfk rounded-xl h-11 border-slate-200 focus-visible:ring-blue-600 font-medium text-xs pl-3"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1.5">对外多外设渠道挂载形态 *</label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div 
                    v-for="t in [{ id: 'dingtalk', label: '钉钉机器人', desc: '钉钉网页钩子与卡片' }, { id: 'wecom', label: '企业微信机器人', desc: '企业微信应用消息与对话' }, { id: 'h5', label: 'H5对话机器人', desc: '独立网页交互对话沙盒' }, { id: 'digital', label: '数字人互动终端', desc: '虚拟形象主播声音和合成' }]"
                    :key="t.id"
                    @click="form.type = t.id"
                    :class="['cursor-pointer border rounded-xl p-3 text-center transition-all flex flex-col justify-between h-20', form.type === t.id ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-350 hover:bg-slate-50/50']"
                  >
                    <div class="text-xs font-extrabold">{{ t.label }}</div>
                    <div class="text-[9px] text-slate-400 font-normal leading-tight mt-1">{{ t.desc }}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div class="lg:col-span-5 space-y-6">
          <Card class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
            <div>
              <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles class="w-4.5 h-4.5 text-amber-500 shrink-0" />
                终端专属形象
              </h2>
              <p class="text-[11px] text-slate-400 mt-1">设置本网络渠道终端在各类协同系统中的专属图标视觉。</p>
            </div>

            <div class="space-y-6">
              <div class="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200/65 rounded-2xl relative overflow-hidden">
                <div class="absolute top-2 left-2 text-[9px] font-mono text-slate-400">实时形象预览</div>
                
                <div class="relative">
                  <div v-if="form.customUploadedImage" class="w-24 h-24 rounded-2xl overflow-hidden border-4 border-indigo-400 shadow-xl relative group">
                    <img :src="form.customUploadedImage" alt="custom robot" class="w-full h-full object-cover" />
                    <button 
                      @click="form.customUploadedImage = ''"
                      class="absolute inset-0 bg-black/60 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                    >
                      清除自定义
                    </button>
                  </div>
                  <div v-else :class="['w-24 h-24 rounded-2xl bg-gradient-to-tr', activePresetTheme.themeClass, 'flex flex-col items-center justify-center shadow-2xl relative border-2 border-white/45 p-1']">
                    <component :is="activePresetTheme.svg" />
                  </div>

                  <span class="absolute bottom-0 right-0 flex h-4.5 w-4.5">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-4.5 w-4.5 bg-emerald-500 border-2 border-white"></span>
                  </span>
                </div>

                <div class="mt-4 text-center">
                  <div class="text-xs font-black text-slate-800 tracking-tight font-mono">{{ form.avatarTitle || "ZHI" }}</div>
                  <p class="text-[9px] text-slate-400 mt-0.5">挂载形态: {{ form.type === 'dingtalk' ? '钉钉端' : form.type === 'wecom' ? '企微端' : form.type === 'digital' ? '数字人端' : 'H5客户端' }}</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 font-semibold shadow-inner">
                  <button
                    type="button"
                    @click="avatarTab = 'preset'; form.customUploadedImage = ''"
                    :class="['flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all', avatarTab === 'preset' ? 'bg-white text-indigo-755 shadow-xs border border-slate-200/50' : 'text-slate-500 hover:text-slate-800']"
                  >
                    使用系统内置形象
                  </button>
                  <button
                    type="button"
                    @click="avatarTab = 'custom'; if (!form.customUploadedImage) fileInputRef?.click()"
                    :class="['flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all', avatarTab === 'custom' ? 'bg-white text-indigo-755 shadow-xs border border-slate-200/50' : 'text-slate-500 hover:text-slate-800']"
                  >
                    上传自定义形象
                  </button>
                </div>

                <div v-if="avatarTab === 'preset'" class="space-y-3">
                  <label class="block text-xs font-bold text-slate-650 flex items-center gap-1">
                    <Sparkles class="w-3.5 h-3.5 text-indigo-550 shrink-0" />
                    选择系统内置形象预设
                  </label>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      v-for="robot in BUILTIN_ROBOTS"
                      :key="robot.id"
                      @click="selectPresetAvatar(robot)"
                      :class="['p-2.5 border rounded-2xl flex flex-col items-center gap-1.5 transition-all text-xs font-bold shadow-3xs', form.avatarThemeId === robot.id ? 'border-indigo-650 bg-indigo-50/45 text-indigo-750 ring-2 ring-indigo-500/20 font-extrabold shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350 hover:bg-slate-50/50 font-normal']"
                    >
                      <span class="text-xl">{{ robot.icon }}</span>
                      <span class="text-[11px] tracking-tight">{{ robot.name }}</span>
                    </button>
                  </div>
                </div>

                <div v-else class="space-y-4">
                  <div class="text-[11px] text-slate-500 bg-slate-50/70 border border-slate-200/60 rounded-xl p-3 space-y-2 leading-relaxed font-sans shadow-3xs">
                    <div class="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                      <Upload class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>自定义底图规格要求</span>
                    </div>
                    <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-mono text-slate-600">
                      <div>推荐比例: <span class="text-slate-800 font-bold font-sans">1:1 (正方形)</span></div>
                      <div>推荐尺寸: <span class="text-slate-800 font-bold">≥ 200×200 px</span></div>
                      <div>支持格式: <span class="text-slate-800 font-bold font-sans">PNG, JPG, JPEG</span></div>
                      <div>大小限制: <span class="text-rose-600 font-bold font-sans">不超过 2MB</span></div>
                    </div>
                  </div>

                  <div 
                    @click="fileInputRef?.click()"
                    class="border border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/10 hover:bg-indigo-50/25 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group shadow-3xs"
                  >
                    <Upload class="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                    <div class="text-xs font-black text-indigo-950">点击选择本地图片上传</div>
                    <div class="text-[10px] text-slate-400 font-medium">支持正方形、透明背景PNG以获得更佳视觉形态</div>
                  </div>

                  <div v-if="form.customUploadedImage" class="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl text-[11px] text-slate-500 leading-normal font-sans font-medium flex items-center gap-2 shadow-3xs">
                    <Upload class="w-4 h-4 text-indigo-550 shrink-0" />
                    <span>您已上传了自定义底图。如需更换，可以点击上方虚线框重新选择，或者切回 [使用系统内置形象] 还原。</span>
                  </div>
                </div>
                
                <input 
                  type="file"
                  ref="fileInputRef"
                  @change="handleImageFileChange"
                  accept="image/*"
                  class="hidden"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div v-if="activeStep === 'brain'" class="space-y-6">
        <Card class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div class="relative">
            <label class="block text-xs font-black text-slate-800 mb-2 font-sans uppercase tracking-wider">
              选择业务半脑 *
            </label>
            <div class="flex gap-2 relative">
              <div class="relative flex-1">
                <button
                  type="button"
                  @click="isDropdownOpen = !isDropdownOpen"
                  class="w-full text-left text-xs font-bold border border-slate-200 hover:border-slate-350 rounded-xl p-3 bg-white h-11 text-slate-800 flex items-center justify-between shadow-xs transition-all"
                >
                  <span class="flex items-center gap-2 truncate">
                    <Cpu class="w-4 h-4 text-indigo-500 shrink-0" />
                    <span v-if="selectedAgent" class="truncate">
                      <span class="text-indigo-700 font-extrabold">{{ selectedAgent.name }}</span>
                      <span class="text-[10px] text-slate-400 font-normal font-mono ml-1.5">({{ selectedAgent.model }})</span>
                    </span>
                    <span v-else class="text-slate-400 font-medium">点击此处检索或输入筛选特定业务大脑...</span>
                  </span>
                  <span class="text-slate-400 text-[10px] shrink-0">▼</span>
                </button>

                <div v-if="isDropdownOpen" class="absolute left-0 right-0 mt-1.5 p-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto">
                  <div class="px-2 pb-2 pt-1 border-b border-slate-100 flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="输入业务脑名称或模型进行过滤..."
                      v-model="searchQuery"
                      class="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-medium"
                    />
                    <button 
                      v-if="searchQuery"
                      type="button"
                      @click="searchQuery = ''" 
                      class="text-[10px] text-zinc-400 hover:text-zinc-655 font-bold px-1"
                    >
                      重置
                    </button>
                  </div>
                  <div class="space-y-1 mt-1.5">
                    <template v-for="[key, group] in groupedAgents" :key="key">
                      <div v-if="group.items.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.model.toLowerCase().includes(searchQuery.toLowerCase()))">
                        <div class="text-[9.5px] font-bold text-indigo-600 bg-indigo-50/40 px-2 py-1 rounded-md mt-1 font-sans">
                          {{ group.label }}
                        </div>
                        <button
                          v-for="agent in group.items.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.model.toLowerCase().includes(searchQuery.toLowerCase()))"
                          :key="agent.id"
                          type="button"
                          @click="selectAgent(agent)"
                          :class="['w-full text-left text-xs rounded-lg p-2 flex items-center justify-between transition-colors', form.boundAgentId === agent.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700 font-medium']"
                        >
                          <span class="flex items-center gap-1.5 truncate">
                            <span>🧠</span> 
                            <span class="truncate">{{ agent.name }}</span>
                          </span>
                          <span class="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            {{ agent.model }}
                          </span>
                        </button>
                      </div>
                    </template>
                    <div v-if="!groupedAgents.some(([_, g]) => g.items.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.model.toLowerCase().includes(searchQuery.toLowerCase())))" class="text-center py-4 text-xs text-slate-400 font-medium">未搜索到匹配项</div>
                  </div>
                </div>
              </div>
              
              <Button v-if="selectedAgent" variant="outline" @click="form.boundAgentId = ''" class="h-11 px-3 border-slate-200 text-rose-500 rounded-xl font-bold text-xs shrink-0">
                解除绑定
              </Button>
            </div>
          </div>
        </Card>

        <Card class="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
          <div>
            <h3 class="text-xs font-black text-slate-800 tracking-wider uppercase font-sans flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              智能体大脑配置明细
            </h3>
          </div>

          <div class="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-2xs">
            <table class="w-full text-xs text-left border-collapse">
              <thead>
                <tr class="bg-slate-100 border-b border-slate-200 text-[11px]">
                  <th class="py-3.5 px-4 font-black text-slate-800 bg-slate-100 w-1/4 uppercase tracking-wider font-sans border-r border-slate-250 text-center">
                    核心功能维度
                  </th>
                  <th class="py-3.5 px-4 font-black text-slate-800 bg-slate-50/80 w-3/8 border-r border-slate-200/80 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-sky-400"></span>
                      <span>基础半脑（系统默认配置）</span>
                    </div>
                  </th>
                  <th class="py-3.5 px-4 font-black text-indigo-950 bg-indigo-50/50 w-3/8 text-center">
                    <div class="flex items-center justify-center gap-2 relative">
                      <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span>业务半脑</span>
                      <span v-if="selectedAgent" class="absolute right-3 text-[9px] font-mono font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md shrink-0">
                        ACTIVE
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-150 text-[11px]">
                <tr class="hover:bg-slate-50/20 transition-colors">
                  <td class="py-3.5 px-4 font-black text-slate-800 bg-slate-50 border-r border-slate-250 font-sans tracking-wide text-center">
                    人设
                  </td>
                  <td class="py-3.5 px-4 bg-[repeating-linear-gradient(-45deg,#fafafb,#fafafb_4px,#f1f5f9_4px,#f1f5f9_8px)] border-r border-slate-200/80 relative text-center">
                    <div class="flex items-center justify-center">
                      <div class="w-4 h-[1.5px] bg-slate-300 rounded"></div>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 text-slate-700 leading-relaxed font-semibold bg-indigo-50/5">
                    <div v-if="selectedAgent" class="bg-white/80 p-2.5 rounded-xl border border-indigo-100/50 shadow-3xs leading-relaxed text-slate-700">
                      {{ selectedAgent.description || "暂无特定指令，系统自动选用最优分析引擎应答" }}
                    </div>
                    <span v-else class="text-slate-400 italic font-sans font-medium">-- 未安装外部业务半脑 --</span>
                  </td>
                </tr>

                <tr class="hover:bg-slate-50/20 transition-colors">
                  <td class="py-3.5 px-4 font-black text-slate-800 bg-slate-50 border-r border-slate-250 font-sans tracking-wide text-center">
                    模型
                  </td>
                  <td class="py-3.5 px-4 bg-[repeating-linear-gradient(-45deg,#fafafb,#fafafb_4px,#f1f5f9_4px,#f1f5f9_8px)] border-r border-slate-200/80 relative text-center">
                    <div class="flex items-center justify-center">
                      <div class="w-4 h-[1.5px] bg-slate-300 rounded"></div>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 text-slate-705 leading-relaxed font-semibold bg-indigo-50/5">
                    <span v-if="selectedAgent" class="inline-flex items-center gap-1.5 font-mono text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-100 shadow-3xs">
                      <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      {{ selectedAgent.model }}
                    </span>
                    <span v-else class="text-slate-400 italic font-sans font-medium">-- 未配置 --</span>
                  </td>
                </tr>

                <tr class="hover:bg-slate-50/20 transition-colors">
                  <td class="py-3.5 px-4 font-black text-slate-800 bg-slate-50 border-r border-slate-250 font-sans tracking-wide text-center">
                    知识库
                  </td>
                  <td class="py-3.5 px-4 text-slate-600 border-r border-slate-200/80 leading-relaxed font-semibold bg-slate-100/10">
                    <div class="flex flex-wrap gap-1.5 p-1 justify-center">
                      <span class="inline-block bg-white text-slate-700 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold font-sans shadow-3xs">
                        📚 公开参考合规知识手册底座
                      </span>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 bg-indigo-50/5">
                    <div v-if="selectedAgent" class="flex flex-col gap-2 p-1 font-sans">
                      <div v-if="selectedAgentDetails?.knowledge && selectedAgentDetails.knowledge.length > 0">
                        <div v-for="(k, idx) in selectedAgentDetails.knowledge" :key="idx" class="flex flex-col border border-slate-100 bg-white p-2.5 rounded-xl shadow-3xs hover:border-indigo-100 transition-all text-left">
                          <div class="flex items-center gap-2">
                            <span class="text-[9.5px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0">
                              知识库
                            </span>
                            <span class="text-[11px] font-bold text-slate-800 break-words leading-tight">
                              《{{ k.name.replace(/《|》/g, '').replace(/\.(docx|xlsx|pdf|txt|csv|xls)$/i, '') }}》
                            </span>
                          </div>
                          <p class="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {{ k.desc }}
                          </p>
                        </div>
                      </div>
                      <span v-else class="text-slate-400 italic text-[11px] font-sans font-medium">未配接任何业务知识库</span>
                    </div>
                    <span v-else class="text-slate-400 italic font-sans font-medium">-- 未配置 --</span>
                  </td>
                </tr>

                <tr class="hover:bg-slate-50/20 transition-colors">
                  <td class="py-3.5 px-4 font-black text-slate-800 bg-slate-50 border-r border-slate-250 font-sans tracking-wide text-center">
                    数据源
                  </td>
                  <td class="py-3.5 px-4 border-r border-slate-200/80 bg-slate-100/10">
                    <div class="flex flex-wrap gap-1.5 p-1 justify-center">
                      <span class="inline-block bg-white text-slate-700 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold font-sans shadow-3xs">
                        🗄️ 系统底层行为合规性检测数据源
                      </span>
                      <span class="inline-block bg-white text-slate-700 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold font-sans shadow-3xs">
                        🗄️ 各终端操作日志审计存储库
                      </span>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 bg-indigo-50/5">
                    <div v-if="selectedAgent" class="flex flex-col gap-2 p-1 font-sans">
                      <div v-if="selectedAgentDetails?.dataSources && selectedAgentDetails.dataSources.length > 0">
                        <div v-for="(ds, idx) in selectedAgentDetails.dataSources" :key="idx" class="flex flex-col border border-slate-100 bg-white p-2.5 rounded-xl shadow-3xs hover:border-indigo-100 transition-all text-left">
                          <div class="flex items-center gap-2">
                            <span class="text-[9.5px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0">
                              数据源
                            </span>
                            <span class="text-[11px] font-bold text-slate-800 break-words leading-tight">
                              {{ ds.name }}
                            </span>
                          </div>
                          <p class="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {{ ds.desc }}
                          </p>
                        </div>
                      </div>
                      <span v-else class="text-slate-400 italic text-[11px] font-sans font-medium">无外部专有数据源</span>
                    </div>
                    <span v-else class="text-slate-400 italic font-sans font-medium">-- 未配置 --</span>
                  </td>
                </tr>

                <tr class="hover:bg-slate-50/20 transition-colors">
                  <td class="py-3.5 px-4 font-black text-slate-800 bg-slate-50 border-r border-slate-250 font-sans tracking-wide text-center">
                    工具
                  </td>
                  <td class="py-3.5 px-4 border-r border-slate-200/80 bg-slate-100/10">
                    <div class="flex flex-wrap gap-1.5 p-1 justify-center">
                      <span class="inline-block bg-white text-slate-700 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold font-sans shadow-3xs">
                        🛠️ 安全过滤、频次熔断防火墙组件
                      </span>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 bg-indigo-50/5">
                    <div v-if="selectedAgent" class="flex flex-col gap-2 p-1 font-sans">
                      <div v-if="selectedAgentDetails?.tools && selectedAgentDetails.tools.length > 0">
                        <div v-for="(t, idx) in selectedAgentDetails.tools" :key="idx" class="flex flex-col border border-slate-100 bg-white p-2.5 rounded-xl shadow-3xs hover:border-indigo-100 transition-all text-left">
                          <div class="flex items-center gap-2">
                            <span class="text-[9.5px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0">
                              工具
                            </span>
                            <span class="text-[11px] font-bold text-slate-800 break-words leading-tight">
                              {{ t.name }}
                            </span>
                          </div>
                          <p class="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {{ t.desc }}
                          </p>
                        </div>
                      </div>
                      <span v-else class="text-slate-400 italic text-[11px] font-sans font-medium">未挂载企业外接工具</span>
                    </div>
                    <span v-else class="text-slate-400 italic font-sans font-medium">-- 未配置 --</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div v-if="activeStep === 'credentials'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-7 space-y-6">
          <Card class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
            <div>
              <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                <KeyRound class="w-4.5 h-4.5 text-blue-600 shrink-0" />
                多端渠道物理/逻辑通信凭证
              </h2>
              <p class="text-[11px] text-slate-400 mt-1">
                钉钉或企业微信等平台级参数填写。针对H5网页，系统会自动分发终端独享的安全通信网络密件。
              </p>
            </div>

            <template v-if="['dingtalk', 'wecom'].includes(form.type)">
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1.5 font-sans">应用客户端标识 (AppKey / AgentId)</label>
                    <Input 
                      placeholder="钉钉 or 企微后台的应用 Key / Id" 
                      v-model="form.appKey"
                      class="rounded-xl h-10.5 border-slate-200 focus-visible:ring-blue-600 font-medium text-xs"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1.5 font-sans">多端凭密证书密文 (AppSecret / AccessToken)</label>
                    <Input 
                      type="password"
                      placeholder="应用对应的 AppSecret 私钥密文" 
                      v-model="form.appSecret"
                      class="rounded-xl h-10.5 border-slate-200 focus-visible:ring-blue-600 font-medium text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5 font-sans">异步推送 Webhook 地址 (钉钉/企微特定接收回调端)</label>
                  <Input 
                    placeholder="https://api.dingtalk.com/robot/send?access_token=..." 
                    v-model="form.webhook"
                    class="rounded-xl h-10.5 border-slate-200 font-mono text-xs focus-visible:ring-blue-600 pl-3"
                  />
                  <p class="text-[10px] text-slate-400 mt-1 font-bold">一旦设置该钩子，基础左脑的审核规则及右脑应答结果将异步推送该特定端点。</p>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="space-y-4">
                <div class="p-4 bg-blue-50/50 rounded-xl border border-blue-100/80 text-xs text-slate-600 leading-relaxed font-medium">
                  <span class="font-extrabold text-blue-900 flex items-center gap-1.5 mb-1 text-sm">
                    🎯 Web H5 沙盒无阻连机制
                  </span>
                  <p class="leading-relaxed font-normal">
                    对于 <strong>「H5网页对话端」</strong> 或 <strong>「数字人互动终端」</strong> 场景，无需填写繁琐多样的企微钉钉三方Secret。系统开箱自增一条长效通信线路，研发团队只需复制右侧生成的 <strong>"Terminal-Token"</strong> 并作为入参置于网页初始化脚本，就能立刻在网页中获取即时交互应答！
                  </p>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <div class="lg:col-span-5 space-y-6">
          <Card class="p-6 bg-slate-900 border border-slate-800 text-white relative overflow-hidden rounded-2xl shadow-xl">
            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full pointer-events-none" />
            
            <div class="space-y-4 relative z-10">
              <div>
                <h3 class="text-sm font-black text-slate-100 mt-1 flex items-center gap-1">
                  <KeyRound class="w-4 h-4 text-cyan-400" />
                  专属核心 Terminal-Token 密钥
                </h3>
              </div>

              <p class="text-[11px] text-slate-400 leading-relaxed font-sans font-normal">
                这是唯一的企业终端通信签名，用作该终端身份识别。不应泄漏此Token。
              </p>

              <div class="bg-black/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                <span class="text-[12px] text-emerald-400 font-extrabold tracking-wide select-all truncate flex-1 pr-3">
                  {{ form.terminalToken }}
                </span>
                <Button
                  type="button"
                  @click="handleCopyToken"
                  class="h-8 w-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white shrink-0 p-0 transition-all border border-slate-700"
                  title="点击复制密钥"
                >
                  <Check v-if="copiedToken" class="w-4 h-4 text-emerald-400" />
                  <Copy v-else class="w-4 h-4" />
                </Button>
              </div>

              <div v-if="copiedToken" class="text-center">
                <span class="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15 animate-bounce inline-block">
                  ✔ 密钥已成功复制，您可以直接在 H5 SDK 或代码里粘贴！
                </span>
              </div>

              <div class="border-t border-slate-800/80 pt-3 flex items-center gap-3">
                <div class="h-8.5 w-8.5 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <svg class="w-4.5 h-4.5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <div class="text-[10px] text-slate-400 font-medium leading-normal font-sans">
                  该通信节点默认在 Cloud Run 隔离区激活。协议底层选用 HTTPS 多端分行路由，最大支持 2,500 级高吞吐并发吞吐帧。
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>