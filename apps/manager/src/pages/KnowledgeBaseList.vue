<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Search, Plus, Trash, Play, RefreshCw, Loader2, Globe, Database, 
  Folder, UserCheck, Info, ShieldAlert, Lock 
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import DomainSidebar from '@/components/common/DomainSidebar.vue'
import { getKBs, deleteKB, saveKBs, checkKBPermissions, type KnowledgeBase } from '@/lib/kb-store'
import { getFlatDomains, isDomainMatch } from '@/lib/domain-store'

interface User {
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

interface Department {
  id: string
  name: string
}

interface Position {
  id: string
  title: string
}

interface UserGroup {
  id: string
  name: string
}

const router = useRouter()
const route = useRoute()

const currentType = computed(() => {
  const type = route.query.type as string || 'local'
  return ['local', 'web', 'db'].includes(type) ? type : 'local'
})

const searchTerm = ref('')
const selectedDomain = ref('all')
const kbs = ref<KnowledgeBase[]>([])
const customToast = ref<string | null>(null)
const runningWebCrawlId = ref<string | null>(null)
const runningDbSyncId = ref<string | null>(null)

const usersList = ref<User[]>([
  { id: 'user-1', name: '马博林 (超级管理员)', email: 'maboling@aistudio.com', username: 'admin_maboling', role: 'admin', departmentId: 'dept-3', positionId: 'pos-1', userGroupId: 'group-4', status: 'active', createdAt: '2026-01-01' },
  { id: 'user-2', name: '陈总编', email: 'editor_chen@aistudio.com', username: 'editor_chen', role: 'editor', departmentId: 'dept-2', positionId: 'pos-2', userGroupId: 'group-2', status: 'active', createdAt: '2026-01-15' },
  { id: 'user-3', name: '叶教授 (外语教研)', email: 'prof_ye@aistudio.com', username: 'prof_ye', role: 'editor', departmentId: 'dept-3', positionId: 'pos-4', userGroupId: 'group-1', status: 'active', createdAt: '2026-02-01' },
  { id: 'user-4', name: '张老师 (网络工程)', email: 'teacher_zhang@aistudio.com', username: 'teacher_zhang', role: 'viewer', departmentId: 'dept-4', positionId: 'pos-4', userGroupId: 'group-1', status: 'active', createdAt: '2026-02-05' },
  { id: 'user-5', name: '肖经理 (大屏运维)', email: 'ops_xiao@aistudio.com', username: 'ops_xiao', role: 'editor', departmentId: 'dept-1', positionId: 'pos-3', userGroupId: 'group-3', status: 'active', createdAt: '2026-01-20' },
  { id: 'user-6', name: '李总监 (集团HR)', email: 'hr_li@aistudio.com', username: 'hr_li', role: 'viewer', departmentId: 'dept-5', positionId: 'pos-5', userGroupId: 'group-4', status: 'active', createdAt: '2025-12-05' }
])

const departments: Department[] = [
  { id: 'dept-1', name: '大屏业务运维部' },
  { id: 'dept-2', name: '融媒体新闻中心' },
  { id: 'dept-3', name: '语言学与人工智能教研室' },
  { id: 'dept-4', name: '计算机网络教研组' },
  { id: 'dept-5', name: '集团综合人力资源部' }
]

const positions: Position[] = [
  { id: 'pos-1', title: '中台超级管理员' },
  { id: 'pos-2', title: '融媒体总编辑' },
  { id: 'pos-3', title: 'IPTV 播控核验专家' },
  { id: 'pos-4', title: '高级副教授 / 讲师' },
  { id: 'pos-5', title: '资深人力资源专家' }
]

const userGroups: UserGroup[] = [
  { id: 'group-1', name: '教研室核心骨干组' },
  { id: 'group-2', name: '新媒体联合编审会' },
  { id: 'group-3', name: 'IPTV 客服大屏交付组' },
  { id: 'group-4', name: '中台研发集成室' }
]

const currentUserId = ref('user-1')

onMounted(() => {
  kbs.value = getKBs()
  const savedUserId = localStorage.getItem('current-mock-user-id')
  if (savedUserId && usersList.value.some(u => u.id === savedUserId)) {
    currentUserId.value = savedUserId
  } else {
    localStorage.setItem('current-mock-user-id', 'user-1')
  }
})

const handleUserChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value
  currentUserId.value = val
  localStorage.setItem('current-mock-user-id', val)
}

