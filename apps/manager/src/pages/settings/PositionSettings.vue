<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Save,
  Plus,
  Award,
  Edit,
  Trash2,
  Briefcase,
  TrendingUp,
  Users,
  ChevronUp,
  ChevronDown,
  Crown,
  Star,
  Target,
  Trophy,
  Medal,
  Search,
  DollarSign,
  Layers,
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

interface Position {
  id: number
  name: string
  level: number
  category: string
  count: number
  salary: string
  requirements: string
  responsibilities: string
}

const searchTerm = ref('')
const selectedCategory = ref('all')
const selectedId = ref<number | null>(101)

const categories = [
  { id: 'all', name: '全部', icon: Layers },
  { id: 'mgmt', name: '管理序列', icon: Crown },
  { id: 'tech', name: '技术序列', icon: Target },
  { id: 'biz', name: '业务序列', icon: TrendingUp },
  { id: 'func', name: '职能序列', icon: Briefcase },
]

const levels = [
  { level: 1, name: 'P1', label: '助理级', icon: Medal, color: 'from-slate-400 to-slate-600' },
  { level: 2, name: 'P2', label: '专员级', icon: Medal, color: 'from-sky-500 to-blue-600' },
  { level: 3, name: 'P3', label: '高级专员', icon: Medal, color: 'from-blue-500 to-cyan-600' },
  { level: 4, name: 'P4', label: '主管级', icon: Trophy, color: 'from-emerald-500 to-teal-600' },
  { level: 5, name: 'P5', label: '经理级', icon: Trophy, color: 'from-violet-500 to-purple-600' },
  { level: 6, name: 'P6', label: '高级经理', icon: Star, color: 'from-amber-500 to-orange-600' },
  { level: 7, name: 'P7', label: '总监级', icon: Crown, color: 'from-rose-500 to-pink-600' },
  { level: 8, name: 'P8', label: '副总裁', icon: Crown, color: 'from-fuchsia-500 to-purple-700' },
  { level: 9, name: 'P9', label: '总裁级', icon: Crown, color: 'from-amber-500 to-red-600' },
]

