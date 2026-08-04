<template>
  <Dialog v-model:open="agentFormContext.showKbModal" @open="onOpen">
    <DialogContent title="选择要关联的知识库" class="max-w-2xl">
      <div class="space-y-4">
        <div class="flex">
          <el-select v-model="status.knowledgeType" placeholder="请选择知识库类型" @change="loadOptions" clearable
            style="width: 200px;" class="mr-2">
            <el-option label="文档知识" :value="0" />
            <el-option label="FAQ知识" :value="1" />
          </el-select>
          <el-input v-model="status.kbSearch" @input="handleDelaySearch" @keyup.enter="loadOptions" clearable
            placeholder="搜索库名..." :suffix-icon="Search" />
        </div>
        <div class="h-[266px] overflow-auto">
          <div class="grid grid-cols-2 gap-4">
            <div v-for="kb in status.showKbList" :key="kb.id" @click="handleClickOption(kb)"
              :class="{ 'list-kb-checked': kb.checked }" class="list-kb">
              <KnowledegIcon :type="kb.knowledgeType" short class="type-icon rounded font-bold text-xs mr-2" />
              <el-tooltip :content="kb.name" placement="top" class="w-12">
                <div class="list-kb-name font-medium text-slate-700 flex-1 truncate mr-2">{{ kb.name }}</div>
              </el-tooltip>
              <!-- <el-checkbox @click.stop v-model="kb.checked" /> -->
              <img v-if="kb.checked" src="@/assets/images/brain/checked.png" class="checked-icon" />
            </div>
          </div>
          <div v-if="status.showKbList.length === 0" class="text-center text-slate-500">暂无可用知识库</div>
        </div>
        <div class="flex justify-end pt-4 border-t border-slate-100">
          <!-- <Button class="bg-blue-600 hover:bg-blue-700" @click="handleAdd" :disabled="status.disableAdd">确认添加</Button> -->
          <el-button type="primary" @click="handleAdd" round :disabled="status.disableAdd">确认添加</el-button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

// import Input from '@/components/ui/Input.vue'
// import Button from '@/components/ui/Button.vue'
// import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
// import DomainSelect from '@/components/common/DomainSelect.vue'
// import { addAgent } from '@/lib/agent-store'
// import {
//   addBusinessAgentBrainApi,
// } from '@/api/agentic/agentBrain'
import { listKnowledgeLibApi } from '@/api/knowledgeLib/knowledgeLib'
import KnowledegIcon from '@/components/knowledge/KnowledegIcon.vue'
import { AjaxResult, KnowledgeLibEntity, TableDataInfo } from '@/types'

// import type { BusinessAgentBrainAddParams } from '@/types/api'

const agentFormContext = inject('agentFormContext')
// const formData = agentFormContext.model;

const status = reactive({
  kbSearch: '',
  knowledgeType: undefined,
  allKbList: [],
  showKbList: [],
  disableAdd: false,
})

const handleAdd = () => {
  const newList: KnowledgeLibEntity[] = [];
  status.allKbList.forEach((kb: any) => {
    if (kb.checked) {
      newList.push(kb as KnowledgeLibEntity)
    }
  })
  if (newList.length === 0) {
    ElMessage.warning('请选择要关联的知识库')
    return
  }
  agentFormContext.knowledge.list = newList
  agentFormContext.showKbModal = false
}
let debounceTimer: any = null
const debounceDelay = 300
const handleDelaySearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(loadOptions, debounceDelay)
}
const loadOptions = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  const kbSearch = status.kbSearch.trim().toLowerCase()
  let showKbList = status.allKbList;
  if (kbSearch.length > 0) {
    showKbList = showKbList.filter((kb: any) => kb.sname.includes(kbSearch))
  }
  if (status.knowledgeType >= 0) {
    showKbList = showKbList.filter((kb: any) => kb.knowledgeType === status.knowledgeType)
  }
  status.showKbList = showKbList
}

const onOpen = () => {
  status.kbSearch = ''
  getKnowledgeList()
}
const handleClickOption = (kb: any) => {
  kb.checked = !kb.checked
}
// const getKnowledgeListApi = () => {
//   return Promise.resolve({
//     code: 200,
//     data: [
//       {
//         id: 1,
//         name: '新媒体知识库',
//       },
//       {
//         id: 2,
//         name: '行政管理制度',
//       },
//       {
//         id: 3,
//         name: '研发周报汇总',
//       },
//       {
//         id: 4,
//         name: '客户沟通SOP',
//       },
//     ],
//   })
// }
const getKnowledgeList = () => {
  const params: any = {
    pageNum: 1,
    pageSize: 9999,
  }
  listKnowledgeLibApi(params).then((res: TableDataInfo) => {
    if (res.code === 200) {
      const allKbList: any = res.rows || []
      allKbList.forEach((kb: any) => {
        kb.checked = !!selectedKbMap[kb.id]
        kb.sname = kb.name.toLowerCase()
        kb.sdescription = kb.description.toLowerCase()
      })
      status.allKbList = allKbList
      status.showKbList = allKbList
    }
  })
  const selectedKbMap = agentFormContext.knowledge.list.reduce((acc: any, kb: any) => {
    acc[kb.id] = kb
    return acc
  }, {})
}
</script>
<style scoped lang="scss">
// .el-select.w-48 {
//   width: calc(var(--spacing) * 48);
// }
@use './dialog.scss';
</style>