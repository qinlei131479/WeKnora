<template>
  <el-image
    :style="state.style"
    :src="state.localFileUrl"
    :zoom-rate="state.rate"
    :preview-src-list="[state.localFileUrl]"
    :fit="state.fit"
    :preview-teleported="state.previewTeleported"
  />
</template>

<script setup>
import { defineProps, reactive, watchEffect } from 'vue';
// import { getFilesUrl } from '@/utils/common';
import { resolveStaticPath } from '@/utils/index'
const props = defineProps({
  style: {
    type: Object,
    default: () => {
      return { width: '50px', height: '50px' };
    }
  },
  url: {
    type: String
  },
  rate: {
    type: Number,
    default: 1.2
  },
  fit: {
    type: String,
    default: 'cover'
  },
  previewTeleported: {
    type: Boolean,
    default: true
  },
  defaultImage: {
    type: String,
    default: ''
  }
});
const state = reactive({
  style: {},
  localFileUrl: '',
  rate: '',
  fit: '',
  previewTeleported: true
});

watchEffect(() => {
  state.style = props.style;
  state.localFileUrl = props.url ? resolveStaticPath(props.url) : props.defaultImage;
  state.rate = props.rate;
  state.fit = props.fit;
  state.previewTeleported = props.previewTeleported;
});
</script>

<style scoped lang="less"></style>
