<template>
  <el-drawer v-bind="attrs" :close-on-click-modal="false" destroy-on-close :show-close="false" @close="onDrawerClose">
    <template v-if="useTitle" #title>
      <slot name="title"> </slot>
    </template>

    <div :class="getContentClass()">
      <slot> </slot>
    </div>
    <div v-if="showFooter" class="footer">
      <slot name="prefixFooter"> </slot>
      <el-button v-if="showCloseBtn" @click="closeClick">{{ closeBtnText }}</el-button>

      <el-button v-if="showSubitBtn" type="primary" :loading="loading" @click="submitClick">{{
        subitBtnText
      }}</el-button>

      <slot name="suffixFooter"> </slot>
    </div>
    <transition mode="out-in">
      <div class="toggle-drawer-btn toggle-drawer-btn--collapse" @click="closeClick">
        <el-icon><caret-left /></el-icon>
      </div>
    </transition>
  </el-drawer>
  <!-- <teleport to="body"> -->

  <!-- </teleport> -->
</template>
<script>
import { computed, defineComponent, useSlots } from 'vue';
// import store from '@/store';
export default defineComponent({
  props: {
    showCloseBtn: {
      type: Boolean,
      default: true
    },
    showSubitBtn: {
      type: Boolean,
      default: false
    },
    subitBtnText: {
      type: String,
      default: '保存'
    },
    closeBtnText: {
      type: String,
      default: '取消'
    },
    submitLoading: {
      type: Boolean,
      default: false
    }
   },
  emits: ['submitClick', 'update:modelValue', 'close'],
  setup(props, context) {
    console.log('drawer', props, context);
    const attrs = { ...context.attrs };
    if (!attrs.size) {
      attrs.size = '50%';
    }
    if (attrs.customClass) {
      attrs.customClass += ' drawer-content-custom';
    } else {
      attrs.customClass = 'drawer-content-custom';
    }
    // const loading = computed(() => store.getters.requestLoading);
    const loading = computed(() => props.submitLoading);
    const submitClick = () => {
      context.emit('submitClick');
    };
    const closeClick = () => {
      context.emit('update:modelValue', false);
    };
    const useTitle = computed(() => {
      return !!useSlots().title;
    });
    const showFooter = computed(() => {
      return !!useSlots().prefixFooter || !!useSlots().suffixFooter || props.showSubitBtn || props.showCloseBtn;
    });
    const getContentClass = () => {
      return showFooter.value ? 'content' : 'content-without-footer';
    };
    const onDrawerClose = () => {
      context.emit('update:modelValue', false);
      context.emit('close');
    };
    return { loading, closeClick, submitClick, showFooter, getContentClass, useTitle, onDrawerClose, attrs };
  }
});
</script>

<style scoped lang="less">
.footer {
  margin-top: 20px;
  text-align: left;
}
.content-without-footer {
  overflow-y: auto;
  height: 100%;
}
.content {
  overflow-y: auto;
  height: calc(100% - 52px);
}
</style>

<style lang="less">
.el-drawer {
  overflow: visible;
}
.drawer-content-custom {
  .el-drawer__body {
    overflow: auto;
  }
  .el-drawer__header {
    margin-bottom: 0 !important;
  }
  .el-drawer__title {
    font-size: 20px;
    font-weight: bold;
  }
}
.toggle-drawer-btn {
  position: absolute;
  width: 24px;
  height: 60px;
  background: #1b46b9;
  border-radius: 8px 0px 0px 8px;
  color: #ffffff;
  top: calc(50% - 30px);
  left: -24px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: left 0.3s ease-in-out;
}

.toggle-drawer-btn--collapse {
  transition: left 0.3s ease-in-out;
}
.toggle-drawer-btn--collapse i {
  transform: rotate(180deg);
}
</style>
