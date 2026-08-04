<template>
  <my-page class="my-page">
    <section class="datasource-repo-page">
      <page-name class="page-name">
        <template #subtitle>
          管理底座支持的数据源，包含物理数据库、API、消息中间件等，为您的AI智能体编排与执行引擎匹配底层的分析实体元数据。
        </template>
        <btn type="success" :icon="Plus" @click="goCreate">绑定物理数据源</btn>
      </page-name>

      <div class="page-body">
        <tree-category v-model="dto.categoryId" :categories="categories" @select="handleCategorySelect" />

        <main class="content-panel">
          <page-search-form>
            <template #main>
              <el-form-item class="datasource-search-input">
                <el-input v-model="searchTerm" :suffix-icon="Search" clearable placeholder="搜索数据源连接名/Host主机网关..." />
              </el-form-item>
            </template>
            <template #right>
              <el-form-item label="连通性健康">
                <radio-group v-model="filterConnectivity">
                  <el-radio-button v-for="option in connectivityOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </el-radio-button>
                </radio-group>
              </el-form-item>

              <el-form-item label="连接使用率">
                <radio-group v-model="usageRate">
                  <el-radio-button v-for="option in usageRateOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </el-radio-button>
                </radio-group>
              </el-form-item>
            </template>
          </page-search-form>

          <div v-loading="loading" class="source-scroll" :class="{ 'is-empty': filteredDataSources.length === 0 }">
            <empty-cell
              v-if="filteredDataSources.length === 0"
              :image="emptyImage"
              description="在这个过滤器边界下，暂无符合条件的数据源"
            />

            <div v-else class="source-grid">
              <DataSourceCard
                v-for="source in filteredDataSources"
                :key="source.id"
                :source="source"
                :category-label="getCategoryLabel(source.categoryId)"
                :testing="testingId === source.id"
                :schema-loading="schemaLoadingId === source.id"
                :keyword="highlightKeyword"
                :active="getCallCount(source.id) >= ACTIVE_THRESHOLD"
                @edit="handleEdit"
                @test="handleTest"
                @schema="handleSchema"
                @delete="handleDelete"
              />
            </div>
          </div>
        </main>
      </div>
    </section>

    <TableConfigDialog v-model="tableConfigVisible" :source="tableConfigSource" @refresh="apiDatasourceList" />
  </my-page>
</template>

<script setup lang="ts">
import { Plus, Search } from 'lucide-vue-next';
import { ElMessage, ElMessageBox } from 'element-plus';
import { agiDatasource } from '@/api/dataservices/datasource';
import { agiCategory } from '@/api/settings/category';
import emptyImage from '@/assets/icons/svg/robot.svg';
import type { CategoryVO, DatasourceCallLogVO, DatasourcePageDTO, DatasourceVO, PageDomain } from '@/types';
import DataSourceCard from './components/DataSourceCard.vue';
import TableConfigDialog from './components/TableConfigDialog.vue';
import type { TField } from './types';

const ALL_OPTION_ID = -9999;
const ACTIVE_THRESHOLD = 10;

type DatasourceFilterValue = 0 | 1 | typeof ALL_OPTION_ID;

const connectivityOptions: { label: string; value: DatasourceFilterValue }[] = [
  { label: '全部', value: ALL_OPTION_ID },
  { label: '正常', value: 0 },
  { label: '异常', value: 1 }
];

const usageRateOptions: { label: string; value: DatasourceFilterValue }[] = [
  { label: '全部', value: ALL_OPTION_ID },
  { label: '活跃', value: 1 },
  { label: '空闲', value: 0 }
];

const PAGE: PageDomain = {
  pageNum: 1,
  pageSize: 9999,
  orderByColumn: 'id',
  isAsc: 'asc'
};

