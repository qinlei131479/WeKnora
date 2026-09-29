<script setup lang="ts">
import { useData } from 'vitepress/client'
import { withBase } from 'vitepress'
import Illus from './Illus.vue'

const { theme } = useData()
const versionLabel = theme.value.platformVersion ?? 'unknown'

const stats = [
  { value: '2', unit: '套', label: '会话体系：平台对话与工作模式' },
  { value: '2', unit: '套', label: '智能体对象：平台智能体与 Runtime 智能体' },
  { value: '2', unit: '套', label: 'MCP 数据：平台 MCP 与 Runtime MCP' },
  { value: '1', unit: '套', label: '企业知识库：统一管理与检索引用' },
]

const schema = [
  {
    step: '01',
    name: '知识',
    hint: '企业资料统一入库',
    items: ['文件上传', 'URL 抓取', '解析分块', '向量索引', '关键词索引'],
  },
  {
    step: '02',
    name: '对话',
    hint: '面向成员的问答入口',
    items: ['平台对话', '知识检索', '引用溯源', '附件理解', '多模型管理'],
  },
  {
    step: '03',
    name: '执行',
    hint: '面向任务的智能体运行',
    items: ['工作模式', 'Runtime 智能体', '技能', '工具', 'MCP'],
  },
  {
    step: '04',
    name: '治理',
    hint: '租户与运行状态',
    items: ['租户成员', '角色权限', '工作区', '数据总览', '审计追踪'],
  },
]

const chain = [
  {
    step: '01',
    icon: 'read',
    title: '建好知识库',
    desc: '扫描件走 OCR、插图交给视觉模型描述、音频由语音模型转写、Excel 合并单元格自动补齐。独立的 docreader 服务把 PDF、Office、网页、图片与音频还原成带版式的文本，而不是只抽出一段纯文字。',
    href: '/03-features/03-document-parsing',
  },
  {
    step: '02',
    icon: 'chunk',
    title: '切好知识',
    desc: '按文档特征在标题、启发式、递归三档策略间自动选择切法，父子分块让检索命中小块、送进模型的却是完整上下文。知识库统一由企业侧管理，Runtime 只负责调用，不另建管理面。',
    href: '/02-architecture/03-document-pipeline',
  },
  {
    step: '03',
    icon: 'retrieve',
    title: '支撑平台对话',
    desc: '平台对话先做意图识别与查询改写，向量与 BM25 并行召回后用 RRF 融合，再由重排模型定序。回答流式返回，逐段标注出处，可点开原文核对。',
    href: '/03-features/05-retrieval-engines',
  },
  {
    step: '04',
    icon: 'answer',
    title: '运行工作模式',
    desc: '工作模式由 Runtime 智能体执行任务，可组合技能、内置工具、远程 MCP 和工作区文件。平台智能体与 Runtime 智能体分属两套对象与接口，边界清晰，便于分别治理。',
    href: '/03-features/07-agent',
  },
]

const surfaces = [
  { icon: 'console', name: 'Web 控制台', desc: '平台对话、工作模式、知识库、智能体、技能、工具、MCP 与工作区入口。' },
  { icon: 'embed', name: '网页嵌入挂件', desc: '一段 script 即可在自有站点提供悬浮问答，访客无需登录。' },
  { icon: 'bot', name: 'IM 机器人', desc: '企业微信、飞书、钉钉官方适配器。' },
  { icon: 'api', name: 'REST API', desc: '平台 /api/v1 与 Runtime /api 两类接口；API Key 支持按能力与知识库范围授权。' },
  { icon: 'mcp', name: 'MCP 接入', desc: '平台 MCP 与 Runtime MCP 分别接入外部工具，并支持授权与审批治理。' },
]

const features = [
  {
    icon: 'channels',
    title: '双会话体系',
    desc: '平台对话面向知识检索与即时问答，工作模式面向文件、工具和技能组合执行。两者独立管理会话、消息与运行状态，不共用一套对话对象。',
    href: '/03-features/18-chat-experience',
    tag: '产品边界',
  },
  {
    icon: 'wiki',
    title: '统一企业知识库',
    desc: '知识库、文档解析、分块、索引和权限统一由企业服务入口管理。Runtime 技能只通过适配层检索和引用企业知识，不复制另一套知识管理面。',
    href: '/03-features/02-knowledge-base',
    tag: '知识底座',
  },
  {
    icon: 'govern',
    title: '双智能体体系',
    desc: '平台智能体服务于平台对话、嵌入和渠道，Runtime 智能体服务于工作模式执行。对象模型、API 与管理入口分离，避免配置被误同步。',
    href: '/03-features/07-agent',
    tag: '智能体',
  },
  {
    icon: 'mcp',
    title: '双 MCP 数据',
    desc: '平台 MCP 与 Runtime MCP 分别注册、授权、测试和审批。跨体系迁移必须重建配置与授权，不做自动同步。',
    href: '/03-features/08-mcp',
    tag: '工具生态',
  },
  {
    icon: 'version',
    title: '技能与工具',
    desc: 'Runtime 技能由说明、脚本、内置工具、MCP 依赖和技能依赖组成；平台侧提供沙箱配置与安装治理，两类边界不混用。',
    href: '/03-features/22-skills-sandbox',
    tag: '执行能力',
  },
  {
    icon: 'faq',
    title: '工作区与数据总览',
    desc: '工作模式提供受控工作区和文件访问边界，管理端可查看用量、队列与运行数据。技能执行、文件产物和平台资源分开排查。',
    href: '/03-features/20-platform-admin',
    tag: '运行治理',
  },
]

