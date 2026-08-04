<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FolderTree } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import DomainNode from '@/components/domain/DomainNode.vue'
import { getDomains, saveDomains, isDomainInUse, type DomainCategory } from '@/lib/domain-store'

const domains = ref<DomainCategory[]>([])
const isSaved = ref(true)

onMounted(() => {
  domains.value = getDomains()
})

const handleSave = () => {
  saveDomains(domains.value)
  isSaved.value = true
}

const addChild = (node: DomainCategory, label: string) => {
  if (!label.trim()) return
  const newNode: DomainCategory = { 
    id: `new-${Date.now()}`, 
    label: label.trim(), 
    children: [] 
  }
  const updatedNode = { 
    ...node, 
    children: [...(node.children || []), newNode] 
  }
  updateDomainsRecursively(domains.value, updatedNode)
  isSaved.value = false
}

const updateDomainsRecursively = (nodes: DomainCategory[], updated: DomainCategory): void => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === updated.id) {
      nodes[i] = updated
      return
    }
    if (nodes[i].children) {
      updateDomainsRecursively(nodes[i].children!, updated)
    }
  }
}

const deleteNode = (targetId: string): boolean => {
  if (isDomainInUse(targetId)) {
    alert('该分类正在被使用，无法删除')
    return false
  }
  if (!confirm('确定要删除吗？')) return false
  
  const removeRecursively = (nodes: DomainCategory[]): DomainCategory[] => {
    return nodes.filter(n => {
      if (n.id === targetId) return false
      if (n.children) n.children = removeRecursively(n.children)
      return true
    })
  }
  domains.value = removeRecursively(domains.value)
  isSaved.value = false
  return true
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FolderTree class="w-5 h-5 text-indigo-600" />
          归属领域分类管理
        </h1>
        <p class="text-xs text-slate-500 mt-1">配置全局的业务领域和层级细分类目。</p>
      </div>
      <Button @click="handleSave" :disabled="isSaved" class="bg-indigo-600 hover:bg-indigo-700">
        统一保存
      </Button>
    </div>

    <Card class="p-6 border-slate-200 bg-white shadow-sm">
      <div class="space-y-2 max-w-3xl">
        <DomainNode
          v-for="domain in domains"
          :key="domain.id"
          :node="domain"
          @add-child="addChild"
          @delete="deleteNode"
        />
      </div>
    </Card>
  </div>
</template>
