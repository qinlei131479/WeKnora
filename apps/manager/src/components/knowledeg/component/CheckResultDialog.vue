<template>
  <el-dialog
    :model-value="props.modelValue"
    :title="props.title"
    class="check-result-dialog"
    width="1200px"
    append-to-body
    @update:model-value="emits('update:modelValue', $event)"
    @open="onOpen"
    @close="onClose"
  >
    <div class="main-area">
      <div class="main-top-area">
        <div class="main-top-area-inner">
          <div class="main-top-area-left">
            <img src="../../../assets/images/folder_open_right.png" alt="" />
          </div>
          <div class="main-top-area-middle">
            <div v-show="state.checkStatus == '2' || state.checkStatus == '5'">
              <div class="row0">检测已完成，共发现<span style="color:#bd3124">{{ state.total }}</span>条相似文件</div>
              <div class="row1">已选中<span style="color:#bd3124">{{ getCheckDatas().length }}</span>条</div>
            </div>
          </div>
          <div class="main-top-area-right">
            <div class="main-top-area-right-btns">
              <kjsc-button
                class="stop-btn"
                @click="preOneKeyStop"
                >一键停用</kjsc-button
              >
              <kjsc-button
                class="delete-btn"
                @click="preOneKeyDelete"
                >一键删除</kjsc-button
              >
              <kjsc-button
                class="recheck-btn"
                @click="reCheck"
                >重新检测</kjsc-button
              >
            </div>
          </div>
        </div>
      </div>
      <el-tabs v-model="state.activeName" @tab-change="handleChange" stripe class="type-tabs">
        <el-tab-pane label="全部" name="all"></el-tab-pane>
      </el-tabs>
      <div class="main-bottom-area">
        <el-table v-loading="state.loading" stripe :data="state.tableData" max-height="430">
          <el-table-column
            prop="fileName"
            label="智能勾选"
            width="200"
          >
            <template #header>
              <!-- <el-checkbox
                class="check-box"
                v-model="state.checkAll"
                label=""
                @change="handleCheckAllChange"
              /> -->
              智能勾选
            </template>
            <template #default="scope">
              <div class="inner-rows">
                <el-tooltip
                  v-for="(item, i) in scope.row" :key="'check_'+i"
                  effect="dark"
                  :content="item.fileName"
                >
                  <div class="rowi">
                    <el-checkbox
                      class="check-box"
                      v-model="item.check"
                      label=""
                    />
                    <span>{{ item.fileName }}</span>
                  </div>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="createBy" label="创建人" width="120" :show-overflow-tooltip="true">
            <template #default="scope">
              <div class="inner-rows">
                <div v-for="(item, i) in scope.row" :key="'createBy_'+i" class="rowi">
                  <span>{{ item.createBy }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="160">
            <template #default="scope">
              <div class="inner-rows">
                <div v-for="(item, i) in scope.row" :key="'createTime_'+i" class="rowi">
                  <span>{{ item.createTime }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="使用状态" width="80">
            <template #default="scope">
              <div class="inner-rows">
                <div v-for="(item, i) in scope.row" :key="'useStatus_'+i" class="rowi">
                  <span v-if="item.status == 0" class="use-status-using">启用</span>
                  <span v-else class="use-status-not">停用</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="versionCode" label="版本号" width="70">
            <template #default="scope">
              <div class="inner-rows">
                <div v-for="(item, i) in scope.row" :key="'versionCode_'+i" class="rowi">
                  <span>{{ item.versionCode }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="parseStatus" label="解析状态" width="80">
            <template #default="scope">
              <div class="inner-rows">
                <div v-for="(item, i) in scope.row" :key="'parseStatus_'+i" class="rowi">
                  <span>{{ item.parseStatus }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="similarity" label="相似度" width="100">
            <template #default="scope">
              <span :class="parseInt(scope.row[0].similarity) > 80 ? 'high-similarity':''">{{ scope.row[0].similarity }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="path" label="文件路径" width="300">
            <template #default="scope">
              <div class="inner-rows">
                <el-tooltip
                  v-for="(item, i) in scope.row" :key="'path_'+i"
                  effect="dark"
                  :content="item.path"
                >
                  <div class="rowi">
                    <span>{{ item.path }}</span>
                  </div>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <!-- <kjsc-pagination
        v-show="state.total > 0"
        :total="state.total"
        :page="{ pageNum: state.queryParams.pageNum, pageSize: state.queryParams.pageSize }"
        @change="handlePageChange"
        style="padding-top: 16px;"
      /> -->
    </div>
  </el-dialog>
</template>
<script setup name="CheckResultDialog">
// import { listDept } from "@/api/system/dept";
// import { listUser } from "@/api/system/user";
import {
  repeatContentCheckTaskStatus,
  repeatContentCheckTaskList,
  repeatContentCheckTaskRecheck,
  batchUpdateLibFileStatusDisableApi,
  batchDeleteLibFileApi
} from "@/api/knowledge/knowledgeApi.js";
// import { nextTick } from "vue";
import { ElMessageBox } from 'element-plus'
import { computed } from "vue";

const { proxy } = getCurrentInstance();
const emits = defineEmits(["update:modelValue", "done"]);


const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '重复内容检测',
  }
});
const state = reactive({
  loading: false,
  tableData: [],
  activeName:'all',
  selectCount: 0,
  totalCouont: 0,
  checkAll: false,
  checkStatus: '',
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    // orderByColumn: "updateTime",
    // isAsc: "desc",
  }
});
const handleChange = (val) => {
  if(state.activeName=='all'){
    
  }
};
// const emitResult = () => {
//   emits("done");
// };

const onOpen = () => {
  checkResult();
};
const onClose = () => {
  state.activeName = "all"
  // emitResult();
};

// 分页
const handlePageChange = ({ page, type }) => {
  if (type === "size") {
    state.queryParams.pageNum = 1;
  } else {
    state.queryParams.pageNum = page.pageNum;
  }
  state.queryParams.pageSize = page.pageSize;
  getList();
};
/** 查询列表 */
const getList = () => {
  state.loading = true;
  // 先去查询状态
  const searchParams = {};
  return repeatContentCheckTaskList(searchParams, state.queryParams).then(
    function(res){
      state.loading = false;
      state.tableData = res?.rows[0] || [];
      state.total = res.total || 0;
      return res;
    },function(){
      state.loading = false;
      state.tableData = [];
      state.total = 0;
    }
  ).then(updateCheckboxAttrs);
  // if (res.code === 200) {
  //   list.value.tableData = res.rows;
  //   total.value = res.total;
  //   state.loading = false;
  // } else {
  //   state.loading = false;
  //   proxy.$modal.msgError("查询失败");
  // }
};
const updateCheckboxAttrs = () => {
  state.checkAll = false;
  const updateAttr = (item, index) => {
    item.check = index  == 0;
  };
  state.tableData.forEach(items=>{
    items.forEach(updateAttr);
  });
};
const handleCheckAllChange = () => {
  state.tableData.forEach(items=>{
    items.forEach(item=>{
      item.check = state.checkAll;
    });
  });
};
const checkResult = () => {
  repeatContentCheckTaskStatus().then(function(res){
    const data = res?.data || {};
    let status = '';
    if (data.status || data.status === 0) {
      status = data.status + '';
    }
    state.checkStatus = status;
    
    // 0待执行、1进行中、2已完成、3暂停、4取消 5 已结束
    if (status === '2' || status === '5') {
      getList();
    } else if (status === '1' || status === '3'){
      // setTimeout(checkResult,2000);
    } else {
      // setTimeout(checkResult,3000 * 10);
    }
  }, () => {
    // setTimeout(checkResult,3000 * 10);
  });
};

top.state = state;
const getCheckDatas = () => {
  let temp = [];
  state.tableData.forEach(items=>{
    temp = temp.concat(items.filter(item=>{
      return item.check;
    }));
  });
  return temp
  // return state.tableData.filter(item=>{
  //   return item.check;
  // });
};
top.getCheckDatas = getCheckDatas;
const preOneKeyStop = () => {
  const ids = getCheckDatas().map(item=>item.id);
  if (ids.length <= 0) {
    return
  }
  batchUpdateLibFileStatusDisableApi(ids).then(function(res){
    if(res.code==200){
      proxy.$modal.msgSuccess("操作成功");
      getList();
    }else{
      proxy.$modal.msgError("操作失败");
    }
  });
};

const preOneKeyDelete = () => {
  const ids = getCheckDatas().map(item=>item.id);
  if (ids.length <= 0) {
    return
  }
  ElMessageBox.confirm('<div style="text-align:center"><div>是否确认删除选中文件？</div><div>删除文件将进入【回收站】，30天内可选择恢复</div></div>', "中止检测", {
    dangerouslyUseHTMLString: true,
    customClass: 'danger-confirm',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: "warning",
  }).then(()=>{
    // 确定删除
    doOneKeyDelete();
  },()=>{
    // 不取消
  });
};

const doOneKeyDelete = () => {
  const ids = getCheckDatas().map(item=>item.id);
  if (ids.length <= 0) {
    return
  }
  batchDeleteLibFileApi(ids).then(function(res){
    if(res.code==200){
      proxy.$modal.msgSuccess("操作成功");
      getList();
    }else{
      proxy.$modal.msgError("操作失败");
    }
  });
};

const reCheckCallback = ()=>{
  state.checkStatus = '';
  state.tableData = [];
  checkResult();
};

const reCheck = () => {
  repeatContentCheckTaskRecheck().then(reCheckCallback, reCheckCallback);
};

</script>
<style lang="less" scoped>
.main-area {
  height: 600px;
  display: flex;
  flex-direction: column;
  .main-top-area {
    width: 100%;
    flex-grow: 0;
  }
  .type-tabs {
    flex-grow: 0;
  }
  .main-bottom-area {
    flex-grow: 1;
    .el-table {
      height: 100%;
    }
  }
  .left-area {
    flex-grow: 1;
  }
  .right-area {
    width: 230px;
    flex-shrink: 0;
    padding-left: 20px;
    max-height: 532px;
    overflow: auto;
  }
  .filter-tree {
    overflow: auto;
    max-height: 500px;
  }
}
.main-top-area-inner {
  height: 60px;
  width: 100%;
  display: flex;
  align-items: center;
  .main-top-area-left {
    width: 60px;
    height: 60px;
    img {
      display: block;
      width: 100%;
      height: 100%;
    }
  }
  .main-top-area-middle {
    flex-grow: 1;
    margin-left: 16px;
  }
}
.main-top-area-middle {
  text-align: left;
  font-style: normal;
  text-transform: none;
  color: #333333;
  font-weight: 400;
  .row0 {
    font-size: 18px;
    line-height: 26px;
  }
  .row1 {
    font-size: 14px;
    line-height: 20px;
  }
}
.main-top-area-right-btns {
  .el-button {
    border-radius: 8px;
  }
}
.stop-btn {
  background: #236FD2;
  color: #fff;
}
.delete-btn {
  background: #E35D5D;
  color: #fff;
}
.high-similarity {
  color: #E35D5D;
}
.use-status-using {
  color: #236FD2;
}
.use-status-not {
  color: #666666;
}
.rowi {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  .el-checkbox {
    height: 16px;
    vertical-align: text-bottom;
  }
}
</style>