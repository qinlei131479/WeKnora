import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import mermaid from 'mermaid';
import { normalizeSpuriousTablePrefixes } from '@/utils/markdownTableNormalize';
import { createSafeImage, hydrateProtectedFileImages, isValidImageURL, safeMarkdownToHTML, sanitizeHTML } from '@/utils/security';
import { openMermaidFullscreen } from '@/utils/mermaidViewer';
import { KnowledgeFileChunk, KnowledgeFileChunkMetadata, KnowledgeFileChunksReq, KnowledgeFileGeneratedQuestion, PageDomain } from '@/types';
import { getKnowledgeFileChunksApi } from '@/api/data/knowledgeFile';

export interface UseFileDetailChunksOptions {
  knowledgeId: string;
  t: (key: string, ...args: any[]) => string;
  getMarkdownRenderRoot: () => HTMLElement;
}
// 生成的问题类型
export type GeneratedQuestion = KnowledgeFileGeneratedQuestion;
export interface ProcessedChunk {
  original: KnowledgeFileChunk;
  processedContent: string;
  questions: GeneratedQuestion[];
  meta: string;
  hasParent: boolean;
  chunkClass: string;
}

export default function useFileDetailChunks(options: UseFileDetailChunksOptions) {
  const { t, getMarkdownRenderRoot } = options;
  const CHUNK_PAGE_SIZE = 10;
  const knowledgeIdRef = ref(options.knowledgeId) as { value: string };

  const chunkPageNum = ref<number>(1) as { value: number };
  const chunkTotal = ref<number>(0);
  const loadingChunks = ref<boolean>(false);
  const chunks = ref<KnowledgeFileChunk[]>([]) as { value: KnowledgeFileChunk[] };
  // Mermaid 初始化计数器，用于生成唯一ID
  let mermaidRenderCount = 0;

  // 初始化 Mermaid
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'strict',
    fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    },
    sequence: {
      useMaxWidth: true,
      diagramMarginX: 8,
      diagramMarginY: 8,
      actorMargin: 50,
      width: 150,
      height: 65
    },
    gantt: {
      useMaxWidth: true,
      leftPadding: 75,
      gridLineStartPadding: 35,
      barHeight: 20,
      barGap: 4,
      topPadding: 50
    }
  });
  marked.use({
    breaks: true, // 启用单行换行转 <br>
    gfm: true // 启用 GitHub Flavored Markdown
  });
  const renderer = new marked.Renderer();
  marked.use(markedKatex({ throwOnError: false, nonStandard: true }));
  renderer.image = function ({ href, title, text }) {
    if (!isValidImageURL(href)) {
      return `<p>${t('page.normal.error.invalidImageLink')}</p>`;
    }

    const safeImage = createSafeImage(href, text || '', title || '');
    return `<figure>
                ${safeImage}
                <figcaption style="text-align: left;">${text || ''}</figcaption>
            </figure>`;
  };

  // 自定义代码块渲染器，只显示语言标签
  renderer.code = function ({ text, lang }) {
    // 空值校验：防止 text 为 undefined 或 null
    if (!text || typeof text !== 'string') {
      text = '';
    }

    // Mermaid 图表处理
    if (lang === 'mermaid') {
      // 生成唯一ID
      const id = `mermaid-${++mermaidRenderCount}`;
      // 返回带有 mermaid 类的 div，后续由 mermaid.run() 处理
      return `<div class="mermaid" id="${id}">${text}</div>`;
    }

    let detectedLang = lang;
    let highlighted = '';
    if (lang && hljs.getLanguage(lang)) {
      try {
        highlighted = hljs.highlight(text, { language: lang }).value;
      } catch (e) {
        highlighted = hljs.highlightAuto(text).value;
        detectedLang = hljs.highlightAuto(text).language || lang;
      }
    } else {
      const auto = hljs.highlightAuto(text);
      highlighted = auto.value;
      detectedLang = auto.language || lang;
    }
    const displayLang = detectedLang || 'Code';
    return `
    <div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-block-lang">${displayLang}</span>
      </div>
      <pre class="code-block-pre"><code class="hljs language-${detectedLang || ''}">${highlighted}</code></pre>
    </div>
  `;
  };

  const preprocessMathDelimiters = (rawText: string): string => {
    if (!rawText || typeof rawText !== 'string') {
      return '';
    }
    return rawText.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$').replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  };

  // 安全地处理 Markdown 内容（使用 marked）
  const processMarkdown = (markdownText?: string): string => {
    if (!markdownText || typeof markdownText !== 'string') return '';

    // 去除 Markdown 头部的 YAML Frontmatter（例如 --- title: xxx ---）
    let processedText = markdownText.replace(/^\s*---\r?\n[\s\S]*?\r?\n---\r?\n/, '');

    // 先还原原始文本中的 HTML 实体，让它们作为普通字符参与渲染
    processedText = processedText
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#34;/g, '"')
      .replace(/&#x22;/gi, '"')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    // 处理被 <p> 包裹的表格行，转换为正常的表格行，并在前后补空行
    processedText = processedText.replace(/<p>\s*(\|[\s\S]*?\|)\s*<\/p>/gi, '\n$1\n');

    // MarkItDown 常在表格前插入空行 + 分隔行，渲染会出现多余空行
    processedText = normalizeSpuriousTablePrefixes(processedText);

    // 保留表格单元格中的 <br>，不转成换行，避免打散表格；其他区域原样交给 marked 处理

    // 先预处理数学定界符，再做安全预处理
    const mathSafeText = preprocessMathDelimiters(processedText);
    const safeMarkdown = safeMarkdownToHTML(mathSafeText);

    // 使用标记渲染
    marked.use({ renderer });
    let html = marked.parse(safeMarkdown) as string;

    // 还原被转义的 <br>
    html = html.replace(/&lt;br\s*\/?&gt;/gi, '<br>');

    // 最终安全清理
    let result = sanitizeHTML(html);

    return result;
  };

  const runMarkdownPostRenderPipeline = async () => {
    await nextTick();
    const kbId = knowledgeIdRef.value;
    const renderRoot = getMarkdownRenderRoot();
    if (!renderRoot) {
      return;
    }
    await hydrateProtectedFileImages(renderRoot, kbId ? { mode: 'knowledgeBase', kbId: kbId } : undefined);
    const images = renderRoot?.querySelectorAll?.('img.markdown-image') as NodeListOf<HTMLImageElement> | undefined;
    if (images) {
      images.forEach(async (item) => {
        const isValid = await checkImage(item.src);
        if (!isValid) {
          item.remove();
        }
      });
    }
    // 渲染 Mermaid 图表
    await renderMermaidDiagrams();
  };
  const checkImage = (url: string) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };
  // 渲染 Mermaid 图表的函数
  const renderMermaidDiagrams = async () => {
    try {
      const mermaidElements: NodeListOf<HTMLElement> | undefined = getMarkdownRenderRoot()?.querySelectorAll('.mermaid');
      console.log('[Mermaid] Found mermaid elements:', mermaidElements?.length);
      if (mermaidElements && mermaidElements.length > 0) {
        await mermaid.run({
          nodes: mermaidElements
        });
        console.log('[Mermaid] Rendering complete');
        // 渲染完成后绑定点击事件
        nextTick(() => {
          bindMermaidClickEvents();
        });
      }
    } catch (error) {
      console.error('Mermaid rendering error:', error);
    }
  };
  // 为 Mermaid 容器绑定点击全屏事件（绑定在 div 上，不是 SVG 上）
  const bindMermaidClickEvents = () => {
    const renderRoot = getMarkdownRenderRoot();
    if (!renderRoot) {
      console.log('[Mermaid] markdown render root is null');
      return;
    }
    // 绑定在 .mermaid div 上，而不是 SVG 上
    const mermaidDivs = renderRoot.querySelectorAll('.mermaid');
    console.log('[Mermaid] Found mermaid divs:', mermaidDivs.length);
    mermaidDivs.forEach((div, index) => {
      const divEl = div as HTMLElement;
      divEl.style.cursor = 'pointer';
      // 移除旧的事件监听器（避免重复绑定）
      divEl.removeEventListener('click', handleMermaidClick);
      divEl.addEventListener('click', handleMermaidClick);
      console.log(`[Mermaid] Bound click event to div ${index}`);
    });
  };
  // Mermaid 点击处理函数 - 必须在 bindMermaidClickEvents 之前定义
  const handleMermaidClick = (e: Event) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const svg = target.querySelector('svg');
    if (svg) {
      openMermaidFullscreen(svg.outerHTML);
    }
  };

  // 解析生成的问题
  const getGeneratedQuestions = (item: KnowledgeFileChunk): GeneratedQuestion[] => {
    if (!item || !item.metadata) return [];
    try {
      const metadata: KnowledgeFileChunkMetadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
      const questions = metadata.generated_questions || [];
      // 兼容旧格式（字符串数组）和新格式（对象数组）
      return questions.map((q: string | GeneratedQuestion, index: number) => {
        if (typeof q === 'string') {
          // 旧格式：字符串，生成临时ID
          return { id: `legacy-${index}`, question: q };
        }
        return q;
      });
    } catch {
      return [];
    }
  };

  const hasStaleGeneratedQuestions = (item: KnowledgeFileChunk) => {
    const questions = getGeneratedQuestions(item);
    if (!questions.length) return false;
    try {
      const metadata: KnowledgeFileChunkMetadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata || '{}') : item.metadata || {};
      const fallbackRevision = metadata.generated_questions_revision || 0;
      const currentRevision = item.contentRevision || 0;
      return questions.some((question) => (question.content_revision ?? fallbackRevision) !== currentRevision);
    } catch {
      return false;
    }
  };

  // 获取Chunk元数据
  const getChunkMeta = (item: KnowledgeFileChunk) => {
    if (!item) return '';
    const parts: string[] = [];
    // if (item.char_count) {
    //   parts.push(`${item.char_count} ${t('page.knowledgeFile.characters')}`);
    // }
    // if (item.token_count) {
    //   parts.push(`${item.token_count} tokens`);
    // }
    return parts.join(' · ');
  };
  const hasParentChunk = (item: KnowledgeFileChunk) => !!item?.parentChunkId;
  // 获取Chunk样式类
  const getChunkClass = (index: number) => {
    return index % 2 !== 0 ? 'chunk-odd' : 'chunk-even';
  };
  // 计算处理后的分块数据，避免在模板中频繁调用方法和 JSON.parse
  const processedChunks = computed(() => {
    return (chunks.value || []).map((item: KnowledgeFileChunk, index: number) => {
      return {
        original: item,
        processedContent: processMarkdown(item.content),
        questions: getGeneratedQuestions(item),
        meta: getChunkMeta(item),
        hasParent: hasParentChunk(item),
        chunkClass: getChunkClass(index)
      };
    });
  }) as { value: ProcessedChunk[] };

  // 合并后的文档内容
  /**
   * 把已合并文本 acc 和下一个 chunk 内容 next 拼接，并去除两者的重叠部分。
   *
   * 不再依赖 start_at / end_at 做位置裁剪，而是用「文本重叠匹配」：在 next 的
   * 开头窗口里找 acc 后缀首次出现的位置，从该位置之后接上。这样能同时兼容：
   *  1. chunker 给拆分表格补写的表头（零宽 start/end，位置上不可见）——表头出现
   *     在重叠行之前，会被自然跳过；
   *  2. HTML 实体编码（&#34; 等）导致的 content 长度与原文区间不一致——比对的是
   *     文本本身，不受长度偏差影响。
   *
   * @param positionOverlap 由 start/end 估算的重叠量，仅用于界定搜索窗口大小。
   */
  const appendChunkContent = (acc: string, next: string, positionOverlap: number): string => {
    if (!acc) return next;
    if (!next) return acc;

    const MIN_OVERLAP = 12; // 过短的后缀容易误匹配（如分隔行），忽略
    const span = Math.max(positionOverlap, 0);
    // 搜索的后缀最大长度；按位置重叠量放大几倍兜底，并设下限
    const maxK = Math.min(acc.length, next.length, Math.max(span * 3, 400));
    // 重叠行之前最多允许多少前缀（补写的表头）被跳过
    const headSlack = Math.max(span * 2, 320);

    for (let k = maxK; k >= MIN_OVERLAP; k--) {
      const suffix = acc.slice(acc.length - k);
      const pos = next.indexOf(suffix);
      if (pos !== -1 && pos <= headSlack) {
        return acc + next.slice(pos + k);
      }
    }
    return acc + next;
  };
  /**
   * 合并分块内容，还原完整文档。chunks 按 start_at 排序后逐段用文本重叠匹配拼接。
   */
  const mergeChunks = (chunks: KnowledgeFileChunk[]): string => {
    if (!chunks || chunks.length === 0) return '';

    // 按 start_at 排序
    const sortedChunks = [...chunks].sort((a, b) => {
      const startA = a.startAt ?? a.chunkIndex ?? 0;
      const startB = b.startAt ?? b.chunkIndex ?? 0;
      return startA - startB;
    });

    let merged = sortedChunks[0].content || '';
    let mergedEnd = sortedChunks[0].endAt ?? 0;

    for (let i = 1; i < sortedChunks.length; i++) {
      const currentChunk = sortedChunks[i];
      const currentStartAt = currentChunk.startAt ?? 0;
      const currentEndAt = currentChunk.endAt ?? 0;
      const currentContent = currentChunk.content || '';

      if (!currentContent) continue;

      // 与上一段有明显间隙（位置不相邻），用空行分隔后整段拼接
      if (currentStartAt > mergedEnd && mergedEnd > 0) {
        merged = merged + '\n\n' + currentContent;
      } else {
        const positionOverlap = mergedEnd - currentStartAt;
        merged = appendChunkContent(merged, currentContent, positionOverlap);
      }

      if (currentEndAt > mergedEnd) {
        mergedEnd = currentEndAt;
      }
    }

    return merged;
  };
  // 监听 chunks 变化，自动更新合并内容
  const mergedContent = computed(() => {
    const newChunks = chunks.value;
    if (newChunks && newChunks.length > 0) {
      return mergeChunks(newChunks);
    }
    return '';
  });

  const loadChunks = (pageNum: number) => {
    chunkPageNum.value = pageNum;
    const req: KnowledgeFileChunksReq = {
      knowledgeId: knowledgeIdRef.value
    };
    loadingChunks.value = true;
    getKnowledgeFileChunksApi(req, {
      pageNum,
      pageSize: CHUNK_PAGE_SIZE
    })
      .then((res) => {
        if (res?.code === 200) {
          if (pageNum === 1) {
            chunks.value = res.rows || [];
          } else {
            chunks.value.push(...(res.rows || []));
          }
          chunkTotal.value = res.total || 0;
          runMarkdownPostRenderPipeline();
        }
      })
      .catch((err) => {
        console.error('获取分块失败', err);
        // chunkTotal.value = 0;
      })
      .finally(() => {
        loadingChunks.value = false;
      });
  };
  const requestNextChunkPage = () => {
    const total = chunkTotal.value;
    const pageNum = Math.ceil(total / CHUNK_PAGE_SIZE);
    let page = chunkPageNum.value;
    if (page + 1 > pageNum) return;
    page++;
    // pendingRequestedPage = page;
    // pendingChunksBeforeLoad = loaded;
    // emit('getDoc', page);
    loadChunks(page);
  };

  // /** When the list is shorter than the drawer, scroll never fires — prefetch until scrollable or done. */
  // const maybeLoadMoreChunks = () => {
  //   if (!props.visible || loadingChunks || props.details?.chunkLoading) return;
  //   const el = docScrollEl || findDocDrawerScrollEl();
  //   if (!el) return;
  //   const loaded = props.details?.md?.length ?? 0;
  //   const total = props.details?.total ?? 0;
  //   if (loaded >= total) return;
  //   const { scrollHeight, clientHeight } = el;
  //   if (scrollHeight <= clientHeight + 8) {
  //     requestNextChunkPage();
  //   }
  // };

  // 加载更多分块
  const loadMoreChunks = () => {
    console.log('loadMoreChunks');
    if (loadingChunks.value) return;
    // loadingChunks.value = true;
    const loaded = chunks.value.length;
    const total = chunkTotal.value;
    if (loaded >= total || total === 0) return;
    requestNextChunkPage();
  };

  const resetDetailChunks = () => {
    loadingChunks.value = false;
    // pendingRequestedPage = 0;
    // pendingChunksBeforeLoad = 0;
    // page = 1;
    chunkPageNum.value = 1;
    chunkTotal.value = 0;
    chunks.value = [];
  };
  const loadFirstPageChunk = () => {
    resetDetailChunks();
    loadChunks(chunkPageNum.value);
  };
  const setUpKnowledgeId = (newId: string) => {
    knowledgeIdRef.value = newId;
  };
  return {
    processMarkdown,
    processedChunks,
    chunkTotal,
    mergedContent,
    loadMoreChunks,
    resetDetailChunks,
    loadFirstPageChunk,
    setUpKnowledgeId,
    runMarkdownPostRenderPipeline,
    hasStaleGeneratedQuestions
  };
}