const map = [
  {
    index: '01',
    icon: 'start',
    title: '快速开始',
    brief: '按顺序读完四篇，可完成部署并跑通首次问答。',
    items: [
      { text: '产品介绍', link: '/01-getting-started/01-introduction' },
      { text: '快速上手', link: '/01-getting-started/03-quickstart' },
      { text: '配置详解', link: '/01-getting-started/04-configuration' },
      { text: '安装部署', link: '/01-getting-started/02-installation' },
    ],
  },
  {
    index: '02',
    icon: 'arch',
    title: '架构',
    brief: '系统全貌，以及文档入库与检索问答两条主干流水线。',
    items: [
      { text: '总体架构', link: '/02-architecture/01-overview' },
      { text: 'Go 后端设计', link: '/02-architecture/02-backend-design' },
      { text: '文档入库流程', link: '/02-architecture/03-document-pipeline' },
      { text: '检索问答流程', link: '/02-architecture/04-rag-pipeline' },
      { text: '异步任务系统', link: '/02-architecture/05-async-tasks' },
    ],
  },
  {
    index: '03',
    icon: 'modules',
    title: '功能模块',
    brief: '当前业务开放能力的配置项、行为约定与实现路径。',
    items: [
      { text: '租户、用户与认证授权', link: '/03-features/01-tenant-auth' },
      { text: '知识库与知识管理', link: '/03-features/02-knowledge-base' },
      { text: '文档解析服务 docreader', link: '/03-features/03-document-parsing' },
      { text: '分块机制', link: '/03-features/04-chunking' },
      { text: '检索引擎与向量存储', link: '/03-features/05-retrieval-engines' },
      { text: '模型管理', link: '/03-features/06-models' },
      { text: '智能体体系', link: '/03-features/07-agent' },
      { text: 'MCP 集成', link: '/03-features/08-mcp' },
      { text: '网络搜索与网页抓取', link: '/03-features/11-web-search' },
      { text: 'IM 集成', link: '/03-features/12-im-integration' },
      { text: '网页嵌入 Embed', link: '/03-features/13-embed-channel' },
      { text: 'Wiki 能力', link: '/03-features/14-wiki' },
      { text: '评估能力', link: '/03-features/15-evaluation' },
      { text: '可观测性与审计', link: '/03-features/16-observability' },
      { text: 'FAQ 能力', link: '/03-features/17-faq' },
      { text: '会话与对话体验', link: '/03-features/18-chat-experience' },
      { text: '存储后端', link: '/03-features/19-storage-backends' },
      { text: '平台管理与系统管理员', link: '/03-features/20-platform-admin' },
      { text: '图片与文件的对外访问', link: '/03-features/21-file-access' },
      { text: '技能目录与沙箱', link: '/03-features/22-skills-sandbox' },
    ],
  },
  {
    index: '04',
    icon: 'api',
    title: 'API 参考',
    brief: '开放接口说明，含权限要求、参数表与 curl 示例。',
    items: [
      { text: 'API 总览', link: '/04-api/01-api-overview' },
      { text: 'Agent、MCP 与技能', link: '/04-api/02-api-agent-mcp' },
      { text: '认证与用户', link: '/04-api/02-api-auth' },
      { text: 'IM、Embed 与文件', link: '/04-api/02-api-channels' },
      { text: '会话、消息与聊天', link: '/04-api/02-api-chat' },
      { text: '分块与标签', link: '/04-api/02-api-chunks' },
      { text: 'FAQ 与 Wiki', link: '/04-api/02-api-faq-wiki' },
      { text: '基础设施', link: '/04-api/02-api-infra' },
      { text: '知识库与知识', link: '/04-api/02-api-knowledge' },
      { text: '模型与初始化', link: '/04-api/02-api-model-system' },
      { text: '沙箱、技能与个人变量', link: '/04-api/02-api-sandbox-skills' },
      { text: '系统与平台管理', link: '/04-api/02-api-system' },
      // { text: '组织与共享', link: '/04-api/02-api-org' },
      { text: '租户与成员', link: '/04-api/02-api-tenant' },
    ],
  },
  {
    index: '05',
    icon: 'clients',
    title: '客户端',
    brief: 'Web 控制台等当前开放入口。',
    items: [
      { text: 'Web 前端', link: '/05-clients/01-frontend' },
    ],
  },
  {
    index: '06',
    icon: 'dev',
    title: '开发指南',
    brief: '企业模块本地开发、数据库迁移与扩展点。',
    items: [
      { text: '开发指南', link: '/06-development/01-dev-guide' },
      { text: '数据库与迁移', link: '/06-development/02-database-schema' },
      { text: '扩展点指南', link: '/06-development/03-extension-points' },
    ],
  },
]

