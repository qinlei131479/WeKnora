<template>
  <div>
    <el-table :data="state.tableData">
        <!-- @sort-change="handleSortChange" -->
        <el-table-column label="名称" prop="fileName">
            <!-- sortable="fileName" -->
            <template #default="scope">
                <span  @row-click="handleRowClick(scope.row)" v-html="highlightWords(scope.row.fileName)"></span>
            </template>
        </el-table-column>
        <el-table-column label="路径" prop="fileLevelPath">
            <!-- sortable="path" -->
            <template #default="scope">
            {{scope.row.path}}
            </template>
        </el-table-column>
        <el-table-column label="权限对象" prop="purview"></el-table-column>
        <el-table-column label="内容" :show-overflow-tooltip="true" prop="chunkContent">
            <!-- sortable="content" -->
            <template #default="scope">
                <span v-html="highlightWords(scope.row.content)"></span>
            </template>
        </el-table-column>
        <el-table-column label="日期" :show-overflow-tooltip="true" prop="createTime">
            <!-- sortable="createTime" -->
            <template #default="scope">
            {{scope.row.createTime}}
            </template>
        </el-table-column>
    </el-table>
    <!-- 成员管理对话框 -->
    <KJSCDialogV2
      :title="'查看成员及权限'"
      v-model="state.memberManage"
      width="880px"
      append-to-body
      closeBtnText="关闭"
      :showSubitBtn="false"
      :showCloseBtn="false"
    >
      <MemberList :fileId="state.memberListFileId" :lib-id="state.selectedLibId" />
    </KJSCDialogV2>
  </div>
</template>

<script setup>
import KJSCDialogV2 from "@/components/KJSCCmpt/KJSCDialogV2.vue";
import MemberList from "./component/MemberList.vue";
const props = defineProps({
    keyWords: {
        type: String,
        default: "",
    },
    tableData: {
        type: Array,
        default: [],
    },
})
const emits = defineEmits(["done"]);
const state = reactive({
    tableData:[],
    memberManage:false,
    keyWords:'',
    memberListFileId:'',
    selectedLibId: ''
})
const handleRowClick = (row)=>{
    window.location.href = row.filePath;
}
/** 排序触发事件（暂不使用）
function handleSortChange(column, prop, order) {
  emits("done",column);
}
*/
// 成员权限
function memberManagerHandle(row) {
  state.memberListFileId = row.fileId;
  state.selectedLibId = row.knowledgeId
  state.memberManage = true;
}
const highlightWords = (val) => {
    if (
    val.indexOf(state.keyWords) !== -1 &&
    state.keyWords !== ''
    ) {
    return val.replace(
        state.keyWords,
        '<font color="#f00">' + state.keyWords + '</font>'
    )
    } else {
    return val
    }
}
watchEffect(() => {
    state.keyWords = props.keyWords;
    state.tableData = props.tableData;
});
</script>

<style lang="scss" scoped>
.table-cell-wrap {
  word-wrap: break-word; /* 允许长单词或URL地址换行 */
  white-space: normal;  /* 允许文本自动换行 */
  overflow: hidden;     /* 隐藏超出容器的内容 */
  text-overflow: ellipsis; /* 可选，当内容超出时显示省略号 */
}
</style>