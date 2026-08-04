<script setup lang="ts">
// import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown, FolderTree, Check } from 'lucide-vue-next'

import type { CategoryVO } from '@/types'
import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'


// import { getDomains, getFlatDomains, type DomainCategory } from '@/lib/domain-store'

interface Props {
  modelValue: number|null
  placeholder?: string
  allowAll?: boolean
  rootDomainId?: number|null
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '选择业务分类',
  allowAll: false,
  rootDomainId: null,
  modelValue: null,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number|null): void
}>()

const domainService = DomainServiceFactory()

const isOpen = ref(false)
// const domains = ref<CategoryVO[]>([])
const dropdownRef = ref<HTMLElement | null>(null)

const displayValues = computed(() => {
  let rootLabel: string = ''
  // let domains: CategoryVO[] = []
  let rootDomainId: number|null = props.rootDomainId
  let showDatas: CategoryVO[] = []
  if (rootDomainId) {
    rootDomainId = Number(rootDomainId)
    const rootNode = domainService.dataMap[rootDomainId]
    if (rootNode) {
      rootLabel = rootNode.name || rootDomainId
      showDatas = rootNode.childrenList || []
    } else {
      rootDomainId = null
      showDatas = domainService.allData
    }
  } else {
    rootDomainId = null
    showDatas = domainService.allData
  }
  // console.log('rootLabel', rootLabel)
  console.log('showDatas', showDatas)
  return {
    rootLabel,
    showDatas,
  }
})

const currentLabel = computed(() => {
  const currentId = props.modelValue;
  if (currentId === allCategoryId) return allCategoryName
  const found = domainService.dataMap[currentId]
  if (found) return found.name || currentId
  return currentId
})

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

const handleSelect = (val: number|null) => {
  emit('update:modelValue', val)
  isOpen.value = false
  emit('change')
}

onMounted(() => {
  // let data = getDomains()
  // if (props.rootDomainId) {
  //   const rootNode = data.find((d) => d.id === props.rootDomainId)
  //   data = rootNode?.children || []
  // }
  // domains.value = data
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div class="relative" :class="props.class" ref="dropdownRef">
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="select-button flex items-center justify-between w-full bg-white border border-slate-300 rounded-md shadow-sm text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
    >
      <div class="flex items-center gap-2 truncate">
        <FolderTree class="w-4 h-4 text-indigo-500 shrink-0" />
        <span class="truncate text-slate-800 font-medium">{{ currentLabel }}</span>
      </div>
      <ChevronDown class="w-4 h-4 text-slate-400 shrink-0 ml-2 animate-pulse" />
    </button>

    <div
      v-if="isOpen"
      class="absolute z-50 w-72 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-96 overflow-y-auto"
    >
      <div
        v-if="props.allowAll"
        :class="[
          'flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50',
          props.modelValue === allCategoryId ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-750',
        ]"
        @click="handleSelect(allCategoryId)"
      >
        <span>全部业务</span>
        <Check v-if="props.modelValue === allCategoryId" class="w-4 h-4 text-indigo-600" />
      </div>

      <div v-for="domain in displayValues.showDatas" :key="domain.id" class="py-1 border-b border-slate-50 last:border-0">
        <div
          :class="[
            'flex items-center justify-between px-3 py-1.5 text-xs uppercase tracking-wide font-bold text-slate-400 cursor-pointer hover:bg-slate-50',
            props.modelValue === domain.id ? 'text-indigo-600 bg-indigo-50/10' : '',
          ]"
          @click="handleSelect(domain.id)"
        >
          <span>{{ domain.name }}</span>
          <Check v-if="props.modelValue === domain.id" class="w-4 h-4 text-indigo-600" />
        </div>

        <div v-if="domain.childrenList && domain.childrenList.length > 0" class="pl-3 border-l border-slate-100 ml-4 my-1 space-y-1">
          <div v-for="sub in domain.childrenList" :key="sub.id" class="space-y-0.5">
            <div
              :class="[
                'flex items-center justify-between px-3 py-1 text-sm font-medium cursor-pointer rounded-md hover:bg-indigo-50/50',
                props.modelValue === sub.id ? 'text-indigo-600 font-semibold bg-indigo-50/30' : 'text-slate-700',
              ]"
              @click="handleSelect(sub.id)"
            >
              <span class="truncate">{{ sub.name }}</span>
              <Check v-if="props.modelValue === sub.id" class="w-3.5 h-3.5 text-indigo-600" />
            </div>

            <div v-if="sub.childrenList && sub.childrenList.length > 0" class="pl-3 border-l border-slate-150 ml-4 my-0.5 space-y-0.5">
              <div
                v-for="subsub in sub.childrenList"
                :key="subsub.id"
                :class="[
                  'flex items-center justify-between px-3 py-1 text-xs cursor-pointer rounded hover:bg-indigo-50/40',
                  props.modelValue === subsub.id ? 'text-indigo-600 font-bold bg-indigo-50/40' : 'text-slate-500',
                ]"
                @click="handleSelect(subsub.id)"
              >
                <span class="truncate">{{ subsub.name }}</span>
                <Check v-if="props.modelValue === subsub.id" class="w-3 h-3 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.select-button {
  padding: 5px 12px;
  cursor: pointer;
}
</style>