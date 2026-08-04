<template>
  <div class="member-list MemberList">
    <div class="top-op-area">
      <el-button
        type="success"
        icon="Plus"
        @click="handleAdd"
        style="width: 122px"
        >添加成员</el-button
      >
    </div>
    <el-tabs
      v-model="state.activeName"
      @tab-change="handleChange"
      class="member-list-tabs"
    >
      <!-- <el-tab-pane label="管理员" name="gly"></el-tab-pane> -->
      <el-tab-pane label="可查看/下载人员" name="user"></el-tab-pane>
    </el-tabs>
    <div>
      <el-table :data="state.tableData" max-height="400" :loading="state.loading" highlight-current-row>
        <template #empty>
          <kjsc-empty class="member-empty" :image-size="100"></kjsc-empty>
        </template>
        <el-table-column
          prop="purviewName"
          label="对象"
          min-width="100"
          align="center"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <el-button type="primary" link @click="onPurviewNameClick(scope.row)">{{ scope.row.purviewName }}</el-button>
          </template>
        </el-table-column>
        <el-table-column
          prop="purviewType"
          label="权限类别"
          min-width="60"
          align="center"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.purviewType === '1' ? '用户组' : scope.row.purviewType === '0' ? '部门' : scope.row.purviewType }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="添加时间"
          prop="createTime"
          align="center"
          min-width="200"
        ></el-table-column>
        <el-table-column
          label="角色权限"
          class-name="small-padding fixed-width"
          align="center"
          header-align="center"
          min-width="120"
        >
          <template #default="scope">
            <!-- <div class="mbemberlist-popper">
              <div class="memberlist-refer">
                <el-button link type="primary">{{ getRoleName(scope.row) }}</el-button>
                <el-icon class="el-icon--right">
                  <arrow-down />
                </el-icon>
              </div>
              <div class="memberlist-oper">
                <el-radio-group v-model="scope.row.purviewRange" @change="onAuthChange(scope.row)">
                  <el-radio class="oper-item" value="1">可查看/下载</el-radio>
                  <el-radio class="oper-item" value="0">可查看</el-radio>
                </el-radio-group>
                <el-radio class="oper-item" value="2" @change="onRemoveMember(scope.row)">移除成员</el-radio>
              </div>
            </div> -->

            <el-popover placement="right" popper-class="mbemberlist-popper" trigger="click">
              <template #reference>
                <div class="memberlist-refer">
                  <el-button link type="primary">{{ getRoleName(scope.row) }}</el-button>
                  <el-icon class="el-icon--right">
                    <arrow-down />
                  </el-icon>
                </div>
              </template>
              <div class="memberlist-oper">
                <el-radio-group v-model="scope.row.purviewRange" @change="onAuthChange(scope.row)">
                  <el-radio class="oper-item" value="1">可查看/下载</el-radio>
                  <el-radio class="oper-item" value="0">可查看</el-radio>
                </el-radio-group>
                <el-radio v-model="scope.row.removed" class="oper-item" value="2" @change="onRemoveMember(scope.row)">移除成员</el-radio>
              </div>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
  <AddMemberDialog
    v-model:modelValue="state.showAddMemberDialog"
    :selected-nodes="state.existNodes"
    @done="handleAddMemberDialogDone"
    :title="'添加成员'"
  />
  <auth-manage v-model="state.showAuthManage" :selected-nodes="state.selectedNodes" :selected-keys="state.selectedKeys" :knowledge-id="props.libId" :exist-nodes="state.existNodes" @done="getList"></auth-manage>

  <auth-detail v-model="state.showAuthDetail" :data-list="state.tableData" :expand-id="state.authDetailId"></auth-detail>
</template>

<script setup name="MemberList">
import AddMemberDialog from "./AddMemberDialog.vue";
import AuthManage from "./AuthManage.vue";
import AuthDetail from "./AuthDetail.vue";
import {
  // listMemberApi,
  delMemberApi,
  updateMemberRoleApi,
  // addMemberApi,
  queryKnowledgeAuthList,
  removeKnowledgeAuth,
  updateKnowledgeAuth
} from "@/api/knowledge/knowledgeApi";
import { libRoleTypes } from "../constance";
// import { queryKnowledgeAuthList, removeKnowledgeAuth, updateKnowledgeAuth } from "@/api/knowledge/knowledgeApi";
import { ElMessage, ElMessageBox } from "element-plus";
const { proxy } = getCurrentInstance();
const emits = defineEmits(["change"]);
const props = defineProps({
  // 知识库id 和 知识库文件id 只有其中一个
  // 知识库id
  libId: {
    type: [String, Number],
  },
  disabledBottom: {
    type: Boolean,
    default: false,
  },
  // 知识库文件id
  fileId: {
    type: String,
  },
  refresh: Object,
});
const state = reactive({
  loading: false,
  activeName: "user",
  tableData: [],
  showAddMemberDialog: false,
  // exceptedUserIds: null,
  existNodes: [],
  showAuthManage: false,
  selectedNodes: [],
  selectedKeys: [],
  showAuthDetail: false,
  authDetailTitle: '',
  authDetailId: {},
});
const handleChange = (val) => {
  getList();
};
const handleAdd = () => {
  // if (props.disabledBottom) {
  //   proxy.$modal.msgError("未取消父级权限勾选无法进行权限设置");
  //   return;
  // }

  const existNodes = []
  state.tableData.map(item => {
    existNodes.push({
      id: item.purviewId,
      purviewType: item.purviewType,
      purviewRange: item.purviewRange
    })
  })
  console.log('exist:', existNodes)
  state.existNodes = existNodes
  state.showAddMemberDialog = true;
};
const handleAddMemberDialogDone = (nodes, keys) => {
  console.log('handle add done:', nodes, keys)
  state.showAddMemberDialog = false;
  state.selectedNodes = nodes
  state.selectedKeys = keys
  state.showAuthManage = true

  // return
  // if (!results) return;
  // const params = {};
  // params.type =
  //   state.activeName === "gly" ? libRoleTypes.admin : libRoleTypes.download;
  // params.knowledgeId = props.libId;
  // params.fileId = props.fileId;
  // params.userIds = results.map((item) => item.userId);
  // addMemberApi(params).then(
  //   (res) => {
  //     if (res?.code === 200) {
  //       proxy.$modal.msgSuccess("添加成功");
  //       emits("change");
  //     }
  //     getList();
  //   },
  //   () => {
  //     getList();
  //   }
  // );
};

