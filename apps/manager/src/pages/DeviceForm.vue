<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Save, ArrowLeft, Cpu, Bot, Tablet, Monitor } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => !!route.params.id)

const form = ref({
  name: '',
  type: 'robot',
  model: '',
  serial: '',
  location: '',
  ip: '',
  mac: '',
  agentId: '',
  description: '',
})

const deviceTypes = [
  { id: 'robot', label: '机器人', icon: Bot, color: 'from-cyan-500 to-blue-600' },
  { id: 'tablet', label: '平板终端', icon: Tablet, color: 'from-emerald-500 to-teal-600' },
  { id: 'kiosk', label: '大屏终端', icon: Monitor, color: 'from-rose-500 to-pink-600' },
  { id: 'iot', label: 'IoT 设备', icon: Cpu, color: 'from-violet-500 to-purple-600' },
]

const handleSave = () => {
  if (!form.value.name.trim()) {
    alert('请输入设备名称')
    return
  }
  alert('设备已保存（演示）')
  router.push('/devices')
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 pb-8">
    <div class="flex items-center gap-3">
      <Button variant="ghost" size="icon" @click="router.back()"><ArrowLeft class="w-4 h-4" /></Button>
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">{{ isEdit ? '编辑设备' : '接入新设备' }}</h1>
        <p class="text-sm text-slate-500 mt-1">配置物理设备终端的接入信息与关联智能体</p>
      </div>
    </div>

    <Card class="p-6 border-slate-200">
      <h2 class="text-lg font-medium text-slate-800 mb-4 pb-3 border-b border-slate-100">设备类型</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button v-for="t in deviceTypes" :key="t.id" type="button" :class="['flex flex-col items-center p-4 rounded-xl border text-xs font-bold transition-all', form.type === t.id ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50']" @click="form.type = t.id">
          <div :class="['w-10 h-10 rounded-lg bg-gradient-to-br text-white flex items-center justify-center mb-2', t.color]">
            <component :is="t.icon" class="w-5 h-5" />
          </div>
          {{ t.label }}
        </button>
      </div>
    </Card>

    <Card class="p-6 border-slate-200">
      <h2 class="text-lg font-medium text-slate-800 mb-4 pb-3 border-b border-slate-100">基础信息</h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">设备名称 *</label>
          <Input v-model="form.name" placeholder="例如：巡检机器人-01" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">设备型号</label>
          <Input v-model="form.model" placeholder="X-1000" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">序列号 SN</label>
          <Input v-model="form.serial" placeholder="SN-2026-0001" class="font-mono" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">部署位置</label>
          <Input v-model="form.location" placeholder="行政大楼1F" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">IP 地址</label>
          <Input v-model="form.ip" placeholder="192.168.1.100" class="font-mono" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">MAC 地址</label>
          <Input v-model="form.mac" placeholder="00:1A:2B:3C:4D:5E" class="font-mono" />
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-slate-700 mb-1">关联智能体 (Agent ID)</label>
          <Input v-model="form.agentId" placeholder="agent-xxxxx" class="font-mono" />
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-slate-700 mb-1">备注</label>
          <textarea v-model="form.description" class="w-full h-20 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="设备用途与说明..."></textarea>
        </div>
      </div>
    </Card>

    <div class="flex justify-end gap-2">
      <Button variant="outline" @click="router.back()">取消</Button>
      <Button class="bg-cyan-600 hover:bg-cyan-700" @click="handleSave"><Save class="w-4 h-4 mr-2" />保存设备</Button>
    </div>
  </div>
</template>
