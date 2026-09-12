/**
 * 二开功能开关（浏览器全局 localStorage，不绑用户/租户）。
 *
 * 只有一个存储开关：`WeKnora_hide_features`
 *   - `"false"`       → 完整模式：所有入口可见，provider 不作限制
 *   - 其他值 / 未设置 → 精简模式：隐藏指定入口，并启用 provider 白名单
 *
 * 精简模式包含两类行为，分别在下面两个区域维护：
 *   1. 隐藏入口：设置侧栏 section、主侧栏 path
 *   2. provider 白名单：语言 / IM / 向量库 / 存储 / 搜索 / 模型 / 解析引擎
 */

const STORAGE_KEY = 'WeKnora_hide_features'
/** 未写入过存储时写入的默认值（精简模式） */
const DEFAULT_STORAGE_VALUE = 'true'

/** 精简模式是否开启（唯一判断入口，所有开关都走这里） */
function isLiteModeEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    // 隐私模式 / storage 不可用时按精简模式处理
    return true
  }
}

/** 启动时调用：无缓存则写入默认值；已有值不动。 */
export function ensureFeatureFlags(): void {
  try {
    if (localStorage.getItem(STORAGE_KEY) === null) {
      localStorage.setItem(STORAGE_KEY, DEFAULT_STORAGE_VALUE)
    }
  } catch {
    // private mode / disabled storage
  }
}

/* ------------------------------------------------------------------ *
 * 1. 精简模式下隐藏的入口
 * ------------------------------------------------------------------ */

/** 设置侧栏在精简模式下隐藏的 section key */
const HIDDEN_SETTINGS_SECTIONS = new Set([
  'chathistory',
  'system',
  'ollama',
  'integration-chrome',
  'integration-claw',
])

/** 主侧栏在精简模式下隐藏的 path（与 menu.ts 的 item.path 对齐） */
const HIDDEN_MENU_PATHS = new Set(['organizations'])

/** 云解析引擎 Name（勿用文案匹配） */
export const CLOUD_PARSER_ENGINES = new Set([
  'weknoracloud',
  'mineru_cloud',
  'paddleocr_vl_cloud',
])

/** 设置侧栏 section 是否应隐藏 */
export function isHiddenSettingsSection(key: string): boolean {
  return isLiteModeEnabled() && HIDDEN_SETTINGS_SECTIONS.has(key)
}

/** 主侧栏菜单 path 是否应隐藏 */
export function isHiddenMenuPath(path: string): boolean {
  return isLiteModeEnabled() && HIDDEN_MENU_PATHS.has(path)
}

/** 是否隐藏数据源导入模块 */
export function shouldHideDatasource(): boolean {
  return isLiteModeEnabled()
}

/** 是否隐藏智能体 / 知识库编辑页「共享管理」 */
export function shouldHideShareManagement(): boolean {
  return isLiteModeEnabled()
}

/** 是否隐藏知识库「知识图谱」配置入口 */
export function shouldHideKnowledgeGraph(): boolean {
  return isLiteModeEnabled()
}

export function isCloudParserEngine(name: string): boolean {
  return CLOUD_PARSER_ENGINES.has(name)
}

/** hideCloud 时过滤云解析引擎列表（KB 设置 / 上传确认等共用） */
export function filterParserEngines<T extends { Name?: string; name?: string }>(
  engines: T[],
): T[] {
  if (!getFeatureFlags().hideCloud) return engines
  return engines.filter((engine) => !isCloudParserEngine(engine.Name || engine.name || ''))
}

/* ------------------------------------------------------------------ *
 * 2. 功能开关快照
 *
 * 目前所有字段都跟随同一个「精简模式」开关。保留语义化字段供调用方读取；
 * 后续若需要拆分开关，只需在这里改为读取不同来源。
 * ------------------------------------------------------------------ */

export type FeatureFlags = {
  /** 隐藏云解析引擎（WeKnora Cloud / MinerU / PaddleOCR VL） */
  hideCloud: boolean
  /** 隐藏侧栏「共享空间」 */
  hideOrganizations: boolean
  /** 隐藏知识库「知识图谱」配置 */
  hideKnowledgeGraph: boolean
  /** 隐藏知识库「数据源导入」 */
  hideDatasource: boolean
  /** 隐藏智能体 / 知识库编辑页「共享管理」 */
  hideShareManagement: boolean
  /** 限制语言 / IM / 向量库 / 存储 / 搜索等白名单选项 */
  restrictProviderOptions: boolean
}

export function getFeatureFlags(): FeatureFlags {
  ensureFeatureFlags()
  const hide = isLiteModeEnabled()
  return {
    hideCloud: hide,
    hideOrganizations: hide,
    hideKnowledgeGraph: hide,
    hideDatasource: hide,
    hideShareManagement: hide,
    restrictProviderOptions: hide,
  }
}

/* ------------------------------------------------------------------ *
 * 3. provider 白名单（保持原值，不改行为）
 * ------------------------------------------------------------------ */

