<template>
  <div class="lib-permission" v-loading="loading">
    <div class="permission-categorys">
      <div class="permission-category-list">
        <div class="permission-category-item" @click="changeCategory(AuthTypes.DEPT)"
          :class="{ 'active': activeCategory === AuthTypes.DEPT }">
          <!-- <div class="permission-category-icon department-icon"></div> -->
          <svg-icon icon-class="mp-dept" class="permission-category-icon" />
          <div class="permission-category-name">部门权限</div>
        </div>
        <div class="permission-category-item" @click="changeCategory(AuthTypes.POST)"
          :class="{ 'active': activeCategory === AuthTypes.POST }">
          <!-- <div class="permission-category-icon position-icon"></div> -->
          <svg-icon icon-class="mp-post" class="permission-category-icon" />
          <div class="permission-category-name">岗位权限</div>
        </div>
        <div class="permission-category-item" @click="changeCategory(AuthTypes.USERGROUP)"
          :class="{ 'active': activeCategory === AuthTypes.USERGROUP }">
          <!-- <div class="permission-category-icon group-icon"></div> -->
          <svg-icon icon-class="mp-group" class="permission-category-icon" />
          <div class="permission-category-name">用户组权限</div>
        </div>
      </div>
    </div>
    <el-table style="width: 100%" v-bind="tableBinds" class="permission-table">
      <el-table-column prop="authName" label="授权可见主体 (对象)" min-width="180" />
      <!-- <el-table-column prop="role" label="形态" width="180" /> -->
      <el-table-column label="可管理 (Manage)" width="180">
        <template #default="scope">
          <div class="op-cell flex items-center gap-1">
            <el-checkbox v-model="scope.row.manageFlag" :true-value="1" :false-value="0"
              @change="toggleAuth(scope.row, 'manageFlag')" />
            <el-button v-if="activeCategory === AuthTypes.DEPT" class="mini-btn"
              @click.stop="handleSubClick(scope.row, 'manageFlag')">子</el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="问答检索 (Query)" width="180">
        <template #default="scope">
          <div class="op-cell flex items-center gap-1">
            <el-checkbox v-model="scope.row.queryFlag" :true-value="1" :false-value="0"
              @change="toggleAuth(scope.row, 'queryFlag')" />
            <el-button v-if="activeCategory === AuthTypes.DEPT" class="mini-btn"
              @click.stop="handleSubClick(scope.row, 'queryFlag')">子</el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="原始下载 (Download)" width="180">
        <template #default="scope">
          <div class="op-cell flex items-center gap-1">
            <el-checkbox v-model="scope.row.downloadFlag" :true-value="1" :false-value="0"
              @change="toggleAuth(scope.row, 'downloadFlag')" />
            <el-button v-if="activeCategory === AuthTypes.DEPT" class="mini-btn"
              @click.stop="handleSubClick(scope.row, 'downloadFlag')">子</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="activeCategory != AuthTypes.DEPT && total > 0" :total="total" v-model:page="pageInfo.pageNum"
      v-model:limit="pageInfo.pageSize" @pagination="getTableDatas" />
  </div>
</template>
<script setup lang="ts" name="LibPerm">
import { listDept } from '@/api/system/dept'
import { AuthTypes, getKnowledgeLibPermissionsApi, updateFaqAuthApi, updateKnowledgeAuthApi } from "@/api/knowledgeLib/knowledgeAuth";
import { AjaxResult, KnowledgeAuthBatchSaveParam, KnowledgeAuthEntity, KnowledgeAuthSingleSave, KnowledgeAuthType, KnowledgePermQueryParams, SysDept } from "@/types";
import { walkTreeData } from '@/utils';
const props = defineProps({
  dataId: {
    type: [String, Number],
  },
});
type PermissionCategory = typeof AuthTypes[keyof typeof AuthTypes];

interface TreeDept extends SysDept, KnowledgeAuthEntity {
  // checked: boolean
  children?: TreeDept[]
  hasChildren?: boolean;
  dataId: string;
}
const activeCategory = ref<PermissionCategory>(AuthTypes.DEPT);
const changeCategory = (val: PermissionCategory) => {
  activeCategory.value = val;
  pageInfo.pageNum = 1;
  if (val === AuthTypes.DEPT) {
    tableData.value = []
    deptTreeData.value = []
    getDeptTreeData();
  }
  getTableDatas();
};
const pageInfo = reactive({
  pageNum: 1,
  pageSize: 10,
});
const loading = ref(false);
const tableData = ref<KnowledgeAuthEntity[]>([]);
const total = ref(0);

const tableBinds = computed(() => {
  const binds: any = {}
  const authDatas = tableData.value;
  if (activeCategory.value === AuthTypes.DEPT) {
    const deptDataMapValue = deptDataMap.value
    const deptTreeDataValue = deptTreeData.value
    if (deptTreeDataValue.length > 0) {
      authDatas.forEach((item: KnowledgeAuthEntity) => {
        const deptItem = deptDataMapValue[item.authId!]
        if (deptItem) {
          Object.assign(deptItem, item)
        }
      })
    }
    binds.data = deptTreeDataValue;
    binds.rowKey = 'dataId';
    binds.defaultExpandAll = true;
    binds.treeProps = {
      children: 'children',
      hasChildren: 'hasChildren',
    };
  } else {
    binds.data = authDatas;
  }
  return binds;
});

