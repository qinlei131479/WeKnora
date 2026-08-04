<template>
  <Dialog v-model:open="context.showToolModal" @open="onOpen">
    <DialogContent title="引入工具" class="max-w-2xl">
      <div class="space-y-4">
        <div class="flex gap-4 mb-4">
          <div class="w-48">
            <el-select-v2 v-model="status.type" :options="status.typeOptions" clearable @change="doHandleSearch" />
          </div>
          <div class="w-48">
            <DomainSelect v-model="status.doamin" @change="doHandleSearch" :allow-all="true" check-strictly clearable
              :root-domain-id="context.isBase ? baseCategoryId : businessCategoryId" />
          </div>
          <div class="flex-1">
            <el-input v-model="status.keyword" placeholder="搜索工具名..." clearable @keyup.enter="handleDelaySearch"
              @input="handleDelaySearch" />
          </div>
        </div>
        <div class="max-h-[266px] overflow-auto">
          <div class="grid grid-cols-2 gap-4">
            <div v-for="kb in status.showList" :key="kb.id" @click="handleClick(kb)"
              class="p-4 border border-slate-200 rounded-lg flex flex-col justify-center hover:border-emerald-400 cursor-pointer relative">
              <div class="font-medium text-slate-700 text-sm mb-1">{{ kb.name }}</div>
              <div class="text-xs text-slate-500 mb-2 truncate pr-6" :title="kb.description">{{ kb.description }}</div>
              <div class="absolute top-4 right-4">
                <el-checkbox v-model="kb.checked" @click.stop @change="handleCheckChange(kb)" />
              </div>
            </div>
          </div>
          <div v-if="status.showList.length === 0" class="text-center text-slate-500">暂无可用工具</div>
        </div>
        <div class="flex justify-end pt-4 border-t border-slate-100">
          <!-- <Button class="bg-blue-600 hover:bg-blue-700" @click="handleAdd" :disabled="status.disableAdd">确认添加</Button> -->
          <el-button type="primary" @click="handleAdd" :disabled="status.disableAdd" round>确认添加</el-button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DomainSelect from '@/components/common/DomainSelect2.vue'
import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'
// import { addAgent } from '@/lib/agent-store'
import {
  addBusinessAgentBrainApi,
} from '@/api/agentic/agentBrain'
import { agiTool } from "@/api/resources/tool";

import type { AgentBrainToolItem, ToolPageDTO, ToolVO } from '@/types'

const context = inject('agentFormContext')
// const formData = context.model;

const status = reactive({
  type: '',
  doamin: undefined,
  typeOptions: [
    // { label: '所有', value: '' },
    { label: 'MCP (Model Context Protocol)', value: 1 },
  ],
  keyword: '',
  allList: [] as ToolVO[],
  showList: [] as ToolVO[],
  disableAdd: false,
  selectedMap: new Map<string, AgentBrainToolItem>(),
  allMap: {} as Record<string, ToolVO>,
})

// const addApi = (checkedKbIds:any)=>{
//   return Promise.resolve({
//     code: 200,
//     data: {},
//   })
// }
const handleAdd = () => {
  const allMap = status.allList.reduce((acc: any, kb: any) => {
    acc[kb.id] = kb
    return acc
  }, {})
  const selectedMap = status.selectedMap;
  const newList: AgentBrainToolItem[] = [];
  // 遍历 严格保持插入顺序
  for (const [key] of selectedMap) {
    const kb = allMap[key]
    if (kb) {
      newList.push({
        id: kb.id,
        name: kb.name,
        description: kb.description,
        toolType: kb.toolType,
      })
    }
  }
  if (newList.length === 0) {
    ElMessage.warning('请选择要关联的工具')
    return
  }
  context.tool.list = newList
  context.showToolModal = false
}
let debounceTimer: any = null
const debounceDelay = 300
const handleDelaySearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(doHandleSearch, debounceDelay)
}

const doHandleSearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  getToolList()
  // const type = status.type
  // const doamin = status.doamin
  // const keyword = status.keyword.trim().toLowerCase()
  // let showList = status.allList;
  // if (type) {
  //   showList = showList.filter((kb: any) => kb.type === type)
  // }
  // if (doamin) {
  //   showList = showList.filter((kb: any) => kb.domainId === doamin)
  // }
  // if (keyword) {
  //   showList = showList.filter((kb: any) => kb.name.toLowerCase().includes(keyword))
  // }
  // status.showList = showList
}

const onOpen = () => {
  getToolList()
  const selectedMap = new Map();
  context.tool.list.forEach((kb: any) => {
    selectedMap.set(kb.id, kb)
  })
  status.selectedMap = selectedMap
}

const getToolList = () => {
  const params: ToolPageDTO = {
    status: 1,
    // toolType: 1
  };
  let isAll = true
  if (status.type) {
    params.toolType = status.type
    isAll = false
  }
  if (status.keyword) {
    params.keyword = status.keyword
    isAll = false
  }
  if (status.doamin) {
    params.categoryId = status.doamin
    isAll = false
  }
  agiTool.list(params, {
    pageSize: 9999,
    pageNum: 1,
  }).then(res => {
    if (res.code === 200) {
      const allList: any = res.rows || []
      const selectedMap = status.selectedMap
      allList.forEach((kb: any) => {
        kb.checked = !!selectedMap.get(kb.id)
      })
      if (isAll) {
        status.allList = allList
        // status.allMap = allList.reduce((acc:any, kb:any) => {
        //   acc[kb.id] = kb
        //   return acc
        // }, {})
      }
      status.showList = allList
    }
  })
}

const handleClick = (kb: any) => {
  kb.checked = !kb.checked
  handleCheckChange(kb)
}
const handleCheckChange = (kb: any) => {
  if (kb.checked) {
    status.selectedMap.set(kb.id, kb)
  } else {
    status.selectedMap.delete(kb.id)
  }
}
</script>
<style scoped lang="scss">
// .el-select.w-48 {
//   width: calc(var(--spacing) * 48);
// }
</style>