<template>
  <Dialog v-model:open="context.task.showTaskModal" @open="onOpen">
    <DialogContent :title="status.title" class="max-w-xl">
      <el-form class="w-full task-form" :model="taskForm" :rules="taskFormRules" ref="formRef" label-position="top">
        <el-card class="add-card br20">
          <div class="add-card-fields">
            <el-form-item prop="taskName">
              <template #label>
                <span>任务名称</span>
              </template>
              <el-input v-model="taskForm.taskName" placeholder="输入任务名称，如：每周巡检报表发送" class="s-input" />
            </el-form-item>
            <el-form-item prop="content">
              <template #label>
                <span>任务指令</span>
              </template>
              <div class="textarea-box" ref="wrapRef">
                <el-input type="textarea" ref="textAreaRef" v-model="taskForm.content" rows="4"
                  @input="handleContentInput"
                  placeholder="请输入指令，智能体将被唤醒并根据此指令自主调用各项工具或能力。例如：'查询本周所有办公区的巡检记录并汇总异常发送给行政主管'。" class="s-input" />
                <GlobalFloatPopup v-model:visible="showPopup" :left="popLeft" :top="popTop" :width="popWidth">
                  <SelectMember v-if="keyChar === '@'" @items="handleSelectMutiMember"
                    @item="handleSelectSingleMember" />
                  <SelectSkill v-if="keyChar === '/'" @item="handleSelectSkill" />
                </GlobalFloatPopup>
              </div>
            </el-form-item>
          </div>
          <div class="content-tip">
            <svg-icon icon-class="mp-info" class="content-tip-icon" />
            输入/快速选择工具与能力&nbsp;&nbsp;输入@指派所有人/部门/岗位/用户/用户组
          </div>
        </el-card>
        <el-card class="time-card br20">
          <el-form-item prop="startDate" label="日期" label-position="top">
            <template #label>
              <span>日期</span>
              <span class="sub-label">执行日期：{{ taskForm.startDate }}</span>
            </template>
            <el-date-picker v-model="taskForm.startDate" type="date" class="w-full"
              :disabled-date="startDateDisabledDate" value-format="YYYY-MM-DD" format="YYYY-MM-DD"
              placeholder="请选择一个日期" />
          </el-form-item>
          <el-form-item prop="startTime" label="时间" label-position="top">
            <template #label>
              <span>时间</span>
              <span class="sub-label">触发时刻：{{ taskForm.startTime }}</span>
            </template>
            <el-time-picker v-model="taskForm.startTime" class="w-full" value-format="HH:mm" format="HH:mm"
              placeholder="请选择时间" />
          </el-form-item>
          <el-form-item prop="execType" label="重复" label-position="top" :class="{
            'execType-x': [ExecTypes.Daily, ExecTypes.Weekly, ExecTypes.Monthly].includes(taskForm.execType)
          }">
            <el-select-v2 v-model="taskForm.execType" :options="taskFormExecTypeOptions" @change="handleChangeExecType"
              placeholder="请选择">
            </el-select-v2>
          </el-form-item>
          <template v-if="taskForm.execType === ExecTypes.Daily">
            <el-form-item prop="repeatPeriod" label="" label-position="top">
              <div class="repeat-period">
                <div class="more-prefix">每</div>
                <div class="more-main">
                  <el-input-number v-model="taskForm.repeatPeriod" :min="1" :step="1" placeholder="请输入重复间隔"
                    class="w-full" />
                </div>
                <div class="more-suffix">天</div>
              </div>
              <div class="repeat-period-tip">
                <span>预计重复规则：</span><span class="red">每{{
                  taskForm.repeatPeriod === 1 ? '' : taskForm.repeatPeriod
                }}天</span>
              </div>
            </el-form-item>
          </template>
          <template v-else-if="taskForm.execType === ExecTypes.Weekly">
            <el-form-item prop="repeatPeriod" label="" label-position="top">
              <div class="w-full">
                <div class="repeat-period">
                  <div class="more-prefix">每</div>
                  <div class="more-main">
                    <el-input-number v-model="taskForm.repeatPeriod" :min="1" :step="1" placeholder="" class="w-full" />
                  </div>
                  <div class="more-suffix">周</div>
                </div>
              </div>
            </el-form-item>
            <el-form-item prop="repeatTimeWeeks" label="" label-position="top">
              <el-card class="br20">
                <div>执行周天</div>
                <div>
                  <el-checkbox-group v-model="taskForm.repeatTimeWeeks" class="w-full">
                    <el-checkbox v-for="item in repeatTimeWeekOptions" :key="item.value" :label="item.value">{{
                      item.label }}</el-checkbox>
                  </el-checkbox-group>
                </div>
              </el-card>
              <div class="repeat-period-tip repeat-period-tip2">
                <span>预计重复规则：</span><span class="red">每{{
                  taskForm.repeatPeriod === 1 ? '' : taskForm.repeatPeriod
                }}周的{{
                    repeatTimeWeekOptions.filter((i: any) => taskForm.repeatTimeWeeks.includes(i.value)).map((i: any) =>
                      i.title).join('、')
                  }}</span>
              </div>
            </el-form-item>
          </template>
          <template v-else-if="taskForm.execType === ExecTypes.Monthly">
            <el-form-item prop="repeatPeriod" label="" label-position="top">
              <div class="w-full">
                <div class="repeat-period">
                  <div class="more-prefix">每</div>
                  <div class="more-main">
                    <el-input-number v-model="taskForm.repeatPeriod" :min="1" :step="1" placeholder="" class="w-full" />
                  </div>
                  <div class="more-suffix">个月</div>
                </div>
              </div>
            </el-form-item>
            <el-form-item prop="repeatTimeMonthDays" label="" label-position="top">
              <el-card class="br20">
                <div>按日期</div>
                <div>
                  <el-checkbox-group v-model="taskForm.repeatTimeMonthDays" class="w-full">
                    <el-checkbox v-for="item in repeatTimeMonthDayOptions" :key="item.value" :label="item.value">{{
                      item.label }}</el-checkbox>
                  </el-checkbox-group>
                </div>
              </el-card>
              <div class="repeat-period-tip repeat-period-tip2">
                <span>预计重复规则：</span><span class="red">每{{
                  taskForm.repeatPeriod === 1 ? '' : taskForm.repeatPeriod
                }}个月的第{{
                    taskForm.repeatTimeMonthDays.join('、')
                  }}日</span>
              </div>
            </el-form-item>
          </template>

          <el-form-item prop="endDate" label="结束重复" label-position="top">
            <el-select-v2 v-model="taskForm.endExecType" :options="taskFormEndExecTypeOptions">
            </el-select-v2>
            <div v-if="taskForm.endExecType === EndExecTypes.Date" class="end-date-row">
              <el-date-picker class="w-full" v-model="taskForm.endDate" :disabled-date="endExecTypeDisabledDate"
                type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" placeholder="请选择一个日期" />
            </div>
          </el-form-item>
          <!-- <el-form-item prop="endDate" label="结束日期">
            <template #label>
              &nbsp;
            </template>
            
          </el-form-item> -->
        </el-card>
        <div v-hasPermi="['agentic:brain:edit']" class="flex justify-end pt-4 border-t border-slate-100">
          <!-- <Button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            @click.prevent="handleSaveTask">{{ 
              context.task.isAdd ? '添加到任务日历' : '确认修改当前任务'
            }}</Button> -->
          <btn type="primary" @click.prevent="handleSaveTask" round>{{
            context.task.isAdd ? '添加到任务日历' : '确认修改当前任务'
          }}</btn>
        </div>
      </el-form>
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
// import DomainSelect from '@/components/common/DomainSelect.vue'

