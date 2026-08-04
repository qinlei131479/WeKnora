<template>
  <Card class="form-view flex flex-col border-slate-200 overflow-hidden bg-white" style="min-height: 600px">
    <div class="flex items-center justify-between p-4 border-b border-slate-200">
      <div class="flex items-center gap-4">
        <h2 class="task-form-title">所有自动任务</h2>
        <radio-group v-model="formData.taskViewMode" @change="refreshList">
          <el-radio-button value="calendar">
            <Calendar class="w-4 h-4 svg-icon-style" /> 日历
          </el-radio-button>
          <el-radio-button value="list">
            <List class="w-4 h-4 svg-icon-style" /> 列表
          </el-radio-button>
        </radio-group>
        <!-- <div class="flex items-center bg-slate-100 rounded-lg p-1">
          <button
            :class="['cursor-pointer px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2', formData.taskViewMode === 'calendar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700']"
            @click="formData.taskViewMode = 'calendar'; searchCalendarTaskList()">
            <Calendar class="w-4 h-4" /> 日历
          </button>
          <button
            :class="['cursor-pointer px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2', formData.taskViewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700']"
            @click="formData.taskViewMode = 'list'; searchNormalListTask()">
            <List class="w-4 h-4" /> 列表
          </button>
        </div> -->
      </div>
      <div class="flex items-center gap-2">
        <!-- <div v-if="formData.taskViewMode === 'calendar'"
          class="flex items-center gap-2 mr-4 text-slate-600 font-medium text-xs">
          <Button variant="ghost" size="icon" class="h-8 w-8">
            <ChevronLeft class="w-4 h-4" />
          </Button>
          2026年 6月
          <Button variant="ghost" size="icon" class="h-8 w-8">
            <ChevronRight class="w-4 h-4" />
          </Button>
        </div> -->
        <!-- <Button size="sm" class="h-8 shadow-sm bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold"
          v-hasPermi="['agentic:brain:edit']"
          @click="handleAddTask">
          <Plus class="w-3.5 h-3.5 mr-1" /> 新建自动任务
        </Button> -->
        <btn v-hasPermi="['agentic:brain:edit']" type="success" @click="handleAddTask" round>
          <Plus class="w-3.5 h-3.5 mr-1" /> 新建自动任务
        </btn>
      </div>
    </div>

    <div v-if="formData.taskViewMode === 'calendar'" class="flex-1 flex flex-col p-4 bg-slate-50">
      <el-calendar v-model="selectedDate">
        <template #date-cell="{ data }">
          <TaskCalendarCell :date="data.date" :type="data.type" :day-tasks="getDayTasks(data.date)"
            :more="isSameDate(data.date, showMoreDate)" @click="handleCalendarCellClick(data.date, $event)"
            @more="handleCalendarCellMore(data.date)" @itemClick="handleItemClick" />
        </template>
      </el-calendar>
    </div>

    <div v-else class="flex-1 p-6 bg-slate-50 overflow-y-auto">
      <div class="space-y-4">
        <div v-for="trigger in tableData" :key="trigger.id" class="list-row">
          <div class="list-item-main">
            <div class="list-icon">
              <svg-icon icon-class="mp-task" />
            </div>
            <div class="list-item-texts">
              <div class="list-item-name-row">
                <!-- <div class="list-item-text-0 truncate">{{ trigger.taskName }}</div> -->
                <el-tooltip :content="trigger.taskName" placement="top" popper-class="tooltip-short">
                  <div class="list-item-text-0 truncate">{{ trigger.taskName }}</div>
                </el-tooltip>
                <div class="list-item-start-date">{{ trigger.startDate }}</div>
              </div>
              <el-tooltip :content="trigger.content" placement="top" popper-class="tooltip-short">
                <div class="list-item-text-1 truncate">{{ trigger.content }}</div>
              </el-tooltip>
            </div>
          </div>
          <div class="list-ops">
            <el-switch v-model="trigger.enable" size="small" @change="handleEnableChange(trigger)" :active-value="1"
              :inactive-value="0" />
            <el-button class="edit-btn" size="small" @click="handleEdit(trigger)">编辑</el-button>
            <el-button class="delete-btn" size="small" @click="handleDelete(trigger)">删除</el-button>
          </div>
          <!-- <div
            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-indigo-50 border border-indigo-100 text-indigo-500">
            <Clock class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <h3 class="font-bold text-slate-800 text-sm">{{ trigger.taskName }}</h3>
              <div class="flex items-center gap-2">
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 uppercase">
                  {{ trigger.startDate }}
                </span>
                <el-switch v-model="trigger.enable" size="small" @change="handleEnableChange(trigger)" :active-value="1"
                  :inactive-value="0" />
              </div>
            </div>
            <p class="text-xs text-slate-500 mb-2 font-medium">{{ trigger.content }}</p>
            <div class="flex gap-2">
              <Button variant="ghost" size="sm" @click="handleEdit(trigger)"
                class="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50 font-bold">编辑</Button>
              <Button variant="ghost" size="sm" @click="handleDelete(trigger)"
                class="h-6 px-2 text-xs text-rose-500 hover:bg-rose-50 font-bold">删除</Button>
            </div>
          </div> -->
        </div>
      </div>
      <Pagination :total="total" v-model:page="page.pageNum" v-model:limit="page.pageSize" :page-sizes="[5, 10, 20, 50]"
        @pagination="searchNormalListTask" />
    </div>
  </Card>
  <TaskDialog />
