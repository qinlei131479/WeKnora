<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import KBSidebar from '@/components/knowledge-base/KBSidebar.vue'
import KBSettings from '@/components/knowledge-base/KBSettings.vue'
import KBFolderContent from '@/components/knowledge-base/KBFolderContent.vue'
import { getKBs, saveKBs, type KnowledgeBase, type KBFolder, type KBDocument } from '@/lib/kb-store'

const route = useRoute()
const router = useRouter()

const MOCK_PREVIEW_TEMPLATES: Record<string, string> = {
  xlsx: `[XLSX 结构数据预览]\nSheet1: 物理分摊核查矩阵\n--------------------------------------------\n分摊编号  |  所属二级部门  |  权比系数  | 审批状态\n--------------------------------------------\nSR-3011   |  教研网络集成组 |    0.425  | 待物理会签\nSR-3012   |  融媒体分流组   |    0.280  | 已就绪\nSR-3013   |  客服大屏集成组 |    0.295  | 会签驳回\n--------------------------------------------\n底层智能体在跨部门决策中严禁打破以上比例配额红线。`,
  docx: `[DOCX 格式内容预览]\n标题：《关于重大高感知决策流程审计与 Agent 安全阻断红线的指引手册》\n\n1. 所有涉外主权描述和领土核验，必须严格比对新华社 2026 最新官方标准口径；\n2. 集团 T6（专家岗位）以上的薪资或股权合同一律设置不少于 18 个月的流转锁定期；\n3. IPTV 遥控器与播控盒子配对的蓝牙信号强度阈值建议维持在 -85dBm 以上，任何高耗时焦点跳转线程必须加设 120ms 防抖队列。`,
  pdf: `[PDF 纯文本布局预览]\n《集团下属二级部门日常合规审核及应急管理程序（V2）》\n\n- 突发网络安全故障时，底盘机器人的运动关节响应时延阈值严禁超过 60ms；\n- 机器人离线检测零下 30 度至极度严寒环境温度适应系数，应从第三通道进行遥测分流；\n- 人性化日常考勤配额以及绩效浮动系数均在 [HR-HIRE] 领域实行沙箱隔离管控，未受直接下载权授予的职务严禁一键导出。`
}

const kb = ref<KnowledgeBase | null>(null)
const selectedNav = ref('folder-root')
const settingsTab = ref<'base' | 'permissions' | 'more'>('base')
const selectedDocId = ref<string | null>(null)
const activePreviewTab = ref<'original' | 'markdown'>('original')
const customUploadName = ref('')
const showUploadModal = ref(false)
const simulationLogs = ref<string[]>([])
const mdDraft = ref('')
const saveSuccess = ref(false)
const searchDocQuery = ref('')
const isParsingDoc = ref<Record<string, boolean>>({})

const isAddingFolder = ref(false)
const newFolderName = ref('')
const addingToParentId = ref<string | undefined>(undefined)
const expandedFolders = ref<Record<string, boolean>>({})

onMounted(() => {
  loadKB()
})

watch(() => route.params.id, () => {
  loadKB()
})

const loadKB = () => {
  const kbs = getKBs()
  const id = route.params.id as string
  const found = kbs.find(k => k.id === id)
  if (!found) {
    router.push('/kb')
    return
  }

  if (!found.folders) {
    found.folders = []
  }
  kb.value = found

  const rootDocs = (found.docs || []).filter(d => !d.folderId)
  if (rootDocs.length > 0 && !selectedDocId.value) {
    selectedDocId.value = rootDocs[0].id
    mdDraft.value = (rootDocs[0] as any).mdContent || ''
  }
}

const toggleExpand = (folderId: string) => {
  expandedFolders.value = { ...expandedFolders.value, [folderId]: !expandedFolders.value[folderId] }
}

const handleCreateFolder = () => {
  if (!newFolderName.value.trim()) return
  const newFolder: KBFolder = {
    id: `folder-${Date.now()}`,
    name: newFolderName.value.trim(),
    parentId: addingToParentId.value,
  }
  if (kb.value) {
    const updatedKb = { ...kb.value, folders: [...(kb.value.folders || []), newFolder] }
    kb.value = updatedKb
    const kbs = getKBs()
    saveKBs(kbs.map(k => k.id === kb.value!.id ? updatedKb : k))
  }
  isAddingFolder.value = false
  newFolderName.value = ''
}

