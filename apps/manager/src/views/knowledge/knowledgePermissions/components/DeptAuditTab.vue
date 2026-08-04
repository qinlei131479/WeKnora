<script setup lang="ts">
import { Building, Database, Search, X, Save } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'

// import DomainServiceFactory from '@/service/domainService'
import { getDeptAuditApi, listKnowledgeAuthApi } from '@/api/knowledgeLib/knowledgeAuth'
import { listDept } from '@/api/system/dept'
import { AuthTypes, updateFaqAuthApi, updateKnowledgeAuthApi } from '@/api/knowledgeLib/knowledgeAuth'
import { KnowledgeAuthEntity, KnowledgeAuthSingleSave, SysDept } from '@/types'
import KnowledegIcon from '@/components/knowledge/KnowledegIcon.vue'

interface TreeDept extends SysDept {
  checked: boolean
  children?: TreeDept[]
}
const deptTreeProps = {
  // key: 'id',
  value: 'deptId',
  label: 'deptName',
  children: 'children',
}
const deptTreeData = ref<TreeDept[]>([])
const deptDataMap = ref<Record<string, TreeDept>>({})
const selectedDeptId = ref('')
const selectedDept = ref<TreeDept>(null)

const toThinItem = (item: SysDept): TreeDept => {
  return {
    deptId: item.deptId,
    parentId: item.parentId,
    deptName: item.deptName,
    checked: false,
  }
}
const getDeptTreeData = async () => {
  await listDept({ status: "0" }).then(res => {
    const flatList = (res.data || []).map(toThinItem);
    const mapData = flatList.reduce((acc, cur) => {
      acc[cur.deptId!] = cur
      return acc
    }, {} as Record<string, TreeDept>)
    deptDataMap.value = mapData
    // console.log('mapData',mapData)
    const rootItems: TreeDept[] = [];
    flatList.forEach(item => {
      if (item.parentId) {
        const parentItem = mapData[item.parentId]
        if (parentItem) {
          if (!parentItem.children) parentItem.children = []
          parentItem.children.push(item)
        } else {
          console.log('parentItem not found', item)
        }
      } else {
        rootItems.push(item)
      }
    })
    deptTreeData.value = rootItems
    console.log('deptTreeData', [...rootItems])
  })
}


const auditSearchQuery = ref('')
const total = ref(0)
const tableData = ref<KnowledgeAuthEntity[]>([])
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
})

// const domainService = DomainServiceFactory()

const initRightData = async () => {
  await getDeptTreeData();
  selectedDeptId.value = deptTreeData.value[0]?.deptId || ''
  // await getTableDatas();
}

const getTableDatas = () => {
  const deptId = selectedDeptId.value
  if (!deptId) {
    total.value = 0
    tableData.value = []
    return;
  }
  const params = {
    deptId: deptId,
    keyword: auditSearchQuery.value,
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  }
  getDeptAuditApi(params).then(res => {
    total.value = +res.total || 0
    tableData.value = res.rows || []
  })
}

const toggleAuth = (kb: KnowledgeAuthEntity, flag: keyof KnowledgeAuthEntity) => {
  const value = (kb as any)[flag];
  const params: KnowledgeAuthSingleSave = {
    knowledgeId: kb.knowledgeId!,
    authId: selectedDeptId.value,
    authType: AuthTypes.DEPT,
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
  () => selectedDeptId.value,
  (newVal: string) => {
    if (!newVal) {
      return;
    }
    const deptItem = deptDataMap.value[newVal]
    selectedDept.value = deptItem
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
            <svg-icon icon-class="mp-dept" />
          </div>
          <div class="top-card-middle">
            <div class="top-card-text0">
              部门视角下的知识库管辖与通达权限编辑
            </div>
            <div class="top-card-text1">
              一键式针对指定部门审计该部门名下职员与系统关联的所有 RAG 问答知识库权限，并支持集中撤销或授权。
            </div>
          </div>
          <div class="top-card-right">
            <label class="top-card-right-label">
              选择研判审计部门
            </label>
            <el-tree-select v-model="selectedDeptId" :data="deptTreeData" :props="deptTreeProps" check-strictly
              placeholder="选择部门..." :render-after-expand="false" class="top-card-right-select" />
          </div>
        </div>
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
              部门关联知识库授权矩阵
            </div>
            <div class="list-header-left-desc">检索到 {{ total }} 个知识库对本部门配置的访问管控状态</div>
          </div>

          <div class="list-header-right">
            <el-input v-model="auditSearchQuery" clearable :suffix-icon="Search"
              class="mp__search-input search-input mini" placeholder="检索知识库、ID、或存储域..." />
          </div>
        </div>
      </template>
      <div class="h-full overflow-auto">
        <table class="card-table">
          <thead>
            <tr>
              <th class="large-cell">实体知识库</th>
              <th class="">分类领域</th>
              <th class="">部门管辖管辖权 (MANAGE)</th>
              <th class="">部门问答检索权 (QUERY)</th>
              <th class="">部门文档下载权 (DOWNLOAD)</th>
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
