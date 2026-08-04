<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Package, Sparkles, Edit, Trash2, Play, Users, ChevronRight, Layers, Box } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const router = useRouter()
const searchTerm = ref('')

const suites = ref([
  {
    id: 1,
    name: '员工入职套件',
    desc: '面向新员工的入职引导、信息登记、流程跟踪一体化套件',
    icon: '🎁',
    color: 'from-blue-500 to-cyan-600',
    agents: 3,
    skills: 5,
    workflows: 2,
    users: 128,
    status: 'published',
    updated: '2026-06-15',
  },
  {
    id: 2,
    name: '销售助手套件',
    desc: '客户跟进、报价生成、合同审批一站式销售赋能工具',
    icon: '💼',
    color: 'from-emerald-500 to-teal-600',
    agents: 4,
    skills: 8,
    workflows: 3,
    users: 86,
    status: 'published',
    updated: '2026-06-12',
  },
  {
    id: 3,
    name: '研发协作套件',
    desc: '代码审查、文档生成、Bug 排查一站式研发效能助手',
    icon: '⚙️',
    color: 'from-violet-500 to-purple-600',
    agents: 5,
    skills: 12,
    workflows: 4,
    users: 64,
    status: 'published',
    updated: '2026-06-10',
  },
  {
    id: 4,
    name: '财务自动化套件',
    desc: '发票识别、报销审核、预算分析全流程自动化方案',
    icon: '💰',
    color: 'from-amber-500 to-orange-600',
    agents: 3,
    skills: 6,
    workflows: 2,
    users: 42,
    status: 'draft',
    updated: '2026-06-08',
  },
  {
    id: 5,
    name: '客户服务套件',
    desc: '工单创建、问题分类、智能升级全周期客户支持方案',
    icon: '🎧',
    color: 'from-rose-500 to-pink-600',
    agents: 2,
    skills: 4,
    workflows: 1,
    users: 156,
    status: 'published',
    updated: '2026-06-05',
  },
  {
    id: 6,
    name: '数据分析套件',
    desc: '业务报表生成、指标监控、异常检测智能分析方案',
    icon: '📊',
    color: 'from-indigo-500 to-violet-600',
    agents: 4,
    skills: 7,
    workflows: 3,
    users: 38,
    status: 'draft',
    updated: '2026-05-30',
  },
])

const statusLabels: Record<string, { label: string; color: string }> = {
  published: { label: '已发布', color: 'bg-emerald-50 text-emerald-700' },
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-600' },
}

const filtered = computed(() => {
  if (!searchTerm.value) return suites.value
  const t = searchTerm.value.toLowerCase()
  return suites.value.filter((s) => s.name.toLowerCase().includes(t) || s.desc.toLowerCase().includes(t))
})

const stats = computed(() => ({
  total: suites.value.length,
  published: suites.value.filter((s) => s.status === 'published').length,
  draft: suites.value.filter((s) => s.status === 'draft').length,
  users: suites.value.reduce((s, x) => s + x.users, 0),
}))

const handleDelete = (id: number) => {
  if (confirm('确定删除该套件?')) {
    suites.value = suites.value.filter((s) => s.id !== id)
  }
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 pb-8">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">智能体套件</h1>
        <p class="text-sm text-slate-500 mt-1">将智能体、Skill、工作流组合打包,一站式发布到部门用户</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative w-72 max-w-full">
          <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input v-model="searchTerm" placeholder="搜索套件..." class="pl-9 h-10 bg-white border-slate-200 rounded-xl" />
        </div>
        <Button class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-10 px-5 rounded-xl shadow-md">
          <Plus class="w-4 h-4 mr-2" /> 新建套件
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card class="p-4 border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Package class="w-5 h-5" /></div>
          <div>
            <div class="text-xs text-slate-500 font-bold">套件总数</div>
            <div class="text-2xl font-extrabold text-slate-800 mt-0.5">{{ stats.total }}</div>
          </div>
        </div>
      </Card>
      <Card class="p-4 border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Sparkles class="w-5 h-5" /></div>
          <div>
            <div class="text-xs text-slate-500 font-bold">已发布</div>
            <div class="text-2xl font-extrabold text-emerald-700 mt-0.5">{{ stats.published }}</div>
          </div>
        </div>
      </Card>
      <Card class="p-4 border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Edit class="w-5 h-5" /></div>
          <div>
            <div class="text-xs text-slate-500 font-bold">草稿</div>
            <div class="text-2xl font-extrabold text-amber-700 mt-0.5">{{ stats.draft }}</div>
          </div>
        </div>
      </Card>
      <Card class="p-4 border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><Users class="w-5 h-5" /></div>
          <div>
            <div class="text-xs text-slate-500 font-bold">使用人数</div>
            <div class="text-2xl font-extrabold text-slate-800 mt-0.5">{{ stats.users }}</div>
          </div>
        </div>
      </Card>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <Card v-for="s in filtered" :key="s.id" class="p-5 border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all overflow-hidden relative">
        <div :class="['absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br opacity-10', s.color]"></div>
        <div class="relative space-y-3">
          <div class="flex items-start gap-3">
            <div :class="['w-14 h-14 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center text-2xl shadow-md', s.color]">
              {{ s.icon }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-slate-800">{{ s.name }}</h3>
              <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block', statusLabels[s.status].color]">{{ statusLabels[s.status].label }}</span>
            </div>
          </div>

          <p class="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">{{ s.desc }}</p>

          <div class="grid grid-cols-3 gap-2 py-3 border-y border-slate-100">
            <div class="text-center">
              <div class="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-bold uppercase">智能体</div>
              <div class="text-base font-extrabold text-blue-600 font-mono mt-0.5">{{ s.agents }}</div>
            </div>
            <div class="text-center">
              <div class="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-bold uppercase">Skill</div>
              <div class="text-base font-extrabold text-violet-600 font-mono mt-0.5">{{ s.skills }}</div>
            </div>
            <div class="text-center">
              <div class="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-bold uppercase">工作流</div>
              <div class="text-base font-extrabold text-amber-600 font-mono mt-0.5">{{ s.workflows }}</div>
            </div>
          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-400">
            <span class="flex items-center gap-1"><Users class="w-3 h-3" /> {{ s.users }} 人使用</span>
            <span>更新于 {{ s.updated }}</span>
          </div>

          <div class="flex items-center gap-1.5 pt-2">
            <Button variant="outline" size="sm" class="h-7 text-xs border-slate-200 flex-1">
              <Play class="w-3 h-3 mr-1" /> 预览
            </Button>
            <Button variant="outline" size="sm" class="h-7 text-xs border-slate-200 flex-1">
              <Edit class="w-3 h-3 mr-1" /> 编辑
            </Button>
            <Button variant="outline" size="sm" class="h-7 text-xs border-rose-200 text-rose-600 hover:bg-rose-50" @click="handleDelete(s.id)">
              <Trash2 class="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