const deployments = [
  { icon: 'compose', name: 'Docker Compose', desc: '标准部署，12 个可选 profile 组合基础设施', note: '' },
  { icon: 'helm', name: 'Helm', desc: 'Kubernetes 集群编排，适用于生产多副本', note: '' },
  // 单机形态：业务文档默认不展示
  // {
  //   icon: 'lite',
  //   name: '单二进制 / 桌面应用',
  //   desc: 'SQLite + 进程内队列，无需 Docker 与外部数据库；提供命令行与图形界面两种形式',
  //   note: '桌面应用尚未正式发布，需自行构建',
  // },
]
</script>

<template>
  <div class="landing">
    <!-- ============================= Hero ============================= -->
    <section class="hero">
      <div class="shell hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">智能体中台2.0 · {{ versionLabel }} · 内部文档</p>
          <h1 class="display">
           企业智能体与知识库中台
          </h1>
          <p class="lede">智能体中台2.0 将企业知识库、平台对话、工作模式、智能体、技能、工具与 MCP 组合成一套可私有部署的运行体系。资料统一入库和检索，任务在工作区中执行，平台与 Runtime 的对象、接口和数据边界清晰。</p>
          <p class="lede lede-sub">本文档覆盖产品能力、部署配置、接口参考、企业模块开发与扩展点。</p>
          <div class="actions">
            <a class="btn btn-solid" :href="withBase('/01-getting-started/01-introduction')">开始阅读</a>
            <a class="btn btn-ghost" :href="withBase('/02-architecture/01-overview')">系统架构</a>
          </div>
        </div>

        <aside class="hero-side">
          <div class="schema" aria-label="能力分层">
            <p class="schema-title">能力分层</p>
            <ol class="schema-layers">
              <li v-for="layer in schema" :key="layer.name" class="layer">
                <span class="layer-step">{{ layer.step }}</span>
                <div class="layer-body">
                  <p class="layer-head">
                    <span class="layer-name">{{ layer.name }}</span>
                    <span class="layer-hint">{{ layer.hint }}</span>
                  </p>
                  <div class="layer-items">
                    <span v-for="n in layer.items" :key="n" class="chip">{{ n }}</span>
                  </div>
                </div>
              </li>
            </ol>
            <p class="schema-note">各层实现均可替换，未使用的能力可关闭；模型支持本地部署。</p>
          </div>
        </aside>
      </div>

      <svg class="wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 74C180 40 360 34 540 52c180 18 300 44 480 42s240-30 420-52"
          fill="none"
          stroke="var(--wk-ink)"
          stroke-opacity="0.16"
          stroke-width="1.5"
        />
        <path
          d="M0 92C200 62 380 58 560 74c180 16 300 40 470 36s250-26 410-44"
          fill="none"
          stroke="var(--wk-gold)"
          stroke-opacity="0.45"
          stroke-width="1.2"
        />
        <path
          d="M0 108C220 84 400 82 580 94c180 12 320 32 500 28s260-22 360-34"
          fill="none"
          stroke="var(--wk-ink)"
          stroke-opacity="0.08"
          stroke-width="1"
        />
      </svg>
    </section>

    <!-- ============================ 全景 ============================ -->
    <section class="panorama">
      <div class="shell">
        <Illus name="flow" class="panorama-illus" />
        <p class="panorama-note">
          资料从文件与网页进入企业知识库，解析和分块后写入检索索引；
          平台对话负责带出处的问答，工作模式通过 Runtime 智能体组合技能、工具、MCP 与工作区文件执行任务。
        </p>
      </div>
    </section>

    <!-- ============================ 数字 ============================ -->
    <section class="stats">
      <div class="shell stats-row">
        <div v-for="s in stats" :key="s.label" class="stat">
          <span class="stat-value">{{ s.value }}<i>{{ s.unit }}</i></span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
      </div>
    </section>

    <!-- ============================ 主链路 ============================ -->
    <section class="chapter">
      <div class="shell">
        <header class="chapter-head">
          <span class="marker">处理流程</span>
          <h2 class="chapter-title">从企业资料，到可治理的智能体执行</h2>
          <p class="chapter-sub">问答效果取决于解析、分块和召回，任务执行效果取决于技能、工具、凭据与工作区边界。下面四个环节分别对应平台的核心路径。</p>
        </header>

        <ol class="chain">
          <li v-for="c in chain" :key="c.step" class="chain-item">
            <a :href="withBase(c.href)">
              <span class="chain-head">
                <Illus :name="c.icon" class="chain-icon" />
                <span class="chain-step">{{ c.step }}</span>
              </span>
              <h3 class="chain-title">{{ c.title }}</h3>
              <p class="chain-desc">{{ c.desc }}</p>
            </a>
          </li>
        </ol>
      </div>
    </section>

    <!-- ============================ 特色能力 ============================ -->
    <section class="chapter chapter-alt">
      <div class="shell">
        <header class="chapter-head">
          <span class="marker">核心能力</span>
          <h2 class="chapter-title">产品能力边界</h2>
          <p class="chapter-sub">先区分平台与 Runtime，再配置具体能力，避免把两套对象误当成同一套体系。</p>
        </header>

        <div class="features">
          <a v-for="f in features" :key="f.title" class="feature" :href="withBase(f.href)">
            <span class="feature-head">
              <Illus :name="f.icon" class="feature-icon" />
              <span class="feature-tag">{{ f.tag }}</span>
            </span>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </a>
        </div>
      </div>
    </section>

    <!-- ============================ 触达方式 ============================ -->
    <section class="chapter">
      <div class="shell">
        <header class="chapter-head">
          <span class="marker">接入方式</span>
          <h2 class="chapter-title">客户端与集成入口</h2>
          <p class="chapter-sub">同一套企业知识库和租户身份体系，可从浏览器、IM、自有站点与 API 访问，不需要为每个入口重复搭建。</p>
        </header>

        <div class="surfaces">
          <div v-for="s in surfaces" :key="s.name" class="surface">
            <h3 class="surface-name">
              <Illus :name="s.icon" class="surface-icon" />
              {{ s.name }}
            </h3>
            <p class="surface-desc">{{ s.desc }}</p>
          </div>
        </div>

        <div class="surfaces-actions">
          <a class="btn btn-ghost" :href="withBase('/05-clients/01-frontend')">查看客户端文档</a>
          <a class="btn btn-text" :href="withBase('/03-features/13-embed-channel')">网页嵌入 ↗</a>
          <a class="btn btn-text" :href="withBase('/03-features/12-im-integration')">IM 集成 ↗</a>
        </div>
      </div>
    </section>

    <!-- ============================ 文档地图 ============================ -->
    <section class="chapter chapter-alt">
      <div class="shell">
        <header class="chapter-head">
          <span class="marker">文档地图</span>
          <h2 class="chapter-title">六个部分，按需查阅</h2>
          <p class="chapter-sub">覆盖部署上手、系统架构、功能说明、接口参考、客户端与开发指南。</p>
        </header>

        <div class="map">
          <section
            v-for="m in map"
            :key="m.index"
            class="map-block"
            :class="{ 'map-block-wide': m.items.length > 8 }"
          >
            <div class="map-head">
              <span class="map-index">{{ m.index }}</span>
              <h3 class="map-title">
                <Illus :name="m.icon" class="map-icon" />
                {{ m.title }}
              </h3>
              <p class="map-brief">{{ m.brief }}</p>
            </div>
            <ul class="map-list">
              <li v-for="it in m.items" :key="it.link">
                <a :href="withBase(it.link)">{{ it.text }}</a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </section>

    <!-- ============================ 部署 ============================
    <section class="chapter">
      <div class="shell deploy">
        <div class="deploy-copy">
          <span class="marker">部署</span>
          <h2 class="chapter-title">部署形态</h2>
          <p class="chapter-sub">标准部署准备源码与环境变量、改两个密钥、一条命令拉起全套服务。</p>
          <ul class="deploy-list">
            <li v-for="d in deployments" :key="d.name">
              <span class="deploy-name">
                <Illus :name="d.icon" class="deploy-icon" />
                {{ d.name }}
              </span>
              <span class="deploy-desc">
                {{ d.desc }}
                <span v-if="d.note" class="deploy-note">{{ d.note }}</span>
              </span>
            </li>
          </ul>
          <a class="btn btn-ghost" :href="withBase('/01-getting-started/02-installation')">查看安装部署</a>
        </div>

        <div class="deploy-code">
          <div class="code-bar">
            <span>标准部署 · Docker Compose</span>
          </div>
          <pre><code><span class="c"># 1 进入项目目录（使用内部发布的源码包或已克隆的仓库）</span>
