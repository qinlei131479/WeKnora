<template>
  <div>
    <el-form ref="saveForm" :model="state.saveInfo" label-width="100px" :rules="rules" :disabled="state.disabled">
      <el-row>
        <el-col :span="12">
          <el-form-item label="版权方" prop="copyRight" class="labelleft2">
            <el-input v-model="state.saveInfo.copyRight" clearable placeholder="请输入版权方名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发行方" prop="distributor">
            <el-input v-model="state.saveInfo.distributor" clearable placeholder="请输入发行方名称" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="内容字号" class="labelleft2">
            <el-input v-model="state.saveInfo.contentCode" maxlength="50" clearable placeholder="请输入内容字号" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="授权时间" prop="licensingWindow" class="labelleft">
            <el-date-picker
              v-model="state.saveInfo.licensingWindow"
              type="daterange"
              range-separator="-"
              start-placeholder="请选择授权开始时间"
              end-placeholder="请选择授权结束时间"
              format="YYYY-MM-DD"
              value-format="YYYYMMDDHHmmss"
              :default-time="defaultTime"
              style="width: 100%"
              :disabled-date="disabledDate"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>
<script setup>
import { ref, reactive, watchEffect, watch, onMounted, defineEmits, defineProps, defineExpose } from 'vue';
// import dayjs from 'dayjs';
const emits = defineEmits(['callBack']);
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 2, 1, 23, 59, 59)];
const props = defineProps({
  saveInfo: {
    type: [Object]
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const saveForm = ref(null);
const state = reactive({
  disabled: false,
  saveInfo: {}
});

const maxDateTime = new Date(2100, 0, 1, 0, 0, 0, 0).getTime();
const disabledDate = (time) => {
  return time.getTime() >= maxDateTime;
};

const rules = {
  licensingWindow: [
    {
      required: true,
      message: '请选择授权时间',
      trigger: ['change']
      // ,
      // validator: (rule, value, callback) => {
      //   if (!value || !value.length) {
      //     callback(new Error('请选择授权时间'));
      //   } else {
      //     const [startTimeStr, endTimeStr] = value;
      //     const currentTime = dayjs();
      //     const dayjsFormat = 'YYYYMMDDHHmmss';
      //     const startTime = dayjs(startTimeStr, dayjsFormat);
      //     const endTime = dayjs(endTimeStr, dayjsFormat);
      //     const beginTime = startTime.isAfter(currentTime) ? startTime : currentTime;
      //     const diffDays = endTime.diff(beginTime, 'day');
      //     if (diffDays > 999) {
      //       callback(new Error('版权剩余天数不能超过3位数'));
      //     } else {
      //       callback();
      //     }
      //   }
      // }
    }
  ]
};

watch(
  () => {
    return state.saveInfo.licensingWindow;
  },
  (val) => {
    console.log(val);
    if (val && val.length === 2) {
      state.saveInfo.licensingWindowStart = val[0];
      state.saveInfo.licensingWindowEnd = val[1];
    } else {
      state.saveInfo.licensingWindowStart = '';
      state.saveInfo.licensingWindowEnd = '';
    }
  }
);

watchEffect(() => {
  state.saveInfo = props.saveInfo ? props.saveInfo : {};
  state.disabled = props.disabled;
  console.log(state.saveInfo);
});

const submitForm = () => {
  saveForm.value.validate(async (valid) => {
    emits('callBack', valid, 'copyright');
  });
};

onMounted(() => {});

defineExpose({
  submitForm
});
</script>

<style lang="less" scoped>
.labelleft {
  /deep/ .el-form-item__label {
    text-align: left;
    padding-left: 5px;
  }
}
.labelleft2 {
  /deep/ .el-form-item__label {
    text-align: left;
    padding-left: 15px;
  }
}

::v-deep input:disabled::-webkit-input-placeholder {
  -webkit-text-fill-color: rgba(255, 255, 255, 0);
}
</style>
