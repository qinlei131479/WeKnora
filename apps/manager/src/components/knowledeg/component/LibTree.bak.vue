<template>
  <div class="lib-tree-content">
    <div class="lib-tree-title" v-if="!state.isBatch">
      <div class="lib-tree-title-left" @click="clickTitle">知识库目录</div>
      <div class="lib-tree-title-right">
        <el-tooltip
          class="box-item"
          effect="dark"
          content="新建文件夹"
          placement="top"
        >
          <svg-icon
            class="svg-icon-style"
            icon-class="add_blue"
            @click="handleAddFolder($event, { id: '' }, '新增文件夹')"
          />
        </el-tooltip>
        <div
          v-if="state.isUploadLimit"
          class="import-btn operations-btn"
          @click="isshowLimit"
        >
          导入
        </div>
        <el-upload
          ref="uploadTree"
          v-model:file-list="state.fileList"
          v-hasPermi="['knowledge:lib:import']"
          :on-success="handleAvatarSuccess"
          :on-error="handleAvatarError"
          :show-file-list="false"
          :data="{ knowledgeId: props.libItem?.id }"
          :accept="['.zip', '.rar']"
          :headers="headers"
          :before-upload="beforeAvatarUpload"
          :action="importUrl"
          :auto-upload="true"
          :limit="1"
          v-if="!state.isUploadLimit"
          :on-exceed="handleExceed"
        >
          <template #trigger>
            <div
              class="import-btn operations-btn"
              id="limitUpload"
              @click="importFileTree"
            >
              导入
            </div>
          </template>
        </el-upload>
        <div class="operations-btn" @click="handleBatch">批量操作</div>
      </div>
    </div>
    <div class="lib-tree-title" v-else>
      <div class="lib-tree-title-left">
        已选择
        <span style="color: #236fd2">{{ state.selectList.length }}</span> 项
      </div>
      <div class="lib-tree-title-right">
        <div class="operations-btn" @click="handleBatch">退出</div>
      </div>
    </div>
    <div class="lib-tree-body">
      <el-tree
        ref="tree"
        style="max-width: 600px"
        class="lib-tree"
        :data="state.dataSource"
        :show-checkbox="state.isBatch"
        node-key="code"
        @check="handleCheckChange"
        :props="{ value: 'code', label: 'fileName', children: 'children' }"
        :default-checked-keys="state.defaultCheckedKeys"
        :default-expanded-keys="state.defaultExpandedKey"
        :highlight-current="true"
        expand-on-click-node
        @node-click="handleClickChange"
      >
        <template #default="{ node, data }">
          <div class="custom-tree-node">
            <div>
              <svg-icon
                v-if="node.type === 'folder'"
                class="svg-icon-style file-icon"
                icon-class="folder"
              />
              <svg-icon
                v-else
                class="svg-icon-style file-icon"
                icon-class="file"
              />
              <span>{{
                node.label &&
                (node.label.length > 20
                  ? node.label.slice(0, 20) + "..."
                  : node.label)
              }}</span>
            </div>
            <div>
              <svg-icon
                class="svg-icon-style"
                icon-class="add"
                @click="handleAddFolder($event, data, '新增文件夹')"
              />
              <el-popover
                placement="right-start"
                :popper-style="{
                  width: '88px',
                  minWidth: '88px',
                  padding: '0',
                  borderRadius: '8px',
                }"
                :ref="(el) => popoverMap.set(data.id, el)"
                :data-id="data.id"
                trigger="click"
                effect="dark"
              >
                <div class="table-operate-btns">
                  <!-- <el-button
                    size="small"
                    text
                    @click="memberManagerHandle(node, data)"
                    >成员管理</el-button
                  > -->

                  <el-button
                    size="small"
                    text
                    @click="downloadHandle(node, data)"
                    >下载</el-button
                  >

                  <el-button size="small" text @click="removeHandle(node, data)"
                    >删除</el-button
                  >
                  <el-button
                    size="small"
                    text
                    @click="handleAddFolder($event, data, '重命名')"
                    >重命名</el-button
                  >
                  <el-button size="small" text @click="handleMoveFolder(data)"
                    >移动</el-button
                  >
                </div>
                <template #reference>
                  <svg-icon
                    class="svg-icon-style"
                    style="margin-left: 8px"
                    icon-class="more"
                    @click="handlePopoverClick"
                  />
                </template>
              </el-popover>
            </div>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 成员管理对话框 -->
    <!-- <el-dialog
      :title="state.title"
      v-model="state.dialogList.memberManage"
      append-to-body
      closeBtnText="关闭"
      :showSubitBtn="false"
      class="change_top"
    >
      <template #header="{ titleClass }">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <div :class="titleClass">
            {{ state.title }}
          </div>
          <div>
            <div
              style="
                display: flex;
                justify-content: flex-end;
                align-items: center;
                margin-right: 24px;
              "
              @click.stop
            >
              <span :class="titleClass" style="font-size: 14px">权限继承</span>
              <el-checkbox-group
                style="margin-left: 20px"
                v-model="state.extendInfo"
              >
                <el-checkbox key="parent" label="parent">父级</el-checkbox>
                <el-checkbox key="child" label="child">子级</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </div>
      </template>
      <MemberList
        :fileId="state.memberListFileId"
        :disabledBottom="state.extendInfo?.includes('parent')"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="state.dialogList.memberManage = false"
            >取消</el-button
          >
          <el-button type="primary" @click="levelClickChange"> 保存 </el-button>
        </div>
      </template>
    </el-dialog> -->

    <!-- 添加文件夹对话框 -->
    <FlieNameDialog
      v-model="state.dialogList.add"
      :file-operate-title="state.fileOperateTitle"
      :params="state.fileNameParams"
      @done="handleCancel"
      @append="submitAddFolder"
    />

    <!-- 删除弹窗 -->
    <RemoveFileDialog
      v-model="state.dialogList.removeDialog"
      :content="state.removeContent"
      @remove="removeFile"
    />
    <!-- 限制提示弹窗 -->
    <LimitFlieDialog
      v-model="state.limitDialog"
      :content="state.limitContent"
      :limitTitle="state.limitTitle"
      @limit="limitFile"
    />
    <!-- 文件夹移动弹窗 -->
    <MoveDialog
      v-model="state.dialogList.moveVisiable"
      :knowledgeId="state.libItem.id"
      :selectCode="state.moveFolder.selectCode"
      @done="handleCancel"
      @successMove="submitMoveFolder"
    >
    </MoveDialog>
  </div>
