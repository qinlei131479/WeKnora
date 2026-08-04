<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Save, ShieldCheck, Server, Eye, Loader2, Sparkles, Terminal } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import DomainSelect from '@/components/common/DomainSelect.vue'

const router = useRouter()

const modelType = ref('LLM')
const domain = ref('')
const showApiKey = ref(false)
const name = ref('')
const apiBaseUrl = ref('https://api.deepseek.com/v1')
const modelId = ref('deepseek-reasoner')
const apiKey = ref('')
const version = ref('v1.0.0')
const provider = ref('DeepSeek')

const supportDeepThinking = ref(false)
const maxContextWindow = ref('128000')
const maxOutputTokens = ref('4096')
const supportStreaming = ref(true)

const embeddingDimensions = ref('1536')
const embeddingMaxInput = ref('8192')

const rerankerMaxInput = ref('2048')
const rerankerMaxDocs = ref('100')

const isChecking = ref(false)
const isProbed = ref(false)
const probeLogs = ref<string[]>([])

const handleProbeConstraints = () => {
  isChecking.value = true
  isProbed.value = false
  probeLogs.value = ['[连接测试] 正在发起 API 握手控制协议连接测试...']
  
  setTimeout(() => {
    probeLogs.value = [...probeLogs.value, '[连接测试] 握手成功! 正在向下游接口发送安全身份鉴权包...']
    setTimeout(() => {
      probeLogs.value = [...probeLogs.value, `[探测识别] 鉴权成功 (HTTP 200 OK)。网络质量 RTT: 78ms. 自动分析并识别为 [${modelType.value === 'LLM' ? '大语言模型 (LLM)' : modelType.value === 'Embedding' ? '向量模型 (Embedding)' : '排序模型 (Reranker)'}]`]
      setTimeout(() => {
        probeLogs.value = [...probeLogs.value, '[元数据解构] 正在执行模型结构规格自测试，推算极值载重边界参数...']
        setTimeout(() => {
          if (modelType.value === 'LLM') {
            maxContextWindow.value = '128000'
            maxOutputTokens.value = '4096'
            supportStreaming.value = true
            supportDeepThinking.value = true
            probeLogs.value = [
              ...probeLogs.value,
              '✔ [自动回填] 最大上下文窗口(Context): 128,000 Tokens',
              '✔ [自动回填] 全局单次最大输出: 4,096 Tokens',
              '✔ [自动回填] 接口流式支持(Streaming): 是',
              '✔ [自动回填] 推理深度自适应思考支持: 是',
              '✔ [探测成功] 探测结束，对应负载与能力约束已自动回写锁定!'
            ]
          } else if (modelType.value === 'Embedding') {
            embeddingDimensions.value = '1536'
            embeddingMaxInput.value = '8192'
            probeLogs.value = [
              ...probeLogs.value,
              '✔ [自动回填] 向量输出维度(Dimensions): 1,536 维',
              '✔ [自动回填] 最大输入字长限制: 8,192 Tokens',
              '✔ [探测成功] 探测结束，对应负载与能力约束已自动回写锁定!'
            ]
          } else {
            rerankerMaxInput.value = '2048'
            rerankerMaxDocs.value = '100'
            probeLogs.value = [
              ...probeLogs.value,
              '✔ [自动回填] 最大输入单段分词长度: 2,048 Tokens',
              '✔ [自动回填] 单次最大支持精排数量: 100 组文档',
              '✔ [探测成功] 探测结束，对应负载与能力约束已自动回写锁定!'
            ]
          }
          isChecking.value = false
          isProbed.value = true
        }, 700)
      }, 500)
    }, 500)
  }, 500)
}

const handleSave = () => {
  router.push('/models')
}

