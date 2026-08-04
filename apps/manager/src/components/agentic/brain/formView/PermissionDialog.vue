<template>
  <Dialog v-model:open="context.showPermissionModal" @open="onOpen">
    <DialogContent title="选择并授权可用人员范围 (点选查找机制)" class="max-w-2xl">
      <div class="space-y-4">
        <p class="text-xs text-slate-400">支持按部门、岗位及用户组分级授权。您可以在上方切换类别，或者在输入框内快速输入关键词，进行智能一键加入。</p>
        <div class="flex gap-3 mb-2 flex-wrap">
          <div class="w-48">
            <el-select-v2 v-model="status.type" :options="status.typeOptions" @change="handleTypeChange" />
          </div>
          <div class="flex-1">
            <el-input v-model="status.keyword" placeholder="检索当前类别下的特定名称或说明..." @keyup.enter="doHandleSearch"
              @input="handleDelaySearch" suffix-icon="Search" />
          </div>
        </div>
        <div class="border border-slate-200 rounded-xl max-h-[260px] overflow-y-auto bg-slate-50/50 p-2.5 space-y-2"
          :class="{ 'list-container': status.type != AuthTypes.DEPT }">
          <template v-if="status.type === AuthTypes.DEPT">
            <DeptCheckTree :data="deptTreeData" :props="deptTreeProps" @item="toggleChecked" class="dept-tree"
              node-key="deptId">
              <template #right="{ data }">
                <div class="flex items-center gap-1">
                  <div v-if="data.checked" class="tree-btn checked-btn">
                    <el-checkbox :model-value="data.checked" />已授权
                  </div>
                  <div v-else class="tree-btn apply-btn">点选授权即可</div>
                  <div v-if="data.children?.length > 0" class="tree-btn apply-btn2"
                    @click.stop="handleDeptTreeSubClick(data)">{{
                      data.checked ? '点选级联撤销' : '点选级联授权'
                    }}</div>
                  <!-- <el-check-tag v-if="data.checked" checked type="success" size="small">
                  </el-check-tag> -->
                  <!-- <el-button v-else class="apply-btn" size="small" :icon="Plus">点选授权即可</el-button> -->
                  <!-- <el-button v-if="data.children?.length > 0" class="apply-btn2" size="small"
                    @click.stop="handleDeptTreeSubClick(data)">{{
                      data.checked ? '点选级联撤销' : '点选级联授权'
                    }}</el-button> -->
                </div>
              </template>
            </DeptCheckTree>
          </template>
          <template v-else>
            <div v-for="candidate in listData" :key="status.type + '_' + candidate.id" @click="toggleChecked(candidate)"
              class="list-row">
              <div class="list-row-main">
                <!-- <span
                  :class="['w-2 h-2 rounded-full', status.type === AuthTypes.POSITION ? 'bg-amber-500' : 'bg-purple-500']"></span> -->
                <div>
                  <div class="list-row-text-0 truncate">{{ candidate.name }}</div>
                  <el-tooltip :content="candidate.detail" placement="top">
                    <div v-if="candidate.detail" class="list-row-text-1 truncate">{{ candidate.detail }}</div>
                  </el-tooltip>
                </div>
              </div>
              <div v-if="candidate.checked" class="tree-btn checked-btn">
                <el-checkbox :model-value="candidate.checked" />已授权
              </div>
              <div v-else class="tree-btn apply-btn">点选授权即可</div>
              <!-- <el-check-tag v-if="candidate.checked" checked type="success" size="small">✔已授权</el-check-tag>
              <el-button v-else class="apply-btn" size="small" :icon="Plus">点选授权即可</el-button> -->
              <!-- <span v-if="candidate.checked"
                class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">✔
                已在授权列表中</span>
              <Button v-else variant="outline" size="sm" @click="handleAddCandidate(candidate)">加入授权</Button> -->
            </div>
            <div v-if="listData.length === 0" class="text-center text-slate-400">暂暂无数据</div>
          </template>
        </div>
        <div class="flex justify-end pt-4 border-slate-100">
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
import DomainSelect from '@/components/common/DomainSelect.vue'
import DeptCheckTree from '@/components/SubCheckTree/index.vue'
import positionServiceFactory, { PositionEntity } from '@/service/positionService'
import groupServiceFactory, { GroupEntity } from '@/service/groupService'
import DeptServiceFactory, { TreeDept } from '@/service/deptService'
import { Plus } from '@element-plus/icons-vue'

