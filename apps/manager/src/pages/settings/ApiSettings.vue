<script setup lang="ts">
import { ref } from 'vue'
import {
  Save,
  KeyRound,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Server,
  Clock,
  Shield,
  Zap,
  AlertCircle,
  Info,
  ExternalLink,
  Settings,
  DollarSign,
  BarChart3,
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const activeTab = ref<'keys' | 'limits' | 'proxy' | 'models'>('keys')

interface ApiKey {
  id: number
  name: string
  provider: string
  key: string
  status: 'active' | 'inactive' | 'expired'
  createdAt: string
  expiresAt: string
  lastUsed: string
  usageCount: number
}

const showKeys = ref<Record<number, boolean>>({})
const editingKeyId = ref<number | null>(null)

const apiKeys = ref<ApiKey[]>([
  { id: 1, name: 'OpenAI 生产密钥', provider: 'OpenAI', key: 'sk-proj-xxxxxxxxxxxxxxxxxxxx', status: 'active', createdAt: '2023-06-01', expiresAt: '2025-06-01', lastUsed: '2024-01-15 14:32', usageCount: 128456 },
  { id: 2, name: 'Azure OpenAI', provider: 'Azure', key: 'azure-xxxxxxxxxxxxxxxxxxxx', status: 'active', createdAt: '2023-08-15', expiresAt: '2025-08-15', lastUsed: '2024-01-15 10:20', usageCount: 56789 },
  { id: 3, name: 'Anthropic Claude', provider: 'Anthropic', key: 'sk-ant-xxxxxxxxxxxxxxxxxxxx', status: 'active', createdAt: '2023-09-01', expiresAt: '2025-09-01', lastUsed: '2024-01-14 18:45', usageCount: 34567 },
  { id: 4, name: '阿里云通义千问', provider: 'Alibaba', key: 'sk-aliyun-xxxxxxxxxxxxxxxxxxxx', status: 'active', createdAt: '2023-10-20', expiresAt: '2025-10-20', lastUsed: '2024-01-13 09:15', usageCount: 23456 },
  { id: 5, name: '百度文心一言', provider: 'Baidu', key: 'baidu-xxxxxxxxxxxxxxxxxxxx', status: 'inactive', createdAt: '2023-11-01', expiresAt: '2024-11-01', lastUsed: '2024-01-10 11:30', usageCount: 12345 },
  { id: 6, name: '测试环境密钥', provider: 'OpenAI', key: 'sk-test-xxxxxxxxxxxxxxxxxxxx', status: 'expired', createdAt: '2022-01-01', expiresAt: '2024-01-01', lastUsed: '-', usageCount: 0 },
])

const limits = ref({
  globalLimit: 100000,
  perUserLimit: 1000,
  perIpLimit: 500,
  burstLimit: 50,
  timeout: 30,
  retryCount: 3,
  retryDelay: 1000,
  queueSize: 100,
  priorityEnabled: true,
  costTracking: true,
})

const proxy = ref({
  enabled: false,
  httpProxy: '',
  httpsProxy: '',
  socksProxy: '',
  proxyAuth: false,
  proxyUser: '',
  proxyPass: '',
  bypassList: 'localhost, 127.0.0.1, *.internal',
})

const models = ref({
  defaultModel: 'gpt-4o',
  fallbackModel: 'gpt-3.5-turbo',
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  streamEnabled: true,
  cacheEnabled: true,
  cacheTTL: 3600,
})

const providers = [
  { id: 'OpenAI', name: 'OpenAI', icon: '🤖', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'Azure', name: 'Azure OpenAI', icon: '☁️', color: 'bg-blue-100 text-blue-700' },
  { id: 'Anthropic', name: 'Anthropic', icon: '🧠', color: 'bg-violet-100 text-violet-700' },
  { id: 'Alibaba', name: '阿里云通义', icon: '🌐', color: 'bg-orange-100 text-orange-700' },
  { id: 'Baidu', name: '百度文心', icon: '📚', color: 'bg-red-100 text-red-700' },
  { id: 'Google', name: 'Google Gemini', icon: '✨', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'Tencent', name: '腾讯混元', icon: '💬', color: 'bg-green-100 text-green-700' },
  { id: 'Minimax', name: 'MiniMax', icon: '🔮', color: 'bg-pink-100 text-pink-700' },
]

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'active': return { label: '正常', color: 'bg-emerald-100 text-emerald-700', icon: Check }
    case 'inactive': return { label: '停用', color: 'bg-slate-100 text-slate-600', icon: AlertCircle }
    case 'expired': return { label: '已过期', color: 'bg-red-100 text-red-700', icon: AlertCircle }
    default: return { label: status, color: 'bg-slate-100 text-slate-600', icon: Info }
  }
}

