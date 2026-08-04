<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Search, Plus, Trash2, Edit, CheckCircle2, XCircle, UploadCloud, HelpCircle,
  Info, X, ChevronRight, ChevronDown, RefreshCw, Sparkles, Check, FileText,
  AlertCircle, BookOpen, Layers, Undo2, ArrowRight, Eye, ShieldAlert, BadgeCheck,
  FolderTree, Settings2, Shield, Lock, ShieldCheck, UserCheck, KeyRound, Globe,
  Database, User as UserIcon, Play, Loader2, Save, Send, EyeOff, Terminal,
  Bold, Italic, Underline, ImageIcon, Video, Paperclip, Link, Type, MessageSquare
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { getDomains, getFlatDomains, isDomainMatch } from '@/lib/domain-store'
import { getFAQKBs, saveFAQKBs, addFAQKB, deleteFAQKB, type FAQKnowledgeBase, type FAQItem, type FAQCategory } from '@/lib/faq-store'
import { getUsers, getDepartments, getPositions, getUserGroups, type User } from '@/lib/org-store'
import { getDefaultPermissions, type KBPermissions } from '@/lib/kb-store'

const kbs = ref<FAQKnowledgeBase[]>([])
const selectedKBId = ref<string | null>(null)
const activeTab = ref<'faq' | 'permissions'>('faq')

const searchTerm = ref('')
const selectedDomain = ref('all')
const expandedDomains = ref<Record<string, boolean>>({
  'base': true,
  'business': true,
  'biz-media': true,
  'biz-iptv': true,
  'biz-hr': true,
})

const usersList = ref<User[]>([])
const currentUserId = ref('user-1')

const showCreateKBModal = ref(false)
const newKBTitle = ref('')
const newKBDesc = ref('')
const newKBDomain = ref('base-general-llm')
const newKBModel = ref('text-embedding-004')

const expandedInnerCats = ref<Record<string, boolean>>({})
const insideSearch = ref('')
const insideSubcatId = ref('all')
const showAddInnerCatModal = ref(false)
const newInnerCatName = ref('')
const newInnerCatParent = ref<string | null>(null)

const showFAQEditModal = ref(false)
const viewingFAQ = ref<FAQItem | null>(null)
const editingFAQ = ref<FAQItem | null>(null)
const faqForm = ref({
  question: '',
  answer: '',
  category: '',
  status: 'active' as 'active' | 'inactive'
})

const showPermPickerModal = ref(false)
const activePermCategory = ref<'manage' | 'accessQuery' | 'accessDownload'>('manage')
const activePermType = ref<'Depts' | 'Positions' | 'UserGroups'>('Depts')
const permSearchKeyword = ref('')

const showFAQImportModal = ref(false)
const importStep = ref(1)
const importedFile = ref<{name: string, size: string, extension: string} | null>(null)
const parsingLogs = ref<string[]>([])
const extractedFaqs = ref<{question: string, answer: string, category: string, selected: boolean}[]>([])
const dragActive = ref(false)

const customToast = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingFileType = ref<'image'|'video'|'file'|null>(null)

onMounted(() => {
  kbs.value = getFAQKBs()
  const orgUsers = getUsers()
  usersList.value = orgUsers
  const savedUserId = localStorage.getItem('current-mock-user-id')
  if (savedUserId && orgUsers.some(u => u.id === savedUserId)) {
    currentUserId.value = savedUserId
  }
})

const triggerToast = (msg: string) => {
  customToast.value = msg
  setTimeout(() => { customToast.value = null }, 3000)
}

const activeUser = computed(() => usersList.value.find(u => u.id === currentUserId.value) || usersList.value[0])

const getBriefDomainLabel = (domainId: string) => {
  const flat = getFlatDomains()
  const found = flat.find(f => f.id === domainId)
  return found ? found.label : '全部'
}

const evalPermissions = (kb: FAQKnowledgeBase) => {
  return { canManage: true, canQuery: true, canDownload: true }
}

const handleCreateKB = () => {
  if (!newKBTitle.value.trim()) return alert('请输入知识库名称')

  const newObj = addFAQKB({
    title: newKBTitle.value.trim(),
    description: newKBDesc.value.trim() || '暂无备注',
    domain: newKBDomain.value,
    embeddingModel: newKBModel.value,
    faqs: [],
    categories: [
      { id: 'cat-root-1', name: '通用问答', parentId: null },
      { id: 'cat-root-2', name: '业务规范', parentId: null }
    ]
  })

  kbs.value = getFAQKBs()
  showCreateKBModal.value = false
  newKBTitle.value = ''
  newKBDesc.value = ''
  triggerToast(`✨ 成功创建新的 FAQ 知识库 [${newObj.title}]！`)
}

const handleDeleteKB = (kbId: string, title: string) => {
  if (confirm(`确定彻底删除 [${title}] 吗？不可逆！`)) {
    deleteFAQKB(kbId)
    kbs.value = getFAQKBs()
    if (selectedKBId.value === kbId) selectedKBId.value = null
    triggerToast('🗑️ FAQ 知识库已彻底销毁。')
  }
}

const selectedKB = computed(() => kbs.value.find(k => k.id === selectedKBId.value))

const handleCreateInnerCat = () => {
  if (!newInnerCatName.value.trim() || !selectedKBId.value) return

  const nextKBs = kbs.value.map(kb => {
    if (kb.id !== selectedKBId.value) return kb
    const cats = kb.categories || []
    const newCat: FAQCategory = {
      id: `cat-${Date.now()}`,
      name: newInnerCatName.value.trim(),
      parentId: newInnerCatParent.value
    }
    return { ...kb, categories: [...cats, newCat], updatedAt: new Date().toISOString() }
  })

  kbs.value = nextKBs
  saveFAQKBs(nextKBs)
  showAddInnerCatModal.value = false
  newInnerCatName.value = ''
  newInnerCatParent.value = null
  triggerToast('分类已添加')
}

const handleDeleteInnerCat = (catId: string) => {
  if (!confirm('确定删除该分类吗？相关的问题可能会变成无分类状态。')) return

  const nextKBs = kbs.value.map(kb => {
    if (kb.id !== selectedKBId.value) return kb
    const cats = (kb.categories || []).filter(c => c.id !== catId && c.parentId !== catId)
    return { ...kb, categories: cats, updatedAt: new Date().toISOString() }
  })
  kbs.value = nextKBs
  saveFAQKBs(nextKBs)
  if (insideSubcatId.value === catId) insideSubcatId.value = 'all'
}

const renderInnerCatsTree = (parentId: string | null = null, depth = 0) => {
  if (!selectedKB.value) return []
  const cats = selectedKB.value.categories || []
  const children = cats.filter(c => c.parentId === parentId)

  return children.map(cat => {
    const isExpanded = !!expandedInnerCats.value[cat.id]
    const hasChildren = cats.some(c => c.parentId === cat.id)
    const isSelected = insideSubcatId.value === cat.id

    return {
      cat,
      isExpanded,
      hasChildren,
      isSelected,
      depth,
      children: hasChildren && isExpanded ? renderInnerCatsTree(cat.id, depth + 1) : []
    }
  })
}

