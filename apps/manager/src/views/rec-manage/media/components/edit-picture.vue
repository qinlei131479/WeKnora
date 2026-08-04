<template>
  <div>
    <el-form v-if="state.isShow" ref="searchForm" :model="state.saveimgInfo" :rules="state.rules">
      <el-form-item label="添加图片" prop="pictureType" style="height: 32px">
        <el-select
          v-model="state.saveimgInfo.pictureType"
          placeholder="请选择图片类型"
          style="width: 180px; margin-right: 10px"
          clearable
        >
          <el-option
            v-for="item in state.typeData"
            :key="item.dictValue"
            :label="item.dictLabel"
            :value="item.dictValue"
          >
          </el-option>
        </el-select>
        <!-- <el-button type="primary" @click="choosePicture">选择图片</el-button> -->
        <KJSCUploadSingleFile
          v-if="state.saveimgInfo.pictureType"
          style="display: inline-block"
          :type="'img'"
          :accept="['png', 'jpeg', 'jpg', 'gif', 'PNG', 'JPEG', 'JPG']"
          :action="uploadFilePhoto"
          :file-size="state.fileSize"
          @handle-success="handleSuccess"
        >
          <template #btn>
            <el-button type="primary">本地上传</el-button>
          </template>
        </KJSCUploadSingleFile>
        <el-button v-else type="primary" @click="uploadLocal">本地上传</el-button>
        <span class="notice" style="white-space: nowrap">支持图片格式: .jpg/.png/.gif 图片大小不超过500kb</span>
      </el-form-item>
    </el-form>
    <div v-if="state.tableData.length != 0" style="width: 100%">
      <el-table
        ref="multipleTable"
        :key="state.itemKey"
        class="table"
        :data="state.tableData"
        width="100%"
        @selection-change="handleSelectionChange"
        @row-click="handlePreview"
      >
        <el-table-column prop="type" label="类型">
          <template #default="scope">
            <!-- <div>{{scope.row.typeName}}</div> -->
            <div>{{ getTypeName(scope.row.type) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="fileURL" label="图片" width="100">
          <template #default="scope">
            <!-- :src="url"
            :preview-src-list="srcList" -->
            <!-- <el-image
              style="width: 50px; height: 50px"
              :src="getFilesUrl(scope.row.localFileUrl)"
              :zoom-rate="1.2"
              :preview-src-list="[getFilesUrl(scope.row.localFileUrl)]"
              :initial-index="4"
              :preview-teleported="true"
              fit="cover"
              preview-teleported
            /> -->
            <KJSCImagePreview :url="scope.row.localFileUrl" />
          </template>
        </el-table-column>
        <el-table-column prop="sequence" label="排序权重">
          <template #default="scope">
            <KJSCTableInput
              v-if="state.isShow"
              v-model="scope.row.sequence"
              :value="scope.row.sequence"
              @on-change="orderNoChanged($event, scope.row)"
            />
            <span v-else>{{ scope.row.sequence }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="resolution" label="尺寸(px)" />
        <el-table-column prop="fileSize" label="大小(kb)" />
        <el-table-column v-if="state.isShow" label="操作" fixed="right">
          <template #default="scope">
            <el-popconfirm
              title="确认删除吗?"
              confirm-button-type="danger"
              @confirm="deleteRow(scope.row, scope.$index)"
            >
              <template #reference>
                <el-button text class="delColor">删除</el-button>
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
    <!-- <KJSCPagination
      @change="handlePageChange"
      :total="state.pageInfo.total"
      :page="state.pageInfo.page"
    /> -->

    <!-- 选择图片 -->
    <!-- <ImgSelector v-model="state.chooseVisible" @selectCallbak="selected" /> -->
  </div>
</template>
<script setup>
import { ref, reactive, watchEffect, onMounted, defineProps, defineExpose } from 'vue';
import noData from '@/assets/img/icon/noData.png';
// import { getFilesUrl } from '@/utils/common';
import api, { uploadFilePhoto } from '@/utils/api';
import { getPage } from '@/components/KJSCCmpt/KJSCPagination.vue';
import KJSCTableInput from '@/components/KJSCCmpt/KJSCTableInput.vue';
import { positiveIntegerReg } from '@/utils/validate';
import { showMessage } from '@/utils/element-plus-message';
import KJSCUploadSingleFile from '@/components/KJSCCmpt/KJSCUploadSingleFile2.vue';
import { ElMessage } from 'element-plus';
import KJSCImagePreview from '@/components/KJSCCmpt/KJSCImagePreview.vue';
const emits = defineEmits(['returnData']);

const props = defineProps({
  dataId: {
    type: [String, Number]
  },
  isShow: {
    type: Boolean,
    default: true
  },
  source: {
    /**
     * 1单集，2子集，3剧集,4,频道，5假节日管理
     */
    type: [String, Number],
    default: 1
  },
  saveInfo: {
    type: [Object]
  },
  categoryCode: {
    // 媒资编排过来的
    type: String
  }
});
const searchForm = ref(null);
const state = reactive({
  fileSize: 0.5,
  saveimgInfo: {},
  isShow: true, // 是否显示查询条件
  pageInfo: { page: getPage(), total: 0 },
  typeData: [],
  tableData: [],
  saveInfo: {},
  itemKey: 0,
  rules: {
    pictureType: [
      {
        required: true,
        message: '请选择图片类型',
        trigger: ['change']
      }
    ]
  },
  chooseVisible: false // 选择图片
});
// 获取图片类型
const getPictureType = async () => {
  await api.dict.getDicByType('picture_type').then((res) => {
    state.typeData = res.data;
  });
};
// 选择图片
// const choosePicture = async () => {
//   searchForm.value.validate((val) => {
//     console.log(val);
//     if (val) {
//       state.chooseVisible = true;
//     }
//   });
// };
// const selected = (item) => {
//   state.chooseVisible = false;
//   // const data = parseUrl(item);
//   console.log(item);
// };

// 本地上传
const uploadLocal = async () => {
  searchForm.value.validate((val) => {
    console.log(val);
    // if (!val) {
    // }
  });
};
const getTypeName = (id) => {
  const item = state.typeData.filter((res) => {
    return res.dictValue === id + '';
  });
  if (item.length > 0) {
    return item[0].dictLabel;
  }
  return '';
};
// 本地上传
const handleSuccess = async (res) => {
  if (res[0].response.code !== 200) {
    ElMessage.error(res[0].response.msg);
    return;
  }
  const data = res[0].response.data;
  state.tableData.unshift({
    fileSize: data.fileSize,
    localFileUrl: data.url,
    pictureCode: data.code,
    sequence: '0',
    type: state.saveimgInfo.pictureType,
    resolution: data.resolution
  });
  state.itemKey++;
  state.saveInfo.pictureList = state.tableData;
  console.log('handleSuccess');
  // 从授权频道过来需要在图片上传成功后，多调一个接口
  if (props.source === 4) {
    updaloadPhoto(data);
  }
};

const updaloadPhoto = async (res) => {
  const params = {
    code: res.code,
    fileSize: res.fileSize,
    localFileUrl: res.url,
    resolution: res.resolution
  };
  const data = await api.televisionManage.updaloadPhoto(params);
  console.log(data);
};
const handleSelectionChange = () => {};

const handlePreview = () => {};
// 获取table数据
const getTableData = async (isReset) => {
  if (isReset) {
    state.pageInfo.page.resetPageNo();
  }
  if (props.source === 3) {
    const param = { seriesCode: state.dataId };
    api.mediaCapital.conSeriesPicturelist(param, state.pageInfo.page, state.sortInfo).then((res) => {
      state.tableData = res.data;
      state.saveInfo.pictureList = state.tableData;
    });
  } else {
    const params = { programCode: state.dataId };
    api.mediaCapital.picturelist(params, state.pageInfo.page, state.sortInfo).then((res) => {
      state.tableData = res.data;
      state.saveInfo.pictureList = state.tableData;
    });
  }
};

// 分页
// const handlePageChange = () => {
//   getTableData();
// };
// 删除
const deleteRow = async (val, index) => {
  console.log(val);
  state.tableData.splice(index, 1);
  state.saveInfo.pictureList = state.tableData;
  // showMessage(operationMessage.deleteMessage, "success");
};

// 设置排序
const orderNoChanged = async ({ value, resetValue }, row) => {
  // if (!row.id) {
  //   return;
  // }
  if (value) {
    row.sequence = value;
    const b = positiveIntegerReg.test(value);
    if (b) {
      // const id = row.id;
      // const params = {
      //   id,
      //   sequence: value
      // };
      // console.log(params);
      // await api.mediaCapital.updatePictureSequence(params);
      // row.sequence = value; // 改变数据源
    } else {
      showMessage('权重必须为正整数', 'warning');
      resetValue();
    }
  }
};

/**
 * 编辑的时候返回图片列表
 * 原因：在父级编辑时pictureRef.value.pictureList取不到数据
 */
const returnPictureListFun = () => {
  emits('returnData', state.tableData);
};

watchEffect(() => {
  state.saveInfo = props.saveInfo ? props.saveInfo : {};
});
onMounted(() => {
  getPictureType();
});

watchEffect(() => {
  state.dataId = props.dataId;
  state.isShow = props.isShow;
  console.log(props.isShow, state.isShow);
});

watchEffect((onInvalidate) => {
  // 异步api调用，返回一个操作对象
  if (props.dataId) {
    if (props.source === 4 || props.source === 5) {
      if (
        state.saveInfo.pictureList !== null &&
        state.saveInfo.pictureList !== '' &&
        state.saveInfo.pictureList !== undefined
      ) {
        state.tableData = state.saveInfo.pictureList;
      }
    } else {
      getTableData();
    }
  }
  console.log(props.categoryCode);
  if (props.categoryCode) {
    api.conCategoryPicture
      .list({ categoryCode: props.categoryCode })
      .then((res) => {
        state.tableData = res.data;
      })
      .catch((err) => {
        console.log(err);
        state.tableData = [];
      });
  }
  onInvalidate(() => {
    // 取消异步api的调用。
    // apiCall && apiCall.cancel();
  });
});

defineExpose({
  pictureList: state.tableData,
  returnPictureListFun
});
</script>

<style lang="less" scoped>
.notice {
  color: #9a9a9a;
  font-size: 12px;
  margin-left: 20px;
}
/deep/ .el-form-item__content {
  display: flex;
  align-items: center;
  justify-content: start;
}
/deep/ .el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label:before {
  content: '';
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
