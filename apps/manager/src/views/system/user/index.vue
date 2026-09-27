<template>
  <section>
    <page-name>
      <el-button type="primary" icon="Plus" v-hasPermi="['system:user:add']" @click="handleAdd">
        {{ $t('page.system.user.add', '新增用户') }}
      </el-button>
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.userName"
              class="search-bar__input"
              :suffix-icon="'Search'"
              clearable
              :placeholder="$t('page.system.user.searchPlaceholder', '通过用户ID、昵称、创建人进行模糊搜索')"
              @keyup.enter="handleQuery"
            />
          </div>

          <el-date-picker
            v-model="dateRange"
            value-format="YYYY-MM-DD"
            type="daterange"
            style="max-width: 250px"
            :range-separator="$t('page.system.user.rangeSeparator', '至')"
            :start-placeholder="$t('page.system.user.startDatePlaceholder', '开始时间')"
            :end-placeholder="$t('page.system.user.endDatePlaceholder', '结束时间')"
          />

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table ref="userTableRef" v-loading="loading" :data="userList" height="100%" @selection-change="handleSelectionChange">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column
          :label="$t('page.system.user.table.userId', '用户编号')"
          align="left"
          key="userId"
          prop="userId"
          :min-width="$dim('page.system.user.table.userId', 100)"
          v-if="columns.userId.visible"
        />
        <el-table-column
          :label="$t('page.system.user.table.nickName', '用户昵称')"
          align="left"
          key="nickName"
          prop="nickName"
          :min-width="$dim('page.system.user.table.nickName', 120)"
          v-if="columns.nickName.visible"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.system.user.table.userName', '登录账号')"
          align="left"
          key="userName"
          prop="userName"
          :min-width="$dim('page.system.user.table.userName', 120)"
          v-if="columns.userName.visible"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          v-if="columns.createBy.visible"
          :label="$t('page.system.user.table.createBy', '创建人')"
          key="createBy"
          prop="createBy"
          :min-width="$dim('page.system.user.table.createBy', 120)"
          align="left"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          v-if="columns.roleName.visible"
          :label="$t('page.system.user.table.roleName', '所属角色')"
          key="roleName"
          prop="roleName"
          :min-width="$dim('page.system.user.table.roleName', 120)"
          align="left"
        />
        <el-table-column
          v-if="columns.tenantName.visible"
          :label="$t('page.system.user.table.tenantName', '所属租户')"
          key="tenantName"
          prop="tenantName"
          :min-width="$dim('page.system.user.table.tenantName', 120)"
          align="left"
        />
        <el-table-column
          :label="$t('page.system.user.table.status', '启用状态')"
          align="center"
          key="status"
          :min-width="$dim('page.system.user.table.status', 100)"
          v-if="columns.status.visible"
        >
          <template #default="scope">
            <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.user.table.updateTime', '更新时间')"
          align="left"
          prop="updateTime"
          :min-width="$dim('page.system.user.table.updateTime', 170)"
          v-if="columns.updateTime.visible"
        />
        <el-table-column
          :label="$t('page.system.user.table.operation', '操作')"
          align="left"
          :min-width="$dim('page.system.user.table.operation', 180)"
          fixed="right"
        >
          <template #default="{ row }">
            <template v-if="row.userId !== 1">
              <el-button link type="primary" @click="handleUpdate(row)" v-hasPermi="['system:user:edit']">
                {{ $t('page.normal.edit', '编辑') }}
              </el-button>
              <el-button link type="danger" @click="handleDelete(row)" v-hasPermi="['system:user:remove']">
                {{ $t('page.normal.remove', '删除') }}
              </el-button>
              <el-button link type="primary" @click="handleResetPwd(row)" v-hasPermi="['system:user:edit']">
                {{ $t('page.normal.reset', '重置') }}
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </template>
    </page-content>

    <!-- 添加或修改用户配置对话框 -->
    <KjscRtlDrawer
      :title="form.userId ? $t('page.system.user.form.editTitle', '修改用户') : $t('page.system.user.form.addTitle', '添加用户')"
      v-model="open"
      size="800px"
    >
      <el-form :model="form" :rules="rules" ref="userRef" label-position="top" class="user-form" hide-required-asterisk>
        <el-form-item :label="$t('page.system.user.form.nickName', '用户昵称')" prop="nickName">
          <el-input
            v-model="form.nickName"
            :placeholder="$t('page.system.user.form.nickNamePlaceholder', '支持中文、数字、字母')"
            maxlength="6"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="$t('page.system.user.form.userName', '登录账号')" prop="userName">
          <el-input
            v-model="form.userName"
            :placeholder="$t('page.system.user.form.userNamePlaceholder', '支持数字、字母，推荐使用手机号')"
            :disabled="form.userId"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="$t('page.system.user.form.dept', '部门')" prop="deptIds">
          <el-tree-select
            v-model="form.deptIds"
            :data="enabledDeptOptions"
            :props="deptTreeProps"
            multiple
            check-strictly
            :render-after-expand="false"
            :placeholder="$t('page.normal.selectPlaceholder', '请选择')"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('page.system.user.form.post', '岗位')" prop="postIds">
          <el-select-v2
            v-model="form.postIds"
            :options="positionService.listData"
            :props="positionProps"
            multiple
            :placeholder="$t('page.normal.selectPlaceholder', '请选择')"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item :label="$t('page.system.user.form.tenantName', '所属租户')" prop="tenantId">
          <el-select
            style="width: 100%"
            v-model="form.tenantId"
            :placeholder="$t('page.system.user.form.tenantPlaceholder', '请选择租户')"
            :disabled="form.userId"
            @change="handleChangeTenant"
          >
            <el-option v-for="item in tenantOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('page.system.user.form.roleName', '所属角色')" prop="roleIds">
          <el-select style="width: 100%" v-model="form.roleIds" :placeholder="$t('page.system.user.form.rolePlaceholder', '请选择角色')">
            <template #prefix>
              <el-tag v-if="isInternalRole" :key="form.roleKey" size="small" type="info" effect="light">{{
                $t('page.normal.builtin', '系统内置')
              }}</el-tag>
            </template>
            <el-option v-for="item in roleOptions" :key="item.roleId" :label="item.roleName" :value="item.roleId"></el-option>
          </el-select>
        </el-form-item>
        <div class="password-tip">
          <el-icon><Info /></el-icon>
          <el-text>{{ $t('page.system.user.form.initialPassword', '账号初始密码为') }} {{ orginPwd }}</el-text>
        </div>
      </el-form>
      <template #footer>
        <el-button type="primary" :disabled="submitDisabled" @click="submitForm">
          {{ form.userId ? $t('page.system.user.form.confirmEdit', '确认修改') : $t('page.system.user.form.confirmAdd', '确认新增') }}
        </el-button>
      </template>
    </KjscRtlDrawer>

    <!-- 重置密码对话框 -->
    <KJSCDialogV2
      :title="$t('page.system.user.resetPassword.title', '提示')"
      v-model="resetPwdOpen"
      width="520px"
      append-to-body
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <div>
        {{ $t('page.system.user.resetPassword.prompt', { userName: resetPwdUser.userName }, '请输入“{userName}”的新密码') }}
        <el-input
          v-model="resetPwdValue"
          :placeholder="$t('page.system.user.resetPassword.placeholder', '请输入新密码')"
          @keyup.enter="submitResetPwd"
          @input="resetPwdError = ''"
        />
        <p v-if="resetPwdError" class="reset-pwd-form__error">{{ resetPwdError }}</p>
      </div>
      <template #prefixFooter>
        <el-button @click="closeResetPwd">{{ $t('page.normal.cancel', '取消') }}</el-button>
        <el-button type="primary" @click="submitResetPwd">{{ $t('page.normal.confirm', '确定') }}</el-button>
      </template>
    </KJSCDialogV2>

    <!-- 用户导入对话框 -->
    <!-- <excel-import-dialog
      ref="importUserRef"
      :title="$t('page.system.user.import.title', '用户导入')"
      action="/system/user/importData"
      template-action="/system/user/importTemplate"
      template-file-name="user_template"
      :update-support-label="$t('page.system.user.import.updateExisting', '是否更新已经存在的用户数据')"
      @success="getList"
    /> -->
  </section>