const filteredFAQItems = computed(() => {
  if (!selectedKB.value) return []
  return selectedKB.value.faqs.filter(faq => {
    let matchCat = insideSubcatId.value === 'all'
    if (!matchCat) {
      const activeCatObj = selectedKB.value.categories?.find(c => c.id === insideSubcatId.value)
      matchCat = faq.category === insideSubcatId.value || (activeCatObj && faq.category === activeCatObj.name)
    }

    const matchSearch = insideSearch.value.trim() === '' ||
      faq.question.toLowerCase().includes(insideSearch.value.toLowerCase()) ||
      faq.answer.toLowerCase().includes(insideSearch.value.toLowerCase())
    return matchCat && matchSearch
  })
})

const handleToggleFAQStatus = (faqId: string) => {
  if (!selectedKB.value) return
  const perms = evalPermissions(selectedKB.value)
  if (!perms.canManage) return alert('❌ 无操作权限')

  const nextKBs = kbs.value.map(kb => {
    if (kb.id !== selectedKB.value!.id) return kb
    const nextFaqs = kb.faqs.map(item => {
      if (item.id === faqId) {
        const nextStatus = item.status === 'active' ? 'inactive' : 'active'
        triggerToast(`💡 状态调整为 ${nextStatus === 'active' ? '启用' : '禁用'}`)
        return { ...item, status: nextStatus as 'active' | 'inactive', updatedAt: new Date().toISOString() }
      }
      return item
    })
    return { ...kb, faqs: nextFaqs, updatedAt: new Date().toISOString() }
  })
  kbs.value = nextKBs
  saveFAQKBs(nextKBs)
}

const handleDeleteFAQ = (faqId: string) => {
  if (!selectedKB.value) return
  const perms = evalPermissions(selectedKB.value)
  if (!perms.canManage) return alert('❌ 无操作权限')
  if (!confirm('确定彻底删除该 FAQ 问题对吗？')) return

  const nextKBs = kbs.value.map(kb => {
    if (kb.id !== selectedKB.value!.id) return kb
    return { ...kb, faqs: kb.faqs.filter(item => item.id !== faqId), updatedAt: new Date().toISOString() }
  })
  kbs.value = nextKBs
  saveFAQKBs(nextKBs)
  triggerToast('🗑️ 已删除。')
}

const openFAQFormDialog = (faq: FAQItem | null) => {
  if (!selectedKB.value) return
  const perms = evalPermissions(selectedKB.value)
  if (!perms.canManage) return alert('❌ 权限拦截：无管理权限')

  if (faq) {
    editingFAQ.value = faq
    faqForm.value = {
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      status: faq.status
    }
  } else {
    editingFAQ.value = null
    faqForm.value = {
      question: '',
      answer: '',
      category: insideSubcatId.value !== 'all' ? insideSubcatId.value : (selectedKB.value.categories?.[0]?.id || 'default'),
      status: 'active'
    }
  }
  showFAQEditModal.value = true
}

const insertRichTextFormat = (token: string) => {
  const textarea = document.getElementById('faq-answer-textarea') as HTMLTextAreaElement
  if (!textarea) return

  if (token === 'image' || token === 'video' || token === 'file') {
    pendingFileType.value = token
    fileInputRef.value?.click()
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selectedText = text.substring(start, end)

  let wrap = ''
  switch(token) {
    case 'bold': wrap = `<strong>${selectedText || '加粗内容'}</strong>`; break
    case 'italic': wrap = `<em>${selectedText || '斜体内容'}</em>`; break
  }

  const newVal = text.substring(0, start) + wrap + text.substring(end)
  faqForm.value = { ...faqForm.value, answer: newVal }
  setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + wrap.length, start + wrap.length) }, 50)
}

const handleFilePicked = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  target.value = ''

  const fakeUrl = URL.createObjectURL(file)
  const textarea = document.getElementById('faq-answer-textarea') as HTMLTextAreaElement
  const start = textarea ? textarea.selectionStart : faqForm.value.answer.length
  const text = faqForm.value.answer

  let wrap = ''
  if (pendingFileType.value === 'image') {
    wrap = `<img src="${fakeUrl}" alt="${file.name}" class="max-w-xs rounded-md shadow-sm border border-slate-200 my-2" />`
  } else if (pendingFileType.value === 'video') {
    wrap = `<video controls class="max-w-sm rounded-md shadow my-2"><source src="${fakeUrl}" type="${file.type || 'video/mp4'}">不支持播放</video>`
  } else {
    wrap = `<a href="${fakeUrl}" download="${file.name}" class="text-blue-600 underline flex items-center gap-1 my-1">附件：${file.name}（${(file.size/1024).toFixed(1)}KB）</a>`
  }

  const newVal = text.substring(0, start) + wrap + text.substring(start)
  faqForm.value = { ...faqForm.value, answer: newVal }
  if (textarea) {
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + wrap.length, start + wrap.length) }, 50)
  }
  pendingFileType.value = null
}

const handleSaveFAQItem = () => {
  if (!faqForm.value.question.trim() || !faqForm.value.answer.trim()) return alert('问题与答案不可为空')

  const nowStr = new Date().toISOString()
  const nextKBs = kbs.value.map(kb => {
    if (kb.id !== selectedKBId.value) return kb
    let nextFaqs = [...kb.faqs]
    if (editingFAQ.value) {
      nextFaqs = nextFaqs.map(item => item.id === editingFAQ.value!.id ? {
        ...item, question: faqForm.value.question.trim(), answer: faqForm.value.answer.trim(), category: faqForm.value.category, status: faqForm.value.status, updatedAt: nowStr
      } : item)
    } else {
      nextFaqs = [{
        id: `faq-manual-${Date.now()}`, category: faqForm.value.category, question: faqForm.value.question.trim(),
        answer: faqForm.value.answer.trim(), creator: activeUser.value.name, createdAt: nowStr, updatedAt: nowStr, status: faqForm.value.status
      }, ...nextFaqs]
    }
    return { ...kb, faqs: nextFaqs, updatedAt: nowStr }
  })
  kbs.value = nextKBs
  saveFAQKBs(nextKBs)
  showFAQEditModal.value = false
  triggerToast('✨ FAQ 保存成功')
}

const getSelectedPerms = (cat: 'manage' | 'accessQuery' | 'accessDownload', type: 'Depts' | 'Positions' | 'UserGroups') => {
  if (!selectedKB.value) return []
  const p = selectedKB.value.permissions || getDefaultPermissions()
  const key = `${cat}${type}` as keyof KBPermissions
  return (p[key] as string[]) || []
}

const handleToggleKBPermission = (
  category: 'manage' | 'accessQuery' | 'accessDownload',
  type: 'Depts' | 'Positions' | 'UserGroups',
  id: string
) => {
  if (!selectedKB.value) return
  if (activeUser.value.role === 'viewer') return alert('🔒 只读权限拒绝设置')

  const nextKBs = kbs.value.map(kb => {
    if (kb.id !== selectedKB.value!.id) return kb
    const p = kb.permissions || getDefaultPermissions()
    const key = `${category}${type}` as keyof KBPermissions
    const listing = (p[key] as string[]) || []
    const updatedList = listing.includes(id) ? listing.filter(v => v !== id) : [...listing, id]
    return { ...kb, permissions: { ...p, [key]: updatedList } }
  })
  kbs.value = nextKBs
  saveFAQKBs(nextKBs)
}

