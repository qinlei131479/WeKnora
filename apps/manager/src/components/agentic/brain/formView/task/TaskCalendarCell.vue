<template>
  <div class="calendar-cell" :class="{ 'selected': more, 'current-month': type === 'current-month' }"
    @click="handleClick">
    <div class="calendar-cell-date">
      {{ date.getDate() }}
    </div>
    <div class="calendar-cell-list">
      <TaskCalendarCellItem v-for="item in dayTasks.list" :key="item.id" :task="item"
        @click.stop="handleItemClick(item, $event)" />
      <template v-if="more">
        <TaskCalendarCellItem v-for="item in dayTasks.moreList" :key="item.id" :task="item"
          @click.stop="handleItemClick(item, $event)" />
      </template>
    </div>
    <!-- <div class="calendar-cell-more" v-if="dayTasks.more" @click="handleClickMore">
      还有{{ dayTasks.moreList?.length || 0 }}项
    </div> -->
  </div>
</template>
<script setup lang="ts">
// import { parseTime } from '@/utils/ruoyi.js'
import { CalendarDayTasks } from './task.js'
import TaskCalendarCellItem from './TaskCalendarCellItem.vue'

interface Prop {
  dayTasks: CalendarDayTasks;
  type: string;
  // isSelected: boolean;
  // day: Date;
  more: boolean;
}
const props = defineProps({
  date: {
    type: Date,
    default: () => new Date()
  },
  type: {
    type: String,
    default: ''
  },
  dayTasks: {
    type: Object as () => CalendarDayTasks,
    default: () => ({})
  },
  more: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['click', 'more']);
const handleClick = ($event: MouseEvent) => {
  // console.log('handleClick', props.date.getDate());
  emit('click', props.dayTasks);
}
const handleClickMore = ($event: MouseEvent) => {
  // console.log('handleClickMore', props.date.getDate());
  emit('more', $event);
}
const handleItemClick = (item: any, $event: MouseEvent) => {
  // console.log('handleItemClick', item, $event);
  emit('itemClick', item);
}
</script>
<style scoped lang="scss">
.calendar-cell {
  position: absolute;
  inset: 2px;
  padding: 8px;
  min-height: 100%;

  .calendar-cell-date {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    text-align: center;
    line-height: 32px;
  }

  .calendar-cell-list-item {
    font-size: 12px;
    line-height: 16px;
    padding: 4px 0;
  }

  &.current-month {
    background: #F5F5F5;
    border-radius: 12px;
  }

  &:hover {
    background-color: #EBF3F5;
  }

  &.selected {
    background-color: #EBF3F5;
    z-index: 1;
    box-shadow: 0 0 2px 0px #d3d3d3;
    // border-radius: 5px;
    width: 256px;
    height: 215px;
    background-color: #fff;
    padding: 20px 12px;

    // .calendar-cell-date {
    //   padding-left: 8px;
    //   padding-bottom: 4px;
    // }

    .calendar-cell-list-item {
      // margin-top: 16px;
      // color: #2B2F33;
      font-size: 12px;
      line-height: 18px;
      padding: 6px 0;
    }

    .calendar-cell-more {
      display: none;
    }

    // &:hover {
    //   background-color: var(--el-calendar-selected-bg-color);
    // }
  }
}

.calendar-cell-list {
  max-height: 150px;
  overflow: auto;
  background-color: #fff;
  border-radius: 8px;
  padding: 0 8px;
  // line-height: 28px;
  margin-top: 8px;
}

.calendar-cell-more {
  font-size: 12px;
  color: #999;
}
</style>
<style>
.el-calendar-table__row .current.is-today .calendar-cell-date {
  /* width: 24px; */
  background: var(--el-color-primary);
  text-align: center;
  color: #fff;
  /* border-radius: 99px; */
  /* font-size: 14px; */
  /* line-height: 24px; */
  /* padding: 0; */
}
</style>