<template>
  <div class="my-page default-bg">
    <div class="my-page-top"></div>
    <div class="my-page-content">
      <slot></slot>
    </div>
    <div class="my-page-bottom"></div>
  </div>
</template>

<style scoped lang="scss">
.my-page {
  $size: 40px;

  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .my-page-top {
    height: $size;
    flex: 0 0 $size;
  }

  .my-page-content {
    // height: calc(100% - $size*2);
    flex: 1 1 auto;
    padding: 0 $size;
    overflow: hidden;
    min-height: 0;
  }

  .my-page-bottom {
    height: $size;
    flex: 0 0 $size;
  }
}
</style>