import type { AgentBrainAuthItem } from '@/types'
import { AuthTypes } from '@/api/knowledgeLib/knowledgeAuth'
import { walkTreeData } from '@/utils'

interface HoldType {
  hold?: boolean
  children?: HoldType[]
}
interface AuthTreeItem extends TreeDept {
  authDataId?: number
  name: string
  sname: string
}
interface AuthPositionItem extends PositionEntity {
  authDataId?: number
  name: string
  // sname: string
  detail: string
}
interface AuthGroupItem extends GroupEntity {
  authDataId?: number
  name: string
  // sname: string
  detail: string
}
const context = inject('agentFormContext')

const props = defineProps({
  dservice: {
    type: Object,
    default: () => null,
  },
  pservice: {
    type: Object,
    default: () => null,
  },
  gservice: {
    type: Object,
    default: () => null,
  },
})
const status = reactive({
  type: undefined,
  typeOptions: [
    // { label: '所有', value: '' },
    { label: '按 部门 授权', value: AuthTypes.DEPT },
    { label: '按 岗位 授权', value: AuthTypes.POST },
    { label: '按 用户组 授权', value: AuthTypes.USERGROUP },
  ],
  keyword: '',
  skeyword: '',
  allList: [],
  showList: [],
  disableAdd: false,
  selectedDept: new Map(),
  selectedPosition: new Map(),
  selectedGroup: new Map(),
});
const deptService = props.dservice || DeptServiceFactory({ autoLoad: false })
const positionService = props.pservice || positionServiceFactory({ autoLoad: false })
const groupService = props.gservice || groupServiceFactory({ autoLoad: false })

const deptTreeProps = {
  label: 'deptName',
  children: 'children',
};
const deptTreeData = ref<AuthTreeItem[]>([])
const buildDeptTreeData = () => {
  const selectedMap = status.selectedDept;
  const deptData = deptService.treeData || []
  const dataMap: Record<string, AuthTreeItem> = {}
  const keyword = status.skeyword
  const toNewItem = (item: TreeDept) => {
    const authData: AgentBrainAuthItem | undefined = selectedMap.get(item.deptId!)
    const newItem: AuthTreeItem & HoldType = {
      ...item,
      name: item.deptName! || '',
      sname: item.deptName!.toLowerCase() || '',
      checked: !!authData,
    }
    let hold = false
    if (keyword) {
      if (newItem.sname.includes(keyword)) {
        hold = true
      }
    } else {
      hold = true
    }
    newItem.hold = hold
    dataMap[item.deptId!] = newItem
    if (authData) {
      newItem.authDataId = authData.id
    }
    if (item.children) {
      newItem.children = item.children.map(toNewItem)
    }
    if (newItem.hold && newItem.parentId) {
      const parentItem: AuthTreeItem & HoldType = dataMap[newItem.parentId!]
      if (parentItem) {
        parentItem.hold = true
      }
    }
    return newItem
  }
  const newDeptData = deptData.map(toNewItem)

  const filterNotHolds = (items: HoldType[]) => {
    return items.filter((item) => {
      const hold = item.hold;
      if (hold) {
        if (item.children) {
          item.children = filterNotHolds(item.children)
          if (item.children.length === 0) {
            delete item.children
          }
        }
        return true
      }
      return false
    })
  }
  deptTreeData.value = filterNotHolds(newDeptData)
};

