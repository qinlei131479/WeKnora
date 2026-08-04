<template>
  <div>
    <el-tooltip :content="content" :disabled="!isOverflow" v-bind="tootipAttrs">
      <div ref="contentRef" :class="ellipsisClass" @mouseenter="checkOverflow">
        <slot>{{ content }}</slot>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
// import { ref, computed } from 'vue'

const { proxy } = getCurrentInstance();

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  line: {
    // 1=单行，大于1=多行
    type: Number,
    default: 1
  },
  short: {
    type: Boolean,
    default: false
  },
  middle: {
    type: Boolean,
    default: false
  }
});
const tootipAttrs = computed(() => {
  const attrs = { ...proxy.$attrs };
  let popperClass = attrs.popperClass;
  if (!popperClass) {
    if (props.short) {
      popperClass = 'tooltip-short'
    } else if (props.middle) {
      popperClass = 'tooltip-middle'
    }
    if (popperClass) {
      attrs.popperClass = popperClass;
    }
  }
  return attrs
});
const contentRef = ref<HTMLElement | null>(null)
const isOverflow = ref(false)

const ellipsisClass = computed(() => {
  return props.line === 1 ? 'ellipsis-single' : 'ellipsis-multi'
})

const checkOverflow = () => {
  const el = contentRef.value
  if (!el) return
  if (props.line === 1) {
    isOverflow.value = el.scrollWidth > el.clientWidth
  } else {
    isOverflow.value = el.scrollHeight > el.clientHeight
  }
}
</script>

<style scoped>
.ellipsis-single {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ellipsis-multi {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: v-bind('props.line');
}
</style>