cd Agent-Middle-Platform

<span class="c"># 2 准备配置：至少修改 JWT_SECRET 与 SYSTEM_AES_KEY</span>
cp .env.example .env

<span class="c"># 3 拉起全部服务（首次需拉取镜像）</span>
docker compose up -d --pull always

<span class="c"># 4 确认服务就绪</span>
docker compose ps
curl http://localhost:8080/health

<span class="c"># 5 打开前端（默认 80 端口，可用 FRONTEND_PORT 改）</span>
open http://localhost

<span class="c"># 停止：docker compose down</span></code></pre>
          <p class="deploy-code-note">
            首次打开前端会落到注册页，注册后在初始化向导里配置对话模型与向量模型，即可建库提问。后端 API 与前端同域，走 <code>http://localhost/api/v1</code>。
            完整步骤见<a :href="withBase('/01-getting-started/03-quickstart')">快速上手</a>，其余部署形态与参数见<a :href="withBase('/01-getting-started/02-installation')">安装部署</a>。
          </p>
        </div>
      </div>
    </section>
-->
    <!-- ============================ 结尾 ============================ -->
    <footer class="closing">
      <div class="shell closing-inner">
        <div class="closing-brand">
          <svg width="34" height="26" viewBox="0 0 34 26" fill="none" aria-hidden="true">
            <path
              d="M20.6 3.2c.36-.5 1.16-.22 1.13.39l-.53 10.2-6.9-.05c-.6 0-.86-.75-.4-1.13L20.6 3.2z"
              fill="currentColor"
            />
            <path
              d="M1.5 18.4c6.4-1.9 12.2-1.1 18.1.35 4.3 1.05 8.2 1.6 12.9.1"
              stroke="currentColor"
              stroke-width="2.1"
              stroke-linecap="round"
            />
            <path
              d="M4.4 22.1c5.6-1.35 10.8-.7 16 .5 3.8.87 7.2 1.2 11.3.15"
              stroke="var(--wk-gold)"
              stroke-width="1.4"
              stroke-linecap="round"
            />
          </svg>
          <span>智能体中台2.0</span>
        </div>
        <p class="closing-note">文档基于仓库 {{ versionLabel }} 源码整理。</p>
        <div class="closing-links">
          <a :href="withBase('/01-getting-started/01-introduction')">快速开始</a>
          <a :href="withBase('/04-api/01-api-overview')">API 总览</a>
          <a :href="withBase('/06-development/03-extension-points')">扩展点</a>
        </div>
        <p class="closing-copy">智能体中台2.0 · 内部文档</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  /* 与文档页铺满视口的正文列保持同一量级，避免首页明显更窄 */
  --shell: 1600px;
  color: var(--wk-ink);
}

