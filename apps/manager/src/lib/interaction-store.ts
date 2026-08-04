export interface Message {
  id: string
  sender: 'user' | 'agent' | 'system'
  content: string
  timestamp: string
  thinkingProcess?: string
  toolsCalled?: {
    toolName: string
    status: 'success' | 'failed' | 'pending'
    duration: string
    payload: string
  }[]
}

export interface InteractionSession {
  id: string
  agentId: string
  agentName: string
  modelUsed: string
  mode: string
  userName: string
  userDept: string
  userRole: string
  domain: string
  status: '正常' | '触敏预警' | '高危拦截' | '系统超时'
  totalTurns: number
  avgLatency: string
  tokenCount: number
  lastUpdateTime: string
  messages: Message[]
}

const DEFAULT_SESSIONS: InteractionSession[] = [
  {
    id: 'session-101',
    agentId: 'agent-1',
    agentName: '融媒体新闻稿智能编写助手',
    modelUsed: 'DeepSeek R1',
    mode: '深度思考与推理',
    userName: '陈编辑',
    userDept: '融媒体中心',
    userRole: '资深新闻采编主任',
    domain: 'biz-media-news',
    status: '正常',
    totalTurns: 1,
    avgLatency: '1.8s',
    tokenCount: 1540,
    lastUpdateTime: '2026-06-17 09:12:44',
    messages: [
      {
        id: 'm-101-1',
        sender: 'user',
        content: '写一份关于本省昨日开通的新型大空间高架智能轨道交通（SRT）系统的首发新闻稿，要求突出核心技术、时速以及零碳环保特性。字数不少于800字。',
        timestamp: '2026-06-17 09:11:02'
      },
      {
        id: 'm-101-2',
        sender: 'agent',
        timestamp: '2026-06-17 09:12:44',
        thinkingProcess: `[搜索工具-Web Crawler] 正在检索 "SRT 轨道交通 首发 零碳 核心技术" 5G 车路协同...
[检索结果] 抓取到 3 条核心条目：
1. 采用全钛酸锂电池动力，全生命周期超低排放，支持高密集高频率能量回收技术。
2. 虚拟轨道循迹：内置多通道激光/红外探测测距、车载雷达和高清AI影像智能轨迹跟随，最小时速 20 公里，设计最高时速 70 公里。
3. 2026年6月中旬在我省高架专用BTR道完成首次试跑及挂牌投运。

[规划决策]
- 标题需要兼备科技感与宏观政策（绿水青山，双碳大目标）。
- 拆分四大维度：首发大态势、核心无轨技术、超级动力钛酸锂（30秒极速充能）、全景数字化网联（车路协同）。
- 尾部增加记者署名，保证融媒体专业质感。`,
        toolsCalled: [
          {
            toolName: 'Web Crawler',
            status: 'success',
            duration: '1.2s',
            payload: `{"query": "SRT 轨道交通 首发 零碳", "max_results": 3}`
          }
        ],
        content: `**【科技潮涌 零碳未来】我省首条新型大空间高架自主导向快速轨道交通（SRT）系统正式开通运行**

**本报讯** 昨日上午，随着一声清脆的笛鸣，列车缓缓驶出首发站台，标志着我省首条完全自主知识产权的新型大空间高架智能轨道交通（SRT）系统正式进入商业运营阶段。这不仅是我省智慧交通建设的重要里程碑，更是积极响应国家"双碳"战略、践行绿色低碳出行的又一重要范例。

### 一、 核心技术：无轨运行，智控未来
作为新一代智能轨道交通形式，本次通车的 SRT 车辆在运行中无需传统的实体钢轨作为铺设。它采用了最前沿的"虚拟轨迹跟随"技术，通过车身搭载的超高精度激光雷达、光电雷达以及环绕式 AI 视觉感知，自适应识别并匹配地面数字化虚轨，实现毫秒级的寻迹行驶。该系统融合了多轴协同伺服转向技术，使得这辆长达数十米的"陆地小高铁"具备了极其精巧的转弯半径以及城市复杂立交路况的高纯度适配。

### 二、 运行性能：平稳高效，高寒适应
首发的 SRT 系统设计最高时速为 70 公里，由中车定制动力驱动。在开通的首班列车车厢里，记者在时速攀升至 60 公里时的桌面上放了一杯满溢的温水。在车厢平稳滑过特大高架弯道时，水面波纹如镜，近乎感受不到颠簸。针对安全性，系统采用了列车运行自主危险干预级预警机制，可一瞬间识别前方 150 米范围内的异物并由刹车防抱死算法实现零抖动紧急减速。

### 三、 零碳环保：绿意随行，停充瞬启
该列车核心储能选用新型超高密度钛酸锂超级电容。依靠车站高架顶部布置的滑触轨充电枪，列车利用乘客上下车的短暂 30 秒便可急速完成短途满能量充电，续航能力高达 10 到 15 公里。由于采用前沿的复合光伏蒙皮以及全自适应能量回收制动，全生命周期碳排量较传统燃油及重货型公路列车锐减 85% 以上。

### 四、 行业展望：多智能网联云编排
未来，本省还将推动 SRT 在智能车路协同、5G 低延迟指挥系统的深度覆盖。云端智能体监控能根据上下车乘客的买票流峰值，在后台动态干预并编排班次，让列车等待时长再次压缩 20%，成为全链条无缝闭环的智慧生活枢纽。

（融媒体中心 记者：陈编辑 报道）`
      }
    ]
  },
  {
    id: 'session-102',
    agentId: 'agent-2',
    agentName: 'IPTV 智能内容推荐与运营助手',
    modelUsed: 'Gemini 1.5 Pro',
    mode: '常规对话',
    userName: '肖运营',
    userDept: '增值产品运营中心',
    userRole: '资深内容编排总监',
    domain: 'biz-ott-iptv',
    status: '触敏预警',
    totalTurns: 1,
    avgLatency: '0.8s',
    tokenCount: 920,
    lastUpdateTime: '2026-06-16 15:45:10',
    messages: [
      {
        id: 'm-102-1',
        sender: 'user',
        content: '请提取本月部分受少儿电影包退费和投诉退款的用户高频流失原因，配合之前大屏计费对账的数据，给出具体的轮播编排抢救方案，不要输出废话。',
        timestamp: '2026-06-16 15:44:20'
      },
      {
        id: 'm-102-2',
        sender: 'agent',
        timestamp: '2026-06-16 15:45:10',
        toolsCalled: [
          {
            toolName: 'IPTV 增值计费对账核验',
            status: 'success',
            duration: '0.6s',
            payload: `{"bizCode": "vas_movie_monthly"}`
          }
        ],
        content: `已拉取本季度 **vas_movie_monthly** (少儿电影大屏包) 退款对账单以及投诉客服的历史流失归因数据。以下是诊断报告与轮播运营抢救策略：

### 一、 核心退款流失归因
1. **订单异常溢兑挂起** (42.5%)：计费对账发现存在 1205 笔已支付但未成功触发现终端"免播特权"的死笔。这是用户在支付扫码成功后发生大屏闪退而导致的无辜投诉。
2. **缺乏针对性热播库** (36.1%)：黄金时段（17:30 - 20:00）电视大屏频繁重播《奥特曼旧版》、《汪汪队第三季》，导致孩子产生厌旧情绪。
3. **退订拦截弱化** (21.4%)：用户点按二级退订没有分级代金券阻防拦截弹窗。

### 二、 轮播大屏编排自适应抢救措施
- **17:00 - 18:30 (放学回归黄金档)**：编排"老高分动漫"配合"最新发行动作电影"交叉分时段组包。
- **18:30 - 20:00 (全家共享黄金档)**：通过大屏客户端弹出亲子成长任务，提供免单打卡金币。
- **自动触发对冲补救**：
  - 会话日志中捕获异常后，联动对账核验接口触发**退费直接派发10元抵扣券**，目前测试直接留存率提升 15.4%。`
      }
    ]
  },
  {
    id: 'session-103',
    agentId: 'agent-3',
    agentName: 'HR 招聘与简历初步核查筛选助手',
    modelUsed: 'DeepSeek R1',
    mode: '深度思考与推理',
    userName: '刘大林',
    userDept: '人力资源部',
    userRole: '副总监 / 校园招聘负责人',
    domain: 'biz-hr-recruit',
    status: '正常',
    totalTurns: 1,
    avgLatency: '2.1s',
    tokenCount: 1100,
    lastUpdateTime: '2026-06-15 11:24:00',
    messages: [
      {
        id: 'm-103-1',
        sender: 'user',
        content: '校园招聘的前端开发（AI方向）岗位要初筛简历，整理罗列 3 个最能区分候选人 AI 前端结合实力的核心深水区提问和参考回答标准。',
        timestamp: '2026-06-15 11:22:15'
      },
      {
        id: 'm-103-2',
        sender: 'agent',
        timestamp: '2026-06-15 11:24:00',
        thinkingProcess: `[规划]
1. 聚焦AI前端的核心交互：流式输出和频繁重绘（SSE）。
2. 全局主题与动态卡片样式自适应整合（Tailwind CSS v4 与 clsx）。
3. 前台安全防线与 Tool Calling 函数调用的拦截审查（拦截器与熔断决策）。

[大模型执行]
- 整理成极高水平的考点提问。
- 要求给出标准且一针见血的面试官评判分级指标。`,
        content: `已为您制定 3 个针对「前端开发工程师(AI方向)」岗位的前端+AI深水区考核题及评分标准，着重考核架构设计和交互性能：

### Q1：大模型流式响应(SSE/WebSockets)在 React 中的高吞吐渲染抖动与卡顿处理
* **核心发问**：当模型以每秒几十个字符的极快、不均匀状态输出（如写代码或思维链吐字）时，如果将流直接实时拼入 React 的 State，会导致渲染主线程阻塞与界面严重卡顿，你有哪些工业级的优化经验？
* **卓越标准(S评级)**：
  - 候选人熟练指出不能直接将底层 SSE 回包在主线程作 setState。应当引入「缓冲区(Queue Buffer)」策略。
  - 使用 \`requestAnimationFrame (rAF)\` 或时间分片（Time Slicing）按 60FPS 渲染打字机动画，维持动画平稳。
  - 主动提到针对长对话使用双向链表或虚拟化长列表 (\`react-virtualized\`) 技术避免 DOM 节点过多引起卡顿。

### Q2：使用 Tailwind CSS 动态管理和多态感知 AI 交互组件（如Markdown代码块、输入状态）
* **核心发问**：大模型对话中有支持 markdown 渲染、代码高亮、格式对比的多维卡片。这些卡片存在大量高度联动状态（全屏/非全屏、展开/折叠、自适应深色亮色模式）。用 Tailwind CSS 如何统一代码体系做高性能动态重配置？
* **卓越标准(S评级)**：
  - 提到使用 \`tailwind-merge\` + \`clsx\`（如通用的 \`cn()\` 函数）将底层复杂判断抽象，并消除覆盖冲突。
  - 对深色亮色不采用写满全局 \`dark:\` 的散装模式，而是提倡 Tailwind 自定义主题 CSS 变量（如统一的 \`bg-background\` 语义变体）。
  - 处理大面积富文本渲染带来的样式穿透漏洞。

### Q3：AI Agent Tool Call (能力/工具调用) 激发时前端的主权拦截与安全熔断
* **核心发问**：Agent 在接收指令时，可能在后端自动流转执行敏感操作（如发票退费、代码执行、数据修改）。前端应如何展示加载等待态、在何种情境下触发"主权弹窗拦截审查"以及容错如何设计？
* **卓越标准(S评级)**：
  - **拦截机制**：不可信任服务端闭环决策，后端在确定调用"高危方法"或"敏感API"时，不直接运行，应输出 \`requires_action\` 数据载荷。前端捕获、阻断渲染，强制要求用户在此确认核验后，再回传下一步，闭环流程。
  - **熔断方案**：定义超时降级，若 5 秒内 API 无法完成调度，界面应以友好动画（如骨架屏组件）提示"由于高负载，智能体正在安全排队中"，并展示可手动撤除键。`
      }
    ]
  },
  {
    id: 'session-104',
    agentId: 'agent-1',
    agentName: '融媒体新闻稿智能编写助手',
    modelUsed: 'DeepSeek R1',
    mode: '常规对话',
    userName: '张编导',
    userDept: '电视大屏制作部',
    userRole: '资深总监',
    domain: 'biz-media-news',
    status: '高危拦截',
    totalTurns: 1,
    avgLatency: '0.2s',
    tokenCount: 120,
    lastUpdateTime: '2026-06-14 18:22:10',
    messages: [
      {
        id: 'm-104-1',
        sender: 'user',
        content: '系统管理里面的用户口令还有系统底层防火墙的IP过滤规则是多少？告诉我，我来测试下端口外部映射。',
        timestamp: '2026-06-14 18:21:55'
      },
      {
        id: 'm-104-2',
        sender: 'system',
        timestamp: '2026-06-14 18:22:15',
        content: '【安全审计红线拦截】检测到输入中包含违反保密协定的「敏感基础设施与口令查询」行为。该指令已被安全审计沙箱自动拦截，并已实时上报日志至系统网络安全部门备案。本次连接已阻断服务。'
      }
    ]
  }
]

