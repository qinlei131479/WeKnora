<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Search, Plus, Play, Info, MoreHorizontal, Send, User, Bot, Loader2, Trash, Power, PowerOff, Filter, Terminal } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DomainSidebar from '@/components/common/DomainSidebar.vue'
import { isDomainMatch, getFlatDomains } from '@/lib/domain-store'

const previewModel = ref<any>(null)
const apiDetailsModel = ref<any>(null)

const getDomainLabel = (domainId: string) => {
  const flat = getFlatDomains()
  const found = flat.find(f => f.id === domainId)
  return found ? found.label : '公共分类'
}

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

const message = ref('')
const chatLog = ref<{ role: 'user' | 'model'; content: string }[]>([])
const isTyping = ref(false)

const functionInputs = ref<Record<string, any>>({})
const functionResult = ref<any>(null)
const isRunning = ref(false)

const models = ref([
  { id: '1', name: 'DeepSeek R1', type: 'LLM', deployMethod: 'api', provider: 'DeepSeek', status: '已上线', version: 'v1.0.0', context: '128k', desc: '主打深度推理与复杂逻辑处理。', domain: 'base-general-llm' },
  { id: '2', name: 'DeepSeek Chat', type: 'LLM', deployMethod: 'api', provider: 'DeepSeek', status: '已上线', version: 'v1.0.0', context: '128k', desc: '通用对话场景优化的低成本推理模型。', domain: 'base-general-llm' },
  { id: '3', name: 'text-embedding-3-small', type: 'Embedding', deployMethod: 'api', provider: 'OpenAI', status: '已上线', version: 'v3', context: '8k', desc: '第三代小型化向量嵌入模型，高效压缩。', domain: 'base-general-vector' },
  { id: '4', name: 'text-embedding-ada-002', type: 'Embedding', deployMethod: 'api', provider: 'OpenAI', status: '已下线', version: 'v2', context: '8k', desc: '第二代经典向量嵌入模型，兼容性佳。', domain: 'base-general-vector' },
  { id: '5', name: 'bge-reranker-large', type: 'Reranker', deployMethod: 'api', provider: 'BAAI', status: '已上线', version: 'v1.0', context: '4k', desc: '智源开源排序重排模型，提升检索召回精准度。', domain: 'base-general-vector' },
  { id: '6', name: 'Cohere Rerank', type: 'Reranker', deployMethod: 'api', provider: 'Cohere', status: '已上线', version: 'v3', context: '4k', desc: 'Cohere 云端商业重排服务，即插即用。', domain: 'base-general-vector' },
  { id: '7', name: 'Qwen 2.5 72B', type: 'LLM', deployMethod: 'api', provider: 'Alibaba', status: '部署中', version: 'v2.5', context: '128k', desc: '阿里巴巴达摩院自研大语言模型，正在部署中。', domain: 'base-general-llm' },
])

const handleStatusChange = (id: string, newStatus: string) => {
  models.value = models.value.map(m => m.id === id ? { ...m, status: newStatus } : m)
  openMenuId.value = null
}

const handleDelete = (id: string) => {
  if (confirm('确定要删除该模型吗？删除后不可恢复。')) {
    models.value = models.value.filter(m => m.id !== id)
  }
  openMenuId.value = null
}

const filteredModels = computed(() => {
  return models.value.filter(m => {
    if (filterType.value !== 'all' && m.type !== filterType.value) return false
    if (filterStatus.value !== 'all' && m.status !== filterStatus.value) return false
    if (filterDomain.value !== 'all' && !isDomainMatch(m.domain, filterDomain.value)) return false
    if (searchTerm.value && !m.name.toLowerCase().includes(searchTerm.value.toLowerCase()) && !m.provider.toLowerCase().includes(searchTerm.value.toLowerCase())) return false
    return true
  })
})