/** 精简模式下允许的界面语言 */
const ALLOWED_LOCALES = new Set(['zh-CN', 'en-US'])
/** 精简模式下允许的 IM 平台 */
const ALLOWED_IM_PLATFORMS = new Set(['dingtalk', 'wecom', 'feishu'])
/** 精简模式下允许的向量库引擎 */
const ALLOWED_VECTOR_STORE_ENGINES = new Set([
  'elasticsearch',
  'postgres',
  'milvus',
  'qdrant',
  'weaviate',
])
/** 精简模式下允许的存储后端 */
const ALLOWED_STORAGE_PROVIDERS = new Set(['local', 'minio', 'oss', 'cos'])
/** 精简模式下允许的 Web 搜索服务商 */
const ALLOWED_WEB_SEARCH_PROVIDERS = new Set(['duckduckgo', 'baidu', 'tavily', 'bing'])
/** 新增模型时「远程服务商」白名单（不含 Ollama：Ollama 走 source=local，不受此限制） */
const ALLOWED_MODEL_PROVIDERS = new Set([
  'aliyun', // 通义千问 / DashScope
  'deepseek',
  'hunyuan', // 腾讯混元
  'openai',
  'anthropic',
  'gemini',
  'mimo', // 小米
  'moonshot', // 月之暗面
  'zhipu', // 智谱
  'qianfan', // 百度千帆
  'minimax',
  'volcengine', // 火山引擎
  'siliconflow', // 硅基流动
  'generic', // 自定义 OpenAI 兼容
])

/**
 * 知识库文档「来源」筛选项里，随 hideDatasource 隐藏的数据源 channel。
 * feishu 同时可能是 IM 入库，不放这里，走 IM 白名单。
 */
const DATASOURCE_KNOWLEDGE_SOURCES = new Set([
  'feishu_drive',
  'lark_drive',
  'notion',
  'yuque',
  'rss',
])

/** 来源筛选项里的 IM 相关 channel（含泛化 im） */
const IM_KNOWLEDGE_SOURCES = new Set([
  'wechat',
  'wecom',
  'feishu',
  'dingtalk',
  'slack',
  'telegram',
  'qqbot',
  'mattermost',
  'yunzhijia',
  'lark',
  'im',
])

/** 完整模式全部放行；精简模式只放行白名单内的 id */
function isAllowedInLiteMode(id: string, allowSet: Set<string>): boolean {
  return !isLiteModeEnabled() || allowSet.has(id)
}

export function isAllowedLocale(code: string): boolean {
  return isAllowedInLiteMode(code, ALLOWED_LOCALES)
}

export function isAllowedIMPlatform(platform: string): boolean {
  return isAllowedInLiteMode(platform, ALLOWED_IM_PLATFORMS)
}

export function isAllowedVectorStoreEngine(engineType: string): boolean {
  return isAllowedInLiteMode(engineType, ALLOWED_VECTOR_STORE_ENGINES)
}

export function isAllowedStorageProvider(provider: string): boolean {
  return isAllowedInLiteMode(provider, ALLOWED_STORAGE_PROVIDERS)
}

export function isAllowedWebSearchProvider(provider: string): boolean {
  return isAllowedInLiteMode(provider, ALLOWED_WEB_SEARCH_PROVIDERS)
}

/** 模型管理「远程服务商」是否允许展示（精简模式下走白名单） */
export function isAllowedModelProvider(provider: string): boolean {
  return isAllowedInLiteMode(provider, ALLOWED_MODEL_PROVIDERS)
}

/**
 * 知识库文档列表「来源」筛选项是否允许展示。
 * 与 hideDatasource / IM 白名单对齐；空字符串（全部来源）始终允许。
 */
export function isAllowedKnowledgeSource(source: string): boolean {
  if (!source) return true
  if (!isLiteModeEnabled()) return true
  if (DATASOURCE_KNOWLEDGE_SOURCES.has(source)) return false
  if (source === 'browser_extension') return false
  if (IM_KNOWLEDGE_SOURCES.has(source)) {
    return source === 'im' || ALLOWED_IM_PLATFORMS.has(source)
  }
  return true
}

/* ------------------------------------------------------------------ *
 * 4. 知识库 ID / 路由（与开关无关的纯工具）
 * ------------------------------------------------------------------ */

const WEKNORA_KB_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** yuxi 知识库管理面已删除，入口恒为 WeKnora KB */
export function shouldHideYuxiKnowledgeAdmin(): boolean {
  return true
}

export function isWeKnoraKbId(kbId: string | undefined | null): boolean {
  return WEKNORA_KB_ID_RE.test(String(kbId || '').trim())
}

/** 跳转知识库列表；runtime 管理面已删除，恒回平台 KB */
export function knowledgeBasesLocation(
  surface?: string,
): { path: string; query?: Record<string, string> } {
  if (surface === 'skills' || surface === 'tools' || surface === 'mcp') {
    return { path: `/platform/${surface}` }
  }
  return { path: '/platform/knowledge-bases' }
}

/** WeKnora 知识库详情；旧 yuxi kb_* 没有对应页，回到列表避免白屏 */
export function weknoraKnowledgeBaseLocation(kbId?: string | null): { path: string } {
  const id = String(kbId || '').trim()
  if (isWeKnoraKbId(id)) {
    return { path: `/platform/knowledge-bases/${id}` }
  }
  return { path: '/platform/knowledge-bases' }
}