.shell {
  max-width: var(--shell);
  margin: 0 auto;
  padding: 0 32px;
}

.marker {
  display: inline-block;
  font-family: var(--wk-font-sans);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-transform: none;
  color: var(--wk-accent);
  margin-bottom: 16px;
}

.marker::before {
  display: none;
}

/* ------------------------------- Hero ------------------------------- */

.hero {
  position: relative;
  padding: clamp(80px, 13vw, 168px) 0 clamp(96px, 12vw, 150px);
  overflow: hidden;
}

.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(80% 60% at 70% -10%, rgba(196, 122, 26, 0.08), transparent 55%),
    linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%);
  pointer-events: none;
}

.dark .hero::before {
  background:
    radial-gradient(80% 60% at 70% -10%, rgba(224, 160, 58, 0.12), transparent 55%),
    linear-gradient(180deg, #000000 0%, #1d1d1f 100%);
}

.hero-grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 76px;
  align-items: center;
}

.eyebrow {
  font-family: var(--wk-font-sans);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-transform: none;
  color: var(--wk-accent);
  margin: 0 0 20px;
}

.display {
  font-family: var(--wk-font-sans);
  font-weight: 700;
  font-size: clamp(40px, 5vw, 72px);
  line-height: 1.05;
  letter-spacing: -0.04em;
  margin: 0;
  color: var(--wk-ink);
}

.lede {
  margin: 28px 0 0;
  max-width: 52ch;
  font-size: 19px;
  line-height: 1.47;
  font-weight: 400;
  letter-spacing: -0.011em;
  color: var(--wk-ink-soft);
}

/* 第二段说明这个站点本身是什么，弱化一档以免与定位句抢注意力 */
.lede-sub {
  margin-top: 14px;
  font-size: 15px;
  color: var(--wk-ink-mute);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-top: 46px;
}

.btn {
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 22px;
  border-radius: 980px;
  font-size: 17px;
  font-weight: 400;
  letter-spacing: -0.022em;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
}

.btn-solid {
  background: var(--wk-accent);
  color: #fff;
  border: 1px solid transparent;
}

