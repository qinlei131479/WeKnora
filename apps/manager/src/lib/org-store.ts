export interface Department {
  id: string
  name: string
  code: string
  description: string
  parentId?: string
  createdAt: string
}

export interface Position {
  id: string
  title: string
  code: string
  level: string
  description: string
  createdAt: string
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

export interface UserGroup {
  id: string
  name: string
  code: string
  description: string
  createdAt: string
}

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: '大屏业务运维部', code: 'IPTV_OPS', description: '负责IPTV/OTT大屏端的交互响应、流媒体播控与故障排查。', createdAt: '2026-01-10' },
  { id: 'dept-2', name: '融媒体新闻中心', code: 'MEDIA_CTR', description: '负责全渠道内容采集、头条编发、三级审核签发等核心融媒体业务。', createdAt: '2026-01-15' },
  { id: 'dept-3', name: '语言学与人工智能教研室', code: 'AI_RESRCH', description: '负责垂直领域学术研究、智能Agent评测与知识库向量树设计。', createdAt: '2026-02-01' },
  { id: 'dept-4', name: '计算机网络教研组', code: 'COMP_NET', description: '负责高校网络工程授课、机器人硬件巡检及平台实验课程研发。', createdAt: '2026-02-05' },
  { id: 'dept-5', name: '集团综合人力资源部', code: 'CORP_HR', description: '负责集团社会招聘定级、全员OKR绩效分布和期权锁定期核算。', createdAt: '2025-12-01' }
]

const DEFAULT_POSITIONS: Position[] = [
  { id: 'pos-1', title: '中台超级管理员', code: 'SYS_ADMIN', level: 'A-1', description: '具有最高等级的系统管理、资源分配、全局安全审计配置权限。', createdAt: '2026-01-01' },
  { id: 'pos-2', title: '融媒体总编辑', code: 'CHIEF_EDITOR', level: 'M-4', description: '负责新闻首发的终极审核签发，掌握重大敏感词一票拦截红线权力。', createdAt: '2026-01-15' },
  { id: 'pos-3', title: 'IPTV 播控核验专家', code: 'IPTV_AUDITOR', level: 'P-3', description: '负责大屏焦点交互、静音Ring Buffer响应机制与遥控器退耦重连排障。', createdAt: '2026-01-20' },
  { id: 'pos-4', title: '高级副教授 / 讲师', code: 'ACAD_PROF', level: 'T-5', description: '负责高校特定学科教研大纲编写，智能辅助备课系统的垂直语库运营。', createdAt: '2026-02-01' },
  { id: 'pos-5', title: '资深人力资源专家', code: 'HR_EXPERT', level: 'P-4', description: '制定社组T6定薪范畴、绩效SA配比红线及离职敬业协议管控。', createdAt: '2025-12-05' }
]

const DEFAULT_USER_GROUPS: UserGroup[] = [
  { id: 'group-1', name: '教研室核心骨干组', code: 'TEACH_CORES', description: '包含不同教研室的主干教师，用于限制日常教学课件知识库的管理访问。', createdAt: '2026-02-10' },
  { id: 'group-2', name: '新媒体联合编审会', code: 'MEDIA_COMMITTEE', description: '负责审查首发突发性宏观内容并实施三级校验的指定联合组。', createdAt: '2026-01-18' },
  { id: 'group-3', name: 'IPTV 客服大屏交付组', code: 'IPTV_SUPPORT', description: '大屏客服响应终端，用于模拟一键唤醒遥控器配对排障的话术查询。', createdAt: '2026-01-22' },
  { id: 'group-4', name: '中台研发集成室', code: 'RAG_DEVS', description: '负责调试 Embedding 召回置信、TopK 和密集/稀疏融合权重的微观开发人员。', createdAt: '2026-01-05' }
]

const DEFAULT_USERS: User[] = [
  { id: 'user-1', name: '马博林 (超级管理员)', email: 'maboling@aistudio.com', username: 'admin_maboling', role: 'admin', departmentId: 'dept-3', positionId: 'pos-1', userGroupId: 'group-4', status: 'active', createdAt: '2026-01-01' },
  { id: 'user-2', name: '陈总编', email: 'editor_chen@aistudio.com', username: 'editor_chen', role: 'editor', departmentId: 'dept-2', positionId: 'pos-2', userGroupId: 'group-2', status: 'active', createdAt: '2026-01-15' },
  { id: 'user-3', name: '叶教授 (外语教研)', email: 'prof_ye@aistudio.com', username: 'prof_ye', role: 'editor', departmentId: 'dept-3', positionId: 'pos-4', userGroupId: 'group-1', status: 'active', createdAt: '2026-02-01' },
  { id: 'user-4', name: '张老师 (网络工程)', email: 'teacher_zhang@aistudio.com', username: 'teacher_zhang', role: 'viewer', departmentId: 'dept-4', positionId: 'pos-4', userGroupId: 'group-1', status: 'active', createdAt: '2026-02-05' },
  { id: 'user-5', name: '肖经理 (大屏运维)', email: 'ops_xiao@aistudio.com', username: 'ops_xiao', role: 'editor', departmentId: 'dept-1', positionId: 'pos-3', userGroupId: 'group-3', status: 'active', createdAt: '2026-01-20' },
  { id: 'user-6', name: '李总监 (集团HR)', email: 'hr_li@aistudio.com', username: 'hr_li', role: 'viewer', departmentId: 'dept-5', positionId: 'pos-5', userGroupId: 'group-4', status: 'active', createdAt: '2025-12-05' }
]

export function getDepartments(): Department[] {
  try {
    const data = localStorage.getItem('ai-departments-v1')
    if (data) return JSON.parse(data)
  } catch (e) {
    console.error(e)
  }
  return DEFAULT_DEPARTMENTS
}

export function saveDepartments(depts: Department[]) {
  localStorage.setItem('ai-departments-v1', JSON.stringify(depts))
}

export function getPositions(): Position[] {
  try {
    const data = localStorage.getItem('ai-positions-v1')
    if (data) return JSON.parse(data)
  } catch (e) {
    console.error(e)
  }
  return DEFAULT_POSITIONS
}

export function savePositions(positions: Position[]) {
  localStorage.setItem('ai-positions-v1', JSON.stringify(positions))
}

export function getUserGroups(): UserGroup[] {
  try {
    const data = localStorage.getItem('ai-usergroups-v1')
    if (data) return JSON.parse(data)
  } catch (e) {
    console.error(e)
  }
  return DEFAULT_USER_GROUPS
}

export function saveUserGroups(groups: UserGroup[]) {
  localStorage.setItem('ai-usergroups-v1', JSON.stringify(groups))
}

export function getUsers(): User[] {
  try {
    const data = localStorage.getItem('ai-users-v1')
    if (data) return JSON.parse(data)
  } catch (e) {
    console.error(e)
  }
  return DEFAULT_USERS
}

export function saveUsers(users: User[]) {
  localStorage.setItem('ai-users-v1', JSON.stringify(users))
}
