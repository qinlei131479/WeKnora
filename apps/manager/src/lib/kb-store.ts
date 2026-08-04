export interface KBDocument {
  id: string
  name: string
  status: '解析完成' | '待解析' | '解析中' | '解析失败'
  size: string
  chunksCount: number
  policyName: string
  updatedAt: string
  folderId?: string
  sourceType?: string
  sourceUrl?: string
  dbQuery?: string
  mdContent?: string
  originalPreviewContent?: string
  version?: number
}

export interface KBSlice {
  id: string
  docName: string
  score: number
  content: string
  timestamp?: string
}

export interface KBPermissions {
  manageDepts: string[]
  managePositions: string[]
  manageUserGroups: string[]
  accessQueryDepts: string[]
  accessQueryPositions: string[]
  accessQueryUserGroups: string[]
  accessDownloadDepts: string[]
  accessDownloadPositions: string[]
  accessDownloadUserGroups: string[]
  userManageOverrides?: { [userId: string]: 'allow' | 'deny' }
  userQueryOverrides?: { [userId: string]: 'allow' | 'deny' }
  userDownloadOverrides?: { [userId: string]: 'allow' | 'deny' }
}

export interface KBFolder {
  id: string
  name: string
  parentId?: string
  order?: number
}

export interface KnowledgeBase {
  id: string
  title: string
  status: string
  progress: number
  domain: string
  wordCount: number
  embeddingModel: string
  updatedAt: string
  description?: string
  docs?: KBDocument[]
  slices?: KBSlice[]
  permissions?: KBPermissions
  type?: 'local' | 'web' | 'db'
  folders?: KBFolder[]
}

export function getDefaultPermissions(): KBPermissions {
  return {
    manageDepts: [],
    managePositions: [],
    manageUserGroups: [],
    accessQueryDepts: ['all_depts'],
    accessQueryPositions: [],
    accessQueryUserGroups: [],
    accessDownloadDepts: [],
    accessDownloadPositions: [],
    accessDownloadUserGroups: [],
    userManageOverrides: {},
    userQueryOverrides: {},
    userDownloadOverrides: {}
  }
}

