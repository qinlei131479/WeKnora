<template>
  <div class="space-y-1">
    <div
      :style="{ paddingLeft: displayValues.indent + 'px' }"
      :class="['group flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-all', displayValues.isSelected ? 'bg-blue-50 text-blue-700 font-bold shadow-[inset_3px_0_0_0_rgba(37,99,235,1)]' : 'hover:bg-slate-50 text-slate-600']"
      @click.stop="handleClick"
    >
      <button
        v-if="displayValues.hasChildren"
        @click.stop="handleExpandClick"
        class="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ChevronDown v-if="displayValues.expanded" class="w-3.5 h-3.5" />
        <ChevronRight v-else class="w-3.5 h-3.5" />
      </button>
      <span v-else class="w-4 h-4" />

      <FolderTree :class="['w-3.5 h-3.5', displayValues.isSelected ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500']" />
      <span class="truncate flex-1">{{ displayValues.label }}</span>

      <span v-if="displayValues.count > 0" :class="['text-[10px] px-1.5 py-0.2 rounded-full font-medium', displayValues.isSelected ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200']">
        {{ displayValues.count }}
      </span>
    </div>

    <div v-if="displayValues.showChildren" class="space-y-0.5 relative before:absolute before:left-[14px] before:top-1 before:bottom-1 before:w-[1px] before:bg-slate-100">
      <template v-for="child in displayValues.children" :key="child[displayValues.propsConfigKey]">
        <DomainItem
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
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  FolderTree, ChevronRight, ChevronDown, Eye, EyeOff,
  Building, Briefcase, Users, ShieldAlert, HelpCircle, Layers
} from 'lucide-vue-next'
import DomainItem from './DomainItem.vue'
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
