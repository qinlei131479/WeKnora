<template>
  <div ref="floatingRef" class="layout-floating" :style="{ top: `${floatingTop}px` }" @click="openFloatingDialog">
    <img src="@/assets/images/layout/layout-floating.webp" />
  </div>

  <el-dialog
    v-model="dialogVisible"
    class="layout-floating-dialog"
    modal-class="layout-floating-overlay"
    width="800px"
    :show-close="false"
    append-to-body
    @opened="focusFloatingDialog"
  >
    <iframe ref="floatingIframeRef" class="layout-floating-iframe" :src="floatingUrl" @load="focusFloatingDialog"></iframe>
  </el-dialog>
</template>

<script setup lang="ts">
import { useDraggable, useElementSize, useWindowSize } from '@vueuse/core';

const dialogVisible = ref(false);
const floatingIframeRef = ref<HTMLIFrameElement | null>(null);
const floatingUrl = import.meta.env.VITE_APP_LAYOUT_FLOATING?.trim() || 'about:blank';
let floatingStart = { x: 0, y: 0 };
let floatingMoved = false;
const { height } = useWindowSize();
const floatingRef = ref<HTMLDivElement | null>(null);
const { height: floatingHeight } = useElementSize(floatingRef, undefined, { box: 'border-box' });
const floatingMaxTop = computed(() => Math.max(0, height.value - floatingHeight.value));
const { y: floatingTop } = useDraggable(floatingRef, {
  axis: 'y',
  preventDefault: true,
  onStart: (_, event) => {
    floatingStart = { x: event.clientX, y: event.clientY };
    floatingMoved = false;
  },
  onMove: (_, event) => {
    if (Math.abs(event.clientX - floatingStart.x) > 4 || Math.abs(event.clientY - floatingStart.y) > 4) {
      floatingMoved = true;
    }
    clampFloatingTop();
  }
});

function openFloatingDialog(): void {
  if (!floatingMoved) {
    dialogVisible.value = true;
  }
}

function focusFloatingDialog(): void {
  if (!dialogVisible.value) return;
  // iframe 首次加载后可能取得焦点，将焦点设回对话框以接收 ESC。
  floatingIframeRef.value?.closest<HTMLElement>('.layout-floating-dialog')?.focus({ preventScroll: true });
}

function clampFloatingTop(): void {
  floatingTop.value = Math.min(Math.max(0, floatingTop.value), floatingMaxTop.value);
}

onMounted(() => {
  floatingTop.value = Math.max(0, floatingMaxTop.value - 50);
});

watch(floatingMaxTop, clampFloatingTop);
</script>

<style lang="scss" scoped>
.layout-floating {
  position: fixed;
  right: 0;
  touch-action: none;
  user-select: none;
  z-index: 10;

  img {
    cursor: pointer;
    height: 60px;
  }
}

.layout-floating-iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>

<style lang="scss">
.layout-floating-overlay {
  background-color: rgba(#000, 0.5) !important;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.el-dialog.layout-floating-dialog {
  position: fixed;
  top: 10px;
  right: 100px;
  left: auto;
  height: calc(100vh - 20px);
  margin: 0;
  padding: 0;
  overflow: hidden;

  &:not(.is-fullscreen) {
    margin-top: 0 !important;
  }

  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    height: 100%;
    padding: 0;
  }
}
</style>