</template>

<script setup lang="ts" name="User">
import { t } from '@/i18n';
// import { getToken } from "@/utils/auth"
// import useAppStore from '@/store/modules/app'
import useUserStore from '@/store/modules/user';
import ExcelImportDialog from '@/components/ExcelImportDialog/index.vue';
import type { FormInstance } from 'element-plus/es/components/form';
import {
  changeUserStatus,
  listUser,
  resetUserPwd,
  delUser,
  getUser,
  updateUser,
  addUser,
  deptTreeSelect,
  checkUserNameValue
} from '@/api/system/user';
import { getRoleAllList } from '@/api/system/role';
import { getConfigKey } from '@/api/system/config';
import type { SysUser, UserQueryParams } from '@/types/api/system/user';
import type { SysRole } from '@/types/api/system/role';
import type { SysPost } from '@/types/api/system/post';
import type { TreeSelect, TableShowColumns, ValueLabelOption } from '@/types/api/common';
import _api from '@/utils/api';
import { isEmpty } from '@/utils/common.js';
import cache from '@/plugins/cache';
import modal from '@/plugins/modal';
import { addDateRange } from '@/utils/ruoyi';
import { download } from '@/utils/request';

import positionServiceFactory from '@/service/positionService';
import { Info } from 'lucide-vue-next';

