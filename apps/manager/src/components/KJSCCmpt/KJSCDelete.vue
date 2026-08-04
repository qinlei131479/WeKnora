<template>
  <el-dialog v-bind="$attrs" :close-on-click-modal="false">
    <template #default>
      <slot> </slot>
    </template>
    <template #footer>
      <div>
        <slot name="prefixFooter"> </slot>
        <el-button
          :loading="loading"
          v-if="showSubitBtn"
          @click="submitClick"
          type="danger"
          >{{ subitBtnText }}</el-button
        >
        <el-button v-if="showCloseBtn" @click="closeClick">{{
          closeBtnText
        }}</el-button>

        <slot name="suffixFooter"> </slot>
      </div>
    </template>
  </el-dialog>
</template>
<script>
import { computed, defineComponent} from "vue";
import store from '@/store';
export default defineComponent({
  props: {
    showCloseBtn: {
      type: Boolean,
      default: true,
    },
    showSubitBtn: {
      type: Boolean,
      default: true,
    },
    subitBtnText: {
      type: String,
      default: "删除",
    },
    closeBtnText: {
      type: String,
      default: "取消",
    },
  },
  emits: ["submitClick", "update:modelValue"],
  setup(props, context) {
    const loading = computed(() => store.getters.requestLoading);
    const submitClick = () => {
      context.emit("submitClick");
    };
    const closeClick = () => {
      context.emit("update:modelValue", false);
    };
    return { loading, closeClick, submitClick };
  },
});
</script>
