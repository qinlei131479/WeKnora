<template>
  <Dialog v-model:open="context.showDataPreviewModal" @open="onOpen">
    <DialogContent :title="`数据预览: ${selectedTableName}`" class="max-w-4xl">
      <div class="space-y-4">
        <p class="text-sm text-slate-500">此预览仅展示前 5 条样本数据。智能体在被授权后可自主通过 SQL 或 API 检索全量数据。</p>
        <div class="border border-slate-200 rounded-md overflow-hidden bg-white">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th v-for="item in status.columns" :key="item.name" class="px-4 py-2 font-medium text-slate-600">{{
                  item.name }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr v-for="item in status.dataList" :key="item.ID">
                <td v-for="col in status.columns" :key="col.prop" class="px-4 py-2">{{ item[col.prop] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-end pt-4 border-t border-slate-100">
          <!-- <Button variant="outline" @click="context.showDataPreviewModal = false">关闭</Button> -->
          <el-button type="primary" @click="context.showDataPreviewModal = false" round>关闭</el-button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DomainSelect from '@/components/common/DomainSelect.vue'
// import { addAgent } from '@/lib/agent-store'
import {
  addBusinessAgentBrainApi,
} from '@/api/agentic/agentBrain'

import type { AgentBrainDataSourceItem } from '@/types'

const context = inject('agentFormContext')
// const formData = context.model;

const status = reactive({
  columns: [],
  dataList: [],
})

const onOpen = () => {
  getDataList()
}
const getDataListApi = () => {
  return Promise.resolve({
    code: 200,
    data: {
      columns: [
        { name: 'ID', type: 'string', prop: 'ID' },
        { name: '巡检区域', type: 'string', prop: '巡检区域' },
        { name: '异常类型', type: 'string', prop: '异常类型' },
        { name: '报告人', type: 'string', prop: '报告人' },
        { name: '状态', type: 'string', prop: '状态' },
        { name: '时间', type: 'string', prop: '时间' },
      ],
      dataList: [
        {
          ID: 'P-001',
          巡检区域: 'A座 5楼茶水间',
          异常类型: '设备损坏',
          报告人: '张三',
          状态: '待处理',
          时间: '2026-06-04',
        },
        {
          ID: 'P-002',
          巡检区域: 'B座 地下车库',
          异常类型: '照明故障',
          报告人: '李四',
          状态: '已修复',
          时间: '2026-06-03',
        },
        {
          ID: 'P-003',
          巡检区域: 'C座 12楼女卫',
          异常类型: '清洁问题',
          报告人: '系统',
          状态: '待处理',
          时间: '2026-06-03',
        },
        {
          ID: 'P-004',
          巡检区域: 'D座 12楼男卫',
          异常类型: '其他问题',
          报告人: '张三',
          状态: '待处理',
          时间: '2026-06-04',
        },
        {
          ID: 'P-005',
          巡检区域: 'E座 12楼男卫',
          异常类型: '其他问题',
          报告人: '张三',
          状态: '待处理',
          时间: '2026-06-04',
        },
      ],
    },
  })
}
const getDataList = () => {
  getDataListApi().then(res => {
    if (res.code === 200) {
      const resData: any = res.data || []
      status.columns = resData.columns
      status.dataList = resData.dataList
    }
  })
}
</script>
<style scoped lang="scss">
// .el-select.w-48 {
//   width: calc(var(--spacing) * 48);
// }
</style>