<!-- eslint-disable vue/no-unused-vars -->
<template>
  <KJSCDrawer
    v-model="visible"
    custom-class="margin-bottom-unset"
    :close-on-press-escape="false"
    :title="tittle"
    append-to-body
    @close="closeClick"
  >
    <div class="contanier table-flex-style">
      <el-row>
        <KJSCKeySearch
          v-model="searchInfo.name"
          placeholder="通过视频名称搜索"
          show-search-btn
          @do-key-search="doSearch"
        >
        </KJSCKeySearch>
        <el-table style="margin-top: 20px" :data="tableData" class="common-table" height="calc(100vh - 300px)">
          <el-table-column prop="localFileUrl" label="视频预览图" min-width="100">
            <template #default="scope">
              <div class="img-box" @click.stop="playVideo(getFilesUrl(scope.row.localFileUrl))">
                <div style="font-size: 20px" class="play-icon">
                  <video-play style="width: 1em; height: 1em" />
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="视频名称" show-overflow-tooltip />
          <el-table-column prop="videoTime" label="视频时长" />
          <el-table-column prop="fileSize" label="文件大小" />
          <el-table-column prop="code" label="视频code" width="120" show-overflow-tooltip />
          <el-table-column prop="createTime" label="上传时间" show-overflow-tooltip />
          <el-table-column label="操作">
            <template #default="scope">
              <el-button text @click.prevent="selectCallbak(scope.row)"> 关联使用视频 </el-button>
            </template>
          </el-table-column>
        </el-table>
        <KJSCPagination :total="pageInfo.total" :page="pageInfo.page" @change="handlePageChange" />
      </el-row>
    </div>

    <CenterModel v-model:visible="playModelVisible" :before-mask-close="beforeMaskClose">
      <!-- url="http://124.225.67.153:8086/static/video/all_data/076c06d6f0d7acdb5d2b53884044f0d54a4c35d0_1648_1859.mp4" -->
      <GVideo :url="videoUrl" class="center-video" />
    </CenterModel>
  </KJSCDrawer>
</template>
<script>
import { ref, defineComponent, reactive, onMounted, toRefs, watch, watchEffect } from 'vue';
import { videoSelectorTabs } from '@/utils/dict';
import KJSCDrawer from '@/components/KJSCCmpt/KJSCDrawer.vue';
import KJSCKeySearch from '@/components/KJSCCmpt/KJSCKeySearch.vue';
import KJSCPagination, { getPage } from '@/components/KJSCCmpt/KJSCPagination.vue';
import { getFilesUrl } from '@/utils/common';
import api from '@/utils/api';
import { showMessage } from '@/utils/element-plus-message';
import CenterModel from '@/components/KJSCCmpt/VideoPlayer/CenterModel.vue';
import GVideo from '@/components/KJSCCmpt/VideoPlayer/GVideo.vue';

import useAppStore from "@/store/modules/app"
const appStore = useAppStore()

export default defineComponent({
  components: { KJSCKeySearch, KJSCDrawer, KJSCPagination, CenterModel, GVideo },
  props: {
    modelValue: {
      type: [Boolean],
      default: false
    },
    type: {
      type: [String, Number]
    },
    mediaCode: {
      type: [String, Number]
    }
  },
  emits: ['update:modelValue', 'selectCallbak'],
  setup(props, context) {
    const uploadForm = ref(null);
    const state = reactive({
      visible: false,
      tittle: '关联正片',
      searchInfo: {
        name: '',
        type: 1
      },
      videoSelectorTabs,
      groupTypeData: [],
      tableData: [],
      pageInfo: { page: getPage(), total: 0 },
      uploadInfo: {
        square: '', // square 是否为栏目广场  0是 1否
        distributionIds: []
      }, // 上传本地图片
      outboundPlanData: [], // 出库平台
      rules: {
        distributionIds: [
          {
            required: true,
            message: '请选择出库平台',
            trigger: 'change'
          }
        ]
      },
      mediaCode: '', // 媒资code
      isOpend: false, // 避免重复请求
      playModelVisible: false,
      videoUrl: '',
      beforeMaskClose(close) {
        state.videoUrl = '';
        close();
      }
    });

    // 获取图片列表数据
    const getTableData = async (isReset) => {
      if (isReset) {
        state.pageInfo.page.resetPageNo();
      }
      const params = { ...state.searchInfo };
      params.cpId = appStore.companyId === '-1' ? '' : appStore.companyId;
      // 展示未关联的视频
      params.existMovie = 0;
      const res = await api.mediaCapital.listConMovie(params, state.pageInfo.page);
      state.tableData = res.rows;
      state.pageInfo.total = parseInt(res.total);
    };

    onMounted(() => {
      // getTableData();
    });

    const closeClick = () => {
      state.visible = false;
      state.isOpend = false;
    };

    const radioChanged = () => {
      getTableData(true);
    };

    const doSearch = () => {
      getTableData(true);
    };
    const doReset = () => {
      state.searchInfo.name = '';
      getTableData(true);
    };

    const handlePageChange = () => {
      getTableData();
    };

    const selectCallbak = async (data) => {
      const params = {
        mediaCode: state.mediaCode,
        movieCode: data.code
      };
      const res = await api.mediaCapital.checkBindMovie(params);
      if (res.code === 200) {
        context.emit('selectCallbak', data);
      } else {
        showMessage(res.msg, 'error', true);
      }
    };

    // 播放视频
    const playVideo = (url) => {
      state.videoUrl = url;
      state.playModelVisible = true;
    };

    watch(
      () => {
        return state.visible;
      },
      (val) => {
        context.emit('update:modelValue', val);
      }
    );

    watchEffect(() => {
      state.visible = props.modelValue;
      state.searchInfo.type = props.type;
      state.tittle = state.searchInfo.type === 1 ? '关联正片' : '关联预览片';
      state.mediaCode = props.mediaCode;
      state.videoSelectorTabs = [];
      if (props.modelValue && !state.isOpend) {
        state.isOpend = true;
        getTableData();
      }
    });
    return {
      uploadForm,
      ...toRefs(state),
      closeClick,
      radioChanged,
      doSearch,
      doReset,
      handlePageChange,
      selectCallbak,
      playVideo,
      getFilesUrl
    };
  }
});
</script>

<style lang="less" scoped>
.el-tabs ::v-deep .el-tabs__nav-wrap::after {
  height: 0px;
}

.tabs-box ::v-deep .el-tabs__header {
  margin-bottom: 0px;
}

.center-model {
  position: fixed;
}

.center-model ::v-deep .center-model-dialog {
  width: 1085px;
  height: 680px;
}
.center-video ::v-deep .g-video-wrapper {
  width: 100%;
}

.center-video ::v-deep .video-box {
  height: 610px;
}

:deep(.img-box) {
  position: relative;
  width: 80px;
  height: 45px;
  cursor: pointer;
  background-color: #000;
  text-align: center;
  line-height: 45px;
}
.play-icon {
  color: #fff;
}
</style>