</template>

<script setup name="LibTree">
// import KJSCDialogV2 from "@/components/KJSCCmpt/KJSCDialogV2.vue";
import MemberList from "./MemberList.vue";
import { genFileId, ElMessageBox } from "element-plus";
import { getToken } from "@/utils/auth";
import RemoveFileDialog from "./RemoveFileDialog.vue";
import MoveDialog from "./MoveDialog.vue";
import LimitFlieDialog from "./limitFlieDialog.vue";
import FlieNameDialog from "./FlieNameDialog.vue";
import {
  addFolder,
  renameFileApi,
  queryFileTree,
  folderPermission,
  delLibFileApi,
  singleFile,
  uploadFileUrl,
  batchDownloadUrl
} from "@/api/knowledge/knowledgeApi";
import { computed, onMounted, reactive, ref } from "vue";
const props = defineProps({
  libItem: {
    type: Object,
    default: () => ({}),
  },
  fileCode: {
    type: String,
    default: "",
  },
  limitInfo: {
    type: Object,
    default: () => ({}),
  },
  isShowFile: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  "update:libItem",
  "batchOperation",
  "handleManage",
  "callBack",
  "backManage",
]);

const tree = ref(null);
const { proxy } = getCurrentInstance();


const importUrl =
  import.meta.env.VITE_APP_BASE_API + uploadFileUrl; // 文件上传
const headers = ref({ Authorization: "Bearer " + getToken() });
// const popover = ref(new Map());
const popoverMap = reactive(new Map());
const state = reactive({
  libItem: props.libItem,
  fileList: [],
  selectList: [],
  fileOperateTitle: "新增文件夹",
  dataSource: [],
  isBatch: false,
  extendInfo: [],

  memberListFileId: "",
  // 弹窗
  dialogList: {
    add: false,
    memberManage: false,
    removeDialog: false,
    moveVisiable: false,
  },
  moveFolder: {
    selectCode: "",
  },
  removeContent: "",
  removeObj: {},
  fileNameParams: {},
  fileCode: "",
  defaultCheckedKeys: [],
  defaultExpandedKey: [],
  loadModel: false,
  limitInfo: {},
  isUploadLimit: false,
  limitDialog: false,
  limitContent: "",
  limitTitle: "",
  isHandle: false,
});
const getList = async () => {
  let res = await queryFileTree(state.libItem.id);
  if (res.code === 200) {
    state.dataSource = res.data;
    
    // if(props.fileCode){
    //   nextTick(() => {
    //     state.defaultExpandedKey = [props.fileCode];
    //     tree.value.setCurrentKey(props.fileCode);
    //   })
    // }
  }
};
const uploadTree = ref(null);

