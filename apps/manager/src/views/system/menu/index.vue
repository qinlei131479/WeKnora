<template>
  <section class="menu-manage-page">
    <page-name class="page-name" title="菜单管理">
      <button type="button" class="add-menu-btn" v-hasPermi="['system:menu:add']" @click="handleAdd()">+ 新增菜单</button>
    </page-name>

    <div class="search-bar">
      <div class="search-bar__keyword">
        <el-input
          v-model="queryParams.menuName"
          class="search-bar__input"
          clearable
          placeholder="请输入菜单名称"
          @keyup.enter="handleQuery"
        />
        <button type="button" class="search-bar__icon-btn" @click="handleQuery">
          <svg-icon icon-class="search" class="search-bar__icon" />
        </button>
      </div>

      <div class="search-bar__status">
        <el-select v-model="queryParams.status" clearable placeholder="菜单状态">
          <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </div>

      <button type="button" class="search-bar__reset" @click="resetQuery">重置</button>
      <button type="button" class="search-bar__submit" @click="handleQuery">搜索</button>

      <button type="button" class="search-bar__save" v-hasPermi="['system:menu:edit']" @click="handleSaveSort">保存排序</button>
      <button type="button" class="search-bar__toggle" @click="toggleExpandAll">展开/折叠</button>
    </div>

    <div class="menu-content-card">
      <div class="table-wrap">
        <el-table
          v-if="refreshTable"
          ref="menuTableRef"
          v-loading="loading"
          :data="menuList"
          row-key="menuId"
          class="menu-table"
          :default-expand-all="isExpandAll"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        >
          <template #empty>
            <kjsc-empty />
          </template>
          <el-table-column prop="menuName" label="菜单名称" min-width="220" align="left" :show-overflow-tooltip="true">
            <template #default="scope">
              <svg-icon :icon-class="scope.row.icon" />
              <span class="menu-name-text">{{ scope.row.menuName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="100" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.menuType === 'M' && scope.row.isFrame === '0'" type="danger" size="small">外链</el-tag>
              <el-tag v-else-if="scope.row.menuType === 'M'" type="primary" size="small">目录</el-tag>
              <el-tag v-else-if="scope.row.menuType === 'C' && scope.row.isFrame === '0'" type="danger" size="small">外链</el-tag>
              <el-tag v-else-if="scope.row.menuType === 'C'" type="success" size="small">菜单</el-tag>
              <el-tag v-else-if="scope.row.menuType === 'F'" type="warning" size="small">按钮</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="orderNum" label="排序" width="140" align="left">
            <template #default="scope">
              <el-input-number v-model="scope.row.orderNum" controls-position="right" :min="0" style="width: 100px" />
            </template>
          </el-table-column>
          <el-table-column prop="perms" label="权限标识" min-width="160" align="left" :show-overflow-tooltip="true" />
          <el-table-column prop="component" label="组件路径" min-width="180" align="left" :show-overflow-tooltip="true" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-switch
                v-model="scope.row.status"
                style="--el-switch-on-color: #31aba0"
                active-value="0"
                inactive-value="1"
                @change="handleStatusChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="left" width="200" fixed="right" class-name="action-column" label-class-name="action-column-header">
            <template #default="scope">
              <div class="table-action-cell">
                <el-button link class="action-link action-link--primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:menu:edit']">
                  编辑
                </el-button>
                <el-button link class="action-link action-link--primary" @click="handleAdd(scope.row)" v-hasPermi="['system:menu:add']">
                  新增
                </el-button>
                <el-button link class="action-link action-link--danger" @click="handleDelete(scope.row)" v-hasPermi="['system:menu:remove']">
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <KJSCDialogV2
      :title="title"
      v-model="open"
      width="800px"
      append-to-body
      custom-class="menu-form-dialog"
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form ref="menuRef" :model="form" :rules="rules" label-position="top" class="menu-form" hide-required-asterisk>
        <el-form-item label="上级菜单">
          <el-tree-select
            v-model="form.parentId"
            :data="menuOptions"
            :props="{ value: 'menuId', label: 'menuName', children: 'children' }"
            value-key="menuId"
            placeholder="请选择上级菜单"
            check-strictly
            :offset="0"
            :teleported="true"
            popper-class="menu-tree-select-popper"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio value="M">目录</el-radio>
            <el-radio value="C">菜单</el-radio>
            <el-radio value="F">按钮</el-radio>
          </el-radio-group>
        </el-form-item>

        <div class="menu-form-grid">
          <el-form-item v-if="form.menuType != 'F'" label="菜单图标" prop="icon">
            <el-popover placement="bottom-start" :width="540" trigger="click">
              <template #reference>
                <el-input v-model="form.icon" placeholder="点击选择图标" readonly @blur="showSelectIcon">
                  <template #prefix>
                    <svg-icon v-if="form.icon" :icon-class="form.icon" class="el-input__icon menu-icon-prefix" />
                    <el-icon v-else class="menu-icon-prefix"><search /></el-icon>
                  </template>
                </el-input>
              </template>
              <icon-select ref="iconSelectRef" @selected="selected" :active-icon="form.icon" />
            </el-popover>
          </el-form-item>

          <el-form-item label="显示排序" prop="orderNum">
            <el-input-number v-model="form.orderNum" controls-position="right" :min="0" style="width: 100%" />
          </el-form-item>

          <el-form-item label="菜单名称" prop="menuName">
            <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
          </el-form-item>

          <el-form-item v-if="form.menuType == 'C'" label="路由名称" prop="routeName">
            <el-input v-model="form.routeName" placeholder="请输入路由名称" />
          </el-form-item>

          <el-form-item v-if="form.menuType != 'F'" label="是否外链">
            <el-switch v-model="form.isFrame" style="--el-switch-on-color: #31aba0" active-value="0" inactive-value="1" />
          </el-form-item>

          <el-form-item v-if="form.menuType != 'F'" label="路由地址" prop="path">
            <el-input v-model="form.path" placeholder="请输入路由地址" />
          </el-form-item>

          <el-form-item v-if="form.menuType == 'C'" label="组件路径" prop="component">
            <el-input v-model="form.component" placeholder="请输入组件路径" />
          </el-form-item>

          <el-form-item v-if="form.menuType != 'M'" label="权限字符" prop="perms">
            <el-input v-model="form.perms" placeholder="请输入权限标识" maxlength="100" />
          </el-form-item>

          <el-form-item v-if="form.menuType == 'C'" label="路由参数" prop="query">
            <el-input v-model="form.query" placeholder="请输入路由参数" maxlength="255" />
          </el-form-item>

          <el-form-item v-if="form.menuType == 'C'" label="是否缓存">
            <el-switch v-model="form.isCache" style="--el-switch-on-color: #31aba0" active-value="0" inactive-value="1" />
          </el-form-item>

          <el-form-item v-if="form.menuType != 'F'" label="显示状态">
            <el-switch v-model="form.visible" style="--el-switch-on-color: #31aba0" active-value="0" inactive-value="1" />
          </el-form-item>

          <el-form-item label="菜单状态">
            <el-switch v-model="form.status" style="--el-switch-on-color: #31aba0" active-value="0" inactive-value="1" />
          </el-form-item>
        </div>
      </el-form>

      <template #prefixFooter>
        <div class="menu-dialog-footer">
          <button type="button" class="menu-dialog-submit" @click="submitForm">
            确认{{ form.menuId ? '修改' : '新增' }}
          </button>
        </div>
      </template>
    </KJSCDialogV2>
  </section>
</template>

<script setup lang="ts" name="Menu">
import { addMenu, delMenu, getMenu, listMenu, updateMenu, updateMenuSort } from '@/api/system/menu'
import IconSelect from '@/components/IconSelect/index.vue'
import type { SysMenu, MenuQueryParams } from '@/types/api/system/menu'
import { nextTick } from 'vue'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const menuList = ref<any[]>([])
const menuTableRef = ref()
const open = ref<boolean>(false)
const loading = ref<boolean>(true)
const title = ref<string>('')
const menuOptions = ref<any[]>([])
const isExpandAll = ref<boolean>(false)
const refreshTable = ref<boolean>(true)
const iconSelectRef = ref<any | null>(null)
const originalOrders = ref<Record<number, number>>({})

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
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listMenu(queryParams.value).then(response => {
    menuList.value = proxy.handleTree(response.data, 'menuId')
    recordOriginalOrders(menuList.value)
    loading.value = false
    nextTick(() => {
      menuTableRef.value?.doLayout()
    })
  })
}

function getTreeselect() {
  menuOptions.value = []
  listMenu().then(response => {
    const menu = { menuId: 0, menuName: '主类目', children: [] }
    menu.children = proxy.handleTree(response.data, 'menuId')
    menuOptions.value.push(menu)
  })
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
  }
  proxy.resetForm('menuRef')
}