const DEFAULT_KBS: KnowledgeBase[] = [
  {
    id: 'kb-1',
    title: '融媒体新闻稿历史范本库',
    type: 'local',
    status: '解析完成',
    progress: 100,
    domain: 'biz-media-audit',
    wordCount: 154000,
    embeddingModel: 'text-embedding-004',
    updatedAt: '2026-05-28 11:20:00',
    description: '汇集融媒体中心黄金时段新闻范本、总编辑审核红线指令集以及优秀融合报道范式。',
    permissions: {
      manageDepts: ['dept-2'],
      managePositions: ['pos-2'],
      manageUserGroups: ['group-2'],
      accessQueryDepts: ['dept-2', 'dept-3'],
      accessQueryPositions: ['pos-2', 'pos-4'],
      accessQueryUserGroups: ['group-1', 'group-2'],
      accessDownloadDepts: ['dept-2'],
      accessDownloadPositions: ['pos-2'],
      accessDownloadUserGroups: ['group-2']
    },
    docs: [
      { id: 'doc-1-1', name: '2025_总编室头条及黄金时段新闻规范手册.docx', status: '解析完成', size: '482 KB', chunksCount: 28, policyName: '通用解析 + PDF转图', updatedAt: '2026-05-28 10:20' },
      { id: 'doc-1-2', name: '重大政治主题融媒体融合报道优质案例选登.pdf', status: '解析完成', size: '3.2 MB', chunksCount: 15, policyName: '文档通用高精度解析', updatedAt: '2026-05-28 10:45' },
      { id: 'doc-1-3', name: 'AI稿件检测安全审核底线词与敏感源对照表_v1.txt', status: '解析完成', size: '45 KB', chunksCount: 56, policyName: '全文精确分隔符号解析', updatedAt: '2026-05-28 11:15' }
    ],
    slices: [
      { id: 'slice-1-1', docName: '2025_总编室头条及黄金时段新闻规范手册.docx', score: 0.94, content: '【总编室红线】时政新闻首发规范：在面对重大、突发或时政重头要闻时，融媒体编排系统应当遵循严格的三级审核制（编辑初审、主管复审、总监签发）。' },
      { id: 'slice-1-2', docName: '重大政治主题融媒体融合报道优质案例选登.pdf', score: 0.88, content: '【重大主题融合范式】关于数字文旅与大型文创融合报道的选题指引：融媒体新闻中心应当发挥"端网云屏"一体化矩阵效应。' }
    ]
  },
  {
    id: 'kb-2',
    title: 'IPTV 遥控器大屏交互规范及高频问题标准词表',
    type: 'local',
    status: '解析完成',
    progress: 100,
    domain: 'biz-iptv-vas',
    wordCount: 88400,
    embeddingModel: 'text-embedding-004',
    updatedAt: '2026-05-29 15:45:00',
    description: 'IPTV/OTT大屏端焦点控制交互模型、遥控器物理按键响应阈值、高频蓝牙/红外模块离线排障话术。',
    permissions: {
      manageDepts: ['dept-1'],
      managePositions: ['pos-3'],
      manageUserGroups: ['group-3'],
      accessQueryDepts: ['dept-1', 'dept-3', 'dept-4'],
      accessQueryPositions: ['pos-3', 'pos-4'],
      accessQueryUserGroups: ['group-3', 'group-1'],
      accessDownloadDepts: ['dept-1'],
      accessDownloadPositions: ['pos-3'],
      accessDownloadUserGroups: ['group-3']
    },
    docs: [
      { id: 'doc-2-1', name: 'IPTV_遥控器按键响应时延与触感标准_v3.pdf', status: '解析完成', size: '412 KB', chunksCount: 18, policyName: '极速纯文本解析', updatedAt: '2026-05-29 12:20' },
      { id: 'doc-2-2', name: '高频故障及常见疑问智能客服标准问答词表.xlsx', status: '解析完成', size: '185 KB', chunksCount: 42, policyName: '结构化表格映射解析', updatedAt: '2026-05-29 14:10' },
      { id: 'doc-2-3', name: '大屏端焦点跳转逻辑与动态渲染能效报告.docx', status: '解析完成', size: '1.2 MB', chunksCount: 24, policyName: '通用解析 + 图文提取', updatedAt: '2026-05-29 15:30' }
    ],
    slices: [
      { id: 'slice-2-1', docName: 'IPTV_遥控器按键响应时延与触感标准_v3.pdf', score: 0.96, content: '【遥控器按键响应时延】IPTV/OTT大屏端极速响应指标：遥控器方向键（上/下/左/右）在物理按下时，底层红外收发器或BLE模组的事件中断排队时延不能超过60ms。' },
      { id: 'slice-2-2', docName: '高频故障及常见疑问智能客服标准问答词表.xlsx', score: 0.91, content: '【智能配对离线话术】遥控器与盒子失配处理规范：当发生蓝牙双向通信丢失或BLE信号强度(RSSI)低于-85dBm时，遥控器红蓝双色指示灯会开始2Hz的超高速闪烁。' }
    ]
  },
  {
    id: 'kb-3',
    title: '集团2025人力资源社会招聘及薪酬绩效政策汇编',
    type: 'web',
    status: '解析完成',
    progress: 100,
    domain: 'biz-hr-hire',
    wordCount: 245000,
    embeddingModel: 'text-embedding-004',
    updatedAt: '2026-05-30 09:12:00',
    description: '集团社会招聘中高管定级规范、全员绩效评价系数分配比率以及浮动薪金发放细则。',
    permissions: {
      manageDepts: ['dept-5'],
      managePositions: ['pos-5'],
      manageUserGroups: ['group-4'],
      accessQueryDepts: ['dept-5'],
      accessQueryPositions: ['pos-5'],
      accessQueryUserGroups: ['group-4'],
      accessDownloadDepts: ['dept-5'],
      accessDownloadPositions: ['pos-5'],
      accessDownloadUserGroups: ['group-4']
    },
    docs: [
      { id: 'doc-3-1', name: '集团2025年度全员绩效考核及系数核定细则.pdf', status: '解析完成', size: '1.1 MB', chunksCount: 32, policyName: '通用高级解析', updatedAt: '2026-05-30 08:30' },
      { id: 'doc-3-2', name: '社会招聘中高级管理人才职级与薪金对齐矩阵.xlsx', status: '解析完成', size: '290 KB', chunksCount: 12, policyName: '多维表格结构化解析', updatedAt: '2026-05-30 09:05' }
    ],
    slices: [
      { id: 'slice-3-1', docName: '集团2025年度全员绩效考核及系数核定细则.pdf', score: 0.92, content: '【绩效评价系数强制分布】绩效评定共划分为 S、A、B(+)、B、C 五档。评级实行部门总规模名额强制按比例分布控制：S等级（杰出）比例不得超过部门总人数的5%。' },
      { id: 'slice-3-2', docName: '社会招聘中高级管理人才职级与薪金对齐矩阵.xlsx', score: 0.89, content: '【高级人才薪金及绑定条款】对于社招T6（专家岗）及以上级别的人才，薪酬结构由基础月薪、季度浮动绩效包、年终股票期权配额构成。' }
    ]
  },
  {
    id: 'kb-4',
    title: '关于新能巡检人形机器人硬件架构及出勤规范说明书(初版)',
    type: 'db',
    status: '待解析',
    progress: 45,
    domain: 'base-general-agent',
    wordCount: 12000,
    embeddingModel: 'text-embedding-004',
    updatedAt: '2026-05-30 10:00:00',
    description: '智能厂区人形高频巡检机器人底盘、动力关节、超声波避障传感器以及零下环境参数配置表。',
    permissions: {
      manageDepts: ['dept-4'],
      managePositions: ['pos-4'],
      manageUserGroups: ['group-1'],
      accessQueryDepts: ['dept-3', 'dept-4'],
      accessQueryPositions: ['pos-4'],
      accessQueryUserGroups: ['group-1'],
      accessDownloadDepts: ['dept-4'],
      accessDownloadPositions: ['pos-4'],
      accessDownloadUserGroups: ['group-1']
    },
    docs: [
      { id: 'doc-4-1', name: '巡检机器人三代智能动力关节组装与转矩控制.pdf', status: '待解析', size: '4.8 MB', chunksCount: 0, policyName: '通用多模态高精度提取', updatedAt: '2026-05-30 09:45' },
      { id: 'doc-4-2', name: '人形出勤极端恶劣环境(零下30度至60度)适应度参数白皮书.docx', status: '待解析', size: '1.5 MB', chunksCount: 0, policyName: '通用解析 + PDF转图', updatedAt: '2026-05-30 09:55' }
    ],
    slices: []
  }
]

