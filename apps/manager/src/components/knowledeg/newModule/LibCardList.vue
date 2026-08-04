<template>
  <!-- 知识库卡片列表 -->
  <div class="knowledge-lib-list knowledge-lib-card-list">
    <el-row :gutter="10" class="knowledgelib-search">
      <el-col :span="14">
        <el-form
          :model="searchParams"
          ref="searchRef"
          :inline="true"
          @submit.prevent
        >
          <el-form-item label="" prop="keyword">
            <el-input
              v-model="searchParams.keyword"
              placeholder="知识库查询"
              clearable
              style="width: 400px"
              @input="handleQuery"
            >
              <template #prefix>
                <svg-icon
                  icon-class="search"
                  style="width: 16px; height: 16px"
                />
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </el-col>
      <el-col :span="10">
        <div style="display: flex; justify-content: flex-end">
          <!-- <kjsc-button class="check-log-btn" @click="showCheckLog"
            >内容检测记录</kjsc-button
          >
          <kjsc-button
            class="check-btn"
            @click="onCheckClick"
            v-hasPermi="['knowledge:lib:check']"
            >重复内容检测</kjsc-button
          > -->
          <kjsc-button
            type="success"
            @click="handleAdd"
            v-hasPermi="['knowledge:lib:add']"
            >新建</kjsc-button
          >
          <kjsc-button
            plain
            @click="handleExport"
            v-hasPermi="['knowledge:lib:export']"
            >导出</kjsc-button
          >
        </div>
      </el-col>
    </el-row>

    <el-tabs v-model="searchParams.type" class="lib-list-typetabs" @tab-change="getList">
      <template v-for="item in state.tabs">
        <el-tab-pane v-if="!item.value" :name="item.value">
          <template #label>
            <div class="typetabs-all">
              <span class="typetabs-title">{{ item.label }}</span>
              <svg-icon
                style="width: 12px; height: 12px"
                icon-class="filtrate"
              />
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane v-else :label="item.label" :name="item.value"></el-tab-pane>
      </template>
    </el-tabs>

    <!-- <div class="lib-card-list-header">
      <div class="lib-card-list-header-title">全部知识库</div>
      <svg-icon
        style="width: 12px; height: 12px"
        icon-class="filtrate"
        @click="handleFilter"
      />
    </div> -->

    <div v-if="list.tableData?.length > 0" class="lib-card-list">
      <div class="lib-card-list-content">
        <template
          v-for="(item, index) in list.tableData"
          :key="index"
        >
          <libCard
            v-if="item"
            :lib-item="item"
            @select="handleSelect"
            @setup="handleSetUp"
            @manage="handleManage"
            @toTop="handleTop"
            @toTopCancel="handleCancelUp"
          />
          <div v-else class="lib-card-seat"></div>
        </template>
      </div>
    </div>
    <div v-else class="empty-area">
      <div class="empty-img">
        <img src="../../../assets/images/empty.png" alt="" />
      </div>
      <div class="empty-text">
        您还未创建知识库，请点击<span style="color: #1bb999" @click="handleAdd"
          >【新建】</span
        >创建您的知识库
      </div>
    </div>
    <!-- <div
      v-if="checkResultModel.showCheckStatusBtn"
      class="check-status-btn"
    >
      <kjsc-button
        :icon="checkResultModel.icon"
        type="success"
        :class="state.checkStatusBtnClass"
        :disabled="state.checkStatusBtnDisabled"
        @click="onCheckStatusBtnClick"
        >{{ checkResultModel.checkStatusBtnTitle }}</kjsc-button
      >
      <div @click="preStopCheck" class="check-status-btn-close">
        <el-icon><Close /></el-icon>
      </div>
    </div>
    <div
      v-show="checkResultModel.checkResultAreaVisible"
      class="check-result-area"
    >
      <div @click="closeCheckResultArea" class="close-area">
        关闭提醒<el-icon><Close /></el-icon>
      </div>
      <div class="check-result-content">
        <div class="check-result-content-left">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="styles__StyledSVGIconPathComponent-sc-1sh3oaa-0 lbKweT svg-icon-path-icon fill"
            viewBox="0 0 32 32"
            width="97"
            height="97"
          >
            <defs></defs>
            <g>
              <path
                d="M27.424 26.976h-24.128c0.256-0.704 0.512-1.376 0.768-2.048 1.248-3.328 2.496-6.624 3.712-9.952 0.448-1.152 1.792-1.984 2.88-1.984 6.528 0.032 13.056 0.032 19.616 0 0.736 0 1.312 0.192 1.632 0.896 0.096 0.224 0.16 0.416 0 0.8-1.472 4.032-3.008 8.224-4.48 12.288zM10.048 5.024c0.032 0.096 0.032 0.192 0.096 0.288 0.127 0.159 0.694 1.293 1.248 2.434l0.448 1.022c0.096 0.192 0.224 0.256 0.448 0.256h13.696c0.928 0 1.76 0.672 1.92 1.632 0.032 0.096 0 0.224 0 0.352h-17.088c-1.92 0-3.456 0.832-4.48 2.496-0.352 0.544-0.544 1.216-0.768 1.856-1.184 3.104-2.336 6.208-3.52 9.344-0.096 0.224-0.192 0.288-0.448 0.224-0.768-0.192-1.536-0.8-1.6-1.504v-16.832c0-1.472 1.088-1.568 1.568-1.568h8.48z"
              ></path>
            </g>
          </svg>
        </div>
        <div class="check-result-content-main">
          <div>
            共检测到<span style="color: #bd3124">{{
              checkResultModel.repeatCount
            }}</span
            >条重复、相似文件！
          </div>
          <div class="row2">严重干扰回答准确性，建议立即处理</div>
        </div>
      </div>
      <div class="btns-area">
        <kjsc-button type="success" @click="preDealCheckResult"
          >立即处理</kjsc-button
        >
      </div>
    </div> -->
    <kjsc-pagination
      v-show="total > 0"
      :total="total"
      :page="{ pageNum: queryParams.pageNum, pageSize: queryParams.pageSize }"
      @change="handlePageChange"
      style="flex: none; padding-left: 32px; padding-right: 32px; padding-top: 10px;"
    />

    <!-- 添加或修改参数配置对话框 -->
    <KJSCDialogV2
      :title="title"
      v-model="open"
      width="500px"
      append-to-body
      @submit-click="submitForm"
    >
      <el-form
        ref="empRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        label-position="top"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="form.name"
            class="w100p"
            maxlength="20"
            placeholder="请输入名称"
          />
        </el-form-item>
        
        <!-- <el-form-item label="知识库问答模式">
          <el-select v-model="form.type" :disabled="!!form.id">
            <el-option v-for="item in state.modeList" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item> -->
        <!-- <el-form-item label="可见范围" prop="scopeType">
          <el-radio-group v-model="form.scopeType" class="radio-group-1">
            <el-radio label="1">仅本部门可见</el-radio>
            <el-radio label="2">仅对应成员可见</el-radio>
            <el-radio label="3">全公司公开可见</el-radio>
          </el-radio-group>
        </el-form-item> -->
        <el-form-item label="知识库管理员" prop="userIds" class="form-item-1">
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
        <!-- <el-form-item label="知识库归属" prop="deptIds" class="form-item-1">
          <el-cascader
            v-model="form.deptIds"
            :options="state.belongToList"
            :props="defaultProps"
            :show-all-levels="false"
            class="w100p"
            clearable
          />
        </el-form-item> -->
        <el-form-item label="简介" prop="description">
          <el-input
            v-model="form.description"
            :rows="6"
            type="textarea"
            placeholder="请输入简介"
            class="w100p"
          />
        </el-form-item>
      </el-form>
    </KJSCDialogV2>
    <!-- <CheckResultDialog v-model="state.checkResultDialogVisible" /> -->
  </div>
