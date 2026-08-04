<template>
  <div>
    <el-dialog
      :model-value="props.modelValue"
      :title="props.title"
      width="60%"
      style="height: 88vh;"
      append-to-body
      @open="onOpen"
      @close="onClose"
    >
      <el-tabs v-model="state.activeName" class="member-list-tabs">
        <el-tab-pane label="部门" name="dept"></el-tab-pane>
        <el-tab-pane label="用户组" name="role"></el-tab-pane>
      </el-tabs>
      <div class="main-area amd-wrap">
        <div class="left-area">
          <!-- <el-input
            v-if="state.activeName=='role'"
            v-model="state.filterTextRole"
            style="width: 100%;margin-bottom: 16px"
            placeholder="搜索部门、用户组"
            :clearable="true"
            @input="handleInputFilterRole"
          >
          <template #prefix>
              <svg-icon icon-class="search" style="width: 16px; height: 16px" />
            </template>
          </el-input> -->
          <el-input
            v-model="state.filterText"
            style="width: 100%;margin-bottom: 16px"
            placeholder="搜索部门、用户组"
            :clearable="true"
            @input="handleInputFilter"
          >
            <template #prefix>
              <svg-icon icon-class="search" style="width: 16px; height: 16px" />
            </template>
          </el-input>
          <div v-show="state.activeName=='role'" class="tree-content">
            <div class="content-checkbox">
              <el-checkbox v-model="state.treeRoleSelected" label="全选" @change="onAllRoleCheckboxChange"></el-checkbox>
              <el-button plain :icon="CirclePlus" size="small" @click="onCreateUserGroup">新增用户组</el-button>
            </div>
            <el-tree
              ref="treeRoleRef"
              class="filter-tree"
              :data="state.treeRoleData"
              node-key="userId2"
              show-checkbox
              :props="defaultProps"
              :filter-node-method="filterNode"
              :check-on-click-leaf="false"
              :default-expanded-keys="state.roleDefaultExpandedKeys"
              @check="onTreeRoleCheckboxChange"
              :key="state.treeRoleRefKey"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <div>
                    <span>{{ node.label }}{{data.children&&data.children.length>0?'('+data.children.length+'人)':data.title&&data.title!="null"?'（'+data.title+'）':''}}</span>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
          <div v-show="state.activeName=='dept'" class="tree-content">
            <div class="content-checkbox">
              <el-checkbox v-model="state.treeSelected" label="全选" @change="onAllCheckboxChange"></el-checkbox>
            </div>
            <el-tree
              ref="treeRef"
              class="filter-tree"
              :data="state.treeData"
              node-key="userId2"
              show-checkbox
              :props="defaultProps"
              :check-on-click-leaf="false"
              :default-expanded-keys="state.defaultExpandedKeys"
              :filter-node-method="filterNode"
              @check="onTreeCheckboxChange"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <div>
                    <span>{{ node.label }}</span>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
          
        </div>
        <div class="right-area">
          <div class="right-tips">已选：{{ getCheckedResultsCount(state.checkedResults) }}人</div>
          <div class="member-list">
            <el-tree
              ref="treeResultRef"
              class="filter-tree"
              :data="state.checkedResults"
              node-key="userId2"
              :props="defaultProps"
              show-checkbox
              @check="onTreeResultCheckboxChange"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span v-if="data.type === 'role'">{{ node.label }}{{data.children&&data.children.length>0?'('+data.children.length+'人)':data.title&&data.title!="null"?'（'+data.title+'）':''}}</span>
                  <span v-else>{{ node.label }}</span>
                  <div v-if="node.level === 1" class="node-right">
                    <span v-if="data.type === 'dept'">部门</span>
                    <span v-if="data.type === 'role'">用户组</span>
                  </div>
                </div>
              </template>
            </el-tree>
            <!-- <ul>
              <li v-for="item in state.checkedResults" :key="item.deptId">
                <el-checkbox
                  v-model="item.checked"
                  disabled
                  >{{ item.deptName}}{{item.title&&item.title!="null"?'（'+item.title+'）':''}}</el-checkbox>
              </li>
            </ul> -->
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="onClose">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <create-role v-model="state.openCreateRole" @done="loadRoleTreeData"></create-role>
  </div>
</template>
<script setup name="AddMemberDialog">
import { listDept } from "@/api/system/dept";
import { listUser } from "@/api/system/user";
import { getRoleUserList,getUserDeptTree } from "@/api/knowledge/knowledgeRole.js";  
import { nextTick } from "vue";
import { deepClone } from "@/utils";
import { CirclePlus } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import CreateRole from "../CreateRole.vue";

const router = useRouter()
const { proxy } = getCurrentInstance();
const emits = defineEmits(["update:modelValue", "done"]);
const treeRef = ref();
const treeRoleRef = ref();
const treeResultRef = ref()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '添加成员',
  },
  // exceptedUserIds: Array
  selectedNodes: {
    type: Array,
    default: []
  }
});

