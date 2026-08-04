<template>
  <el-dialog
    v-model="state.visible"
    v-bind="$attrs"
    :close-on-click-modal="props.closeOnClickModal"
    :custom-class="className"
    :close-on-press-escape="props.closeOnPressEscape"
  >
    <template #default>
      <slot> </slot>
    </template>
    <template #footer>
      <div>
        <slot name="prefixFooter"> </slot>
        <kjsc-button v-if="props.showCloseBtn" @click="closeClick">
          {{ props.closeBtnText }}
        </kjsc-button>
        <kjsc-button v-if="props.showSubitBtn" :is-async="props.isAsync" type="primary" @click="submitClick">
          {{ props.subitBtnText }}
        </kjsc-button>
        <slot name="suffixFooter"> </slot>
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
    default: '保存'
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

const className = computed(() => 'kjsc-dialog' + (props.customClass ? ' ' + props.customClass : ''));
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
  name: 'KjscDialog'
};
</script>

<style lang="less">
.kjsc-dialog {
  .el-dialog__headerbtn {
    right: -55px;
    top: -15px;
    font-size: var(--el-message-close-size, 18px);

    .el-dialog__close {
      color: #fff;
    }
  }

  .el-dialog__header {
    text-align: center;
    font-size: 18px;
    color: #404144;
    margin-right: 0;
    padding: 18px 20px;
    border-bottom: 1px solid #ececec;
  }

  .el-dialog__footer {
    text-align: right;
    padding-left: 40px;
    padding-right: 40px;
    padding-bottom: 30px;

    .link-box {
      margin-left: 40px;
    }

    .link-box:first-child {
      margin-left: 0px;
    }

    .el-button + .el-button {
      margin-left: 40px;
    }
  }

  .el-dialog__body {
    padding-left: 40px;
    padding-right: 40px;
    padding-bottom: 0;
  }
}
</style>
<style scoped lang="less"></style>
