<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Save, ArrowLeft, Database, Server, FileText, CheckCircle2, AlertCircle, Loader2, TestTube, Sparkles, Plus, Trash2 } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const router = useRouter()

const form = ref({
  name: '',
  type: 'mysql',
  host: '',
  port: 3306,
  database: '',
  username: '',
  password: '',
  description: '',
  syncFreq: 'realtime',
  ssl: false,
  whitelistTables: [] as string[],
})

const connectionStatus = ref<'idle' | 'testing' | 'success' | 'failed'>('idle')
const connectionMessage = ref('')
const activeTab = ref<'basic' | 'advanced' | 'tables'>('basic')

const typeOptions = [
  { id: 'mysql', label: 'MySQL', icon: Database, color: 'from-blue-500 to-cyan-600', defaultPort: 3306 },
  { id: 'postgresql', label: 'PostgreSQL', icon: Database, color: 'from-indigo-500 to-violet-600', defaultPort: 5432 },
  { id: 'oracle', label: 'Oracle', icon: Database, color: 'from-rose-500 to-pink-600', defaultPort: 1521 },
  { id: 'mongodb', label: 'MongoDB', icon: Database, color: 'from-emerald-500 to-teal-600', defaultPort: 27017 },
  { id: 'api', label: 'REST API', icon: Server, color: 'from-amber-500 to-orange-600', defaultPort: 443 },
  { id: 'file', label: '文件存储', icon: FileText, color: 'from-slate-500 to-slate-700', defaultPort: 0 },
]

const detectedTables = ref([
  { name: 'customer', rows: '128K', selected: true },
  { name: 'order', rows: '892K', selected: true },
  { name: 'order_item', rows: '3.2M', selected: true },
  { name: 'product', rows: '12K', selected: true },
  { name: 'payment', rows: '892K', selected: false },
  { name: 'invoice', rows: '680K', selected: true },
  { name: 'logistics', rows: '320K', selected: false },
  { name: 'inventory', rows: '46K', selected: false },
])

const syncOptions = [
  { id: 'realtime', label: '实时同步 (CDC)' },
  { id: '5min', label: '每 5 分钟' },
  { id: 'hourly', label: '每小时' },
  { id: 'daily', label: '每天 02:00' },
  { id: 'manual', label: '手动触发' },
]

const selectedType = computed(() => typeOptions.find((t) => t.id === form.value.type))

const handleTypeChange = (id: string) => {
  form.value.type = id as any
  const t = typeOptions.find((x) => x.id === id)
  if (t) form.value.port = t.defaultPort
  connectionStatus.value = 'idle'
}

const handleTest = () => {
  if (!form.value.host || !form.value.database) {
    alert('请填写完整连接信息')
    return
  }
  connectionStatus.value = 'testing'
  setTimeout(() => {
    if (form.value.host.includes('fail')) {
      connectionStatus.value = 'failed'
      connectionMessage.value = '无法连接:超时 5000ms,请检查网络或主机地址'
    } else {
      connectionStatus.value = 'success'
      connectionMessage.value = '连接成功!已识别 8 张表,合计 5.97M 行'
    }
  }, 1000)
}

const toggleTable = (name: string) => {
  const t = detectedTables.value.find((x) => x.name === name)
  if (t) t.selected = !t.selected
}

