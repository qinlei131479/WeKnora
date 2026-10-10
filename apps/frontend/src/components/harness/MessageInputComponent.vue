<template>
  <div
    class="input-box"
    :class="[customClasses, { 'dragging-files': isDraggingFiles }]"
    :data-drop-label="t('harness.chat.dropToUpload')"
    @click="handleInputBoxClick"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="top-slot">
      <slot name="top"></slot>
    </div>

    <div v-if="selectedMentions.length" class="selected-tags-inline">
      <span
        v-for="item in selectedMentions"
        :key="mentionKey(item)"
        class="mention-chip"
        :class="getMentionChipClass(item)"
      >
        <span class="mention-chip__icon-wrap">
          <span class="mention-chip__icon">
            <t-icon :name="mentionItemIcon(item)" />
          </span>
        </span>
        <span class="mention-chip__name" :title="item.label">{{ item.label }}</span>
        <span
          class="mention-chip__remove"
          :aria-label="t('common.remove')"
          @click.stop="removeSelectedMention(item)"
        >×</span>
      </span>
    </div>

    <div
      ref="inputRef"
      class="user-input mention-editor"
      :class="{ 'is-empty': isEditorEmpty }"
      role="textbox"
      aria-multiline="true"
      :aria-label="inputPlaceholder"
      :contenteditable="disabled ? 'false' : 'true'"
      :data-placeholder="inputPlaceholder"
      @keydown="handleKeyPress"
      @keyup="handleKeyUp"
      @input="handleInput"
      @focus="focusInput"
      @click="handleEditorClick"
      @paste="handlePaste"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
    ></div>

    <div class="control-bar">
      <div class="expand-options" v-if="hasToolbarLeft">
        <slot name="actions-left"></slot>
        <t-tooltip v-if="imageUploadEnabled" placement="top" :content="t('chat.imageUploadTooltip')">
          <button
            type="button"
            class="toolbar-icon-btn"
            :class="{ active: imageCount > 0 }"
            :disabled="disabled"
            :aria-label="t('chat.imageUploadTooltip')"
            @click.stop="handleImageClick"
          >
            <svg width="18" height="18" viewBox="0 0 1024 1024" fill="currentColor">
              <path
                d="M896 128H128c-35.3 0-64 28.7-64 64v640c0 35.3 28.7 64 64 64h768c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64zM128 832V192h768l0.1 640H128z" />
              <path d="M352 448a96 96 0 1 0 0-192 96 96 0 0 0 0 192z" />
              <path d="M128 768l224-288 160 160 192-256L896 640v128H128z" />
            </svg>
            <span v-if="imageCount > 0" class="toolbar-count">{{ imageCount }}</span>
          </button>
        </t-tooltip>
        <t-tooltip
          v-if="fileUploadEnabled"
          placement="top"
          :content="attachmentCount > 0
            ? t('chat.attachmentWithCount', { count: attachmentCount })
            : t('chat.attachmentUploadTooltip')"
        >
          <button
            type="button"
            class="toolbar-icon-btn"
            :class="{ active: attachmentCount > 0 }"
            :disabled="disabled"
            :aria-label="t('chat.attachmentUploadTooltip')"
            @click.stop="handleAttachClick"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round">
              <path
                d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            <span v-if="attachmentCount > 0" class="toolbar-count">{{ attachmentCount }}</span>
          </button>
        </t-tooltip>
        <t-tooltip
          v-if="mentionEnabled"
          placement="top"
          :content="selectedMentions.length > 0
            ? t('input.knowledgeBaseWithCount', { count: selectedMentions.length })
            : t('input.knowledgeBase')"
        >
          <button
            ref="mentionButtonRef"
            type="button"
            class="toolbar-icon-btn"
            :class="{ active: mentionPopupVisible || selectedMentions.length > 0 }"
            :disabled="disabled"
            :aria-label="t('input.knowledgeBase')"
            @click.stop="openMentionPicker"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="3.5" stroke="currentColor" stroke-width="1.8" />
              <path
                d="M13.5 10V11.5C13.5 12.163 13.7634 12.7989 14.2322 13.2678C14.7011 13.7366 15.337 14 16 14C16.663 14 17.2989 13.7366 17.7678 13.2678C18.2366 12.7989 18.5 12.163 18.5 11.5V10C18.5 7.74566 17.6045 5.58365 16.0104 3.98959C14.4163 2.39553 12.2543 1.5 10 1.5C7.74566 1.5 5.58365 2.39553 3.98959 3.98959C2.39553 5.58365 1.5 7.74566 1.5 10C1.5 12.2543 2.39553 14.4163 3.98959 16.0104C5.58365 17.6045 7.74566 18.5 10 18.5H12"
                stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span v-if="selectedMentions.length > 0" class="toolbar-count">{{ selectedMentions.length }}</span>
          </button>
        </t-tooltip>
      </div>

      <div class="send-button-container">
        <slot name="actions-right"></slot>
        <t-tooltip v-if="isLoading" :content="t('input.stopGeneration')" placement="top">
          <button type="button" class="stop-button" @click="handleSendOrStop"></button>
        </t-tooltip>
        <button
          v-else
          type="button"
          class="send-button"
          :class="{ disabled: isSendDisabled }"
          :disabled="isSendDisabled"
          :aria-label="t('input.send')"
          @click="handleSendOrStop"
        >
          <img src="@/assets/img/sending-aircraft.svg" :alt="t('input.send')" />
        </button>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      multiple
      hidden
      @change="handleFileInputChange"
    />
    <input
      ref="imageInputRef"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      hidden
      @change="handleImageInputChange"
    />

    <Teleport to="body">
      <div v-if="mentionPopupVisible" class="kb-overlay" @click="closeMentionOverlay">
        <div
          ref="mentionDropdownRef"
          class="mention-menu"
          :style="mentionDropdownStyle"
          @click.stop
          @mousedown.prevent
        >
          <div class="mention-list">
            <template v-if="!mentionCurrentGroup && !mentionFlatMode">
              <button
                v-for="(group, index) in mentionGroupRows"
                :key="group.type"
                type="button"
                class="mention-group-entry"
                :class="{ active: index === mentionGroupActiveIndex }"
                @click.stop="enterMentionGroup(group.type)"
                @mouseenter="mentionGroupActiveIndex = index"
              >
                <span class="mention-group-entry__icon">
                  <t-icon :name="group.icon" />
                </span>
                <span class="mention-group-entry__label">{{ group.label }}</span>
                <span class="mention-group-entry__count">{{ group.count }}</span>
                <t-icon class="mention-group-entry__arrow" name="chevron-right" />
              </button>
              <div v-if="!mentionGroupRows.length" class="kb-empty">{{ t('harness.chat.mentionEmpty') }}</div>
            </template>
            <template v-else>
              <button
                v-if="!mentionFlatMode"
                type="button"
                class="mention-back-row"
                @click.stop="leaveMentionGroup"
              >
                <t-icon name="chevron-left" />
                <span>{{ currentMentionGroup?.label }}</span>
              </button>
              <div
                v-for="(item, index) in visibleMentionItems"
                :key="mentionKey(item)"
                class="mention-item"
                :class="{
                  active: index === mentionSelectedIndex,
                  picked: isMentionPicked(item)
                }"
                @click="toggleMention(item)"
                @mouseenter="mentionSelectedIndex = index"
              >
                <div class="icon-wrap">
                  <div class="icon" :class="item.type === 'skill' ? 'skill-icon' : 'kb-icon'">
                    <t-icon :name="mentionItemIcon(item)" />
                  </div>
                </div>
                <div class="item-main">
                  <span class="name">{{ item.label }}</span>
                </div>
              </div>
              <div v-if="!visibleMentionItems.length" class="kb-empty">{{ t('harness.chat.mentionEmpty') }}</div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="bottom-slot">
      <slot name="bottom"></slot>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  nextTick,
  watch,
  onBeforeUnmount,
  useSlots,
  h,
  render
} from 'vue'
import { buildMentionResourceItems } from '@/utils/harness/mention_resource_items'
import { getRootZoom, rectToCssPx, cssViewportSize } from '@/utils/zoom'
import { useI18n } from 'vue-i18n'
import {
  getMentionIconComponent,
  getMentionIconStyle,
  MENTION_ICON_SIZE,
  MENTION_ICON_STROKE_WIDTH
} from '@/utils/harness/mention_icon_utils'
import {
  buildMentionDisplayLabels,
  expandMentionDeletionRange,
  findActiveMentionQuery,
  formatMentionToken,
  getMentionDisplayLabel,
  parseMentionText,
  replaceRawRange
} from '@/utils/harness/mention_utils'

