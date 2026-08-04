<template>
  <el-dialog v-model="props.modelValue" :title="props.title" style="height: 88vh; width: 500px;" @close="onClose">
    <div class="authdetail-wrap">
      <el-tree
        v-if="treeData.length"
        ref="treeNodeRef"
        class="authma-tree"
        :data="treeData"
        node-key="id"
        :props="defaultProps"
        :default-expanded-keys="defaultExpandedKeys"
      >
        <template #default="{ node, data }">
          <div class="authdetail-node">
            <div class="node-left">
              <el-icon v-if="node.childNodes.length" class="node-icon"><Operation /></el-icon>
              <el-icon v-else class="node-icon"><User /></el-icon>
              <span>{{ node.label }}</span>
            </div>
            <span v-if="data">{{ data.purviewType === '0' ? '部门' : data.purviewType === '1' ? '用户组' : '' }}</span>
          </div>
        </template>
      </el-tree>
    </div>
  </el-dialog>
</template>

<script setup>
import { watch } from 'vue'


const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '可查看/下载人员'
  },
  dataList: {
    type: Array,
    default: []
  },
  expandId: {
    type: [String, Number],
    default: ''
  }
})

const treeData = ref([])
const defaultExpandedKeys = ref([])

const loopTreeData = (item, pid) => {
  // const treeData = []
  const type = typeof item
  let treeItem = null
  // console.log('loopppppp:', type)
  if(type === 'object') {
    for (const key in item) {
      // console.log('xxxxxxxx', key)
      if (Object.prototype.hasOwnProperty.call(item, key)) {
        const element = item[key];
        treeItem = {
          id: pid + '_' + key,
          label: key,
          children: []
        }
        // console.log('eleeeeeee', element)
        if(Array.isArray(element)) {
          element.map(curItem => {
            const loopItem = loopTreeData(curItem)
            treeItem.children.push(loopItem)
          })
        }
      }
    }
  }else if(type === 'string') {
    treeItem = {
      id: pid + '_' + item,
      label: item,
    }
  }
  return treeItem
}

const handleTreeData = () => {
  const dataList = props.dataList
  const tree = []
  dataList.map(item => {
    let treeItem = {
      id: item.id,
      label: item.purviewName,
      purviewId: item.purviewId,
      purviewName: item.purviewName,
      purviewType: item.purviewType,
      purviewRange: item.purviewRange,
      children: []
    }
    if(item.userNames && item.userNames.length) {
      item.userNames.map(subItem => {
        // treeItem.children.push({
        //   id: item.id + '_' + subItem,
        //   label: subItem
        // })
        const loopItem = loopTreeData(subItem, item.id)
        treeItem.children.push(loopItem)
      })
    }
    tree.push(treeItem)
  })
  console.log('treeeeeeee:', tree)
  treeData.value = tree
  defaultExpandedKeys.value = [props.expandId]
}

const defaultProps = {
  children: "children",
  label: "label",
  value: "id",
}

watch(() => props.modelValue, (newVal, oldVal) => {
  if(newVal && newVal !== oldVal) {
    handleTreeData()
  }
})

const emit = defineEmits(['update:modelValue'])

const onClose = () => {
  emit('update:modelValue', false)
  treeData.value = []
}

</script>

<style scoped lang='less'>
.authdetail-wrap {
  height: calc(88vh - 80px);
  border: 1px solid #eeeeee;
  box-sizing: border-box;
  padding: 10px;
  overflow-y: auto;

  .authdetail-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    box-sizing: border-box;
    padding-right: 10px;

    .node-left {
      display: flex;
      align-items: center;
    }

    .node-icon {
       margin-right: 10px;
    }
  }
}
</style>
