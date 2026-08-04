<template>
  <div class="media-manage--media--components--detail-editSub">
    <KJSCDrawer
      v-model="state.visible"
      :title="props.isLook ? '查看子集' : state.tittle"
      :show-close-btn="false"
      :show-subit-btn="false"
      size="50%"
      @close="closeClick"
    >
      <div class="tabs-box">
        <KJSCTabs v-model="state.activeName" type="border-card" @tab-change="changeTab">
          <el-tab-pane label="基础信息" name="baseInfo">
            <EditBaseInfo
              ref="baseInfoRef"
              :disabled="props.isLook"
              :save-info="state.saveInfo"
              :source="2"
              @call-back="callBack"
            />
          </el-tab-pane>
          <!-- <el-tab-pane label="图片介质" name="config">
            <EditPicture
              ref="pictureRef"
              :is-show="!props.isLook"
              :save-info="state.saveInfo"
              :data-id="state.saveInfo.code"
            />
          </el-tab-pane>
          <el-tab-pane label="视频介质" name="preview">
            <EditVideo ref="videoRef" :is-show="!props.isLook" :save-info="state.saveInfo" />
          </el-tab-pane> -->
        </KJSCTabs>
      </div>
      <template #prefixFooter>
        <el-button v-if="!props.isLook" type="success" @click="submitClick(true)">保存并提审</el-button>
        <el-button v-if="!props.isLook" type="primary" @click="submitClick(false)">保存</el-button>
        <el-button @click="closeClick()">取消</el-button>
      </template>
    </KJSCDrawer>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, reactive, watch, watchEffect, onMounted } from 'vue';
import KJSCTabs from '@/components/KJSCCmpt/KJSCTabs.vue';
import KJSCDrawer from '@/components/KJSCCmpt/KJSCDrawer.vue';
import api from '@/utils/api';
import EditBaseInfo from './edit-baseInfo.vue';
// import EditPicture from './edit-picture.vue';
// import EditVideo from './edit-video.vue';
import { ElMessage } from 'element-plus';
import { showMessage } from '@/utils/element-plus-message';

import useAppStore from "@/store/modules/app"
const appStore = useAppStore()

const props = defineProps({
  modelValue: {
    type: [Boolean],
    default: false
  },
  dataId: {
    type: [String, Number]
  },
  // 是否详情
  isLook: {
    type: [Boolean],
    default: false
  }
});

const emits = defineEmits(['done', 'update:modelValue']);
const baseInfoRef = ref(); // 基本信息

const pictureRef = ref(); // 图片介质
const videoRef = ref(); // 视频介质

const state = reactive({
  visible: false,
  dataId: '',
  tittle: '新增单集',
  activeName: 'baseInfo',
  saveInfo: {}, // 详情
  detailString: '',
  paramsString: ''
});

onMounted(() => {});

const changeTab = () => {};

// 回调
const callBack = (value, activeName) => {
  console.log(value, activeName);
  if (value) {
    // console.log(pictureRef.value.pictureList); // 获取图片列表
    // console.log(videoRef.value.movieList); // 获取视频列表
    // console.log(state.saveInfo);
    state.paramsString = JSON.stringify(state.saveInfo);
    const movieList = [];
    if (state.saveInfo.movieList) {
      state.saveInfo.movieList.forEach((i) => {
        movieList.push({ movieCode: i.movieCode, type: i.type });
      });
    }
    // const pictureList = pictureRef.value.pictureList;
    // state.saveInfo.pictureList = pictureList;
    state.saveInfo.movieList = movieList;
    if (state.paramsString === state.detailString && state.saveInfo.auditStatus !== 0) {
      emits('done');
      state.visible = false;
      return;
    }
    submit(state.saveInfo);
  }
};
const submit = async (params) => {
  params.seriesFlag = 1;
  const cpId = appStore.companyId;
  params.cpId = cpId;
  if (state.dataId) {
    if (params.auditStatus >= 1 && params.auditStatus <= 3) {
      showMessage('当前媒资正在审核中，请完成审核后修改', 'warning');
      return;
    }
    params.id = state.dataId;
    await api.mediaCapital
      .update(params)
      .then((res) => {
        if (res.code === 200) {
          ElMessage({
            message: '修改成功',
            type: 'success'
          });
          emits('done', { refresh: true });
          state.visible = false;
        } else {
          state.visible = false;
          ElMessage.error(res.msg);
        }
      })
      .catch((r) => {
        state.visible = false;
        console.error(r);
      });
  } else {
    await api.mediaCapital
      .add(params)
      .then((res) => {
        if (res.code === 200) {
          ElMessage({
            message: '操作成功',
            type: 'success'
          });
          emits('done', { refresh: true });
          state.visible = false;
        } else {
          state.visible = false;
          ElMessage.error(res.msg);
        }
      })
      .catch((r) => {
        state.visible = false;
        console.error(r);
      });
  }
};
const submitClick = (value) => {
  state.saveInfo.enableAudit = value;
  baseInfoRef.value.submitForm();
  console.log(state.saveInfo);
};

const closeClick = () => {
  state.visible = false;
  state.dataId = '';
  state.title = '';
  state.saveInfo = {};
  // baseInfoRef.value.resetFields();
  emits('done');
};

watch(
  () => {
    return state.visible;
  },
  (val) => {
    if (!val) {
      state.activeName = 'baseInfo';
    }
    emits('update:modelValue', val);
  }
);

watchEffect(() => {
  state.visible = props.modelValue;
  state.dataId = props.dataId;
  state.saveInfo = {};
  state.tittle = props.dataId ? '修改子集' : '新增子集';
});

watchEffect((onInvalidate) => {
  // 异步api调用，返回一个操作对象
  // console.log(state.dataId, props.dataId);
  if (state.visible && state.dataId) {
    api.mediaCapital.getDetail(state.dataId).then((res) => {
      console.log(res, '数据回显');
      state.saveInfo = { ...res.data };
      state.saveInfo.cpId = state.saveInfo.cpId ? state.saveInfo.cpId : appStore.companyId;
      state.saveInfo.duration = state.saveInfo.duration ? state.saveInfo.duration : undefined;
      state.saveInfo.sequence = state.saveInfo.sequence ? state.saveInfo.sequence : undefined;
      // state.saveInfo.pictureList = [];
      state.saveInfo.enableAudit = true;
      // const movieList = [];
      // if (state.saveInfo.movieList) {
      //   state.saveInfo.movieList.forEach((i) => {
      //     movieList.push({
      //       thumbnail: i.fileUrl,
      //       contentName: i.movieName,
      //       type: i.type,
      //       vedioTime: i.videoTime,
      //       fileSize: i.fileSize,
      //       contentCode: i.movieCode,
      //       fileServiceUrl: i.fileUrl
      //     });
      //   });
      //   state.detailString = '';
      //   state.saveInfo.movieList = movieList;
      //   getTableData(state.saveInfo.code);
      //   // state.detailString = JSON.stringify(state.saveInfo);
      // }
    });
  }
  onInvalidate(() => {
    // 取消异步api的调用。
    // apiCall && apiCall.cancel();
  });
});

// const getTableData = async (id) => {
//   const params = { programCode: id };
//   api.mediaCapital.picturelist(params).then((res) => {
//     state.saveInfo.pictureList = res.data;
//     state.detailString = JSON.stringify(state.saveInfo);
//   });
// };
</script>
<script>
export default {
  name: 'SubEdit'
};
</script>

<style lang="less" scoped></style>
