<template>
  <section>
    <page-name>
      <el-button type="success" icon="Plus" v-hasPermi="['system:role:add']" @click="handleAdd">
        {{ $t('page.system.role.add', '新增角色') }}
      </el-button>
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.roleName"
              class="search-bar__input"
              :suffix-icon="'Search'"
              clearable
              :placeholder="$t('page.system.role.searchPlaceholder', '通过角色名称进行模糊搜索')"
              @keyup.enter="handleQuery"
            />
          </div>

          <el-select
            v-if="isPlatformRole"
            v-model="queryParams.tenantId"
            style="width: 200px"
            clearable
            :placeholder="$t('page.system.role.allTenants', '全部租户')"
          >
            <el-option :label="$t('page.system.role.allTenants', '全部租户')" value="" />
            <el-option v-for="item in tenantOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>

          <el-date-picker
            v-model="dateRange"
            value-format="YYYY-MM-DD"
            type="daterange"
            style="max-width: 250px"
            :range-separator="$t('page.system.role.rangeSeparator', '至')"
            :start-placeholder="$t('page.system.role.startDatePlaceholder', '开始时间')"
            :end-placeholder="$t('page.system.role.endDatePlaceholder', '结束时间')"
          />

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table ref="roleTableRef" v-loading="loading" :data="roleList" height="100%" @selection-change="handleSelectionChange">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column
          :label="$t('page.system.role.table.roleName', '角色名称')"
          prop="roleName"
          :min-width="$dim('page.system.role.table.roleName', 160)"
          align="left"
          :show-overflow-tooltip="true"
        >
          <template #default="{ row }">
            <span>{{ row.roleName }}</span>
            <el-tag v-if="row.builtin === 0" :key="row.roleKey" size="small" type="info" effect="light" style="margin-left: 10px">
              {{ $t('page.normal.builtin', '系统内置') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.role.table.tenantName', '所属租户')"
          prop="tenantName"
          :min-width="$dim('page.system.role.table.tenantName', 140)"
          align="left"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.system.role.table.remark', '描述')"
          prop="remark"
          :min-width="$dim('page.system.role.table.remark', 200)"
          align="left"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.system.role.table.updateTime', '最新修改时间')"
          prop="updateTime"
          :min-width="$dim('page.system.role.table.updateTime', 170)"
          align="left"
        />
        <el-table-column
          :label="$t('page.system.role.table.operation', '操作')"
          align="left"
          header-align="left"
          :min-width="$dim('page.system.role.table.operation', 140)"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              v-hasPermi="['system:role:edit']"
              :disabled="row.builtin === 0 && !isPlatformRole"
              @click="handleUpdate(row)"
            >
              {{ $t('page.normal.edit', '编辑') }}
            </el-button>
            <el-popconfirm
              v-if="row.builtin !== 0"
              :confirm-button-text="$t('page.normal.confirm', '确定')"
              :cancel-button-text="$t('page.normal.cancel', '取消')"
              :title="$t('page.system.role.deleteConfirm', '确认删除吗?')"
              :hide-after="100"
              @confirm="confirmCallback(row)"
            >
              <template #reference>
                <el-button link type="danger" v-hasPermi="['system:role:remove']">
                  {{ $t('page.normal.remove', '删除') }}
                </el-button>
              </template>
            </el-popconfirm>
            <el-button v-else link type="danger" v-hasPermi="['system:role:remove']" disabled>
              {{ $t('page.normal.remove', '删除') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </template>
    </page-content>

    <!-- 添加或修改角色配置对话框 -->
    <KJSCDialogV2
      :title="form.roleId ? $t('page.system.role.form.editTitle', '修改角色') : $t('page.system.role.form.addTitle', '添加角色')"
      v-model="open"
      width="800px"
      append-to-body
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form ref="roleRef" :model="form" :rules="rules" label-position="top" hide-required-asterisk>
        <el-form-item :label="$t('page.system.role.form.roleName', '角色名称')" prop="roleName">
          <el-input
            v-model="form.roleName"
            maxlength="10"
            show-word-limit
            :disabled="isEdit"
            :placeholder="$t('page.system.role.form.roleNamePlaceholder', '请输入角色名称')"
          >
            <template #prefix>
              <el-tag v-if="isInternalRole" :key="form.roleKey" size="small" type="info" effect="light">
                {{ $t('page.normal.builtin', '系统内置') }}
              </el-tag>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item :label="$t('page.system.role.form.tenantName', '所属租户')" prop="tenantId">
          <el-select
            style="width: 100%"
            v-model="form.tenantId"
            :placeholder="$t('page.system.role.form.tenantPlaceholder', '请选择租户')"
            :disabled="!!form.roleId || !isPlatformRole"
          >
            <el-option v-for="item in tenantOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('page.system.role.form.description', '角色描述')">
          <el-input
            v-model="form.remark"
            maxlength="30"
            show-word-limit
            :disabled="isEdit"
            type="textarea"
            :placeholder="$t('page.system.role.form.descriptionPlaceholder', '请输入角色描述信息')"
          />
        </el-form-item>
        <el-form-item :label="$t('page.system.role.form.menuPermission', '菜单权限')">
          <div class="menu-permission-tools">
            <el-checkbox v-model="menuExpand" :disabled="isEdit" @change="handleCheckedTreeExpand($event, 'menu')">
              {{ $t('page.system.role.form.expandCollapse', '展开/折叠') }}
            </el-checkbox>
            <el-checkbox v-model="menuNodeAll" :disabled="isEdit" @change="handleCheckedTreeNodeAll($event, 'menu')">
              {{ $t('page.system.role.form.selectAllToggle', '全选/全不选') }}
            </el-checkbox>
            <el-checkbox v-model="form.menuCheckStrictly" :disabled="isEdit" @change="handleCheckedTreeConnect($event, 'menu')">
              {{ $t('page.system.role.form.parentChildLinkage', '父子联动') }}
            </el-checkbox>
          </div>
          <el-tree
            class="tree-border menu-tree"
            :data="menuOptions"
            show-checkbox
            ref="menuRef"
            node-key="id"
            :check-strictly="!form.menuCheckStrictly"
            :empty-text="$t('page.normal.loading', '加载中，请稍候')"
            :disabled="isEdit"
            :props="{ label: 'label', children: 'children' }"
          />
        </el-form-item>
      </el-form>
      <template #prefixFooter>
        <el-button type="primary" :disabled="submitDisabled || isEdit" @click="submitForm">
          {{ form.roleId ? $t('page.system.role.form.confirmEdit', '确认修改') : $t('page.system.role.form.confirmAdd', '确认新增') }}
        </el-button>
      </template>
    </KJSCDialogV2>
  </section>
</template>

<script setup lang="ts" name="Role">
import { addRole, changeRoleStatus, dataScope, delRole, getRole, listRole, updateRole, deptTreeSelect } from '@/api/system/role';
import { roleMenuTreeselect, treeselect as menuTreeselect } from '@/api/system/menu';
import type { SysRole, RoleQueryParams } from '@/types/api/system/role';
import type { TreeSelect } from '@/types/api/common';
import type { RoleDeptTreeResult } from '@/types/api/system/role';
import type { RoleMenuTreeselectResult, RoleMenuTreeselectResultData } from '@/types/api/system/menu';

import { isEmpty } from '@/utils/common.js';
import useUserStore from '@/store/modules/user';
import _api from '@/utils/api';
import cache from '@/plugins/cache';
const api: any = _api;

const userStore = useUserStore();
const router = useRouter();
const { proxy } = getCurrentInstance();
// const { sys_normal_disable } = proxy.useDict("sys_normal_disable")

const roleList = ref<SysRole[]>([]);
const roleTableRef = ref();
const open = ref<boolean>(false);
const loading = ref<boolean>(true);
const showSearch = ref<boolean>(true);
const ids = ref<number[]>([]);
const single = ref<boolean>(true);
const multiple = ref<boolean>(true);
const total = ref<number>(0);
const title = ref<string>('');
const dateRange = ref<string[]>([]);
const menuOptions = ref<TreeSelect[]>([]);
const menuExpand = ref<boolean>(false);
const menuNodeAll = ref<boolean>(false);
const deptExpand = ref<boolean>(true);
const deptNodeAll = ref<boolean>(false);
const deptOptions = ref<TreeSelect[]>([]);
const openDataScope = ref<boolean>(false);
const menuRef = ref<any | null>(null);
const deptRef = ref<any | null>(null);
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
    roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
    tenantId: [{ required: true, message: '租户不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

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
  console.log(userStore.isPlatformTenant, 'userStore.isPlatformTenant');
  return userStore.isPlatformTenant;
});

// 是否可以修改
const isEdit = computed(() => {
  return !(isPlatformRole || !isInternalRole);
});

/** 查询角色列表 */
function getList() {
  loading.value = true;
  listRole(proxy.addDateRange(queryParams.value, dateRange.value)).then((response) => {
    roleList.value = response.rows;
    total.value = response.total;
    loading.value = false;
    nextTick(() => {
      roleTableRef.value?.doLayout();
    });
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  queryParams.value.roleName = undefined;
  queryParams.value.tenantId = undefined;
  handleQuery();
}

/** 删除按钮操作 */
function confirmCallback(data: any) {
  const roleIds = data.roleId;
  delRole(roleIds).then((response) => {
    getList();
    if (response.code == 200) {
      proxy.$modal.msgSuccess('操作成功');
    } else {
      proxy.$modal.msgError(response.msg);
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row?: SysRole) {
  const roleIds = row?.roleId || ids.value;
  proxy.$modal
    .confirm('是否确认删除角色编号为"' + roleIds + '"的数据项?')
    .then(function () {
      return delRole(roleIds);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess('删除成功');
    })
    .catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download(
    'system/role/export',
    {
      ...queryParams.value
    },
    `role_${new Date().getTime()}.xlsx`
  );
}

/** 多选框选中数据 */
function handleSelectionChange(selection: SysRole[]) {
  ids.value = selection.map((item) => item.roleId!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 角色状态修改 */
function handleStatusChange(row: SysRole) {
  const text = row.status === '0' ? '启用' : '停用';
  proxy.$modal
    .confirm('确认要"' + text + '""' + row.roleName + '"角色吗?')
    .then(function () {
      return changeRoleStatus(row.roleId!, row.status!);
    })
    .then(() => {
      proxy.$modal.msgSuccess(text + '成功');
    })
    .catch(function () {
      row.status = row.status === '0' ? '1' : '0';
    });
}

/** 更多操作 */
function handleCommand(command: string, row: SysRole) {
  switch (command) {
    case 'handleDataScope':
      handleDataScope(row);
      break;
    case 'handleAuthUser':
      handleAuthUser(row);
      break;
    default:
      break;
  }
}

/** 分配用户 */
function handleAuthUser(row: SysRole) {
  router.push('/system/role-auth/user/' + row.roleId);
}

/** 查询菜单树结构 */
function getMenuTreeselect() {
  menuTreeselect().then((response) => {
    menuOptions.value = response.data;
  });
}

/** 所有部门节点数据 */
function getDeptAllCheckedKeys(): number[] {
  // 目前被选中的部门节点
  let checkedKeys = deptRef.value.getCheckedKeys();
  // 半选中的部门节点
  let halfCheckedKeys = deptRef.value.getHalfCheckedKeys();
  checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
  return checkedKeys;
}

/** 重置新增的表单以及其他数据  */
function reset() {
  if (menuRef.value != undefined) {
    menuRef.value.setCheckedKeys([]);
  }
  menuExpand.value = false;
  menuNodeAll.value = false;
  deptExpand.value = true;
  deptNodeAll.value = false;
  form.value = {
    roleId: undefined,
    roleName: undefined,
    menuIds: [],
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    remark: undefined
  };
  proxy.resetForm('roleRef');
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
  reset();
  getTanentList();
  getMenuTreeselect();
  // 普通租户自动选择
  if (isPlatformRole) {
    form.value.tenantId = cache.session.getJSON('tenantId');
  }
  open.value = true;
  title.value = '添加角色';
}

/** 修改角色 */
function handleUpdate(row?: SysRole) {
  reset();
  const roleId = row?.roleId || ids.value[0];
  const roleMenu = getRoleMenuTreeselect(roleId);
  getRole(roleId).then((response) => {
    form.value = response.data;
    // form.value.roleSort = Number(form.value.roleSort)
    open.value = true;
    getTanentList();
    nextTick(() => {
      roleMenu.then((res: RoleMenuTreeselectResultData) => {
        const checkedKeys = res.checkedKeys;
        checkedKeys.forEach((v) => {
          nextTick(() => {
            menuRef.value?.setChecked(v, true, false);
          });
        });
      });
    });
  });
  title.value = '修改角色';
}

/** 根据角色ID查询菜单树结构 */
function getRoleMenuTreeselect(roleId: number): Promise<RoleMenuTreeselectResultData> {
  return roleMenuTreeselect(roleId).then((response: any) => {
    // console.log('getRoleMenuTreeselect', response)
    const data = response.data || response || ({} as RoleMenuTreeselectResultData);
    menuOptions.value = data.menus || [];
    return data;
  });
}

/** 根据角色ID查询部门树结构 */
function getDeptTree(roleId: number) {
  Promise<RoleDeptTreeResult>;
  return deptTreeSelect(roleId).then((response) => {
    deptOptions.value = response.depts;
    return response;
  });
}

/** 树权限（展开/折叠）*/
function handleCheckedTreeExpand(value: boolean, type: string) {
  if (type == 'menu') {
    let treeList = menuOptions.value;
    for (let i = 0; i < treeList.length; i++) {
      menuRef.value.store.nodesMap[treeList[i].id].expanded = value;
    }
  } else if (type == 'dept') {
    let treeList = deptOptions.value;
    for (let i = 0; i < treeList.length; i++) {
      deptRef.value.store.nodesMap[treeList[i].id].expanded = value;
    }
  }
}

/** 树权限（全选/全不选） */
function handleCheckedTreeNodeAll(value: boolean, type: string) {
  if (type == 'menu') {
    menuRef.value.setCheckedNodes(value ? menuOptions.value : []);
  } else if (type == 'dept') {
    deptRef.value.setCheckedNodes(value ? deptOptions.value : []);
  }
}

/** 树权限（父子联动） */
function handleCheckedTreeConnect(value: boolean, type: string) {
  if (type == 'menu') {
    form.value.menuCheckStrictly = value ? true : false;
  } else if (type == 'dept') {
    form.value.deptCheckStrictly = value ? true : false;
  }
}

/** 所有菜单节点数据 */
function getMenuAllCheckedKeys(): number[] {
  // 目前被选中的菜单节点
  let checkedKeys = menuRef.value.getCheckedKeys();
  // 半选中的菜单节点
  let halfCheckedKeys = menuRef.value.getHalfCheckedKeys();
  checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
  return checkedKeys;
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs['roleRef'].validate((valid: boolean) => {
    if (valid) {
      if (form.value.roleId != undefined) {
        form.value.menuIds = getMenuAllCheckedKeys();
        updateRole(form.value).then(() => {
          proxy.$modal.msgSuccess('修改成功');
          open.value = false;
          getList();
        });
      } else {
        form.value.menuIds = getMenuAllCheckedKeys();
        addRole(form.value).then(() => {
          proxy.$modal.msgSuccess('新增成功');
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 选择角色权限范围触发 */
function dataScopeSelectChange(value: string) {
  if (value !== '2') {
    deptRef.value.setCheckedKeys([]);
  }
}

/** 分配数据权限操作 */
function handleDataScope(row: SysRole) {
  reset();
  const deptTreeSelect = getDeptTree(row.roleId!);
  getRole(row.roleId!).then((response) => {
    form.value = response.data!;
    openDataScope.value = true;
    nextTick(() => {
      deptTreeSelect.then((res) => {
        nextTick(() => {
          if (deptRef.value) {
            deptRef.value.setCheckedKeys(res.checkedKeys);
          }
        });
      });
    });
  });
  title.value = '分配数据权限';
}

/** 提交按钮（数据权限） */
function submitDataScope() {
  if (form.value.roleId != undefined) {
    form.value.deptIds = getDeptAllCheckedKeys();
    dataScope(form.value).then(() => {
      proxy.$modal.msgSuccess('修改成功');
      openDataScope.value = false;
      getList();
    });
  }
}

/** 取消按钮（数据权限）*/
function cancelDataScope() {
  openDataScope.value = false;
  reset();
}

onMounted(() => {
  getList();
  getTanentList();
});
</script>

<style lang="scss" scoped></style>
