<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Save, ArrowLeft, Wrench, Globe, Server, Box, Terminal, Code } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => !!route.params.id)

const form = ref({
  name: '',
  type: 'api',
  protocol: 'https',
  method: 'POST',
  endpoint: '',
  description: '',
  authType: 'none',
  authKey: '',
  inputSchema: '{"type":"object","properties":{}}',
  status: 'enabled',
})

const toolTypes = [
  { id: 'api', label: '业务 API (REST/OpenAPI)', icon: Globe, color: 'from-blue-500 to-indigo-600' },
  { id: 'mcp', label: 'MCP Server', icon: Server, color: 'from-emerald-500 to-teal-600' },
  { id: 'function', label: '云函数 (Serverless)', icon: Box, color: 'from-rose-500 to-pink-600' },
  { id: 'cli', label: 'CLI (本地脚本)', icon: Terminal, color: 'from-slate-600 to-slate-800' },
  { id: 'component', label: '前端组件 (Edge)', icon: Code, color: 'from-amber-500 to-orange-600' },
]

const handleSave = () => {
  if (!form.value.name.trim()) {
    alert('请输入工具名称')
    return
  }
  alert('工具已保存（演示）')
  router.push('/tools')
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 pb-8">
    <div class="flex items-center gap-3">
      <Button variant="ghost" size="icon" @click="router.back()"><ArrowLeft class="w-4 h-4" /></Button>
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">{{ isEdit ? '编辑工具' : '新建工具' }}</h1>
        <p class="text-sm text-slate-500 mt-1">配置可被智能体调用的外部工具/MCP/API/脚本</p>
      </div>
    </div>

    <div class="flex-1 space-y-6">
      <Card class="p-6 border-slate-200">
        <h2 class="text-lg font-medium text-slate-800 mb-4 pb-3 border-b border-slate-100">工具类型</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <button v-for="t in toolTypes" :key="t.id" type="button" :class="['flex flex-col items-center p-4 rounded-xl border text-xs font-bold transition-all', form.type === t.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50']" @click="form.type = t.id">
            <div :class="['w-10 h-10 rounded-lg bg-gradient-to-br text-white flex items-center justify-center mb-2', t.color]">
              <component :is="t.icon" class="w-5 h-5" />
            </div>
            {{ t.label }}
          </button>
        </div>
      </Card>

      <Card class="p-6 border-slate-200">
        <h2 class="text-lg font-medium text-slate-800 mb-4 pb-3 border-b border-slate-100">基础信息</h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">工具名称 *</label>
              <Input v-model="form.name" placeholder="例如：OA审批查询" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">协议/调用方式</label>
              <select v-model="form.protocol" class="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="https">HTTPS / REST</option>
                <option value="grpc">gRPC</option>
                <option value="stdio">Stdio (MCP)</option>
                <option value="websocket">WebSocket</option>
                <option value="local">Local</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">请求方法</label>
              <select v-model="form.method" class="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">端点 URL / 命令</label>
              <Input v-model="form.endpoint" placeholder="https://api.example.com/v1/xxx 或 ./scripts/run.sh" class="font-mono" />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">描述</label>
              <textarea v-model="form.description" class="w-full h-20 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="工具功能与适用场景..."></textarea>
            </div>
          </div>
        </div>
      </Card>

      <Card class="p-6 border-slate-200">
        <h2 class="text-lg font-medium text-slate-800 mb-4 pb-3 border-b border-slate-100">认证与入参</h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">认证方式</label>
              <select v-model="form.authType" class="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="none">无认证</option>
                <option value="apikey">API Key (Header)</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>
            <div v-if="form.authType !== 'none'">
              <label class="block text-sm font-medium text-slate-700 mb-1">认证凭据</label>
              <Input v-model="form.authKey" type="password" placeholder="sk-..." class="font-mono" />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">入参 Schema (JSON Schema)</label>
              <textarea v-model="form.inputSchema" class="w-full h-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" placeholder='{"type":"object","properties":{...}}'></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">状态</label>
              <select v-model="form.status" class="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="enabled">启用</option>
                <option value="disabled">停用</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <div class="flex justify-end gap-2">
      <Button variant="outline" @click="router.back()">取消</Button>
      <Button class="bg-emerald-600 hover:bg-emerald-700" @click="handleSave"><Save class="w-4 h-4 mr-2" />保存工具</Button>
    </div>
  </div>
</template>
