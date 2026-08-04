<template>
  <div class="year-box">
    <el-date-picker
      v-model="state.startYear"
      type="year"
      placeholder="选择开始年"
      size="mini"
      format="YYYY"
      value-format="YYYY"
      :prefix-icon="Clock"
      class="start-year"
      @change="changeStartYear"
    >
    </el-date-picker>
    <span class="range-word"> - </span>
    <el-date-picker
      v-model="state.endYear"
      type="year"
      placeholder="选择结束年"
      size="mini"
      format="YYYY"
      value-format="YYYY"
      :prefix-icon="Clock"
      class="end-year"
      @change="changeEndYear"
    >
    </el-date-picker>
  </div>
</template>

<script setup>
import { reactive, defineProps, defineEmits, onMounted } from 'vue';
const props = defineProps({
  value: {
    type: Array,
    default: () => {
      return [];
    }
  }
});

const emits = defineEmits(['input']);

const state = reactive({
  startYear: '',
  endYear: ''
});

const changeStartYear = (val) => {
  console.log(val);
  if (!val) {
    state.endYear = val;
    state.startYear = val;
  } else if (Number(state.startYear) > Number(state.endYear) && state.startYear && state.endYear) {
    state.startYear = state.endYear;
    state.endYear = val;
  }

  // 将改动传回父组件
  emits('input', [Number(state.startYear), Number(state.endYear)]);
};
const changeEndYear = (val) => {
  if (!val) {
    state.endYear = val;
    state.startYear = val;
  } else if (Number(state.startYear) > Number(state.endYear) && state.startYear && state.endYear) {
    state.endYear = state.startYear;
    state.startYear = val;
  }
  emits('input', [Number(state.startYear), Number(state.endYear)]);
};

onMounted(() => {
  console.log(props);
  state.startYear = String(props.value[0]);
  state.endYear = String(props.value[1]);
});

// watchEffect(() => {
//   console.log(props);
//   state.startYear = String(props.value[0]);
//   state.endYear = String(props.value[1]);
// });
</script>

<style lang="less" scoped>
.year-box {
  //   border: var(--el-input-border, var(--el-border-base));
  height: 30px;
  line-height: 28px;
  width: 220px;
  display: inline-block;
  margin: 5px 20px 5px 0px;
  border-radius: var(--el-input-border-radius, var(--el-border-radius-base));
}
:deep(.el-date-editor.el-input) {
  width: 100px;
}
:deep(.start-year .el-input__inner) {
  width: 100px;
  //   border: none;
  padding-right: 0;
}

:deep(.end-year .el-input__inner) {
  //   border: none;
  //   padding-left: 10px;
  padding-right: 0;
}
</style>
