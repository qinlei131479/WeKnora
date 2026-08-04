<template>
  <div class="lib-file-manage">
    <page-layout gap="20">
      <template #start>
        <div class="lib-folder-upload">
          <FileUploadDd @uploadFile="uploadFile" :libItem="props.libItem" @uploadFileAll="uploadFileAll"
            ref="fileUploadRef" :limitInfo="state.limitInfo" @reflesh="reflesh" :parentCode="state.code" />
        </div>
      </template>
      <div class="flex-1 lib-folder-table">
        <div class="h-full overflow-auto">
          <el-table v-loading="state.loading" :data="state.folderList" class="overflow-hidden" height="100%"
            @row-click="handleRowClick">
            <template #empty>
              <kjsc-empty :image-size="320"></kjsc-empty>
            </template>
            <el-table-column prop="fileName" label="文件名" :show-overflow-tooltip="true" min-width="150">
              <template #default="scope">
                <svg-icon :icon-class="getIconByFileType(checkFileType(scope.row))" class="folder-icon" />
                <span style="color: #3297A0">{{ scope.row.fileName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="versionCode" label="版本号" align="center" width="80"></el-table-column>
            <!-- <el-table-column label="使用状态" align="center">
                <template #default="scope">
                  <el-switch
                    :disabled="scope.row.enabled == 2"
                    v-model="scope.row.showEnabled"
                    :active-value="0"
                    :inactive-value="1"
                    @change="changeStatus(scope.row)"
                  ></el-switch>
                </template>
              </el-table-column> -->
            <el-table-column label="状态" align="center" width="250" show-overflow-tooltip>
              <template #default="scope">
                <span :class="{
                  'parse-status-success': scope.row.parseStatus == '解析完成'
                }">
                  {{ scope.row.parseStatus }}
                </span>
                <!-- <span v-if="scope.row.fileStatus === FileStatus.NONE">已上传，待 Markdown 转换</span>
                  <span v-else-if="scope.row.fileStatus === FileStatus.TRANSFORM">转换Markdown完成</span>
                  <span v-else-if="scope.row.fileStatus === FileStatus.RAGFLOW_UPLOAD">Ragflow上传成功</span>
                  <span v-else-if="scope.row.fileStatus === FileStatus.PARSE_SUCCESS">解析成功</span>
                  <span v-else-if="scope.row.fileStatus === FileStatus.FAILED">解析失败</span> -->
              </template>
            </el-table-column>
            <!-- <el-table-column
                prop="ragFileChunkCount"
                label="切片"
                width="100"
                align="center"
              ></el-table-column> -->
            <el-table-column prop="fileSize" label="大小" width="120" align="center">
              <template #default="scope">
                {{ formatSize(scope.row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column prop="updateTime" label="同步时间" width="160" align="center">
              <template #default="scope">
                {{ parseTime(scope.row.updateTime || scope.row.createTime) }}
              </template>
            </el-table-column>
            <!-- <el-table-column
                prop="parseStatus"
                label="解析状态"
                min-width="200"
                header-align="center"
                align="center"
              >
                <template #default="scope">
                  <svg-icon
                    v-if="scope.row.uploadRagStatus === 7"
                    icon-class="retry"
                    @click="retryClick(scope.row)"
                    style="width: 16px; height: 16px; margin-right: 6px"
                  />
                  <span
                    :style="{
                      color: scope.row.uploadRagStatus === 7 ? '#E35D5D' : '',
                    }"
                  >
                    {{ scope.row.parseStatus }}
                  </span>
                </template>
              </el-table-column> -->
            <el-table-column align="center" label="操作" class-name="small-padding fixed-width" width="160">
              <template #default="scope">
                <div class="flex justify-around align-center">
                  <button size="small" text class="preview-btn hover:underline cursor-pointer">预览/说明</button>
                  <el-popover placement="right-start" :popper-style="{
                    width: '88px',
                    minWidth: '88px',
                    padding: '0',
                    borderRadius: '8px',
                  }" trigger="hover" effect="dark">
                    <div class="table-operate-btns">
                      <!-- <el-button
                          size="small"
                          text
                          @click="memberManagerHandle(scope.row)"
                          >成员管理</el-button
                        > -->
                      <el-button size="small" text @click="downloadHandle(scope.row)">下载</el-button>
                      <el-button size="small" text @click="removeHandle(scope.row)">删除</el-button>
                      <el-button size="small" text @click="renameHandle(scope.row)">重命名</el-button>
                    </div>
                    <template #reference>
                      <el-icon style="cursor: pointer">
                        <More />
                      </el-icon>
                    </template>
                  </el-popover>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <!-- <kjsc-pagination
            v-show="state.total > 0"
            :total="state.total"
            :page="{
              pageNum: state.queryParams.pageNum,
              pageSize: state.queryParams.pageSize,
            }"
            @change="handlePageChange"
            style="padding-top: 16px"
          /> -->
      </div>
    </page-layout>


    <!-- 添加或修改菜单对话框 -->
    <KJSCDialogV2 :title="state.title" v-model="state.open" width="852px" append-to-body closeBtnText="关闭"
      :showSubitBtn="false">
      <MemberList :fileId="state.memberListFileId" />
    </KJSCDialogV2>

    <!-- 删除弹窗 -->
    <RemoveFileDialog v-model="state.removeDialog" :content="state.removeContent" @remove="removeFile" />
    <!-- 添加文件夹对话框 -->
    <FlieNameDialog v-model="state.flieDialog" :file-operate-title="'重命名'" :params="state.fileNameParams"
      @done="handleCancel" @append="submitAddFolder" />
    <!-- 文件预览弹窗 -->
    <FilePreviewDrawer v-model="state.previewDialog" :selected-doc="state.selectedDoc" />
  </div>
</template>

<script setup name="KnowledgeLibFileManage">
import { ElMessageBox } from "element-plus";
import {
  FileStatus,
  listLibFileList,
  delLibFileApi,
  renameFileApi,
  batchUpdateLibFileStatusApi,
  reparseFile,
} from "@/api/knowledge/knowledgeApi";
import KJSCDialogV2 from "@/components/KJSCCmpt/KJSCDialogV2.vue";
import RemoveFileDialog from "../component/RemoveFileDialog.vue";
import MemberList from "../component/MemberList.vue";
import { download, downloadFile } from "@/utils/common";
import { getToken } from "@/utils/auth";
import { fileTypeArr, getIconByFileType } from "../constance.js";
import FlieNameDialog from "../component/FlieNameDialog.vue";
import FileUploadDd from "../component/FileUpload2.vue";
import LibFileManageRight from "../component/LibFileManageRight.vue";
import FilePreviewDrawer from "../component/FilePreviewDrawer.vue";



import FileTreeSelect from "../component/FileTreeSelect.vue";
import Button from '@/components/ui/Button.vue'
import { Folder, Plus, ChevronRight, Settings, Trash, UploadCloud } from 'lucide-vue-next'
import { Search as SearchIcon } from '@element-plus/icons-vue'

import { onMounted } from "vue";
const props = defineProps({
  libItem: {
    type: Object,
  },
  code: {
    type: String,
    default: "",
  },
  fileCode: {
    type: String,
    default: "",
  },
  fileName: {
    type: String,
    default: ''
  },
  // 是否批量操作
  batchOperation: {
    type: Boolean,
    default: false,
  },
  // 批量操作列表
  batchOperationList: {
    type: Array,
    default: () => [],
  },
  limitInfo: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits([
  "back",
  "uploadFileFn",
  "uploadFileAll",
  "uploadReflesh",
  "parentCode",
]);
const { proxy } = getCurrentInstance();

const importUrl =
  import.meta.env.VITE_APP_BASE_API + "/work/ragFileDecompressionTask/upload"; // 文件上传
const headers = ref({ Authorization: "Bearer " + getToken() });
const state = reactive({
  memberListFileId: "",
  queryParams: {
    // pageNum: 1,
    // pageSize: 10,
    keyword: '',
  },
  fileList: [],
  total: 0,
  flieDialog: false,
  fileNameParams: {},
  // 文件夹列表
  folderList: [],
  // 文件类型
  accept: fileTypeArr,

  title: "",
  open: false,
  loading: true,

  removeDialog: false,
  removeContent: "",
  removeObj: {},
  code: "",
  fileCode: "",
  limitInfo: {},

  selectedDoc: null,
  previewDialog: false,
});
function formatSize(size) {
  if (!size) return '0'
  const units = ['B', 'KB', 'MB', 'GB']
  let unitIndex = 0
  let s = size
  while (s >= 1024 && unitIndex < units.length - 1) {
    s /= 1024
    unitIndex++
  }
  return `${s?.toFixed(2)} ${units[unitIndex]}`
}
const changeParentCode = (value) => {
  emit('parentCode', value);
};
const fileUploadRef = ref(null);
const uploadFile = (flie, percent, str, index) => {
  emit("uploadFileFn", flie, percent, str, index);
};
const uploadFileAll = (flieList) => {
  emit("uploadFileAll", flieList);
};
const checkFileType = (row) => {
  const flieArr = row.fileName.split(".");
  const type = flieArr[flieArr.length - 1];
  return type;
};
const changeUploadStatus = (type) => {
  fileUploadRef.value.changeUploadStatusFn(type);
};
const reTry = (row) => {
  fileUploadRef.value.reTryFn(row);
}
const trigeUpload = () => {
  fileUploadRef.value.trigeUpload();
}
const retryClick = (row) => {
  reparseFile([row.id]).then((res) => {
    proxy.$modal.msgSuccess("重新解析任务提交成功");
  });
};
// 分页器触发
const handlePageChange = ({ page, type }) => {
  state.queryParams.pageNum = page.pageNum;
  state.queryParams.pageSize = page.pageSize;
  getList();
};
const submitAddFolder = async () => {
  handleCancel();
  getList();
};

let uploadTimer = null;
const reflesh = () => {
  console.log('refresh')
  // emit('uploadReflesh')
  state.loading = true
  clearTimeout(uploadTimer)
  uploadTimer = setTimeout(() => {
    getList();
  }, 2000);
};
const handleCancel = () => {
  state.flieDialog = false;
  state.fileNameParams = {};
};
/** 查询菜单列表 */
const getList = async () => {
  console.log('getttttttttt')
  state.loading = true;
  const params = {
    ...state.queryParams,
    knowledgeId: props.libItem?.id,
    code: state.code,
    fileCode: state.fileCode,
  };
  listLibFileList(params).then((res) => {
    if (res.code === 200) {
      res.data?.forEach((x) => {
        x.showEnabled = x.enabled;
      });
      state.folderList = res.data;
      // state.selectedDoc = res.data[0];
      // state.total = +res.total || 0;
      state.total = res.data?.length || 0;
      state.loading = false;
    } else {
      state.loading = false;
      proxy.$modal.msgError(res.msg);
    }
  }, () => {
    state.loading = false;
  });
};

const searchByWord = (keyword) => {
  state.queryParams.keyword = keyword;
  getList();
}

defineExpose({
  uploadFile,
  trigeUpload,
  changeUploadStatus,
  getList,
  searchByWord,
  reTry
});
// 成员权限
function memberManagerHandle(row) {
  state.open = true;
  state.title = "查看成员及权限";
  state.memberListFileId = row.id || row.menuId;
}

// 下载
function downloadHandle(row) {
  console.log(row.fileName)
  downloadFile(row.filePath, row.fileName);
}

// 删除
function removeHandle(row) {
  state.removeDialog = true;
  state.removeContent = `是否删除文件 【${row.fileName}】`;
  state.removeObj = row;
}
const removeFile = () => {
  delLibFileApi(state.removeObj.id).then((res) => {
    if (res?.code === 200) {
      proxy.$modal.msgSuccess("删除成功");
    }
    getList();
  });
};

// 重命名
function renameHandle(row) {
  state.flieDialog = true;
  state.fileNameParams = {
    id: row.id,
    fileName: row.fileName,
  };
}

/**
 * 修改状态
 */
const changeStatus = (row) => {
  if (row.enabled == 2) {
    // 强制停用的不能修改
    // 渲染的时候组件会将2改为1, 这儿需要处理
    return;
  }
  batchUpdateLibFileStatusApi([row.id], row.showEnabled).then((res) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(
        (row.showEnabled == 0 ? "启用" : "停用") + "成功"
      );
      getList();
    }
  });
};

// 导入
const handleAvatarSuccess = (res) => {
  if (res.code === 200) {
    proxy.$modal.msgSuccess("导入成功");
    getList();
  } else {
    proxy.$modal.msgError("导入失败，" + res.msg);
  }
  state.fileList = [];
};
const handleAvatarError = (res) => {
  if (res.code !== 200) {
    proxy.$modal.msgError(res.msg);
  }
  state.fileList = [];
};
const handleChangeUpload = (file, files) => {
  if (!file) return;
  // console.log('文件上传');
};
// const beforeAvatarUpload = (file,files) => {
//   debugger
// console.log('文件上传');
// };
// 覆盖前一个文件
const handleExceed = (files) => {
  upload.value.clearFiles();
  const file = files[0];
  file.uid = genFileId();
  upload.value.handleStart(file);
};
// 点击行
const handleRowClick = (row) => {
  state.selectedDoc = row;
  state.previewDialog = true;
};
watchEffect(() => {
  if (props.code != state.code || props.fileCode != state.fileCode) {
    state.code = props.code;
    state.fileCode = props.fileCode;
    getList();
  }
  state.limitInfo = props.limitInfo;
});
onMounted(() => {
  getList();
});
</script>
<style lang="scss" scoped>
.search-input {
  width: 300px;
  --el-input-inner-height: 36px;
}

.lib-file-manage {
  width: 100%;
  height: 100%;
  // height: calc(100% - 32px);
  // padding: 0 32px;
  // box-sizing: border-box;
  // background: #ffffff;
  // display: flex;
  // flex-direction: column;
  overflow: hidden;
}

.lib-name {
  font-size: 30px;
  margin-bottom: 8px;
  font-weight: 400;
  font-size: 24px;
  color: #333333;
}

.lib-info {
  width: 100%;
  height: 60px;
  margin: 0 0 24px 0;
  font-weight: 400;
  font-size: 14px;
  color: #666666;
}

.lib-folder-upload {
  width: 100%;
  //height: 109px;
}

.lib-folder-table {
  width: 100%;
  height: 100%;
  // max-height: 480px;
  overflow: hidden;
}

.folder-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.parse-status-success {
  color: #29B276;
}

.el-table {
  border-radius: 24px;

  :deep(thead) {
    th {
      background-color: #fff !important;
    }

    // .cell {
    //   line-height: 43px;
    // }
  }

  :deep(.el-table__cell) {
    padding: 18px 0;
  }
}
</style>
<style lang="scss">
.upload-demo {
  width: 100%;
  height: 109px;
  margin-top: 32px;

  .el-upload {
    .el-upload-dragger {
      padding: 24px;
      background: #f6f9ff;
      border-radius: 12px 12px 12px 12px;
      border: 1px solid #7ea1ff;
    }
  }

  .el-upload__text {
    margin-top: 8px;
    font-weight: 400;
    font-size: 12px;
    color: #666666;
  }
}

.preview-btn {
  color: var(--el-color-primary)
}

.table-operate-btns {

  .el-button+.el-button {
    margin-left: 0;
  }

  .el-button {
    justify-content: left;
    color: #ffffff;
    width: 100%;
  }

  .el-button.is-text:not(.is-disabled):hover {
    background-color: rgba(35, 111, 210, 0.4);
  }
}
</style>
