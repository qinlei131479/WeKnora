<template>
  <div class="alert-style" v-if="state.alertVisiable">
    <div v-for="(item, index) in state.alertList" :key="index">
      <el-alert
        style="border-radius: 0"
        :type="item.alertType"
        :effect="item.alertEffect"
        :closable="item.closable"
        :center="true"
      >
        <template #title>
          <div class="title-style">
            <svg-icon icon-class="form_close" class="title-icon" />
            <div>{{ item.alertTitle }}</div>
          </div>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup name="AlertComponent">
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  alertList: {
    type: Array,
    default: () => [],
  },
});

const state = reactive({
  alertVisiable: props.modelValue,
  alertList: [],
});

watchEffect(() => {
  state.alertVisiable = props.modelValue;
  state.alertList = props.alertList;
});
</script>

<style lang="less" scoped>
.alert-style {
  width: 100%;
  position: absolute;
  left: 0;
  top: 0;
}
.title-style {
  display: flex;
  align-items: center;
  font-weight: 0;
  font-size: 14px;
  color: #ffffff;
}
.title-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
}
</style>