.btn-solid:hover {
  background: var(--wk-accent-hover, #a86512);
  color: #fff;
  opacity: 0.92;
}

.btn-ghost {
  border: none;
  color: var(--wk-accent);
  background: transparent;
  padding-left: 8px;
}

.btn-ghost:hover {
  border-color: transparent;
  color: var(--wk-accent-hover, #a86512);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.btn-text {
  border: none;
  background: transparent;
  padding-left: 6px;
  padding-right: 6px;
  font-size: 15px;
  color: var(--wk-ink-mute, #6e6e73);
}

.btn-text:hover {
  color: var(--wk-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* 系统组件概览 */

/* 全景图：整条链路加九个客户端，横向铺得很开，
   塞进首屏右栏那张卡片里只会挤成一团，所以单独占一条通栏 */
.panorama {
  padding: clamp(18px, 3vw, 40px) 0 clamp(28px, 4vw, 56px);
}

.panorama-illus {
  display: block;
  width: 100%;
  max-width: 1180px;
  height: auto;
  margin: 0 auto;
  color: var(--wk-ink);
  opacity: 0.9;
}

.panorama-note {
  max-width: 860px;
  margin: 26px auto 0;
  text-align: center;
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--wk-ink-mute);
}

/* 能力分层：序号列 + 贯穿的竖轴表达自上而下的流向，
   原来只靠层间一个小箭头，读者看不出这是一条流水线 */
.schema {
  padding: 26px 26px 22px;
  border: 1px solid var(--wk-rule);
  border-radius: 4px;
  background: color-mix(in srgb, var(--wk-paper-2) 60%, transparent);
}

.schema-title {
  margin: 0 0 20px;
  font-family: var(--wk-font-mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--wk-ink-mute);
}

.schema-layers {
  margin: 0;
  padding: 0;
  list-style: none;
}

.layer {
  position: relative;
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 14px;
  padding: 0 0 22px;
}

.layer:last-child {
  padding-bottom: 0;
}

/* 竖轴连接各层序号；最后一层不再向下延伸 */
.layer:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 11px;
  top: 24px;
  bottom: 4px;
  width: 1px;
  background: var(--wk-rule);
}

.layer-step {
  z-index: 1;
  display: grid;
  place-items: center;
  width: 23px;
  height: 23px;
  border: 1px solid var(--wk-rule);
  border-radius: 50%;
  background: var(--wk-paper);
  font-family: var(--wk-font-mono);
  font-size: 10px;
  color: var(--wk-ink-mute);
}

.layer-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 3px 0 10px;
}

.layer-name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--wk-ink);
}

.layer-hint {
  font-size: 12px;
  color: var(--wk-ink-mute);
}

.layer-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  font-size: 12px;
  line-height: 1.5;
  padding: 4px 10px;
  border: 1px solid var(--wk-rule);
  border-radius: 2px;
  color: var(--wk-ink-soft);
  background: color-mix(in srgb, var(--wk-paper) 70%, transparent);
  white-space: nowrap;
}

.schema-note {
  margin: 22px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--wk-rule-soft);
  font-size: 12px;
  line-height: 1.7;
  color: var(--wk-ink-mute);
}

.wave {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  width: 100%;
  height: 120px;
  pointer-events: none;
}

/* ------------------------------- 数字 ------------------------------- */

.stats {
  border-top: 1px solid var(--wk-rule-soft);
  border-bottom: 1px solid var(--wk-rule-soft);
  background: var(--wk-paper-2);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat {
  padding: 34px 0;
  text-align: center;
  border-left: 1px solid var(--wk-rule-soft);
}

.stat:first-child {
  border-left: none;
}

.stat-value {
  display: block;
  font-family: var(--wk-font-sans);
  font-size: 40px;
  line-height: 1;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.stat-value i {
  font-style: normal;
  font-size: 0.6em;
  color: var(--wk-gold);
  margin-left: 2px;
}

.stat-label {
  display: block;
  /* 中文可在任意字符间断行，宽度卡在词中间就会拆出「扫描 / 件」这种断法。
     放宽一档并让浏览器均衡两行长度，词组更容易落在同一行 */
  max-width: 26ch;
  /* keep-all 让中文只在顿号、冒号处断行，不再从词中间劈开 */
  word-break: keep-all;
  text-wrap: balance;
  margin: 12px auto 0;
  font-size: 12.5px;
  line-height: 1.7;
  letter-spacing: 0.04em;
  color: var(--wk-ink-mute);
}

/* ------------------------------ 章节通用 ------------------------------ */

.chapter {
  padding: clamp(36px, 4.5vw, 64px) 0;
}

.chapter-alt {
  background: var(--wk-paper-2);
  border-top: 1px solid var(--wk-rule-soft);
  border-bottom: 1px solid var(--wk-rule-soft);
}

.chapter-head {
  max-width: 780px;
  margin-bottom: 28px;
}

.chapter-title {
  font-family: var(--wk-font-sans);
  font-weight: 700;
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.08;
  letter-spacing: -0.035em;
  margin: 0;
  border: none;
  padding: 0;
}

.chapter-sub {
  margin: 16px 0 0;
  font-size: 19px;
  line-height: 1.47;
  letter-spacing: -0.011em;
  color: var(--wk-ink-soft);
}

/* ------------------------------- 主链路 ------------------------------- */

.chain {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid var(--wk-rule);
}

.chain-item {
  border-left: 1px solid var(--wk-rule-soft);
}

.chain-item:first-child {
  border-left: none;
}

.chain-item a {
  display: block;
  height: 100%;
  padding: 32px 28px 40px 0;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.22s ease;
}

.chain-item:not(:first-child) a {
  padding-left: 28px;
}

.chain-item a:hover {
  opacity: 0.62;
}

.chain-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chain-icon {
  width: 26px;
  height: 26px;
  flex: none;
  color: var(--wk-ink);
}

.chain-step {
  font-family: var(--wk-font-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--wk-gold);
}

.chain-title {
  font-family: var(--wk-font-sans);
  font-size: 21px;
  font-weight: 500;
  margin: 16px 0 14px;
  letter-spacing: -0.01em;
}

.chain-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--wk-ink-soft);
}