const handleFileSelected = (file: File) => {
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  const approved = ['.docx', '.pdf', '.xlsx', '.xls']
  if (!approved.includes(ext)) return alert('仅限于 Word(.docx), PDF(.pdf), Excel(.xlsx) 文件')
  importedFile.value = { name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', extension: ext }
  startExtractionSimulation(file.name, ext)
}

const startExtractionSimulation = (fileName: string, ext: string) => {
  importStep.value = 2
  parsingLogs.value = []
  const logs = [
    `[解析接入] 读取文件：${fileName}...`,
    `[底座引擎] 格式化通过 [${ext.toUpperCase()}]，探测字符。`,
    `[中台模型] 启动 Q&A 意图解析 (Gemini UI)...`,
    `[结构化] 识别多维对抗话术，剥离无用标签...`,
    `[校验评估] 自动映射业务分类，生成待审定草案`
  ]
  let cursor = 0
  const interval = setInterval(() => {
    if (cursor < logs.length) {
      parsingLogs.value = [...parsingLogs.value, logs[cursor]]
      cursor++
    } else {
      clearInterval(interval)
      extractedFaqs.value = [
        { question: '业务问题A如何处理？', answer: '解答指引<strong>加粗点</strong>...', category: insideSubcatId.value !== 'all' ? insideSubcatId.value : 'default', selected: true },
        { question: '特殊故障现象排除', answer: '请核对环境参数重试。', category: insideSubcatId.value !== 'all' ? insideSubcatId.value : 'default', selected: true }
      ]
      importStep.value = 3
    }
  }, 400)
}

const handleCommitAIImport = () => {
  const activeToImport = extractedFaqs.value.filter(e => e.selected)
  if (activeToImport.length === 0) return alert('请勾选有效条目')
  const dateStr = new Date().toISOString()
  const items: FAQItem[] = activeToImport.map((x, i) => ({
    id: `faq-imported-${Date.now()}-${i}`,
    category: x.category,
    question: x.question,
    answer: x.answer,
    creator: '智能AI提取',
    createdAt: dateStr, updatedAt: dateStr,
    status: 'active'
  }))
  const nextKBs = kbs.value.map(kb => kb.id === selectedKBId.value ? { ...kb, faqs: [...items, ...kb.faqs], updatedAt: dateStr } : kb)
  kbs.value = nextKBs
  saveFAQKBs(nextKBs)
  importStep.value = 4
  triggerToast(`📥 成功提取并入库 ${items.length} 个标准问答对！`)
}

const renderDomainTreeNodes = (nodes: any[], depth = 0) => {
  return nodes.map(node => {
    const isExpanded = !!expandedDomains.value[node.id]
    const hasChildren = node.children && node.children.length > 0
    const isSelected = selectedDomain.value === node.id
    const totalCount = kbs.value.filter(k => isDomainMatch(k.domain, node.id)).length

    return {
      node,
      isExpanded,
      hasChildren,
      isSelected,
      totalCount,
      depth,
      children: hasChildren && isExpanded ? renderDomainTreeNodes(node.children, depth + 1) : []
    }
  })
}

const toggleExpandedDomains = (nodeId: string) => {
  expandedDomains.value = { ...expandedDomains.value, [nodeId]: !expandedDomains.value[nodeId] }
}

const toggleExpandedInnerCats = (catId: string) => {
  expandedInnerCats.value = { ...expandedInnerCats.value, [catId]: !expandedInnerCats.value[catId] }
}

const toggleExtractedFaq = (index: number) => {
  const copy = [...extractedFaqs.value]
  copy[index].selected = !copy[index].selected
  extractedFaqs.value = copy
}

const updateExtractedFaqQuestion = (index: number, value: string) => {
  const copy = [...extractedFaqs.value]
  copy[index].question = value
  extractedFaqs.value = copy
}

const updateExtractedFaqAnswer = (index: number, value: string) => {
  const copy = [...extractedFaqs.value]
  copy[index].answer = value
  extractedFaqs.value = copy
}
</script>

<template>
  <div class="p-6 max-w-[1600px] mx-auto space-y-6 font-sans select-none">
    <div v-if="customToast" class="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 shadow-2xl flex items-center gap-2.5 animate-slide-in text-xs max-w-sm">
      <Info class="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{{ customToast }}</span>
    </div>

    <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-between">
      <div class="absolute top-0 right-0 w-64 h-64 bg-slate-700/10 rounded-full shrink-0 -mr-12 -mt-12 pointer-events-none" />
      <div class="space-y-1.5 z-10 max-w-2xl">
        <div class="flex items-center gap-2">
          <span class="bg-blue-500 text-white font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded">ROUTER BYPASS</span>
          <span class="text-slate-400 text-xs font-mono">FAQ 意图拦截保障系统</span>
        </div>
        <h1 class="text-2xl font-black flex items-center gap-2.5">
          <ShieldCheck class="w-7 h-7 text-emerald-400" />智能 FAQ 集中知识库
        </h1>
        <p class="text-xs text-slate-300">
          支持基于树形多层级组织结构对高频 Q&A 进行隔离归范。一旦对话中台检索匹配到此标准答案，系统直接强制输出（Bypass API），阻断并根除大语言模型幻觉。FAQ 库亦共享文档库权限鉴管理念。
        </p>
      </div>
    </div>

    <div v-if="!selectedKBId" class="space-y-6">
      <div class="bg-white/70 p-4 rounded-xl border border-slate-200">
        <div class="relative w-full max-w-sm">
          <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="搜索拥有访问权的 FAQ 知识库..."
            class="pl-9 h-9 text-xs"
            v-model="searchTerm"
          />
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <div class="w-full lg:w-64 bg-white border border-slate-200 rounded-xl p-4 space-y-4 max-h-[800px] overflow-y-auto">
          <div class="space-y-3">
            <div
              :class="[
                'flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-black cursor-pointer transition-all',
                selectedDomain === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-700'
              ]"
              @click="selectedDomain = 'all'; selectedKBId = null"
            >
              <Layers class="w-3.5 h-3.5" /><span>全部分类</span>
            </div>
            <div class="space-y-1">
              <template v-for="item in renderDomainTreeNodes(getDomains())" :key="item.node.id">
                <div
                  :style="{ paddingLeft: `${item.depth * 10 + 6}px` }"
                  :class="[
                    'flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-all',
                    item.isSelected ? 'bg-blue-50 text-blue-700 font-extrabold' : 'hover:bg-slate-50 text-slate-600'
                  ]"
                  @click="selectedDomain = item.node.id; selectedKBId = null"
                >
                  <button
                    v-if="item.hasChildren"
                    @click.stop="toggleExpandedDomains(item.node.id)"
                    class="p-1 hover:bg-slate-200 rounded text-slate-400"
                  >
                    <ChevronDown v-if="item.isExpanded" class="w-3.5 h-3.5" />
                    <ChevronRight v-else class="w-3.5 h-3.5" />
                  </button>
                  <span v-else class="w-5 h-5" />
                  <FolderTree :class="[
                    'w-3.5 h-3.5 shrink-0',
                    item.isSelected ? 'text-blue-600' : 'text-slate-400'
                  ]" />
                  <span class="truncate flex-1">{{ item.node.label }}</span>
                  <span v-if="item.totalCount > 0" class="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded-full">{{ item.totalCount }}</span>
                </div>
                <div v-if="item.children.length > 0" class="space-y-0.5 relative before:absolute before:left-[14px] before:top-1 before:bottom-1 before:w-[1.2px] before:bg-slate-100">
                  <template v-for="child in item.children" :key="child.node.id">
                    <div
                      :style="{ paddingLeft: `${child.depth * 10 + 6}px` }"
                      :class="[
                        'flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-all',
                        child.isSelected ? 'bg-blue-50 text-blue-700 font-extrabold' : 'hover:bg-slate-50 text-slate-600'
                      ]"
                      @click="selectedDomain = child.node.id; selectedKBId = null"
                    >
                      <button
                        v-if="child.hasChildren"
                        @click.stop="toggleExpandedDomains(child.node.id)"
                        class="p-1 hover:bg-slate-200 rounded text-slate-400"
                      >
                        <ChevronDown v-if="child.isExpanded" class="w-3.5 h-3.5" />
                        <ChevronRight v-else class="w-3.5 h-3.5" />
                      </button>
                      <span v-else class="w-5 h-5" />
                      <FolderTree :class="[
                        'w-3.5 h-3.5 shrink-0',
                        child.isSelected ? 'text-blue-600' : 'text-slate-400'
                      ]" />
                      <span class="truncate flex-1">{{ child.node.label }}</span>
                      <span v-if="child.totalCount > 0" class="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded-full">{{ child.totalCount }}</span>
                    </div>
                    <template v-if="child.children.length > 0">
                      <div v-for="deepChild in child.children" :key="deepChild.node.id"
                        :style="{ paddingLeft: `${deepChild.depth * 10 + 6}px` }"
                        :class="[
                          'flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-all',
                          deepChild.isSelected ? 'bg-blue-50 text-blue-700 font-extrabold' : 'hover:bg-slate-50 text-slate-600'
                        ]"
                        @click="selectedDomain = deepChild.node.id; selectedKBId = null"
                      >
                        <span class="w-5 h-5" />
                        <FolderTree :class="[
                          'w-3.5 h-3.5 shrink-0',
                          deepChild.isSelected ? 'text-blue-600' : 'text-slate-400'
                        ]" />
                        <span class="truncate flex-1">{{ deepChild.node.label }}</span>
                        <span v-if="deepChild.totalCount > 0" class="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded-full">{{ deepChild.totalCount }}</span>
                      </div>
                    </template>
                  </template>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div class="flex-1 space-y-4">
          <div class="flex justify-between items-center border-b border-slate-200 pb-2">
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              知识库清单 <span class="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-mono">{{ kbs.filter(k => isDomainMatch(k.domain, selectedDomain)).length }} 库</span>
            </h2>
            <Button @click="showCreateKBModal = true" size="sm" class="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs h-7 px-3">
              <Plus class="w-3.5 h-3.5 mr-1" /> 新建FAQ知识库
            </Button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              v-for="kb in kbs.filter(k => isDomainMatch(k.domain, selectedDomain) && k.title.toLowerCase().includes(searchTerm.toLowerCase()))"
              :key="kb.id"
              class="flex flex-col h-[280px] bg-white hover:border-blue-400 hover:shadow-md cursor-pointer transition-all rounded-xl overflow-hidden p-4 group"
              @click="selectedKBId = kb.id"
            >
              <div class="flex items-start justify-between">
                <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-extrabold">FAQ知识库</span>
                <button @click.stop="handleDeleteKB(kb.id, kb.title)" class="p-1 text-slate-400 hover:text-rose-600"><Trash2 class="w-4 h-4"/></button>
              </div>
              <div class="flex-1 mt-3 space-y-2">
                <h3 class="font-extrabold text-slate-800 line-clamp-2 text-sm">{{ kb.title }}</h3>
                <p class="text-[11px] text-slate-400 line-clamp-2">{{ kb.description }}</p>
              </div>
              <div class="mt-auto border-t border-slate-100 pt-3">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500 flex items-center gap-1"><BookOpen class="w-3.5 h-3.5"/> {{ kb.faqs.length }} 问答点</span>
                  <span class="text-blue-600 font-bold group-hover:underline">管理配置 &rarr;</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[700px]">
      <div class="p-6 border-b border-slate-150 bg-slate-50/60 relative">
        <Button @click="selectedKBId = null" variant="outline" size="sm" class="mb-4 h-8 text-xs border-slate-200 bg-white">
          <Undo2 class="w-3.5 h-3.5 mr-1 text-slate-500" /> 返回上一级主页
        </Button>
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Database class="w-6 h-6 text-blue-500"/> {{ selectedKB?.title }}
            </h2>
            <p class="text-sm text-slate-500 mt-2">{{ selectedKB?.description }}</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-6 px-6 border-b border-slate-200 pt-2 bg-white">
        <button
          @click="activeTab = 'faq'"
          :class="[
            'pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all',
            activeTab === 'faq' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <FileText class="w-4 h-4"/> FAQ数据管理
        </button>
        <button
          @click="activeTab = 'permissions'"
          :class="[
            'pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all',
            activeTab === 'permissions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <Shield class="w-4 h-4"/> 权限与授权设置
        </button>
      </div>

      <div v-if="activeTab === 'faq'" class="flex flex-1 overflow-hidden">
        <div class="w-64 border-r border-slate-200 bg-slate-50/30 flex flex-col">
          <div class="p-4 border-b border-slate-200 flex items-center justify-between">
            <span class="text-xs font-bold text-slate-600">问答子分类</span>
            <button @click="newInnerCatParent = null; showAddInnerCatModal = true" class="p-1 hover:bg-white border border-slate-200 rounded shrink-0 shadow-sm text-slate-500 hover:text-blue-600" title="新建根分类">
              <Plus class="w-3.5 h-3.5"/>
            </button>
          </div>
          <div class="p-3 flex-1 overflow-y-auto space-y-1">
            <div
              :class="[
                'flex items-center gap-2 py-2 px-3 rounded-md text-xs cursor-pointer font-bold',
                insideSubcatId === 'all' ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100 text-slate-700'
              ]"
              @click="insideSubcatId = 'all'"
            >
              <Layers class="w-4 h-4"/> <span>全部问题</span>
            </div>
            <template v-for="item in renderInnerCatsTree()" :key="item.cat.id">
              <div
                :style="{ paddingLeft: `${item.depth * 12 + 8}px` }"
                :class="[
                  'group flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-all',
                  item.isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                ]"
                @click="insideSubcatId = item.cat.id"
              >
                <button
                  v-if="item.hasChildren"
                  @click.stop="toggleExpandedInnerCats(item.cat.id)"
                  class="p-1 hover:bg-slate-200 rounded text-slate-400"
                >
                  <ChevronDown v-if="item.isExpanded" class="w-3.5 h-3.5" />
                  <ChevronRight v-else class="w-3.5 h-3.5" />
                </button>
                <span v-else class="w-5 h-5 pointer-events-none" />

                <FolderTree :class="[
                  'w-3.5 h-3.5 shrink-0',
                  item.isSelected ? 'text-blue-600' : 'text-slate-400'
                ]" />
                <span class="truncate flex-1">{{ item.cat.name }}</span>

                <div class="hidden group-hover:flex items-center gap-1">
                  <button
                    @click.stop="newInnerCatParent = item.cat.id; showAddInnerCatModal = true"
                    class="p-1 text-slate-400 hover:text-blue-600" title="添加子分类"
                  >
                    <Plus class="w-3 h-3" />
                  </button>
                  <button
                    @click.stop="handleDeleteInnerCat(item.cat.id)"
                    class="p-1 text-slate-400 hover:text-rose-600" title="删除分类"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div v-if="item.children.length > 0" class="space-y-0.5">
                <template v-for="child in item.children" :key="child.cat.id">
                  <div
                    :style="{ paddingLeft: `${child.depth * 12 + 8}px` }"
                    :class="[
                      'group flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-all',
                      child.isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                    ]"
                    @click="insideSubcatId = child.cat.id"
                  >
                    <button
                      v-if="child.hasChildren"
                      @click.stop="toggleExpandedInnerCats(child.cat.id)"
                      class="p-1 hover:bg-slate-200 rounded text-slate-400"
                    >
                      <ChevronDown v-if="child.isExpanded" class="w-3.5 h-3.5" />
                      <ChevronRight v-else class="w-3.5 h-3.5" />
                    </button>
                    <span v-else class="w-5 h-5 pointer-events-none" />
                    <FolderTree :class="[
                      'w-3.5 h-3.5 shrink-0',
                      child.isSelected ? 'text-blue-600' : 'text-slate-400'
                    ]" />
                    <span class="truncate flex-1">{{ child.cat.name }}</span>
                    <div class="hidden group-hover:flex items-center gap-1">
                      <button
                        @click.stop="newInnerCatParent = child.cat.id; showAddInnerCatModal = true"
                        class="p-1 text-slate-400 hover:text-blue-600" title="添加子分类"
                      >
                        <Plus class="w-3 h-3" />
                      </button>
                      <button
                        @click.stop="handleDeleteInnerCat(child.cat.id)"
                        class="p-1 text-slate-400 hover:text-rose-600" title="删除分类"
                      >
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <template v-if="child.children.length > 0">
                    <div v-for="deepChild in child.children" :key="deepChild.cat.id"
                      :style="{ paddingLeft: `${deepChild.depth * 12 + 8}px` }"
                      :class="[
                        'group flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-all',
                        deepChild.isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                      ]"
                      @click="insideSubcatId = deepChild.cat.id"
                    >
                      <span class="w-5 h-5 pointer-events-none" />
                      <FolderTree :class="[
                        'w-3.5 h-3.5 shrink-0',
                        deepChild.isSelected ? 'text-blue-600' : 'text-slate-400'
                      ]" />
                      <span class="truncate flex-1">{{ deepChild.cat.name }}</span>
                      <div class="hidden group-hover:flex items-center gap-1">
                        <button
                          @click.stop="newInnerCatParent = deepChild.cat.id; showAddInnerCatModal = true"
                          class="p-1 text-slate-400 hover:text-blue-600" title="添加子分类"
                        >
                          <Plus class="w-3 h-3" />
                        </button>
                        <button
                          @click.stop="handleDeleteInnerCat(deepChild.cat.id)"
                          class="p-1 text-slate-400 hover:text-rose-600" title="删除分类"
                        >
                          <Trash2 class="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </template>
                </template>
              </div>
            </template>
          </div>
        </div>

        <div class="flex-1 flex flex-col">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div class="relative flex-1 max-w-sm">
              <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="检索当前知识库下关联的条目..." v-model="insideSearch" class="pl-9 h-9 text-xs border-slate-200"/>
            </div>
            <div class="flex items-center gap-2">
              <Button class="h-9 text-xs bg-slate-800" @click="showFAQImportModal = true">
                <Sparkles class="w-3.5 h-3.5 mr-1" /> 批量导入文档解析
              </Button>
              <Button class="h-9 text-xs bg-blue-600 hover:bg-blue-700" @click="openFAQFormDialog(null)">
                <Plus class="w-3.5 h-3.5 mr-1" /> 录入单项问题
              </Button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 bg-slate-50/50">
            <div v-if="filteredFAQItems.length === 0" class="text-center py-20 text-slate-400 text-sm flex flex-col items-center">
              <FileText class="w-10 h-10 mb-2 opacity-50"/>
              暂无相关 FAQ 数据或未命中关键词
            </div>
            <div v-else class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
                  <tr>
                    <th class="px-4 py-3 min-w-[200px]">标准问题及答案预览</th>
                    <th class="px-4 py-3 min-w-[120px]">业务分类</th>
                    <th class="px-4 py-3 min-w-[100px] text-right">操作编辑</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="faq in filteredFAQItems" :key="faq.id" class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3">
                      <p class="font-bold text-slate-800 text-xs truncate max-w-[300px]" :title="faq.question">{{ faq.question }}</p>
                      <p class="text-[10px] text-slate-400 mt-1 truncate max-w-[300px]" :title="faq.answer.replace(/<[^>]*>?/gm, '')">{{ faq.answer.replace(/<[^>]*>?/gm, '') }}</p>
                    </td>
                    <td class="px-4 py-3">
                      <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] border border-slate-200 font-semibold">{{ selectedKB?.categories?.find(c => c.id === faq.category)?.name || faq.category }}</span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <Button @click="viewingFAQ = faq" variant="ghost" size="sm" class="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50">
                          <Eye class="w-4 h-4"/>
                        </Button>
                        <Button @click="openFAQFormDialog(faq)" variant="ghost" size="sm" class="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50">
                          <Edit class="w-4 h-4"/>
                        </Button>
                        <Button @click="handleDeleteFAQ(faq.id)" variant="ghost" size="sm" class="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50">
                          <Trash2 class="w-4 h-4"/>
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'permissions'" class="p-6 md:p-8 space-y-8 bg-slate-50/50 flex-1">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col relative overflow-hidden">
            <div class="p-4 border-b border-slate-100 bg-blue-50/30 flex justify-between items-start">
              <div>
                <h3 class="font-extrabold text-blue-800 text-sm flex items-center gap-2"><ShieldCheck class="w-4 h-4 text-blue-600"/> 拥有管理与上传配置权</h3>
                <p class="text-[10px] text-slate-500 mt-1">允许修改 FAQ 的内容结构与状态。</p>
              </div>
              <Button
                @click="activePermCategory = 'manage'; showPermPickerModal = true"
                class="h-7 text-xs px-2 bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                + 添加白名单
              </Button>
            </div>
            <div class="p-4 flex-1 overflow-y-auto space-y-4 text-xs bg-white">
              <div>
                <div class="text-slate-400 font-bold mb-2 uppercase text-[10px]">授权部门</div>
                <div class="flex flex-wrap gap-2">
                  <span v-for="id in getSelectedPerms('manage', 'Depts')" :key="id" class="bg-slate-100 border px-2 py-1 inline-flex items-center gap-1 rounded">
                    {{ getDepartments().find(d => d.id === id)?.name }}
                    <X @click="handleToggleKBPermission('manage', 'Depts', id)" class="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500"/>
                  </span>
                </div>
              </div>
              <div>
                <div class="text-slate-400 font-bold mb-2 uppercase text-[10px]">授权岗位</div>
                <div class="flex flex-wrap gap-2">
                  <span v-for="id in getSelectedPerms('manage', 'Positions')" :key="id" class="bg-slate-100 border px-2 py-1 inline-flex items-center gap-1 rounded">
                    {{ getPositions().find(d => d.id === id)?.title }}
                    <X @click="handleToggleKBPermission('manage', 'Positions', id)" class="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500"/>
                  </span>
                </div>
              </div>
              <div>
                <div class="text-slate-400 font-bold mb-2 uppercase text-[10px]">用户组</div>
                <div class="flex flex-wrap gap-2">
                  <span v-for="id in getSelectedPerms('manage', 'UserGroups')" :key="id" class="bg-slate-100 border px-2 py-1 inline-flex items-center gap-1 rounded">
                    {{ getUserGroups().find(d => d.id === id)?.name }}
                    <X @click="handleToggleKBPermission('manage', 'UserGroups', id)" class="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500"/>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col relative overflow-hidden">
            <div class="p-4 border-b border-slate-100 bg-emerald-50/30 flex justify-between items-start">
              <div>
                <h3 class="font-extrabold text-emerald-800 text-sm flex items-center gap-2"><Eye class="w-4 h-4 text-emerald-600"/> 允许智能问答与检索</h3>
                <p class="text-[10px] text-slate-500 mt-1">在 AI 会话中可命中并匹配这里的问答。</p>
              </div>
              <Button
                @click="activePermCategory = 'accessQuery'; showPermPickerModal = true"
                class="h-7 text-xs px-2 bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                + 添加白名单
              </Button>
            </div>
            <div class="p-4 flex-1 overflow-y-auto space-y-4 text-xs bg-white">
              <div>
                <div class="text-slate-400 font-bold mb-2 uppercase text-[10px]">授权部门</div>
                <div class="flex flex-wrap gap-2">
                  <span v-for="id in getSelectedPerms('accessQuery', 'Depts')" :key="id" class="bg-slate-100 border px-2 py-1 inline-flex items-center gap-1 rounded">
                    {{ getDepartments().find(d => d.id === id)?.name }}
                    <X @click="handleToggleKBPermission('accessQuery', 'Depts', id)" class="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500"/>
                  </span>
                </div>
              </div>
              <div>
                <div class="text-slate-400 font-bold mb-2 uppercase text-[10px]">授权岗位</div>
                <div class="flex flex-wrap gap-2">
                  <span v-for="id in getSelectedPerms('accessQuery', 'Positions')" :key="id" class="bg-slate-100 border px-2 py-1 inline-flex items-center gap-1 rounded">
                    {{ getPositions().find(d => d.id === id)?.title }}
                    <X @click="handleToggleKBPermission('accessQuery', 'Positions', id)" class="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500"/>
                  </span>
                </div>
              </div>
              <div>
                <div class="text-slate-400 font-bold mb-2 uppercase text-[10px]">用户组</div>
                <div class="flex flex-wrap gap-2">
                  <span v-for="id in getSelectedPerms('accessQuery', 'UserGroups')" :key="id" class="bg-slate-100 border px-2 py-1 inline-flex items-center gap-1 rounded">
                    {{ getUserGroups().find(d => d.id === id)?.name }}
                    <X @click="handleToggleKBPermission('accessQuery', 'UserGroups', id)" class="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500"/>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col relative overflow-hidden">
            <div class="p-4 border-b border-slate-100 bg-amber-50/30 flex justify-between items-start">
              <div>
                <h3 class="font-extrabold text-amber-800 text-sm flex items-center gap-2"><UploadCloud class="w-4 h-4 text-amber-600"/> 允许原文件下载导出</h3>
                <p class="text-[10px] text-slate-500 mt-1">允许导出 FAQ Excel 配置包。</p>
              </div>
              <Button
                @click="activePermCategory = 'accessDownload'; showPermPickerModal = true"
                class="h-7 text-xs px-2 bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-700"
              >
                + 添加白名单
              </Button>
            </div>
            <div class="p-4 flex-1 overflow-y-auto space-y-4 text-xs bg-white">
              <div>
                <div class="text-slate-400 font-bold mb-2 uppercase text-[10px]">授权部门</div>
                <div class="flex flex-wrap gap-2">
                  <span v-for="id in getSelectedPerms('accessDownload', 'Depts')" :key="id" class="bg-slate-100 border px-2 py-1 inline-flex items-center gap-1 rounded">
                    {{ getDepartments().find(d => d.id === id)?.name }}
                    <X @click="handleToggleKBPermission('accessDownload', 'Depts', id)" class="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500"/>
                  </span>
                </div>
              </div>
              <div>
                <div class="text-slate-400 font-bold mb-2 uppercase text-[10px]">授权岗位</div>
                <div class="flex flex-wrap gap-2">
                  <span v-for="id in getSelectedPerms('accessDownload', 'Positions')" :key="id" class="bg-slate-100 border px-2 py-1 inline-flex items-center gap-1 rounded">
                    {{ getPositions().find(d => d.id === id)?.title }}
                    <X @click="handleToggleKBPermission('accessDownload', 'Positions', id)" class="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500"/>
                  </span>
                </div>
              </div>
              <div>
                <div class="text-slate-400 font-bold mb-2 uppercase text-[10px]">用户组</div>
                <div class="flex flex-wrap gap-2">
                  <span v-for="id in getSelectedPerms('accessDownload', 'UserGroups')" :key="id" class="bg-slate-100 border px-2 py-1 inline-flex items-center gap-1 rounded">
                    {{ getUserGroups().find(d => d.id === id)?.name }}
                    <X @click="handleToggleKBPermission('accessDownload', 'UserGroups', id)" class="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500"/>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

      <div v-if="showCreateKBModal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" @click="showCreateKBModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200" @click.stop>
          <div class="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 class="font-black text-slate-800 text-lg flex items-center gap-2"><Database class="w-5 h-5 text-blue-500"/> 创建新 FAQ 知识库</h3>
            <button @click="showCreateKBModal = false" class="text-slate-400 hover:bg-slate-100 p-1.5 rounded-full"><X class="w-5 h-5"/></button>
          </div>
          <form @submit.prevent="handleCreateKB" class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">知识库名称 *</label>
              <Input required placeholder="如：人资差旅FAQ2025版" class="text-sm h-10" v-model="newKBTitle" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">归属业务域 *</label>
              <select v-model="newKBDomain" class="w-full h-10 border border-slate-200 rounded-md text-sm px-3 focus:outline-blue-500">
                <option v-for="d in getFlatDomains().filter(d => !!d.parentId)" :key="d.id" :value="d.id">{{ d.path }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">描述与管控备注</label>
              <Input placeholder="输入该FAQ库的安全边界要求..." class="text-sm h-10" v-model="newKBDesc" />
            </div>
            <div class="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" @click="showCreateKBModal = false">取消</Button>
              <Button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white">立项创建库</Button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showAddInnerCatModal" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" @click="showAddInnerCatModal = false">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm" @click.stop>
          <div class="p-4 border-b flex items-center justify-between">
            <h3 class="font-bold text-sm text-slate-800">新建分类节点</h3>
            <button @click="showAddInnerCatModal = false"><X class="w-4 h-4 text-slate-400"/></button>
          </div>
          <form @submit.prevent="handleCreateInnerCat" class="p-5 space-y-4">
            <div>
              <label class="block text-xs text-slate-500 mb-1">上级节点</label>
              <div class="text-sm px-3 py-2 bg-slate-50 border border-slate-100 rounded text-slate-700">
                {{ newInnerCatParent ? selectedKB?.categories?.find(c => c.id === newInnerCatParent)?.name : '作为根分类' }}
              </div>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">分类名称</label>
              <Input autoFocus required v-model="newInnerCatName" class="h-9 text-sm" placeholder="如：报销规范"/>
            </div>
            <Button type="submit" class="w-full bg-blue-600 text-white h-9">确定保存</Button>
          </form>
        </div>
      </div>

      <div v-if="showFAQEditModal" class="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" @click="showFAQEditModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" @click.stop>
          <div class="bg-slate-50 border-b border-slate-200 p-5 flex justify-between items-center sticky top-0 z-10">
            <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
              <Edit class="w-5 h-5 text-blue-600"/> {{ editingFAQ ? '编辑 FAQ 问题卡片' : '新增标准问题 (Q&A)' }}
            </h2>
            <button @click="showFAQEditModal = false" class="text-slate-500 hover:text-slate-800"><X class="w-5 h-5"/></button>
          </div>
          
          <form @submit.prevent="handleSaveFAQItem" class="p-6 space-y-6">
            <input type="file" ref="fileInputRef" class="hidden" @change="handleFilePicked" />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">标准问题</label>
                <textarea
                  required
                  class="w-full h-24 text-sm border-slate-200 border rounded-lg p-3 focus:outline-blue-500 resize-none bg-slate-50/50"
                  placeholder="标准疑问句。如：如何申请年鉴补签休假..."
                  v-model="faqForm.question"
                />
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-bold text-slate-700 mb-2">归属细分业务</label>
                  <select
                    class="w-full h-10 border border-slate-200 rounded-md bg-slate-50 text-sm px-3 focus:outline-blue-500"
                    v-model="faqForm.category"
                  >
                    <option v-for="c in selectedKB?.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-slate-700 flex items-center gap-2"><MessageSquare class="w-4 h-4"/> 标准话术解答 (Rich Response)</label>
                <div class="flex items-center bg-slate-100 rounded-md border border-slate-200 p-1 gap-1">
                  <button type="button" @click="insertRichTextFormat('bold')" class="p-1.5 hover:bg-white rounded text-slate-600"><Bold class="w-3.5 h-3.5"/></button>
                  <button type="button" @click="insertRichTextFormat('italic')" class="p-1.5 hover:bg-white rounded text-slate-600"><Italic class="w-3.5 h-3.5"/></button>
                  <div class="w-px h-4 bg-slate-300 mx-1"></div>
                  <button type="button" @click="insertRichTextFormat('image')" class="p-1.5 hover:bg-white rounded text-slate-600 flex items-center gap-1 text-[10px]"><ImageIcon class="w-3.5 h-3.5"/>插图</button>
                  <button type="button" @click="insertRichTextFormat('video')" class="p-1.5 hover:bg-white rounded text-slate-600 flex items-center gap-1 text-[10px]"><Video class="w-3.5 h-3.5"/>视频</button>
                  <button type="button" @click="insertRichTextFormat('file')" class="p-1.5 hover:bg-white rounded text-slate-600 flex items-center gap-1 text-[10px]"><Paperclip class="w-3.5 h-3.5"/>附件</button>
                </div>
              </div>
              <textarea
                id="faq-answer-textarea"
                required
                class="w-full h-48 sm:h-64 text-sm border-slate-200 border rounded-lg p-3 font-mono focus:outline-blue-500 resize-none shadow-inner"
                placeholder="支持直接在此书写 HTML 富文本标记。如需插入图片点击上方工具..."
                v-model="faqForm.answer"
              />
            </div>

            <div class="pt-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
              <Button type="button" variant="outline" class="px-6" @click="showFAQEditModal = false">取消</Button>
              <Button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-8"><Save class="w-4 h-4 mr-2"/> 保存</Button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showPermPickerModal" class="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" @click="showPermPickerModal = false">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col min-h-[500px] max-h-[90vh]" @click.stop>
          <div class="p-5 border-b flex justify-between items-center shrink-0">
            <h3 class="font-bold text-slate-800 text-base">选定并分配权限目标</h3>
            <button @click="showPermPickerModal = false"><X class="w-5 h-5 text-slate-400"/></button>
          </div>
          
          <div class="flex border-b border-slate-100 shrink-0">
            <button @click="activePermType = 'Depts'" :class="['flex-1 py-3 text-xs font-bold transition-colors', activePermType === 'Depts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50']">组织部门</button>
            <button @click="activePermType = 'Positions'" :class="['flex-1 py-3 text-xs font-bold transition-colors', activePermType === 'Positions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50']">特定岗位</button>
            <button @click="activePermType = 'UserGroups'" :class="['flex-1 py-3 text-xs font-bold transition-colors', activePermType === 'UserGroups' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50']">特定用户组</button>
          </div>

          <div class="p-3 border-b border-slate-100 shrink-0 bg-slate-50">
            <div class="relative">
              <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                :placeholder="`搜索${activePermType === 'Depts' ? '组织部门' : activePermType === 'Positions' ? '特定岗位' : '特定用户组'}...`"
                class="pl-9 h-9 text-xs border-slate-200 bg-white"
                v-model="permSearchKeyword"
              />
            </div>
          </div>

          <div class="p-4 flex-1 overflow-y-auto bg-slate-50/50">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                v-for="d in getDepartments().filter(d => d.name.toLowerCase().includes(permSearchKeyword.toLowerCase()))"
                :key="d.id"
                @click="handleToggleKBPermission(activePermCategory, 'Depts', d.id)"
                :class="['text-left px-3 py-2 border rounded-lg text-xs font-medium transition-all', getSelectedPerms(activePermCategory, 'Depts').includes(d.id) ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300']"
                v-show="activePermType === 'Depts'"
              >{{ d.name }}</button>
              <button
                v-for="d in getPositions().filter(d => d.title.toLowerCase().includes(permSearchKeyword.toLowerCase()))"
                :key="d.id"
                @click="handleToggleKBPermission(activePermCategory, 'Positions', d.id)"
                :class="['text-left px-3 py-2 border rounded-lg text-xs font-medium transition-all', getSelectedPerms(activePermCategory, 'Positions').includes(d.id) ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300']"
                v-show="activePermType === 'Positions'"
              >{{ d.title }}</button>
              <button
                v-for="d in getUserGroups().filter(d => d.name.toLowerCase().includes(permSearchKeyword.toLowerCase()))"
                :key="d.id"
                @click="handleToggleKBPermission(activePermCategory, 'UserGroups', d.id)"
                :class="['text-left px-3 py-2 border rounded-lg text-xs font-medium transition-all', getSelectedPerms(activePermCategory, 'UserGroups').includes(d.id) ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300']"
                v-show="activePermType === 'UserGroups'"
              >{{ d.name }}</button>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t flex justify-end shrink-0">
            <Button class="bg-slate-800 px-6 text-white text-xs h-9" @click="showPermPickerModal = false">确认关闭</Button>
          </div>
        </div>
      </div>

      <div v-if="viewingFAQ" class="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 text-left" @click="viewingFAQ = null">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" @click.stop>
          <div class="bg-slate-50 border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
            <h2 class="text-lg font-black flex items-center gap-2 text-slate-800"><Eye class="w-5 h-5 text-amber-500"/> 查看 FAQ</h2>
            <button @click="viewingFAQ = null" class="text-slate-400 hover:text-slate-600"><X class="w-5 h-5"/></button>
          </div>
          <div class="p-6 overflow-y-auto max-h-[70vh] space-y-6">
            <div>
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">标准问题</h3>
              <div class="text-base font-bold text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-100">
                {{ viewingFAQ.question }}
              </div>
            </div>
            <div>
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">完整答案</h3>
              <div
                class="prose prose-sm prose-slate max-w-none prose-img:rounded-md prose-img:border prose-a:text-blue-600 border border-slate-100 p-4 rounded-lg"
                v-html="viewingFAQ.answer"
              />
            </div>
          </div>
          <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button @click="viewingFAQ = null" class="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100">关闭</Button>
          </div>
        </div>
      </div>

      <div v-if="showFAQImportModal" class="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 text-left" @click="showFAQImportModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col" @click.stop>
          <div class="bg-slate-800 text-white p-5 flex justify-between items-center shrink-0">
            <h2 class="text-lg font-black flex items-center gap-2"><Sparkles class="w-5 h-5 text-amber-400"/> AI 批量解析原件生成 FAQ</h2>
            <button @click="showFAQImportModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
          </div>
          
          <div class="p-6">
            <div v-if="importStep === 1" class="space-y-6">
              <div
                @dragover.prevent="dragActive = true"
                @dragleave="dragActive = false"
                @drop.prevent="dragActive = false; const files = ($event as DragEvent).dataTransfer?.files; if (files && files[0]) handleFileSelected(files[0])"
                :class="['border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors', dragActive ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-slate-50']"
              >
                <UploadCloud class="w-12 h-12 text-slate-400 mb-4"/>
                <p class="text-sm font-bold text-slate-700 mb-2">拖拽或点击上传文件</p>
                <p class="text-xs text-slate-500 mb-6 max-w-sm">支持 Word (.docx), PDF (.pdf), Excel (.xlsx)。AI 将自动通读文件，抽丝剥茧为您提取成千上万个意图和对应的响应话术。</p>
                <input type="file" id="faq-file-upload-input" class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" @change="($event.target as HTMLInputElement).files && handleFileSelected(($event.target as HTMLInputElement).files[0])" />
                <Button @click="document.getElementById('faq-file-upload-input')?.click()" class="bg-amber-500 hover:bg-amber-600">选择文件解析</Button>
              </div>
            </div>

            <div v-if="importStep === 2" class="py-12 flex flex-col items-center justify-center">
              <div class="relative mb-8">
                <Loader2 class="w-16 h-16 text-amber-500 animate-spin"/>
                <div class="absolute inset-0 flex items-center justify-center">
                  <FileText class="w-6 h-6 text-slate-700" />
                </div>
              </div>
              <h3 class="text-lg font-extrabold text-slate-800 mb-6">正在通读推演原件：{{ importedFile?.name }}</h3>
              <div class="w-full max-w-md bg-slate-900 rounded-lg p-4 font-mono text-[10px] text-emerald-400 h-48 overflow-y-auto space-y-2">
                <div v-for="(log, i) in parsingLogs" :key="i">{{ log }}</div>
                <div class="animate-pulse">_</div>
              </div>
            </div>

            <div v-if="importStep === 3" class="space-y-4 max-h-[60vh] overflow-y-auto">
              <div class="bg-blue-50 border border-blue-200 rounded p-4 flex gap-4 min-w-0">
                <FileText class="w-10 h-10 text-blue-500 shrink-0"/>
                <div class="min-w-0">
                  <h4 class="font-extrabold text-blue-900 text-sm">{{ importedFile?.name }}</h4>
                  <p class="text-xs text-blue-700">AI 从该原件中解析出了 {{ extractedFaqs.length }} 个 FAQ，请您审定或微调：</p>
                </div>
              </div>
              
              <div class="space-y-4">
                <div v-for="(faq, i) in extractedFaqs" :key="i" :class="['border rounded-xl p-4 transition-all', faq.selected ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200 opacity-60']">
                  <div class="flex items-start gap-4">
                    <input type="checkbox" :checked="faq.selected" @change="toggleExtractedFaq(i)" class="mt-1 w-4 h-4 text-amber-500" />
                    <div class="flex-1 space-y-3">
                      <Input class="text-xs font-bold" :value="faq.question" @input="updateExtractedFaqQuestion(i, ($event.target as HTMLInputElement).value)" />
                      <textarea
                        class="w-full h-20 text-xs border border-slate-200 rounded p-2 focus:border-amber-400"
                        :value="faq.answer"
                        @input="updateExtractedFaqAnswer(i, ($event.target as HTMLTextAreaElement).value)"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white shadow-[0_-10px_10px_white]">
                <Button variant="outline" @click="showFAQImportModal = false">取消</Button>
                <Button @click="handleCommitAIImport" class="bg-amber-600 hover:bg-amber-700 text-white">将勾选项正式物理保存入库</Button>
              </div>
            </div>

            <div v-if="importStep === 4" class="py-12 flex flex-col items-center justify-center text-center">
              <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 class="w-10 h-10 text-emerald-600" />
              </div>
              <h3 class="text-xl font-black text-slate-800 mb-2">批处理入库成功！</h3>
              <p class="text-slate-500 mb-8 max-w-xs text-sm">这些 QA 意图现在已受本知识库配置监控，大模型问答若命中匹配即会被自动直接应用（Bypass）。</p>
              <Button @click="showFAQImportModal = false; importStep = 1" class="bg-slate-900 border-slate-700 text-white px-8">确定关闭</Button>
            </div>
          </div>
        </div>
      </div>
  </template>