<template>
  <div class="workspace-view layout-container">
    <PageHeader :title="t('menu.workspace')" :subtitle="t('workspacePage.subtitle')" :loading="loadingTree || loadingPreview">
      <template #actions>
        <t-button
          v-if="isAgentsWorkspacePath"
          variant="outline"
          @click="openAgentsGuideModal"
        >
          <template #icon><CircleHelp :size="16" /></template>
          {{ t('workspacePage.guide') }}
        </t-button>
        <t-button
          variant="outline"
          :disabled="activeSourceKey !== 'personal' || isReadonlyWorkspacePath"
          @click="openCreateDirectoryModal"
        >
          {{ t('workspacePage.newFolder') }}
        </t-button>
        <t-button
          theme="primary"
          :loading="uploadingFile"
          :disabled="activeSourceKey !== 'personal' || isReadonlyWorkspacePath"
          @click="openUploadFilePicker"
        >
          {{ t('workspacePage.uploadFile') }}
        </t-button>
      </template>
    </PageHeader>

    <input
      ref="uploadInputRef"
      class="upload-input"
      type="file"
      multiple
      @change="handleUploadInputChange"
    />

    <div class="workspace-shell" :class="{ 'is-sidebar-collapsed': sidebarCollapsed }">
      <div v-if="!sidebarCollapsed" class="workspace-sidebar-slot">
        <button
          type="button"
          class="sidebar-collapse-action"
          :aria-label="t('workspacePage.collapseSidebar')"
          @click="sidebarCollapsed = true"
        >
          <ChevronLeft :size="16" />
        </button>
        <WorkspaceSidebar
          :active-key="activeSourceKey"
          :current-path="currentPath"
          :databases="databases"
          :loading-databases="loadingDatabases"
          @select-personal="selectPersonalWorkspace"
          @select-database="selectDatabase"
          @select-path="selectWorkspacePath"
        />
      </div>
      <button
        v-else
        type="button"
        class="sidebar-expand-action"
        :aria-label="t('workspacePage.expandSidebar')"
        @click="sidebarCollapsed = false"
      >
        <ChevronRight :size="16" />
      </button>

      <main
        ref="workspaceMainRef"
        class="workspace-main"
        :class="{ 'is-inline-preview': showInlinePreview }"
        :style="workspaceMainStyle"
      >
        <template v-if="activeSourceKey === 'personal' || selectedDatabase">
          <WorkspaceFileList
            :entries="entries"
            :current-path="currentPath"
            :selected-path="selectedEntry?.path || ''"
            :selected-paths="selectedPaths"
            :deleting-paths="deletingPaths"
            :selection-mode="selectionMode"
            :loading="loadingTree"
            :readonly="isReadonlyWorkspacePath"
            :root-label="selectedDatabase?.name || t('workspacePage.rootLabel')"
            :breadcrumb-items="
              isKnowledgeSource ? knowledgeBreadcrumbItems : workspaceBreadcrumbItems
            "
            :pagination="isKnowledgeSource ? knowledgePagination : null"
            @select-entry="handleSelectEntry"
            @breadcrumb-click="handleListBreadcrumbClick"
            @update:selected-paths="selectedPaths = $event"
            @update:selection-mode="handleSelectionModeChange"
            @delete-selected="confirmDeleteEntries(selectedEntries)"
            @delete-entry="(entry) => confirmDeleteEntries([entry])"
            @download-entry="downloadEntry"
            @page-change="handleKnowledgePageChange"
          />
          <div
            v-if="showInlinePreview"
            class="workspace-preview-resizer"
            role="separator"
            :aria-label="t('workspacePage.resizePreview')"
            tabindex="0"
            @pointerdown="startPreviewResize"
          ></div>
          <WorkspacePreviewPane
            v-if="showInlinePreview"
            :file="previewFile"
            :file-path="selectedPreviewPath"
            :loading="loadingPreview"
            :editable="!isReadonlyWorkspacePath"
            :saving="savingPreviewFile"
            @close="closePreview"
            @save="handleSavePreviewFile"
          />
        </template>

        <div v-else class="workspace-placeholder">
          <LibraryBig :size="32" />
          <h2>{{ t('workspacePage.knowledgeTitle') }}</h2>
          <p>{{ t('workspacePage.knowledgePlaceholder') }}</p>
        </div>
      </main>
    </div>

    <t-dialog
      v-model:visible="createDirectoryModalVisible"
      attach="body"
      class="workspace-view-dialog"
      :header="t('workspacePage.createFolderTitle')"
      :confirm-btn="t('workspacePage.create')"
      :cancel-btn="t('workspacePage.cancel')"
      :confirm-loading="creatingDirectory"
      @confirm="createDirectory"
    >
      <t-input
        v-model="newDirectoryName"
        :placeholder="t('workspacePage.folderNamePlaceholder')"
        :disabled="creatingDirectory"
        @enter="createDirectory"
      />
    </t-dialog>

    <t-dialog
      v-model:visible="agentsGuideModalVisible"
      attach="body"
      class="workspace-view-dialog"
      :header="t('workspacePage.agentsGuideTitle')"
      :confirm-btn="t('workspacePage.agentsGuideOk')"
      :cancel-btn="null"
      @confirm="closeAgentsGuideModal"
    >
      <div class="agents-guide-content">
        <p>
          {{ t('workspacePage.agentsGuideP1') }}
        </p>
        <p>
          {{ t('workspacePage.agentsGuideP2') }}
        </p>

        <section class="agents-guide-section">
          <h3>{{ t('workspacePage.agentsGuideTipsTitle') }}</h3>
          <ul>
            <li>{{ t('workspacePage.agentsGuideTip1') }}</li>
            <li>{{ t('workspacePage.agentsGuideTip2') }}</li>
            <li>{{ t('workspacePage.agentsGuideTip3') }}</li>
            <li>{{ t('workspacePage.agentsGuideTip4') }}</li>
            <li>{{ t('workspacePage.agentsGuideTip5') }}</li>
            <li>{{ t('workspacePage.agentsGuideTip6') }}</li>
          </ul>
        </section>
      </div>
    </t-dialog>

    <t-dialog
      :visible="previewModalVisible && !useInlinePreview"
      attach="body"
      class="workspace-view-dialog"
      :header="null"
      :footer="false"
      :close-btn="false"
      width="880px"
      placement="center"
      dialog-class-name="workspace-file-preview-modal"
      @close="closePreview"
    >
      <WorkspaceKnowledgePreview
        v-if="isKnowledgePreviewFile"
        :knowledge-id="selectedEntry?.file_id"
        :file-type="knowledgePreviewFileType"
        :file-name="selectedPreviewPath"
        close-variant="close"
        @close="closePreview"
      />
      <AgentFilePreview
        v-else
        :file="previewFile"
        :filePath="selectedPreviewPath"
        :showClose="true"
        :showDownload="false"
        :showFullscreen="true"
        :full-height="true"
        :editable="activeSourceKey === 'personal'"
        :saving="savingPreviewFile"
        container-class="workspace-modal-preview-container"
        content-class="workspace-modal-preview-content"
        @close="closePreview"
        @save="handleSavePreviewFile"
      />
    </t-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next'
