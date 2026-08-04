<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Save,
  Plus,
  Network,
  ChevronRight,
  Edit,
  Trash2,
  Building2,
  Users,
  Search,
  Download,
  Upload,
  Mail,
  Phone,
  User,
  ArrowRight,
  GitBranch,
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

interface DeptNode {
  id: number
  name: string
  code: string
  leader: string
  leaderAvatar: string
  members: number
  phone: string
  email: string
  desc: string
  children?: DeptNode[]
}

const searchTerm = ref('')
const expanded = ref<Set<number>>(new Set([1, 2, 3, 11, 21, 31, 32, 33]))
const selectedId = ref<number | null>(11)
const viewMode = ref<'tree' | 'org'>('tree')

const tree = ref<DeptNode[]>([
  {
    id: 1,
    name: '集团总部',
    code: 'HQ',
    leader: '张志强',
    leaderAvatar: '张',
    members: 12,
    phone: '010-88880000',
    email: 'hq@company.com',
    desc: '集团最高决策与管理机构',
    children: [
      {
        id: 11,
        name: '人力资源中心',
        code: 'HR-C',
        leader: '李 梅',
        leaderAvatar: '李',
        members: 28,
        phone: '010-88880101',
        email: 'hr@company.com',
        desc: '负责集团人力资源战略与管理',
        children: [
          { id: 111, name: '招聘部', code: 'HR-REC', leader: '王 芳', leaderAvatar: '王', members: 8, phone: '010-88880111', email: 'recruit@company.com', desc: '人才招聘与雇主品牌' },
          { id: 112, name: '员工关系部', code: 'HR-ER', leader: '陈 静', leaderAvatar: '陈', members: 6, phone: '010-88880112', email: 'er@company.com', desc: '员工关系与劳动事务' },
          { id: 113, name: '薪酬绩效部', code: 'HR-CP', leader: '刘 洋', leaderAvatar: '刘', members: 7, phone: '010-88880113', email: 'cp@company.com', desc: '薪酬体系与绩效考核' },
          { id: 114, name: '培训发展部', code: 'HR-TD', leader: '赵 磊', leaderAvatar: '赵', members: 7, phone: '010-88880114', email: 'td@company.com', desc: '员工培训与职业发展' },
        ],
      },
      {
        id: 12,
        name: '财务中心',
        code: 'FIN-C',
        leader: '孙 慧',
        leaderAvatar: '孙',
        members: 18,
        phone: '010-88880102',
        email: 'fin@company.com',
        desc: '负责集团财务规划与资金管理',
        children: [
          { id: 121, name: '核算部', code: 'FIN-AC', leader: '周 婷', leaderAvatar: '周', members: 6, phone: '010-88880121', email: 'ac@company.com', desc: '总账与财务报表' },
          { id: 122, name: '资金部', code: 'FIN-TR', leader: '吴 鹏', leaderAvatar: '吴', members: 5, phone: '010-88880122', email: 'tr@company.com', desc: '资金运作与银行对接' },
          { id: 123, name: '税务部', code: 'FIN-TX', leader: '郑 娜', leaderAvatar: '郑', members: 4, phone: '010-88880123', email: 'tx@company.com', desc: '税务筹划与申报' },
          { id: 124, name: '审计部', code: 'FIN-AU', leader: '黄 健', leaderAvatar: '黄', members: 3, phone: '010-88880124', email: 'au@company.com', desc: '内部审计与合规' },
        ],
      },
      {
        id: 13,
        name: '技术中心',
        code: 'TECH-C',
        leader: '徐 峰',
        leaderAvatar: '徐',
        members: 156,
        phone: '010-88880103',
        email: 'tech@company.com',
        desc: '集团技术研发与平台建设',
        children: [
          {
            id: 131,
            name: '研发中心',
            code: 'TECH-RD',
            leader: '高 翔',
            leaderAvatar: '高',
            members: 88,
            phone: '010-88880131',
            email: 'rd@company.com',
            desc: '产品研发与技术实现',
            children: [
              { id: 1311, name: '前端组', code: 'TECH-FE', leader: '林 浩', leaderAvatar: '林', members: 22, phone: '010-88880141', email: 'fe@company.com', desc: 'Web/小程序/桌面端' },
              { id: 1312, name: '后端组', code: 'TECH-BE', leader: '何 强', leaderAvatar: '何', members: 36, phone: '010-88880142', email: 'be@company.com', desc: '服务端架构与开发' },
              { id: 1313, name: '算法组', code: 'TECH-AI', leader: '罗 敏', leaderAvatar: '罗', members: 18, phone: '010-88880143', email: 'ai@company.com', desc: 'AI 算法与数据挖掘' },
              { id: 1314, name: '测试组', code: 'TECH-QA', leader: '宋 健', leaderAvatar: '宋', members: 12, phone: '010-88880144', email: 'qa@company.com', desc: '质量保障与自动化测试' },
            ],
          },
          {
            id: 132,
            name: '运维中心',
            code: 'TECH-OPS',
            leader: '谢 东',
            leaderAvatar: '谢',
            members: 28,
            phone: '010-88880132',
            email: 'ops@company.com',
            desc: '系统运维与基础架构',
            children: [
              { id: 1321, name: '基础设施组', code: 'OPS-INF', leader: '韩 伟', leaderAvatar: '韩', members: 12, phone: '010-88880151', email: 'inf@company.com', desc: '服务器与网络' },
              { id: 1322, name: '应用运维组', code: 'OPS-APP', leader: '冯 雷', leaderAvatar: '冯', members: 10, phone: '010-88880152', email: 'app-ops@company.com', desc: '应用监控与发布' },
              { id: 1323, name: '安全组', code: 'OPS-SEC', leader: '邓 超', leaderAvatar: '邓', members: 6, phone: '010-88880153', email: 'sec@company.com', desc: '信息安全与渗透测试' },
            ],
          },
          { id: 133, name: '产品部', code: 'TECH-PD', leader: '彭 璐', leaderAvatar: '彭', members: 24, phone: '010-88880133', email: 'pd@company.com', desc: '产品规划与设计' },
          { id: 134, name: 'UI 设计部', code: 'TECH-UI', leader: '蒋 艺', leaderAvatar: '蒋', members: 16, phone: '010-88880134', email: 'ui@company.com', desc: '用户体验与界面设计' },
        ],
      },
      {
        id: 14,
        name: '市场销售中心',
        code: 'MKT-C',
        leader: '魏 华',
        leaderAvatar: '魏',
        members: 86,
        phone: '010-88880104',
        email: 'mkt@company.com',
        desc: '市场营销与销售管理',
        children: [
          { id: 141, name: '品牌部', code: 'MKT-BR', leader: '闫 丽', leaderAvatar: '闫', members: 12, phone: '010-88880161', email: 'br@company.com', desc: '品牌建设与公关' },
          { id: 142, name: '市场部', code: 'MKT-MK', leader: '余 刚', leaderAvatar: '余', members: 24, phone: '010-88880162', email: 'mk@company.com', desc: '市场推广与活动' },
          { id: 143, name: '销售部', code: 'MKT-SA', leader: '苏 琴', leaderAvatar: '苏', members: 38, phone: '010-88880163', email: 'sa@company.com', desc: '客户开发与签约' },
          { id: 144, name: '客户成功部', code: 'MKT-CS', leader: '卢 颖', leaderAvatar: '卢', members: 12, phone: '010-88880164', email: 'cs@company.com', desc: '客户运营与续约' },
        ],
      },
      { id: 15, name: '法务部', code: 'LEG', leader: '蒋 涛', leaderAvatar: '蒋', members: 8, phone: '010-88880105', email: 'legal@company.com', desc: '法务咨询与合同审核' },
      { id: 16, name: '行政部', code: 'ADM', leader: '钱 丽', leaderAvatar: '钱', members: 14, phone: '010-88880106', email: 'adm@company.com', desc: '行政与后勤保障' },
    ],
  },
])

