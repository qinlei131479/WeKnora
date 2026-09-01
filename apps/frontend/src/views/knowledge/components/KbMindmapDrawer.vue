<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { useI18n } from 'vue-i18n';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import SettingDrawer from '@/components/settings/SettingDrawer.vue';
import { generateKnowledgeBaseMindmap, getKnowledgeBaseMindmap } from '@/api/knowledge-base';

// 渲染方式与 yuxi 原生思维导图（harness MindMapSection.vue）保持一致：把
// {content, children} 树转成 Markdown 标题，再交给 markmap-lib/markmap-view
// 画成可缩放、可交互的节点图，而不是纯文本大纲——后者虽然数据一样，但不是
// "思维导图"，是这次改动漏掉的地方。

const props = defineProps<{
  visible: boolean;
  kbId: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const { t } = useI18n();
const loading = ref(false);
const generating = ref(false);
const mindmap = ref<Record<string, any> | null>(null);
const loadError = ref('');
const mindmapSvg = ref<SVGSVGElement | null>(null);

let markmapInstance: Markmap | null = null;
let resizeObserver: ResizeObserver | null = null;

const drawerVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
});

function errorMessage(error: any, fallback: string) {
  if (error?.status === 404) {
    return t('knowledgeBase.mindmapNotFound');
  }
  return error?.message || fallback;
}

function jsonToMarkdown(node: Record<string, any> | null, level = 0): string {
  if (!node || typeof node !== 'object' || !node.content) return '';
  const heading = '#'.repeat(Math.min(level + 1, 6));
  let markdown = `${heading} ${node.content}\n\n`;
  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    markdown += jsonToMarkdown(child, level + 1);
  }
  return markdown;
}

function ensureSvgViewportSize(): boolean {
  const svg = mindmapSvg.value;
  const container = svg?.parentElement;
  if (!svg || !container) return false;
  const { width, height } = container.getBoundingClientRect();
  if (width <= 0 || height <= 0) return false;
  svg.setAttribute('width', `${Math.round(width)}`);
  svg.setAttribute('height', `${Math.round(height)}`);
  return true;
}

async function renderMindmap(node: Record<string, any> | null, retryCount = 0) {
  if (!node) return;
  if (!mindmapSvg.value || !ensureSvgViewportSize()) {
    if (retryCount < 5) {
      setTimeout(() => renderMindmap(node, retryCount + 1), 100);
    }
    return;
  }
  try {
    if (markmapInstance) {
      markmapInstance.destroy();
      markmapInstance = null;
    }
    const markdown = jsonToMarkdown(node);
    const transformer = new Transformer();
    const { root } = transformer.transform(markdown);
    markmapInstance = Markmap.create(mindmapSvg.value, {
      duration: 300,
      maxWidth: 220,
      nodeMinHeight: 24,
      paddingX: 8,
      spacingVertical: 5,
      spacingHorizontal: 60,
    });
    await markmapInstance.setData(root);
    await markmapInstance.fit();
  } catch (error: any) {
    MessagePlugin.error(error?.message || t('knowledgeBase.mindmapGenerateFailed'));
  }
}

function fitView() {
  if (!markmapInstance) return;
  ensureSvgViewportSize();
  markmapInstance.fit();
}

async function loadMindmap() {
  if (!props.kbId) return;
  loading.value = true;
  loadError.value = '';
  try {
    const res: any = await getKnowledgeBaseMindmap(props.kbId);
    mindmap.value = res?.mindmap && typeof res.mindmap === 'object' ? res.mindmap : null;
    if (mindmap.value) {
      await nextTick();
      setTimeout(() => renderMindmap(mindmap.value), 100);
    }
  } catch (error: any) {
    mindmap.value = null;
    loadError.value = errorMessage(error, t('knowledgeBase.mindmapLoadFailed'));
    MessagePlugin.error(loadError.value);
  } finally {
    loading.value = false;
  }
}

