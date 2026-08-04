<template>
  <div class="container">
    <div class="capability-content">
      <div class="content-title m-b-24">能力切换</div>
      <div class="content-desc m-b-24">切换系统能力，切换后实时生效</div>
      <div class="system-list m-b-24">
        <div
          class="system-item"
          v-for="(item, index) in state.systemList"
          :key="index"
          @click="selectSystem(item, index)"
        >
          <SystemItem
            :info="item"
            :isEdit="state.isEdit"
            :isSelect="state.isSelectIndex === index && !state.isEdit"
          ></SystemItem>
        </div>
      </div>
      <div>
        <kjsc-button v-if="state.isEdit" v-hasPermi="['platformManager:capabilitySwitch:edit']" type="primary" @click="handleEdit"
          >编辑</kjsc-button
        >
        <div v-else>
          <kjsc-button plain @click="handleCancel">取消</kjsc-button>
          <kjsc-button type="primary" @click="handleSave">保存</kjsc-button>
        </div>
      </div>
    </div>
    <div class="bg-img"></div>
  </div>
</template>
<script setup>
import SystemItem from "./modules/systemItem.vue";
import api from "@/utils/api";
import One from "@/assets/images/capability/one.png";
import Two from "@/assets/images/capability/two.png";
import cache from '@/plugins/cache'

const { proxy } = getCurrentInstance();
const state = reactive({
  systemList: [],
  isEdit: true,
  isSelectIndex: 0,
  tenantId: cache.session.getJSON('tenantId') // 租户id-需要从登录用户之后取
});

const systemImgMap = {
  0: One,
  1: Two,
};

// 获取系统能力列表
const getSystemList = async (tenantId) => {
  let res = await api.capabilitySwitch.list(tenantId);
  if (res.code === 200) {
    state.systemList = res.data.map((el, index) => {
      return {
        ...el,
        systemImg: systemImgMap[index],
      };
    });
  }
};

// 编辑
const handleEdit = () => {
  state.isEdit = false;
  state.systemList.forEach((el,index) => {
    if(el.used){
       state.isSelectIndex = index;
    }else{
       state.isSelectIndex = 0;
    }
  })
};

// 取消
const handleCancel = () => {
  state.isSelectIndex = 0;
  state.isEdit = true;
};

// 保存
const handleSave = async () => {
  let params = {
    tenantId: state.tenantId, 
    ability: state.systemList[state.isSelectIndex].value
  }
  let res = await api.capabilitySwitch.edit(params);
  if (res.code === 200) {
    proxy.$modal.msgSuccess("操作成功");
    handleCancel();
    getSystemList(state.tenantId);
  } else {
    proxy.$modal.msgSuccess(res.msg || "操作失败，请重新提交");
  }
};

// 选择
const selectSystem = (item, index) => {
  if(state.isEdit){
    return;
  }
  state.isSelectIndex = index;
};

getSystemList(state.tenantId);
</script>
<style lang="less" scoped>
.container{
  position: fixed;
}
.capability-content {
  padding: 32px;
  box-sizing: border-box;
}
.content-title {
  font-family: '思源黑体 CN';
  font-weight: 500;
  font-size: 18px;
  color: #0c113d;
}
.content-desc {
  font-family: '思源黑体 CN';
  font-weight: 0;
  font-size: 14px;
  color: #8a8c9d;
}
.m-b-24 {
  margin-bottom: 24px;
}
.system-list {
  display: flex;
  flex-wrap: wrap;
}
.system-item {
  margin-right: 20px;
  cursor: pointer;
}
.bg-img {
  position: absolute;
  right: -460px;
  top: 254px;
  width: 712px;
  height: 525px;
  background: url("../../../assets/images/capability/bg.png") no-repeat;
  background-size: 100% 100%;
  z-index: -1;
}
</style>
