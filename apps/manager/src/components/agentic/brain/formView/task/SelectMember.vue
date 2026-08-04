<template>
  <div class="select-member">
    <div class="select-member-title">选择成员</div>
    <div class="select-member-search">
      <el-input v-model="searchText" clearable @keyup.enter="handleSearch" @input="handleDelaySearch"
        placeholder="搜索姓名、部门、岗位、用户组"></el-input>
    </div>
    <div class="select-member-tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all"></el-tab-pane>
        <el-tab-pane label="部门" name="department"></el-tab-pane>
        <el-tab-pane label="岗位" name="position"></el-tab-pane>
        <el-tab-pane label="用户组" name="userGroup"></el-tab-pane>
        <el-tab-pane label="用户" name="user"></el-tab-pane>
      </el-tabs>
    </div>
    <div class="select-member-list">
      <el-tree ref="treeRef" :data="treeData" default-expand-all :expand-on-click-node="false" class="member-tree"
        node-key="treeId" :filter-node-method="filterNode" @node-click="handleNodeClick">
        <template #default="{ node, data }">
          <div class="custom-tree-node">
            <DataTypeIcon :type="data.type" :label="data.typeName" />
            <span class="custom-label">{{ node.label }}</span>
            <el-button v-if="data.children?.length > 0" class="mini-btn"
              @click.stop="handleSubClick(data)">子</el-button>
          </div>
        </template>
      </el-tree>
    </div>
  </div>
</template>
<script setup lang="ts">

// import SubCheckTree from '@/components/SubCheckTree/index.vue'
import DeptServiceFactory, { TreeDept } from '@/service/deptService';
import PositionServiceFactory, { PositionEntity } from '@/service/positionService';
import GroupServiceFactory, { GroupEntity } from '@/service/groupService';
import UserServiceFactory, { UserEntity } from '@/service/userService';


import { walkTreeData } from '@/utils';
import { BusinessRoleEntity, SysDept, SysPost, SysUser } from '@/types';
import { TreeData, allId, DataTypes, HistoryManage, MemtionItem } from './task';
import DataTypeIcon from './DataTypeIcon.vue';

const emit = defineEmits('items', 'item')
const historyManage = new HistoryManage()

const emitItem = (item: TreeData) => {
  emit('item', item)
  historyManage.add(item)
}
const emitItems = (items: TreeData[]) => {
  emit('items', items)
  // historyManage.allList(items)
  historyManage.add(items[0])
}

const deptService = DeptServiceFactory<TreeData>({
  autoLoad: false,
  idKey: 'dataId',
  toThin: (deptData: SysDept) => {
    const newItem: TreeData = {
      deptId: deptData.deptId,
      parentId: deptData.parentId,
      name: deptData.deptName!,
      label: deptData.deptName!,
      checked: false,
      type: DataTypes.DEPT,
      dataId: deptData.deptId?.toString() || '',
      typeName: '部门',
      treeId: '',
      sname: ''
    };
    newItem.treeId = `dept_${newItem.dataId}`
    newItem.sname = newItem.name?.toLowerCase()
    // if (deptData.children) {
    //   if (deptData.children.length > 0) {
    //     newItem.children = deptData.children.map(deptDataToTreeData)
    //     newItem.name += `(${newItem.children.length || 0})`
    //   }
    // }
    return newItem;
  },
});
const positionService = PositionServiceFactory<TreeData>({
  autoLoad: false,
  idKey: 'dataId',
  toThin: (positionData: SysPost) => {
    const newItem: TreeData = {
      name: positionData.postName!,
      label: positionData.postName!,
      checked: false,
      type: DataTypes.POSITION,
      dataId: positionData.postId?.toString() || '',
      typeName: '岗位',
      treeId: '',
      sname: ''
    };
    newItem.treeId = `position_${newItem.dataId}`
    newItem.sname = newItem.name?.toLowerCase()
    return newItem;
  }
});
const groupService = GroupServiceFactory<TreeData>({
  autoLoad: false,
  idKey: 'dataId',
  toThin: (groupData: BusinessRoleEntity) => {
    const newItem: TreeData = {
      name: groupData.roleName!,
      label: groupData.roleName!,
      checked: false,
      type: DataTypes.USERGROUP,
      dataId: groupData.id?.toString() || '',
      typeName: '用户组',
      treeId: '',
      sname: ''
    };
    newItem.treeId = `group_${newItem.dataId}`
    newItem.sname = newItem.name?.toLowerCase()
    return newItem;
  }
});
const userService = UserServiceFactory<TreeData>({
  autoLoad: false,
  idKey: 'dataId',
  toThin: (userData: SysUser) => {
    const name = userData.nickName || userData.userName || userData.userId?.toString() || ''
    const newItem: TreeData = {
      name: name,
      label: name,
      checked: false,
      type: DataTypes.USER,
      dataId: userData.userId?.toString() || '',
      typeName: name.substring(0, 2),
      treeId: '',
      sname: ''
    };
    newItem.treeId = `user_${newItem.dataId}`
    newItem.sname = newItem.name?.toLowerCase()
    return newItem;
  }
});

