<template>
  <div class="table-flex">
    <slot></slot>
  </div>
</template>
<script>
export default {
  name: 'TableFlex'
};
</script>
<!-- scoped -->
<style lang="less">
.table-flex {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
  position: relative;
  .el-table {
    position: absolute;
  }
}
</style>