const handleSave = () => {
  if (!form.value.name.trim()) {
    alert('请输入数据源名称')
    return
  }
  if (connectionStatus.value !== 'success') {
    if (!confirm('尚未测试连接,确定保存吗?')) return
  }
  alert('数据源已创建(演示)')
  router.push('/data/access')
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 pb-8">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3">
        <Button variant="outline" size="icon" class="h-9 w-9" @click="router.push('/data/access')">
          <ArrowLeft class="w-4 h-4" />
        </Button>
        <div>
          <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">新建数据源</h1>
          <p class="text-sm text-slate-500 mt-1">配置数据库、API 或文件存储的连接与同步策略</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" class="h-10 px-4 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold" @click="handleTest">
          <TestTube class="w-4 h-4 mr-2" /> 测试连接
        </Button>
        <Button class="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold h-10 px-5 rounded-xl shadow-md" @click="handleSave">
          <Save class="w-4 h-4 mr-2" /> 保存数据源
        </Button>
      </div>
    </div>

    <!-- 类型选择 -->
    <Card class="p-5 border-slate-200">
      <h2 class="text-sm font-extrabold text-slate-800 mb-3">1. 选择数据源类型</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          v-for="t in typeOptions"
          :key="t.id"
          :class="['p-3 rounded-xl border-2 transition-all text-left', form.type === t.id ? 'border-blue-400 bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white']"
          @click="handleTypeChange(t.id)"
        >
          <div :class="['w-9 h-9 rounded-lg bg-gradient-to-br text-white flex items-center justify-center mb-2', t.color]">
            <component :is="t.icon" class="w-4.5 h-4.5" />
          </div>
          <div class="text-sm font-bold text-slate-800">{{ t.label }}</div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">:{{ t.defaultPort || 'N/A' }}</div>
        </button>
      </div>
    </Card>

    <!-- 标签页 -->
    <Card class="border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
      <div class="border-b border-slate-200 px-2 flex items-center gap-1">
        <button
          v-for="t in [
            { id: 'basic', label: '基础配置', icon: Database },
            { id: 'advanced', label: '高级设置', icon: Sparkles },
            { id: 'tables', label: '表映射', icon: FileText },
          ]"
          :key="t.id"
          :class="['px-4 py-3 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors', activeTab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800']"
          @click="activeTab = t.id as any"
        >
          <component :is="t.icon" class="w-3.5 h-3.5" />
          {{ t.label }}
        </button>
      </div>

      <div class="p-5 overflow-y-auto flex-1">
        <!-- 基础配置 -->
        <div v-if="activeTab === 'basic'" class="space-y-4 max-w-3xl">
          <div>
            <label class="text-xs font-bold text-slate-700 mb-1.5 block">数据源名称 <span class="text-rose-500">*</span></label>
            <Input v-model="form.name" placeholder="例如:CRM 客户主数据" class="h-9 border-slate-200" />
          </div>
          <div class="grid grid-cols-[1fr_140px] gap-3">
            <div>
              <label class="text-xs font-bold text-slate-700 mb-1.5 block">主机地址 <span class="text-rose-500">*</span></label>
              <Input v-model="form.host" placeholder="192.168.x.x 或域名" class="h-9 border-slate-200 font-mono" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-700 mb-1.5 block">端口</label>
              <Input v-model.number="form.port" type="number" class="h-9 border-slate-200 font-mono" />
            </div>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 mb-1.5 block">数据库 / 路径 <span class="text-rose-500">*</span></label>
            <Input v-model="form.database" placeholder="数据库名或 API 路径" class="h-9 border-slate-200 font-mono" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold text-slate-700 mb-1.5 block">用户名</label>
              <Input v-model="form.username" placeholder="数据库账号" class="h-9 border-slate-200" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-700 mb-1.5 block">密码</label>
              <Input v-model="form.password" type="password" placeholder="••••••••" class="h-9 border-slate-200" />
            </div>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 mb-1.5 block">描述</label>
            <textarea v-model="form.description" rows="3" placeholder="简述数据源用途..." class="w-full px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
          </div>

          <div
            v-if="connectionStatus !== 'idle'"
            :class="['flex items-start gap-3 p-3 rounded-xl border-2', connectionStatus === 'testing' ? 'bg-blue-50 border-blue-200' : connectionStatus === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200']"
          >
            <Loader2 v-if="connectionStatus === 'testing'" class="w-5 h-5 text-blue-600 animate-spin shrink-0 mt-0.5" />
            <CheckCircle2 v-else-if="connectionStatus === 'success'" class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <AlertCircle v-else class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div class="flex-1 text-sm">
              <div :class="['font-bold', connectionStatus === 'testing' ? 'text-blue-700' : connectionStatus === 'success' ? 'text-emerald-700' : 'text-rose-700']">
                {{ connectionStatus === 'testing' ? '正在测试连接...' : connectionStatus === 'success' ? '连接成功' : '连接失败' }}
              </div>
              <div class="text-slate-600 mt-0.5" v-if="connectionMessage">{{ connectionMessage }}</div>
            </div>
          </div>
        </div>

        <!-- 高级设置 -->
        <div v-else-if="activeTab === 'advanced'" class="space-y-4 max-w-3xl">
          <div>
            <label class="text-xs font-bold text-slate-700 mb-1.5 block">同步频率</label>
            <select v-model="form.syncFreq" class="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option v-for="s in syncOptions" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <input v-model="form.ssl" type="checkbox" id="ssl" class="w-4 h-4 accent-blue-600" />
            <label for="ssl" class="text-sm text-slate-700">启用 SSL/TLS 加密连接</label>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-700 mb-1.5 block">连接池配置</label>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-[10px] text-slate-500">最小连接数</span>
                <Input :model-value="2" type="number" class="h-9 border-slate-200 mt-1 font-mono" />
              </div>
              <div>
                <span class="text-[10px] text-slate-500">最大连接数</span>
                <Input :model-value="20" type="number" class="h-9 border-slate-200 mt-1 font-mono" />
              </div>
            </div>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-700 mb-1.5 block">查询超时 (秒)</label>
            <Input :model-value="30" type="number" class="h-9 border-slate-200 max-w-xs font-mono" />
          </div>
        </div>

        <!-- 表映射 -->
        <div v-else>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-800">已识别表 ({{ detectedTables.filter(t => t.selected).length }} / {{ detectedTables.length }})</h3>
            <Button variant="outline" size="sm" class="h-8 text-xs border-slate-200">
              <Sparkles class="w-3.5 h-3.5 mr-1" /> AI 智能推荐
            </Button>
          </div>
          <div class="space-y-2">
            <div
              v-for="t in detectedTables"
              :key="t.name"
              :class="['flex items-center gap-3 p-3 rounded-xl border-2 transition-colors', t.selected ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white']"
            >
              <input v-model="t.selected" type="checkbox" class="w-4 h-4 accent-blue-600" />
              <FileText :class="['w-4 h-4', t.selected ? 'text-blue-600' : 'text-slate-400']" />
              <div class="flex-1">
                <div class="font-bold text-sm text-slate-800 font-mono">{{ t.name }}</div>
                <div class="text-[10px] text-slate-500">{{ t.rows }} 行</div>
              </div>
              <span v-if="t.selected" class="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">已加入同步</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
