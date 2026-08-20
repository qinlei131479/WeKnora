<template>
  <section class="manage-page models-manage-page">
    <page-name class="page-name">
      <button type="button" class="add-btn" v-hasPermi="['buz:model:add']" @click="handleAdd">+ {{
        $t('page.models.addModel')
      }}</button>
    </page-name>

    <div class="search-bar">
      <div class="search-bar__keyword">
        <el-input v-model="queryParams.userName" class="search-bar__input" clearable
          :placeholder="$t('page.models.searchPlaceholder')" @keyup.enter="handleQuery" />
        <button type="button" class="search-bar__icon-btn" @click="handleQuery">
          <svg-icon icon-class="search" class="search-bar__icon" />
        </button>
      </div>

      <div class="search-bar__date-wrap">
        <el-date-picker v-model="dateRange" class="search-bar__date" value-format="YYYY-MM-DD" type="daterange"
          :range-separator="$t('page.models.range_separator')"
          :start-placeholder="$t('page.models.start_date.placeholder')"
          :end-placeholder="$t('page.models.end_date.placeholder')" />
      </div>

      <button type="button" class="search-bar__reset" @click="resetQuery">{{ $t('page.models.reset') }}</button>
      <button type="button" class="search-bar__submit" @click="handleQuery">{{ $t('page.models.search') }}</button>
    </div>

    <div class="table-pager-area">
      <div class="table-wrap">
        <el-table ref="userTableRef" v-loading="loading" :data="userList" height="100%"
          @selection-change="handleSelectionChange">
          <template #empty>
            <kjsc-empty />
          </template>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="用户编号" align="left" key="userId" prop="userId" min-width="100"
            v-if="columns.userId.visible" />
          <el-table-column label="用户昵称" align="left" key="nickName" prop="nickName" min-width="120"
            v-if="columns.nickName.visible" :show-overflow-tooltip="true" />
          <el-table-column label="登录账号" align="left" key="userName" prop="userName" min-width="120"
            v-if="columns.userName.visible" :show-overflow-tooltip="true" />
          <el-table-column v-if="columns.createBy.visible" label="创建人" key="createBy" prop="createBy" min-width="120"
            align="left" :show-overflow-tooltip="true" />
          <el-table-column v-if="columns.roleName.visible" label="所属角色" key="roleName" prop="roleName" min-width="120"
            align="left" />
          <el-table-column v-if="columns.tenantName.visible" label="所属租户" key="tenantName" prop="tenantName"
            min-width="120" align="left" />
          <el-table-column label="启用状态" align="center" key="status" width="100" v-if="columns.status.visible">
            <template #default="scope">
              <el-switch v-model="scope.row.status" style="--el-switch-on-color: #31aba0" active-value="0"
                inactive-value="1" @change="handleStatusChange(scope.row)" />
            </template>
          </el-table-column>
          <el-table-column label="最新修改时间" align="left" prop="updateTime" min-width="170"
            v-if="columns.updateTime.visible">
            <template #default="scope">
              <span>{{ parseTime(scope.row.updateTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="left" width="180" fixed="right">
            <template #default="scope">
              <template v-if="scope.row.userId !== 1">
                <el-button link class="action-link action-link--primary" @click="handleUpdate(scope.row)"
                  v-hasPermi="['buz:model:edit']">
                  {{ $t('form.button.edit') }}
                </el-button>
                <el-button link class="action-link action-link--danger" @click="handleDelete(scope.row)"
                  v-hasPermi="['buz:model:remove']">
                  {{ $t('form.button.delete') }}
                </el-button>
                <el-button link class="action-link action-link--primary" @click="handleResetPwd(scope.row)"
                  v-hasPermi="['system:user:edit']">
                  {{ $t('form.button.reset') }}
                </el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-row">
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize" @pagination="getList" />
      </div>
    </div>

    <!-- 添加或修改用户配置对话框 -->
    <KJSCDialogV2 :title="title" v-model="open" width="800px" append-to-body
      custom-class="manage-dialog user-form-dialog" :showCloseBtn="false" :showSubitBtn="false">
      <el-form :model="form" :rules="rules" ref="userRef" label-position="top" class="user-form" hide-required-asterisk>
        <el-form-item label="用户昵称" prop="nickName">
          <el-input v-model="form.nickName" placeholder="支持中文、数字、字母" maxlength="6" show-word-limit />
        </el-form-item>
        <el-form-item label="登录账号" prop="userName">
          <el-input v-model="form.userName" placeholder="支持数字、字母，推荐使用手机号" :disabled="form.userId" maxlength="20"
            show-word-limit />
        </el-form-item>
        <el-form-item label="部门" prop="deptIds">
          <el-tree-select v-model="form.deptIds" :data="enabledDeptOptions" :props="deptTreeProps" multiple
            check-strictly :render-after-expand="false" placeholder="请选择" style="width: 100%" />
        </el-form-item>
        <el-form-item label="岗位" prop="postIds">
          <el-select-v2 v-model="form.postIds" :options="positionService.listData" :props="positionProps" multiple
            placeholder="请选择" style="width: 100%" />
        </el-form-item>

        <el-form-item label="所属租户" prop="tenantId">
          <el-select style="width: 100%" v-model="form.tenantId" placeholder="请选择租户" :disabled="form.userId"
            @change="handleChangeTenant">
            <el-option v-for="item in tenantOptions" :key="item.value" :label="item.label"
              :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所属角色" prop="roleIds">
          <el-select style="width: 100%" v-model="form.roleIds" placeholder="请选择角色">
            <template #prefix>
              <el-tag v-if="isInternalRole" :key="form.roleKey" size="small" type="info" effect="light">系统内置</el-tag>
            </template>
            <el-option v-for="item in roleOptions" :key="item.roleId" :label="item.roleName"
              :value="item.roleId"></el-option>
          </el-select>
        </el-form-item>
        <div class="password-tip">
          <span class="password-tip__icon">i</span>
          <span>账号初始密码为 {{ orginPwd }}</span>
        </div>
      </el-form>
      <template #prefixFooter>
        <div class="manage-dialog-footer">
          <button type="button" class="submit-btn" :disabled="submitDisabled" @click="submitForm">
            确认{{ form.userId ? '修改' : '新增' }}
          </button>
        </div>
      </template>
    </KJSCDialogV2>

    <!-- 重置密码对话框 -->
    <KJSCDialogV2 title="提示" v-model="resetPwdOpen" width="520px" append-to-body
      custom-class="manage-dialog reset-pwd-dialog" :showCloseBtn="false" :showSubitBtn="false">
      <div class="reset-pwd-form">
        <p class="reset-pwd-form__label">请输入"{{ resetPwdUser.userName }}"的新密码</p>
        <el-input v-model="resetPwdValue" class="reset-pwd-form__input" placeholder="请输入新密码"
          @keyup.enter="submitResetPwd" @input="resetPwdError = ''" />
        <p v-if="resetPwdError" class="reset-pwd-form__error">{{ resetPwdError }}</p>
      </div>
      <template #prefixFooter>
        <div class="reset-pwd-dialog-footer">
          <button type="button" class="reset-pwd-dialog-cancel" @click="closeResetPwd">取消</button>
          <button type="button" class="reset-pwd-dialog-submit" @click="submitResetPwd">确定</button>
        </div>
      </template>
    </KJSCDialogV2>

    <!-- 用户导入对话框 -->
    <excel-import-dialog ref="importUserRef" title="用户导入" action="/system/user/importData"
      template-action="/system/user/importTemplate" template-file-name="user_template"
      update-support-label="是否更新已经存在的用户数据" @success="getList" />
  </section>
</template>

<script setup lang="ts" name="Models">
// import { getToken } from "@/utils/auth"
// import useAppStore from '@/store/modules/app'
import useUserStore from "@/store/modules/user";
import ExcelImportDialog from "@/components/ExcelImportDialog/index.vue"
import { changeUserStatus, listUser, resetUserPwd, delUser, getUser, updateUser, addUser, deptTreeSelect, checkUserNameValue } from "@/api/system/user"
import { getRoleAllList } from "@/api/system/role";
import type { SysUser, UserQueryParams, UserFormDataResult } from '@/types/api/system/user'
import type { SysRole } from '@/types/api/system/role'
import type { SysPost } from '@/types/api/system/post'
import type { TreeSelect, TableShowColumns, AjaxResult } from '@/types/api/common'
import _api from "@/utils/api";
import { isEmpty } from "@/utils/common.js";
import cache from '@/plugins/cache'

import positionServiceFactory from "@/service/positionService";

var pageLangConfig: Record<string, string> = {
  'page.models.addModel': '新增模型',
  'page.models.searchPlaceholder': '通过模型ID、模型名称、创建人进行模糊搜索',
  'page.models.range_separator': '至',
  'page.models.start_date.placeholder': '开始时间',
  'page.models.end_date.placeholder': '结束时间',
  'page.models.reset': '重置',
  'page.models.search': '搜索',
  'form.button.reset': '重置',
  'form.button.edit': '编辑',
  'form.button.delete': '删除',
}
const t = function (key: string) {
  return pageLangConfig[key] || key
}
const $t = t;

const api: any = _api;

const router = useRouter()
// const appStore = useAppStore()
const userStore = useUserStore();
const { proxy } = getCurrentInstance()
// const { sys_normal_disable, sys_user_sex } = proxy.useDict("sys_normal_disable", "sys_user_sex")

const deptTreeProps = {
  children: 'children',
  label: 'label',
  value: 'id',
}

const userList = ref<SysUser[]>([])
const userTableRef = ref()
const open = ref<boolean>(false)
const resetPwdOpen = ref<boolean>(false)
const resetPwdUser = ref<SysUser>({})
const resetPwdValue = ref<string>('')
const resetPwdError = ref<string>('')
const loading = ref<boolean>(true)
const showSearch = ref<boolean>(true)
const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)
const total = ref<number>(0)
const title = ref<string>("")
const dateRange = ref<string[]>([])
// const deptOptions = ref<TreeSelect[] | undefined>(undefined)
const enabledDeptOptions = ref<TreeSelect[] | undefined>(undefined)
// const initPassword = ref<string | undefined>(undefined)
const postOptions = ref<SysPost[]>([])
const roleOptions = ref<SysRole[]>([])
const tenantOptions = ref([]);
const queryTenantOptions = ref([]);
// 列显隐信息
const columns = ref<Record<string, TableShowColumns>>({
  userId: { label: '用户编号', visible: true },
  userName: { label: '登录账号', visible: true },
  nickName: { label: '用户昵称', visible: true },
  createBy: { label: '创建人', visible: true },
  roleName: { label: '所属角色', visible: true },
  tenantName: { label: '所属租户', visible: true },
  status: { label: '状态', visible: true },
  updateTime: { label: '最新修改时间', visible: true }
})
const positionService = positionServiceFactory({ autoLoad: false });
const positionProps = {
  label: 'postName',
  value: 'postId',
}

// 校验登录账号
const validateUserName = (rule: any, value: string, callback: Function) => {
  if (!value) {
    callback(new Error("登录账号不能为空"));
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
              callback(new Error("该登陆账号已被占用、请重新输入"));
            }
          })
          .catch((err: any) => {
            console.log(err);
          });
      } else {
        callback(new Error("只能输入数字和字母"));
      }
    }
  }
};
// 校验用户昵称
const validateNickName = (rule: any, value: string, callback: Function) => {
  if (!value) {
    callback(new Error("用户昵称不能为空"));
  } else {
    const regex = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;
    if (regex.test(value)) {
      callback();
    } else {
      callback(new Error("只能输入中文、数字、字母"));
    }
  }
};

