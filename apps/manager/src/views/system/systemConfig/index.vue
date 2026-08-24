<template>
  <div class="app-container">
    <div style="display: flex; justify-content: space-between">
      <el-form :model="queryParams" ref="queryRef" :inline="true">
        <el-form-item label="" prop="keyWord">
          <el-input
            v-model="queryParams.keyWord"
            placeholder="通过名称、租户名称进行模糊搜索"
            clearable
            style="width: 300px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item v-if="isPlatformRole" label="" prop="tenantId">
          <el-select v-model="queryParams.tenantId" placeholder="全部租户" clearable style="width: 100%">
            <el-option label="全部租户" value=""></el-option>
            <el-option v-for="dict in tenantOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="">
          <el-date-picker
            style="width: 260px"
            v-model="dateRange"
            value-format="YYYY-MM-DD"
            type="daterange"
            range-separator="-"
            start-placeholder="修改开始时间"
            end-placeholder="修改结束时间"
          ></el-date-picker>
        </el-form-item>
        <el-form-item style="margin-left: 8px">
          <kjsc-button type="primary" @click="handleQuery">搜索</kjsc-button>
          <kjsc-button plain @click="resetQuery">重置</kjsc-button>
        </el-form-item>
      </el-form>

      <kjsc-button type="success" @click="handleAdd" v-hasPermi="['system:systemConfig:add']">新增</kjsc-button>
    </div>

    <el-table v-loading="loading" :data="userList">
      <!--   @cell-mouse-enter="handleMouseEnter"
      @cell-mouse-leave="handleMouseLeave" -->
      <template #empty>
        <kjsc-empty />
      </template>
      <el-table-column label="名称" key="name" prop="name" min-width="120" />
      <el-table-column label="ID" key="id" prop="id" min-width="120">
        <template #default="scope">
          {{ scope.row.id }}
          <!--  v-show="hoveredRow === scope.row" -->
          <kjsc-text-button type="primary" @click="copyText(scope.row.id)" style="margin-left: 10px">复制</kjsc-text-button>
        </template>
      </el-table-column>
      <el-table-column label="密钥" key="secretKey" prop="secretKey" min-width="240">
        <template #default="scope">
          <span>{{ scope.row.secretKey }}</span>
          <span class="btn-span" style="right: 85px" @click.stop="changeKey(scope.row)"><span class="mycopy">更换密钥</span></span>
          <span class="btn-span" @click.stop="copyText(scope.row.secretKey)"><span class="mycopy">复制</span></span>
        </template>
      </el-table-column>
      <el-table-column label="所属租户" key="tenantName" prop="tenantName" min-width="100" />

      <el-table-column label="最新修改时间" prop="updateTime" min-width="160">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" class-name="small-padding fixed-width">
        <template #default="scope">
          <kjsc-text-button type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:systemConfig:edit']">修改</kjsc-text-button>
          <kjsc-text-button type="danger" @click="handleRemove(scope.row)" v-hasPermi="['system:systemConfig:remove']">删除</kjsc-text-button>
        </template>
      </el-table-column>
    </el-table>
    <kjsc-pagination
      v-show="total > 0"
      :total="total"
      :page="{
        pageNum: pageParams.pageNum,
        pageSize: pageParams.pageSize
      }"
      @change="handlePageChange"
      style="padding-top: 16px"
    />

    <!-- 添加或修改系统配置对话框 -->
    <KJSCDialogV2 :title="title" v-model="addAndEditDialogVisiable" width="600px" append-to-body :showCloseBtn="false" :showSubitBtn="false">
      <el-form :model="form" :rules="rules" ref="userRef" label-width="120px">
        <el-form-item label="系统名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入中文名称如：通用智能体中台" maxlength="10" show-word-limit />
        </el-form-item>
        <el-form-item label="系统所属租户" prop="tenantId">
          <el-select style="width: 100%" v-model="form.tenantId" placeholder="所有租户"
            ><el-option v-for="item in tenantOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
          <div>*修改所属租户后，关联了该系统的审核范围需要重新配置</div>
        </el-form-item>
      </el-form>
      <template #prefixFooter>
        <div class="dialog-footer">
          <kjsc-button @click="cancel">取 消</kjsc-button>
          <kjsc-button type="primary" @click="submitForm" :disabled="submitDisabled">确认{{ form.id ? '修改' : '新增' }}</kjsc-button>
        </div>
      </template>
    </KJSCDialogV2>

    <!-- 更换密钥\删除对话框 -->
    <KJSCDialogV2 :title="changeTitle" v-model="changeKeyDialogVisiable" width="600px" append-to-body :showCloseBtn="false" :showSubitBtn="false">
      <div style="padding: 0 0 20px 0; box-sizing: border-box" v-if="changeKeyForm.dialogType === 'key'">
        您确定要重新生成<span style="color: #6397ff">{{ changeKeyForm.name }}</span
        >的密钥吗？之前的密钥将无法使用
      </div>
      <div style="padding: 0 0 20px 0; box-sizing: border-box" v-else>
        您确定要删除<span style="color: #6397ff">{{ changeKeyForm.name }}</span
        >这个系统吗？删除后关联了该系统的审核范围需要重新配置
      </div>
      <template #prefixFooter>
        <div class="dialog-footer">
          <kjsc-button @click="cancel">取 消</kjsc-button>
          <kjsc-button type="primary" @click="changeSubmitForm">确 定</kjsc-button>
        </div>
      </template>
    </KJSCDialogV2>
  </div>
</template>

<script setup name="SystemConfig">
import KJSCDialogV2 from '@/components/KJSCCmpt/KJSCDialogV2.vue';
import api from '@/utils/api';
import { fastCopy } from '@/utils/fastCopy.js';
import { isEmpty } from '@/utils/common.js';
import useUserStore from '@/store/modules/user';