const { t } = useI18n()

// 点击外部关闭下拉框
const mentionDropdownRef = ref(null)
const mentionButtonRef = ref(null)
const mentionDropdownStyle = ref({})
const mentionPinned = ref(false)
const fileInputRef = ref(null)
const imageInputRef = ref(null)
const selectedMentions = ref([])
const mentionCurrentGroup = ref(null)
const mentionGroupActiveIndex = ref(0)
const mentionKey = (item) => `${item?.type || ''}:${item?.insertValue || item?.value || item?.label || ''}`
let mentionRepositionHandler = null

const closeMentionOverlay = () => {
  mentionPopupVisible.value = false
  mentionPinned.value = false
  mentionCurrentGroup.value = null
  mentionGroupActiveIndex.value = 0
}

const closeMentionPopup = (e) => {
  if (!mentionPopupVisible.value) return
  if (inputRef.value?.contains(e.target)) return
  if (mentionButtonRef.value?.contains(e.target)) return
  if (mentionDropdownRef.value?.contains(e.target)) return
  closeMentionOverlay()
}

const updateMentionDropdownPosition = () => {
  const anchor = mentionButtonRef.value
  if (!anchor) return

  const zoom = getRootZoom()
  const rect = rectToCssPx(anchor.getBoundingClientRect(), zoom)
  const { width: vw, height: vh } = cssViewportSize(zoom)
  const dropdownWidth = 220
  const offsetY = 8
  let left = Math.floor(rect.left)
  left = Math.max(16, Math.min(Math.max(16, vw - dropdownWidth - 16), left))

  const preferredDropdownHeight = 320
  const minDropdownHeight = 160
  const spaceBelow = vh - rect.bottom
  const spaceAbove = rect.top

  if (spaceBelow >= minDropdownHeight + offsetY) {
    mentionDropdownStyle.value = {
      position: 'fixed',
      width: `${dropdownWidth}px`,
      left: `${left}px`,
      top: `${Math.floor(rect.bottom + offsetY)}px`,
      maxHeight: `${Math.min(preferredDropdownHeight, spaceBelow - offsetY - 16)}px`,
      zIndex: '10001'
    }
    return
  }

  const availableHeight = spaceAbove - offsetY - 20
  mentionDropdownStyle.value = {
    position: 'fixed',
    width: `${dropdownWidth}px`,
    left: `${left}px`,
    bottom: `${vh - rect.top + offsetY}px`,
    maxHeight: `${availableHeight >= preferredDropdownHeight ? preferredDropdownHeight : Math.max(minDropdownHeight, availableHeight)}px`,
    zIndex: '10001'
  }
}

const inputRef = ref(null)
// 用于防抖的定时器
const debounceTimer = ref(null)
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  sendButtonDisabled: {
    type: Boolean,
    default: false
  },
  autoSize: {
    type: Object,
    default: () => ({ minRows: 2, maxRows: 6 })
  },
  sendIcon: {
    type: String,
    default: 'ArrowUpOutlined'
  },
  customClasses: {
    type: Object,
    default: () => ({})
  },
  mention: {
    type: Object,
    default: () => null
  },
  threadId: {
    type: String,
    default: ''
  },
  fileUploadEnabled: {
    type: Boolean,
    default: false
  },
  imageUploadEnabled: {
    type: Boolean,
    default: false
  },
  imageCount: {
    type: Number,
    default: 0
  },
  attachmentCount: {
    type: Number,
    default: 0
  },
  showOptionsLeft: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'send', 'keydown', 'paste-image', 'drop-files', 'attach'])
const slots = useSlots()
const inputPlaceholder = computed(() => props.placeholder || t('input.placeholder'))
const isSendDisabled = computed(() => {
  if (props.disabled) return true
  const hasExtras =
    selectedMentions.value.length > 0 || props.imageCount > 0 || props.attachmentCount > 0
  if (hasExtras) return false
  return props.sendButtonDisabled
})

// @ 提及功能是否启用
const mentionEnabled = computed(() => {
  return !!props.mention
})