</template>

<script setup name="KnowledgeLibList">
import { ElMessageBox } from "element-plus";
import { tansParams } from '@/utils/ruoyi'
import {
  listLibApi,
  addLibApi,
  updateLibApi,
  ragKnowledgeTop,
  ragKnowledgeCancelTop,
  repeatContentCheckTaskStatus,
  repeatContentCheckTaskStart,
  repeatContentCheckTaskPause,
  repeatContentCheckTaskResume,
  repeatContentCheckTaskStop,
  queryBelongList,
  exportUrl,
} from "@/api/knowledge/knowledgeApi";
// import { listDept } from "@/api/system/dept";
import { listUser } from "@/api/system/user";

import KJSCDialogV2 from "@/components/KJSCCmpt/KJSCDialogV2.vue";

import libCard from "../component/libCard.vue";
// import CheckResultDialog from "../component/CheckResultDialog.vue";

import useUserStore from "@/store/modules/user";
// import { queryBelongList } from "@/api/knowledge/knowledgeApi";

const userStore = useUserStore();

const emit = defineEmits(["fileManage", "setup", "checkLog"]);
const props = defineProps({
  refresh: Object,
});
watch(
  () => props.refresh,
  (refresh) => {
    refresh && getList();
  }
);
const { proxy } = getCurrentInstance();