import { ChevronLeft, ChevronRight, CircleHelp, LibraryBig } from 'lucide-vue-next'
import PageHeader from '@harness/components/shared/PageHeader.vue'
import AgentFilePreview from '@harness/components/AgentFilePreview.vue'
import WorkspaceFileList from './components/WorkspaceFileList.vue'
import WorkspaceKnowledgePreview from './components/WorkspaceKnowledgePreview.vue'
import WorkspacePreviewPane from './components/WorkspacePreviewPane.vue'
import WorkspaceSidebar from './components/WorkspaceSidebar.vue'
import { databaseApi } from '@harness/apis/knowledge_api'
import { useUserStore } from '@harness/stores/user'
import {
  createWorkspaceDirectory,
  deleteWorkspacePath,
  downloadWorkspaceFile,
  downloadWorkspaceKnowledgeFile,
  getWorkspaceFileContent,
  getWorkspaceKnowledgeTree,
  getWorkspaceTree,
  saveWorkspaceFileContent,
  uploadWorkspaceFiles
} from '@/api/runtime/workspace'
import { normalizePreviewResponse, resolveKnowledgePreviewFileType } from '@harness/utils/file_preview'

const { t } = useI18n()
const userStore = useUserStore()

const activeSourceKey = ref('personal')
const currentPath = ref('/')
const knowledgeBreadcrumbItems = ref([])
const workspaceBreadcrumbItems = ref(null)
const threadTitleMap = ref({})
const entries = ref([])
const selectedEntry = ref(null)
const selectedPaths = ref([])
const selectionMode = ref(false)
const previewFile = ref(null)
const previewObjectUrl = ref('')
const previewModalVisible = ref(false)
const loadingTree = ref(false)
const loadingPreview = ref(false)
const savingPreviewFile = ref(false)
const loadingDatabases = ref(false)
const databases = ref([])
const selectedDatabase = ref(null)
const workspaceMainRef = ref(null)
const workspaceMainWidth = ref(0)
const createDirectoryModalVisible = ref(false)
const agentsGuideModalVisible = ref(false)
const newDirectoryName = ref('')
const creatingDirectory = ref(false)
const uploadingFile = ref(false)
const uploadInputRef = ref(null)
const deletingPaths = ref([])
const sidebarCollapsed = ref(false)
const previewWidthPercent = ref(50)
const previewRequestId = ref(0)
const INLINE_PREVIEW_MIN_WIDTH = 960
const MAX_WORKSPACE_UPLOAD_FILES = 50
const AGENTS_WORKSPACE_PATH = '/agents'
const CHATS_WORKSPACE_PATH = '/agents/chats'
const chatsBreadcrumbLabel = computed(() => t('workspacePage.chatsLabel'))
const getWorkspaceFolderLabel = (segment, path) => {
  if (path === CHATS_WORKSPACE_PATH) return chatsBreadcrumbLabel.value
  return threadTitleMap.value[segment] || segment
}
const knowledgeFileBrowser = reactive({
  parentId: null,
  pathPrefix: '',
  page: 1,
  pageSize: 100,
  total: 0,
  hasMore: false
})

