<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { useI18n } from 'vue-i18n';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import EmptyState from '@/components/EmptyState.vue';
import { generateKnowledgeBaseMindmap, getKnowledgeBaseMindmap } from '@/api/knowledge-base';

// 知识库思维导图视图。渲染方式与 yuxi 原生思维导图（harness MindMapSection.vue）
// 保持一致：把 {content, children} 树转成 Markdown 标题，再交给
// markmap-lib/markmap-view 画成可缩放、可交互的节点图，而不是纯文本大纲。
// 数据源是 Go 侧 knowledge_base_mindmaps 侧车表（迁移 000004），接口
// GET/POST /api/v1/knowledge-bases/:id/mindmap。
// 文件叶子节点可点击：按「文件夹路径/文件名」在 mindmap_file_ids 里反查
// 知识 ID，向上抛 open-source-doc 事件，由 KnowledgeBase 复用文档页预览抽屉。

const props = defineProps<{
  knowledgeBaseId: string;
}>();

const emit = defineEmits<{
  'open-source-doc': [knowledgeId: string];
}>();

const { t } = useI18n();
const NS = 'knowledgeBase';
const loading = ref(false);
const generating = ref(false);
const mindmap = ref<Record<string, any> | null>(null);
// {知识ID -> 导图节点路径}。后端新数据存「文件夹路径/文件名」；重新生成前的
// 存量侧车数据只存文件名，用 byName 兜底索引兼容。
const mindmapFileIds = ref<Record<string, string>>({});
const loadError = ref('');
const mindmapSvg = ref<SVGSVGElement | null>(null);
const zoomPercent = ref(100);

let markmapInstance: Markmap | null = null;
let resizeObserver: ResizeObserver | null = null;
let detachZoomListener: (() => void) | null = null;
let detachNodeListener: (() => void) | null = null;
// 用户主动缩放过之后，容器尺寸变化不再自动 fit，否则会把手动调好的比例冲掉。
let userZoomed = false;

// markmap 的 fit() 只对 scale 取上限（Math.min(..., maxInitialScale)），没有下限：
// 文件一多，整棵树会被压到远小于 1 的比例，节点文字跟着缩成蚂蚁。这里给
// 「适应视图」加一个可读下限，低于它就改为按可读比例展示、超出部分靠平移浏览。
const MIN_READABLE_SCALE = 0.5;
const MAX_SCALE = 2.5;
const ZOOM_STEP = 1.25;

// ⚠️ rescale(s) 的 s 是「乘以 s」的倍数，不是「设为 s」——markmap 内部走
// d3 Transform.scale(k)，其实现是 this.k * k（d3-zoom/dist/d3-zoom.js）。
// 之前按绝对值传参，导致点「－」传 1.6 反而得到 2.0×1.6=3.2（越点越大）。
async function rescaleTo(targetScale: number) {
  if (!markmapInstance) return;
  const cur = currentScale();
  if (cur <= 0) return;
  const next = Math.min(MAX_SCALE, Math.max(MIN_READABLE_SCALE / 2, targetScale));
  // 目标与当前几乎一致时直接返回，避免乘出 0.9999 之类的抖动。
  if (Math.abs(next - cur) < 1e-3) return;
  await markmapInstance.rescale(next / cur);
}

// d3-zoom 把当前 transform挂在 dom 节点的 __zoom 上（d3-zoom/src/zoom.js 的
// transform() 会沿 parentNode 向上找），markmap 内部的 rescale() 也走这条路径。
// 直接读这个私有字段，就不用为了读一个 k 值把 d3 引进package.json。
function currentScale(): number {
  const svg = mindmapSvg.value as unknown as { __zoom?: { k?: number } } | null;
  const k = svg?.__zoom?.k;
  return typeof k === 'number' && k > 0 ? k : 1;
}

function syncZoomPercent() {
  zoomPercent.value = Math.round(currentScale() * 100);
}

function onZoomEvent() {
  syncZoomPercent();
}