const searchTerm = ref('');
const filterConnectivity = ref<DatasourceFilterValue>(ALL_OPTION_ID);
const usageRate = ref<DatasourceFilterValue>(ALL_OPTION_ID);
const dto = reactive<DatasourcePageDTO>({
  keyword: '',
  categoryId: ALL_OPTION_ID,
  categoryIdPath: '',
  dsType: undefined,
  status: undefined
});
const categories = ref<CategoryVO[]>([]);
const dataSources = ref<DatasourceVO[]>([]);
const callLogs = ref<DatasourceCallLogVO[]>([]);
const loading = ref(false);
const testingId = ref<number>();
const schemaLoadingId = ref<number>();
const tableConfigVisible = ref(false);
const tableConfigSource = ref<DatasourceVO>();
const highlightKeyword = ref('');
const router = useRouter();

const callCountMap = computed(() => new Map(callLogs.value.map((item: DatasourceCallLogVO) => [item.id, item.count])));
const getCallCount = (id?: number) => (id ? callCountMap.value.get(id) || 0 : 0);
const filteredDataSources = computed(() => {
  return dataSources.value.filter((source: DatasourceVO) => {
    const connectivityMatched = filterConnectivity.value === ALL_OPTION_ID || source.status === filterConnectivity.value;
    if (!connectivityMatched) return false;
    if (usageRate.value === ALL_OPTION_ID) return true;

    const active = getCallCount(source.id) >= ACTIVE_THRESHOLD;
    return usageRate.value === 1 ? active : !active;
  });
});

const apiDatasourceList = () => {
  loading.value = true;
  const currentKeyword = dto.keyword || '';
  const params: DatasourcePageDTO = {
    ...dto,
    categoryId: dto.categoryId === ALL_OPTION_ID ? undefined : dto.categoryId
  };
  agiDatasource
    .list(params, PAGE)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      dataSources.value = res.rows || [];
      highlightKeyword.value = currentKeyword;
    })
    .catch((err) => {
      console.error('--> --> 获取数据源列表失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取数据源列表失败');
      dataSources.value = [];
    })
    .finally(() => {
      loading.value = false;
    });
};

const apiCategoryTree = () => {
  agiCategory
    .tree()
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      categories.value = res.data || [];
    })
    .catch((err) => {
      console.error('--> --> 获取数据源分类失败', err);
      categories.value = [];
    });
};

const apiCountLastMonth = () => {
  agiDatasource
    .countLastMonth()
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      callLogs.value = res.data || [];
    })
    .catch((err) => {
      console.error('--> --> 获取数据源访问统计失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取数据源访问统计失败');
      callLogs.value = [];
    });
};

const applyFilters = () => {
  dto.keyword = searchTerm.value.trim();
  dto.status = undefined;
  dto.dsType = undefined;
  apiDatasourceList();
};

let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch(searchTerm, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 300);
});

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

const handleCategorySelect = (category?: CategoryVO) => {
  dto.categoryId = category?.id ?? ALL_OPTION_ID;
  dto.categoryIdPath = category?.idPath ?? '';
  apiDatasourceList();
};

const findCategory = (items: CategoryVO[], id?: number): CategoryVO | undefined => {
  if (!id) return undefined;
  for (const item of items) {
    if (item.id === id) return item;
    const child = item.childrenList ? findCategory(item.childrenList, id) : undefined;
    if (child) return child;
  }
  return undefined;
};

const getCategoryLabel = (id?: number) => findCategory(categories.value, id)?.name || '公共领域';

const handleEdit = (source: DatasourceVO) => {
  if (!source.id) return;
  router.push({
    path: '/dataservices/datasources/edit',
    state: {
      datasource: { ...source } as any
    }
  });
};

const handleTest = (source: DatasourceVO) => {
  if (!source.id) return;
  testingId.value = source.id;
  agiDatasource
    .ping(source.id)
    .then((res) => {
      if (res.code !== 200 || res.data?.status !== 0) {
        return Promise.reject(res.msg);
      }
      ElMessage.success('数据源连通性正常');
    })
    .catch((err) => {
      console.error('--> --> 测试数据源连接失败', err);
      ElMessage.closeAll();
      ElMessage.warning('测试数据源连接失败');
    })
    .finally(() => {
      testingId.value = undefined;
      apiDatasourceList();
    });
};

