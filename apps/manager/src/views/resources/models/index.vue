<template>
  <my-page class="my-page">
    <section class="model-repo-page">
      <page-name class="page-name">
        <btn type="success" :icon="Plus" @click="goCreateModel">注册新模型</btn>
      </page-name>

      <div class="page-body">
        <tree-category v-model="dto.categoryId" :categories="categories" @select="handleCategorySelect" />

        <main class="content-panel">
          <page-search-form>
            <template #main>
              <el-form-item class="model-search-input">
                <el-input v-model="searchTerm" :suffix-icon="Search" clearable placeholder="搜索模型名称或提供商..." />
              </el-form-item>
            </template>
            <template #right>
              <el-form-item label="模型状态">
                <radio-group v-model="filterStatus">
                  <el-radio-button v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </el-radio-button>
                </radio-group>
              </el-form-item>

              <el-form-item label="模型类别">
                <radio-group v-model="filterType">
                  <el-radio-button v-for="option in typeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </el-radio-button>
                </radio-group>
              </el-form-item>
            </template>
          </page-search-form>

          <div v-loading="loading" class="model-scroll" :class="{ 'is-empty': models.length === 0 }">
            <empty-cell v-if="models.length === 0" :image="emptyImage" description="在这个过滤器边界下，暂无符合注册的模型资产" />

            <div v-else class="model-grid">
              <ModelCard
                v-for="model in models"
                :key="model.id"
                :model="model"
                :category-label="getCategoryLabel(model.categoryId)"
                :keyword="dto.keyword"
                @edit="goEditModel"
                @delete="apiModelDelete"
                @status-change="apiModelStatus"
              />
            </div>
          </div>
        </main>
      </div>
    </section>
  </my-page>
</template>

<script setup lang="ts">
import { Plus, Search } from 'lucide-vue-next';
import { ElMessage, ElMessageBox } from 'element-plus';
import { agiCategory, agiModel } from '@/api/agi';
import type { CategoryVO, ModelPageDTO, ModelVO, PageDomain } from '@/types';
import ModelCard from './components/ModelCard.vue';
import emptyImage from '@/assets/icons/svg/robot.svg';

const ALL_OPTION_ID = -9999;

type ModelSearchParams = {
  keyword: string;
  status: 0 | 1 | 2 | typeof ALL_OPTION_ID;
  modelType: 1 | 2 | 3 | typeof ALL_OPTION_ID;
  categoryId: number;
};

const statusOptions: { label: string; value: ModelSearchParams['status'] }[] = [
  { label: '全部', value: ALL_OPTION_ID },
  // { label: '部署中', value: 0 },
  { label: '已上线', value: 1 },
  { label: '已下线', value: 2 }
];

const typeOptions: { label: string; value: ModelSearchParams['modelType'] }[] = [
  { label: '全部', value: ALL_OPTION_ID },
  { label: '大语言', value: 1 },
  { label: '向量模型', value: 2 },
  { label: '排序模型', value: 3 }
];

const searchTerm = ref('');
const filterStatus = ref<ModelSearchParams['status']>(ALL_OPTION_ID);
const filterType = ref<ModelSearchParams['modelType']>(ALL_OPTION_ID);

const dto = reactive<ModelPageDTO>({
  keyword: '',
  status: undefined,
  modelType: undefined,
  categoryId: ALL_OPTION_ID,
  categoryIdPath: ''
});
const categories = ref<CategoryVO[]>([]);
const models = ref<ModelVO[]>([]);
const loading = ref(false);
const router = useRouter();

// API 获取分类树
const apiCategortTree = () => {
  agiCategory
    .tree()
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      categories.value = res.data || [];
    })
    .catch((err) => {
      console.error('--> --> 获取模型分类失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取模型分类失败');
    });
};

// API 获取模型列表
const apiModelList = () => {
  loading.value = true;

  const params: ModelPageDTO = {
    ...dto,
    categoryId: dto.categoryId === ALL_OPTION_ID ? undefined : dto.categoryId
  };
  const pg: PageDomain = {
    pageNum: 1,
    pageSize: 9999,
    orderByColumn: 'id',
    isAsc: 'asc'
  };

  agiModel
    .list(params, pg)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      models.value = res.rows || [];
    })
    .catch((err) => {
      console.error('--> --> 获取模型列表失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取模型列表失败');
      models.value = [];
    })
    .finally(() => {
      loading.value = false;
    });
};

