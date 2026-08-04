<template>
  <el-tree-select
    v-model="fileCode"
    :filter-method="remoteMethod"
    :props="{
      value: 'code',
      label: 'fileName',
      children: 'children',
    }"
    :data="state.userDataList"
    filterable
    clearable
    remote
    reserve-keyword
    default-expand-all
    class="selecttree"
    :popper-append-to-body="false"
    popper-class="select-popper"
    placeholder="请输入关键词搜索文件"
    @change="changeFileCode"
  />
</template>
<script setup lang="ts">
import {
  querySearchTreeList,
  delBatchLibFileApi,
  getLibApi,
  getFileConfig,
  batchDownloadUrl,
} from "@/api/knowledge/knowledgeApi";

const emit = defineEmits(['update:modelValue', 'parentCode']);

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  libId: {
    type: [Number, String],
    default: '',
  },
})
const state = reactive({
  userDataList: [],
})

const fileCode = computed({
  get: () => props.modelValue,
  set: (value: string|number) => emit('update:modelValue', value),
});

/** 远程搜索 */
const remoteMethod = (keyWord: string) => {
  querySearchTreeList(props.libId, keyWord).then((res: any) => {
    if (res.code === 200) {
      state.userDataList = res.data;
    }
  });
};

const changeFileCode = (value: string) => {
  if (value) {
    const selectedNode = findNodeById(state.userDataList, value);
    // state.parentCode = selectedNode.parentCode;
    emit('parentCode', selectedNode.parentCode);
  }
};
function findNodeById(nodes: any[], code: string|number): any {
  for (const node of nodes) {
    if (node.code === code) {
      return node;
    }
    if (node.children) {
      const found: any = findNodeById(node.children, code);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
</script>
<style scoped lang="scss">

</style>

<style>
.selecttree .el-select-dropdown__item.hover,
.el-select-dropdown__item:hover {
  background: rgba(35, 111, 210, 0.1);
}
.selecttree .el-tree-node__content:hover {
  background-color: rgba(35, 111, 210, 0.1);
  /* border-radius: 8px 8px 8px 8px; */
}
.selecttree .el-tree-node:focus > .el-tree-node__content {
  background: none;
}
.selecttree .el-tree-node__content {
  height: 36px;
  border-bottom: 1px solid #f1f1f1;
  font-size: 14px;
}
/* .lib-manage .el-select-dropdown {
  padding: 8px 16px 16px 16px;
} */
</style>