const handleZipUpload = () => {
  if (!kb.value) return
  const zipFolders: KBFolder[] = [
    { id: `folder-${Date.now()}-1`, name: '产品规格文书', parentId: undefined },
    { id: `folder-${Date.now()}-2`, name: '2026最终对准版', parentId: `folder-${Date.now()}-1` }
  ]
  const updatedKb = { ...kb.value, folders: [...(kb.value.folders || []), ...zipFolders] }
  kb.value = updatedKb
  const kbs = getKBs()
  saveKBs(kbs.map(k => k.id === kb.value!.id ? updatedKb : k))
}

const startFileParsingTask = (newDocId: string, docName: string, isFailureScenario: boolean) => {
  isParsingDoc.value = { ...isParsingDoc.value, [newDocId]: true }
  const startTimeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false })

  let logs: string[] = [
    `⏰ [${startTimeStr}] 🚀 [网关校验] 上传完毕，发起物理服务器 RAG 连接对位...`,
    `⏰ [${startTimeStr}] [OCR 扫描] 开始对物理文档原始文本布局进行识别...`
  ]
  simulationLogs.value = logs

  const updateDocStatusInStore = (
    status: '解析完成' | '解析失败' | '待解析' | '解析中',
    chunks: number,
    finalMd?: string
  ) => {
    if (!kb.value) return
    const storedKBs = getKBs()
    const loadedKb = storedKBs.find(k => k.id === kb.value!.id)
    if (loadedKb && loadedKb.docs) {
      loadedKb.docs = loadedKb.docs.map(d => {
        if (d.id === newDocId) {
          const ext = docName.split('.').pop() || 'pdf'
          const defaultOriginalPreview = MOCK_PREVIEW_TEMPLATES[ext] || MOCK_PREVIEW_TEMPLATES['pdf']
          return {
            ...d,
            status,
            chunksCount: chunks,
            mdContent: finalMd || d.mdContent || '',
            originalPreviewContent: d.originalPreviewContent || defaultOriginalPreview
          }
        }
        return d
      })
      saveKBs(storedKBs)
      kb.value = loadedKb
    }
    isParsingDoc.value = { ...isParsingDoc.value, [newDocId]: false }
  }

  setTimeout(() => {
    const time1 = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    logs = [...logs, `⏰ [${time1}] ❌ [1次检测异常] 出现布局对齐障碍 (错误码: ERR_LINE_OVERLAPPING - 物理字符块重叠溢出)。`]
    simulationLogs.value = logs

    setTimeout(() => {
      const time2 = new Date().toLocaleTimeString('zh-CN', { hour12: false })
      logs = [...logs, `⏰ [${time2}] 🔄 [自适应激活：第 1 次自动重新对齐] 正在增强 OCR DPI 噪点补偿，重配切片窗口边缘阈值...`]
      simulationLogs.value = logs

      setTimeout(() => {
        const time3 = new Date().toLocaleTimeString('zh-CN', { hour12: false })
        logs = [...logs, `⏰ [${time3}] ❌ [2次检测错误] 物理大列表语法树遍历超时 (原因: ERR_NODE_DEPTH_LIMIT)。`]
        simulationLogs.value = logs

        setTimeout(() => {
          const time4 = new Date().toLocaleTimeString('zh-CN', { hour12: false })
          logs = [...logs, `⏰ [${time4}] 🔄 [安全冗余：第 2 次终极降噪对齐] 正在载入 AI 降噪召回拦截规则，执行多通道特征拼接救治...`]
          simulationLogs.value = logs

          setTimeout(() => {
            const time5 = new Date().toLocaleTimeString('zh-CN', { hour12: false })
            if (isFailureScenario) {
              logs = [...logs, `⏰ [${time5}] ❌ [终极判定失败] OCR 全局破损严重且哈希索引不可恢复，确认无法解析！故障合规报告已安全归档。`]
              simulationLogs.value = logs
              updateDocStatusInStore('解析失败', 0)
            } else {
              const generatedMd = `# 《${docName}》智能体决策对齐说明 (RAG Indexing Metadata)

## 一、 文档基础元数据
- **文件物理命名**: ${docName}
- **解析对齐安全哈希**: SHA256_RAG_${Math.random().toString(36).substring(2, 10).toUpperCase()}
- **全局分段数量**: 15 个高维向量切片
- **安全沙箱状态**: SECURE_LEVEL_ALPHA (高级安全受控)

## 二、 底座关联物理数据源表
根据 AI Agent 的高精度特征多模态关联定位，本手册内容对以下物理生产数据表有最高权重黄金对齐值，作为大模型日常问答的主要支撑依据：
1. \`audit_inspection_formulas\` (合规分析公式与分摊定案比例表)
2. \`security_firewall_dispatch_logs\` (防火墙物理边界状态流转流水表)

## 三、 智能体(Agent)决策约束与行业术语对齐对准
*此区域由业务操作人员手动订正维护，能直接控制大模型的回答底线，请合理配置：*
- 【对齐守则 1】当终端用户提问任何有关"**分摊配额**"或"**绩效扣减**"的涉密数值时，AI 必须严格限制输出具体公式细节，提示用户线下进行物理校准会签。
- 【对齐守则 2】遥感或遥测信号处于低迷振幅边界（<-85dBm）时，系统应当自动触发蓝牙复位广播通知，智能体切勿擅自代答。
- 【对齐守则 3】本文件所有定义的版本对准边界等级，在检索增强计算时，本系统将**仅提取并检索最新版本**（Version ${docName.includes('v') ? 'New' : 'v1'}）内容，物理阻断其余陈旧过时版本文件泄露。`

              logs = [...logs, `⏰ [${time5}] 🌿 [终极对准通过] 完成 OCR 语义拼接级联！动态建立 15 个关联切片并成功填充 Markdown 智能说明文件！`]
              simulationLogs.value = logs
              updateDocStatusInStore('解析完成', 15, generatedMd)
            }
          }, 1200)
        }, 1200)
      }, 1200)
    }, 1200)
  }, 1200)
}

