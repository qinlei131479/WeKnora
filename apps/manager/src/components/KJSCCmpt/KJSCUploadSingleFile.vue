<template>
  <div
    v-if="proxyValue"
    :class="type == 'img' ? 'img-box' : 'video-box'"
    @mouseover="isShowCloseBtn = true"
    @mouseout="isShowCloseBtn = false"
  >
    <el-image v-if="type == 'img'" class="img-file" fit="contain" :src="proxyValue" :preview-src-list="[proxyValue]">
      <template #placeholder>
        <div v-loading="loading" style="width: 100%; height: 100%"></div>
      </template>
    </el-image>

    <video v-else :src="proxyValue" controls="controls" class="video-file">您的浏览器不支持视频播放</video>
    <el-icon v-show="isShowCloseBtn" class="close-btn" title="删除" @click="clearFile($event)"
      ><CircleCloseFilled
    /></el-icon>
  </div>

  <el-upload
    v-else
    v-bind="$attrs"
    :action="uploadFileUrl"
    :show-file-list="false"
    :on-success="handleSuccess"
    :before-upload="handleBeforeUpload"
    :on-progress="handleProcess"
    :on-error="handleError"
    :accept="accept"
    :headers="getTokenData()"
  >
    <el-progress v-if="uploading" type="circle" :percentage="uploadPercent" class="file-progress"></el-progress>
    <template v-else>
      <el-icon class="file-uploader-icon"><Plus /></el-icon>
    </template>
  </el-upload>
</template>

<script>
import { reactive, toRefs, computed } from 'vue';
import { uploadFileUrl } from '@/utils/api';
import { checkFileTypeAndSize, imgTypeArr, videoTypeArr, getFilesUrl } from '@/utils/common';
import { ElMessage } from 'element-plus';
import { getBearerToken } from '@/utils/auth';
export default {
  props: {
    modelValue: {
      type: [String, Object]
    },
    type: {
      type: String,
      default: 'img'
    },
    fileSize: {
      type: Number
    }
  },
  emits: ['update:modelValue', 'handleSuccess'],
  setup(props, context) {
    const proxyValue = computed(() => {
      if (props.modelValue) {
        if ((typeof props.modelValue).toUpperCase() === 'STRING') {
          return getFilesUrl(props.modelValue);
        } else {
          return getFilesUrl(props.modelValue.url);
        }
      }
      return '';
    });
    const state = reactive({
      isShowCloseBtn: false,
      accept: props.type === 'img' ? 'image/*' : 'video/*',
      uploadFileUrl,
      uploading: false,
      uploadPercent: 0,
      imgFileSize: props.fileSize ? props.fileSize : 10,
      videoFileSize: props.fileSize ? props.fileSize : 1024,
      handleSuccess(response, file, fileList) {
        if (response.resultCode === '-1' || response.code >= 400) {
          ElMessage({
            type: 'error',
            message: response.resultMsg || response.msg || '系统错误'
          });
          state.uploading = false;
          state.uploadPercent = 0;
          return;
        }
        state.uploadPercent = 100;
        if (isStringProp()) {
          changeModelValue(response.data.url);
        } else {
          changeModelValue(response.data);
        }
        context.emit('handleSuccess', { response, file, fileList });
        setTimeout(() => {
          state.uploading = false;
          state.uploadPercent = 0;
        }, 800);
      },
      handleBeforeUpload(file) {
        let fileType = [];
        let fileSize = 0;
        if (props.type === 'img') {
          fileType = imgTypeArr;
          fileSize = state.imgFileSize;
        } else {
          fileType = videoTypeArr;
          fileSize = state.videoFileSize;
        }
        const res = checkFileTypeAndSize(file, fileSize, fileType);
        if (!res.isType) {
          ElMessage.error('只能上传【' + fileType.join('、') + '】类型的文件!');
          return false;
        }

        if (!res.isLt) {
          ElMessage.error('上传图片大小不能超过' + fileSize + 'MB!');
          return false;
        }
        state.uploading = true;
        return true;
      },
      handleProcess(event, file, fileList) {
        state.uploadPercent = +file.percentage.toFixed(0);
      },
      handleError() {
        // err, file, fileList
        ElMessage.error('上传失败！');
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
      console.log(data);
      context.emit('update:modelValue', data);
    };

    const getTokenData = () => {
      const Authorization = getBearerToken();
      return { Authorization };
    };

    const isStringProp = () => {
      return (typeof props.modelValue).toUpperCase() === 'STRING';
    };

    return {
      ...toRefs(state),
      getTokenData,
      proxyValue
    };
  }
};
</script>

<style scoped>
:deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: block;
  width: 178px;
  height: 178px;
}

:deep(.el-upload:hover) {
  border-color: #409eff;
}

.file-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.img-file {
  width: 178px;
  height: 178px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}
.img-file:hover {
  border-color: #409eff;
}

.video-file {
  width: 300px;
  height: 178px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}
.video-file:hover {
  border-color: #409eff;
}

.file-progress {
  width: 178px;
  height: 178px;
}

:deep(.el-progress-circle) {
  margin: 26px auto;
}
.close-btn {
  position: absolute;
  top: -15px;
  right: -15px;
  font-size: 30px;
  cursor: pointer;
}

.img-box {
  position: relative;
  width: 180px;
  height: 180px;
}
.video-box {
  position: relative;
  width: 300px;
  height: 180px;
}
</style>
