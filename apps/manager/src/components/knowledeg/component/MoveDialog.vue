<template>
  <el-dialog
    title="移动到"
    :model-value="props.modelValue"
    width="700px"
    @update:model-value="emits('update:modelValue', $event)"
  >
    <div class="top-operate">
      <div>选择要放的目录位置</div>
      <div class="top-operate-button">
        <div>
          <!-- 树筛选 -->
          <el-tree-select
            v-if="state.selectInfo.searchVisiable"
            ref="treeSelectRef"
            v-model="state.selectInfo.treeSelect"
            v-click-outside="clickOutsideClick"
            :data="state.dataSource"
            check-strictly
            @change="selectTreeNode"
            node-key="code"
            :expand-on-click-node="false"
            clearable
            placeholder="目录搜索"
            filterable
            :props="{
              value: 'code',
              label: 'fileName',
              children: 'children',
              disabled: 'disabled',
            }"
            style="width: 240px"
          />
          <el-tooltip v-else placement="top" content="搜索">
            <svg-icon
              class="top-opearte-button-icon"
              @click="showSelectTreeNode"
              icon-class="search-1"
            />
          </el-tooltip>
        </div>
        <div>
          <el-tooltip placement="top" content="置顶">
            <svg-icon
              class="top-opearte-button-icon"
              @click="handleTop"
              icon-class="top"
            />
          </el-tooltip>
        </div>
        <div>
          <el-tooltip placement="top" content="置底">
            <svg-icon
              class="top-opearte-button-icon"
              @click="handleBottom"
              icon-class="bottom"
            />
          </el-tooltip>
        </div>
      </div>
    </div>

    <el-row style="margin-top: 8px">
      <el-col>
        <el-tree
          style="max-width: 1200px"
          class="folder-tree"
          :data="state.dataSource"
          :props="{
            value: 'code',
            label: 'fileName',
            children: 'children',
            disabled: 'disabled',
          }"
          :draggable="false"
          node-key="code"
          :default-expanded-keys="[selectCode, state.selectInfo.code]"
          :expand-on-click-node="false"
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <div
              :class="{
                'custom-tree-node': true,
                'custom-tree-node-disabled': node.disabled,
              }"
            >
              <div
                style="
                  display: flex;
                  justify-content: flex-start;
                  align-items: center;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                "
              >
                <svg-icon
                  v-if="node.type === 'folder'"
                  class="svg-icon-style file-icon"
                  icon-class="folder"
                />
                <svg-icon
                  v-else
                  class="svg-icon-style file-icon"
                  icon-class="file"
                />
                <span>{{
                  node.label &&
                  (node.label.length > 20
                    ? node.label.slice(0, 20) + "..."
                    : node.label)
                }}</span>
              </div>
              <div
                v-if="data.code === state.selectInfo.code"
                style="
                  display: flex;
                  justify-content: flex-end;
                  align-items: center;
                "
                @click.stop
              >
                <span>移动为</span>
                <el-radio-group
                  style="margin-left: 20px"
                  v-model="state.selectInfo.type"
                  @change="levelClickChange"
                >
                  <el-radio key="same" label="same">同级</el-radio>
                  <el-radio key="child" label="child">子级</el-radio>
                </el-radio-group>
              </div>
            </div>
          </template>
        </el-tree>
      </el-col>
    </el-row>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          :disabled="isSubmit"
          type="primary"
          @click="submitMoveFolder"
        >
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="FlieNameDialog">
import {
  defineProps,
  defineEmits,
  watchEffect,
  ref,
  nextTick,
  onMounted,
  getCurrentInstance,
  computed,
} from "vue";
import {
  addFolder,
  renameFileApi,
  queryFileTree,
  delLibFileApi,
} from "@/api/knowledge/knowledgeApi";
import { folderMove } from "@/api/knowledge/fileMove";

