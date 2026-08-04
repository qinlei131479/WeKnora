<template>
  <el-steps :active="state.active" :align-center="state.center" process-status="process">
    <el-step v-for="(item, index) in state.items" :key="index" :title="item.title" :description="item.description">
      <template #icon>
        <template v-if="index < state.active">
          <el-icon><check /></el-icon>
        </template>
        <template v-if="index == state.active">
          <el-icon class="more-filled"><more-filled /></el-icon>
        </template>
      </template>
    </el-step>
  </el-steps>
</template>

<script setup>
import { reactive, defineProps, watchEffect } from 'vue';
const props = defineProps({
  center: {
    type: Boolean,
    default: false
  },
  active: {
    type: [String || Number],
    default: 0
  },
  item: {
    type: Array
  }
});

const state = reactive({
  center: false,
  active: 1,
  items: []
});

watchEffect(() => {
  state.center = props.center;
  state.active = props.active;
  state.items = props.item;
});
</script>

<script>
export default {
  name: 'KjscSteps'
};
</script>

<style lang="less" scoped>
/deep/ .el-step__title,
/deep/.el-step__description {
  color: var(--el-text-color-primary);
}

/deep/ .el-step__head.is-success {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
/deep/ .el-step__title.is-success {
  color: var(--el-color-primary);
}
/deep/ .el-step__description.is-success {
  color: var(--el-color-primary);
}

/deep/ .el-step__icon.is-icon {
  width: 24px;
  border-radius: 50%;
  border: 2px solid;
  border-color: inherit;
}

/deep/ .el-step__head.is-finish {
  .el-step__line {
    background-color: var(--el-color-primary);
  }
}

/deep/ .el-step__head.is-process {
  .el-step__icon.is-text {
    background-color: var(--el-color-primary);
    color: var(--el-bg-color-overlay);
    border: var(--el-color-primary);
  }
}
/deep/ .el-step__title.is-process,
/deep/.el-step__description.is-process {
  color: var(--el-color-primary);
}
</style>
