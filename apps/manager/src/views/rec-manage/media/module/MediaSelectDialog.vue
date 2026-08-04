<template>
  <KJSCDialogV2
    title="媒资选择"
    :model-value="props.modelValue"
    @update:model-value="emits('update:modelValue', $event);"
    width="1200px"
    append-to-body
    :showCloseBtn="false"
    :showSubitBtn="false"
    @open="onOpen"
    @close="onClose"
  >
    <div class="dialog-content">
      <MediaSelectTable :visible="props.modelValue" @save="handleSave"/>
    </div>
    <template #prefixFooter>
      <div class="dialog-footer">
        <kjsc-button @click="close">取 消</kjsc-button>
        <!-- <kjsc-button
          type="primary"
          @click="submitForm"
          >确认{{ form.userId ? "修改" : "新增" }}</kjsc-button
        > -->
      </div>
    </template>
  </KJSCDialogV2>
</template>
<script setup>
// import { ref, reactive, nextTick } from 'vue';
import MediaSelectTable from './MediaSelectTable.vue';

const emits = defineEmits(['update:modelValue', 'save']);

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

// const state = reactive({
//   title: '媒资选择',
// });
// 保存
const handleSave = (val) => {
  const data = val && val.data || [];
  const mediaList = data.map((item) => {
    return {
      code: item.code,
      name: item.name,
    }
  });
  emits('save', {data: mediaList});
  close();
};

const close = () => {
  emits('update:modelValue', false);
};
const onOpen = () => {
};
const onClose = () => {
};

</script>

<script>
export default {
  name: 'RecMediaSelectDialog'
};
</script>