const handleUploadCustomDoc = (fileName: string, isFailureScenario: boolean = false) => {
  if (!fileName.trim() || !kb.value) return

  let folderId: string | undefined = undefined
  if (selectedNav.value !== 'folder-root') {
    folderId = selectedNav.value.replace('folder-', '')
  }

  const sameFolderDup = (kb.value.docs || []).some(
    d => d.folderId === folderId && d.name.trim().toLowerCase() === fileName.trim().toLowerCase()
  )

  if (sameFolderDup) {
    alert(`⚠️ 校验隔离阻断：同一个文件夹目录下不允许存在同名文档！\n《${fileName}》在当前分类下极速检索已存在。`)
    return
  }

  const crossFolderMatches = (kb.value.docs || []).filter(
    d => d.name.trim().toLowerCase() === fileName.trim().toLowerCase()
  )

  let assignedVersion = 1
  if (crossFolderMatches.length > 0) {
    const maxVersion = Math.max(...crossFolderMatches.map(d => d.version || 1), 1)
    assignedVersion = maxVersion + 1
  }

  const randomSizes = ['482 KB', '1.2 MB', '3.4 MB', '720 KB', '2.1 MB']
  const size = randomSizes[Math.floor(Math.random() * randomSizes.length)]

  const newDocId = `doc-${Date.now()}`
  const newDoc: KBDocument & { version?: number; mdContent?: string; originalPreviewContent?: string } = {
    id: newDocId,
    name: fileName.trim(),
    status: '解析中',
    size,
    chunksCount: 0,
    policyName: 'OCR 布局识别 + RAG 切片',
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    folderId,
    version: assignedVersion,
    originalPreviewContent: '',
    mdContent: ''
  }

  const updatedKb = {
    ...kb.value,
    docs: [...(kb.value.docs || []), newDoc]
  }

  kb.value = updatedKb
  selectedDocId.value = newDocId
  mdDraft.value = ''
  activePreviewTab.value = 'original'
  showUploadModal.value = false
  customUploadName.value = ''

  const kbs = getKBs()
  saveKBs(kbs.map(k => k.id === kb.value!.id ? updatedKb : k))

  startFileParsingTask(newDocId, fileName.trim(), isFailureScenario)
}

const handleFileDelete = (docId: string) => {
  if (!kb.value) return
  if (confirm('确定要永久销毁该物理文档切片吗？')) {
    const updatedKb = {
      ...kb.value,
      docs: (kb.value.docs || []).filter(d => d.id !== docId)
    }
    if (selectedDocId.value === docId) {
      selectedDocId.value = null
    }
    kb.value = updatedKb
    const kbs = getKBs()
    saveKBs(kbs.map(k => k.id === kb.value!.id ? updatedKb : k))
  }
}

const handleSelectDoc = (doc: KBDocument) => {
  selectedDocId.value = doc.id
  mdDraft.value = (doc as any).mdContent || ''
  activePreviewTab.value = 'original'
}

const handleSaveMarkdown = () => {
  if (!selectedDocId.value || !kb.value) return
  const updatedKb = {
    ...kb.value,
    docs: (kb.value.docs || []).map(d => {
      if (d.id === selectedDocId.value) {
        return { ...d, mdContent: mdDraft.value }
      }
      return d
    })
  }
  kb.value = updatedKb
  const kbs = getKBs()
  saveKBs(kbs.map(k => k.id === kb.value!.id ? updatedKb : k))
  saveSuccess.value = true
  setTimeout(() => { saveSuccess.value = false }, 2000)
}