/* ------------------------------ 特色能力 ------------------------------ */

.features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--wk-rule);
}

.feature {
  display: block;
  padding: 30px 30px 36px 0;
  border-bottom: 1px solid var(--wk-rule-soft);
  border-left: 1px solid var(--wk-rule-soft);
  text-decoration: none;
  color: inherit;
  transition: opacity 0.22s ease;
}

.feature:nth-child(3n + 1) {
  border-left: none;
}

.feature:not(:nth-child(3n + 1)) {
  padding-left: 30px;
}

.feature:nth-last-child(-n + 3) {
  border-bottom: none;
}

.feature:hover {
  opacity: 0.62;
}

.feature-head {
  display: flex;
  align-items: center;
  gap: 11px;
}

.feature-icon {
  width: 24px;
  height: 24px;
  flex: none;
  color: var(--wk-ink);
}

.feature-tag {
  font-family: var(--wk-font-mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--wk-gold);
}

.feature-title {
  font-family: var(--wk-font-sans);
  font-size: 20px;
  font-weight: 500;
  margin: 14px 0 12px;
  letter-spacing: -0.01em;
}

.feature-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--wk-ink-soft);
}

/* ------------------------------ 触达方式 ------------------------------ */

.surfaces {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px 56px;
}

.surface {
  padding-top: 18px;
  border-top: 1px solid var(--wk-rule-soft);
}

.surface-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 8px;
  letter-spacing: 0.01em;
}

.surface-icon {
  width: 20px;
  height: 20px;
  flex: none;
  color: var(--wk-ink);
}

.surface-desc {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--wk-ink-soft);
}

.surfaces-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  margin-top: 44px;
}

/* ------------------------------ 文档地图 ------------------------------ */

.map {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 72px;
}

.map-block {
  padding: 40px 0;
  border-top: 1px solid var(--wk-rule);
}

.map-head {
  display: grid;
  grid-template-columns: 46px 1fr;
  align-items: baseline;
  row-gap: 10px;
}

.map-index {
  font-family: var(--wk-font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--wk-gold);
}

.map-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--wk-font-sans);
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  letter-spacing: -0.01em;
}

.map-icon {
  width: 22px;
  height: 22px;
  flex: none;
  color: var(--wk-ink);
}

.map-brief {
  grid-column: 2;
  margin: 0;
  font-size: 13.8px;
  line-height: 1.75;
  color: var(--wk-ink-mute);
}

.map-list {
  list-style: none;
  margin: 26px 0 0 46px;
  padding: 0;
  columns: 1;
}

.map-block-wide {
  grid-column: 1 / -1;
}

.map-block-wide .map-list {
  columns: 3;
  column-gap: 72px;
}

.map-block-wide .map-brief {
  max-width: 52ch;
}

.map-list li {
  border-bottom: 1px solid var(--wk-rule-soft);
}

.map-list a {
  display: block;
  padding: 11px 0;
  font-size: 14.5px;
  color: var(--wk-ink-soft);
  text-decoration: none;
  transition: color 0.18s ease, padding-left 0.18s ease;
}

.map-list a:hover {
  color: var(--wk-ink);
  padding-left: 8px;
}

/* ------------------------------- 部署 ------------------------------- */

.deploy {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: 72px;
  align-items: start;
}

.deploy-list {
  list-style: none;
  margin: 38px 0;
  padding: 0;
  border-top: 1px solid var(--wk-rule-soft);
}

.deploy-list li {
  display: grid;
  /* 名称列要装下图标和部署名称，比原来放宽一档 */
  grid-template-columns: 178px 1fr;
  gap: 16px;
  padding: 15px 0;
  border-bottom: 1px solid var(--wk-rule-soft);
}

.deploy-name {
  display: grid;
  grid-template-columns: 20px 1fr;
  align-items: start;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
}

.deploy-icon {
  width: 20px;
  height: 20px;
  margin-top: 1px;
  color: var(--wk-ink);
}

/* 「尚未正式发布」这类限定跟在说明之后。放在名称列会被 150px 的窄列挤断，
   放这里既不断字，也仍然紧贴对应条目。 */
.deploy-note {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 10px;
  border: 1px solid var(--wk-rule);
  border-radius: 980px;
  font-family: var(--wk-font-sans);
  font-size: 11px;
  line-height: 1.7;
  letter-spacing: 0.01em;
  white-space: nowrap;
  color: var(--wk-ink-mute);
}

.deploy-desc {
  font-size: 13.8px;
  line-height: 1.7;
  color: var(--wk-ink-mute);
}

.deploy-code {
  border: 1px solid var(--wk-rule);
  border-radius: 14px;
  overflow: hidden;
  background: #1d1d1f;
}

