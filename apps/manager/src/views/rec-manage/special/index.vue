<template>
  <div class="app-container rec-special-manage">
    <KJSCCollapseSearch2 v-show="showSearch">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="提示词">
          <el-input
            v-model="queryParams.key"
            placeholder="通过提示词进行模糊搜索"
            clearable
            class="search-field-width"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="专题名称">
          <el-input
            v-model="queryParams.name"
            placeholder="通过专题名称进行模糊搜索"
            clearable
            class="search-field-width"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>

      </el-form>
      <template #rightBtns>
        <kjsc-button
          type="success"
          @click="handleAdd"
          icon="Plus"
          >新增</kjsc-button
        >
      </template>
    </KJSCCollapseSearch2>
    <el-table v-loading="loading" :data="tableList" @selection-change="handleSelectionChange">
      <template #empty>
        <kjsc-empty></kjsc-empty>
      </template>
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="编号" align="center" key="id" prop="id" v-if="columns.id.visible" width="100px" />
      <el-table-column label="提示词" align="center" key="key" prop="key" v-if="columns.key.visible" :show-overflow-tooltip="true">
      </el-table-column>
      <el-table-column label="主题" align="center" key="isTheme" prop="isTheme" v-if="columns.isTheme.visible" width="120px">
        <template #default="scope">
          <el-switch v-model="scope.row.isTheme"
            :active-value="1"
            :inactive-value="0"
            active-text="是"
            inactive-text="否"
            :before-change="beforeChangeTheme(scope.row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column label="专题名称" align="center" key="name" prop="name" v-if="columns.name.visible" :show-overflow-tooltip="true">
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160px" v-if="columns.createTime.visible">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" align="center" prop="updateTime" width="160px" v-if="columns.updateTime.visible">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150px" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-tooltip content="删除" placement="top">
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </el-tooltip>
          <el-tooltip content="查看" placement="top">
            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)">查看</el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    <!-- 添加或修改用户配置对话框 -->
    <KJSCDialogV2
      :title="title"
      v-model="open"
      width="1200px"
      append-to-body
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form :model="form" :rules="state.rules" :disabled="state.isDetail" ref="saveFormRef" label-width="80px">
        <el-form-item label="提示词" prop="key">
          <template v-if="state.isDetail">
            <span>{{ form.key }}</span>
          </template>
          <el-input
            v-else
            v-model="form.key"
            :disabled="state.builded"
            placeholder="请用一段话来描述你想生成的专题列表"
            maxlength="99"
            show-word-limit
            @keyup.enter="handleQueryMedias"
          >
            <template #append>
              <el-button v-if="state.builded" :disabled="state.specialLoading" type="primary" icon="Close" @click="clearQueryMedias">清除</el-button>
              <el-button v-else type="primary" :disabled="state.specialLoading" icon="Search" @click="handleQueryMedias">查询</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="state.isDetail" label="专题名称">
          <span>{{ form.name }}</span>
        </el-form-item>
        <el-form-item v-else label="专题名称" prop="name">
          <el-select v-model="form.name" placeholder="选择专题">
            <el-option v-for="item in state.specialOptions"
              :key="'save_sepecial_' + item"
              :label="item"
              :value="item"/>
          </el-select>
        </el-form-item>
        <el-form-item label="媒资列表">
          <el-tooltip content="添加媒资" placement="top">
            <el-button v-show="!state.isDetail" :disabled="state.specialLoading" link type="primary" icon="Plus" @click="handleAddMedia()">添加媒资</el-button>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="" label-width="0px">
          <el-table v-loading="state.specialLoading" :data="state.mediaList" border max-height="440px">
            <el-table-column label="序号" align="center" width="100">
              <template #default="scope">
                <span>{{ scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="媒资名称" prop="name" align="left"></el-table-column>
            <el-table-column label="媒资编码" prop="code" align="center"></el-table-column>
            <el-table-column v-if="!state.isDetail" label="操作" align="center" width="100">
              <template #default="scope">
                <el-tooltip content="删除" placement="top">
                  <el-button link type="primary" icon="Delete" @click="handleDeleteMedia(scope.row)">删除</el-button>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <template #prefixFooter>
        <div class="dialog-footer">
          <kjsc-button v-if="isDev" @click="handleAddMedia({})">TEST</kjsc-button>
          <kjsc-button @click="cancel">{{ state.isDetail ? "关 闭" : "取 消"  }}</kjsc-button>
          <kjsc-button v-if="!state.isDetail"
            type="primary"
            @click="submitForm"
            :disabled="submitDisabled"
            >确认{{ form.userId ? "修改" : "新增" }}</kjsc-button
          >
        </div>
      </template>
    </KJSCDialogV2>
    <MediaSelectDialog v-model="state.selectMediaModelVisible" @save="addMediaCallback"/>
  </div>
</template>

<script setup lang="ts" name="RecSpecialManage">
// import { TableV2FixedDir } from 'element-plus'
// import useSpecialStore from "@/store/modules/user";
import { listSpecial, delSpecial, getSpecial, updateSpecial, addSpecial, checkKeywordValue, autoBuildSpecialMedia, setTheme } from "@/api/recommend/recSpecial"
import type { RecSpecial, RecSpecialAutoBuildMediaData, RecSpecialAutoBuildSpecials, RecSpecialMedia, RecSpecialQueryParams, RecSpecialSaveParams, TableShowColumns } from '@/types'
import { isEmpty } from "@/utils/common.js";

import KJSCCollapseSearch2, { useCollapseSearch2 } from '@/components/KJSCCmpt/KJSCCollapseSearch2.vue';

import MediaSelectDialog from '../media/module/MediaSelectDialog.vue';
const route = useRoute()
// const appStore = useAppStore()
// const userStore = useSpecialStore();
const { proxy } = getCurrentInstance()

const isDev = import.meta.env.DEV;
const timeout = route.query.timeout ? Number(route.query.timeout) * 1000 : 0; // 方便测试

const tableList = ref<RecSpecial[]>([])
const open = ref<boolean>(false)
const loading = ref<boolean>(true)
const showSearch = ref<boolean>(true)
const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)
const total = ref<number>(0)
const title = ref<string>("")
const dateRange = ref<string[]>([])
// 列显隐信息
const columns = ref<Record<string, TableShowColumns>>({
  id: { label: '专题编号', visible: true },
  key: { label: '关键词', visible: true },
  isTheme: { label: '主题', visible: true },
  name: { label: '专题名称', visible: true },
  createTime: { label: '创建时间', visible: true },
  updateTime: { label: '更新时间', visible: true }
})

// const columnsv2 = ref([
//   {key: 'id', dataKey: 'id', title: '专题编号', width: '120px'},
//   {key: 'keyword', dataKey: 'keyword', title: '专题名称', width: '120px'},
//   {key: 'interestLabel', dataKey: 'interestLabel', title: '兴趣标签', width: '120px'},
//   {key: 'orderLabel', dataKey: 'orderLabel', title: '订购标签', width: '120px'},
//   {key: 'valueLabel', dataKey: 'valueLabel', title: '价值标签', width: '120px'},
//   {key: 'createTime', dataKey: 'createTime', title: '创建时间', width: '120px'},
//   {key: 'updateTime', dataKey: 'updateTime', title: '更新时间', width: '120px'},
//   {key: 'op', dataKey: 'operation', title: '操作', width: '120px', fixed: TableV2FixedDir.Right},
//  ])

// const { cs2Expand, cs2ExpandBtnText, cs2DoExpand } = useCollapseSearch2();

// const loadingTheme = ref<boolean>(false)
const beforeChangeTheme = (row: RecSpecial, val: boolean) => {
  if (!row.hasOwnProperty('isTheme')) {
    return
  }
  const obj: any = row
  // console.log('beforeChangeTheme', row, val)
  if (obj._isTheme === row.isTheme) {
    return;
  }
  setTheme(row.id as number)
    .then((res: any) => {
      try {
        getList()
      } catch (error) {
        console.log(error);
      }
    })
    .catch((err: any) => {
      getList()
    });
}

// 校验关键词
const validateKeyword = (rule: any, value: string, callback: Function) => {
  if (!value) {
    callback(new Error("专题名称不能为空"));
  } else {
    if (form.value.userId) {
      callback();
    } else {
      // const reg = /^[0-9a-zA-Z]*$/;
      // const isMatch = reg.test(value);
      const isMatch = true;
      if (isMatch) {
        // 接口调用
        checkKeywordValue({ keyword: value })
          .then((res: any) => {
            if (!res.data) {
              callback();
            } else {
              callback(new Error("该关键词已被占用、请重新输入"));
            }
          })
          .catch((err: any) => {
            console.log(err);
          });
      } else {
        callback(new Error("只能输入数字和字母"));
      }
    }
  }
};
// // 校验用户昵称
// const validateNickName = (rule: any, value: string, callback: Function) => {
//   if (!value) {
//     callback(new Error("用户昵称不能为空"));
//   } else {
//     const regex = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;
//     if (regex.test(value)) {
//       callback();
//     } else {
//       callback(new Error("只能输入中文、数字、字母"));
//     }
//   }
// };

const state = reactive({
  form: {} as RecSpecial,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    key: undefined,
    name: undefined
  } as RecSpecialQueryParams,
  rules: {
    key: [
      { required: true, message: "关键词不能为空", trigger: "blur" },
    ],
    name: [
      { required: true, validator: validateKeyword, trigger: "blur" },
    ],
    // tenantId: [{ required: true, message: "租户不能为空", trigger: "change" }],
    // roleIds: [
    //   { required: true, message: "所属角色不能为空", trigger: "change" },
    // ],
  },
  builded: false,
  dataId: '',
  isDetail: false,
  specialOptions: [] as RecSpecial[],
  mediaList: [] as RecSpecialMedia[],
  // specialList: [] as RecSpecial[],
  specialLoading: false,
  selectMediaModelVisible: false,
  selectMediaRow: {} as RecSpecial,
})

