<template>
  <el-form v-bind="props" class="page-search-form" @validate="handleValidate">
    <div class="content-main">
      <slot name="main" />
    </div>
    <div class="content-right">
      <slot name="right" />
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { formEmits, formProps } from 'element-plus';

defineOptions({
  name: 'PageSearchForm'
});

const props = defineProps(formProps);
const emit = defineEmits(formEmits);

type FormValidateArgs = Parameters<typeof formEmits.validate>;

const handleValidate = (...args: FormValidateArgs) => {
  emit('validate', ...args);
};
</script>
<style lang="scss" scoped>
.page-search-form {
  display: flex;
  min-width: 0;
  margin-bottom: 0;
  flex-flow: row wrap;
  align-items: center;
  gap: 24px 40px;

  .content-main {
    display: flex;
    flex: 1 1 200px;
    flex-flow: row wrap;
    gap: 24px;
  }

  .content-right {
    display: flex;
    width: max-content;
    min-width: 0;
    max-width: 100%;
    flex: 0 1 max-content;
    flex-flow: row wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 24px;
    margin-left: auto;

    :deep(.el-form-item) {
      min-width: max-content;
      flex: 0 0 auto;
    }

    :deep(.el-form-item__content) {
      flex-wrap: nowrap;
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-input__wrapper) {
    height: 48px;
    border-radius: 999px;
  }
  :deep(.el-input__wrapper .el-input__inner) {
    padding: 0 6px;
  }
  :deep(.el-input__wrapper .el-input__suffix .el-input__suffix-inner) {
    font-size: 1.2em;
  }
}
</style>
