<template>
  <el-dialog v-model="props.modelValue" title="编辑权限" style="height: 88vh;" @close="onClose">
    <div class="authma-wrap">
      <div class="authma-header">
        <div class="authma-total">共：{{ selectedTips }}</div>
        <el-popover placement="right" popper-class="authma-popper" @hide="onPopoverHide">
          <template #reference>
            <div class="authma-refer">
              <el-button link type="primary">修改权限</el-button>
              <el-icon class="el-icon--right">
                <arrow-right />
              </el-icon>
            </div>
          </template>
          <el-radio-group v-model="authSelected" class="authma-oper" @change="onAuthChange">
            <el-radio class="oper-item" value="1">可查看/下载</el-radio>
            <el-radio class="oper-item" value="0">可查看</el-radio>
          </el-radio-group>
        </el-popover>
      </div>
      <div class="authma-content">
        <el-tree
          ref="treeNodeRef"
          class="authma-tree"
          :data="selectedTree"
          node-key="userId2"
          show-checkbox
          :props="defaultProps"
          :default-checked-keys="props.selectedKeys"
          @check="onTreeCheckboxChange"
        >
          <template #default="{ node, data }">
            <div class="authma-tree-node">
              <span>{{ node.label }}</span>
              <el-popover v-if="node.level === 1" placement="right" popper-class="authma-popper">
                <template #reference>
                  <div class="authma-refer">
                    <el-button link type="primary">{{ AuthMap[data.purviewRange] }}</el-button>
                    <el-icon class="el-icon--right">
                      <arrow-right />
                    </el-icon>
                  </div>
                </template>
                <div class="authma-oper">
                  <el-radio-group v-model="data.purviewRange">
                    <el-radio class="oper-item" value="1">可查看/下载</el-radio>
                    <el-radio class="oper-item" value="0">可查看</el-radio>
                  </el-radio-group>
                  <el-radio class="oper-item" value="2" @change="onRemoveMember(node)">移除成员</el-radio>
                </div>
              </el-popover>
            </div>
          </template>
        </el-tree>
      </div>
    </div>
    <template #footer>
      <el-button type="primary" @click="onConfirm">确定</el-button>
      <el-button plain @click="onClose">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, watch, defineEmits } from "vue";
// import { libRoleTypes } from "../constance";
import { postKnowledgeAuth } from "@/api/knowledge/knowledgeApi";
import { ElMessage } from "element-plus";

const AuthMap = {
  '0': '可查看',
  '1': '可查看/下载'
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedNodes: {
    type: Array,
    default: []
  },
  selectedKeys: {
    type: Array,
    default: []
  },
  knowledgeId: {
    type: [String, Number],
    default: ''
  },
  existNodes: {
    type: Array,
    default: () => []
  }
})
const emit = defineEmits(['update:modelValue', 'done'])

const defaultProps = {
  children: "children",
  label: "deptName",
  value: "deptId",
  multiple: true,
  disabled: (data, node) => {
    // console.log('disabled:', data)
    if(data.isUser) {
      // console.log('........', data, node)
      return !!props.existNodes.find(item => item.id === data.parentId)
      // if(data.dataType === 'groupuser') {
      //   return state.selectedRoleKeys.indexOf(data.userId2) > -1
      // }else if(data.dataType === 'user') {
      //   return state.selectedKeys.indexOf(data.userId2) > -1
      // }
      // return true
    }
    
    if(!data.children || !data.children.length) {
      return true
    }

    return !!props.existNodes.find(item => item.id === data.id || item.id === data.parentId)
  },
  class: (data, node) => {
    if(node.level > 1 && node.childNodes.length === 0) {
      return 'is-deepest'
    }
  },
  checkStrictly: true
  // disabled: function(data, node){
  //   return data.children && data.children.length > 0;
  // }
};

const selectedTree = computed(() => {
  const selectedNodes = props.selectedNodes || []
  selectedNodes.map(item => {
    // 默认权限为1
    item.purviewRange = '1'
  })
  return selectedNodes
})

