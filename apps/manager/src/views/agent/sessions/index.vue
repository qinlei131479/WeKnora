<script setup lang="ts">
import { API } from '@/api';
import type { PageDomain, SessionsPageDTO, SessionsVO, TenantsVO, UsersVO } from '@/types';
import { Search } from 'lucide-vue-next';
import DetailDrawer from './components/DetailDrawer.vue';
import MessagesDrawer from './components/MessagesDrawer.vue';

const state = reactive({
  usersVOs: [] as UsersVO[],
  tenantsVOs: [] as TenantsVO[],
  sessionsDto: {} as SessionsPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'createdAt', isAsc: 'desc' } as PageDomain,
  dateRange: [] as string[] | null,
  sessionsVOs: [] as SessionsVO[],
  detailDrawerVisible: false,
  messagesDrawerVisible: false,
  selectedSession: {} as SessionsVO,
  loading: false,
  total: 0
});

const getUsers = () => {
  const page = { pageNum: 1, pageSize: 99999, orderByColumn: 'createdAt', isAsc: 'asc' } as PageDomain;
  API.Users.list({}, page)
    .then((res) => {
      state.usersVOs = res.rows;
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
    });
};

const getTenants = () => {
  const page = { pageNum: 1, pageSize: 99999, orderByColumn: 'createdAt', isAsc: 'asc' } as PageDomain;
  API.Tenants.list({}, page)
    .then((res) => {
      state.tenantsVOs = res.rows;
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
    });
};

const getSessions = () => {
  delete state.sessionsDto.createdAtStart;
  delete state.sessionsDto.createdAtEnd;
  if (state.dateRange?.length === 2) {
    state.sessionsDto.createdAtStart = `${state.dateRange[0]} 00:00:00`;
    state.sessionsDto.createdAtEnd = `${state.dateRange[1]} 23:59:59`;
  }

  state.loading = true;
  state.sessionsVOs.length = 0;
  API.Sessions.list(state.sessionsDto, state.page)
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

const resetQuery = () => {
  state.dateRange = [];
  delete state.sessionsDto.title;
  delete state.sessionsDto.userId;
  delete state.sessionsDto.tenantId;
  delete state.sessionsDto.createdAtStart;
  delete state.sessionsDto.createdAtEnd;
  handleQuery();
};

const showDetail = (row: SessionsVO) => {
  state.selectedSession = row;
  state.detailDrawerVisible = true;
};

const showMessages = (row: SessionsVO) => {
  state.selectedSession = row;
  state.messagesDrawerVisible = true;
};

onMounted(() => {
  getUsers();
  getTenants();
  getSessions();
});
</script>

<template>
  <section>
    <page-name />

    <page-content>
      <template #header>
        <div class="search-bar">
          <el-input
            v-model="state.sessionsDto.title"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            :suffix-icon="Search"
            :placeholder="$t('page.agent.sessions.search.titlePlaceholder', '输入标题查询')"
          />

          <el-select
            v-model="state.sessionsDto.tenantId"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            filterable
            :placeholder="$t('page.agent.sessions.search.tenantPlaceholder', '选择租户名称')"
          >
            <el-option v-for="tenant in state.tenantsVOs" :key="tenant.id" :label="tenant.name" :value="tenant.id!" />
          </el-select>

          <el-select
            v-model="state.sessionsDto.userId"
            style="max-width: 300px"
            class="search-bar__input"
            clearable
            filterable
            :placeholder="$t('page.agent.sessions.search.userPlaceholder', '选择用户名')"
          >
            <el-option v-for="user in state.usersVOs" :key="user.id" :label="user.username" :value="user.id!" />
          </el-select>

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

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table v-loading="state.loading" :data="state.sessionsVOs" show-overflow-tooltip height="100%" style="width: 100%">
        <template #empty>
          <kjsc-empty />
        </template>
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
          :label="$t('page.agent.sessions.table.tenantName', '租户')"
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
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">{{ $t('page.normal.detail', '详情') }}</el-button>
            <el-button link type="primary" @click="showMessages(row)">{{ $t('page.agent.sessions.action.message', '消息') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-model:page="state.page.pageNum" v-model:limit="state.page.pageSize" :total="state.total" @pagination="getSessions" />
      </template>
    </page-content>

    <DetailDrawer v-model="state.detailDrawerVisible" :session="state.selectedSession" />
    <MessagesDrawer v-model="state.messagesDrawerVisible" :session="state.selectedSession" />
  </section>
</template>

<style lang="sass" scoped></style>
