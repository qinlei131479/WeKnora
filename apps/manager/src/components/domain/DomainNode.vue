<script setup lang="ts">
// import { ref } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import type { DomainCategory } from '@/lib/domain-store'

const props = defineProps<{
  node: DomainCategory
}>()

const emit = defineEmits<{
  addChild: [node: DomainCategory, label: string]
  delete: [id: string]
}>()

const isAdding = ref(false)
const newLabel = ref('')

const handleAddChild = () => {
  if (!newLabel.value.trim()) return
  emit('addChild', props.node, newLabel.value)
  newLabel.value = ''
  isAdding.value = false
}

const handleDelete = () => {
  emit('delete', props.node.id)
}
</script>

<template>
  <div class="border border-slate-100 rounded-md p-3 bg-white space-y-2">
    <div class="flex items-center justify-between text-xs font-semibold text-slate-800">
      <div class="flex items-center gap-2">
        {{ node.label }}
        <span v-if="node.isFixed" class="text-[9px] bg-indigo-50 text-indigo-700 px-1 rounded border border-indigo-100">系统预设</span>
      </div>
      <button v-if="!node.isFixed" @click="handleDelete" class="text-slate-400 hover:text-red-500">
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>

    <div class="pl-4 space-y-2 border-l border-slate-100">
      <DomainNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        @add-child="handleAddChild"
        @delete="(id: string) => emit('delete', id)"
      />
      
      <div class="flex items-center gap-1 pt-1">
        <template v-if="isAdding">
          <input 
            type="text" 
            v-model="newLabel"
            class="h-6 px-2 border border-slate-200 rounded text-xs flex-1"
            @keydown.enter="handleAddChild"
          />
          <button @click="handleAddChild" class="h-6 px-2 text-[10px] text-slate-600 hover:text-indigo-600">确定</button>
        </template>
        <template v-else>
          <button @click="isAdding = true" class="h-6 text-[10px] text-indigo-600 hover:text-indigo-700 flex items-center">
            <Plus class="w-3 h-3 mr-1" /> 添加子类目
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
