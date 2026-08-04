<template>
  <my-page class="terminal-page-shell">
    <section class="terminal-repo-page">
      <page-name class="page-name">
        <btn v-if="$auth.hasPermi('agentic:terminal:add')" type="success" :icon="Plus" @click="goCreateTerminal"> 注册智能交互终端 </btn>
      </page-name>

      <div class="page-body">
        <main class="content-panel">
          <page-search-form>
            <template #main>
              <el-form-item class="terminal-search-input">
                <el-input v-model="searchTerm" :suffix-icon="Search" clearable placeholder="搜索终端名称 / 绑定大脑 / Token..." />
              </el-form-item>
            </template>

            <template #right>
              <el-form-item label="渠道">
                <radio-group v-model="filterType">
                  <el-radio-button v-for="option in typeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </el-radio-button>
                </radio-group>
              </el-form-item>

              <div class="terminal-total">
                <span class="terminal-total-dot" />
                <span>
                  已部署端口：<strong>{{ total }}</strong>
                </span>
              </div>
            </template>
          </page-search-form>

          <div v-loading="loading" class="terminal-scroll" :class="{ 'is-empty': clients.length === 0 }">
            <empty-cell v-if="clients.length === 0" :image="emptyImage" description="在这个过滤器边界下，暂无任何相关终端" />

            <div v-else class="terminal-grid">
              <InteractionTerminalCard
                v-for="terminal in clients"
                :key="terminal.id"
                :terminal="terminal"
                :base-category-label="getCategoryName(terminal.baseAgentic?.categoryId)"
                :business-category-label="getCategoryName(terminal.businessAgentic?.categoryId)"
                @delete="handleDelete"
                @test="handleTest"
              />
            </div>
          </div>
        </main>
      </div>
    </section>

    <TerminalTest :row="sandboxTerminal" @close="closeTest" />
  </my-page>
</template>

<script setup lang="ts">
import { Plus, Search } from 'lucide-vue-next';
import { ElMessage, ElMessageBox } from 'element-plus';
import { agiClient } from '@/api/agentic/agiClient';
import { agiCategory } from '@/api/settings/category';
import type { AgiClientPageDTO, AgiClientVO, AjaxResult, CategoryVO, PageDomain } from '@/types';
import InteractionTerminalCard from '@/components/agentic/terminal/InteractionTerminalCard.vue';
import TerminalTest from '@/components/agentic/terminal/TerminalTest.vue';
import emptyImage from '@/assets/icons/svg/robot.svg';

const ALL_OPTION_ID = -9999;

type ClientSearchParams = {
  keyword: string;
  type: 1 | 2 | 3 | 4 | typeof ALL_OPTION_ID;
};

const typeOptions: { label: string; value: ClientSearchParams['type'] }[] = [
  { label: '全部', value: ALL_OPTION_ID },
  { label: '钉钉机器人', value: 1 },
  { label: '企业微信机器人', value: 2 },
  { label: 'H5对话机器人', value: 3 },
  { label: '数字人互动终端', value: 4 }
];

const router = useRouter();
const searchTerm = ref('');
const filterType = ref<ClientSearchParams['type']>(ALL_OPTION_ID);
const sandboxTerminal = ref<AgiClientVO | null>(null);
const clients = ref<AgiClientVO[]>([]);
const categories = ref<CategoryVO[]>([]);
const total = ref(0);
const loading = ref(false);

const dto = reactive<AgiClientPageDTO>({
  keyword: '',
  type: undefined
});

const categoryNameMap = computed(() => {
  const result = new Map<number, string>();

  const collectCategories = (items: CategoryVO[]) => {
    items.forEach((item) => {
      if (item.id != null && item.name) {
        result.set(item.id, item.name);
      }
      if (item.childrenList?.length) {
        collectCategories(item.childrenList);
      }
    });
  };

  collectCategories(categories.value);
  return result;
});

const getCategoryName = (categoryId?: number | null) => {
  if (categoryId == null) return '';
  return categoryNameMap.value.get(categoryId) || '';
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
      console.error('--> --> 获取终端分类失败：', err);
      categories.value = [];
    });
};

const apiClientList = () => {
  loading.value = true;

  const pg: PageDomain = {
    pageNum: 1,
    pageSize: 9999,
    orderByColumn: 'id',
    isAsc: 'asc'
  };

  agiClient
    .list(dto, pg)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      clients.value = res.rows || [];
      total.value = Number(res.total || 0);
    })
    .catch((err) => {
      console.error('--> --> 获取终端列表失败：', err);
      ElMessage.closeAll();
      ElMessage.warning('获取终端列表失败');
      clients.value = [];
      total.value = 0;
    })
    .finally(() => {
      loading.value = false;
    });
};

const applyFilters = () => {
  dto.keyword = searchTerm.value.trim();
  dto.type = filterType.value === ALL_OPTION_ID ? undefined : filterType.value;
  apiClientList();
};

let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch(searchTerm, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 300);
});

watch(filterType, applyFilters);

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

const goCreateTerminal = () => {
  router.push('/agentic/terminals/add');
};

const handleDelete = (row: AgiClientVO) => {
  ElMessageBox.confirm(`是否确认删除 “${row.name || ''}” 终端？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
    .then(() => agiClient.deleteById(row.id as number))
    .then((res: AjaxResult<AgiClientVO>) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success('终端已删除');
      apiClientList();
    })
    .catch((err: unknown) => {
      if (err === 'cancel' || err === 'close') return;

      console.error('--> --> 删除终端失败', err);
      ElMessage.closeAll();
      ElMessage.warning('删除终端失败');
    });
};

const handleTest = (row: AgiClientVO) => {
  sandboxTerminal.value = row;
};

const closeTest = () => {
  sandboxTerminal.value = null;
};

onMounted(() => {
  dto.keyword = '';
  dto.type = undefined;
  apiCategoryTree();
  apiClientList();
});
</script>

<style lang="scss" scoped>
.terminal-page-shell {
  background-image: url(@/assets/images/terminal/bg-terminal.png);
  background-position: right bottom;
  background-repeat: no-repeat;
  background-size: 100%;

  width: 1420;

  .page-name {
    margin-bottom: 46px;
  }
}

.terminal-repo-page {
  display: flex;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  background: transparent;
  overflow: hidden;
}

.page-body {
  display: flex;
  min-height: 0;
  flex: 1;
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

.terminal-search-input.el-form-item {
  min-width: 200px;
  max-width: 575px;
  flex: 1 1 200px;

  :deep(.el-form-item__content),
  :deep(.el-input) {
    width: 100%;
    min-width: 0;
  }
}

.terminal-total {
  display: inline-flex;
  min-width: max-content;
  align-items: center;
  gap: 8px;
  color: #77838f;
  font-size: 12px;
  white-space: nowrap;

  strong {
    color: var(--el-color-primary);
    font-weight: 400;
  }
}

.terminal-total-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

.terminal-scroll {
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

.terminal-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

@media (max-width: 1100px) {
  .terminal-grid {
    grid-template-columns: 1fr;
  }
}
</style>
