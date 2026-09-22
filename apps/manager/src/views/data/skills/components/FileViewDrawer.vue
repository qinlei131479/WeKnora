<script setup lang="ts">
import { JSON_SCHEMA, load as loadYaml } from 'js-yaml';
import { FileText, Folder, FolderOpen } from 'lucide-vue-next';
import { API } from '@/api';
import { t } from '@/i18n';
import { sanitizeMarkdownHTML } from '@/utils/security';
import type { ScrollbarInstance } from 'element-plus/es/components/scrollbar';
import type { SkillCatalogVO } from '@/types';
import modal from '@/plugins/modal';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import MarkdownIt from 'markdown-it';

const contentRef = ref<HTMLElement>();
const scrollbarRef = ref<ScrollbarInstance>();
const markdown = new MarkdownIt({ html: false, linkify: true });
const state = reactive({
  visible: false,
  id: '',
  name: '',
  loading: false,
  failed: false,
  files: [] as SkillCatalogVO.FileNode[],
  filePath: '',
  fileContent: '',
  fileLoading: false,
  fileFailed: false,
  preview: true
});
let treeRequestId = 0;
let fileRequestId = 0;

const isRootSkillFile = (node: SkillCatalogVO.FileNode) => {
  return !node.isDir && /^(?:\.\/)?SKILL\.md$/i.test(node.path?.replace(/\\/g, '/') || '');
};

const isMarkdown = computed(() => /\.(md|markdown)$/i.test(state.filePath));
const displayedContent = computed(() => {
  if (!state.fileContent.trim()) return '';
  if (!/\.json$/i.test(state.filePath)) return state.fileContent;
  try {
    const value: unknown = JSON.parse(state.fileContent);
    return value === null ? '' : JSON.stringify(value, null, 2);
  } catch {
    return state.fileContent;
  }
});
const skillMarkdown = computed(() => {
  const original = { fields: [] as { key: string; value: string }[], content: state.fileContent };
  if (!state.preview || !isRootSkillFile({ path: state.filePath })) return original;
  const lines = state.fileContent.trimStart().split(/\r?\n/);
  if (lines[0]?.trimEnd() !== '---') return original;
  const end = lines.findIndex((line, index) => index > 0 && /^(---|\.\.\.)[ \t]*$/.test(line));
  if (end < 0) return original;
  try {
    const metadata: unknown = loadYaml(lines.slice(1, end).join('\n'), { schema: JSON_SCHEMA, maxAliases: 0 });
    if (metadata != null && (typeof metadata !== 'object' || Array.isArray(metadata))) return original;
    const fields = Object.entries(metadata || {}).map(([key, value]: [string, unknown]) => ({
      key,
      value: value == null ? '' : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    }));
    return { fields, content: lines.slice(end + 1).join('\n') };
  } catch {
    // 元数据格式无效时保留原文，避免文件内容被截掉。
    return original;
  }
});

const previewContent = computed(() => {
  if (!isMarkdown.value || !state.preview || !displayedContent.value) return '';
  return sanitizeMarkdownHTML(markdown.render(skillMarkdown.value.content));
});

const loadFile = (node: SkillCatalogVO.FileNode) => {
  if (node.isDir || !node.path) return;
  const requestId = ++fileRequestId;
  state.filePath = node.path;
  state.fileContent = '';
  state.fileLoading = true;
  state.fileFailed = false;
  state.preview = true;
  return API.Skills.file(state.id, node.path)
    .then((res) => {
      if (requestId !== fileRequestId || !state.visible) return;
      if (typeof res.data?.content !== 'string') throw new Error(t('page.data.skills.error.fileLoad', '文件内容加载失败，请重试'));
      state.fileContent = res.data.content;
    })
    .catch(() => {
      if (requestId === fileRequestId && state.visible) state.fileFailed = true;
    })
    .finally(() => {
      if (requestId === fileRequestId) state.fileLoading = false;
    });
};

const findFirstFile = (nodes: SkillCatalogVO.FileNode[]): SkillCatalogVO.FileNode | undefined => {
  for (const node of nodes) {
    if (!node.isDir && node.path) return node;
    const file = findFirstFile(node.children || []);
    if (file) return file;
  }
};

const loadFiles = () => {
  const requestId = ++treeRequestId;
  state.loading = true;
  state.failed = false;
  return API.Skills.single(state.id)
    .then((res) => {
      if (requestId !== treeRequestId || !state.visible) return;
      if (!res.data) throw new Error(t('page.data.skills.error.filesLoad', '文件目录加载失败，请重试'));
      state.name = res.data.name || state.name;
      const files = [...(res.data.fileTree || [])];
      const skillIndex = files.findIndex(isRootSkillFile);
      if (skillIndex > 0) files.unshift(...files.splice(skillIndex, 1));
      state.files = files;
      const file = findFirstFile(state.files);
      if (file) loadFile(file);
    })
    .catch(() => {
      if (requestId === treeRequestId && state.visible) state.failed = true;
    })
    .finally(() => {
      if (requestId === treeRequestId) state.loading = false;
    });
};

