<template>
  <Dialog v-model:open="context.showCapabilityModal" @open="onOpen">
    <DialogContent title="引入能力 (Skill/工作流)" class="max-w-2xl">
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
            <el-input v-model="status.keyword" placeholder="搜索已发布的能力..." clearable @keyup.enter="doHandleSearch"
              @input="handleDelaySearch" :suffix-icon="Search" />
          </div>
        </div>
        <div class="max-h-[266px] overflow-auto">
          <div class="grid grid-cols-2 gap-4">
            <div v-for="kb in status.showList" :key="kb.id" @click="handleClick(kb)"
              :class="{ 'list-kb-checked': kb.checked }" class="list-kb">
              <el-tooltip :content="kb.name" placement="top" popper-class="tooltip-short">
                <div class="list-kb-name">{{ kb.name }}</div>
              </el-tooltip>
              <el-tooltip :content="kb.description" placement="top" popper-class="tooltip-short">
                <div class="list-kb-desc">{{ kb.description }}</div>
              </el-tooltip>
              <!-- <div class="absolute top-4 right-4">
                <el-checkbox v-model="kb.checked" @click.stop @change="handleCheckChange(kb)" />
              </div> -->
              <img v-if="kb.checked" src="@/assets/images/brain/checked.png" class="checked-icon" />
            </div>
          </div>
          <div v-if="status.showList.length === 0" class="text-center text-slate-500">暂无可用能力</div>
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
// import Input from '@/components/ui/Input.vue'
// import Button from '@/components/ui/Button.vue'
// import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DomainSelect from '@/components/common/DomainSelect2.vue'
import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'
// import { addAgent } from '@/lib/agent-store'
// import {
//   addBusinessAgentBrainApi,
// } from '@/api/agentic/agentBrain'
import { agiSkill } from '@/api/resources/skill'

import type { AgentBrainSkillItem, SkillPageDTO, SkillVO } from '@/types'
import { Search } from '@element-plus/icons-vue'

const context = inject('agentFormContext')
// const formData = context.model;

const status = reactive({
  type: '',
  doamin: undefined,
  typeOptions: [
    { label: '全部', value: '' },
    { label: '本地ZIP资源包', value: 1 },
    { label: '远端代码仓库直连', value: 2 }
  ],
  keyword: '',
  allList: [],
  showList: [],
  disableAdd: false,
  selectedMap: new Map<string, AgentBrainSkillItem>(),
  allMap: {} as Record<string, SkillVO>,
})

const handleAdd = () => {
  const allMap = status.allList.reduce((acc: any, kb: any) => {
    acc[kb.id] = kb
    return acc
  }, {})
  const selectedMap = status.selectedMap;
  const newList: AgentBrainSkillItem[] = [];
  // 遍历 严格保持插入顺序
  for (const [key] of selectedMap) {
    const kb = allMap[key]
    if (kb) {
      newList.push({
        id: kb.id,
        name: kb.name,
        description: kb.description,
        // toolType: kb.toolType,
      })
    }
  }
  if (newList.length === 0) {
    ElMessage.warning('请选择要关联的能力')
    return
  }
  context.capability.list = newList
  context.showCapabilityModal = false
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
  getCapabilityList()
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
  status.type = ''
  status.doamin = undefined
  status.keyword = ''
  status.showList = []
  getCapabilityList()
  const selectedMap = new Map();
  context.capability.list.forEach((kb: any) => {
    selectedMap.set(kb.id, kb)
  })
  status.selectedMap = selectedMap
}

const getCapabilityList = () => {
  const params: SkillPageDTO = { status: 1 }
  let isAll = true
  if (status.type) {
    params.entryMethod = status.type
    isAll = false
  }
  if (status.doamin) {
    params.categoryId = status.doamin
    isAll = false
  }
  if (status.keyword) {
    params.keyword = status.keyword
    isAll = false
  }

  agiSkill.list(params, {
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
@use './dialog.scss';

.list-kb {
  display: block;
}
</style>