function showSelectIcon() {
  iconSelectRef.value?.reset()
}

function selected(name: string) {
  form.value.icon = name
}

function handleQuery() {
  getList()
}

function resetQuery() {
  queryParams.value.menuName = undefined
  queryParams.value.status = undefined
  handleQuery()
}

function handleAdd(row?: SysMenu) {
  reset()
  getTreeselect()
  if (row != null && row.menuId) {
    form.value.parentId = row.menuId
  } else {
    form.value.parentId = 0
  }
  open.value = true
  title.value = '添加菜单'
}

function toggleExpandAll() {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => {
    refreshTable.value = true
    nextTick(() => {
      menuTableRef.value?.doLayout()
    })
  })
}

async function handleUpdate(row: SysMenu) {
  reset()
  await getTreeselect()
  getMenu(row.menuId!).then(response => {
    form.value = response.data!
    open.value = true
    title.value = '修改菜单'
  })
}

function handleStatusChange(row: SysMenu) {
  const text = row.status === '0' ? '启用' : '停用'
  proxy.$modal
    .confirm('确认要"' + text + '""' + row.menuName + '"菜单吗?')
    .then(() => updateMenu(row))
    .then(() => {
      proxy.$modal.msgSuccess(text + '成功')
    })
    .catch(() => {
      row.status = row.status === '0' ? '1' : '0'
    })
}