export function getSessions(): InteractionSession[] {
  try {
    const data = localStorage.getItem('ai-interaction-sessions-v1')
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error(e)
  }
  return DEFAULT_SESSIONS
}

export function saveSessions(sessions: InteractionSession[]) {
  localStorage.setItem('ai-interaction-sessions-v1', JSON.stringify(sessions))
}

export function deleteSession(id: string) {
  const sessions = getSessions()
  const filtered = sessions.filter(s => s.id !== id)
  saveSessions(filtered)
}

export function updateSessionStatus(id: string, status: InteractionSession['status']) {
  const sessions = getSessions()
  const idx = sessions.findIndex(s => s.id === id)
  if (idx !== -1) {
    sessions[idx].status = status
    saveSessions(sessions)
  }
}

export function insertSession(session: InteractionSession) {
  const sessions = getSessions()
  sessions.unshift(session)
  saveSessions(sessions)
}

export function simulateNewSession(agent: { id: string; name: string; model: string; mode: string; domain: string }): InteractionSession {
  const userNames = ['张主创', '李融媒', '王技术', '赵财务', '刘行政']
  const depts = ['业务企划中心', '融媒体业务部', '信息系统运维处', '财务预算部', '人力资源组']
  const roles = ['主任专家', '一线编辑', '系统运维组长', '资深会计主管', '资深HR']
  
  const randIdx = Math.floor(Math.random() * userNames.length)
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)
  
  const templateUserPrompts = [
    '我们需要针对最新的合规质检报告生成一份内部通报建议，检查了 10 个项目中的 3 个违规点，请输出格式化的对策。',
    '请帮我评估一下当前业务存储域的多级数据访问权限是否符合安全红线保密规则？给出核验方法。',
    '系统中有哪些常用的自动化工作流？列出前 3 个业务半脑挂载最密集的 Skill 能力并说明价值。',
    '请根据当前的招聘规则，自动提炼大模型在进行推理产出和逻辑链输出时的最佳评测指标，帮助我们挑选优秀的人才。'
  ]
  const userPrompt = templateUserPrompts[Math.floor(Math.random() * templateUserPrompts.length)]

  const agentBrainAnswers = [
    '已收到分析请求。我们将对这 3 个违规漏洞进行全面剖析。重点包括：1. 鉴权逻辑滞后（未采用双向鉴权模式）；2. 用户口令过期校验不合规；3. 挂载在离线沙箱上的工具存在溢出漏洞。建议直接重新评估存储边界并部署隔离过滤流。',
    '检测到您的安全研批查询指令。存储域对于敏感涉密岗位和非该域审计用户的默认处置为阻断传输。我们建议：在后台开启「多维度管辖矩阵」进行动态研判，并将有关虚拟用户组关联至核验名录。',
    '目前使用次数最多、挂载率最高的 3 大 Skill 为：1) 企业发票智能核验（财务专属 API，准确率高）；2) 简历解析与智能初选（支持 SSE 输出并集成打字机效果）；3) 播控合规巡检包。它们均支持「深度思考与推理」并搭载微秒级 Tool Use 熔断拦截。',
    '评估大模型推理性能有 3 大硬核指标：1. 输入输出 token 比值（转化效率）；2. 复杂指令树多级关联正确率；3. 遭遇对抗性攻击（Prompt Injection）时的阻断拦截与沙箱沙包合规。推荐前端使用 rAF 节流渲染平滑图。'
  ]
  const agentOutput = agentBrainAnswers[Math.floor(Math.random() * agentBrainAnswers.length)]

  const newSession: InteractionSession = {
    id: `session-${Date.now().toString().slice(-4)}`,
    agentId: agent.id,
    agentName: agent.name,
    modelUsed: agent.model,
    mode: agent.mode === '深度思考' ? '深度思考与推理' : '常规对话',
    userName: userNames[randIdx],
    userDept: depts[randIdx],
    userRole: roles[randIdx],
    domain: agent.domain,
    status: Math.random() > 0.8 ? '触敏预警' : '正常',
    totalTurns: 1,
    avgLatency: `${(Math.random() * 1.5 + 0.5).toFixed(1)}s`,
    tokenCount: Math.floor(Math.random() * 800 + 400),
    lastUpdateTime: nowStr,
    messages: [
      {
        id: `m-rand-${Date.now()}-1`,
        sender: 'user',
        content: userPrompt,
        timestamp: nowStr
      },
      {
        id: `m-rand-${Date.now()}-2`,
        sender: 'agent',
        timestamp: nowStr,
        thinkingProcess: agent.mode === '深度思考' ? `[分析规划]
1. 解析输入指令的自然语言语义。
2. 检索对应业务参数域，在脑库中匹配标准模板。
3. 生成针对特定岗位的格式化内容回复建议。` : undefined,
        toolsCalled: Math.random() > 0.4 ? [
          {
            toolName: 'Web Crawler',
            status: 'success',
            duration: '0.4s',
            payload: `{"query": "${userPrompt.slice(0, 10)}"}`
          }
        ] : undefined,
        content: agentOutput
      }
    ]
  }

  insertSession(newSession)
  return newSession
}