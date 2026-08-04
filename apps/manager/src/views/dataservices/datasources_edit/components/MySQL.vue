<template>
  <div class="ds-form-fields">
    <el-form-item label="Host/网关直连地址" prop="host" required>
      <input-radius v-model="form.host" maxlength="255" placeholder="192.168.1.100或db.internal.net" />
    </el-form-item>

    <el-form-item label="Database数据库名称" prop="dsName" required class="ds-form-item span-2">
      <input-radius v-model="form.dsName" maxlength="255" placeholder="例如：trade_system_db或active_order_topic" />
    </el-form-item>

    <el-form-item label="物理端口号" prop="port" required>
      <input-number-radius v-model="form.port" :min="1" :controls="false" placeholder="默认 3306" />
    </el-form-item>

    <el-form-item label="数据源描述" prop="description" class="ds-form-item full-row">
      <input-radius v-model="form.description" maxlength="255" placeholder="请输入" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import type { DatasourceVO } from '@/types';

const form = defineModel<DatasourceVO>({ required: true });
</script>

<style lang="scss" scoped>
.ds-form-fields {
  display: contents;
}

.ds-form-item {
  &.span-2 {
    grid-column: span 2;
  }

  &.full-row {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .ds-form-item.span-2 {
    grid-column: 1 / -1;
  }
}
</style>