const api: any = _api;

interface UserForm extends Omit<SysUser, 'roleIds'> {
  roleIds?: number;
  deptIds?: number[];
  builtin?: number;
  roleKey?: string;
}

const router = useRouter();
// const appStore = useAppStore()
const userStore = useUserStore();
// const { sys_normal_disable, sys_user_sex } = proxy.useDict("sys_normal_disable", "sys_user_sex")

const deptTreeProps = {
  children: 'children',
  label: 'label',
  value: 'id'
};

const userList = ref<SysUser[]>([]);
const userTableRef = ref();
const userRef = ref<FormInstance>();
const importUserRef = ref<InstanceType<typeof ExcelImportDialog>>();
const open = ref<boolean>(false);
const resetPwdOpen = ref<boolean>(false);
const resetPwdUser = ref<SysUser>({});
const resetPwdValue = ref<string>('');
const resetPwdError = ref<string>('');
const loading = ref<boolean>(true);
const ids = ref<number[]>([]);
const single = ref<boolean>(true);
const multiple = ref<boolean>(true);
const total = ref<number>(0);
const title = ref<string>('');
const dateRange = ref<string[]>([]);
// const deptOptions = ref<TreeSelect[] | undefined>(undefined)
const enabledDeptOptions = ref<TreeSelect[] | undefined>(undefined);
// const initPassword = ref<string | undefined>(undefined)
const postOptions = ref<SysPost[]>([]);
const roleOptions = ref<SysRole[]>([]);
const tenantOptions = ref<ValueLabelOption[]>([]);
const queryTenantOptions = ref<ValueLabelOption[]>([]);
// 列显隐信息
const columns = ref<Record<string, TableShowColumns>>({
  userId: { get label() { return t('page.system.user.table.userId', '用户编号'); }, visible: true },
  userName: { get label() { return t('page.system.user.form.userName', '登录账号'); }, visible: true },
  nickName: { get label() { return t('page.system.user.form.nickName', '用户昵称'); }, visible: true },
  createBy: { get label() { return t('page.system.user.table.createBy', '创建人'); }, visible: true },
  roleName: { get label() { return t('page.system.user.form.roleName', '所属角色'); }, visible: true },
  tenantName: { get label() { return t('page.system.user.form.tenantName', '所属租户'); }, visible: true },
  status: { get label() { return t('page.tenants.status', '状态'); }, visible: true },
  updateTime: { get label() { return t('page.system.systemConfig.lastUpdated', '最新修改时间'); }, visible: true }
});
const positionService = positionServiceFactory({ autoLoad: false });
const positionProps = {
  label: 'postName',
  value: 'postId'
};

