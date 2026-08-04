<template>
  <div
    class="system-item-box"
    :style="{
      background: props.isSelect
        ? 'rgba(99,151,255,0.2)'
        : props.info.used
        ? '#F4F7FB'
        : '#ffffff',
    }"
  >
    <div
      class="system-item-box-title"
      :style="{ color: props.info.used ? '#29B000' : '#8a8c9d' }"
    >
      <svg-icon v-if="props.info.used" icon-class="connecting" class="connect-icon" />
      <svg-icon v-else icon-class="connect" class="connect-icon" />
      <span>{{ props.info.used ? "使用中" : "未使用" }}</span>
    </div>
    <div class="system-item-box-content">
      <div class="system-item-box-conten-img">
        <img :src="props.info.systemImg" alt="" />
      </div>
      <div class="system-item-box-conten-text">
        <div class="system-item-box-conten-text-title">
          {{ props.info.label }}
        </div>
        <div class="system-item-box-conten-text-desc">
          {{ props.info.other }}
        </div>
      </div>
    </div>
    <div v-if="!props.isEdit" class="system-item-box-content-check">
        <el-radio v-model="isCheck" :label="true"><span></span></el-radio>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  info: {
    type: Object,
    default: () => {},
  },
  isSelect: {
    type: Boolean,
    default: false,
  },
  isEdit:{
    type: Boolean,
    default: false,
  }
});

const isCheck = computed(() => {
  return props.isSelect;
});
</script>
<style lang="less" scoped>
.system-item-box {
  width: 518px;
  height: 140px;
  background: #ffffff;
  border-radius: 2px;
  border: 1px solid #e6e6ec;
}
.system-item-box-title {
  width: 100%;
  display: flex;
  justify-content: end;
  align-items: center;
  font-family: '思源黑体 CN';
  font-weight: 0;
  font-size: 12px;
  color: #8a8c9d;
  padding: 14px 16px;
  box-sizing: border-box;
}
.connect-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}
.system-item-box-content {
  padding: 0 32px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}
.system-item-box-conten-img {
  width: 48px;
  height: 48px;
  margin-right: 12px;
}
.system-item-box-conten-text-title {
  font-family: '思源黑体 CN';
  font-weight: 500;
  font-size: 16px;
  color: #0c113d;
  line-height: 32px;
  // margin-bottom: 16px;
}
.system-item-box-conten-text-desc {
  font-family: '思源黑体 CN';
  font-weight: 0;
  font-size: 14px;
  color: #8a8c9d;
}
.system-item-box-content-check{
    display: flex;
    justify-content: end;
    padding: 0 5px 0 0;
    box-sizing: border-box;
}
</style>
