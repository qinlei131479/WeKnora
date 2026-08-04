<template>
  <Dialog v-model:open="agentFormContext.showModelModal" @open="onOpen">
    <DialogContent :title="agentFormContext.isBase ? '引入基础模型' : '引入业务模型'" class="max-w-2xl">
      <div class="space-y-4">
        <div class="flex gap-4 mb-4">
          <el-select-v2 v-model="status.type" :options="status.typeOptions" clearable @change="loadModelOptions"
            class="w-48" />
          <el-input v-model="status.keyword" @input="handleDelaySearch" @keyup.enter="loadModelOptions" clearable
            placeholder="搜索已部署的模型..." class="flex-1" />
        </div>
        <el-checkbox-group v-model="status.modelList">
          <div class="max-h-[266px] overflow-auto">
            <div class="grid grid-cols-2 gap-4">
              <div v-for="item in status.modelListOptions" :key="item.id" @click="handleClickOption(item)"
                class="p-4 border border-slate-200 rounded-lg flex flex-col justify-center hover:border-blue-400 cursor-pointer relative">
                <div class="font-medium text-slate-700 text-sm mb-1">{{ item.name }}</div>
                <p class="text-xs text-slate-500 mt-1">{{ agentFormContext.isBase ? '基础多模态解析模型' : '业务微调模型' }}</p>
                <div class="absolute top-4 right-4">
                  <el-checkbox :value="item.id" @click.stop></el-checkbox>
                  <!-- <input type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                    :checked="t.includes('文本') || t.includes('OCR')" /> -->
                </div>
              </div>
            </div>
            <div v-if="status.modelListOptions.length === 0" class="text-center text-slate-500">暂无可用模型</div>
          </div>
        </el-checkbox-group>
        <div class="flex justify-end pt-4 border-t border-slate-100">
          <!-- <Button class="bg-blue-600 hover:bg-blue-700 text-white" @click="handleConfirm">确认关联</Button> -->
          <el-button type="primary" @click="handleConfirm" round>确认关联</el-button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus'
// import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
// import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
// import DomainSelect from '@/components/common/DomainSelect.vue'
// import { addAgent } from '@/lib/agent-store'
// import {
//   addBusinessAgentBrainApi
// } from '@/api/agentic/agentBrain'

import { modelTypeOptions } from '@/service/modelService'
import { agiModel } from '@/api/resources/model'

import type { AgentBrainModel, AgentBrainModelItem, ModelPageDTO, ModelVO } from '@/types'

const emit = defineEmits(['update'])

const agentFormContext = inject('agentFormContext')
const formData: ComputedRef<AgentBrainModel> = computed(() => agentFormContext.model);

const status = reactive({
  type: '',
  typeOptions: modelTypeOptions,
  keyword: '',
  modelList: [],
  modelListOptions: [],
  allModelListOptions: [] as ModelVO[],
})
// const selectedModels = ref<Record<string, AgentBrainModelItem>>({})

const handleConfirm = () => {
  if (status.modelList.length === 0) {
    ElMessage.warning('请选择要关联的模型')
    return
  }
  const records = status.allModelListOptions.reduce((prev: Record<string, ModelVO>, cur: ModelVO) => {
    prev[cur.id!] = cur
    return prev
  }, {} as Record<string, ModelVO>)
  // const items = status.modelList.map((item: string|number) => records[item]).filter(Boolean)
  const newModels: AgentBrainModelItem[] = [];
  status.modelList.forEach((id: string | number) => {
    const item: ModelVO = records[id]
    if (item) {
      newModels.push({
        id: Number(id!),
        name: item.name!,
      })
    }
  });
  formData.value.models = newModels
  agentFormContext.showModelModal = false
}

const handleClickOption = (item: ModelVO) => {
  if (status.modelList.includes(item.id!)) {
    status.modelList = status.modelList.filter((id: string | number) => id !== item.id!)
  } else {
    status.modelList.push(item.id!)
  }
}

let searchTimeout: any = null
const handleDelaySearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    searchTimeout = 0;
    if (loading.value) {
      handleDelaySearch()
    } else {
      loadModelOptions()
    }
  }, 500)
}
const loading = ref(false)
const loadModelOptions = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  const params: ModelPageDTO = { status: 1 }; // 状态: 0-部署中 1-上线 2-下线
  let isAll = true
  if (status.type) {
    params.modelType = Number(status.type) as 1 | 2 | 3
    isAll = false;
  }
  if (status.keyword) {
    params.keyword = status.keyword
    isAll = false;
  }
  loading.value = true
  agiModel.list(params, {
    pageNum: 1,
    pageSize: 9999,
  }).then((res) => {
    if (res.code === 200) {
      // const selectedModelsValue = selectedModels.value
      status.modelListOptions = res.rows || [];
      if (isAll) {
        status.allModelListOptions = res.rows || [];
      }
      // status.modelListOptions = (res.rows || []).map((item) => ({
      //   id: item.id!,
      //   name: item.name!,
      //   checked: !!selectedModelsValue[item.id!],
      // }))
    }
  }).finally(() => {
    loading.value = false
  })
}
const onOpen = () => {
  loadModelOptions()
  status.modelList = formData.value.models?.map((item: AgentBrainModelItem) => item.id!) || []
}
</script>
<style scoped lang="scss">
.el-select.w-48 {
  width: calc(var(--spacing) * 48);
}
</style>