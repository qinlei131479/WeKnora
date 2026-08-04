<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus, Search, FileJson, Layers, Play, MoreVertical, HelpCircle, ShieldCheck, Activity, Trash, Component, MoreHorizontal, Lock } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DomainSidebar from '@/components/common/DomainSidebar.vue'
import { isDomainMatch, getFlatDomains } from '@/lib/domain-store'

const activeTab = ref<'workflow' | 'skill'>('skill')
const showSkillHelp = ref(false)
const debugSkill = ref<any>(null)
const openMenuId = ref<string | null>(null)
const menuRef = ref<HTMLDivElement | null>(null)
const debugResult = ref<string | null>(null)
const currentDomain = ref('all')

const getDomainLabel = (domainId: string) => {
  const flat = getFlatDomains()
  const found = flat.find((f: any) => f.id === domainId)
  return found ? found.label : '公共通用'
}

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

const skillSearchTerm = ref('')
const skillFilterType = ref('all')

const workflowSearchTerm = ref('')

const skills = ref([
  { id: 'skill_hr_001', name: 'HR 面试问题生成器', desc: '基于 JD 描述生成结构化面试问题列表', type: '官方认证', status: '已上线', version: 'v1.0', domain: 'general', calls: 12430, errorRate: '0.0%' },
  { id: 'skill_doc_parser', name: '文档解析器', desc: 'OCR 识别 + 段落结构化提取', type: '私有知识区', status: '已上线', version: 'v1.0', domain: 'general', calls: 8543, errorRate: '0.1%' },
  { id: 'skill_sentiment', name: '情感倾向分析', desc: '识别文本中的正负向情感及强度', type: '社区生态', status: '已上线', version: 'v2.1', domain: 'marketing', calls: 28910, errorRate: '0.3%' },
  { id: 'skill_code_review', name: '代码质量审查', desc: '静态代码分析与安全漏洞扫描', type: '私有知识区', status: '部署中', version: 'v0.9', domain: 'rd', calls: 0, errorRate: '-' },
  { id: 'skill_ip_location', name: 'IP 地址归属地查询', desc: '查询 IP 对应的地理位置与运营商', type: '官方认证', status: '已下线', version: 'v1.0', domain: 'general', calls: 4521, errorRate: '0.2%' },
])

const workflows = ref([
  { id: 'wf_hr_exit', title: '员工离职面谈流', type: '编排流', domain: 'general', status: '已上线', updated: '2026-04-30', author: '张三' },
  { id: 'wf_invoice_verify', title: '发票自动核验流水线', type: '编排流', domain: 'finance', status: '已上线', updated: '2026-04-28', author: '李四' },
  { id: 'wf_customer_analysis', title: '客户情感与满意度分析', type: '编排流', domain: 'marketing', status: '已上线', updated: '2026-04-25', author: '王五' },
  { id: 'wf_content_review', title: '内容安全合规审核流', type: '编排流', domain: 'general', status: '部署中', updated: '2026-04-20', author: '赵六' },
])

const handleDebugExecute = () => {
  debugResult.value = null
  setTimeout(() => {
    debugResult.value = JSON.stringify({
      'status': 'success',
      'data': { 'output': `Skill ${debugSkill.value?.name} execution trace completed.` },
      'audit': { 'execution_time_ms': 312, 'log_id': 'audit_sl_123' }
    }, null, 2)
  }, 600)
}

const handleStatusChange = (id: string, newStatus: string) => {
  skills.value = skills.value.map(s => s.id === id ? { ...s, status: newStatus } : s)
  openMenuId.value = null
}

const filteredSkills = computed(() => {
  return skills.value.filter(s => {
    if (skillFilterType.value !== 'all' && s.type !== skillFilterType.value) return false
    if (currentDomain.value !== 'all' && !isDomainMatch(s.domain, currentDomain.value)) return false
    if (skillSearchTerm.value && !s.name.toLowerCase().includes(skillSearchTerm.value.toLowerCase()) && !s.desc.toLowerCase().includes(skillSearchTerm.value.toLowerCase()) && !s.id.toLowerCase().includes(skillSearchTerm.value.toLowerCase())) return false
    return true
  })
})