function errorMessage(error: any, fallback: string) {
  if (error?.status === 404) {
    return t(`${NS}.mindmapNotFound`);
  }
  return error?.message || fallback;
}

function parseMindmapFileIds(res: any) {
  const raw = res?.mindmap_file_ids;
  mindmapFileIds.value = raw && typeof raw === 'object' ? raw : {};
}

// markmap 渲染的 g.markmap-node 上绑的 __data__ 是 setData 后节点树里的
// 节点对象本身（无 parent 链、content 是 HTML 实体转义串），所以匹配走两条：
// 1) 渲染后从实例 state.data（即 __data__ 所在的树，对象引用一致）预构建
//    「节点对象 -> 路径」索引，点击时 O(1) 命中，同名文件按路径消歧；
// 2) 拼路径的每段 content 先解码，才能与 mindmap_file_ids 里的原始文件名比对。
let nodePathIndex: Map<any, string> | null = null;

function decodeMarkmapContent(text: string): string {
  if (!text || !text.includes('&')) return text;
  // textarea 的 innerHTML 按 RCDATA 解析：实体被解码，标签不会变成元素，安全。
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
}

function buildNodePathIndex(root: any): Map<any, string> {
  const index = new Map<any, string>();
  const walk = (node: any, parentPath: string | null) => {
    const content = decodeMarkmapContent(node?.content);
    if (parentPath !== null) {
      index.set(node, parentPath ? `${parentPath}/${content}` : content);
    }
    const childPath = parentPath === null ? '' : parentPath ? `${parentPath}/${content}` : content;
    for (const child of Array.isArray(node?.children) ? node.children : []) walk(child, childPath);
  };
  walk(root, null);
  return index;
}

// 双索引：byPath 按完整节点路径精确命中；byName 按文件名兜底（存量导图
// 的 file_ids 值只有文件名，且重新生成前不会更新）。
const fileKeyIndex = computed(() => {
  const byPath = new Map<string, string>();
  const byName = new Map<string, string[]>();
  for (const [id, key] of Object.entries(mindmapFileIds.value)) {
    if (!byPath.has(key)) byPath.set(key, id);
    const name = key.slice(key.lastIndexOf('/') + 1);
    const ids = byName.get(name);
    if (ids) ids.push(id);
    else byName.set(name, [id]);
  }
  return { byPath, byName };
});

// 只有文件叶子可预览。折叠/展开只改 payload 标记，children 数组不变，
// 所以用 children 判文件夹，不会把折叠中的文件夹误判成文件。
function resolveKnowledgeId(data: any): string {
  if (!data?.content || (Array.isArray(data.children) && data.children.length)) return '';
  const path = nodePathIndex?.get(data);
  if (!path) return '';
  const { byPath, byName } = fileKeyIndex.value;
  const exact = byPath.get(path);
  if (exact) return exact;
  const fileName = path.slice(path.lastIndexOf('/') + 1);
  return byName.get(fileName)?.[0] || '';
}

function hitMarkmapNode(event: Event): { __data__?: any } | null {
  const target = event.target as Element | null;
  return (target?.closest?.('g.markmap-node') as { __data__?: any } | null) || null;
}

// markmap 只把 click 绑在折叠圆点上，文字区空闲；这里在 svg 上做事件委托，
// 点击文件叶子直接打开预览，不干扰圆点的展开/收起与 d3-zoom 拖拽。
function onSvgClick(event: MouseEvent) {
  const g = hitMarkmapNode(event);
  if (!g) return;
  const knowledgeId = resolveKnowledgeId(g.__data__);
  if (knowledgeId) emit('open-source-doc', knowledgeId);
}

