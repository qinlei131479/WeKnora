<template>
  <div class="lib-card">
    <div class="flex items-start justify-between gap-3 shrink-0">
      <div class="flex items-center gap-1.5 min-w-0">
        <div class="doc-type doc-icon-text doc-icon-bg">
          文档知识
        </div>
        <!-- <span class="text-[11px] text-slate-400 font-mono shrink-0">#{{ kb.id }}</span> -->
      </div>

      <el-tooltip content="删除该知识库" placement="top">
        <div class="delete-btn" @click.stop="handleDelete" v-hasPermi="['knowledge:lib:remove']">
          <Trash class="w-3.5 h-3.5" />
        </div>
        <!-- <el-button @click.stop="handleDelete" v-hasPermi="['knowledge:lib:remove']">
        </el-button> -->
      </el-tooltip>
    </div>

    <div class="flex-1 flex flex-col min-h-0 card-row-1">
      <el-tooltip :content="kb.name" placement="top">
        <div @click="handleEditClick" :class="[
          'card-title',
          !displayValues.canEdit ? 'line-through' : ''
        ]">
          {{ kb.name }}
        </div>
      </el-tooltip>

      <el-tooltip :content="kb.description" placement="top-start" popper-class="tooltip-short">
        <div class="card-desc">
          {{ kb.description }}
        </div>
      </el-tooltip>

      <div class="kb-model-list flex gap-1 pt-2.5">
        <span
          class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-100">
          {{ kb.categoryName }}
        </span>
        <span v-if="kb.embeddingModel"
          class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-100 font-mono">
          {{ kb.embeddingModel.modelCode }}
        </span>
        <span v-if="kb.rerankModel"
          class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-100 font-mono">
          {{ kb.rerankModel.modelCode }}
        </span>
      </div>
    </div>

    <div
      class="border-t border-slate-100 pt-2.5 mt-auto flex items-center justify-between text-[11px] shrink-0 bg-slate-50/20 -mx-4 -mb-4 p-3.5">
      <div class="card-status gap-1.5">
        <div class="card-status-point"></div>
        <span class="card-status-text">{{ displayValues.statusText }}</span>
      </div>

      <div v-if="displayValues.canEdit" class="flex items-center gap-2">
        <!-- <Button size="sm" @click="handleDetailClick"
          class="h-7 text-[10px] bg-slate-900 text-white hover:bg-slate-800 font-bold px-2.5 cursor-pointer">
          详情
        </Button> -->
        <btn class="center-btn" type="primary" @click="handleDetailClick">详情</btn>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  Search, Plus, Trash, Play, RefreshCw, Loader2, Globe, Database,
  Folder, UserCheck, Info, ShieldAlert, Lock
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

import type { AjaxResult, KnowledgeLibEntity } from '@/types'
import {
  listKnowledgeLibApi,
  deleteKnowledgeLibApi,
  detailKnowledgeLibApi
} from '@/api/knowledgeLib/knowledgeLib'
import { getStatusName } from '@/components/knowledeg/constance'


const router = useRouter()
const { proxy } = getCurrentInstance()!
const emit = defineEmits(['change'])

const props = defineProps({
  kb: {
    type: Object as () => KnowledgeLibEntity,
    default: () => ({})
  }
})

const displayValues = computed(() => {
  const item: KnowledgeLibEntity = props.kb
  const canManage = item.manageFlag === 1
  const canQuery = item.queryFlag === 1
  const canDownload = item.downloadFlag === 1
  // const canEdit = canManage && canQuery || false
  const canEdit = proxy.$auth.hasPermi('knowledge:lib:query')
  const status = item.status || ''
  const statusText = getStatusName(status)
  return {
    statusText,
    canEdit,
    canManage,
    canQuery,
    canDownload
  }
})



const handleDelete = () => {
  // emit('remove', props.kb)
  proxy.$modal.confirm('确认删除 [' + props.kb.name + '] 吗？').then(() => {
    doDelete()
  })
}
const doDelete = () => {
  deleteKnowledgeLibApi(props.kb.id).then((res: AjaxResult) => {
    if (res.code === 200) {
      emit('change', props.kb)
    }
  })
}


const handleEditClick = () => {
  if (!displayValues.value.canEdit) {
    proxy.$modal.msgError('您的账号不具备对 [' + props.kb.name + '] 的管理权限')
    return
  }
  // emit('edit', props.kb)
  router.push({ name: 'KnowledgeLibDetail', query: { id: props.kb.id } })
}

const handleDetailClick = () => {
  // emit('detailClick', props.kb)
  // router.push({ name: 'KnowledgeLibDetail', query: { id: props.kb.id } })
  handleEditClick()
}

</script>
<style scoped lang="scss">
.lib-card {
  height: 252px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.doc-type {
  border-radius: 20px 20px 20px 20px;
  border: 1px solid #ADAADF;
  font-size: 12px;
  line-height: 16px;
  padding: 4px 12px;
}

.delete-btn {
  cursor: pointer;

  :hover {
    color: #FF4D4F;
  }
}

.card-row-1 {
  margin-top: 20px;

  .card-title {
    font-weight: bold;
    font-size: 18px;
    color: #2B2F33;
    line-height: 26px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
  }

  .card-desc {
    font-weight: 400;
    font-size: 14px;
    color: #B0BAC6;
    line-height: 20px;
    margin-top: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
  }
}

.card-status {
  display: flex;
  align-items: center;

  .card-status-point {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #3297A0;
  }

  .card-status-text {
    font-weight: 400;
    font-size: 12px;
    color: #3297A0;
    line-height: 17px;
  }
}

.kb-model-list {
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
}

// .center-btn {
//   :deep(span) {
//     padding-right: 0 !important;
//   }
// }
</style>