const positions = ref<Position[]>([
  // 管理序列
  { id: 101, name: '总裁', level: 9, category: 'mgmt', count: 1, salary: '80-150 万/年', requirements: '15 年以上管理经验,知名企业背景', responsibilities: '制定公司战略、统筹经营管理' },
  { id: 102, name: '副总裁', level: 8, category: 'mgmt', count: 4, salary: '60-100 万/年', requirements: '12 年以上管理经验', responsibilities: '分管业务板块的战略与执行' },
  { id: 103, name: '总监', level: 7, category: 'mgmt', count: 12, salary: '40-70 万/年', requirements: '10 年以上专业经验,5 年管理经验', responsibilities: '负责部门的全面管理' },
  { id: 104, name: '高级经理', level: 6, category: 'mgmt', count: 28, salary: '30-50 万/年', requirements: '8 年以上经验,3 年管理经验', responsibilities: '负责核心团队与重点项目' },
  { id: 105, name: '经理', level: 5, category: 'mgmt', count: 56, salary: '20-35 万/年', requirements: '5 年以上专业经验', responsibilities: '负责业务团队管理' },
  { id: 106, name: '主管', level: 4, category: 'mgmt', count: 86, salary: '12-22 万/年', requirements: '3 年以上经验,有带队经验', responsibilities: '负责小组工作分配与指导' },

  // 技术序列
  { id: 201, name: '首席架构师', level: 9, category: 'tech', count: 2, salary: '70-120 万/年', requirements: '15 年架构经验,业界知名', responsibilities: '技术战略与核心架构决策' },
  { id: 202, name: '技术专家', level: 8, category: 'tech', count: 6, salary: '50-90 万/年', requirements: '12 年技术深度', responsibilities: '技术难题攻克与团队指导' },
  { id: 203, name: '高级工程师', level: 6, category: 'tech', count: 48, salary: '25-45 万/年', requirements: '6 年以上开发经验', responsibilities: '核心模块设计与开发' },
  { id: 204, name: '工程师', level: 4, category: 'tech', count: 96, salary: '15-25 万/年', requirements: '3 年开发经验', responsibilities: '独立完成功能开发' },
  { id: 205, name: '助理工程师', level: 2, category: 'tech', count: 24, salary: '8-15 万/年', requirements: '应届毕业生或 1 年经验', responsibilities: '辅助功能开发' },

  // 业务序列
  { id: 301, name: '销售总监', level: 7, category: 'biz', count: 3, salary: '40-80 万/年', requirements: '10 年销售经验', responsibilities: '销售战略与团队管理' },
  { id: 302, name: '销售经理', level: 5, category: 'biz', count: 18, salary: '18-35 万/年', requirements: '5 年销售经验', responsibilities: '销售目标达成' },
  { id: 303, name: '销售代表', level: 3, category: 'biz', count: 42, salary: '10-20 万/年', requirements: '1-3 年销售经验', responsibilities: '客户开发与维护' },
  { id: 304, name: '客户经理', level: 4, category: 'biz', count: 24, salary: '12-22 万/年', requirements: '3 年客户管理经验', responsibilities: '客户关系维护' },

  // 职能序列
  { id: 401, name: 'HR 总监', level: 7, category: 'func', count: 1, salary: '40-70 万/年', requirements: '10 年 HR 经验', responsibilities: 'HR 战略与体系搭建' },
  { id: 402, name: 'HR 经理', level: 5, category: 'func', count: 6, salary: '18-30 万/年', requirements: '5 年 HR 经验', responsibilities: 'HR 模块管理' },
  { id: 403, name: 'HR 专员', level: 3, category: 'func', count: 16, salary: '8-15 万/年', requirements: '1-3 年 HR 经验', responsibilities: 'HR 日常事务处理' },
  { id: 404, name: '财务经理', level: 5, category: 'func', count: 4, salary: '20-35 万/年', requirements: '5 年财务经验', responsibilities: '财务管理' },
  { id: 405, name: '会计', level: 3, category: 'func', count: 12, salary: '8-14 万/年', requirements: '初级会计证', responsibilities: '账务处理' },
])

const filteredPositions = computed(() => {
  return positions.value.filter((p) => {
    if (selectedCategory.value !== 'all' && p.category !== selectedCategory.value) return false
    if (searchTerm.value) {
      const t = searchTerm.value.toLowerCase()
      return p.name.toLowerCase().includes(t) || p.responsibilities.toLowerCase().includes(t)
    }
    return true
  })
})

const selectedPosition = computed(() => positions.value.find((p) => p.id === selectedId.value) || null)

const groupedByLevel = computed(() => {
  const groups: Record<number, Position[]> = {}
  filteredPositions.value.forEach((p) => {
    if (!groups[p.level]) groups[p.level] = []
    groups[p.level].push(p)
  })
  return groups
})

const sortedLevels = computed(() => Object.keys(groupedByLevel.value).map(Number).sort((a, b) => b - a))

const getLevelInfo = (level: number) => levels.find((l) => l.level === level) || levels[0]
const getCategoryInfo = (category: string) => categories.find((c) => c.id === category) || categories[0]

const stats = computed(() => ({
  total: positions.value.length,
  totalEmployees: positions.value.reduce((s, p) => s + p.count, 0),
  avgLevel: (positions.value.reduce((s, p) => s + p.level, 0) / positions.value.length).toFixed(1),
  management: positions.value.filter((p) => p.category === 'mgmt').length,
}))

const handleAdd = () => {
  const newId = Math.max(...positions.value.map((p) => p.id)) + 1
  positions.value.push({
    id: newId,
    name: '新岗位',
    level: 4,
    category: selectedCategory.value === 'all' ? 'func' : (selectedCategory.value as any),
    count: 0,
    salary: '面议',
    requirements: '',
    responsibilities: '',
  })
  selectedId.value = newId
}