function submitForm() {
  proxy.$refs['menuRef'].validate((valid: boolean) => {
    if (valid) {
      if (form.value.menuId != undefined) {
        updateMenu(form.value).then(() => {
          proxy.$modal.msgSuccess('修改成功')
          open.value = false
          getList()
        })
      } else {
        addMenu(form.value).then(() => {
          proxy.$modal.msgSuccess('新增成功')
          open.value = false
          getList()
        })
      }
    }
  })
}

function recordOriginalOrders(list: SysMenu[]) {
  list.forEach(item => {
    originalOrders.value[item.menuId!] = item.orderNum!
    if (item.children && item.children.length) {
      recordOriginalOrders(item.children)
    }
  })
}

function handleSaveSort() {
  const changedMenuIds: number[] = []
  const changedOrderNums: number[] = []
  const collectChanged = (list: SysMenu[]) => {
    list.forEach(item => {
      if (String(originalOrders.value[item.menuId!]) !== String(item.orderNum)) {
        changedMenuIds.push(item.menuId!)
        changedOrderNums.push(item.orderNum!)
      }
      if (item.children && item.children.length) {
        collectChanged(item.children)
      }
    })
  }
  collectChanged(menuList.value)
  if (changedMenuIds.length === 0) {
    proxy.$modal.msgWarning('未检测到排序修改')
    return
  }
  updateMenuSort({ menuIds: changedMenuIds.join(','), orderNums: changedOrderNums.join(',') }).then(() => {
    proxy.$modal.msgSuccess('排序保存成功')
    recordOriginalOrders(menuList.value)
  })
}

function handleDelete(row: SysMenu) {
  proxy.$modal
    .confirm('是否确认删除名称为"' + row.menuName + '"的数据项?')
    .then(function () {
      return delMenu(row.menuId!)
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
    })
    .catch(() => {})
}

getList()
</script>

<style scoped lang="scss">
.menu-manage-page {
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

.add-menu-btn {
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
    margin-right: 8px;
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

  &__status {
    width: 200px;
    flex: none;

    :deep(.el-select) {
      width: 100%;
    }

    :deep(.el-select__wrapper) {
      min-height: 36px;
      border-radius: 12px;
      box-shadow: 0 0 0 1px #e1e6ec inset !important;
    }
  }

  &__reset,
  &__save,
  &__toggle {
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
  &__reset {
    margin-left: 8px;
    margin-right: 8px;
  }

  &__save {
    margin-left: auto;
    margin-right: 8px;
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
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.92;
    }
  }
}

.menu-content-card {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 0 0 32px;
  border-radius: 24px;
  background: #ffffff;
  overflow: auto;
}

.table-wrap {
  min-height: 0;
  flex: 1;
}

.menu-name-text {
  margin-left: 6px;
}

.menu-icon-prefix {
  height: 16px;
  width: 16px;
}

.menu-table {
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

  :deep(.el-table__fixed-right),
  :deep(.el-table__fixed-right-patch) {
    background-color: transparent;
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
      overflow: visible;
      white-space: nowrap;
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
    }
  }
}

@media (max-width: 768px) {
  .menu-manage-page {
    padding: 16px;
    border-radius: 24px 0 0 0;
  }

  .menu-content-card {
    padding: 0 0 16px;
  }

  .search-bar {
    &__keyword,
    &__status {
      width: 100%;
      max-width: none;
    }

    &__save {
      margin-left: 0;
      width: 100%;
    }

    &__toggle {
      width: 100%;
    }
  }
}
</style>

<style lang="scss">
.menu-tree-select-popper.el-popper {
  margin-top: 0 !important;

  .el-popper__arrow {
    display: none;
  }
}

.menu-form-dialog.kjsc-dialog-v2 {
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
    max-height: 70vh;
    overflow-y: auto;
  }

  .el-dialog__footer {
    padding: 32px 32px 32px;
  }

  .menu-form {
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
    .el-select__wrapper {
      border-radius: 8px;
      box-shadow: 0 0 0 1px #e1e6ec inset !important;
      min-height: 40px;
    }

    .el-input-number {
      width: 100%;

      .el-input__wrapper {
        width: 100%;
      }
    }

    .el-input__inner {
      font-size: 14px;
      color: #2b2f33;

      &::placeholder {
        color: #a8abb2;
      }
    }
  }

  .menu-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 24px;
  }

  .menu-dialog-footer {
    display: flex;
    justify-content: flex-end;
  }

  .menu-dialog-submit {
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