const getDomainLabel = (domainId: string) => {
  const flat = getFlatDomains()
  const found = flat.find(f => f.id === domainId)
  return found ? found.label : '公共领域'
}

const handleDelete = (id: string) => {
  if (confirm('确定要彻底删除该项知识库及关联向量索引吗？')) {
    deleteKB(id)
    kbs.value = getKBs()
    customToast.value = '🗑️ 知识库及其向量索引分包已安全销毁清退。'
    setTimeout(() => { customToast.value = null }, 4000)
  }
}

const activeUser = computed(() => usersList.value.find(u => u.id === currentUserId.value) || usersList.value[0])

const getActiveUserOrgInfo = () => {
  if (!activeUser.value) return ''
  const activeDept = departments.find(d => d.id === activeUser.value!.departmentId)?.name || '安全隔离部'
  const activePos = positions.find(p => p.id === activeUser.value!.positionId)?.title || '合规工程师'
  const activeGroup = userGroups.find(g => g.id === activeUser.value!.userGroupId)?.name || '通用审计组'
  return `${activeDept} / ${activePos} [${activeGroup}]`
}

const handleWebCrawlRunSimulate = (kbId: string, docId: string, docName: string) => {
  runningWebCrawlId.value = docId
  customToast.value = `🕸️ 触发增量爬虫对齐：正在深度级联探测 [${docName}] ...`
  
  setTimeout(() => {
    runningWebCrawlId.value = null
    customToast.value = '✅ 万维网网页抓取对齐圆满成功！更新了索引 HNSW 地图缓存。'
    
    const updated = kbs.value.map(k => {
      if (k.id === kbId) {
        return {
          ...k,
          wordCount: k.wordCount + Math.floor(Math.random() * 8000) + 2000,
          status: '解析完成',
          progress: 100
        }
      }
      return k
    })
    kbs.value = updated
    saveKBs(updated)
    setTimeout(() => { customToast.value = null }, 4000)
  }, 2000)
}

const handleDbSyncRunSimulate = (kbId: string, docId: string, docName: string) => {
  runningDbSyncId.value = docId
  customToast.value = `🔌 触发 JDBC 数仓全量核对：正在读取并生成 MD5 增量块 [${docName}] ...`
  
  setTimeout(() => {
    runningDbSyncId.value = null
    customToast.value = '✅ JDBC 结构化数据映射向量转换成功！完成了增量对齐。'
    
    const updated = kbs.value.map(k => {
      if (k.id === kbId) {
        return {
          ...k,
          wordCount: k.wordCount + Math.floor(Math.random() * 12000) + 5000,
          status: '解析完成',
          progress: 100
        }
      }
      return k
    })
    kbs.value = updated
    saveKBs(updated)
    setTimeout(() => { customToast.value = null }, 4000)
  }, 2000)
}

const filteredKBs = computed(() => {
  return kbs.value.filter(kb => {
    if (kb.type !== currentType.value) return false
    
    if (searchTerm.value.trim()) {
      const query = searchTerm.value.toLowerCase()
      const matchTitle = kb.title.toLowerCase().includes(query)
      const matchDesc = kb.description?.toLowerCase().includes(query) || false
      if (!matchTitle && !matchDesc) return false
    }
    
    if (selectedDomain.value !== 'all') {
      if (!isDomainMatch(kb.domain, selectedDomain.value)) return false
    }
    
    if (activeUser.value) {
      const perms = checkKBPermissions(kb, activeUser.value)
      if (!perms.canManage && !perms.canQuery) return false
    }
    
    return true
  })
})

const getModuleTitleChinese = () => {
  if (currentType.value === 'local') return '本地物理文档接入'
  if (currentType.value === 'web') return '万维网网页链接接入'
  return '企业数据库 JDBC 定时同步'
}

const getModuleDescChinese = () => {
  if (currentType.value === 'local') return '手动划分物理文件夹、上传文档底本、分层隔离向量资源'
  if (currentType.value === 'web') return '配置网络蜘蛛 URL 进行层级递归抓取，自动提纯 Markdown'
  return '设定定时 Cron SQL 语句高维同步，多线程 JDBC 全自动无感 RAG 对齐'
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return '超级管理员'
    case 'editor': return '业务主管'
    default: return '普通审计'
  }
}