const handleDelete = () => {
  if (selectedId.value === null) return
  if (!confirm('确定删除该岗位?')) return
  positions.value = positions.value.filter((p) => p.id !== selectedId.value)
  selectedId.value = null
}

const handleSave = () => {
  alert('岗位体系已保存(演示)')
}

const moveUp = (id: number) => {
  const idx = positions.value.findIndex((p) => p.id === id)
  if (idx > 0) {
    const temp = positions.value[idx].level
    positions.value[idx].level = positions.value[idx - 1].level
    positions.value[idx - 1].level = temp
  }
}

const moveDown = (id: number) => {
  const idx = positions.value.findIndex((p) => p.id === id)
  if (idx < positions.value.length - 1) {
    const temp = positions.value[idx].level
    positions.value[idx].level = positions.value[idx + 1].level
    positions.value[idx + 1].level = temp
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">岗位体系设置</h1>
        <p class="mt-1 text-sm text-slate-500">定义企业岗位层级与职级序列,作为权限分配和晋升评估的依据</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline">
          <Plus class="h-4 w-4 mr-1" />
          导入职级
        </Button>
        <Button variant="outline" @click="handleAdd">
          <Plus class="h-4 w-4 mr-1" />
          新增岗位
        </Button>
        <Button @click="handleSave">
          <Save class="h-4 w-4 mr-1" />
          保存
        </Button>
      </div>
    </div>

    <!-- 概览 -->
    <div class="grid grid-cols-4 gap-4">
      <Card class-name="p-4 flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Briefcase class="h-5 w-5" />
        </span>
        <div>
          <div class="text-xs text-slate-500">岗位数量</div>
          <div class="text-xl font-bold text-slate-800">{{ stats.total }}</div>
        </div>
      </Card>
      <Card class-name="p-4 flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <Users class="h-5 w-5" />
        </span>
        <div>
          <div class="text-xs text-slate-500">覆盖员工</div>
          <div class="text-xl font-bold text-slate-800">{{ stats.totalEmployees }}</div>
        </div>
      </Card>
      <Card class-name="p-4 flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Award class="h-5 w-5" />
        </span>
        <div>
          <div class="text-xs text-slate-500">平均职级</div>
          <div class="text-xl font-bold text-slate-800">P{{ stats.avgLevel }}</div>
        </div>
      </Card>
      <Card class-name="p-4 flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Crown class="h-5 w-5" />
        </span>
        <div>
          <div class="text-xs text-slate-500">管理岗位</div>
          <div class="text-xl font-bold text-slate-800">{{ stats.management }}</div>
        </div>
      </Card>
    </div>

    <!-- 职级图谱 -->
    <Card class-name="p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <Award class="h-4 w-4" />
          职级晋升通道
        </h3>
        <div class="flex items-center gap-2">
          <Input v-model="searchTerm" placeholder="搜索岗位" class="h-8 text-xs w-48" />
          <div class="flex items-center rounded-md border border-slate-200 p-0.5 text-xs">
            <button
              v-for="c in categories"
              :key="c.id"
              :class="['px-2.5 py-1 rounded transition-colors flex items-center gap-1', selectedCategory === c.id ? 'bg-blue-100 text-blue-600' : 'text-slate-500']"
              @click="selectedCategory = c.id"
            >
              <component :is="c.icon" class="h-3 w-3" />
              {{ c.name }}
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div v-for="lvl in sortedLevels" :key="lvl" class="flex items-stretch gap-3">
          <!-- 职级标识 -->
          <div
            :class="['flex w-24 shrink-0 items-center justify-center rounded-lg text-white bg-gradient-to-br', getLevelInfo(lvl).color]"
          >
            <div class="text-center">
              <div class="text-2xl font-bold">{{ getLevelInfo(lvl).name }}</div>
              <div class="text-[10px] opacity-90">{{ getLevelInfo(lvl).label }}</div>
            </div>
          </div>
          <!-- 岗位卡片 -->
          <div class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <button
              v-for="p in groupedByLevel[lvl]"
              :key="p.id"
              :class="[
                'flex items-center gap-2 rounded-lg border bg-white p-2.5 text-left transition-all',
                selectedId === p.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300',
              ]"
              @click="selectedId = p.id"
            >
              <span
                :class="[
                  'flex h-8 w-8 items-center justify-center rounded-md text-white bg-gradient-to-br',
                  getCategoryInfo(p.category).id === 'mgmt' ? 'from-amber-500 to-orange-600' :
                  getCategoryInfo(p.category).id === 'tech' ? 'from-blue-500 to-cyan-600' :
                  getCategoryInfo(p.category).id === 'biz' ? 'from-rose-500 to-pink-600' :
                  'from-violet-500 to-purple-600',
                ]"
              >
                <component :is="getCategoryInfo(p.category).icon" class="h-4 w-4" />
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-slate-800 truncate">{{ p.name }}</div>
                <div class="text-[10px] text-slate-500 flex items-center gap-1">
                  <Users class="h-2.5 w-2.5" />
                  {{ p.count }} 人
                </div>
              </div>
              <DollarSign class="h-3 w-3 text-emerald-500" />
            </button>
          </div>
        </div>
      </div>
    </Card>

    <!-- 详情面板 -->
    <Card v-if="selectedPosition" class-name="p-5">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <span
            :class="[
              'flex h-12 w-12 items-center justify-center rounded-lg text-white text-lg font-bold bg-gradient-to-br',
              getLevelInfo(selectedPosition.level).color,
            ]"
          >
            {{ getLevelInfo(selectedPosition.level).name }}
          </span>
          <div>
            <Input v-model="selectedPosition.name" class="text-base font-semibold" />
            <div class="text-xs text-slate-500 mt-1">
              {{ getCategoryInfo(selectedPosition.category).name }} · {{ getLevelInfo(selectedPosition.level).label }}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <Button variant="ghost" size="icon" @click="moveUp(selectedPosition.id)">
            <ChevronUp class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" @click="moveDown(selectedPosition.id)">
            <ChevronDown class="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" @click="handleDelete">
            <Trash2 class="h-3.5 w-3.5 mr-1" />
            删除
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label class="text-xs font-medium text-slate-600 mb-1.5 block">职级</label>
          <select v-model="selectedPosition.level" class="w-full h-9 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-blue-500">
            <option v-for="l in levels" :key="l.level" :value="l.level">{{ l.name }} · {{ l.label }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-slate-600 mb-1.5 block">序列</label>
          <select v-model="selectedPosition.category" class="w-full h-9 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-blue-500">
            <option v-for="c in categories.filter((x) => x.id !== 'all')" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-slate-600 mb-1.5 block">编制人数</label>
          <Input v-model="selectedPosition.count" type="number" />
        </div>
        <div class="col-span-3">
          <label class="text-xs font-medium text-slate-600 mb-1.5 block">薪酬范围</label>
          <div class="flex items-center gap-2 px-3 h-9 rounded-md border border-slate-200">
            <DollarSign class="h-3.5 w-3.5 text-emerald-500" />
            <input v-model="selectedPosition.salary" class="flex-1 text-sm outline-none bg-transparent" />
          </div>
        </div>
        <div class="col-span-3">
          <label class="text-xs font-medium text-slate-600 mb-1.5 block">任职要求</label>
          <textarea
            v-model="selectedPosition.requirements"
            rows="2"
            class="w-full text-sm rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
        <div class="col-span-3">
          <label class="text-xs font-medium text-slate-600 mb-1.5 block">岗位职责</label>
          <textarea
            v-model="selectedPosition.responsibilities"
            rows="3"
            class="w-full text-sm rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </Card>
  </div>
</template>
