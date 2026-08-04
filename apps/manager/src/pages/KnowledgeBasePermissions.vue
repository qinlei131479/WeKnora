<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ShieldCheck, CheckCircle2, FolderTree, ChevronRight, ChevronDown,
  Eye, EyeOff, User as UserIcon, Users, Layers, Briefcase, ShieldAlert,
  Search, SlidersHorizontal, Building, Database, X, Save, HelpCircle
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'
import { getKBs, saveKBs, type KnowledgeBase, getDefaultPermissions } from '@/lib/kb-store'
import { getDepartments, getPositions, getUserGroups as getUserGroupsData, getUsers, type UserGroup } from '@/lib/org-store'
import { getDomains, isDomainMatch, getFlatDomains } from '@/lib/domain-store'

type TabType = 'matrix' | 'dept-audit' | 'pos-audit' | 'group-audit' | 'audit'
type MatrixDimension = 'depts' | 'positions' | 'groups'

const activeTab = ref<TabType>('matrix')
const kbs = ref<KnowledgeBase[]>(getKBs())
const toastMessage = ref<string | null>(null)

const depts = getDepartments()
const positions = getPositions()
const groups: UserGroup[] = getUserGroupsData()
const users = getUsers()

const selectedDeptId = ref(depts[0]?.id || '')
const selectedPositionId = ref(positions[0]?.id || '')
const selectedGroupId = ref(groups[0]?.id || '')

const showTree = ref(true)
const selectedDomain = ref('all')
const matrixDimension = ref<MatrixDimension>('depts')

const selectedUserId = ref(users[0]?.id || '')
const userSearchText = ref('')
const isUserListOpen = ref(false)

const auditSearchQuery = ref('')

const expandedNodes = ref<Record<string, boolean>>({
  'base': true,
  'business': true,
  'base-general': true,
  'base-data': true,
  'biz-media': true,
  'biz-iptv': true,
  'biz-hr': true,
})

watch([selectedUserId], () => {
  const current = users.find(x => x.id === selectedUserId.value)
  if (current) {
    userSearchText.value = current.name
  }
})

const triggerToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3000)
}

const handleSave = () => {
  saveKBs(kbs.value)
  triggerToast('全体知识库安全沙箱隔离矩阵已保存生效')
}

const togglePermission = (
  kbId: string,
  category:
    | 'manageDepts' | 'accessQueryDepts' | 'accessDownloadDepts'
    | 'managePositions' | 'accessQueryPositions' | 'accessDownloadPositions'
    | 'manageUserGroups' | 'accessQueryUserGroups' | 'accessDownloadUserGroups',
  id: string
) => {
  kbs.value = kbs.value.map(kb => {
    if (kb.id !== kbId) return kb
    const p = kb.permissions || getDefaultPermissions()
    const list = p[category] || []
    const newList = list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    return { ...kb, permissions: { ...p, [category]: newList } }
  })
}

const toggleUserOverrideLocal = (
  kbId: string,
  userId: string,
  type: 'manage' | 'query' | 'download',
  action: 'allow' | 'deny' | 'reset'
) => {
  kbs.value = kbs.value.map(kb => {
    if (kb.id !== kbId) return kb
    const p = kb.permissions || getDefaultPermissions()

    let userManageOverrides = p.userManageOverrides ? { ...p.userManageOverrides } : {}
    let userQueryOverrides = p.userQueryOverrides ? { ...p.userQueryOverrides } : {}
    let userDownloadOverrides = p.userDownloadOverrides ? { ...p.userDownloadOverrides } : {}

    if (type === 'manage') {
      if (action === 'reset') delete userManageOverrides[userId]
      else userManageOverrides[userId] = action
    } else if (type === 'query') {
      if (action === 'reset') delete userQueryOverrides[userId]
      else userQueryOverrides[userId] = action
    } else if (type === 'download') {
      if (action === 'reset') delete userDownloadOverrides[userId]
      else userDownloadOverrides[userId] = action
    }

    return {
      ...kb,
      permissions: {
        ...p,
        userManageOverrides,
        userQueryOverrides,
        userDownloadOverrides
      }
    }
  })
}

const handleSaveAudit = () => {
  saveKBs(kbs.value)
  triggerToast('独立用户授权规则已成功保存生效')
}

const handleCheckboxToggle = (kbId: string, type: 'manage' | 'query' | 'download', currentlyEnabled: boolean) => {
  if (!selectedUserId.value) return
  const action = currentlyEnabled ? 'deny' : 'allow'
  toggleUserOverrideLocal(kbId, selectedUserId.value, type, action)
}

const toggleDeptPermission = (
  kbId: string,
  category: 'manageDepts' | 'accessQueryDepts' | 'accessDownloadDepts',
  deptId: string
) => {
  kbs.value = kbs.value.map(kb => {
    if (kb.id !== kbId) return kb
    const p = kb.permissions || getDefaultPermissions()
    const list = p[category] || []
    const newList = list.includes(deptId) ? list.filter(x => x !== deptId) : [...list, deptId]
    return { ...kb, permissions: { ...p, [category]: newList } }
  })
}

const togglePosPermission = (
  kbId: string,
  category: 'managePositions' | 'accessQueryPositions' | 'accessDownloadPositions',
  posId: string
) => {
  kbs.value = kbs.value.map(kb => {
    if (kb.id !== kbId) return kb
    const p = kb.permissions || getDefaultPermissions()
    const list = p[category] || []
    const newList = list.includes(posId) ? list.filter(x => x !== posId) : [...list, posId]
    return { ...kb, permissions: { ...p, [category]: newList } }
  })
}

const toggleGroupPermission = (
  kbId: string,
  category: 'manageUserGroups' | 'accessQueryUserGroups' | 'accessDownloadUserGroups',
  groupId: string
) => {
  kbs.value = kbs.value.map(kb => {
    if (kb.id !== kbId) return kb
    const p = kb.permissions || getDefaultPermissions()
    const list = p[category] || []
    const newList = list.includes(groupId) ? list.filter(x => x !== groupId) : [...list, groupId]
    return { ...kb, permissions: { ...p, [category]: newList } }
  })
}

const handleSaveDeptAudit = () => {
  saveKBs(kbs.value)
  triggerToast('部门权限设置已成功保存生效')
}

const handleSavePosAudit = () => {
  saveKBs(kbs.value)
  triggerToast('岗位权限设置已成功保存生效')
}

const handleSaveGroupAudit = () => {
  saveKBs(kbs.value)
  triggerToast('用户组权限设置已成功保存生效')
}

const filteredKbs = computed(() => {
  return kbs.value.filter(kb => {
    if (!selectedDomain.value || selectedDomain.value === 'all') return true
    return isDomainMatch(kb.domain, selectedDomain.value)
  })
})

const getKBTypeLabel = (type?: string) => {
  if (type === 'local') return '文档知识'
  if (type === 'web') return '网页知识'
  return '环境数据'
}

const getKBTypeBadgeStyle = (type?: string) => {
  if (type === 'local') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (type === 'web') return 'bg-sky-50 text-sky-700 border border-sky-200'
  return 'bg-violet-50 text-violet-700 border border-violet-200'
}