const mentionDisplayLabels = computed(() => buildMentionDisplayLabels(props.mention || {}))
const mentionResourceItems = computed(() => buildMentionResourceItems(props.mention || {}))

watch(mentionResourceItems, (resources) => {
  const available = new Set(
    [...(resources.knowledgeBases || []), ...(resources.skills || [])].map((item) => mentionKey(item))
  )
  selectedMentions.value = selectedMentions.value.filter((item) => available.has(mentionKey(item)))
})

let lastRawSelectionRange = null
let lastSyncedEditorValue = props.modelValue || ''

const getStoredRawSelectionRange = () => {
  const length = getEditorRawValue().length
  if (!lastRawSelectionRange) {
    return { start: length, end: length, collapsed: true }
  }

  const start = Math.max(0, Math.min(lastRawSelectionRange.start, length))
  const end = Math.max(start, Math.min(lastRawSelectionRange.end, length))
  return { start, end, collapsed: start === end }
}

const rememberRawSelectionRange = (range) => {
  lastRawSelectionRange = { ...range }
  return range
}

const formatMentionPath = (path) => {
  if (!path) return ''
  let cleanPath = path.replace(/^\/?home\/gem\/user-data\/?/, '')
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1)
  }
  // 如果以 / 结尾，说明它是一个目录，我们先去掉末尾的 / 之后再算父目录
  let isDir = cleanPath.endsWith('/')
  let pathForParent = isDir ? cleanPath.substring(0, cleanPath.length - 1) : cleanPath

  const lastSlashIndex = pathForParent.lastIndexOf('/')
  if (lastSlashIndex === -1) {
    return ''
  }
  return pathForParent.substring(0, lastSlashIndex + 1)
}

const getMentionDescription = (description) => {
  const value = String(description || '').trim()
  if (!value || value === '暂无描述') return ''
  return value
}

// 高性能且安全的关键字切片高亮解析函数 (100% 防御 XSS，避开危险的 v-html)
const splitTextByQuery = (text, query) => {
  if (!text) return []
  if (!query) return [{ text, isMatch: false }]

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part) => ({
    text: part,
    isMatch: part.toLowerCase() === query.toLowerCase()
  }))
}

const isTextNode = (node) => node?.nodeType === Node.TEXT_NODE
const isElementNode = (node) => node?.nodeType === Node.ELEMENT_NODE
const isMentionNode = (node) => isElementNode(node) && node.dataset?.mentionRaw !== undefined
const isLineBreakNode = (node) => isElementNode(node) && node.tagName === 'BR'
const childIndex = (node) => Array.prototype.indexOf.call(node.parentNode?.childNodes || [], node)

const getRawNodeLength = (node) => {
  if (!node) return 0
  if (isTextNode(node)) return node.textContent?.length || 0
  if (isMentionNode(node)) return node.dataset.mentionRaw?.length || 0
  if (isLineBreakNode(node)) return 1
  return Array.from(node.childNodes || []).reduce(
    (total, child) => total + getRawNodeLength(child),
    0
  )
}

const serializeEditorNode = (node) => {
  if (!node) return ''
  if (isTextNode(node)) return node.textContent || ''
  if (isMentionNode(node)) return node.dataset.mentionRaw || ''
  if (isLineBreakNode(node)) return '\n'
  return Array.from(node.childNodes || [])
    .map((child) => serializeEditorNode(child))
    .join('')
}

const serializeEditorContent = () => serializeEditorNode(inputRef.value)
const getEditorRawValue = () => (inputRef.value ? serializeEditorContent() : inputValue.value)

const unmountEditorMentionIcons = () => {
  inputRef.value
    ?.querySelectorAll('.mention-ref-icon[data-vue-icon]')
    .forEach((container) => render(null, container))
}

const createEditorMentionElement = (segment) => {
  const token = document.createElement('span')
  token.className = `mention-ref-token mention-ref-${segment.type} mention-ref-editable`
  token.contentEditable = 'false'
  token.dataset.mentionRaw = segment.raw
  token.dataset.mentionType = segment.type
  token.dataset.mentionValue = segment.value
  token.title = segment.raw

  const icon = document.createElement('span')
  icon.className = 'mention-ref-icon'
  icon.dataset.vueIcon = 'true'
  if (segment.type === 'file') {
    render(
      h(FileTypeIcon, {
        name: segment.value,
        isDir: segment.value.endsWith('/'),
        size: MENTION_ICON_SIZE
      }),
      icon
    )
  } else {
    Object.assign(icon.style, getMentionIconStyle(segment.type, segment.value) || {})
    render(
      h(getMentionIconComponent(segment.type, segment.value), {
        size: MENTION_ICON_SIZE,
        strokeWidth: MENTION_ICON_STROKE_WIDTH
      }),
      icon
    )
  }
  token.appendChild(icon)

  const label = document.createElement('span')
  label.className = 'mention-ref-label'
  label.textContent = getMentionDisplayLabel(
    segment.type,
    segment.value,
    mentionDisplayLabels.value
  )
  token.appendChild(label)

  return token
}

const renderEditorContent = (raw = '') => {
  const editor = inputRef.value
  if (!editor) return

  unmountEditorMentionIcons()
  editor.replaceChildren()
  parseMentionText(raw).forEach((segment) => {
    editor.appendChild(
      segment.kind === 'text'
        ? document.createTextNode(segment.text)
        : createEditorMentionElement(segment)
    )
  })
  lastSyncedEditorValue = String(raw || '')
  syncEditorHasContent()
}

const isNodeInEditor = (node) => {
  const editor = inputRef.value
  if (!editor || !node) return false
  const element = isElementNode(node) ? node : node.parentNode
  return element === editor || editor.contains(element)
}

const getRawOffsetFromDomPoint = (container, offset) => {
  const editor = inputRef.value
  if (!editor || !isNodeInEditor(container)) return getEditorRawValue().length

  let rawOffset = 0
  let found = false

  const visit = (node) => {
    if (!node || found) return

    if (node === container) {
      if (isTextNode(node)) {
        rawOffset += Math.min(offset, node.textContent?.length || 0)
      } else if (isMentionNode(node)) {
        rawOffset += offset > 0 ? getRawNodeLength(node) : 0
      } else {
        const children = Array.from(node.childNodes || [])
        for (let index = 0; index < Math.min(offset, children.length); index++) {
          rawOffset += getRawNodeLength(children[index])
        }
      }
      found = true
      return
    }

    if (isTextNode(node) || isMentionNode(node) || isLineBreakNode(node)) {
      rawOffset += getRawNodeLength(node)
      return
    }

    for (const child of Array.from(node.childNodes || [])) {
      visit(child)
      if (found) return
    }
  }

  visit(editor)
  return rawOffset
}