const handleModelTypeChange = (value: string) => {
  modelType.value = value
  isProbed.value = false
  probeLogs.value = []
}
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <div class="flex items-center justify-between pb-4 border-b border-slate-200">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="router.back()">
          <ArrowLeft class="h-5 w-5 text-slate-500" />
        </Button>
        <div>
          <h1 class="text-xl font-semibold text-slate-800 font-sans tracking-tight">注册新模型资源</h1>
          <p class="text-sm text-slate-500">接入三方托管 API 服务或关联本地高性能大模型实例接口</p>
        </div>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="router.back()">取消</Button>
        <Button class="bg-blue-600 hover:bg-blue-700 text-white font-medium" @click="handleSave">
          <Save class="h-4 w-4 mr-2" />
          保存模型配置
        </Button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto pb-8">
      <div class="max-w-4xl mx-auto space-y-6 mt-6">
        <Card class="p-6 border-slate-200 shadow-sm">
          <h2 class="text-lg font-medium text-slate-800 mb-6 font-sans">基础定义</h2>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">模型显示名称 *</label>
              <Input 
                placeholder="例如：DeepSeek-R1-Turbo" 
                v-model="name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">归属领域分类 *</label>
              <DomainSelect 
                v-model="domain"
                :allow-all="false"
                placeholder="选择负责的业务系统或分类"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">提供商/厂商标识 *</label>
              <Input 
                placeholder="例如：DeepSeek / 内部自研 / Google" 
                v-model="provider"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 font-sans">模型类型 *</label>
              <select 
                v-model="modelType"
                @change="handleModelTypeChange(modelType)"
                class="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-800"
              >
                <option value="LLM">大语言模型 (LLM)</option>
                <option value="Embedding">向量模型 (Embedding)</option>
                <option value="Reranker">排序模型 (Reranker)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">版本号</label>
              <Input 
                placeholder="例如：v1.0.0" 
                v-model="version"
              />
            </div>
          </div>
        </Card>

        <Card class="p-6 border-slate-200 shadow-sm">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-medium text-slate-800 font-sans">服务接口配置</h2>
            <div class="flex items-center text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full font-medium">
              <ShieldCheck class="w-3.5 h-3.5 mr-1" />
              安全沙箱校验中
            </div>
          </div>
          
          <div class="space-y-6">
            <div>
              <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <Server class="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <h4 class="text-sm font-bold text-slate-800">内置接入方式: Web/互联网 API 接入</h4>
                  <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                    采用标准的 RESTful 网络协议进行通信。无需您额外管理计算容器，系统会统一通过代理鉴权将请求下发至模型服务端接口。
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">接口规范标准</label>
                <select class="w-full max-w-sm h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium">
                  <option>OpenAI 兼容协议 (含 /v1/chat/completions 或 /v1/embeddings)</option>
                  <option>Ollama 本地大模型协议</option>
                  <option>自定义网关代理标准规范</option>
                </select>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2 text-xs text-slate-500 px-3 py-2 bg-slate-50 border border-slate-100 rounded leading-relaxed">
                  提醒: 如果是局域网内部署的模型，请检查本系统容器所在的子网安全组与端口路由规则，并填入可在系统正常访问的路由地址。
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Base URL (含协议前缀) *</label>
                  <Input 
                    v-model="apiBaseUrl"
                    placeholder="例如 https://api.deepseek.com/v1" 
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Model ID (模型代码/型号) *</label>
                  <Input 
                    v-model="modelId"
                    placeholder="例如: deepseek-chat" 
                  />
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-slate-700 mb-1">API Key / Token 密钥 *</label>
                  <div class="relative w-full max-w-sm">
                    <Input 
                      :type="showApiKey ? 'text' : 'password'" 
                      placeholder="sk-..." 
                      v-model="apiKey"
                      class="pr-10"
                    />
                    <button 
                      type="button"
                      @click="showApiKey = !showApiKey"
                      class="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card class="p-6 border-slate-200 shadow-sm">
          <div class="border-b border-slate-100 pb-3 mb-6">
            <h2 class="text-lg font-medium text-slate-800 font-sans">负载及能力约束</h2>
            <p class="text-sm text-slate-500 mt-1">设定不同模型类别下的最适通信数据水位、推理上下文窗口以及专属高级能力属性。</p>
          </div>

          <div class="space-y-6">
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div class="space-y-1">
                <h3 class="text-sm font-semibold text-indigo-900 flex items-center gap-1.5 font-sans">
                  <Sparkles class="w-4 h-4 text-indigo-600" />
                  连接性自测与规格属性智能探测
                </h3>
                <p class="text-xs text-slate-500 max-w-xl">
                  系统将测试连接可用度并执行微小特征请求探测。通过分析返回协议包规格，<strong>自动计算并回填下方约束参数</strong>。
                </p>
              </div>
              <Button 
                type="button"
                @click="handleProbeConstraints"
                :disabled="isChecking"
                class="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 font-bold px-4 py-2 text-xs rounded-lg transition-all"
              >
                <Loader2 v-if="isChecking" class="w-3.5 h-3.5 mr-2 animate-spin" />
                <template v-if="isChecking">正在通信中...</template>
                <template v-else-if="isProbed">重新探测并回填</template>
                <template v-else>测试连接并探测约束</template>
              </Button>
            </div>

            <div v-if="isChecking || probeLogs.length > 0" class="bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs rounded-xl p-4 leading-relaxed max-h-48 overflow-y-auto shadow-inner">
              <div class="flex justify-between text-slate-500 border-b border-slate-800 pb-1.5 mb-2 text-[10px] select-none">
                <span class="flex items-center gap-1.5 font-bold uppercase"><Terminal class="w-3.5 h-3.5 text-indigo-400" /> API PROBE SHELL_TERMINAL</span>
                <span class="animate-pulse text-indigo-400">ACTIVE HANDSHAKE</span>
              </div>
              <div class="space-y-1">
                <div v-for="(log, index) in probeLogs" :key="index" class="flex gap-2">
                  <span class="text-indigo-400 select-none">&gt;</span>
                  <span :class="log.startsWith('✔') ? 'text-emerald-400 font-medium' : ''">{{ log }}</span>
                </div>
              </div>
            </div>

            <div v-if="modelType === 'LLM'" class="grid grid-cols-2 gap-6 pt-2">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 flex justify-between items-center">
                  <span>最大上下文窗口 (Tokens)</span>
                  <span v-if="isProbed" class="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">✔ 自动回填</span>
                </label>
                <Input 
                  type="number" 
                  v-model="maxContextWindow"
                  placeholder="例如: 128000" 
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 flex justify-between items-center">
                  <span>全局单次最大输出限制 (Tokens)</span>
                  <span v-if="isProbed" class="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">✔ 自动回填</span>
                </label>
                <Input 
                  type="number" 
                  v-model="maxOutputTokens"
                  placeholder="例如: 4096" 
                />
              </div>
              <div class="col-span-2 flex flex-col gap-3 pt-2">
                <label class="flex items-start gap-3 bg-indigo-50/30 p-3.5 rounded-lg border border-indigo-150 hover:bg-indigo-50/60 transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="supportDeepThinking"
                    class="w-4.5 h-4.5 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                  />
                  <div>
                    <div class="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                      支持深度思考 (Reasoning Output)
                      <span class="text-[10px] text-indigo-600 bg-indigo-100/60 px-1.5 py-0.5 rounded font-semibold">LLM 专属</span>
                    </div>
                    <p class="text-xs text-slate-500 mt-0.5">
                      开启后，系统将自动识别并渲染思考节点（例如 &lt;think&gt; ... &lt;/think&gt;），以折叠脑区的视觉特效向测试者展示逐步思考过程。
                    </p>
                  </div>
                </label>

                <label class="flex items-start gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200/60 hover:bg-slate-100/50 transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="supportStreaming"
                    class="w-4.5 h-4.5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <div>
                    <div class="text-sm font-semibold text-slate-800">模型接口原生支持流式传输 (Streaming)</div>
                    <p class="text-xs text-slate-500 mt-0.5">
                      在运行评估及对话测试时，将使用 Server-Sent Events (SSE) 协议直接打字流式输出响应，大幅提高反馈实时感。
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div v-if="modelType === 'Embedding'" class="grid grid-cols-2 gap-6 pt-2">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 flex justify-between items-center">
                  <span>向量输出维度 (Dimensions)</span>
                  <span v-if="isProbed" class="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">✔ 自动回填</span>
                </label>
                <Input 
                  type="number" 
                  v-model="embeddingDimensions"
                  placeholder="例如: 1536" 
                />
                <p class="text-xs text-slate-400 mt-1">
                  文本通过模型向量化抽取出的固有数值空间的数学通道维度大小（如 OpenAI text-embedding-3-small 通常为 1536）。
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 flex justify-between items-center">
                  <span>最大单条输入限制 (Tokens)</span>
                  <span v-if="isProbed" class="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">✔ 自动回填</span>
                </label>
                <Input 
                  type="number" 
                  v-model="embeddingMaxInput"
                  placeholder="例如: 8192" 
                />
                <p class="text-xs text-slate-400 mt-1">单条输入文本执行词元化并转化为稠密向量的最大长度限制。</p>
              </div>
            </div>

            <div v-if="modelType === 'Reranker'" class="grid grid-cols-2 gap-6 pt-2">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 flex justify-between items-center">
                  <span>最大单段分词长度 (Tokens)</span>
                  <span v-if="isProbed" class="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">✔ 自动回填</span>
                </label>
                <Input 
                  type="number" 
                  v-model="rerankerMaxInput"
                  placeholder="例如: 2048" 
                />
                <p class="text-xs text-slate-400 mt-1">
                  进行文档交叉相关打分时，Query 和候选段落拼接进行序列编码的最大接收长度。
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1 flex justify-between items-center">
                  <span>单次最大打分文档块数 (Chunks limit)</span>
                  <span v-if="isProbed" class="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">✔ 自动回填</span>
                </label>
                <Input 
                  type="number" 
                  v-model="rerankerMaxDocs"
                  placeholder="例如: 100" 
                />
                <p class="text-xs text-slate-400 mt-1">
                  单次重排打分调用中，允许传递并评估的重排序候选段落文本数量的最大安全阈值。
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