const getProviderInfo = (provider: string) => providers.find(p => p.id === provider) || providers[0]

const toggleShowKey = (id: number) => {
  showKeys.value[id] = !showKeys.value[id]
}

const copyKey = (key: string) => {
  navigator.clipboard.writeText(key)
  alert('密钥已复制到剪贴板')
}

const regenerateKey = (id: number) => {
  if (confirm('确定重新生成该密钥？原有密钥将立即失效。')) {
    const key = apiKeys.value.find(k => k.id === id)
    if (key) {
      key.key = 'sk-' + Math.random().toString(36).substring(2, 26)
      key.createdAt = new Date().toISOString().split('T')[0]
    }
  }
}

const handleAddKey = () => {
  const newId = Math.max(...apiKeys.value.map(k => k.id)) + 1
  apiKeys.value.push({
    id: newId,
    name: '新密钥',
    provider: 'OpenAI',
    key: 'sk-' + Math.random().toString(36).substring(2, 26),
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
    expiresAt: '2026-01-01',
    lastUsed: '-',
    usageCount: 0,
  })
}

const handleDeleteKey = (id: number) => {
  if (confirm('确定删除该密钥？')) {
    apiKeys.value = apiKeys.value.filter(k => k.id !== id)
  }
}

const handleToggleStatus = (id: number) => {
  const key = apiKeys.value.find(k => k.id === id)
  if (key && key.status !== 'expired') {
    key.status = key.status === 'active' ? 'inactive' : 'active'
  }
}

const handleSave = () => {
  alert('全局接口参数已保存(演示)')
}

const formatNumber = (n: number) => n.toLocaleString()
</script>

