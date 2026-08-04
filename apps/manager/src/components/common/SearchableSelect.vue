<script setup lang="ts">
// import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ChevronDown, Search, Check, X } from 'lucide-vue-next'

interface SelectOption {
  id: string
  label: string
  sublabel?: string
  icon?: any
}

const props = defineProps<{
  modelValue: string
  options: SelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  className?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const searchInfo = reactive({
  keyword: ''
});

const dropdownRef = ref<HTMLElement | null>(null)

const selectedOption = computed(() => {
  return props.options?.find((opt: SelectOption) => opt.id === props.modelValue)
})

const filteredOptions = computed(() => {
  const options = props.options || []
  const q = searchInfo.keyword?.toLowerCase().trim() || ''
  if (!q) return options
  return options.filter((opt: SelectOption) => {
    const label = opt.label && opt.label.toLowerCase() || '';
    const sublabel = opt.sublabel && opt.sublabel.toLowerCase() || '';
    const id = opt.id && String(opt.id).toLowerCase() || '';
    return (
      label.includes(q) ||
      (sublabel && sublabel.includes(q)) ||
      id.includes(q)
    )
  })
})

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

watch(isOpen, (newVal: boolean) => {
  if (!newVal) {
    searchInfo.keyword = ''
  }
})

const selectOption = (opt: SelectOption) => {
  emit('update:modelValue', opt.id)
  isOpen.value = false
}
</script>

<template>
  <div :class="['relative', className]" ref="dropdownRef">
    <button type="button" @click="isOpen = !isOpen"
      class="select-button flex items-center justify-between w-full h-10 px-3 bg-white border border-slate-200 rounded-lg shadow-sm text-xs font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 transition-colors">
      <span class="truncate flex items-center gap-1.5">
        <component v-if="selectedOption?.icon" :is="selectedOption.icon" class="w-3.5 h-3.5 text-slate-500" />
        {{ selectedOption ? selectedOption.label : placeholder || '请选择...' }}
        <span v-if="selectedOption?.sublabel" class="text-[10px] text-slate-400 font-normal">
          ({{ selectedOption.sublabel }})
        </span>
      </span>
      <ChevronDown class="w-4 h-4 text-slate-400 shrink-0 ml-2" />
    </button>

    <div v-if="isOpen"
      class="absolute right-0 z-50 w-full min-w-[260px] max-w-[320px] mt-1 bg-white border border-slate-250 rounded-lg shadow-lg overflow-hidden flex flex-col">
      <div class="p-2 border-b border-slate-150 flex items-center gap-1.5 bg-slate-50">
        <!-- <Search class="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        <input
          v-model="search2"
          :placeholder="searchPlaceholder || '输入关键字搜索...'"
          class="w-full bg-transparent border-0 outline-none p-0.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none"
        />
        <button v-if="search2" type="button" @click="search2 = ''" class="text-slate-400 hover:text-slate-600">
          <X class="w-3.5 h-3.5" />
        </button> -->
        <el-input v-model="searchInfo.keyword" :placeholder="searchPlaceholder || '输入关键字搜索...'" clearable>
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>
      <div class="max-h-60 overflow-y-auto py-1">
        <div v-if="filteredOptions.length === 0" class="px-3 py-4 text-center text-xs text-slate-400">
          无匹配结果
        </div>
        <div v-for="opt in filteredOptions" :key="opt.id" @click="selectOption(opt)" :class="[
          'content-row flex items-center justify-between px-3 py-2 cursor-pointer transition-colors text-xs hover:bg-slate-50',
          opt.id === modelValue ? 'checked text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
        ]">
          <div class="flex items-center gap-2 truncate">
            <component v-if="opt.icon" :is="opt.icon" class="w-3.5 h-3.5 text-slate-500" />
            <span class="truncate">{{ opt.label }}</span>
            <span v-if="opt.sublabel" class="text-[10px] text-slate-400 font-normal truncate">
              ({{ opt.sublabel }})
            </span>
          </div>
          <Check v-if="opt.id === modelValue" class="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.select-button {
  &:focus {
    box-shadow: 0 0 0 1px var(--el-color-primary);
  }
}

.content-row {
  &.checked {
    color: var(--el-color-primary);
  }
}
</style>