const useInlinePreview = computed(() => workspaceMainWidth.value >= INLINE_PREVIEW_MIN_WIDTH)
const isKnowledgeSource = computed(() => activeSourceKey.value.startsWith('database:'))
const comparablePath = (path) => String(path || '/').replace(/\/$/, '') || '/'
const isSameOrChildPath = (path, targetPath) => {
  const normalizedPath = comparablePath(path)
  const normalizedTargetPath = comparablePath(targetPath)
  return (
    normalizedPath === normalizedTargetPath || normalizedPath.startsWith(`${normalizedTargetPath}/`)
  )
}
const isAgentsWorkspacePath = computed(
  () =>
    activeSourceKey.value === 'personal' &&
    isSameOrChildPath(currentPath.value, AGENTS_WORKSPACE_PATH)
)
const isReadonlyWorkspacePath = computed(
  () => isKnowledgeSource.value || isSameOrChildPath(currentPath.value, CHATS_WORKSPACE_PATH)
)
const selectedPreviewPath = computed(() =>
  selectedEntry.value?.source === 'knowledge'
    ? selectedEntry.value.name || ''
    : selectedEntry.value?.path || ''
)
const isKnowledgePreviewFile = computed(
  () => selectedEntry.value?.source === 'knowledge' && Boolean(selectedEntry.value?.file_id)
)
const knowledgePreviewFileType = computed(() => resolveKnowledgePreviewFileType(selectedEntry.value))
const showInlinePreview = computed(() => useInlinePreview.value && Boolean(previewFile.value))
const workspaceMainStyle = computed(() => {
  if (!showInlinePreview.value) return {}
  const listWidthPercent = 100 - previewWidthPercent.value
  return {
    gridTemplateColumns: `minmax(0, ${listWidthPercent}%) 3px minmax(280px, ${previewWidthPercent.value}%)`
  }
})

const knowledgePagination = computed(() => ({
  current: knowledgeFileBrowser.page,
  pageSize: knowledgeFileBrowser.pageSize,
  total: knowledgeFileBrowser.total,
  showSizeChanger: true,
  pageSizeOptions: ['100', '300', '500']
}))

const selectedEntries = computed(() => {
  const selectedPathSet = new Set(selectedPaths.value)
  return entries.value.filter((entry) => selectedPathSet.has(entry.path))
})

const revokePreviewObjectUrl = () => {
  if (!previewObjectUrl.value) return
  window.URL.revokeObjectURL(previewObjectUrl.value)
  previewObjectUrl.value = ''
}

const normalizePreviewFile = async (entry, response) => {
  return normalizePreviewResponse(response, entry)
}

const buildPreviewLoadingFile = (entry, baseFile = entry) => ({
  ...baseFile,
  ...entry,
  content: 'Loading...',
  supported: true,
  previewType: 'text',
  message: '',
  previewUrl: ''
})

const buildPreviewErrorFile = (entry, error) => ({
  ...entry,
  content: `Error loading file: ${error?.message || 'unknown error'}`,
  supported: false,
  previewType: 'unsupported',
  message: error?.message || t('harness.chat.previewFailed'),
  previewUrl: ''
})

const startPreviewRequest = (entry, baseFile = entry) => {
  const requestId = previewRequestId.value + 1
  previewRequestId.value = requestId
  selectedEntry.value = entry
  revokePreviewObjectUrl()
  previewFile.value = buildPreviewLoadingFile(entry, baseFile)
  previewModalVisible.value = !useInlinePreview.value
  loadingPreview.value = true
  return requestId
}

const isCurrentPreviewEntry = (requestId, entry) => {
  if (previewRequestId.value !== requestId) return false
  if (entry.source === 'knowledge') {
    return selectedEntry.value?.file_id === entry.file_id
  }
  return selectedEntry.value?.path === entry.path
}

const applyPreviewFile = (requestId, entry, file) => {
  if (!isCurrentPreviewEntry(requestId, entry)) {
    if (file.previewUrl) {
      window.URL.revokeObjectURL(file.previewUrl)
    }
    return
  }

  if (file.previewUrl) {
    revokePreviewObjectUrl()
    previewObjectUrl.value = file.previewUrl
  }
  previewFile.value = file
}

const showPreviewError = (requestId, entry, error, logMessage, userMessage) => {
  if (!isCurrentPreviewEntry(requestId, entry)) return
  console.warn(logMessage, error)
  previewFile.value = buildPreviewErrorFile(entry, error)
  MessagePlugin.error(userMessage)
}

const finishPreviewRequest = (requestId) => {
  if (previewRequestId.value === requestId) {
    loadingPreview.value = false
  }
}

