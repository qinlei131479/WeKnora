<script setup lang="ts" name="Models">
import { t } from '@/i18n';
import { Search } from 'lucide-vue-next';
import { API } from '@/api';
import type { PageDomain } from '@/types';
import type { ModelProviderVO, ModelsPageDTO, ModelsVO } from '@/types/api/model/model';
import ModelDebugDrawer from './components/ModelDebugDrawer.vue';
import ModelFormDrawer from './components/ModelFormDrawer.vue';
import { MODEL_SOURCE_OPTIONS, MODEL_TYPE_OPTIONS, modelTypeLabelKey } from './constants';

const { proxy } = getCurrentInstance() as any;

const loading = ref(false);

/** 厂商列表只用来把 provider 标识翻译成显示名，这里不带类型过滤 */
const providers = ref<ModelProviderVO[]>([]);

const state = reactive({
  modelsDto: {} as ModelsPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'createdAt', isAsc: 'desc' } as PageDomain,
  modelsVOs: [] as ModelsVO[],
  total: 0
});

const formDrawer = reactive({
  visible: false,
  mode: 'add' as 'add' | 'edit',
  editId: undefined as string | undefined
});

const debugDrawer = reactive({
  visible: false,
  model: null as ModelsVO | null
});

const typeLabel = (type?: string) => {
  const key = modelTypeLabelKey(type);
  return key ? t(key) : type || '-';
};

const sourceLabel = (source?: string) => {
  const option = MODEL_SOURCE_OPTIONS.find((item) => item.value === source);
  return option ? t(option.labelKey, option.label) : source || '-';
};

const providerLabel = (provider?: string) => {
  if (!provider) return '-';
  return providers.value.find((item: any) => item.value === provider)?.label ?? provider;
};

const isCredentialConfigured = (row: ModelsVO) => !!row.credentials?.api_key?.configured;

const getModels = () => {
  loading.value = true;
  API.Models.list(state.modelsDto, state.page)
    .then((res) => {
      state.modelsVOs = res.rows ?? [];
      state.total = res.total ?? 0;
    })
    .catch((error) => {
      console.error('[Models] load list failed:', error);
      state.modelsVOs = [];
      state.total = 0;
    })
    .finally(() => {
      loading.value = false;
    });
};

const loadProviders = () => {
  API.Models.providers()
    .then((res) => {
      providers.value = res.data ?? [];
    })
    .catch((error) => {
      console.error('[Models] load providers failed:', error);
      providers.value = [];
    });
};

const handleQuery = () => {
  state.page.pageNum = 1;
  getModels();
};

const resetQuery = () => {
  state.modelsDto = {};
  state.page.pageNum = 1;
  getModels();
};

const handleAdd = () => {
  formDrawer.mode = 'add';
  formDrawer.editId = undefined;
  formDrawer.visible = true;
};

const handleEdit = (row: ModelsVO) => {
  formDrawer.mode = 'edit';
  formDrawer.editId = row.id;
  formDrawer.visible = true;
};

const handleDebug = (row: ModelsVO) => {
  debugDrawer.model = row;
  debugDrawer.visible = true;
};

const handleDelete = (row: ModelsVO) => {
  if (!row.id) return;

  proxy?.$modal
    ?.confirm(t('page.models.tips.deleteConfirm', { name: row.name ?? '' }, `是否确认删除模型 ${row.name ?? ''}？`))
    .then(() => API.Models.delete(row.id!))
    .then(() => {
      proxy?.$modal?.msgSuccess(t('page.normal.confirmInfo.removeSuccess', '删除成功'));
      getModels();
    })
    .catch(() => {
      // 用户取消或接口报错，request 拦截器已弹提示，这里不再重复
    });
};

onMounted(() => {
  loadProviders();
  getModels();
});
</script>

