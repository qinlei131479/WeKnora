<template>
  <el-upload
    :action="state.action"
    :before-upload="state.handleBeforeUpload"
    :on-success="state.handleSuccess"
    :on-error="state.handleError"
    :accept="state.accept"
    :headers="getTokenData()"
    :on-remove="state.handleRemove"
    :file-list="state.fileList"
    :show-file-list="false"
    :data="props.data"
  >
    <slot name="btn"></slot>
    <template #tip></template>
  </el-upload>
</template>

<script setup>
import { reactive, watchEffect, nextTick, defineEmits, defineProps } from 'vue';
import { uploadFileUrl } from '@/utils/api';
import { checkFileTypeAndSize } from '@/utils/common';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getBearerToken } from '@/utils/auth';

const emits = defineEmits(['update:modelValue', 'handleSuccess', 'beforeUpload']);
const props = defineProps({
  modelValue: {
    type: [String, Object]
  },
  accept: {
    type: [Array],
    default: () => {
      return ['xlsx', 'xls'];
    }
  },
  type: {
    type: String
  },
  // 文件大小限制，单位M
  fileSize: {
    type: Number,
    default: 10
  },
  text: {
    type: String,
    default: '上传文件'
  },
  action: {
    type: String,
    default: uploadFileUrl
  },
  data: {
    type: Object,
    default: () => ({})
  },
  handleSuccess: {
    type: Function,
    default: null
  }
});

const state = reactive({
  accept: '',
  uploadUrl: '',
  fileSize: '',
  text: '上传文件',
  fileList: props.modelValue ? [props.modelValue] : [],
  handleSuccess(response, file, fileList) {
    if (props.handleSuccess) {
      state.fileList = [file];
      props.handleSuccess(response, file, fileList);
      return;
    }
    // 上传成功
    if (response.code !== 200) {
      ElMessage({
        type: 'error',
        message: response.resultMsg || '系统错误'
      });
      return;
    }
    state.fileList = [file];
    nextTick(() => {
      emits('handleSuccess', state.fileList, response);
      if (isStringProp()) {
        if (response.data?.url) {
          changeModelValue(response.data.url);
        }
      } else {
        changeModelValue(response.data);
      }
    });
  },
  handleProgres(event, file, fileList) {},

  handleBeforeUpload(file) {
    const fileType = props.accept;
    let fileType2 = props.accept;
    if (props.type === 'img') {
      fileType2 = ['jpg', 'png', 'gif'];
    }
    const fileSize = props.fileSize;
    console.log(fileType, props.accept, props.action);
    const res = checkFileTypeAndSize(file, fileSize, fileType);
    if (!res.isType) {
      ElMessage.error('只能上传【' + fileType2.join('、') + '】类型的文件!');
      return false;
    }

    if (!res.isLt) {
      ElMessage.error(`上传文件大小不能超过${fileSize}MB!`);
      return false;
    }
    emits('beforeUpload', file);
    return true;
  },
  handleError() {
    ElMessage.error('上传失败！');
  },
  beforeRemove(file, fileList) {
    // return showConfirm("提示", `确定删除： ${file.name} ?`);
    return ElMessageBox.confirm(`确定删除： ${file.name} ?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
  },
  handleRemove(file, fileList) {
    if (fileList.length === 0) {
      if (isStringProp()) {
        changeModelValue('');
      } else {
        changeModelValue(null);
      }
    }
  },
  clearFile(e) {
    if (isStringProp()) {
      changeModelValue('');
    } else {
      changeModelValue(null);
    }
    e.stopPropagation();
  }
});

const changeModelValue = (data) => {
  emits('update:modelValue', data);
};

const getTokenData = () => {
  const Authorization = getBearerToken();
  return { Authorization };
};

const isStringProp = () => {
  return (typeof props.modelValue).toUpperCase() === 'STRING';
};

watchEffect(() => {
  state.action = props.action;
  state.accept = props.accept.map(item=>`.${item}`).join(',');
  state.fileSize = props.fileSize;
  state.text = props.text;
});
</script>

<!-- <script>
export default {
  name: "kjsc-upload-single-file3",
};
</script> -->
<style scoped></style>
