<template>
  <section class="role-manage-page">
    <page-name class="page-name" title="角色管理">
      <button type="button" class="add-role-btn" v-hasPermi="['system:role:add']" @click="handleAdd">+ 新增角色</button>
    </page-name>

    <div class="search-bar">
      <div class="search-bar__keyword">
        <el-input
          v-model="queryParams.roleName"
          class="search-bar__input"
          clearable
          placeholder="通过角色名称进行模糊搜索"
          @keyup.enter="handleQuery"
        />
        <button type="button" class="search-bar__icon-btn" @click="handleQuery">
          <svg-icon icon-class="search" class="search-bar__icon" />
        </button>
      </div>

      <div v-if="isPlatformRole" class="search-bar__tenant">
        <el-select v-model="queryParams.tenantId" clearable placeholder="全部租户">
          <el-option label="全部租户" value="" />
          <el-option v-for="item in tenantOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <div class="search-bar__date-wrap">
        <el-date-picker
          v-model="dateRange"
          class="search-bar__date"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </div>

      <button type="button" class="search-bar__reset" @click="resetQuery">重置</button>
      <button type="button" class="search-bar__submit" @click="handleQuery">搜索</button>
    </div>

    <div class="role-content-card">
      <div class="table-wrap">
        <el-table
          ref="roleTableRef"
          v-loading="loading"
          :data="roleList"
          height="100%"
          class="role-table"
          @selection-change="handleSelectionChange"
        >
          <template #empty>
            <kjsc-empty />
          </template>
          <el-table-column label="角色名称" prop="roleName" min-width="160" align="left" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.roleName }}</span>
              <el-tag
                v-if="scope.row.builtin === 0"
                :key="scope.row.roleKey"
                size="small"
                type="info"
                effect="light"
                class="builtin-tag"
              >
                系统内置
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="所属租户" prop="tenantName" min-width="140" align="left" :show-overflow-tooltip="true" />
          <el-table-column label="描述" prop="remark" min-width="200" align="left" :show-overflow-tooltip="true" />
          <el-table-column label="最新修改时间" prop="updateTime" min-width="170" align="left">
            <template #default="scope">
              <span>{{ parseTime(scope.row.updateTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            align="left"
            header-align="left"
            width="140"
            fixed="right"
            class-name="action-column"
            label-class-name="action-column-header"
          >
            <template #default="scope">
              <div class="table-action-cell">
                <el-button
                  link
                  class="action-link action-link--primary"
                  v-hasPermi="['system:role:edit']"
                  :disabled="scope.row.builtin === 0 && !isPlatformRole"
                  @click="handleUpdate(scope.row)"
                >
                  编辑
                </el-button>
                <el-popconfirm
                  v-if="scope.row.builtin !== 0"
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                  title="确认删除吗?"
                  :hide-after="100"
                  @confirm="confirmCallback(scope.row)"
                >
                  <template #reference>
                    <el-button link class="action-link action-link--danger" v-hasPermi="['system:role:remove']">删除</el-button>
                  </template>
                </el-popconfirm>
                <el-button
                  v-else
                  link
                  class="action-link action-link--danger is-disabled"
                  v-hasPermi="['system:role:remove']"
                  disabled
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-row">
        <pagination
          v-show="total > 0"
          :total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </div>
    </div>

    <!-- 添加或修改角色配置对话框 -->
    <KJSCDialogV2
      :title="title"
      v-model="open"
      width="800px"
      append-to-body
      custom-class="role-form-dialog"
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form ref="roleRef" :model="form" :rules="rules" label-position="top" class="role-form" hide-required-asterisk>
        <el-form-item label="角色名称" prop="roleName">
          <el-input
            v-model="form.roleName"
            maxlength="10"
            show-word-limit
            :disabled="isEdit"
            placeholder="请输入角色名称"
          >
            <template #prefix>
              <el-tag v-if="isInternalRole" :key="form.roleKey" size="small" type="info" effect="light">系统内置</el-tag>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="所属租户" prop="tenantId">
          <el-select
            style="width: 100%"
            v-model="form.tenantId"
            placeholder="请选择租户"
            :disabled="!!form.roleId || !isPlatformRole"
          >
            <el-option v-for="item in tenantOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input
            v-model="form.remark"
            maxlength="30"
            show-word-limit
            :disabled="isEdit"
            type="textarea"
            placeholder="请输入角色描述信息"
          />
        </el-form-item>
        <el-form-item label="菜单权限">
          <div class="menu-permission-tools">
            <el-checkbox v-model="menuExpand" :disabled="isEdit" @change="handleCheckedTreeExpand($event, 'menu')">
              展开/折叠
            </el-checkbox>
            <el-checkbox v-model="menuNodeAll" :disabled="isEdit" @change="handleCheckedTreeNodeAll($event, 'menu')">
              全选/全不选
            </el-checkbox>
            <el-checkbox v-model="form.menuCheckStrictly" :disabled="isEdit" @change="handleCheckedTreeConnect($event, 'menu')">
              父子联动
            </el-checkbox>
          </div>
          <el-tree
            class="tree-border menu-tree"
            :data="menuOptions"
            show-checkbox
            ref="menuRef"
            node-key="id"
            :check-strictly="!form.menuCheckStrictly"
            empty-text="加载中，请稍候"
            :disabled="isEdit"
            :props="{ label: 'label', children: 'children' }"
          />
        </el-form-item>
      </el-form>
      <template #prefixFooter>
        <div class="role-dialog-footer">
          <button type="button" class="role-dialog-submit" :disabled="submitDisabled || isEdit" @click="submitForm">
            确认{{ form.roleId ? '修改' : '新增' }}
          </button>
        </div>
      </template>
    </KJSCDialogV2>
  </section>
</template>

<script setup lang="ts" name="Role">
import { addRole, changeRoleStatus, dataScope, delRole, getRole, listRole, updateRole, deptTreeSelect } from "@/api/system/role"
import { roleMenuTreeselect, treeselect as menuTreeselect } from "@/api/system/menu"
import type { SysRole, RoleQueryParams } from '@/types/api/system/role'
import type { TreeSelect } from '@/types/api/common'
import type { RoleDeptTreeResult } from '@/types/api/system/role'
import type { RoleMenuTreeselectResult, RoleMenuTreeselectResultData } from '@/types/api/system/menu'

import { isEmpty } from "@/utils/common.js";
import useUserStore from "@/store/modules/user";
import _api from "@/utils/api";
import cache from "@/plugins/cache";
const api: any = _api;

const userStore = useUserStore();
const router = useRouter()
const { proxy } = getCurrentInstance()
// const { sys_normal_disable } = proxy.useDict("sys_normal_disable")

const roleList = ref<SysRole[]>([])
const roleTableRef = ref()
const open = ref<boolean>(false)
const loading = ref<boolean>(true)
const showSearch = ref<boolean>(true)
const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)
const total = ref<number>(0)
const title = ref<string>("")
const dateRange = ref<string[]>([])
const menuOptions = ref<TreeSelect[]>([])
const menuExpand = ref<boolean>(false)
const menuNodeAll = ref<boolean>(false)
const deptExpand = ref<boolean>(true)
const deptNodeAll = ref<boolean>(false)
const deptOptions = ref<TreeSelect[]>([])
const openDataScope = ref<boolean>(false)
const menuRef = ref<any | null>(null)
const deptRef = ref<any | null>(null)
const tenantOptions = ref([]);

// /** 数据范围选项*/
// const dataScopeOptions = ref([
//   { value: "1", label: "全部数据权限" },
//   { value: "2", label: "自定数据权限" },
//   { value: "3", label: "本部门数据权限" },
//   { value: "4", label: "本部门及以下数据权限" },
//   { value: "5", label: "仅本人数据权限" }
// ])

const data = reactive({
  form: {} as SysRole,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    roleName: undefined,
    roleKey: undefined,
    status: undefined,
    tenantId: undefined
  } as RoleQueryParams,
  rules: {
    roleName: [
      { required: true, message: "角色名称不能为空", trigger: "blur" },
    ],
    tenantId: [{ required: true, message: "租户不能为空", trigger: "change" }],
  },
})

const { queryParams, form, rules } = toRefs(data)

// 是否必填为空
const submitDisabled = computed(() => {
  return isEmpty(form.value.roleName) || isEmpty(form.value.tenantId);
});

// 是否是内置角色
const isInternalRole = computed(() => {
  return form.value.builtin === 0;
});

// 是否是平台管理租户角色
const isPlatformRole = computed(() => {
  console.log(userStore.isPlatformTenant, "userStore.isPlatformTenant");
  return userStore.isPlatformTenant;
});

// 是否可以修改
const isEdit = computed(() => {
  return !(isPlatformRole || !isInternalRole);
});

/** 查询角色列表 */
function getList() {
  loading.value = true
  listRole(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    roleList.value = response.rows
    total.value = response.total
    loading.value = false
    nextTick(() => {
      roleTableRef.value?.doLayout()
    })
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = []
  queryParams.value.roleName = undefined
  queryParams.value.tenantId = undefined
  handleQuery()
}


/** 删除按钮操作 */
function confirmCallback(data: any) {
  const roleIds = data.roleId;
  delRole(roleIds).then((response) => {
    getList();
    if(response.code==200){
      proxy.$modal.msgSuccess("操作成功");
    }else{
      proxy.$modal.msgError(response.msg);
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row?: SysRole) {
  const roleIds = row?.roleId || ids.value
  proxy.$modal.confirm('是否确认删除角色编号为"' + roleIds + '"的数据项?').then(function () {
    return delRole(roleIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download("system/role/export", {
    ...queryParams.value,
  }, `role_${new Date().getTime()}.xlsx`)
}

/** 多选框选中数据 */
function handleSelectionChange(selection: SysRole[]) {
  ids.value = selection.map(item => item.roleId!)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 角色状态修改 */
function handleStatusChange(row: SysRole) {
  const text = row.status === "0" ? "启用" : "停用"
  proxy.$modal.confirm('确认要"' + text + '""' + row.roleName + '"角色吗?').then(function () {
    return changeRoleStatus(row.roleId!, row.status!)
  }).then(() => {
    proxy.$modal.msgSuccess(text + "成功")
  }).catch(function () {
    row.status = row.status === "0" ? "1" : "0"
  })
}

/** 更多操作 */
function handleCommand(command: string, row: SysRole) {
  switch (command) {
    case "handleDataScope":
      handleDataScope(row)
      break
    case "handleAuthUser":
      handleAuthUser(row)
      break
    default:
      break
  }
}

/** 分配用户 */
function handleAuthUser(row: SysRole) {
  router.push("/system/role-auth/user/" + row.roleId)
}

/** 查询菜单树结构 */
function getMenuTreeselect() {
  menuTreeselect().then(response => {
    menuOptions.value = response.data
  })
}

/** 所有部门节点数据 */
function getDeptAllCheckedKeys(): number[] {
  // 目前被选中的部门节点
  let checkedKeys = deptRef.value.getCheckedKeys()
  // 半选中的部门节点
  let halfCheckedKeys = deptRef.value.getHalfCheckedKeys()
  checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
  return checkedKeys
}

/** 重置新增的表单以及其他数据  */
function reset() {
  if (menuRef.value != undefined) {
    menuRef.value.setCheckedKeys([])
  }
  menuExpand.value = false
  menuNodeAll.value = false
  deptExpand.value = true
  deptNodeAll.value = false
  form.value = {
    roleId: undefined,
    roleName: undefined,
    menuIds: [],
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    remark: undefined,
  }
  proxy.resetForm("roleRef")
}

// 查询租户下拉
const getTanentList = async () => {
  let res = await api.tenant.getCurTanent();
  if (res.code === 200) {
    tenantOptions.value = res.data;
  }
};

/** 添加角色 */
function handleAdd() {
  reset()
  getTanentList();
  getMenuTreeselect()
  // 普通租户自动选择
  if (isPlatformRole) {
    form.value.tenantId = cache.session.getJSON("tenantId");
  }
  open.value = true
  title.value = "添加角色"
}

/** 修改角色 */
function handleUpdate(row?: SysRole) {
  reset()
  const roleId = row?.roleId || ids.value[0]
  const roleMenu = getRoleMenuTreeselect(roleId)
  getRole(roleId).then(response => {
    form.value = response.data
    // form.value.roleSort = Number(form.value.roleSort)
    open.value = true
    getTanentList();
    nextTick(() => {
      roleMenu.then((res: RoleMenuTreeselectResultData) => {
        const checkedKeys = res.checkedKeys
        checkedKeys.forEach((v) => {
          nextTick(() => {
            menuRef.value?.setChecked(v, true, false)
          })
        })
      })
    })
  })
  title.value = "修改角色"
}

/** 根据角色ID查询菜单树结构 */
function getRoleMenuTreeselect(roleId: number): Promise<RoleMenuTreeselectResultData> {
  return roleMenuTreeselect(roleId).then((response: any) => {
    // console.log('getRoleMenuTreeselect', response)
    const data = response.data || response || {} as RoleMenuTreeselectResultData;
    menuOptions.value = data.menus || []
    return data
  })
}

/** 根据角色ID查询部门树结构 */
function getDeptTree(roleId: number) {
  Promise<RoleDeptTreeResult>
  return deptTreeSelect(roleId).then(response => {
    deptOptions.value = response.depts
    return response
  })
}

/** 树权限（展开/折叠）*/
function handleCheckedTreeExpand(value: boolean, type: string) {
  if (type == "menu") {
    let treeList = menuOptions.value
    for (let i = 0; i < treeList.length; i++) {
      menuRef.value.store.nodesMap[treeList[i].id].expanded = value
    }
  } else if (type == "dept") {
    let treeList = deptOptions.value
    for (let i = 0; i < treeList.length; i++) {
      deptRef.value.store.nodesMap[treeList[i].id].expanded = value
    }
  }
}

/** 树权限（全选/全不选） */
function handleCheckedTreeNodeAll(value: boolean, type: string) {
  if (type == "menu") {
    menuRef.value.setCheckedNodes(value ? menuOptions.value : [])
  } else if (type == "dept") {
    deptRef.value.setCheckedNodes(value ? deptOptions.value : [])
  }
}

/** 树权限（父子联动） */
function handleCheckedTreeConnect(value: boolean, type: string) {
  if (type == "menu") {
    form.value.menuCheckStrictly = value ? true : false
  } else if (type == "dept") {
    form.value.deptCheckStrictly = value ? true : false
  }
}

/** 所有菜单节点数据 */
function getMenuAllCheckedKeys(): number[] {
  // 目前被选中的菜单节点
  let checkedKeys = menuRef.value.getCheckedKeys()
  // 半选中的菜单节点
  let halfCheckedKeys = menuRef.value.getHalfCheckedKeys()
  checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
  return checkedKeys
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["roleRef"].validate((valid: boolean) => {
    if (valid) {
      if (form.value.roleId != undefined) {
        form.value.menuIds = getMenuAllCheckedKeys()
        updateRole(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        form.value.menuIds = getMenuAllCheckedKeys()
        addRole(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 选择角色权限范围触发 */
function dataScopeSelectChange(value: string) {
  if (value !== "2") {
    deptRef.value.setCheckedKeys([])
  }
}

/** 分配数据权限操作 */
function handleDataScope(row: SysRole) {
  reset()
  const deptTreeSelect = getDeptTree(row.roleId!)
  getRole(row.roleId!).then(response => {
    form.value = response.data!
    openDataScope.value = true
    nextTick(() => {
      deptTreeSelect.then(res => {
        nextTick(() => {
          if (deptRef.value) {
            deptRef.value.setCheckedKeys(res.checkedKeys)
          }
        })
      })
    })
  })
  title.value = "分配数据权限"
}

/** 提交按钮（数据权限） */
function submitDataScope() {
  if (form.value.roleId != undefined) {
    form.value.deptIds = getDeptAllCheckedKeys()
    dataScope(form.value).then(() => {
      proxy.$modal.msgSuccess("修改成功")
      openDataScope.value = false
      getList()
    })
  }
}

/** 取消按钮（数据权限）*/
function cancelDataScope() {
  openDataScope.value = false
  reset()
}

onMounted(() => {
  getList()
  getTanentList()
})
</script>

<style scoped lang="scss">
.role-manage-page {
  display: flex;
  box-sizing: border-box;
  height: 100%;
  min-height: calc(100vh - var(--navbar-height, 96px));
  flex-direction: column;
  padding: 40px 40px 20px;
  background: #ebf3f5;
  border-radius: 40px 0 0 0;
  overflow: hidden;
}

.page-name {
  margin-bottom: 40px;

  :deep(.page-name-right) {
    align-self: flex-start;
    padding-top: 4px;
  }
}

.add-role-btn {
  min-width: 130px;
  height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: 20px;
  background: #29b276;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.92;
  }
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  &__keyword {
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 420px;
    height: 36px;
    padding: 0 8px 0 16px;
    border: 1px solid #e1e6ec;
    border-radius: 12px;
    background: #ffffff;
    box-sizing: border-box;
  }

  &__input {
    flex: 1;
    min-width: 0;

    :deep(.el-input__wrapper) {
      padding: 0;
      background: transparent;
      box-shadow: none !important;
    }

    :deep(.el-input__inner) {
      height: 38px;
      line-height: 38px;
      font-size: 14px;
      color: #303133;

      &::placeholder {
        color: #a8abb2;
      }
    }
  }

  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
      background: #ebf3f5;
    }
  }

  &__icon {
    font-size: 16px;
    color: #77838f;
  }

  &__tenant {
    width: 200px;
    flex: none;
    margin-left: 8px;

    :deep(.el-select) {
      width: 100%;
    }

    :deep(.el-select__wrapper) {
      min-height: 36px;
      border-radius: 12px;
      box-shadow: 0 0 0 1px #e1e6ec inset !important;
    }
  }

  &__date-wrap {
    width: 326px;
    flex: none;
    margin-left: 8px;
    margin-right: 8px;

    :deep(.el-date-editor) {
      --el-date-editor-daterange-width: 326px;
      --el-date-editor-width: 326px;
      width: 326px !important;
      max-width: 326px !important;
      flex-grow: 0 !important;
    }

    :deep(.el-input__wrapper) {
      width: 100%;
      height: 36px;
      border-radius: 12px;
      box-shadow: 0 0 0 1px #e1e6ec inset !important;
    }
  }

  &__date {
    width: 100%;
  }

  &__reset {
    min-width: 76px;
    height: 36px;
    padding: 0 20px;
    border: 1px solid #e1e6ec;
    border-radius: 12px;
    background: #ffffff;
    color: #77838f;
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;

    &:hover {
      border-color: #3297a0;
      color: #3297a0;
    }
  }

  &__submit {
    min-width: 72px;
    height: 36px;
    padding: 0 24px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(180deg, #31aba0 0%, #2897be 100%);
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    margin-left: 8px;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.92;
    }
  }
}

.role-content-card {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 0 0 32px;
  border-radius: 24px;
  background: #ffffff;
  overflow: hidden;
}

.table-wrap {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.role-table {
  height: 100%;

  :deep(.el-table) {
    --el-table-border-color: #ebeef5;
    --el-table-header-bg-color: #ffffff !important;
    --el-table-tr-bg-color: #fbfcfd;
  }

  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }

  :deep(.el-table__body-wrapper) {
    background-color: #fbfcfd;
  }

  :deep(.el-table__header-wrapper th),
  :deep(.el-table__fixed-header-wrapper th) {
    background-color: #ffffff !important;
    color: #77838f;
    font-size: 14px;
    font-weight: 600;
  }

  :deep(.el-table__header-wrapper th.el-table__cell),
  :deep(.el-table__fixed-header-wrapper th.el-table__cell) {
    height: 60px !important;
    padding: 0 !important;
    box-sizing: border-box;
    background-color: #ffffff !important;

    .cell {
      padding: 20px 12px;
      box-sizing: border-box;
      line-height: 20px;
    }
  }

  :deep(.el-table.is-scrolling-none .el-table__header-wrapper th.el-table__cell.gutter) {
    display: none;
    width: 0 !important;
  }

  :deep(.el-table.is-scrolling-none .el-table__fixed-right-patch) {
    display: none;
    width: 0 !important;
  }

  // 无横向滚动时走主表格渲染，避免 fixed 面板与表头错位
  :deep(.el-table.is-scrolling-none) {
    .el-table__fixed-right,
    .el-table__fixed-header-wrapper {
      display: none !important;
    }

    .el-table__header-wrapper th.el-table-fixed-column--right,
    .el-table__header-wrapper th.action-column-header,
    .el-table__body-wrapper td.el-table-fixed-column--right,
    .el-table__body-wrapper td.action-column {
      visibility: visible !important;
    }
  }

  :deep(.el-table__header-wrapper th.action-column-header.el-table__cell .cell),
  :deep(.el-table__fixed-header-wrapper th.action-column-header.el-table__cell .cell) {
    padding: 20px 12px;
    text-align: left;
  }

  :deep(.el-table__body-wrapper td.action-column.el-table__cell .cell) {
    overflow: visible;
    white-space: nowrap;
    text-align: left;
  }

  :deep(.el-table__body tr.el-table__row) {
    background-color: #fbfcfd !important;
  }

  :deep(.el-table__body tr.el-table__row td.el-table__cell) {
    background-color: #fbfcfd !important;
    padding: 0 !important;
  }

  :deep(.el-table__body tr.el-table__row td.el-table__cell .cell) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 11px 12px;
    box-sizing: border-box;
    color: #2b2f33;
    font-size: 14px;
    line-height: 20px;
  }

  :deep(.builtin-tag) {
    margin-left: 10px;
  }

  :deep(.el-table__fixed-right),
  :deep(.el-table__fixed-right-patch) {
    background-color: transparent;
  }

  :deep(.el-table__fixed-right th.el-table__cell),
  :deep(.el-table__fixed-right td.el-table__cell) {
    background-color: inherit;
  }

  :deep(.el-table__fixed-right th.el-table__cell),
  :deep(.el-table__fixed-header-wrapper th.el-table__cell) {
    height: 60px !important;
    padding: 0 !important;
    background-color: #ffffff !important;

    .cell {
      padding: 20px 12px;
      box-sizing: border-box;
      line-height: 20px;
      text-align: left;
    }
  }

  :deep(.el-table__fixed-right td.el-table__cell) {
    padding: 0 !important;
    background-color: #fbfcfd !important;

    .cell {
      padding: 11px 12px;
      box-sizing: border-box;
      line-height: 20px;
      text-align: left;
    }
  }

  :deep(.table-action-cell) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  :deep(.el-button.is-link) {
    padding: 0;
    margin: 0;
    font-size: 14px;
  }

  :deep(.action-link--primary.el-button.is-link) {
    color: #3297a0;
    background: transparent !important;
    background-image: none !important;
    border: none;

    &:hover:not(.is-disabled),
    &:focus:not(.is-disabled) {
      color: #66b8bf;
      background: transparent !important;
      background-image: none !important;
    }
  }

  :deep(.action-link--danger.el-button.is-link) {
    color: #fe595d;
    background: transparent !important;
    background-image: none !important;
    border: none;

    &:hover:not(.is-disabled),
    &:focus:not(.is-disabled) {
      color: #ff7b7e;
      background: transparent !important;
      background-image: none !important;
    }
  }
}

.pagination-row {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding: 24px 40px 0;

  :deep(.pagination-container) {
    padding: 0;
    margin: 0;
    background: transparent;
  }
}

@media (max-width: 768px) {
  .role-manage-page {
    padding: 16px;
    border-radius: 24px 0 0 0;
  }

  .role-content-card {
    padding: 0 0 16px;
  }

  .pagination-row {
    padding: 16px 16px 0;
  }

  .search-bar {
    &__keyword,
    &__tenant,
    &__date-wrap {
      width: 100%;
      max-width: none;
    }

    &__date-wrap :deep(.el-date-editor) {
      width: 100% !important;
      max-width: none !important;
    }
  }
}
</style>

<style lang="scss">
.role-form-dialog.kjsc-dialog-v2 {
  border-radius: 24px;
  overflow: hidden;
  padding: 0;

  .el-dialog__header {
    padding: 24px 32px 20px;
    margin-right: 0;
    border-bottom: 1px solid #ebeef5;

    .el-dialog__title {
      font-size: 20px;
      font-weight: 600;
      color: #2b2f33;
      line-height: 26px;
    }

    .el-dialog__headerbtn {
      top: 24px;
      right: 24px;
      width: 24px;
      height: 24px;

      .el-dialog__close {
        color: #77838f;
        font-size: 18px;
      }
    }
  }

  .el-dialog__body {
    padding: 20px 40px 0;
  }

  .el-dialog__footer {
    padding: 32px 32px 32px;
  }

  .role-form {
    .el-form-item {
      margin-bottom: 20px;
    }

    .el-form-item__label {
      display: inline-flex;
      align-items: center;
      line-height: 20px;
      font-size: 14px;
      font-weight: 500;
      color: #2b2f33;
    }

    .el-form-item.is-required > .el-form-item__label::before {
      display: none !important;
      margin: 0 !important;
      content: '' !important;
    }

    .el-form-item.is-required > .el-form-item__label::after {
      content: '*';
      margin-left: 4px;
      color: #fe595d;
    }

    .el-input__wrapper,
    .el-select__wrapper,
    .el-textarea__inner {
      border-radius: 8px;
      box-shadow: 0 0 0 1px #e1e6ec inset !important;
    }

    .el-input__wrapper,
    .el-select__wrapper {
      min-height: 40px;
    }

    .el-textarea__inner {
      min-height: 96px;
      padding: 10px 12px;
    }

    .el-input__inner {
      font-size: 14px;
      color: #2b2f33;

      &::placeholder {
        color: #a8abb2;
      }
    }

    .el-input__count {
      color: #a8abb2;
    }
  }

  .menu-permission-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 12px;
  }

  .menu-tree.tree-border {
    width: 100%;
    margin-top: 0;
    border: 1px solid #e1e6ec;
    border-radius: 8px;
    padding: 12px;
    background: #fbfcfd;
  }

  .role-dialog-footer {
    display: flex;
    justify-content: flex-end;
  }

  .role-dialog-submit {
    min-width: 120px;
    height: 40px;
    padding: 0 28px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(180deg, #31aba0 0%, #2897be 100%);
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover:not(:disabled) {
      opacity: 0.92;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }
}
</style>
