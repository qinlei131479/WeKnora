<template>
  <el-drawer
    v-model="visible"
    direction="rtl"
    :close-on-click-modal="false"
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
    showCancel?: boolean;
    cancelText?: string;
    showConfirm?: boolean;
    confirmText?: string;
    loading?: boolean;
  }>(),
  {
    modelValue: false,
    showCancel: true,
    cancelText: '取消',
    showConfirm: true,
    confirmText: '确定',
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

const syncLoading = () => {
  if (!props.loading || !visible.value) {
    closeLoading();
    return;
  }

  if (loadingInstance) return;

  const target = document.querySelector<HTMLElement>(`[data-kjsc-rtl-drawer-id="${drawerId}"]`);
  if (!target) return;

  loadingInstance = ElLoading.service({
    target,
    fullscreen: false
  });
};

const handleOpened = () => {
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

<style lang="scss" module>
.modal {
  background-color: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.header {
  margin-bottom: 20px;
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
