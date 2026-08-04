<template>
  <template v-if="props.confirmBtn">
    <el-popconfirm v-bind="data.confirmInfo" @confirm="handleConfirm" @cancel="handleCancel" popper-class="kjsc-el-popconfirm">
      <template #reference>
        <el-link class="kjsc-link" v-bind="$attrs">
          <template #default>
            <slot></slot>
          </template>
        </el-link>
      </template>
    </el-popconfirm>
  </template>
  <el-link v-else class="kjsc-link" v-bind="$attrs">
    <template #default>
      <slot> </slot>
    </template>
  </el-link>
</template>

<script setup>
import { defineProps, reactive } from 'vue';

const defalutInfo = {
  hideIcon: true,
  cancelButtonType: 'default',
  confirmButtonText: '确认'
};
const props = defineProps({
  data: {},
  confirmBtn: {
    type: Boolean,
    default: false
  },
  confirmInfo: {
    type: Object,
    default: function () {
      return {};
    }
  }
});
const data = reactive({
  confirmInfo: { ...defalutInfo, ...props.confirmInfo }
});

const handleConfirm = () => {
  props.confirmInfo?.confirmCallback?.(props.data);
};

const handleCancel = () => {
  props.confirmInfo?.cancelCallback?.(props.data);
};
</script>
<script>
export default {
  name: 'KjscTextButton'
};
</script>

<style>
.kjsc-el-popconfirm {
  max-width: 300px;
}
</style>
<style lang="less" scoped>
.kjsc-link + .kjsc-link {
  margin-left: 12px;
}
</style>
