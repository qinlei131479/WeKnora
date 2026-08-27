<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { API } from '@/api';
import type { PageDomain } from '@/types';
import type { TenantsPageDTO, TenantsVO } from '@/types/api/data/tenants';
import type {
  WebSearchProviderTypeVO,
  WebSearchProvidersPageDTO,
  WebSearchProvidersVO
} from '@/types/api/data/webSearchProviders';
import { Search } from 'lucide-vue-next';
import WebSearchFormDialog from './components/WebSearchFormDialog.vue';

const { proxy } = getCurrentInstance() as any;
const { t } = useI18n();

const loading = ref(false);
const testingId = ref('');

/** 提供商类型元数据。列表里只用它把 provider 的 id 翻译成中文名 */
const providerTypes = ref<WebSearchProviderTypeVO[]>([]);

const state = reactive({
  keyword: '',
  tenantsDto: {} as TenantsPageDTO,
  tenantsVOs: [] as TenantsVO[],
  providersDto: {} as WebSearchProvidersPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'createdAt', isAsc: 'desc' } as PageDomain,
  providersVOs: [] as WebSearchProvidersVO[],
  total: 0
});

const dialog = reactive({
  visible: false,
  mode: 'add' as 'add' | 'edit',
  editId: undefined as string | undefined
});

/** provider 在库里存的是 id（bing/google/...），展示时换成 /types 给的显示名 */
const providerLabel = (provider?: string) => {
  if (!provider) return '-';
  return providerTypes.value.find((item: WebSearchProviderTypeVO) => item.id === provider)?.name ?? provider;
};

const isCredentialConfigured = (row: WebSearchProvidersVO) => !!row.credentials?.api_key?.configured;

/** el-autocomplete 在弹出建议时会吞掉 Home/End，这里放行给输入框自己处理 */
const handleAutocompleteKeydown = (event: KeyboardEvent) => {
  if (!(event.target instanceof HTMLInputElement)) return;
  if (event.altKey) return;

  if (event.key === 'Home' || event.key === 'End') {
    event.stopPropagation();
  }
};

const getProviders = () => {
  loading.value = true;
  API.WebSearchProviders.list(state.providersDto, state.page)
    .then((res) => {
      state.providersVOs = res.rows ?? [];
      state.total = res.total ?? 0;
    })
    .catch((error) => {
      console.error('[WebSearch] load list failed:', error);
      state.providersVOs = [];
      state.total = 0;
    })
    .finally(() => {
      loading.value = false;
    });
};

const loadProviderTypes = () => {
  API.WebSearchProviders.types()
    .then((res) => {
      providerTypes.value = res.data ?? [];
    })
    .catch((error) => {
      console.error('[WebSearch] load provider types failed:', error);
      providerTypes.value = [];
    });
};

const getTenants = (): Promise<TenantsVO[]> => {
  state.tenantsVOs.length = 0;

  if (!state.keyword) {
    delete state.tenantsDto.name;
    return Promise.resolve(state.tenantsVOs);
  }

  state.tenantsDto.name = state.keyword;
  const page = { pageNum: 1, pageSize: 99999, orderByColumn: 'createdAt', isAsc: 'asc' } as PageDomain;
  return API.Tenants.list(state.tenantsDto, page)
    .then((res) => {
      state.tenantsVOs.push(...res.rows);
    })
    .catch((error) => {
      console.error('[WebSearch] load tenants failed:', error);
    })
    .then(() => state.tenantsVOs);
};

const onSelectTenants = (tenant: TenantsVO) => {
  state.providersDto.tenantId = tenant.id;
  state.page.pageNum = 1;
  getProviders();
};

const onClearTenants = () => {
  delete state.providersDto.tenantId;
  state.page.pageNum = 1;
  getProviders();
};

const onInput = (value: string) => {
  if (value) return;
  delete state.providersDto.tenantId;
  state.page.pageNum = 1;
  getProviders();
};

const handleQuery = () => {
  state.page.pageNum = 1;
  getProviders();
};

const resetQuery = () => {
  state.keyword = '';
  state.tenantsDto = {};
  state.providersDto = {};
  state.page.pageNum = 1;
  getProviders();
};

const handleAdd = () => {
  dialog.mode = 'add';
  dialog.editId = undefined;
  dialog.visible = true;
};

const handleEdit = (row: WebSearchProvidersVO) => {
  dialog.mode = 'edit';
  dialog.editId = row.id;
  dialog.visible = true;
};

const handleDelete = (row: WebSearchProvidersVO) => {
  if (!row.id) return;

  proxy?.$modal
    ?.confirm(
      t('page.data.webSearch.tips.deleteConfirm', { name: row.name ?? '' }, `是否确认删除搜索配置「${row.name ?? ''}」？`)
    )
    .then(() => API.WebSearchProviders.delete(row.id!))
    .then(() => {
      proxy?.$modal?.msgSuccess(t('page.normal.confirmInfo.removeSuccess', '删除成功'));
      getProviders();
    })
    .catch(() => {
      // 用户取消或接口报错，request 拦截器已弹提示，这里不再重复
    });
};

