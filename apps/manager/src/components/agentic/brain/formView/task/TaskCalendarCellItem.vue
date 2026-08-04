<template>
  <div class="calendar-cell-list-item"
    :class="'status-'+task.status"
    @click="handleClick($event)">
    <div class="point"></div>
    <div class="time">{{ parseTime(task.startDate, '{h}:{i}') }}</div>
    <el-tooltip :content="task.taskName" placement="top-start">
      <div class="name">
        {{ task.taskName }}
      </div>
    </el-tooltip>
  </div>
</template>
<script setup lang="ts">
// import { parseTime } from '@/utils/ruoyi.js'
// import { CalendarDayTasks } from './task.js'
import { AgentBrainTaskItem } from '@/types';

interface Prop {
  task: AgentBrainTaskItem;
}
defineProps({
  task: {
    type: Object as () => AgentBrainTaskItem,
    default: () => ({})
  }
})
const emit = defineEmits(['click']);
const handleClick = ($event: MouseEvent) => {
  emit('click', $event);
}
</script>
<style scoped lang="scss">
.calendar-cell-list-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  min-width: 0;
  .point {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;
  }
  .time {
    margin: 0 3px;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
// 状态: 0-待执行(灰色) 1-执行中（绿色） 2-已执行（蓝色） 3-执行失败（黄色）
.status-0 {
  color: #909393;
  .point {
    background-color: #909393;
  }
}
.status-1 {
  color: #67c23a;
  .point {
    background-color: #67c23a;
  }
}
.status-2 {
  color: #409eff;
  .point {
    background-color: #409eff;
  }
}
.status-3 {
  color: #e6a23c;
  .point {
    background-color: #e6a23c;
  }
}
</style>