const flatList = computed(() => {
  const result: { node: DeptNode; level: number }[] = []
  const walk = (nodes: DeptNode[], level: number) => {
    nodes.forEach((n) => {
      result.push({ node: n, level })
      if (n.children && expanded.value.has(n.id)) walk(n.children, level + 1)
    })
  }
  walk(tree.value, 0)
  return result
})

const filtered = computed(() => {
  if (!searchTerm.value) return flatList.value
  const t = searchTerm.value.toLowerCase()
  return flatList.value.filter(({ node }) => node.name.toLowerCase().includes(t) || node.code.toLowerCase().includes(t) || node.leader.toLowerCase().includes(t))
})

const selectedNode = computed(() => {
  const walk = (nodes: DeptNode[]): DeptNode | null => {
    for (const n of nodes) {
      if (n.id === selectedId.value) return n
      if (n.children) {
        const found = walk(n.children)
        if (found) return found
      }
    }
    return null
  }
  return walk(tree.value)
})

const toggle = (id: number) => {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
  expanded.value = new Set(expanded.value)
}

const totalMembers = computed(() => tree.value.reduce((s, n) => s + n.members + (n.children?.reduce((ss, c) => ss + c.members, 0) || 0), 0))
const totalDepts = computed(() => tree.value.reduce((s, n) => s + 1 + (n.children?.length || 0), 0))
const allDepts = computed(() => {
  const list: DeptNode[] = []
  const walk = (nodes: DeptNode[]) => {
    nodes.forEach((n) => {
      list.push(n)
      if (n.children) walk(n.children)
    })
  }
  walk(tree.value)
  return list
})

