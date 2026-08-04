<template>
  <div class="app-container rec-user-manage">
    <KJSCCollapseSearch2 v-show="showSearch">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="" prop="account">
          <el-input
            v-model="queryParams.account"
            placeholder="通过账号进行模糊搜索"
            clearable
            class="search-field-width"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <!-- <el-form-item label="" prop="interestLabel">
          <el-input
            v-model="queryParams.interestLabel"
            placeholder="通过兴趣标签进行模糊搜索"
            clearable
            class="search-field-width"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="" prop="orderLabel">
          <el-input
            v-model="queryParams.orderLabel"
            placeholder="通过订购标签进行模糊搜索"
            clearable
            class="search-field-width"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="" prop="valueLabel">
          <el-input
            v-model="queryParams.valueLabel"
            placeholder="通过价值标签进行模糊搜索"
            clearable
            class="search-field-width"
            @keyup.enter="handleQuery"
          />
        </el-form-item> -->
        <!-- <el-form-item label="">
          <el-date-picker
            style="width: 260px"
            v-model="dateRange"
            value-format="YYYY-MM-DD"
            type="daterange"
            range-separator="-"
            start-placeholder="修改开始时间"
            end-placeholder="修改结束时间"
          ></el-date-picker>
        </el-form-item> -->
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>

      </el-form>
      <!-- <template #rightBtns>
        <kjsc-button
          type="success"
          @click="handleAdd"
          icon="Plus"
          >新增</kjsc-button
        >
      </template> -->
    </KJSCCollapseSearch2>
    <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange">
      <template #empty>
        <kjsc-empty></kjsc-empty>
      </template>
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="用户编号" align="center" key="id" prop="id" v-if="columns.id.visible" width="100" />
      <el-table-column label="账号" align="center" key="account" prop="account" v-if="columns.account.visible" :show-overflow-tooltip="true" />
      <el-table-column label="兴趣标签" align="center" key="interestLabel" prop="interestLabel" v-if="columns.interestLabel.visible" :show-overflow-tooltip="true" />
      <el-table-column label="订购标签" align="center" key="orderLabel" prop="orderLabel" v-if="columns.orderLabel.visible" :show-overflow-tooltip="true" />
      <el-table-column label="价值标签" align="center" key="valueLabel" prop="valueLabel" v-if="columns.valueLabel.visible" :show-overflow-tooltip="true" />
      <!-- <el-table-column
        v-if="columns.createBy.visible"
        label="创建人"
        key="createBy"
        prop="createBy"
        min-width="120"
        :show-overflow-tooltip="true"
      /> -->
      <!-- <el-table-column
        v-if="columns.roleName.visible"
        label="所属角色"
        key="roleName"
        prop="roleName"
        min-width="120"
      />
      <el-table-column
        v-if="columns.tenantName.visible"
        label="所属租户"
        key="tenantName"
        prop="tenantName"
        min-width="120"
      />
      <el-table-column label="启用状态" align="center" key="status" v-if="columns.status.visible">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            style="--el-switch-on-color: #13ce66"
            active-text="启用"
            inactive-text="停用"
            active-value="0"
            inactive-value="1"
            inline-prompt
            @change="handleStatusChange(scope.row)"
          ></el-switch>
        </template>
      </el-table-column> -->
      <el-table-column label="创建时间" align="center" prop="createTime" width="160" v-if="columns.createTime.visible">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" align="center" prop="updateTime" width="160" v-if="columns.updateTime.visible">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <!-- <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-tooltip content="修改" placement="top" v-if="scope.row.userId !== 1">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:user:edit']"></el-button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top" v-if="scope.row.userId !== 1">
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:user:remove']"></el-button>
          </el-tooltip>
          <el-tooltip content="重置密码" placement="top" v-if="scope.row.userId !== 1">
            <el-button link type="primary" icon="Key" @click="handleResetPwd(scope.row)" v-hasPermi="['system:user:resetPwd']"></el-button>
          </el-tooltip>
        </template>
      </el-table-column> -->
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    <!-- 添加或修改用户配置对话框 -->
    <!-- <KJSCDialogV2
      :title="title"
      v-model="open"
      width="600px"
      append-to-body
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form :model="form" :rules="rules" ref="userRef" label-width="80px">
        <el-form-item label="用户昵称" prop="nickName">
          <el-input
            v-model="form.nickName"
            placeholder="支持中文、数字、字母"
            maxlength="6"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="登录账号" prop="userName">
          <el-input
            v-model="form.userName"
            placeholder="支持数字、字母，推荐使用手机号"
            :disabled="form.userId"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属租户" prop="tenantId">
          <el-select
            style="width: 100%"
            v-model="form.tenantId"
            placeholder="请选择租户"
            :disabled="form.userId"
            @change="handleChangeTenant"
          >
            <el-option
              v-for="item in tenantOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所属角色" prop="roleIds">
          <el-select
            style="width: 100%"
            v-model="form.roleIds"
            placeholder="请选择角色"
          >
            <template #prefix>
              <el-tag
                v-if="isInternalRole"
                :key="form.roleKey"
                size="small"
                type="info"
                effect="light"
                >系统内置</el-tag
              >
            </template>
            <el-option
              v-for="item in roleOptions"
              :key="item.roleId"
              :label="item.roleName"
              :value="item.roleId"
            ></el-option>
          </el-select>
        </el-form-item>
        <div>
          <span style="color: #fe595d; margin-right: 5px">!</span
          >账号初始密码为{{ orginPwd }}
        </div>
      </el-form>
      <template #prefixFooter>
        <div class="dialog-footer">
          <kjsc-button @click="cancel">取 消</kjsc-button>
          <kjsc-button
            type="primary"
            @click="submitForm"
            :disabled="submitDisabled"
            >确认{{ form.userId ? "修改" : "新增" }}</kjsc-button
          >
        </div>
      </template>
    </KJSCDialogV2> -->
  </div>
