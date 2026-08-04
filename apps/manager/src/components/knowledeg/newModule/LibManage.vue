<template>
  <div class="lib-manage lib-manage1 default-bg">
    <page-layout gap="20">
      <template #start>
        <SubPageHeader back :title="state.libItem?.name" :desc="state.libItem?.description">
          <div v-if="state.showName == 'manage'" class="top-right-ops">
            <el-input v-model="state.queryParams.keyword" placeholder="搜索当前目录下的物理文件..." clearable
              :suffix-icon="SearchIcon" @keyup.enter="getList" class="mp__search-input small" />
            <btn type="primary" @click="trigeUpload" round>
              <svg-icon icon-class="upload"></svg-icon> 上传本地文档
            </btn>
          </div>
        </SubPageHeader>
      </template>
      <page-layout row gap="20">
        <template #start>
          <div class="left-content">
            <!-- <div class="p-4 border-b">
              <Button variant="outline" class="w-full justify-start gap-2 text-slate-600 bg-white" @click="goBack">
                <ChevronRight class="w-4 h-4 rotate-180" />
                <span>返回知识库列表</span>
              </Button>
            </div> -->
            <div class="left-content-middle px-2 space-y-0.5">
              <LibTree :lib-item="state.libItem" @batch-operation="handleBatchOperation" v-if="state.isExpand"
                :file-code="state.parentCode" :is-show-file="state.showName === 'manage'" @handleManage="handleManage"
                ref="libTreeRef" @backManage="backManage" :limit-info="state.limitInfo" @callBack="callBackLibTree" />
            </div>
            <div class="left-content-bottom" v-if="state.isExpand">
              <div class="bottom-btns" v-if="!state.isBatch">
                <div class="space-y-0.5">
                  <div :class="[
                    'bottom-btn flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm',
                    state.showName === 'setup' ? 'active' : ''
                  ]" @click="handleSetup">
                    <Settings class="w-4 h-4" />
                    <span>知识库设置</span>
                  </div>
                  <div :class="[
                    'bottom-btn flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm',
                    state.showName === 'recycle' ? 'active' : ''
                  ]" @click="handleRecycle">
                    <Trash class="w-4 h-4" />
                    <span>回收站</span>
                  </div>
                </div>

              </div>
              <div class="d-flex" v-else>
                <div class="operation-btn m-r-40 download-btn" @click="batchDownload">
                  <span>批量下载</span>
                </div>
                <div class="operation-btn" @click="batchDelete">
                  <span>批量删除</span>
                </div>
              </div>

            </div>
          </div>
        </template>
        <div class="h-full flex-1 min-w-[0px] overflow-hidden">
          <div class="right-content">
            <KnowledgeLibFileManage v-if="state.showName === 'manage'" :lib-item="state.libItem"
              :batchOperation="state.isBatch" :batchOperationList="state.batchList" :code="state.parentCode"
              :fileCode="state.fileCode" :fileName="state.fileName" @uploadFileFn="uploadFileFn"
              @uploadFileAll="uploadFileAll" @uploadReflesh="uploadReflesh" @parentCode="changeParentCode"
              ref="fileManageRef" :limitInfo="state.limitInfo" />
            <KnowledgeLibSetup v-if="state.showName === 'setup'" :lib-item="state.libItem" @back="goBack" />
            <KnowledgeRecycle ref="recycleRef" v-if="state.showName === 'recycle'" :lib-item="state.libItem"
              @callBack="callBackRecycle" />
          </div>
        </div>
        <template #end>
          <div style="width:60px;"></div>
        </template>
      </page-layout>
      <template #end>
        <div></div>
      </template>
    </page-layout>
    <div>
      <!-- 权限文件搜索 -->
      <SearchDialog v-model="state.fileSearchVisible" :userId="state.searchUserId"></SearchDialog>

      <!-- 删除弹窗 -->
      <RemoveFileDialog v-model="state.removeDialog" :content="state.removeContent" @remove="removeFile" />
      <!-- 上传弹窗 -->
      <DownloadDialog ref="downloadDialogRef" @changeUploadStatus="changeUploadStatus" @reTry="reTry" />
    </div>
  </div>
</template>

