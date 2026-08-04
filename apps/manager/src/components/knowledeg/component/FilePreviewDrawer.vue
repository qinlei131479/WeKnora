<template>
  <el-drawer
    title="文件预览"
    :model-value="props.modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    size="76%"
    class="file-preview-drawer-grjer3fhsu52"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <LibFileManageRight :selected-doc="props.selectedDoc" />
  </el-drawer>
</template>
<script setup name="FilePreviewDrawer">
import LibFileManageRight from "./LibFileManageRight.vue";

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedDoc: {
    type: Object,
    default: () => null
  }
})
const close = () => {
  emit('update:modelValue', false)
}

</script>
<style lang="scss">
.file-preview-drawer-grjer3fhsu52 {
  .el-drawer__body {
    padding: 0 20px 20px;
  }
}
</style>
<style scoped lang="scss">
</style>