const treeSelectRef = ref(null);

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  knowledgeId: {
    type: Number,
    default: null,
  },
  selectCode: {
    type: String,
    default: "",
  },
});
const emits = defineEmits(["update:modelValue", "successMove", "done"]);
const state = reactive({
  folderName: "",
  dataSource: [], // 树数据
  changeNode: {}, // 需要改变的节点
  nodeSearchMap: new Map(),
  selectInfo: {
    code: "",
    type: "",
    selectNode: null,
    moveType: "",
    treeSelect: "", // 筛选树选择内容
    searchVisiable: false,
  },
  rules: {
    folderName: [
      {
        required: true,
        message: "请输入文件夹名称",
        trigger: "blur",
      },
    ],
  },
  addForm: {
    folderName: "",
  },
  fileNameParams: {},
});
top.state = state;
const clickOutsideClick = () => {
  if (state.selectInfo.searchShow) {
    state.selectInfo.searchVisiable = false;
    state.selectInfo.searchShow = false;
  }
};
const { proxy } = getCurrentInstance();
const submitMoveFolder = async () => {
  // 提交
  const res = await folderMove({
    action: state?.selectInfo?.code ? "move" : state.selectInfo.moveType,
    sourceFloderId: state?.changeNode?.id,
    sourceKnowledgeId: props.knowledgeId,
    type: state?.selectInfo?.type,
    targetFloderId: state?.selectInfo?.selectNode?.id,
  });
  if (res?.code === 200) {
    proxy.$modal.msgSuccess("移动成功");
    // 关闭弹窗
    emits("successMove");
    emits("update:modelValue", false);
  }
};
top.state = state;

const isSubmit = computed(() => {
  return !(
    (state?.selectInfo?.code && state?.selectInfo?.type) ||
    state.selectInfo.moveType == "top" ||
    state.selectInfo.moveType == "bottom"
  );
});

const levelClickChange = (data) => {
  clickOutsideClick();
  // 移除原来的节点
  removeChangeNode();
  appendChangeNode(
    state.dataSource,
    state.selectInfo.code,
    state.changeNode,
    data
  );
};

// 树相关事件-开始 ----------------------------------------------------------------
/**
 * 获取树列表
 * @param knowledgeId
 */
const getList = async (knowledgeId) => {
  let res = await queryFileTree(knowledgeId);
  if (res.code === 200) {
    res.data.forEach((item) => {
      disableNodeByCode(item, props.selectCode, false);
    });
    state.dataSource = res.data;
    // 获取到所有节点了, 构建搜索map
    state.nodeSearchMap = setSearchMap(state.dataSource);
  }
};

const setSearchMap = (nodes) => {
  const map = new Map();
  const traverseTree = (nodes) => {
    nodes.forEach((node) => {
      map.set(node.code, node);
      if (node.children && node.children.length > 0) {
        traverseTree(node.children);
      }
    });
  };
  traverseTree(nodes);
  return map;
};

/**
 * 树节点选择
 * @param data
 */
const selectTreeNode = (data) => {
  const node = state.nodeSearchMap.get(data);
  if (node) {
    // 更改选择的节点
    handleNodeClick(node);
    nextTick(() => {
      clickOutsideClick();
      // state.selectInfo.searchVisiable = false;
      // 选择完成之后清空输入
      state.selectInfo.treeSelect = "";
    });
  }
};

const showSelectTreeNode = () => {
  state.selectInfo.searchVisiable = true;
  nextTick(() => {
    treeSelectRef.value.focus();
    // 显示后开启焦可隐藏
    setTimeout(() => {
      // 这个必须要延迟执行, 选择框打开后, 会立即关闭
      state.selectInfo.searchShow = true;
    }, 100);
  });
};

/**
 * 置顶
 */
const handleTop = () => {
  state.selectInfo.moveType = "top";
  removeChangeNode();
  // 移除选中状态
  removeSelectStatus();
  nextTick(() => {
    // 节点更改
    state.dataSource.unshift(state.changeNode);
  });
};
const handleBottom = () => {
  state.selectInfo.moveType = "bottom";
  removeChangeNode();
  removeSelectStatus();
  nextTick(() => {
    state.dataSource.push(state.changeNode);
  });
};

const removeSelectStatus = () => {
  state.selectInfo.code = ""; // 占位, 防止为空
  state.selectInfo.type = null;
  state.selectInfo.selectNode = null;
};

/**
 * 移除需要移动的节点
 */
// const removeChangeNode = () => {
//   recursionNode(state.dataSource);
// };
const removeChangeNode = () => {
  recursionNode(state.dataSource, state.changeNode.code);
};

// const appendChangeNode = (nodes) => {
//   debugger;
//   let appendIndex = -1;
//   nodes.forEach((item, index) => {
//     console.log("比较", item.code, state.selectInfo.code);
//     if (item.code === state.selectInfo.code) {
//       appendIndex = index;
//     }
//     if (appendIndex !== -1) {
//       console.log("appendIndex", appendIndex);
//       if (nodes.children) {
//         appendChangeNode(nodes.children);
//       }
//     }
//   });
//   if (appendIndex !== -1) {
//     nodes.splice(appendIndex, 0, state.changeNode);
//   }
// };

