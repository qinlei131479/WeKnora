<script setup lang="ts">
import {
  Search, Plus, Trash2, Edit, CheckCircle2, XCircle, UploadCloud, HelpCircle,
  Info, X, ChevronRight, ChevronDown, RefreshCw, Sparkles, Check, FileText,
  AlertCircle, BookOpen, Layers, Undo2, ArrowRight, Eye, ShieldAlert, BadgeCheck,
  FolderTree, Settings2, Shield, Lock, ShieldCheck, UserCheck, KeyRound, Globe,
  Database, User as UserIcon, Play, Loader2, Save, Send, EyeOff, Terminal,
  Bold, Italic, Underline, ImageIcon, Video, Paperclip, Link, Type, MessageSquare
} from 'lucide-vue-next'
// import Input from '@/components/ui/Input.vue'
// import Button from '@/components/ui/Button.vue'
// import Card from '@/components/ui/Card.vue'
// // import { getDomains, getFlatDomains, isDomainMatch } from '@/lib/domain-store'
// import { getFAQKBs, saveFAQKBs, addFAQKB, deleteFAQKB, type FAQKnowledgeBase, type FAQItem, type FAQCategory } from '@/lib/faq-store'
// import { getUsers, getDepartments, getPositions, getUserGroups, type User } from '@/lib/org-store'
// import { getDefaultPermissions, type KBPermissions } from '@/lib/kb-store'

import AddInnerCatModa from './AddInnerCatModa.vue'

import { delSingleApi, folderTreeApi } from '@/api/knowledgeLib/knowledgeFile'
// import { detailKnowledgeFaqApi, listKnowledgeFaqApi } from '@/api/knowledgeLib/knowledgeFaq'
import type { KnowledgeFaqEntity, AjaxResult, KnowledgeLibFileListEntity, TableDataInfo } from '@/types'

// import type { CategoryVO } from '@/types'
// import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'
const isDev = import.meta.env.DEV;
const { proxy } = getCurrentInstance();
const treeRef = ref(null)

const faqDetailFaq = inject('faqDetailFaq')

const addParentCategory = ref<KnowledgeLibFileListEntity | null>(null)
const editCategory = ref<KnowledgeLibFileListEntity | null>(null)

const treeDataProps = {
  children: 'children',
  label: 'fileName',
  value: 'id',
}
const treeData = ref<KnowledgeLibFileListEntity[]>([])
// const activeTreeItem = ref<KnowledgeLibFileListEntity | null>(null)

const handleTreeCurrentChange = (data: KnowledgeLibFileListEntity) => {
  // activeTreeItem.value = data
  // console.log('handleTreeCurrentChange', data)
  faqDetailFaq.updateSearchCategoryId(data.id)
}
const updateSearchCategoryId = (id: number | null) => {
  if (id === null) {
    // console.log('updateSearchCategoryId null, clear currentKey')
    treeRef.value?.setCurrentKey(null)
  }
  faqDetailFaq.updateSearchCategoryId(id)
}

const getTreeData = () => {
  const item: KnowledgeFaqEntity = faqDetailFaq.item
  if (!item) return
  const id = item.id;
  if (!id) {
    console.error('id is null')
    return
  }
  folderTreeApi(id).then((res: AjaxResult) => {
    if (res.code === 200) {
      treeData.value = res.data as KnowledgeLibFileListEntity[]
      faqDetailFaq.categoryTreeData = treeData.value
    }
  }).catch(() => { }).then(() => {
    // if (isDev) {
    //   if (treeData.value.length == 0) {
    //     const items: KnowledgeLibFileListEntity[] = [
    //       {
    //         id: 1,
    //         code: 'a',
    //         parentCode: '',
    //         fileName: '分类1',
    //         fileType: 2,
    //         knowledgeId: id,
    //         children: [
    //           {
    //             id: 2,
    //             code: 'a-1',
    //             parentCode: 'a',
    //             fileName: '分类1-1',
    //             fileType: 2,
    //             knowledgeId: id,
    //             children: []
    //           }
    //         ]
    //       },
    //       {
    //         id: 3,
    //         code: 'b',
    //         parentCode: '',
    //         fileName: '分类2',
    //         fileType: 2,
    //         knowledgeId: id,
    //         children: [
    //           {
    //             id: 4,
    //             code: 'b-1',
    //             parentCode: 'b',
    //             fileName: '分类2-1',
    //             fileType: 2,
    //             knowledgeId: id,
    //             children: [
    //               {
    //                 id: 5,
    //                 code: 'b-1-1',
    //                 parentCode: 'b-1',
    //                 fileName: '分类2-1-1',
    //                 fileType: 2,
    //                 knowledgeId: id,
    //                 children: []
    //               }
    //             ]
    //           }
    //         ]
    //       }
    //     ];
    //     treeData.value = items
    //     faqDetailFaq.categoryTreeData = items
    //   }
    // }
  })
}
faqDetailFaq.getTreeData = getTreeData

const showAddInnerCatModal = ref(false)