const handleMoveFolder = (data) => {
  popoverMap.get(data.id)?.hide();
  state.dialogList.moveVisiable = true;
  state.moveFolder.selectCode = data.code;
};

// 新建文件夹
const handleAddFolder = (e, data, type) => {
  popoverMap.get(data.id)?.hide();
  event.stopPropagation();
  state.fileOperateTitle = type;
  state.fileNameParams = {};
  if (state.fileOperateTitle == "重命名") {
    state.fileNameParams = {
      id: data.id,
      fileName: data.fileName,
    };
    state.dialogList.add = true;
  } else {
    state.fileNameParams = {
      name: data.fileName,
      knowledgeId: state.libItem.id,
      parentCode: data.code ? data.code : "",
    };
    if (
      state.limitInfo.maxLevel == -1 &&
      state.limitInfo.maxFolder == -1 &&
      state.limitInfo.maxSize == -1
    ) {
      state.isUploadLimit = false;
    } else {
      state.isUploadLimit = true;
    }
    if (state.isUploadLimit) {
      state.limitDialog = true;
      state.limitTitle = "新建提示";
      state.limitContent = `若超出最大容量，将无法新建文件目录`;
    } else {
      state.dialogList.add = true;
    }
  }
  state.addForm.obj = data;
};
const renameHandle = (row) => {
  renameFileApi({
    id: row.id,
    fileName: value,
  }).then((res) => {
    if (res?.code === 200) {
      proxy.$modal.msgSuccess("重命名成功");
      getList();
    }
  });
};
const submitAddFolder = () => {
  getList();
  handleCancel();
};

const submitMoveFolder = () => {
  getList();
  handleCancel();
};

const handleCancel = () => {
  state.dialogList.add = false;
  state.dialogList.memberManage = false;
  state.dialogList.moveVisiable = false;
  state.addForm = {};
  state.fileNameParams = {};
};

// 导入
const handleAvatarSuccess = (res) => {
  if (res.code === 200) {
    proxy.$modal.msgSuccess("导入成功");
    // getList();
    setTimeout(() => {
      getList();
    }, 1000*10);
  } else {
    proxy.$modal.msgError("导入失败，" + res.msg);
  }
  if (
    state.limitInfo.maxLevel == -1 &&
    state.limitInfo.maxFolder == -1 &&
    state.limitInfo.maxSize == -1
  ) {
    state.isUploadLimit = false;
  } else {
    state.isUploadLimit = true;
  }
  state.isHandle = false;
  state.fileList = [];
};
const handleAvatarError = (res) => {
  if (res.code !== 200) {
    proxy.$modal.msgError(res.msg);
  }
  state.fileList = [];
};
const beforeAvatarUpload = () => {
  // console.log('文件上传');
};
// 覆盖前一个文件
const handleExceed = (files) => {
  uploadTree.value.clearFiles();
  const file = files[0];
  file.uid = genFileId();
  uploadTree.value.handleStart(file);
};

defineExpose({
  getList,
});
// 批量操作
const handleBatch = () => {
  console.log("批量操作");
  state.isBatch = !state.isBatch;
  if (!state.isBatch) {
    state.selectList = [];
    tree.value.setCheckedKeys([]);
  }
  emit("batchOperation", state.selectList, state.isBatch);
};

const levelClickChange = () => {
  folderPermission({
    flolderId: state.memberListFileId,
    knowledgeId: props.libItem?.id,
    permissions: state.extendInfo.filter((x) => x), // 过滤没有值的数据
  }).then((res) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess("修改成功");
      // getList();
      state.dialogList.memberManage = false;
    }
  });
};

const append = (data) => {
  const newChild = { id: data.id++, label: "testtest", children: [] };
  if (!data.children) {
    data.children = [];
  }
  data.children.push(newChild);
  state.dataSource = [...state.dataSource];
};

const remove = (node, data) => {
  const parent = node.parent;
  const children = parent.data.children || parent.data;
  const index = children.findIndex((d) => d.id === data.id);
  children.splice(index, 1);
  state.dataSource = [...state.dataSource];
};

const handleCheckChange = (data, currentObj) => {
  console.log(data, currentObj, "checkedNodes");
  state.selectList = currentObj.checkedKeys;
  emit("batchOperation", currentObj.checkedNodes, state.isBatch);
};
const handleClickChange = (row) => {
  // console.log('tree click:', row)
  // if(!row.children){
  emit("handleManage", row);
  // }
};
const memberManagerHandle = (node, row) => {
  // 查数据
  singleFile(row.id).then((res) => {
    if (res.code == 200) {
      state.extendInfo = [];
      state.extendInfo = res?.data.permissionMethod?.split(",") || [];
    }
  })
  state.dialogList.memberManage = true;
  state.title = "查看成员及权限";
  state.memberListFileId = row.id || row.menuId;
  popoverMap.get(row.id)?.hide();
};

