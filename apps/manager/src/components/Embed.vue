<template>
  <div class="embed-container">
    <div class="embed-view" @click="toggleDrawer">💬</div>
    <el-drawer
      v-model="visible"
      direction="rtl"
      modal-class="embed-modal-sdf5s6f4ws6e"
      header-class="embed-modal-header"
      body-class="embed-modal-body"
      size="800"
      @open="handleOpen"
      @close="handleClose"
      append-to-body
      :z-index="9999"
    >
      <iframe class="embed-iframe" :src="src" frameborder="0"></iframe>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
const visible = ref(false);
const src = ref('');

const toggleDrawer = () => {
  visible.value = !visible.value;
};

const handleOpen = () => {
  src.value = 'http://192.168.180.238:9988/embed/896cea41-1bcb-428b-b81f-ef53108bbe58#token=em_zSrK9ikSb-wj4jEoNceOZev0TcIbnSKI6PK2Wru7rBk';
};

const handleClose = () => {
  src.value = 'about:blank';
};
</script>
<style scoped lang="scss">
.embed-container {
  position: fixed;
  z-index: 99;
  right: 10px;
  bottom: 10px;
}
.embed-view {
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #31fdb9;
  border-radius: 50px;
  cursor: pointer;
  font-size: 24px;
  user-select: none;
  &:hover {
    // background-color: #26a69a;
    background-color: #3feeb4;
    box-shadow: 0 0 10px 0px #26a69a;
  }
}
</style>
<style lang="scss">
.embed-modal-sdf5s6f4ws6e {
  .embed-modal-header {
    height: 0;
    margin: 0;
    padding: 0;
    display: block;
    .el-drawer__title {
      display: none;
    }
    .el-drawer__close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  }
  .embed-modal-body {
    padding: 0;
  }
  .embed-iframe {
    display: block;
    margin: 0;
    padding: 0;
    border: none;
    width: 100%;
    height: 100%;
  }
}
</style>
