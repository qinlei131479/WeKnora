<template>
  <div class="app-container knowledge-lib-list">
    <el-form :model="searchParams" ref="searchRef" :inline="true">
      <el-form-item label="" prop="name">
        <el-input
          v-model="searchParams.keyword"
          placeholder="请输入关键词搜索"
          clearable
          style="width: 252px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item style="margin-left: 8px">
        <kjsc-button v-hasPermi="['knowledge:lib:query']" type="primary" @click="handleQuery">搜索</kjsc-button>
        <kjsc-button plain @click="resetQuery">重置</kjsc-button>
      </el-form-item>
      <el-form-item class="file-search">
        <el-select
          v-model="state.fileSearchKey"
          filterable
          remote
          placeholder="输入姓名搜索权限文件"
          :remote-method="remoteMethod"
          :loading="loading"
          @change="selectList"
          style="width: 240px"
        >
          <el-option
            v-for="item in state.userDataList"
            :key="item.key"
            :label="item.value"
            :value="item.key"
          />
        </el-select>
        <!-- <el-input
          v-model="state.fileSearchKey"
          placeholder="输入姓名搜索权限文件"
          clearable
          style="width: 252px"
          @keyup.enter="handleFileSearch"
        /> -->
      </el-form-item>
    </el-form>

    <el-row :gutter="10">
      <el-col :span="14">
        <kjsc-tool-bar :length="state.ids.length" style="visibility: hidden;">
          <!-- <kjsc-button v-hasPermi="['knowledge:lib:remove']" plain :disabled="state.multiple" @click="handleDelete">批量删除</kjsc-button> -->
        </kjsc-tool-bar>
      </el-col>
      <el-col :span="10">
        <div style="display: flex; justify-content: flex-end">
          <kjsc-button type="success" @click="handleAdd" v-hasPermi="['knowledge:lib:add']">新建</kjsc-button>
          <!-- <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" :columns="columns"></right-toolbar> -->
        </div> 
      </el-col>
    </el-row>

    <el-table v-if="list.tableData?.length > 0 || !!searchParams.keyword" v-loading="loading" :data="list.tableData" @selection-change="handleSelectionChange">
      <template #empty>
        <kjsc-empty></kjsc-empty>
      </template>
      <el-table-column type="selection" width="55" />
      <el-table-column
        prop="name"
        label="知识库名称"
        :show-overflow-tooltip="true"
        min-width="300"
      ></el-table-column>
      <el-table-column
        prop="status"
        label="解析状态"
        width="150"
      >
        <template #default="scope">
          <span>{{ getTagKnowledgeStatusName(scope.row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="修改时间" prop="updateTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" class-name="small-padding fixed-width" width="180">
        <template #default="scope">
          <kjsc-text-button
            :disabled="!scope.row.canFileEdit"
            type="primary"
            @click="handleFileManage(scope.row)"
            v-hasPermi="['knowledge:lib:file']"
            >文件管理</kjsc-text-button
          >
          <kjsc-text-button
            :disabled="!scope.row.canEdit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['knowledge:lib:setup']"
            >设置</kjsc-text-button
          >
          <kjsc-text-button
            type="danger"
            confirm-btn
            :disabled="!scope.row.canEdit"
            :data="scope.row"
            :confirm-info="{
              title: '确定要删除该知识库吗？',
              confirmCallback: confirmCallback,
            }"
            v-hasPermi="['knowledge:lib:remove']"
            >删除</kjsc-text-button
          >
        </template>
      </el-table-column>
    </el-table>
    <div v-else class="empty-area">
      <div class="empty-text">您还未创建知识库，请点击【新建】创建您的知识库</div>
    </div>
    <kjsc-pagination
      v-show="total > 0"
      :total="total"
      :page="{ pageNum: queryParams.pageNum, pageSize: queryParams.pageSize }"
      @change="handlePageChange"
      style="padding-top: 16px"
    />

    <!-- 添加或修改参数配置对话框 -->
    <KJSCDialogV2
      :title="title"
      v-model="open"
      width="500px"
      append-to-body
      @submit-click="submitForm"
    >
      <el-form ref="empRef" :model="form" :rules="rules" label-width="140px" label-position="top">
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="form.name"
            class="w100p"
            maxlength="20"
            placeholder="请输入名称"
          />
        </el-form-item>
        <el-form-item label="知识库归属" prop="deptIds" class="form-item-1">
          <!-- <el-tree-select
            v-model="form.deptIds"
            :data="state.belongToList"
            :render-after-expand="false"
            :props="defaultProps"
            multiple
            node-key="deptId"
            check-strictly
            class="w100p"
          /> -->
          <el-cascader
            v-model="form.deptIds"
            :options="state.belongToList"
            :props="defaultProps"
            :show-all-levels="false"
            class="w100p"
            clearable/>
        </el-form-item>
        <el-form-item label="可见范围" prop="scopeType">
          <el-radio-group v-model="form.scopeType" class="radio-group-1">
            <el-radio label="1">仅本部门可见</el-radio>
            <el-radio label="2">仅对应成员可见</el-radio>
            <el-radio label="3">全公司公开可见</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="知识库管理员" prop="userIds" style="margin-bottom: 3px;" class="form-item-1">
          <!-- <el-autocomplete
            v-model="state.autoname"
            :fetch-suggestions="querySearch"
            :trigger-on-focus="false"
            :value-key="tagValueKey"
            clearable
            class="w100p"
            placeholder="请输入姓名搜索"
            @select="handleSelect"
          /> -->
          <el-select-v2
            v-model="form.userIds"
            class="w100p"
            multiple
            filterable
            remote
            :remote-method="querySearch"
            clearable
            :options="state.userOptions"
            :loading="state.userLoading"
            placeholder="请输入姓名搜索"
          />
        </el-form-item>
        <!-- <el-form-item label="">
          <div>
            <el-tag v-for="tag in form.tags" :key="tag.userId" closable @close="handleTagClose(tag)">
              {{ tag.label }}
            </el-tag>
          </div>
        </el-form-item> -->
        <el-form-item label="简介" prop="description">
          <el-input
            v-model="form.description"
            :rows="6"
            show-word-limit
            maxlength="200"
            type="textarea"
            placeholder="请输入简介"
            class="w100p"
          />
        </el-form-item>
      </el-form>
    </KJSCDialogV2>
    <!-- 权限文件搜索 -->
    <SearchDialog v-model="state.fileSearchVisible" :userId="state.searchUserId"></SearchDialog>
  </div>
</template>

<script setup name="KnowledgeLibList">
import {
  // queryName,
  listLibApi,
  addLibApi,
  updateLibApi,
  delLibApi,
  getLibApi,
  userSelect,
  // getBelongToListApi,
} from "@/api/knowledge/knowledgeApi";
import { listDept } from "@/api/system/dept";
// import { listUser } from "@/api/system/user";

import KJSCDialogV2 from "@/components/KJSCCmpt/KJSCDialogV2.vue";
import SearchDialog from "../component/SearchDialog.vue";
import { getParseStatusName } from "../constance";

const emit = defineEmits(['fileManage', 'setup']);
const props = defineProps({
  refresh: Object
});
watch(
  ()=>props.refresh,
  (refresh)=>{
    refresh && getList();
  }
);
const { proxy } = getCurrentInstance();
const { rag_knowledge_status } = proxy.useDict("rag_knowledge_status");

const getTagKnowledgeStatusName = (status) => {
  const items = rag_knowledge_status.value;
  if (!items || !items.length) {
    return getParseStatusName(status);
  }
  let item = items.find(item=>item.value == status);
  if (!item) {
    item = items[0];
  }
  return item ? item.label : '';
};

const open = ref(false);
const loading = ref(true);
const title = ref("");
const total = ref(0);

const tagValueKey = "label";

const state = reactive({
  form: {
    userIds: []
  },
  searchParams: {
    keyword: ''
  },
  searchUserId:"",
  userDataList: [],
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orderByColumn: "updateTime",
    isAsc: "desc",
  },
  fileSearchKey: '',
  fileSearchVisible: false,
  rules: {
    name: [
      { required: true, message: "名称不能为空", trigger: "blur" }
    ],
    deptIds: [
      { required: true, message: "知识库归属不能为空", trigger: "change" },
    ],
    scopeType: [
      { required: true, message: "可见范围不能为空", trigger: "change" },
    ],
    userIds: [
      { required: true, message: "知识库管理员不能为空", trigger: "change" },
    ],
    description: [
      { max: 200, message: "简介内容长度不超过200字", trigger: "change" },
    ]
  },
  ids:[],
  multiple:true,
  list: {
    // 表格
    tableData: [],
  },
  userOptions: [],
  userLoading: false,
  autoname: '',
  belongToList: [
    {value: '1', label: '张三'},
    {value: '2', label: '里斯'},
    {value: '3', label: '王五'},
    {value: '4', label: '赵六'},
  ],
});
const defaultProps = {
  children: 'children',
  label: 'deptName',
  value: 'deptId',
  multiple: true,
  checkStrictly: true,
  // disabled: function(data, node){
  //   return data.children && data.children.length > 0;
  // }
};

// let lastQueryResult = [];
const querySearch = (queryString, cb)=>{
  if (queryString) {
    state.userLoading = true;
    userSelect(queryString).then((res) => {
      const list = res?.data || [];
      const results = list.map(item=>{
        item.label = item.userName;
        return {
          label: item.value,
          value: item.key
        }
      });
      // lastQueryResult = results;
      // cb(results);
      state.userOptions = results;
      state.userLoading = false;
    });
    // listUser({
    //   pageNum:1,
    //   pageSize: 999,
    //   userName: queryString
    // }).then(function(data){
    //   const list = data?.rows || [];
    //   const results = list.map(item=>{
    //     item.label = item.userName;
    //     return {
    //       label: item.nickName || item.userName || item.remark || item.userId,
    //       value: item.userId
    //     }
    //   });
    //   // lastQueryResult = results;
    //   // cb(results);
    //   state.userOptions = results;
    //   state.userLoading = false;
    // });
  } else {
    // cb(lastQueryResult);
  }
};
// const handleSelect = (item) => {
//   if (!item) return;
//   // state.autoname = '';
//   if (!form.value.tags) {
//     form.value.tags = [];
//   }
//   if (form.value.tags.some(tag => tag[tagValueKey] === item[tagValueKey])) {
//     return;
//   }
//   form.value.tags.push(item);
//   console.log('form.value.tags', form.value.tags);
// }

// const handleTagClose = (tag) => {
//   // console.log('handleTagClose', tag);
//   const index = form.value.tags.indexOf(tag);
//   form.value.tags.splice(index, 1);
// };

const getBelongToList = () => {
  // getBelongToListApi().then((res) => {
  //   state.belongToList = res.data || [];
  // });
  return listDept().then(response => {
    state.belongToList = proxy.handleTree(response.data, "deptId");
    console.log('state.belongToList', state.belongToList);
  });
};

const { queryParams, form, rules, list, searchParams } = toRefs(state);

/** 查询菜单列表 */
const getList = () => {
  loading.value = true;
  listLibApi(searchParams.value, queryParams.value).then(res => {
    if (res.code === 200) {
      list.value.tableData = res.rows;
      total.value = res.total;
      loading.value = false;
    } else {
      loading.value = false;
      proxy.$modal.msgError("查询失败");
    }
  }, () => {
    loading.value = false;
    proxy.$modal.msgError("查询失败");
  });
};

// 分页
const handlePageChange = ({ page, type }) => {
  if(type === 'size'){
    queryParams.value.pageNum = 1;
  }else{
    queryParams.value.pageNum = page.pageNum;
  }
  queryParams.value.pageSize = page.pageSize;
  getList();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  proxy.resetForm("searchRef");
  searchParams.value.keyword = '';
  handleQuery();
};

/** 表单重置 */
const reset = () => {
  form.value = {
    userIds: [],
    // scopeType: '2',
    // name: undefined,
    // birthday: undefined,
    // hiredDate: undefined,
    // regularDate: undefined,
    // contractExpireDate: undefined,
  };
  list.value.argsList = [];
  proxy.resetForm("empRef");
};

const handleFileSearch = () => {
  console.log('handleFileSearch');
  // proxy.$refs.upload.click();
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  open.value = true;
  title.value = "创建知识库";
  getBelongToList();
};
/** 修改按钮操作 */
const handleUpdate = async (row) => {
  // reset();
  // await getBelongToList();
  // let res = await getLibApi(row.id);
  // if (res.code === 200) {
  //   form.value = res.data;
  //   open.value = true;
  //   title.value = "修改知识库";
  // }
  emit('setup', row);
};
/** 文件管理按钮操作 */
const handleFileManage = (row) => {
  emit('fileManage', row);
  // reset();
  // await getBelongToList();
  // let res = await getLibApi(row.id);
  // if (res.code === 200) {
  //   form.value = res.data;
  //   open.value = true;
  //   title.value = "修改员工";
  // }
};
/** 删除按钮操作 */
const confirmCallback = async (data) => {
  let res = await delLibApi(data.id);
  if (res.code === 200) {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  } else {
    proxy.$modal.msgError("删除失败");
  }
};
/** 多选框选中数据 */
function handleSelectionChange(selection) {
  state.ids = selection.map((item) => item.id);
  state.multiple = !selection.length;
}

/** 远程搜索 */
const remoteMethod = (query) => {
  userSelect(query).then((res) => {
    state.userDataList = res.data;
  });
};

const selectList = (userId) => {
  // 打开弹框
  state.fileSearchVisible = true;
  state.searchUserId = userId;
  state.fileSearchKey = "";
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["empRef"].validate(async (valid) => {
    if (valid) {
      let res = {};
      const params = {...form.value};
      // const tags = params.tags || [];
      // delete params.tags;
      // params.tag = tags.map(item=>item.id);
      const deptIds = (params.deptIds || []).map(paths => paths[paths.length - 1]);
      params.deptIds = deptIds;
      console.log('submitForm', params);
      if (params.id) {
        // never
        res = await updateLibApi(params);
      } else {
        res = await addLibApi(params);
      }
      if (res.code === 200) {
        let tipsMessage = params.id ? "修改成功" : "新增成功";
        proxy.$modal.msgSuccess(tipsMessage);
        open.value = false;
        getList();
      } else {
        open.value = false;
        proxy.$modal.msgError("操作失败");
      }
    }
  });
}

const init = () => {
  getList();
  remoteMethod("");
};

init();
</script>
<style lang="less" scoped>
.file-search {
  float: right;
}
.empty-area {
  height: 300px;
  text-align: center;
  overflow: hidden;
  .empty-text {
    margin-top: 120px;
  }
}
.radio-group-1 {
  flex-direction: column;
  align-items: flex-start;
}
.w100p {
  width: 100%;
}
.form-item-1 :deep(.w100p) {
  width: 100%;
}
.el-tag {
  margin-right: 5px;
}
</style>
