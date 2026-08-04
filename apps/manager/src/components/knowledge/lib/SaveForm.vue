<template>
  <div class="knowledge-form h-full flex flex-col default-bg">
    <SubPageHeader back title="新建文档知识库" desc="完成知识库基础信息配置，后续可进入详情界面进一步配置目录结构和权限。">
      <div class="flex items-center gap-2">
        <btn @click="router.back()">取消</btn>
        <btn type="primary" @click="handleSave">
          <Save class="h-4 w-4 mr-2" /> 保存初稿
        </btn>
      </div>
    </SubPageHeader>

    <div class="knowledge-form-main">
      <Card class="p-6 bg-white rounded-xl shadow-sm border-slate-100">
        <div class="form-title pb-3 mb-4">
          知识主干基本信息
        </div>
        <el-form :model="status.saveForm" :rules="status.rules" ref="formRef" label-position="top" class="w-full">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <el-form-item label="名称" prop="name">
              <el-input v-model="status.saveForm.name" placeholder="请输入知识库名称" />
            </el-form-item>
            <el-form-item label="归属业务垂直领域" prop="categoryId">
              <DomainSelect v-model="status.saveForm.categoryId" check-strictly :allowAll="false"
                placeholder="请选择归属业务垂直领域" />
            </el-form-item>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <el-form-item label="选择模型" prop="embeddingModel">
              <el-select-v2 v-model="status.saveForm.embeddingModel" placeholder="模型选择" :props="modelProps"
                :options="status.embeddingModelOptions" />
            </el-form-item>
            <el-form-item label="" prop="rerankModel" class="rerank-model">
              <template #label>
                <span>&nbsp;</span>
              </template>
              <el-select-v2 v-model="status.saveForm.rerankModel" placeholder="模型选择" :props="modelProps"
                :options="status.rerankModelOptions" />
            </el-form-item>
          </div>
          <el-form-item label="简介" prop="description">
            <el-input type="textarea" v-model="status.saveForm.description" :rows="4" placeholder="请输入简介" />
          </el-form-item>
        </el-form>
        <!-- <div class="space-y-4 text-xs">
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
        </div> -->
      </Card>

      <div
        class="knowledge-form-more-info bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-xs flex flex-col gap-1 items-start">
        <h4 class="font-bold">知识库权限与成员管辖配置提示</h4>
        <p class="opacity-80">初稿保存后，本知识库默认在安全沙箱中阻隔隔离。您可以在创建成功后的 <b>"详情 &gt; 权限管理"</b>
          标签栏中，精准设置各部门/群组对当前库的独立"管理、问答对话、文档下载"授权红线。</p>
      </div>

    </div>
  </div>
</template>
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft, Save, Plus, CheckCircle2, AlertTriangle, Play, RefreshCw, Loader2,
  FileText, Globe, Database
} from 'lucide-vue-next'
// import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import DomainSelect from '@/components/common/DomainSelect2.vue'
// import { addKB, type KBDocument, type KBSlice } from '@/lib/kb-store'
import SubPageHeader from '@/components/page/SubPageHeader.vue'

import { addKnowledgeLibApi, detailKnowledgeLibApi, getEmbeddingModelList, getRerankModelList, updateKnowledgeLibApi } from '@/api/knowledgeLib/knowledgeLib'
import { agiModel as agiModelApi } from '@/api/resources/model'
const router = useRouter()
// const route = useRoute()


import type { KnowledgeLibSaveParams } from '@/types'

const props = defineProps({
  id: {
    type: [Number, String],
    default: ''
  },
  domain: {
    type: [Number, String],
    default: ''
  }
})
const modelProps = {
  value: 'id',
  label: 'name',
}
const formRef = ref(null)
const status = reactive({
  saveForm: {
    // id: 0, // ID
    categoryId: null, // 分类ID
    name: '', // 常见问题名称
    description: '', // 常见问题描述
    knowledgeType: 0, // 知识库类型, 0:文档, 1:Q&A
    embeddingModel: '', // 向量模型
    rerankModel: '' // 排序模型
  },
  rules: {
    name: [{ required: true, message: '请输入知识库名称！', trigger: 'blur' }],
    categoryId: [{ required: true, message: '请选择归属业务垂直领域', trigger: 'change' }],
    embeddingModel: [{ required: true, message: '请选择模型', trigger: 'change' }],
    rerankModel: [{ required: true, message: '请选择模型', trigger: 'change' }],
  },
  embeddingModelOptions: [],
  rerankModelOptions: []
});