function onSvgMouseOver(event: MouseEvent) {
  const svg = mindmapSvg.value;
  if (!svg) return;
  const g = hitMarkmapNode(event);
  svg.style.cursor = g && resolveKnowledgeId(g.__data__) ? 'pointer' : '';
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

function destroyMarkmap() {
  try {
    markmapInstance?.destroy();
  } catch {
    // svg 已从 DOM 摘掉时忽略清理期间的异常
  }
  markmapInstance = null;
  nodePathIndex = null;
}

async function renderMindmap(node: Record<string, any> | null, retryCount = 0) {
  if (!node) return;
  if (!mindmapSvg.value || !ensureSvgViewportSize()) {
    // 页面是 v-if 懒挂载，svg 可能还没完成布局，等一帧再试。
    if (retryCount < 5) {
      setTimeout(() => renderMindmap(node, retryCount + 1), 100);
    }
    return;
  }
  try {
    destroyMarkmap();
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
      // 首屏展开三层：够看到「文件夹 → 子文件夹 → 文件」的结构，再深的
      // 层级（depth>=3）默认折叠，点节点仍可逐层展开。
      initialExpandLevel: 3,
      // 默认是 2：节点少时 fit 会把小图放大到 200%，看起来反而不正常。
      // 压到 1 表示「适应视图」只缩不放，100% 就是 1:1 原始大小。
      maxInitialScale: 1,
    });
    await markmapInstance.setData(root);
    // setData 会克隆传入的树（_initializeData），DOM 绑定的是克隆后的节点；
    // 索引必须从实例内部的 state.data 构建，对象引用才能与 __data__ 对上。
    nodePathIndex = buildNodePathIndex((markmapInstance as any).state?.data);
    await fitView();
  } catch (error: any) {
    MessagePlugin.error(error?.message || t(`${NS}.mindmapGenerateFailed`));
  }
}

async function applyFit() {
  if (!markmapInstance) return;
  ensureSvgViewportSize();
  // fit() 会把所有层级铺开后算比例；这里铺开后再收一道可读下限。
  await markmapInstance.fit();
  const scale = currentScale();
  if (scale < MIN_READABLE_SCALE) {
    await rescaleTo(MIN_READABLE_SCALE);
  }
  userZoomed = false;
  syncZoomPercent();
}

function fitView() {
  void applyFit();
}

async function zoomBy(factor: number) {
  if (!markmapInstance) return;
  userZoomed = true;
  //传目标绝对值，由 rescaleTo 换算成相对倍数
  await rescaleTo(currentScale() * factor);
  syncZoomPercent();
}

async function loadMindmap() {
  if (!props.knowledgeBaseId) return;
  loading.value = true;
  loadError.value = '';
  try {
    const res: any = await getKnowledgeBaseMindmap(props.knowledgeBaseId);
    mindmap.value = res?.mindmap && typeof res.mindmap === 'object' ? res.mindmap : null;
    parseMindmapFileIds(res);
    if (mindmap.value) {
      await nextTick();
      setTimeout(() => renderMindmap(mindmap.value), 100);
    }
  } catch (error: any) {
    mindmap.value = null;
    loadError.value = errorMessage(error, t(`${NS}.mindmapLoadFailed`));
  } finally {
    loading.value = false;
  }
}

async function generateMindmap() {
  if (!props.knowledgeBaseId || generating.value) return;
  generating.value = true;
  loadError.value = '';
  try {
    const res: any = await generateKnowledgeBaseMindmap(props.knowledgeBaseId);
    mindmap.value = res?.mindmap && typeof res.mindmap === 'object' ? res.mindmap : null;
    // 生成响应与 GET 一样带 mindmap_file_ids，不用再发一次请求。
    parseMindmapFileIds(res);
    await nextTick();
    setTimeout(async () => {
      await renderMindmap(mindmap.value);
      MessagePlugin.success(t(`${NS}.mindmapGenerated`));
    }, 100);
  } catch (error: any) {
    MessagePlugin.error(errorMessage(error, t(`${NS}.mindmapGenerateFailed`)));
  } finally {
    generating.value = false;
  }
}