</template>

<script setup lang="ts" name="RecUserManage">
// import useUserStore from "@/store/modules/user";
import { listUser, delUser, getUser, updateUser, addUser, checkUserNameValue } from "@/api/recommend/recUser"
import type { RecUser, RecUserQueryParams, TableShowColumns } from '@/types'
import { isEmpty } from "@/utils/common.js";

import KJSCCollapseSearch2, { useCollapseSearch2 } from '@/components/KJSCCmpt/KJSCCollapseSearch2.vue';

const router = useRouter()
// const appStore = useAppStore()
// const userStore = useUserStore();
const { proxy } = getCurrentInstance()
// const { sys_normal_disable, sys_user_sex } = proxy.useDict("sys_normal_disable", "sys_user_sex")

const userList = ref<RecUser[]>([])
const open = ref<boolean>(false)
const loading = ref<boolean>(true)
const showSearch = ref<boolean>(true)
const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)
const total = ref<number>(0)
const title = ref<string>("")
const dateRange = ref<string[]>([])
// 列显隐信息
const columns = ref<Record<string, TableShowColumns>>({
  id: { label: '用户编号', visible: true },
  account: { label: '账号', visible: true },
  interestLabel: { label: '兴趣标签', visible: true },
  orderLabel: { label: '订购标签', visible: true },
  valueLabel: { label: '价值标签', visible: true },
  createTime: { label: '创建时间', visible: true },
  updateTime: { label: '更新时间', visible: true }
})

// const { cs2Expand, cs2ExpandBtnText, cs2DoExpand } = useCollapseSearch2();

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
  form: {} as RecUser,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    account: undefined,
    interestLabel: undefined,
    orderLabel: undefined,
    valueLabel: undefined
  } as RecUserQueryParams,
  orginPwd: "a123456",
  rules: {
    nickName: [
      { required: true, validator: validateNickName, trigger: "blur" },
    ],
    account: [
      { required: true, validator: validateUserName, trigger: "blur" },
    ],
    tenantId: [{ required: true, message: "租户不能为空", trigger: "change" }],
    roleIds: [
      { required: true, message: "所属角色不能为空", trigger: "change" },
    ],
  }
})

const { queryParams, form, rules, orginPwd } = toRefs(data)

// 是否必填为空
const submitDisabled = computed(() => {
  return (
    isEmpty(form.value.nickName) ||
    isEmpty(form.value.userName) ||
    isEmpty(form.value.tenantId) ||
    isEmpty(form.value.roleIds)
  );
});

/** 查询用户列表 */
function getList() {
  loading.value = true
  listUser(proxy.addDateRange(queryParams.value, dateRange.value)).then(res => {
    loading.value = false
    userList.value = res.rows
    total.value = res.total
  }, () => {
    loading.value = false
  })
}

// 获取初始密码
const getInitPassword = async () => {
  let res = await proxy.getConfigKey("sys.user.initPassword");
  // console.log('getInitPassword', res)
  if (res.code === 200) {
    orginPwd.value = res.data ||res.msg;
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
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 删除按钮操作 */
function handleDelete(row?: RecUser) {
  const userIds = row?.id || ids.value
  proxy.$modal.confirm('是否确认删除用户编号为"' + userIds + '"的数据项？').then(function () {
    return delUser(userIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download("system/user/export", {
    ...queryParams.value,
  },`user_${new Date().getTime()}.xlsx`)
}

/** 选择条数  */
function handleSelectionChange(selection: RecUser[]) {
  ids.value = selection.map(item => item.id!)
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

/** 新增按钮操作 */
function handleAdd() {
  reset()
  title.value = "添加用户"
  getInitPassword();
  open.value = true
}

/** 修改按钮操作 */
function handleUpdate(row?: RecUser) {
  reset()
  const userId = row?.id || ids.value[0]
  getUser(userId).then(res => {
    const response: any = res.data;
    form.value = response.data || {};
    title.value = "修改用户";
    getInitPassword();
    open.value = true;
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["userRef"].validate((valid: boolean) => {
    if (valid) {
      const params = {...form.value};
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
  getList()
})
</script>
<style lang="less" scoped>
.search-field-width {
  width: 215px;
}
</style>