const appendChangeNode = (nodes, targetCode, newNode, type) => {
  for (let i = 0; i < nodes.length; i++) {
    const item = nodes[i];
    if (item.code === targetCode) {
      if (type === "same") {
        // 同级
        nodes.splice(i + 1, 0, newNode);
      } else if (type === "child") {
        // 子级
        if (!item.children) {
          item.children = [];
        }
        item.children.push(newNode);
      }
      return true; // 找到并插入节点后返回 true
    }
    if (item.children && item.children.length > 0) {
      if (appendChangeNode(item.children, targetCode, newNode, type)) {
        return true; // 如果在子节点中找到并插入节点，返回 true
      }
    }
  }
  return false; // 未找到目标节点
};

top.appendChangeNode = appendChangeNode;

const disableNodeByCode = (node, code, disabled) => {
  if (node.code === code) {
    disabled = true;
    state.changeNode = node;
  }
  node.disabled = disabled;
  if (node.children) {
    node.children.forEach((item) => {
      disableNodeByCode(item, code, disabled);
    });
  }
};

// const recursionNode = (nodes) => {
//   let removeIndex = -1;
//   nodes.forEach((item, index) => {
//     if (item.code === state.changeNode.code) {
//       removeIndex = index;
//     }
//     if (nodes.children) {
//       recursionNode(nodes.children);
//     }
//   });
//   if (removeIndex !== -1) {
//     nodes.splice(removeIndex, 1);
//   }
// };

const recursionNode = (nodes, targetCode) => {
  let removeIndex = -1;
  for (let i = 0; i < nodes.length; i++) {
    const item = nodes[i];
    if (item.code === targetCode) {
      removeIndex = i;
      break;
    }
    if (item.children && item.children.length > 0) {
      removeIndex = recursionNode(item.children, targetCode);
      if (removeIndex !== -1) {
        break;
      }
    }
  }
  if (removeIndex !== -1) {
    nodes.splice(removeIndex, 1);
    return -1; // 重置 removeIndex 以便后续使用
  }
  return removeIndex;
};

/**
 * 点击
 * @param data
 */
const handleNodeClick = (data) => {
  clickOutsideClick();
  if (data.disabled) {
    return;
  }
  if (data.code === state.selectInfo.code) {
    return;
  }
  state.selectInfo.selectNode = data;
  state.selectInfo.code = data.code;
  state.selectInfo.moveType = "";
  if (state.selectInfo.type) {
    removeChangeNode();
    nextTick(() => {
      appendChangeNode(
        state.dataSource,
        state.selectInfo.code,
        state.changeNode,
        state.selectInfo.type
      );
    });
  }
};

// 树相关事件-结束 ----------------------------------------------------------------
const handleCancel = () => {
  // 清除相关缓存数据
  state.selectInfo = {
    code: "",
    type: "",
    selectNode: null,
    searchVisiable: false,
    treeSelect: "",
  };
  emits("done");
  emits("update:modelValue", false);
};
watchEffect(() => {
  if (props.modelValue && props.knowledgeId && props.selectCode) {
    console.log(props.selectCode);
    getList(props.knowledgeId);
  }
});

// 自定义指令
const vClickOutside = {
  beforeMount(el, binding) {
    el.clickOutsideEvent = function (event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.body.addEventListener("click", el.clickOutsideEvent);
  },
  mounted() {},
  unmounted(el) {
    document.body.removeEventListener("click", el.clickOutsideEvent);
  },
};

onMounted(() => {
  // const { app } = getCurrentInstance();
  // app.directives("", {
  //   beforeMount(el, binding) {
  //     el.clickOutsideEvent = function (event) {
  //       if (!(el === event.target || el.contains(event.target))) {
  //         binding.value(event);
  //       }
  //     };
  //     document.body.addEventListener("click", el.clickOutsideEvent);
  //   },
  //   unmounted(el) {
  //     document.body.removeEventListener("click", el.clickOutsideEvent);
  //   },
  // });
});
</script>

<style lang="less" scoped>
.custom-tree-node-disabled {
  color: #bbbbbb;
}
.svg-icon-style {
  width: 12px;
  height: 12px;
}
.file-icon {
  margin: 0 8px;
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
  // div{
  //   width: ;
  // }
  // padding-right: 8px;
  .el-button + .el-button {
    margin-left: 0px;
  }
}
.folder-tree {
  background: #fff;
  :deep(.el-tree-node__label) {
    width: 100%;
  }
}
.top-operate {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #333333;
  line-height: 22px;
  height: 30px;
}
.top-operate-button {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.top-opearte-button-icon {
  width: 24px;
  height: 24px;
  margin-left: 24px;
}
</style>