const { queryParams, form } = toRefs(state)

// 是否必填为空
const submitDisabled = computed(() => {
  return (
    isEmpty(form.value.id) ||
    isEmpty(form.value.name) ||
    state.mediaList.length == 0
  );
});

/** 查询用户列表 */
function getList() {
  loading.value = true
  // const params = proxy.addDateRange(queryParams.value, dateRange.value)
  const params = queryParams.value
  listSpecial(params).then(res => {
    loading.value = false
    const rows = res.rows || []
    rows.forEach(item => {
      (item as any)._isTheme = item.isTheme
    })
    tableList.value = rows
    total.value = res.total
  }, () => {
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  // dateRange.value = []
  queryParams.value = {
    ...queryParams.value,
    key: undefined,
    name: undefined
  }
  proxy.resetForm("queryRef")
  console.log('resetQuery', queryParams.value)
  handleQuery()
}

/** 删除按钮操作 */
function handleDelete(row: RecSpecial) {
  proxy.$modal.confirm('是否确认删除专题名称为"' + row.name + '"的数据项？').then(function () {
    return delSpecial(row.id!)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 详细按钮操作 */
function handleDetail(row: RecSpecial) {
  reset()
  state.isDetail = true
  title.value = "专题详情"
  open.value = true
  // state.dataId = row.id || ''
  getSpecial(row.id || '').then(res => {
    const response: any = res.data;
    const formValue = response || {};
    const mediaList = formValue.programs || []
    // processTreeList(mediaList)
    delete formValue.programs
    state.mediaList = mediaList
    form.value =  formValue;
  })
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download("system/user/export", {
    ...queryParams.value,
  },`user_${new Date().getTime()}.xlsx`)
}

/** 选择条数  */
function handleSelectionChange(selection: RecSpecial[]) {
  ids.value = selection.map(item => item.id!)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 导入按钮操作 */
function handleImport() {
  proxy.$refs["importSpecialRef"].open()
}

/** 重置操作表单 */
function reset() {
  clearQueryMedias()
  state.dataId = ''
  state.isDetail = false
}

/** 取消按钮 */
function cancel() {
  reset()
  open.value = false
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  title.value = "添加专题"
  open.value = true
  state.builded = false
  state.specialLoading = false
}

/** 修改按钮操作 */
function handleUpdate(row?: RecSpecial) {
  reset()
  const userId = row?.id || ids.value[0]
  state.dataId = userId
  getSpecial(userId).then(res => {
    const response: any = res.data;
    const formValue = response.data || {};
    const mediaList = formValue.mediaList || []
    // processTreeList(mediaList)
    delete formValue.mediaList
    state.mediaList = mediaList
    form.value =  formValue;
    title.value = "修改专题";
    open.value = true;
  })
}

const copyList = (list: any[]) => {
  return list.map(item => {
    const newItem = {...item}
    delete newItem.parent
    delete newItem.level
    if (item.children) {
      newItem.children = copyList(item.children || [])
    }
    return newItem
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["saveFormRef"].validate((valid: boolean) => {
    if (valid) {
      const params = {} as RecSpecialSaveParams;
      params.id = form.value.id || ''
      params.name = form.value.name || "";
      params.mediaCodeList = state.mediaList.map((item: RecSpecialMedia) => item.code)
      if (state.dataId) {
        // params.id = Number(state.dataId)
        updateSpecial(params).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addSpecial(params).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

const clearQueryMedias = () => {
  state.builded = false
  state.specialOptions = []
  state.mediaList = []
  form.value = {
    name: undefined,
    key: undefined,
    id: undefined,
  }
  proxy.resetForm("saveFormRef")
}
const handleQueryMedias = () => {
  const keyword = form.value.key || ""
  if (!keyword) {
    proxy.$modal.msgError("请输入关键词")
    return
  }
  state.builded = true
  state.specialLoading = true
  // console.log('handleQueryMedias', keyword, timeout)
  autoBuildSpecialMedia(keyword, timeout).then(res => {
    if (res.code === -999) {
      // 取消请求
      return
    }
    state.specialLoading = false
    if (res.code == 200) {
      const resData: RecSpecialAutoBuildMediaData = res.data || {}
      const specials = resData.specials || {} as RecSpecialAutoBuildSpecials;
      const specialOptions = specials.names && specials.names.split('#') || []
      state.specialOptions = specialOptions
      state.mediaList = resData.programs || []
      state.form.id = specials.id || ''
    }
  }).catch(() => {
    state.specialLoading = false
  })
}
const processTreeList = (specialList: any[], parentItem?: any, level?: number) => {
  level = level || 0
  specialList.forEach(item => {
    item.parent = parentItem
    item.level = level
    if (item.children) {
      processTreeList(item.children, item, level + 1)
    }
  })
}

const handleAddMedia = (row: RecSpecial) => {
  state.selectMediaRow = row
  state.selectMediaModelVisible = true
}
const addMediaCallback = (event: any) => {
  const data = event?.data || []
  console.log('addMediaCallback', data)
  const existKeys: Record<string, boolean> = {};
  state.mediaList.forEach((item: RecSpecialMedia) => {
    existKeys[item.code] = true
  })

  // const selectMediaRow = state.selectMediaRow;
  // selectMediaRow.children = selectMediaRow.children || []
  // selectMediaRow.children.forEach((item: any) => {
  //   existKeys[item[mediaKey]] = true
  // })
  data.forEach((item: any) => {
    const code = item.code;
    if (existKeys[code]) {
      return;
    }
    existKeys[code] = true
    state.mediaList.push({
      code: code,
      name: item.name
    })
  })
  state.selectMediaModelVisible = false
}
/** 删除媒资按钮操作 */
function handleDeleteMedia(row: RecSpecialMedia) {
  proxy.$modal.confirm('是否确认删除媒资"' + row.name + '"的数据项？').then(function () {
    return delSpecialMedia(row)
  }).catch(() => {})
}
/** 删除媒资按钮操作 */
function delSpecialMedia(row: RecSpecialMedia) {
  state.mediaList = state.mediaList.filter((item: RecSpecialMedia) => item != row)
}

onMounted(() => {
  getList()
})
</script>
<style lang="less" scoped>
.search-field-width {
  width: 215px;
}
</style>
