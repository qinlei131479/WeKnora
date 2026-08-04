<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, TerminalSquare, Globe, Fingerprint, Calculator, Play, Database, Filter, MoreHorizontal, Edit, Power, PowerOff, ShieldCheck, Activity, Trash, Component } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DomainSidebar from '@/components/common/DomainSidebar.vue'
import { isDomainMatch } from '@/lib/domain-store'

const router = useRouter()

const debugTool = ref<any>(null)
const authDetailsTool = ref<any>(null)
const auditLogTool = ref<any>(null)
const searchTerm = ref('')
const filterType = ref('all')
const filterStatus = ref('all')
const filterDomain = ref('all')
const openMenuId = ref<string | null>(null)

const menuRef = ref<HTMLDivElement | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    openMenuId.value = null
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

const debugResult = ref<string | null>(null)

const handleDebugExecute = () => {
  debugResult.value = null
  setTimeout(() => {
    debugResult.value = JSON.stringify({
      'status': 'success',
      'code': 200,
      'data': {
        'result': 'Mocked execution successful',
        'message': `Tool ${debugTool.value?.name} executed using standard OpenAPI format.`
      },
      'metadata': {
        'processing_time_ms': 145,
        'request_id': 'req_mock_12345'
      }
    }, null, 2)
  }, 800)
}

const tools = ref([
  { id: '1', name: 'Web Crawler', icon: Globe, desc: '提取指定URL的网页正文数据', type: '系统默认', status: '已上线', version: 'v1.2', owner: '系统', calls: 12054, errorRate: '0.1%', latency: '850ms', sampleInput: '{ "url": "https://example.com" }', domain: 'general' },
  { id: '2', name: '发票OCR识别', icon: Fingerprint, desc: '识别并提取发票核心字段信息', type: '业务 API', status: '已上线', version: 'v2.0', owner: '财务组', calls: 3420, errorRate: '1.2%', latency: '1.2s', sampleInput: '{ "image_base64": "..." }', domain: 'finance' },
  { id: '3', name: 'Python解释器', icon: TerminalSquare, desc: '执行安全沙箱内的Python代码', type: '系统默认', status: '已上线', version: 'v1.0', owner: '系统', calls: 8901, errorRate: '4.5%', latency: '3.5s', sampleInput: '{ "code": "print(1+1)" }', domain: 'general' },
  { id: '4', name: '汇率换算', icon: Calculator, desc: '实时获取各国货币汇率', type: '自定义扩展', status: '已下线', version: 'v0.9', owner: '张三', calls: 456, errorRate: '0.5%', latency: '200ms', sampleInput: '{ "from": "USD", "to": "CNY", "amount": 100 }', domain: 'finance' },
  { id: '5', name: '内部数据库查询', icon: Database, desc: '安全查询内网只读数据库', type: '插件', status: '部署中', version: 'v1.1', owner: '数据组', calls: 0, errorRate: '-', latency: '-', sampleInput: '{ "sql": "SELECT * FROM users LIMIT 5" }', domain: 'general' },
  { id: '6', name: 'Git CLI 助手', icon: TerminalSquare, desc: '封装常用Git命令', type: 'CLI', status: '已上线', version: 'v1.0', owner: '李四', calls: 120, errorRate: '0.0%', latency: '100ms', sampleInput: '{ "command": "status" }', domain: 'rd' },
  { id: '7', name: '本地文件解析器', icon: Component, desc: '读取本地组件产生的中间文件并提取结构化内容', type: '本地化组件', status: '已上线', version: 'v1.1', owner: '前端中台', calls: 5210, errorRate: '0.1%', latency: '45ms', sampleInput: '{ "filePath": "/tmp/local_cache.json" }', domain: 'rd' },
  { id: '8', name: 'Github Repo 检索 (MCP)', icon: Database, desc: '基于 MCP 协议通过本地 github 服务检索代码', type: 'MCP', status: '已上线', version: 'v1.0', owner: '架构组', calls: 843, errorRate: '0.8%', latency: '1.5s', sampleInput: '{ "query": "find auth config" }', domain: 'rd' },
  { id: '9', name: 'IPTV 播控合规巡检接口', icon: Database, desc: '对接省网播控审核系统，自动同步当天违规节目单、黑名单和高危关键词库', type: '业务 API', status: '已上线', version: 'v1.4', owner: '播控合规组', calls: 92830, errorRate: '0.01%', latency: '230ms', sampleInput: '{ "province": "GD", "category": "live" }', domain: 'biz-iptv-play' },
  { id: '10', name: 'IPTV 增值计费对账核验', icon: Calculator, desc: '实时拉取大屏端各增值包支付流水，与订购关系状态机进行两端数字化对账校验', type: '业务 API', status: '已上线', version: 'v1.0', owner: '增值运营组', calls: 14502, errorRate: '0.05%', latency: '1.1s', sampleInput: '{ "bizCode": "vas_movie_monthly" }', domain: 'biz-iptv-vas' },
])