const loadWorkspacePreview = async (entry) => {
  const requestId = startPreviewRequest(entry)
  try {
    const response = await getWorkspaceFileContent(entry.path)
    if (!isCurrentPreviewEntry(requestId, entry)) return
    const file = await normalizePreviewFile(entry, response)
    applyPreviewFile(requestId, entry, file)
  } catch (error) {
    showPreviewError(
      requestId,
      entry,
      error,
      '加载文件预览失败:',
      t('workspacePage.loadPreviewFailed')
    )
  } finally {
    finishPreviewRequest(requestId)
  }
}

const loadKnowledgePreview = async (entry, baseFile = entry) => {
  const requestId = startPreviewRequest(entry, baseFile)
  try {
    applyPreviewFile(requestId, entry, {
      ...entry,
      supported: true,
      previewType: 'weknora',
      content: '',
      previewUrl: '',
      message: ''
    })
  } finally {
    finishPreviewRequest(requestId)
  }
}

const syncSelectedPaths = () => {
  const entryPathSet = new Set(entries.value.map((entry) => entry.path))
  selectedPaths.value = selectedPaths.value.filter((path) => entryPathSet.has(path))
}

const clearWorkspaceSelection = () => {
  selectedPaths.value = []
}

const handleSelectionModeChange = (enabled) => {
  selectionMode.value = enabled
  if (!enabled) {
    clearWorkspaceSelection()
  }
}

const loadWorkspaceEntries = async (path = '/') => {
  loadingTree.value = true
  try {
    const response = await getWorkspaceTree(path)
    entries.value = response.entries || []
    currentPath.value = path
    knowledgeBreadcrumbItems.value = []
    if (comparablePath(path) === CHATS_WORKSPACE_PATH) {
      threadTitleMap.value = Object.fromEntries(
        entries.value.filter((entry) => entry.title).map((entry) => [entry.name, entry.title])
      )
    }
    workspaceBreadcrumbItems.value = buildWorkspaceBreadcrumbItems()
    syncSelectedPaths()
    if (!selectedPaths.value.length) {
      selectionMode.value = false
    }
  } catch (error) {
    console.warn('加载工作区目录失败:', error)
    MessagePlugin.error(t('workspacePage.loadDirFailed'))
  } finally {
    loadingTree.value = false
  }
}

const buildWorkspaceBreadcrumbItems = () => {
  const segments = comparablePath(currentPath.value).split('/').filter(Boolean)
  if (!segments.length) return null
  return segments.reduce(
    (items, segment) => {
      const parentPath = items[items.length - 1].path
      const path = parentPath === '/' ? `/${segment}` : `${parentPath}/${segment}`
      const name = getWorkspaceFolderLabel(segment, path)
      items.push({ name, path })
      return items
    },
    [{ name: t('workspacePage.rootLabel'), path: '/' }]
  )
}

const loadKnowledgeEntries = async (
  database,
  {
    parentId = null,
    pathPrefix = '',
    page = 1,
    pageSize = knowledgeFileBrowser.pageSize,
    breadcrumbs = null
  } = {}
) => {
  if (!database?.kb_id) return

  loadingTree.value = true
  try {
    const response = await getWorkspaceKnowledgeTree(database.kb_id, {
      parentId,
      pathPrefix,
      page,
      pageSize
    })
    entries.value = response.entries || []
    knowledgeBreadcrumbItems.value = breadcrumbs || [
      {
        name: database.name || t('workspacePage.knowledgeFallback'),
        path: '/',
        parentId: null,
        pathPrefix: '',
        isVirtualFolder: false
      }
    ]
    currentPath.value = knowledgeBreadcrumbItems.value.at(-1)?.path || '/'
    Object.assign(knowledgeFileBrowser, {
      parentId: response.parent_id || parentId || null,
      pathPrefix: response.path_prefix || pathPrefix || '',
      page: response.page || page,
      pageSize: response.page_size || pageSize,
      total: response.total || 0,
      hasMore: Boolean(response.has_more)
    })
    syncSelectedPaths()
    if (!selectedPaths.value.length) {
      selectionMode.value = false
    }
  } catch (error) {
    console.warn('加载知识库目录失败:', error)
    entries.value = []
    MessagePlugin.error(error?.message || t('workspacePage.loadKnowledgeDirFailed'))
  } finally {
    loadingTree.value = false
  }
}

const loadDatabases = async () => {
  loadingDatabases.value = true
  try {
    const response = await databaseApi.getAccessibleDatabases()
    databases.value = (response?.databases || []).filter((database) => {
      return database?.supports_documents !== false
    })
  } catch (error) {
    console.warn('加载可访问知识库失败:', error)
    databases.value = []
  } finally {
    loadingDatabases.value = false
  }
}

const selectPersonalWorkspace = async () => {
  const wasKnowledgeSource = isKnowledgeSource.value
  activeSourceKey.value = 'personal'
  selectedDatabase.value = null
  knowledgeBreadcrumbItems.value = []
  closePreview()
  clearWorkspaceSelection()
  if (wasKnowledgeSource || currentPath.value !== '/' || !entries.value.length) {
    await loadWorkspaceEntries('/')
  }
}