const getTableDatas = () => {
  loading.value = true;
  const params: KnowledgePermQueryParams = {
    // pageNum: pageInfo.pageNum,
    // pageSize: pageInfo.pageSize,
    authType: activeCategory.value,
    knowledgeId: props.dataId,
  };
  if (activeCategory.value != AuthTypes.DEPT) {
    params.pageNum = pageInfo.pageNum;
    params.pageSize = pageInfo.pageSize;
  }
  getKnowledgeLibPermissionsApi(params).then((res) => {
    total.value = +res.total || 0;
    tableData.value = res.rows || [];
  }).finally(() => {
    loading.value = false;
  });
};

const deptDataMap = ref<Record<string, TreeDept>>({})
const deptTreeData = ref<TreeDept[]>([])
const toThinItem = (item: SysDept): TreeDept => {
  return {
    deptId: item.deptId,
    dataId: String(item.deptId),
    parentId: item.parentId,
    deptName: item.deptName,
    // checked: false,
    hasChildren: false
  }
}
const getDeptTreeData = async () => {
  await listDept({ status: "0" }).then(res => {
    const flatList = (res.data || []).map(toThinItem);
    const mapData = flatList.reduce((acc, cur) => {
      acc[cur.dataId] = cur
      return acc
    }, {} as Record<string, TreeDept>)
    deptDataMap.value = mapData
    // console.log('mapData',mapData)
    const rootItems: TreeDept[] = [];
    flatList.forEach(item => {
      item.manageFlag = 0
      item.downloadFlag = 0
      item.queryFlag = 0
      if (item.parentId) {
        const parentItem = mapData[item.parentId]
        if (parentItem) {
          if (!parentItem.children) parentItem.children = []
          parentItem.children.push(item)
          parentItem.hasChildren = true
        } else {
          console.log('parentItem not found', item)
        }
      } else {
        rootItems.push(item)
      }
    })
    deptTreeData.value = rootItems
    console.log('deptTreeData', [...rootItems])
  })
}
const toggleAuth = (kb: KnowledgeAuthEntity, flag: keyof KnowledgeAuthEntity) => {
  const value = (kb as any)[flag];
  const params: KnowledgeAuthSingleSave = {
    knowledgeId: kb.knowledgeId! || props.dataId,
    authId: kb.authId!,
    authType: kb.authType!,
    [flag]: value,
  }
  loading.value = true;
  return updateKnowledgeAuthApi(params).then((res: AjaxResult) => {
    if (res.code != 200) {
      getTableDatas()
    } else {
      loading.value = false;
    }
  }, () => {
    getTableDatas()
  })
}
const handleSubClick = (data: TreeDept, flag: keyof TreeDept) => {
  console.log('handleSubClick1', data)
  const newChecked: any = data[flag] === 0 ? 1 : 0;
  ; (data as any)[flag] = newChecked;
  handleDeptTreeCheckChange(data, flag)
}
const handleDeptTreeCheckChange = (data: TreeDept, flag: keyof TreeDept) => {
  const newChecked: any = data[flag];
  const authList: KnowledgeAuthType[] = []
  const params: KnowledgeAuthBatchSaveParam = {
    knowledgeId: data.knowledgeId! || props.dataId,
    authList,
    [flag]: newChecked ? 1 : 0,
  };
  authList.push({
    authId: data.authId!,
    authType: data.authType!,
  });
  walkTreeData(data.children, (item: TreeDept) => {
    ; (item as any)[flag] = newChecked
    authList.push({
      authId: item.authId!,
      authType: item.authType!,
    });
  })
  loading.value = true;
  updateFaqAuthApi(params).then((res) => {
    if (res.code != 200) {
      getTableDatas()
    } else {
      loading.value = false;
    }
  }, () => {
    getTableDatas()
  })
}

changeCategory(AuthTypes.DEPT);
</script>
<style lang="scss" scoped>
.lib-permission {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &::after {
    content: ' ';
    width: 100%;
    height: 30px;
  }
}


.permission-table {
  flex-grow: 1;
  overflow: auto;
  --el-table-row-hover-bg-color: rgba(235, 243, 245, 0.6);

  :deep(.el-table__cell) {
    padding: 4px 0;
  }

  :deep(.el-table__header) {
    border-radius: 12px 12px 0 0;
    overflow: hidden;
  }
}

.permission-categorys {
  margin-bottom: 15px;
}

.permission-category-list {
  display: flex;
  justify-content: flex-start;
}

.permission-category-item {
  flex-grow: 1;
  min-width: 240px;
  margin-right: 16px;
  padding: 12px;
  // display: flex;
  // justify-content: flex-start;
  // align-items: flex-start;
  box-sizing: border-box;
  border-radius: 12px 12px 12px 12px;
  border: 1px solid #E1E6EC;
  cursor: pointer;
  text-align: center;
  color: #2B2F33;
  background-color: #fff;

  &.active {
    border-color: #409eff;
    color: var(--el-color-primary);
    background-color: #EBF3F5;
  }

  &:hover {
    border-color: #409eff;
    background-color: #f6f8fc;
    color: var(--el-color-primary);
  }

  &:last-child {
    margin-right: 0;
  }

  .permission-category-icon {
    width: 24px;
    height: 24px;
    // margin-right: 10px;
    // background-color: #414c5e;
    // background-size: 100% 100%;
    // background-position: center;
  }

  // .department-icon {
  //   background-image: url("@/assets/images/knowledge/dept.png");
  // }

  // .position-icon {
  //   background-image: url("@/assets/images/knowledge/posi.png");
  // }

  // .group-icon {
  //   background-image: url("@/assets/images/knowledge/group.png");
  // }

  .permission-category-name {
    font-size: 14px;
    line-height: 20px;
    font-weight: bold;
    // color: #303133;
  }
}

.op-cell {
  .mini-btn {
    display: none;
  }

  &:hover {
    .mini-btn {
      display: block;
    }
  }
}
</style>
