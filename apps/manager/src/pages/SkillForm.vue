<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Save, ArrowLeft, Code, Package } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const router = useRouter()

const form = ref({
  name: '',
  type: 'function',
  language: 'python',
  description: '',
  code: `def main(params: dict) -> dict:
    """
    Skill 入口函数, 接收 params 字典, 返回结果字典
    """
    return {"status": "ok"}`,
  inputs: '{"type":"object","properties":{}}',
  outputs: '{"type":"object","properties":{}}',
  status: 'enabled',
})

const handleSave = () => {
  if (!form.value.name.trim()) {
    alert('请输入 Skill 名称')
    return
  }
  alert('Skill 已保存（演示）')
  router.push('/capabilities')
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6 pb-8">
    <div class="flex items-center gap-3">
      <Button variant="ghost" size="icon" @click="router.back()"><ArrowLeft class="w-4 h-4" /></Button>
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">新建 Agent Skill</h1>
        <p class="text-sm text-slate-500 mt-1">编写可被智能体大脑调用的原子能力 Skill</p>
      </div>
    </div>

    <Card class="p-6 border-slate-200">
      <h2 class="text-lg font-medium text-slate-800 mb-4 pb-3 border-b border-slate-100">基础信息</h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Skill 名称 *</label>
          <Input v-model="form.name" placeholder="例如：简历解析与提取" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">运行语言</label>
          <select v-model="form.language" class="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="python">Python 3.11</option>
            <option value="javascript">Node.js 20</option>
            <option value="go">Go 1.22</option>
          </select>
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-slate-700 mb-1">功能描述</label>
          <textarea v-model="form.description" class="w-full h-20 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="描述 Skill 的功能与调用场景..."></textarea>
        </div>
      </div>
    </Card>

    <Card class="p-6 border-slate-200">
      <h2 class="text-lg font-medium text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
        <Code class="w-4 h-4 text-amber-500" />
        入口函数代码
      </h2>
      <textarea v-model="form.code" class="w-full h-64 rounded-md border border-slate-200 bg-slate-900 text-emerald-400 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
      <p class="text-xs text-slate-400 mt-2">Skill 必须实现 <code class="bg-slate-100 px-1 rounded">main(params: dict) -&gt; dict</code> 入口函数</p>
    </Card>

    <Card class="p-6 border-slate-200">
      <h2 class="text-lg font-medium text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
        <Package class="w-4 h-4 text-amber-500" />
        输入输出 Schema
      </h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">入参 JSON Schema</label>
          <textarea v-model="form.inputs" class="w-full h-40 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">出参 JSON Schema</label>
          <textarea v-model="form.outputs" class="w-full h-40 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
        </div>
      </div>
    </Card>

    <div class="flex justify-end gap-2">
      <Button variant="outline" @click="router.back()">取消</Button>
      <Button class="bg-amber-600 hover:bg-amber-700" @click="handleSave"><Save class="w-4 h-4 mr-2" />保存 Skill</Button>
    </div>
  </div>
</template>