.code-bar {
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-family: var(--wk-font-sans);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(245, 245, 247, 0.45);
}

.deploy-code pre {
  margin: 0;
  padding: 24px 22px 28px;
  overflow-x: auto;
}

.deploy-code code {
  font-family: var(--wk-font-mono);
  font-size: 13px;
  line-height: 2;
  color: #f5f5f7;
}

.deploy-code .c {
  color: rgba(224, 160, 58, 0.9);
}

/* 代码块本身只到「服务起来了」，后续动作与延伸阅读放在下面这行，
   避免读者以为跑完命令就结束了 */
.deploy-code-note {
  margin: 0;
  padding: 16px 22px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12.5px;
  line-height: 1.9;
  color: rgba(223, 231, 242, 0.62);
}

.deploy-code-note code {
  font-family: var(--wk-font-mono);
  font-size: 12px;
  color: rgba(223, 231, 242, 0.85);
}

.deploy-code-note a {
  color: var(--wk-gold-light);
  text-decoration: none;
  border-bottom: 1px solid rgba(217, 169, 79, 0.4);
}

.deploy-code-note a:hover {
  border-bottom-color: var(--wk-gold-light);
}

/* ------------------------------- 结尾 ------------------------------- */

.closing {
  border-top: 1px solid var(--wk-rule-soft);
  background: var(--wk-paper-2);
  padding: 70px 0 60px;
}

.closing-inner {
  display: grid;
  gap: 26px;
  justify-items: center;
  text-align: center;
}

.closing-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--wk-font-sans);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.closing-note {
  max-width: 58ch;
  margin: 0;
  font-size: 13.5px;
  line-height: 1.9;
  color: var(--wk-ink-mute);
}

.closing-note code {
  font-family: var(--wk-font-mono);
  font-size: 0.9em;
}

.closing-links {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
}

.closing-links a {
  font-size: 13.5px;
  color: var(--wk-ink-soft);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  padding-bottom: 2px;
  transition: all 0.2s ease;
}

.closing-links a:hover {
  color: var(--wk-ink);
  border-bottom-color: var(--wk-gold);
}

.closing-copy {
  margin: 0;
  font-family: var(--wk-font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--wk-ink-mute);
}

/* ------------------------------ 响应式 ------------------------------ */

@media (max-width: 1080px) {
  .hero-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 56px;
  }
  .map-block-wide .map-list {
    columns: 2;
    column-gap: 48px;
  }
  .chain {
    grid-template-columns: repeat(2, 1fr);
  }
  .chain-item:nth-child(odd) {
    border-left: none;
  }
  .chain-item:nth-child(n + 3) {
    border-top: 1px solid var(--wk-rule-soft);
  }
  .chain-item a,
  .chain-item:not(:first-child) a {
    padding-left: 0;
  }
  .chain-item:nth-child(even) a {
    padding-left: 28px;
  }
  .features {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .feature,
  .feature:not(:nth-child(3n + 1)) {
    padding-left: 0;
    border-left: none;
  }
  .feature:nth-child(even) {
    padding-left: 30px;
    border-left: 1px solid var(--wk-rule-soft);
  }
  .feature:nth-last-child(-n + 3) {
    border-bottom: 1px solid var(--wk-rule-soft);
  }
  .feature:nth-last-child(-n + 2) {
    border-bottom: none;
  }
  .surfaces {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 40px;
  }
  .map {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
  .deploy {
    grid-template-columns: minmax(0, 1fr);
    gap: 48px;
  }
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
  .stat:nth-child(3n + 1) {
    border-left: none;
  }
  .stat:nth-child(n + 4) {
    border-top: 1px solid var(--wk-rule-soft);
  }
}

@media (max-width: 640px) {
  .shell {
    padding: 0 22px;
  }
  .display br {
    display: none;
  }
  .chain {
    grid-template-columns: minmax(0, 1fr);
  }
  .chain-item {
    border-left: none;
  }
  .chain-item:not(:first-child) {
    border-top: 1px solid var(--wk-rule-soft);
  }
  .chain-item:nth-child(even) a {
    padding-left: 0;
  }
  .surfaces {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
  .features {
    grid-template-columns: minmax(0, 1fr);
  }
  .feature,
  .feature:nth-child(even) {
    padding-left: 0;
    border-left: none;
    border-bottom: 1px solid var(--wk-rule-soft);
  }
  .feature:last-child {
    border-bottom: none;
  }
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat {
    border-left: 1px solid var(--wk-rule-soft);
  }
  .stat:nth-child(odd) {
    border-left: none;
  }
  .stat:nth-child(n + 3) {
    border-top: 1px solid var(--wk-rule-soft);
  }
  .map-block-wide .map-list {
    columns: 1;
  }
  .map-head {
    grid-template-columns: 1fr;
  }
  .map-brief {
    grid-column: 1;
  }
  .map-list {
    margin-left: 0;
  }
  .deploy-list li {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