const handleOpen = (row: SkillCatalogVO) => {
  if (!row.id) return;
  ++fileRequestId;
  state.id = row.id;
  state.name = row.name || '';
  state.files = [];
  state.filePath = '';
  state.fileContent = '';
  state.fileLoading = false;
  state.fileFailed = false;
  state.preview = true;
  state.visible = true;
  return loadFiles();
};

const copyWithTextarea = (text: string) => {
  const focusedElement = document.activeElement;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  // 放在抽屉内部，避免焦点限制导致旧浏览器复制失败。
  (contentRef.value || document.body).appendChild(textarea);
  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    if (document.execCommand('copy')) {
      modal.msgSuccess(t('page.normal.copySuccess', '复制成功'));
    } else {
      modal.msgError(t('page.normal.copyFailed', '复制失败'));
    }
  } catch {
    modal.msgError(t('page.normal.copyFailed', '复制失败'));
  } finally {
    textarea.parentNode?.removeChild(textarea);
    if (focusedElement instanceof HTMLElement) focusedElement.focus();
  }
};

const copyContent = () => {
  const text = displayedContent.value;
  if (!text || state.fileLoading || state.fileFailed) return;
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard
      .writeText(text)
      .then(() => modal.msgSuccess(t('page.normal.copySuccess', '复制成功')))
      .catch(() => copyWithTextarea(text));
  }
  copyWithTextarea(text);
};

watch([() => state.filePath, () => state.preview], () => {
  nextTick(() => {
    scrollbarRef.value?.setScrollTop(0);
    scrollbarRef.value?.setScrollLeft(0);
  });
});

watch(
  () => state.visible,
  (visible) => {
    if (!visible) {
      ++treeRequestId;
      ++fileRequestId;
    }
  },
  { flush: 'sync' }
);

onBeforeUnmount(() => {
  ++treeRequestId;
  ++fileRequestId;
});

defineExpose({ handleOpen });
</script>

<template>
  <KjscRtlDrawer
    v-model="state.visible"
    :class="$style.drawer"
    :title="state.name || $t('page.data.skills.files.title', '查看文件')"
    :size="920"
    :show-cancel="false"
    :show-confirm="false"
    append-to-body
  >
    <template #header>
      <div class="file-heading">
        <div class="file-heading-name" :title="state.name">{{ state.name }}</div>
        <el-text size="small" type="info">{{ $t('page.data.skills.files.subtitle', '文件') }}</el-text>
      </div>
    </template>

    <div v-loading="state.loading" class="file-layout">
      <el-alert v-if="state.failed" type="error" :closable="false" :title="$t('page.data.skills.error.filesLoad', '文件目录加载失败，请重试')">
        <el-button type="primary" link @click="loadFiles">{{ $t('page.normal.preview.retry', '重试') }}</el-button>
      </el-alert>
      <el-row v-else-if="state.files.length" class="file-columns">
        <el-col :span="8" class="file-tree">
          <el-scrollbar>
            <el-tree
              :data="state.files"
              :props="{ label: 'name', children: 'children' }"
              node-key="path"
              :current-node-key="state.filePath"
              highlight-current
              default-expand-all
              @node-click="loadFile"
            >
              <template #default="{ node, data }">
                <span class="file-node" :title="data.path">
                  <el-icon :size="16"><component :is="data.isDir ? (node.expanded ? FolderOpen : Folder) : FileText" /></el-icon>
                  <span class="file-node-name">{{ data.name }}</span>
                </span>
              </template>
            </el-tree>
          </el-scrollbar>
        </el-col>
        <el-col :span="16" class="file-panel">
          <div ref="contentRef" class="file-content">
            <div v-if="state.filePath" class="file-toolbar">
              <el-text class="file-path" truncated :title="state.filePath">{{ state.filePath }}</el-text>
              <el-space v-if="displayedContent && !state.fileLoading && !state.fileFailed">
                <el-button v-if="isMarkdown" type="primary" link @click="state.preview = !state.preview">
                  {{ state.preview ? $t('page.data.skills.files.source', '源码') : $t('page.data.skills.files.preview', '预览') }}
                </el-button>
                <el-button type="primary" link @click="copyContent">{{ $t('page.normal.copy', '复制') }}</el-button>
              </el-space>
            </div>
            <div v-loading="state.fileLoading" class="file-reader">
              <el-scrollbar ref="scrollbarRef">
                <div class="file-reader-inner">
                  <el-alert
                    v-if="state.fileFailed"
                    type="error"
                    :closable="false"
                    :title="$t('page.data.skills.error.fileLoad', '文件内容加载失败，请重试')"
                  >
                    <el-button type="primary" link @click="loadFile({ path: state.filePath })">{{
                      $t('page.normal.preview.retry', '重试')
                    }}</el-button>
                  </el-alert>
                  <kjsc-empty v-else-if="!state.filePath" :description="$t('page.data.skills.files.selectFile', '选择文件查看内容')" />
                  <template v-else-if="displayedContent">
                    <template v-if="isMarkdown && state.preview">
                      <el-descriptions v-if="skillMarkdown.fields.length" :column="1" border class="skill-metadata">
                        <el-descriptions-item v-for="field in skillMarkdown.fields" :key="field.key" :label="field.key" label-width="120px">
                          <span class="skill-metadata-value">{{ field.value }}</span>
                        </el-descriptions-item>
                      </el-descriptions>
                      <div class="markdown-content" v-html="previewContent" />
                    </template>
                    <pre v-else class="file-source">{{ displayedContent }}</pre>
                  </template>
                </div>
              </el-scrollbar>
            </div>
          </div>
        </el-col>
      </el-row>
      <kjsc-empty v-else-if="!state.loading" />
    </div>
  </KjscRtlDrawer>