const selectWorkspacePath = async (path) => {
  activeSourceKey.value = 'personal'
  selectedDatabase.value = null
  knowledgeBreadcrumbItems.value = []
  closePreview()
  clearWorkspaceSelection()
  await loadWorkspaceEntries(path)
}

const selectKnowledgeBreadcrumb = async (item, index) => {
  if (!selectedDatabase.value || !item) return
  closePreview()
  clearWorkspaceSelection()
  const breadcrumbs = knowledgeBreadcrumbItems.value.slice(0, index + 1)
  await loadKnowledgeEntries(selectedDatabase.value, {
    parentId: item.parentId || null,
    pathPrefix: item.pathPrefix || '',
    page: 1,
    breadcrumbs
  })
}

const handleListBreadcrumbClick = async ({ item, index }) => {
  if (isKnowledgeSource.value) {
    await selectKnowledgeBreadcrumb(item, index)
    return
  }
  await selectWorkspacePath(item?.path || '/')
}

const selectDatabase = async (database) => {
  if (database?.supports_documents === false) return
  closePreview()
  clearWorkspaceSelection()
  selectedDatabase.value = database
  activeSourceKey.value = `database:${database.kb_id}`
  await loadKnowledgeEntries(database)
}

const openKnowledgeDirectory = async (entry) => {
  closePreview()
  clearWorkspaceSelection()
  const parentPath = knowledgeBreadcrumbItems.value.at(-1)?.path || '/'
  const nextPath = parentPath === '/' ? `/${entry.name}` : `${parentPath}/${entry.name}`
  const currentBreadcrumb = knowledgeBreadcrumbItems.value.at(-1)
  const isVirtualFolder = Boolean(entry.is_virtual_folder)
  const nextBreadcrumb = {
    name: entry.name,
    path: nextPath,
    parentId: isVirtualFolder ? currentBreadcrumb?.parentId || null : entry.file_id,
    pathPrefix: isVirtualFolder ? entry.path_prefix || '' : '',
    isVirtualFolder
  }
  await loadKnowledgeEntries(selectedDatabase.value, {
    parentId: nextBreadcrumb.parentId,
    pathPrefix: nextBreadcrumb.pathPrefix,
    page: 1,
    breadcrumbs: [...knowledgeBreadcrumbItems.value, nextBreadcrumb]
  })
}

const handleKnowledgePageChange = async ({ page, pageSize }) => {
  if (!selectedDatabase.value || !isKnowledgeSource.value) return
  closePreview()
  clearWorkspaceSelection()
  const currentBreadcrumb = knowledgeBreadcrumbItems.value.at(-1)
  await loadKnowledgeEntries(selectedDatabase.value, {
    parentId: currentBreadcrumb?.parentId || null,
    pathPrefix: currentBreadcrumb?.pathPrefix || '',
    page,
    pageSize,
    breadcrumbs: [...knowledgeBreadcrumbItems.value]
  })
}

const openWorkspaceDirectory = async (entry) => {
  closePreview()
  clearWorkspaceSelection()
  await loadWorkspaceEntries(entry.path)
}

const handleSelectEntry = async (entry) => {
  if (entry.is_dir) {
    if (isKnowledgeSource.value) {
      await openKnowledgeDirectory(entry)
      return
    }
    await openWorkspaceDirectory(entry)
    return
  }

  if (isKnowledgeSource.value) {
    await loadKnowledgePreview(entry)
    return
  }

  await loadWorkspacePreview(entry)
}

const closePreview = () => {
  previewRequestId.value += 1
  previewModalVisible.value = false
  selectedEntry.value = null
  previewFile.value = null
  loadingPreview.value = false
  revokePreviewObjectUrl()
}

const handleSavePreviewFile = async (content) => {
  if (isReadonlyWorkspacePath.value) {
    MessagePlugin.warning(t('workspacePage.readonlyCannotSave'))
    return
  }
  if (!selectedEntry.value?.path || savingPreviewFile.value) return

  savingPreviewFile.value = true
  try {
    const response = await saveWorkspaceFileContent(selectedEntry.value.path, content)
    if (response.entry) {
      selectedEntry.value = response.entry
    }
    previewFile.value = {
      ...previewFile.value,
      content
    }
    await loadWorkspaceEntries(currentPath.value)
    MessagePlugin.success(t('workspacePage.saveSuccess'))
  } catch (error) {
    console.warn('保存工作区文件失败:', error)
    MessagePlugin.error(error?.message || t('workspacePage.saveFailed'))
  } finally {
    savingPreviewFile.value = false
  }
}

const openCreateDirectoryModal = () => {
  if (activeSourceKey.value !== 'personal' || isReadonlyWorkspacePath.value) return
  newDirectoryName.value = ''
  createDirectoryModalVisible.value = true
}

const openAgentsGuideModal = () => {
  agentsGuideModalVisible.value = true
}

const closeAgentsGuideModal = () => {
  agentsGuideModalVisible.value = false
}

