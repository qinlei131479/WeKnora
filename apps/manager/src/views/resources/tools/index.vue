<template>
  <my-page class="my-page">
    <section class="tool-repo-page">
      <page-name class="page-name">
        <btn type="success" :icon="Plus" @click="goCreateTool">注册新工具包</btn>
      </page-name>

      <div class="page-body">
        <tree-category v-model="dto.categoryId" :categories="categories" @select="handleCategorySelect" />

        <main class="content-panel">
          <page-search-form>
            <template #main>
              <el-form-item class="tool-search-input">
                <el-input v-model="searchTerm" :suffix-icon="Search" clearable placeholder="搜索工具名称/唯一标识..." />
              </el-form-item>
            </template>
            <template #right>
              <el-form-item label="工具状态">
                <radio-group v-model="filterStatus">
                  <el-radio-button v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </el-radio-button>
                </radio-group>
              </el-form-item>
            </template>
          </page-search-form>

          <div v-loading="loading" class="tool-scroll" :class="{ 'is-empty': tools.length === 0 }">
            <empty-cell v-if="tools.length === 0" :image="emptyImage" description="在这个过滤器边界下，暂无符合注册的工具资产" />

            <div v-else class="tool-grid">
              <ToolCard
                v-for="tool in tools"
                :key="tool.id"
                :tool="tool"
                :category-label="getCategoryLabel(tool.categoryId)"
                :keyword="highlightKeyword"
                @command="handleToolCommand"
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
import { agiCategory, agiTool } from '@/api/agi';
import type { CategoryVO, PageDomain, ToolPageDTO, ToolVO } from '@/types';
import ToolCard from './components/ToolCard.vue';
import emptyImage from '@/assets/icons/svg/robot.svg';

const ALL_OPTION_ID = -9999;
const TOOL_TYPE_MCP = 1;

type ToolSearchParams = {
  keyword: string;
  status: 0 | 1 | 2 | typeof ALL_OPTION_ID;
  categoryId: number;
};

const statusOptions: { label: string; value: ToolSearchParams['status'] }[] = [
  { label: '全部', value: ALL_OPTION_ID },
  { label: '已上线', value: 1 },
  { label: '已下线', value: 2 }
];

const searchTerm = ref('');
const filterStatus = ref<ToolSearchParams['status']>(ALL_OPTION_ID);

const dto = reactive<ToolPageDTO>({
  keyword: '',
  status: undefined,
  toolType: TOOL_TYPE_MCP,
  categoryId: ALL_OPTION_ID,
  categoryIdPath: ''
});
const categories = ref<CategoryVO[]>([]);
const tools = ref<ToolVO[]>([]);
const loading = ref(false);
const highlightKeyword = ref('');
const router = useRouter();

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
      console.error('--> --> 获取工具分类失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取工具分类失败');
    });
};

const apiToolList = () => {
  loading.value = true;
  const currentKeyword = dto.keyword || '';
  const params: ToolPageDTO = {
    ...dto,
    categoryId: dto.categoryId === ALL_OPTION_ID ? undefined : dto.categoryId
  };
  const pg: PageDomain = {
    pageNum: 1,
    pageSize: 9999,
    orderByColumn: 'id',
    isAsc: 'asc'
  };

  agiTool
    .list(params, pg)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      tools.value = (res.rows || []).filter((tool) => tool.status === 1 || tool.status === 2);
      highlightKeyword.value = currentKeyword;
    })
    .catch((err) => {
      console.error('--> --> 获取工具列表失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取工具列表失败');
      tools.value = [];
    })
    .finally(() => {
      loading.value = false;
    });
};

