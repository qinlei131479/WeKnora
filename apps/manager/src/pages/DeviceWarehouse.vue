<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Search, Cpu, Wifi, Battery, Signal, Bot, Tablet, Monitor } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const searchTerm = ref('')
const activeType = ref<'all' | 'robot' | 'tablet' | 'kiosk'>('all')

const devices = ref([
  { id: 1, name: '巡检机器人-01', type: '机器人', icon: Bot, color: 'from-cyan-500 to-blue-600', model: 'X-1000', location: '行政大楼1F', battery: 87, signal: 95, status: '在线' },
  { id: 2, name: '迎宾机器人-A', type: '机器人', icon: Bot, color: 'from-violet-500 to-purple-600', model: 'X-2000', location: '大堂入口', battery: 62, signal: 88, status: '在线' },
  { id: 3, name: '车间巡检-02', type: '机器人', icon: Bot, color: 'from-amber-500 to-orange-600', model: 'X-1500', location: '生产车间A区', battery: 45, signal: 78, status: '作业中' },
  { id: 4, name: '前台平板-Pad1', type: '平板终端', icon: Tablet, color: 'from-emerald-500 to-teal-600', model: 'iPad Pro 12.9', location: '前台', battery: 100, signal: 100, status: '在线' },
  { id: 5, name: '会议室大屏-3F', type: '大屏终端', icon: Monitor, color: 'from-rose-500 to-pink-600', model: 'SmartScreen 86', location: '3F会议室', battery: 100, signal: 95, status: '在线' },
  { id: 6, name: '巡检机器人-03', type: '机器人', icon: Bot, color: 'from-slate-500 to-slate-700', model: 'X-1000', location: '研发中心', battery: 12, signal: 0, status: '离线' },
])

const filteredDevices = computed(() => {
  return devices.value.filter((d) => {
    if (activeType.value !== 'all') {
      if (activeType.value === 'robot' && d.type !== '机器人') return false
      if (activeType.value === 'tablet' && d.type !== '平板终端') return false
      if (activeType.value === 'kiosk' && d.type !== '大屏终端') return false
    }
    if (searchTerm.value && !d.name.toLowerCase().includes(searchTerm.value.toLowerCase()) && !d.location.toLowerCase().includes(searchTerm.value.toLowerCase())) {
      return false
    }
    return true
  })
})
</script>

<template>
  <div class="h-full flex flex-col space-y-6 pb-8">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">设备仓库</h1>
        <p class="text-sm text-slate-500 mt-1">统一管理所有运行智能体大脑的物理设备终端</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative w-80 max-w-full">
          <Search class="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input v-model="searchTerm" placeholder="搜索设备名称/位置..." class="pl-10 h-10 bg-white rounded-xl border-slate-200" />
        </div>
        <router-link to="/devices/new">
          <Button class="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold h-10 px-5 rounded-xl shadow-md">
            <Plus class="w-4 h-4 mr-2" /> 接入新设备
          </Button>
        </router-link>
      </div>
    </div>

    <div class="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
      <div class="w-full lg:w-56 shrink-0 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm h-fit">
        <div class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-2">设备类型</div>
        <div class="space-y-1">
          <button v-for="cat in [{ id: 'all', label: '全部设备' }, { id: 'robot', label: '机器人' }, { id: 'tablet', label: '平板终端' }, { id: 'kiosk', label: '大屏终端' }]" :key="cat.id" :class="['w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors', activeType === cat.id ? 'bg-cyan-50 text-cyan-700 font-bold' : 'text-slate-600 hover:bg-slate-50']" @click="activeType = cat.id as any">
            <Cpu class="w-4 h-4" />
            <span class="flex-1 text-left">{{ cat.label }}</span>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card v-for="device in filteredDevices" :key="device.id" class="p-5 border-slate-200 hover:border-cyan-200 hover:shadow-md transition-all group">
            <div class="flex items-start gap-3 mb-4">
              <div :class="['w-12 h-12 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform', device.color]">
                <component :is="device.icon" class="w-6 h-6" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-slate-800 truncate">{{ device.name }}</h3>
                <span class="text-[10px] text-slate-400 font-mono">{{ device.model }} · {{ device.location }}</span>
              </div>
              <span :class="['text-[10px] font-bold px-2 py-0.5 rounded border', device.status === '离线' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200']">
                <span :class="['w-1.5 h-1.5 rounded-full inline-block mr-1', device.status === '离线' ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse']"></span>
                {{ device.status }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div>
                <div class="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1.5">
                  <span class="flex items-center"><Battery class="w-3 h-3 mr-1" />电量</span>
                  <span class="font-mono">{{ device.battery }}%</span>
                </div>
                <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div :class="['h-full transition-all', device.battery > 50 ? 'bg-emerald-500' : device.battery > 20 ? 'bg-amber-500' : 'bg-rose-500']" :style="{ width: device.battery + '%' }"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1.5">
                  <span class="flex items-center"><Signal class="w-3 h-3 mr-1" />信号</span>
                  <span class="font-mono">{{ device.signal }}%</span>
                </div>
                <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div :class="['h-full transition-all', device.signal > 70 ? 'bg-cyan-500' : 'bg-slate-300']" :style="{ width: device.signal + '%' }"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
