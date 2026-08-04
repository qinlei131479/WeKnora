<template>
  <KJSCDialogV2
    :title="title"
    :model-value="props.modelValue"
    width="820px"
    append-to-body
    custom-class="usergroup-form-dialog"
    :showCloseBtn="false"
    :showSubitBtn="false"
    @update:model-value="emit('update:modelValue', $event)"
    @close="onClose"
  >
    <el-form ref="roleRef" :model="form" :rules="rules" label-position="top" class="usergroup-form" hide-required-asterisk>
      <el-form-item label="用户组名称" prop="roleName">
        <el-input v-model="form.roleName" placeholder="请输入用户组名称" />
      </el-form-item>

      <el-form-item label="状态">
        <el-switch
          v-model="form.status"
          style="--el-switch-on-color: #31aba0"
          active-value="0"
          inactive-value="1"
          :disabled="form.builtin == 1"
        />
      </el-form-item>

      <el-form-item label="关联用户" prop="userIds">
        <el-transfer
          v-model="form.userIds"
          filterable
          class="usergroup-transfer"
          :titles="['未选用户', '已选用户']"
          :props="{ key: 'label', label: 'value' }"
          filter-placeholder="搜索用户名..."
          :data="userAllList"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入备注信息" />
      </el-form-item>
    </el-form>

    <template #prefixFooter>
      <div class="usergroup-dialog-footer">
        <button type="button" class="usergroup-dialog-submit" @click="submitForm">
          确认{{ props.dataId ? '修改' : '新增' }}
        </button>
      </div>
    </template>
  </KJSCDialogV2>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { userSelect } from '@/api/knowledge/knowledgeApi.js'
import { addRole, getRole, getUserDeptTree, updateRole } from '@/api/knowledge/knowledgeRole.js'
import { ElMessage } from 'element-plus'
import { deepClone } from '@/utils'

const { proxy } = getCurrentInstance()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  dataId: {
    type: [Number, String],
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'done'])

const roleRef = ref(null)
const form = ref({
  id: undefined,
  roleName: undefined,
  status: '0',
  menuIds: [],
  deptIds: [],
  userIds: [],
  relatedDept: '0',
  remark: undefined
})
const rules = reactive({
  roleName: [{ required: true, message: '用户组名称不能为空', trigger: 'blur' }],
  userIds: [{ required: true, message: '请选择至少一个关联用户', trigger: 'blur' }]
})
const userAllList = ref([])
const deptTree = ref([])

const title = computed(() => (props.dataId ? '修改用户组' : '添加用户组'))

let deptList = []

const handleDialogShow = async () => {
  if (props.dataId) {
    getRole(props.dataId).then(async response => {
      const data = response.data
      const userIds = []
      const deptIds = []

      if (data.userIdAndDeptIdMap && data.userIdAndDeptIdMap.length) {
        data.userIdAndDeptIdMap.map(item => {
          for (const key in item) {
            if (Object.prototype.hasOwnProperty.call(item, key)) {
              const element = item[key]
              if (userIds.indexOf(key) === -1) {
                userIds.push(key)
              }
              if (element && deptIds.indexOf(element) === -1) {
                deptIds.push(element)
              }
            }
          }
        })
      } else if (data.userIds) {
        data.userIds.forEach(item => {
          userIds.push(`${item}`)
        })
      }

      if (data.relatedDept === '1') {
        await getDeptList()
        const deptId = deptIds[0]
        const deptData = deptList.find(item => item.id == deptId)
        if (deptData && deptData.children && deptData.children.length) {
          userAllList.value = deptData.children
        }
      } else {
        await getAllUser()
      }

      const statusValue = typeof data.status === 'number' ? data.status.toString() : data.status
      form.value = {
        id: data.id,
        builtin: data.builtin,
        roleName: data.roleName,
        status: statusValue,
        remark: data.remark,
        relatedDept: data.relatedDept,
        deptIds: deptIds,
        userIds: userIds
      }
    })
  } else {
    getDeptList()
    getAllUser()
  }
}

