<template>
  <div class="base-info">
    <el-form
      ref="saveFormRef"
      :model="state.saveForm"
      :rules="state.saveRules"
      label-width="140px"
      label-position="top"
    >
      <el-form-item label="知识库名称" prop="name">
        <el-input
          v-model="state.saveForm.name"
          class="w100p"
          maxlength="20"
          placeholder="请输入名称"
        />
      </el-form-item>
      <el-form-item label="归属领域分类" prop="categoryId">
        <DomainSelect v-model="state.saveForm.categoryId"
          :allow-all="false" check-strictly
          class="w-full" />
      </el-form-item>
      <!-- <el-form-item label="知识库问答模式">
        <el-select v-model="state.saveForm.type" :disabled="true">
          <el-option v-for="item in state.modeList" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
      </el-form-item> -->
      <!-- <el-form-item label="知识库管理员" prop="userIds" class="form-item-1">
        <el-select-v2
          v-model="state.saveForm.userIds"
          class="w100p"
          multiple
          filterable
          remote
          :remote-method="querySearch"
          clearable
          :options="state.userOptions"
          :loading="state.userLoading"
          placeholder="请输入姓名搜索"
        />
      </el-form-item> -->
      <!-- <el-form-item label="知识库归属" prop="deptIds" class="form-item-1">
        <el-cascader
          v-model="state.saveForm.deptIds"
          :options="state.belongToList"
          :props="defaultProps"
          :show-all-levels="false"
          class="w100p"
          style="position:relative;z-index:10;width:100%;"
          clearable/>
      </el-form-item> -->
      <el-form-item label="模型" prop="embeddingModel">
        <span v-if="state.saveForm.embeddingModel" class="px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-500 border border-slate-100 font-mono">
          {{ state.saveForm.embeddingModel.modelCode }}
        </span>
        <span v-if="state.saveForm.rerankModel" class="ml-2 px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-500 border border-slate-100 font-mono">
          {{ state.saveForm.rerankModel.modelCode }}
        </span>
      </el-form-item>
      <el-form-item label="简介" prop="description">
        <el-input
          v-model="state.saveForm.description"
          :rows="6"
          show-word-limit
          maxlength="200"
          type="textarea"
          placeholder="请输入简介"
          class="w100p"
        />
      </el-form-item>
      <div style="text-align: right;margin-right: 32px;position:relative;z-index:10">
        <el-button @click="handleCancel">取 消</el-button>
        <el-button :disabled="state.dataError || state.dataUpdating" type="primary" @click="handleSave">保存设置</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup name="BaseInfo">