const handleSchema = (source: DatasourceVO) => {
  if (!source.id) return;
  let connectionPassed = false;
  schemaLoadingId.value = source.id;
  agiDatasource
    .ping(source.id)
    .then((res) => {
      if (res.code !== 200 || res.data?.status !== 0) {
        return Promise.reject(res.msg);
      }
      connectionPassed = true;
      return agiDatasource.single(source.id as number);
    })
    .then((res) => {
      if (res.code !== 200 || !res.data) {
        return Promise.reject(res.msg);
      }
      tableConfigSource.value = {
        ...res.data,
        tables: (res.data.tables || []).map((table) => ({
          ...table,
          columns: (table.fields || []).map((field: any): TField => ({
            name: field.fieldName,
            type: field.fieldType,
            nullable: field.nullable,
            index: field.keyType,
            description: !!field.customComment ? field.customComment : field.fieldComment
          }))
        }))
      } as any;
      tableConfigVisible.value = true;
      apiDatasourceList();
    })
    .catch((err) => {
      console.error('--> --> 打开表配置与描述失败', err);
      ElMessage.closeAll();
      ElMessage.warning(connectionPassed ? '获取数据源详情失败' : '数据源连接测试失败');
    })
    .finally(() => {
      schemaLoadingId.value = undefined;
    });
};

const handleDelete = (source: DatasourceVO) => {
  if (!source.id) return;
  const id = source.id;
  ElMessageBox.confirm(`确定删除数据源「${source.name}」吗？删除后不可恢复。`, '删除确认', {
    type: 'warning'
  })
    .then(() => agiDatasource.deleteById(id))
    .then((res: any) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success('数据源已移除');
      apiDatasourceList();
    })
    .catch((err: any) => {
      if (err === 'cancel' || err === 'close') return;
      console.error('--> --> 删除数据源失败', err);
      ElMessage.closeAll();
      ElMessage.warning('删除数据源失败');
    });
};

const goCreate = () => {
  router.push({
    path: '/dataservices/datasources/add',
    state: {
      datasource: {
        ...(dto.categoryId !== ALL_OPTION_ID ? { categoryId: dto.categoryId } : {})
      }
    }
  });
};

onMounted(() => {
  apiCategoryTree();
  searchTerm.value = '';
  filterConnectivity.value = ALL_OPTION_ID;
  usageRate.value = ALL_OPTION_ID;
  dto.keyword = '';
  dto.categoryId = ALL_OPTION_ID;
  dto.categoryIdPath = '';
  dto.dsType = undefined;
  dto.status = undefined;
  apiCountLastMonth();
  apiDatasourceList();
});
</script>

<style lang="scss" scoped>
.my-page {
  background-image: url(@/assets/images/dataservices/bg-datasource.png);
  background-position: right bottom;
  background-repeat: no-repeat;
  background-size: 100%;

  .page-name {
    margin-bottom: 20px;
  }
}

.datasource-search-input.el-form-item {
  min-width: 200px;
  max-width: 420px;
  flex: 1 1 200px;

  :deep(.el-form-item__content),
  :deep(.el-input) {
    width: 100%;
    min-width: 0;
  }
}

.datasource-repo-page {
  display: flex;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  background: transparent;
  overflow: hidden;

  .page-body {
    display: flex;
    min-height: 0;
    flex: 1;
    gap: 20px;
    overflow: hidden;
  }

  .content-panel {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }

  .source {
    &-scroll {
      min-height: 0;
      margin-top: 20px;
      flex: 1 1 0;
      overflow-y: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      &.is-empty {
        display: flex;
        align-items: flex-start;
        justify-content: center;
      }
    }

    &-grid {
      display: grid;
      width: 100%;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      align-items: start;
    }
  }
}


@media (max-width: 992px) {
  .datasource-repo-page {
    .page-body {
      flex-direction: column;
    }

    .content-panel {
      width: 100%;
    }

    .source-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