</template>
<script setup lang="ts">
import {
  Save, Plus, Clock, Zap, Search, Bot, Database, Calendar, List, ChevronLeft, ChevronRight, Shield, User, BookOpen, Wrench, Trash, ArrowLeft
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import TaskDialog from './TaskDialog.vue'
import TaskCalendarCell from './task/TaskCalendarCell.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  deleteBusinessAgentBrainTaskApi,
  disableBusinessAgentBrainTaskApi,
  enableBusinessAgentBrainTaskApi,
  getAgentBrainCalendarTasksApi,
  getAgentBrainListTasksApi
} from '@/api/agentic/agentBrain'

import type { AgentBrainTaskCalenderData, AgentBrainTaskCalenderItem, AgentBrainTaskItem, AgentBrainTaskQueryParams, AjaxResult, PageDomain, TableDataInfo } from '@/types'
import { parseTime } from '@/utils/ruoyi.js'
import { CalendarDayTasks } from './task/task'

const { proxy } = getCurrentInstance();
const isDev = import.meta.env.DEV;
const context = inject('agentFormContext')
const formData = computed(() => context.task);

const calendarTask = ref<AgentBrainTaskCalenderData>({});
const dayTaskMap = ref<Record<string, AgentBrainTaskCalenderItem>>({});
const selectedDate = ref<Date>(new Date());
const selectedMonth = computed(() => {
  return selectedDate.value.getMonth() + 1;
});
const showMoreDate = ref<Date>(null);

const searchCalendarTaskList = () => {
  const date = selectedDate.value;
  const year = date.getFullYear();
  const monthNum = date.getMonth() + 1;
  const monthStr = monthNum > 9 ? monthNum.toString() : '0' + monthNum;
  const params: AgentBrainTaskQueryParams = {
    agenticId: context.id,
    date: `${year}-${monthStr}`,
  };
  getAgentBrainCalendarTasksApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      const data: AgentBrainTaskCalenderData = res.data || {};
      const map: Record<string, AgentBrainTaskCalenderItem> = {};
      if (!data.calenderList) {
        data.calenderList = []
      }
      if (isDev) {
        let taskList = [
          {
            id: 1,
            taskName: '测试任务',
            startDate: '2023-01-01 00:00:00',
            endDate: '2023-01-01 10:00:00',
            status: 0,
          },
          {
            id: 2,
            taskName: '测试任务2',
            startDate: '2023-01-01 10:00:00',
            endDate: '2023-01-01 12:00:00',
            status: 1,
          },
          {
            id: 3,
            taskName: '测试任务3测试任务3测试任务3',
            startDate: '2023-01-01 12:00:00',
            endDate: '2023-01-01 14:00:00',
            status: 2,
          },
          {
            id: 4,
            taskName: '测试任务4',
            startDate: '2023-01-01 14:00:00',
            endDate: '2023-01-01 16:00:00',
            status: 3,
          },
          {
            id: 5,
            taskName: '测试任务5',
            startDate: '2023-01-01 16:00:00',
            endDate: '2023-01-01 18:00:00',
            status: 3,
          },
        ]
        taskList = taskList.concat(taskList);
        if (data.calenderList[0]) {
          data.calenderList[0].taskList?.push(...taskList);
        }
      }
      data.calenderList.forEach((item: AgentBrainTaskCalenderItem) => {
        map[item.day!] = item;
      })
      dayTaskMap.value = map;
      calendarTask.value = data;
    }
  });
};
watch(
  () => selectedMonth.value,
  () => searchCalendarTaskList()
);

const getDayTasks = (date: Date): CalendarDayTasks => {
  const dateStr = parseTime(date, '{y}-{m}-{d}');
  const item: AgentBrainTaskCalenderItem | undefined = dayTaskMap.value[dateStr];
  const taskList = item?.taskList || [];
  const taskCount = taskList.length;
  let list: AgentBrainTaskItem[] = [];
  let moreList: AgentBrainTaskItem[] = [];
  let more = false;
  const maxCount = 2;
  if (taskCount > maxCount) {
    more = true;
    list = taskList.slice(0, maxCount);
    moreList = taskList.slice(maxCount);
  } else {
    list = taskList;
  }
  const dayTask: CalendarDayTasks = {
    day: dateStr!,
    list: list,
    more: more,
    moreList: moreList,
  };
  return dayTask;
}
const handleCalendarCellClick = (date: Date, dayTasks: CalendarDayTasks) => {
  // console.log('handleCalendarCellClick', showMoreDate.value, date);
  const showDate = showMoreDate.value;
  if (!showDate) {
    if (dayTasks.list.length > 0) {
      showMoreDate.value = date;
    }
    return;
  }
  let nextDate = dayTasks.list.length > 0 ? date : null;
  showMoreDate.value = nextDate;
  // const t1 = showDate.getTime();
  // const t2 = date.getTime();
  // if (t1 != t2) {
  // }
}
const handleCalendarCellMore = (date: Date) => {
  showMoreDate.value = date;
}
const handleItemClick = (item: AgentBrainTaskItem) => {
  // console.log('handleItemClick', item);
  handleEdit(item)
}
const isSameDate = (date: Date, showDate: Date) => {
  // console.log('date', date, 'showDate', showDate);
  if (!showDate || !date) {
    return false;
  }
  const isSame = date.getFullYear() === showDate.getFullYear() && date.getMonth() === showDate.getMonth() && date.getDate() === showDate.getDate();
  // if (isSame) {
  //   console.log('same', showDate.getDate());
  // }
  return isSame;
}