<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">全局接口参数</h1>
        <p class="mt-1 text-sm text-slate-500">配置 API 密钥、调用限额、代理地址等接口级参数</p>
      </div>
      <Button @click="handleSave">
        <Save class="h-4 w-4 mr-1" />
        保存配置
      </Button>
    </div>

    <!-- 标签页 -->
    <div class="flex items-center gap-1 border-b border-slate-200">
      <button
        v-for="tab in [
          { id: 'keys', label: 'API 密钥', icon: KeyRound },
          { id: 'limits', label: '调用限额', icon: BarChart3 },
          { id: 'proxy', label: '代理设置', icon: Globe },
          { id: 'models', label: '模型参数', icon: Settings },
        ]"
        :key="tab.id"
        :class="[
          'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
          activeTab === tab.id
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-slate-500 hover:text-slate-700',
        ]"
        @click="activeTab = tab.id as any"
      >
        <component :is="tab.icon" class="h-4 w-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- API 密钥管理 -->
    <div v-if="activeTab === 'keys'" class="space-y-4">
      <Card class-name="p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <KeyRound class="h-4 w-4" />
            API 密钥列表
          </h3>
          <Button size="sm" @click="handleAddKey">
            <Plus class="h-4 w-4 mr-1" />
            新增密钥
          </Button>
        </div>

        <div class="space-y-3">
          <div v-for="key in apiKeys" :key="key.id" class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white">
            <span :class="['flex h-10 w-10 items-center justify-center rounded-lg text-lg', getProviderInfo(key.provider).color]">
              {{ getProviderInfo(key.provider).icon }}
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-slate-800">{{ key.name }}</span>
                <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', getStatusInfo(key.status).color]">
                  <component :is="getStatusInfo(key.status).icon" class="h-3 w-3" />
                  {{ getStatusInfo(key.status).label }}
                </span>
              </div>
              <div class="text-xs text-slate-500 mt-1">{{ key.provider }} · 创建于 {{ key.createdAt }} · 过期于 {{ key.expiresAt }}</div>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <Zap class="h-3.5 w-3.5" />
              {{ formatNumber(key.usageCount) }} 次
            </div>
            <div class="flex items-center gap-1">
              <div class="flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-slate-50">
                <span class="text-xs text-slate-600 font-mono">
                  {{ showKeys.value[key.id] ? key.key : key.key.substring(0, 10) + '...' }}
                </span>
                <button class="text-slate-400 hover:text-slate-600" @click="toggleShowKey(key.id)">
                  <component :is="showKeys.value[key.id] ? EyeOff : Eye" class="h-3.5 w-3.5" />
                </button>
                <button class="text-slate-400 hover:text-slate-600" @click="copyKey(key.key)">
                  <Copy class="h-3.5 w-3.5" />
                </button>
              </div>
              <Button variant="ghost" size="icon" @click="regenerateKey(key.id)">
                <RefreshCw class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="handleToggleStatus(key.id)">
                <component :is="key.status === 'active' ? AlertCircle : Check" class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" class="text-rose-500 hover:text-rose-600" @click="handleDeleteKey(key.id)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <!-- 使用统计 -->
      <Card class-name="p-4">
        <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
          <BarChart3 class="h-4 w-4" />
          本月调用统计
        </h3>
        <div class="grid grid-cols-4 gap-4">
          <div class="p-3 rounded-lg bg-blue-50">
            <div class="text-xs text-blue-600">总调用次数</div>
            <div class="text-xl font-bold text-blue-700 mt-1">{{ formatNumber(256789) }}</div>
          </div>
          <div class="p-3 rounded-lg bg-emerald-50">
            <div class="text-xs text-emerald-600">成功率</div>
            <div class="text-xl font-bold text-emerald-700 mt-1">99.2%</div>
          </div>
          <div class="p-3 rounded-lg bg-amber-50">
            <div class="text-xs text-amber-600">平均延迟</div>
            <div class="text-xl font-bold text-amber-700 mt-1">1.2s</div>
          </div>
          <div class="p-3 rounded-lg bg-violet-50">
            <div class="text-xs text-violet-600">预估费用</div>
            <div class="text-xl font-bold text-violet-700 mt-1 flex items-center gap-1">
              <DollarSign class="h-4 w-4" />
              2,456
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- 调用限额 -->
    <div v-if="activeTab === 'limits'" class="space-y-4">
      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
          <BarChart3 class="h-4 w-4" />
          全局限额配置
        </h3>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">全局每分钟限额</label>
            <Input v-model="limits.globalLimit" type="number" />
            <p class="text-xs text-slate-400 mt-1">系统整体每分钟最大请求次数</p>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">单用户每分钟限额</label>
            <Input v-model="limits.perUserLimit" type="number" />
            <p class="text-xs text-slate-400 mt-1">单个用户每分钟最大请求次数</p>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">单 IP 每分钟限额</label>
            <Input v-model="limits.perIpLimit" type="number" />
            <p class="text-xs text-slate-400 mt-1">单个 IP 每分钟最大请求次数</p>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">突发请求限额</label>
            <Input v-model="limits.burstLimit" type="number" />
            <p class="text-xs text-slate-400 mt-1">短时间内允许的突发请求量</p>
          </div>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
          <Clock class="h-4 w-4" />
          超时与重试
        </h3>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">请求超时 (秒)</label>
            <Input v-model="limits.timeout" type="number" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">重试次数</label>
            <Input v-model="limits.retryCount" type="number" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">重试间隔 (毫秒)</label>
            <Input v-model="limits.retryDelay" type="number" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">队列大小</label>
            <Input v-model="limits.queueSize" type="number" />
          </div>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
          <Shield class="h-4 w-4" />
          高级选项
        </h3>
        <div class="space-y-3">
          <label class="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <div class="text-sm font-medium text-slate-700">优先级队列</div>
              <div class="text-xs text-slate-500 mt-0.5">启用请求优先级排序，VIP 用户优先处理</div>
            </div>
            <input type="checkbox" v-model="limits.priorityEnabled" class="h-4 w-4 rounded text-blue-600" />
          </label>
          <label class="flex items-center justify-between py-2">
            <div>
              <div class="text-sm font-medium text-slate-700">费用追踪</div>
              <div class="text-xs text-slate-500 mt-0.5">记录每次 API 调用的费用消耗</div>
            </div>
            <input type="checkbox" v-model="limits.costTracking" class="h-4 w-4 rounded text-blue-600" />
          </label>
        </div>
      </Card>
    </div>

    <!-- 代理设置 -->
    <div v-if="activeTab === 'proxy'" class="space-y-4">
      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
          <Globe class="h-4 w-4" />
          代理配置
        </h3>
        <div class="space-y-4">
          <label class="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <div class="text-sm font-medium text-slate-700">启用代理</div>
              <div class="text-xs text-slate-500 mt-0.5">通过代理服务器访问外部 API</div>
            </div>
            <input type="checkbox" v-model="proxy.enabled" class="h-4 w-4 rounded text-blue-600" />
          </label>

          <div v-if="proxy.enabled" class="grid grid-cols-2 gap-x-6 gap-y-4 pt-4">
            <div>
              <label class="text-xs font-medium text-slate-600 mb-1.5 block">HTTP 代理地址</label>
              <Input v-model="proxy.httpProxy" placeholder="http://proxy.example.com:8080" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 mb-1.5 block">HTTPS 代理地址</label>
              <Input v-model="proxy.httpsProxy" placeholder="https://proxy.example.com:8080" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 mb-1.5 block">SOCKS 代理地址</label>
              <Input v-model="proxy.socksProxy" placeholder="socks5://proxy.example.com:1080" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 mb-1.5 block">绕过列表</label>
              <Input v-model="proxy.bypassList" placeholder="localhost, 127.0.0.1" />
              <p class="text-xs text-slate-400 mt-1">不使用代理的地址列表，逗号分隔</p>
            </div>
          </div>
        </div>
      </Card>

      <Card v-if="proxy.enabled" class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
          <Shield class="h-4 w-4" />
          代理认证
        </h3>
        <div class="space-y-4">
          <label class="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <div class="text-sm font-medium text-slate-700">启用认证</div>
              <div class="text-xs text-slate-500 mt-0.5">代理服务器需要用户名密码认证</div>
            </div>
            <input type="checkbox" v-model="proxy.proxyAuth" class="h-4 w-4 rounded text-blue-600" />
          </label>

          <div v-if="proxy.proxyAuth" class="grid grid-cols-2 gap-x-6 gap-y-4 pt-4">
            <div>
              <label class="text-xs font-medium text-slate-600 mb-1.5 block">用户名</label>
              <Input v-model="proxy.proxyUser" />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-600 mb-1.5 block">密码</label>
              <Input v-model="proxy.proxyPass" type="password" />
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- 模型参数 -->
    <div v-if="activeTab === 'models'" class="space-y-4">
      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
          <Settings class="h-4 w-4" />
          默认模型配置
        </h3>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">默认模型</label>
            <select v-model="models.defaultModel" class="w-full h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-blue-500">
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="qwen-max">通义千问 Max</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">备用模型</label>
            <select v-model="models.fallbackModel" class="w-full h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-blue-500">
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="claude-3-haiku">Claude 3 Haiku</option>
              <option value="qwen-turbo">通义千问 Turbo</option>
            </select>
            <p class="text-xs text-slate-400 mt-1">主模型不可用时自动切换</p>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">最大 Token 数</label>
            <Input v-model="models.maxTokens" type="number" />
          </div>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
          <Zap class="h-4 w-4" />
          生成参数
        </h3>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">Temperature</label>
            <input type="range" min="0" max="2" step="0.1" v-model="models.temperature" class="w-full" />
            <div class="text-xs text-slate-500 mt-1">当前: {{ models.temperature }}</div>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">Top P</label>
            <input type="range" min="0" max="1" step="0.05" v-model="models.topP" class="w-full" />
            <div class="text-xs text-slate-500 mt-1">当前: {{ models.topP }}</div>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">Frequency Penalty</label>
            <input type="range" min="0" max="2" step="0.1" v-model="models.frequencyPenalty" class="w-full" />
            <div class="text-xs text-slate-500 mt-1">当前: {{ models.frequencyPenalty }}</div>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">Presence Penalty</label>
            <input type="range" min="0" max="2" step="0.1" v-model="models.presencePenalty" class="w-full" />
            <div class="text-xs text-slate-500 mt-1">当前: {{ models.presencePenalty }}</div>
          </div>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
          <Server class="h-4 w-4" />
          高级选项
        </h3>
        <div class="space-y-3">
          <label class="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <div class="text-sm font-medium text-slate-700">流式输出</div>
              <div class="text-xs text-slate-500 mt-0.5">启用 SSE 流式响应，提升用户体验</div>
            </div>
            <input type="checkbox" v-model="models.streamEnabled" class="h-4 w-4 rounded text-blue-600" />
          </label>
          <label class="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <div class="text-sm font-medium text-slate-700">响应缓存</div>
              <div class="text-xs text-slate-500 mt-0.5">缓存相同请求的响应，减少重复调用</div>
            </div>
            <input type="checkbox" v-model="models.cacheEnabled" class="h-4 w-4 rounded text-blue-600" />
          </label>
          <div v-if="models.cacheEnabled">
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">缓存有效期 (秒)</label>
            <Input v-model="models.cacheTTL" type="number" />
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>