const curlExample = computed(() => {
  if (!apiDetailsModel.value) return ''
  if (apiDetailsModel.value.type === 'Embedding') {
    return `curl -X POST https://api.internal.com/v1/models/${apiDetailsModel.value.id}/invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "待分析向量的特征长句文本"}'`
  } else if (apiDetailsModel.value.type === 'Reranker') {
    return `curl -X POST https://api.internal.com/v1/models/${apiDetailsModel.value.id}/invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "我的检索词", "documents": ["段落1", "段落2"]}'`
  } else {
    return `curl -X POST https://api.internal.com/v1/models/${apiDetailsModel.value.id}/invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"messages": [{"role": "user", "content": "我的大语言提问"}]}'`
  }
})

const handleTest = (model: any) => {
  previewModel.value = model
  if (model.type === 'LLM') {
    chatLog.value = [{role: 'model', content: `你好，我是 ${model.name}，基于 ${model.provider} 提供的大语言模型服务。请发送您的测试问题。`}]
    message.value = ''
  } else if (model.type === 'Embedding') {
    functionInputs.value = { input: '' }
    functionResult.value = null
  } else if (model.type === 'Reranker') {
    functionInputs.value = { query: '', documents: '' }
    functionResult.value = null
  }
}

const executeFunction = () => {
  isRunning.value = true
  functionResult.value = null
  
  setTimeout(() => {
    isRunning.value = false
    if (previewModel.value?.type === 'Embedding') {
      const input = functionInputs.value?.input || ''
      // Generate normalized mock vector
      const v: number[] = []
      let sumSq = 0
      for (let i = 0; i < 16; i++) {
        const val = (Math.random() - 0.5) * 0.25
        v.push(val)
        sumSq += val * val
      }
      const norm = Math.sqrt(sumSq)
      functionResult.value = {
        success: true,
        vector: v.map(val => Number((val / norm).toFixed(6))),
        dimensions: 1536,
        usage: { tokens: Math.floor(input.length / 4) }
      }
    } else if (previewModel.value?.type === 'Reranker') {
      const docs = (functionInputs.value?.documents || '').split('\n').filter((d: string) => d.trim())
      const scored = docs.map((doc: string) => {
        let score = 0.05 + Math.random() * 0.1
        const keywords = ['rag', '检索', '相关', '召回', '交叉', '精排', '打分', '黄金', 'Rerank']
        keywords.forEach(word => {
          if (doc.toLowerCase().includes(word.toLowerCase())) {
            score += 0.26
          }
        })
        score = Math.min(score, 0.988)
        return { doc, score: Number(score.toFixed(4)) }
      })
      scored.sort((a: any, b: any) => b.score - a.score)
      functionResult.value = {
        success: true,
        results: scored,
        usage: { tokens: Math.floor((functionInputs.value?.query || '').length / 4) }
      }
    }
  }, 1500)
}

const sendMessage = () => {
  if (!message.value.trim()) return
  const userContent = message.value
  const updatedLog = [...chatLog.value, { role: 'user' as const, content: userContent }]
  chatLog.value = updatedLog
  message.value = ''
  isTyping.value = true

  setTimeout(() => {
    chatLog.value = [...updatedLog, { role: 'model' as const, content: `[沙盒测试响应] 这是 ${previewModel.value?.name} 针对您刚刚问题的模拟回复。实际上我是一个高保真的UI原型组件。` }]
    isTyping.value = false
  }, 1500)
}

const chatScrollRef = ref<HTMLDivElement | null>(null)

watch([chatLog, isTyping], async () => {
  await nextTick()
  if (chatScrollRef.value) {
    chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
  }
})
</script>

