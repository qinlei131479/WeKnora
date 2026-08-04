<script setup lang="ts">
import { Users, Database, Search, X, Save } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'


import {
  listRole,
} from "@/api/knowledge/knowledgeRole.js";
import { getRoleAuditApi, AuthTypes, updateFaqAuthApi, updateKnowledgeAuthApi } from '@/api/knowledgeLib/knowledgeAuth'

import KnowledegIcon from '@/components/knowledge/KnowledegIcon.vue'
import { KnowledgeAuthEntity, KnowledgeAuthSingleSave, BusinessRoleEntity, KnowledgeAuthRoleQueryParams } from '@/types'

interface RowRole {
  id: string
  roleName: string
  remark: string | undefined
  checked: boolean
}

const positionData = ref<RowRole[]>([])
const positionDataMap = ref<Record<string, RowRole>>({})
const selectedPositionId = ref('')
const selectedPosition = ref<RowRole>(null)

const toThinItem = (item: BusinessRoleEntity): RowRole => {
  return {
    id: item.id + '',
    roleName: item.roleName,
    remark: item.remark,
    checked: false,
  }
}
const getPositionData = async () => {
  const params = {
    pageSize: 999,
    pageNum: 1,
  };
  await listRole({}, params).then((res: any) => {
    const rootItems: RowRole[] = [];
    const dataMap: Record<string, RowRole> = {};
    (res.rows || []).forEach((item: BusinessRoleEntity) => {
      if (item.status != "0") {
        return;
      }
      const thinItem = toThinItem(item)
      rootItems.push(thinItem)
      dataMap[thinItem.id + ''] = thinItem
    });
    positionDataMap.value = dataMap
    positionData.value = rootItems
    // console.log('positionData', positionData.value)
  })
}


const auditSearchQuery = ref('')
const total = ref(0)
const tableData = ref<KnowledgeAuthEntity[]>([])
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
})

const initRightData = async () => {
  await getPositionData();
  selectedPositionId.value = positionData.value[0]?.id || ''
}

const getTableDatas = () => {
  const postId = selectedPositionId.value
  if (!postId) {
    total.value = 0
    tableData.value = []
    return;
  }
  const params: KnowledgeAuthRoleQueryParams = {
    roleId: postId,
    keyword: auditSearchQuery.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  }
  getRoleAuditApi(params).then(res => {
    total.value = +res.total || 0
    tableData.value = res.rows || []
  })
}

const toggleAuth = (kb: KnowledgeAuthEntity, flag: keyof KnowledgeAuthEntity) => {
  const value = (kb as any)[flag];
  const params: KnowledgeAuthSingleSave = {
    knowledgeId: kb.knowledgeId!,
    authId: selectedPositionId.value,
    authType: AuthTypes.USERGROUP,
    [flag]: value,
  }
  return updateKnowledgeAuthApi(params).then((res) => {
    if (res.code != 200) {
      getTableDatas()
    }
  }, () => {
    getTableDatas()
  })
}

initRightData()

watch(
  () => selectedPositionId.value,
  (newVal: string) => {
    if (!newVal) {
      return;
    }
    const positionItem = positionDataMap.value[newVal]
    selectedPosition.value = positionItem
    getTableDatas()
  }
)
let searchDelayTimer: any = null;
watch(
  () => auditSearchQuery.value,
  (newVal: string) => {
    if (searchDelayTimer) {
      clearTimeout(searchDelayTimer)
    }
    searchDelayTimer = setTimeout(() => {
      searchDelayTimer = null
      getTableDatas()
    }, 800)
  }
)

</script>
<template>
  <page-layout gap="20">
    <template #start>
      <div class="top-card">
        <div class="top-card-layout">
          <div class="top-card-left">
            <svg-icon icon-class="mp-group" />
          </div>
          <div class="top-card-middle">
            <div class="top-card-text0">
              用户组/虚拟团队视角下的知识库管辖与通达权限编辑
            </div>
            <div class="top-card-text1">
              一键式针对虚拟项目组/多维联合用户组进行安全管辖审计与授权。用户置身该组的所有成员可直接继承此组合并授权。
            </div>
          </div>
          <div class="top-card-right">
            <label class="top-card-right-label">
              选择研判审计用户组
            </label>
            <SearchableSelect v-model="selectedPositionId" :options="positionData?.map((g: any) => ({
              id: g.id,
              label: g.roleName,
              sublabel: g.remark,
              icon: Users
            }))" placeholder="选择用户组..." search-placeholder="输入用户组名称或代码检索..." />
          </div>
        </div>
        <!-- <div class="top-inner-card">
          <div class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">岗位主要职责详情</div>
          <div class="font-semibold text-slate-700 block">{{ selectedPosition?.remark || '' }}&nbsp;</div>
        </div> -->
      </div>
    </template>
    <template #end>
      <pagination v-show="total > 0" :total="total" v-model:page="pageInfo.pageNum" v-model:limit="pageInfo.pageSize"
        @pagination="getTableDatas" />
    </template>
    <page-layout gap="20" class="list-card">
      <template #start>
        <div class="list-header">
          <div class="list-header-left">
            <div class="list-header-left-title">
              用户组关联知识库授权矩阵
            </div>
            <div class="list-header-left-desc">检索到 {{ total }} 个知识库对本组配置的访问管控状态</div>
          </div>

          <div class="list-header-right">
            <el-input v-model="auditSearchQuery" clearable :suffix-icon="Search"
              class="mp__search-input search-input mini" placeholder="检索知识库、ID、或分类存储域..." />
          </div>
        </div>
      </template>
      <div class="h-full overflow-auto">
        <table class="card-table">
          <thead>
            <tr>
              <th class="large-cell">实体知识库</th>
              <th class="">分类领域</th>
              <th class="">用户组管辖权限 (MANAGE)</th>
              <th class="">用户组问答检索权 (QUERY)</th>
              <th class="">用户组文档下载权 (DOWNLOAD)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="tableData.length === 0" class="empty-tr">
              <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                无匹配知识库
              </td>
            </tr>
            <tr v-for="kb in tableData" :key="kb.id" class="data-tr">
              <td>
                <div class="knowledge-item">
                  <KnowledegIcon :type="kb.knowledgeType" class="kb-card-icon" />
                  <div class="knowledge-name">{{ kb.knowledgeName }}</div>
                  <div class="knowledge-id">ID: {{ kb.knowledgeId }}</div>
                </div>
              </td>
              <td>
                {{ kb.categoryName }}
              </td>
              <td>
                <el-checkbox v-model="kb.manageFlag" :true-value="1" :false-value="0"
                  @change="toggleAuth(kb, 'manageFlag')" />
              </td>
              <td>
                <el-checkbox v-model="kb.queryFlag" :true-value="1" :false-value="0"
                  @change="toggleAuth(kb, 'queryFlag')" />
              </td>
              <td>
                <el-checkbox v-model="kb.downloadFlag" :true-value="1" :false-value="0"
                  @change="toggleAuth(kb, 'downloadFlag')" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </page-layout>
  </page-layout>
</template>
<style scoped lang="scss">
@use './tabview.scss';
</style>