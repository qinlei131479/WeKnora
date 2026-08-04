<template>
  <div class="select-skill">
    <!-- <div class="select-skill-title">选择技能</div> -->
    <div class="select-skill-search">
      <el-input
        v-model="searchText"
        clearable
        @keyup.enter="handleSearch"
        @input="handleDelaySearch"
        placeholder="搜索能力，输入关键词快速筛选"></el-input>
    </div>
    <!-- <div class="select-skill-tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all"></el-tab-pane>
        <el-tab-pane label="部门" name="department"></el-tab-pane>
        <el-tab-pane label="岗位" name="position"></el-tab-pane>
        <el-tab-pane label="用户组" name="userGroup"></el-tab-pane>
        <el-tab-pane label="用户" name="user"></el-tab-pane>
      </el-tabs>
    </div> -->
    <div ref="skillListRef" class="select-skill-list">
      <div class="list-title">
        <div class="title-left">搜索: 按键盘 ↑ ↓ 切换并按回车直接插入</div>
        <div class="title-right">
          <span class="s1">可供选调能力仓</span><span class="s2">组件</span>
        </div>
      </div>
      <!-- <div>
        {{ activeIndex }}
      </div> -->
      <el-scrollbar ref="scrollbarRef" height="300px">
        <div ref="listRef" class="list-content" tabindex="0">
          <div v-for="(item, index) in listData" :key="item.dataId"
            tabindex="0"
            @click="handleClick(item)"
            class="list-item"
           :class="{'active': index === activeIndex}">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-type"><el-tag type="primary">Agent Skill</el-tag></div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>
<script setup lang="ts">

import type { SkillVO } from '@/types'
import SkillServiceFactory, { SkillEntity, SkillPageDTO } from '@/service/skillService';

import { MemtionItem } from './task';

interface DataItem extends MemtionItem {
  
}

const emit = defineEmits('item')

const listRef = ref<HTMLDivElement>()
const scrollbarRef = ref(null)
const listData = ref<DataItem[]>([])
const skillService = SkillServiceFactory({
  autoLoad: false,
  toThin: (item: SkillVO): DataItem => {
    return {
      // id: item.id,
      dataId: item.id?.toString() || '',
      name: item.name! || '',
    }
  }
});

const scrllTo = (index: number) => {
  scrollbarRef.value?.setScrollTop((index-1) * 37)
}
const searchText = ref('');
const handleSearch = () => {
  if (delaySearchTimeout) clearTimeout(delaySearchTimeout)
  getTableData()
}
let delaySearchTimeout: any = null
const handleDelaySearch = () => {
  if (delaySearchTimeout) clearTimeout(delaySearchTimeout)
  delaySearchTimeout = setTimeout(() => {
    delaySearchTimeout = null;
    getTableData()
  }, 800)
}
const handleClick = (item: SkillEntity) => {
  emit('item', item)
}

const activeIndex = ref(0);
const keydownHandler = (e: KeyboardEvent) => {
  if (e.key === 'ArrowUp') {
    let nextIndex = activeIndex.value - 1
    if (nextIndex >= 0) {
      activeIndex.value = nextIndex
      scrllTo(nextIndex)
    }
  }
  else if (e.key === 'ArrowDown') {
    let nextIndex = activeIndex.value + 1
    if (nextIndex < listData.value.length) {
      activeIndex.value = nextIndex
      scrllTo(nextIndex)
    }
  }
  else if (e.key === 'Enter') {
    if (activeIndex.value >= 0) {
      const item = listData.value[activeIndex.value]
      if (item) {
        emit('item', item)
      }
    }
  }
}
onMounted(() => {
  document.addEventListener('keydown', keydownHandler)
  listRef.value?.focus()
})
onUnmounted(() => {
  document.removeEventListener('keydown', keydownHandler)
})

const getTableData = () => {
  const params: SkillPageDTO = {
    status: 1,
    keyword: searchText.value,
    // status: undefined
  };
  skillService.load(params, {
    pageNum: 1,
    pageSize: 9999,
  }).then(() => {
    listData.value = skillService.listData || [];

    // listData.value.push({
    //   dataId: '111',
    //   name: '能力111',
    // },{
    //   dataId: '112',
    //   name: '能力222',
    // },{
    //   dataId: '113',
    //   name: '能力333',
    // },{
    //   dataId: '114',
    //   name: '能力444',
    // },{
    //   dataId: '115',
    //   name: '能力555',
    // },{
    //   dataId: '116',
    //   name: '能力666',
    // },{
    //   dataId: '117',
    //   name: '能力777',
    // },{
    //   dataId: '118',
    //   name: '能力888',
    // },{
    //   dataId: '119',
    //   name: '能力999',
    // },{
    //   dataId: '120',
    //   name: '能力10000',  
    // })
    activeIndex.value = listData.value.length > 0 ? 0 : -1

  });
}
getTableData()
</script>
<style scoped lang="scss">
  .select-skill {
    overflow: auto;
    width: 100%;
  }
  .list-title {
    display: flex;
    justify-content: space-between;
    padding: 5px 10px;
    background-color: #f9fafb;
    color: #757d87;
    font-size: 14px;
    .title-right {
      color: #2869ec;
      .s2 {
        margin-left: 30px;
      }
    }
  }
  .list-item {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #e5e7eb;
    padding: 5px;
    cursor: pointer;
    &.active {
      background-color: #b9cdeb;
    }
    &:hover {
      background-color: #ccd6e6;
    }
  }
</style>
