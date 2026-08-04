<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  ArrowLeft, Save, Plus, CheckCircle2, AlertTriangle, Play, RefreshCw, Loader2,
  FileText, Globe, Database
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import DomainSelect from '@/components/common/DomainSelect.vue'
import { addKB, type KBDocument, type KBSlice } from '@/lib/kb-store'

const router = useRouter()
const route = useRoute()

const kbType = computed(() => {
  const type = route.query.type as string || 'local'
  return ['local', 'web', 'db'].includes(type) ? type : 'local'
})

const title = ref('')
const domain = ref('base-general-agent')
const description = ref('')
const embeddingModel = ref('text-embedding-004')

const showSuccessModal = ref(false)
const newKbId = ref('')
const alertMessage = ref<string | null>(null)

const webUrl = ref('https://wiki.example.com/hr-policies')
const crawlDepth = ref<number>(2)
const isCrawling = ref(false)
const webParsedPages = ref<Array<{ url: string; size: string; chunks: number; time: string; status: string }>>([])
const crawlSettingRule = ref('AI-Markdown净化机制')

const dbType = ref('MySQL')
const dbHost = ref('172.30.5.121')
const dbPort = ref('3306')
const dbUser = ref('rag_sql_connector')
const dbQuery = ref('SELECT * FROM ops_manual_docs limit 100')
const dbCron = ref('0 2 * * *')
const isDbTesting = ref(false)
const dbTestSuccess = ref<boolean | null>(null)

const toastMessage = ref<string | null>(null)

const triggerToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3000)
}

const triggerSafeAlert = (msg: string) => {
  alertMessage.value = msg
}

const handleSimulateCrawl = () => {
  isCrawling.value = true
  setTimeout(() => {
    webParsedPages.value = [{ url: webUrl.value, size: '125 KB', chunks: 8, time: '180ms', status: '200 网络就绪' }]
    isCrawling.value = false
    triggerToast('🕸️ 网页连通测试通过！')
  }, 1500)
}

const handleSimulateDbConnection = () => {
  isDbTesting.value = true
  setTimeout(() => {
    isDbTesting.value = false
    dbTestSuccess.value = true
    triggerToast('🔌 数据库连通校验通过！')
  }, 1500)
}

const handleSaveAndParse = () => {
  if (!title.value.trim()) {
    triggerSafeAlert('请输入知识库名称！')
    return
  }

  const defaultDesc = description.value.trim() || '基于大模型的高维信息隔离重构库'
  const saved = addKB({
    title: title.value.trim(),
    type: kbType.value as 'local' | 'web' | 'db',
    status: kbType.value === 'local' ? '待解析' : '解析完成',
    progress: kbType.value === 'local' ? 0 : 100,
    domain: domain.value,
    wordCount: 0,
    embeddingModel: embeddingModel.value,
    description: defaultDesc,
    docs: [],
    slices: [],
    folders: [],
    permissions: {
      manageDepts: [], managePositions: [], manageUserGroups: [],
      accessQueryDepts: ['all_depts'], accessQueryPositions: [], accessQueryUserGroups: [],
      accessDownloadDepts: [], accessDownloadPositions: [], accessDownloadUserGroups: []
    }
  })

  router.push(`/kb/${saved.id}`)
}

const getTypeNameInChinese = () => {
  if (kbType.value === 'local') return '文档'
  if (kbType.value === 'web') return '网页网络'
  return '企业数据库同步'
}

const getTypeIcon = () => {
  if (kbType.value === 'local') return FileText
  if (kbType.value === 'web') return Globe
  return Database
}

onMounted(() => {
})
</script>