import GlobalFloatPopup from '@/components/GlobalFloatPopup/index.vue'
import { useTextareaPopup } from '@/components/GlobalFloatPopup/useTextareaPopup'
import SelectMember from './task/SelectMember.vue'
import SelectSkill from './task/SelectSkill.vue'

// import { addAgent } from '@/lib/agent-store'
import {
  addBusinessAgentBrainApi,
  addFkBusinessAgentBrainTaskApi,
  getAgentBrainTaskDetailApi,
  updateBusinessAgentBrainTaskApi,
} from '@/api/agentic/agentBrain'

import type { AgentBrainSaveTask, AgentBrainSkillItem, AgentBrainTaskItem, AgentBrainTaskItemParams, AgentBrainTaskPerson, SkillVO } from '@/types'
import { EndExecTypes, ExecTypes } from './task/task'
// import type { SkillEntity } from '@/service/skillService'

import type { MemtionItem } from './task/task'

const { proxy } = getCurrentInstance();
const context = inject('agentFormContext')

interface ClientTaskForm extends AgentBrainTaskItemParams {
  startTime: string;
  endExecType: number;
  repeatTimeWeeks: string[];
  repeatTimeMonthDays: string[];
}
const formRef = ref(null)
const newTask = (): ClientTaskForm => {
  return {
    taskName: '',
    content: '',
    startDate: '',
    startTime: '',
    execType: undefined, // number
    endExecType: EndExecTypes.Never, // number
    repeatPeriod: 1, // number
    repeatTimeWeeks: [],
    repeatTimeMonthDays: [],
    endDate: '',
    enable: 1,
  }
}
const taskForm = reactive<ClientTaskForm>(newTask());
const taskFormRules = reactive({
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  content: [{ required: true, message: '请输入指令', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择日期', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择时间', trigger: 'blur' }],
  endDate: [{
    validator: (rule: any, value: string, callback: any) => {
      if (taskForm.endExecType !== EndExecTypes.Date) {
        callback()
        return
      }
      if (!value) {
        callback(new Error('请选择结束日期'))
      } else {
        callback()
      }
    }, trigger: 'blur'
  }],
  // execType: [{ validator: (rule: any, value: number, callback: any) => {
  //   if (value === ExecTypes.Never) {
  //     callback()
  //     return
  //   }
  //   const taskFormValue = taskForm
  //   if (!(taskFormValue.repeatPeriod > 0)) {
  //     callback(new Error('请选择重复间隔'))
  //   }
  //   callback()
  // }, trigger: 'blur' }],
  repeatPeriod: [{
    validator: (rule: any, value: number, callback: any) => {
      const taskFormValue = taskForm
      if (taskFormValue.execType === ExecTypes.Never) {
        callback()
        return
      }
      if (!(value > 0)) {
        callback(new Error('请选择重复间隔'))
      }
      callback()
    }, trigger: 'blur'
  }],
  repeatTimeWeeks: [{ required: true, message: '请选择执行周天', trigger: 'change' }],
})
const taskFormExecTypeOptions = [
  { label: '永不', value: ExecTypes.Never, },
  { label: '每天', value: ExecTypes.Daily, },
  { label: '每周', value: ExecTypes.Weekly, },
  { label: '每月', value: ExecTypes.Monthly, },
  { label: '每年', value: ExecTypes.Yearly, },
]
const taskFormEndExecTypeOptions = [
  { label: '永不', value: EndExecTypes.Never, },
  { label: '指定日期', value: EndExecTypes.Date },
]
const repeatTimeWeekOptions = [
  { label: '周一', value: '1', title: '星期一' },
  { label: '周二', value: '2', title: '星期二' },
  { label: '周三', value: '3', title: '星期三' },
  { label: '周四', value: '4', title: '星期四' },
  { label: '周五', value: '5', title: '星期五' },
  { label: '周六', value: '6', title: '星期六' },
  { label: '周日', value: '7', title: '星期日' },
]
const repeatTimeMonthDayOptions = [
  { label: '1号', value: '1', }
]
for (let i = 2; i <= 31; i++) {
  repeatTimeMonthDayOptions.push({ label: `${i}号`, value: i.toString() })
}