const handleStatusChange = (id: string, newStatus: string) => {
  tools.value = tools.value.map(t => t.id === id ? { ...t, status: newStatus } : t)
  openMenuId.value = null
}

const handleDelete = (id: string) => {
  if (confirm('确定要删除该工具吗？删除后正在使用的智能体可能会运行失败。')) {
    tools.value = tools.value.filter(t => t.id !== id)
  }
  openMenuId.value = null
}

const filteredTools = computed(() => {
  return tools.value.filter(t => {
    if (filterType.value !== 'all' && t.type !== filterType.value) return false
    if (filterStatus.value !== 'all' && t.status !== filterStatus.value) return false
    if (filterDomain.value !== 'all' && !isDomainMatch(t.domain, filterDomain.value)) return false
    if (searchTerm.value && !t.name.toLowerCase().includes(searchTerm.value.toLowerCase()) && !t.owner.toLowerCase().includes(searchTerm.value.toLowerCase())) return false
    return true
  })
})

const getToolIcon = (tool: any) => {
  switch (tool.type) {
    case '系统默认': return TerminalSquare
    case '业务 API': return Globe
    case '自定义扩展': return Calculator
    case '插件': return Database
    case 'CLI': return TerminalSquare
    case 'MCP': return Database
    case '本地化组件': return Component
    default: return Component
  }
}