// 校验登录账号
const validateUserName = (rule: any, value: string, callback: Function) => {
  if (!value) {
    callback(new Error(t('page.platformManager.tenantManager.signInAccountIsRequired', '登录账号不能为空')));
  } else {
    if (form.value.userId) {
      callback();
    } else {
      const reg = /^[0-9a-zA-Z]*$/;
      if (reg.test(value)) {
        // 接口调用
        checkUserNameValue({ userName: value })
          .then((res: any) => {
            if (!res.data) {
              callback();
            } else {
              callback(new Error(t('page.platformManager.tenantManager.thisSignInAccountIsAlreadyInUseEnterAnother', '该登陆账号已被占用、请重新输入')));
            }
          })
          .catch((err: any) => {
            console.log(err);
          });
      } else {
        callback(new Error(t('page.platformManager.tenantManager.onlyDigitsAndLettersAreAllowed', '只能输入数字和字母')));
      }
    }
  }
};
// 校验用户昵称
const validateNickName = (rule: any, value: string, callback: Function) => {
  if (!value) {
    callback(new Error(t('page.platformManager.tenantManager.nicknameIsRequired', '用户昵称不能为空')));
  } else {
    const regex = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;
    if (regex.test(value)) {
      callback();
    } else {
      callback(new Error(t('page.platformManager.tenantManager.onlyChineseCharactersDigitsAndLettersAreAllowed', '只能输入中文、数字、字母')));
    }
  }
};

const data = reactive({
  form: {} as UserForm,
  queryParams: {
    orderByColumn: 'createTime',
    isAsc: 'desc',
    pageNum: 1,
    pageSize: 10,
    userName: undefined,
    tenantId: undefined,
    phonenumber: undefined,
    status: undefined,
    deptId: undefined
  } as UserQueryParams,
  orginPwd: 'a123456',
  rules: {
    nickName: [{ required: true, validator: validateNickName, trigger: 'blur' }],
    userName: [{ required: true, validator: validateUserName, trigger: 'blur' }],
    tenantId: [{ required: true, get message() { return t('page.system.role.tenantIsRequired', '租户不能为空'); }, trigger: 'change' }],
    roleIds: [{ required: true, get message() { return t('page.platformManager.tenantManager.roleIsRequired', '所属角色不能为空'); }, trigger: 'change' }],
    deptIds: [{ required: true, get message() { return t('page.system.user.departmentIsRequired', '所属部门不能为空'); }, trigger: 'change' }],
    postIds: [{ required: true, get message() { return t('page.system.user.positionIsRequired', '岗位不能为空'); }, trigger: 'change' }]
  }
});

const { queryParams, form, rules, orginPwd } = toRefs(data);

// 是否是平台管理租户角色
const isPlatformRole = computed(() => {
  return userStore.isPlatformTenant;
});

// 是否必填为空
const submitDisabled = computed(() => {
  return isEmpty(form.value.nickName) || isEmpty(form.value.userName) || isEmpty(form.value.tenantId) || isEmpty(form.value.roleIds);
});

// 是否是内置角色
const isInternalRole = computed(() => {
  return form.value.builtin === 0;
});

/** 查询用户列表 */
function getList() {
  loading.value = true;
  listUser(addDateRange(queryParams.value, dateRange.value)).then((res) => {
    loading.value = false;
    userList.value = res.rows;
    total.value = res.total;
    nextTick(() => {
      userTableRef.value?.doLayout();
    });
  });
}

/** 查询部门下拉树结构 */
function getDeptTree() {
  deptTreeSelect().then((response) => {
    // deptOptions.value = response.data
    // enabledDeptOptions.value = filterDisabledDept(JSON.parse(JSON.stringify(response.data)))
    enabledDeptOptions.value = filterDisabledDept((response.data || []) as any);
  });
}