const serverToClient = (item: AgentBrainTaskItem): ClientTaskForm => {
  const clientItem: AgentBrainTaskItem = { ...item }
  const serverStartDate = clientItem.startDate || ''
  const startParts = serverStartDate.split(' ');
  const startDate = startParts[0] || ''
  const startTime = startParts[1] || ''
  const repeatTime = clientItem.repeatTime || ''
  const repeatTimeParts = repeatTime.split(',')
  const execType = clientItem.execType;
  let repeatTimeWeeks: string[] = []
  let repeatTimeMonthDays: string[] = []
  if (execType === ExecTypes.Weekly) {
    repeatTimeWeeks = repeatTimeParts
  }
  else if (execType === ExecTypes.Monthly) {
    repeatTimeMonthDays = repeatTimeParts
  }
  let endExecType: number = EndExecTypes.Never
  if (clientItem.endDate) {
    endExecType = EndExecTypes.Date
  }

  const taskPersons = clientItem.persons || []
  taskPersons.forEach((item: AgentBrainTaskPerson) => {
    // item.type = item.personType
    // item.dataId = item.personId
    // item.name = item.personName || item.name
    const memtionItem: MemtionItem = {
      // id: item.id,
      name: item.personName || '',
      dataId: item.personId?.toString() || '',
    }
    insertedPersonMap.value.set(item.personId + '', memtionItem)
  })
  const taskSkills = clientItem.skills || []
  taskSkills.forEach((item: AgentBrainSkillItem) => {
    const memtionItem: MemtionItem = {
      // id: item.id,
      name: item.name || '',
      dataId: item.id?.toString() || '',
    }
    insertedSkillMap.value.set(memtionItem.dataId, memtionItem)
  })

  return {
    ...item,
    endExecType: endExecType,
    startTime: startTime,
    startDate: startDate,
    repeatTimeWeeks: repeatTimeWeeks,
    repeatTimeMonthDays: repeatTimeMonthDays,
  }
}
const clientToServer = (item: ClientTaskForm): AgentBrainTaskItemParams => {
  const serverItem: AgentBrainTaskItemParams = {}
  serverItem.taskName = item.taskName
  serverItem.content = item.content
  serverItem.startDate = item.startDate
  if (item.startTime) {
    serverItem.startDate += ` ${item.startTime}`
  }
  const execType = item.execType;
  if (execType === ExecTypes.Weekly) {
    serverItem.repeatTime = item.repeatTimeWeeks?.join(',')
  }
  else if (execType === ExecTypes.Monthly) {
    serverItem.repeatTime = item.repeatTimeMonthDays?.join(',')
  }
  else {
    serverItem.repeatTime = ''
  }
  serverItem.execType = execType
  serverItem.repeatPeriod = item.repeatPeriod
  if (item.endExecType === EndExecTypes.Date) {
    serverItem.endDate = item.endDate
  }
  else {
    serverItem.endDate = ''
  }
  serverItem.enable = item.enable
  serverItem.taskPersons = buildTaskPersons();
  serverItem.skillIds = buildTaskSkillIds();
  return serverItem
}