const listData = ref<AuthPositionItem[] | AuthGroupItem[]>([])
const buildPositionData = () => {
  const selectedMap = status.selectedPosition;
  const positionData = positionService.listData || []
  const keyword = status.skeyword
  const newPositionData: AuthPositionItem[] = [];
  const toNewItem = (item: PositionEntity) => {
    const sname = item.postName!.toLowerCase() || ''
    if (keyword && !sname.includes(keyword)) {
      return null
    }
    const authData: AgentBrainAuthItem | undefined = selectedMap.get(item.postId!)
    const newItem: AuthPositionItem = {
      ...item,
      checked: !!authData,
      name: item.postName! || '',
      detail: item.remark! || '',
    }
    if (authData) {
      newItem.authDataId = authData.id
    }
    return newItem
  }
  positionData.forEach((item: PositionEntity) => {
    const newItem = toNewItem(item)
    if (newItem) {
      newPositionData.push(newItem)
    }
  })
  listData.value = newPositionData
}
const buildGroupData = () => {
  const selectedMap = status.selectedGroup;
  const groupData = groupService.listData || []
  const keyword = status.skeyword
  const newGroupData: AuthGroupItem[] = [];
  const toNewItem = (item: GroupEntity) => {
    const sname = item.groupName!.toLowerCase() || ''
    if (keyword && !sname.includes(keyword)) {
      return null
    }
    const authData: AgentBrainAuthItem | undefined = selectedMap.get(`${item.id!}`)

    const newItem: AuthGroupItem = {
      ...item,
      checked: !!authData,
      name: item.groupName! || '',
      // sname: sname,
      detail: item.remark! || '',
    }
    if (authData) {
      newItem.authDataId = authData.id
    }
    return newItem
  }
  groupData.forEach((item: GroupEntity) => {
    const newItem = toNewItem(item)
    if (newItem) {
      newGroupData.push(newItem)
    }
  })
  console.log('newGroupData', newGroupData)
  listData.value = newGroupData
}

const handleByType = (deptHandler: () => void, positionHandler: () => void, groupHandler: () => void) => {
  const type = status.type
  if (type === AuthTypes.DEPT) {
    deptHandler()
  }
  else if (type === AuthTypes.POST) {
    positionHandler()
  }
  else if (type === AuthTypes.USERGROUP) {
    groupHandler()
  }
}

const handleAdd = () => {
  handleByType(handleAddDept, handleAddPosition, handleAddGroup)
}
const handleAddDept = () => {
  const newSelected: AgentBrainAuthItem[] = [];
  walkTreeData(deptTreeData.value, (item: AuthTreeItem) => {
    if (item.checked) {
      const newItem: AgentBrainAuthItem = {
        authId: item.deptId!,
        authType: AuthTypes.DEPT,
      }
      if (item.authDataId) {
        newItem.id = item.authDataId
      }
      newSelected.push(newItem)
    }
  })
  if (newSelected.length === 0) {
    ElMessage.warning('请选择要关联的部门')
    return
  }
  context.permission.deptList = newSelected
  context.showPermissionModal = false
}
const handleAddPosition = () => {
  const newSelected: AgentBrainAuthItem[] = [];
  walkTreeData(listData.value, (item: AuthPositionItem) => {
    if (item.checked) {
      const newItem: AgentBrainAuthItem = {
        authId: item.postId!,
        authType: AuthTypes.POST,
      }
      if (item.authDataId) {
        newItem.id = item.authDataId
      }
      newSelected.push(newItem)
    }
  })
  if (newSelected.length === 0) {
    ElMessage.warning('请选择要关联的岗位')
    return
  }
  context.permission.positionList = newSelected
  context.showPermissionModal = false
}
const handleAddGroup = () => {
  const newSelected: AgentBrainAuthItem[] = [];
  walkTreeData(listData.value, (item: AuthGroupItem) => {
    if (item.checked) {
      const newItem: AgentBrainAuthItem = {
        authId: Number(item.id!),
        authType: AuthTypes.USERGROUP,
      }
      if (item.authDataId) {
        newItem.id = item.authDataId
      }
      newSelected.push(newItem)
    }
  })
  if (newSelected.length === 0) {
    ElMessage.warning('请选择要关联的用户组')
    return
  }
  context.permission.groupList = newSelected
  context.showPermissionModal = false
}

