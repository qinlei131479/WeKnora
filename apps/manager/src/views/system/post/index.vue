<template>
  <section>
    <page-name>
      <el-button type="primary" icon="Plus" v-hasPermi="['system:post:add']" @click="handleAdd">
        {{ $t('page.system.post.add', '新增岗位') }}
      </el-button>
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.postCode"
              class="search-bar__input"
              :suffix-icon="'Search'"
              clearable
              :placeholder="$t('page.system.post.search.postCodePlaceholder', '请输入岗位编码')"
              @keyup.enter="handleQuery"
            />
          </div>

          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.postName"
              class="search-bar__input"
              :suffix-icon="'Search'"
              clearable
              :placeholder="$t('page.system.post.search.postNamePlaceholder', '请输入岗位名称')"
              @keyup.enter="handleQuery"
            />
          </div>

          <el-select
            v-model="queryParams.status"
            style="width: 150px"
            clearable
            :placeholder="$t('page.system.post.search.statusPlaceholder', '岗位状态')"
          >
            <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
          <el-button style="margin-left: auto" v-hasPermi="['system:post:export']" @click="handleExport">
            {{ $t('page.system.post.export', '导出') }}
          </el-button>
        </div>
      </template>

      <el-table ref="postTableRef" v-loading="loading" :data="postList" height="100%" @selection-change="handleSelectionChange">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column
          :label="$t('page.system.post.table.postId', '岗位编号')"
          prop="postId"
          :min-width="$dim('page.system.post.table.postId', 100)"
          align="left"
        />
        <el-table-column
          :label="$t('page.system.post.table.postCode', '岗位编码')"
          prop="postCode"
          :min-width="$dim('page.system.post.table.postCode', 140)"
          align="left"
          show-overflow-tooltip
        />
        <el-table-column
          :label="$t('page.system.post.table.postName', '岗位名称')"
          prop="postName"
          :min-width="$dim('page.system.post.table.postName', 160)"
          align="left"
          show-overflow-tooltip
        />
        <el-table-column
          :label="$t('page.system.post.table.postSort', '岗位排序')"
          prop="postSort"
          :min-width="$dim('page.system.post.table.postSort', 100)"
          align="left"
        />
        <el-table-column
          :label="$t('page.system.post.table.remark', '职责描述')"
          prop="remark"
          :min-width="$dim('page.system.post.table.remark', 200)"
          align="left"
          show-overflow-tooltip
        />
        <el-table-column :label="$t('page.system.post.table.status', '状态')" :min-width="$dim('page.system.post.table.status', 100)" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.post.table.createTime', '创建时间')"
          prop="createTime"
          :min-width="$dim('page.system.post.table.createTime', 170)"
          align="left"
        >
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          align="left"
          header-align="left"
          :min-width="$dim('page.system.post.table.operation', 140)"
          fixed="right"
        >
          <template #default="scope">
            <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:post:edit']">
              {{ $t('page.normal.edit', '编辑') }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermi="['system:post:remove']">
              {{ $t('page.normal.remove', '删除') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </template>
    </page-content>

    <KjscRtlDrawer
      :title="form.postId ? $t('page.system.post.form.editTitle', '修改岗位') : $t('page.system.post.form.addTitle', '添加岗位')"
      v-model="open"
      size="800px"
    >
      <el-form ref="postRef" :model="form" :rules="rules" label-position="top" hide-required-asterisk>
        <div class="post-form-grid">
          <el-form-item :label="$t('page.system.post.form.postName', '岗位名称')" prop="postName">
            <el-input v-model="form.postName" :placeholder="$t('page.system.post.form.postNamePlaceholder', '请输入岗位名称')" />
          </el-form-item>
          <el-form-item :label="$t('page.system.post.form.postCode', '岗位编码')" prop="postCode">
            <el-input v-model="form.postCode" :placeholder="$t('page.system.post.form.postCodePlaceholder', '请输入岗位编码')" />
          </el-form-item>
          <el-form-item :label="$t('page.system.post.form.postSort', '岗位顺序')" prop="postSort">
            <el-input-number v-model="form.postSort" controls-position="right" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item :label="$t('page.system.post.form.status', '岗位状态')">
            <el-switch v-model="form.status" active-value="0" inactive-value="1" />
          </el-form-item>
        </div>
        <el-form-item :label="$t('page.system.post.form.remark', '职责描述')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="4" :placeholder="$t('page.system.post.form.remarkPlaceholder', '请输入职责描述')" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button type="primary" @click="submitForm">
          {{ form.postId ? $t('page.system.post.form.confirmEdit', '确认修改') : $t('page.system.post.form.confirmAdd', '确认新增') }}
        </el-button>
      </template>
    </KjscRtlDrawer>
  </section>
</template>

<script setup lang="ts" name="Post">
import { t } from '@/i18n';
import type { FormInstance } from 'element-plus/es/components/form';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { download } from '@/utils/request';
import { listPost, addPost, delPost, getPost, updatePost } from '@/api/system/post';
import type { SysPost, PostQueryParams } from '@/types/api/system/post';

const { sys_normal_disable } = useDict('sys_normal_disable');

const postRef = ref<FormInstance>();
const postList = ref<SysPost[]>([]);
const postTableRef = ref();
const open = ref<boolean>(false);
const loading = ref<boolean>(true);
const ids = ref<number[]>([]);
const single = ref<boolean>(true);
const multiple = ref<boolean>(true);
const total = ref<number>(0);
const title = ref<string>('');

const data = reactive({
  form: {} as SysPost,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    postCode: undefined,
    postName: undefined,
    status: undefined
  } as PostQueryParams,
  rules: {
    postName: [{ required: true, get message() { return t('page.system.post.positionNameIsRequired', '岗位名称不能为空'); }, trigger: 'blur' }],
    postCode: [{ required: true, get message() { return t('page.system.post.positionCodeIsRequired', '岗位编码不能为空'); }, trigger: 'blur' }],
    postSort: [{ required: true, get message() { return t('page.system.post.positionOrderIsRequired', '岗位顺序不能为空'); }, trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

function getList() {
  loading.value = true;
  listPost(queryParams.value).then((response) => {
    postList.value = response.rows;
    total.value = response.total;
    loading.value = false;
    nextTick(() => {
      postTableRef.value?.doLayout();
    });
  });
}

function reset() {
  form.value = {
    postId: undefined,
    postCode: undefined,
    postName: undefined,
    postSort: 0,
    status: '0',
    remark: undefined
  };
  postRef.value?.resetFields();
}

function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

function resetQuery() {
  queryParams.value.postCode = undefined;
  queryParams.value.postName = undefined;
  queryParams.value.status = undefined;
  handleQuery();
}

function handleSelectionChange(selection: SysPost[]) {
  ids.value = selection.map((item) => item.postId!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

function handleAdd() {
  reset();
  open.value = true;
  title.value = t('page.system.post.addPosition', '添加岗位');
}

function handleUpdate(row?: SysPost) {
  reset();
  const postId = row?.postId || ids.value[0];
  getPost(postId).then((response) => {
    form.value = response.data!;
    open.value = true;
    title.value = t('page.system.post.form.editTitle', '修改岗位');
  });
}

function handleStatusChange(row: SysPost) {
  const text = row.status === '0' ? t('page.normal.enable', '启用') : t('page.normal.disable', '停用');
  modal
    .confirm(t('page.system.post.position', { value1: text, value2: row.postName }, '确认要"{value1}""{value2}"岗位吗?'))
    .then(() => updatePost(row))
    .then(() => {
      modal.msgSuccess(t('page.system.dept.successful', { value1: text }, '{value1}成功'));
    })
    .catch(() => {
      row.status = row.status === '0' ? '1' : '0';
    });
}

function submitForm() {
  postRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (form.value.postId != undefined) {
        updatePost(form.value).then(() => {
          modal.msgSuccess(t('page.normal.confirmInfo.updateSuccess', '修改成功'));
          open.value = false;
          getList();
        });
      } else {
        addPost(form.value).then(() => {
          modal.msgSuccess(t('page.normal.confirmInfo.addSuccess', '新增成功'));
          open.value = false;
          getList();
        });
      }
    }
  });
}

function handleDelete(row?: SysPost) {
  const postIds = row?.postId || ids.value;
  modal
    .confirm(t('page.system.post.deletePositionsWithIds', { value1: postIds }, '是否确认删除岗位编号为"{value1}"的数据项？'))
    .then(function () {
      return delPost(postIds);
    })
    .then(() => {
      getList();
      modal.msgSuccess(t('page.normal.confirmInfo.removeSuccess', '删除成功'));
    })
    .catch(() => {});
}

function handleExport() {
  download(
    'system/post/export',
    {
      ...queryParams.value
    },
    `post_${new Date().getTime()}.xlsx`
  );
}

getList();
</script>

<style lang="scss" scoped>
.post-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}
</style>