const data = reactive({
  form: {} as SysUser,
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
  orginPwd: "a123456",
  rules: {
    nickName: [
      { required: true, validator: validateNickName, trigger: "blur" },
    ],
    userName: [
      { required: true, validator: validateUserName, trigger: "blur" },
    ],
    tenantId: [{ required: true, message: "租户不能为空", trigger: "change" }],
    roleIds: [
      { required: true, message: "所属角色不能为空", trigger: "change" },
    ],
    deptIds: [
      { required: true, message: "所属部门不能为空", trigger: "change" },
    ],
    postIds: [
      { required: true, message: "岗位不能为空", trigger: "change" },
    ],
  }
})

const { queryParams, form, rules, orginPwd } = toRefs(data)

// 是否是平台管理租户角色
const isPlatformRole = computed(() => {
  return userStore.isPlatformTenant;
});

// 是否必填为空
const submitDisabled = computed(() => {
  return (
    isEmpty(form.value.nickName) ||
    isEmpty(form.value.userName) ||
    isEmpty(form.value.tenantId) ||
    isEmpty(form.value.roleIds)
  );
});

// 是否是内置角色
const isInternalRole = computed(() => {
  return form.value.builtin === 0;
});

/** 查询用户列表 */
function getList() {
  loading.value = true
  listUser(proxy.addDateRange(queryParams.value, dateRange.value)).then(res => {
    loading.value = false
    userList.value = res.rows
    total.value = res.total
    nextTick(() => {
      userTableRef.value?.doLayout()
    })
  })
}

