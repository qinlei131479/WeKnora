<template>
  <el-empty v-bind="$attrs">
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
  </el-empty>
</template>

<script setup lang="ts">
defineOptions({
  name: 'KjscEmpty',
  inheritAttrs: false
});
</script>