let debounceTimer: any = null
const debounceDelay = 300
const handleDelaySearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(doHandleSearch, debounceDelay)
}

const handleTypeChange = () => {
  status.keyword = ''
  status.skeyword = ''
  handleByType(initDept, initPosition, initGroup)
}
const initDept = () => {
  deptService.load().then(buildDeptTreeData)
}
const initPosition = () => {
  positionService.load().then(buildPositionData)
}
const initGroup = () => {
  groupService.load().then(buildGroupData)
}
const rebuildData = () => {
  handleByType(buildDeptTreeData, buildPositionData, buildGroupData)
}

const doHandleSearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  const keyword = status.keyword.trim().toLowerCase()
  status.skeyword = keyword;
  rebuildData()
}

const handleDeptTreeSubClick = (data: TreeDept) => {
  const newChecked = !data.checked
  data.checked = newChecked
  walkTreeData(data.children, (item: TreeDept) => {
    item.checked = newChecked
  })
  // handleDeptTreeCheckChange(data, false)
};
// const handleDeptTreeItemClick = (data: TreeDept) => {
//   const newChecked = !data.checked
//   data.checked = newChecked
//   // handleDeptTreeCheckChange(data, true)
// };
// const handleDeptTreeCheckClick = (data: TreeDept) => {
//   handleDeptTreeCheckChange(data, true)
// };
const toggleChecked = (data: { checked: boolean }) => {
  data.checked = !data.checked
}


const isCandidateAdded = (name: string) => {
  const formData = context.permission;
  return formData.list.some((item: any) => item.name === name)
}
const handleAddCandidate = (candidate: AuthPositionItem | AuthGroupItem) => {
  candidate.checked = !candidate.checked
}
const onOpen = () => {
  status.type = AuthTypes.DEPT
  status.keyword = ''
  status.skeyword = ''
  const selectedDept = new Map();
  const selectedPosition = new Map();
  const selectedGroup = new Map();
  context.permission.deptList.forEach((item: AgentBrainAuthItem) => {
    selectedDept.set(item.authId!, item)
  })
  context.permission.positionList.forEach((item: AgentBrainAuthItem) => {
    selectedPosition.set(item.authId!, item)
  })
  context.permission.groupList.forEach((item: AgentBrainAuthItem) => {
    selectedGroup.set(`${item.authId!}`, item)
  })
  status.selectedDept = selectedDept
  status.selectedPosition = selectedPosition
  status.selectedGroup = selectedGroup
  handleTypeChange()
}

</script>
<style scoped lang="scss">
// .el-select.w-48 {
//   width: calc(var(--spacing) * 48);
// }
.dept-tree {
  --el-tree-node-content-height: 40px;
  --el-tree-node-hover-bg-color: rgba(235, 243, 245, 0.6);
}

.list-container {
  padding: 0;
  border: none;
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  // background: #F5F5FF;
  border-radius: 12px;
  border: 1px solid #E6EBF0;
  min-width: 0;
  cursor: pointer;

  &:hover {
    background-color: rgba(235, 243, 245, 0.6);
  }

  .list-row-main {
    flex-grow: 1;
    min-width: 0;
    line-height: 20px;
    font-size: 14px;
    text-align: left;

    .list-row-text-0 {
      color: #2B2F33;
    }

    .list-row-text-1 {
      color: #B0BAC6;
      margin-top: 8px;
    }
  }
}

.tree-btn {
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 106px;
  height: 32px;
  line-height: 1;
  background: #EBF3F5;
  border-radius: 8px 8px 8px 8px;
  color: var(--el-color-primary);
  font-size: 14px;
}

.checked-btn {
  gap: 5px;
}

.apply-btn {
  width: 124px;
}

.apply-btn2 {
  width: 124px;
  background: #F5F5FF;
  color: #2015B9;
}
</style>