// API 模型状态变更 Online/Offline
const apiModelStatus = (id: number, status: 1 | 2) => {
  agiModel
    .status(id, status)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success(status === 1 ? '模型已上线' : '模型已下线');
      apiModelList();
    })
    .catch((err) => {
      const errorMessage = String(err).replace(/^Error:\s*/, '');
      if (status === 2) {
        let bindInfo;
        try {
          bindInfo = JSON.parse(errorMessage);
        } catch {
          bindInfo = undefined;
        }
        if (bindInfo?.type === 'bind') {
          const names = Array.isArray(bindInfo.names) ? bindInfo.names.map((name: string) => `「${name}」`).join('、') : '';
          ElMessage.closeAll();
          return ElMessageBox.confirm(
            `<span style="color: red;"><p>该模型当前已绑定<strong>${bindInfo.size || 0}</strong>个智能体大脑（${names}），下线后将导致上述智能体的对应功能<strong>即刻不可用</strong>。</p>
            <p><strong>建议操作路径：</strong> 前往“智能体大脑”页面解除与该模型的绑定关系后，再执行下线。</p>
            <p><strong>若确认强制下线：</strong> 关联智能体的对应功能将<strong>停止运行</strong>，确定要强制下线吗？</p>
            <p>（重新上线后，会恢复原有的绑定关系，无需再次绑定）</p></span>`,
            '模型下线失败',
            {
              type: 'error',
              customStyle: {
                width: 'auto',
                maxWidth: 'calc(100vw - 64px)',
                minWidth: '500px'
              },
              confirmButtonText: '强制下线',
              cancelButtonText: '取消',
              dangerouslyUseHTMLString: true
            }
          )
            .then(() => {
              apiModelOfflineForce(id);
              return true;
            })
            .catch(() => true);
        }
      }
      console.error('--> --> 更新模型状态失败', err);
      ElMessage.closeAll();
      ElMessage.warning('更新模型状态失败');
      return false;
    });
};

// API 删除模型
const apiModelDelete = (id: number) => {
  agiModel
    .deleteById(id)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success('模型已删除');
      apiModelList();
    })
    .catch((err) => {
      console.error('--> --> 删除模型失败', err);
      ElMessage.closeAll();
      ElMessage.warning('删除模型失败');
    });
};

// API 强制下线模型
const apiModelOfflineForce = (id: number) => {
  agiModel
    .offlineByIdForce(id)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success('模型已下线');
      apiModelList();
    })
    .catch((err) => {
      console.error('--> --> 强制下线模型失败', err);
      ElMessage.closeAll();
      ElMessage.warning('强制下线模型失败');
    });
};

// 搜索条件变更
const applyFilters = () => {
  dto.keyword = searchTerm.value.trim();
  dto.status = filterStatus.value === ALL_OPTION_ID ? undefined : filterStatus.value;
  dto.modelType = filterType.value === ALL_OPTION_ID ? undefined : filterType.value;
  apiModelList();
};

let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch(searchTerm, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 300);
});

watch([filterStatus, filterType], applyFilters);

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

// 分类选择变更
const handleCategorySelect = (category?: CategoryVO) => {
  dto.categoryId = category?.id ?? ALL_OPTION_ID;
  dto.categoryIdPath = category?.idPath ?? '';
  apiModelList();
};

// 查找分类（递归）
const findCategory = (items: CategoryVO[], id?: number): CategoryVO | undefined => {
  if (!id) {
    return undefined;
  }
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    const child = item.childrenList ? findCategory(item.childrenList, id) : undefined;
    if (child) {
      return child;
    }
  }
  return undefined;
};

// 获取分类名称
const getCategoryLabel = (id?: number) => findCategory(categories.value, id)?.name || '公共领域';

// 转到创建模型页面
const goCreateModel = () => {
  router.push({
    path: '/resources/models/add',
    state: {
      model: {
        modelType: 1,
        status: 0,
        ...(dto.categoryId !== ALL_OPTION_ID ? { categoryId: dto.categoryId } : {})
      }
    }
  });
};

// 转到编辑模型页面
const goEditModel = (model: ModelVO) => {
  router.push({
    path: '/resources/models/edit',
    state: {
      model: { ...model }
    }
  });
};

onMounted(() => {
  apiCategortTree();

  dto.keyword = '';
  dto.status = undefined;
  dto.modelType = undefined;
  dto.categoryId = ALL_OPTION_ID;
  dto.categoryIdPath = '';
  apiModelList();
});
</script>

<style lang="scss" scoped>
.my-page {
  background-image: url(@/assets/images/model/bg-model.png);
  background-position: right bottom;
  background-repeat: no-repeat;
  background-size: 100%;

  .page-name {
    margin-bottom: 46px;
  }
}

.model-search-input.el-form-item {
  min-width: 200px;
  max-width: 420px;
  flex: 1 1 200px;

  :deep(.el-form-item__content),
  :deep(.el-input) {
    width: 100%;
    min-width: 0;
  }
}

.model-repo-page {
  display: flex;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  background: transparent;
  overflow: hidden;

  .page {
    &-body {
      display: flex;
      min-height: 0;
      flex: 1;
      gap: 20px;
      overflow: hidden;
    }
  }

  .content-panel {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }

  .model {
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
  .model-repo-page {
    .page {
      &-body {
        display: flex;
        flex-direction: column;
      }
    }

    .content-panel {
      width: 100%;
    }

    .model {
      &-grid {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