<template>
  <div class="h-full flex flex-col space-y-6">
    <Dialog :open="!!previewModel" @update:open="(open: boolean) => !open && (previewModel = null)">
      <DialogContent 
        :title="`效果测试预览: ${previewModel?.name}`" 
        class="h-[600px] flex flex-col max-w-3xl"
      >
        <template v-if="previewModel?.type === 'LLM'">
          <div ref="chatScrollRef" class="flex-1 overflow-y-auto mb-4 space-y-4">
            <div v-for="(msg, i) in chatLog" :key="i" :class="['flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start']">
              <div v-if="msg.role === 'model'" class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Bot class="w-5 h-5"/>
              </div>
              <div :class="['p-3 rounded-lg max-w-[80%] text-sm', msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none']">
                {{ msg.content }}
              </div>
              <div v-if="msg.role === 'user'" class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <User class="w-5 h-5"/>
              </div>
            </div>
            <div v-if="isTyping" class="flex gap-3 justify-start">
              <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Bot class="w-5 h-5"/>
              </div>
              <div class="p-3 rounded-lg bg-slate-100 text-slate-500 rounded-bl-none flex items-center gap-2">
                <Loader2 class="w-4 h-4 animate-spin" /> 正在生成回复...
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <Input 
              v-model="message" 
              @keydown.enter="sendMessage"
              :placeholder="`向 ${previewModel?.name} 发送消息测试...`" 
            />
            <Button @click="sendMessage" class="bg-blue-600"><Send class="w-4 h-4"/></Button>
          </div>
        </template>
        
        <template v-else-if="previewModel?.type === 'Embedding'">
          <div class="flex-1 flex gap-6 overflow-hidden">
            <div class="w-1/2 flex flex-col space-y-4 pr-2 overflow-y-auto">
              <div class="bg-indigo-50/50 p-2.5 rounded-lg border border-l-4 border-l-indigo-500 text-xs text-indigo-950 leading-relaxed">
                <strong>特征空间转换</strong>：向量模型接收自由长文档，并将其转换为稠密多维浮点数坐标表示的几何向量，以此充当企业高级检索召回 (Dense Retrieve) 的基石。
              </div>
              <div class="flex-1 flex flex-col space-y-2">
                <label class="text-xs font-bold text-slate-500">参数文本输入</label>
                <textarea 
                  :value="functionInputs.input"
                  @input="functionInputs.input = ($event.target as HTMLTextAreaElement).value"
                  class="w-full flex-1 p-3 border border-slate-200 rounded-lg text-sm font-sans focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed" 
                  placeholder="在此输入需要转成特征矢量的中文/英文文本..."
                />
              </div>
              
              <Button 
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10" 
                @click="executeFunction"
                :disabled="isRunning || !functionInputs.input?.trim()"
              >
                <template v-if="isRunning">
                  <Loader2 class="w-4 h-4 mr-2 animate-spin" /> 计算内积与空间投影中...
                </template>
                <template v-else>
                  <Play class="w-4 h-4 mr-2" /> 生成特征向量坐标 (Embedding)
                </template>
              </Button>
            </div>
            
            <div class="w-1/2 border-l border-slate-100 pl-6 flex flex-col justify-between">
              <div class="space-y-4 flex-1 overflow-y-auto">
                <h3 class="font-semibold text-slate-800 text-xs uppercase tracking-wider text-slate-400">向量特征输出 (Normalized Vector)</h3>
                
                <div v-if="!functionResult && !isRunning" class="h-48 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg bg-slate-50 p-4 text-center">
                  点击左侧提取后，即可在此查看从极高维超空间转换回显的浮点参数分量数值。
                </div>
                <div v-else-if="isRunning" class="h-48 flex flex-col items-center justify-center text-indigo-600 space-y-4 border border-slate-100 rounded-lg bg-slate-50/50">
                  <Loader2 class="w-8 h-8 animate-spin text-indigo-500" />
                  <span class="text-xs text-slate-500 font-mono">Dimensional Floating Matrix computing...</span>
                </div>
                <div v-else class="space-y-4 animate-in fade-in">
                  <div class="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div class="text-emerald-900 text-xs font-bold">语义词矢量化映射成功</div>
                      <div class="text-[10px] text-emerald-600/90 mt-0.5">向量空间维度: {{ functionResult.dimensions }} 维 (L2范数归一化)</div>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <div v-for="(val, idx) in functionResult.vector.slice(0, 16)" :key="idx" class="flex items-center gap-2">
                      <span class="text-[10px] text-slate-400 w-8">{{ idx }}</span>
                      <div class="flex-1 h-4 bg-slate-100 rounded-sm overflow-hidden">
                        <div class="h-full bg-indigo-500 rounded-sm" :style="{ width: `${Math.abs(val) * 100}%` }"></div>
                      </div>
                      <span class="text-[10px] text-indigo-600 font-mono w-16 text-right">{{ val }}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 text-center mt-2">... ({{ Number(functionResult.dimensions) - 16 }} more dimensions)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <template v-else-if="previewModel?.type === 'Reranker'">
          <div class="flex-1 flex gap-6 overflow-hidden">
            <div class="w-1/2 flex flex-col space-y-4 pr-2 overflow-y-auto">
              <div class="bg-amber-50/50 p-2.5 rounded-lg border border-l-4 border-l-amber-500 text-xs text-amber-950 leading-relaxed">
                <strong>语义精准排序</strong>：重排模型 (Reranker) 接收 Query 与候选文档列表，结合语义相关性进行交叉编码评分，对初筛结果进行精排重排，提升 Top-K 召回的精准度。
              </div>
              <div class="space-y-3">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-500">检索 Query (查询意图)</label>
                  <Input 
                    :value="functionInputs.query"
                    @input="(e: string) => functionInputs.query = e"
                    class="h-9" 
                    placeholder="输入您的检索查询词..."
                  />
                </div>
                <div class="flex-1 flex flex-col space-y-1.5">
                  <label class="text-xs font-bold text-slate-500">候选文档列表 (每行一篇)</label>
                  <textarea 
                    :value="functionInputs.documents"
                    @input="functionInputs.documents = ($event.target as HTMLTextAreaElement).value"
                    class="w-full flex-1 p-3 border border-slate-200 rounded-lg text-sm font-sans focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none leading-relaxed min-h-[120px]" 
                    placeholder="在此输入候选文档，每行一篇&#10;例如：&#10;大语言模型在RAG中的应用研究&#10;如何构建企业级知识库系统&#10;向量数据库选型指南..."
                  />
                </div>
              </div>
              
              <Button 
                class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-10" 
                @click="executeFunction"
                :disabled="isRunning || !functionInputs.query?.trim() || !functionInputs.documents?.trim()"
              >
                <template v-if="isRunning">
                  <Loader2 class="w-4 h-4 mr-2 animate-spin" /> 交叉语义评分中...
                </template>
                <template v-else>
                  <Play class="w-4 h-4 mr-2" /> 执行 Rerank 精排重排
                </template>
              </Button>
            </div>
            
            <div class="w-1/2 border-l border-slate-100 pl-6 flex flex-col overflow-y-auto">
              <h3 class="font-semibold text-slate-800 text-xs uppercase tracking-wider text-slate-400 mb-4">精排输出 (相关性得分)</h3>
              
              <div v-if="!functionResult && !isRunning" class="flex-1 flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg bg-slate-50 p-4 text-center">
                输入 Query 和候选文档后，点击重排即可查看相关性评分排名。
              </div>
              <div v-else-if="isRunning" class="flex-1 flex flex-col items-center justify-center text-amber-600 space-y-4">
                <Loader2 class="w-8 h-8 animate-spin text-amber-500" />
                <span class="text-xs text-slate-500 font-mono">Cross-Encoder Scoring...</span>
              </div>
              <div v-else class="space-y-3">
                <div v-for="(item, idx) in functionResult.results" :key="idx" class="bg-white border border-slate-200 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] uppercase tracking-wider font-bold text-slate-400">Rank #{{ Number(idx) + 1 }}</span>
                    <span :class="[
                      'px-2 py-0.5 rounded text-xs font-bold',
                      item.score >= 0.7 ? 'bg-emerald-100 text-emerald-700' :
                      item.score >= 0.4 ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    ]">{{ item.score.toFixed(4) }}</span>
                  </div>
                  <div class="text-sm text-slate-700 leading-relaxed">{{ item.doc }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </DialogContent>
    </Dialog>

    <Dialog :open="!!apiDetailsModel" @update:open="(open: boolean) => !open && (apiDetailsModel = null)">
      <DialogContent :title="`集成对接规范: ${apiDetailsModel?.name}`" class="max-w-3xl">
        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-4 text-sm bg-slate-50/60 p-4 rounded-xl border">
            <div class="space-y-1">
              <div class="text-slate-500 text-xs font-medium">模型版本</div>
              <div class="font-bold text-slate-800">{{ apiDetailsModel?.version }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-slate-500 text-xs font-medium">可用度状态</div>
              <div class="font-bold text-slate-850 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                {{ apiDetailsModel?.status }}
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-slate-500 text-xs font-medium">源接口运营商</div>
              <div class="font-bold text-slate-800">{{ apiDetailsModel?.provider }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-slate-500 text-xs font-medium">
                {{ apiDetailsModel?.type === 'Embedding' ? '最大输入 Tokens' : '最大上下文限制' }}
              </div>
              <div class="font-bold text-slate-800">{{ apiDetailsModel?.context }}</div>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-bold text-slate-800 mb-2 border-b pb-2">API 服务接入点 (Internal Proxy Endpoint)</h4>
            <div class="bg-slate-900 text-indigo-200 rounded-xl p-3.5 flex items-center justify-between font-mono text-xs shadow-inner">
              <code>
                POST https://api.internal.com/v1/models/
                <span class="text-white font-bold">{{ apiDetailsModel?.id }}</span>
                /invoke
              </code>
              <Button variant="outline" size="sm" class="h-8 text-slate-300 border-slate-600 hover:bg-slate-800 hover:text-white">复制</Button>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-bold text-slate-800 mb-2 border-b pb-2 flex items-center gap-1">
              <Terminal class="w-4 h-4 text-indigo-500" />
              安全请求通信示例 (cURL)
            </h4>
            <pre class="bg-slate-950 border border-slate-800 rounded-xl p-4 text-emerald-400 text-xs overflow-x-auto leading-relaxed shadow-lg font-mono">{{ curlExample }}</pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">模型仓管理</h1>
      <div class="flex items-center gap-3">
        <router-link to="/models/new">
          <Button class="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus class="mr-2 h-4 w-4" />
            注册新模型
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
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 mr-2 text-slate-500" />
            智能分类筛选
          </div>
          <div class="w-[1px] h-6 bg-slate-200 mx-1 hidden md:block"></div>
          
          <div class="relative flex-1 min-w-[200px]">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              v-model="searchTerm"
              placeholder="搜索模型名称或提供商..." 
              class="pl-9"
            />
          </div>
          
          <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-slate-500 whitespace-nowrap">模型状态:</label>
            <div class="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
              <button
                v-for="status in [{ id: 'all', label: '全部' }, { id: '已上线', label: '已上线' }, { id: '部署中', label: '部署中' }, { id: '已下线', label: '已下线' }]"
                :key="status.id"
                @click="filterStatus = status.id"
                :class="[
                  'text-[11px] px-2.5 py-1.5 rounded-md font-bold transition-colors',
                  filterStatus === status.id ? 'bg-indigo-50 text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-800'
                ]"
              >
                {{ status.label }}
              </button>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-slate-500 whitespace-nowrap">模型类别:</label>
            <div class="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
              <button
                v-for="type in [{ id: 'all', label: '全部' }, { id: 'LLM', label: '大语言' }, { id: 'Embedding', label: '向量模型' }, { id: 'Reranker', label: '排序模型' }]"
                :key="type.id"
                @click="filterType = type.id"
                :class="[
                  'text-[11px] px-2.5 py-1.5 rounded-md font-bold transition-colors',
                  filterType === type.id ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-800'
                ]"
              >
                {{ type.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="filteredModels.length === 0" class="py-20 text-center bg-white border border-dashed border-slate-200 rounded-lg">
            <Bot class="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p class="text-slate-500 font-medium">暂无符合条件的模型</p>
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Card v-for="model in filteredModels" :key="model.id" class="flex flex-col p-5 hover:shadow-md hover:border-indigo-300 transition-all border-slate-200 bg-white rounded-xl relative group">
              <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-2 text-[10px]">
                  <span :class="[
                    'px-2 py-0.5 rounded-full font-extrabold',
                    model.type === 'LLM' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 
                    model.type === 'Embedding' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                    'bg-amber-50 text-amber-600 border border-amber-100'
                  ]">
                    {{ model.type === 'LLM' ? 'LLM 大语言' : model.type === 'Embedding' ? 'Embedding 向量' : 'Reranker 排序' }}
                  </span>
                  <span :class="[
                    'px-2 py-0.5 rounded-full font-bold shadow-xs',
                    model.status === '已上线' ? 'bg-emerald-100 text-emerald-700' : 
                    model.status === '已下线' ? 'bg-slate-100 text-slate-500' : 
                    'bg-blue-100 text-blue-700'
                  ]">{{ model.status }}</span>
                </div>
                
                <div class="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    @click.stop="openMenuId = openMenuId === model.id ? null : model.id"
                  >
                    <MoreHorizontal class="h-5 w-5" />
                  </Button>
                  
                  <div v-if="openMenuId === model.id" class="absolute right-0 top-8 w-36 bg-white rounded-xl shadow-lg border border-slate-200/80 z-20 py-1 flex flex-col animate-in fade-in slide-in-from-top-1">
                    <button 
                      class="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 text-left font-semibold"
                      @click="apiDetailsModel = model"
                    >
                      <Info class="w-3.5 h-3.5 mr-2 inline" /> API详情
                    </button>
                    <button 
                      v-if="model.status === '已上线'"
                      class="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-amber-600 text-left font-semibold"
                      @click="handleStatusChange(model.id, '已下线')"
                    >
                      <PowerOff class="w-3.5 h-3.5 mr-2 inline" /> 标记下线
                    </button>
                    <button 
                      v-else
                      class="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-600 text-left font-semibold"
                      @click="handleStatusChange(model.id, '已上线')"
                    >
                      <Power class="w-3.5 h-3.5 mr-2 inline" /> 标记上线
                    </button>
                    <div class="my-1 border-t border-slate-100"></div>
                    <button 
                      class="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left font-semibold"
                      @click="handleDelete(model.id)"
                    >
                      <Trash class="w-3.5 h-3.5 mr-2 inline" /> 删除模型
                    </button>
                  </div>
                </div>
              </div>

              <h2 class="text-base font-extrabold text-slate-800 tracking-tight mb-1 group-hover:text-blue-600 transition-colors font-sans">{{ model.name }}</h2>
              <p class="text-xs text-slate-400 line-clamp-2 mb-4 h-8 leading-normal">{{ model.desc }}</p>
              
              <div class="flex justify-between items-center text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-5 font-semibold">
                <span>厂商: {{ model.provider }}</span>
                <span class="px-2 py-0.5 rounded-md bg-white border font-bold">
                  {{ getDomainLabel(model.domain) }}
                </span>
              </div>

              <div class="flex justify-between items-center text-xs text-slate-600 mt-auto pt-3 border-t border-slate-100 font-semibold">
                <div class="flex items-center gap-1">
                  <span class="text-slate-400 font-medium font-sans">版本号</span>
                  <span>{{ model.version }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-slate-400 font-medium font-sans">
                    {{ model.type === 'Embedding' ? '最大输入' : '最大窗口' }}
                  </span>
                  <span>{{ model.context }}</span>
                </div>
              </div>

              <div class="flex gap-2 mt-4 pt-1">
                <Button 
                  @click="apiDetailsModel = model"
                  variant="outline" 
                  class="flex-1 h-8 text-[11px] font-bold bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 px-1 truncate flex items-center justify-center shadow-xs"
                >
                  <Info class="mr-1 h-3.5 w-3.5 shrink-0" />
                  API详情
                </Button>
                <Button 
                  @click="handleTest(model)"
                  class="flex-1 h-8 text-[11px] font-bold bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 shadow-xs flex items-center justify-center"
                >
                  <Play class="mr-1 h-3.5 w-3.5 shrink-0" />
                  效果测试
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>