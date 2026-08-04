<script setup lang="ts">
import {
  FolderTree, ChevronRight, ChevronDown, Eye, EyeOff,
  Building, Briefcase, Users, ShieldAlert, HelpCircle, Layers
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import DeptCheckTree from '@/components/SubCheckTree/index.vue'
import DomainSidebar from '@/components/common/DomainSidebar.vue';

// import DomainItem from './DomainItem.vue'
import { listKnowledgeAuthApi } from '@/api/knowledgeLib/knowledgeAuth'
import { listDept } from '@/api/system/dept'
import { updateFaqAuthApi, updateKnowledgeAuthApi } from '@/api/knowledgeLib/knowledgeAuth'

import type { CategoryVO, KnowledgeAuthBatchSaveParam, KnowledgeAuthEntity, KnowledgeAuthQueryParams, KnowledgeAuthRowEntity, KnowledgeAuthSingleSave, KnowledgeAuthType, SysDept } from '@/types'
import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'

import KnowledegIcon from '@/components/knowledge/KnowledegIcon.vue'



const MatrixDimensionDepts = 'depts'
const MatrixDimensionPositions = 'positions'
const MatrixDimensionGroups = 'groups'
type MatrixDimension = typeof MatrixDimensionDepts | typeof MatrixDimensionPositions | typeof MatrixDimensionGroups

// 左侧业务领域
const domainProps = {
  key: 'id',
  label: 'name',
  children: 'childrenList',
  count: 'count',
};
const domainService = DomainServiceFactory()
const showTree = ref(true)
const selectedDomain = ref(allCategoryId)
const expandedNodes = ref<Record<string, boolean>>({
  'base': true,
  'business': true,
  'base-general': true,
  'base-data': true,
  'biz-media': true,
  'biz-iptv': true,
  'biz-hr': true,
})
const selectedDomainName = computed(() => {
  return domainService.dataMap[selectedDomain.value]?.name || ''
});

const changeDomain = (domain: string | number | null) => {
  selectedDomain.value = domain
  getTableDatas();
}
const handleDomainItemClick = (event: any) => {
  const data = event.data
  changeDomain(data.id)
}

const handleDomainItemExpand = (event: any) => {
  const data = event.data
  expandedNodes.value[data.id] = !expandedNodes.value[data.id]
}

interface AuthEntity extends KnowledgeAuthEntity {
  checked: boolean
}
interface RowEntity extends KnowledgeAuthRowEntity {
  authItems?: AuthEntity[]
  manageTreeDepts?: TreeDept[]
  accessQueryTreeDepts?: TreeDept[]
  accessDownloadTreeDepts?: TreeDept[]
}

// 右侧配置
const authTypeDept = 0;
const authTypePosition = 1;
const authTypeUserGroup = 2;
const matrixDimension = ref<MatrixDimension>(MatrixDimensionDepts)
const matrixDimensionOptions = [
  {
    value: MatrixDimensionDepts,
    label: '部门',
    iconClass: 'mp-dept'
  },
  {
    value: MatrixDimensionPositions,
    label: '岗位',
    iconClass: 'mp-post'
  },
  {
    value: MatrixDimensionGroups,
    label: '用户组',
    iconClass: 'mp-group'
  },
]
const tableDatas = ref<RowEntity[]>([])
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 2,
})
const total = ref(1)

interface TreeDept extends SysDept {
  checked: boolean
  children?: TreeDept[]
}
const deptTreeProps = {
  // key: 'id',
  label: 'deptName',
  children: 'children',
}
const deptTreeData = ref<TreeDept[]>([])

