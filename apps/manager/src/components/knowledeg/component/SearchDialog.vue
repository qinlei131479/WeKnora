<template>
  <el-dialog
    :model-value="props.modelValue"
    width="800px"
    append-to-body
    @update:model-value="emits('update:modelValue', $event)"

  >
    <template #header>
      <el-select
        v-model="state.searchInfo.keyword"
        filterable
        remote
        placeholder="输入姓名搜索权限文件"
        :remote-method="remoteMethod"
        @change="selectList"
        style="width: 240px"
      >
        <el-option
          v-for="item in state.searchList.userDataList"
          :key="item.key"
          :label="item.value"
          :value="item.key"
        />
      </el-select>
    </template>
    <div>
      <el-table
        :data="state.tableData"
        row-key="code"
        :show-header="false"
        :default-expand-all="true"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="fileName"></el-table-column>
      </el-table>
    </div>
  </el-dialog>
</template>
<script setup>
import { reactive, watch } from "vue";
import { userSelect, ragKnowledgeFileTree } from "@/api/knowledge/knowledgeApi";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: String,
    default: "",
  },
});
const emits = defineEmits(["update:modelValue", "done"]);
const state = reactive({
  tableData: [],
  searchList: {
    userDataList: [],
  },
  searchInfo: {
    keyword: "",
  },
  loading: false,
});

watch(
  () => props.userId,
  () => {
    if (props.userId) {
      state.searchInfo.keyword = props.userId;
      selectList(props.userId);
    }
  }
);

const remoteMethod = (query) => {
  userSelect(query).then((res) => {
    state.searchList.userDataList = res.data;
  });
};
const selectList = (data) => {
  state.loading = true;
  state.tableData = [];
  ragKnowledgeFileTree(data).then((res) => {
    // 结构重新指定
    res.data.forEach((item) => {
      item.children = item.fileList;
      item.fileName = item.name;
    });
    state.tableData = res.data;
    state.loading = false;
  });
};

onMounted(() => {
  remoteMethod("");
});
</script>
<style lang="less" scoped></style>