const apiToolStatus = (id: number, status: 1 | 2) => {
  if (status === 2) {
    ElMessageBox.confirm(
      `<span style="color: red;">
      <p>该工具当前已绑定若干能力，下线后将导致已绑定的能力即刻不可用。</p>
      <br />
      <p>建议操作路径：请前往“能力仓”页面，移除对该工具的依赖，确认无关联后再执行下线（由于当前无法获取具体绑定列表，请您自行检查并确保已全部清理）</p>
      <br />
      <p>若确认强制下线：所关联的能力将停止运行，确定要强制下线吗？</p>
      </span>`,
      '下线提示',
      {
        type: 'error',
        customStyle: {
          width: '33%',
          maxWidth: 'calc(100vw - 512px)'
        },
        confirmButtonText: '强制下线',
        cancelButtonText: '取消',
        dangerouslyUseHTMLString: true
      }
    )
      .then(() => agiTool.offlineByIdForce(id))
      .then((res: any) => {
        if (res.code !== 200) {
          return Promise.reject(res.msg);
        }
        ElMessage.success('工具已下线');
        apiToolList();
      })
      .catch((err: any) => {
        if (err === 'cancel' || err === 'close') {
          return;
        }
        console.error('--> --> 强制下线工具失败', err);
        ElMessage.closeAll();
        ElMessage.warning('强制下线工具失败');
      });
    return;
  }

  agiTool
    .status(id, status)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success('工具已上线');
      apiToolList();
    })
    .catch((err) => {
      console.error('--> --> 更新工具状态失败', err);
      ElMessage.closeAll();
      ElMessage.warning('更新工具状态失败');
    });
};

const apiToolDelete = (id: number) => {
  agiTool
    .deleteById(id)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success('工具已删除');
      apiToolList();
    })
    .catch((err) => {
      console.error('--> --> 删除工具失败', err);
      ElMessage.closeAll();
      ElMessage.warning('删除工具失败');
    });
};

const applyFilters = () => {
  dto.keyword = searchTerm.value.trim();
  dto.status = filterStatus.value === ALL_OPTION_ID ? undefined : filterStatus.value;
  dto.toolType = TOOL_TYPE_MCP;
  apiToolList();
};

let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch(searchTerm, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 300);
});

watch(filterStatus, applyFilters);

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

const handleCategorySelect = (category?: CategoryVO) => {
  dto.categoryId = category?.id ?? ALL_OPTION_ID;
  dto.categoryIdPath = category?.idPath ?? '';
  apiToolList();
};

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

const getCategoryLabel = (id?: number) => findCategory(categories.value, id)?.name || '公共分类';

const handleToolCommand = (command: string | number | object, tool: ToolVO) => {
  if (command === 'edit') {
    if (tool.status !== 2) return;
    goEditTool(tool);
    return;
  }

  if (command === 'online') {
    ElMessageBox.confirm(`确定将工具「${tool.name}」标记上线吗？`, '状态变更确认', {
      type: 'warning'
    }).then(() => {
      apiToolStatus(tool.id!, 1);
    });
    return;
  }

  if (command === 'offline') {
    apiToolStatus(tool.id!, 2);
    return;
  }

  if (command === 'delete') {
    if (tool.status !== 2) return;
    ElMessageBox.confirm(`确定删除工具「${tool.name}」吗？删除后不可恢复。`, '删除确认', {
      type: 'warning'
    }).then(() => {
      apiToolDelete(tool.id!);
    });
  }
};

const goCreateTool = () => {
  router.push({
    path: '/resources/tools/add',
    state: {
      tool: {
        toolType: TOOL_TYPE_MCP,
        apiEntryMethod: 1,
        apiAuthMethod: 0,
        status: 2,
        ...(dto.categoryId !== ALL_OPTION_ID ? { categoryId: dto.categoryId } : {})
      }
    }
  });
};

const goEditTool = (tool: ToolVO) => {
  router.push({
    path: '/resources/tools/edit',
    state: {
      tool: { ...tool }
    }
  });
};

onMounted(() => {
  apiCategoryTree();
  searchTerm.value = '';
  filterStatus.value = ALL_OPTION_ID;
  dto.keyword = '';
  dto.status = undefined;
  dto.toolType = TOOL_TYPE_MCP;
  dto.categoryId = ALL_OPTION_ID;
  dto.categoryIdPath = '';
  apiToolList();
});
</script>

<style lang="scss" scoped>
.my-page {
  background-image: url(@/assets/images/tool/bg-tool.png);
  background-position: right bottom;
  background-repeat: no-repeat;
  background-size: 100%;

  .page-name {
    margin-bottom: 46px;
  }
}

.tool-search-input.el-form-item {
  min-width: 200px;
  max-width: 420px;
  flex: 1 1 200px;

  :deep(.el-form-item__content),
  :deep(.el-input) {
    width: 100%;
    min-width: 0;
  }
}

.tool-repo-page {
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

  .tool {
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
  .tool-repo-page {
    .page-body {
      display: flex;
      flex-direction: column;
    }

    .content-panel {
      width: 100%;
    }

    .tool-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