const open = ref(false);
const loading = ref(true);
const title = ref("");
const total = ref(0);

const TabsList = [
  {label: '全部知识库', value: ''},
  {label: 'Rag模式', value: '0'},
  {label: 'Prompt模式', value: '1'},
]

const state = reactive({
  form: {
    userIds: [],
    scopeType: "1",
  },
  searchParams: {
    keyword: "",
    type: ''
  },
  tabs: [{label: '全部知识库', value: ''}],
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orderByColumn: "updateTime",
    isAsc: "desc",
  },
  rules: {
    name: [{ required: true, message: "名称不能为空", trigger: "blur" }],
    // deptIds: [
    //   { required: true, message: "知识库归属不能为空", trigger: "change" },
    // ],
    scopeType: [
      { required: true, message: "可见范围不能为空", trigger: "change" },
    ],
    userIds: [
      { required: true, message: "知识库管理员不能为空", trigger: "change" },
    ],
    contractExpireDate: [
      {
        required: true,
        message: "劳动合同到期时间不能为空",
        trigger: "change",
      },
    ],
  },
  ids: [],
  multiple: true,
  list: {
    // 表格
    tableData: [],
  },
  userOptions: [],
  userLoading: false,
  autoname: "",
  belongToList: [],
  selectLibList: [],
  modeList: [
    {label: 'Rag模式', value: 0},
    {label: 'Prompt模式', value: 1},
  ],
  checkStatusBtnClass: "",
  checkStatusBtnDisabled: false,
  checkStatusResult: null,
  checkResultAreaVisible: false,
  checkResultDialogVisible: false,
});
const defaultProps = {
  children: "children",
  label: "deptName",
  value: "uniqueId",
  multiple: true,
  // checkStrictly: true,
};

const checkedItems = computed(() => {
  return state.list.tableData.filter((item) => {
    return item.check;
  });
});

// const checkResultModel = computed(() => {
//   const checkStatusResult = state.checkStatusResult;
//   let showCheckStatusBtn = false;
//   let checkStatusBtnTitle = "";
//   let icon = "";
//   let checkResultAreaVisible = false;
//   let repeatCount = 0;
//   let isChecking = false;
//   let isPaused = false;
//   if (checkStatusResult) {
//     // 查询任务状态: 0待执行、1进行中、2已完成、3暂停、4取消
//     const status = checkStatusResult.status;
//     if (status === "1") {
//       showCheckStatusBtn = true;
//       checkStatusBtnTitle = "检测中";
//       icon = "Loading";
//       isChecking = true;
//     } else if (status === "3") {
//       showCheckStatusBtn = true;
//       checkStatusBtnTitle = "暂停检测";
//       icon = "Refresh";
//       isPaused = true;
//     } else if (status === "2") {
//       checkResultAreaVisible = true;
//       repeatCount = checkStatusResult.repeatCount;
//     }
//   }
//   return {
//     icon,
//     isPaused,
//     isChecking,
//     repeatCount,
//     showCheckStatusBtn,
//     checkStatusBtnTitle,
//     checkResultAreaVisible,
//   };
// });

