<template>
  <section>
    <page-name>
      <el-button type="primary" icon="Plus" v-hasPermi="['system:menu:add']" @click="handleAdd()">
        {{ $t('page.system.menu.add', '新增菜单') }}
      </el-button>
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.menuName"
              class="search-bar__input"
              :suffix-icon="'Search'"
              clearable
              :placeholder="$t('page.system.menu.search.menuNamePlaceholder', '请输入菜单名称')"
              @keyup.enter="handleQuery"
            />
          </div>

          <el-select
            v-model="queryParams.status"
            style="width: 150px"
            clearable
            :placeholder="$t('page.system.menu.search.statusPlaceholder', '菜单状态')"
          >
            <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
          <el-button style="margin-left: auto" v-hasPermi="['system:menu:edit']" @click="handleSaveSort">
            {{ $t('page.system.menu.saveSort', '保存排序') }}
          </el-button>
          <el-button @click="toggleExpandAll">{{ $t('page.system.menu.toggleExpand', '展开/折叠') }}</el-button>
        </div>
      </template>

      <el-table
        v-if="refreshTable"
        ref="menuTableRef"
        v-loading="loading"
        :data="menuList"
        height="100%"
        row-key="menuId"
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column
          prop="menuName"
          :label="$t('page.system.menu.table.menuName', '菜单名称')"
          :min-width="$dim('page.system.menu.table.menuName', 220)"
          align="left"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <svg-icon :icon-class="scope.row.icon" />
            <span>{{ scope.row.menuName }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('page.system.menu.table.type', '类型')" :min-width="$dim('page.system.menu.table.type', 100)" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.menuType === 'M' && scope.row.isFrame === '0'" type="danger" size="small">
              {{ $t('page.system.menu.type.externalLink', '外链') }}
            </el-tag>
            <el-tag v-else-if="scope.row.menuType === 'M'" type="primary" size="small">
              {{ $t('page.system.menu.type.directory', '目录') }}
            </el-tag>
            <el-tag v-else-if="scope.row.menuType === 'C' && scope.row.isFrame === '0'" type="danger" size="small">
              {{ $t('page.system.menu.type.externalLink', '外链') }}
            </el-tag>
            <el-tag v-else-if="scope.row.menuType === 'C'" type="success" size="small">
              {{ $t('page.system.menu.type.menu', '菜单') }}
            </el-tag>
            <el-tag v-else-if="scope.row.menuType === 'F'" type="warning" size="small">
              {{ $t('page.system.menu.type.button', '按钮') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="orderNum"
          :label="$t('page.system.menu.table.order', '排序')"
          :min-width="$dim('page.system.menu.table.order', 140)"
          align="left"
        >
          <template #default="scope">
            <el-input-number v-model="scope.row.orderNum" controls-position="right" :min="0" style="width: 100px" />
          </template>
        </el-table-column>
        <el-table-column
          prop="perms"
          :label="$t('page.system.menu.table.permission', '权限标识')"
          :min-width="$dim('page.system.menu.table.permission', 160)"
          align="left"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          prop="component"
          :label="$t('page.system.menu.table.component', '组件路径')"
          :min-width="$dim('page.system.menu.table.component', 180)"
          align="left"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          prop="status"
          :label="$t('page.system.menu.table.status', '状态')"
          :min-width="$dim('page.system.menu.table.status', 100)"
          align="center"
        >
          <template #default="scope">
            <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.menu.table.operation', '操作')"
          :min-width="$dim('page.system.menu.table.operation', 200)"
          align="left"
          fixed="right"
        >
          <template #default="scope">
            <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:menu:edit']">
              {{ $t('page.normal.edit', '编辑') }}
            </el-button>
            <el-button link type="primary" @click="handleAdd(scope.row)" v-hasPermi="['system:menu:add']">
              {{ $t('page.system.menu.addShort', '新增') }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermi="['system:menu:remove']">
              {{ $t('page.normal.remove', '删除') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </page-content>

    <KjscRtlDrawer
      :title="form.menuId ? $t('page.system.menu.form.editTitle', '修改菜单') : $t('page.system.menu.form.addTitle', '添加菜单')"
      v-model="open"
      size="800px"
    >
      <el-form ref="menuRef" :model="form" :rules="rules" label-position="top" hide-required-asterisk>
        <el-form-item :label="$t('page.system.menu.form.parentMenu', '上级菜单')">
          <el-tree-select
            v-model="form.parentId"
            :data="menuOptions"
            :props="{ value: 'menuId', label: 'menuName', children: 'children' }"
            value-key="menuId"
            :placeholder="$t('page.system.menu.form.parentMenuPlaceholder', '请选择上级菜单')"
            check-strictly
            :offset="0"
            :teleported="true"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item :label="$t('page.system.menu.form.menuType', '菜单类型')" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio value="M">{{ $t('page.system.menu.type.directory', '目录') }}</el-radio>
            <el-radio value="C">{{ $t('page.system.menu.type.menu', '菜单') }}</el-radio>
            <el-radio value="F">{{ $t('page.system.menu.type.button', '按钮') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <div class="menu-form-grid">
          <el-form-item v-if="form.menuType != 'F'" :label="$t('page.system.menu.form.icon', '菜单图标')" prop="icon">
            <el-popover placement="bottom-start" :width="540" trigger="click">
              <template #reference>
                <el-input
                  v-model="form.icon"
                  :placeholder="$t('page.system.menu.form.iconPlaceholder', '点击选择图标')"
                  readonly
                  @blur="showSelectIcon"
                >
                  <template #prefix>
                    <el-icon v-if="form.icon"><svg-icon :icon-class="form.icon" /></el-icon>
                    <el-icon v-else><search /></el-icon>
                  </template>
                </el-input>
              </template>
              <icon-select ref="iconSelectRef" @selected="selected" :active-icon="form.icon" />
            </el-popover>
          </el-form-item>

          <el-form-item :label="$t('page.system.menu.form.order', '显示排序')" prop="orderNum">
            <el-input-number v-model="form.orderNum" controls-position="right" :min="0" style="width: 100%" />
          </el-form-item>

          <el-form-item :label="$t('page.system.menu.form.menuName', '菜单名称')" prop="menuName">
            <el-input v-model="form.menuName" :placeholder="$t('page.system.menu.form.menuNamePlaceholder', '请输入菜单名称')" />
          </el-form-item>

          <el-form-item v-if="form.menuType == 'C'" :label="$t('page.system.menu.form.routeName', '路由名称')" prop="routeName">
            <el-input v-model="form.routeName" :placeholder="$t('page.system.menu.form.routeNamePlaceholder', '请输入路由名称')" />
          </el-form-item>

          <el-form-item v-if="form.menuType != 'F'" :label="$t('page.system.menu.form.isExternalLink', '是否外链')">
            <el-switch v-model="form.isFrame" active-value="0" inactive-value="1" />
          </el-form-item>

          <el-form-item v-if="form.menuType != 'F'" :label="$t('page.system.menu.form.path', '路由地址')" prop="path">
            <el-input v-model="form.path" :placeholder="$t('page.system.menu.form.pathPlaceholder', '请输入路由地址')" />
          </el-form-item>

          <el-form-item v-if="form.menuType == 'C'" :label="$t('page.system.menu.form.component', '组件路径')" prop="component">
            <el-input v-model="form.component" :placeholder="$t('page.system.menu.form.componentPlaceholder', '请输入组件路径')" />
          </el-form-item>

          <el-form-item v-if="form.menuType != 'M'" :label="$t('page.system.menu.form.permission', '权限字符')" prop="perms">
            <el-input v-model="form.perms" :placeholder="$t('page.system.menu.form.permissionPlaceholder', '请输入权限标识')" maxlength="100" />
          </el-form-item>

          <el-form-item v-if="form.menuType == 'C'" :label="$t('page.system.menu.form.query', '路由参数')" prop="query">
            <el-input v-model="form.query" :placeholder="$t('page.system.menu.form.queryPlaceholder', '请输入路由参数')" maxlength="255" />
          </el-form-item>

          <el-form-item v-if="form.menuType == 'C'" :label="$t('page.system.menu.form.isCache', '是否缓存')">
            <el-switch v-model="form.isCache" active-value="0" inactive-value="1" />
          </el-form-item>

          <el-form-item v-if="form.menuType != 'F'" :label="$t('page.system.menu.form.visible', '显示状态')">
            <el-switch v-model="form.visible" active-value="0" inactive-value="1" />
          </el-form-item>

          <el-form-item :label="$t('page.system.menu.form.status', '菜单状态')">
            <el-switch v-model="form.status" active-value="0" inactive-value="1" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button type="primary" @click="submitForm">
          {{ $t('page.system.menu.form.confirm', '确认')
          }}{{ form.menuId ? $t('page.system.menu.form.update', '修改') : $t('page.system.menu.form.add', '新增') }}
        </el-button>
      </template>
    </KjscRtlDrawer>
  </section>
</template>

<script setup lang="ts" name="Menu">
import { addMenu, delMenu, getMenu, listMenu, updateMenu, updateMenuSort } from '@/api/system/menu';
import IconSelect from '@/components/IconSelect/index.vue';
import type { SysMenu, MenuQueryParams } from '@/types/api/system/menu';

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict('sys_normal_disable');

const menuList = ref<any[]>([]);
const menuTableRef = ref();
const open = ref<boolean>(false);
const loading = ref<boolean>(true);
const title = ref<string>('');
const menuOptions = ref<any[]>([]);
const isExpandAll = ref<boolean>(false);
const refreshTable = ref<boolean>(true);
const iconSelectRef = ref<any | null>(null);
const originalOrders = ref<Record<number, number>>({});

const data = reactive({
  form: {} as SysMenu,
  queryParams: {
    menuName: undefined,
    status: undefined
  } as MenuQueryParams,
  rules: {
    menuName: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
    orderNum: [{ required: true, message: '菜单顺序不能为空', trigger: 'blur' }],
    path: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

function getList() {
  loading.value = true;
  listMenu(queryParams.value).then((response) => {
    menuList.value = proxy.handleTree(response.data, 'menuId');
    recordOriginalOrders(menuList.value);
    loading.value = false;
    nextTick(() => {
      menuTableRef.value?.doLayout();
    });
  });
}

function getTreeselect() {
  menuOptions.value = [];
  listMenu().then((response) => {
    const menu = { menuId: 0, menuName: '主类目', children: [] };
    menu.children = proxy.handleTree(response.data, 'menuId');
    menuOptions.value.push(menu);
  });
}

function reset() {
  form.value = {
    menuId: undefined,
    parentId: 0,
    menuName: undefined,
    icon: undefined,
    menuType: 'M',
    orderNum: undefined,
    isFrame: '1',
    isCache: '0',
    visible: '0',
    status: '0'
  };
  proxy.resetForm('menuRef');
}

function showSelectIcon() {
  iconSelectRef.value?.reset();
}

function selected(name: string) {
  form.value.icon = name;
}

function handleQuery() {
  getList();
}

function resetQuery() {
  queryParams.value.menuName = undefined;
  queryParams.value.status = undefined;
  handleQuery();
}

function handleAdd(row?: SysMenu) {
  reset();
  getTreeselect();
  if (row != null && row.menuId) {
    form.value.parentId = row.menuId;
  } else {
    form.value.parentId = 0;
  }
  open.value = true;
  title.value = '添加菜单';
}

function toggleExpandAll() {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
    nextTick(() => {
      menuTableRef.value?.doLayout();
    });
  });
}

async function handleUpdate(row: SysMenu) {
  reset();
  await getTreeselect();
  getMenu(row.menuId!).then((response) => {
    form.value = response.data!;
    open.value = true;
    title.value = '修改菜单';
  });
}

function handleStatusChange(row: SysMenu) {
  const text = row.status === '0' ? '启用' : '停用';
  proxy.$modal
    .confirm('确认要"' + text + '""' + row.menuName + '"菜单吗?')
    .then(() => updateMenu(row))
    .then(() => {
      proxy.$modal.msgSuccess(text + '成功');
    })
    .catch(() => {
      row.status = row.status === '0' ? '1' : '0';
    });
}

function submitForm() {
  proxy.$refs['menuRef'].validate((valid: boolean) => {
    if (valid) {
      if (form.value.menuId != undefined) {
        updateMenu(form.value).then(() => {
          proxy.$modal.msgSuccess('修改成功');
          open.value = false;
          getList();
        });
      } else {
        addMenu(form.value).then(() => {
          proxy.$modal.msgSuccess('新增成功');
          open.value = false;
          getList();
        });
      }
    }
  });
}

function recordOriginalOrders(list: SysMenu[]) {
  list.forEach((item) => {
    originalOrders.value[item.menuId!] = item.orderNum!;
    if (item.children && item.children.length) {
      recordOriginalOrders(item.children);
    }
  });
}

function handleSaveSort() {
  const changedMenuIds: number[] = [];
  const changedOrderNums: number[] = [];
  const collectChanged = (list: SysMenu[]) => {
    list.forEach((item) => {
      if (String(originalOrders.value[item.menuId!]) !== String(item.orderNum)) {
        changedMenuIds.push(item.menuId!);
        changedOrderNums.push(item.orderNum!);
      }
      if (item.children && item.children.length) {
        collectChanged(item.children);
      }
    });
  };
  collectChanged(menuList.value);
  if (changedMenuIds.length === 0) {
    proxy.$modal.msgWarning('未检测到排序修改');
    return;
  }
  updateMenuSort({ menuIds: changedMenuIds.join(','), orderNums: changedOrderNums.join(',') }).then(() => {
    proxy.$modal.msgSuccess('排序保存成功');
    recordOriginalOrders(menuList.value);
  });
}

function handleDelete(row: SysMenu) {
  proxy.$modal
    .confirm('是否确认删除名称为"' + row.menuName + '"的数据项?')
    .then(function () {
      return delMenu(row.menuId!);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess('删除成功');
    })
    .catch(() => {});
}

getList();
</script>

<style scoped lang="scss">
.menu-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}
</style>
