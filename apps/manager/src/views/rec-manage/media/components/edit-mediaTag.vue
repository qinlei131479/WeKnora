<template>
  <div class="mediatag-wrap">
    <el-form ref="saveForm" :model="state.saveInfo" label-width="100">
      <el-form-item label="节目标签">
        <el-input :value="showTags" readonly />
      </el-form-item>
      <el-form-item label="智能标签">
        <el-input v-model="state.saveInfo.aiTags" readonly />
      </el-form-item>
      <el-form-item label="工单标签" prop="workOrderTags">
        <el-input v-model="state.saveInfo.workOrderTags" readonly />
      </el-form-item>
      <el-form-item label="人工标签" prop="manualTags">
        <el-input v-model="state.saveInfo.manualTags" clearable placeholder="请输入节目标签，多个请用英文分号隔开" />
      </el-form-item>
      <el-form-item label="黑名单标签" prop="blacklistTags">
        <el-input v-model="state.saveInfo.blacklistTags" clearable placeholder="请输入节目标签，多个请用英文分号隔开" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, watchEffect, defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  saveInfo: {
    type: [Object]
  }
});

const emits = defineEmits(['callBack']);

const saveForm = ref(null);
const state = reactive({
  saveInfo: {}
});

watchEffect(() => {
  state.saveInfo = props.saveInfo;
});

const baseTags = computed(() => {
  const saveInfo = state.saveInfo || {};
  const aiTags = saveInfo.aiTags || '';
  const workOrderTags = saveInfo.workOrderTags || '';
  const tagList = [];
  const tagMap = {};
  aiTags.split(';').forEach((item) => {
    const tag = item.trim();
    if (tag) {
      if (!tagMap[tag]) {
        tagMap[tag] = true;
        tagList.push(tag);
      }
    }
  });
  workOrderTags.split(';').forEach((item) => {
    const tag = item.trim();
    if (tag) {
      if (!tagMap[tag]) {
        tagMap[tag] = true;
        tagList.push(tag);
      }
    }
  });
  return {
    tagList,
    tagMap
  };
});
// (智能标签-黑名单)+(工单标签-黑名单)+人工标签
// 智能标签+工单标签-黑名单+人工标签
const showTags = computed(() => {
  const saveInfo = state.saveInfo || {};
  const baseTagsValue = baseTags.value || {};
  const tagList = [...baseTagsValue.tagList];
  const tagMap = { ...baseTagsValue.tagMap };
  const blacklistTags = saveInfo.blacklistTags || '';
  blacklistTags.split(';').forEach((item) => {
    const tag = item.trim();
    if (tag) {
      const index = tagList.indexOf(tag);
      if (index > -1) {
        tagList.splice(index, 1);
        delete tagMap[tag];
      }
    }
  });
  const manualTags = saveInfo.manualTags || '';
  manualTags.split(';').forEach((item) => {
    const tag = item.trim();
    if (tag) {
      if (!tagMap[tag]) {
        tagMap[tag] = true;
        tagList.push(tag);
      }
    }
  });
  return tagList.join(';');
});

const submitForm = () => {
  saveForm.value.validate(async (valid) => {
    emits('callBack', valid, 'mediaTag');
  });
};
// 抛出方法
defineExpose({
  submitForm
});
</script>

<style scoped lang="less"></style>
