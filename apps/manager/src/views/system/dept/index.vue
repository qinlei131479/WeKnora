<template>
  <section>
    <page-name>
      <el-button type="primary" icon="Plus" v-hasPermi="['system:dept:add']" @click="handleAdd()">
        {{ $t('page.system.dept.add', '新增部门') }}
      </el-button>
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.deptName"
              class="search-bar__input"
              :suffix-icon="'Search'"
              clearable
              :placeholder="$t('page.system.dept.searchPlaceholder', '搜索部门名称...')"
              @keyup.enter="handleQuery"
            />
          </div>

          <el-select v-model="queryParams.status" style="width: 150px" clearable :placeholder="$t('page.system.dept.statusPlaceholder', '部门状态')">
            <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
          <el-button @click="toggleExpandAll" style="margin-left: auto">{{ $t('page.system.dept.expandCollapse', '展开/折叠') }}</el-button>
        </div>
      </template>

      <el-table
        v-if="refreshTable"
        ref="deptTableRef"
        v-loading="loading"
        :data="deptList"
        height="100%"
        row-key="deptId"
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column
          prop="deptName"
          :label="$t('page.system.dept.table.deptName', '部门名称')"
          :min-width="$dim('page.system.dept.table.deptName', 260)"
          align="left"
        />
        <el-table-column
          prop="orderNum"
          :label="$t('page.system.dept.table.orderNum', '排序')"
          :min-width="$dim('page.system.dept.table.orderNum', 120)"
          align="left"
        />
        <el-table-column
          prop="description"
          :label="$t('page.system.dept.table.description', '职责范围')"
          :min-width="$dim('page.system.dept.table.description', 220)"
          align="left"
          show-overflow-tooltip
        />
        <el-table-column
          prop="status"
          :label="$t('page.system.dept.table.status', '状态')"
          :min-width="$dim('page.system.dept.table.status', 100)"
          align="center"
        >
          <template #default="{ row }">
            <el-switch v-model="row.status" active-value="0" inactive-value="1" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.dept.table.createTime', '创建时间')"
          prop="createTime"
          :min-width="$dim('page.system.dept.table.createTime', 170)"
          align="left"
        >
          <template #default="{ row }">
            <span>{{ parseTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.dept.table.operation', '操作')"
          align="left"
          :min-width="$dim('page.system.dept.table.operation', 200)"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button link type="primary" @click="handleUpdate(row)" v-hasPermi="['system:dept:edit']">
              {{ $t('page.normal.edit', '编辑') }}
            </el-button>
            <el-button link type="primary" @click="handleAdd(row)" v-hasPermi="['system:dept:add']">
              {{ $t('page.normal.add', '新增') }}
            </el-button>
            <el-button v-if="row.parentId != 0" link type="danger" @click="handleDelete(row)" v-hasPermi="['system:dept:remove']">
              {{ $t('page.normal.remove', '删除') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </page-content>

    <KJSCDialogV2
      :title="form.deptId ? $t('page.system.dept.form.editTitle', '修改部门') : $t('page.system.dept.form.addTitle', '添加部门')"
      v-model="open"
      width="800px"
      append-to-body
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form ref="deptRef" :model="form" :rules="rules" label-position="top" hide-required-asterisk>
        <el-form-item v-if="form.parentId !== 0" :label="$t('page.system.dept.form.parentDept', '上级部门')" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="deptOptions"
            :props="{ value: 'deptId', label: 'deptName', children: 'children' }"
            value-key="deptId"
            :placeholder="$t('page.system.dept.form.parentDeptPlaceholder', '请选择上级部门')"
            check-strictly
            :offset="0"
            :teleported="true"
            popper-class="dept-tree-select-popper"
            style="width: 100%; margin-bottom: 5px"
          />
        </el-form-item>

        <div class="dept-form-grid">
          <el-form-item :label="$t('page.system.dept.form.deptName', '部门名称')" prop="deptName">
            <el-input v-model="form.deptName" :placeholder="$t('page.system.dept.form.deptNamePlaceholder', '请输入部门名称')" />
          </el-form-item>
          <el-form-item :label="$t('page.system.dept.form.orderNum', '显示排序')" prop="orderNum">
            <el-input-number v-model="form.orderNum" controls-position="right" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item :label="$t('page.system.dept.form.leader', '负责人')" prop="leader">
            <el-input v-model="form.leader" :placeholder="$t('page.system.dept.form.leaderPlaceholder', '请输入负责人')" maxlength="20" />
          </el-form-item>
          <el-form-item :label="$t('page.system.dept.form.phone', '联系电话')" prop="phone">
            <el-input v-model="form.phone" :placeholder="$t('page.system.dept.form.phonePlaceholder', '请输入联系电话')" maxlength="11" />
          </el-form-item>
          <el-form-item :label="$t('page.system.dept.form.email', '邮箱')" prop="email">
            <el-input v-model="form.email" :placeholder="$t('page.system.dept.form.emailPlaceholder', '请输入邮箱地址')" maxlength="50" />
          </el-form-item>
          <el-form-item :label="$t('page.system.dept.form.status', '部门状态')">
            <el-switch v-model="form.status" active-value="0" inactive-value="1" />
          </el-form-item>
        </div>

        <el-form-item :label="$t('page.system.dept.form.description', '职责范围')" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            :placeholder="$t('page.system.dept.form.descriptionPlaceholder', '请输入职责范围')"
          />
        </el-form-item>
      </el-form>

      <template #prefixFooter>
        <el-button type="primary" @click="submitForm">
          {{ form.deptId ? $t('page.system.dept.form.confirmEdit', '确认修改') : $t('page.system.dept.form.confirmAdd', '确认新增') }}
        </el-button>
      </template>
    </KJSCDialogV2>
  </section>
</template>

<script setup lang="ts" name="Dept">
import { listDept, getDept, delDept, addDept, updateDept, updateDeptSort, listDeptExcludeChild } from '@/api/system/dept';
import type { SysDept, DeptQueryParams } from '@/types/api/system/dept';
import type { TreeSelect } from '@/types/api/common';

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict('sys_normal_disable');

const deptList = ref<any[]>([]);
const deptTableRef = ref();
const open = ref<boolean>(false);
const loading = ref<boolean>(true);
const title = ref<string>('');
const deptOptions = ref<TreeSelect[]>([]);
const isExpandAll = ref<boolean>(true);
const refreshTable = ref<boolean>(true);
const originalOrders = ref<Record<number, number>>({});

const data = reactive({
  form: {} as SysDept,
  queryParams: {
    deptName: undefined,
    status: undefined
  } as DeptQueryParams,
  rules: {
    parentId: [{ required: true, message: '上级部门不能为空', trigger: 'blur' }],
    deptName: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
    orderNum: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
    email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
    phone: [{ pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: '请输入正确的手机号码', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

function getList() {
  loading.value = true;
  listDept(queryParams.value).then((response) => {
    deptList.value = proxy.handleTree(response.data, 'deptId');
    recordOriginalOrders(deptList.value);
    loading.value = false;
    nextTick(() => {
      deptTableRef.value?.doLayout();
    });
  });
}

function reset() {
  form.value = {
    deptId: undefined,
    parentId: undefined,
    deptName: undefined,
    orderNum: 0,
    leader: undefined,
    phone: undefined,
    email: undefined,
    status: '0',
    description: undefined
  };
  proxy.resetForm('deptRef');
}

function handleQuery() {
  getList();
}

function resetQuery() {
  queryParams.value.deptName = undefined;
  queryParams.value.status = undefined;
  handleQuery();
}

function handleAdd(row?: SysDept) {
  reset();
  listDept().then((response) => {
    deptOptions.value = proxy.handleTree(response.data, 'deptId');
  });
  if (row != undefined) {
    form.value.parentId = row.deptId;
  }
  open.value = true;
  title.value = '添加部门';
}

function toggleExpandAll() {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
    nextTick(() => {
      deptTableRef.value?.doLayout();
    });
  });
}

function handleUpdate(row: SysDept) {
  reset();
  listDeptExcludeChild(row.deptId!).then((response) => {
    deptOptions.value = proxy.handleTree(response.data, 'deptId');
  });
  getDept(row.deptId!).then((response) => {
    form.value = response.data!;
    open.value = true;
    title.value = '修改部门';
  });
}

function handleStatusChange(row: SysDept) {
  const text = row.status === '0' ? '启用' : '停用';
  proxy.$modal
    .confirm('确认要"' + text + '""' + row.deptName + '"部门吗?')
    .then(() => updateDept(row))
    .then(() => {
      proxy.$modal.msgSuccess(text + '成功');
    })
    .catch(() => {
      row.status = row.status === '0' ? '1' : '0';
    });
}

function submitForm() {
  proxy.$refs['deptRef'].validate((valid: boolean) => {
    if (valid) {
      if (form.value.deptId != undefined) {
        updateDept(form.value).then(() => {
          proxy.$modal.msgSuccess('修改成功');
          open.value = false;
          getList();
        });
      } else {
        addDept(form.value).then(() => {
          proxy.$modal.msgSuccess('新增成功');
          open.value = false;
          getList();
        });
      }
    }
  });
}

function recordOriginalOrders(list: SysDept[]) {
  list.forEach((item) => {
    originalOrders.value[item.deptId] = item.orderNum;
    if (item.children && item.children.length) {
      recordOriginalOrders(item.children);
    }
  });
}

function handleDelete(row: SysDept) {
  proxy.$modal
    .confirm('是否确认删除名称为"' + row.deptName + '"的数据项?')
    .then(function () {
      return delDept(row.deptId!);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess('删除成功');
    })
    .catch(() => {});
}

getList();
</script>

<style lang="scss" scoped>
.dept-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}
</style>
