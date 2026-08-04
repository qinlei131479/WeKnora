<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Save, Plus, Clock, Zap, Search, Bot, Database, Calendar, List, ChevronLeft, ChevronRight, Shield, User, BookOpen, Wrench, Trash, ArrowLeft
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DomainSelect from '@/components/common/DomainSelect.vue'
import { addAgent } from '@/lib/agent-store'

interface Props {
  isBase?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isBase: false,
})

const router = useRouter()
const route = useRoute()

const showKbModal = ref(false)
const showToolModal = ref(false)
const showModelModal = ref(false)
const showTaskModal = ref(false)
const showDataModal = ref(false)
const showDataPreviewModal = ref(false)
const showCapabilityModal = ref(false)
const showPermissionModal = ref(false)
const selectedTableName = ref('')
const taskActionType = ref<'prompt' | 'capability'>('prompt')
const memoryEnabled = ref(false)

interface AuthorizedItem {
  id: string
  type: '部门' | '岗位' | '用户组'
  name: string
  detail: string
}

const authorizedItems = ref<AuthorizedItem[]>([
  { id: 'perm-dept-1', type: '部门', name: '人力资源部', detail: '所有成员及下属层级' },
  { id: 'perm-post-1', type: '岗位', name: '招聘专员', detail: '匹配全局岗位体系' },
])

const permSearch = ref('')
const permTypeFilter = ref<'部门' | '岗位' | '用户组'>('部门')

const ALL_PERMISSION_CANDIDATES = [
  { id: 'c-1', type: '部门', name: '产品研发部', detail: '所有成员及下属二层研发团队' },
  { id: 'c-2', type: '部门', name: '市场营销部', detail: '产品推广及华东销售分部' },
  { id: 'c-3', type: '部门', name: '人力资源部', detail: '所有成员及下属层级' },
  { id: 'c-4', type: '部门', name: '财务管理中心', detail: '包含审计及出纳财务组' },
  { id: 'c-5', type: '部门', name: '华南大区销售团队', detail: '大中华南部首脑办' },
  { id: 'c-6', type: '部门', name: '客户成功组', detail: '售后支持与客户服务工程师' },
  { id: 'c-7', type: '部门', name: '党建工作办公室', detail: '组织建设与思政核心工作组' },
  { id: 'c-8', type: '部门', name: '媒体宣传中心', detail: '宣传与品牌建设融媒体' },
  { id: 'c-10', type: '岗位', name: '招聘专员', detail: '匹配全局通用岗位' },
  { id: 'c-11', type: '岗位', name: '媒介策划', detail: '媒体通识主导公关官' },
  { id: 'c-12', type: '岗位', name: '前端研发专家', detail: '资深及高级开发工程师' },
  { id: 'c-13', type: '岗位', name: '财务会计', detail: '具备中级及以上会计职称人员' },
  { id: 'c-14', type: '岗位', name: '思想政治辅导员', detail: '全日制团支书与思政辅导人员' },
  { id: 'c-15', type: '岗位', name: '内容编辑专家', detail: '融媒体中控核心校核专员' },
  { id: 'c-20', type: '用户组', name: '集团常务高管组', detail: '包含董事局特别委员会' },
  { id: 'c-21', type: '用户组', name: '红色突击队党团组', detail: '思政建设及宣传带头人特战组' },
  { id: 'c-22', type: '用户组', name: '智慧讲师共创会', detail: '外部签约博主与金牌名师组' },
  { id: 'c-23', type: '用户组', name: '行政值周志愿组', detail: '青年团干及本周期值班人员' },
] as const

type TabKey = 'persona' | 'model' | 'knowledge' | 'data' | 'tool' | 'capability' | 'task' | 'permission'

const activeTab = ref<TabKey>(props.isBase ? 'model' : 'persona')
const taskViewMode = ref<'calendar' | 'list'>('calendar')
const name = ref('')
const brainType = ref<'base' | 'business'>('business')
const isEditing = ref(!props.isBase)

const defaultDomain = (route.query.domain as string) || 'biz-hr'
const domain = ref(defaultDomain)

const description = ref('')
const welcomeText = ref('你好，很高兴为您服务！请问有什么可以帮助您？')
const mode = ref('即时响应')
const instantModel = ref('Gemini 1.5 Pro')
const model = ref('DeepSeek R1')
const systemPrompt = ref('')

interface Trigger {
  id: number
  name: string
  type: string
  desc: string
  value: string
  action: string
}

const triggers = ref<Trigger[]>([
  { id: 1, name: '每日员工生日提醒', type: 'cron', desc: '每天 18:00 自动调取"ERP 查询分析大脑"获取近一周过生日员工，并通过智能体端推送到业务群。', value: '0 18 * * *', action: 'MCP 执行：PushToDingTalk' },
  { id: 2, name: '员工离职审批面谈派发', type: 'event', desc: "监听 OA 系统的 'hr.resign' 事件，自动抽取内容交由分析规则判定异常，推待办通知所在部门主管。", value: 'Topic: hr.resign.*', action: '执行工作流：HRBP关怀流' },
])