watch(
  () => props.knowledgeBaseId,
  () => {
    destroyMarkmap();
    detachZoomListener?.();
    detachZoomListener = null;
    detachNodeListener?.();
    detachNodeListener = null;
    userZoomed = false;
    mindmap.value = null;
    mindmapFileIds.value = {};
    loadError.value = '';
    void loadMindmap();
  },
  { immediate: true },
);

// svg 节点随 v-if 挂载/卸载：卸载时必须销毁 markmap 实例，否则它会持有已经
// 脱离文档的 <svg>，d3 在下次渲染时可能报错。
watch(mindmapSvg, (svg) => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (!svg) {
    destroyMarkmap();
    return;
  }
  const container = svg.parentElement;
  if (!container) return;
  resizeObserver = new ResizeObserver(() => {
    if (markmapInstance) {
      ensureSvgViewportSize();
      // 容器尺寸变了必须重新 fit（svg 宽高是写死在属性上的，不重画会错位），
      // 但不能覆盖用户手动调过的比例——只有当前还停在 fit 结果上才重算。
      if (!userZoomed) {
        void applyFit();
      }
    }
  });
  resizeObserver.observe(container);

  // 滚轮缩放/拖拽平移是 markmap 自带的 d3-zoom 行为。这里旁听比例变化，让悬浮
  // 控件上的百分比跟着动。注意不能走 markmapInstance.svg.on('zoom')——d3 的
  // selection.on 同类型是覆盖，会顶掉 markmap 自己的 handleZoom；而原生
  // addEventListener 与 d3 内部注册是叠加关系，互不干扰。
  detachZoomListener?.();
  detachZoomListener = () => svg.removeEventListener('zoom', onZoomEvent);
  svg.addEventListener('zoom', onZoomEvent);

  // 节点点击/悬停委托挂在 svg 上：setData、折叠展开重建节点后依然生效，
  // 只有 svg 本身随 v-if 卸载才需要摘掉。
  detachNodeListener?.();
  detachNodeListener = () => {
    svg.removeEventListener('click', onSvgClick);
    svg.removeEventListener('mouseover', onSvgMouseOver);
    svg.style.cursor = '';
  };
  svg.addEventListener('click', onSvgClick);
  svg.addEventListener('mouseover', onSvgMouseOver);
});

onUnmounted(() => {
  destroyMarkmap();
  detachZoomListener?.();
  detachZoomListener = null;
  detachNodeListener?.();
  detachNodeListener = null;
  resizeObserver?.disconnect();
});
</script>

<template>
  <div class="kb-mindmap">
    <!-- 与画廊工具栏同一规格：左边说明当前视图是什么，右边放视图级动作。 -->
    <div class="mm-toolbar">
      <div class="mm-toolbar__summary">
        <span class="mm-toolbar__title">{{ t(`${NS}.mindmap`) }}</span>
        <span class="mm-toolbar__desc">{{ t(`${NS}.mindmapDescription`) }}</span>
      </div>
      <div class="mm-toolbar__trailing">
        <t-button
          v-if="mindmap"
          theme="default"
          variant="outline"
          size="small"
          :disabled="generating"
          @click="fitView"
        >
          {{ t(`${NS}.mindmapFitView`) }}
        </t-button>
        <t-button theme="primary" size="small" :loading="generating" @click="generateMindmap">
          {{ mindmap ? t(`${NS}.mindmapRegenerate`) : t(`${NS}.mindmapGenerate`) }}
        </t-button>
      </div>
    </div>

    <div class="mm-body">
      <t-loading :loading="loading || generating" size="small" class="mm-loading" :show-overlay="true">
        <!-- 有旧图时生成中不卸载画布：重新生成时保留上一版，避免画布闪成空白。 -->
        <div v-if="mindmap" class="mm-canvas" :class="{ 'is-regenerating': generating }">
          <svg ref="mindmapSvg" class="mm-svg"></svg>
          <div v-if="generating" class="mm-canvas__mask">{{ t(`${NS}.mindmapGenerating`) }}</div>
          <!-- 缩放控件悬浮在画布右下角，不占工具栏位置；滚轮缩放仍可用。 -->
          <div v-if="!generating" class="mm-zoom" role="group" :aria-label="t(`${NS}.mindmap`)">
            <t-tooltip :content="t(`${NS}.mindmapZoomOut`)" placement="top">
              <button
                type="button"
                class="mm-zoom__btn"
                :aria-label="t(`${NS}.mindmapZoomOut`)"
                @click="zoomBy(1 / ZOOM_STEP)"
              >
                <t-icon name="remove" size="16px" />
              </button>
            </t-tooltip>
            <span class="mm-zoom__value" aria-live="polite">{{ zoomPercent }}%</span>
            <t-tooltip :content="t(`${NS}.mindmapZoomIn`)" placement="top">
              <button
                type="button"
                class="mm-zoom__btn"
                :aria-label="t(`${NS}.mindmapZoomIn`)"
                @click="zoomBy(ZOOM_STEP)"
              >
                <t-icon name="add" size="16px" />
              </button>
            </t-tooltip>
          </div>
        </div>

        <EmptyState
          v-else-if="!loading && !generating"
          icon="fork"
          :title="t(`${NS}.mindmapEmpty`)"
          :description="loadError"
        >
          <t-button theme="primary" :loading="generating" @click="generateMindmap">
            {{ t(`${NS}.mindmapGenerate`) }}
          </t-button>
        </EmptyState>
      </t-loading>
    </div>
  </div>