const getUserKBPermissionDetails = (kb: KnowledgeBase, userId: string) => {
  const user = users.find(u => u.id === userId)
  if (!user) return null

  const userDept = depts.find(d => d.id === user.departmentId)?.name || '未定义部门'
  const userPos = positions.find(p => p.id === user.positionId)?.title || '未定义岗位'

  const uGroupIds = user.userGroupId ? user.userGroupId.split(',').map(s => s.trim()).filter(Boolean) : []
  const uGroupObjs = groups.filter(g => uGroupIds.includes(g.id))

  const p = kb.permissions || getDefaultPermissions()

  let canManage = false
  let manageSrc = "无管理权限：所属部门、岗位、群组均未被授管理管辖权"
  let isOverriddenManage = false

  if (p.userManageOverrides && p.userManageOverrides[userId] !== undefined) {
    isOverriddenManage = true
    if (p.userManageOverrides[userId] === 'allow') {
      canManage = true
      manageSrc = "独立授权：已单独为此用户开启了管理权限"
    } else {
      canManage = false
      manageSrc = "单独禁止：已单独为此用户取消了管理权限"
    }
  } else {
    if (user.role === 'admin') {
      canManage = true
      manageSrc = "最高管理：系统最高管理员(admin)默认具备管理管辖权"
    } else {
      const matchedManageGroup = uGroupObjs.find(g => p.manageUserGroups?.includes(g.id))
      if (p.manageDepts?.includes(user.departmentId)) {
        canManage = true
        manageSrc = `部门授权：继承自部门 [${userDept}]`
      } else if (p.managePositions?.includes(user.positionId)) {
        canManage = true
        manageSrc = `岗位授权：继承自职务岗位 [${userPos}]`
      } else if (matchedManageGroup) {
        canManage = true
        manageSrc = `群组授权：继承自团队群组 [${matchedManageGroup.name}]`
      }
    }
  }

  let canQuery = false
  let querySrc = "无检索权限：对该仓库未授权，处于隔离状态"
  let isOverriddenQuery = false

  if (p.userQueryOverrides && p.userQueryOverrides[userId] !== undefined) {
    isOverriddenQuery = true
    if (p.userQueryOverrides[userId] === 'allow') {
      canQuery = true
      querySrc = "独立授权：已单独为此用户开启了问答检索权"
    } else {
      canQuery = false
      querySrc = "单独禁止：已单独为此用户取消了问答检索权"
    }
  } else {
    if (user.role === 'admin') {
      canQuery = true
      querySrc = "最高管理：系统最高管理员(admin)默认具备问答检索查看权"
    } else {
      const matchedQueryGroup = uGroupObjs.find(g => p.accessQueryUserGroups?.includes(g.id))
      if (canManage) {
        canQuery = true
        querySrc = "权限继承：因拥有管理管辖权，自动继承检索查看权"
      } else if (p.accessQueryDepts?.includes("all_depts")) {
        canQuery = true
        querySrc = "全局开放：本知识库已全公司公开可见"
      } else if (p.accessQueryDepts?.includes(user.departmentId)) {
        canQuery = true
        querySrc = `部门授权：继承自部门 [${userDept}]`
      } else if (p.accessQueryPositions?.includes(user.positionId)) {
        canQuery = true
        querySrc = `岗位授权：继承自岗位 [${userPos}]`
      } else if (matchedQueryGroup) {
        canQuery = true
        querySrc = `群组授权：继承自群组 [${matchedQueryGroup.name}]`
      }
    }
  }

  if (canManage && (!p.userQueryOverrides || p.userQueryOverrides[userId] === undefined)) {
    canQuery = true
    querySrc = "权限继承：因拥有管理管辖权，自动继承检索查看权"
  }

  let canDownload = false
  let downloadSrc = "无下载权限：禁止下载及导出原文件"
  let isOverriddenDownload = false

  if (p.userDownloadOverrides && p.userDownloadOverrides[userId] !== undefined) {
    isOverriddenDownload = true
    if (p.userDownloadOverrides[userId] === 'allow') {
      canDownload = true
      downloadSrc = "独立授权：已单独为此用户开启了文档下载权"
    } else {
      canDownload = false
      downloadSrc = "单独禁止：已单独为此用户取消了文档下载权"
    }
  } else {
    if (user.role === 'admin') {
      canDownload = true
      downloadSrc = "最高管理：系统最高管理员(admin)默认具备文档下载/导出权"
    } else {
      const matchedDownloadGroup = uGroupObjs.find(g => p.accessDownloadUserGroups?.includes(g.id))
      if (canManage) {
        canDownload = true
        downloadSrc = "权限继承：因拥有最高管理管辖权，自动获得物理文档下载权"
      } else if (p.accessDownloadDepts?.includes(user.departmentId)) {
        canDownload = true
        downloadSrc = `部门授权：继承自部门 [${userDept}]`
      } else if (p.accessDownloadPositions?.includes(user.positionId)) {
        canDownload = true
        downloadSrc = `岗位授权：继承自岗位 [${userPos}]`
      } else if (matchedDownloadGroup) {
        canDownload = true
        downloadSrc = `群组授权：继承自群组 [${matchedDownloadGroup.name}]`
      }
    }
  }

  if (canManage && (!p.userDownloadOverrides || p.userDownloadOverrides[userId] === undefined)) {
    canDownload = true
    downloadSrc = "权限继承：因拥有最高管理管辖权，自动获得物理文档下载权"
  }

  return {
    canManage,
    manageSrc,
    canQuery,
    querySrc,
    canDownload,
    downloadSrc,
    isOverriddenManage,
    isOverriddenQuery,
    isOverriddenDownload
  }
}

const getCategoryKBCount = (nodeId: string) => {
  return kbs.value.filter(kb => isDomainMatch(kb.domain, nodeId)).length
}

const domainData = getDomains()

const activeDept = computed(() => depts.find(d => d.id === selectedDeptId.value) || depts[0])
const activePos = computed(() => positions.find(p => p.id === selectedPositionId.value) || positions[0])
const activeGroup = computed(() => groups.find(g => g.id === selectedGroupId.value) || groups[0])

const getUserGroups = (user: any): UserGroup[] => {
  const userGroupIds = user.userGroupId ? user.userGroupId.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  return groups.filter((g: UserGroup) => userGroupIds.includes(g.id))
}

const getFilteredUsers = () => {
  const query = userSearchText.value.toLowerCase().trim()
  if (!query) return users
  return users.filter(u => {
    const dName = depts.find(d => d.id === u.departmentId)?.name || ""
    const pTitle = positions.find(pos => pos.id === u.positionId)?.title || ""
    return (
      u.name.toLowerCase().includes(query) ||
      u.id.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      dName.toLowerCase().includes(query) ||
      pTitle.toLowerCase().includes(query)
    )
  })
}

const getAuditedKbs = (query: string) => {
  const q = query.toLowerCase().trim()
  if (!q) return kbs.value
  return kbs.value.filter(kb => {
    const domainObj = getFlatDomains().find(fd => fd.id === kb.domain)
    const domainLabel = domainObj ? domainObj.label : "基础域"
    return (
      kb.title.toLowerCase().includes(q) ||
      kb.id.toLowerCase().includes(q) ||
      domainLabel.toLowerCase().includes(q) ||
      kb.domain.toLowerCase().includes(q)
    )
  })
}

