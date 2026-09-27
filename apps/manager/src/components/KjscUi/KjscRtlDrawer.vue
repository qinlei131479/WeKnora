<script setup lang="ts">
import { ElLoading } from 'element-plus';

defineOptions({
  name: 'KjscRtlDrawer',
  inheritAttrs: false
});

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    showCancel?: boolean;
    cancelText?: string;
    showConfirm?: boolean;
    confirmText?: string;
    loading?: boolean;
  }>(),
  {
    modelValue: false,
    showCancel: true,
    showConfirm: true,
    loading: false
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'cancel'): void;
  (event: 'confirm'): void;
}>();

const drawerId = useId();
const attrs = useAttrs();
const slots = useSlots();
const styles = useCssModule();
let loadingInstance: ReturnType<typeof ElLoading.service> | undefined;

const bodyClass = computed(() => {
  return [
    styles.body,
    (!slots['header'] || attrs['with-header'] === false) && styles['body__no-header'],
    !slots['footer'] && styles['body__no-footer']
  ];
});

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const closeLoading = () => {
  loadingInstance?.close();
  loadingInstance = undefined;
};

const getDrawerElement = () => {
  return document.querySelector<HTMLElement>(`[data-kjsc-rtl-drawer-id="${drawerId}"]`);
};

const resetBodyScrollTop = () => {
  const body = getDrawerElement()?.querySelector<HTMLElement>('.el-drawer__body');
  if (body) body.scrollTop = 0;
};

const syncLoading = () => {
  if (!props.loading || !visible.value) {
    closeLoading();
    return;
  }

  if (loadingInstance) return;

  const target = getDrawerElement();
  if (!target) return;

  loadingInstance = ElLoading.service({
    target,
    fullscreen: false
  });
};

const handleOpened = () => {
  resetBodyScrollTop();
  syncLoading();
};

const handleClosed = () => {
  closeLoading();
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

<template>
  <el-drawer
    v-model="visible"
    direction="rtl"
    v-bind="$attrs"
    :modal-class="$style['modal']"
    :header-class="$style['header']"
    :body-class="bodyClass"
    :data-kjsc-rtl-drawer-id="drawerId"
    @opened="handleOpened"
    @closed="handleClosed"
  >
    <template v-if="$slots['header'] && $attrs['with-header'] !== false" #header="headerProps">
      <slot name="header" v-bind="headerProps" />
    </template>

    <slot />

    <template v-if="$slots['footer'] || props.showCancel || props.showConfirm" #footer>
      <slot name="footer">
        <el-button v-if="props.showCancel" @click="handleCancel">
          {{ props.cancelText ?? $t('page.normal.cancel', '取消') }}
        </el-button>
        <el-button v-if="props.showConfirm" type="primary" @click="handleConfirm">
          {{ props.confirmText ?? $t('component.kJSCCmpt.confirm', '确定') }}
        </el-button>
      </slot>
    </template>
  </el-drawer>
</template>

<style lang="scss" module>
.modal {
  background-color: rgba(#000, 0.5) !important;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.header {
  margin-bottom: 20px;
  font-size: 16px;

  :global(.el-drawer__title),
  :global(.el-text) {
    font-size: 16px;
  }

  // overflow: visible;
  // :global(.el-drawer__close-btn) {
  //   position: absolute;
  //   top: 0;
  //   left: -40px;
  //   padding: 10px;
  //   background-color: rgba(#fff, 0.5);
  //   border-width: 0;
  //   border-radius: var(--el-border-radius-base) 0 0 var(--el-border-radius-base);
  //   color: #f00;
  //   z-index: 1;
  // }
}

.body {
  padding: 0 20px;

  &__no-header {
    margin-top: 20px;
  }

  &__no-footer {
    margin-bottom: 20px;
  }
}
</style>
