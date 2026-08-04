<template>
  <my-page class="my-page">
    <section class="skill-repo-page">
      <page-name class="page-name">
        <btn type="success" :icon="Plus" @click="goCreateSkill">导入 Agent Skills</btn>
      </page-name>

      <div class="page-body">
        <tree-category v-model="dto.categoryId" :categories="categories" @select="handleCategorySelect" />

        <main class="content-panel">
          <page-search-form>
            <template #main>
              <el-form-item class="skill-search-input">
                <el-input v-model="searchTerm" :suffix-icon="Search" clearable placeholder="搜索能力名称..." />
              </el-form-item>
            </template>
            <template #right>
              <el-form-item label="能力状态">
                <radio-group v-model="filterStatus">
                  <el-radio-button v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </el-radio-button>
                </radio-group>
              </el-form-item>
              <el-form-item label="Agent Skill 来源">
                <radio-group v-model="filterEntryMethod">
                  <el-radio-button v-for="option in entryMethodOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </el-radio-button>
                </radio-group>
              </el-form-item>
            </template>
          </page-search-form>

          <div v-loading="loading" class="skill-scroll" :class="{ 'is-empty': skills.length === 0 }">
            <empty-cell v-if="skills.length === 0" :image="emptyImage" description="在这个过滤器边界下，暂无符合条件的能力资源" />

            <div v-else class="skill-grid">
              <SkillCard
                v-for="skill in skills"
                :key="skill.id"
                :skill="skill"
                :category-label="getCategoryLabel(skill.categoryId)"
                :keyword="highlightKeyword"
                @command="handleSkillCommand"
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
import { agiCategory, agiSkill } from '@/api/agi';
import type { CategoryVO, PageDomain, SkillPageDTO, SkillVO } from '@/types';
import SkillCard from './components/SkillCard.vue';
import emptyImage from '@/assets/icons/svg/robot.svg';

const ALL_OPTION_ID = -9999;

type SkillSearchParams = {
  keyword: string;
  status: 1 | 2 | typeof ALL_OPTION_ID;
  entryMethod: 1 | 2 | typeof ALL_OPTION_ID;
  categoryId: number;
};

const statusOptions: { label: string; value: SkillSearchParams['status'] }[] = [
  { label: '全部', value: ALL_OPTION_ID },
  { label: '已上线', value: 1 },
  { label: '已下线', value: 2 }
];

const entryMethodOptions: { label: string; value: SkillSearchParams['entryMethod'] }[] = [
  { label: '全部', value: ALL_OPTION_ID },
  { label: '本地ZIP资源包', value: 1 },
  { label: '远端代码仓库直连', value: 2 }
];

const searchTerm = ref('');
const filterStatus = ref<SkillSearchParams['status']>(ALL_OPTION_ID);
const filterEntryMethod = ref<SkillSearchParams['entryMethod']>(ALL_OPTION_ID);

const dto = reactive<SkillPageDTO>({
  keyword: '',
  status: undefined,
  entryMethod: undefined,
  categoryId: ALL_OPTION_ID,
  categoryIdPath: ''
});
const categories = ref<CategoryVO[]>([]);
const skills = ref<SkillVO[]>([]);
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
      console.error('--> --> 获取能力分类失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取能力分类失败');
    });
};

const apiSkillList = () => {
  loading.value = true;
  const currentKeyword = dto.keyword || '';
  const params: SkillPageDTO = {
    ...dto,
    categoryId: dto.categoryId === ALL_OPTION_ID ? undefined : dto.categoryId
  };
  const pg: PageDomain = {
    pageNum: 1,
    pageSize: 9999,
    orderByColumn: 'id',
    isAsc: 'asc'
  };

  agiSkill
    .list(params, pg)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      skills.value = (res.rows || []).filter((skill) => skill.status === 1 || skill.status === 2);
      highlightKeyword.value = currentKeyword;
    })
    .catch((err) => {
      console.error('--> --> 获取能力列表失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取能力列表失败');
      skills.value = [];
    })
    .finally(() => {
      loading.value = false;
    });
};