const getRawSelectionRange = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !isNodeInEditor(selection.anchorNode)) {
    return getStoredRawSelectionRange()
  }

  const anchor = getRawOffsetFromDomPoint(selection.anchorNode, selection.anchorOffset)
  const focus = getRawOffsetFromDomPoint(selection.focusNode, selection.focusOffset)
  return rememberRawSelectionRange({
    start: Math.min(anchor, focus),
    end: Math.max(anchor, focus),
    collapsed: anchor === focus
  })
}

const getDomPointForRawOffset = (rawOffset) => {
  const editor = inputRef.value
  const offset = Math.max(0, Math.min(rawOffset, getEditorRawValue().length))
  let remaining = offset

  const pointBeforeNode = (node) => ({ node: node.parentNode || editor, offset: childIndex(node) })
  const pointAfterNode = (node) => ({
    node: node.parentNode || editor,
    offset: childIndex(node) + 1
  })

  const visit = (node) => {
    if (!node) return null

    if (isTextNode(node)) {
      const length = node.textContent?.length || 0
      if (remaining <= length) {
        return { node, offset: remaining }
      }
      remaining -= length
      return null
    }

    if (isMentionNode(node) || isLineBreakNode(node)) {
      const length = getRawNodeLength(node)
      if (remaining === 0) return pointBeforeNode(node)
      if (remaining <= length) return pointAfterNode(node)
      remaining -= length
      return null
    }

    for (const child of Array.from(node.childNodes || [])) {
      const point = visit(child)
      if (point) return point
    }

    return node === editor ? { node: editor, offset: editor.childNodes.length } : null
  }

  return visit(editor) || { node: editor, offset: editor?.childNodes.length || 0 }
}

const restoreEditorSelection = (start, end = start) => {
  const editor = inputRef.value
  const selection = window.getSelection()
  if (!editor || !selection) return

  const startPoint = getDomPointForRawOffset(start)
  const endPoint = getDomPointForRawOffset(end)
  const range = document.createRange()
  range.setStart(startPoint.node, startPoint.offset)
  range.setEnd(endPoint.node, endPoint.offset)
  selection.removeAllRanges()
  selection.addRange(range)
  rememberRawSelectionRange({ start, end, collapsed: start === end })
  editor.focus()
}

const updateRawValue = (value, caretStart, caretEnd = caretStart) => {
  renderEditorContent(value)
  emit('update:modelValue', value)
  nextTick(() => {
    restoreEditorSelection(caretStart, caretEnd)
    adjustTextareaHeight()
    if (mentionEnabled.value) {
      checkMentionTrigger()
    }
  })
}

const replaceCurrentRawSelection = (replacement) => {
  const currentValue = getEditorRawValue()
  const range = getRawSelectionRange()
  const nextValue = replaceRawRange(currentValue, range.start, range.end, replacement)
  const nextOffset = range.start + replacement.length
  updateRawValue(nextValue, nextOffset)
}

// 检测是否在 @ 触发位置
const checkMentionTrigger = () => {
  if (!inputRef.value || !mentionEnabled.value) return false

  const selectionRange = getRawSelectionRange()
  if (!selectionRange.collapsed) {
    mentionPopupVisible.value = false
    return false
  }

  const activeMention = findActiveMentionQuery(getEditorRawValue(), selectionRange.end)
  if (activeMention) {
    mentionPinned.value = false
    const sameQuery = mentionPopupVisible.value && mentionQuery.value === activeMention.query
    mentionQuery.value = activeMention.query
    mentionPopupVisible.value = true
    if (!sameQuery) {
      mentionSelectedIndex.value = 0
      updateMentionItems(mentionQuery.value)
    }
    return true
  }

  if (!mentionPinned.value) {
    mentionPopupVisible.value = false
  }
  return false
}

// 更新提及候选项
const updateMentionItems = (query = '') => {
  const normalizedQuery = String(query || '')

  if (!props.mention) {
    mentionItems.value = { files: [], knowledgeBases: [], mcps: [], skills: [], subagents: [] }
    return
  }

  const lowerQuery = normalizedQuery.toLowerCase()
  const filterItems = (list) =>
    list.filter((item) => {
      if (!lowerQuery) return true
      const searchTexts = [
        item.label,
        item.value,
        item.description,
        item.resourceId,
        item.tokenLabel,
        item.type
      ]
      return searchTexts.some((text) =>
        String(text || '')
          .toLowerCase()
          .includes(lowerQuery)
      )
    })

  const { knowledgeBases: knowledgeItems, skills: skillItems } = mentionResourceItems.value

  mentionItems.value = {
    files: [],
    knowledgeBases: filterItems(knowledgeItems),
    mcps: [],
    skills: filterItems(skillItems),
    subagents: []
  }
}

const mentionItemIcon = (item) => {
  if (item?.type === 'skill') return 'bookmark'
  if (item?.kbType === 'faq') return 'chat-bubble-help'
  return 'folder'
}

const getMentionChipClass = (item) => {
  if (item?.type === 'skill') return 'mention-chip--skill'
  if (item?.kbType === 'faq') return 'mention-chip--faq'
  return 'mention-chip--kb'
}

const mentionFlatMode = computed(() => String(mentionQuery.value || '').trim().length > 0)

const mentionGroupRows = computed(() => {
  const groups = []
  const kbCount = mentionItems.value.knowledgeBases.length
  const skillCount = mentionItems.value.skills.length
  if (kbCount) {
    groups.push({
      type: 'knowledge',
      label: t('input.knowledgeBase'),
      icon: 'folder',
      count: kbCount
    })
  }
  if (skillCount) {
    groups.push({
      type: 'skill',
      label: t('ext.tabs.skills'),
      icon: 'bookmark',
      count: skillCount
    })
  }
  return groups
})

const currentMentionGroup = computed(() =>
  mentionGroupRows.value.find((group) => group.type === mentionCurrentGroup.value)
)

const visibleMentionItems = computed(() => {
  if (mentionFlatMode.value) {
    return [...mentionItems.value.knowledgeBases, ...mentionItems.value.skills]
  }
  if (mentionCurrentGroup.value === 'skill') return mentionItems.value.skills
  if (mentionCurrentGroup.value === 'knowledge') return mentionItems.value.knowledgeBases
  return []
})