const querySearch = (queryString, from) => {
  if (queryString || from === 'add') {
    state.userLoading = true;
    listUser({
      pageNum: 1,
      pageSize: 999,
      nickName: queryString,
    }).then(function (data) {
      const list = data?.rows || [];
      const results = list.map((item) => {
        item.label = item.nickName;
        return {
          label: item.nickName || item.nickName || item.remark || item.userId,
          value: item.userId,
        };
      });
      // results.unshift({label: userStore.name, value: userStore.id})
      state.userOptions = results;
      state.userLoading = false;
    });
  }
};

const setBelongListId = (list, type) => {
  list.map(item => {
    item.type = type
    item.uniqueId = type + '-' + item.deptId
    if(item.children && item.children.length) {
      setBelongListId(item.children, type)
    }
  })
}

const getBelongToList = async () => {
  const res = await queryBelongList()
  console.log('belong list:', res)
  if(res.code === 200) {
    const deptList = res.data.deptList || []
    const userGroupList = res.data.userGroupList || []

    const deptTree = proxy.handleTree(deptList, 'deptId')
    const userGroupTree = proxy.handleTree(userGroupList, 'deptId')

    setBelongListId(deptTree, '0')
    setBelongListId(userGroupTree, '1')
    // console.log('xxxxxxx', deptTree, userGroupTree)

    state.belongToList = [...deptTree, ...userGroupTree]
  }

  // return listDept().then((response) => {
  //   state.belongToList = proxy.handleTree(response.data, "deptId");
  // });
};

const { queryParams, form, rules, list, searchParams } = toRefs(state);

/** 查询菜单列表 */
const getList = async () => {
  loading.value = true;
  const params = {
    keyword: searchParams.value.keyword,
    type: searchParams.value.type
  }

  let res = null;
  try {
    res = await listLibApi(params, queryParams.value);
  } catch (error) {
    loading.value = false;
    return;
  }
  if (res.code === 200) {
    const rows = res.rows || []
    const remainder = 4 - (rows.length % 4)
    for (let i = 0; i < remainder; i++) {
      rows.push(null)
    }
    list.value.tableData = rows;
    total.value = res.total;
    loading.value = false;
  } else {
    loading.value = false;
    proxy.$modal.msgError("查询失败");
  }
};

// 分页
const handlePageChange = ({ page, type }) => {
  if (type === "size") {
    queryParams.value.pageNum = 1;
  } else {
    queryParams.value.pageNum = page.pageNum;
  }
  queryParams.value.pageSize = page.pageSize;
  getList();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  getList();
};

/** 表单重置 */
const reset = () => {
  form.value = {
    userIds: [],
    scopeType: "1",
  };
  state.userOptions = [];
  list.value.argsList = [];
  proxy.resetForm("empRef");
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  open.value = true;
  title.value = "创建知识库";
  form.value.userIds = [userStore.id]
  querySearch('', 'add')
  // state.userOptions = [{label: userStore.name, value: userStore.id}]
  getBelongToList();
};
/* 日志 */
// const handleLog = () => {
//   console.log('日志');
//   emit('checkLog');
// }

// 筛选
const handleFilter = () => {
  console.log("筛选");
};

/* 知识库选择 */
const handleSelect = (info) => {
  // state.selectLibList = info;
  // console.log("handleSelect", info);
};
/* 导出 */
const handleExport = () => {
  try {
    // console.log("导出", list.value.tableData);
    let selectList = list.value.tableData.filter(item => item && item.check === true);
    console.log(selectList)
    const ids = selectList.map((item) => item.id);
    let params = { ...state.queryParams };
    params.ids = ids;
    // console.log('...........')
    proxy.getDownload(
      exportUrl+"?"+tansParams(params),
      `知识库_${new Date().getTime()}.zip`
    );
    getList();
  } catch (error) {
    console.log(error)
  }
};