const buildTaskPersons = (): AgentBrainTaskPerson[] => {
  const taskPersons: AgentBrainTaskPerson[] = []
  const mapValue: Map<string, MemtionItem> = insertedPersonMap.value
  // console.log('mapValue', mapValue)
  const content = taskForm.content || '';
  for (const [item, memtionItem] of mapValue) {
    if (!memtionItem) {
      break;
    }
    const keytext = `@${memtionItem.name} `
    if (content.includes(keytext)) {
      taskPersons.push({
        personId: +item,
        // personName: item.name,
        personType: memtionItem.type,
      })
    }
  }
  return taskPersons
}
const buildTaskSkillIds = (): number[] => {
  const skillIds: number[] = []
  const mapValue: Map<string, MemtionItem> = insertedSkillMap.value
  // console.log('mapValue', mapValue)
  const content = taskForm.content || '';
  for (const [item, memtionItem] of mapValue) {
    if (!memtionItem) {
      break;
    }
    const keytext = `/${memtionItem.name} `
    if (content.includes(keytext)) {
      skillIds.push(+item)
    }
  }
  return skillIds
}

const handleChangeExecType = (val: number) => {
  if (val === ExecTypes.Monthly) {
    proxy.$modal.alertWarning('若您选择的执行日期在部分月份不存在，当月存在该日期则正常执行；当月无对应日期时，该日期任务将直接跳过，不自动顺延，请知悉。')
  }
}
const startDate = computed(() => {
  const startDate = taskForm.startDate || ''
  if (!startDate) {
    return null;
  }
  return new Date(startDate.replace('-', '/'))
})
const endExecTypeDisabledDate = (date: Date) => {
  const startDateValue = startDate.value
  if (!startDateValue) {
    return false;
  }
  return date.getTime() < startDateValue.getTime()
}
const endDate = computed(() => {
  const endDate = taskForm.endDate || ''
  if (!endDate) {
    return null;
  }
  return new Date(endDate.replace('-', '/'))
})
const startDateDisabledDate = (date: Date) => {
  if (taskForm.endExecType != EndExecTypes.Date) {
    return false;
  }
  if (!endDate.value) {
    return false;
  }
  return date.getTime() > endDate.value.getTime()
}


