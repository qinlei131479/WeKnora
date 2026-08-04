<template>
  <div class="media-manage--media--components--multi-datailEdit">
    <KJSCDrawer
      v-model="state.visible"
      :title="props.isLook ? '查看剧集' : state.tittle"
      :show-close-btn="false"
      :show-subit-btn="false"
      size="50%"
      @close="onClose"
    >
      <div class="tabs-box">
        <KJSCTabs v-model="state.activeName" type="border-card" @tab-change="changeTab">
          <el-tab-pane label="基础信息" name="baseInfo">
            <EditBaseInfo
              ref="baseInfoRef"
              :disabled="props.isLook"
              :source="3"
              :save-info="state.saveInfo"
              @call-back="callBack"
            />
          </el-tab-pane>
          <el-tab-pane label="详细信息" name="detailInfo">
            <EditDetailInfo
              ref="detailInfoRef"
              :disabled="props.isLook"
              :save-info="state.saveInfo"
              @call-back="callBack"
            />
          </el-tab-pane>
          <!-- <el-tab-pane label="图片介质" name="config">
            <EditPicture
              ref="pictureRef"
              :is-show="!props.isLook"
              :source="3"
              :save-info="state.saveInfo"
              :data-id="state.saveInfo.code"
            />
          </el-tab-pane> -->
          <!-- <el-tab-pane label="视频介质" name="preview">
            <EditVideo ref="videoRef" :is-show="!props.isLook" :save-info="state.saveInfo" :source="3" />
          </el-tab-pane> -->
          <el-tab-pane label="版权信息" name="copyright">
            <!-- 版权信息 -->
            <EditCopyright
              ref="copyrightRef"
              :disabled="props.isLook"
              :save-info="state.saveInfo"
              @call-back="callBack"
            />
          </el-tab-pane>
          <!-- <el-tab-pane label="媒资标签" name="mediaTag">
            <EditMediaTag ref="mediaTagRef" :save-info="state.saveInfo" @call-back="callBack"></EditMediaTag>
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
import EditDetailInfo from './edit-detailInfo.vue';
import EditBaseInfo from './edit-baseInfo.vue';
import EditCopyright from './edit-copyright.vue';
// import EditPicture from './edit-picture.vue';
// import EditMediaTag from './edit-mediaTag.vue';
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
const copyrightRef = ref(); // 版权信息
const detailInfoRef = ref(); // 详细信息

const pictureRef = ref(); // 图片介质
// const videoRef = ref(); // 视频介质
const mediaTagRef = ref();

const state = reactive({
  doneRefresh: false,
  visible: false,
  dataId: '',
  tittle: '新增剧集',
  activeName: 'baseInfo',
  saveInfo: {}, // 详情
  detailString: '',
  paramsString: ''
});

onMounted(() => {});

const changeTab = (value) => {
  // state.activeName
  console.log(state.activeName, value);
};

// 回调
const callBack = (value, activeName) => {
  console.log(value, activeName);
  if (value) {
    if (activeName === 'baseInfo') {
      // 基本信息验证通过,再去验证详细信息
      detailInfoRef.value.submitForm();
    } else if (activeName === 'detailInfo') {
      // 详细信息验证通过,再去验证版权信息
      copyrightRef.value.submitForm();
    } else {
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
      // state.saveInfo.pictureList = pictureRef.value.pictureList;
      state.saveInfo.movieList = movieList;
      if (state.paramsString === state.detailString && state.saveInfo.auditStatus !== 0) {
        // emits('done');
        state.visible = false;
        return;
      }
      submit(state.saveInfo);
    }
  } else {
    state.activeName = activeName;
  }
};
const submit = async (value) => {
  const params = value;
  // params.seriesFlag = 0;
  const cpId = appStore.companyId;
  params.cpId = cpId;
  /**
   * 剧集，
   * 主演,嘉宾传参时 kpeople
   * 列表定价是 price
   */
  /** 2023年5月23日19:43:45 修改 导演：director */
  // params.kpeople = params.actorDisplay;
  params.director = params.writerDisplay;
  params.price = params.priceTaxIn;
  // delete params.licensingWindow;
  if (state.dataId) {
    // 审核中的状态不能修改
    console.log(params);
    if (params.auditStatus >= 1 && params.auditStatus <= 3) {
      showMessage('当前媒资正在审核中，请完成审核后修改', 'warning');
      return;
    }
    params.id = state.dataId;
    await api.mediaCapital
      .updateConSeries(params)
      .then((res) => {
        if (res.code === 200) {
          ElMessage({
            message: '修改成功',
            type: 'success'
          });
          // emits('done');
          state.doneRefresh = true;
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
      .addConSeries(params)
      .then((res) => {
        if (res.code === 200) {
          ElMessage({
            message: '添加成功',
            type: 'success'
          });
          // emits('done');
          state.doneRefresh = true;
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
  //
  state.saveInfo.enableAudit = value;
  baseInfoRef.value.submitForm();
  console.log(state.saveInfo);
};

const onClose = () => {
  state.visible = false;
  // baseInfoRef.value.resetFields();
  // detailInfoRef.value.resetFields();
  // copyrightRef.value.resetFields();
  state.dataId = '';
  state.title = '';
  state.saveInfo = {};
  const data = {
    refresh: state.doneRefresh
  };
  emits('done', data);
  state.doneRefresh = false;
};

const closeClick = () => {
  state.visible = false;
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
  state.tittle = props.dataId ? '修改剧集' : '新增剧集';
});

watchEffect((onInvalidate) => {
  // 异步api调用，返回一个操作对象
  if (props.modelValue && props.dataId) {
    const dataId = props.dataId;
    api.mediaCapital.getDetailConSeries(dataId).then((res) => {
      if (props.dataId !== dataId) return;
      console.log(res, '数据回显');
      state.saveInfo = { ...res.data };
      state.saveInfo.cpId = state.saveInfo.cpId ? state.saveInfo.cpId : appStore.companyId;
      state.saveInfo.definitionFlag = state.saveInfo.definitionFlag == null ? '' : state.saveInfo.definitionFlag + '';
      state.saveInfo.licensingWindow = [state.saveInfo.licensingWindowStart, state.saveInfo.licensingWindowEnd];
      // state.saveInfo.actorDisplay = state.saveInfo.kpeople;
      state.saveInfo.priceTaxIn = state.saveInfo.price;
      state.saveInfo.enableAudit = true;
      state.saveInfo.writerDisplay = state.saveInfo.director;
      // const movieList = [];
      // if (state.saveInfo.movieList) {
      //   state.saveInfo.movieList.forEach((i) => {
      //     movieList.push({
      //       localFileUrl: i.localFileUrl,
      //       movieName: i.movieName,
      //       type: i.type,
      //       videoTime: i.videoTime,
      //       fileSize: i.fileSize,
      //       movieCode: i.movieCode
      //     });
      //   });
      //   state.detailString = '';
      //   state.saveInfo.movieList = movieList;
      //   getTableData(state.saveInfo.code);
      // }
    });
  }
  onInvalidate(() => {
    // 取消异步api的调用。
    // apiCall && apiCall.cancel();
  });
});
// const getTableData = async (id) => {
//   const params = { seriesCode: id };
//   api.mediaCapital.conSeriesPicturelist(params).then((res) => {
//     state.saveInfo.pictureList = res.data;
//     console.log(state.saveInfo, 'state.saveInfo1');
//     state.detailString = JSON.stringify(state.saveInfo);
//   });
// };
</script>
<script>
export default {
  name: 'MultiEdit'
};
</script>

<style lang="less" scoped></style>