const handleTogglePerm = (
  category: 'manage' | 'query' | 'download',
  type: 'depts' | 'positions' | 'usergroups',
  targetId: string
) => {
  if (!kb.value) return

  const safePermissions = kb.value.permissions || {
    manageDepts: [], managePositions: [], manageUserGroups: [],
    accessQueryDepts: ['all_depts'], accessQueryPositions: [], accessQueryUserGroups: [],
    accessDownloadDepts: [], accessDownloadPositions: [], accessDownloadUserGroups: []
  }

  const currentPerms = { ...safePermissions }
  let propKey: keyof typeof currentPerms

  if (category === 'manage') {
    if (type === 'depts') propKey = 'manageDepts'
    else if (type === 'positions') propKey = 'managePositions'
    else propKey = 'manageUserGroups'
  } else if (category === 'query') {
    if (type === 'depts') propKey = 'accessQueryDepts'
    else if (type === 'positions') propKey = 'accessQueryPositions'
    else propKey = 'accessQueryUserGroups'
  } else {
    if (type === 'depts') propKey = 'accessDownloadDepts'
    else if (type === 'positions') propKey = 'accessDownloadPositions'
    else propKey = 'accessDownloadUserGroups'
  }

  const currentArray = [...(currentPerms[propKey] || [])]
  const index = currentArray.indexOf(targetId)
  if (index > -1) {
    currentArray.splice(index, 1)
  } else {
    currentArray.push(targetId)
  }

  currentPerms[propKey] = currentArray as any

  const updatedKb = {
    ...kb.value,
    permissions: currentPerms
  }

  kb.value = updatedKb
  const kbs = getKBs()
  saveKBs(kbs.map(k => k.id === kb.value!.id ? updatedKb : k))
}

const updateKb = (updatedKb: KnowledgeBase) => {
  kb.value = updatedKb
  const kbsList = getKBs()
  saveKBs(kbsList.map(k => k.id === kb.value!.id ? updatedKb : k))
}
</script>

<template>
  <div v-if="kb" class="h-[calc(100vh-64px)] w-full flex bg-slate-50 text-sm">
    <KBSidebar
      :kb="kb"
      :selected-nav="selectedNav"
      :is-adding-folder="isAddingFolder"
      :new-folder-name="newFolderName"
      :adding-to-parent-id="addingToParentId"
      :expanded-folders="expandedFolders"
      @update:selected-nav="selectedNav = $event"
      @update:is-adding-folder="isAddingFolder = $event"
      @update:new-folder-name="newFolderName = $event"
      @update:adding-to-parent-id="addingToParentId = $event"
      @toggle-expand="toggleExpand"
      @handle-create-folder="handleCreateFolder"
      @handle-zip-upload="handleZipUpload"
      @navigate="router.push"
    />
    <KBSettings
      v-if="selectedNav === 'settings'"
      :kb="kb"
      :settings-tab="settingsTab"
      @update:settings-tab="settingsTab = $event"
      @handle-toggle-perm="handleTogglePerm"
      @update-kb="updateKb"
    />
    <div v-else-if="selectedNav === 'trash'" class="flex-1 flex items-center justify-center text-slate-400">回收站内容</div>
    <KBFolderContent
      v-else
      :kb="kb"
      :selected-nav="selectedNav"
      :selected-doc-id="selectedDocId"
      :active-preview-tab="activePreviewTab"
      :md-draft="mdDraft"
      :save-success="saveSuccess"
      :search-doc-query="searchDocQuery"
      :is-parsing-doc="isParsingDoc"
      :simulation-logs="simulationLogs"
      :show-upload-modal="showUploadModal"
      :custom-upload-name="customUploadName"
      @update:selected-doc-id="selectedDocId = $event"
      @update:active-preview-tab="activePreviewTab = $event"
      @update:md-draft="mdDraft = $event"
      @update:save-success="saveSuccess = $event"
      @update:search-doc-query="searchDocQuery = $event"
      @update:show-upload-modal="showUploadModal = $event"
      @update:custom-upload-name="customUploadName = $event"
      @handle-upload-custom-doc="handleUploadCustomDoc"
      @handle-select-doc="handleSelectDoc"
      @handle-save-markdown="handleSaveMarkdown"
      @handle-file-delete="handleFileDelete"
      @start-file-parsing-task="startFileParsingTask"
      @handle-zip-upload="handleZipUpload"
    />
  </div>
</template>