const status = reactive({
  title: '新建自动任务',
  type: '',
  keyword: '',
})

const { popLeft, popTop, showPopup, keyChar, watchInput, appendAfter } = useTextareaPopup()
const wrapRef = ref(null)
const textAreaRef = ref(null)
const popWidth = ref('220px');

const handleContentInput = (val: string) => {
  const elInput = textAreaRef.value
  var inputNode = elInput.input || elInput.textarea
  watchInput(val, inputNode);
}

// 选中插入
const handleSelect = (str: string, char: string="@") => {
  const elInput = textAreaRef.value
  var inputNode = elInput.input || elInput.textarea
  taskForm.content = appendAfter(inputNode, taskForm.content, str, char)
}
const insertedPersonMap: Ref<Map<string, MemtionItem>> = ref(null)
const handleSelectMutiMember = (items: MemtionItem[]) => {
  // console.log('handleSelectMutiMember', items)
  let str = items[0].name + ' '
  let testExistStr = `@${str}`;
  let content = taskForm.content || '';
  if (content.includes(testExistStr)) {
    str = '';
  } else {
    insertedPersonMap.value.set(items[0].dataId, items[0])
  }
  for (var i = 1; i < items.length; i++) {
    testExistStr = `@${items[i].name} `
    if (!content.includes(testExistStr)) {
      str += testExistStr
      insertedPersonMap.value.set(items[i].dataId, items[i])
    }
  }
  handleSelect(str, '@')
}
const handleSelectSingleMember = (item: MemtionItem) => {
  // console.log('handleSelectSingleMember', item)
  let content = taskForm.content || '';
  if (!content.includes(`@${item.name} `)) {
    handleSelect(item.name + ' ', '@')
    insertedPersonMap.value.set(item.dataId, item)
  }
  // showPopup.value = false
}
const insertedSkillMap: Ref<Map<string, MemtionItem>> = ref(null)
const handleSelectSkill = (item: MemtionItem) => {
  // console.log('handleSelectSkill', item)
  let content = taskForm.content || '';
  let testExistStr = `/${item.name} `
  if (!content.includes(testExistStr)) {
    handleSelect(item.name + ' ', '/')
    insertedSkillMap.value.set(item.dataId, item)
  }
  showPopup.value = false
}

const doAddTask = (params: AgentBrainTaskItem) => {
  addFkBusinessAgentBrainTaskApi(params)
    .then(res => {
      if (res?.code === 200) {
        ElMessage.success('添加成功')
        context.task.showTaskModal = false
        context.task.refreshList?.()
        context.applyTask()
      }
    }, (err) => {
      console.log(err)
      ElMessage.error('添加失败')
    })
}