const currentUser = computed(() => users.find(u => u.id === selectedUserId.value))
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <div v-if="toastMessage" class="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur text-slate-100 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CheckCircle2 class="w-4.5 h-4.5 text-emerald-400" />
      <span class="font-semibold">{{ toastMessage }}</span>
    </div>

    <div class="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4">
      <div class="space-y-1">
        <h1 class="text-xl font-black flex items-center gap-2 text-slate-800">
          <ShieldCheck class="w-5.5 h-5.5 text-blue-600" />
          系统级知识库安全授权与管辖矩阵
        </h1>
        <p class="text-xs text-slate-400">
          全景审视并集中管理"文档知识、网页知识、环境数据"的「管理上传、智能问答、原件下载」安全沙箱受众。
        </p>
      </div>
      <div class="flex items-center gap-3 w-full md:w-auto">
        <Button
          v-if="activeTab === 'matrix'"
          @click="handleSave"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 text-xs gap-1.5 shadow-sm ml-auto md:ml-0"
        >
          <Save class="w-3.5 h-3.5" />
          批量保存全矩阵授权
        </Button>
      </div>
    </div>

    <div class="flex border-b border-slate-200 gap-1 overflow-x-auto whitespace-nowrap">
      <button
        @click="activeTab = 'matrix'"
        :class="['px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2', activeTab === 'matrix' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300']"
      >
        <SlidersHorizontal class="w-3.5 h-3.5" />
        多维度管辖矩阵配置
      </button>
      <button
        @click="activeTab = 'dept-audit'"
        :class="['px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2', activeTab === 'dept-audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300']"
      >
        <Building class="w-3.5 h-3.5 text-blue-600" />
        部门权限审计
      </button>
      <button
        @click="activeTab = 'pos-audit'"
        :class="['px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2', activeTab === 'pos-audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300']"
      >
        <Briefcase class="w-3.5 h-3.5 text-teal-600" />
        岗位权限审计
      </button>
      <button
        @click="activeTab = 'group-audit'"
        :class="['px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2', activeTab === 'group-audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300']"
      >
        <Users class="w-3.5 h-3.5 text-indigo-600" />
        用户组权限审计
      </button>
      <button
        @click="activeTab = 'audit'"
        :class="['px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2', activeTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300']"
      >
        <UserIcon class="w-3.5 h-3.5" />
        独立用户权限审计
      </button>
    </div>

    <div v-if="activeTab === 'matrix'" class="flex gap-6 items-start">
      <div v-if="showTree" class="w-64 bg-white border border-slate-150 rounded-xl p-4 shrink-0 shadow-sm space-y-4 max-h-[800px] overflow-y-auto animate-in fade-in slide-in-from-left-4 duration-200">
        <div class="flex items-center justify-between border-b pb-2">
          <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FolderTree class="w-4 h-4 text-slate-500" />
            业务领域分类树
          </span>
          <Button
            variant="ghost"
            size="icon"
            @click="showTree = false"
            class="w-5 h-5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
          >
            <EyeOff class="w-3.5 h-3.5" />
          </Button>
        </div>

        <div class="space-y-4">
          <div
            :class="['flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all', selectedDomain === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-700']"
            @click="selectedDomain = 'all'"
          >
            <Layers class="w-3.5 h-3.5" />
            <span>全部业务库</span>
            <span :class="['ml-auto text-[10px] px-1.5 py-0.2 rounded-full', selectedDomain === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500']">
              {{ kbs.length }}
            </span>
          </div>

          <div class="space-y-1">
            <template v-for="node in domainData" :key="node.id">
              <div class="space-y-1">
                <div
                  :style="{ paddingLeft: '6px' }"
                  :class="['group flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-all', selectedDomain === node.id ? 'bg-blue-50 text-blue-700 font-bold shadow-[inset_3px_0_0_0_rgba(37,99,235,1)]' : 'hover:bg-slate-50 text-slate-600']"
                  @click="selectedDomain = node.id"
                >
                  <button
                    v-if="node.children && node.children.length > 0"
                    @click.stop="expandedNodes[node.id] = !expandedNodes[node.id]"
                    class="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <ChevronDown v-if="expandedNodes[node.id]" class="w-3.5 h-3.5" />
                    <ChevronRight v-else class="w-3.5 h-3.5" />
                  </button>
                  <span v-else class="w-4 h-4" />

                  <FolderTree :class="['w-3.5 h-3.5', selectedDomain === node.id ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500']" />
                  <span class="truncate flex-1">{{ node.label }}</span>

                  <span v-if="getCategoryKBCount(node.id) > 0" :class="['text-[10px] px-1.5 py-0.2 rounded-full font-medium', selectedDomain === node.id ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200']">
                    {{ getCategoryKBCount(node.id) }}
                  </span>
                </div>

                <div v-if="node.children && expandedNodes[node.id]" class="space-y-0.5 relative before:absolute before:left-[14px] before:top-1 before:bottom-1 before:w-[1px] before:bg-slate-100">
                  <template v-for="child in node.children" :key="child.id">
                    <div class="space-y-1">
                      <div
                        :style="{ paddingLeft: '18px' }"
                        :class="['group flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-all', selectedDomain === child.id ? 'bg-blue-50 text-blue-700 font-bold shadow-[inset_3px_0_0_0_rgba(37,99,235,1)]' : 'hover:bg-slate-50 text-slate-600']"
                        @click="selectedDomain = child.id"
                      >
                        <button
                          v-if="child.children && child.children.length > 0"
                          @click.stop="expandedNodes[child.id] = !expandedNodes[child.id]"
                          class="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <ChevronDown v-if="expandedNodes[child.id]" class="w-3.5 h-3.5" />
                          <ChevronRight v-else class="w-3.5 h-3.5" />
                        </button>
                        <span v-else class="w-4 h-4" />

                        <FolderTree :class="['w-3.5 h-3.5', selectedDomain === child.id ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500']" />
                        <span class="truncate flex-1">{{ child.label }}</span>

                        <span v-if="getCategoryKBCount(child.id) > 0" :class="['text-[10px] px-1.5 py-0.2 rounded-full font-medium', selectedDomain === child.id ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200']">
                          {{ getCategoryKBCount(child.id) }}
                        </span>
                      </div>

                      <div v-if="child.children && expandedNodes[child.id]" class="space-y-0.5 relative before:absolute before:left-[14px] before:top-1 before:bottom-1 before:w-[1px] before:bg-slate-100">
                        <div
                          v-for="grandchild in child.children"
                          :key="grandchild.id"
                          :style="{ paddingLeft: '30px' }"
                          :class="['group flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-all', selectedDomain === grandchild.id ? 'bg-blue-50 text-blue-700 font-bold shadow-[inset_3px_0_0_0_rgba(37,99,235,1)]' : 'hover:bg-slate-50 text-slate-600']"
                          @click="selectedDomain = grandchild.id"
                        >
                          <span class="w-4 h-4" />
                          <FolderTree :class="['w-3.5 h-3.5', selectedDomain === grandchild.id ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500']" />
                          <span class="truncate flex-1">{{ grandchild.label }}</span>

                          <span v-if="getCategoryKBCount(grandchild.id) > 0" :class="['text-[10px] px-1.5 py-0.2 rounded-full font-medium', selectedDomain === grandchild.id ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200']">
                            {{ getCategoryKBCount(grandchild.id) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="flex-1 space-y-4">
        <div class="bg-slate-50 border border-slate-150 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <Button
              v-if="!showTree"
              variant="outline"
              size="sm"
              @click="showTree = true"
              class="h-8 text-xs gap-1 px-2.5 font-bold border-slate-200 hover:bg-white"
            >
              <Eye class="w-3.5 h-3.5 text-blue-600" />
              显示业务分类树
            </Button>

            <div class="flex items-center gap-1">
              <span class="text-xs text-slate-400">当前筛选：</span>
              <span class="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                {{ selectedDomain === 'all' ? '所有业务领域' : getFlatDomains().find(fd => fd.id === selectedDomain)?.path || '特定分支' }}
              </span>
              <span class="text-xs font-semibold text-slate-400 ml-1">
                (共召回 {{ filteredKbs.length }} 个知识库)
              </span>
            </div>
          </div>

          <div class="flex items-center bg-slate-200/60 p-0.5 rounded-lg border border-slate-200">
            <button
              @click="matrixDimension = 'depts'"
              :class="['px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1', matrixDimension === 'depts' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800']"
            >
              <Building class="w-3.5 h-3.5" />
              🏢 集团部门
            </button>
            <button
              @click="matrixDimension = 'positions'"
              :class="['px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1', matrixDimension === 'positions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800']"
            >
              <Briefcase class="w-3.5 h-3.5" />
              🎭 职务岗位
            </button>
            <button
              @click="matrixDimension = 'groups'"
              :class="['px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1', matrixDimension === 'groups' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800']"
            >
              <Users class="w-3.5 h-3.5" />
              👥 用户组
            </button>
          </div>
        </div>

        <div v-if="filteredKbs.length === 0" class="p-12 text-center bg-white border border-slate-150 rounded-2xl space-y-2">
          <ShieldAlert class="w-10 h-10 text-slate-300 mx-auto" />
          <h3 class="text-sm font-bold text-slate-600">本业务领域暂无导入的主体库</h3>
          <p class="text-xs text-slate-400">请选择左侧领域分类树的其他层级，或点击上方"重置"回到全部显示。</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-5">
          <Card v-for="kb in filteredKbs" :key="kb.id" class="p-5 bg-white border border-slate-150 hover:shadow-md transition-all flex flex-col gap-4">
            <div class="flex flex-wrap items-center gap-3 pb-3 border-b border-slate-100">
              <span :class="['px-2.5 py-0.5 rounded text-[10px] font-extrabold', getKBTypeBadgeStyle(kb.type)]">
                {{ getKBTypeLabel(kb.type) }}
              </span>
              <h3 class="font-extrabold text-slate-800 text-sm">{{ kb.title }}</h3>
              <span class="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono ml-auto">
                ID: {{ kb.domain }}
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-3">
                <div class="flex items-center gap-1.5 text-slate-800 font-bold border-b border-slate-100 pb-1.5 text-[11px]">
                  <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  拥有管理与上传配置权
                  <div class="group relative ml-auto">
                    <HelpCircle class="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
                    <div class="absolute right-0 top-5 bg-slate-800 text-slate-100 text-[9px] p-2 rounded shadow-xl w-48 hidden group-hover:block z-10 leading-relaxed font-normal">
                      勾选主体获此权限，即可创建、删除并更新该资产，同时可对知识库底层分块规则、数据抓取策略进行配置。
                    </div>
                  </div>
                </div>

                <div class="bg-slate-50 border border-slate-150 p-2 rounded-lg max-h-[160px] overflow-y-auto space-y-1 text-[11px] font-medium text-slate-600">
                  <label v-for="d in depts" :key="d.id" v-show="matrixDimension === 'depts'" class="flex items-center justify-between cursor-pointer py-1 px-1.5 hover:bg-slate-150 rounded transition-colors">
                    <span>{{ d.name }}</span>
                    <input
                      type="checkbox"
                      :checked="(kb.permissions?.manageDepts || []).includes(d.id)"
                      @change="togglePermission(kb.id, 'manageDepts', d.id)"
                      class="rounded text-blue-600 h-3.5 w-3.5 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label v-for="pos in positions" :key="pos.id" v-show="matrixDimension === 'positions'" class="flex items-center justify-between cursor-pointer py-1 px-1.5 hover:bg-slate-150 rounded transition-colors">
                    <span>{{ pos.title }}</span>
                    <input
                      type="checkbox"
                      :checked="(kb.permissions?.managePositions || []).includes(pos.id)"
                      @change="togglePermission(kb.id, 'managePositions', pos.id)"
                      class="rounded text-blue-600 h-3.5 w-3.5 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label v-for="g in groups" :key="g.id" v-show="matrixDimension === 'groups'" class="flex items-center justify-between cursor-pointer py-1 px-1.5 hover:bg-slate-150 rounded transition-colors">
                    <span>{{ g.name }}</span>
                    <input
                      type="checkbox"
                      :checked="(kb.permissions?.manageUserGroups || []).includes(g.id)"
                      @change="togglePermission(kb.id, 'manageUserGroups', g.id)"
                      class="rounded text-blue-600 h-3.5 w-3.5 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center gap-1.5 text-slate-800 font-bold border-b border-slate-100 pb-1.5 text-[11px]">
                  <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  允许智能问答与检索
                  <div class="group relative ml-auto">
                    <HelpCircle class="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
                    <div class="absolute right-0 top-5 bg-slate-800 text-slate-100 text-[9px] p-2 rounded shadow-xl w-48 hidden group-hover:block z-10 leading-relaxed font-normal">
                      授予特定用户大模型问答时的业务召回权限。管理员在此处管理哪些受众能够查阅并检索本库内容。
                    </div>
                  </div>
                </div>

                <div class="bg-slate-50 border border-slate-150 p-2 rounded-lg max-h-[160px] overflow-y-auto space-y-1 text-[11px] font-medium text-slate-600">
                  <label v-if="matrixDimension === 'depts'" class="flex items-center justify-between cursor-pointer py-1.5 px-1.5 hover:bg-slate-150 rounded border-b border-slate-200 mb-1.5 text-[11px]">
                    <span class="font-extrabold text-blue-700">🏢 全公司开放查看权</span>
                    <input
                      type="checkbox"
                      :checked="(kb.permissions?.accessQueryDepts || []).includes('all_depts')"
                      @change="togglePermission(kb.id, 'accessQueryDepts', 'all_depts')"
                      class="rounded text-blue-600 h-3.5 w-3.5 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label v-for="d in depts" :key="d.id" v-show="matrixDimension === 'depts'" class="flex items-center justify-between cursor-pointer py-1 px-1.5 hover:bg-slate-150 rounded transition-colors">
                    <span>{{ d.name }}</span>
                    <input
                      type="checkbox"
                      :checked="(kb.permissions?.accessQueryDepts || []).includes(d.id)"
                      @change="togglePermission(kb.id, 'accessQueryDepts', d.id)"
                      :disabled="(kb.permissions?.accessQueryDepts || []).includes('all_depts')"
                      class="rounded text-emerald-600 h-3.5 w-3.5 border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-40"
                    />
                  </label>

                  <label v-for="pos in positions" :key="pos.id" v-show="matrixDimension === 'positions'" class="flex items-center justify-between cursor-pointer py-1 px-1.5 hover:bg-slate-150 rounded transition-colors">
                    <span>{{ pos.title }}</span>
                    <input
                      type="checkbox"
                      :checked="(kb.permissions?.accessQueryPositions || []).includes(pos.id)"
                      @change="togglePermission(kb.id, 'accessQueryPositions', pos.id)"
                      class="rounded text-emerald-600 h-3.5 w-3.5 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label v-for="g in groups" :key="g.id" v-show="matrixDimension === 'groups'" class="flex items-center justify-between cursor-pointer py-1 px-1.5 hover:bg-slate-150 rounded transition-colors">
                    <span>{{ g.name }}</span>
                    <input
                      type="checkbox"
                      :checked="(kb.permissions?.accessQueryUserGroups || []).includes(g.id)"
                      @change="togglePermission(kb.id, 'accessQueryUserGroups', g.id)"
                      class="rounded text-emerald-600 h-3.5 w-3.5 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center gap-1.5 text-slate-800 font-bold border-b border-slate-100 pb-1.5 text-[11px]">
                  <span class="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                  允许原文件下载导出
                  <div class="group relative ml-auto">
                    <HelpCircle class="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
                    <div class="absolute right-0 top-5 bg-slate-800 text-slate-100 text-[9px] p-2 rounded shadow-xl w-48 hidden group-hover:block z-10 leading-relaxed font-normal">
                      拥有查看权的用户是否允许其在系统中下载原始文档实体。关闭此项，将处于"仅支持在大脑内推理问答"的超强物理保护状态。
                    </div>
                  </div>
                </div>

                <div class="bg-slate-50 border border-slate-150 p-2 rounded-lg max-h-[160px] overflow-y-auto space-y-1 text-[11px] font-medium text-slate-600">
                  <label v-for="d in depts" :key="d.id" v-show="matrixDimension === 'depts'" class="flex items-center justify-between cursor-pointer py-1 px-1.5 hover:bg-slate-150 rounded transition-colors">
                    <span>{{ d.name }}</span>
                    <input
                      type="checkbox"
                      :checked="(kb.permissions?.accessDownloadDepts || []).includes(d.id)"
                      @change="togglePermission(kb.id, 'accessDownloadDepts', d.id)"
                      class="rounded text-rose-600 h-3.5 w-3.5 border-slate-300 focus:ring-rose-500 cursor-pointer"
                    />
                  </label>

                  <label v-for="pos in positions" :key="pos.id" v-show="matrixDimension === 'positions'" class="flex items-center justify-between cursor-pointer py-1 px-1.5 hover:bg-slate-150 rounded transition-colors">
                    <span>{{ pos.title }}</span>
                    <input
                      type="checkbox"
                      :checked="(kb.permissions?.accessDownloadPositions || []).includes(pos.id)"
                      @change="togglePermission(kb.id, 'accessDownloadPositions', pos.id)"
                      class="rounded text-rose-600 h-3.5 w-3.5 border-slate-300 focus:ring-rose-500 cursor-pointer"
                    />
                  </label>

                  <label v-for="g in groups" :key="g.id" v-show="matrixDimension === 'groups'" class="flex items-center justify-between cursor-pointer py-1 px-1.5 hover:bg-slate-150 rounded transition-colors">
                    <span>{{ g.name }}</span>
                    <input
                      type="checkbox"
                      :checked="(kb.permissions?.accessDownloadUserGroups || []).includes(g.id)"
                      @change="togglePermission(kb.id, 'accessDownloadUserGroups', g.id)"
                      class="rounded text-rose-600 h-3.5 w-3.5 border-slate-300 focus:ring-rose-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'dept-audit'" class="space-y-6 animate-in fade-in duration-200">
      <Card class="p-6 bg-slate-50 border-slate-150 shadow-sm space-y-4">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Building class="w-4 h-4 text-blue-600" />
              部门视角下的知识库管辖与通达权限编辑
            </h3>
            <p class="text-xs text-slate-400">
              一键式针对指定部门审计该部门名下职员与系统关联的所有 RAG 问答知识库权限，并支持集中撤销或授权。
            </p>
          </div>

          <div class="w-full md:w-80 relative z-30">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
              选择研判审计部门
            </label>
            <SearchableSelect
              v-model="selectedDeptId"
              :options="depts.map(d => ({
                id: d.id,
                label: d.name,
                sublabel: d.code,
                icon: Building
              }))"
              placeholder="选择部门..."
              search-placeholder="输入部门名称或代号检索..."
            />
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-250 text-xs space-y-1.5 shadow-sm">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">部门描述及职责说明</span>
          <span class="font-semibold text-slate-700 block">{{ activeDept?.description || '' }}</span>
        </div>
      </Card>

      <div class="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
        <div class="p-4 bg-slate-50/70 border-b border-slate-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-0.5">
            <span class="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Database class="w-3.5 h-3.5 text-blue-600" />
              部门关联知识库授权矩阵
            </span>
            <p class="text-[10px] text-slate-400">检索到 {{ getAuditedKbs(auditSearchQuery).length }} 个知识库对本部门配置的访问管控状态</p>
          </div>

          <div class="flex items-center gap-3 w-full md:w-auto">
            <div class="relative w-full md:w-80">
              <input
                v-model="auditSearchQuery"
                placeholder="检索知识库、ID、或存储域..."
                class="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
              <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <button v-if="auditSearchQuery" @click="auditSearchQuery = ''" class="absolute right-2 top-2 text-slate-400">
                <X class="w-3 h-3" />
              </button>
            </div>
            <Button @click="handleSaveDeptAudit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 text-xs gap-1.5 shadow-sm">
              <Save class="w-3.5 h-3.5" />
              保存部门权限修改
            </Button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs whitespace-nowrap">
            <thead class="bg-slate-50 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-150">
              <tr>
                <th class="px-6 py-3 font-semibold text-slate-600">实体知识库</th>
                <th class="px-6 py-3 font-medium text-slate-600">分类领域</th>
                <th class="px-6 py-3 font-semibold text-center text-slate-600">👑 部门管辖管辖权 (Manage)</th>
                <th class="px-6 py-3 font-semibold text-center text-slate-600">💬 部门问答检索权 (Query)</th>
                <th class="px-6 py-3 font-semibold text-center text-slate-600">📥 部门文档下载权 (Download)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="getAuditedKbs(auditSearchQuery).length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                  无匹配知识库
                </td>
              </tr>
              <tr v-for="kb in getAuditedKbs(auditSearchQuery)" :key="kb.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2.5">
                    <span :class="['px-2 py-0.5 rounded text-[9px] font-extrabold shadow-sm', getKBTypeBadgeStyle(kb.type)]">
                      {{ getKBTypeLabel(kb.type) }}
                    </span>
                    <div>
                      <p class="font-bold text-slate-800 text-xs">{{ kb.title }}</p>
                      <p class="text-[10px] text-slate-400 italic">ID: {{ kb.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-slate-500 font-medium">
                  {{ getFlatDomains().find(fd => fd.id === kb.domain)?.label || '基础域' }}
                </td>
                <td class="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    :checked="(kb.permissions?.manageDepts || []).includes(activeDept?.id || '')"
                    @change="toggleDeptPermission(kb.id, 'manageDepts', activeDept?.id || '')"
                    class="rounded border-slate-300 text-blue-600 h-5 w-5 cursor-pointer focus:ring-blue-500 transition-transform hover:scale-110"
                  />
                </td>
                <td class="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    :checked="(kb.permissions?.accessQueryDepts || []).includes(activeDept?.id || '') || (kb.permissions?.accessQueryDepts || []).includes('all_depts')"
                    @change="toggleDeptPermission(kb.id, 'accessQueryDepts', activeDept?.id || '')"
                    :disabled="(kb.permissions?.accessQueryDepts || []).includes('all_depts')"
                    class="rounded border-slate-300 text-emerald-600 h-5 w-5 cursor-pointer focus:ring-emerald-500 transition-transform hover:scale-110 disabled:opacity-40"
                  />
                </td>
                <td class="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    :checked="(kb.permissions?.accessDownloadDepts || []).includes(activeDept?.id || '')"
                    @change="toggleDeptPermission(kb.id, 'accessDownloadDepts', activeDept?.id || '')"
                    class="rounded border-slate-300 text-rose-600 h-5 w-5 cursor-pointer focus:ring-rose-500 transition-transform hover:scale-110"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'pos-audit'" class="space-y-6 animate-in fade-in duration-200">
      <Card class="p-6 bg-slate-50 border-slate-150 shadow-sm space-y-4">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Briefcase class="w-4 h-4 text-teal-600" />
              职务岗位视角下的知识库管辖与通达权限编辑
            </h3>
            <p class="text-xs text-slate-400">
              一键式针对职务等级进行安全一站式审计配置。可以针对岗位下的所有职员，集中进行知识库的降级阻断或放行授权。
            </p>
          </div>

          <div class="w-full md:w-80 relative z-30">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
              选择研判审计职务
            </label>
            <SearchableSelect
              v-model="selectedPositionId"
              :options="positions.map(p => ({
                id: p.id,
                label: p.title,
                sublabel: p.level,
                icon: Briefcase
              }))"
              placeholder="选择职务岗位..."
              search-placeholder="输入职务岗位名称检索..."
            />
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-250 text-xs space-y-1.5 shadow-sm flex flex-col md:flex-row md:items-center gap-y-6">
          <div class="flex-1 space-y-1">
            <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">岗位主要职责详情</span>
            <span class="font-semibold text-slate-700 block">{{ activePos?.description || '' }}</span>
          </div>
          <div class="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6 shrink-0 space-y-1">
            <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">考核映射等级</span>
            <span class="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-extrabold tracking-wide inline-block">{{ activePos?.level || '' }} 级</span>
          </div>
        </div>
      </Card>

      <div class="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
        <div class="p-4 bg-slate-50/70 border-b border-slate-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-0.5">
            <span class="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Database class="w-3.5 h-3.5 text-blue-600" />
              职务关联知识库授权矩阵
            </span>
            <p class="text-[10px] text-slate-400">检索到 {{ getAuditedKbs(auditSearchQuery).length }} 个知识库对本职务配置的访问管控状态</p>
          </div>

          <div class="flex items-center gap-3 w-full md:w-auto">
            <div class="relative w-full md:w-85">
              <input
                v-model="auditSearchQuery"
                placeholder="检索知识库、ID、或分类存储域..."
                class="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
              <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <button v-if="auditSearchQuery" @click="auditSearchQuery = ''" class="absolute right-2 top-2 text-slate-400">
                <X class="w-3 h-3" />
              </button>
            </div>
            <Button @click="handleSavePosAudit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 text-xs gap-1.5 shadow-sm">
              <Save class="w-3.5 h-3.5" />
              保存岗位权限修改
            </Button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs whitespace-nowrap">
            <thead class="bg-slate-50 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-150">
              <tr>
                <th class="px-6 py-3 font-semibold text-slate-600">实体知识库</th>
                <th class="px-6 py-3 font-medium text-slate-600">分类领域</th>
                <th class="px-6 py-3 font-semibold text-center text-slate-600">👑 岗位管辖管辖权 (Manage)</th>
                <th class="px-6 py-3 font-semibold text-center text-slate-600">💬 岗位问答检索权 (Query)</th>
                <th class="px-6 py-3 font-semibold text-center text-slate-600">📥 岗位文档下载权 (Download)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="getAuditedKbs(auditSearchQuery).length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                  无匹配知识库
                </td>
              </tr>
              <tr v-for="kb in getAuditedKbs(auditSearchQuery)" :key="kb.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2.5">
                    <span :class="['px-2 py-0.5 rounded text-[9px] font-extrabold shadow-sm', getKBTypeBadgeStyle(kb.type)]">
                      {{ getKBTypeLabel(kb.type) }}
                    </span>
                    <div>
                      <p class="font-bold text-slate-800 text-xs">{{ kb.title }}</p>
                      <p class="text-[10px] text-slate-400 italic">ID: {{ kb.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-slate-500 font-medium">
                  {{ getFlatDomains().find(fd => fd.id === kb.domain)?.label || '基础域' }}
                </td>
                <td class="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    :checked="(kb.permissions?.managePositions || []).includes(activePos?.id || '')"
                    @change="togglePosPermission(kb.id, 'managePositions', activePos?.id || '')"
                    class="rounded border-slate-300 text-blue-600 h-5 w-5 cursor-pointer focus:ring-blue-500 transition-transform hover:scale-110"
                  />
                </td>
                <td class="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    :checked="(kb.permissions?.accessQueryPositions || []).includes(activePos?.id || '')"
                    @change="togglePosPermission(kb.id, 'accessQueryPositions', activePos?.id || '')"
                    class="rounded border-slate-300 text-emerald-600 h-5 w-5 cursor-pointer focus:ring-emerald-500 transition-transform hover:scale-110"
                  />
                </td>
                <td class="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    :checked="(kb.permissions?.accessDownloadPositions || []).includes(activePos?.id || '')"
                    @change="togglePosPermission(kb.id, 'accessDownloadPositions', activePos?.id || '')"
                    class="rounded border-slate-300 text-rose-600 h-5 w-5 cursor-pointer focus:ring-rose-500 transition-transform hover:scale-110"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'group-audit'" class="space-y-6 animate-in fade-in duration-200">
      <Card class="p-6 bg-slate-50 border-slate-150 shadow-sm space-y-4">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users class="w-4 h-4 text-indigo-600 animate-pulse" />
              用户组/虚拟团队视角下的知识库管辖与通达权限编辑
            </h3>
            <p class="text-xs text-slate-400">
              一键式针对虚拟项目组/多维联合用户组进行安全管辖审计与授权。用户置身该组的所有成员可直接继承此组合并授权。
            </p>
          </div>

          <div class="w-full md:w-80 relative z-30">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
              选择研判审计用户组
            </label>
            <SearchableSelect
              v-model="selectedGroupId"
              :options="groups.map(g => ({
                id: g.id,
                label: g.name,
                sublabel: g.code,
                icon: Users
              }))"
              placeholder="选择用户组..."
              search-placeholder="输入用户组名称或代码检索..."
            />
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-250 text-xs space-y-1.5 shadow-sm flex flex-col md:flex-row md:items-center gap-y-6">
          <div class="flex-1 space-y-1">
            <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">用户组功能背景</span>
            <span class="font-semibold text-slate-700 block">{{ activeGroup?.description || '' }}</span>
          </div>
          <div class="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6 shrink-0 space-y-1">
            <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">系统业务代码</span>
            <span class="text-xs bg-indigo-50 text-indigo-850 border border-indigo-200 px-2 py-0.5 rounded font-extrabold tracking-wide inline-block">{{ activeGroup?.code || '' }}</span>
          </div>
        </div>
      </Card>

      <div class="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
        <div class="p-4 bg-slate-50/70 border-b border-slate-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-0.5">
            <span class="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Database class="w-3.5 h-3.5 text-blue-600" />
              用户组关联知识库授权矩阵
            </span>
            <p class="text-[10px] text-slate-400">检索到 {{ getAuditedKbs(auditSearchQuery).length }} 个知识库对本组配置的访问管控状态</p>
          </div>

          <div class="flex items-center gap-3 w-full md:w-auto">
            <div class="relative w-full md:w-85">
              <input
                v-model="auditSearchQuery"
                placeholder="检索知识库、ID、或分类存储域..."
                class="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
              <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <button v-if="auditSearchQuery" @click="auditSearchQuery = ''" class="absolute right-2 top-2 text-slate-400">
                <X class="w-3 h-3" />
              </button>
            </div>
            <Button @click="handleSaveGroupAudit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 text-xs gap-1.5 shadow-sm">
              <Save class="w-3.5 h-3.5" />
              保存用户组权限修改
            </Button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs whitespace-nowrap">
            <thead class="bg-slate-50 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-150">
              <tr>
                <th class="px-6 py-3 font-semibold text-slate-600">实体知识库</th>
                <th class="px-6 py-3 font-medium text-slate-600">分类领域</th>
                <th class="px-6 py-3 font-semibold text-center text-slate-600">👑 用户组管辖权限 (Manage)</th>
                <th class="px-6 py-3 font-semibold text-center text-slate-600">💬 用户组问答检索权 (Query)</th>
                <th class="px-6 py-3 font-semibold text-center text-slate-600">📥 用户组文档下载权 (Download)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="getAuditedKbs(auditSearchQuery).length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                  无匹配知识库
                </td>
              </tr>
              <tr v-for="kb in getAuditedKbs(auditSearchQuery)" :key="kb.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2.5">
                    <span :class="['px-2 py-0.5 rounded text-[9px] font-extrabold shadow-sm', getKBTypeBadgeStyle(kb.type)]">
                      {{ getKBTypeLabel(kb.type) }}
                    </span>
                    <div>
                      <p class="font-bold text-slate-800 text-xs">{{ kb.title }}</p>
                      <p class="text-[10px] text-slate-400 italic">ID: {{ kb.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-slate-500 font-medium">
                  {{ getFlatDomains().find(fd => fd.id === kb.domain)?.label || '基础域' }}
                </td>
                <td class="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    :checked="(kb.permissions?.manageUserGroups || []).includes(activeGroup?.id || '')"
                    @change="toggleGroupPermission(kb.id, 'manageUserGroups', activeGroup?.id || '')"
                    class="rounded border-slate-300 text-blue-600 h-5 w-5 cursor-pointer focus:ring-blue-500 transition-transform hover:scale-110"
                  />
                </td>
                <td class="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    :checked="(kb.permissions?.accessQueryUserGroups || []).includes(activeGroup?.id || '')"
                    @change="toggleGroupPermission(kb.id, 'accessQueryUserGroups', activeGroup?.id || '')"
                    class="rounded border-slate-300 text-emerald-600 h-5 w-5 cursor-pointer focus:ring-emerald-500 transition-transform hover:scale-110"
                  />
                </td>
                <td class="px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    :checked="(kb.permissions?.accessDownloadUserGroups || []).includes(activeGroup?.id || '')"
                    @change="toggleGroupPermission(kb.id, 'accessDownloadUserGroups', activeGroup?.id || '')"
                    class="rounded border-slate-300 text-rose-600 h-5 w-5 cursor-pointer focus:ring-rose-500 transition-transform hover:scale-110"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'audit'" class="space-y-6 animate-in fade-in duration-200">
      <Card class="p-6 bg-slate-50 border-slate-150 shadow-sm space-y-4">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <UserIcon class="w-4 h-4 text-slate-500 animate-bounce" />
              独立用户视角下的沙箱通达性及全矩阵审计
            </h3>
            <p class="text-xs text-slate-400">
              选择系统任一在册职员，可对该对象基于多维组织标签(部门、职位、团队)合成后的最终通达级别进行深度安全穿透核验。
            </p>
          </div>

          <div class="w-full md:w-96 space-y-1.5 relative">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              在册审核职员对象
            </label>
            <div class="relative">
              <input
                v-model="userSearchText"
                @focus="isUserListOpen = true"
                placeholder="输入姓名 / ID / 部门 / 岗位检索..."
                class="w-full pl-9 pr-10 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-850 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              />
              <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <button v-if="userSearchText" @click="userSearchText = ''; isUserListOpen = true" class="absolute right-8 top-2.5 text-slate-400 hover:text-slate-600 p-0.5">
                <X class="w-3 h-3" />
              </button>
              <button @click="isUserListOpen = !isUserListOpen" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-650">
                <ChevronDown class="w-4 h-4" />
              </button>
            </div>

            <div v-if="isUserListOpen">
              <div class="fixed inset-0 z-10" @click="isUserListOpen = false" />
              <div class="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100 py-1 font-sans">
                <div v-if="getFilteredUsers().length === 0" class="p-4 text-center text-slate-400 text-xs">
                  无匹配成员，可用其他代号检索。
                </div>
                <div
                  v-for="u in getFilteredUsers()"
                  :key="u.id"
                  @click="selectedUserId = u.id; userSearchText = u.name; isUserListOpen = false"
                  :class="[
                    'p-2.5 flex items-start gap-2.5 cursor-pointer text-xs transition-colors',
                    u.id === selectedUserId ? 'bg-blue-50/80 text-blue-800' : 'hover:bg-slate-50 text-slate-700'
                  ]"
                >
                  <div :class="[
                    'w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0',
                    u.id === selectedUserId ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-600'
                  ]">
                    {{ u.name.substring(0, 1) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 justify-between">
                      <span class="font-bold truncate">{{ u.name }}</span>
                      <span class="text-[10px] font-mono text-slate-400 truncate shrink-0">@{{ u.username }}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 flex flex-wrap items-center gap-1 mt-0.5">
                      <span class="font-medium inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 px-1 py-0.2 rounded text-[9px]">
                        🏢 {{ depts.find(d => d.id === u.departmentId)?.name || '无' }}
                      </span>
                      <span class="font-medium inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 px-1 py-0.2 rounded text-[9px]">
                        🎭 {{ positions.find(p => p.id === u.positionId)?.title || '无' }}
                      </span>
                    </div>
                  </div>
                  <Check v-if="u.id === selectedUserId" class="w-3.5 h-3.5 text-blue-600 shrink-0 self-center" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div v-if="currentUser" class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div class="flex items-center gap-3 md:border-r border-slate-100 pr-4">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm focus:ring-2 ring-blue-300">
            {{ currentUser.name.substring(0, 1) }}
          </div>
          <div>
            <h4 class="font-bold text-slate-800 text-xs">{{ currentUser.name }}</h4>
            <p class="text-[10px] text-slate-400 font-mono italic">{{ currentUser.username }}</p>
          </div>
        </div>

        <div class="space-y-0.5 md:border-r border-slate-100 pr-4">
          <span class="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">所属实体部门</span>
          <span class="text-xs font-semibold text-slate-700">{{ depts.find(d => d.id === currentUser?.departmentId)?.name || '无' }}</span>
        </div>

        <div class="space-y-0.5 md:border-r border-slate-100 pr-4">
          <span class="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">拥有的职务岗位</span>
          <span class="text-xs font-semibold text-slate-700">{{ positions.find(p => p.id === currentUser?.positionId)?.title || '无' }}</span>
        </div>

        <div class="space-y-1">
          <span class="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">绑定的用户组</span>
          <div class="flex flex-wrap gap-1">
            <template v-if="getUserGroups(currentUser).length > 0">
              <span v-for="g in getUserGroups(currentUser)" :key="g.id" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                👥 {{ g.name }}
              </span>
            </template>
            <span v-else class="text-xs text-slate-400 font-medium">暂无用户组</span>
          </div>
        </div>
      </div>

      <div class="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
        <div class="p-4 bg-slate-50/70 border-b border-slate-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-0.5">
            <span class="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Database class="w-3.5 h-3.5 text-blue-600" />
              用户权限穿透映射矩阵
            </span>
            <p class="text-[10px] text-slate-400">展示用户在各知识库上的实际权限状态及来源</p>
          </div>

          <div class="flex items-center gap-3 w-full md:w-auto">
            <div class="relative w-full md:w-80">
              <input
                v-model="auditSearchQuery"
                placeholder="检索知识库、ID、或存储域..."
                class="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
              <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <button v-if="auditSearchQuery" @click="auditSearchQuery = ''" class="absolute right-2 top-2 text-slate-400">
                <X class="w-3 h-3" />
              </button>
            </div>
            <Button @click="handleSaveAudit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 text-xs gap-1.5 shadow-sm">
              <Save class="w-3.5 h-3.5" />
              保存用户权限修改
            </Button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs whitespace-nowrap">
            <thead class="bg-slate-50 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-150">
              <tr>
                <th class="px-6 py-3 font-semibold text-slate-600">实体知识库</th>
                <th class="px-6 py-3 font-medium text-slate-600">分类领域</th>
                <th class="px-6 py-3 font-semibold text-center text-slate-600">👑 管辖权限 (Manage)</th>
                <th class="px-6 py-3 font-semibold text-center text-slate-600">💬 问答检索权 (Query)</th>
                <th class="px-6 py-3 font-semibold text-center text-slate-600">📥 文档下载权 (Download)</th>
                <th class="px-6 py-3 font-semibold text-left text-slate-600">权限来源说明</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="getAuditedKbs(auditSearchQuery).length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                  无匹配知识库
                </td>
              </tr>
              <tr v-for="kb in getAuditedKbs(auditSearchQuery)" :key="kb.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2.5">
                    <span :class="['px-2 py-0.5 rounded text-[9px] font-extrabold shadow-sm', getKBTypeBadgeStyle(kb.type)]">
                      {{ getKBTypeLabel(kb.type) }}
                    </span>
                    <div>
                      <p class="font-bold text-slate-800 text-xs">{{ kb.title }}</p>
                      <p class="text-[10px] text-slate-400 italic">ID: {{ kb.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-slate-500 font-medium">
                  {{ getFlatDomains().find(fd => fd.id === kb.domain)?.label || '基础域' }}
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="relative inline-block">
                    <input
                      type="checkbox"
                      :checked="getUserKBPermissionDetails(kb, selectedUserId)?.canManage || false"
                      :disabled="getUserKBPermissionDetails(kb, selectedUserId)?.isOverriddenManage || false"
                      @change="handleCheckboxToggle(kb.id, 'manage', getUserKBPermissionDetails(kb, selectedUserId)?.canManage || false)"
                      :class="['rounded h-5 w-5 cursor-pointer transition-transform hover:scale-110', getUserKBPermissionDetails(kb, selectedUserId)?.canManage ? 'text-blue-600 border-blue-600' : 'border-slate-300']"
                    />
                    <div v-if="getUserKBPermissionDetails(kb, selectedUserId)?.isOverriddenManage" class="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="relative inline-block">
                    <input
                      type="checkbox"
                      :checked="getUserKBPermissionDetails(kb, selectedUserId)?.canQuery || false"
                      :disabled="getUserKBPermissionDetails(kb, selectedUserId)?.isOverriddenQuery || false"
                      @change="handleCheckboxToggle(kb.id, 'query', getUserKBPermissionDetails(kb, selectedUserId)?.canQuery || false)"
                      :class="['rounded h-5 w-5 cursor-pointer transition-transform hover:scale-110', getUserKBPermissionDetails(kb, selectedUserId)?.canQuery ? 'text-emerald-600 border-emerald-600' : 'border-slate-300']"
                    />
                    <div v-if="getUserKBPermissionDetails(kb, selectedUserId)?.isOverriddenQuery" class="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="relative inline-block">
                    <input
                      type="checkbox"
                      :checked="getUserKBPermissionDetails(kb, selectedUserId)?.canDownload || false"
                      :disabled="getUserKBPermissionDetails(kb, selectedUserId)?.isOverriddenDownload || false"
                      @change="handleCheckboxToggle(kb.id, 'download', getUserKBPermissionDetails(kb, selectedUserId)?.canDownload || false)"
                      :class="['rounded h-5 w-5 cursor-pointer transition-transform hover:scale-110', getUserKBPermissionDetails(kb, selectedUserId)?.canDownload ? 'text-rose-600 border-rose-600' : 'border-slate-300']"
                    />
                    <div v-if="getUserKBPermissionDetails(kb, selectedUserId)?.isOverriddenDownload" class="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
                  </div>
                </td>
                <td class="px-6 py-4 max-w-[200px]">
                  <div class="space-y-1">
                    <p :class="['text-[10px] font-medium', getUserKBPermissionDetails(kb, selectedUserId)?.canManage ? 'text-blue-600' : 'text-slate-400']">
                      管理: {{ getUserKBPermissionDetails(kb, selectedUserId)?.manageSrc || '未知' }}
                    </p>
                    <p :class="['text-[10px] font-medium', getUserKBPermissionDetails(kb, selectedUserId)?.canQuery ? 'text-emerald-600' : 'text-slate-400']">
                      检索: {{ getUserKBPermissionDetails(kb, selectedUserId)?.querySrc || '未知' }}
                    </p>
                    <p :class="['text-[10px] font-medium', getUserKBPermissionDetails(kb, selectedUserId)?.canDownload ? 'text-rose-600' : 'text-slate-400']">
                      下载: {{ getUserKBPermissionDetails(kb, selectedUserId)?.downloadSrc || '未知' }}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>