const isMentionPicked = (item) =>
  selectedMentions.value.some((selected) => mentionKey(selected) === mentionKey(item))

const enterMentionGroup = (type) => {
  mentionCurrentGroup.value = type
  mentionSelectedIndex.value = 0
}

const leaveMentionGroup = () => {
  const rowIndex = mentionGroupRows.value.findIndex((group) => group.type === mentionCurrentGroup.value)
  mentionGroupActiveIndex.value = Math.max(0, rowIndex)
  mentionCurrentGroup.value = null
}

const removeSelectedMention = (item) => {
  selectedMentions.value = selectedMentions.value.filter((selected) => mentionKey(selected) !== mentionKey(item))
}

const consumeActiveMentionQuery = () => {
  if (!inputRef.value) return
  const currentValue = getEditorRawValue()
  const selectionRange = getRawSelectionRange()
  const activeMention = findActiveMentionQuery(currentValue, selectionRange.end)
  if (!activeMention) return
  const nextValue = replaceRawRange(currentValue, activeMention.start, activeMention.end, '')
  updateRawValue(nextValue, activeMention.start)
  mentionQuery.value = ''
}

const toggleMention = (item) => {
  if (!item?.type || !(item.insertValue || item.value)) return
  if (isMentionPicked(item)) {
    removeSelectedMention(item)
  } else {
    selectedMentions.value = [...selectedMentions.value, item]
  }
  if (mentionFlatMode.value || findActiveMentionQuery(getEditorRawValue(), getRawSelectionRange().end)) {
    consumeActiveMentionQuery()
    if (!mentionPinned.value) closeMentionOverlay()
  }
}

const flushSelectedMentions = () => {
  if (!selectedMentions.value.length) return
  let raw = getEditorRawValue()
  const tokens = selectedMentions.value
    .map((item) => formatMentionToken(item.type, item.insertValue || item.value))
    .filter(Boolean)
  tokens.forEach((token) => {
    raw = raw.split(token).join('')
  })
  raw = raw.replace(/\s+/g, ' ').trim()
  const next = [tokens.join(' '), raw].filter(Boolean).join(' ')
  updateRawValue(next, next.length)
  selectedMentions.value = []
}

const scrollToItem = (index) => {
  nextTick(() => {
    const popup = mentionDropdownRef.value
    if (!popup) return
    const items = popup.querySelectorAll('.mention-item')
    items[index]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

const handleMentionArrow = (dir) => {
  if (!mentionCurrentGroup.value && !mentionFlatMode.value) {
    const total = mentionGroupRows.value.length
    if (!total) return
    mentionGroupActiveIndex.value = (mentionGroupActiveIndex.value + dir + total) % total
    return
  }
  const total = visibleMentionItems.value.length
  if (!total) return
  mentionSelectedIndex.value = (mentionSelectedIndex.value + dir + total) % total
  scrollToItem(mentionSelectedIndex.value)
}

const handleMentionEnter = () => {
  if (!mentionCurrentGroup.value && !mentionFlatMode.value) {
    const group = mentionGroupRows.value[mentionGroupActiveIndex.value]
    if (group) enterMentionGroup(group.type)
    return
  }
  const item = visibleMentionItems.value[mentionSelectedIndex.value]
  if (item) toggleMention(item)
}

const handleMentionNavigation = (e) => {
  if (!mentionPopupVisible.value) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    handleMentionArrow(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    handleMentionArrow(-1)
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault()
    handleMentionEnter()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    if (mentionCurrentGroup.value && !mentionFlatMode.value) {
      leaveMentionGroup()
      return
    }
    closeMentionOverlay()
  }
}

// 编辑区自身的字符状态：输入法组字期间 modelValue 不会更新（handleInput 提前返回），
// 只看 modelValue 会让占位文案压在后出现的组字字符上。
const editorHasContent = ref(false)

const syncEditorHasContent = () => {
  const editor = inputRef.value
  editorHasContent.value = Boolean(editor && String(editor.textContent || '').trim())
}

const isEditorEmpty = computed(
  () => !String(props.modelValue || '').trim() && !editorHasContent.value
)

const hasActionsLeft = computed(() => {
  const slot = slots['actions-left']
  if (!slot) return false
  const renderedNodes = slot()
  return Boolean(renderedNodes && renderedNodes.length)
})

const hasToolbarLeft = computed(
  () => hasActionsLeft.value || props.fileUploadEnabled || props.imageUploadEnabled || mentionEnabled.value
)

const handleFileInputChange = (event) => {
  const files = Array.from(event.target?.files || [])
  event.target.value = ''
  if (files.length) emit('attach', files)
}

const handleAttachClick = () => {
  if (props.disabled) return
  fileInputRef.value?.click()
}

const handleImageClick = () => {
  if (props.disabled) return
  imageInputRef.value?.click()
}

const handleImageInputChange = (event) => {
  const file = event.target?.files?.[0]
  event.target.value = ''
  if (file) emit('paste-image', file)
}

const openMentionPicker = () => {
  if (props.disabled || !mentionEnabled.value) return
  const nextOpen = !mentionPopupVisible.value
  mentionPinned.value = nextOpen
  mentionPopupVisible.value = nextOpen
  mentionCurrentGroup.value = null
  if (nextOpen) {
    mentionQuery.value = ''
    mentionSelectedIndex.value = 0
    mentionGroupActiveIndex.value = 0
    updateMentionItems('')
    nextTick(() => {
      updateMentionDropdownPosition()
    })
  }
}

// 创建本地引用以进行双向绑定
const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isDraggingFiles = ref(false)

const hasTransferFiles = (dataTransfer) =>
  Array.from(dataTransfer?.types || []).some((type) => type === 'Files')

const canAcceptUploadFiles = () => props.fileUploadEnabled && !props.disabled && !props.isLoading

const getImageFileFromClipboard = (clipboardData) => {
  const items = Array.from(clipboardData?.items || [])
  for (const item of items) {
    if (item.kind === 'file' && item.type?.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) return file
    }
  }

  return Array.from(clipboardData?.files || []).find((file) => file.type?.startsWith('image/'))
}

const handleMentionDeletion = (e) => {
  if (e.key !== 'Backspace' && e.key !== 'Delete') return false

  const currentValue = getEditorRawValue()
  const selectionRange = getRawSelectionRange()
  const expandedRange = expandMentionDeletionRange(
    currentValue,
    selectionRange.start,
    selectionRange.end,
    e.key === 'Delete' ? 'forward' : 'backward'
  )

  if (!expandedRange) return false

  e.preventDefault()
  const nextValue = replaceRawRange(currentValue, expandedRange.start, expandedRange.end, '')
  mentionPopupVisible.value = false
  updateRawValue(nextValue, expandedRange.start)
  return true
}

// 处理键盘事件
const handleKeyPress = (e) => {
  // @ 提及键盘导航
  if (mentionPopupVisible.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
      handleMentionNavigation(e)
      return
    }
  }

  if (handleMentionDeletion(e)) {
    return
  }

  if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault()
    replaceCurrentRawSelection('\n')
    return
  }

  emit('keydown', e)
}