const createDirectory = async () => {
  if (creatingDirectory.value) return false
  const directoryName = newDirectoryName.value.trim()
  if (!directoryName) {
    MessagePlugin.warning(t('workspacePage.folderNameRequired'))
    return false
  }

  creatingDirectory.value = true
  try {
    await createWorkspaceDirectory(currentPath.value, directoryName)
    await loadWorkspaceEntries(currentPath.value)
    createDirectoryModalVisible.value = false
    newDirectoryName.value = ''
    MessagePlugin.success(t('workspacePage.createFolderSuccess'))
  } catch (error) {
    console.warn('创建文件夹失败:', error)
    MessagePlugin.error(error?.message || t('workspacePage.createFolderFailed'))
    return false
  } finally {
    creatingDirectory.value = false
  }
}

const openUploadFilePicker = () => {
  if (activeSourceKey.value !== 'personal' || isReadonlyWorkspacePath.value || uploadingFile.value)
    return
  if (uploadInputRef.value) {
    uploadInputRef.value.value = ''
    uploadInputRef.value.click()
  }
}

const handleUploadInputChange = async (event) => {
  const files = Array.from(event.target?.files || [])
  if (!files.length || uploadingFile.value) return
  if (files.length > MAX_WORKSPACE_UPLOAD_FILES) {
    MessagePlugin.warning(t('workspacePage.uploadLimit', { count: MAX_WORKSPACE_UPLOAD_FILES }))
    event.target.value = ''
    return
  }

  uploadingFile.value = true
  try {
    await uploadWorkspaceFiles(currentPath.value, files)
    await loadWorkspaceEntries(currentPath.value)
    MessagePlugin.success(t('workspacePage.uploadSuccess', { count: files.length }))
  } catch (error) {
    console.warn('上传文件失败:', error)
    MessagePlugin.error(error?.message || t('workspacePage.uploadFailed'))
  } finally {
    uploadingFile.value = false
    event.target.value = ''
  }
}

const confirmDeleteEntries = (targetEntries) => {
  const validEntries = (targetEntries || []).filter(Boolean)
  if (!validEntries.length) return

  const isBatch = validEntries.length > 1
  const firstEntry = validEntries[0]
  const dialog = DialogPlugin.confirm({
    attach: 'body',
    header: isBatch
      ? t('workspacePage.confirmDeleteSelected', { count: validEntries.length })
      : firstEntry.is_dir
        ? t('harness.chat.panel.confirmDeleteFolder', { name: firstEntry.name })
        : t('harness.chat.panel.confirmDeleteFile', { name: firstEntry.name }),
    body:
      isBatch || firstEntry.is_dir
        ? t('harness.chat.panel.deleteFolderContent')
        : t('harness.chat.panel.deleteIrreversible'),
    confirmBtn: { content: t('harness.chat.delete'), theme: 'danger' },
    cancelBtn: t('harness.chat.cancel'),
    onConfirm: async () => {
      try {
        await deleteEntries(validEntries)
      } finally {
        dialog.hide()
      }
    },
  })
}

const deleteEntries = async (targetEntries) => {
  const paths = targetEntries.map((entry) => entry.path)
  deletingPaths.value = paths
  try {
    await Promise.all(paths.map((path) => deleteWorkspacePath(path)))
    if (
      selectedEntry.value &&
      paths.some((path) => isSameOrChildPath(selectedEntry.value.path, path))
    ) {
      closePreview()
    }
    clearWorkspaceSelection()
    await loadWorkspaceEntries(currentPath.value)
    MessagePlugin.success(
      paths.length > 1 ? t('workspacePage.deleteSelectedSuccess') : t('workspacePage.deleteSuccess')
    )
  } catch (error) {
    console.warn('删除工作区文件失败:', error)
    MessagePlugin.error(error?.message || t('workspacePage.deleteFailed'))
    await loadWorkspaceEntries(currentPath.value)
  } finally {
    deletingPaths.value = []
  }
}

const parseDownloadFilename = (contentDisposition) => {
  if (!contentDisposition) return ''

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch (error) {
      console.warn('解析 UTF-8 文件名失败:', error)
    }
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (asciiMatch && asciiMatch[1]) {
    return asciiMatch[1]
  }

  return ''
}

const downloadEntry = async (entry) => {
  if (!entry || entry.is_dir) return

  try {
    const response =
      entry.source === 'knowledge'
        ? await downloadWorkspaceKnowledgeFile(entry.kb_id, entry.file_id)
        : await downloadWorkspaceFile(entry.path)
    const blob = await response.blob()
    const contentDisposition =
      response.headers.get('Content-Disposition') || response.headers.get('content-disposition')
    const filename = parseDownloadFilename(contentDisposition) || entry.name || 'download'
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.warn('下载文件失败:', error)
    MessagePlugin.error(error?.message || t('harness.chat.downloadFailed'))
  }
}

let resizePointerId = null