/** 过滤禁用的部门 */
function filterDisabledDept(deptList: TreeSelect[]) {
  return deptList.filter((dept) => {
    if (dept.disabled) {
      return false;
    }
    if (dept.children && dept.children.length) {
      dept.children = filterDisabledDept(dept.children);
    }
    return true;
  });
}

/** 节点单击事件 */
function handleNodeClick(data: any) {
  queryParams.value.deptId = data.id;
  handleQuery();
}

// 获取初始密码
const getInitPassword = () => {
  return getConfigKey('sys.user.initPassword').then((res) => {
    if (res.code === 200) {
      orginPwd.value = res.data || res.msg;
    }
  });
};
/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  queryParams.value.userName = undefined;
  queryParams.value.tenantId = undefined;
  queryParams.value.phonenumber = undefined;
  queryParams.value.status = undefined;
  queryParams.value.deptId = undefined;
  handleQuery();
}

/** 删除按钮操作 */
function handleDelete(row?: SysUser) {
  const userIds = row?.userId || ids.value;
  modal
    .confirm(t('page.system.user.deleteUsersWithIds', { value1: userIds }, '是否确认删除用户编号为"{value1}"的数据项？'))
    .then(function () {
      return delUser(userIds);
    })
    .then(() => {
      getList();
      modal.msgSuccess(t('page.normal.confirmInfo.removeSuccess', '删除成功'));
    })
    .catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  download(
    'system/user/export',
    {
      ...queryParams.value
    },
    `user_${new Date().getTime()}.xlsx`
  );
}

/** 用户状态修改  */
function handleStatusChange(row: SysUser) {
  const text = row.status === '0' ? t('page.normal.enable', '启用') : t('page.normal.disable', '停用');
  modal
    .confirm(t('page.system.user.user', { value1: text, value2: row.userName }, '确认要"{value1}""{value2}"用户吗?'))
    .then(function () {
      return changeUserStatus(row.userId!, row.status!);
    })
    .then(() => {
      modal.msgSuccess(t('page.system.dept.successful', { value1: text }, '{value1}成功'));
    })
    .catch(function () {
      row.status = row.status === '0' ? '1' : '0';
    });
}

/** 更多操作 */
function handleCommand(command: string, row: SysUser) {
  switch (command) {
    case 'handleResetPwd':
      handleResetPwd(row);
      break;
    case 'handleAuthRole':
      handleAuthRole(row);
      break;
    default:
      break;
  }
}

/** 跳转角色分配 */
function handleAuthRole(row: SysUser) {
  const userId = row.userId;
  router.push('/system/user-auth/role/' + userId);
}

function validateResetPwd(value: string): string {
  if (!value) {
    return t('page.system.user.passwordIsRequired', '用户密码不能为空');
  }
  if (!/^.{5,20}$/.test(value)) {
    return t('page.register.passwordMustBeBetween5And20Characters', '用户密码长度必须介于 5 和 20 之间');
  }
  if (/<|>|"|'|\||\\/.test(value)) {
    return t('page.system.user.theFollowingCharactersAreNotAllowed', '不能包含非法字符：< > " \' \\ {\'|\'}');
  }
  return '';
}

function closeResetPwd() {
  resetPwdOpen.value = false;
}

watch(resetPwdOpen, (val: any) => {
  if (!val) {
    resetPwdUser.value = {};
    resetPwdValue.value = '';
    resetPwdError.value = '';
  }
});

/** 重置密码按钮操作 */
function handleResetPwd(row: SysUser) {
  resetPwdUser.value = row;
  resetPwdValue.value = '';
  resetPwdError.value = '';
  resetPwdOpen.value = true;
}

function submitResetPwd() {
  const error = validateResetPwd(resetPwdValue.value);
  if (error) {
    resetPwdError.value = error;
    return;
  }
  resetPwdError.value = '';
  resetUserPwd(resetPwdUser.value.userId!, resetPwdValue.value).then(() => {
    modal.msgSuccess(t('page.system.user.passwordChangedNewPassword', { value1: resetPwdValue.value }, '修改成功，新密码是：{value1}'));
    closeResetPwd();
  });
}