<script setup name="KnowledgeLibManage">
import KnowledgeLibFileManage from "./LibFileManage.vue";
import KnowledgeLibSetup from "./Setup.vue";
import KnowledgeRecycle from "./RecycleList.vue";
import LibTree from "../component/LibTree.vue";
import SearchDialog from "../component/SearchDialog.vue";
import RemoveFileDialog from "../component/RemoveFileDialog.vue";
import DownloadDialog from "../component/downloadDialog.vue";
// import FileTreeSelect from "../component/FileTreeSelect.vue";
import SubPageHeader from "@/components/page/SubPageHeader.vue";

import Button from '@/components/ui/Button.vue'
import { Folder, Plus, ChevronRight, Settings, Trash, UploadCloud } from 'lucide-vue-next'
import { Search as SearchIcon } from '@element-plus/icons-vue'

import {
  querySearchTreeList,
  delBatchLibFileApi,
  getLibApi,
  getFileConfig,
  batchDownloadUrl,
} from "@/api/knowledge/knowledgeApi";
import { onMounted } from "vue";
const props = defineProps({
  libItem: {
    type: Object,
  },
  rightType: {
    type: String,
    default: "manage",
  },
});
const emit = defineEmits(["back"]);
const { proxy } = getCurrentInstance();
const downloadDialogRef = ref(null);
const fileManageRef = ref(null);
const libTreeRef = ref(null);
const recycleRef = ref(null);
const state = reactive({
  libItem: props.libItem,
  showName: props.rightType,
  isExpand: true,
  isBatch: false,
  batchList: [],

  fileCode: "",
  fileName: '',
  fileSearchVisible: false,
  userDataList: [],

  removeDialog: false,
  removeContent: "",
  flieData: [],
  parentCode: "",
  limitInfo: {
    maxLevel: -1,
    maxFolder: -1,
    maxSize: -1,
  },
  docCount: 0,
  queryParams: {
    keyword: '',
  }
});
const uploadFileFn = (flie, percent, str, index) => {
  downloadDialogRef.value.uploadFile(flie, percent, str, index);
};
const uploadFileAll = (flieList) => {
  downloadDialogRef.value.uploadFileAll(flieList);
};
const changeUploadStatus = (type) => {
  fileManageRef.value.changeUploadStatus(type);
  // remoteMethod('');
};
const reTry = (row) => {
  fileManageRef.value.reTry(row);
}
/** 远程搜索 */
const remoteMethod = async (keyWord) => {
  let res = await querySearchTreeList(state.libItem.id, keyWord);
  if (res.code === 200) {
    state.userDataList = res.data;
  }
};
/** 查详情 */
const getLibDetail = async () => {
  try {
    let res = await getFileConfig();
    if (res.code === 200) {
      const data = res.data;
      state.limitInfo = {
        maxLevel: data.maxLevel,
        maxFolder: data.maxFolder,
        maxSize: data.maxSize,
      };
    }
  } catch (error) {
    // console.log(error)
  }
};

const selectList = (userId) => {
  // 打开弹框
  state.fileSearchVisible = true;
  state.searchUserId = userId;
  state.fileCode = "";
};

const goBack = () => {
  console.log('go back')
  emit("back");
};

const changeExpand = () => {
  state.isExpand = !state.isExpand;
};

const handleSetup = () => {
  state.showName = "setup";
};

const handleRecycle = () => {
  state.showName = "recycle";
};
const backManage = () => {
  state.showName = "manage";
};
const handleManage = (row) => {
  console.log('handle manage', row)
  if (row.code != state.parentCode) {
    state.fileCode = "";
  }
  state.parentCode = row.code;
  state.fileName = row.fileName
  state.showName = "manage";
};
// 批量操作回调
const handleBatchOperation = (list, isBatch) => {
  state.isBatch = isBatch;
  state.batchList = list;
};