const getTreeList = (tree, parentId) => {
  let treeList = []
  tree.parentId = parentId
  tree.key = tree.id
  tree.value = tree.label
  treeList.push(tree)
  if (tree.children && tree.children.length) {
    tree.children.map(item => {
      treeList = treeList.concat(getTreeList(item, tree.id))
    })
  }
  return treeList
}

const getDeptList = async () => {
  const res = await getUserDeptTree()
  if (res.code === 200) {
    const data = res.data ? res.data[0] : null
    const treeList = getTreeList(data)
    const deptTreeList = treeList.filter(item => item.other && item.other.dataType === 'dept')
    deptList = deepClone(deptTreeList)
    const treeData = proxy.handleTree([...deptTreeList], 'id')
    const dataList = treeData[0] ? treeData[0].children : []
    deptTree.value = [...dataList]
  }
}

async function getAllUser() {
  userAllList.value = []
  await userSelect('').then(res => {
    userAllList.value = res.data
  })
}

function submitForm() {
  roleRef.value?.validate(valid => {
    if (!valid) {
      return
    }

    if (form.value.userIds.length === 0) {
      ElMessage.warning({ message: '请选择至少一个关联用户' })
      return
    }

    let deptId = ''
    if (form.value.relatedDept === '1') {
      if (form.value.deptIds && form.value.deptIds.length) {
        deptId = form.value.deptIds[0]
      } else {
        ElMessage.warning({ message: '请选择一个关联部门' })
        return
      }
    }

    const params = {
      remark: form.value.remark,
      roleName: form.value.roleName,
      status: form.value.status,
      userIdAndDeptIdMap: [],
      relatedDept: form.value.relatedDept
    }

    form.value.userIds.map(item => {
      const idMap = {}
      idMap[item] = deptId
      params.userIdAndDeptIdMap.push(idMap)
    })
    params.userIds = form.value.userIds

    if (form.value.id != undefined) {
      params.id = form.value.id
      updateRole(params).then(() => {
        proxy.$modal.msgSuccess('修改成功')
        emit('done')
        onClose()
      })
    } else {
      addRole(params).then(() => {
        proxy.$modal.msgSuccess('新增成功')
        emit('done')
        onClose()
      })
    }
  })
}

function onClose() {
  emit('update:modelValue', false)
  form.value = {
    id: undefined,
    roleName: undefined,
    status: '0',
    menuIds: [],
    deptIds: [],
    userIds: [],
    relatedDept: '0',
    remark: undefined
  }
  roleRef.value?.resetFields()
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      handleDialogShow()
    }
  }
)
</script>

