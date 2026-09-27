<template>
  <div class="app-container">
    <div style="display: flex; justify-content: space-between">
      <el-form :model="queryParams" ref="queryRef" :inline="true">
        <el-form-item label="" prop="keyWord">
          <el-input
            v-model="queryParams.keyWord"
            :placeholder="$t('page.system.systemConfig.searchBySystemOrTenantName', '通过名称、租户名称进行模糊搜索')"
            clearable
            style="width: 300px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item v-if="isPlatformRole" label="" prop="tenantId">
          <el-select v-model="queryParams.tenantId" :placeholder="$t('page.system.role.allTenants', '全部租户')" clearable style="width: 100%">
            <el-option :label="$t('page.system.role.allTenants', '全部租户')" value=""></el-option>
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
            :start-placeholder="$t('page.system.systemConfig.updatedAfter', '修改开始时间')"
            :end-placeholder="$t('page.system.systemConfig.updatedBefore', '修改结束时间')"
          ></el-date-picker>
        </el-form-item>
        <el-form-item style="margin-left: 8px">
          <kjsc-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</kjsc-button>
          <kjsc-button plain @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</kjsc-button>
        </el-form-item>
      </el-form>

      <kjsc-button type="success" @click="handleAdd" v-hasPermi="['system:systemConfig:add']">{{ $t('page.normal.add', '新增') }}</kjsc-button>
    </div>

    <el-table v-loading="loading" :data="userList">
      <!--   @cell-mouse-enter="handleMouseEnter"
      @cell-mouse-leave="handleMouseLeave" -->
      <template #empty>
        <kjsc-empty />
      </template>
      <el-table-column :label="$t('page.mcp.name', '名称')" key="name" prop="name" min-width="120" />
      <el-table-column label="ID" key="id" prop="id" min-width="120">
        <template #default="scope">
          {{ scope.row.id }}
          <!--  v-show="hoveredRow === scope.row" -->
          <kjsc-text-button type="primary" @click="copyText(scope.row.id)" style="margin-left: 10px">{{ $t('page.normal.copy', '复制') }}</kjsc-text-button>
        </template>
      </el-table-column>
      <el-table-column :label="$t('page.system.systemConfig.key', '密钥')" key="secretKey" prop="secretKey" min-width="240">
        <template #default="scope">
          <span>{{ scope.row.secretKey }}</span>
          <span class="btn-span" style="right: 85px" @click.stop="changeKey(scope.row)"><span class="mycopy">{{ $t('page.system.systemConfig.replaceKey', '更换密钥') }}</span></span>
          <span class="btn-span" @click.stop="copyText(scope.row.secretKey)"><span class="mycopy">{{ $t('page.normal.copy', '复制') }}</span></span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('page.system.role.form.tenantName', '所属租户')" key="tenantName" prop="tenantName" min-width="100" />

      <el-table-column :label="$t('page.system.systemConfig.lastUpdated', '最新修改时间')" prop="updateTime" min-width="160">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('page.normal.operation', '操作')" width="220" class-name="small-padding fixed-width">
        <template #default="scope">
          <kjsc-text-button type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:systemConfig:edit']">{{ $t('page.system.dict.form.update', '修改') }}</kjsc-text-button>
          <kjsc-text-button type="danger" @click="handleRemove(scope.row)" v-hasPermi="['system:systemConfig:remove']">{{ $t('page.normal.delete', '删除') }}</kjsc-text-button>
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
        <el-form-item :label="$t('page.system.systemConfig.systemName', '系统名称')" prop="name">
          <el-input v-model="form.name" :placeholder="$t('page.platformManager.tenantManager.enterAChineseNameEGGeneralAgentPlatform', '请输入中文名称如：通用智能体中台')" maxlength="10" show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('page.system.systemConfig.systemTenant', '系统所属租户')" prop="tenantId">
          <el-select style="width: 100%" v-model="form.tenantId" :placeholder="$t('page.system.systemConfig.allTenants', '所有租户')"
            ><el-option v-for="item in tenantOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
          <div>{{ $t('page.system.systemConfig.changingTheTenantRequiresReconfiguringTheReviewScopesAssociatedWith', '*修改所属租户后，关联了该系统的审核范围需要重新配置') }}</div>
        </el-form-item>
      </el-form>
      <template #prefixFooter>
        <div class="dialog-footer">
          <kjsc-button @click="cancel">{{ $t('component.excelImportDialog.cancel', '取 消') }}</kjsc-button>
          <kjsc-button type="primary" @click="submitForm" :disabled="submitDisabled">{{ form.id ? $t('page.system.user.form.confirmEdit', '确认修改') : $t('page.system.user.form.confirmAdd', '确认新增') }}</kjsc-button>
        </div>
      </template>
    </KJSCDialogV2>

    <!-- 更换密钥\删除对话框 -->
    <KJSCDialogV2 :title="changeTitle" v-model="changeKeyDialogVisiable" width="600px" append-to-body :showCloseBtn="false" :showSubitBtn="false">
      <div style="padding: 0 0 20px 0; box-sizing: border-box" v-if="changeKeyForm.dialogType === 'key'">
        <i18n-t keypath="page.system.systemConfig.regenerateKeyConfirm" scope="global">
          <template #name><span style="color: #6397ff">{{ changeKeyForm.name }}</span></template>
        </i18n-t>
      </div>
      <div style="padding: 0 0 20px 0; box-sizing: border-box" v-else>
        <i18n-t keypath="page.system.systemConfig.deleteConfirm" scope="global">
          <template #name><span style="color: #6397ff">{{ changeKeyForm.name }}</span></template>
        </i18n-t>
      </div>
      <template #prefixFooter>
        <div class="dialog-footer">
          <kjsc-button @click="cancel">{{ $t('component.excelImportDialog.cancel', '取 消') }}</kjsc-button>
          <kjsc-button type="primary" @click="changeSubmitForm">{{ $t('component.excelImportDialog.confirm', '确 定') }}</kjsc-button>
        </div>
      </template>
    </KJSCDialogV2>
  </div>
