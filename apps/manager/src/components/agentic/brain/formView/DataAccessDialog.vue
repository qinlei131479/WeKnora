<template>
  <Dialog v-model:open="context.showDataModal" @open="onOpen">
    <DialogContent title="引入接入数据源" class="max-w-2xl">
      <div class="space-y-4">
        <el-input v-model="status.dataSearch" placeholder="搜索已注册的系统库表或API视图..." clearable @keyup.enter="loadOptions"
          @input="handleDelaySearch" />
        <div class="max-h-[266px] overflow-auto">
          <div class="grid grid-cols-2 gap-4">
            <div v-for="ds in status.showList" :key="ds.id"
              class="p-4 border border-slate-200 rounded-lg flex items-center justify-between hover:border-indigo-400 cursor-pointer">
              <div class="flex items-center gap-3">
                <div
                  :class="['w-8 h-8 rounded flex items-center justify-center font-bold text-xs', ds.typeName === 'M' ? 'bg-indigo-100 text-indigo-700' : 'bg-fuchsia-100 text-fuchsia-700']">
                  {{ ds.typeName }}
                </div>
                <div class="text-sm font-medium text-slate-800">{{ ds.name }}</div>
              </div>
              <div class="text-slate-300">
                <!-- <Plus class="w-5 h-5" /> -->
                <el-checkbox v-model="ds.checked" />
              </div>
            </div>
          </div>
          <div v-if="status.showList.length === 0" class="text-center text-slate-500">暂无可用数据源</div>
        </div>
        <div class="flex justify-end pt-4 border-t border-slate-100">
          <!-- <Button class="bg-indigo-600 hover:bg-indigo-700 text-white" @click="handleAdd" :disabled="status.disableAdd">确认添加</Button> -->
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
import DomainSelect from '@/components/common/DomainSelect.vue'
// import { addAgent } from '@/lib/agent-store'
import {
  addBusinessAgentBrainApi,
} from '@/api/agentic/agentBrain'

import { agiDatasource } from '@/api/dataservices/datasource'

import type { AgentBrainDataSourceItem, AjaxResult, DatasourceVO } from '@/types'

const context = inject('agentFormContext')

interface DatasourceRow extends DatasourceVO {
  checked: boolean;
  typeName: string;
}
interface StatusProp {
  dataSearch: string;
  allList: DatasourceRow[];
  showList: DatasourceRow[];
  disableAdd: boolean;
}

const status = reactive<StatusProp>({
  dataSearch: '',
  allList: [],
  showList: [],
  disableAdd: false,
})

const handleAdd = () => {
  // const checkedKbIds = status.allList.filter((kb:any) => kb.checked).map((kb:any) => kb.id)
  // if (checkedKbIds.length === 0) {
  //   ElMessage.warning('请选择要关联的知识库')
  //   return
  // }
  // status.disableAdd = true
  // addApi(checkedKbIds).then(res => {
  //   if (res.code === 200) {
  //     ElMessage.success('添加成功')
  //     context.showDataModal = false
  //   }
  //   status.disableAdd = false
  // },()=>{
  //   status.disableAdd = false
  // })
  const newList: AgentBrainDataSourceItem[] = [];
  status.allList.forEach((kb: any) => {
    if (kb.checked) {
      newList.push(kb as AgentBrainDataSourceItem)
    }
  })
  if (newList.length === 0) {
    ElMessage.warning('请选择要关联的知识库')
    return
  }
  context.dataAccess.list = newList
  context.showDataModal = false
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
  const dataSearch = status.dataSearch.trim().toLowerCase()
  if (dataSearch.length === 0) {
    status.showList = status.allList
    return
  }
  status.showList = status.allList.filter((kb: DatasourceRow) => kb.name?.toLowerCase().includes(dataSearch))
}

const onOpen = () => {
  getDataList()
}
const getDataListApi = () => {
  const params = {
    // keyword: status.dataSearch,
    status: 0,
  }
  return agiDatasource.list(params, {
    pageNum: 1,
    pageSize: 1000,
  })
}
const getDataList = () => {
  getDataListApi().then(res => {
    if (res.code === 200) {
      const allList: DatasourceVO[] = res.rows || []
      const typeNames: any = {
        1: 'M',
        2: 'P'
      }
      allList.forEach((kb: any) => {
        kb.checked = !!selectedKbMap[kb.id]
        kb.typeName = typeNames[kb.dsType] || ''
      })
      status.allList = allList
      status.showList = allList
    }
  })
  const selectedKbMap = context.dataAccess.list.reduce((acc: any, kb: any) => {
    acc[kb.id] = kb
    return acc
  }, {})
}
</script>
<style scoped lang="scss">
// .el-select.w-48 {
//   width: calc(var(--spacing) * 48);
// }
</style>