/** 查询部门下拉树结构 */
function getDeptTree() {
  deptTreeSelect().then(response => {
    // deptOptions.value = response.data
    // enabledDeptOptions.value = filterDisabledDept(JSON.parse(JSON.stringify(response.data)))
    enabledDeptOptions.value = filterDisabledDept((response.data || []) as any)
  })
}

/** 过滤禁用的部门 */
function filterDisabledDept(deptList: TreeSelect[]) {
  return deptList.filter(dept => {
    if (dept.disabled) {
      return false
    }
    if (dept.children && dept.children.length) {
      dept.children = filterDisabledDept(dept.children)
    }
    return true
  })
}

/** 节点单击事件 */
function handleNodeClick(data: any) {
  queryParams.value.deptId = data.id
  handleQuery()
}

// 获取初始密码
const getInitPassword = async () => {
  let res = await proxy.getConfigKey("sys.user.initPassword");
  // console.log('getInitPassword', res)
  if (res.code === 200) {
    orginPwd.value = res.data || res.msg;
  }
};
/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = []
  queryParams.value.userName = undefined
  queryParams.value.deptId = undefined
  handleQuery()
}

/** 删除按钮操作 */
function handleDelete(row?: SysUser) {
  const userIds = row?.userId || ids.value
  proxy.$modal.confirm('是否确认删除用户编号为"' + userIds + '"的数据项？').then(function () {
    return delUser(userIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download("system/user/export", {
    ...queryParams.value,
  }, `user_${new Date().getTime()}.xlsx`)
}

/** 用户状态修改  */
function handleStatusChange(row: SysUser) {
  const text = row.status === "0" ? "启用" : "停用"
  proxy.$modal.confirm('确认要"' + text + '""' + row.userName + '"用户吗?').then(function () {
    return changeUserStatus(row.userId!, row.status!)
  }).then(() => {
    proxy.$modal.msgSuccess(text + "成功")
  }).catch(function () {
    row.status = row.status === "0" ? "1" : "0"
  })
}

/** 更多操作 */
function handleCommand(command: string, row: SysUser) {
  switch (command) {
    case "handleResetPwd":
      handleResetPwd(row)
      break
    case "handleAuthRole":
      handleAuthRole(row)
      break
    default:
      break
  }
}

/** 跳转角色分配 */
function handleAuthRole(row: SysUser) {
  const userId = row.userId
  router.push("/system/user-auth/role/" + userId)
}

function validateResetPwd(value: string): string {
  if (!value) {
    return '用户密码不能为空'
  }
  if (!/^.{5,20}$/.test(value)) {
    return '用户密码长度必须介于 5 和 20 之间'
  }
  if (/<|>|"|'|\||\\/.test(value)) {
    return '不能包含非法字符：< > " \' \\ |'
  }
  return ''
}

function closeResetPwd() {
  resetPwdOpen.value = false
}

watch(resetPwdOpen, (val: boolean) => {
  if (!val) {
    resetPwdUser.value = {}
    resetPwdValue.value = ''
    resetPwdError.value = ''
  }
})

/** 重置密码按钮操作 */
function handleResetPwd(row: SysUser) {
  resetPwdUser.value = row
  resetPwdValue.value = ''
  resetPwdError.value = ''
  resetPwdOpen.value = true
}

function submitResetPwd() {
  const error = validateResetPwd(resetPwdValue.value)
  if (error) {
    resetPwdError.value = error
    return
  }
  resetPwdError.value = ''
  resetUserPwd(resetPwdUser.value.userId!, resetPwdValue.value).then(() => {
    proxy.$modal.msgSuccess('修改成功，新密码是：' + resetPwdValue.value)
    closeResetPwd()
  })
}

/** 选择条数  */
function handleSelectionChange(selection: SysUser[]) {
  ids.value = selection.map(item => item.userId!)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 导入按钮操作 */
function handleImport() {
  proxy.$refs["importUserRef"].open()
}

/** 重置操作表单 */
function reset() {
  form.value = {
    userId: undefined,
    deptId: undefined,
    userName: undefined,
    nickName: undefined,
    tenantId: "",
    password: undefined,
    phonenumber: undefined,
    email: undefined,
    sex: undefined,
    status: "0",
    remark: undefined,
    postIds: [],
    deptIds: [],
    roleIds: undefined
  }
  orginPwd.value = "";
  proxy.resetForm("userRef")
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
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
}

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
  reset()
  title.value = "添加用户"
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
  open.value = true
}

/** 修改按钮操作 */
function handleUpdate(row?: SysUser) {
  reset()
  const userId = row?.userId || ids.value[0]
  getUser(userId).then(res => {
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
          value: el.id,
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
    title.value = "修改用户";
    getRoleList();
    getInitPassword();
    open.value = true;
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["userRef"].validate((valid: boolean) => {
    if (valid) {
      const params = { ...form.value };
      params.roleIds = [params.roleIds];
      if (form.value.userId != undefined) {
        updateUser(params).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        params.password = orginPwd.value || "";
        addUser(params).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

onMounted(() => {
  // getDeptTree()
  getList()
  getTanentList()
  // proxy.getConfigKey("sys.user.initPassword").then((response: AjaxResult) => {
  //   initPassword.value = response.msg
  // })
  setTimeout(() => {
    getDeptTree()
    getPostList();
  }, 1000)
})
</script>

<style scoped lang="scss"></style>

<style lang="scss">
.user-form-dialog.kjsc-dialog-v2 {

  .password-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    color: #77838f;
    font-size: 13px;
    line-height: 20px;

    &__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border: 1px solid #a8abb2;
      border-radius: 50%;
      color: #77838f;
      font-size: 11px;
      font-style: italic;
      font-weight: 600;
      flex-shrink: 0;
    }
  }

}

.reset-pwd-dialog.kjsc-dialog-v2 {

  .el-dialog__body {
    padding: 24px 32px 8px;
  }

  .el-dialog__footer {
    padding: 24px 32px 32px;
  }

  .reset-pwd-form {
    &__label {
      margin: 0 0 16px;
      font-size: 14px;
      line-height: 22px;
      color: #2b2f33;
    }

    &__input {
      .el-input__wrapper {
        min-height: 44px;
        padding: 0 16px;
        border-radius: 999px;
        box-shadow: 0 0 0 1px #31aba0 inset !important;
      }

      .el-input__inner {
        font-size: 14px;
        color: #2b2f33;

        &::placeholder {
          color: #a8abb2;
        }
      }
    }

    &__error {
      margin: 8px 0 0;
      font-size: 12px;
      line-height: 18px;
      color: #fe595d;
    }
  }

  .reset-pwd-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .reset-pwd-dialog-cancel,
  .reset-pwd-dialog-submit {
    min-width: 88px;
    height: 40px;
    padding: 0 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s, border-color 0.2s;
  }

  .reset-pwd-dialog-cancel {
    border: 1px solid #e1e6ec;
    border-radius: 8px;
    background: #ffffff;
    color: #2b2f33;

    &:hover {
      border-color: #c8ced6;
    }
  }

  .reset-pwd-dialog-submit {
    border: none;
    border-radius: 8px;
    background: linear-gradient(180deg, #31aba0 0%, #2897be 100%);
    color: #ffffff;

    &:hover {
      opacity: 0.92;
    }
  }
}
</style>