const { proxy } = getCurrentInstance();
const userStore = useUserStore();

const userList = ref([]);
const addAndEditDialogVisiable = ref(false);
const changeKeyDialogVisiable = ref(false);
const loading = ref(true);
const total = ref(0);
const title = ref('');
const changeTitle = ref('');
const dateRange = ref([]);
const tenantOptions = ref([]);

const data = reactive({
  changeKeyForm: {},
  form: {
    name: '',
    tenantId: ''
  },
  pageParams: {
    pageNum: 1,
    pageSize: 10
  },
  sortInfo: { orderByColumn: 'updateTime', isAsc: 'desc' }, // 排序
  queryParams: {
    keyWord: '',
    tenantId: ''
  },
  rules: {
    name: [{ required: true, message: '系统名称不能为空', trigger: 'blur' }],
    tenantId: [{ required: true, message: '系统所属租户不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, changeKeyForm, rules, pageParams, sortInfo } = toRefs(data);

// 是否是平台管理租户角色
const isPlatformRole = computed(() => {
  return userStore.isPlatformTenant;
});

// 是否必填为空
const submitDisabled = computed(() => {
  return isEmpty(form.value.name) || isEmpty(form.value.tenantId);
});

// const hoveredRow = ref(null);

// const handleMouseEnter = (row, column) => {
//   if (column.label === "操作") {
//     return;
//   }
//   hoveredRow.value = row;
// };

// const handleMouseLeave = () => {
//   hoveredRow.value = null;
// };

// 复制
const copyText = (text) => {
  fastCopy(text, '复制成功');
};

// 更换密钥
const changeKey = (row) => {
  changeTitle.value = '重新生成密钥';
  changeKeyForm.value = row;
  changeKeyForm.value.dialogType = 'key';
  changeKeyDialogVisiable.value = true;
};
const changeKeyCallBack = async (row) => {
  let res = await api.systemConfig.changeSecretKey(row.id);
  if (res.code === 200) {
    proxy.$modal.msgSuccess('操作成功');
    cancel();
    getList();
  } else {
    proxy.$modal.msgSuccess(res.msg || '操作失败，请重新提交');
  }
};

// 分页器触发
const handlePageChange = ({ page, type }) => {
  pageParams.value.pageNum = page.pageNum;
  pageParams.value.pageSize = page.pageSize;
  getList();
};

// 查询租户下拉
const getTanentList = async () => {
  let res = await api.tenant.getCurTanent();
  if (res.code === 200) {
    tenantOptions.value = res.data;
  }
};

/** 查询系统列表 */
const getList = async () => {
  loading.value = true;
  let params = proxy.addDateRange(queryParams.value, dateRange.value);
  let res = await api.systemConfig.list(
    {
      ...params,
      beginTime: params.params.beginTime,
      endTime: params.params.endTime
    },
    pageParams.value,
    sortInfo.value
  );
  if (res.code === 200) {
    loading.value = false;
    userList.value = res.rows;
    total.value = res.total;
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  pageParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = [];
  proxy.resetForm('queryRef');
  getList();
  handleQuery();
};

const changeSubmitForm = () => {
  if (changeKeyForm.value.dialogType === 'key') {
    changeKeyCallBack(changeKeyForm.value);
  } else {
    confirmCallback(changeKeyForm.value);
  }
};

/** 删除按钮操作 */
const handleRemove = (row) => {
  changeTitle.value = '删除确认';
  changeKeyForm.value = row;
  changeKeyForm.value.dialogType = 'remove';
  changeKeyDialogVisiable.value = true;
};
const confirmCallback = async (data) => {
  let res = await api.systemConfig.deleteById(data.id);
  if (res.code === 200) {
    proxy.$modal.msgSuccess('操作成功');
    cancel();
    getList();
  } else {
    proxy.$modal.msgSuccess(res.msg || '操作失败，请重新提交');
  }
};

/** 重置操作表单 */
const reset = () => {
  form.value = {
    id: undefined,
    name: undefined,
    tenantId: ''
  };
  changeKeyForm.value = {};
  changeTitle.value = '';
  proxy.resetForm('userRef');
};

/** 取消按钮 */
const cancel = () => {
  addAndEditDialogVisiable.value = false;
  changeKeyDialogVisiable.value = false;
  reset();
};

/** 新增按钮操作 */
const handleAdd = async () => {
  reset();
  title.value = '添加系统';
  getTanentList();
  addAndEditDialogVisiable.value = true;
};

/** 修改按钮操作 */
const handleUpdate = async (row) => {
  reset();
  let res = await api.systemConfig.getById(row.id);
  if (res.code === 200) {
    form.value = res.data;
    title.value = '修改系统';
    getTanentList();
    addAndEditDialogVisiable.value = true;
  }
};

/** 提交按钮 */
const submitForm = () => {
  proxy.$refs['userRef'].validate(async (valid) => {
    if (valid) {
      let res = {};
      if (form.value.id) {
        res = await api.systemConfig.edit(form.value);
      } else {
        res = await api.systemConfig.add(form.value);
      }
      if (res.code === 200) {
        proxy.$modal.msgSuccess('操作成功');
        addAndEditDialogVisiable.value = false;
        getList();
      } else {
        proxy.$modal.msgSuccess(res.msg || '操作失败，请重新提交');
      }
    }
  });
};

const init = () => {
  getList();
  getTanentList();
};
init();
</script>

<style lang="less" scoped>
.btn-span {
  position: absolute;
  right: 20px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}
.mycopy {
  display: block;
  width: 80px;
  height: 18px;
  font-size: 14px;
  color: #6397ff;
}
</style>