</template>

<style lang="scss" module>
.drawer {
  max-width: 100vw;

  :global(.el-drawer__header) {
    margin-bottom: 0;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :global(.el-drawer__body) {
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
}
</style>

<style lang="scss" scoped>
.file-node,
.file-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.file-heading {
  flex: 1;
  min-width: 0;
}

.file-heading-name,
.file-node-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-heading-name {
  color: var(--el-text-color-primary);
}

.file-layout,
.file-columns,
.file-content {
  height: 100%;
  min-height: 0;
}

.file-tree {
  height: 100%;
  min-width: 0;
  border-right: 1px solid var(--el-border-color-lighter);

  :deep(.el-tree) {
    padding: 10px 0;
  }

  :deep(.el-tree-node__content) {
    height: 32px;
    padding-right: 10px;
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.file-node {
  flex: 1;

  .el-icon {
    flex-shrink: 0;
  }
}

.file-panel {
  min-width: 0;
  height: 100%;
}

.file-content {
  display: flex;
  flex-direction: column;
}

.file-toolbar {
  flex-shrink: 0;
  padding: 10px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .el-space {
    flex-shrink: 0;
  }
}

.file-path {
  flex: 1;
}

.file-reader {
  flex: 1;
  min-height: 0;
}

.file-reader-inner {
  padding: 20px;
}

.file-source {
  margin: 0;
  color: var(--el-text-color-primary);
  font-family: var(--el-font-family-monospace, monospace);
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.skill-metadata {
  margin-bottom: 20px;

  :deep(.el-descriptions__table) {
    table-layout: fixed;
  }

  :deep(.el-descriptions__cell) {
    vertical-align: top;
    overflow-wrap: anywhere;
  }
}

.skill-metadata-value {
  white-space: pre-wrap;
}

.markdown-content {
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.7;
  overflow-wrap: anywhere;

  :deep(> :first-child) {
    margin-top: 0;
  }
  :deep(> :last-child) {
    margin-bottom: 0;
  }
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 20px 0 10px;
    font-weight: 600;
    line-height: 1.4;
  }
  :deep(h1) {
    font-size: 24px;
  }
  :deep(h2) {
    font-size: 20px;
  }
  :deep(h3) {
    font-size: 18px;
  }
  :deep(p) {
    margin: 10px 0;
  }
  :deep(ul),
  :deep(ol) {
    padding-left: 24px;
  }
  :deep(ul) {
    list-style: disc;
  }
  :deep(ol) {
    list-style: decimal;
  }
  :deep(a) {
    color: var(--el-color-primary);
    text-decoration: underline;
  }
  :deep(blockquote) {
    margin: 10px 0;
    padding: 1px 12px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-left: 3px solid var(--el-border-color);
  }
  :deep(code) {
    padding: 2px 4px;
    font-family: var(--el-font-family-monospace, monospace);
    background: var(--el-fill-color-light);
    border-radius: var(--el-border-radius-small);
  }
  :deep(pre) {
    padding: 12px;
    overflow: auto;
    background: var(--el-fill-color-light);
    border-radius: var(--el-border-radius-base);
    code {
      padding: 0;
      background: transparent;
    }
  }
  :deep(table) {
    display: block;
    max-width: 100%;
    overflow: auto;
    border-collapse: collapse;
    th,
    td {
      padding: 6px 10px;
      border: 1px solid var(--el-border-color);
    }
    th {
      background: var(--el-fill-color-light);
    }
  }
  :deep(hr) {
    margin: 16px 0;
    border: 0;
    border-top: 1px solid var(--el-border-color);
  }
  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}
</style>