/** 列表页的测试走已保存凭证，不需要用户重新填密钥 */
const handleTest = (row: WebSearchProvidersVO) => {
  if (!row.id) return;

  testingId.value = row.id;
  API.WebSearchProviders.testById(row.id)
    .then((res) => {
      if (res.data?.success) {
        proxy?.$modal?.msgSuccess(res.data.message || t('page.data.webSearch.test.success', '测试成功'));
        return;
      }
      // 后端测试失败同样返回 code=200，成败要看 data.success
      proxy?.$modal?.msgError(
        res.data?.error || res.data?.message || t('page.data.webSearch.test.fail', '测试失败')
      );
    })
    .catch((error) => {
      console.error('[WebSearch] test failed:', error);
    })
    .finally(() => {
      testingId.value = '';
    });
};

onMounted(() => {
  loadProviderTypes();
  getProviders();
});
</script>

<template>
  <section>
    <page-name :title="$t('page.data.webSearch.title', '网络搜索配置')">
      <el-button
        type="success"
        icon="Plus"
        v-hasPermi="['business:webSearchProviders:add']"
        @click="handleAdd"
      >
        {{ $t('page.normal.add', '新增') }}
      </el-button>
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar" @keydown.capture="handleAutocompleteKeydown">
          <el-autocomplete
            v-model="state.keyword"
            value-key="name"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            hide-loading
            :suffix-icon="Search"
            :trigger-on-focus="false"
            :placeholder="$t('page.data.vectorStores.search.tenantPlaceholder', '输入租户名称查询')"
            :fetch-suggestions="getTenants"
            @select="onSelectTenants"
            @clear="onClearTenants"
            @input="onInput"
          />
          <el-input
            v-model="state.providersDto.name"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            :suffix-icon="Search"
            :placeholder="$t('page.data.webSearch.search.namePlaceholder', '输入配置名称查询')"
            @keyup.enter="handleQuery"
          />
          <el-select
            v-model="state.providersDto.provider"
            class="provider-filter"
            clearable
            :placeholder="$t('page.data.webSearch.search.providerPlaceholder', '全部提供商')"
            @change="handleQuery"
          >
            <el-option v-for="item in providerTypes" :key="item.id" :label="item.name" :value="item.id!" />
          </el-select>
          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="state.providersVOs" show-overflow-tooltip height="100%" style="width: 100%">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column
          prop="name"
          :label="$t('page.data.webSearch.table.name', '名称')"
          :min-width="$dim('page.data.webSearch.table.name', 180)"
        />
        <el-table-column
          prop="provider"
          :label="$t('page.data.webSearch.table.provider', '提供商')"
          :min-width="$dim('page.data.webSearch.table.provider', 140)"
        >
          <template #default="{ row }">{{ providerLabel(row.provider) }}</template>
        </el-table-column>
        <el-table-column
          prop="description"
          :label="$t('page.data.webSearch.table.description', '描述')"
          :min-width="$dim('page.data.webSearch.table.description', 220)"
        />
        <el-table-column
          prop="credentials"
          :label="$t('page.data.webSearch.table.credentialStatus', '凭证状态')"
          align="center"
          :min-width="$dim('page.data.webSearch.table.credentialStatus', 100)"
        >
          <template #default="{ row }">
            <el-tag :type="isCredentialConfigured(row) ? 'success' : 'info'">
              {{
                isCredentialConfigured(row)
                  ? $t('page.data.webSearch.table.credentialConfigured', '已配置')
                  : $t('page.data.webSearch.table.credentialUnconfigured', '未配置')
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="isDefault"
          :label="$t('page.data.webSearch.table.isDefault', '是否默认')"
          align="center"
          :min-width="$dim('page.data.webSearch.table.isDefault', 100)"
        >
          <template #default="{ row }">
            <el-tag v-if="row.isDefault === true" type="success">
              {{ $t('page.data.webSearch.table.isDefault_true', '默认') }}
            </el-tag>
            <el-text v-else></el-text>
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          :label="$t('page.data.webSearch.table.createdAt', '创建时间')"
          align="center"
          :min-width="$dim('page.data.webSearch.table.createdAt', 180)"
        />
        <el-table-column
          prop="updatedAt"
          :label="$t('page.data.webSearch.table.updatedAt', '更新时间')"
          align="center"
          :min-width="$dim('page.data.webSearch.table.updatedAt', 180)"
        />
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          align="left"
          fixed="right"
          :min-width="$dim('page.data.webSearch.table.operation', 200)"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              v-hasPermi="['business:webSearchProviders:edit']"
              @click.stop="handleEdit(row)"
            >
              {{ $t('page.normal.edit', '编辑') }}
            </el-button>
            <el-button
              link
              type="primary"
              :loading="testingId === row.id"
              v-hasPermi="['business:webSearchProviders:query']"
              @click.stop="handleTest(row)"
            >
              {{ $t('page.data.webSearch.test.rowButton', '测试') }}
            </el-button>
            <el-button
              link
              type="danger"
              v-hasPermi="['business:webSearchProviders:remove']"
              @click.stop="handleDelete(row)"
            >
              {{ $t('page.normal.delete', '删除') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination
          v-model:page="state.page.pageNum"
          v-model:limit="state.page.pageSize"
          :total="state.total"
          @pagination="getProviders"
        />
      </template>
    </page-content>

    <WebSearchFormDialog
      v-model:visible="dialog.visible"
      :mode="dialog.mode"
      :edit-id="dialog.editId"
      @success="getProviders"
    />
  </section>
</template>

<style lang="scss" scoped>
.provider-filter {
  width: 180px;
}
</style>
