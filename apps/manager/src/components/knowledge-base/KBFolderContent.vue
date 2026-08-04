<script setup lang="ts">
import { computed } from 'vue'
import {
  UploadCloud, Search, MoreHorizontal, ChevronRight, FileText, File, HardDrive, Filter, RefreshCw,
  Edit2, Eye, CheckCircle2, AlertTriangle, Loader2, Check, X, AlertCircle, Folder
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Card from '@/components/ui/Card.vue'
import type { KnowledgeBase, KBDocument } from '@/lib/kb-store'

const MOCK_PREVIEW_TEMPLATES: Record<string, string> = {
  xlsx: `[XLSX 结构数据预览]\nSheet1: 物理分摊核查矩阵\n--------------------------------------------\n分摊编号  |  所属二级部门  |  权比系数  | 审批状态\n--------------------------------------------\nSR-3011   |  教研网络集成组 |    0.425  | 待物理会签\nSR-3012   |  融媒体分流组   |    0.280  | 已就绪\nSR-3013   |  客服大屏集成组 |    0.295  | 会签驳回\n--------------------------------------------\n底层智能体在跨部门决策中严禁打破以上比例配额红线。`,
  docx: `[DOCX 格式内容预览]\n标题：《关于重大高感知决策流程审计与 Agent 安全阻断红线的指引手册》\n\n1. 所有涉外主权描述和领土核验，必须严格比对新华社 2026 最新官方标准口径；\n2. 集团 T6（专家岗位）以上的薪资或股权合同一律设置不少于 18 个月的流转锁定期；\n3. IPTV 遥控器与播控盒子配对的蓝牙信号强度阈值建议维持在 -85dBm 以上，任何高耗时焦点跳转线程必须加设 120ms 防抖队列。`,
  pdf: `[PDF 纯文本布局预览]\n《集团下属二级部门日常合规审核及应急管理程序（V2）》\n\n- 突发网络安全故障时，底盘机器人的运动关节响应时延阈值严禁超过 60ms；\n- 机器人离线检测零下 30 度至极度严寒环境温度适应系数，应从第三通道进行遥测分流；\n- 人性化日常考勤配额以及绩效浮动系数均在 [HR-HIRE] 领域实行沙箱隔离管控，未受直接下载权授予的职务严禁一键导出。`
}

interface Props {
  kb: KnowledgeBase
  selectedNav: string
  selectedDocId: string | null
  activePreviewTab: 'original' | 'markdown'
  mdDraft: string
  saveSuccess: boolean
  searchDocQuery: string
  isParsingDoc: Record<string, boolean>
  simulationLogs: string[]
  showUploadModal: boolean
  customUploadName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:selectedDocId', value: string | null): void
  (e: 'update:activePreviewTab', value: 'original' | 'markdown'): void
  (e: 'update:mdDraft', value: string): void
  (e: 'update:saveSuccess', value: boolean): void
  (e: 'update:searchDocQuery', value: string): void
  (e: 'update:showUploadModal', value: boolean): void
  (e: 'update:customUploadName', value: string): void
  (e: 'handleUploadCustomDoc', fileName: string, isFailureScenario?: boolean): void
  (e: 'handleSelectDoc', doc: KBDocument): void
  (e: 'handleSaveMarkdown'): void
  (e: 'handleFileDelete', docId: string): void
  (e: 'startFileParsingTask', newDocId: string, docName: string, isFailureScenario: boolean): void
  (e: 'handleZipUpload'): void
}>()

const selectedDoc = computed(() => (props.kb.docs || []).find(d => d.id === props.selectedDocId))

const folderInfo = computed(() => {
  if (props.selectedNav === 'folder-root') {
    return { name: '根目录', id: undefined }
  }
  const id = props.selectedNav.replace('folder-', '')
  const folder = props.kb.folders?.find(f => f.id === id)
  return { name: folder?.name || '未知文件夹', id }
})

const docs = computed(() => {
  const folderId = folderInfo.value.id
  return (props.kb.docs || []).filter(d => {
    if (d.sourceType === 'web' || d.sourceType === 'db') return false
    if (d.folderId !== folderId) return false
    if (props.searchDocQuery.trim()) {
      return d.name.toLowerCase().includes(props.searchDocQuery.toLowerCase())
    }
    return true
  })
})

const handleRetry = (doc: KBDocument) => {
  emit('handleFileDelete', doc.id)
  emit('handleUploadCustomDoc', doc.name, false)
}
</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-white">
    <div class="px-6 py-4 flex items-center justify-between border-b bg-white">
      <div class="space-y-1">
        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Folder class="w-5 h-5 text-blue-600 fill-blue-50" />
          <span>{{ folderInfo.name }}</span>
          <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
            {{ docs.length }} 个文档
          </span>
        </h2>
        <p class="text-[11px] text-slate-400">用户可自行在左侧维护多级下级树形分类目录</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <Search class="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            class="pl-9 h-9 w-64 text-xs"
            placeholder="搜索当前目录下的物理文件..."
            :value="searchDocQuery"
            @change="(e:any) => emit('update:searchDocQuery', (e.target as HTMLInputElement).value)"
          />
        </div>
        <Button class="h-9 bg-blue-600 hover:bg-blue-700 font-bold text-xs" @click="emit('update:showUploadModal', true)">
          <UploadCloud class="w-4 h-4 mr-2" />
          上传本地文档
        </Button>
      </div>
    </div>

    <div class="px-6 py-2.5 border-b flex items-center gap-4 bg-slate-50 text-xs text-slate-500">
      <div class="flex items-center gap-1">
        <Filter class="w-3.5 h-3.5 text-slate-400" />
        <span class="font-semibold text-slate-700">过滤规则:</span>
      </div>
      <span class="text-slate-400">所有常规 RAG 手册切片处于安全审计沙箱内，检索问答时将自动摒弃陈旧历史版本，仅召回最新版本。</span>
    </div>

    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50">
      <div class="flex-1 overflow-y-auto p-5 space-y-4">
        <div
          @click="emit('update:showUploadModal', true)"
          class="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 bg-white hover:bg-blue-50/20 text-center cursor-pointer transition-all flex flex-col items-center justify-center group shadow-sm"
        >
          <UploadCloud class="w-9 h-9 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors duration-250 animate-bounce" />
          <span class="text-xs font-semibold text-slate-700">将本地物理 PDF/Word/Excel 文档拖入此区域</span>
          <span class="text-[10px] text-slate-400 mt-1">
            内嵌 **跨文件夹重名自动生成版本号** 与 **同文件夹重名隔离** 逻辑
          </span>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-slate-50 sticky top-0 z-10 border-b text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th class="px-5 py-3 font-bold">名称 / 版本</th>
                <th class="px-5 py-3 font-bold">状态</th>
                <th class="px-5 py-3 font-bold">切片</th>
                <th class="px-5 py-3 font-bold">大小</th>
                <th class="px-5 py-3 font-bold">同步时间</th>
                <th class="px-5 py-3 font-bold">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="docs.length === 0">
                <td colspan="6" class="py-16 text-center text-slate-400 text-xs">
                  <Folder class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  当前分类目录为空，可以用上面的按钮上传极速模拟文件。
                </td>
              </tr>
              <tr
                v-for="doc in docs"
                :key="doc.id"
                @click="emit('handleSelectDoc', doc)"
                :class="[
                  'hover:bg-slate-50/80 cursor-pointer transition-colors',
                  selectedDocId === doc.id ? 'bg-blue-50/50 hover:bg-blue-50' : ''
                ]"
              >
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3 max-w-[280px]">
                    <FileText :class="[
                      'w-5 h-5 shrink-0',
                      selectedDocId === doc.id ? 'text-blue-600' : 'text-slate-400'
                    ]" />
                    <div class="truncate space-y-0.5">
                      <div class="font-bold text-slate-800 text-xs truncate flex items-center gap-1.5">
                        {{ doc.name }}
                        <span
                          v-if="(doc.version || 1) > 1"
                          class="bg-amber-50 text-amber-700 border border-amber-200 text-[9.5px] px-1 py-0.2 rounded font-extrabold font-mono shrink-0"
                        >
                          v{{ doc.version || 1 }} 最新
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-400 font-mono truncate">
                        策略: {{ doc.policyName || 'OCR布局提取 + RAG切分' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <span
                    v-if="doc.status === '解析中'"
                    class="inline-flex items-center gap-1.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2 py-0.5 rounded animate-pulse"
                  >
                    <Loader2 class="w-3 h-3 animate-spin" />
                    正在双级对准中...
                  </span>
                  <span
                    v-else-if="doc.status === '解析失败'"
                    class="inline-flex items-center gap-1.5 text-[10px] bg-rose-50 text-rose-700 border border-rose-100 font-bold px-2 py-0.5 rounded"
                  >
                    <AlertCircle class="w-3 h-3" />
                    解析失败(重试2次仍错)
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2 py-0.5 rounded"
                  >
                    <Check class="w-3 h-3" />
                    解析且对齐完成
                  </span>
                </td>
                <td class="px-5 py-3.5 text-slate-600 font-mono text-xs">
                  {{ doc.status === '解析中' ? '载入中' : `${doc.chunksCount || 0} 段` }}
                </td>
                <td class="px-5 py-3.5 text-slate-500 text-xs font-mono">{{ doc.size }}</td>
                <td class="px-5 py-3.5 text-slate-400 text-xs">{{ doc.updatedAt }}</td>
                <td class="px-5 py-3.5 text-xs font-semibold" @click.stop>
                  <div class="flex items-center gap-2">
                    <template v-if="doc.status === '解析失败'">
                      <button @click="handleRetry(doc)" class="text-blue-600 hover:underline flex items-center gap-1">
                        <RefreshCw class="w-3 h-3" />
                        重新检测
                      </button>
                    </template>
                    <template v-else>
                      <button @click="emit('handleSelectDoc', doc)" class="text-blue-600 hover:underline">
                        预览/说明
                      </button>
                    </template>
                    <span class="text-slate-200">|</span>
                    <button @click="emit('handleFileDelete', doc.id)" class="text-rose-600 hover:underline">
                      销毁
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="w-full lg:w-[480px] xl:w-[520px] bg-white border-l flex flex-col h-full shrink-0 shadow-inner">
        <div class="flex border-b bg-slate-50">
          <button
            @click="emit('update:activePreviewTab', 'original')"
            :class="[
              'flex-1 py-3 text-xs font-bold border-r text-center transition-all flex items-center justify-center gap-1.5',
              activePreviewTab === 'original' ? 'bg-white text-blue-600 border-b-2 border-b-blue-600' : 'text-slate-500 hover:text-slate-800'
            ]"
          >
            <Eye class="w-3.5 h-3.5" />
            📄 原始物理文件预览
          </button>
          <button
            @click="() => {
              emit('update:activePreviewTab', 'markdown')
              if (selectedDoc) {
                emit('update:mdDraft', (selectedDoc as any).mdContent || '')
              }
            }"
            :class="[
              'flex-1 py-3 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5',
              activePreviewTab === 'markdown' ? 'bg-white text-blue-600 border-b-2 border-b-blue-600' : 'text-slate-500 hover:text-slate-800'
            ]"
          >
            <Edit2 class="w-3.5 h-3.5" />
            📝 MD-智能对齐说明
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 relative">
          <div
            v-if="saveSuccess"
            class="absolute top-4 left-4 right-4 bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-lg text-xs flex items-center gap-2 z-20 animate-in fade-in duration-200"
          >
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
            <span><b>对齐大纲保存成功！</b> 新规则已注入本地 RAG 问答模型。</span>
          </div>

          <template v-if="!selectedDoc">
            <div class="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
              <HardDrive class="w-12 h-12 text-slate-200 mb-3" />
              <p class="text-xs font-bold text-slate-600">文档预览与说明编辑器</p>
              <p class="text-[11px] text-slate-400 mt-2 max-w-xs leading-relaxed">
                请在左侧列表中点击选择任一本地物理文档，以便在线预览物理脱敏结构，并同步对齐高精度的智能大纲说明 (.md) 约束文件。
              </p>
            </div>
          </template>

          <template v-else>
            <div class="space-y-4 h-full flex flex-col">
              <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] bg-blue-600 text-white font-extrabold px-1.5 py-0.2 rounded font-mono shrink-0">
                    {{ selectedDoc.name.split('.').pop()?.toUpperCase() || 'FILE' }}
                  </span>
                  <span class="font-bold text-slate-800 text-xs truncate flex-1">{{ selectedDoc.name }}</span>
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>审计大小: {{ selectedDoc.size }}</span>
                  <span>全局标记版本: v{{ selectedDoc.version || 1 }}</span>
                </div>
              </div>

              <template v-if="activePreviewTab === 'original'">
                <div class="flex-1 flex flex-col min-h-0">
                  <div
                    v-if="selectedDoc.status === '解析中'"
                    class="flex-1 bg-slate-900 rounded-xl p-4 font-mono text-[10px] text-emerald-400 space-y-2 overflow-y-auto leading-relaxed border border-slate-800"
                  >
                    <div class="flex items-center gap-2 text-blue-400 font-bold border-b border-slate-800 pb-2 mb-2 animate-pulse">
                      <Loader2 class="w-3.5 h-3.5 animate-spin" />
                      <span>物理底座双通道 RAG OCR 正在自动检测中...</span>
                    </div>
                    <div v-for="(log, i) in simulationLogs" :key="i" class="animate-in fade-in duration-150">{{ log }}</div>
                    <div class="text-slate-500 text-[9px] mt-2 animate-pulse">
                      (系统正在模拟 1次异常崩溃报警 与 2次冗余自适应微调救治，重连耗时约 4~5 秒...)
                    </div>
                  </div>

                  <div
                    v-else-if="selectedDoc.status === '解析失败'"
                    class="flex-1 bg-rose-50 border border-rose-150 rounded-xl p-5 flex flex-col justify-center items-center text-center space-y-3"
                  >
                    <AlertTriangle class="w-12 h-12 text-rose-500 animate-bounce" />
                    <div>
                      <h4 class="text-xs font-bold text-rose-800">该物理文档解析救治崩溃</h4>
                      <p class="text-[10px] text-rose-600 mt-1.5 max-w-xs leading-relaxed">
                        [故障定位]: 检测到严重物理噪点或语法树深度极限溢出。本系统在第1次/第2次自动救治尝试中皆告撞线，宣告损坏。
                      </p>
                    </div>
                    <div class="bg-white p-3 rounded border border-rose-100 text-left font-mono text-[9px] text-rose-500 w-full max-w-sm">
                      [SYS_ERR]: CONFLICT_OCR_SEGMENT_FAULT_CORE30 (重试2次告败)
                    </div>
                    <Button
                      size="sm"
                      class="bg-rose-600 hover:bg-rose-700 text-white font-bold h-8 text-xs"
                      @click="handleRetry(selectedDoc)"
                    >
                      🔄 净化异常噪音并一键重新检测
                    </Button>
                  </div>

                  <div
                    v-else
                    class="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-700 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner"
                  >
                    {{ (selectedDoc as any).originalPreviewContent || `这是《${selectedDoc.name}》的物理文档原始脱敏预览，可在上面点击切换 Markdown 说明编辑。` }}
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="flex-1 flex flex-col min-h-0 space-y-3">
                  <div
                    v-if="selectedDoc.status === '解析中'"
                    class="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-6 bg-slate-50/50 border border-dashed rounded-xl"
                  >
                    <Loader2 class="w-8 h-8 text-blue-500 animate-spin mb-2" />
                    <p class="text-xs font-bold">RAG OCR 自动解析中...</p>
                    <p class="text-[10px] text-slate-400 mt-1">
                      物理原稿提取对准完成后，方可由人工编辑对应的 Markdown 说明文件。
                    </p>
                  </div>

                  <div
                    v-else-if="selectedDoc.status === '解析失败'"
                    class="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-6 bg-slate-50/50 border border-dashed rounded-xl"
                  >
                    <AlertTriangle class="w-8 h-8 text-rose-500 mb-2" />
                    <p class="text-xs font-bold text-rose-700">物理文档损坏</p>
                    <p class="text-[10px] text-rose-500 mt-1">
                      无法建立对应的智能说明。请优先在"原始文件预览"中点击一键重新检测净化。
                    </p>
                  </div>

                  <div v-else class="flex-1 flex flex-col min-h-0 space-y-3">
                    <div class="flex-1 flex flex-col min-h-0">
                      <label class="block text-xs font-bold text-slate-700 mb-1">
                        🌿 智能说明内容 (.md 可在此直接修改和扩展)：
                      </label>
                      <textarea
                        :value="mdDraft"
                        @input="e => emit('update:mdDraft', (e.target as HTMLTextAreaElement).value)"
                        class="flex-1 w-full bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] leading-relaxed border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none min-h-[220px]"
                        placeholder="# 自定义说明..."
                      />
                    </div>

                    <Button
                      @click="emit('handleSaveMarkdown')"
                      class="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 w-full text-xs flex items-center justify-center gap-1.5"
                    >
                      <Check class="w-4 h-4" />
                      保存人工订正并发布新版知识
                    </Button>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div
      v-if="showUploadModal"
      class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <Card class="max-w-md w-full p-6 bg-white rounded-2xl shadow-xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <UploadCloud class="w-5 h-5 text-blue-600" />
            本地物理文档接入向导
          </h3>
          <button @click="emit('update:showUploadModal', false)" class="text-slate-400 hover:text-slate-600">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold mb-1.5 text-slate-700">自定义物理文件名 *</label>
            <div class="flex gap-2">
              <Input
                placeholder="例如: 融媒体中心合规审计规范.docx"
                :value="customUploadName"
                @change="(e:any) => emit('update:customUploadName', (e.target as HTMLInputElement).value)"
                class="h-9 flex-1 text-xs"
                @keydown.enter="emit('handleUploadCustomDoc', customUploadName, false)"
              />
            </div>
          </div>

          <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <span class="font-bold text-slate-600 block">💡 极载快速测试套件（提供两种自动测试选项）：</span>
            <div class="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                class="h-8 text-[11px] hover:bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                @click="() => {
                  const names = [
                    '新能巡检人形机器人底盘动力关节控制手册.pdf',
                    '2026年度社会招聘职级与薪酬对准表.xlsx',
                    '高频无线蓝牙大屏遥控失配离线话术手册.docx'
                  ]
                  const rand = names[Math.floor(Math.random() * names.length)]
                  emit('handleUploadCustomDoc', rand, false)
                }"
              >
                🚀 必定成功模拟样卷
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 text-[11px] hover:bg-rose-50 text-rose-700 border-rose-200 font-bold"
                @click="() => {
                  const randFailure = '物理大文本受损异常报错测试样卷_FAIL.pdf'
                  emit('handleUploadCustomDoc', randFailure, true)
                }"
              >
                ⚠️ 必定失败报错样卷
              </Button>
            </div>
          </div>

          <p class="opacity-80 text-slate-500">
            * 本模拟通道完全支持 **自动退偏重测 2 次** 功能，通过在左侧列表再次点击，您能实时观察其解析重试全流程。同一物理目录禁止重名；异名文件夹同名自动标记版本！
          </p>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" size="sm" @click="emit('update:showUploadModal', false)">取消</Button>
          <Button
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            size="sm"
            @click="emit('handleUploadCustomDoc', customUploadName, false)"
            :disabled="!customUploadName.trim()"
          >
            启动底座解析
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>