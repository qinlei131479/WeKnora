<template>
  <CenterModel v-model:visible="state.playModelVisible" :before-mask-close="state.beforeMaskClose">
    <div class="wrapper-style">
      <el-row :gutter="20">
        <el-col :span="18" :offset="3"
          ><div class="content-style">
            ts格式视频仅支持vlc播放器播放,请将视频播放地址复制到播放器【媒体】-【打开网络串流】中进行预览播放
          </div></el-col
        >
        <el-col :span="18" :offset="4"
          ><div class="btn-style">
            <el-space wrap :size="120">
              <el-button size="large" type="primary" @click="downloadVLC">点击下载vlc播放器</el-button>
              <el-button size="large" type="success" @click="copyVideo">点击复制视频地址</el-button>
            </el-space>
          </div></el-col
        >
      </el-row>
    </div>
  </CenterModel>
</template>
<script setup>
import { reactive, onMounted, defineEmits, watch, defineProps, watchEffect } from 'vue';
import CenterModel from '@/components/KJSCCmpt/VideoPlayer/CenterModel.vue';
import { fastCopy } from '@/utils/fastCopy.js';
import { resolveStaticPath } from '@/utils';

const emits = defineEmits(['update:modelValue', 'close']);
const props = defineProps({
  modelValue: {
    type: [Boolean],
    default: false
  },
  info: {
    type: String,
    default: ''
  }
});

const state = reactive({
  info: {},
  playModelVisible: false,
  beforeMaskClose(close) {
    state.info = '';
    close();
  }
});

watch(
  () => {
    return state.playModelVisible;
  },
  (val) => {
    emits('update:modelValue', val);
  }
);

watchEffect(() => {
  state.playModelVisible = props.modelValue;
  state.info = props.info;
});

const downloadVLC = () => {
  window.open('https://www.videolan.org/');
};

const copyVideo = () => {
  // if (state.info.localFileUrl.startsWith('http')) {
  //   fastCopy(`${state.info.localFileUrl}`);
  // } else {
  //   fastCopy(`${location.origin + import.meta.env.VITE_APP_STATIC_API + state.info.localFileUrl}`);
  // }
  const copyUrl = resolveStaticPath(state.info.localFileUrl);
  fastCopy(copyUrl);
};

onMounted(() => {});
</script>
<style lang="less" scoped>
.wrapper-style {
  height: 100%;
  background: #222328;
  padding: 20% 0;
  box-sizing: border-box;
}
.content-style {
  color: #fff;
  font-weight: bold;
  font-size: 32px;
  text-align: center;
}
.btn-style {
  text-align: center;
  margin-top: 5%;
}
</style>