const selectedTips = computed(() => {
  const selectedDept = selectedTree.value.filter(item => item.type === 'dept')
  const selectedRole = selectedTree.value.filter(item => item.type === 'role')

  return `${selectedDept.length}个部门、${selectedRole.length}个用户组`
})

const treeNodeRef = ref(null)
const authSelected = ref('')

const onAuthChange = () => {
  selectedTree.value.map(item => {
    item.purviewRange = authSelected.value
  })
  
}

const onRemoveMember = (node) => {
  // console.log('remove mem:', node)
  treeNodeRef.value.remove(node)
}

const onPopoverHide = () => {
  authSelected.value = ''
}

const onClose = () => {
  emit('update:modelValue')
}

const onConfirm = async () => {
  let purviewList = []
  selectedTree.value.map(item => {
    purviewList.push({
      purviewId: item.id,
      purviewType: item.type === 'dept' ? '0' : '1',
      purviewRange: item.purviewRange
    })
  })
  console.log('confirm:', purviewList)

  const res = await postKnowledgeAuth({
    knowledgeId: props.knowledgeId,
    purviewList: purviewList
  })

  if(res.code === 200) {
    ElMessage({message: '添加成功', type: 'success'})
    emit('done')
    onClose()
  }else{
    ElMessage({message: res.msg || '添加失败', type: 'error'})
  }
}

const getDeepestChildren = (list) => {
  let children = []
  list.map(item => {
    if(item.isUser) {
      children.push(item)
    }else{
      if(item.children && item.children.length) {
        children = children.concat(getDeepestChildren(item.children))
      }
    }
  })
  return children
}

const onTreeCheckboxChange = (data, node, leaf) => {
  // console.log('tree checked:', data.isUser, data, node, leaf)

  let checkedKeys = treeNodeRef.value.getCheckedKeys() || []
  // console.log('all checked keys:', checkedKeys)
  // isUser=false即为成员所在的组或部门
  if(!data.isUser) {
    // 当前节点是否被选中
    let isCurChecked = false
    if(node.checkedKeys.length > 0) {
      isCurChecked = node.checkedKeys.indexOf(data.userId2) > -1
    }else{
      isCurChecked = false
    }
    // console.log('ischecked:', isCurChecked)
    if(isCurChecked) {
      if(data.children && data.children.length) {
        const deepestChildren = getDeepestChildren(data.children)
        const curCheckedKeys = deepestChildren.map(item => item.userId2)
        checkedKeys = checkedKeys.concat(curCheckedKeys)
        // console.log('deepest children:', deepestChildren)
      }else{
        checkedKeys.push(data.userId2)
      }
    }
    
  }else{
    // isUser=true, 部门或组的成员不可操作
    if(checkedKeys.indexOf(data.parentUserId2) > -1) {
      if(checkedKeys.indexOf(data.userId2) === -1) {
        checkedKeys.push(data.userId2)
      }
    }else{
      const curIndex = checkedKeys.indexOf(data.userId2)
      if(curIndex > -1) {
        checkedKeys.splice(curIndex, 1)
      }else{
        checkedKeys.push(data.userId2)
      }
      // console.log('curindex:', curIndex)
    }
  }
  
  treeNodeRef.value.setCheckedKeys(checkedKeys)


}

</script>

<style lang='less'>
.authma-wrap .authma-content .el-tabs__item {
  font-size: 14px !important;
  font-weight: 400 !important;
}
.authma-popper .authma-oper .oper-item {
  height: 32px;
  line-height: 32px;
  cursor: pointer;
}
.authma-popper .authma-oper .oper-item.del .el-radio__input {
  visibility: hidden;
}
.authma-wrap .authma-content {
  .el-tree-node.is-deepest .el-checkbox {
    display: none;
  }
}
</style>
<style scoped lang='less'>
.authma-wrap {
  height: calc(88vh - 80px - 50px);
  border: 1px solid #bbbbbb;

  .authma-header {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 0 16px;
    border-bottom: 1px dashed #bbbbbb;
  }
  .authma-total {
    flex: 1;
  }
  .authma-content {
    padding: 16px;
  }
  
  .authma-tree-node {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .authma-refer {
    display: flex;
    align-items: center;
  }
}
</style>
