<script setup lang="ts">
import { API } from '@/api';
import type { PageDomain, SessionsPageDTO, SessionsVO } from '@/types';
import type { TenantsPageDTO, TenantsVO } from '@/types/api/data/tenants';
import type { UsersPageDTO, UsersVO } from '@/types/api/data/users';
import { Search } from 'lucide-vue-next';

const state = reactive({
  userKeyword: '',
  tenantKeyword: '',
  usersDto: {} as UsersPageDTO,
  usersVOs: [] as UsersVO[],
  tenantsDto: {} as TenantsPageDTO,
  tenantsVOs: [] as TenantsVO[],
  sessionsDto: {} as SessionsPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'createdAt', isAsc: 'desc' } as PageDomain,
  dateRange: [] as string[],
  sessionsVOs: [] as SessionsVO[],
  loading: false,
  total: 0
});

const handleAutocompleteKeydown = (event: KeyboardEvent) => {
  if (!(event.target instanceof HTMLInputElement)) return;
  if (event.altKey) return;

  if (event.key === 'Home' || event.key === 'End') {
    event.stopPropagation();
  }
};

const getUsers = (): Promise<UsersVO[]> => {
  state.usersVOs.length = 0;

  if (!state.userKeyword) {
    delete state.usersDto.name;
    return Promise.resolve(state.usersVOs);
  }

  state.usersDto.name = state.userKeyword;
  const page = { pageNum: 1, pageSize: 99999, orderByColumn: 'createdAt', isAsc: 'asc' } as PageDomain;
  return API.Users.list(state.usersDto, page)
    .then((res) => {
      state.usersVOs.push(...res.rows);
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
    })
    .then(() => state.usersVOs);
};

const getTenants = (): Promise<TenantsVO[]> => {
  state.tenantsVOs.length = 0;

  if (!state.tenantKeyword) {
    delete state.tenantsDto.name;
    return Promise.resolve(state.tenantsVOs);
  }

  state.tenantsDto.name = state.tenantKeyword;
  const page = { pageNum: 1, pageSize: 99999, orderByColumn: 'createdAt', isAsc: 'asc' } as PageDomain;
  return API.Tenants.list(state.tenantsDto, page)
    .then((res) => {
      state.tenantsVOs.push(...res.rows);
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
    })
    .then(() => state.tenantsVOs);
};

const onSelectUser = (user: UsersVO) => {
  state.sessionsDto.userId = user.id;
};

const onUserInput = () => {
  delete state.sessionsDto.userId;
};

const onSelectTenant = (tenant: TenantsVO) => {
  state.sessionsDto.tenantId = tenant.id;
};

const onTenantInput = () => {
  delete state.sessionsDto.tenantId;
};

const getSessions = () => {
  const dto = { ...state.sessionsDto };
  if (state.dateRange.length === 2) {
    dto.createdAtStart = `${state.dateRange[0]} 00:00:00`;
    dto.createdAtEnd = `${state.dateRange[1]} 23:59:59`;
  }

  state.loading = true;
  state.sessionsVOs.length = 0;
  state.total = 0;
  API.Sessions.list(dto, state.page)
    .then((res) => {
      state.sessionsVOs.push(...res.rows);
      state.total = res.total;
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
    })
    .finally(() => {
      state.loading = false;
    });
};

const handleQuery = () => {
  state.page.pageNum = 1;
  getSessions();
};

onMounted(() => {
  getSessions();
});
</script>