// import { listDept } from "@/api/system/dept";
import { getLibApi, saveLibBaseInfoApi, queryBelongList } from "@/api/knowledge/knowledgeApi";
import { listUser } from "@/api/system/user";
import DomainSelect from "@/components/common/DomainSelect2.vue";
import { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'

const { proxy } = getCurrentInstance();
const emits = defineEmits(["newname"]);
const props = defineProps({
  dataId: {
    type: [String, Number],
    default: ''
  },
})
const state = reactive({
  loading: false,
  activeName: 'gly',
  tableData: [],
  showAddMemberDialog: false,
  dataError: false,
  dataUpdating: false,
  saveForm: {},
  libItem: {},
  // modeList: [
  //   {label: 'Rag模式', value: 0},
  //   {label: 'Prompt模式', value: 1},
  // ],
  belongToList: [],
  userOptions: [],
  userLoading: false,
  saveRules: {
    name: [
      { required: true, message: "名称不能为空", trigger: "blur" }
    ],
    // deptIds: [
    //   { required: true, message: "知识库归属不能为空", trigger: "change" },
    // ],
    description: [
      { max: 200, message: "简介内容长度不超过200字", trigger: "change" },
    ],
    categoryId: [
      { required: true, message: "归属领域分类不能为空", trigger: "change" },
    ],
    // userIds: [
    //   {
    //     trigger: 'blur',
    //     validator: (rule, value, callback) => {
    //       if(value && value.length) {
    //         callback()
    //       }else{
    //         callback(new Error('管理员最少要设置一个'))
    //       }
    //     }
    //   }
    // ]
  }
});
// const defaultProps = {
//   children: 'children',
//   label: 'deptName',
//   value: 'uniqueId',
//   multiple: true,
//   // checkStrictly: true,
// };
// let BelongList = []

// const setBelongListId = (list, type) => {
//   list.map(item => {
//     item.type = type
//     item.uniqueId = type + '-' + item.deptId
//     if(item.children && item.children.length) {
//       setBelongListId(item.children, type)
//     }
//   })
// }

// const getBelongToList = async () => {
//   const res = await queryBelongList()
//   console.log('belong list:', res)
//   if(res.code === 200) {
//     const deptList = res.data.deptList || []
//     const userGroupList = res.data.userGroupList || []

//     BelongList = [...deptList]
//     const deptTree = proxy.handleTree(deptList, 'deptId')
//     userGroupList.forEach(item => {
//       item.parentId = null
//     });
//     const userGroupTree = proxy.handleTree(userGroupList, 'deptId')

//     setBelongListId(deptTree, '0')
//     setBelongListId(userGroupTree, '1')

//     state.belongToList = [...deptTree, ...userGroupTree]
//   }
//   // return listDept().then(response => {
//   //   state.belongToList = proxy.handleTree(response.data, "deptId");
//   // });
// };
const getLibInfo = ()=>{
  state.dataError = false;
  getLibApi(props.dataId).then(res=>{
    if (res?.code === 200) {
      const newItem = res.data || {};
      state.libItem = newItem;
      updateSaveForm(newItem);
      emits('newname', newItem.name);
    } else {
      state.dataError = true;
    }
  }, ()=>{
    state.dataError = true;
  });
}

const querySearch = (queryString, cb) => {
  // console.log('query search:', queryString)
    state.userLoading = true;
    listUser({
      pageNum: 1,
      pageSize: 999,
      nickName: queryString,
    }).then(function (data) {
      const list = data?.rows || [];
      const results = list.map((item) => {
        item.label = item.nickName;
        return {
          label: item.nickName || item.nickName || item.remark || item.userId,
          value: item.userId,
        };
      });
      state.userOptions = results;
      state.userLoading = false;

      if(cb && typeof cb === 'function') {
        cb()
      }
    }).catch(() => {
      if(cb && typeof cb === 'function') {
        cb()
      }
    });
  
};

/** 提交按钮 */
function handleSave() {
  state.dataUpdating = true;
  setTimeout(function(){
    state.dataUpdating = false;
  }, 1000);
  proxy.$refs["saveFormRef"].validate((valid) => {
    if (valid) {
      const params = {...state.saveForm};
      // const deptIds = (params.deptIds || []).map(
      //   (paths) => paths[paths.length - 1]
      // );
      // const deptIds = params.deptIds || []
      // const deptMap = []
      // deptIds.map(item => {
      //   const idStr = item.split('-')
      //   if(idStr.length === 2) {
      //     const mapItem = {}
      //     mapItem[idStr[1]] = idStr[0]
      //     deptMap.push(mapItem)
      //   }
      // })

      delete params.deptIds
      // params.deptMap = deptMap
      console.log('submitForm', params);
      saveLibBaseInfoApi(params).then((res)=>{
        if (res.code === 200) {
          let tipsMessage = "修改成功";
          proxy.$modal.msgSuccess(tipsMessage);
        } else {
          proxy.$modal.msgError("操作失败");
        }
        getLibInfo();
        // emits('done');
      },()=>{
        getLibInfo();
      });
    }
  });
}

function handleCancel(){
  updateSaveForm(state.libItem);
}

// const getTreeNodeData = (pid) => {
//   let data = []
//   if(pid) {
//     const item = BelongList.find(item => item.deptId == pid)
//     if(item) {
//       data.push(item)
//       if(item.parentId) {
//         data = data.concat(getTreeNodeData(item.parentId))
//       }
//     }
//   }
//   return data
// }

function updateSaveForm(libItem){
  
  // if(libItem.deptMap && libItem.deptMap.length) {
  //   const deptIds = []
  //   libItem.deptMap.map(item => {
  //     for (const key in item) {
  //       if (Object.prototype.hasOwnProperty.call(item, key)) {
  //         const element = item[key];

  //         if(element == '0') {
  //           // 部门
  //           const treeData = getTreeNodeData(key)
  //           treeData.reverse()
  //           const checkedKeys = treeData.map(item => item.uniqueId)
  //           deptIds.push(checkedKeys)
  //           // console.log('......', checkedKeys)
  //         }else{
  //           // 用户组
  //           deptIds.push([element + '-' + key])
  //         }

  //       }
  //     }
  //   })
  //   // console.log('base dept map:', deptIds)
  //   libItem.deptIds = deptIds
  // }
  state.saveForm = {...libItem};
  // console.log('saveformmmmmm:', state.saveForm)
  // state.oldsaveForm = JSON.parse(JSON.stringify(state.saveForm ));
}

async function init(){
  // await getBelongToList();
  querySearch('', () => {
    getLibInfo();
  })
  
}
init();
</script>
<style lang="less" scoped>
.base-info{
  // margin-left: 40px;
}
.member-list {
  position: relative;
  .top-op-area {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
  }
}
.w648{
  width: 648px;
}
.w100p {
  width: 100%;
}
.form-item-1 :deep(.w648) {
  width: 648px;
}
.top-title {
  line-height: 60px;
  font-size: 20px;
}
</style>