const filteredCandidates = computed(() => {
  return ALL_PERMISSION_CANDIDATES
    .filter((c) => c.type === permTypeFilter.value)
    .filter((c) => !permSearch.value.trim() || c.name.toLowerCase().includes(permSearch.value.toLowerCase()) || c.detail.toLowerCase().includes(permSearch.value.toLowerCase()))
})

const isCandidateAdded = (name: string) => {
  return authorizedItems.value.some((item) => item.name === name)
}

const handleAddCandidate = (candidate: { id: string; type: '部门' | '岗位' | '用户组'; name: string; detail: string }) => {
  authorizedItems.value.push({
    id: 'perm-' + Math.random().toString(36).substring(2, 9),
    type: candidate.type,
    name: candidate.name,
    detail: candidate.detail,
  })
}

const handleRemoveAuth = (id: string) => {
  authorizedItems.value = authorizedItems.value.filter((x) => x.id !== id)
}

const handleSave = () => {
  if (!props.isBase && !name.value.trim()) {
    alert('请输入智能体名称')
    return
  }
  addAgent({
    name: props.isBase ? '通识基础脑' : name.value,
    description: description.value || '智能体背景描述，基于多源微调体系与挂载工作流运行体系构建。',
    domain: props.isBase ? 'base' : (domain.value || 'business'),
    status: '已发布',
    mode: mode.value,
    model: model.value,
    brainType: props.isBase ? 'base' : 'business',
  })
  if (!props.isBase) {
    router.back()
  } else {
    alert('基础半脑配置已保存生效！')
  }
}

const tabs = computed(() => {
  const base = [
    { id: 'model' as TabKey, label: '模型', icon: Bot },
    { id: 'knowledge' as TabKey, label: '知识', icon: BookOpen },
    { id: 'data' as TabKey, label: '数据访问', icon: Database },
    { id: 'tool' as TabKey, label: '工具', icon: Wrench },
    { id: 'capability' as TabKey, label: '能力', icon: Zap },
  ]
  if (!props.isBase) {
    return [
      { id: 'persona' as TabKey, label: '人设', icon: User },
      ...base,
      { id: 'task' as TabKey, label: '任务', icon: Calendar },
      { id: 'permission' as TabKey, label: '权限', icon: Shield },
    ]
  }
  return base
})
</script>