const openAddInnerCatModal = () => {
  showAddInnerCatModal.value = true
}

const handleAddRoot = () => {
  // newInnerCatParent.value = null
  addParentCategory.value = null
  editCategory.value = {} as KnowledgeLibFileListEntity
  openAddInnerCatModal()
}

const handleTreeAddClick = (data: KnowledgeLibFileListEntity) => {
  console.log('handleTreeAddClick', data)
  addParentCategory.value = data
  editCategory.value = {} as KnowledgeLibFileListEntity
  openAddInnerCatModal()
}
const handleTreeDeleteClick = (data: KnowledgeLibFileListEntity) => {
  proxy.$modal.confirm('确定删除该分类吗?下面的数据将会全部被删除。').then(() => {
    const isCurrent = faqDetailFaq.searchInfo.categoryId === data.id;
    delSingleApi(data.id!).then((res: AjaxResult) => {
      if (res.code === 200) {
        getTreeData()
        if (isCurrent) {
          faqDetailFaq.updateSearchCategoryId(null)
        }
      }
    }).catch(() => { })
  })
}

const handleAddInnerCatChange = () => {
  getTreeData()
}

watch(
  () => faqDetailFaq.item,
  (item: KnowledgeFaqEntity | null) => {
    if (item) {
      getTreeData()
    }
  },
  { immediate: true }
)
</script>

<template>
  <page-layout class="FaqDetailFaqLeft" gap="0">
    <template #start>
      <div class="top-area">
        <svg-icon icon-class="mp-tree" class="mp-tree" />
        <span class="top-area-title">问答子分类</span>
        <button @click="handleAddRoot" class="top-area-add p-1" title="新建根分类">
          <Plus class="w-3.5 h-3.5" />
        </button>
      </div>
    </template>
    <div class="bottom-area">
      <div class="all-question-row" :class="[
        !faqDetailFaq.searchInfo.categoryId ? 'active' : ''
      ]" @click="updateSearchCategoryId(null)">
        全部问题
      </div>
      <div class="bottom-tree-area">
        <el-tree-v2 :data="treeData" :props="treeDataProps" highlight-current ref="treeRef"
          @current-change="handleTreeCurrentChange" class="bottom-tree" :item-size="40">
          <template #default="{ node, data }">
            <div class="flex-1 min-w-[0px]">
              <div class="flex tree-row w-full">
                <div class="flex min-w-[0px] items-center">
                  <el-icon class="el-icon--left">
                    <Folder v-if="!node.expanded" />
                    <FolderOpened v-else />
                  </el-icon>
                  <span class="prefix flex-1 truncate" :class="{ 'is-leaf': node.isLeaf }">{{ node.label }}</span>
                </div>
                <div class="flex-1 tree-row-ops">
                  <el-icon @click.stop="handleTreeAddClick(data)">
                    <Plus class="w-3 h-3" />
                  </el-icon>
                  <el-icon @click.stop="handleTreeDeleteClick(data)">
                    <Trash2 class="w-3 h-3" />
                  </el-icon>
                </div>
              </div>
            </div>
          </template>
        </el-tree-v2>
      </div>
    </div>
    <AddInnerCatModa v-model="showAddInnerCatModal" :libId="faqDetailFaq.item?.id" :parent="addParentCategory"
      :item="editCategory" @change="handleAddInnerCatChange" />
  </page-layout>
</template>
<style scoped lang="scss">
.FaqDetailFaqLeft {
  width: 280px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px 24px 24px 24px;
}

.top-area {
  padding: 24px 20px 12px;
  border-bottom: 1px solid #E1E6EC;
  display: flex;
  align-items: center;
  min-width: 0;

  .mp-tree {
    font-size: 24px;
    color: var(--el-color-primary);
    margin-right: 8px;
  }

  .top-area-title {
    font-size: 16px;
    color: #2B2F33;
    line-height: 24px;
    margin-right: auto;
  }

  .top-area-add {
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.bottom-area {
  height: 100%;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .all-question-row {
    line-height: 36px;
    // background: #EBF3F5;
    // color: #fff;
    border-radius: 12px 12px 12px 12px;
    padding: 0 12px;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;

    &:hover {
      background: var(--el-fill-color-light);
    }

    &.active {
      background: #EBF3F5;
      color: var(--el-color-primary);
    }
  }

  .bottom-tree-area {
    flex-grow: 1;
    min-height: 0;
    overflow: auto;
  }
}

.bottom-tree {
  :deep(.el-tree-node) {
    .el-tree-node__content {
      border-radius: 12px 12px 12px 12px;
      height: 36px !important;
      margin: 2px 0;
    }

    &.is-current {
      color: var(--el-color-primary);

      .el-tree-node__content {
        background: #EBF3F5;

      }
    }
  }

}

.tree-row {
  justify-content: space-between;
  padding-right: 5px;

  &:hover {
    .tree-row-ops {
      display: flex;
    }
  }
}

.tree-row-ops {
  display: none;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
