<template>
  <el-row class="box">
    <el-radio-group v-model="state.chooseItem" @change="handleChange">
      <el-radio-button v-for="(item, index) in state.list" :key="index" :value="item.taskName">
        {{ item.taskName }}({{ item.countNum }})
      </el-radio-button>
    </el-radio-group>
  </el-row>
</template>

<script setup>
import { reactive, onMounted, watchEffect, defineExpose } from 'vue';
// import { aduitStatusList } from "@/utils/dict"
import api from '@/utils/api';
// import store from '@/store';
import { showMessage } from '@/utils/element-plus-message';
import useAppStore from "@/store/modules/app"
const appStore = useAppStore()
const props = defineProps({
  // 1:单集；2子集；3剧集
  type: {
    type: [String, Number]
  },
  auditUpdate: {
    type: [Boolean]
  },
  taskName: {
    type: [String]
  }
});

const emits = defineEmits(['doChange']);

const state = reactive({
  chooseItem: '',
  list: [],
  type: '',
  auditUpdate: false,
  cpId: '', // cp单位id;
  count: 0 // 计数
});

const handleChange = (val) => {
  state.auditUpdate = false;
  // eslint-disable-next-line vue/require-explicit-emits
  emits('doChange', val);
};

const typeChange = async () => {
  // console.log(state.count);
  // const cpId = appStore.companyId;
  // if (!cpId) {
  //   showMessage('请先选择CP单位', 'warning');
  //   return;
  // }
  await api.mediaCapital.getCount().then((res) => {
    const data = res.data;
    console.log('data', data);
       state.list = [
      { countNum: data.lightEngineCount, taskName: '单集' },
      { countNum: data.subCount, taskName: '子集' },
      { countNum: data.episodesCount, taskName: '剧集' }
    ];
    const isTaskName = state.list.find((item) => {
      return item.taskName === state.taskName;
    });
    state.chooseItem = isTaskName ? state.taskName : state.list[0].taskName;
    // eslint-disable-next-line vue/require-explicit-emits
    emits('doChange', state.chooseItem);
  });
};

// onBeforeMount(() => {
//   // 异步api调用，返回一个操作对象
//   typeChange();
// });

onMounted(() => {
  typeChange();
});

watchEffect(() => {
  state.auditUpdate = props.auditUpdate;
  state.taskName = props.taskName;
  // if (props.type && state.auditUpdate) {
  //   typeChange();
  // }
});

/**
 * 将方法抛出去，切换媒资类型后再在父调用该方法
 */
defineExpose({
  typeChange
});
</script>

<style lang="less" scoped>
.box {
  background-color: #e4e7ed;
  margin: 0 -20px;
  padding: 10px 20px;
}
</style>
