<template>
  <div class="type-icon" :class="{
    'user-icon': props.type === DataTypes.USER,
    'group-icon': props.type === DataTypes.USERGROUP,
    'position-icon': props.type === DataTypes.POSITION,
    'dept-icon': props.type === DataTypes.DEPT,
  }">
    {{ props.label }}
  </div>
</template>
<script setup lang="ts">
import { DataTypes } from './task'

const props = defineProps({
  type: {
    type: String,
    default: DataTypes.USER
  },
  label: {
    type: String,
    default: ''
  }
})
</script>
<style scoped lang="scss">
.type-icon {
  // width: 30px;
  padding: 0 8px;
  line-height: 16px;
  text-align: center;
  border: 1px solid transparent;
  font-size: 10px;
  border-radius: 8px 8px 8px 8px;
}

.user-icon {
  color: #3297A0;
  background: rgba(235, 243, 245, 0.6);
  border-color: #7EBEC4;
}

.position-icon {
  background: #FFF9F2;
  color: #FF951C;
  border-color: #7EBEC4;
}

.group-icon {
  color: #29B276;
  background: #ECFBF5;
  border-color: #82D2AF;
}

.dept-icon {
  color: #2015B9;
  background: #F5F5FF;
  border-color: #ADAADF;
}

.custom-label {
  flex-grow: 1;
}
</style>