const toThinItem = (item: SysDept): TreeDept => {
  return {
    deptId: item.deptId,
    parentId: item.parentId,
    deptName: item.deptName,
    checked: false,
  }
}
const getDeptTreeData = async () => {
  await listDept({
    status: '0',
  }).then(res => {
    const flatList = (res.data || []).map(toThinItem);
    const mapData = flatList.reduce((acc, cur) => {
      acc[cur.deptId!] = cur
      return acc
    }, {} as Record<string, TreeDept>)
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

const cloneTreeData = (data: TreeDept[]): TreeDept[] => {
  return data.map(item => {
    const newItem: TreeDept = {
      ...item,
      checked: false,
    }
    if (item.children) {
      newItem.children = cloneTreeData(item.children!)
    }
    return newItem
  });
}
const walkTreeData = (data: any[] | null | undefined, callback: (item: any) => void, childrenKey: string = 'children') => {
  if (!data) return
  data.forEach(item => {
    callback(item)
    if (item[childrenKey]) {
      walkTreeData(item[childrenKey], callback, childrenKey)
    }
  })
}

const getTableDatas = () => {
  const authTypeMap: any = {
    depts: 0,
    positions: 1,
    groups: 2,
  };
  const authType: number = authTypeMap[matrixDimension.value];
  const params: KnowledgeAuthQueryParams = {
    authType, // 权限类别 0-部门 1-岗位 2-用户组
    categoryId: selectedDomain.value, // 分类ID,agi_category.id
    pageNum: pageInfo.pageNum,
    pageSize: pageInfo.pageSize,
  }

  const promise = listKnowledgeAuthApi(params).then(res => {
    const rows: KnowledgeAuthRowEntity[] = res.rows || []
    const newRows: RowEntity[] = [];
    if (matrixDimension.value === MatrixDimensionDepts) {
      // 'manage' | 'accessQuery' | 'accessDownload'

      const deptTreeDataValue = deptTreeData.value
      rows.forEach(item => {
        const authList = item.authList || [];
        const deptAuthMap: Record<number, KnowledgeAuthEntity> = {};
        authList.forEach(auth => {
          deptAuthMap[auth.authId!] = auth
          // auth.manageFlag = Math.random() > 0.5 ? 1 : 0
        })
        // console.log('deptAuthMap',deptAuthMap)
        const manageTreeDepts = cloneTreeData(deptTreeDataValue)
        const accessQueryTreeDepts = cloneTreeData(deptTreeDataValue)
        const accessDownloadTreeDepts = cloneTreeData(deptTreeDataValue)
        walkTreeData(manageTreeDepts, (item: TreeDept) => {
          const authItem = deptAuthMap[item.deptId!] || {};
          item.checked = authItem.manageFlag === 1
        })
        walkTreeData(accessQueryTreeDepts, (item: TreeDept) => {
          const authItem = deptAuthMap[item.deptId!] || {};
          item.checked = authItem.queryFlag === 1
        })
        walkTreeData(accessDownloadTreeDepts, (item: TreeDept) => {
          const authItem = deptAuthMap[item.deptId!] || {};
          item.checked = authItem.downloadFlag === 1
        })

        const newItem: RowEntity = {
          ...item,
          manageTreeDepts,
          accessQueryTreeDepts,
          accessDownloadTreeDepts,
        }
        newRows.push(newItem)
      })
      tableDatas.value = newRows
    } else {
      // rows.forEach(item => {
      //   const authList = item.authList || [];
      //   const deptAuthMap: Record<number, KnowledgeAuthEntity> = {};
      //   authList.forEach(auth => {
      //     deptAuthMap[auth.authId!] = auth
      //     // auth.manageFlag = Math.random() > 0.5 ? 1 : 0
      //   })
      //   const newItem: RowEntity = {
      //     ...item,
      //     authItems: authList.map(auth => ({
      //       ...auth,
      //       checked: false,
      //     })),
      //   }
      //   newRows.push(newItem)
      // })
      tableDatas.value = rows
    }
    total.value = +res.total
  })
  return promise;
}

const changeMatrixDimension = (dim: MatrixDimension) => {
  matrixDimension.value = dim
  getTableDatas()
}

const handleDeptTreeCheckChange = (data: TreeDept, kb: RowEntity, flag: string, selfOnly: boolean = false) => {
  const newChecked = data.checked;
  if (selfOnly) {
    const params: KnowledgeAuthSingleSave = {
      knowledgeId: kb.knowledgeId!,
      authId: data.deptId!,
      authType: authTypeDept,
      [flag]: newChecked ? 1 : 0,
    }
    return updateKnowledgeAuthApi(params).then((res) => {
      if (res.code != 200) {
        getTableDatas()
      }
    }, () => {
      getTableDatas()
    })
  }

  const authList: KnowledgeAuthType[] = []
  const params: KnowledgeAuthBatchSaveParam = {
    knowledgeId: kb.knowledgeId!,
    authList,
    [flag]: newChecked ? 1 : 0,
  };
  authList.push({
    authId: data.deptId!,
    authType: authTypeDept,
  });
  walkTreeData(data.children, (item: TreeDept) => {
    item.checked = newChecked
    authList.push({
      authId: item.deptId!,
      authType: authTypeDept,
    });
  })

  updateFaqAuthApi(params).then((res) => {
    if (res.code != 200) {
      getTableDatas()
    }
  }, () => {
    getTableDatas()
  })
}
const handleDeptTreeSubClick = (data: TreeDept, kb: RowEntity, flag: string) => {
  // console.log('handleSubClick2', data)
  const newChecked = !data.checked
  data.checked = newChecked
  handleDeptTreeCheckChange(data, kb, flag, false)
}

// const setupFlag = (item: any, checked: boolean) => {
//   const mValue = matrixDimension.value
//   if (mValue === MatrixDimensionDepts) {
//     item.manageFlag = checked ? 1 : 0
//   } else if (mValue === MatrixDimensionPositions) {
//     item.queryFlag = checked ? 1 : 0
//   } else if (mValue === MatrixDimensionGroups) {
//     item.downloadFlag = checked ? 1 : 0
//   }

// }

const handleDeptTreeItemClick = (data: TreeDept, kb: RowEntity, flag: string) => {
  const newChecked = !data.checked
  data.checked = newChecked
  handleDeptTreeCheckChange(data, kb, flag, true)
}

const handleDeptTreeCheckClick = (data: TreeDept, kb: RowEntity, flag: string) => {
  handleDeptTreeCheckChange(data, kb, flag, true)
}

const handleAuthRowChange = (data: KnowledgeAuthEntity, kb: KnowledgeAuthRowEntity, flag: string) => {
  const value = (data as any)[flag];
  const params: KnowledgeAuthSingleSave = {
    knowledgeId: kb.knowledgeId!,
    authId: data.authId!,
    authType: data.authType,
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

// const handleAuthRowClick = (data: KnowledgeAuthEntity, kb: KnowledgeAuthRowEntity, flag: string) => {
//   setTimeout(() => {
//     handleAuthRowChange(data, kb, flag)
//   }, 500)
// }

const handleDomainChange = () => {
  if (selectedDomain.value < 0) {
    selectedDomain.value = allCategoryId
  }
  // console.log('selectedDomain', selectedDomain.value)
  getTableDatas()
}

const initRightData = async () => {
  await getDeptTreeData();
  await getTableDatas();
}

initRightData()

</script>

<template>
  <page-layout gap="20" row>
    <template v-if="showTree" #start>
      <Transition name="fade">
        <div v-if="showTree" class="left-tree-area">
          <DomainSidebar v-model="selectedDomain" :service="domainService" @change="handleDomainChange" />
          <!-- <EyeOff class="left-eye" @click="showTree = false" /> -->
        </div>
      </Transition>
      <!-- <div
        class="h-full flex flex-col w-64 bg-white border border-slate-150 rounded-xl p-4 shrink-0 shadow-sm space-y-4 animate-in fade-in slide-in-from-left-4 duration-200 overflow-hidden">
        <div class="flex items-center justify-between border-b pb-2">
          <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FolderTree class="w-4 h-4 text-slate-500" />
            业务领域分类树
          </span>
          <Button variant="ghost" size="icon" @click="showTree = false"
            class="w-5 h-5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
            <EyeOff class="w-3.5 h-3.5" />
          </Button>
        </div>

        <div class="flex flex-col flex-1 space-y-4 overflow-hidden">
          <div class="flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-al"
            :class="[selectedDomain === allCategoryId ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-700']"
            @click="changeDomain(allCategoryId)">
            <Layers class="w-3.5 h-3.5" />
            <span>全部业务库</span>
            <span
              :class="['ml-auto text-[10px] px-1.5 py-0.2 rounded-full', selectedDomain === allCategoryId ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500']">
              {{ total }}
            </span>
          </div>

          <div class="flex-1 space-y-1 overflow-y-auto">
            <template v-for="node in domainService.allData" :key="node.id">
              <DomainItem :data="node" :expandedNodes="expandedNodes" :selectedKey="selectedDomain" :props="domainProps"
                @click="handleDomainItemClick" @expand="handleDomainItemExpand" />
            </template>
</div>
</div>
</div> -->
    </template>
    <page-layout gap="20">
      <template #start>
        <div class="top-area">
          <div class="top-area-left">
            <btn v-if="!showTree" @click="showTree = true">
              <Eye class="w-3.5 h-3.5 text-blue-600" />
              显示业务分类树
            </btn>
            <span class="s0">当前筛选</span>
            <span class="s1 like-btn">
              {{ selectedDomain === allCategoryId ? '所有业务领域' : selectedDomainName || '特定分支' }}
            </span>
            <span class="s2">
              (共召回 {{ total }} 个知识库)
            </span>
          </div>

          <div class="top-area-right">
            <radio-group v-model="matrixDimension">
              <el-radio-button v-for="option in matrixDimensionOptions" :key="option.value" :value="option.value"
                @change="getTableDatas">
                <svg-icon :icon-class="option.iconClass"></svg-icon> {{ option.label }}
              </el-radio-button>
            </radio-group>
            <!-- <button @click="changeMatrixDimension(MatrixDimensionDepts)"
              :class="['px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1', matrixDimension === MatrixDimensionDepts ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800']">
              <Building class="w-3.5 h-3.5" />
              🏢 集团部门
            </button>
            <button @click="changeMatrixDimension(MatrixDimensionPositions)"
              :class="['px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1', matrixDimension === MatrixDimensionPositions ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800']">
              <Briefcase class="w-3.5 h-3.5" />
              🎭 职务岗位
            </button>
            <button @click="changeMatrixDimension(MatrixDimensionGroups)"
              :class="['px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1', matrixDimension === MatrixDimensionGroups ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800']">
              <Users class="w-3.5 h-3.5" />
              👥 用户组
            </button> -->
          </div>
        </div>
      </template>
      <div v-if="tableDatas.length === 0"
        class="p-12 text-center bg-white border border-slate-150 rounded-2xl space-y-2">
        <ShieldAlert class="w-10 h-10 text-slate-300 mx-auto" />
        <h3 class="text-sm font-bold text-slate-600">本业务领域暂无导入的主体库</h3>
        <p class="text-xs text-slate-400">请选择左侧领域分类树的其他层级。</p>
      </div>

      <div v-else class="list-view">
        <el-scrollbar>
          <div v-for="kb in tableDatas" :key="kb.id" class="kb-card">
            <div class="kb-card-header">
              <KnowledegIcon :type="kb.knowledgeType" class="kb-card-icon" />
              <div class="kb-card-name">{{ kb.knowledgeName }}</div>
              <span class="kb-card-id">
                ID: {{ kb.knowledgeId }}
              </span>
            </div>

            <div class="kb-card-content">
              <div class="kb-card-box s0">
                <div class="kb-card-box-header">
                  <span class="kb-card-box-point s0"></span>
                  <span class="kb-card-box-title">拥有管理与上传配置权</span>
                  <div class="kb-card-box-tip group relative ml-auto">
                    <HelpCircle class="kb-card-box-tip-icon text-slate-400 hover:text-slate-600 cursor-pointer" />
                    <div
                      class="custom-tip absolute right-0 top-5 bg-slate-800 text-slate-100 text-[9px] p-2 rounded shadow-xl w-48 hidden group-hover:block z-10 leading-relaxed font-normal">
                      勾选主体块此权限，即可创建、删除并更新该资产，同时可对知识库底层分块规则、数据抓取策略进行配置。
                    </div>
                  </div>
                </div>

                <div class="kb-card-box-content">
                  <el-scrollbar>
                    <DeptCheckTree v-if="matrixDimension === MatrixDimensionDepts" :data="kb.manageTreeDepts"
                      :props="deptTreeProps" @sub="handleDeptTreeSubClick($event, kb, 'manageFlag')"
                      @item="handleDeptTreeItemClick($event, kb, 'manageFlag')"
                      @check="handleDeptTreeCheckClick($event, kb, 'manageFlag')" node-key="deptId" />
                    <template v-else>
                      <label v-for="pos in kb.authList" :key="pos.id" class="kb-card-box-row">
                        <span class="kb-card-box-row-name">{{ pos.authName }}</span>
                        <el-checkbox v-model="pos.manageFlag" @change="handleAuthRowChange(pos, kb, 'manageFlag')"
                          :true-value="1" :false-value="0" class="auth-checkbox" />
                      </label>
                    </template>
                  </el-scrollbar>
                </div>
              </div>

              <div class="kb-card-box s1">
                <div class="kb-card-box-header">
                  <span class="kb-card-box-point s1"></span>
                  <span class="kb-card-box-title">允许智能问答与检索</span>
                  <div class="kb-card-box-tip group relative ml-auto">
                    <HelpCircle class="kb-card-box-tip-icon text-slate-400 hover:text-slate-600 cursor-pointer" />
                    <div
                      class="custom-tip absolute right-0 top-5 bg-slate-800 text-slate-100 text-[9px] p-2 rounded shadow-xl w-48 hidden group-hover:block z-10 leading-relaxed font-normal">
                      授予特定用户大模型问答时的业务召回权限。管理员在此处管理哪些受众能够查阅并检索本库内容。
                    </div>
                  </div>
                </div>
                <div class="kb-card-box-content">
                  <el-scrollbar>
                    <DeptCheckTree v-if="matrixDimension === MatrixDimensionDepts" :data="kb.accessQueryTreeDepts"
                      :props="deptTreeProps" @sub="handleDeptTreeSubClick($event, kb, 'queryFlag')"
                      @item="handleDeptTreeItemClick($event, kb, 'queryFlag')"
                      @check="handleDeptTreeCheckClick($event, kb, 'queryFlag')" node-key="deptId" />
                    <template v-else>
                      <label v-for="pos in kb.authList" :key="pos.id" class="kb-card-box-row">
                        <span class="kb-card-box-row-name">{{ pos.authName }}</span>
                        <el-checkbox v-model="pos.queryFlag" @change="handleAuthRowChange(pos, kb, 'queryFlag')"
                          :true-value="1" :false-value="0" class="auth-checkbox" />
                      </label>
                    </template>
                  </el-scrollbar>
                </div>
              </div>

              <div class="kb-card-box s2">
                <div class="kb-card-box-header">
                  <span class="kb-card-box-point s2"></span>
                  <span class="kb-card-box-title">允许原文件下载导出</span>
                  <div class="kb-card-box-tip group relative ml-auto">
                    <HelpCircle class="kb-card-box-tip-icon text-slate-400 hover:text-slate-600 cursor-pointer" />
                    <div
                      class="custom-tip absolute right-0 top-5 bg-slate-800 text-slate-100 text-[9px] p-2 rounded shadow-xl w-48 hidden group-hover:block z-10 leading-relaxed font-normal">
                      拥有查看权的用户是否允许其在系统中下载原始文档实体。关闭此项，将处于“仅支持在大脑内推理问答”的超强物理保护状态。
                    </div>
                  </div>
                </div>

                <div class="kb-card-box-content">
                  <el-scrollbar>
                    <DeptCheckTree v-if="matrixDimension === MatrixDimensionDepts" :data="kb.accessDownloadTreeDepts"
                      :props="deptTreeProps" @sub="handleDeptTreeSubClick($event, kb, 'downloadFlag')"
                      @item="handleDeptTreeItemClick($event, kb, 'downloadFlag')"
                      @check="handleDeptTreeCheckClick($event, kb, 'downloadFlag')" node-key="deptId" />
                    <template v-else>
                      <label v-for="pos in kb.authList" :key="pos.id" class="kb-card-box-row">
                        <span class="kb-card-box-row-name">{{ pos.authName }}</span>
                        <el-checkbox v-model="pos.downloadFlag" @change="handleAuthRowChange(pos, kb, 'downloadFlag')"
                          :true-value="1" :false-value="0" class="auth-checkbox" />
                      </label>
                    </template>
                  </el-scrollbar>
                </div>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>
      <template #end>
        <pagination v-show="total > 0" :total="total" :pageSizes="[2, 5, 10, 20]" v-model:page="pageInfo.pageNum"
          v-model:limit="pageInfo.pageSize" @pagination="getTableDatas" />
      </template>
    </page-layout>
  </page-layout>
</template>
<style scoped lang="scss">
@use './tabview.scss';

.left-tree-area {
  height: 100%;
  position: relative;

  .left-eye {
    position: absolute;
    top: 24px;
    right: 20px;
    cursor: pointer;
    font-size: 14px;
    width: 18px;
    height: 18px;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.top-area {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .top-area-left {
    display: flex;
    align-items: center;
    justify-content: flex-start;

    font-weight: 400;
    font-size: 14px;
    color: #77838F;
    line-height: 20px;

    .like-btn {
      background: #FFFFFF;
      border-radius: 30px 30px 30px 30px;
      border: 1px solid #E1E6EC;
      font-weight: bold;
      color: #2B2F33;
      line-height: 20px;
      padding: 7px 32px;
      margin: 0 8px 0 20px;
    }
  }

  .top-area-right {
    :deep(.el-radio-button__inner) {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .svg-icon {
      width: 24px;
      height: 24px;
    }
  }
}

.list-view {
  border-radius: 24px;
  overflow: hidden;
  height: 100%;
}

.kb-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 24px 24px 24px 24px;
  padding: 24px 32px 32px;

  .kb-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .kb-card-name {
      margin-left: 8px;
      font-weight: bold;
      font-size: 16px;
      color: #2B2F33;
      line-height: 24px;
      margin-right: auto;
    }

    .kb-card-id {
      background: #E3F3F5;
      border-radius: 4px 4px 4px 4px;
      border: 1px solid #A7CFD2;
      font-weight: 400;
      font-size: 12px;
      color: #3297A0;
      line-height: 18px;
      padding: 3px 8px;
      min-width: 60px;
      text-align: center;
    }
  }

  .kb-card-content {
    margin: 20px 16px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    .kb-card-box {
      flex: 1;
      height: 232px;
      background: rgba(235, 243, 245, 0.6);
      border-radius: 16px 16px 16px 16px;
      padding: 14px 12px 12px;

      .kb-card-box-header {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;
        margin-bottom: 14px;

        .kb-card-box-point {
          width: 8px;
          height: 8px;
          border-radius: 50%;

          &.s0 {
            background: #4296EC;
          }

          &.s1 {
            background: #29B276;
          }

          &.s2 {
            background: #FF951C;
          }
        }

        .kb-card-box-title {
          font-weight: bold;
          font-size: 14px;
          color: #2B2F33;
          line-height: 20px;
        }

        .kb-card-box-tip-icon {
          width: 16px;
          height: 16px;
        }
      }

      .kb-card-box-content {
        height: 172px;
        background: #FFFFFF;
        border-radius: 12px 12px 12px 12px;
        border: 1px solid #E1E6EC;
        overflow: auto;
        box-sizing: border-box;

        .el-scrollbar {
          padding: 12px 16px;
        }

        .el-tree {
          --el-tree-node-content-height: 32px;

          :deep(.mini-btn) {
            padding: 3px 4px;
          }

          :deep(.el-checkbox) {
            font-size: 16px;
            --el-checkbox-input-height: 16px;
            --el-checkbox-input-width: 16px;
          }
        }

        .kb-card-box-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }


          .kb-card-box-row-name {
            font-size: 14px;
            color: #77838F;
            line-height: 20px;
          }
        }
      }
    }
  }

  &+& {
    margin-top: 20px;
  }
}

.auth-checkbox {
  height: auto;
}
</style>