const stopPreviewResize = () => {
  resizePointerId = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('pointermove', resizePreview)
  window.removeEventListener('pointerup', stopPreviewResize)
  window.removeEventListener('pointercancel', stopPreviewResize)
}

const resizePreview = (event) => {
  if (!workspaceMainRef.value || resizePointerId === null || event.pointerId !== resizePointerId)
    return
  const rect = workspaceMainRef.value.getBoundingClientRect()
  const relativeX = event.clientX - rect.left
  const nextPreviewPercent = Math.round(((rect.width - relativeX) / rect.width) * 100)
  previewWidthPercent.value = Math.min(70, Math.max(30, nextPreviewPercent))
}

const startPreviewResize = (event) => {
  if (!showInlinePreview.value) return
  resizePointerId = event.pointerId
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', resizePreview)
  window.addEventListener('pointerup', stopPreviewResize)
  window.addEventListener('pointercancel', stopPreviewResize)
}

let workspaceResizeObserver = null

onMounted(async () => {
  await Promise.all([loadWorkspaceEntries('/'), loadDatabases()])

  if (workspaceMainRef.value && typeof ResizeObserver !== 'undefined') {
    workspaceMainWidth.value = workspaceMainRef.value.clientWidth || 0
    workspaceResizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      workspaceMainWidth.value = entry.contentRect.width
    })
    workspaceResizeObserver.observe(workspaceMainRef.value)
  }
})

onUnmounted(() => {
  workspaceResizeObserver?.disconnect()
  workspaceResizeObserver = null
  stopPreviewResize()
  revokePreviewObjectUrl()
})

watch(useInlinePreview, (isInline, wasInline) => {
  if (!previewFile.value) {
    previewModalVisible.value = false
    return
  }

  if (isInline) {
    previewModalVisible.value = false
    return
  }

  if (wasInline) {
    closePreview()
  }
})
</script>

<style scoped lang="less">
.workspace-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--gray-900);
  background: var(--gray-25);
}

.upload-input {
  display: none;
}

.workspace-shell {
  position: relative;
  display: grid;
  grid-template-columns: 195px minmax(0, 1fr);
  flex: 1 1 auto;
  min-height: 0;
  background: var(--gray-0);
  overflow: hidden;

  &.is-sidebar-collapsed {
    grid-template-columns: minmax(0, 1fr);
  }
}

.workspace-sidebar-slot {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.workspace-sidebar-slot :deep(.workspace-sidebar) {
  height: 100%;
}

.sidebar-collapse-action,
.sidebar-expand-action {
  width: 26px;
  height: 26px;
  position: absolute;
  top: 50%;
  z-index: 4;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--gray-150);
  background: var(--gray-0);
  color: var(--gray-600);
  cursor: pointer;
  transform: translateY(-50%);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);

  &:hover {
    background: var(--main-20);
    color: var(--main-color);
  }
}

.sidebar-collapse-action {
  right: -13px;
  width: 26px;
  border-radius: 50%;
}

.sidebar-expand-action {
  left: 0;
  width: 22px;
  border-left: 0;
  border-radius: 0 12px 12px 0;
}

.workspace-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}

.workspace-preview-resizer {
  width: 2px;
  min-width: 2px;
  background: var(--gray-100);
  cursor: col-resize;

  &:hover {
    background: var(--gray-200);
  }
}

.workspace-placeholder {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 360px;
  padding: 32px;
  color: var(--gray-500);
  text-align: center;

  h2 {
    margin: 8px 0 0;
    color: var(--gray-900);
    font-size: 18px;
    font-weight: 600;
  }

  p {
    max-width: 360px;
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
  }
}

.agents-guide-content {
  color: var(--gray-700);
  font-size: 14px;
  line-height: 1.7;

  p {
    margin: 0 0 12px;
  }

  code {
    padding: 2px 5px;
    border-radius: 4px;
    background: var(--gray-50);
    color: var(--main-700);
    font-size: 13px;
  }
}

.agents-guide-section {
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid var(--gray-150);
  border-radius: 8px;
  background: var(--gray-10);

  h3 {
    margin: 0 0 10px;
    color: var(--gray-900);
    font-size: 14px;
    font-weight: 600;
  }

  ul {
    margin: 0;
    padding-left: 18px;
  }

  li + li {
    margin-top: 6px;
  }
}
</style>

<style lang="less">
.workspace-view,
.workspace-view-dialog {
  --page-padding: 22px;
  --main-800: #027218;
  --main-700: #038626;
  --main-600: #049b38;
  --main-500: #07c05f;
  --main-100: #b7ebc8;
  --main-20: #f7fcf8;
  --main-5: #fcfefd;
  --main-color: #07c05f;
  --shadow-1: rgba(0, 0, 0, 0.05);
  --gray-2000: #0c0d0d;
  --gray-1000: #151616;
  --gray-900: #1e1f1f;
  --gray-800: #323333;
  --gray-700: #4c4d4d;
  --gray-600: #697070;
  --gray-500: #979999;
  --gray-300: #d7d9d9;
  --gray-200: #e4e6e6;
  --gray-150: #eef0f0;
  --gray-100: #eff2f2;
  --gray-50: #f5f7f7;
  --gray-25: #f8fafa;
  --gray-10: #fbfcfc;
  --gray-0: #ffffff;
  --bg-sider: #fcfefd;
}