<template>
  <section>
    <page-name />

    <page-content>
      <template #header>
        <div class="search-bar" @keydown.capture="handleAutocompleteKeydown">
          <el-input
            v-model="state.sessionsDto.title"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            :suffix-icon="Search"
            :placeholder="$t('page.agent.sessions.search.titlePlaceholder', '输入标题查询')"
          />

          <el-autocomplete
            v-model="state.userKeyword"
            style="max-width: 300px"
            class="search-bar__input"
            value-key="username"
            clearable
            hide-loading
            :suffix-icon="Search"
            :trigger-on-focus="false"
            :placeholder="$t('page.agent.sessions.search.userPlaceholder', '输入用户名查询')"
            :fetch-suggestions="getUsers"
            @select="onSelectUser"
            @clear="onUserInput"
            @input="onUserInput"
          />

          <el-autocomplete
            v-model="state.tenantKeyword"
            class="search-bar__input"
            style="max-width: 300px"
            value-key="name"
            clearable
            hide-loading
            :suffix-icon="Search"
            :trigger-on-focus="false"
            :placeholder="$t('page.agent.sessions.search.tenantPlaceholder', '输入租户名称查询')"
            :fetch-suggestions="getTenants"
            @select="onSelectTenant"
            @clear="onTenantInput"
            @input="onTenantInput"
          />

          <el-date-picker
            v-model="state.dateRange"
            class="search-bar__date"
            style="max-width: 300px"
            value-format="YYYY-MM-DD"
            type="daterange"
            :start-placeholder="$t('page.agent.sessions.search.startDatePlaceholder', '创建时间开始')"
            range-separator="-"
            :end-placeholder="$t('page.agent.sessions.search.endDatePlaceholder', '创建时间截止')"
          />

          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table v-loading="state.loading" :data="state.sessionsVOs" show-overflow-tooltip height="100%" style="width: 100%">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column prop="id" :label="$t('page.agent.sessions.table.id', '对话 ID')" :min-width="$dim('page.agent.sessions.table.id', 300)" />
        <el-table-column
          prop="title"
          :label="$t('page.agent.sessions.table.title', '对话标题')"
          :min-width="$dim('page.agent.sessions.table.title', 300)"
        >
          <template #default="{ row }">
            <el-text v-if="row.title">{{ row.title }}</el-text>
            <el-text v-else type="info" style="font-style: italic">{{ $t('page.agent.sessions.table.newSession', '新对话') }}</el-text>
          </template>
        </el-table-column>
        <el-table-column
          prop="deletedAt"
          :label="$t('page.agent.sessions.table.status', '对话状态')"
          align="center"
          :min-width="$dim('page.agent.sessions.table.status', 100)"
        >
          <template #default="{ row }">
            <el-tag v-if="!row.deletedAt" type="success">{{ $t('page.agent.sessions.status.normal', '正常') }}</el-tag>
            <el-tag v-else type="warning">{{ $t('page.agent.sessions.status.deleted', '已删除') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="tenantName"
          :label="$t('page.agent.sessions.table.tenantName', '所属工作空间（租户）')"
          :min-width="$dim('page.agent.sessions.table.tenantName', 250)"
        />
        <el-table-column
          prop="username"
          :label="$t('page.agent.sessions.table.username', '所属用户')"
          :min-width="$dim('page.agent.sessions.table.username', 100)"
        />
        <el-table-column
          prop="createdAt"
          :label="$t('page.agent.sessions.table.createdAt', '创建时间')"
          align="center"
          :min-width="$dim('page.agent.sessions.table.createdAt', 180)"
        />
        <el-table-column
          prop="updatedAt"
          :label="$t('page.agent.sessions.table.updatedAt', '更新时间')"
          align="center"
          :min-width="$dim('page.agent.sessions.table.updatedAt', 180)"
        />
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          align="left"
          fixed="right"
          :min-width="$dim('page.agent.sessions.table.operation', 140)"
        >
          <template #default>
            <el-button link type="primary">{{ $t('page.normal.detail', '详情') }}</el-button>
            <el-button link type="primary">{{ $t('page.agent.sessions.action.message', '消息') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination
          v-show="state.total > 0"
          v-model:page="state.page.pageNum"
          v-model:limit="state.page.pageSize"
          :total="state.total"
          @pagination="getSessions"
        />
      </template>
    </page-content>
  </section>
</template>

<style lang="sass" scoped></style>