const treeData = ref<TreeData[]>([]);

const deptDataToTreeData = (deptData: TreeData) => {
  // const newItem: TreeData = {
  //   name: deptData.deptName!,
  //   checked: false,
  //   type: DataTypes.DEPT,
  //   id: deptData.deptId?.toString() || '',
  //   typeName: '部',
  // };
  const newItem: TreeData = {
    ...deptData
  }
  if (deptData.children) {
    if (deptData.children.length > 0) {
      newItem.children = deptData.children.map(deptDataToTreeData)
      newItem.label += `(${newItem.children?.length || 0})`
    }
  }
  return newItem;
}
const positionDataToTreeData = (positionData: TreeData) => {
  const newItem: TreeData = {
    // name: positionData.postName!,
    // checked: false,
    // type: DataTypes.POSITION,
    // id: positionData.postId?.toString() || '',
    // typeName: '岗',
    ...positionData
  };
  return newItem;
}
const groupDataToTreeData = (groupData: TreeData) => {
  const newItem: TreeData = {
    ...groupData,
    // name: groupData.groupName!,
    // checked: false,
    // type: DataTypes.USERGROUP,
    // id: groupData.id,
    // typeName: '组',
  };
  return newItem;
}
const userDataToTreeData = (userData: TreeData) => {
  const newItem: any = {
    ...userData,
    // name: userData.userName!,
    // checked: false,
    // type: DataTypes.USER,
    // id: userData.userId?.toString() || '',
    // typeName: userData.userName?.substring(0,2) || '',
  };
  return newItem;
}
const buildAllItemData = (): TreeData => {
  return {
    checked: false,
    label: '所有人',
    treeId: '_all_',
    sname: '所有人',
    typeName: '所有',
    id: allId,
    type: DataTypes.USER,
    name: '所有人',
    dataId: allId.toString(),
  }
}
const buildTreeData = () => {
  // const deptTreeData = deptService.treeData.map(deptDataToTreeData);
  // const positionData = positionService.listData.map(positionDataToTreeData);
  // const groupData = groupService.listData.map(groupDataToTreeData);
  // const userData = userService.listData.map(userDataToTreeData);
  const activeTabValue = activeTab.value;
  let tmpTreeData: TreeData[] | null = null;
  const sorter = (a: TreeData, b: TreeData) => a.name > b.name ? 1 : -1
  if (activeTabValue === 'all') {
    // 所有人选项要放在最前面
    const allItemData = buildAllItemData();
    let deptTreeData = deptService.treeData.map(deptDataToTreeData);
    let positionData = positionService.listData.map(positionDataToTreeData);
    let groupData = groupService.listData.map(groupDataToTreeData);
    let userData = userService.listData.map(userDataToTreeData);

    deptTreeData.sort(sorter)
    positionData.sort(sorter)
    groupData.sort(sorter)
    userData.sort(sorter)

    const historyList = historyManage.get();
    tmpTreeData = [allItemData];
    const deptDataMap = deptService.dataMap;
    const positionDataMap = positionService.dataMap;
    const groupDataMap = groupService.dataMap;
    const userDataMap = userService.dataMap;
    historyList.forEach((item: MemtionItem) => {
      if (item.type === DataTypes.DEPT) {
        const deptItem = deptDataMap[item.dataId]
        deptTreeData = deptTreeData.filter((item: TreeData) => item !== deptItem)
        tmpTreeData!.push(deptItem)
      } else if (item.type === DataTypes.POSITION) {
        const positionItem = positionDataMap[item.dataId]
        positionData = positionData.filter((item: TreeData) => item !== positionItem)
        tmpTreeData!.push(positionItem)
      } else if (item.type === DataTypes.USERGROUP) {
        const groupItem = groupDataMap[item.dataId]
        groupData = groupData.filter((item: TreeData) => item !== groupItem)
        tmpTreeData!.push(groupItem)
      } else if (item.type === DataTypes.USER) {
        const userItem = userDataMap[item.dataId]
        userData = userData.filter((item: TreeData) => item !== userItem)
        tmpTreeData!.push(userItem)
      }
    })
    tmpTreeData.push(...userData, ...deptTreeData, ...positionData, ...groupData);
  }
  else if (activeTabValue === 'department') {
    const deptTreeData = deptService.treeData.map(deptDataToTreeData);
    deptTreeData.sort(sorter)
    tmpTreeData = deptTreeData;
  }
  else if (activeTabValue === 'position') {
    const positionData = positionService.listData.map(positionDataToTreeData);
    positionData.sort(sorter)
    tmpTreeData = positionData;
  }
  else if (activeTabValue === 'userGroup') {
    const groupData = groupService.listData.map(groupDataToTreeData);
    groupData.sort(sorter)
    tmpTreeData = groupData;
  }
  else if (activeTabValue === 'user') {
    const allItemData = buildAllItemData();
    const userData = userService.listData.map(userDataToTreeData);
    userData.sort(sorter)
    tmpTreeData = [allItemData, ...userData];
  } else {
    tmpTreeData = []
  }
  treeData.value = tmpTreeData;
};

