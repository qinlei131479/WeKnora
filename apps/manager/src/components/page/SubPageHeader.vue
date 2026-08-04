<template>
  <div class="sub-page-header">
    <div class="sub-page-left">
      <Button v-if="back" class="back-btn" variant="ghost" size="icon" @click="handleBack">
        <ArrowLeft />
      </Button>
      <div class="title-area">
        <g-text class="page-title" :content="title" popper-class="tooltip-middle"></g-text>
        <g-text class="page-title-desc" :content="desc" popper-class="tooltip-middle"></g-text>
        <!-- <el-tooltip :content="title" placement="top" popper-class="tooltip-middle">
          <h1 class="page-title">{{
            title
          }}</h1>
        </el-tooltip>
        <el-tooltip :content="desc" placement="top" popper-class="tooltip-middle">
          <p class="page-title-desc">{{ desc }}</p>
        </el-tooltip> -->
      </div>
    </div>
    <div class="sub-page-right">
      <slot></slot>
    </div>
  </div>
  <div v-if="sep" class="top-sep"></div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

const { proxy } = getCurrentInstance();
const emit = defineEmits(['back'])
const props = defineProps({
  handleBack: {
    type: Function,
    default: null
  },
  back: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  desc: {
    type: String,
    default: ''
  },
  sep: {
    type: Boolean,
    default: true
  }
})
const router = useRouter()

const handleBack = () => {
  console.log('handleBack', proxy)
  if (props.handleBack) {
    props.handleBack()
  } else {
    router.back()
  }
}

</script>
<style scoped lang="scss">
.sub-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 20px 40px;
  min-width: 0;
  overflow: hidden;
}

.sub-page-left {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-right: auto;
  overflow: hidden;
  min-width: 0;
}

.sub-page-right {
  flex-shrink: 0;
  min-width: 0;
  overflow: hidden;
}

.title-area {
  margin-left: 20px;
  min-width: 0;
  flex-grow: 1;
}

.page-title {
  font-weight: bold;
  font-size: 20px;
  color: #2B2F33;
  line-height: 29px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.page-title-desc {
  font-size: 14px;
  color: #77838F;
  line-height: 20px;
  margin-top: 8px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.back-btn {
  cursor: pointer;
  width: 24px;
  height: 24px;

  &:hover {
    color: var(--el-color-primary);
  }
}

.top-sep {
  height: 1px;
  background-color: #fff;
}
</style>