const shouldCheckMentionOnKeyUp = (e) => {
  if (!e) return false
  if (e.key.length === 1) return true
  return e.key === 'Backspace' || e.key === 'Delete'
}

// 检测 @ 触发
const handleKeyUp = (e) => {
  if (!mentionEnabled.value || isComposing.value || !shouldCheckMentionOnKeyUp(e)) return
  nextTick(() => {
    checkMentionTrigger()
  })
}

// 处理输入事件
const handleInput = () => {
  // 组字期间也要同步，保证占位文案在出现首个字符时立刻隐藏
  syncEditorHasContent()

  if (isComposing.value) return

  if (inputRef.value && !inputRef.value.querySelector('.mention-ref-token')) {
    const text = inputRef.value.textContent || ''
    if (!text.trim()) {
      inputRef.value.replaceChildren()
    }
  }

  const value = serializeEditorContent()
  lastSyncedEditorValue = value
  emit('update:modelValue', value)
  adjustTextareaHeight()

  if (mentionEnabled.value) {
    nextTick(() => {
      checkMentionTrigger()
    })
  }
}

const handlePaste = (e) => {
  if (props.disabled) return

  const imageFile = canAcceptUploadFiles() ? getImageFileFromClipboard(e.clipboardData) : null
  if (imageFile) {
    e.preventDefault()
    emit('paste-image', imageFile)
    return
  }

  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  if (!text) return
  replaceCurrentRawSelection(text)
}

const handleDragEnter = (e) => {
  if (!hasTransferFiles(e.dataTransfer)) return
  e.preventDefault()
  if (!canAcceptUploadFiles()) return
  isDraggingFiles.value = true
}

const handleDragOver = (e) => {
  if (!hasTransferFiles(e.dataTransfer)) return
  e.preventDefault()
  e.dataTransfer.dropEffect = canAcceptUploadFiles() ? 'copy' : 'none'
  if (!canAcceptUploadFiles()) return
  isDraggingFiles.value = true
}

const handleDragLeave = (e) => {
  if (e.currentTarget?.contains(e.relatedTarget)) return
  isDraggingFiles.value = false
}

const handleDrop = (e) => {
  if (!hasTransferFiles(e.dataTransfer)) return
  e.preventDefault()
  isDraggingFiles.value = false
  if (!canAcceptUploadFiles()) return
  const files = Array.from(e.dataTransfer?.files || [])
  if (!files.length) return
  e.stopPropagation()

  emit('drop-files', files)
}

const CHAT_FILE_DROP_EVENT = 'weknora:chat-file-drop'

// 全局拖拽兜底事件仅接收输入区外部的文件，输入区自身的事件已就地处理。
const handleWindowChatFileDrop = (event) => {
  const files = event.detail?.files
  if (!files?.length || !canAcceptUploadFiles()) return
  emit('drop-files', files)
}

const handleCompositionStart = () => {
  isComposing.value = true
  // 组字开始即视为有内容：部分浏览器组字期间不派发 input，只靠 DOM 文本会让占位文案残留
  editorHasContent.value = true
}

const handleCompositionEnd = () => {
  isComposing.value = false
  handleInput()
}

// 处理发送按钮点击
const handleSendOrStop = () => {
  if (!props.isLoading) flushSelectedMentions()
  emit('send')
}

// @ 提及功能状态
const mentionPopupVisible = ref(false)
const mentionQuery = ref('')
const mentionItems = ref({ files: [], knowledgeBases: [], mcps: [], skills: [], subagents: [] })
const mentionSelectedIndex = ref(0)
const isComposing = ref(false)

watch(mentionPopupVisible, (visible) => {
  if (mentionRepositionHandler) {
    window.removeEventListener('resize', mentionRepositionHandler)
    window.removeEventListener('scroll', mentionRepositionHandler, { capture: true })
    mentionRepositionHandler = null
  }
  if (!visible) return
  nextTick(() => {
    updateMentionDropdownPosition()
    requestAnimationFrame(() => updateMentionDropdownPosition())
  })
  mentionRepositionHandler = () => updateMentionDropdownPosition()
  window.addEventListener('resize', mentionRepositionHandler, { passive: true })
  window.addEventListener('scroll', mentionRepositionHandler, { passive: true, capture: true })
})

const adjustTextareaHeight = () => {
  if (!inputRef.value) {
    return
  }

  const textarea = inputRef.value
  textarea.style.height = 'auto'
  const nextHeight = Math.min(200, Math.max(120, textarea.scrollHeight))
  textarea.style.height = `${nextHeight}px`
}

// 聚焦输入框
const focusInput = () => {
  if (inputRef.value && !props.disabled) {
    inputRef.value.focus()
    // 聚焦回来时，如果开启了提及，自动检测当前光标位置是否处于 @提及 范围，是则重新升起弹框
    if (mentionEnabled.value) {
      nextTick(() => {
        checkMentionTrigger()
      })
    }
  }
}

const handleInputBoxClick = (event) => {
  if (event.target instanceof Element) {
    const interactiveTarget = event.target.closest(
      'button, a, input, textarea, select, [role="button"], [role="menuitem"], [role="switch"]'
    )
    if (interactiveTarget) return
  }
  focusInput()
}

// 处理输入框点击事件，自适应检测光标是否落入 @提及 范围内以唤醒或更新弹窗
const handleEditorClick = () => {
  if (mentionEnabled.value) {
    nextTick(() => {
      checkMentionTrigger()
    })
  }
}

