<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Bot, Library, BrainCircuit, Activity, Database, Blocks } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'

const router = useRouter()

const quickLinks = [
  { name: '新建智能体', icon: Bot, path: '/agents', color: 'bg-blue-50 text-blue-600' },
  { name: '上传知识库', icon: Library, path: '/kb', color: 'bg-emerald-50 text-emerald-600' },
  { name: '编排工作流', icon: Activity, path: '/capabilities', color: 'bg-indigo-50 text-indigo-600' },
  { name: '接入新模型', icon: BrainCircuit, path: '/models', color: 'bg-purple-50 text-purple-600' },
  { name: '连接数据源', icon: Database, path: '/data/access', color: 'bg-amber-50 text-amber-600' },
  { name: '安装业务套件', icon: Blocks, path: '/suites', color: 'bg-rose-50 text-rose-600' },
]

const systemLogs = [
  { msg: '用户 李四 发布了新智能体 [行政巡检助理]', time: '10分钟前', type: 'bot' },
  { msg: '系统自动告警: 离线机器人数目达到阈值', time: '1小时前', type: 'alert' },
  { msg: '管理员 注册了新视觉大模型 DALL-E 3', time: '3小时前', type: 'system' },
  { msg: '数据同步任务 [客户画像表] 失败，重试中...', time: '昨天', type: 'data' },
]

const resourceDistribution = [
  { label: '模型仓 (Models)', count: 14, width: '60%', color: 'bg-blue-500' },
  { label: '工具仓 (Tools/API)', count: 45, width: '85%', color: 'bg-indigo-400' },
  { label: '能力仓 (Skills/Workflows)', count: 22, width: '45%', color: 'bg-emerald-500' },
  { label: '知识库 (Knowledge Base)', count: 8, width: '30%', color: 'bg-amber-400' },
]

const domainDistribution = [
  { label: '基础类 / 通用底座', count: 42, color: 'bg-slate-700' },
  { label: '基础类 / 数据处理', count: 18, color: 'bg-slate-600' },
  { label: '基础类 / 研发支撑', count: 25, color: 'bg-slate-500' },
  { label: '业务类 / HR领域', count: 12, color: 'bg-blue-600' },
  { label: '业务类 / 营销领域', count: 35, color: 'bg-indigo-600' },
  { label: '业务类 / 财务领域', count: 8, color: 'bg-emerald-600' },
]

const getDomainWidth = (count: number) => {
  return `${(count / 42) * 100}%`
}
</script>

<template>
  <my-page>
    <div class="h-full flex flex-col space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-800 tracking-tight">AI 智能体中台概览</h1>
      </div>
  
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card class="p-6 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
          <h3 class="text-blue-600 font-medium mb-1">今日模型调用 (Token)</h3>
          <div class="text-4xl font-bold text-blue-900 mb-4">12,450,000</div>
          <div class="flex justify-between text-sm text-blue-500">
            <span>Deepseek R1: 8M</span>
            <span>Gemini: 4.45M</span>
          </div>
        </Card>
        <Card class="p-6 border-slate-200 shadow-sm flex flex-col justify-center">
          <h3 class="text-slate-500 font-medium mb-1">活跃智能体数</h3>
          <div class="text-4xl font-bold text-slate-800 mb-2">42 <span class="text-sm font-normal text-slate-400">/ 120 已注册</span></div>
          <div class="text-sm text-emerald-600 font-medium">+5 今日新增</div>
        </Card>
        <Card class="p-6 border-slate-200 shadow-sm flex flex-col justify-center">
          <h3 class="text-slate-500 font-medium mb-1">底层服务健康度</h3>
          <div class="text-4xl font-bold text-emerald-500 mb-2">99.9%</div>
          <div class="text-sm text-slate-500">所有 4 大能力仓正常运行中</div>
        </Card>
      </div>
  
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div class="lg:col-span-2 space-y-6">
          <h2 class="text-lg font-semibold text-slate-800">快捷入口</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div
              v-for="(link, i) in quickLinks"
              :key="i"
              @click="router.push(link.path)"
              class="cursor-pointer"
            >
              <Card class="p-4 flex items-center gap-4 hover:border-blue-300 transition-colors group">
                <div :class="[`p-3 rounded-xl ${link.color}`, 'group-hover:scale-110 transition-transform']">
                  <component :is="link.icon" class="w-6 h-6" />
                </div>
                <span class="font-medium text-slate-800 group-hover:text-blue-600">{{ link.name }}</span>
              </Card>
            </div>
          </div>
  
          <h2 class="text-lg font-semibold text-slate-800 mt-8 mb-4">近期系统活动</h2>
          <Card class="p-0 overflow-hidden border-slate-200">
            <div class="divide-y divide-slate-100">
              <div
                v-for="(log, i) in systemLogs"
                :key="i"
                class="p-4 flex items-center justify-between hover:bg-slate-50"
              >
                <span class="text-sm text-slate-700">{{ log.msg }}</span>
                <span class="text-xs text-slate-400">{{ log.time }}</span>
              </div>
            </div>
          </Card>
        </div>
  
        <div>
          <Card class="p-6 border-slate-200 h-full">
            <h2 class="text-lg font-semibold text-slate-800 mb-6">系统资源分布</h2>
            <div class="space-y-6">
              <div v-for="(resource, i) in resourceDistribution" :key="i">
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-slate-600 font-medium">{{ resource.label }}</span>
                  <span class="text-slate-400">{{ resource.count }} 个</span>
                </div>
                <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div :class="resource.color" :style="{ width: resource.width }" class="h-full"></div>
                </div>
              </div>
            </div>
  
            <h2 class="text-lg font-semibold text-slate-800 mt-10 mb-6">资产垂直领域分布 (按分类)</h2>
            <div class="space-y-4">
              <div
                v-for="(domain, i) in domainDistribution"
                :key="i"
                class="flex items-center text-sm"
              >
                <div class="w-1/3 truncate text-slate-600 pr-2" :title="domain.label">{{ domain.label }}</div>
                <div class="w-2/3 flex items-center">
                  <div class="h-4 bg-slate-100 rounded-full overflow-hidden flex-1 mr-3 relative">
                    <div
                      :class="domain.color"
                      :style="{ width: getDomainWidth(domain.count) }"
                      class="h-full absolute left-0 top-0 rounded-full"
                    ></div>
                  </div>
                  <span class="text-xs font-medium text-slate-500 w-8">{{ domain.count }}</span>
                </div>
              </div>
            </div>
  
            <div class="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 class="text-sm font-semibold text-blue-800 mb-2">中枢开放平台</h4>
              <p class="text-xs text-blue-600 mb-4 leading-relaxed">提供标准化的 OpenAPI 接口，供上层业务系统直接调用底层能力。</p>
              <Button variant="outline" class="w-full bg-white text-blue-700 border-blue-200">查看 API 文档</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </my-page>
</template>