const avatarColor = (name: string) => {
  const colors = [
    'from-blue-500 to-cyan-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-sky-500 to-indigo-600',
    'from-pink-500 to-rose-600',
    'from-teal-500 to-cyan-600',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

const handleAddChild = () => {
  if (selectedId.value === null) return
  const newId = Math.max(...allDepts.value.map((d) => d.id)) + 1
  const find = (nodes: DeptNode[]): DeptNode | null => {
    for (const n of nodes) {
      if (n.id === selectedId.value) return n
      if (n.children) {
        const f = find(n.children)
        if (f) return f
      }
    }
    return null
  }
  const target = find(tree.value)
  if (target) {
    if (!target.children) target.children = []
    target.children.push({
      id: newId,
      name: '新部门',
      code: `${target.code}-${(target.children.length + 1).toString().padStart(2, '0')}`,
      leader: '待指派',
      leaderAvatar: '?',
      members: 0,
      phone: '',
      email: '',
      desc: '',
    })
    expanded.value.add(target.id)
    expanded.value = new Set(expanded.value)
  }
}

const handleAddRoot = () => {
  const newId = Math.max(...allDepts.value.map((d) => d.id)) + 1
  tree.value.push({
    id: newId,
    name: '新部门',
    code: 'NEW',
    leader: '待指派',
    leaderAvatar: '?',
    members: 0,
    phone: '',
    email: '',
    desc: '',
  })
}

const handleDelete = () => {
  if (selectedId.value === null) return
  if (!confirm('确定删除该部门及其子部门?')) return
  const remove = (nodes: DeptNode[]): DeptNode[] => {
    return nodes.filter((n) => {
      if (n.id === selectedId.value) return false
      if (n.children) n.children = remove(n.children)
      return true
    })
  }
  tree.value = remove(tree.value)
  selectedId.value = null
}

const handleSave = () => {
  alert('部门架构已保存(演示)')
}
</script>

<template>
  <div class="space-y-4">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">部门组织架构</h1>
        <p class="mt-1 text-sm text-slate-500">维护企业部门层级与人员归属,支持多级组织树形管理</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center rounded-md border border-slate-200 p-0.5 text-xs">
          <button
            :class="['px-3 py-1.5 rounded transition-colors', viewMode === 'tree' ? 'bg-blue-100 text-blue-600' : 'text-slate-500']"
            @click="viewMode = 'tree'"
          >
            <GitBranch class="h-3.5 w-3.5 inline -mt-0.5 mr-1" />
            树形
          </button>
          <button
            :class="['px-3 py-1.5 rounded transition-colors', viewMode === 'org' ? 'bg-blue-100 text-blue-600' : 'text-slate-500']"
            @click="viewMode = 'org'"
          >
            <Network class="h-3.5 w-3.5 inline -mt-0.5 mr-1" />
            组织图
          </button>
        </div>
        <Button variant="outline">
          <Upload class="h-4 w-4 mr-1" />
          导入
        </Button>
        <Button variant="outline">
          <Download class="h-4 w-4 mr-1" />
          导出
        </Button>
        <Button variant="outline" @click="handleAddRoot">
          <Plus class="h-4 w-4 mr-1" />
          新增部门
        </Button>
        <Button @click="handleSave">
          <Save class="h-4 w-4 mr-1" />
          保存
        </Button>
      </div>
    </div>

    <!-- 概览 -->
    <div class="grid grid-cols-3 gap-4">
      <Card class-name="p-4 flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Building2 class="h-5 w-5" />
        </span>
        <div>
          <div class="text-xs text-slate-500">部门数量</div>
          <div class="text-xl font-bold text-slate-800">{{ totalDepts }}</div>
        </div>
      </Card>
      <Card class-name="p-4 flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <Users class="h-5 w-5" />
        </span>
        <div>
          <div class="text-xs text-slate-500">员工总数</div>
          <div class="text-xl font-bold text-slate-800">{{ totalMembers }}</div>
        </div>
      </Card>
      <Card class-name="p-4 flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Network class="h-5 w-5" />
        </span>
        <div>
          <div class="text-xs text-slate-500">组织层级</div>
          <div class="text-xl font-bold text-slate-800">4 级</div>
        </div>
      </Card>
    </div>

    <div class="grid grid-cols-12 gap-4">
      <!-- 左侧:部门树 -->
      <Card class-name="col-span-7 p-0 overflow-hidden">
        <div class="border-b px-4 py-3 flex items-center gap-2">
          <Network class="h-4 w-4 text-slate-500" />
          <h3 class="text-sm font-semibold text-slate-700 flex-1">部门架构</h3>
          <div class="w-56">
            <Input v-model="searchTerm" placeholder="搜索部门/负责人" class="text-xs h-8" />
          </div>
        </div>
        <div class="max-h-[640px] overflow-y-auto p-2">
          <div
            v-for="item in filtered"
            :key="item.node.id"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-slate-50"
            :class="selectedId === item.node.id ? 'bg-blue-50 hover:bg-blue-50' : ''"
            :style="{ paddingLeft: `${item.level * 20 + 8}px` }"
            @click="selectedId = item.node.id"
          >
            <button
              v-if="item.node.children && item.node.children.length > 0"
              class="flex h-5 w-5 items-center justify-center rounded hover:bg-slate-200"
              @click.stop="toggle(item.node.id)"
            >
              <ChevronRight
                :class="['h-3.5 w-3.5 text-slate-500 transition-transform', expanded.has(item.node.id) ? 'rotate-90' : '']"
              />
            </button>
            <div v-else class="w-5" />

            <span
              :class="[
                'flex h-7 w-7 items-center justify-center rounded-md text-white text-xs font-semibold bg-gradient-to-br',
                avatarColor(item.node.name),
              ]"
            >
              {{ item.node.name.charAt(0) }}
            </span>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-slate-800 truncate">{{ item.node.name }}</div>
              <div class="text-[10px] text-slate-400">{{ item.node.leader }} · {{ item.node.code }}</div>
            </div>
            <div class="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Users class="h-3 w-3" />
              {{ item.node.members }}
            </div>
          </div>
        </div>
      </Card>

      <!-- 右侧:详情 -->
      <Card class-name="col-span-5 p-0 overflow-hidden">
        <div class="border-b px-4 py-3 flex items-center gap-2">
          <Edit class="h-4 w-4 text-slate-500" />
          <h3 class="text-sm font-semibold text-slate-700">部门详情</h3>
        </div>
        <div v-if="selectedNode" class="p-5 space-y-4">
          <div class="flex items-center gap-3 pb-4 border-b">
            <span
              :class="[
                'flex h-14 w-14 items-center justify-center rounded-lg text-white text-xl font-bold bg-gradient-to-br',
                avatarColor(selectedNode.name),
              ]"
            >
              {{ selectedNode.name.charAt(0) }}
            </span>
            <div class="flex-1">
              <Input v-model="selectedNode.name" class="text-base font-semibold" />
              <Input v-model="selectedNode.code" class="text-xs font-mono mt-1" />
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">部门描述</label>
            <textarea
              v-model="selectedNode.desc"
              rows="2"
              class="w-full text-sm rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div class="space-y-2.5">
            <div>
              <label class="text-xs font-medium text-slate-600 mb-1.5 block">部门负责人</label>
              <div class="flex items-center gap-2.5 px-3 py-2 rounded-md border border-slate-200">
                <span
                  :class="[
                    'flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-semibold bg-gradient-to-br',
                    avatarColor(selectedNode.leader),
                  ]"
                >
                  {{ selectedNode.leaderAvatar }}
                </span>
                <Input v-model="selectedNode.leader" class="border-0 shadow-none px-0 focus:ring-0" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-medium text-slate-600 mb-1.5 block">联系电话</label>
                <div class="flex items-center gap-2 px-3 h-9 rounded-md border border-slate-200">
                  <Phone class="h-3.5 w-3.5 text-slate-400" />
                  <input v-model="selectedNode.phone" class="flex-1 text-sm outline-none bg-transparent" />
                </div>
              </div>
              <div>
                <label class="text-xs font-medium text-slate-600 mb-1.5 block">邮箱</label>
                <div class="flex items-center gap-2 px-3 h-9 rounded-md border border-slate-200">
                  <Mail class="h-3.5 w-3.5 text-slate-400" />
                  <input v-model="selectedNode.email" class="flex-1 text-sm outline-none bg-transparent" />
                </div>
              </div>
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 mb-1.5 block">编制人数</label>
              <Input v-model="selectedNode.members" type="number" />
            </div>
          </div>

          <div v-if="selectedNode.children && selectedNode.children.length > 0">
            <div class="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
              <GitBranch class="h-3 w-3" />
              子部门 ({{ selectedNode.children.length }})
            </div>
            <div class="space-y-1.5">
              <div
                v-for="c in selectedNode.children"
                :key="c.id"
                class="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 cursor-pointer hover:border-blue-300"
                @click="selectedId = c.id"
              >
                <span
                  :class="['flex h-6 w-6 items-center justify-center rounded text-white text-xs font-semibold bg-gradient-to-br', avatarColor(c.name)]"
                >
                  {{ c.name.charAt(0) }}
                </span>
                <div class="flex-1 text-sm text-slate-700">{{ c.name }}</div>
                <div class="text-xs text-slate-400">{{ c.leader }} · {{ c.members }}人</div>
                <ArrowRight class="h-3.5 w-3.5 text-slate-300" />
              </div>
            </div>
          </div>

          <div class="pt-3 border-t flex gap-2">
            <Button variant="outline" size="sm" class="flex-1" @click="handleAddChild">
              <Plus class="h-3.5 w-3.5 mr-1" />
              添加子部门
            </Button>
            <Button variant="destructive" size="sm" class="flex-1" @click="handleDelete">
              <Trash2 class="h-3.5 w-3.5 mr-1" />
              删除
            </Button>
          </div>
        </div>
        <div v-else class="p-10 text-center text-slate-400 text-sm">
          <Network class="h-12 w-12 mx-auto mb-3 text-slate-300" />
          请选择左侧部门查看详情
        </div>
      </Card>
    </div>
  </div>
</template>
