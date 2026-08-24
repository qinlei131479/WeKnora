<template>
  <el-dialog
    v-model="state.visible"
    v-bind="$attrs"
    :close-on-click-modal="props.closeOnClickModal"
    :class="className"
    modal-class="kjsc-dialog-v2-blur"
    :close-on-press-escape="props.closeOnPressEscape"
  >
    <template #default>
      <slot> </slot>
    </template>
    <template #footer>
      <div>
        <slot name="prefixFooter" />
        <el-button v-if="props.showCloseBtn" @click="closeClick">
          {{ props.closeBtnText }}
        </el-button>
        <el-button v-if="props.showSubitBtn" :is-async="props.isAsync" type="primary" @click="submitClick">
          {{ props.subitBtnText }}
        </el-button>
        <slot name="suffixFooter" />
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { defineProps, defineEmits, computed, useAttrs, reactive, watchEffect } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  showCloseBtn: {
    type: Boolean,
    default: true
  },
  showSubitBtn: {
    type: Boolean,
    default: true
  },
  subitBtnText: {
    type: String,
    default: '确定'
  },
  closeBtnText: {
    type: String,
    default: '取消'
  },
  customClass: {
    type: String,
    default: ''
  },
  closeOnClickModal: {
    type: Boolean,
    default: false
  },
  closeOnPressEscape: {
    type: Boolean,
    default: false
  },
  isAsync: {
    type: Boolean,
    default: true
  },
  onSubmitClick: Function
});

const emits = defineEmits(['update:modelValue']);

const className = computed(() => 'kjsc-dialog-v2' + (props.customClass ? ' ' + props.customClass : ''));
const attrs = useAttrs();

const state = reactive({
  visible: props.modelValue
});

const submitClick = async () => {
  if (props.onSubmitClick) {
    await props.onSubmitClick();
  }
  // emits('submitClick');
};
const closeClick = () => {
  const beforeClose = attrs['before-close'] || attrs.beforeClose;
  if (beforeClose) {
    beforeClose(() => {
      state.visible = false;
    });
  } else {
    state.visible = false;
  }
};

watchEffect(() => {
  state.visible = props.modelValue;
});

watchEffect(() => {
  emits('update:modelValue', state.visible);
});
</script>
<script>
export default {
  name: 'KjscDialogV2'
};
</script>

<style lang="less">
.kjsc-dialog-v2-blur {
  background-color: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.kjsc-dialog-v2 {
  .el-dialog__headerbtn {
    right: 2px;
    top: 0px;
    font-size: var(--el-message-close-size, 18px);

    .el-dialog__close {
      color: #666666;
    }
  }

  .el-dialog__header {
    text-align: left;
    font-weight: 0;
    font-size: 16px;
    color: #0c113d;
    margin-right: 0;
    padding: 16px 24px;
    border-bottom: 1px solid #ececec;
  }

  .el-dialog__footer {
    text-align: right;
    padding-left: 24px;
    padding-right: 24px;
    padding-bottom: 24px;
    padding-top: 32px;

    .link-box {
      margin-left: 40px;
    }

    .link-box:first-child {
      margin-left: 0px;
    }

    .el-button + .el-button {
      margin-left: 16px;
    }
  }

  .el-dialog__body {
    padding-left: 24px;
    padding-right: 24px;
    padding-top: 24px;
    padding-bottom: 0;
  }
}
</style>
<style scoped lang="less"></style>
