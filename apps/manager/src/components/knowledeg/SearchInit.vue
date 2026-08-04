<template>
  <div class="knowledge-search-page" @click="clickFn">
    <page-name class="page-name" />
    <div class="page-body">
      <img :src="searchPageHero" alt="" class="search-hero" />

      <div class="search-panel">
        <div
          v-if="state.type === 0"
          class="search-bar"
          :class="{ 'is-focused': state.ssFlag }"
        >
          <el-input
            v-model="state.keyWords"
            class="search-bar__input"
            placeholder="请输入关键词搜索文档知识或FAQ知识..."
            clearable
            @focus="focusEvent"
            @blur="blurEvent"
            @keyup.enter="search"
          />
          <button type="button" class="search-bar__btn" @click="search">
            <svg-icon icon-class="search" class="search-bar__btn-icon" />
          </button>
        </div>

        <div
          v-else
          class="search-history-panel"
          :class="{ 'is-focused': state.ssHistoryFlag }"
        >
          <div class="search-bar search-bar--history">
            <el-input
              ref="historyInputRef"
              v-model="state.keyWords"
              class="search-bar__input"
              placeholder="请输入关键词搜索文档知识或FAQ知识..."
              clearable
              @focus="focusEventHistory"
              @keyup.enter="search"
            />
            <button type="button" class="search-bar__btn" @click="search">
              <svg-icon icon-class="search" class="search-bar__btn-icon" />
            </button>
          </div>

          <ul v-if="state.historyData.length" class="search-history-list">
            <li class="search-history-list__title">搜索记录</li>
            <li
              v-for="(item, index) in state.historyData"
              :key="index"
              class="search-history-list__item"
              @click.stop="clickWords(item)"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="searchInit">
import { searchRecord } from '@/api/knowledge/ragKnowledgeSearch'
import searchPageHero from '@/assets/images/knowledge/search-page-hero.png'

const route = useRoute()
const pageIcon = computed(() => route.meta?.icon || 'search')

const emits = defineEmits(['done'])
const state = reactive({
  keyWords: '',
  type: 0,
  historyData: [],
  ssFlag: false,
  ssHistoryFlag: false
})
const historyInputRef = ref(null)

const getRecordWords = async () => {
  const res = await searchRecord({ limit: 10 })
  if (res.code === 200) {
    state.historyData = res.data
  }
}

const search = (event) => {
  emits('done', state.keyWords)
  event?.stopPropagation?.()
}

const clickWords = (words) => {
  state.keyWords = words
}

const focusEvent = () => {
  if (state.historyData.length === 0) {
    state.ssFlag = true
    return
  }
  state.type = 1
  nextTick(() => {
    historyInputRef.value?.focus()
  })
}

const blurEvent = () => {
  state.ssFlag = false
}

const focusEventHistory = () => {
  state.ssHistoryFlag = true
}

const clickFn = () => {
  state.type = 0
  state.ssHistoryFlag = false
}

onMounted(() => {
  getRecordWords()
})
</script>

<style lang="scss" scoped>
.knowledge-search-page {
  min-height: calc(100vh - var(--navbar-height, 96px));
  padding: 40px 40px;
  background: #EBF3F5;
  box-sizing: border-box;
  border-radius: 40px 0 0 0;
  overflow: hidden;
}

.page-name {
  margin-bottom: 20px;
}

// .page-header {
//   display: flex;
//   align-items: center;
//   gap: 8px;
//   margin-bottom: 48px;

//   &__icon {
//     width: 20px;
//     height: 20px;
//     color: var(--el-color-primary);
//     flex-shrink: 0;
//   }

//   &__title {
//     font-size: 16px;
//     font-weight: 600;
//     color: #303133;
//     line-height: 1;
//   }
// }

.page-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 24px;
}

.search-hero {
  width: 320px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  margin-bottom: 40px;
}

.search-panel {
  width: 100%;
  max-width: 800px;
}

.search-bar {
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  padding: 0 8px 0 20px;
  background: #ffffff;
  border: 1px solid #3297A0;
  border-radius: 24px;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;

  &.is-focused,
  .search-history-panel.is-focused & {
    border-color: #3297A0;
    box-shadow: 0 0 0 2px rgba(50, 151, 160, 0.12);
  }

  &__input {
    flex: 1;
    min-width: 0;

    :deep(.el-input__wrapper) {
      padding: 0;
      background: transparent;
      box-shadow: none !important;
    }

    :deep(.el-input__inner) {
      height: 46px;
      line-height: 46px;
      font-size: 14px;
      color: #303133;

      &::placeholder {
        color: #a8abb2;
      }
    }
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.2s;

    &:hover {
      background-color: #ebf3f5;
    }
  }

  &__btn-icon {
    font-size: 18px;
    color: #77838f;
  }
}

.search-history-panel {
  width: 100%;
  background: #ffffff;
  border: 1px solid #3297A0;
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;

  &.is-focused {
    border-color: #3297A0;
    box-shadow: 0 0 0 2px rgba(50, 151, 160, 0.12);
  }

  .search-bar--history {
    border: none;
    border-radius: 0;
    box-shadow: none !important;
  }
}

.search-history-list {
  margin: 0;
  padding: 8px 0 12px;
  list-style: none;
  border-top: 1px solid #ebeef5;
  max-height: 240px;
  overflow-y: auto;

  &__title {
    padding: 8px 20px;
    font-size: 14px;
    font-weight: 600;
    color: #3297a0;
    cursor: default;
  }

  &__item {
    padding: 10px 20px;
    font-size: 14px;
    color: #606266;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
      background-color: #ebf3f5;
      color: #3297a0;
    }
  }
}
</style>
