<template>
  <div class="company-switch">
    <el-select v-model="state.companyId" filterable remote placeholder="选择机构" :remote-method="findAllCompany"
      @change="changeCompany">
      <el-option v-for="item in state.companyData" :key="item.id" :disabled="item.id == '-1' && disabledAllCompany"
        :label="`${item.name}`" :value="item.id">
        {{ item.name }}
      </el-option>
    </el-select>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';

import { listAllOrgManage, globalOrgAdd } from '@/api/system/systemOrg.js';
import useAppStore from '@/store/modules/app.js';
import useTagsViewStore from '@/store/modules/tagsView'

const route = useRoute()
const appStore = useAppStore();
const { proxy } = getCurrentInstance()
// const updateShowMainDiv = inject('updateShowMainDiv');
const disabledAllCompany = computed(() => {
  return appStore.disabledAllCompany;
});
const state = reactive({
  companyData: [],
  companyId: appStore.companyId
});

watch(() => appStore.companyId, (newVal) => {
  state.companyId = newVal;
})
const findAllCompany = async (query, id) => {
  let params = {};
  if (query === 0) {
    state.companyData = [];
  } else {
    params = {
      keyWord: query
    };
  }
  params.mustInlucdeIds = id ? [id] : [];
  params.getAllData = true;
  const pageInfo = { pageNum: 1, pageSize: 10 };
  const companyData = await listAllOrgManage(pageInfo, params);
  companyData.data.forEach((item) => {
    item.id = item.id.toString();
  });
  state.companyData = companyData.data;
};

const changeCompany = (val) => {
  if (!val) {
    return;
  }
  globalOrgAdd(val).then(
    (res) => {
      if (res && res.code === 200) {
        appStore.setCompanyId(val);
        refreshSelectedTag()
      }
    },
    (error) => {
      console.error(error);
    }
  );
};

function refreshSelectedTag() {
  proxy.$tab.refreshPage()
  if (route.meta.link) {
    useTagsViewStore().delIframeView(route)
  }
}
findAllCompany(0, state.companyId);
</script>
<style lang="less" scoped>
// .select-v2 {
//   ::v-deep .el-select-v2__suffix {
//     margin-top: 0;
//   }
// }
.company-switch {
  width: 80%;
  margin: 0 auto 10px;
}
.el-select {
  width: 100%;
  font-size: 16px;
}
</style>
