<template>
  <div class="app-container lib-file-manage">
    <el-form :model="state.queryParams" ref="queryRef" :inline="true" v-show="showSearch" class="query-form">
      <el-form-item label="">
        <div>
          <div class="lib-name">{{ props.libItem?.name }}</div>
          <div>由 {{ props.libItem?.createBy }}于{{ parseTime(props.libItem?.createTime) }} 创建</div>
        </div>
      </el-form-item>
      <div class="query-space"></div>
      <el-form-item label="">
        <input name="hid" class="hidden-input" value="防止输入框敲回车时提交表单" />
        <el-input
          v-model="state.queryParams.keyWord"
          placeholder="请输入关键词搜索文件"
          clearable
          style="width: 252px"
          @clear="handleQuery"
          @keyup.enter.prevent.stop="handleQuery" />
      </el-form-item>
      <el-form-item style="margin-left: 8px">
        <kjsc-button type="primary" @click="handleQuery">搜索</kjsc-button>
        <kjsc-button plain @click="resetQuery">重置</kjsc-button>
        <kjsc-button plain @click="goBack">返回</kjsc-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="24">
        <div style="display: flex; justify-content: flex-end; align-items: center; height: 50px; line-height: 50px">
          <kjsc-button plain @click="toggleExpandAll" style="margin-right: 10px;">展开/折叠</kjsc-button>
          <!-- <kjsc-button type="success" @click="handleImport" v-hasPermi="['knowledge:lib:import']">导入</kjsc-button> -->
          <!-- :accept="['.zip', '.xls']" -->
          <el-upload
            ref="upload"
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
            :on-exceed="handleExceed"
          >
            <template #trigger>
              <el-button type="primary">导入</el-button>
            </template>
          </el-upload>
          <right-toolbar :search="false" @queryTable="getList"></right-toolbar>
        </div>
      </el-col>
    </el-row>

    <!-- <el-table 
      v-if="refreshTable"
      v-loading="loading"
      :data="menuList"
      row-key="id"
      :default-expand-all="isExpandAll"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
      <el-table-column prop="fileName" label="名称" :show-overflow-tooltip="true">
        <template #default="scope">
          <span v-if="scope.row.children">{{ scope.row.fileName }}</span>
          <a v-else class="file-name" @click.stop.prevent="downloadHandle(scope.row)">{{ scope.row.fileName }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="createInfo" label="创建信息" width="300">
        <template #default="scope">
          By {{ scope.row.createBy }} {{ parseTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" class-name="small-padding fixed-width" width="260">
        <template #default="scope">
          <kjsc-text-button type="primary" @click="memberManagerHandle(scope.row)">成员管理</kjsc-text-button>
          <kjsc-text-button v-if="!scope.row.children" type="primary" @click="downloadHandle(scope.row)">下载</kjsc-text-button>
          <kjsc-text-button type="danger" @click="removeHandle(scope.row)">删除</kjsc-text-button>
          <kjsc-text-button type="primary" @click="renameHandle(scope.row)">重命名</kjsc-text-button>
        </template>
      </el-table-column>
    </el-table> -->

    <div style="height: 600px">
      <el-auto-resizer>
        <template #default="{ height, width }">
          <el-table-v2
            v-model:expanded-row-keys="expandedRowKeys"
            :columns="columns(width)"
            :data="menuList"
            :expand-column-key="expandColumnKey"
            :width="width"
            :height="height"
            row-key="id"
          />
        </template>
      </el-auto-resizer>
    </div>

    <!-- 添加或修改菜单对话框 -->
    <KJSCDialogV2 :title="title" v-model="open" width="852px" append-to-body closeBtnText="关闭" :showSubitBtn="false">
      <MemberList v-if="open" :file-id="state.memberListFileId"/>
    </KJSCDialogV2>
  </div>
</template>

<script setup name="KnowledgeLibFileManage">
import { ElMessageBox, ElMessage, genFileId } from "element-plus";
import {KjscTextButton} from 'vue-kjsc-ui'; 
import { listLibFileApi, delLibFileApi, renameFileApi } from "@/api/knowledge/knowledgeApi"; // , addMenu, delMenu, getMenu, updateMenu
// import SvgIcon from "@/components/SvgIcon";
// import IconSelect from "@/components/IconSelect";
// import { ClickOutside as vClickOutside } from 'element-plus'
import KJSCDialogV2 from "@/components/KJSCCmpt/KJSCDialogV2.vue";
import MemberList from "../component/MemberList.vue";
import { download, getFilesUrl } from '@/utils/common'
import { getToken } from "@/utils/auth";

const upload = ref();
const props = defineProps({
  libItem: {
    type: Object
  },
  // fileId: {
  //   type: String,
  //   default: ''
  // }
})
const emit = defineEmits(['back']);
const { proxy } = getCurrentInstance();
// const { sys_show_hide, sys_normal_disable } = proxy.useDict("sys_show_hide", "sys_normal_disable");
console.log('proxy', proxy)

const menuList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const title = ref("");
const isExpandAll = ref(false);
// const refreshTable = ref(true);
const expandedRowKeys = ref([]);

const columns = (width)=>{
  return [
    {
      key: `fileName`,
      dataKey: `fileName`,
      title: `名称`,
      width: width - 560,
      minWidth: 300,
      cellRenderer: function(props){
        // console.log(arguments);
        // <span v-if="scope.row.children">{{ scope.row.fileName }}</span>
        // <a v-else class="file-name" @click.stop.prevent="downloadHandle(scope.row)">{{ scope.row.fileName }}</a>
        const row = props.rowData;
        let showFileName = row.fileName || '';
        showFileName = escapeHtml(showFileName);
        if (state.queryKeyWord) {
          showFileName = showFileName.replace(new RegExp(state.queryKeyWord, 'g'), '<span class="LibFileManage_highlight">' + state.queryKeyWord + '</span>');
        }
        if(row.fileType == 1){ // 文件
          return h('a', { 
            class: 'LibFileManage_file-name',
            innerHTML: showFileName,
            onClick: (event)=>{
              event.stopPropagation();
              event.preventDefault();
              downloadHandle(row);
            }
          });
        } else {
          // 文件夹
          return h('span', {innerHTML: showFileName});
        }
      }
    },
    {
      key: `statusName`,
      dataKey: `statusName`,
      title: `状态`,
      width: 120,
      cellRenderer: (props) => {
        const row = props.rowData || {};
        return h('span', {}, row.statusName || '');
      },
    },
    {
      key: `message`,
      dataKey: `message`,
      title: `备注`,
      width: 200,
      cellRenderer: (props) => {
        const row = props.rowData || {};
        return h('span', {}, row.message || '');
      },
    },
    {
      key: `createInfo`,
      dataKey: `createInfo`,
      title: `创建信息`,
      width: 300,
      cellRenderer: (props) => {
        const row = props.rowData || {};
        // By {{ scope.row.createBy }} {{ parseTime(scope.row.createTime) }}
        return h('span', {}, `By ${row.createBy || ''} ${(row.createTime || '')}`);
      },
    },
    {
      key: `op`,
      dataKey: `op`,
      title: `操作`,
      width: 260,
      cellRenderer: (props) => {
        const row = props.rowData || {};
        // <kjsc-text-button type="primary" @click="memberManagerHandle(scope.row)">成员管理</kjsc-text-button>
        // <kjsc-text-button v-if="!scope.row.children" type="primary" @click="downloadHandle(scope.row)">下载</kjsc-text-button>
        // <kjsc-text-button type="danger" @click="removeHandle(scope.row)">删除</kjsc-text-button>
        // <kjsc-text-button type="primary" @click="renameHandle(scope.row)">重命名</kjsc-text-button>
        const nodes = [];
        if (row.fileType == 1) {
          // 文件
          nodes.push(
            h(KjscTextButton, { type: 'primary', onClick: (event)=>memberManagerHandle(row)}, ()=>'成员管理')
          );
          nodes.push(
            h(KjscTextButton, { type: 'primary', onClick: (event)=>downloadHandle(row)}, ()=>'下载')
          );
        }
        nodes.push(
          h(KjscTextButton, { type: 'danger', onClick: (event)=>removeHandle(row)}, ()=>'删除')
        );
        nodes.push(
          h(KjscTextButton, { type: 'primary', onClick: (event)=>renameHandle(row)}, ()=>'重命名')
        );
        return nodes;
      }
    }
  ]
};
const expandColumnKey = 'fileName';

const importUrl = import.meta.env.VITE_APP_BASE_API + "/work/ragFileDecompressionTask/upload"; // 文件上传
const headers = ref({ Authorization: "Bearer " + getToken() });
const state = reactive({
  memberListFileId: "",
  // form: {},
  queryParams: {
    keyWord: ''
  },
  queryKeyWord: '',
  // rules: {
  //   keyWord: [{ required: true, message: "菜单名称不能为空", trigger: "blur" }],
  //   orderNum: [{ required: true, message: "菜单顺序不能为空", trigger: "blur" }],
  //   path: [{ required: true, message: "路由地址不能为空", trigger: "blur" }]
  // },
  
  uploadFileUrl: '',
  fileList: [],
});
let treeDataAll = [];
let treeDataAllDirKeys = null; // 所有的目录节点key
let queryDirKeys = []; // 搜索结果的目录节点key

// const { queryParams } = toRefs(state);
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** 查询菜单列表 */
function getList() {
  loading.value = true;
  // const params = {...queryParams.value};
  // params.libId = props.libItem?.id;
  listLibFileApi(props.libItem?.id).then((response) => {
    // treeDataAll = proxy.handleTree(response.data || [], "menuId");
    treeDataAll = response.data || [];
    treeDataAllDirKeys = null;
    menuList.value = treeDataAll;
    loading.value = false;
  },()=>{});
}

/** 搜索按钮操作 */
function handleQuery() {
  const keyWord = state.queryParams.keyWord.trim();
  state.queryKeyWord = keyWord;
  const allDataList = treeDataAll;
  if (!keyWord) {
    menuList.value = allDataList;
    return;
  }
  console.log('keyWord', keyWord)
  // 前端过滤

  const keepKeys = {};
  const configKey = 'id';
  const dirKeys = [];
  walkTree(allDataList, null, (node, parent)=>{
    if (parent && keepKeys[parent[configKey]] == 2) {
      // 搜索到目录时，显示目录及下面的目录和文件
      keepKeys[node[configKey]] = 2;
      return;
    }
    const keepFlag = node['fileName'].indexOf(keyWord) > -1;
    if (keepFlag) {
      if (node.fileType == 1) {
        keepKeys[node[configKey]] = 1;
        keepKeys[parent[configKey]] = keepKeys[parent[configKey]] || 1;
      } else {
        keepKeys[node[configKey]] = 2;
        if (parent) {
          keepKeys[parent[configKey]] = keepKeys[parent[configKey]] || 1;
        }
      }
    } else {
      // console.log('未匹配', node[configKey]);
    }
  }, (node, parent)=>{
    if (keepKeys[node[configKey]]) {
      if (parent) {
        // 补齐父匹配
        keepKeys[parent[configKey]] = keepKeys[parent[configKey]] || 1;
      }
    }
  });
  // console.log('keepKeys',keepKeys);
  const getNewChildren = (oldChilren) => {
    const newChildren = [];
    oldChilren.forEach(node=>{
      if (keepKeys[node[configKey]]) {
        const newNode = {...node};
        newChildren.push(newNode);
        if (node.fileType == 2) {
          dirKeys.push(newNode.id);
          if (node.children) {
            newNode.children = getNewChildren(node.children);
          }
        }
      } else {
        // console.log('drop', node.deptName);
      }
    });
    // console.log('newChildren',newChildren);
    return newChildren;
  };
  const treeData = getNewChildren(allDataList);
  console.log('treeData', treeData)
  queryDirKeys = dirKeys;
  menuList.value = treeData;
  isExpandAll.value = false;
  updateExpandedRowKeys();
}
// 遍历树
const walkTree = (tree, parentNode, callback1, callback2 = ()=>{}, childrenKey = 'children') => {
  const len = tree.length;
  for(let i = 0; i < len; i++) {
    const node = tree[i];
    let flag = callback1(node, parentNode);
    if (flag) continue;
    const children = node[childrenKey];
    if (children && children.length > 0) {
      walkTree(children, node, callback1, callback2, childrenKey);
    }
    callback2(node, parentNode);
  }
};
/** 重置按钮操作 */
function resetQuery() {
  state.queryParams.keyWord = '';
  state.queryKeyWord = '';
  proxy.resetForm("queryRef");
  getList();
}
function goBack() {
  emit('back');
}

/** 展开/折叠操作 */
function toggleExpandAll() {
  // refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  // nextTick(() => {
  //   refreshTable.value = true;
  // });
  updateExpandedRowKeys();
  // console.log('toggleExpandAll', isExpandAll.value, expandedRowKeys.value);
}

function updateExpandedRowKeys(){
  if (isExpandAll.value) {
    if (state.queryKeyWord) {
      expandedRowKeys.value = queryDirKeys;
    } else {
      if (!treeDataAllDirKeys) {
        buildTreeDataAllDirKeys();
      }
      expandedRowKeys.value = treeDataAllDirKeys;
    }
  } else {
    expandedRowKeys.value = [];
  }
}

function buildTreeDataAllDirKeys(){
  const dirKeys = [];
  const allDataList = treeDataAll;
  walkTree(allDataList, null, (node, parent)=>{
    if (node.fileType == 2) {
      dirKeys.push(node.id);
    }
  });
  treeDataAllDirKeys = dirKeys;
}

function memberManagerHandle(row){
  // console.log('memberManagerHandle', row);
  open.value = true;
  title.value = "查看成员及权限";
  state.memberListFileId = row.id || row.menuId;
  // console.log('state.memberListFileId', state.memberListFileId);
}

function downloadHandle(row) {
  const url = getFilesUrl(row.filePath);
  download(url, row.fileName);
}

function removeHandle(row){
  ElMessageBox.alert(
    `<div style="text-align:center;">是否删除文件【${row.fileName}】?<br>删除的内容将进入回收站，15天内可选择恢复<div>`,
    '删除文件',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      showCancelButton: true,
      type: "warning",
    }
  ).then(()=>{
    delLibFileApi(row.id).then(res=>{
      if (res?.code === 200) {
        ElMessage.success("删除成功");
      }
      getList();
    })
  }).catch(()=>{})
}

function renameHandle(row){
  ElMessageBox.prompt('请输入文件名称', '重命名', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: row.fileName || "",
    inputPattern: /^[^\\/:*?"<>|\r\n]{1,255}$/,
    inputErrorMessage: '无效的文件名称',
  })
    .then(({ value }) => {
      renameFileApi({
        id: row.id,
        fileName: value
      }).then(res=>{
        if (res?.code === 200) {
          ElMessage.success('重命名成功');
          getList();
        }
      })
    })
    .catch(() => {})
}

const handleAvatarSuccess = (res) => {
  if (res.code === 200) {
    ElMessage.success('导入成功');
    getList();
  } else {
    ElMessage.error('导入失败，'+res.msg);
  }
  state.fileList = [];
};
const handleAvatarError = (res) => {
  if (res.code !== 200) {
    ElMessage.error(res.msg);
  }
  state.fileList = [];
};
const beforeAvatarUpload = () => {
  // console.log('文件上传');
};
// 覆盖前一个文件
const handleExceed = (files) => {
  upload.value.clearFiles();
  const file = files[0];
  file.uid = genFileId();
  upload.value.handleStart(file);
};

getList();
</script>
<style lang="less">
  .LibFileManage_file-name {
    color: #0000FF;
  }
  .LibFileManage_highlight {
    color: #00FF00;
  }
</style>
<style lang="less" scoped>
.lib-name {
  font-size: 30px;
}
.query-form {
  display: flex;
  .query-space {
    flex-grow: 1;
  }
}
.hidden-input {
  display: none;
}
// .file-name {
//   color: #0000FFFF;
// }
</style>
