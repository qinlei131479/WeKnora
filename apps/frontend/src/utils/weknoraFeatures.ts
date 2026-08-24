/**
 * 二开功能开关（浏览器全局 localStorage，不绑用户/租户）。
 *
 * Key: WeKnora_hide_features
 *   - 未设置 / 非 "false" → 隐藏相关 UI（默认）
 *   - "false" → 全部显示
 *
 * 后续扩展：在 FeatureFlags 上加字段；存储可从 bool 升级为 JSON，
 * 调用方继续只读 getFeatureFlags() 返回对象即可。
 */

const STORAGE_KEY = 'WeKnora_hide_features'
/** 无缓存时写入的默认值（隐藏） */
const DEFAULT_VALUE = 'true'

/** 功能开关快照（后续只往这里加字段） */
export type FeatureFlags = {
  /** 隐藏 WeKnora Cloud / 云解析引擎 */
  hideCloud: boolean
  /** 隐藏侧栏「共享空间」 */
  hideOrganizations: boolean
  /** 隐藏 GitHub 跳转入口 */
  hideGithub: boolean
  /** 隐藏官方网站跳转入口 */
  hideWebsite: boolean
  /** 隐藏用户菜单「帮助与文档」 */
  hideHelpAndDocs: boolean
  /** 隐藏设置「消息管理」chathistory */
  hideChatHistory: boolean
  /** 隐藏 Chrome 插件集成页 */
  hideChrome: boolean
  /** 隐藏 Claw Skill 集成页 */
  hideClaw: boolean
  /** 隐藏设置「版本信息」system */
  hideVersionInfo: boolean
  /** 隐藏常规设置中的界面字体 / 代码字体选择 */
  hideFontPickers: boolean
  /** 隐藏顶部栏与常规设置中的字体大小 */
  hideFontSize: boolean
  /** 隐藏知识库「知识图谱」配置 */
  hideKnowledgeGraph: boolean
  /** 隐藏知识库「数据源导入」 */
  hideDatasource: boolean
  /** 隐藏智能体 / 知识库编辑页「共享管理」 */
  hideShareManagement: boolean
  /** 限制语言 / IM / 向量库 / 存储 / 搜索等白名单选项 */
  restrictProviderOptions: boolean
}

/** 云解析引擎 Name（勿用文案匹配） */
export const CLOUD_PARSER_ENGINES = new Set([
  'weknoracloud',
  'mineru_cloud',
  'paddleocr_vl_cloud',
])

/** 设置侧栏在 hide 模式下要藏的 section key */
const HIDDEN_SETTINGS_SECTIONS = new Set([
  'weknoracloud',
  'chathistory',
  'system',
  'integration-chrome',
  'integration-claw',
])

const ALLOWED_LOCALES = new Set(['zh-CN', 'en-US'])
const ALLOWED_IM_PLATFORMS = new Set(['dingtalk', 'wecom', 'feishu'])
const ALLOWED_VECTOR_STORE_ENGINES = new Set([
  'elasticsearch',
  'postgres',
  'milvus',
  'qdrant',
  'weaviate',
])
const ALLOWED_STORAGE_PROVIDERS = new Set(['local', 'minio', 'oss', 'cos'])
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

/**
 * 启动时调用：localStorage 无该 key 则写入默认值；已有则不动。
 */
export function ensureFeatureFlags(): void {
  try {
    if (localStorage.getItem(STORAGE_KEY) === null) {
      localStorage.setItem(STORAGE_KEY, DEFAULT_VALUE)
    }
  } catch {
    // private mode / disabled storage
  }
}