const onPurviewNameClick = (row) => {
  console.log('name click:', row)
  state.authDetailId = row.id
  state.showAuthDetail = true
}

const getList = () => {
  // console.log('getMemberList');
  state.loading = true;
  const params = {};
  // params.types =
  //   state.activeName === "gly"
  //     ? libRoleTypes.admin
  //     : `${libRoleTypes.view},${libRoleTypes.download}`;
  params.knowledgeId = props.libId;
  params.fileId = props.fileId;
  params.pageNum = 1;
  params.pageSize = 9999;
  queryKnowledgeAuthList(params).then(
    (res) => {
      if (res.code === 200) {
        state.tableData = res.rows || [];
        state.loading = false;
      } else {
        state.loading = false;
        proxy.$modal.msgError("查询失败");
      }
    },
    () => {
      state.loading = false;
      proxy.$modal.msgError("查询失败");
    }
  ).catch(() => {
    state.loading = false;
  });
};
const getRoleName = (row) => {
  if (row.purviewRange === '0') {
    return "可查看";
  } else if (row.purviewRange === '1') {
    return "可查看/下载";
  } else {
    return "无";
  }
};
const handleCommand = (command) => {
  // console.log('handle command:', command, command[0])
  // return
  if (props.disabledBottom) {
    proxy.$modal.msgError("未取消父级权限勾选无法进行权限设置");
    return;
  }
  if (!command || !command[0]) {
    console.log("unknown command");
    return;
  }
  const commandType = command[0];
  const dataId = command.substring(1); // userId
  const params = {};
  params.knowledgeId = props.libId;
  params.fileId = props.fileId;
  params.userIds = [dataId];
  if (commandType == "@") {
    // set admin
    updateMemberRole(params, libRoleTypes.admin);
  } else if (commandType == "#") {
    // 可查看
    updateMemberRole(params, libRoleTypes.view);
  } else if (commandType == "$") {
    // 可下载
    updateMemberRole(params, libRoleTypes.download);
  } else if (commandType == "-") {
    // 删除
    delMemberApi(params).then((res) => {
      getList();
      emits("change");
    }, getList);
    const index = state.tableData.findIndex((item) => item.userId == dataId);
    state.tableData.splice(index, 1);
  } else {
    console.log("无效的命令", command);
  }
  console.log(`handleCommand`, command);
};
const updateMemberRole = (params, roleType) => {
  params.type = roleType;
  updateMemberRoleApi(params).then(function (res) {
    getList();
    emits("change");
  });
};
watch(
  () => [props.fileId, props.libId, props.refresh],
  (arr) => {
    // console.log('memberlist', fileId, props.libId);
    if (arr[0] || arr[1]) {
      getList();
    }
  },
  {
    immediate: true,
  }
);

const onRemoveMember = async (row) => {
  // return
  const res = await removeKnowledgeAuth({id: row.id})
  if(res.code === 200) {
    ElMessage.success({message: '移除成功'})
    getList()
  }else{
    ElMessage.error({message: res.msg || '移除失败'})
  }
}

const onAuthChange = async (row) => {
  console.log('auth change:', row)
  const res = await updateKnowledgeAuth({id: row.id, purviewRange: row.purviewRange})
  if(res.code === 200) {
    ElMessage.success({message: '修改成功'})
    getList()
  }else{
    row.purviewRange = row.purviewRange === '0' ? '1' : '0'
    ElMessage.error({message: res.msg || '修改失败'})
  }
}
</script>
<style lang="less" scoped>
.member-list {
  position: relative;
  width: 100%;
  box-sizing: border-box;

  .top-op-area {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
  }
}
.member-empty {
  height: 200px;
  padding: 0;
  --el-empty-description-margin-top: 0px;
  --el-empty-bottom-margin-top: 0px;
}
</style>
<style lang="less">
.custom-popper-class {
  background: #333333 !important;
  box-shadow: 0px 3px 10px 1px rgba(0, 0, 0, 0.16) !important;
  border-radius: 8px 8px 8px 8px !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  color: #ffffff !important;
  border: none !important;
}
.member-list-tabs {
  width: 100% !important;
  .el-tabs__item {
    font-size: 14px !important;
    font-weight: 400 !important;
  }
}

.mbemberlist-popper {
  position: relative;
  background-color: #f5f7fa !important;
}
.mbemberlist-popper .memberlist-oper {
  background-color: #f5f7fa !important;
}
.el-popper.is-light>.el-popper__arrow:before {
  background-color: #f5f7fa !important;
}

.memberlist-refer {
  .linkbtn {

  }
}

.memberlist-oper {
  z-index: 100;
  // display: none;
  // position: absolute;
  // left: 100%;
  

  .oper-item {
    height: 32px;
    line-height: 32px;
    cursor: pointer;
    box-sizing: border-box;
    padding: 0 10px;

  }
}
// .mbemberlist-popper:hover {
//   .memberlist-oper {
//     display: block;
//   }
// }
</style>