const downloadHandle = (node, row) => {
  // proxy.download(row.fileUrl, row.fileName);
  nextTick(() => {
    popoverMap.get(row.id)?.hide();
  });
  const params = {
    dataList: [row.id],
  };
  proxy.postDownload2(
    batchDownloadUrl + state.libItem.id,
    params,
    `${row.fileName}_${new Date().getTime()}.zip`
  );
};
const handlePopoverClick = (event) => {
  event.stopPropagation();
};
const removeHandle = (node, row) => {
  state.dialogList.removeDialog = true;
  state.removeContent = `是否删除文件 【${row.fileName}】`;
  state.removeObj = row;
  popoverMap.get(row.id)?.hide();
};

const removeFile = () => {
  delLibFileApi(state.removeObj.id).then((res) => {
    if (res?.code === 200) {
      proxy.$modal.msgSuccess("删除成功");
    }
    getList();
    emit("callBack");
  });
};

const disabledAuthBottom = computed(() => {
  return state.extendInfo?.includes("parent");
});

const clickTitle = () => {
  if (state.dataSource.length == 0) {
    emit("backManage");
  }
};
const isshowLimit = () => {
  state.limitDialog = true;
  state.limitTitle = "导入提示";
  state.limitContent = `若超出最大容量，将导致部分文件无法导入`;
};
const limitFile = () => {
  state.limitDialog = false;
  state.isUploadLimit = false;
  if (state.limitTitle == "导入提示") {
    nextTick(() => {
      state.isHandle = true;
      document.getElementById("limitUpload").click();
    });
  } else if (state.limitTitle == "新建提示") {
    state.dialogList.add = true;
  }
};
const importFileTree = () => {
  if (state.isHandle) {
    console.log(uploadTree, "=================uploadTree");
    uploadTree.value.submit();
    return;
  }
};
watchEffect(() => {
  if (props.fileCode) {
    nextTick(() => {
      state.defaultExpandedKey = [props.fileCode];
      tree.value.setCurrentKey(props.fileCode);
    });
  }
  if (props.limitInfo) {
    state.limitInfo = props.limitInfo;
    if (
      state.limitInfo.maxLevel == -1 &&
      state.limitInfo.maxFolder == -1 &&
      state.limitInfo.maxSize == -1
    ) {
      state.isUploadLimit = false;
    } else {
      state.isUploadLimit = true;
    }
  }
});
onMounted(async () => {
  await getList();

  if(props.isShowFile) {
    if(state.dataSource && state.dataSource.length) {
      const firstItem = state.dataSource[0] || {}
      // state.defaultCheckedKeys = [firstItem.code]

      if(firstItem.code) {
        tree.value.setCurrentKey(firstItem.code)
        emit("handleManage", firstItem);
      }
    }
  }
  
});
</script>

<style lang="less" scoped>
.lib-tree-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.lib-tree-title-left {
  font-weight: 400;
  font-size: 14px;
  color: #333333;
  cursor: pointer;
}
.lib-tree-title-right {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
}
.operations-btn {
  font-weight: 400;
  font-size: 14px;
  color: #236fd2;
}
.import-btn {
  margin: 0 16px;
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  // div{
  //   width: ;
  // }
  // padding-right: 8px;
  .el-button + .el-button {
    margin-left: 0px;
  }
}
.lib-tree {
  background: #f6f8f9;
  :deep(.el-tree-node__label) {
    width: 100%;
  }
}

.svg-icon-style {
  width: 12px;
  height: 12px;
}
.file-icon {
  margin: 0 4px;
}
</style>
<style>
.table-operate-btns .el-button + .el-button {
  margin-left: 0;
}
.table-operate-btns .el-button {
  justify-content: left;
  color: #ffffff;
  width: 100%;
}
.table-operate-btns .el-button.is-text:not(.is-disabled):hover {
  background-color: rgba(35, 111, 210, 0.4);
}
.lib-tree.el-tree--highlight-current
  .el-tree-node.is-current
  > .el-tree-node__content {
  background: rgba(35, 111, 210, 0.1);
  padding: 8px;
  height: 36px;
  border-radius: 8px 8px 8px 8px;
}
.lib-tree .el-tree-node__content {
  padding: 8px;
  height: 36px;
}
.change_top .el-dialog__body {
  margin-top: -23px;
}
</style>