html[theme-mode="dark"] .workspace-view,
html[theme-mode="dark"] .workspace-view-dialog {
  --main-800: #07c05f;
  --main-700: #07c05f;
  --main-600: #06b04d;
  --main-500: #06b04d;
  --main-100: #015e0d;
  --main-20: #06110a;
  --main-5: var(--td-bg-color-container, #242424);
  --main-color: var(--td-brand-color, #06b04d);
  --shadow-1: rgba(255, 255, 255, 0.05);
  --gray-2000: var(--td-text-color-primary, rgba(255, 255, 255, 0.9));
  --gray-1000: var(--td-text-color-primary, rgba(255, 255, 255, 0.9));
  --gray-900: var(--td-text-color-primary, rgba(255, 255, 255, 0.9));
  --gray-800: var(--td-text-color-secondary, rgba(255, 255, 255, 0.55));
  --gray-700: var(--td-text-color-secondary, rgba(255, 255, 255, 0.55));
  --gray-600: var(--td-text-color-secondary, rgba(255, 255, 255, 0.55));
  --gray-500: var(--td-text-color-placeholder, rgba(255, 255, 255, 0.35));
  --gray-300: var(--td-component-border, #5e5e5e);
  --gray-200: var(--td-component-border, #5e5e5e);
  --gray-150: rgba(255, 255, 255, 0.06);
  --gray-100: rgba(255, 255, 255, 0.06);
  --gray-50: rgba(255, 255, 255, 0.06);
  --gray-25: var(--td-bg-color-page, #181818);
  --gray-10: var(--td-bg-color-page, #181818);
  --gray-0: var(--td-bg-color-page, #181818);
  --bg-sider: var(--td-bg-color-sidebar, #181818);
}

@media (min-width: 1440px) {
  .workspace-view {
    --page-padding: 30px;
  }
}

@media (max-width: 1199px) {
  .workspace-view {
    --page-padding: 18px;
  }
}

@media (max-width: 767px) {
  .workspace-view {
    --page-padding: 14px;
  }
}

.t-dialog.workspace-file-preview-modal {
  z-index: 1050;
  max-width: 92vw;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  .t-dialog__body {
    height: 82vh;
    max-height: 90vh;
    padding: 0;
    overflow: hidden;
  }

  .workspace-modal-preview-container {
    height: 100%;
    max-height: none;
  }

  .workspace-modal-preview-content {
    flex: 1 1 auto;
    max-height: none;
    min-height: 0;
  }

  .workspace-modal-preview-content .html-preview,
  .workspace-modal-preview-content .pdf-preview {
    display: block;
    height: 100%;
    min-height: 100%;
  }
}

html[theme-mode="dark"] .workspace-view .file-browser-header {
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

html[theme-mode="dark"] .workspace-view .file-browser-ant-table .ant-table-container,
html[theme-mode="dark"] .workspace-view .file-browser-ant-table .ant-table-content,
html[theme-mode="dark"] .workspace-view .file-browser-ant-table .ant-table-header,
html[theme-mode="dark"] .workspace-view .file-browser-ant-table .ant-table-body {
  border-color: transparent !important;
  box-shadow: none !important;
}

html[theme-mode="dark"] .workspace-view .file-browser-ant-table .ant-table-thead > tr > th::before {
  display: none;
}

html[theme-mode="dark"] .workspace-view .file-browser-ant-table .ant-table-thead > tr > th,
html[theme-mode="dark"] .workspace-view .file-browser-ant-table .ant-table-tbody > tr > td,
html[theme-mode="dark"] .workspace-view .file-browser-ant-table .ant-table-cell {
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
  box-shadow: none !important;
}

html[theme-mode="dark"] .workspace-view .file-browser-ant-table .ant-table-placeholder > td {
  border-bottom: none !important;
}

.workspace-view .ant-checkbox-inner {
  border-color: var(--td-brand-color, var(--main-color));
}

.workspace-view .ant-checkbox-wrapper:hover .ant-checkbox-inner,
.workspace-view .ant-checkbox:hover .ant-checkbox-inner,
.workspace-view .ant-checkbox-input:focus + .ant-checkbox-inner {
  border-color: var(--td-brand-color, var(--main-color)) !important;
}

.workspace-view .ant-checkbox-checked .ant-checkbox-inner,
.workspace-view .ant-checkbox-indeterminate .ant-checkbox-inner {
  background-color: var(--td-brand-color, var(--main-color)) !important;
  border-color: var(--td-brand-color, var(--main-color)) !important;
}

.workspace-view .ant-checkbox-checked::after {
  border-color: var(--td-brand-color, var(--main-color)) !important;
}

.workspace-view .ant-checkbox-indeterminate .ant-checkbox-inner::after {
  background-color: #fff !important;
}
</style>