const doUpdateTask = (params: AgentBrainTaskItem) => {
  updateBusinessAgentBrainTaskApi(params).then(res => {
    if (res.code === 200) {
      ElMessage.success('更新成功')
      context.task.showTaskModal = false
      context.task.refreshList?.()
    }
  })
}

const doSaveTask = () => {
  const params: AgentBrainSaveTask = {}
  const serverItem = clientToServer(taskForm)
  params.task = serverItem
  params.id = context.id
  if (context.task.isAdd) {
    doAddTask(params)
  } else {
    serverItem.id = context.task.taskItem.id
    doUpdateTask(params)
  }
}

const handleSaveTask = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      doSaveTask()
    }
  })
}

const getByIdOrDefault = () => {
  const contextTask = context.task;
  const taskItem = contextTask.taskItem
  if (contextTask.isAdd) {
    return taskItem
  }
  return getAgentBrainTaskDetailApi(taskItem.id).then(res => {
    if (res.code === 200) {
      return res.data
    }
    return taskItem
  }, () => {
    return taskItem
  })
}

const onOpen = async () => {
  insertedPersonMap.value = new Map()
  insertedSkillMap.value = new Map()
  const taskItem = await getByIdOrDefault()
  const formData = context.task;
  if (formData.isAdd) {
    status.title = '新建自动任务'
    Object.assign(taskForm, newTask())
  } else {
    status.title = '编辑当前任务'
    Object.assign(taskForm, serverToClient(taskItem))
  }
  setTimeout(() => {
    const wrapNode = wrapRef.value
    if (wrapNode) {
      const rect = wrapNode.getBoundingClientRect()
      popWidth.value = `${rect.width}px`
    }
  }, 1000)
}
</script>
<style scoped lang="scss">
.br20 {
  border-radius: 20px;
}

.add-card {
  :deep(.el-card__body) {
    padding: 0px !important;
  }

  .add-card-fields {
    padding: 15px 20px 0;
  }

  margin-bottom: 20px;
}

.time-card {
  :deep(.el-form-item__label:before) {
    display: none;
  }
}

.textarea-box {
  width: 100%;
  // position: relative;
}

.s-input {
  // :deep(.el-input__wrapper) {
  //   box-shadow: none;
  // }

  // :deep(.el-textarea__inner) {
  //   box-shadow: none;
  // }

  width: 100%;
}

.content-tip {
  font-size: 12px;
  color: #909399;
  line-height: 40px;
  text-indent: 2em;
  background-color: #f9f9f9;

  .content-tip-icon {
    font-size: 20px;
    vertical-align: text-bottom;
    top: 2px;
  }
}

.sub-label {
  font-size: 12px;
  color: #aaa;
  line-height: 20px;
  margin-left: 12px;
}

.end-date-row {
  margin-top: 10px;
  width: 100%;
}

.execType-x {
  margin-bottom: 5px;
}

.repeat-period {
  // margin-top: 10px;
  display: flex;
  align-items: center;
  width: 100%;
  background-color: #f9f9f9;

  .more-prefix {
    margin-right: 5px;
    width: 30px;
    text-align: center;
  }

  .more-main {
    flex-grow: 1;
  }

  .more-suffix {
    margin-left: 5px;
    width: 30px;
    text-align: center;
  }
}

.repeat-period-tip {
  width: 100%;
  margin-top: 5px;
  font-size: 12px;
  color: #6c7484;
  line-height: 30px;
  text-align: center;
  border-radius: 5px;
  background-color: #ecebf0;

  .red {
    // color: #f86767;
    color: var(--el-color-primary);
  }
}

.repeat-period-tip2 {
  margin-top: 10px;
}

.task-form {
  :deep(.w-full) {
    width: 100%;
  }
}
</style>