async function generateMindmap() {
  if (!props.kbId || generating.value) return;
  generating.value = true;
  try {
    const res: any = await generateKnowledgeBaseMindmap(props.kbId);
    mindmap.value = res?.mindmap && typeof res.mindmap === 'object' ? res.mindmap : null;
    loadError.value = '';
    await nextTick();
    setTimeout(() => {
      renderMindmap(mindmap.value);
      MessagePlugin.success(t('knowledgeBase.mindmapGenerated'));
    }, 100);
  } catch (error: any) {
    MessagePlugin.error(errorMessage(error, t('knowledgeBase.mindmapGenerateFailed')));
  } finally {
    generating.value = false;
  }
}

watch(
  () => [props.visible, props.kbId],
  ([visible]) => {
    if (visible) void loadMindmap();
  },
);

watch(mindmapSvg, (svg) => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (!svg) {
    // 抽屉用 destroy-on-close，关闭时会把插槽内容整个卸掉；这里主动清掉旧的
    // markmap 实例，避免它引用一个已经从 DOM 上摘掉的 <svg>（否则下次打开
    // 抽屉、renderMindmap 里 markmapInstance.destroy() 可能对着一个脱离
    // 父节点的元素操作，d3 有概率报错）。
    try {
      markmapInstance?.destroy();
    } catch {
      // 节点已被卸载，忽略清理期间的异常
    }
    markmapInstance = null;
    return;
  }
  const container = svg.parentElement;
  if (!container) return;
  resizeObserver = new ResizeObserver(() => {
    if (markmapInstance) {
      ensureSvgViewportSize();
      markmapInstance.fit();
    }
  });
  resizeObserver.observe(container);
});

onUnmounted(() => {
  markmapInstance?.destroy();
  resizeObserver?.disconnect();
});
</script>

<template>
  <SettingDrawer
    v-model:visible="drawerVisible"
    :title="t('knowledgeBase.mindmap')"
    :description="t('knowledgeBase.mindmapDescription')"
    icon="fork"
    width="560px"
    :min-width="420"
    :max-width="960"
    :z-index="3600"
    hide-footer
    storage-key="setting-drawer:width:kb-mindmap"
  >
    <div class="kb-mindmap-drawer">
      <div class="kb-mindmap-toolbar">
        <t-button v-if="mindmap" theme="default" variant="outline" size="small" @click="fitView">
          {{ t('knowledgeBase.mindmapFitView') }}
        </t-button>
        <t-button theme="primary" size="small" :loading="generating" @click="generateMindmap">
          {{ mindmap ? t('knowledgeBase.mindmapRegenerate') : t('knowledgeBase.mindmapGenerate') }}
        </t-button>
      </div>
      <div v-if="loading" class="kb-mindmap-empty">{{ t('knowledgeBase.mindmapLoading') }}</div>
      <div v-else-if="generating && !mindmap" class="kb-mindmap-empty">{{ t('knowledgeBase.mindmapGenerating') }}</div>
      <div v-show="!loading && mindmap" class="kb-mindmap-canvas">
        <svg ref="mindmapSvg" class="kb-mindmap-svg"></svg>
      </div>
      <div v-if="!loading && !generating && !mindmap" class="kb-mindmap-empty">
        {{ loadError || t('knowledgeBase.mindmapEmpty') }}
      </div>
    </div>
  </SettingDrawer>
</template>

<style scoped>
.kb-mindmap-drawer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 480px;
}
.kb-mindmap-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
.kb-mindmap-empty {
  color: var(--td-text-color-secondary);
  font-size: 13px;
  padding: 24px 0;
  text-align: center;
}
.kb-mindmap-canvas {
  flex: 1;
  min-height: 400px;
  border: 1px solid var(--td-component-stroke);
  border-radius: 8px;
  background: var(--td-bg-color-container);
  overflow: hidden;
}
.kb-mindmap-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>

<style>
/* markmap-view 未加 scope 时默认字体/连线颜色跟不上暗色模式，这里绑定
   TDesign 的 CSS 变量，和 harness 版思维导图一样跟着主题切换。 */
.kb-mindmap-svg .markmap-node text,
.kb-mindmap-svg .markmap-node foreignObject {
  color: var(--td-text-color-primary);
  fill: var(--td-text-color-primary);
}
.kb-mindmap-svg .markmap-link {
  stroke: var(--td-component-stroke);
}
</style>