const tableData = ref<AgentBrainTaskItem[]>([]);
const total = ref<number>(0);
const page = ref<PageDomain>({
  pageNum: 1,
  pageSize: 5,
});

const searchNormalListTask = () => {
  const params: AgentBrainTaskQueryParams = {
    agenticId: context.id,
  };
  getAgentBrainListTasksApi(params, page.value).then((res: TableDataInfo<AgentBrainTaskItem>) => {
    if (res.code === 200) {
      tableData.value = res.rows || [];
      total.value = +res.total || 0;
    }
  });
}
const handleDelete = (item: AgentBrainTaskItem) => {
  proxy.$modal.confirm(`确认删除任务${item.taskName}吗？`).then(function () {
    deleteBusinessAgentBrainTaskApi(item.id!).then((res: AjaxResult) => {
      if (res.code === 200) {
        proxy.$modal.msgSuccess('删除成功')
      }
      refreshList();
    }, (err: any) => {
      refreshList();
    })
  }).catch(() => { })
}
const handleEdit = (item: AgentBrainTaskItem) => {
  const contentTask = context.task
  contentTask.showTaskModal = true
  contentTask.taskItem = item
  contentTask.isAdd = false
}
const handleAddTask = () => {
  const contentTask = context.task
  contentTask.showTaskModal = true
  contentTask.taskItem = {}
  contentTask.isAdd = true
}
const handleEnableChange = (item: AgentBrainTaskItem) => {
  const enable = item.enable ? 1 : 0;
  const taskId = item.id!;
  const reset = () => {
    item.enable = enable ? 0 : 1;
  }
  if (enable) {
    enableBusinessAgentBrainTaskApi(taskId).then((res: AjaxResult) => {
      if (res.code === 200) {
        proxy.$modal.msgSuccess('启用成功')
      } else {
        reset();
        proxy.$modal.msgError('启用失败')
      }
    }, (err: any) => {
      reset();
      // proxy.$modal.msgError('启用失败')
    })
  } else {
    disableBusinessAgentBrainTaskApi(taskId).then((res: AjaxResult) => {
      if (res.code === 200) {
        proxy.$modal.msgSuccess('停用成功')
      } else {
        reset();
        proxy.$modal.msgError('停用失败')
      }
    }, (err: any) => {
      reset();
      // proxy.$modal.msgError('停用失败')
    })
  }
}

const refreshList = () => {
  if (context.task.taskViewMode == 'calendar') {
    searchCalendarTaskList();
  } else {
    searchNormalListTask();
  }
}
refreshList();
onMounted(() => {
  context.task.refreshList = refreshList;
})
onUnmounted(() => {
  context.task.refreshList = () => { };
})
</script>
<style scoped lang="scss">
@use './form.scss';

.el-calendar {
  --el-calendar-cell-width: 110px;
  --el-calendar-selected-bg-color: transparent;
  overflow: auto;
  line-height: 1;

  :deep(.el-calendar-day) {
    padding: 0;
    position: relative;
    // &:hover {
    //   background-color: transparent;
    // }
  }
}

.task-form-title {
  font-weight: bold;
  font-size: 16px;
  color: #2B2F33;
}

.svg-icon-style {
  display: inline-block;
  vertical-align: bottom;
}

.list-row {

  // :deep(.svg-icon) {
  //   color: var(--el-color-primary);
  // }
  .list-item-name-row {
    display: flex;
    gap: 16px;
    overflow: hidden;

    .list-item-start-date {
      background: #F5F5FF;
      border-radius: 20px 20px 20px 20px;
      border: 1px solid #ADAADF;
      padding: 3px 12px;
      font-size: 12px;
      color: #2015B9;
      line-height: 16px;
      flex-shrink: 0;
    }
  }

  .list-ops {
    display: flex;

    .el-switch {
      // margin-right: 20px;
    }

    .el-button {
      margin-left: 20px;
      background: #EBF3F5;
      border-radius: 8px 8px 8px 8px;
    }

    .edit-btn {
      color: var(--el-color-primary);
    }

    .delete-btn {
      color: var(--el-color-danger);
    }
  }
}
</style>