</template>

<script setup name="SystemConfig">
import { t } from '@/i18n';
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
    name: [{ required: true, get message() { return t('page.system.systemConfig.systemNameIsRequired', '系统名称不能为空'); }, trigger: 'blur' }],
    tenantId: [{ required: true, get message() { return t('page.system.systemConfig.systemTenantIsRequired', '系统所属租户不能为空'); }, trigger: 'change' }]
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
  fastCopy(text, t('page.normal.copySuccess', '复制成功'));
};

// 更换密钥
const changeKey = (row) => {
  changeTitle.value = t('page.system.systemConfig.regenerateKey', '重新生成密钥');
  changeKeyForm.value = row;
  changeKeyForm.value.dialogType = 'key';
  changeKeyDialogVisiable.value = true;
};
const changeKeyCallBack = async (row) => {
  let res = await api.systemConfig.changeSecretKey(row.id);
  if (res.code === 200) {
    proxy.$modal.msgSuccess(t('common.dict.operationSuccessful', '操作成功'));
    cancel();
    getList();
  } else {
    proxy.$modal.msgSuccess(res.msg || t('page.platformManager.tenantManager.operationFailedPleaseTryAgain', '操作失败，请重新提交'));
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
  changeTitle.value = t('page.system.systemConfig.confirmDeletion', '删除确认');
  changeKeyForm.value = row;
  changeKeyForm.value.dialogType = 'remove';
  changeKeyDialogVisiable.value = true;
};
const confirmCallback = async (data) => {
  let res = await api.systemConfig.deleteById(data.id);
  if (res.code === 200) {
    proxy.$modal.msgSuccess(t('common.dict.operationSuccessful', '操作成功'));
    cancel();
    getList();
  } else {
    proxy.$modal.msgSuccess(res.msg || t('page.platformManager.tenantManager.operationFailedPleaseTryAgain', '操作失败，请重新提交'));
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
  title.value = t('page.system.systemConfig.addSystem', '添加系统');
  getTanentList();
  addAndEditDialogVisiable.value = true;
};

/** 修改按钮操作 */
const handleUpdate = async (row) => {
  reset();
  let res = await api.systemConfig.getById(row.id);
  if (res.code === 200) {
    form.value = res.data;
    title.value = t('page.system.systemConfig.editSystem', '修改系统');
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
        proxy.$modal.msgSuccess(t('common.dict.operationSuccessful', '操作成功'));
        addAndEditDialogVisiable.value = false;
        getList();
      } else {
        proxy.$modal.msgSuccess(res.msg || t('page.platformManager.tenantManager.operationFailedPleaseTryAgain', '操作失败，请重新提交'));
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