const apiSkillStatus = (id: number, status: 1 | 2) => {
  agiSkill
    .status(id, status)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success(status === 1 ? '能力已上线' : '能力已下线');
      apiSkillList();
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
            `<span style="color: red;"><p>该能力当前已绑定<strong>${bindInfo.size || 0}</strong>个智能体大脑（${names}），下线后将导致上述智能体的对应功能<strong>即刻不可用</strong>。</p>
            <p><strong>建议操作路径：</strong> 前往“智能体大脑”页面解除与该能力的绑定关系后，再执行下线。</p>
            <p><strong>若确认强制下线：</strong> 关联智能体的对应功能将<strong>停止运行</strong>，确定要强制下线吗？</p>
            <p>（重新上线后，会恢复原有的绑定关系，无需再次绑定）</p></span>`,
            '能力下线失败',
            {
              type: 'error',
              customStyle: {
                width: '80%',
                maxWidth: 'calc(100vw - 32px)'
              },
              confirmButtonText: '强制下线',
              cancelButtonText: '取消',
              dangerouslyUseHTMLString: true
            }
          )
            .then(() => {
              apiSkillOfflineForce(id);
              return true;
            })
            .catch(() => true);
        }
      }
      console.error('--> --> 更新能力状态失败', err);
      ElMessage.closeAll();
      ElMessage.warning('更新能力状态失败');
      return false;
    });
};

const apiSkillDelete = (id: number) => {
  agiSkill
    .deleteById(id)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success('能力已删除');
      apiSkillList();
    })
    .catch((err) => {
      console.error('--> --> 删除能力失败', err);
      ElMessage.closeAll();
      ElMessage.warning('删除能力失败');
    });
};

const apiSkillOfflineForce = (id: number) => {
  agiSkill
    .offlineByIdForce(id)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success('能力已下线');
      apiSkillList();
    })
    .catch((err) => {
      console.error('--> --> 强制下线能力失败', err);
      ElMessage.closeAll();
      ElMessage.warning('强制下线能力失败');
    });
};

const applyFilters = () => {
  dto.keyword = searchTerm.value.trim();
  dto.status = filterStatus.value === ALL_OPTION_ID ? undefined : filterStatus.value;
  dto.entryMethod = filterEntryMethod.value === ALL_OPTION_ID ? undefined : filterEntryMethod.value;
  apiSkillList();
};

let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch(searchTerm, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 300);
});

watch([filterStatus, filterEntryMethod], applyFilters);

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

const handleCategorySelect = (category?: CategoryVO) => {
  dto.categoryId = category?.id ?? ALL_OPTION_ID;
  dto.categoryIdPath = category?.idPath ?? '';
  apiSkillList();
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

const handleSkillCommand = (command: string | number | object, skill: SkillVO) => {
  if (command === 'online') {
    ElMessageBox.confirm(`确定将能力“${skill.name || ''}”标记上线吗？`, '状态变更确认', {
      type: 'warning'
    }).then(() => {
      apiSkillStatus(skill.id!, 1);
    });
    return;
  }

  if (command === 'offline') {
    ElMessageBox.confirm(`确定将能力“${skill.name || ''}”标记下线吗？`, '状态变更确认', {
      type: 'warning'
    }).then(() => {
      apiSkillStatus(skill.id!, 2);
    });
    return;
  }

  if (command === 'delete') {
    if (skill.status !== 2) return;
    ElMessageBox.confirm(`确定删除能力“${skill.name || ''}”吗？删除后不可恢复。`, '删除确认', {
      type: 'warning'
    }).then(() => {
      apiSkillDelete(skill.id!);
    });
  }
};

const goCreateSkill = () => {
  router.push({
    path: '/resources/skills/add',
    state: {
      skill: {
        entryMethod: 1,
        status: 2,
        ...(dto.categoryId !== ALL_OPTION_ID ? { categoryId: dto.categoryId } : {})
      }
    }
  });
};

onMounted(() => {
  apiCategoryTree();
  searchTerm.value = '';
  filterStatus.value = ALL_OPTION_ID;
  filterEntryMethod.value = ALL_OPTION_ID;
  dto.keyword = '';
  dto.status = undefined;
  dto.entryMethod = undefined;
  dto.categoryId = ALL_OPTION_ID;
  dto.categoryIdPath = '';
  apiSkillList();
});
</script>

<style lang="scss" scoped>
.my-page {
  background-image: url(@/assets/images/skill/bg-skill.png);
  background-position: right bottom;
  background-repeat: no-repeat;
  background-size: 100%;

  .page-name {
    margin-bottom: 46px;
  }
}

.skill-search-input.el-form-item {
  min-width: 200px;
  max-width: 420px;
  flex: 1 1 200px;

  :deep(.el-form-item__content),
  :deep(.el-input) {
    width: 100%;
    min-width: 0;
  }
}

.skill-repo-page {
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

  .skill {
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
  .skill-repo-page {
    .page-body {
      display: flex;
      flex-direction: column;
    }

    .content-panel {
      width: 100%;
    }

    .skill-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