<template>
  <div class="h-full flex flex-col bg-white font-sans">
    <Dialog v-model:open="showKbModal">
      <DialogContent title="选择要关联的知识库" class="max-w-2xl">
        <div class="space-y-4">
          <Input placeholder="搜索库名..." class="mb-4" />
          <div class="grid grid-cols-2 gap-4">
            <div v-for="kb in ['新媒体知识库', '行政管理制度', '研发周报汇总', '客户沟通SOP']" :key="kb" class="p-4 border border-slate-200 rounded-lg flex items-center justify-between hover:border-blue-400 cursor-pointer">
              <span class="font-medium text-slate-700">{{ kb }}</span>
              <input type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4" :checked="kb === '行政管理制度'" />
            </div>
          </div>
          <div class="flex justify-end pt-4 border-t border-slate-100">
            <Button class="bg-blue-600 hover:bg-blue-700" @click="showKbModal = false">确认添加</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showToolModal">
      <DialogContent title="引入工具" class="max-w-2xl">
        <div class="space-y-4">
          <div class="flex gap-4 mb-4">
            <select class="w-48 h-10 border border-slate-200 rounded-md text-sm px-3 focus:outline-blue-500 bg-white shadow-sm">
              <option>所有</option>
              <option>业务 API (REST/OpenAPI)</option>
              <option>MCP (Model Context Protocol)</option>
              <option>云函数扩展 (Serverless Code)</option>
              <option>CLI (本地指令/脚本)</option>
              <option>前端组件 (Native Edge)</option>
            </select>
            <div class="w-48">
              <DomainSelect model-value="all" :allow-all="true" :root-domain-id="props.isBase ? 'base' : 'business'" @update:model-value="() => {}" />
            </div>
            <Input placeholder="搜索工具..." class="flex-1" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div v-for="t in [
              { name: '发送到钉钉群组', desc: '向指定钉钉群发送Markdown消息或图表通知' },
              { name: '飞书审批流触发', desc: '自动创建飞书审批工单并进入流程流转' },
              { name: 'OA 用户权限查询', desc: '查询公司内部OA系统中员工的系统访问权限' },
              { name: 'Jira 创建工单', desc: '自动在Jira项目中创建指定类型的任务工单' },
              { name: 'GitLab CI 触发器', desc: '触发指定GitLab项目的CI/CD流水线执行' }
            ]" :key="t.name" class="p-4 border border-slate-200 rounded-lg flex flex-col justify-center hover:border-emerald-400 cursor-pointer relative">
              <div class="font-medium text-slate-700 text-sm mb-1">{{ t.name }}</div>
              <div class="text-xs text-slate-500 mb-2 truncate pr-6" :title="t.desc">{{ t.desc }}</div>
              <div class="absolute top-4 right-4">
                <input type="checkbox" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 w-4 h-4" :checked="t.name.includes('钉钉') || t.name.includes('飞书')" />
              </div>
            </div>
          </div>
          <div class="flex justify-end pt-4 border-t border-slate-100">
            <Button class="bg-emerald-600 hover:bg-emerald-700 text-white" @click="showToolModal = false">确认添加</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showCapabilityModal">
      <DialogContent title="引入能力 (Skill/工作流)" class="max-w-2xl">
        <div class="space-y-4">
          <div class="flex gap-4 mb-4">
            <select class="w-48 h-10 border border-slate-200 rounded-md text-sm px-3 focus:outline-blue-500 bg-white shadow-sm">
              <option>所有</option>
              <option>Agent Skill</option>
              <option>AI 工作流</option>
            </select>
            <div class="w-48">
              <DomainSelect model-value="all" :allow-all="true" :root-domain-id="props.isBase ? 'base' : 'business'" @update:model-value="() => {}" />
            </div>
            <Input placeholder="搜索已发布的能力..." class="flex-1" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div v-for="t in (props.isBase ? ['全局敏感词过滤规则(工作流)', '基础运算能力组件(Skill)', '拼写检查与纠错流', '统一日志记录组件'] : ['简历解析与提取组件', '企业发票智能核验', '数据图表生成器', '文本翻译与润色'])" :key="t" class="p-4 border border-slate-200 rounded-lg flex flex-col justify-center hover:border-amber-400 cursor-pointer relative">
              <div class="font-medium text-slate-700 text-sm mb-1">{{ t }}</div>
              <p class="text-xs text-slate-500 mt-1 text-amber-600/70">{{ t.includes('工作流') ? 'AI 工作流' : 'Skill 仓组件' }}</p>
              <div class="absolute top-4 right-4">
                <input type="checkbox" class="rounded border-slate-300 text-amber-600 focus:ring-amber-600 w-4 h-4" :checked="t.includes('全局') || t.includes('简历')" />
              </div>
            </div>
          </div>
          <div class="flex justify-end pt-4 border-t border-slate-100">
            <Button class="bg-amber-600 hover:bg-amber-700 text-white" @click="showCapabilityModal = false">确认关联</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showModelModal">
      <DialogContent :title="props.isBase ? '引入基础模型' : '引入业务模型'" class="max-w-2xl">
        <div class="space-y-4">
          <div class="flex gap-4 mb-4">
            <select class="w-48 h-10 border border-slate-200 rounded-md text-sm px-3 focus:outline-blue-500 bg-white shadow-sm">
              <option>所有</option>
              <option>文本向量化 (Text Embedding)</option>
              <option>光学字符识别 (OCR)</option>
              <option>语音识别/合成 (ASR/TTS)</option>
              <option>业务垂类模型</option>
            </select>
            <Input placeholder="搜索已部署的模型..." class="flex-1" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div v-for="t in (props.isBase ? ['文本向量化 (Text Embedding)', '通用光学字符识别 (OCR)', '语音转文本 (ASR)', '语音合成 (TTS)'] : ['简历字段提取模型 (LoRA)', '报销单据识别模型', '客户情感倾向分析模型', '商品图像质检模型'])" :key="t" class="p-4 border border-slate-200 rounded-lg flex flex-col justify-center hover:border-blue-400 cursor-pointer relative">
              <div class="font-medium text-slate-700 text-sm mb-1">{{ t }}</div>
              <p class="text-xs text-slate-500 mt-1">{{ props.isBase ? '基础多模态解析模型' : '业务微调模型' }}</p>
              <div class="absolute top-4 right-4">
                <input type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4" :checked="t.includes('文本') || t.includes('OCR')" />
              </div>
            </div>
          </div>
          <div class="flex justify-end pt-4 border-t border-slate-100">
            <Button class="bg-blue-600 hover:bg-blue-700 text-white" @click="showModelModal = false">确认关联</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showPermissionModal">
      <DialogContent title="选择并授权可用人员范围 (点选查找机制)" class="max-w-2xl font-sans">
        <div class="space-y-4">
          <p class="text-xs text-slate-400">支持按部门、岗位及用户组分级授权。您可以在上方切换类别，或者在输入框内快速输入关键词，进行智能一键加入。</p>
          <div class="flex gap-3 mb-2 flex-wrap">
            <select v-model="permTypeFilter" class="w-40 h-10 border border-slate-200 rounded-xl text-xs px-3 focus:outline-blue-500 bg-white shadow-sm font-bold text-slate-700">
              <option value="部门">按 部门 授权</option>
              <option value="岗位">按 岗位 授权</option>
              <option value="用户组">按 用户组 授权</option>
            </select>
            <div class="flex-1 relative">
              <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input v-model="permSearch" placeholder="检索当前类别下的特定名称或说明..." class="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-indigo-500 font-medium text-xs" />
            </div>
          </div>
          <div class="border border-slate-200 rounded-xl max-h-[260px] overflow-y-auto bg-slate-50/50 p-2.5 space-y-2">
            <div v-for="candidate in filteredCandidates" :key="candidate.id" class="flex items-center justify-between p-3 bg-white border border-slate-150 rounded-xl shadow-sm hover:border-indigo-200 transition-colors">
              <div class="flex items-center gap-3">
                <span :class="['w-2 h-2 rounded-full', candidate.type === '部门' ? 'bg-blue-500' : candidate.type === '岗位' ? 'bg-amber-500' : 'bg-purple-500']"></span>
                <div>
                  <div class="text-xs font-bold text-slate-800">{{ candidate.name }}</div>
                  <div class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ candidate.detail }}</div>
                </div>
              </div>
              <span v-if="isCandidateAdded(candidate.name)" class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">✔ 已在授权列表中</span>
              <Button v-else variant="outline" size="sm" @click="handleAddCandidate(candidate)">加入授权</Button>
            </div>
          </div>
          <div class="flex justify-end pt-4 border-t border-slate-100">
            <Button class="bg-indigo-600 hover:bg-indigo-700" @click="showPermissionModal = false">完成授权</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showDataModal">
      <DialogContent title="引入接入数据源" class="max-w-2xl">
        <div class="space-y-4">
          <Input placeholder="搜索已注册的系统库表或API视图..." class="mb-4" />
          <div class="grid grid-cols-2 gap-4">
            <div v-for="ds in [
              { name: 'ERP 核心业务从库实时视图', type: 'DB' },
              { name: 'OA 人员组织架构数据只读API', type: 'API' },
              { name: 'CRM 客户商机详情', type: 'DB' },
              { name: '招聘系统候选人库', type: 'DB' }
            ]" :key="ds.name" class="p-4 border border-slate-200 rounded-lg flex items-center justify-between hover:border-indigo-400 cursor-pointer">
              <div class="flex items-center gap-3">
                <div :class="['w-8 h-8 rounded flex items-center justify-center font-bold text-xs', ds.type === 'DB' ? 'bg-indigo-100 text-indigo-700' : 'bg-fuchsia-100 text-fuchsia-700']">
                  {{ ds.type }}
                </div>
                <div class="text-sm font-medium text-slate-800">{{ ds.name }}</div>
              </div>
              <div class="text-slate-300"><Plus class="w-5 h-5" /></div>
            </div>
          </div>
          <div class="flex justify-end pt-4 border-t border-slate-100">
            <Button class="bg-indigo-600 hover:bg-indigo-700 text-white" @click="showDataModal = false">确认添加</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showDataPreviewModal">
      <DialogContent :title="`数据预览: ${selectedTableName}`" class="max-w-4xl">
        <div class="space-y-4">
          <p class="text-sm text-slate-500">此预览仅展示前 5 条样本数据。智能体在被授权后可自主通过 SQL 或 API 检索全量数据。</p>
          <div class="border border-slate-200 rounded-md overflow-hidden bg-white">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-2 font-medium text-slate-600">ID</th>
                  <th class="px-4 py-2 font-medium text-slate-600">巡检区域</th>
                  <th class="px-4 py-2 font-medium text-slate-600">异常类型</th>
                  <th class="px-4 py-2 font-medium text-slate-600">报告人</th>
                  <th class="px-4 py-2 font-medium text-slate-600">状态</th>
                  <th class="px-4 py-2 font-medium text-slate-600">时间</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td class="px-4 py-2 font-mono text-xs">P-001</td>
                  <td class="px-4 py-2">A座 5楼茶水间</td>
                  <td class="px-4 py-2">设备损坏</td>
                  <td class="px-4 py-2">张三</td>
                  <td class="px-4 py-2 text-rose-600">待处理</td>
                  <td class="px-4 py-2 text-slate-500">2026-06-04</td>
                </tr>
                <tr>
                  <td class="px-4 py-2 font-mono text-xs">P-002</td>
                  <td class="px-4 py-2">B座 地下车库</td>
                  <td class="px-4 py-2">照明故障</td>
                  <td class="px-4 py-2">李四</td>
                  <td class="px-4 py-2 text-emerald-600">已修复</td>
                  <td class="px-4 py-2 text-slate-500">2026-06-03</td>
                </tr>
                <tr>
                  <td class="px-4 py-2 font-mono text-xs">P-003</td>
                  <td class="px-4 py-2">C座 12楼女卫</td>
                  <td class="px-4 py-2">清洁问题</td>
                  <td class="px-4 py-2">系统</td>
                  <td class="px-4 py-2 text-rose-600">待处理</td>
                  <td class="px-4 py-2 text-slate-500">2026-06-03</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-end pt-4 border-t border-slate-100">
            <Button variant="outline" @click="showDataPreviewModal = false">关闭</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showTaskModal">
      <DialogContent title="新建自动任务" class="max-w-xl">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">任务名称 *</label>
            <Input placeholder="输入任务名称，如：每周巡检报表发送" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">执行班期 (重复)</label>
              <select class="w-full h-10 border border-slate-200 rounded-md text-sm px-3 focus:outline-blue-500 bg-white">
                <option value="once">不重复 (仅一次)</option>
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
                <option value="custom">自定义 (Cron 表达式)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">执行时间</label>
              <Input type="time" defaultValue="00:00" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-3">任务唤醒后的执行动作 (Action)</label>
            <div class="flex gap-4 mb-3">
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="action_type" class="text-blue-600 focus:ring-blue-500" :checked="taskActionType === 'prompt'" @change="taskActionType = 'prompt'" />
                自主思考执行 (自然语言指令)
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="action_type" class="text-blue-600 focus:ring-blue-500" :checked="taskActionType === 'capability'" @change="taskActionType = 'capability'" />
                强制调用关联能力
              </label>
            </div>

            <textarea
              v-if="taskActionType === 'prompt'"
              class="w-full h-24 border border-slate-200 rounded-md text-sm p-3 focus:outline-blue-500 bg-slate-50"
              placeholder="请输入指令，智能体将被唤醒并根据此指令自主调用各项工具或能力。例如：'查询本周所有办公区的巡检记录并汇总异常发送给行政主管'。"
            />
            <select v-else class="w-full h-10 border border-slate-200 rounded-md text-sm px-3 focus:outline-blue-500 bg-slate-50">
              <option value="">-- 选择已挂载的工作流 / Skill --</option>
              <option value="hrbp-chat">HRBP 面谈流编排 (工作流)</option>
              <option value="resume-parser">简历解析与提取组件 (Skill)</option>
            </select>
          </div>

          <div class="flex justify-end pt-4 border-t border-slate-100">
            <Button class="bg-blue-600 hover:bg-blue-700 text-white font-medium" @click="showTaskModal = false">添加到任务日历</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-white">
      <div class="flex items-center gap-4">
        <Button v-if="!props.isBase" variant="ghost" size="icon" @click="router.back()">
          <ArrowLeft class="h-5 w-5 text-slate-500" />
        </Button>
        <div>
          <h1 class="text-xl font-semibold text-slate-800">{{ props.isBase ? '基础半脑配置' : '新建业务半脑' }}</h1>
          <p class="text-sm text-slate-500">{{ props.isBase ? '基础半脑配置将在所有智能体中生效' : '配置智能体大脑的思考模式、模型及可调用的工具与知识资源' }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <Button v-if="!props.isBase" variant="outline" @click="router.back()">取消</Button>
        <Button v-if="props.isBase && !isEditing" variant="outline" @click="isEditing = true">编辑基础半脑</Button>
        <Button v-if="props.isBase && isEditing" variant="outline" @click="isEditing = false">取消配置</Button>
        <Button class="bg-blue-600 hover:bg-blue-700 font-extrabold text-xs" :disabled="props.isBase && !isEditing" @click="handleSave">
          <Save class="h-4 w-4 mr-2" />
          {{ props.isBase ? '保存并生效' : '保存发布' }}
        </Button>
      </div>
    </div>

    <div class="flex-1 flex min-h-0 bg-white">
      <div class="w-48 border-r border-slate-200 bg-slate-50 flex flex-col p-4 space-y-2 shrink-0">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all',
            activeTab === tab.id
              ? 'bg-white shadow-sm text-blue-600 border border-slate-200 font-bold'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
          ]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="w-5 h-5" />
          <span class="text-sm font-medium">{{ tab.label }}</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-8 bg-slate-50">
        <fieldset :disabled="!isEditing" class="max-w-4xl space-y-6 border-0 p-0 m-0 min-w-0 w-full">
          <Card v-if="activeTab === 'persona'" class="p-6 border-slate-200">
            <h2 class="text-lg font-medium text-slate-800 mb-6">基础信息</h2>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div v-if="!props.isBase">
                  <label class="block text-sm font-medium text-slate-700 mb-1">大脑名称 *</label>
                  <Input placeholder="例如：行政巡检机器人助理" :model-value="name" @input="(e) => (name = (e.target as HTMLInputElement).value)" />
                </div>
                <div v-if="!props.isBase">
                  <label class="block text-sm font-medium text-slate-700 mb-1">归属领域分类 *</label>
                  <DomainSelect v-model="domain" :allow-all="false" root-domain-id="business" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">简述 *</label>
                <textarea v-model="description" class="w-full h-20 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="简述该智能体大脑的认知与处理职责..." />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">角色提示词 *</label>
                <textarea v-model="systemPrompt" class="w-full h-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="你是一个专业的行政管理专家，负责指导人形机器人完成巡检..." />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">开场白 (欢迎语)</label>
                <Input v-model="welcomeText" placeholder="你好，我是您的助理，请问有什么可以帮您？" />
                <p class="text-xs text-slate-400 mt-1.5">用户打开智能体时自动发送的第一句话。</p>
              </div>
            </div>
          </Card>

          <div v-if="activeTab === 'model'" class="space-y-6">
            <Card v-if="!props.isBase" class="p-6 border-slate-200">
              <h2 class="text-lg font-medium text-slate-800 mb-6">对话与推理</h2>
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">默认对话模式</label>
                    <select v-model="mode" class="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                      <option value="即时响应">即时响应</option>
                      <option value="深度思考">深度思考 (规划与分解)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">即时响应大模型 *</label>
                    <select v-model="instantModel" class="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                      <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                      <option value="GPT-4o">GPT-4o</option>
                      <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">深度思考大模型 *</label>
                    <select v-model="model" class="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                      <option value="DeepSeek R1">DeepSeek R1</option>
                      <option value="OpenAI o3-mini">OpenAI o3-mini</option>
                      <option value="Qwen Max">Qwen Max</option>
                    </select>
                  </div>
                </div>
                <div class="pt-4 border-t border-slate-100 flex items-start gap-3">
                  <input type="checkbox" v-model="memoryEnabled" class="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4" />
                  <div>
                    <label class="block text-sm font-medium text-slate-800 mb-0.5">开启长期记忆</label>
                    <p class="text-xs text-slate-500">开启后，固定重复的会话内容将被缓存至记忆库。后续调用大模型仅需传递对话摘要，无需传输完整历史，可同时实现 token 消耗降低与推理准确性提升。</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card class="p-6 border-slate-200">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h2 class="text-lg font-medium text-slate-800">{{ props.isBase ? '模型' : '其它模型' }}</h2>
                  <p class="text-xs text-slate-500 mt-1">{{ props.isBase ? '关联模型仓内的底层通用能力模型，让基础半脑具备处理底层事务和跨模态解析能力（如文本向量化、通用光学字符识别等）。' : '关联模型仓内的定制化垂类模型，让智能体具备视觉、语音或特定业务场景解析能力（如简历提取、发票识别）。' }}</p>
                </div>
                <Button variant="outline" size="sm" class="h-8 shadow-sm" @click="showModelModal = true">
                  <Plus class="w-3.5 h-3.5 mr-1" /> {{ props.isBase ? '引入模型' : '引入业务模型' }}
                </Button>
              </div>
              <div v-if="props.isBase" class="grid grid-cols-2 gap-4">
                <div v-for="m in ['文本向量化 (Text Embedding)', '通用光学字符识别 (OCR)', '语音转文本 (ASR)']" :key="m" class="p-4 border rounded-lg bg-white flex items-center justify-between shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center"><Bot class="w-4 h-4" /></div>
                    <div class="text-sm font-medium text-slate-800">{{ m }}</div>
                  </div>
                  <Button variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50" @click="alert('暂不支持删除')"><Trash class="w-4 h-4" /></Button>
                </div>
              </div>
              <div v-else class="p-4 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 flex flex-col items-center justify-center py-8 text-slate-500">
                <Bot class="w-10 h-10 text-slate-300 mb-2" />
                <p class="text-sm font-medium text-slate-600">暂无关联的拓展模型</p>
                <p class="text-xs text-slate-400">点击右上角按钮从"模型仓"引入</p>
              </div>
            </Card>
          </div>

          <Card v-if="activeTab === 'knowledge'" class="p-6 border-slate-200">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-medium text-slate-800 font-sans">关联纯文档与FAQ知识库</h2>
            </div>
            <div class="space-y-6">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-slate-700">关联文档与FAQ知识库</label>
                  <Button variant="outline" size="sm" class="h-8 shadow-sm" @click="showKbModal = true">
                    <Plus class="w-3.5 h-3.5 mr-1" /> 添加知识库
                  </Button>
                </div>
                <div class="p-4 border rounded-lg bg-white flex items-center justify-between shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">文档</div>
                    <div>
                      <div class="text-sm font-medium text-slate-800">行政管理制度及SOP规范文档汇编.pdf</div>
                      <div class="text-xs text-slate-400">已向量化：5,230 词嵌入 • 运行在 text-embedding-004</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50" @click="alert('暂不支持删除，此为默认关联')">取消关联</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card v-if="activeTab === 'data'" class="p-6 border-slate-200">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-medium text-slate-800 font-sans">结构化与多模态数据访问</h2>
            </div>
            <div class="space-y-6">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-slate-700">关联环境数据与多源接入 (Data Source)</label>
                  <Button variant="outline" size="sm" class="h-8 shadow-sm" @click="showDataModal = true">
                    <Plus class="w-3.5 h-3.5 mr-1" /> 引入接入数据源
                  </Button>
                </div>
                <div class="p-4 border rounded-lg bg-white shadow-sm hover:border-indigo-300 transition-colors">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">DB</div>
                    <div>
                      <div class="text-sm font-medium text-slate-800">ERP 核心业务从库实时视图</div>
                      <div class="text-xs text-slate-400">关系型数据只读能力授权，Agent可自主通过 SQL/RAG 查询</div>
                    </div>
                    <div class="ml-auto">
                      <Button variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50" @click="alert('暂不支持删除，此为默认挂载')"><Trash class="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div class="pl-11 space-y-2 text-sm text-slate-600">
                    <div v-for="table in ['hr_employees', 'property_inspections', 'finance_invoices']" :key="table" class="flex items-center justify-between p-2 hover:bg-slate-50 rounded group cursor-pointer" @click="selectedTableName = table; showDataPreviewModal = true">
                      <div class="flex items-center gap-2"><Database class="w-4 h-4 text-slate-400" /> {{ table }}</div>
                      <Button variant="ghost" size="sm" class="h-6 px-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100" @click.stop="selectedTableName = table; showDataPreviewModal = true">预览数据</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card v-if="activeTab === 'tool'" class="p-6 border-slate-200">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-medium text-slate-800 font-sans">已挂载的工具</h2>
              <Button variant="outline" size="sm" class="h-8 shadow-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" @click="showToolModal = true">
                <Plus class="w-3.5 h-3.5 mr-1" /> 挂载工具
              </Button>
            </div>
            <div class="space-y-4">
              <div class="p-4 border rounded-lg bg-white flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">MCP</div>
                  <div>
                    <div class="text-sm font-medium text-slate-800 font-sans">OA 系统标准审批与查阅</div>
                    <div class="text-xs text-slate-400 font-mono">调用: [{"{\"action\": \"approve\"}"}] • 访问 OA Open API</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50 font-bold" @click="alert('暂不支持删除，此为默认挂载')">取消挂载</Button>
              </div>
            </div>
          </Card>

          <Card v-if="activeTab === 'permission'" class="p-6 border-slate-200 font-sans shadow-sm rounded-2xl bg-white">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-105 pb-4">
              <div>
                <h2 class="text-[15px] font-black tracking-tight text-slate-800 flex items-center gap-1.5 font-sans">
                  <Shield class="w-4.5 h-4.5 text-indigo-500" />
                  业务使用权限与授权范围
                </h2>
                <p class="text-[11px] mt-1 text-slate-400 leading-normal">设置当前业务半脑可被哪些部门、岗位或用户组使用。本部分已接入智慧点选机制，防止数据冗余难选。</p>
              </div>
              <Button variant="outline" class="h-10 px-4 border-indigo-150 hover:bg-indigo-50/45 text-indigo-700 font-bold text-xs bg-white rounded-xl shadow-sm hover:border-indigo-200" @click="showPermissionModal = true">
                <Plus class="w-4 h-4 mr-1" />
                点选授权可用范围
              </Button>
            </div>
            <div class="space-y-3.5">
              <div v-if="authorizedItems.length === 0" class="py-12 text-center border-2 border-dashed border-slate-150 rounded-2xl bg-slate-50 text-slate-400 text-xs">
                <Shield class="w-10 h-10 text-slate-300 mx-auto mb-2 animate-bounce" />
                <p class="font-bold text-slate-600">无可用的授权使用范围</p>
                <p class="text-[11px] text-slate-400 mt-0.5">任何人都将无法查看或使用此大脑。点击上方按钮快速导入授权。</p>
              </div>
              <div v-for="item in authorizedItems" :key="item.id" class="p-4 border border-slate-150 rounded-xl bg-white hover:border-indigo-100 shadow-inner flex items-center justify-between transition-all group">
                <div class="flex items-center gap-3">
                  <span :class="['px-2 py-0.5 rounded-lg text-[9.5px] font-black border font-mono uppercase tracking-wider', item.type === '部门' ? 'bg-blue-50 text-blue-700 border-blue-150' : item.type === '岗位' ? 'bg-amber-50 text-amber-800 border-amber-150' : 'bg-purple-50 text-purple-800 border-purple-150']">
                    {{ item.type }}
                  </span>
                  <div>
                    <div class="text-xs font-bold text-slate-800">{{ item.name }}</div>
                    <div class="text-[10px] mt-0.5 text-slate-400 font-semibold">{{ item.detail }}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" class="text-rose-500 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs rounded-lg h-8 border border-transparent hover:border-rose-100" @click="handleRemoveAuth(item.id)">取消授权</Button>
              </div>
            </div>
          </Card>

          <Card v-if="activeTab === 'task'" class="flex flex-col border-slate-200 overflow-hidden bg-white" style="minHeight: 600px">
            <div class="flex items-center justify-between p-4 border-b border-slate-200">
              <div class="flex items-center gap-4">
                <h2 class="text-base font-semibold text-slate-800">所有自动任务</h2>
                <div class="flex items-center bg-slate-100 rounded-lg p-1">
                  <button :class="['px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2', taskViewMode === 'calendar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700']" @click="taskViewMode = 'calendar'">
                    <Calendar class="w-4 h-4" /> 日历
                  </button>
                  <button :class="['px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2', taskViewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700']" @click="taskViewMode = 'list'">
                    <List class="w-4 h-4" /> 列表
                  </button>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div v-if="taskViewMode === 'calendar'" class="flex items-center gap-2 mr-4 text-slate-600 font-medium text-xs">
                  <Button variant="ghost" size="icon" class="h-8 w-8"><ChevronLeft class="w-4 h-4" /></Button>
                  2026年 6月
                  <Button variant="ghost" size="icon" class="h-8 w-8"><ChevronRight class="w-4 h-4" /></Button>
                </div>
                <Button size="sm" class="h-8 shadow-sm bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold" @click="showTaskModal = true">
                  <Plus class="w-3.5 h-3.5 mr-1" /> 新建自动任务
                </Button>
              </div>
            </div>

            <div v-if="taskViewMode === 'calendar'" class="flex-1 flex flex-col p-4 bg-slate-50">
              <div class="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-t-lg overflow-hidden shrink-0">
                <div v-for="day in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']" :key="day" class="bg-white py-2 text-center text-xs font-medium text-slate-500">{{ day }}</div>
              </div>
              <div class="grid grid-cols-7 gap-px bg-slate-200 border-x border-b border-slate-200 rounded-b-lg overflow-hidden flex-1">
                <div v-for="(_, i) in Array.from({ length: 35 })" :key="i" :class="['bg-white p-2 min-h-[100px] flex flex-col', i < 30 ? '' : 'bg-slate-50 text-slate-400']">
                  <span :class="['text-xs font-bold mb-1', (i + 1) === 4 ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-700']">
                    {{ (i % 30) + 1 }}
                  </span>
                  <div v-if="i % 7 === 3 && i < 30" class="mt-1 px-1.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded shadow-sm cursor-pointer hover:bg-indigo-100 truncate" title="每周四0:00执行: 每周巡检汇总及通报">
                    0:00 每周巡检
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="flex-1 p-6 bg-slate-50 overflow-y-auto">
              <div class="space-y-4">
                <div v-for="trigger in triggers" :key="trigger.id" class="group p-4 border border-slate-200 hover:border-blue-300 rounded-lg bg-white relative transition-colors shadow-sm flex items-start gap-4">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-indigo-50 border border-indigo-100 text-indigo-500">
                    <Clock class="w-5 h-5" />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                      <h3 class="font-bold text-slate-800 text-sm">{{ trigger.name }}</h3>
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 uppercase">
                          {{ trigger.value }}
                        </span>
                        <label class="relative inline-flex items-center cursor-pointer ml-3">
                          <input type="checkbox" class="sr-only peer" :checked="true" />
                          <div class="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                    </div>
                    <p class="text-xs text-slate-500 mb-2 font-medium">{{ trigger.desc }}</p>
                    <div class="flex gap-2">
                      <Button variant="ghost" size="sm" class="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50 font-bold">编辑</Button>
                      <Button variant="ghost" size="sm" class="h-6 px-2 text-xs text-rose-500 hover:bg-rose-50 font-bold">删除</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card v-if="activeTab === 'capability'" class="p-6 border-slate-200">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-medium text-slate-800 font-sans">已引用的能力</h2>
              <Button variant="outline" size="sm" class="h-8 shadow-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold" @click="showCapabilityModal = true">
                <Plus class="w-3.5 h-3.5 mr-1" /> 引入能力 (Skill/工作流)
              </Button>
            </div>
            <div class="space-y-4">
              <template v-if="props.isBase">
                <div class="p-4 border rounded-lg bg-white flex items-center justify-between shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">工作流</div>
                    <div>
                      <div class="text-sm font-medium text-slate-800">全局敏感词过滤规则</div>
                      <div class="text-xs text-slate-400">调用: 自动串接过滤词库并执行打码或阻断</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50 font-bold" @click="alert('暂不支持删除，此为默认挂载')">取消挂载</Button>
                </div>
                <div class="p-4 border rounded-lg bg-white flex items-center justify-between shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">Skill</div>
                    <div>
                      <div class="text-sm font-medium text-slate-800">统一日志记录组件</div>
                      <div class="text-xs text-slate-400">执行: 异步保存所有智能处理的操作步骤</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50 font-bold" @click="alert('暂不支持删除')">取消挂载</Button>
                </div>
              </template>
              <template v-else>
                <div class="p-4 border rounded-lg bg-white flex items-center justify-between shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">工作流</div>
                    <div>
                      <div class="text-sm font-medium text-slate-800">HRBP 面谈流编排</div>
                      <div class="text-xs text-slate-400 font-mono">调用: [{"{\"employeeId\": \"1002\"}"}] • 自动映射员工沟通话术树</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50 font-bold" @click="alert('暂不支持删除，此为默认挂载')">取消挂载</Button>
                </div>
                <div class="p-4 border rounded-lg bg-white flex items-center justify-between shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">Skill</div>
                    <div>
                      <div class="text-sm font-medium text-slate-800">简历解析与提取组件</div>
                      <div class="text-xs text-slate-400">执行: 解析上传的简历附件并结构化为 JSON 字段</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" class="text-rose-600 hover:bg-rose-50 font-bold" @click="alert('暂不支持删除')">取消挂载</Button>
                </div>
              </template>
            </div>
          </Card>
        </fieldset>
      </div>
    </div>
  </div>
</template>