</template>

<style scoped lang="less">
.kb-mindmap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
}

// Mirrors .ig-toolbar in ImageGallery.vue so switching tabs keeps the
// toolbar in place.
.mm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 0 0 16px;
  border-bottom: 1px solid var(--td-component-stroke);

  &__summary {
    display: flex;
    align-items: baseline;
    gap: 12px;
    min-width: 0;
    min-height: 32px;
    line-height: 32px;
  }

  &__title {
    color: var(--td-text-color-primary);
    font-size: var(--app-text-md);
    font-weight: 600;
    white-space: nowrap;
  }

  &__desc {
    color: var(--td-text-color-placeholder);
    font-size: var(--app-text-sm);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__trailing {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
}

.mm-body {
  display: flex;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.mm-loading {
  display: flex;
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.mm-canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
  border: 1px solid var(--td-component-stroke);
  border-radius: 8px;
  background: var(--td-bg-color-container);
  overflow: hidden;

  &.is-regenerating {
    opacity: 0.4;
  }

  &__mask {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--td-text-color-secondary);
    font-size: 13px;
  }
}

.mm-svg {
  width: 100%;
  height: 100%;
  display: block;
}

// 悬浮缩放控件：绝对定位在画布右下角，不参与布局，避免触发画布 ResizeObserver。
.mm-zoom {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--td-component-stroke);
  border-radius: 6px;
  background: var(--td-bg-color-container);
  box-shadow: var(--td-shadow-2);

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--td-text-color-primary);
    cursor: pointer;

    &:hover {
      background: var(--td-bg-color-secondarycontainer);
    }

    &:focus-visible {
      outline: 2px solid var(--app-focus-border);
      outline-offset: -2px;
    }
  }

  &__value {
    min-width: 46px;
    color: var(--td-text-color-secondary);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    text-align: center;
    user-select: none;
  }
}

@media (max-width: 1000px) {
  .mm-toolbar {
    flex-wrap: wrap;
    gap: 12px;
  }

  .mm-toolbar__desc {
    display: none;
  }
}
</style>

<style>
/* markmap-view 未加 scope 时默认字体/连线颜色跟不上暗色模式，这里绑定
   TDesign 的 CSS 变量，和 harness 版思维导图一样跟着主题切换。 */
.mm-svg .markmap-node text,
.mm-svg .markmap-node foreignObject {
  color: var(--td-text-color-primary);
  fill: var(--td-text-color-primary);
}

.mm-svg .markmap-link {
  stroke: var(--td-component-stroke);
}
</style>
