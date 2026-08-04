<template>
  <KJSCDialogV2 :title="props.title" v-bind="proxy.$attrs" @open="onOpen" @close="onClose" width="800" append-to-body
    :show-close-btn="false" :show-subit-btn="false">
    <div>
      <div>无需解析，直接使用</div>
      <div class="search-area">
        <input name="fk" style="display: none" />
        <el-input v-model="searchKey" @keyup.enter="submitSearch" placeholder="请搜索" :maxlength="255" show-word-limit />
      </div>
      <div>
        <el-tree-v2 ref="treeRef" :data="treeData" :props="treeProps" :height="400" show-checkbox>
          <template #default="{ node, data }">
            <el-icon class="el-icon--left">
              <Document v-if="!node.parent" />
              <Folder v-else-if="isFolder(data)"/>
              <div v-else-if="isPpt(data)" class="custom-icon ppt-icon"></div>
              <div v-else class="custom-icon other-icon"></div>
              <!-- <Document v-if="node.isLeaf" /> -->
              <!-- <Folder v-else-if="!node.expanded" />
              <FolderOpened v-else /> -->
            </el-icon>
            <span class="prefix" :class="{ 'is-leaf': node.isLeaf }">{{ data.name }}</span>
            <!-- <span>{{ node.label }}</span> -->
          </template>
        </el-tree-v2>
      </div>
    </div>
    <template #suffixFooter>
      <el-button type="primary" @click="submitForm">确定</el-button>
      <el-button @click="close()">取消</el-button>
    </template>
  </KJSCDialogV2>
</template>
<script setup lang="ts" name="KnowledgeSelectDialog">
import { queryKnowledgeAndFilesApi } from '@/api/knowledge/knowledeg'


const { proxy } = getCurrentInstance()
console.log('onOpen', proxy)
const props = defineProps({
  // modelValue: false,
  title: {
    type: String,
    default: '从知识库上传'
  },
  callback: {
    type: Function,
    default: () => null
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const treeRef = ref(null)

const searchKey = ref('')
const treeData = ref([])
const treeProps = {
  children: 'children',
  label: 'name'
}

const onOpen = () => {
  console.log('onOpen', proxy)
}

const onClose = () => {
  emit('update:modelValue', false)
}

const close = (change = false) => {
  emit('update:modelValue', false)
  if (change) {
    emit('change', true)
  }
}

const submitSearch = () => {
  const searchValue = searchKey.value
  searchDelay(searchValue);
}
let timer: any = null
const searchDelay = (searchValue: string) => {
  if (timer) {
    clearTimeout(timer)
  }
  timer = setTimeout(() => {
    doSearch(searchValue)
  }, 500)
}

const doSearch = (searchValue: string) => {
  queryKnowledgeAndFilesApi(searchValue).then(res => {
    if (res.code === 200) {

    }
  })
}
const getFileExt = (fileName: string) => {
  return fileName.split('.').pop()
}
const isPpt = (fileName: string) => {
  const ext = getFileExt(fileName) || ''
  const pptExt = ['ppt', 'pptx']
  return pptExt.includes(ext)
}
const isFolder = (item: any) => {
  return item.type === 'folder'
}
const isLib = (item: any) => {
  return item.type === 'lib'
}

const submitForm = () => {
  const checkedNodes = treeRef.value.getCheckedNodes()
  if (checkedNodes.length === 0) {
    proxy.$modal.msgError('请选择内容')
    return
  }
  props.callback(checkedNodes)
}

</script>
<style scoped lang="scss">
.search-area {
  margin: 20px 0;
}
</style>
