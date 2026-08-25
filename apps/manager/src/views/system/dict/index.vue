<template>
  <section>
    <page-name>
      <el-button type="primary" icon="Plus" v-hasPermi="['system:dict:add']" @click="handleAdd">
        {{ $t('page.system.dict.add', '新增字典') }}
      </el-button>
    </page-name>

    <page-content>
      <template #header>
        <div v-show="showSearch" class="search-bar">
          <div class="search-bar__keywords">
            <el-input
              v-model="queryParams.dictName"
              class="search-bar__input"
              :suffix-icon="'Search'"
              style="max-width: 300px"
              clearable
              :placeholder="$t('page.system.dict.search.namePlaceholder', '请输入字典名称')"
              @keyup.enter="handleQuery"
            />
          </div>
          <div class="search-bar__keywords">
            <el-input
              v-model="queryParams.dictType"
              class="search-bar__input"
              style="max-width: 300px"
              :suffix-icon="'Search'"
              clearable
              :placeholder="$t('page.system.dict.search.typePlaceholder', '请输入字典类型')"
              @keyup.enter="handleQuery"
            />
          </div>

          <el-select
            v-model="queryParams.status"
            style="width: 150px"
            clearable
            :placeholder="$t('page.system.dict.search.statusPlaceholder', '字典状态')"
          >
            <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>

          <el-date-picker
            v-model="dateRange"
            class="search-bar__date"
            value-format="YYYY-MM-DD"
            type="daterange"
            style="max-width: 250px"
            :range-separator="$t('page.system.dict.search.rangeSeparator', '至')"
            :start-placeholder="$t('page.system.dict.search.startTime', '开始时间')"
            :end-placeholder="$t('page.system.dict.search.endTime', '结束时间')"
          />

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>

        <div class="action-toolbar">
          <el-button :disabled="multiple" v-hasPermi="['system:dict:remove']" @click="handleDelete()">批量删除</el-button>
          <el-text>共选中 {{ ids.length }} 条</el-text>
          <el-button v-hasPermi="['system:dict:export']" @click="handleExport">导出</el-button>
          <el-button style="margin-left: auto" v-hasPermi="['system:dict:remove']" @click="handleRefreshCache">刷新缓存</el-button>
          <!--<right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />-->
        </div>
      </template>

      <el-table ref="dictTableRef" v-loading="loading" :data="typeList" height="100%" @selection-change="handleSelectionChange">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column type="selection" align="center" />
        <el-table-column
          :label="$t('page.system.dict.table.id', '字典编号')"
          prop="dictId"
          :min-width="$dim('page.system.dict.table.id', 100)"
          align="left"
        />
        <el-table-column
          :label="$t('page.system.dict.table.name', '字典名称')"
          prop="dictName"
          :min-width="$dim('page.system.dict.table.name', 160)"
          align="left"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.system.dict.table.type', '字典类型')"
          :min-width="$dim('page.system.dict.table.type', 180)"
          align="left"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <el-link type="primary" @click="handleViewData(scope.row)">{{ scope.row.dictType }}</el-link>
          </template>
        </el-table-column>
        <el-table-column :label="$t('page.system.dict.table.status', '状态')" :min-width="$dim('page.system.dict.table.status', 100)" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" active-value="0" inactive-value="1" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.dict.table.remark', '备注')"
          prop="remark"
          :min-width="$dim('page.system.dict.table.remark', 160)"
          align="left"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.system.dict.table.createdAt', '创建时间')"
          prop="createTime"
          :min-width="$dim('page.system.dict.table.createdAt', 170)"
          align="left"
        >
          <template #default="{ row }">
            <span>{{ parseTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.dict.table.operation', '操作')"
          :min-width="$dim('page.system.dict.table.operation', 200)"
          align="left"
          fixed="right"
        >
          <template #default="scope">
            <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:dict:edit']">
              {{ $t('page.normal.edit', '编辑') }}
            </el-button>
            <el-button link type="primary" @click="handleDataList(scope.row)" v-hasPermi="['system:dict:edit']">
              {{ $t('page.system.dict.list', '列表') }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermi="['system:dict:remove']">
              {{ $t('page.normal.remove', '删除') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </template>
    </page-content>

    <KJSCDialogV2
      :title="form.dictId ? $t('page.system.dict.form.editTitle', '修改字典类型') : $t('page.system.dict.form.addTitle', '添加字典类型')"
      v-model="open"
      width="800px"
      append-to-body
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form ref="dictRef" :model="form" :rules="rules" label-position="top" hide-required-asterisk>
        <el-form-item :label="$t('page.system.dict.form.name', '字典名称')" prop="dictName">
          <el-input v-model="form.dictName" :placeholder="$t('page.system.dict.form.namePlaceholder', '请输入字典名称')" />
        </el-form-item>
        <el-form-item :label="$t('page.system.dict.form.type', '字典类型')" prop="dictType">
          <el-input v-model="form.dictType" :placeholder="$t('page.system.dict.form.typePlaceholder', '请输入字典类型')" />
        </el-form-item>
        <el-form-item :label="$t('page.system.dict.form.status', '状态')">
          <el-switch v-model="form.status" active-value="0" inactive-value="1" />
        </el-form-item>
        <el-form-item :label="$t('page.system.dict.form.remark', '备注')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="4" :placeholder="$t('page.system.dict.form.remarkPlaceholder', '请输入备注')" />
        </el-form-item>
      </el-form>

      <template #prefixFooter>
        <el-button type="primary" @click="submitForm">
          {{ $t('page.system.dict.form.confirm', '确认')
          }}{{ form.dictId ? $t('page.system.dict.form.update', '修改') : $t('page.system.dict.form.add', '新增') }}
        </el-button>
      </template>
    </KJSCDialogV2>

    <dict-data-drawer v-model:visible="drawerVisible" :row="drawerRow" />
  </section>
</template>

<script setup lang="ts" name="Dict">
import DictDataDrawer from './detail.vue';
import useDictStore from '@/store/modules/dict';
import { listType, getType, delType, addType, updateType, refreshCache } from '@/api/system/dict/type';
import type { SysDictType, DictTypeQueryParams } from '@/types/api/system/dict';

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict('sys_normal_disable');

const typeList = ref<SysDictType[]>([]);
const dictTableRef = ref();
const open = ref<boolean>(false);
const loading = ref<boolean>(true);
const showSearch = ref<boolean>(true);
const ids = ref<number[]>([]);
const single = ref<boolean>(true);
const multiple = ref<boolean>(true);
const total = ref<number>(0);
const title = ref<string>('');
const dateRange = ref<string[]>([]);
const drawerVisible = ref<boolean>(false);
const drawerRow = ref<SysDictType>({} as SysDictType);

const data = reactive({
  form: {} as SysDictType,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    dictName: undefined,
    dictType: undefined,
    status: undefined
  } as DictTypeQueryParams,
  rules: {
    dictName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
    dictType: [{ required: true, message: '字典类型不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

function getList() {
  loading.value = true;
  listType(proxy.addDateRange(queryParams.value, dateRange.value)).then((response) => {
    typeList.value = response.rows;
    total.value = response.total;
    loading.value = false;
    nextTick(() => {
      dictTableRef.value?.doLayout();
    });
  });
}

function reset() {
  form.value = {
    dictId: undefined,
    dictName: undefined,
    dictType: undefined,
    status: '0',
    remark: undefined
  };
  proxy.resetForm('dictRef');
}

function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

function resetQuery() {
  dateRange.value = [];
  queryParams.value.dictName = undefined;
  queryParams.value.dictType = undefined;
  queryParams.value.status = undefined;
  handleQuery();
}

function handleAdd() {
  reset();
  open.value = true;
  title.value = '添加字典类型';
}

function handleSelectionChange(selection: SysDictType[]) {
  ids.value = selection.map((item) => item.dictId!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

function handleViewData(row: SysDictType) {
  drawerRow.value = row;
  drawerVisible.value = true;
}

function handleDataList(row: SysDictType) {
  proxy.$tab.openPage('字典数据', '/system/dict-data/index/' + row.dictId);
}

function handleUpdate(row?: SysDictType) {
  reset();
  const dictId = row?.dictId || ids.value[0];
  getType(dictId).then((response) => {
    form.value = response.data!;
    open.value = true;
    title.value = '修改字典类型';
  });
}

function handleStatusChange(row: SysDictType) {
  const text = row.status === '0' ? '启用' : '停用';
  proxy.$modal
    .confirm('确认要"' + text + '""' + row.dictName + '"字典吗?')
    .then(() => updateType(row))
    .then(() => {
      proxy.$modal.msgSuccess(text + '成功');
    })
    .catch(() => {
      row.status = row.status === '0' ? '1' : '0';
    });
}

function submitForm() {
  proxy.$refs['dictRef'].validate((valid: boolean) => {
    if (valid) {
      if (form.value.dictId != undefined) {
        updateType(form.value).then(() => {
          proxy.$modal.msgSuccess('修改成功');
          open.value = false;
          getList();
        });
      } else {
        addType(form.value).then(() => {
          proxy.$modal.msgSuccess('新增成功');
          open.value = false;
          getList();
        });
      }
    }
  });
}

function handleDelete(row?: SysDictType) {
  const dictIds = row?.dictId || ids.value;
  proxy.$modal
    .confirm('是否确认删除字典编号为"' + dictIds + '"的数据项？')
    .then(function () {
      return delType(dictIds);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess('删除成功');
    })
    .catch(() => {});
}

function handleExport() {
  proxy.download(
    'system/dict/type/export',
    {
      ...queryParams.value
    },
    `dict_${new Date().getTime()}.xlsx`
  );
}

function handleRefreshCache() {
  refreshCache().then(() => {
    proxy.$modal.msgSuccess('刷新成功');
    useDictStore().cleanDict();
  });
}

getList();
</script>