/** 知识库修改按钮操作 */
const handleSetUp = (info) => {
  emit("setup", info);
};
/* 知识库置顶 */
const handleTop = async (info) => {
  let res = await ragKnowledgeTop(info.id);
  if (res.code === 200) {
    getList();
    proxy.$modal.msgSuccess("置顶成功");
  } else {
    proxy.$modal.msgError(res.msg);
  }
};
/* 知识库取消置顶 */
const handleCancelUp = async (info) => {
  let res = await ragKnowledgeCancelTop(info.id);
  if (res.code === 200) {
    getList();
    proxy.$modal.msgSuccess("取消置顶成功");
  } else {
    proxy.$modal.msgError(res.msg);
  }
};
/** 知识库管理按钮操作 */
const handleManage = (item) => {
  emit("manage", item);
};

/** 提交按钮 */
function submitForm() {
  proxy.$refs["empRef"].validate(async (valid) => {
    if (valid) {
      let res = {};
      const params = { ...form.value };
      params.type = state.modeList[0].value
      // console.log('submit:', params)
      // return
      const deptIds = (params.deptIds || []).map(
        (paths) => paths[paths.length - 1]
      );
      // const deptIds = params.deptIds || []
      const deptMap = []
      deptIds.map(item => {
        const idStr = item.split('-')
        if(idStr.length === 2) {
          const mapItem = {}
          mapItem[idStr[1]] = idStr[0]
          deptMap.push(mapItem)
        }
        
      })

      delete params.deptIds
      params.deptMap = deptMap
      // console.log("submitForm", params, deptIds, deptMap);
      
      if (params.id) {
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

const showCheckLog = () => {
  state.checkResultDialogVisible = true;
};
const onCheckClick = () => {
  let item = list.value.tableData.filter((item) => item && item.check === true);
  const ids = item.map((item) => item.id);
  repeatContentCheckTaskStart(ids).then((res) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess("任务提交成功")
      checkStatus(false);
    }
  })
  // checkStatus(true);
};

const onlyCheck = () => checkStatus(false);

const checkStatus = (showAnimation) => {
  if (state.checkStatusBtnDisabled1) {
    return;
  }
  state.checkStatusBtnDisabled1 = true;
  // 发起检测请求
  return repeatContentCheckTaskStatus().then((res) => {
    const data = res?.data || {};
    // 查询任务状态: 0待执行、1进行中、2已完成、3暂停、4取消
    let status = "";
    if (data.status || data.status === 0) {
      status = data.status + "";
    }
    data.status = status;
    const lastIsChecking = state.checkStatusResult?.status === "2";
    state.checkStatusResult = data;
    if (showAnimation) {
      const currIsChecking = state.checkStatusResult?.status === "2";
      // 如果检测中，检测中弹窗会轻微闪动表示提示
      if (lastIsChecking && currIsChecking) {
        state.checkStatusBtnClass = "show-animation";
        setTimeout(function () {
          state.checkStatusBtnClass = "";
        }, 2000);
      }
    }
    checkStatusBtnEnable();
  }, checkStatusBtnEnable);
};
const stopCheck = () => {
  state.checkStatusResult = null;
  repeatContentCheckTaskStop();
};
const preStopCheck = () => {
  ElMessageBox.confirm(
    '<div style="text-align:center"><div style="color:#bd3124">终止检测将结束整个检测进程！</div><div>请确认是否终止检测？</div></div>',
    "中止检测",
    {
      dangerouslyUseHTMLString: true,
      customClass: "danger-confirm",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  ).then(
    () => {
      // 确定停止
      stopCheck();
    },
    () => {
      // 不取消
    }
  );
};

const closeCheckResultArea = () => {
  // state.checkResultAreaVisible = false;
  state.checkStatusResult = null;
};
const preDealCheckResult = () => {
  // 显示检测结果
  state.checkStatusResult = null;
  state.checkResultDialogVisible = true;
};

const startCheckingAnimation = () => {};

// const onCheckStatusBtnClick = () => {
//   console.log("暂停", checkResultModel)
//   if (checkResultModel.value.isChecking) {
//     console.log("暂停")
//     pauseCheck();
//   } else if (checkResultModel.value.isPaused) {
//     resumeCheck();
//   }
// };

const pauseCheck = () => {
  state.checkStatusBtnDisabled = true;
  // 发起暂停检测请求
  repeatContentCheckTaskPause().then(onlyCheck, checkStatusBtnEnable);
};
const resumeCheck = () => {
  state.checkStatusBtnDisabled = true;
  // 发起继续检测请求
  repeatContentCheckTaskResume().then(onlyCheck, checkStatusBtnEnable);
};

const checkStatusBtnEnable = () => {
  state.checkStatusBtnDisabled = false;
  state.checkStatusBtnDisabled1 = false;
};

const init = async () => {
  await getList();
  // checkStatus(true)
  // setInterval(() => {
  //   checkStatus(false)
  // }, 10000)

  // const ragList = list.value.tableData.filter(item => item && item.type == 0)
  // const promtList = list.value.tableData.filter(item => item && item.type == 1)
  // if(ragList.length > 0 && promtList.length > 0) {
  //   state.tabs = TabsList
  // }else{
  //   state.tabs = [{label: '全部知识库', value: ''}]
  // }
};

init();
</script>
<style lang="less" scoped>
.knowledge-lib-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-top: 32px;
  padding-bottom: 10px;

  .knowledgelib-search {
    padding-left: 32px;
    padding-right: 32px;
    box-sizing: border-box;
    width: 100%;
    flex: none;
  }
}

.empty-area {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  overflow: hidden;
  .empty-img {
    width: 240px;
    height: 240px;
    margin: 0 auto;
  }
  .empty-text {
    margin-top: 24px;
    font-weight: 400;
    font-size: 16px;
    color: #bbbbbb;
    text-align: center;
    cursor: pointer;
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

.lib-card-list {
  overflow: auto;
  flex: 1;
  width: 100%;
}
.lib-card-list-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 32px;
  padding-left: 32px;
  padding-right: 32px;
  padding-bottom: 32px;
  box-sizing: border-box;
  min-width: 1384px;
}
.lib-card-seat {
  width: 300px;
  height: 160px;
}
.lib-card {
  cursor: pointer;
}
.lib-card-list-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  font-weight: 400;
  font-size: 14px;
  color: #333333;
  cursor: pointer;
  padding-left: 32px;
  padding-right: 32px;
  flex: none;
}
.lib-card-list-header-title {
  margin-right: 8px;
}
.lib-list-typetabs {
  min-height: 40px;
  padding: 0 32px;

  .typetabs-title {
    margin-right: 10px;
  }
}

.check-status-btn {
  position: fixed;
  bottom: 82px;
  right: 32px;
  .el-button {
    padding: 8px 30px;
    height: 40px;
  }
}
 /**.show-animation {
  -webkit-animation-name: bottomBounce;
  animation-name: bottomBounce;
  -webkit-animation-duration: 0.5s;
  animation-duration: 0.5s;
  -webkit-animation-timing-function: ease-in-out;
  animation-timing-function: ease-in-out;
  -webkit-animation-iteration-count: infinite;
  animation-iteration-count: infinite;
}
   */
.check-status-btn-close {
  position: absolute;
  top: 0;
  right: 0;
  width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
}
.check-result-area {
  position: fixed;
  bottom: 80px;
  right: 32px;
  width: 480px;
  height: 220px;
  background: #333;
  border-radius: 15px;
  color: #fff;
  .close-area {
    position: absolute;
    right: 15px;
    top: 6px;
    font-size: 12px;
    color: #cecece;
    cursor: pointer;
    .el-icon {
      font-size: 16px;
      vertical-align: bottom;
    }
  }
  .btns-area {
    position: absolute;
    right: 40px;
    bottom: 20px;
  }
}
.lbKweT {
  fill: #f4ce98;
}
.check-result-content {
  display: flex;
  margin: 50px 20px 0;
  .check-result-content-left {
    width: 97px;
    height: 97px;
  }
  .check-result-content-main {
    font-size: 20px;
    padding-top: 30px;
    padding-left: 5px;
    .row2 {
      font-size: 14px;
      margin-top: 10px;
    }
  }
}
</style>