<template>
  <div class="p-6 max-w-[1200px] mx-auto space-y-6">
    
    <div v-if="toastMessage" class="fixed bottom-6 right-6 z-50 bg-slate-900 text-slate-100 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs">
      <CheckCircle2 class="w-4 h-4 text-blue-400" />
      <span>{{ toastMessage }}</span>
    </div>

    <div v-if="alertMessage" class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card class="max-w-md w-full p-6 bg-white">
        <div class="flex items-start gap-3">
          <div class="p-2 bg-rose-50 rounded-lg text-rose-600"><AlertTriangle class="w-5 h-5" /></div>
          <div>
            <h3 class="text-sm font-bold mt-0.5">校验信息</h3>
            <p class="text-xs text-slate-500 mt-1">{{ alertMessage }}</p>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <Button size="sm" @click="alertMessage = null">好的</Button>
        </div>
      </Card>
    </div>

    <div class="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4">
      <div class="space-y-1">
        <h1 class="text-xl font-extrabold flex items-center gap-2 text-slate-800">
          <component :is="getTypeIcon()" class="w-5 h-5 text-blue-600" />
          新建 {{ getTypeNameInChinese() }} 知识库
        </h1>
        <p class="text-xs text-slate-400">完成知识库基础信息配置，后续可进入详情界面进一步配置目录结构和权限。</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" class="h-9" @click="router.back()">取消</Button>
        <Button class="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 font-bold" @click="handleSaveAndParse">
          <Save class="h-4 w-4 mr-2" /> 保存初稿
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6">
      <Card class="p-6 bg-white rounded-xl shadow-sm border-slate-100">
        <h2 class="text-sm font-bold border-b border-slate-100 pb-3 mb-4 text-slate-800">
          知识主干基本信息
        </h2>
        <div class="space-y-4 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold mb-1.5 text-slate-700">名称 *</label>
              <Input v-model="title" class="h-10 text-xs" />
            </div>
            <div>
              <label class="block font-bold mb-1.5 text-slate-700">归属业务垂直领域 *</label>
              <div class="h-10 border rounded-md px-1 py-0.5 flex items-center bg-slate-50 border-slate-200">
                <DomainSelect v-model="domain" :allowAll="false" />
              </div>
            </div>
          </div>
          <div>
            <label class="block font-bold mb-1.5 text-slate-700">功能备注说明</label>
            <textarea 
              v-model="description"
              class="w-full h-16 rounded-md border border-slate-200 bg-white p-3 text-xs focus:ring-1 focus:ring-blue-500" 
            />
          </div>
        </div>
      </Card>

      <Card v-if="kbType === 'web'" class="p-6 bg-white rounded-xl shadow-sm border-slate-100">
        <h2 class="text-sm font-bold border-b border-slate-100 pb-3 mb-4 text-slate-800">
          万维网采集配置
        </h2>
        <div class="space-y-4 text-xs">
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
              <label class="block font-bold mb-1 text-slate-700">主网址 *</label>
              <Input v-model="webUrl" class="h-10" />
            </div>
            <div>
              <label class="block font-bold mb-1 text-slate-700">抓取深度</label>
              <select v-model="crawlDepth" class="w-full h-10 border border-slate-200 rounded px-2">
                <option :value="1">1层深度</option>
                <option :value="2">2层深度</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-bold mb-1 text-slate-700">清洗机制</label>
              <select v-model="crawlSettingRule" class="w-full h-10 border border-slate-200 rounded px-2">
                <option>AI-Markdown净化机制</option>
              </select>
            </div>
            <div class="flex items-end">
               <Button @click="handleSimulateCrawl" class="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-bold">
                 <Loader2 v-if="isCrawling" class="w-4 h-4 mr-2 animate-spin" />
                 <Play v-else class="w-4 h-4 mr-2" />
                 测试连通性
               </Button>
            </div>
          </div>
          <div v-if="webParsedPages.length > 0" class="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-slate-500 font-bold">
                  <th class="text-left py-1">URL</th>
                  <th class="text-left py-1">大小</th>
                  <th class="text-left py-1">切块</th>
                  <th class="text-left py-1">耗时</th>
                  <th class="text-left py-1">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(page, idx) in webParsedPages" :key="idx">
                  <td class="py-1 text-slate-700">{{ page.url }}</td>
                  <td class="py-1 text-slate-600">{{ page.size }}</td>
                  <td class="py-1 text-slate-600">{{ page.chunks }}</td>
                  <td class="py-1 text-slate-600">{{ page.time }}</td>
                  <td class="py-1 text-emerald-600">{{ page.status }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card v-if="kbType === 'db'" class="p-6 bg-white rounded-xl shadow-sm border-slate-100">
        <h2 class="text-sm font-bold border-b border-slate-100 pb-3 mb-4 text-slate-800">
          数据库 JDBC 配置
        </h2>
        <div class="space-y-4 text-xs">
          <div class="grid grid-cols-4 gap-4">
            <div>
              <label class="block font-bold mb-1 text-slate-700">方言</label>
              <Input v-model="dbType" readonly class="h-10 bg-slate-50" />
            </div>
            <div>
              <label class="block font-bold mb-1 text-slate-700">Host</label>
              <Input v-model="dbHost" class="h-10" />
            </div>
            <div>
              <label class="block font-bold mb-1 text-slate-700">Port</label>
              <Input v-model="dbPort" class="h-10" />
            </div>
            <div>
              <label class="block font-bold mb-1 text-slate-700">账户</label>
              <Input v-model="dbUser" class="h-10" />
            </div>
          </div>
          <div>
            <label class="block font-bold mb-1 text-slate-700">SQL语句</label>
            <Input v-model="dbQuery" class="h-10" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-bold mb-1 text-slate-700">定时任务 Cron</label>
              <Input v-model="dbCron" class="h-10" />
            </div>
            <div class="flex items-end">
              <Button @click="handleSimulateDbConnection" class="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-bold">
                <Loader2 v-if="isDbTesting" class="w-4 h-4 mr-2 animate-spin" />
                <RefreshCw v-else class="w-4 h-4 mr-2" />
                测试数据库
              </Button>
            </div>
          </div>
          <div v-if="dbTestSuccess !== null" :class="['p-3 rounded-lg text-xs flex items-center gap-2', dbTestSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700']">
            <CheckCircle2 v-if="dbTestSuccess" class="w-4 h-4" />
            <AlertTriangle v-else class="w-4 h-4" />
            <span>{{ dbTestSuccess ? '数据库连接测试成功！' : '数据库连接测试失败，请检查配置。' }}</span>
          </div>
        </div>
      </Card>

       <div class="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-xs flex flex-col gap-1 items-start">
          <h4 class="font-bold">知识库权限与成员管辖配置提示</h4>
          <p class="opacity-80">初稿保存后，本知识库默认在安全沙箱中阻隔隔离。您可以在创建成功后的 <b>"详情 &gt; 权限管理"</b> 标签栏中，精准设置各部门/群组对当前库的独立"管理、问答对话、文档下载"授权红线。</p>
       </div>

    </div>
  </div>
</template>