function readHide(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

/** 读 localStorage → 统一返回对象；默认全部隐藏相关入口 */
export function getFeatureFlags(): FeatureFlags {
  ensureFeatureFlags()
  const hide = readHide()
  return {
    hideCloud: hide,
    hideOrganizations: hide,
    hideGithub: hide,
    hideWebsite: hide,
    hideHelpAndDocs: hide,
    hideChatHistory: hide,
    hideChrome: hide,
    hideClaw: hide,
    hideVersionInfo: hide,
    hideFontPickers: hide,
    hideFontSize: hide,
    hideKnowledgeGraph: hide,
    hideDatasource: hide,
    hideShareManagement: hide,
    restrictProviderOptions: hide,
  }
}

/** 是否隐藏数据源导入模块 */
export function shouldHideDatasource(): boolean {
  return readHide()
}

/** 是否隐藏智能体 / 知识库编辑页「共享管理」 */
export function shouldHideShareManagement(): boolean {
  return readHide()
}

/** @deprecated 使用 shouldHideShareManagement */
export function shouldHideAgentShare(): boolean {
  return shouldHideShareManagement()
}

export function isCloudParserEngine(name: string): boolean {
  return CLOUD_PARSER_ENGINES.has(name)
}

/** 设置侧栏 section 是否应隐藏 */
export function isHiddenSettingsSection(key: string): boolean {
  return readHide() && HIDDEN_SETTINGS_SECTIONS.has(key)
}

/** 主侧栏菜单 path 是否应隐藏 */
export function isHiddenMenuPath(path: string): boolean {
  return readHide() && path === 'organizations'
}

/** 是否隐藏界面字体 / 代码字体选择 */
export function shouldHideFontPickers(): boolean {
  return readHide()
}

/** 是否隐藏顶部栏与常规设置中的字体大小 */
export function shouldHideFontSize(): boolean {
  return readHide()
}

/** 是否隐藏知识库「知识图谱」配置入口 */
export function shouldHideKnowledgeGraph(): boolean {
  return readHide()
}

function allowOrPass(id: string, allowSet: Set<string>): boolean {
  return !readHide() || allowSet.has(id)
}

export function isAllowedLocale(code: string): boolean {
  return allowOrPass(code, ALLOWED_LOCALES)
}

export function isAllowedIMPlatform(platform: string): boolean {
  return allowOrPass(platform, ALLOWED_IM_PLATFORMS)
}

export function isAllowedVectorStoreEngine(engineType: string): boolean {
  return allowOrPass(engineType, ALLOWED_VECTOR_STORE_ENGINES)
}

export function isAllowedStorageProvider(provider: string): boolean {
  return allowOrPass(provider, ALLOWED_STORAGE_PROVIDERS)
}

export function isAllowedWebSearchProvider(provider: string): boolean {
  return allowOrPass(provider, ALLOWED_WEB_SEARCH_PROVIDERS)
}

/** 模型管理「远程服务商」是否允许展示（hide 模式下走白名单） */
export function isAllowedModelProvider(provider: string): boolean {
  return allowOrPass(provider, ALLOWED_MODEL_PROVIDERS)
}

/**
 * 知识库文档列表「来源」筛选项是否允许展示。
 * 与 hideDatasource / hideChrome / IM 白名单对齐；空字符串（全部来源）始终允许。
 */
export function isAllowedKnowledgeSource(source: string): boolean {
  if (!source) return true
  if (!readHide()) return true

  // 数据源同步渠道
  if (DATASOURCE_KNOWLEDGE_SOURCES.has(source)) {
    return false
  }
  // Chrome 插件
  if (source === 'browser_extension') {
    return false
  }
  // IM：仅白名单平台 + 泛化 im 桶；web/url/manual/api 等非 IM 直接放行
  if (IM_KNOWLEDGE_SOURCES.has(source)) {
    return source === 'im' || ALLOWED_IM_PLATFORMS.has(source)
  }
  return true
}

/** hideCloud 时过滤云解析引擎列表（KB 设置 / 上传确认等共用） */
export function filterParserEngines<T extends { Name?: string; name?: string }>(
  engines: T[],
): T[] {
  if (!getFeatureFlags().hideCloud) return engines
  return engines.filter((e) => {
    const name = e.Name || e.name || ''
    return !isCloudParserEngine(name)
  })
}