const state = reactive({
  results: null,
  filterText: "",
  filterTextRole: '',
  checkedResults: [],
  treeData: [],
  treeDataAll: [],
  activeName:'dept',
  exceptedUserIds:[],
  treeRoleData:[],
  treeDataAllRole:[],
  exceptedRoleIds:[],
  flatData:[],
  flatDataRole:[],
  treeRoleRefKey:1,
  checkUserIds:[],
  checkUserIdsRole:[],
  treeSelected: false,
  treeRoleSelected: false,
  treeKeys: [],
  treeRoleKeys: [],
  defaultExpandedKeys: [],
  roleDefaultExpandedKeys: [],
  selectedKeys: [],
  selectedRoleKeys: [],
  openCreateRole: false
});
const defaultProps = {
  children: "children",
  label: "deptName",
  value: "deptId",
  multiple: true,
  disabled: (data, node) => {
    // console.log('disabled:', data)
    if(data.isUser) {
      // console.log('........', data, node)
      // return !!props.selectedNodes.find(item => item.id === data.parentId)
      if(data.dataType === 'groupuser') {
        return state.selectedRoleKeys.indexOf(data.userId2) > -1
      }else if(data.dataType === 'user') {
        return state.selectedKeys.indexOf(data.userId2) > -1
      }
      return true
    }
    
    if(!data.children || !data.children.length) {
      return true
    }

    return !!props.selectedNodes.find(item => item.id === data.id || item.id === data.parentId)
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
const handleCurrentChange = (data, node, component)=>{
}
const handleChange = (val) => {
  if(state.activeName=='role'){
    state.checkUserIdsRole = [];
    state.checkedResults.forEach(i => {
      state.flatDataRole.forEach(j => {
        if(i.item.userId==j.userId){
          state.checkUserIdsRole.push(j.userId2);
        }
      });
    });
    nextTick(() => {
        treeRoleRef.value.setCheckedKeys(state.checkUserIdsRole);
    })
    console.log(state.checkUserIdsRole.length)
  }else{
    state.checkUserIds = [];
    state.checkedResults.forEach(i => {
      state.flatData.forEach(j => {
        if(i.item.userId==j.userId){
          state.checkUserIds.push(j.userId2);
        }
      });
    });
    nextTick(() => {
      treeRef.value.setCheckedKeys(state.checkUserIds);
    })
    console.log(state.checkUserIds.length)
  }
};

const loopFilter = (value, node) => {
  if(node.parent && node.parent.data && node.parent.data[defaultProps.label]) {
    const isIncludes = node.parent.data[defaultProps.label].includes(value)
    if(isIncludes) {
      return true
    }
    return loopFilter(value, node.parent.parent)
  }
}

// 未使用，可删除
const filterNode = (value, data, node) => {
  // console.log('filter node:', value, data, node)
  if (!value) return true;
  if (data.isUser) {
    if(node.parent && node.parent.data && node.parent.data[defaultProps.label]) {
      const isIncludes = node.parent.data[defaultProps.label].includes(value)
      if(isIncludes) {
        return true
      }
      return loopFilter(value, node.parent)
    }
    return false
  }
  return data[defaultProps.label].includes(value);
};
// const emitResult = () => {
//   emits("done", state.results);
//   state.results = null;
//   onClose()
// };
let inputSearchDelayTimer = null;
const handleInputFilterRole = (value) => {
  if (inputSearchDelayTimer) {
    clearTimeout(inputSearchDelayTimer);
  }
  state.treeRoleSelected = false
  onAllRoleCheckboxChange()
  inputSearchDelayTimer = setTimeout(() => {
      // handleFilterRole(value);
      treeRoleRef.value.filter(value)
  }, 500);
};
const handleFilterRole = (value) => {
  if (!value) {
    // state.roleDefaultExpandedKeys = []
    state.treeRoleData = state.treeDataAllRole;
    return;
  }
  // treeRef.value.filter(value)
  const keepKeys = {};
  const configKey = defaultProps.label;
  walkTree(
    state.treeDataAllRole,
    null,
    (node, parent) => {
      if (parent && keepKeys[parent[configKey]] == 2) {
        // 搜索到部门时，显示部门及下面的部门和用户
        keepKeys[node[configKey]] = 2;
        return;
      }
      const keepFlag = node[configKey].indexOf(value) > -1;
      if (keepFlag) {
        if (node.isUser) {
          keepKeys[node[configKey]] = 1;
          if (parent) {
            keepKeys[parent[configKey]] = keepKeys[parent[configKey]] || 1;
          }
        } else {
          keepKeys[node[configKey]] = 2;
          if (parent) {
            keepKeys[parent[configKey]] = keepKeys[parent[configKey]] || 1;
          }
        }
      } else {
        console.log('未匹配', node.deptName);
      }
    },
    (node, parent) => {
      if (keepKeys[node[configKey]]) {
        if (parent) {
          // 补齐父匹配
          keepKeys[parent[configKey]] = keepKeys[parent[configKey]] || 1;
          // state.roleDefaultExpandedKeys.push(node.userId2)
        }
      }
    }
  );
  // console.log('keepKeys',keepKeys);
  const getNewChildren = (oldChilren) => {
    const newChildren = [];
    oldChilren.forEach((node) => {
      if (keepKeys[node[configKey]]) {
        const newNode = { ...node };
        newChildren.push(newNode);
        if (node.children) {
          newNode.children = getNewChildren(node.children);
        }
      } else {
        // console.log('drop', node.deptName);
      }
    });
    // console.log('newChildren',newChildren);
    return newChildren;
  };
  const treeRoleData = getNewChildren(state.treeDataAllRole);
  state.treeRoleData = treeRoleData;
};
const handleInputFilter = (value) => {
  if (inputSearchDelayTimer) {
    clearTimeout(inputSearchDelayTimer);
  }
  state.treeSelected = false
  state.treeRoleSelected = false

  inputSearchDelayTimer = setTimeout(() => {
      // handleFilter(value);
      
      treeRef.value.filter(state.filterText)
      treeRoleRef.value.filter(state.filterText)
  }, 500);
};

const handleFilter = (value) => {
  if (!value) {
    // state.defaultExpandedKeys = []
    state.treeData = state.treeDataAll;
    return;
  }
  // treeRef.value.filter(value)
  const keepKeys = {};
  const configKey = defaultProps.label;
  walkTree(
    state.treeDataAll,
    null,
    (node, parent) => {
      console.log('xxxxxxx', keepKeys, node, parent)
      if (parent && keepKeys[parent[configKey]] == 2) {
        // 搜索到部门时，显示部门及下面的部门和用户
        keepKeys[node[configKey]] = 2;
        return;
      }
      const keepFlag = node[configKey].indexOf(value) > -1;
      console.log('keep flag:', configKey, keepFlag)
      if (keepFlag) {
        keepKeys
        if (node.isUser) {
          keepKeys[node[configKey]] = 1;
          if (parent) {
            keepKeys[parent[configKey]] = keepKeys[parent[configKey]] || 1;
          }
        } else {
          keepKeys[node[configKey]] = 2;
          if (parent) {
            keepKeys[parent[configKey]] = keepKeys[parent[configKey]] || 1;
          }
        }
      } else {
        // console.log('未匹配', node.deptName);
      }
    },
    (node, parent) => {
      if (keepKeys[node[configKey]]) {
        if (parent) {
          // 补齐父匹配
          keepKeys[parent[configKey]] = keepKeys[parent[configKey]] || 1;
          // state.defaultExpandedKeys.push(node.userId2)
        }
      }
    }
  );
  console.log('keepKeys',keepKeys);
  const getNewChildren = (oldChilren) => {
    const newChildren = [];
    oldChilren.forEach((node) => {
      if (keepKeys[node[configKey]] && !node.isUser) {
        const newNode = { ...node };
        newChildren.push(newNode);
        if (node.children) {
          newNode.children = getNewChildren(node.children);
        }
      } else {
        // console.log('drop', node.deptName);
      }
    });
    // console.log('newChildren',newChildren);
    return newChildren;
  };
  const treeData = getNewChildren(state.treeDataAll);
  console.log('filter end:', treeData)
  state.treeData = treeData;
};

const onOpen = () => {
  state.filterText = "";
  state.filterTextRole = ''
  state.results = null;
  state.checkedResults = [];
  if(props.exceptedUserIds){
    nextTick(() => {
      state.exceptedUserIds = props.exceptedUserIds;
    })
  }
  // loadTreeData();
  loadTreeData2();
  loadRoleTreeData();
};
const onClose = () => {
  // state.form = {};
  // proxy.resetForm("saveForm");
  state.activeName = "dept"
  state.checkedResults = []
  state.treeData = []
  state.treeDataAll = []
  state.treeRoleData = []
  state.treeDataAllRole = []
  state.treeSelected = false
  state.treeRoleSelected = false
  treeRef.value.setCheckedKeys([])
  treeRoleRef.value.setCheckedKeys([])
  emits("update:modelValue", false);
};
// 遍历树
const walkTree = (
  tree,
  parentNode,
  callback1,
  callback2 = () => {},
  childrenKey = "children"
) => {
  const len = tree.length;
  for (let i = 0; i < len; i++) {
    const node = tree[i];
    let flag = callback1(node, parentNode);
    if (flag) continue;
    const children = node[childrenKey];
    if (children && children.length > 0) {
      walkTree(children, node, callback1, callback2, childrenKey);
    }
    callback2(node, parentNode);
  }
};
const loadRoleTreeData = () => {
  getRoleUserList().then((response) => {
    var data = response.data;
    addParentId(data,null)
    function addParentId(data, parentId, parentUserId2) {
      data.forEach(item => {
        item.title = item.deptName?JSON.parse(JSON.stringify(item.deptName)):'';
        item.userId = item.id;
        item.deptId2 = item.id+parentId;
        item.deptName = item.name;
        item.deptId = `role_${item.id}`;
        item.parentId = parentId;
        item.parentUserId2 = parentUserId2

        if(state.exceptedUserIds.indexOf(item.id)!=-1){
          item.disabled = true;
        }
        item.userId2 = +((item.parentId?item.parentId:0)+''+item.userId);

        if(item.dataType === 'user') {
          item.dataType = 'groupuser'
          item.isUser = true
          state.treeRoleKeys.push(item.userId2)
        }else if(item.dataType === 'group') {
          if(item.children && item.children.length){
            state.treeRoleKeys.push(item.userId2)
          }
        }
        
        if (item.children && item.children.length > 0) {
          addParentId(item.children, item.id, item.userId2);
        }
      });
    }
    state.treeRoleData = data;
    // state.flatDataRole = flattenTree(state.treeRoleData);
    state.treeDataAllRole = [...state.treeRoleData];

    nextTick(() => {
      if(props.selectedNodes.length) {
        const selectedNodes = []
        props.selectedNodes.map(item => {
          const node = data.find(subItem => subItem.id === item.id)
          if(node) {
            selectedNodes.push(node)
          }      
        })

        const selectedKeys = getTreeNodesKeys(selectedNodes)
        treeRoleRef.value.setCheckedKeys(selectedKeys)

        // setTreeResults(selectedNodes => {
        //   // treeRef.value.setCheckedKeys(selectedKeys)
        //   const roleNodes = selectedNodes.filter(item => item.type === 'role')
        //   const roleKeys = getTreeNodesKeys(roleNodes)
        //   treeRoleRef.value.setCheckedKeys(roleKeys)
        //   state.selectedRoleKeys = [...roleKeys]
        // })
      }
    })
  });
};
const loadTreeData2 = () => {
  getUserDeptTree().then((response) => {
    var data = response.data;
    addParentId(data,null)
    function addParentId(data, parentId, parentUserId2) {
      data.forEach(item => {
        item.title = item.deptName?JSON.parse(JSON.stringify(item.deptName)):'';
        item.userId = item.id;
        item.deptId2 = item.id+parentId;
        item.deptName = item.label;
        item.deptId = `user_${item.id}`;
        item.parentId = parentId;
        item.parentUserId2 = parentUserId2
        if(state.exceptedUserIds.indexOf(item.id)!=-1){
          item.disabled = true;
        }
        // if(!item.children){
        //   item.isUser = true;
        // }
        item.userId2 = +((item.parentId?item.parentId:0)+''+item.userId);
        if(item.other) {
          item.dataType = item.other.dataType
          if(item.other.dataType === 'user') {
            item.isUser = true
            state.treeKeys.push(item.userId2)
          }else if(item.other.dataType === 'dept') {
            if(item.children) {
              state.treeKeys.push(item.userId2)
            }
          }
          
        }
        
        if (item.children && item.children.length > 0) {
          addParentId(item.children, item.id, item.userId2);
        }
      });
    }
    let newData = []
    data.map(item => {
      // 去掉公司这一层级，把部门层级提到最外层
      if(!item.parentId && item.children && item.children.length) {
        item.children.map(subItem => {
          subItem.parentId = null
        })
        newData = newData.concat(item.children)
      }
    })

    console.log('tree data:', [...newData])
    state.treeData = newData;
    // state.flatData = flattenTree(state.treeData);
    state.treeDataAll = [...state.treeData];

    nextTick(() => {
      if(props.selectedNodes.length) {
        const selectedNodes = []
        props.selectedNodes.map(item => {
          const node = newData.find(subItem => subItem.id === item.id)
          if(node) {
            selectedNodes.push(node)
          }
          
        })
        // console.log('selectednodes:', selectedNodes)
        const selectedKeys = getTreeNodesKeys(selectedNodes)
        treeRef.value.setCheckedKeys(selectedKeys)

        // setTreeResults(selectedNodes => {
        //   // treeRef.value.setCheckedKeys(selectedKeys)
        //   const deptNodes = selectedNodes.filter(item => item.type === 'dept')
        //   const deptKeys = getTreeNodesKeys(deptNodes)
        //   treeRef.value.setCheckedKeys(deptKeys)
        //   state.selectedKeys = [...deptKeys]
        // })
      }
    })

  });
};

const getTreeNodesKeys = (checkedNodes) => {
  let checkedKeys = []
  checkedNodes.map(item => {
    checkedKeys.push(item.userId2)
    if(item.children && item.children.length) {
      checkedKeys = checkedKeys.concat(getTreeNodesKeys(item.children))
    }
  })
  return checkedKeys
}

function flattenTree(treeData) {
  const result = [];
  const flatten = (node) => {
    result.push(node);
    if (node.children) {
      for (const child of node.children) {
        flatten(child);
      }
    }
  }
  for (const node of treeData) {
    flatten(node);
  }
  return result;
}
// const loadTreeData = () => {
//   const userPromise = listUser({
//     pageNum: 1,
//     pageSize: 9999,
//     hiddenFlag: 0
//   }).then(function (data) {
//     const rows = data?.rows || [];
//     let items = rows.map((item) => {
//       return {
//         isUser: true,
//         userId: item.userId,
//         title:item.title,
//         deptName:
//           item.nickName || item.realName || item.userName || item.userId,
//         deptId: `user_${item.userId}`,
//         parentId: item.deptId,
//       };
//     });
//     return items;
//   });
//   listDept().then((response) => {
//     userPromise.then(function (userItems) {
//       const rows = [].concat(response.data).concat(userItems);
//       state.treeData = proxy.handleTree(rows, "deptId");
//       // walkTree(state.treeData, null, updateDept);
//       state.treeDataAll = [...state.treeData];
//     });
//   });
// };

// const updateDept = (node, parentNode) => {
//   if (node.isUser) {
//     return true;
//   }
//   const children = node.children;
//   if (children && children.length > 0) {
//     let count = 0;
//     children.forEach((child) => {
//       if (child.isUser) {
//         count++;
//       }
//     });
//     if (count > 0) {
//       node[defaultProps.label] = `${node[defaultProps.label]}(${count}人)`;
//     }
//   }
// };

const handleResultCheckChange = () => {
  state.checkedResults = state.checkedResults.filter((item) => item.checked);
  if(state.activeName=='role'){
    state.checkUserIdsRole = [];
    state.checkedResults.forEach(i => {
      state.flatDataRole.forEach(j => {
        if(i.item.userId==j.userId){
          state.checkUserIdsRole.push(j.userId2);
        }
      });
    });
    nextTick(() => {
      treeRoleRef.value.setCheckedKeys(state.checkUserIdsRole);
    })
  }else{
    state.checkUserIds = [];
    state.checkedResults.forEach(i => {
      state.flatData.forEach(j => {
        if(i.item.userId==j.userId){
          state.checkUserIds.push(j.userId2);
        }
      });
    });
    nextTick(() => {
      treeRef.value.setCheckedKeys(state.checkUserIds);
    })
  }
};

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

const onTreeRoleCheckboxChange = (data, node, leaf) => {
  // console.log('tree checked:', data.isUser, data, node, leaf)

  let checkedKeys = treeRoleRef.value.getCheckedKeys() || []
  // console.log('all checked keys:', checkedKeys)
  // isUser=false即为成员所在的组或部门
  if(!data.isUser) {
    // 当前节点是否被选中
    let isCurChecked = false
    if(data.children && data.children.length) {
      const checkedChildren = []
      data.children.map(item => {
        if(checkedKeys.indexOf(item.userId2) > -1) {
          checkedChildren.push(item)
        }
      })
      // console.log('check childre:', checkedChildren)
      isCurChecked = checkedChildren.length === data.children.length
    }

    // console.log('ischecked:', isCurChecked)
    if(isCurChecked) {
      if(data.children && data.children.length) {
        const deepestChildren = getDeepestChildren(data.children)
        const curCheckedKeys = deepestChildren.map(item => item.userId2)
        checkedKeys = checkedKeys.concat(curCheckedKeys)
      }else{
        checkedKeys.push(data.userId2)
      }
    }
    
  }else{
    // isUser=true, 部门或组的成员不可操作
    const curIndex = checkedKeys.indexOf(data.userId2)
    if(curIndex > -1) {
      checkedKeys.splice(curIndex, 1)
      const parentIndex = checkedKeys.indexOf(data.parentUserId2)
      if(parentIndex > -1) {
        checkedKeys.splice(parentIndex, 1)
      }
    }else{
      checkedKeys.push(data.userId2)
    }
    // console.log('curindex:', curIndex, checkedKeys)
  }

  treeRoleRef.value.setCheckedKeys(checkedKeys)

  setTreeResults()
}

const setTreeNodeType = (treeList, type) => {
  treeList.map(item => {
    item.type = type
    if(item.children && item.children.length) {
      setTreeNodeType(item.children, type)
    }
  })
}

const setTreeResults = (from) => {
  let checkedNodes = [...treeRef.value.getCheckedNodes()]
  let checkedNodes2 = [...treeRoleRef.value.getCheckedNodes()]
  // console.log('set checked nodes:', checkedNodes2)
  
  let halfCheckedKeys = treeRef.value.getHalfCheckedKeys()

  const selectedNodes = []
  if(props.selectedNodes.length) {
    props.selectedNodes.map(item => {
      let node = null
      if(item.purviewType === '0') {
        node = state.treeDataAll.find(curNode => curNode.id === item.id)
        if(node) {
          node.type = 'dept'
        }
        
      }else if(item.purviewType === '1'){
        node = state.treeDataAllRole.find(curNode => curNode.id === item.id)
        if(node) {
          node.type = 'role'
        }
      }

      if(node) {
        selectedNodes.push(node)
      }
    })
  }
  const selectedKeys = getTreeNodesKeys(selectedNodes)
  if(selectedKeys.length) {
    checkedNodes = checkedNodes.filter(item => selectedKeys.indexOf(item.userId2) === -1)
    checkedNodes2 = checkedNodes2.filter(item => selectedKeys.indexOf(item.userId2) === -1)
    halfCheckedKeys = halfCheckedKeys.filter(item => selectedKeys.indexOf(item.userId2) === -1)
  }
  
  // console.log('set half:', halfCheckedKeys)
  const checkedTree = getCheckedTree(deepClone(checkedNodes), halfCheckedKeys)
  // checkedTree.map(item => {
  //   item.type = 'dept'
  // })
  setTreeNodeType(checkedTree, 'dept')
  // console.log('sesttre:', checkedTree)

  const checkedTree2 = getCheckedTree(deepClone(checkedNodes2))
  checkedTree2.map(item => {
    item.type = 'role'
  })

  let lastCheckedResults = []
  if(from === 'keep-selected') {
    lastCheckedResults = [...state.checkedResults]
  }
  const checkedResults = [...lastCheckedResults]
  // const checkedResultsCache = [...selectedNodes, ...checkedTree, ...checkedTree2]
  const checkedResultsCache = [...checkedTree, ...checkedTree2]
  checkedResultsCache.map(item => {
    const index = checkedResults.findIndex(myItem => myItem.id === item.id)
    if(index === -1 && !item.isUser) {
      checkedResults.push(item)
    }
  })
  state.checkedResults = [...checkedResults]

  nextTick(() => {
    const checkedKeys = treeRef.value.getCheckedKeys()
    const checkedKeys2 = treeRoleRef.value.getCheckedKeys()
    let lastCheckedKeys = []
    if(from === 'keep-selected') {
      lastCheckedKeys = getTreeNodesKeys(lastCheckedResults)
    }
    // const selectedKeys = getTreeNodesKeys(selectedNodes)

    // treeResultRef.value.setCheckedKeys([...checkedKeys, ...checkedKeys2, ...selectedKeys])
    treeResultRef.value.setCheckedKeys([...lastCheckedKeys, ...checkedKeys, ...checkedKeys2])
    // console.log('eeeeeeeee:', checkedKeys)
  })
  // if(callback && typeof callback === 'function') {
  //   callback(selectedNodes)
  // }
}

const onTreeCheckboxChange = (data, node, leaf) => {
  console.log('tree checked:', data.isUser, data, node, leaf)

  let checkedKeys = treeRef.value.getCheckedKeys() || []
  // console.log('all checked keys:', checkedKeys)
  // isUser=false即为成员所在的组或部门
  if(!data.isUser) {
    // 当前节点是否被选中
    let isCurChecked = false
    if(data.children && data.children.length) {
      const checkedChildren = []
      data.children.map(item => {
        if(checkedKeys.indexOf(item.userId2) > -1) {
          checkedChildren.push(item)
        }
      })
      // console.log('check childre:', checkedChildren)
      isCurChecked = checkedChildren.length === data.children.length
    }

    // console.log('ischecked:', isCurChecked)
    if(isCurChecked) {
      if(data.children && data.children.length) {
        const deepestChildren = getDeepestChildren(data.children)
        const curCheckedKeys = deepestChildren.map(item => item.userId2)
        checkedKeys = checkedKeys.concat(curCheckedKeys)
      }else{
        checkedKeys.push(data.userId2)
      }
    }
    
  }else{
    // isUser=true, 部门或组的成员不可操作
    const curIndex = checkedKeys.indexOf(data.userId2)
    if(curIndex > -1) {
      checkedKeys.splice(curIndex, 1)
      const parentIndex = checkedKeys.indexOf(data.parentUserId2)
      if(parentIndex > -1) {
        checkedKeys.splice(parentIndex, 1)
      }
    }else{
      checkedKeys.push(data.userId2)
    }
    // console.log('curindex:', curIndex, checkedKeys)
  }
  
  treeRef.value.setCheckedKeys(checkedKeys)

  setTreeResults()
}

const onTreeResultCheckboxChange = (data, node) => {
  console.log('tree res change:', data, node)

  let checkedKeys = treeResultRef.value.getCheckedKeys() || []
  // console.log('all checked keys:', checkedKeys)
  // isUser=false即为成员所在的组或部门
  if(!data.isUser) {
    // 当前节点是否被选中
    let isCurChecked = false
    if(data.children && data.children.length) {
      const checkedChildren = []
      data.children.map(item => {
        if(checkedKeys.indexOf(item.userId2) > -1) {
          checkedChildren.push(item)
        }
      })
      // console.log('check childre:', checkedChildren)
      isCurChecked = checkedChildren.length === data.children.length
    }

    // console.log('ischecked:', isCurChecked)
    if(isCurChecked) {
      if(data.children && data.children.length) {
        const deepestChildren = getDeepestChildren(data.children)
        const curCheckedKeys = deepestChildren.map(item => item.userId2)
        checkedKeys = checkedKeys.concat(curCheckedKeys)
      }else{
        checkedKeys.push(data.userId2)
      }
    }
    treeResultRef.value.setCheckedKeys(checkedKeys)

    state.checkedResults.map(item => {
      if(checkedKeys.indexOf(item.userId2) === -1) {
        treeResultRef.value.remove(item.userId2)
        state.treeSelected = false
        state.treeRoleSelected = false
      }
    })
  }else{
    // isUser=true, 部门或组的成员不可操作
    const curIndex = checkedKeys.indexOf(data.userId2)
    if(curIndex > -1) {
      checkedKeys.splice(curIndex, 1)
      const parentIndex = checkedKeys.indexOf(data.parentUserId2)
      if(parentIndex > -1) {
        checkedKeys.splice(parentIndex, 1)
      }
    }else{
      checkedKeys.push(data.userId2)
    }
    // console.log('curindex:', curIndex, checkedKeys)
    treeResultRef.value.setCheckedKeys(checkedKeys)

  }
  // console.log('res checked keys:', checkedKeys)

  const checkedNodes = treeResultRef.value.getCheckedNodes()
  const checkedNodes1 = checkedNodes.filter(item => item.type === 'dept')
  const checkedNodes2 = checkedNodes.filter(item => item.type === 'role')
  // console.log('res checked nodes:', checkedNodes1, checkedNodes2)

  if(props.selectedNodes.length) {
    props.selectedNodes.map(item => {
      let node = null
      if(item.purviewType === '0') {
        node = state.treeDataAll.find(curNode => curNode.id === item.id)
        if(node) {
          node.type = 'dept'
          checkedNodes1.push(node)
        }
        
      }else if(item.purviewType === '1'){
        node = state.treeDataAllRole.find(curNode => curNode.id === item.id)
        if(node) {
          node.type = 'role'
          checkedNodes2.push(node)
        }
      }
    })
  }

  const checkedKeys1 = getTreeNodesKeys(checkedNodes1)
  const checkedKeys2 = getTreeNodesKeys(checkedNodes2)

  // console.log('res checked keys:', checkedKeys1, checkedKeys2)
  
  treeRef.value.setCheckedKeys([...checkedKeys1])
  treeRoleRef.value.setCheckedKeys([...checkedKeys2])
  // console.log('xxxxxxx:', treeRef.value.getCheckedKeys())
}

const onTreeNodeClick = (data, node, treeNode, event) => {
  // state.checkedResults = [];
  if(node.checkedNodes.length==0){
    return
  }
  node.checkedNodes.forEach(i => {
    if(i.isUser){
      const index = state.checkedResults.findIndex(
      (item) => item.item.userId == i.userId
      );
      if(index==-1){
        state.checkedResults.push({ item: i, checked: true });
      }
    }
  });
};
// function uniqueObjectsByProperty(arr, key) {
//     const seen = new Map();
//     return arr.filter(item => {
//         const value = item[key];
//         return seen.has(value) ? false : seen.set(value, item);
//     });
// }

const handleCheckedNodes = (data, checkedNodes) => {
  // console.log('handlesssss', data)
  data.children = []
  checkedNodes.map(item => {
    if(item.parentId === data.id) {
      data.children.push(item)
    }else{
      if(data.children && data.children.length) {
        data.children.map(element => {
          handleCheckedNodes(element, checkedNodes)
        })
      }
    }
  })

  // if(data && data.children) {
  //   const children = []
  //   data.children.map(item => {
  //     const checkedIndex = checkedNodes.findIndex(element => element.id === item.id && element.parentId === data.id)
  //     if(checkedIndex > -1) {
  //       children.push(checkedNodes[checkedIndex])
  //     }
  //     handleCheckedNodes(item, checkedNodes)
  //   })
  //   console.log('handleeee:', children)
  //   data.children = children
  // }
}

const getCheckedTree = (checkedNodes, halfCheckedKeys = []) => {
  let checkedTree = []
  checkedNodes.map(item => {
    if(!item.parentId) {
      checkedTree.push(item)
    }else{
      if(halfCheckedKeys.length && halfCheckedKeys.indexOf(item.parentUserId2) > -1) {
        checkedTree.push(item)
      }
    }
  })

  // checkedTree.map(item => {
  //   handleCheckedNodes(item, checkedNodes)
  // })
  return checkedTree
}

const submitForm = () => {
  // console.log('submit form:', state.checkedResults)
  // state.results = state.checkedResults.map((item) => item.item);
  
  // let checkedNodes = treeResultRef.value.getCheckedNodes(false, true)
  const checkedKeys = treeResultRef.value.getCheckedKeys()

  // let checkedTree = []
  // checkedNodes.map(item => {
  //   if(!item.parentId) {
  //     checkedTree.push(item)
  //   }else {
      
  //     if(!item.isUser) {
  //       checkedTree.push(item)
  //     }
  //   }
  // })

  // console.log('new tree:', checkedNodes)

  emits("done", [...state.checkedResults], checkedKeys);
  onClose()

};

const onAllCheckboxChange = () => {
  // console.log('all change')
  if(state.treeSelected) {
    const allFilterKeys = []
    state.treeKeys.map(key => {
      const node = treeRef.value.getNode(key)
      // console.log('node:', node)
      if(node && node.visible) {
        allFilterKeys.push(key)
      }
    })
    let resultKeys = state.checkedResults.map(item => item.userId2)
    treeRef.value.setCheckedKeys([...allFilterKeys, ...resultKeys])
    setTreeResults('keep-selected')
  }else{
    const filterKeys = []
    const cancelNodes = treeRef.value.getCheckedNodes()
    const cancelKeys = []

    cancelNodes.map(item => {
      const node = treeRef.value.getNode(item.userId2)
      if(node && node.visible) {
        cancelKeys.push(item.userId2)
      }
    })

    let resultKeys = state.checkedResults.map(item => item.userId2)
    resultKeys.map(key => {
      if(cancelKeys.indexOf(key) === -1) {
        const node = treeRef.value.getNode(key)
        if(node) {
          filterKeys.push(key)
        }
      }else{
        treeResultRef.value.remove(key)
      }
      
    })

    let keepKeys = []
    if(props.selectedNodes.length) {
      const selectedNodes = []
      props.selectedNodes.map(item => {
        const node = state.treeDataAll.find(subItem => subItem.id === item.id)
        if(node) {
          selectedNodes.push(node)
        }
      })
      // console.log('lllllllll', selectedNodes)
      keepKeys = getTreeNodesKeys(selectedNodes)
    }

    treeRef.value.setCheckedKeys([...filterKeys, ...keepKeys])

    
    if(state.filterText) {
      setTreeResults('keep-selected')
    }else{
      setTreeResults()
    }
    
  }
  
}

const onAllRoleCheckboxChange = () => {
  if(state.treeRoleSelected) {
    const allFilterKeys = []
    state.treeRoleKeys.map(key => {
      const node = treeRoleRef.value.getNode(key)
      // console.log('node:', node)
      if(node && node.visible) {
        allFilterKeys.push(key)
      }
    })
    let resultKeys = state.checkedResults.map(item => item.userId2)
    treeRoleRef.value.setCheckedKeys([...allFilterKeys, ...resultKeys])
    setTreeResults('keep-selected')
  }else{
    // if(props.selectedNodes.length) {
    //   const selectedNodes = []
    //   props.selectedNodes.map(item => {
    //     const node = state.treeDataAllRole.find(subItem => subItem.id === item.id)
    //     if(node) {
    //       selectedNodes.push(node)
    //     }
    //   })
    //   const selectedKeys = getTreeNodesKeys(selectedNodes)
    //   treeRoleRef.value.setCheckedKeys(selectedKeys)
    // }else{
    //   treeRoleRef.value.setCheckedKeys([])
    // }
    const filterKeys = []
    const cancelNodes = treeRoleRef.value.getCheckedNodes()
    const cancelKeys = []

    cancelNodes.map(item => {
      const node = treeRoleRef.value.getNode(item.userId2)
      if(node && node.visible) {
        cancelKeys.push(item.userId2)
      }
    })

    let resultKeys = state.checkedResults.map(item => item.userId2)
    resultKeys.map(key => {
      if(cancelKeys.indexOf(key) === -1) {
        const node = treeRoleRef.value.getNode(key)
        if(node) {
          filterKeys.push(key)
        }
      }else{
        treeResultRef.value.remove(key)
      }
      
    })

    let keepKeys = []
    if(props.selectedNodes.length) {
      const selectedNodes = []
      props.selectedNodes.map(item => {
        const node = state.treeDataAllRole.find(subItem => subItem.id === item.id)
        if(node) {
          selectedNodes.push(node)
        }
      })
      // console.log('lllllllll', selectedNodes)
      keepKeys = getTreeNodesKeys(selectedNodes)
    }

    treeRoleRef.value.setCheckedKeys([...filterKeys, ...keepKeys])

    if(state.filterText) {
      setTreeResults('keep-selected')
    }else{
      setTreeResults()
    }
  }
  
}

const getCheckedResultsCount = (results) => {
  let checkedKeys = []
  if(treeResultRef.value) {
    checkedKeys = treeResultRef.value.getCheckedKeys()
  }
  return loopCheckedResults(results, checkedKeys)
}

const loopCheckedResults = (results, checkedKeys) => {
  let count = 0
  results.map(item => {
    if(item.isUser && checkedKeys.indexOf(item.userId2) > -1) {
      count += 1
    }
    if(item.children && item.children.length) {
      count += getCheckedResultsCount(item.children)
    }
  })
  return count
}

const onCreateUserGroup = () => {
  // const route = router.resolve('/noge/knowledgeRole?show=create')
  // window.open(route.href, '_blank')

  state.openCreateRole = true
}

</script>
<style lang="less" scoped>
.main-area {
  display: flex;
  height: calc(88vh - 80px - 50px - 54px);

  .left-area {
    flex-grow: 1;
  }
  .right-area {
    width: 50%;
    flex-shrink: 0;
    padding-left: 20px;
    // max-height: 532px;
    height: calc(88vh - 80px - 50px - 54px);
    overflow: auto;

    .right-tips {
      height: 32px;
      line-height: 32px;
      margin-bottom: 16px;
    }
  }
  .filter-tree {
    overflow: auto;
    // max-height: 500px;
    height: calc(88vh - 80px - 50px - 54px - 48px - 32px);
  }

  .custom-tree-node {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .node-right {
      margin-left: 10px;
      margin-right: 10px;
    }
  }
}
.member-list ul {
  list-style: none;
  padding-left: 10px;
}
.tree-content {
  .content-checkbox {
    border-bottom: 1px solid #eeeeee;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
}
</style>
<style lang="less">
.member-list-tabs{
  width: 100% !important;
  .el-tabs__item{
    font-size: 14px !important;
    font-weight: 400 !important;
  }
}
.amd-wrap .filter-tree {
    .el-tree-node.is-deepest .el-checkbox {
      display: none;
    }
  }
</style>