<script setup lang="ts">
import { FolderTree, ChevronRight } from 'lucide-vue-next'
import DomainSidebarItem from './DomainSidebarItem.vue'

import type { CategoryVO } from '@/types'
import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'

interface Props {
  modelValue: number|null // 选中的分类ID，null表示全部分类
  rootDomainId?: number|null // 根分类ID，null表示全部分类
  rootLabel?: string // 根分类名称
  service?: any
}

const props = withDefaults(defineProps<Props>(), {
  // rootLabel: '全部分类',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number|null): void,
  (e: 'change', value: number|null): void,
}>()

const domainProps = {
  key: 'id',
  label: 'name',
  children: 'childrenList',
  count: 'count',
};
const domainService = props.service || DomainServiceFactory()

const expanded = ref<Record<number, boolean>>({})

const displayValues = computed(() => {
  let rootLabel: string = allCategoryName
  let rootDomainId: number|null = props.rootDomainId
  let showDatas: CategoryVO[] = []
  // console.log('displayValues')
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
  if (props.rootLabel) {
    rootLabel = props.rootLabel
  }

  const initialExpanded: Record<number, boolean> = {}
  showDatas.forEach((d) => {
    initialExpanded[d.id!] = true
    if (d.childrenList) {
      d.childrenList.forEach((sub) => {
        initialExpanded[sub.id!] = true
      })
    }
  })
  expanded.value = initialExpanded
  return {
    rootLabel,
    rootDomainId,
    domains: showDatas
  }
})

const handleDomainItemClick = (event: any) => {
  const data = event.data
  if (!data) return
  handleSelect(data.id)
}

const handleDomainItemExpand = (event: any) => {
  const data = event.data
  expanded.value[data.id] = !expanded.value[data.id]
}

const handleSelect = (id: number|null) => {
  emit('update:modelValue', id)
  const item = domainService.dataMap[id]
  emit('change', {item})
}

</script>
<script lang="ts">
export { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'
// export {
//   allCategoryName,
//   allCategoryId,
//   baseCategoryId,
//   businessCategoryId
// }
</script>
<template>
  <div class="flex flex-col bg-slate-50/50 border-r border-slate-200 h-full overflow-y-auto">
    <div class="p-4 border-b border-slate-200 pb-3 shrink-0">
      <h3 class="font-semibold text-slate-800 flex items-center gap-2">
        <FolderTree class="w-4 h-4 text-indigo-600" />
        {{ displayValues.rootLabel }}
      </h3>
    </div>
    <div class="p-3 flex-1 overflow-y-auto space-y-1">
      <div
        @click="handleSelect(displayValues.rootDomainId)"
        :class="[
          'flex items-center px-3 py-2 rounded-md cursor-pointer mb-2 text-sm transition-colors',
          (props.modelValue === allCategoryId || props.modelValue === displayValues.rootDomainId)
            ? 'bg-indigo-100/50 text-indigo-600 font-semibold'
            : 'text-slate-700 hover:bg-slate-100',
        ]"
      >
        全部
      </div>

      <div v-for="domain in displayValues.domains" :key="domain.id" class="mb-2">
        <DomainSidebarItem
          :data="domain"
          :props="domainProps"
          :expandedNodes="expanded"
          :selectedKey="props.modelValue"
          @click="handleDomainItemClick"
          @expand="handleDomainItemExpand"
        />
        <!-- <div
          @click="handleSelect(domain.id)"
          :class="[
            'flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm font-semibold transition-colors',
            props.modelValue === domain.id
              ? 'bg-indigo-100/40 text-indigo-600'
              : 'text-slate-900 hover:bg-slate-100',
          ]"
        >
          <div class="flex items-center gap-1 flex-1 truncate">
            <button
              @click="toggleExpand(domain.id, $event)"
              class="p-0.5 text-slate-400 hover:text-slate-600 rounded shrink-0"
            >
              <ChevronRight
                :class="['w-3.5 h-3.5 transition-transform', expanded[domain.id] ? 'rotate-90' : '']"
              />
            </button>
            <span class="truncate">{{ domain.name }}</span>
          </div>
        </div>

        <div
          v-if="expanded[domain.id] && domain.childrenList && domain.childrenList.length > 0"
          class="pl-3.5 pr-1 mt-1 space-y-1 border-l border-slate-200 ml-3.5"
        >
          <div v-for="sub in domain.childrenList" :key="sub.id" class="space-y-0.5">
            <div
              @click="handleSelect(sub.id)"
              :class="[
                'flex items-center justify-between px-2 py-1 rounded-md cursor-pointer text-[13px] font-medium transition-colors',
                props.modelValue === sub.id
                  ? 'bg-indigo-50/80 text-indigo-650'
                  : 'text-slate-700 hover:bg-slate-100',
              ]"
            >
              <div class="flex items-center gap-1 flex-1 truncate">
                <button
                  v-if="sub.childrenList && sub.childrenList.length > 0"
                  @click="toggleExpand(sub.id, $event)"
                  class="p-0.5 text-slate-400 hover:text-slate-650 rounded shrink-0"
                >
                  <ChevronRight
                    :class="['w-3 h-3 transition-transform', expanded[sub.id] ? 'rotate-90' : '']"
                  />
                </button>
                <span class="truncate">{{ sub.name }}</span>
              </div>
            </div>

            <div
              v-if="expanded[sub.id] && sub.childrenList && sub.childrenList.length > 0"
              class="pl-3 mt-0.5 space-y-0.5 border-l border-slate-150 ml-3"
            >
              <div
                v-for="subsub in sub.childrenList"
                :key="subsub.id"
                @click="handleSelect(subsub.id)"
                :class="[
                  'flex items-center px-2 py-1 rounded-md cursor-pointer text-xs transition-colors',
                  props.modelValue === subsub.id
                    ? 'bg-slate-100 text-indigo-600 font-semibold border-l-2 border-indigo-600 rounded-l-none'
                    : 'text-slate-655 hover:bg-slate-100',
                ]"
              >
                <span class="truncate">{{ subsub.name }}</span>
              </div>
            </div>
          </div>
        </div> -->
      </div>
    </div>
  </div>
</template>
