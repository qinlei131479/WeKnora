<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, FileText, Database } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

// Mock data for search
const MOCK_KB_DATA = [
  { id: 1, title: '企业合规管理规范v2.0', type: '文档知识', content: '本规范旨在规定企业内部合规审批流程，包含产品设计、采购审批、合同签订等环节，所有产品研发需严格符合标准。' },
  { id: 2, title: 'FAQ_日常报销处理流程', type: 'FAQ知识', content: '问：关于产品研发部门的报销凭证？答：需提供发票及研发负责人签字的申请单...' },
  { id: 3, title: '员工入职指南2025', type: '文档知识', content: '欢迎入职！请阅读关于公司考勤、产品展示区域使用规则及福利待遇的详细内容。' },
]

const searchTerm = ref('')

const highlightedResults = computed(() => {
  if (!searchTerm.value) return []

  return MOCK_KB_DATA.filter(item =>
    item.content.includes(searchTerm.value) || item.title.includes(searchTerm.value)
  ).map(item => ({
    ...item,
    highlightedContent: highlight(item.content, searchTerm.value),
    highlightedTitle: highlight(item.title, searchTerm.value),
  }))
})

function highlight(text: string, query: string) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase()
      ? `<span class="bg-amber-200 text-amber-900 font-bold px-0.5 rounded">${part}</span>`
      : part
  ).join('')
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <h1 class="text-2xl font-black text-slate-800">知识库搜索</h1>

    <div class="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
      <Search class="w-5 h-5 text-slate-400 ml-2" />
      <Input
        placeholder="请输入关键词搜索文档知识或FAQ..."
        class="border-none shadow-none focus-visible:ring-0 font-medium"
        v-model="searchTerm"
      />
      <Button class="bg-indigo-600 hover:bg-indigo-700">搜索</Button>
    </div>

    <div class="space-y-4">
      <template v-if="searchTerm">
        <template v-if="highlightedResults.length > 0">
          <Card v-for="r in highlightedResults" :key="r.id" class="p-5 hover:border-indigo-200 transition-colors">
            <h3 class="font-bold text-slate-800 mb-1" v-html="r.highlightedTitle"></h3>
            <span class="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium inline-block mb-3">
              {{ r.type }}
            </span>
            <p class="text-sm text-slate-600 leading-relaxed text-left" v-html="r.highlightedContent"></p>
          </Card>
        </template>
        <div v-else class="text-center py-10 text-slate-500">未找到相关匹配结果</div>
      </template>
      <div v-else class="text-center py-10 text-slate-400">请输入关键词进行检索</div>
    </div>
  </div>
</template>