const getEmbeddingModelOptions = () => {
  agiModelApi.list({
    modelType: 2,
    status: 1
  }, {}).then(res => {
    status.embeddingModelOptions = res.rows || []
  })
}
const getRerankModelOptions = () => {
  agiModelApi.list({
    modelType: 3,
    status: 1
  }, {}).then(res => {
    status.rerankModelOptions = res.rows || []
  })
}

const getDataById = (id: number | string) => {
  detailKnowledgeLibApi(id).then((res: any) => {
    status.saveForm = res.data || {}
  })
}

const doSave = () => {
  const params: KnowledgeLibSaveParams = status.saveForm
  if (params.id) {
    updateKnowledgeLibApi(params).then((res: any) => {
      if (res.code === 200) {
        router.back()
      }
    })
  } else {
    addKnowledgeLibApi(params).then((res: any) => {
      if (res.code === 200) {
        router.back()
      }
    })
  }
}

const handleSave = () => {
  formRef.value.validate().then((valid: boolean) => {
    if (!valid) {
      return
    }
    doSave()
  })
}
onMounted(() => {
  if (props.id) {
    getDataById(props.id)
  } else if (props.domain) {
    const domain = parseInt(props.domain)
    if (domain) {
      status.saveForm.categoryId = domain
    }
  }
  getEmbeddingModelOptions()
  getRerankModelOptions()
})



// const kbType = computed(() => {
//   const type = route.query.type as string || 'local'
//   return ['local', 'web', 'db'].includes(type) ? type : 'local'
// })

// const title = ref('')
// const domain = ref('base-general-agent')
// const description = ref('')
// const embeddingModel = ref('text-embedding-004')

// const showSuccessModal = ref(false)
// const newKbId = ref('')
// const alertMessage = ref<string | null>(null)

// const webUrl = ref('https://wiki.example.com/hr-policies')
// const crawlDepth = ref<number>(2)
// const isCrawling = ref(false)
// const webParsedPages = ref<Array<{ url: string; size: string; chunks: number; time: string; status: string }>>([])
// const crawlSettingRule = ref('AI-Markdown净化机制')

// const dbType = ref('MySQL')
// const dbHost = ref('172.30.5.121')
// const dbPort = ref('3306')
// const dbUser = ref('rag_sql_connector')
// const dbQuery = ref('SELECT * FROM ops_manual_docs limit 100')
// const dbCron = ref('0 2 * * *')
// const isDbTesting = ref(false)
// const dbTestSuccess = ref<boolean | null>(null)

// const toastMessage = ref<string | null>(null)

// const triggerToast = (msg: string) => {
//   toastMessage.value = msg
//   setTimeout(() => { toastMessage.value = null }, 3000)
// }

// const triggerSafeAlert = (msg: string) => {
//   alertMessage.value = msg
// }

// const handleSimulateCrawl = () => {
//   isCrawling.value = true
//   setTimeout(() => {
//     webParsedPages.value = [{ url: webUrl.value, size: '125 KB', chunks: 8, time: '180ms', status: '200 网络就绪' }]
//     isCrawling.value = false
//     triggerToast('🕸️ 网页连通测试通过！')
//   }, 1500)
// }

// const handleSimulateDbConnection = () => {
//   isDbTesting.value = true
//   setTimeout(() => {
//     isDbTesting.value = false
//     dbTestSuccess.value = true
//     triggerToast('🔌 数据库连通校验通过！')
//   }, 1500)
// }


</script>
<style scoped lang="scss">
.knowledge-form-main {
  flex: 1;
  overflow: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 130px;
}

.form-title {
  font-weight: bold;
  font-size: 16px;
  color: #2b2f33;
  text-align: left;
}

.rerank-model {
  :deep(.el-form-item__label) {
    opacity: 0;
  }
}

.knowledge-form-more-info {
  margin-top: 20px;
}
</style>
