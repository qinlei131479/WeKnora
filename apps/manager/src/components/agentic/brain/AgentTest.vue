<template>
  <div>
    <div class="flex-1 overflow-y-auto mb-4 space-y-4 pr-1">
      <div v-for="(msg, i) in chatLog" :key="i"
        :class="['flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start']">
        <div v-if="msg.role === 'model'"
          class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
          <Bot class="w-4.5 h-4.5" />
        </div>
        <div :class="[
          'p-3 rounded-lg max-w-[80%] text-sm leading-relaxed',
          msg.role === 'user'
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/50 shadow-sm',
        ]">
          {{ msg.content }}
        </div>
        <div v-if="msg.role === 'user'"
          class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
          <span class="text-xs font-bold font-mono">U</span>
        </div>
      </div>
      <div v-if="isTyping" class="flex gap-3 justify-start">
        <div
          class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 shrink-0 border border-slate-200">
          <Loader2 class="w-4 h-4 animate-spin" />
        </div>
        <div
          class="p-3 rounded-lg bg-slate-50 text-slate-500 rounded-bl-none flex items-center gap-2 border border-slate-100">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
          <span>大脑神经突触传递与大模型推理中...</span>
        </div>
      </div>
    </div>
    <div class="flex gap-2">
      <Input placeholder="输入测试指令..." v-model="message"
        @keydown="(e: KeyboardEvent) => e.key === 'Enter' && sendMessage()" />
      <Button size="icon" class="shrink-0 bg-indigo-600 hover:bg-indigo-700 h-10 w-10 text-white"
        @click="sendMessage">
        <Send class="w-4.5 h-4.5" />
      </Button>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  Search, Plus, CheckCircle2, Bot, Loader2, MessageSquare, Trash,
  BrainCircuit, Settings2, Zap, Calendar, BookOpen, Database, Wrench,
  Cpu, Layers, Send
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import { getAgents, deleteAgent, type Agent } from '@/lib/agent-store'

// const testAgent = ref<Agent | null>(null)
const props = defineProps<{
  testAgent: Agent
}>()
const message = ref('')
const chatLog = ref<{ role: 'user' | 'model'; content: string }[]>([])
const isTyping = ref(false)

const sendMessage = () => {
  if (!message.value.trim()) return
  const newLog = [...chatLog.value, { role: 'user' as const, content: message.value }]
  chatLog.value = newLog
  message.value = ''
  isTyping.value = true

  setTimeout(() => {
    chatLog.value = [
      ...newLog,
      {
        role: 'model',
        content: `[智能体大脑协同测试] 您好！左脑（基础通用半脑）已协助拦截并执行安全词过滤，右脑（特化业务半脑「${props.testAgent.name}」）调用了大语言思考模型 [${props.testAgent.model}]、专属知识库、外部API及定时任务。当前中枢网络延迟 14ms，解析运转一切良好！`,
      },
    ]
    isTyping.value = false
  }, 1100)
}
</script>