// 监听输入值变化
watch(inputValue, (value) => {
  if (value !== lastSyncedEditorValue) {
    renderEditorContent(value || '')
  }

  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  debounceTimer.value = setTimeout(() => {
    nextTick(() => {
      adjustTextareaHeight()
    })
  }, 100)
})

onMounted(() => {
  document.addEventListener('click', closeMentionPopup)
  window.addEventListener(CHAT_FILE_DROP_EVENT, handleWindowChatFileDrop)
  nextTick(() => {
    if (inputRef.value) {
      renderEditorContent(inputValue.value || '')
      adjustTextareaHeight()
      inputRef.value.focus()
    }
  })
})

// 组件卸载时清除定时器和事件监听器
onBeforeUnmount(() => {
  unmountEditorMentionIcons()
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  isDraggingFiles.value = false
  document.removeEventListener('click', closeMentionPopup)
  window.removeEventListener(CHAT_FILE_DROP_EVENT, handleWindowChatFileDrop)
})

// 公开方法供父组件调用
defineExpose({
  focus: () => inputRef.value?.focus(),
  insertMention: toggleMention,
  flushSelectedMentions,
  closeOptions: () => {
    mentionPopupVisible.value = false
    mentionPinned.value = false
    mentionCurrentGroup.value = null
  },
  openMentionPicker,
  isSendDisabled
})
</script>

<style lang="less" scoped>
@import '@/components/css/chat-resource-chips.less';