const treeRef = ref(null);
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.sname?.includes(value) || false
};
const filter = (value: string) => {
  treeRef.value?.filter(value)
}

const handleNodeClick = (data: TreeData) => {
  // toggleChecked(data)
  emitItem(data)
};
// const toggleChecked = (data: { checked: boolean }) => {
//   data.checked = !data.checked
// }
const handleSubClick = (data: TreeData) => {
  // const newChecked = !data.checked
  // data.checked = newChecked
  const items = [];
  items.push(data);
  walkTreeData(data.children, (item: TreeData) => {
    // item.checked = newChecked
    items.push(item);
  })
  emitItems(items)
  // handleDeptTreeCheckChange(data, false)
};


const searchText = ref('');
const handleSearch = () => {
  if (delaySearchTimeout) clearTimeout(delaySearchTimeout)
  filter(searchText.value.toLowerCase())
}
let delaySearchTimeout: any = null
const handleDelaySearch = () => {
  if (delaySearchTimeout) clearTimeout(delaySearchTimeout)
  delaySearchTimeout = setTimeout(() => {
    delaySearchTimeout = null;
    filter(searchText.value.toLowerCase())
  }, 800)
}

const activeTab = ref('all');
const handleTabChange = () => {
  console.log('handleTabChange', activeTab.value)
  buildTreeData();
  nextTick(() => {
    if (searchText.value) {
      handleSearch()
    }
  })
}

// const loadHistory = () => { }

Promise.all([
  deptService.load(),
  positionService.load(),
  groupService.load(),
  userService.load()
]).then(buildTreeData)
</script>
<style scoped lang="scss">
.select-member {
  // max-height: 500px;
  overflow: auto;
  width: 100%;
}

.select-member-tabs {

  // :deep(.el-tabs__header) {
  //   border-bottom: none;
  // }
  :deep(.el-tabs__content) {
    display: none;
  }
}

.select-member-list {
  max-height: 350px;
  overflow: auto;
}

.member-tree {
  --el-tree-node-content-height: 36px;
}

.custom-tree-node {
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 5px 4px 0;
}
</style>
