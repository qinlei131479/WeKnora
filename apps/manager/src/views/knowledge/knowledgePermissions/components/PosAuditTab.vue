<script setup lang="ts">
import { Briefcase, Database, Search, X, Save } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'


import { getPostAuditApi, listKnowledgeAuthApi } from '@/api/knowledgeLib/knowledgeAuth'
import { listPost } from '@/api/system/post'
import { AuthTypes, updateFaqAuthApi, updateKnowledgeAuthApi } from '@/api/knowledgeLib/knowledgeAuth'
import { KnowledgeAuthEntity, KnowledgeAuthSingleSave, SysPost } from '@/types'

import KnowledegIcon from '@/components/knowledge/KnowledegIcon.vue'


interface RowPost extends SysPost {
  checked: boolean
}

const positionData = ref<RowPost[]>([])
const positionDataMap = ref<Record<string, RowPost>>({})
const selectedPositionId = ref('')
const selectedPosition = ref<RowPost>(null)

const toThinItem = (item: SysPost): RowPost => {
  return {
    postId: item.postId,
    postName: item.postName,
    remark: item.remark,
    checked: false,
  }
}
const getPositionData = async () => {
  const params = {
    pageSize: 999,
    pageNum: 1,
    status: "0"
  };
  await listPost(params).then(res => {
    const rootItems: RowPost[] = [];
    const dataMap: Record<string, RowPost> = {};
    (res.rows || []).forEach((item: SysPost) => {
      const thinItem = toThinItem(item)
      rootItems.push(thinItem)
      dataMap[thinItem.postId!] = thinItem
    });
    positionDataMap.value = dataMap
    positionData.value = rootItems
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
  const postIdNum = positionData.value[0]?.postId
  let postId = typeof postIdNum === 'number' ? postIdNum.toString() : (postIdNum || '')
  selectedPositionId.value = postId
}

const getTableDatas = () => {
  const postId = selectedPositionId.value
  if (!postId) {
    total.value = 0
    tableData.value = []
    return;
  }
  const params = {
    postId: postId,
    keyword: auditSearchQuery.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  }
  getPostAuditApi(params).then(res => {
    total.value = +res.total || 0
    tableData.value = res.rows || []
  })
}

const toggleAuth = (kb: KnowledgeAuthEntity, flag: keyof KnowledgeAuthEntity) => {
  const value = (kb as any)[flag];
  const params: KnowledgeAuthSingleSave = {
    knowledgeId: kb.knowledgeId!,
    authId: selectedPositionId.value,
    authType: AuthTypes.POST,
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
            <svg-icon icon-class="mp-post" />
          </div>
          <div class="top-card-middle">
            <div class="top-card-text0">
              职务岗位视角下的知识库管辖与通达权限编辑
            </div>
            <div class="top-card-text1">
              一键式针对职务等级进行安全一站式审计配置。可以针对岗位下的所有职员，集中进行知识库的降级阻断或放行授权。
            </div>
          </div>
          <div class="top-card-right">
            <label class="top-card-right-label">
              选择研判审计职务
            </label>
            <SearchableSelect v-model="selectedPositionId" :options="positionData.map((p: any) => ({
              id: p.postId + '',
              label: p.postName,
              // sublabel: p.postCode,
              icon: Briefcase
            }))" placeholder="选择职务岗位..." search-placeholder="输入职务岗位名称检索..." />
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
              职务关联知识库授权矩阵
            </div>
            <div class="list-header-left-desc">检索到 {{ total }} 个知识库对本职务配置的访问管控状态</div>
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
              <th class="">岗位管辖管辖权 (MANAGE)</th>
              <th class="">岗位问答检索权 (QUERY)</th>
              <th class="">岗位文档下载权 (DOWNLOAD)</th>
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