const STORAGE_KEY = 'ai-kb-list-v2'

export function getKBs(): KnowledgeBase[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data) as KnowledgeBase[]
      return parsed.map(k => ({
        ...k,
        permissions: k.permissions || getDefaultPermissions()
      }))
    }
  } catch (e) {
    console.error(e)
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_KBS))
  } catch (e) {
    console.error(e)
  }
  return DEFAULT_KBS
}

export function saveKBs(kbs: KnowledgeBase[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kbs))
}

export function addKB(kb: Omit<KnowledgeBase, 'id' | 'updatedAt'>): KnowledgeBase {
  const kbs = getKBs()
  const defaultDocs = [
    { id: `doc-${Date.now()}-1`, name: '样例上传文档_新建库默认导入.docx', status: '解析完成' as const, size: '128 KB', chunksCount: 6, policyName: '通用解析', updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) }
  ]
  const defaultSlices = [
    { id: `slice-${Date.now()}-1`, docName: '样例上传文档_新建库默认导入.docx', score: 0.90, content: '【自动导入样例】本分块是在创建本知识库时由系统解析套件自动生成的占位语块。' }
  ]

  const newKB: KnowledgeBase = {
    ...kb,
    id: `kb-${Date.now()}`,
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    docs: kb.docs && kb.docs.length > 0 ? kb.docs : defaultDocs,
    slices: kb.slices && kb.slices.length > 0 ? kb.slices : defaultSlices,
    permissions: kb.permissions || getDefaultPermissions()
  }
  kbs.push(newKB)
  saveKBs(kbs)
  return newKB
}

export function deleteKB(id: string) {
  const kbs = getKBs()
  const filtered = kbs.filter(k => k.id !== id)
  saveKBs(filtered)
}

export interface User {
  id: string
  name: string
  email: string
  username: string
  role: 'admin' | 'editor' | 'viewer'
  departmentId: string
  positionId: string
  userGroupId: string
  status: 'active' | 'inactive'
  createdAt: string
}

export function checkKBPermissions(kb: KnowledgeBase, user: User) {
  const p = kb.permissions || getDefaultPermissions()
  const uGroupIds = user.userGroupId ? user.userGroupId.split(',').map(s => s.trim()).filter(Boolean) : []

  let canManage = false
  if (p.userManageOverrides && p.userManageOverrides[user.id] !== undefined) {
    canManage = p.userManageOverrides[user.id] === 'allow'
  } else {
    if (user.role === 'admin') {
      canManage = true
    } else {
      canManage =
        (p.manageDepts && p.manageDepts.includes(user.departmentId)) ||
        (p.managePositions && p.managePositions.includes(user.positionId)) ||
        (p.manageUserGroups && uGroupIds.some(gid => p.manageUserGroups.includes(gid)))
    }
  }

  let canQuery = false
  if (p.userQueryOverrides && p.userQueryOverrides[user.id] !== undefined) {
    canQuery = p.userQueryOverrides[user.id] === 'allow'
  } else {
    if (user.role === 'admin') {
      canQuery = true
    } else {
      canQuery =
        canManage ||
        (p.accessQueryDepts && p.accessQueryDepts.includes('all_depts')) ||
        (p.accessQueryDepts && p.accessQueryDepts.includes(user.departmentId)) ||
        (p.accessQueryPositions && p.accessQueryPositions.includes(user.positionId)) ||
        (p.accessQueryUserGroups && uGroupIds.some(gid => p.accessQueryUserGroups.includes(gid)))
    }
  }

  if (canManage && (!p.userQueryOverrides || p.userQueryOverrides[user.id] === undefined)) {
    canQuery = true
  }

  let canDownload = false
  if (p.userDownloadOverrides && p.userDownloadOverrides[user.id] !== undefined) {
    canDownload = p.userDownloadOverrides[user.id] === 'allow'
  } else {
    if (user.role === 'admin') {
      canDownload = true
    } else {
      canDownload =
        canManage ||
        (p.accessDownloadDepts && p.accessDownloadDepts.includes(user.departmentId)) ||
        (p.accessDownloadPositions && p.accessDownloadPositions.includes(user.positionId)) ||
        (p.accessDownloadUserGroups && uGroupIds.some(gid => p.accessDownloadUserGroups.includes(gid)))
    }
  }

  if (canManage && (!p.userDownloadOverrides || p.userDownloadOverrides[user.id] === undefined)) {
    canDownload = true
  }

  return {
    canManage: !!canManage,
    canQuery: !!canQuery,
    canDownload: !!canDownload
  }
}
