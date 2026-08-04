<template>
  <div>
    <div v-if="state.isShow">
      <el-button v-if="state.source != 3" type="primary" @click="doPositive(1)">关联正片</el-button>
      <el-button type="primary" @click="doPositive(2)">关联预览片</el-button>
    </div>
    <div v-if="state.tableData.length != 0" style="width: 100%">
      <el-table
        ref="multipleTable"
        class="table"
        :data="state.tableData"
        width="100%"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
        @row-click="handlePreview"
      >
        <el-table-column prop="localFileUrl" label="视频预览" min-width="100">
          <template #default="scope">
            <div class="img-box" @click.stop="playVideo(scope.row, getFilesUrl(scope.row.localFileUrl))">
              <div style="font-size: 20px" class="play-icon">
                <video-play style="width: 1em; height: 1em" />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="movieName" label="视频名称" min-width="100" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" min-width="100">
          <template #default="scope">
            {{ scope.row.type == 1 ? '正片' : '预览片' }}
          </template>
        </el-table-column>
        <!-- <el-table-column prop="" label="分辨率" /> -->
        <el-table-column prop="videoTime" label="视频时长" min-width="100" />
        <el-table-column prop="fileSize" label="文件大小" min-width="100" />
        <el-table-column prop="movieCode" label="视频唯一编码" min-width="150" show-overflow-tooltip />
        <el-table-column prop="localFileUrl" label="视频地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="correlationTime" label="关联时间" min-width="180" show-overflow-tooltip />
        <el-table-column v-if="state.isShow" label="操作" fixed="right" width="100">
          <template #default="scope">
            <el-popconfirm title="确认移除吗?" confirm-button-type="danger" @confirm="deleteRow(scope.row, $index)">
              <template #reference>
                <el-button text class="delColor">移除关联</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-if="state.tableData.length === 0" class="noData">
      <div class="noDataBox">
        <el-image :src="noData" alt="暂无数据" style="width: 80px" />
        <div class="noDataName">暂无数据</div>
      </div>
    </div>
    <!-- 选择视频 -->
    <VideoSelector
      v-model="state.chooseVisible"
      :type="state.type"
      :media-code="state.saveInfo.code"
      @select-callbak="selected"
    />

    <CenterModel v-model:visible="state.playModelVisible" :before-mask-close="state.beforeMaskClose">
      <!-- url="http://124.225.67.153:8086/static/video/all_data/076c06d6f0d7acdb5d2b53884044f0d54a4c35d0_1648_1859.mp4" -->
      <GVideo :url="state.videoUrl" class="center-video" />
    </CenterModel>
    <TSVideo v-model="state.tsVideoVisiable" :info="state.tsInfo" />
  </div>
</template>
<script setup>
import { reactive, watchEffect, onMounted, defineProps, defineExpose } from 'vue';
import { showMessage } from '@/utils/element-plus-message';
import { getFilesUrl } from '@/utils/common';
import noData from '@/assets/img/icon/noData.png';
import VideoSelector from './relevance-video.vue';
import CenterModel from '@/components/KJSCCmpt/VideoPlayer/CenterModel.vue';
import GVideo from '@/components/KJSCCmpt/VideoPlayer/GVideo.vue';
// import { VideoPlay } from '@element-plus/icons';
import TSVideo from '../../origin-slice-manage/modules/TSVideo.vue';

const props = defineProps({
  saveInfo: {
    type: Object
  },
  isShow: {
    type: Boolean,
    default: true
  },
  source: {
    /**
     * 1单集，2子集，3剧集
     */
    type: [String, Number],
    default: 1
  }
});
const state = reactive({
  typeData: [
    { id: 1, name: '海报' },
    { id: 2, name: '封面图' }
  ],
  source: 1,
  tableData: [],
  chooseVisible: false, // 选择视频
  type: 1, // 媒体类型 1:正片 2:预览片
  playModelVisible: false,
  videoUrl: '',
  saveInfo: {},
  beforeMaskClose(close) {
    state.videoUrl = '';
    close();
  },

  tsVideoVisiable: false,
  tsInfo: {}
});

// 关联视频 1:正片 2:预览片
const doPositive = async (val) => {
  console.log(state.tableData, 'tableData');
  if (val === 1) {
    state.type = 1;
    if (state.tableData.length > 0 && state.tableData.some((item) => item.type === 1)) {
      showMessage('只能关联一个正片', 'warning');
    } else {
      state.chooseVisible = true;
    }
  } else {
    state.type = 2;
    if (state.tableData.length > 0 && state.tableData.some((item) => item.type === 2)) {
      showMessage('只能关联一个预览片', 'warning');
    } else {
      state.chooseVisible = true;
    }
  }
};
const selected = (item) => {
  state.chooseVisible = false;
  // const data = parseUrl(item);
  console.log(item, 'select');
  item.type = state.type;

  state.tableData.push({
    localFileUrl: item.localFileUrl,
    movieName: item.name,
    type: item.type,
    videoTime: item.videoTime,
    fileSize: item.fileSize,
    movieCode: item.code
  });
  state.saveInfo.movieList = state.tableData;
};

// 删除
const deleteRow = async (val, index) => {
  console.log(val);
  state.tableData.splice(index, 1);
  state.saveInfo.movieList = state.tableData;
  showMessage('移除成功', 'success');
};

// 播放视频
const playVideo = (row, url) => {
  const index = url.lastIndexOf('.');
  const suffixVideo = url.substring(index + 1, url.length);
  if (suffixVideo === 'ts') {
    state.tsInfo = row;
    state.tsVideoVisiable = true;
  } else {
    state.videoUrl = url;
    state.playModelVisible = true;
  }
};

const handleSelectionChange = () => {};

const handlePreview = () => {};
const handleSortChange = () => {};

onMounted(() => {});

watchEffect(() => {
  state.tableData = props.saveInfo?.movieList || [];
  state.saveInfo = props.saveInfo ? props.saveInfo : {};
  state.source = props.source;
  state.isShow = props.isShow;
  console.log(state.saveInfo);
});

defineExpose({
  movieList: state.tableData
});
</script>

<style lang="less" scoped>
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

.el-table ::v-deep .img-td {
  .cell {
    display: flex;
  }
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
.noData {
  // position: absolute;
  // left: 50%;
  // top: 50%;
  // transform: translate(-50%, -50%);
  margin-top: 40%;
  .noDataBox {
    display: flex;
    flex-direction: column;
    align-items: center;
    .el-image {
      width: 100%;
    }
    .noDataName {
      color: rgb(192, 196, 204);
      font-size: 14px;
      text-align: center;
      margin: 20px 0;
    }
  }
}
</style>