<style lang="scss">
.usergroup-form-dialog.kjsc-dialog-v2 {
  border-radius: 24px;
  overflow: hidden;
  padding: 0;

  .el-dialog__header {
    padding: 24px 32px 20px;
    margin-right: 0;
    border-bottom: 1px solid #ebeef5;

    .el-dialog__title {
      font-size: 20px;
      font-weight: 600;
      color: #2b2f33;
      line-height: 26px;
    }

    .el-dialog__headerbtn {
      top: 24px;
      right: 24px;
      width: 24px;
      height: 24px;

      .el-dialog__close {
        color: #77838f;
        font-size: 18px;
      }
    }
  }

  .el-dialog__body {
    padding: 20px 40px 0;
  }

  .el-dialog__footer {
    padding: 32px 32px 32px;
  }

  .usergroup-form {
    .el-form-item {
      margin-bottom: 20px;
    }

    .el-form-item__label {
      display: inline-flex;
      align-items: center;
      line-height: 20px;
      font-size: 14px;
      font-weight: 500;
      color: #2b2f33;
    }

    .el-form-item.is-required > .el-form-item__label::before {
      display: none !important;
      margin: 0 !important;
      content: '' !important;
    }

    .el-form-item.is-required > .el-form-item__label::after {
      content: '*';
      margin-left: 4px;
      color: #fe595d;
    }

    .el-input__wrapper,
    .el-select__wrapper,
    .el-textarea__inner {
      border-radius: 8px;
      box-shadow: 0 0 0 1px #e1e6ec inset !important;
    }

    .el-input__wrapper,
    .el-select__wrapper {
      min-height: 40px;
    }

    .el-textarea__inner {
      min-height: 96px;
      padding: 10px 12px;
    }

    .el-input__inner {
      font-size: 14px;
      color: #2b2f33;

      &::placeholder {
        color: #a8abb2;
      }
    }
  }

  .usergroup-transfer {
    display: flex;
    align-items: center;
    width: fit-content;

    .el-transfer-panel {
      display: flex;
      flex-direction: column;
      width: 300px !important;
      height: 340px !important;
      flex: 0 0 300px;
      border: 1px solid #e1e6ec;
      border-radius: 8px;
      overflow: hidden;
      background: #ffffff;
    }

    .el-transfer-panel__header {
      flex-shrink: 0;
      background: #ebf3f5 !important;
      border-bottom: 1px solid #ebeef5;

      .el-checkbox__label {
        font-size: 14px;
        font-weight: 500;
        color: #2b2f33;
      }
    }

    .el-transfer-panel__body {
      flex: 1;
      min-height: 0;
      height: auto;
      background: #ffffff !important;
    }

    .el-transfer-panel__list {
      height: 100%;
      background: #ffffff;
    }

    .el-transfer-panel__empty {
      background: #ffffff;
    }

    .el-transfer-panel__filter {
      // margin: 12px;

      .el-input__prefix {
        display: none !important;
      }

      .el-input__wrapper {
        position: relative;
        border-radius: 12px;
        padding-right: 32px !important;
        box-shadow: 0 0 0 1px #e1e6ec inset !important;

        &::after {
          content: '';
          position: absolute;
          top: 50%;
          right: 12px;
          width: 16px;
          height: 16px;
          transform: translateY(-50%);
          pointer-events: none;
          background: center / contain no-repeat
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath fill='%2377838f' d='M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-163.6-132.8-296.4-296.4-296.4S119.2 248.4 119.2 412s132.8 296.4 296.4 296.4c67 0 130.7-21.8 182.8-62.1l259.7 259.7a8.2 8.2 0 0 0 11.5 0l40.2-40.2a8.2 8.2 0 0 0 0-11.5zM415.6 646.4c-129.2 0-234.4-105.2-234.4-234.4S286.4 177.6 415.6 177.6 650 282.8 650 412 544.8 646.4 415.6 646.4z'/%3E%3C/svg%3E");
        }
      }
    }

    .el-transfer__buttons {
      display: inline-flex;
      flex-direction: column-reverse;
      align-items: center;
      justify-content: center;
      gap: 20px;
      width: 120px;
      flex: 0 0 120px;
      padding: 0;
      margin: 0;

      .el-button,
      .el-transfer__button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        min-height: 32px;
        padding: 0;
        margin: 0 !important;
        border: none !important;
        border-radius: 8px;
        background: #87c0c4 !important;
        background-image: none !important;
        color: #ffffff !important;
        box-shadow: 0 2px 8px rgba(135, 192, 196, 0.35);

        .el-icon {
          font-size: 16px;
          color: #ffffff;
        }

        &:hover:not(:disabled),
        &:focus:not(:disabled) {
          background: #7bb6bc !important;
          background-image: none !important;
          color: #ffffff !important;
        }

        &:disabled {
          opacity: 0.45;
          background: #87c0c4 !important;
        }
      }
    }
  }

  .usergroup-dialog-footer {
    display: flex;
    justify-content: flex-end;
  }

  .usergroup-dialog-submit {
    min-width: 120px;
    height: 40px;
    padding: 0 28px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(180deg, #31aba0 0%, #2897be 100%);
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover:not(:disabled) {
      opacity: 0.92;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }
}
</style>
