<template>
  <el-card shadow="never" class="filter-panel">
    <el-form :model="form" inline class="filter-form">
      <el-form-item class="keyword-item">
        <el-input v-model="form.keyword" clearable placeholder="关键词：问题 / 回答 / 用户 / 部门 / 岗位...">
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="部门">
        <el-tree-select
          v-model="form.deptId"
          :data="departments"
          :props="{ label: 'deptName', value: 'deptId', children: 'children' }"
          check-strictly
          clearable
          filterable
          node-key="deptId"
          placeholder="请选择部门"
        />
      </el-form-item>

      <el-form-item label="岗位">
        <el-select v-model="form.postId" clearable filterable placeholder="请选择岗位">
          <el-option v-for="post in posts" :key="post.postId" :label="post.postName" :value="post.postId" />
        </el-select>
      </el-form-item>

      <el-form-item label="日期" class="date-item">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          unlink-panels
        />
      </el-form-item>

      <el-form-item class="action-item">
        <el-button type="primary" @click="handleSearch">
          <el-icon>
            <Search />
          </el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon>
            <Refresh />
          </el-icon>
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { listDept } from '@/api/system/dept';
import { listPost } from '@/api/system/post';

const emit = defineEmits<{
  search: [params: any];
}>();

const form = reactive({
  keyword: '',
  deptId: undefined,
  postId: undefined
});
const dateRange = ref<string[]>([]);
const departments = ref<any[]>([]);
const posts = ref<any[]>([]);

const loadDepartments = () => {
  listDept({ status: '0' })
    .then((res) => {
      const items = (res.data || []).map((item: any) => ({ ...item, children: [] }));
      const departmentMap = new Map(items.map((item: any) => [String(item.deptId), item]));
      const roots: any[] = [];

      items.forEach((item: any) => {
        const parent = departmentMap.get(String(item.parentId));
        if (parent && parent !== item) {
          parent.children.push(item);
          return;
        }
        roots.push(item);
      });

      departments.value = roots;
    })
    .catch((err: any) => {
      console.error('--> --> 获取部门列表失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取部门列表失败');
    });
};

const loadPosts = () => {
  listPost({
    pageNum: 1,
    pageSize: 9999,
    status: '0'
  })
    .then((res) => {
      posts.value = res.rows || [];
    })
    .catch((err: any) => {
      console.error('--> --> 获取岗位列表失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取岗位列表失败');
    });
};

const handleSearch = () => {
  emit('search', {
    keyword: form.keyword.trim(),
    deptId: form.deptId,
    postId: form.postId,
    start: dateRange.value?.[0],
    end: dateRange.value?.[1]
  });
};

const handleReset = () => {
  form.keyword = '';
  form.deptId = undefined;
  form.postId = undefined;
  dateRange.value = [];
  handleSearch();
};

onMounted(() => {
  loadDepartments();
  loadPosts();
});
</script>

<style scoped lang="less">
.filter-panel {
  margin-bottom: 16px;
  border-color: var(--el-border-color);
  border-radius: 8px;
  background: var(--color-slate-50);

  :deep(.el-card__body) {
    padding: 16px;
  }

  .filter-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;

    :deep(.el-form-item) {
      margin: 0;

      .el-form-item__label {
        padding-right: 8px;
        font-size: 12px;
        font-weight: 700;
      }
    }

    :deep(.el-select),
    :deep(.el-tree-select) {
      width: 200px;
    }

    .keyword-item {
      min-width: 260px;
      flex: 1 1 280px;

      :deep(.el-input) {
        width: 400px;
      }
    }

    .date-item {
      :deep(.el-date-editor) {
        width: 252px;
      }
    }

    .action-item {
      margin-left: auto;

      :deep(.el-button > span) {
        display: inline-flex;
        align-items: center;
        gap: 0.5em;
      }
    }
  }
}

@media (max-width: 992px) {
  .filter-panel {
    .filter-form {
      :deep(.el-form-item),
      :deep(.el-select),
      :deep(.el-tree-select),
      .keyword-item,
      .date-item {
        width: 100%;
      }

      .keyword-item {
        :deep(.el-input) {
          width: 100%;
        }
      }

      .date-item {
        :deep(.el-form-item__content),
        :deep(.el-date-editor) {
          width: 100%;
        }
      }

      .action-item {
        width: auto;
        margin-left: 0;
      }
    }
  }
}
</style>