const filteredWorkflows = computed(() => {
  return workflows.value.filter(w => {
    if (currentDomain.value !== 'all' && !isDomainMatch(w.domain, currentDomain.value)) return false
    if (workflowSearchTerm.value && !w.title.toLowerCase().includes(workflowSearchTerm.value.toLowerCase()) && !w.author.toLowerCase().includes(workflowSearchTerm.value.toLowerCase())) return false
    return true
  })
})
</script>

<template>
  <div class="h-full flex flex-col space-y-6">
    <!-- Web 调试弹窗 -->
    <Dialog :open="!!debugSkill" @update:open="(open: boolean) => { if (!open) { debugSkill = null; debugResult = null } }">
      <DialogContent :title="`Web 调试 & API 规范: ${debugSkill?.name}`" class="max-w-4xl">
        <div class="space-y-4">
          <div class="flex bg-slate-50 border border-slate-200 rounded-md p-3 items-center justify-between">
            <code class="text-[13px] text-slate-700 font-mono">
              <span class="text-emerald-600 font-bold mr-2">POST</span> 
              /v1/capabilities/{{ debugSkill?.id }}/run
            </code>
            <span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded">统一 Capability 执行端点</span>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col space-y-3">
              <div>
                <label class="text-xs font-semibold text-slate-700 block mb-1">Authorization Token</label>
                <Input class="h-8 text-xs font-mono" placeholder="Bearer sk-..." />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-700 block mb-1">Payload Variables (JSON)</label>
                <textarea 
                  class="w-full h-48 bg-slate-900 text-emerald-400 p-3 rounded-md font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0 resize-none"
                >{{ "{\n  \"input\": \"...\",\n  \"stream\": false\n}" }}</textarea>
              </div>
              <Button class="w-full bg-slate-800 hover:bg-slate-900 h-9" @click="handleDebugExecute">
                <Play class="w-4 h-4 mr-2" /> 发送请求并监听 Trace
              </Button>
            </div>
            <div class="flex flex-col space-y-2">
              <label class="text-xs font-semibold text-slate-700">Execution Response Object</label>
              <div class="w-full h-[288px] bg-slate-50 text-slate-500 overflow-y-auto rounded-md font-mono text-[11px] border border-slate-200 relative">
                <pre v-if="debugResult" class="p-4 text-emerald-600 leading-relaxed">{{ debugResult }}</pre>
                <div v-else class="absolute inset-0 flex items-center justify-center">等待执行返回结果...</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-semibold text-slate-800">能力仓 (Capabilities)</h1>
          <button 
            @click="showSkillHelp = !showSkillHelp"
            :class="['p-1 rounded-full transition-colors', showSkillHelp ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100']"
            title="查看关于 Agent Skills 智能体能力包的说明"
          >
            <HelpCircle class="w-4 h-4" />
          </button>
        </div>
        <p class="text-sm text-slate-500 mt-1">
          {{ activeTab === 'skill' ? '导入基于 Anthropic 标准的 Agent 能力包，为大模型注入垂直领域的专业背景与工具链。' : '集成模型与工具，通过低代码工作流编排复杂业务场景。' }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <template v-if="activeTab === 'skill'">
          <router-link to="/capabilities/skills/new">
            <Button class="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus class="mr-2 h-4 w-4" />
              导入 Agent Skills
            </Button>
          </router-link>
        </template>
        <template v-else>
          <Button variant="outline" class="text-slate-600 bg-white">
            <Component class="mr-2 h-4 w-4" />
            接入 MCP
          </Button>
          <router-link to="/capabilities/new">
            <Button class="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus class="mr-2 h-4 w-4" />
              新建编排流水线
            </Button>
          </router-link>
        </template>
      </div>
    </div>

    <div class="flex flex-1 gap-6 min-h-0">
      <div class="hidden lg:block w-56 shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <DomainSidebar 
          v-model="currentDomain"
          class="h-full border-none bg-white font-medium" 
        />
      </div>

      <div class="flex-1 flex flex-col space-y-4 overflow-hidden">
        <div class="flex border-b border-slate-200">
          <button 
            class="px-6 py-3 font-medium text-sm transition-colors relative"
            :class="activeTab === 'skill' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'"
            @click="activeTab = 'skill'"
          >
            Agent Skills
            <div v-if="activeTab === 'skill'" class="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 rounded-t-md"></div>
          </button>
          <button 
            class="px-6 py-3 font-medium text-sm transition-colors relative"
            :class="activeTab === 'workflow' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'"
            @click="activeTab = 'workflow'"
          >
            AI 工作流编排
            <div v-if="activeTab === 'workflow'" class="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-600 rounded-t-md"></div>
          </button>
        </div>

        <!-- AI 工作流编排 Tab -->
        <div v-if="activeTab === 'workflow'" class="flex flex-col space-y-4 overflow-y-auto pb-4">
          <div class="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
            <div class="relative flex-1 min-w-[200px]">
              <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                v-model="workflowSearchTerm"
                placeholder="搜索工作流名称或作者..." 
                class="pl-9 h-9 text-sm bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card v-for="cap in filteredWorkflows" :key="cap.id" class="flex flex-col border border-slate-200 hover:border-emerald-300 transition-colors">
              <div class="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div class="flex items-center gap-3">
                  <div class="bg-white p-2 border border-slate-200 rounded-md text-emerald-600 shadow-sm">
                    <Layers class="h-5 w-5" />
                  </div>
                  <div>
                    <h3 class="font-medium text-slate-800 text-sm truncate max-w-[200px]" :title="cap.title">{{ cap.title }}</h3>
                    <div class="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                        {{ getDomainLabel(cap.domain) }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 mt-0.5">{{ cap.type }}</p>
                  </div>
                </div>
                <button class="text-slate-400 hover:text-slate-600">
                  <MoreVertical class="h-4 w-4" />
                </button>
              </div>
              
              <div class="p-5 flex-1 relative overflow-hidden bg-dot-pattern">
                <div class="flex items-center justify-center h-24 text-slate-300">
                  <div class="flex items-center gap-2">
                    <span class="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center text-[10px] text-slate-500 font-mono shadow-sm">IN</span>
                    <div class="w-6 h-[1px] bg-slate-300" />
                    <span class="w-8 h-8 rounded border border-emerald-200 bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] shadow-sm">LLM</span>
                    <div class="w-6 h-[1px] bg-slate-300" />
                    <span class="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center text-[10px] text-slate-500 font-mono shadow-sm">OUT</span>
                  </div>
                </div>
              </div>

              <div class="p-4 border-t border-slate-100 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span :class="['px-1.5 py-0.5 rounded text-[10px] font-medium', cap.status === '已上线' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500']">{{ cap.status }}</span>
                  <span class="text-xs text-slate-500 pl-1">{{ cap.updated }} · {{ cap.author }}</span>
                </div>
                <router-link to="/capabilities/new">
                  <Button variant="ghost" size="sm" class="text-emerald-600 hover:bg-emerald-50 h-8 font-medium px-3 text-xs">编排 / 调试</Button>
                </router-link>
              </div>
            </Card>
          </div>
        </div>

        <!-- Agent Skills Tab -->
        <div v-if="activeTab === 'skill'" class="flex flex-col space-y-6 overflow-y-auto pb-4" ref="menuRef">
          <!-- 帮助提示 -->
          <div v-if="showSkillHelp" class="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-4 relative animate-in fade-in slide-in-from-top-2 duration-200">
            <div class="bg-white p-2.5 rounded-xl shadow-sm border border-indigo-100 shrink-0">
              <FileJson class="w-6 h-6 text-indigo-600" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-semibold text-indigo-900">关于 Agent Skills (智能体能力包)</h3>
              <p class="text-[13px] text-indigo-700 mt-1.5 leading-relaxed opacity-90 max-w-4xl">
                Agent Skills 是基于 Anthropic 标准规范构建的可复用 AI 能力包，犹如 AI 时代的 "Dockerfile"。<br/>
                每个 Skill 采用标准化的文件结构打包，包含核心的 <span class="bg-white px-1 rounded font-mono text-[11px] shadow-sm">SKILL.md</span> 元数据定义、领域专属 Prompt 模板以及所依赖的执行脚本。通过集成本中台，您可以一键为大模型插上垂直领域的"专业能力"，支持版本历史与团队间隔离共享。
              </p>
            </div>
            <button 
              @click="showSkillHelp = false"
              class="text-indigo-400 hover:text-indigo-600 font-medium text-xs hover:bg-indigo-100/55 p-1 rounded-full absolute right-2 top-2"
              title="隐藏提示"
            >
              ✕
            </button>
          </div>

          <!-- 筛选器 -->
          <div class="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
            <div class="relative flex-1 min-w-[200px]">
              <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                v-model="skillSearchTerm"
                placeholder="搜索能力包名称、ID 或描述..." 
                class="pl-9 h-9 text-sm bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-500"
              />
            </div>
            
            <div class="flex flex-wrap items-center gap-6 w-full lg:w-auto">
              <div class="flex items-center gap-2">
                <label class="text-xs text-slate-500 whitespace-nowrap">Agent Skill 来源:</label>
                <div class="flex bg-white rounded-md border border-slate-200 p-0.5 shadow-sm">
                  <button
                    v-for="type in [{ id: 'all', label: '全部' }, { id: '官方认证', label: '官方认证' }, { id: '私有知识区', label: '私有知识区' }, { id: '社区生态', label: '社区生态' }]"
                    :key="type.id"
                    @click="skillFilterType = type.id"
                    :class="['px-3 py-1.5 text-[11px] rounded transition-all duration-200', skillFilterType === type.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50']"
                  >
                    {{ type.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 技能表格 -->
          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-4 font-medium">Agent Skill 档案包</th>
                  <th class="px-6 py-4 font-medium text-center">状态 / 版本</th>
                  <th class="px-6 py-4 font-medium">挂载指标</th>
                  <th class="px-6 py-4 font-medium text-right">操作管理</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="skill in filteredSkills" :key="skill.id" class="hover:bg-slate-50/70 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex flex-col">
                      <span class="font-semibold text-slate-800 flex items-center gap-2 text-[14px]">
                        <FileJson class="w-4 h-4 text-indigo-500" /> {{ skill.name }}
                      </span>
                      <span class="text-xs text-slate-500 mt-1.5 max-w-sm truncate" :title="skill.desc">{{ skill.desc }}</span>
                      <div class="flex items-center gap-2 mt-2">
                        <span class="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">pkg://{{ skill.id }}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-medium border bg-blue-50 text-blue-600 border-blue-100">
                          {{ getDomainLabel(skill.domain) }}
                        </span>
                        <span :class="['px-2 py-0.5 rounded text-[10px] font-medium border', 
                          skill.type === '官方认证' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          skill.type === '私有知识区' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        ]">{{ skill.type }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span :class="['px-2 py-0.5 rounded text-xs font-medium', 
                      skill.status === '已上线' ? 'bg-emerald-50 text-emerald-700' :
                      skill.status === '部署中' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    ]">{{ skill.status }}</span>
                    <span class="block text-xs text-slate-400 mt-1 font-mono">{{ skill.version }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-4 text-xs">
                      <span class="text-slate-500">
                        调用 <span class="font-semibold text-slate-700">{{ skill.calls.toLocaleString() }}</span> 次
                      </span>
                      <span class="text-slate-400">|</span>
                      <span :class="['font-medium', skill.errorRate === '-' ? 'text-slate-400' : parseFloat(skill.errorRate) > 1 ? 'text-rose-600' : 'text-emerald-600']">
                        错误率 {{ skill.errorRate }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button 
                        @click="debugSkill = skill"
                        class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="调试"
                      >
                        <Activity class="w-4 h-4" />
                      </button>
                      <button 
                        class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="权限配置"
                      >
                        <ShieldCheck class="w-4 h-4" />
                      </button>
                      <button 
                        class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        @click="openMenuId = openMenuId === skill.id ? null : skill.id"
                      >
                        <MoreHorizontal class="w-4 h-4" />
                      </button>
                      
                      <div v-if="openMenuId === skill.id" class="absolute right-0 mr-4 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                        <button 
                          v-if="skill.status !== '已上线'"
                          @click="handleStatusChange(skill.id, '已上线')"
                          class="w-full px-3 py-2 text-xs text-left hover:bg-slate-50 flex items-center gap-2 text-emerald-600"
                        >
                          <Activity class="w-3.5 h-3.5" /> 上线
                        </button>
                        <button 
                          v-if="skill.status === '已上线'"
                          @click="handleStatusChange(skill.id, '已下线')"
                          class="w-full px-3 py-2 text-xs text-left hover:bg-slate-50 flex items-center gap-2 text-amber-600"
                        >
                          <Lock class="w-3.5 h-3.5" /> 下线
                        </button>
                        <button 
                          class="w-full px-3 py-2 text-xs text-left hover:bg-slate-50 flex items-center gap-2 text-rose-600"
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
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-dot-pattern {
  background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px);
  background-size: 16px 16px;
}
</style>
