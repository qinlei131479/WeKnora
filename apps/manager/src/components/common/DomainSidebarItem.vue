<template>
  <div class="space-y-1">
    <div
      :style="{ paddingLeft: displayValues.indent + 'px' }"
      :class="[
        'flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm font-semibold transition-colors',
        displayValues.isSelected
          ? 'bg-indigo-100/40 text-indigo-600' 
          : 'text-slate-900 hover:bg-slate-100'
      ]"
      @click.stop="handleClick"
    >
      <div class="flex items-center gap-1 flex-1 truncate min-w-[100px]">
        <button
          v-if="displayValues.hasChildren"
          @click="handleExpandClick"
          class="p-0.5 text-slate-400 hover:text-slate-600 rounded shrink-0"
        >
          <ChevronRight
            :class="['w-3.5 h-3.5 transition-transform', displayValues.expanded ? 'rotate-90' : '']"
          />
        </button>
        <el-tooltip :content="displayValues.label" placement="top">
          <span class="truncate">{{ displayValues.label }}</span>
        </el-tooltip>
      </div>
    </div>

    <div v-if="displayValues.showChildren" class="pr-1 mt-1 space-y-1 border-l border-slate-200">
      <div v-for="child in displayValues.children" :key="child[displayValues.propsConfigKey]" class="space-y-0.5">
        <DomainSidebarItem
          :baseIndent="props.baseIndent"
          :indent="props.indent"
          :level="props.level + 1"
          :data="child"
          :props="props.props"
          :expandedNodes="props.expandedNodes"
          :selectedKey="props.selectedKey"
          @expand="handleExpandChild"
          @click="handleClickChild"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  FolderTree, ChevronRight, ChevronDown, Eye, EyeOff,
  Building, Briefcase, Users, ShieldAlert, HelpCircle, Layers
} from 'lucide-vue-next'
import DomainSidebarItem from './DomainSidebarItem.vue'
const defaultPropConfig = {
  key: 'id',
  label: 'label',
  children: 'children',
  count: 'count',
}
const emit = defineEmits<{
  (e: 'update:modelValue', value: string|number): void,
}>()
const props = defineProps({
  baseIndent: {
    type: Number,
    default: 6
  },
  indent: {
    type: Number,
    default: 12
  },
  data: {
    type: Object,
    default: () => ({})
  },
  props: {
    type: Object,
    default: () => null
  },
  level: {
    type: Number,
    default: 0
  },
  expandedNodes: {
    type: Object,
    default: () => ({})
  },
  selectedKey: {
    type: [String, Number],
    default: ''
  },
});

const displayValues = computed(() => {
  const propsData = props;
  const data = propsData.data
  const propsConfig = propsData.props || defaultPropConfig
  const label = data[propsConfig.label] || ''
  const children: any[] = data[propsConfig.children];
  const hasChildren = children && children.length > 0
  const indent = propsData.baseIndent + propsData.level * propsData.indent
  const propsConfigKey = propsConfig.key
  const itemKey = data[propsConfigKey]
  const expanded = propsData.expandedNodes?.[itemKey] || false
  const isSelected = itemKey === propsData.selectedKey
  const count = data[propsConfig.count] || 0
  const showChildren = hasChildren && expanded
  return {
    indent,
    label,
    hasChildren,
    children,
    expanded,
    itemKey,
    isSelected,
    count,
    showChildren,
    propsConfigKey,
  }
})
const handleClick = () => {
  emit('click', {data: props.data})
}
const handleExpandClick = () => {
  emit('expand', {data: props.data})
}
const handleClickChild = (event: any) => {
  emit('click', event)
}
const handleExpandChild = (event: any) => {
  emit('expand', event)
}
</script>
<style scoped lang="scss">
</style>
