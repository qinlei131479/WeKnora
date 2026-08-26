<template>
  <el-drawer
    v-model="visible"
    v-bind="$attrs"
    direction="rtl"
    :title="props.title"
    :close-on-click-modal="false"
    :show-close="true"
    :data-kjsc-drawer-id="drawerId"
    @open="handleOpen"
    @opened="handleOpened"
    @close="handleClose"
    @closed="handleClosed"
    @open-auto-focus="handleOpenAutoFocus"
    @close-auto-focus="handleCloseAutoFocus"
    @resize-start="handleResizeStart"
    @resize="handleResize"
    @resize-end="handleResizeEnd"
  >
    <template v-if="$slots.header" #header="headerProps">
      <slot name="header" v-bind="headerProps" />
    </template>

    <slot />

    <template v-if="$slots.footer || props.showCancel || props.showConfirm" #footer>
      <slot name="footer">
        <el-button v-if="props.showCancel" @click="handleCancel">
          {{ props.cancelText }}
        </el-button>
        <el-button v-if="props.showConfirm" type="primary" @click="handleConfirm">
          {{ props.confirmText }}
        </el-button>
      </slot>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ElLoading } from 'element-plus';

defineOptions({
  name: 'KjscRtlDrawer',
  inheritAttrs: false
});

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    showCancel?: boolean;
    cancelText?: string;
    showConfirm?: boolean;
    confirmText?: string;
    loading?: boolean;
  }>(),
  {
    modelValue: false,
    title: '',
    showCancel: true,
    cancelText: '取消',
    showConfirm: true,
    confirmText: '确定',
    loading: false
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'open'): void;
  (event: 'opened'): void;
  (event: 'close'): void;
  (event: 'closed'): void;
  (event: 'open-auto-focus'): void;
  (event: 'close-auto-focus'): void;
  (event: 'resize-start', mouseEvent: MouseEvent, size: number): void;
  (event: 'resize', mouseEvent: MouseEvent, size: number): void;
  (event: 'resize-end', mouseEvent: MouseEvent, size: number): void;
  (event: 'cancel'): void;
  (event: 'confirm'): void;
}>();

const drawerId = useId();
let loadingInstance: ReturnType<typeof ElLoading.service> | undefined;

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const closeLoading = () => {
  loadingInstance?.close();
  loadingInstance = undefined;
};

const syncLoading = () => {
  if (!props.loading || !visible.value) {
    closeLoading();
    return;
  }

  if (loadingInstance) return;

  const target = document.querySelector<HTMLElement>(`[data-kjsc-drawer-id="${drawerId}"]`);
  if (!target) return;

  loadingInstance = ElLoading.service({
    target,
    fullscreen: false
  });
};

const handleOpen = () => {
  emit('open');
};

const handleOpened = () => {
  emit('opened');
  syncLoading();
};

const handleClose = () => {
  emit('close');
};

const handleClosed = () => {
  closeLoading();
  emit('closed');
};

const handleOpenAutoFocus = () => {
  emit('open-auto-focus');
};

const handleCloseAutoFocus = () => {
  emit('close-auto-focus');
};

const handleResizeStart = (mouseEvent: MouseEvent, size: number) => {
  emit('resize-start', mouseEvent, size);
};

const handleResize = (mouseEvent: MouseEvent, size: number) => {
  emit('resize', mouseEvent, size);
};

const handleResizeEnd = (mouseEvent: MouseEvent, size: number) => {
  emit('resize-end', mouseEvent, size);
};

const handleCancel = () => {
  emit('cancel');
  visible.value = false;
};

const handleConfirm = () => {
  emit('confirm');
};

watch(
  [() => props.loading, visible],
  () => {
    nextTick(syncLoading);
  },
  { flush: 'post' }
);

onBeforeUnmount(closeLoading);
</script>