const getIconColor = (tool: any) => {
  switch (tool.type) {
    case '系统默认': return 'bg-slate-500'
    case '业务 API': return 'bg-blue-500'
    case '自定义扩展': return 'bg-amber-500'
    case '插件': return 'bg-emerald-500'
    case 'CLI': return 'bg-slate-600'
    case 'MCP': return 'bg-violet-500'
    case '本地化组件': return 'bg-orange-500'
    default: return 'bg-slate-500'
  }
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6">
    <!-- Web 调试弹窗 -->
    <Dialog :open="!!debugTool" @update:open="(open: boolean) => { if (!open) { debugTool = null; debugResult = null } }">
      <DialogContent :title="`Web 调试界面: ${debugTool?.name}`" class="max-w-4xl">
        <div class="space-y-4">
          <div v-if="debugTool?.type === '业务 API'" class="flex items-center gap-3">
            <label class="text-xs font-semibold text-slate-700 whitespace-nowrap">选择要调试的具体技能 (API)</label>
            <select class="flex-1 h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-mono text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>GET /v1/leave/status (请假状态查询)</option>
              <option>POST /v1/leave/apply (发起请假审批)</option>
            </select>
          </div>
          
          <div class="flex bg-slate-50 border border-slate-200 rounded-md p-3 items-center justify-between">
            <code class="text-xs text-slate-700 font-mono"><span class="text-blue-600 font-bold">POST</span> /v1/tools/{{ debugTool?.id }}/execute</code>
            <span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded">统一标准接口</span>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col space-y-3">
              <div>
                <label class="text-xs font-semibold text-slate-700 block mb-1">Header / Auth parameters</label>
                <Input class="h-8 text-xs font-mono" placeholder="Authorization: Bearer undefined" />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-700 block mb-1">Request Body (JSON 全参数)</label>
                <textarea 
                  class="w-full h-48 bg-slate-900 text-emerald-400 p-3 rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0 resize-none"
                  :value="debugTool?.sampleInput"
                />
              </div>
              <Button class="w-full bg-slate-800 hover:bg-slate-900 h-9" @click="handleDebugExecute">
                <Play class="w-4 h-4 mr-2" /> 发送请求调试
              </Button>
            </div>
            <div class="flex flex-col space-y-2">
              <label class="text-xs font-semibold text-slate-700">Response Object (Standard OpenAPI)</label>
              <div class="w-full h-[288px] bg-slate-50 text-slate-500 overflow-y-auto rounded-md font-mono text-xs border border-slate-200 relative">
                <pre v-if="debugResult" class="p-4 text-emerald-600 text-[11px] leading-relaxed">{{ debugResult }}</pre>
                <div v-else class="absolute inset-0 flex items-center justify-center">等待执行返回结果...</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 权限管控弹窗 -->
    <Dialog :open="!!authDetailsTool" @update:open="(open: boolean) => !open && (authDetailsTool = null)">
      <DialogContent :title="`细粒度权限管控: ${authDetailsTool?.name}`" class="max-w-xl">
        <div class="space-y-4 text-sm">
          <div class="bg-slate-50 p-4 rounded-md border border-slate-200">
            <h3 class="font-medium text-slate-800 mb-2">已授权应用 (Agents) / 角色</h3>
            <div class="space-y-2 mt-3">
              <div class="flex items-center justify-between bg-white px-3 py-2 border border-slate-100 rounded shadow-sm">
                <span class="text-slate-700 font-medium text-xs">行政助手 Agent</span>
                <span class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">读写权限</span>
              </div>
              <div class="flex items-center justify-between bg-white px-3 py-2 border border-slate-100 rounded shadow-sm">
                <span class="text-slate-700 font-medium text-xs">普通员工 (角色组)</span>
                <span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">仅查询接口</span>
              </div>
            </div>
            <Button class="w-full mt-3 h-8 text-xs bg-white border border-dashed border-slate-300 text-slate-600 hover:text-blue-600">
              <Plus class="w-3 h-3 mr-1" /> 添加授权配置
            </Button>
          </div>
          <div class="bg-slate-50 p-4 rounded-md border border-slate-200">
            <h3 class="font-medium text-slate-800 mb-2">安全沙箱与网络限制</h3>
            <div class="space-y-2 mt-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="rounded text-blue-600" checked />
                <span class="text-xs text-slate-600">强制校验子网/VPC来源安全</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="rounded text-blue-600" checked />
                <span class="text-xs text-slate-600">每日调用总体配额限制 (当前限制: 1000次/天)</span>
              </label>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 审计日志弹窗 -->
    <Dialog :open="!!auditLogTool" @update:open="(open: boolean) => !open && (auditLogTool = null)">
      <DialogContent :title="`调用审计日志: ${auditLogTool?.name}`" class="max-w-4xl">
        <div class="space-y-4">
          <div class="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
            <div class="flex items-center gap-2">
              <Input placeholder="输入 Track ID 或调用方信息" class="h-8 w-64 text-xs bg-white" />
              <Button size="sm" variant="outline" class="h-8 text-xs bg-white">搜索</Button>
            </div>
            <Button size="sm" variant="ghost" class="text-blue-600 text-xs">导出 CSV</Button>
          </div>
          <div class="border border-slate-200 rounded-md overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-2">执行时间</th>
                  <th class="px-4 py-2">调用方 Agent / User</th>
                  <th class="px-4 py-2">目标系统 Skill (API)</th>
                  <th class="px-4 py-2">请求耗时</th>
                  <th class="px-4 py-2">响应状态</th>
                  <th class="px-4 py-2">操作明细</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white text-slate-600 font-mono">
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-2 text-[10px]">2026-04-30 15:20</td>
                  <td class="px-4 py-2">Agent_HR_01</td>
                  <td class="px-4 py-2">GET /v1/leave/status</td>
                  <td class="px-4 py-2">120ms</td>
                  <td class="px-4 py-2 text-emerald-600">200 OK</td>
                  <td class="px-4 py-2 text-blue-600 cursor-pointer">Trace</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-2 text-[10px]">2026-04-30 15:18</td>
                  <td class="px-4 py-2">Agent_HR_01</td>
                  <td class="px-4 py-2">POST /v1/leave/apply</td>
                  <td class="px-4 py-2">450ms</td>
                  <td class="px-4 py-2 text-emerald-600">201 created</td>
                  <td class="px-4 py-2 text-blue-600 cursor-pointer">Trace</td>
                </tr>
                <tr class="hover:bg-slate-50 border-l-2 border-rose-500">
                  <td class="px-4 py-2 text-[10px]">2026-04-30 14:02</td>
                  <td class="px-4 py-2">User_Guest</td>
                  <td class="px-4 py-2">POST /v1/leave/apply</td>
                  <td class="px-4 py-2">30ms</td>
                  <td class="px-4 py-2 text-rose-600">403 Forbidden</td>
                  <td class="px-4 py-2 text-blue-600 cursor-pointer">Trace</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">工具仓管理</h1>
      <div class="flex items-center gap-3">
        <router-link to="/tools/new">
          <Button class="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus class="mr-2 h-4 w-4" />
            注册新插件/API
          </Button>
        </router-link>
      </div>
    </div>

    <div class="flex flex-1 gap-6 min-h-0">
      <div class="hidden lg:block w-56 shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <DomainSidebar v-model="filterDomain" class="h-full border-none bg-white font-medium" />
      </div>

      <div class="flex-1 flex flex-col space-y-6 overflow-hidden">
        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-wrap gap-4 items-center">
          <div class="flex items-center text-sm font-medium text-slate-600">
            <Filter class="w-4 h-4 mr-2" />
            筛选过滤
          </div>
          <div class="w-[1px] h-6 bg-slate-300 mx-2 hidden md:block"></div>
          <div class="relative w-64">
            <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              v-model="searchTerm"
              placeholder="搜索工具名称/归属人" 
              class="pl-9 bg-white h-9" 
            />
          </div>
          
          <div class="flex flex-wrap items-center gap-6 w-full lg:w-auto mt-2 lg:mt-0 xl:ml-auto">
            <div class="flex items-center gap-2">
              <label class="text-xs text-slate-500 whitespace-nowrap">工具状态:</label>
              <div class="flex bg-white rounded-md border border-slate-200 p-0.5 shadow-sm">
                <button
                  v-for="status in [{ id: 'all', label: '全部' }, { id: '已上线', label: '已上线' }, { id: '部署中', label: '部署中' }, { id: '已下线', label: '已下线' }]"
                  :key="status.id"
                  @click="filterStatus = status.id"
                  :class="[`text-[11px] px-2.5 py-1.5 rounded-md font-medium transition-colors`, filterStatus === status.id ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800']"
                >
                  {{ status.label }}
                </button>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <label class="text-xs text-slate-500 whitespace-nowrap">工具类型:</label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="type in [{ id: 'all', label: '全部' }, { id: '系统默认', label: '内置' }, { id: '业务 API', label: 'API' }, { id: '自定义扩展', label: '自定义' }, { id: 'CLI', label: 'CLI' }, { id: '插件', label: '插件' }, { id: 'MCP', label: 'MCP' }, { id: '本地化组件', label: '本地组件' }]"
                  :key="type.id"
                  @click="filterType = type.id"
                  :class="[`text-[11px] px-2.5 py-1.5 border rounded-md transition-colors`, filterType === type.id ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50']"
                >
                  {{ type.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden" ref="menuRef">
      <div v-if="filteredTools.length === 0" class="py-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50">
        <Component class="w-12 h-12 text-slate-300 mb-4" />
        <p>未找到匹配的工具</p>
      </div>
      <table v-else class="w-full text-left text-sm text-slate-600">
        <thead class="bg-slate-50 text-slate-500 font-medium text-xs">
          <tr>
            <th class="px-4 py-3">工具名称</th>
            <th class="px-4 py-3">描述</th>
            <th class="px-4 py-3">类型</th>
            <th class="px-4 py-3">版本</th>
            <th class="px-4 py-3">归属人</th>
            <th class="px-4 py-3">调用量</th>
            <th class="px-4 py-3">错误率</th>
            <th class="px-4 py-3">延迟</th>
            <th class="px-4 py-3">状态</th>
            <th class="px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="tool in filteredTools" :key="tool.id" class="hover:bg-slate-50/80 transition-colors group">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div :class="['w-7 h-7 rounded-md flex items-center justify-center text-white text-xs shrink-0', getIconColor(tool)]">
                  <component :is="getToolIcon(tool)" class="w-4 h-4" />
                </div>
                <span class="font-semibold text-slate-800">{{ tool.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate" :title="tool.desc">{{ tool.desc }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{{ tool.type }}</span>
            </td>
            <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ tool.version }}</td>
            <td class="px-4 py-3 text-xs">{{ tool.owner }}</td>
            <td class="px-4 py-3 text-xs font-mono">{{ tool.calls.toLocaleString() }}</td>
            <td class="px-4 py-3 text-xs">
              <span :class="tool.errorRate === '-' ? 'text-slate-400' : parseFloat(tool.errorRate) > 1 ? 'text-rose-600' : 'text-emerald-600'">
                {{ tool.errorRate }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs font-mono text-slate-500">{{ tool.latency }}</td>
            <td class="px-4 py-3">
              <span :class="[
                'px-2 py-0.5 rounded text-xs font-medium',
                tool.status === '已上线' ? 'bg-emerald-50 text-emerald-700' :
                tool.status === '部署中' ? 'bg-amber-50 text-amber-700' :
                'bg-slate-100 text-slate-500'
              ]">{{ tool.status }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1 relative">
                <button 
                  @click="router.push(`/tools/${tool.id}/edit`)"
                  class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="编辑"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button 
                  @click="debugTool = tool"
                  class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  title="调试"
                >
                  <Activity class="w-4 h-4" />
                </button>
                <button 
                  @click="authDetailsTool = tool"
                  class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                  title="权限配置"
                >
                  <ShieldCheck class="w-4 h-4" />
                </button>
                <button 
                  @click="auditLogTool = tool"
                  class="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                  title="审计日志"
                >
                  <Activity class="w-4 h-4" />
                </button>
                <button 
                  @click="openMenuId = openMenuId === tool.id ? null : tool.id"
                  class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                >
                  <MoreHorizontal class="w-4 h-4" />
                </button>
                
                <div v-if="openMenuId === tool.id" class="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                  <button 
                    v-if="tool.status !== '已上线'"
                    class="w-full px-3 py-2 text-xs text-left hover:bg-slate-50 flex items-center gap-2 text-emerald-600"
                    @click="handleStatusChange(tool.id, '已上线')"
                  >
                    <Power class="w-3.5 h-3.5" /> 上线
                  </button>
                  <button 
                    v-if="tool.status === '已上线'"
                    class="w-full px-3 py-2 text-xs text-left hover:bg-slate-50 flex items-center gap-2 text-amber-600"
                    @click="handleStatusChange(tool.id, '已下线')"
                  >
                    <PowerOff class="w-3.5 h-3.5" /> 下线
                  </button>
                  <button 
                    class="w-full px-3 py-2 text-xs text-left hover:bg-slate-50 flex items-center gap-2 text-rose-600"
                    @click="handleDelete(tool.id)"
                  >
                    <Trash class="w-3.5 h-3.5" /> 删除
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
