<template>
  <section>
    <page-name>
      <el-button type="primary" icon="Plus" v-hasPermi="['system:dict:add']" @click="handleAdd">
        {{ $t('page.system.dict.data.add', '新增字典数据') }}
      </el-button>
    </page-name>

    <page-content>
      <template #header>
        <div v-show="showSearch" class="search-bar">
          <el-select
            v-model="queryParams.dictType"
            style="width: 200px"
            :placeholder="$t('page.system.dict.data.search.dictNamePlaceholder', '请选择字典名称')"
          >
            <el-option v-for="item in typeOptions" :key="item.dictId" :label="item.dictName" :value="item.dictType" />
          </el-select>

          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.dictLabel"
              class="search-bar__input"
              :suffix-icon="'Search'"
              style="max-width: 300px"
              clearable
              :placeholder="$t('page.system.dict.data.search.dictLabelPlaceholder', '请输入字典标签')"
              @keyup.enter="handleQuery"
            />
          </div>

          <el-select
            v-model="queryParams.status"
            style="width: 150px"
            clearable
            :placeholder="$t('page.system.dict.data.search.statusPlaceholder', '数据状态')"
          >
            <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>

        <div class="action-toolbar">
          <el-button :disabled="single" v-hasPermi="['system:dict:edit']" @click="handleUpdate()">修改</el-button>
          <el-button :disabled="multiple" v-hasPermi="['system:dict:remove']" @click="handleDelete()">删除</el-button>
          <el-text>共选中 {{ ids.length }} 条</el-text>
          <el-button v-hasPermi="['system:dict:export']" @click="handleExport">导出</el-button>
          <el-button style="margin-left: auto" @click="handleClose">关闭</el-button>
          <!-- <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" /> -->
        </div>
      </template>

      <el-table ref="dictDataTableRef" v-loading="loading" :data="dataList" height="100%" @selection-change="handleSelectionChange">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column
          :label="$t('page.system.dict.data.table.dictCode', '字典编码')"
          prop="dictCode"
          :min-width="$dim('page.system.dict.data.table.dictCode', 100)"
          align="left"
        />
        <el-table-column
          :label="$t('page.system.dict.data.table.dictLabel', '字典标签')"
          prop="dictLabel"
          :min-width="$dim('page.system.dict.data.table.dictLabel', 140)"
          align="left"
        >
          <template #default="scope">
            <span v-if="(scope.row.listClass == '' || scope.row.listClass == 'default') && (scope.row.cssClass == '' || scope.row.cssClass == null)">
              {{ scope.row.dictLabel }}
            </span>
            <el-tag v-else :type="scope.row.listClass == 'primary' ? '' : scope.row.listClass" :class="scope.row.cssClass">
              {{ scope.row.dictLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.dict.data.table.dictValue', '字典键值')"
          prop="dictValue"
          :min-width="$dim('page.system.dict.data.table.dictValue', 120)"
          align="left"
        />
        <el-table-column
          :label="$t('page.system.dict.data.table.dictSort', '字典排序')"
          prop="dictSort"
          :min-width="$dim('page.system.dict.data.table.dictSort', 100)"
          align="left"
        />
        <el-table-column
          :label="$t('page.system.dict.data.table.status', '状态')"
          :min-width="$dim('page.system.dict.data.table.status', 100)"
          align="center"
        >
          <template #default="scope">
            <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.dict.data.table.remark', '备注')"
          prop="remark"
          :min-width="$dim('page.system.dict.data.table.remark', 160)"
          align="left"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.system.dict.data.table.createdAt', '创建时间')"
          prop="createTime"
          :min-width="$dim('page.system.dict.data.table.createdAt', 170)"
          align="left"
        >
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.dict.data.table.operation', '操作')"
          :min-width="$dim('page.system.dict.data.table.operation', 140)"
          align="left"
          fixed="right"
        >
          <template #default="scope">
            <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:dict:edit']">
              {{ $t('page.normal.edit', '编辑') }}
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
      :title="form.dictCode ? $t('page.system.dict.data.form.editTitle', '修改字典数据') : $t('page.system.dict.data.form.addTitle', '添加字典数据')"
      v-model="open"
      width="800px"
      append-to-body
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form ref="dataRef" :model="form" :rules="rules" label-position="top" hide-required-asterisk>
        <el-form-item :label="$t('page.system.dict.data.form.dictType', '字典类型')">
          <el-input v-model="form.dictType" disabled :placeholder="$t('page.system.dict.data.form.dictTypePlaceholder', '字典类型')" />
        </el-form-item>

        <div class="dict-form-grid">
          <el-form-item :label="$t('page.system.dict.data.form.dictLabel', '数据标签')" prop="dictLabel">
            <el-input v-model="form.dictLabel" :placeholder="$t('page.system.dict.data.form.dictLabelPlaceholder', '请输入数据标签')" />
          </el-form-item>
          <el-form-item :label="$t('page.system.dict.data.form.dictValue', '数据键值')" prop="dictValue">
            <el-input v-model="form.dictValue" :placeholder="$t('page.system.dict.data.form.dictValuePlaceholder', '请输入数据键值')" />
          </el-form-item>
          <el-form-item :label="$t('page.system.dict.data.form.cssClass', '样式属性')" prop="cssClass">
            <el-input v-model="form.cssClass" :placeholder="$t('page.system.dict.data.form.cssClassPlaceholder', '请输入样式属性')" />
          </el-form-item>
          <el-form-item :label="$t('page.system.dict.data.form.dictSort', '显示排序')" prop="dictSort">
            <el-input-number v-model="form.dictSort" controls-position="right" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item :label="$t('page.system.dict.data.form.listClass', '回显样式')" prop="listClass">
            <el-select
              v-model="form.listClass"
              :placeholder="$t('page.system.dict.data.form.listClassPlaceholder', '请选择回显样式')"
              style="width: 100%"
            >
              <el-option v-for="item in listClassOptions" :key="item.value" :label="item.label + '(' + item.value + ')'" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('page.system.dict.data.form.status', '状态')">
            <el-switch v-model="form.status" active-value="0" inactive-value="1" />
          </el-form-item>
        </div>

        <el-form-item :label="$t('page.system.dict.data.form.remark', '备注')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="4" :placeholder="$t('page.system.dict.data.form.remarkPlaceholder', '请输入备注')" />
        </el-form-item>
      </el-form>

      <template #prefixFooter>
        <el-button type="primary" @click="submitForm">
          {{ form.dictCode ? $t('page.system.dict.data.form.confirmEdit', '确认修改') : $t('page.system.dict.data.form.confirmAdd', '确认新增') }}
        </el-button>
      </template>
    </KJSCDialogV2>
  </section>
</template>

<script setup lang="ts" name="Data">
import useDictStore from '@/store/modules/dict';
import { optionselect as getDictOptionselect, getType } from '@/api/system/dict/type';
import { listData, getData, delData, addData, updateData } from '@/api/system/dict/data';
import type { SysDictData, SysDictType, DictDataQueryParams } from '@/types/api/system/dict';

interface ListClassOption {
  value: string;
  label: string;
}

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict('sys_normal_disable');
const route = useRoute();
const router = useRouter();

const pageIcon = computed(() => {
  const matchedRoute = router.getRoutes().find((item) => item.path === '/system/dict');
  return matchedRoute?.meta?.icon || '';
});

const dataList = ref<SysDictData[]>([]);
const dictDataTableRef = ref();
const open = ref<boolean>(false);
const loading = ref<boolean>(true);
const showSearch = ref<boolean>(true);
const ids = ref<number[]>([]);
const single = ref<boolean>(true);
const multiple = ref<boolean>(true);
const total = ref<number>(0);
const title = ref<string>('');
const defaultDictType = ref<string>('');
const typeOptions = ref<SysDictType[]>([]);

const listClassOptions = ref<ListClassOption[]>([
  { value: 'default', label: '默认' },
  { value: 'primary', label: '主要' },
  { value: 'success', label: '成功' },
  { value: 'info', label: '信息' },
  { value: 'warning', label: '警告' },
  { value: 'danger', label: '危险' }
]);

const data = reactive({
  form: {} as SysDictData,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    dictType: undefined,
    dictLabel: undefined,
    status: undefined
  } as DictDataQueryParams,
  rules: {
    dictLabel: [{ required: true, message: '数据标签不能为空', trigger: 'blur' }],
    dictValue: [{ required: true, message: '数据键值不能为空', trigger: 'blur' }],
    dictSort: [{ required: true, message: '数据顺序不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

function getTypes(dictId: number) {
  getType(dictId).then((response) => {
    queryParams.value.dictType = response.data!.dictType;
    defaultDictType.value = response.data!.dictType!;
    getList();
  });
}

function getTypeList() {
  getDictOptionselect().then((response) => {
    typeOptions.value = response.data;
  });
}

function getList() {
  loading.value = true;
  listData(queryParams.value).then((response) => {
    dataList.value = response.rows;
    total.value = response.total;
    loading.value = false;
    nextTick(() => {
      dictDataTableRef.value?.doLayout();
    });
  });
}

function reset() {
  form.value = {
    dictCode: undefined,
    dictLabel: undefined,
    dictValue: undefined,
    cssClass: undefined,
    listClass: 'default',
    dictSort: 0,
    status: '0',
    remark: undefined
  };
  proxy.resetForm('dataRef');
}

function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

function handleClose() {
  const obj = { path: '/system/dict' };
  proxy.$tab.closeOpenPage(obj);
}

function resetQuery() {
  queryParams.value.dictLabel = undefined;
  queryParams.value.status = undefined;
  queryParams.value.dictType = defaultDictType.value;
  handleQuery();
}

function handleAdd() {
  reset();
  open.value = true;
  title.value = '添加字典数据';
  form.value.dictType = queryParams.value.dictType;
}

function handleSelectionChange(selection: SysDictData[]) {
  ids.value = selection.map((item) => item.dictCode!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

function handleUpdate(row?: SysDictData) {
  reset();
  const dictCode = row?.dictCode || ids.value[0];
  getData(dictCode).then((response) => {
    form.value = response.data!;
    open.value = true;
    title.value = '修改字典数据';
  });
}

function handleStatusChange(row: SysDictData) {
  const text = row.status === '0' ? '启用' : '停用';
  proxy.$modal
    .confirm('确认要"' + text + '""' + row.dictLabel + '"字典数据吗?')
    .then(() => updateData(row))
    .then(() => {
      useDictStore().removeDict(queryParams.value.dictType!);
      proxy.$modal.msgSuccess(text + '成功');
    })
    .catch(() => {
      row.status = row.status === '0' ? '1' : '0';
    });
}

function submitForm() {
  proxy.$refs['dataRef'].validate((valid: boolean) => {
    if (valid) {
      if (form.value.dictCode != undefined) {
        updateData(form.value).then(() => {
          useDictStore().removeDict(queryParams.value.dictType!);
          proxy.$modal.msgSuccess('修改成功');
          open.value = false;
          getList();
        });
      } else {
        addData(form.value).then(() => {
          useDictStore().removeDict(queryParams.value.dictType!);
          proxy.$modal.msgSuccess('新增成功');
          open.value = false;
          getList();
        });
      }
    }
  });
}

function handleDelete(row?: SysDictData) {
  const dictCodes = row?.dictCode || ids.value;
  proxy.$modal
    .confirm('是否确认删除字典编码为"' + dictCodes + '"的数据项？')
    .then(function () {
      return delData(dictCodes);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess('删除成功');
      useDictStore().removeDict(queryParams.value.dictType!);
    })
    .catch(() => {});
}

function handleExport() {
  proxy.download(
    'system/dict/data/export',
    {
      ...queryParams.value
    },
    `dict_data_${new Date().getTime()}.xlsx`
  );
}

getTypes(route.params && Number(route.params.dictId));
getTypeList();
</script>

<style scoped lang="scss">
.dict-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}
</style>