const handleAccessDenied = (userName: string, kbTitle: string) => {
  customToast.value = '🔒 安全拦截：您当前模拟的账号 "' + userName + '" 既不具备对 [' + kbTitle + '] 的管理权限，也没有进行检索、对话及阅读的受保权限。'
  setTimeout(() => { customToast.value = null }, 4000)
}
</script>

<template>
  <div class="p-6 max-w-[1600px] mx-auto space-y-6">
    <div v-if="customToast" class="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700/50 text-white rounded-xl px-4 py-3 shadow-xl flex items-center gap-2.5 animate-slide-in text-xs max-w-sm">
      <Info class="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{{ customToast }}</span>
    </div>

    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
      <div class="space-y-1.5 z-10">
        <div class="flex items-center gap-2">
          <span class="bg-emerald-50 text-emerald-800 font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded tracking-wider border border-emerald-200">SECURE RAG</span>
          <span class="text-slate-500 text-xs font-mono">系统资源管控</span>
        </div>
        <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Folder v-if="currentType === 'local'" class="w-7 h-7 text-emerald-600 fill-emerald-50" />
          <Globe v-else-if="currentType === 'web'" class="w-7 h-7 text-sky-600 fill-sky-50" />
          <Database v-else class="w-7 h-7 text-violet-600 fill-violet-50" />
          <span>{{ getModuleTitleChinese() }}</span>
        </h1>
        <p class="text-xs text-slate-500">{{ getModuleDescChinese() }}</p>
        
        <div v-if="activeUser" class="pt-2 flex items-center gap-2 text-slate-500 text-[11px] leading-none shrink-0 flex-wrap">
          <span class="bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-mono flex items-center gap-1.5">
            <UserCheck class="w-3.5 h-3.5 text-amber-500" />
            <span>提问沙箱身份: <strong class="text-amber-600 font-extrabold">{{ activeUser.name }}</strong></span>
          </span>
          <span class="text-slate-300">|</span>
          <span class="text-blue-600 truncate font-medium">{{ getActiveUserOrgInfo() }}</span>
        </div>
      </div>

      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2 min-w-[250px] z-10 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold text-slate-500">安全阻断模拟：切换工作身份</span>
          <span class="text-[10px] text-amber-700 font-mono font-black bg-amber-50 px-1 py-0.5 rounded border border-amber-200">ROLE SELECT</span>
        </div>
        <select 
          :value="currentUserId"
          @change="handleUserChange"
          class="w-full text-xs h-8 rounded border border-slate-200 bg-white text-slate-800 px-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
        >
          <option v-for="u in usersList" :key="u.id" :value="u.id" class="bg-white text-slate-800">
            {{ u.name }} ({{ getRoleLabel(u.role) }})
          </option>
        </select>
      </div>
    </div>

    <div class="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-sm">
      <div class="flex items-center gap-3 w-full md:w-auto flex-wrap">
        <div class="relative w-full sm:w-[320px]">
          <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            v-model="searchTerm"
            :placeholder="`搜索归属您的 [${getModuleTitleChinese()}] ...`" 
            class="pl-9 bg-white text-xs h-9 border-slate-200" 
          />
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <template v-if="activeUser && activeUser.role !== 'viewer'">
          <router-link :to="`/kb/new?type=${currentType}`">
             <Button size="sm" class="bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-sm text-xs py-1.5 h-9">
                <Plus class="w-4 h-4 mr-1" />
                新建 {{ currentType === 'local' ? '文档' : currentType === 'web' ? '网页' : '数据库' }} 知识库
             </Button>
          </router-link>
        </template>
        <template v-else>
          <Button size="sm" disabled class="bg-slate-100 text-slate-400 border border-slate-200 text-xs py-1.5 h-9 flex items-center gap-1 cursor-not-allowed">
            <Lock class="w-3.5 h-3.5" />
            只读角色禁止新建
          </Button>
        </template>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-6 items-start">
      <div class="hidden lg:block w-64 shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <DomainSidebar 
           v-model="selectedDomain" 
        />
      </div>

      <div class="flex-1 w-full space-y-4">
        <div class="flex items-center justify-between border-b pb-2">
          <h2 class="text-xs font-bold text-blue-600 border-b-2 border-blue-600 pb-2 -mb-[10px] px-1 uppercase tracking-wider flex items-center gap-1">
            <span>{{ getModuleTitleChinese() }}列表</span>
            <span class="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono">
              {{ filteredKBs.length }} 库
            </span>
          </h2>
          <span class="text-[10px] text-slate-400">已自适应过滤归纳</span>
        </div>

        <div v-if="filteredKBs.length === 0" class="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-6 gap-3">
          <ShieldAlert class="w-12 h-12 text-slate-300 animate-pulse" />
          <div class="space-y-1 max-w-md">
            <p class="text-xs font-bold text-slate-700">未检索到任何符合筛选条件的[{{ getModuleTitleChinese() }}]</p>
            <p class="text-[10px] text-slate-400 leading-relaxed">
              可能是当前选择的企业模拟账号 "{{ activeUser?.name || '未知' }}" 的所属部门、职务岗位不具备此安全级别可见。或者尚未在此分类下注册特定规则。
            </p>
          </div>
          <div class="pt-2 flex gap-2">
            <Button 
              @click="searchTerm = ''" 
              variant="outline" 
              size="sm" 
              class="text-xs text-slate-600 border-slate-200"
            >
              清除搜索关键字
            </Button>
            <router-link v-if="activeUser && activeUser.role !== 'viewer'" :to="`/kb/new?type=${currentType}`">
              <Button size="sm" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                立即创建首项知识库
              </Button>
            </router-link>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-1">
          <Card 
            v-for="kb in filteredKBs" 
            :key="kb.id" 
            class="transition-all duration-200 select-none flex flex-col h-[270px] relative overflow-hidden bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-xl group p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3 shrink-0">
              <div class="flex items-center gap-1.5 min-w-0">
                <div :class="[
                  'p-1 rounded font-mono font-bold text-[10px] shrink-0 uppercase border',
                  currentType === 'local' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  currentType === 'web' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                  'bg-violet-50 text-violet-700 border-violet-100'
                ]">
                  {{ kb.type === 'local' ? '文档知识' : kb.type === 'web' ? '网页知识' : '环境数据' }}
                </div>
                <span class="text-[11px] text-slate-400 font-mono shrink-0">#{{ kb.id }}</span>
              </div>

              <button 
                v-if="checkKBPermissions(kb, activeUser!).canManage"
                @click="handleDelete(kb.id)"
                class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                title="删除该知识库"
              >
                <Trash class="w-3.5 h-3.5" />
              </button>
            </div>

            <div class="flex-1 flex flex-col min-h-0 pt-2.5">
              <h3 
                @click="() => {
                  const perms = checkKBPermissions(kb, activeUser!)
                  if (!perms.canManage && !perms.canQuery) {
                    handleAccessDenied(activeUser.name, kb.title)
                    return
                  }
                  router.push(`/kb/${kb.id}`)
                }"
                :class="[
                  'text-slate-850 font-bold text-[13px] line-clamp-2 leading-snug cursor-pointer hover:text-blue-600 transition-colors',
                  (!checkKBPermissions(kb, activeUser!).canManage && !checkKBPermissions(kb, activeUser!).canQuery) ? 'line-through text-slate-400' : ''
                ]"
                :title="kb.title"
              >
                {{ kb.title }}
              </h3>

              <p class="text-[10px] text-slate-400 line-clamp-2 leading-relaxed pt-2 mt-auto" :title="kb.description">
                {{ kb.description || '暂无库合规声明备注。' }}
              </p>

              <div class="flex flex-wrap gap-1 pt-2.5">
                <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-100">
                  {{ getDomainLabel(kb.domain) }}
                </span>
                <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-100 font-mono">
                  {{ kb.embeddingModel.split(' ')[0] }}
                </span>
              </div>
            </div>

            <div class="py-2.5 my-2 border-t border-dashed border-slate-150 flex items-center justify-between shrink-0">
              <span class="text-[10px] text-slate-400">特许权限审计：</span>
              <div class="flex items-center gap-1 text-[9px]">
                <span 
                  :class="[
                    'px-1.5 py-0.5 rounded',
                    checkKBPermissions(kb, activeUser!).canManage ? 'bg-blue-50 text-blue-700 border border-blue-150' : 'bg-slate-100 text-slate-350 line-through'
                  ]"
                  :title="checkKBPermissions(kb, activeUser!).canManage ? '拥有该库管理权' : '无管理权'"
                >
                  👑 管理
                </span>
                <span 
                  :class="[
                    'px-1.5 py-0.5 rounded',
                    checkKBPermissions(kb, activeUser!).canQuery ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' : 'bg-slate-100 text-slate-350 line-through'
                  ]"
                  :title="checkKBPermissions(kb, activeUser!).canQuery ? '拥有检索对话权' : '无问答权'"
                >
                  💬 问答
                </span>
                <span 
                  :class="[
                    'px-1.5 py-0.5 rounded',
                    checkKBPermissions(kb, activeUser!).canDownload ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-slate-100 text-slate-350 line-through'
                  ]"
                  :title="checkKBPermissions(kb, activeUser!).canDownload ? '可下载原始文档' : '无直接下载权'"
                >
                  📥 下载
                </span>
              </div>
            </div>

            <div class="border-t border-slate-100 pt-2.5 mt-auto flex items-center justify-between text-[11px] shrink-0 bg-slate-50/20 -mx-4 -mb-4 p-3.5">
              <div class="flex items-center gap-1.5">
                <span v-if="kb.status === '待解析'" class="text-amber-500 font-bold block shrink-0 text-[10px]">● 待同步解析</span>
                <span v-else class="text-indigo-600 font-bold block shrink-0 text-[10px]">● 已归集就绪</span>
              </div>

              <div class="flex items-center gap-2">
                <Button 
                  v-if="currentType === 'web' && checkKBPermissions(kb, activeUser!).canManage"
                  size="sm" 
                  @click="(e: MouseEvent) => {
                    e.stopPropagation()
                    handleWebCrawlRunSimulate(kb.id, `crawl-c-${kb.id}`, kb.title)
                  }"
                  :disabled="runningWebCrawlId !== null"
                  class="h-7 text-[10px] bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-150 px-2 font-bold flex items-center gap-0.5"
                >
                  <Loader2 v-if="runningWebCrawlId === `crawl-c-${kb.id}`" class="w-3 h-3 animate-spin text-sky-600" />
                  <Play v-else class="w-3.5 h-3.5 text-sky-600 fill-sky-200" />
                  <span>即时增量抓取</span>
                </Button>

                <Button 
                  v-if="currentType === 'db' && checkKBPermissions(kb, activeUser!).canManage"
                  size="sm" 
                  @click="(e: MouseEvent) => {
                    e.stopPropagation()
                    handleDbSyncRunSimulate(kb.id, `db-s-${kb.id}`, kb.title)
                  }"
                  :disabled="runningDbSyncId !== null"
                  class="h-7 text-[10px] bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-150 px-2 font-bold flex items-center gap-0.5"
                >
                  <Loader2 v-if="runningDbSyncId === `db-s-${kb.id}`" class="w-3 h-3 animate-spin text-violet-600 font-black" />
                  <RefreshCw v-else class="w-3 h-3 text-violet-600" />
                  <span>数仓即时同步</span>
                </Button>
                
                <Button 
                  size="sm" 
                  @click="(e: MouseEvent) => {
                    e.stopPropagation()
                    router.push(`/kb/${kb.id}`)
                  }"
                  class="h-7 text-[10px] bg-slate-900 text-white hover:bg-slate-800 font-bold px-2.5"
                >
                  详情
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div class="mt-8 pt-6 flex justify-between items-center text-xs text-slate-500 gap-4 border-t border-slate-100 flex-wrap">
           <span>共 {{ filteredKBs.length }} 个知识仓库可见</span>
           <span class="bg-slate-100 px-2.5 py-1 rounded font-semibold text-[11px]">10项 / 页</span>
           <div class="flex items-center gap-1 border border-slate-200 rounded overflow-hidden bg-white">
              <button class="px-3 py-1 hover:bg-slate-50 border-r border-slate-200 h-8 text-[11px] font-medium text-slate-500">上一页</button>
              <button class="px-3 py-1 bg-blue-600 text-white font-extrabold h-8 w-8 flex items-center justify-center">1</button>
              <button class="px-3 py-1 hover:bg-slate-50 border-l border-slate-200 h-8 text-[11px] font-medium text-slate-500">下一页</button>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>