<template>
  <section>
    <page-name :title="$t('page.models.title', '模型管理')">
      <el-button type="primary" icon="Plus" v-hasPermi="['business:models:add']" @click="handleAdd">
        {{ $t('page.models.add', '新增模型') }}
      </el-button>
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <el-input
            v-model="state.modelsDto.name"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            :suffix-icon="Search"
            :placeholder="$t('page.models.search.namePlaceholder', '输入模型名称查询')"
            @keyup.enter="handleQuery"
          />
          <el-select
            v-model="state.modelsDto.type"
            class="models-filter"
            clearable
            :placeholder="$t('page.models.search.typePlaceholder', '全部类型')"
            @change="handleQuery"
          >
            <el-option v-for="item in MODEL_TYPE_OPTIONS" :key="item.value" :label="$t(item.labelKey, item.label)" :value="item.value" />
          </el-select>
          <el-select
            v-model="state.modelsDto.source"
            class="models-filter"
            clearable
            :placeholder="$t('page.models.search.sourcePlaceholder', '全部来源')"
            @change="handleQuery"
          >
            <el-option v-for="item in MODEL_SOURCE_OPTIONS" :key="item.value" :label="$t(item.labelKey, item.label)" :value="item.value" />
          </el-select>
          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="state.modelsVOs" show-overflow-tooltip height="100%" style="width: 100%">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column prop="name" :label="$t('page.models.table.name', '模型名称')" :min-width="$dim('page.models.table.name', 180)" />
        <el-table-column
          prop="displayName"
          :label="$t('page.models.table.displayName', '显示名称')"
          :min-width="$dim('page.models.table.displayName', 160)"
        />
        <el-table-column prop="type" :label="$t('page.models.table.type', '模型类型')" :min-width="$dim('page.models.table.type', 120)">
          <template #default="{ row }">{{ typeLabel(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="source" :label="$t('page.models.table.source', '模型来源')" :min-width="$dim('page.models.table.source', 120)">
          <template #default="{ row }">{{ sourceLabel(row.source) }}</template>
        </el-table-column>
        <el-table-column :label="$t('page.models.table.provider', '提供商')" :min-width="$dim('page.models.table.provider', 140)">
          <template #default="{ row }">{{ providerLabel(row.parameters?.provider) }}</template>
        </el-table-column>
        <el-table-column
          :label="$t('page.models.table.credentialStatus', '凭证状态')"
          align="center"
          :min-width="$dim('page.models.table.credentialStatus', 100)"
        >
          <template #default="{ row }">
            <el-tag :type="isCredentialConfigured(row) ? 'success' : 'info'">
              {{
                isCredentialConfigured(row)
                  ? $t('page.models.table.credentialConfigured', '已配置')
                  : $t('page.models.table.credentialUnconfigured', '未配置')
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="isDefault"
          :label="$t('page.models.table.isDefault', '是否默认')"
          align="center"
          :min-width="$dim('page.models.table.isDefault', 100)"
        >
          <template #default="{ row }">
            <el-tag v-if="row.isDefault === true" type="success">
              {{ $t('page.models.table.isDefault_true', '默认') }}
            </el-tag>
            <el-text v-else></el-text>
          </template>
        </el-table-column>
        <el-table-column
          prop="isBuiltin"
          :label="$t('page.models.table.isBuiltin', '是否内置')"
          align="center"
          :min-width="$dim('page.models.table.isBuiltin', 100)"
        >
          <template #default="{ row }">
            <el-tag v-if="row.isBuiltin === true" type="info">
              {{ $t('page.normal.builtin', '系统内置') }}
            </el-tag>
            <el-text v-else></el-text>
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          :label="$t('page.models.table.createdAt', '创建时间')"
          align="center"
          :min-width="$dim('page.models.table.createdAt', 180)"
        />
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          align="left"
          fixed="right"
          :min-width="$dim('page.models.table.operation', 200)"
        >
          <template #default="{ row }">
            <el-button link type="primary" v-hasPermi="['business:models:edit']" @click.stop="handleEdit(row)">
              {{ $t('page.normal.edit', '编辑') }}
            </el-button>
            <el-button link type="primary" v-hasPermi="['business:models:edit']" @click.stop="handleDebug(row)">
              {{ $t('page.models.debug.rowButton', '调试') }}
            </el-button>
            <el-button link type="danger" v-hasPermi="['business:models:remove']" @click.stop="handleDelete(row)">
              {{ $t('page.normal.delete', '删除') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-model:page="state.page.pageNum" v-model:limit="state.page.pageSize" :total="state.total" @pagination="getModels" />
      </template>
    </page-content>

    <ModelFormDrawer v-model:visible="formDrawer.visible" :mode="formDrawer.mode" :edit-id="formDrawer.editId" @success="getModels" />

    <ModelDebugDrawer v-model:visible="debugDrawer.visible" :model="debugDrawer.model" />
  </section>
</template>

<style lang="scss" scoped>
.models-filter {
  width: 180px;
}
</style>