// 批量下载
const batchDownload = () => {
  const ids = state.batchList.map((item) => item.id);
  const params = {
    dataList: ids,
  };
  proxy.postDownload2(
    batchDownloadUrl + state.libItem.id,
    params,
    `${state.libItem.name}_${new Date().getTime()}.zip`
  );
};
const changeFileCode = (value) => {
  if (value) {
    const selectedNode = findNodeById(state.userDataList, value);
    state.parentCode = selectedNode.parentCode;
  }
};
const changeParentCode = (value) => {
  if (value) {
    state.parentCode = value;
  }
};
function findNodeById(nodes, code) {
  for (const node of nodes) {
    if (node.code === code) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(node.children, code);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
// 批量删除
const batchDelete = () => {
  state.removeDialog = true;
  state.removeContent = `是否批量删除选中文件`;
};

const removeFile = () => {
  const ids = state.batchList.map((item) => item.id);
  delBatchLibFileApi(state.libItem.id, { dataList: ids }).then((res) => {
    if (res?.code === 200) {
      proxy.$modal.msgSuccess("删除成功");
    }
    libTreeRef.value.getList();
  });
};
const uploadReflesh = () => { };
const callBackRecycle = () => {
  libTreeRef.value.getList();
};
const callBackLibTree = () => {
  if (state.showName == 'manage') {
    fileManageRef.value.getList();
  }
  if (state.showName == "recycle") {
    recycleRef.value.getList();
  }
  libTreeRef.value.getList();
};
const getList = () => {
  if (state.showName == 'manage') {
    fileManageRef.value.searchByWord(state.queryParams.keyword);
  }
};
const trigeUpload = () => {
  if (state.showName == 'manage') {
    fileManageRef.value.trigeUpload();
  }
};
onMounted(() => {
  // getLibDetail();
});
</script>
<style lang="scss" scoped>
.lib-manage {
  height: 100%;
}

.d-flex {
  display: flex;
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.justify-around {
  justify-content: space-around;
}

.icon-pointer {
  cursor: pointer;
  width: 18px;
  height: 26px;
  font-size: 18px;
  color: #666666;
}

.lib-title {
  margin-right: 5px;
  font-weight: bold;
  font-size: 18px;
  color: #333333;
}

.left-content {
  height: 100%;
  width: 280px;
  display: flex;
  flex-direction: column;
  // padding-right: 24px;
  // padding-top: 16px;
  box-sizing: border-box;
  // padding-bottom: 32px;
  margin-left: 40px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 24px;
}

.left-content-top {
  height: 26px;
  width: 100%;
}

.left-content-bottom {
  // height: 40px;
  width: 100%;
  line-height: 40px;
  margin-top: auto;
}

.left-content-middle {
  width: 100%;
  overflow-y: auto;
  align-self: center;
  // margin-top: 24px;
  flex: 1;
  // margin-bottom: 10px;
}

.right-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.operation-btn {
  width: 180px;
  height: 38px;
  background: #ffffff;
  border-radius: 8px 8px 8px 8px;
  border: 1px solid #bbbbbb;
  font-weight: 400;
  font-size: 14px;
  color: #666666;
  text-align: center;
  line-height: 38px;
  cursor: pointer;
}

.download-btn {
  background: #236fd2;
  color: #ffffff;
  border: 1px solid #236fd2;
}

.icon-operation {
  width: 14px;
  height: 14px;
  margin-right: 4px;
}

.m-r-40 {
  margin-right: 40px;
}

.is-active {
  border-color: #236fd2;
  color: #236fd2;
  fill: #236fd2 !important;
}

.lib-info-manage {
  width: 100%;
  margin-left: 32px;
  margin-bottom: 32px;
}

.bottom-btns {
  padding: 20px;
  margin-bottom: 12px;
  border-top: 1px solid #E1E6EC;
}

.bottom-btn {
  &.active {
    color: var(--el-color-primary);
    background: #EBF3F5;
    border-radius: 12px 12px 12px 12px;
  }

  &:hover {
    color: var(--el-color-primary)
  }
}

.top-right-ops {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 20px;
}
</style>
<style>
.selecttree .el-select-dropdown__item.hover,
.el-select-dropdown__item:hover {
  background: rgba(35, 111, 210, 0.1);
}

.selecttree .el-tree-node__content:hover {
  background-color: rgba(35, 111, 210, 0.1);
  /* border-radius: 8px 8px 8px 8px; */
}

.selecttree .el-tree-node:focus>.el-tree-node__content {
  background: none;
}

.selecttree .el-tree-node__content {
  height: 36px;
  border-bottom: 1px solid #f1f1f1;
  font-size: 14px;
}

.lib-manage .el-select-dropdown {
  padding: 8px 16px 16px 16px;
}
</style>