/** 选择条数  */
function handleSelectionChange(selection: SysUser[]) {
  ids.value = selection.map((item) => item.userId!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 导入按钮操作 */
function handleImport() {
  importUserRef.value?.open();
}

/** 重置操作表单 */
function reset() {
  form.value = {
    userId: undefined,
    deptId: undefined,
    userName: undefined,
    nickName: undefined,
    tenantId: undefined,
    password: undefined,
    phonenumber: undefined,
    email: undefined,
    sex: undefined,
    status: '0',
    remark: undefined,
    postIds: [],
    deptIds: [],
    roleIds: undefined
  };
  orginPwd.value = '';
  userRef.value?.resetFields();
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

// 查询租户下拉
const getTanentList = async () => {
  let res = await api.tenant.getCurTanent();
  if (res.code === 200) {
    queryTenantOptions.value = res.data;
    tenantOptions.value = res.data;
  }
};

const handleChangeTenant = () => {
  getRoleList();
};

// 获取角色下拉
const getRoleList = async () => {
  let res = await getRoleAllList({ tenantId: form.value.tenantId });
  if (res.code === 200) {
    roleOptions.value = res.data;
  }
};

// 获取岗位下拉
const getPostList = () => {
  positionService.load();
};

/** 新增按钮操作 */
function handleAdd() {
  reset();
  title.value = t('page.system.role.addUser', '添加用户');
  getTanentList();
  getInitPassword();
  if (!isPlatformRole.value) {
    form.value.tenantId = cache.session.getJSON('tenantId');
  }
  getRoleList();
  // getUser().then(response => {
  //   postOptions.value = response.posts
  //   roleOptions.value = response.roles
  //   form.value.password = initPassword.value
  // })
  open.value = true;
}

/** 修改按钮操作 */
function handleUpdate(row?: SysUser) {
  reset();
  const userId = row?.userId || ids.value[0];
  getUser(userId).then((res) => {
    // const response: any = res
    // form.value = response.data
    // postOptions.value = response.posts
    // roleOptions.value = response.roles
    // form.value.postIds = response.postIds
    // form.value.roleIds = response.roleIds
    // open.value = true
    // title.value = "修改用户"
    // form.value.password = ""

    const response: any = res.data;
    if (response.tenant) {
      tenantOptions.value = response.tenant.map((el: any) => {
        return {
          label: el.name,
          value: el.id
        };
      });
    }
    roleOptions.value = response.roles;
    form.value = response.data || {};
    const roleIds = res.roleIds || response.roleIds || [];
    form.value.roleIds = roleIds[0];
    const postIds = res.postIds || response.postIds || [];
    form.value.postIds = postIds;
    const deptIds = response.deptIds || [];
    form.value.deptIds = deptIds || [];
    title.value = t('page.system.user.form.editTitle', '修改用户');
    getRoleList();
    getInitPassword();
    open.value = true;
  });
}

/** 提交按钮 */
function submitForm() {
  userRef.value?.validate((valid: boolean) => {
    if (valid) {
      const params: SysUser = {
        ...form.value,
        roleIds: form.value.roleIds === undefined ? [] : [form.value.roleIds]
      };
      if (form.value.userId != undefined) {
        updateUser(params).then(() => {
          modal.msgSuccess(t('page.normal.confirmInfo.updateSuccess', '修改成功'));
          open.value = false;
          getList();
        });
      } else {
        params.password = orginPwd.value || '';
        addUser(params).then(() => {
          modal.msgSuccess(t('page.normal.confirmInfo.addSuccess', '新增成功'));
          open.value = false;
          getList();
        });
      }
    }
  });
}

onMounted(() => {
  // getDeptTree()
  getList();
  getTanentList();
  // proxy.getConfigKey("sys.user.initPassword").then((response: AjaxResult) => {
  //   initPassword.value = response.msg
  // })
  setTimeout(() => {
    getDeptTree();
    getPostList();
  }, 1000);
});
</script>

<style lang="scss" scoped>
.password-tip {
  display: flex;
  align-items: center;
  gap: 0.25em;
}
</style>