.input-box {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0 auto;
  border: 1px solid var(--td-component-stroke, var(--gray-150));
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 8px 16px -4px rgba(0, 0, 0, 0.06);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: var(--td-bg-color-container, var(--gray-0));
  position: relative;

  .top-slot {
    display: flex;

    &:empty {
      display: none;
    }

    &:not(:empty) {
      padding: 10px 12px 0;
    }
  }

  .selected-tags-inline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-bottom: 1px solid var(--td-component-stroke, #dcdcdc);
    background: var(--td-bg-color-container, #fff);
    border-radius: 11px 11px 0 0;
  }

  .mention-chip {
    .chat-resource-chip-surface();

    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 26px;
    padding: 3px 7px 3px 6px;
    border-radius: var(--td-radius-medium, 6px);
    box-sizing: border-box;
    font-size: 12px;
    font-weight: 500;
    cursor: default;
    transition: background 0.15s, border-color 0.15s;
    line-height: 18px;

    &:hover {
      .chat-resource-chip-hover();
    }
  }

  .mention-chip__icon-wrap {
    display: inline-flex;
    width: 16px;
    height: 16px;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .mention-chip__icon {
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
  }

  .mention-chip__name {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: currentColor;
  }

  .mention-chip__remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    margin-left: 1px;
    border-radius: 50%;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    opacity: 0.5;
    color: currentColor;
    flex-shrink: 0;
  }

  .mention-chip:hover .mention-chip__remove {
    opacity: 0.85;
  }

  .mention-chip--kb {
    color: var(--td-text-color-primary);
  }

  .mention-chip--kb .mention-chip__icon-wrap {
    color: var(--td-brand-color, #07c05f);
  }

  .mention-chip--faq {
    color: var(--td-text-color-primary);
  }

  .mention-chip--faq .mention-chip__icon-wrap {
    color: var(--weknora-faq-color, #0052d9);
  }

  .mention-chip--skill {
    color: var(--td-text-color-primary);
  }

  .mention-chip--skill .mention-chip__icon-wrap {
    color: #7c3aed;
  }

  .expand-options {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
    flex-wrap: wrap;
  }

  .user-input {
    min-height: 120px;
  }

  .send-button-container {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-shrink: 0;
    margin-left: auto;
  }

  .bottom-slot:empty {
    display: none;
  }

  &:focus-within {
    border-color: var(--td-brand-color, var(--main-color));
    background: var(--td-bg-color-container, var(--gray-0));
  }

  &.dragging-files {
    border-color: var(--td-brand-color, var(--main-color));
    background: var(--td-bg-color-container, var(--gray-0));

    &::after {
      content: attr(data-drop-label);
      position: absolute;
      inset: 6px;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed var(--main-color);
      border-radius: 10px;
      color: var(--main-700);
      background: color-mix(in srgb, var(--gray-0) 88%, transparent);
      font-size: 13px;
      font-weight: 600;
      pointer-events: none;
    }
  }
}

.control-bar {
  position: absolute;
  bottom: 12px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  max-height: 56px;
  z-index: 10;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    var(--td-bg-color-container, #fff) 40%,
    var(--td-bg-color-container, #fff) 100%
  );
  pointer-events: auto;
  padding-top: 8px;
}

.expand-options {
  display: flex;
  align-items: center;
}

.user-input {
  width: 100%;
  padding: 16px 16px 56px;
  background-color: transparent;
  border: none;
  margin: 0;
  color: var(--td-text-color-primary, var(--gray-1000));
  font-size: 16px;
  outline: none;
  resize: none;
  line-height: 24px;
  font-family: var(--app-font-family, inherit);
  min-height: 120px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  cursor: text;
  box-sizing: border-box;

  &:focus {
    outline: none;
    box-shadow: none;
  }

  &::placeholder {
    color: var(--td-text-color-placeholder, #00000066);
  }

  &.mention-editor {
    position: relative;

    &.is-empty::before,
    &:empty::before {
      content: attr(data-placeholder);
      position: absolute;
      left: 16px;
      top: 16px;
      color: var(--td-text-color-placeholder, #00000066);
      pointer-events: none;
    }
  }

  &[contenteditable='false'] {
    cursor: not-allowed;
  }

  :deep(.mention-ref-token) {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    max-width: min(100%, 360px);
    color: var(--main-700);
    line-height: normal;
    vertical-align: baseline;
    white-space: nowrap;
    user-select: all;
  }

  :deep(.mention-ref-icon) {
    position: relative;
    top: 2px;
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    font-size: 13px;
    line-height: 1;
    margin-left: 4px;
  }

  :deep(.mention-ref-icon svg) {
    display: block;
  }

  :deep(.mention-ref-label) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: normal;
    font-weight: 500;
  }
}

.send-button-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--td-text-color-secondary, #666);
  padding: 0;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  border: none;
  background: transparent;
  flex-shrink: 0;
  position: relative;

  &:hover:not(:disabled) {
    background: var(--td-bg-color-secondarycontainer-hover, #e6e6e6);
    color: var(--td-text-color-primary, #333);
  }

  &.active {
    background: rgba(16, 185, 129, 0.1);
    color: #07c05f;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.toolbar-count {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  background: var(--td-brand-color);
  color: var(--td-text-color-anti, #fff);
  font-size: 9px;
  font-weight: 600;
  line-height: 15px;
  border: 2px solid var(--td-bg-color-container);
  border-radius: var(--td-radius-round, 999px);
  box-sizing: content-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

// Popover 选项样式
.popover-options {
  min-width: 160px;
  max-width: 200px;
  padding: 4px;

  .no-options {
    color: var(--gray-500);
    font-size: 12px;
    text-align: center;
    padding: 12px 8px;
  }

  :deep(.opt-item) {
    border-radius: 8px;
    padding: 6px 10px;
    cursor: pointer;
    font-size: 12px;
    color: var(--gray-700);
    transition: all 0.2s ease;
    margin: 2px;
    display: inline-block;

    &:hover {
      background-color: var(--main-10);
      color: var(--main-600);
    }

    &.active {
      color: var(--main-600);
      background-color: var(--main-10);
    }
  }
}

.send-button {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: var(--td-brand-color);
  border-radius: 6px;
  border: none;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background-color: var(--td-brand-color-active);
  }

  &:disabled,
  &.disabled {
    cursor: not-allowed;
    background-color: var(--td-success-color-light, rgba(7, 192, 95, 0.35));
    opacity: 1;
    box-shadow: none;
  }

  img {
    width: 16px;
    height: 16px;
  }
}

.stop-button {
  width: 28px;
  height: 28px;
  padding: 0;
  background: rgba(16, 185, 129, 0.08);
  border: 1.5px solid rgba(16, 185, 129, 0.2);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(16, 185, 129, 0.12);
    border-color: var(--td-brand-color);
  }

  &::before {
    content: '';
    width: 12px;
    height: 12px;
    background: var(--td-brand-color);
    border-radius: 50%;
    display: block;
    animation: stopBtnPulse 1.5s ease-in-out infinite;
  }
}

@keyframes stopBtnPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.75);
    opacity: 0.6;
  }
}

@media (max-width: 520px) {
  .input-box {
    border-radius: 12px;
  }
}

.kb-overlay,
.kb-overlay *,
.kb-overlay *::before,
.kb-overlay *::after {
  box-sizing: border-box;
}

.kb-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: transparent;
  touch-action: none;
}

.mention-menu,
.kb-dropdown {
  position: fixed !important;
  background: var(--td-bg-color-container, #fff);
  border: 1px solid var(--td-component-stroke, #e7e9eb);
  border-radius: var(--td-radius-extraLarge, 12px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: mentionFadeIn 0.15s ease-out;
  z-index: 10000;
  margin: 0;
  transform-origin: top left;
  display: flex;
  flex-direction: column;
  width: 220px;
  max-height: 388px;
}

@keyframes mentionFadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.kb-search {
  padding: 8px 10px;
  border-bottom: 0.5px solid var(--td-component-stroke);
}

.kb-search-input {
  width: 100%;
  padding: 6px 10px;
  font-size: 12px;
  border: 0.5px solid var(--td-component-stroke);
  border-radius: 6px;
  background: var(--td-bg-color-secondarycontainer);
  outline: none;
}

.kb-search-input:focus {
  border-color: var(--td-success-color);
  background: var(--td-bg-color-container);
}

.mention-list,
.kb-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 0;
  overscroll-behavior: contain;
}

.mention-group-entry,
.mention-back-row {
  width: calc(100% - 12px);
  min-height: 32px;
  margin: 1px 6px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--td-radius-medium, 6px);
  background: transparent;
  color: var(--td-text-color-primary, #333);
  font-family: var(--app-font-family);
  font-size: var(--td-font-size-body-medium, 14px);
  font-weight: 400;
  line-height: 20px;
  cursor: pointer;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mention-group-entry:hover,
.mention-group-entry.active,
.mention-back-row:hover {
  background: var(--td-bg-color-secondarycontainer, #f3f3f3);
}

.mention-group-entry__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--td-text-color-secondary, #666);
  font-size: 16px;
}

.mention-group-entry__label,
.mention-back-row span {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mention-group-entry__count {
  flex-shrink: 0;
  min-width: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--td-bg-color-secondarycontainer, #f3f3f3);
  color: var(--td-text-color-placeholder, #999);
  font-size: var(--td-font-size-mark-small, 12px);
  line-height: 18px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.mention-group-entry__arrow {
  flex-shrink: 0;
  color: var(--td-text-color-placeholder, #999);
  font-size: 16px;
}

.mention-back-row {
  min-height: 30px;
  margin-bottom: 4px;
  color: var(--td-text-color-secondary, #666);
  border-bottom: 1px solid var(--td-component-stroke, #f0f0f0);
  border-radius: 0;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 4px 8px;
  margin: 1px 6px;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: var(--td-radius-medium, 6px);
  color: var(--td-text-color-primary, #333);
  font-size: var(--td-font-size-body-medium, 14px);
}

.mention-item:hover,
.mention-item.active {
  background: var(--td-bg-color-secondarycontainer, #f3f3f3);
}

.mention-item.picked {
  background: var(--td-brand-color-light, rgba(7, 192, 95, 0.12));
  color: var(--td-text-color-primary, #333);
}

.mention-item .icon-wrap,
.mention-item .icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.mention-item .kb-icon {
  color: var(--td-brand-color, #07c05f);
}

.mention-item .skill-icon {
  color: #7c3aed;
}

.mention-item .item-main {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
}

.mention-item .name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mention-group:not(:last-child) {
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 0.5px solid var(--td-component-stroke);
}

.mention-group-title {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  padding: 8px 8px 4px;
  font-weight: 600;
  line-height: 16px;
}

.kb-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
  margin-bottom: 4px;
}

.kb-item:last-child {
  margin-bottom: 0;
}

.kb-item:hover,
.kb-item.highlighted {
  background: var(--td-bg-color-secondarycontainer);
}

.kb-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.kb-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--td-brand-color-active);

  &.skill {
    color: #9f7aea;
  }
}

.kb-name-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.kb-name {
  font-size: 12px;
  color: var(--td-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.kb-docs {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-empty {
  padding: 20px 8px;
  text-align: center;
  color: var(--td-text-color-placeholder);
  font-size: 12px;
}
</style>
