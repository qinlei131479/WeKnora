<template>
  <div class="lib-manage lib-manage2">
    <div style="height: 100%" class="flex">
      <div class="w-64 left-content border-r">
        <!-- <div class="left-content-top d-flex justify-between">
          <div class="d-flex">
            <div class="lib-title" v-if="state.isExpand">
              {{ state.libItem.name }}
            </div>
          </div>
          <div>
            <el-icon
              class="icon-pointer"
              style="margin-right: 16px"
              @click="goBack"
              ><CloseBold
            /></el-icon>
            <el-icon
              class="icon-pointer"
              v-if="state.isExpand"
              @click="changeExpand"
              ><Fold
            /></el-icon>
            <el-icon class="icon-pointer" v-else @click="changeExpand"
              ><Expand
            /></el-icon>
          </div>
        </div> -->
        <!-- <div>
          <el-button>
            <el-icon><ArrowLeft /></el-icon>返回知识库列表
          </el-button>
        </div> -->
        <div class="p-4 border-b">
          <Button variant="outline" class="w-full justify-start gap-2 text-slate-600 bg-white" @click="goBack">
            <ChevronRight class="w-4 h-4 rotate-180" />
            <span>返回知识库列表</span>
          </Button>
        </div>
        <div class="left-content-middle">
          <LibTree
            :lib-item="state.libItem"
            @batch-operation="handleBatchOperation"
            v-if="state.isExpand"
            :file-code="state.parentCode"
            :is-show-file="state.showName === 'manage'"
            @handleManage="handleManage"
            ref="libTreeRef"
            @backManage="backManage"
            :limit-info="state.limitInfo"
            @callBack="callBackLibTree"
          />
        </div>
        <div class="left-content-bottom" v-if="state.isExpand">
          <div class="p-2 border-t" v-if="!state.isBatch">
            <div class="space-y-0.5">
              <div
                :class="[
                  'flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm',
                  state.showName === 'setup' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                ]"
                @click="handleSetup"
              >
                <Settings :class="[
                  'w-4 h-4',
                  state.showName === 'setup' ? 'text-blue-600' : 'text-slate-400'
                ]" />
                <span>知识库设置</span>
              </div>
              <div
                :class="[
                  'flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm',
                  state.showName === 'recycle' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                ]"
                @click="handleRecycle"
              >
                <Trash :class="[
                  'w-4 h-4',
                  state.showName === 'recycle' ? 'text-blue-600' : 'text-slate-400'
                ]" />
                <span>回收站</span>
              </div>
            </div>
            <!-- <div
              class="operation-btn m-r-40"
              :class="{
                'is-active': state.showName == 'setup',
              }"
              @click="handleSetup"
            >
              <svg-icon icon-class="set" class="icon-operation" />
              <span>知识库设置</span>
            </div>
            <div
              class="operation-btn"
              :class="{
                'is-active': state.showName == 'recycle',
              }"
              @click="handleRecycle"
            >
              <svg-icon icon-class="recycle" class="icon-operation" />
              <span>回收站</span>
            </div> -->
          </div>
          <div class="d-flex" v-else>
            <div
              class="operation-btn m-r-40 download-btn"
              @click="batchDownload"
            >
              <span>批量下载</span>
            </div>
            <div class="operation-btn" @click="batchDelete">
              <span>批量删除</span>
            </div>
          </div>
          <!-- <el-tooltip
            class="box-item"
            effect="dark"
            content="知识库设置"
            placement="top"
          >
            <el-icon class="icon-pointer" @click="handleSetup"><Setting /></el-icon>
          </el-tooltip>
          <el-tooltip
            class="box-item"
            effect="dark"
            content="回收站"
            placement="top"
          >
            <el-icon class="icon-pointer" @click="handleRecycle"><Delete /></el-icon>
          </el-tooltip> -->
        </div>
      </div>
      <div
        class="flex-1 min-w-[0px]"
      >
        <div class="right-content">
          <div class="lib-info-manage" v-if="state.showName === 'manage'">
            <el-tree-select
              v-model="state.fileCode"
              :filter-method="remoteMethod"
              :props="{
                value: 'code',
                label: 'fileName',
                children: 'children',
              }"
              :data="state.userDataList"
              filterable
              clearable
              remote
              reserve-keyword
              default-expand-all
              style="width: 400px"
              class="selecttree"
              :popper-append-to-body="false"
              popper-class="select-popper"
              placeholder="请输入关键词搜索文件"
              @change="changeFileCode"
            />
            <!-- <el-select
              v-model="state.fileCode"
              filterable
              remote
              placeholder="请输入关键词搜索文件"
              :remote-method="remoteMethod"
              @change="selectList"
              style="width: 400px"
            >
              <el-option
                v-for="item in state.userDataList"
                :key="item.key"
                :label="item.value"
                :value="item.key"
              />
            </el-select> -->
          </div>
          <KnowledgeLibFileManage
            v-if="state.showName === 'manage'"
            :lib-item="state.libItem"
            :batchOperation="state.isBatch"
            :batchOperationList="state.batchList"
            :code="state.parentCode"
            :fileCode="state.fileCode"
            :fileName="state.fileName"
            @uploadFileFn="uploadFileFn"
            @uploadFileAll="uploadFileAll"
            @uploadReflesh="uploadReflesh"
            ref="fileManageRef"
            :limitInfo="state.limitInfo"
          />
          <KnowledgeLibSetup
            v-if="state.showName === 'setup'"
            :lib-item="state.libItem"
            @back="goBack"
          />
          <KnowledgeRecycle
            ref="recycleRef"
            v-if="state.showName === 'recycle'"
            :lib-item="state.libItem"
            @callBack="callBackRecycle"
          />
        </div>
      </div>
    </div>
    <!-- 权限文件搜索 -->
    <SearchDialog
      v-model="state.fileSearchVisible"
      :userId="state.searchUserId"
    ></SearchDialog>
  
    <!-- 删除弹窗 -->
    <RemoveFileDialog
      v-model="state.removeDialog"
      :content="state.removeContent"
      @remove="removeFile"
    />
    <!-- 上传弹窗 -->
    <DownloadDialog
      ref="downloadDialogRef"
      @changeUploadStatus="changeUploadStatus"
      @reTry="reTry"
    />
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
import Button from '@/components/ui/Button.vue'
import { Folder, Plus, ChevronRight, Settings, Trash, UploadCloud } from 'lucide-vue-next'

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
const uploadReflesh = () => {};
const callBackRecycle = () => {
  libTreeRef.value.getList();
};
const callBackLibTree = () => {
  if(state.showName == 'manage'){
    fileManageRef.value.getList();
  }
  if(state.showName == "recycle"){
    recycleRef.value.getList();
  }
  libTreeRef.value.getList();
};
onMounted(() => {
  // getLibDetail();
});
</script>
<style lang="scss" scoped>
.lib-manage {
  // padding: 0px 0px 0px 32px;
  // height: calc(100vh - 66px);
  box-sizing: border-box;
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
  display: flex;
  flex-direction: column;
  // padding-right: 24px;
  // padding-top: 16px;
  box-sizing: border-box;
  // padding-bottom: 32px;
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
  margin-top: 24px;
  flex: 1;
  margin-bottom: 10px;
}
.right-content {
  width: 100%;
  height: 100%;
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
.selecttree .el-tree-node:focus > .el-tree-node__content {
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
