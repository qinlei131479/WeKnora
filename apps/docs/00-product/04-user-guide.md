# 操作指南

按任务完成「从空环境到可用问答」。每一步只写界面操作；配置项与原理请点文内技术链接。

> 前置：环境已就绪，你能打开 Web 控制台并登录。安装步骤见 [安装部署](/01-getting-started/02-installation)。

---

## 登录与进入工作空间

1. 浏览器打开部署方提供的地址
2. 使用账号登录（或按约定的首次注册 / 邀请流程）
3. 确认当前工作空间正确（多人多空间时注意切换）

<Screenshot
  src="/screenshots/product-login.png"
  caption="登录页"
  hint="展示登录表单（用户名/邮箱与密码，或项目实际登录方式）。" />

卡在登录或权限时，见 [角色与权限](./05-roles-delivery) 与 [租户与认证](/03-features/01-tenant-auth)。

---

## 建库与上传资料

1. 打开侧栏 **知识库**，创建知识库（文档型最常见）
2. 填写名称等基本信息并保存
3. 进入知识库，上传 PDF / Word 等文件，或添加网页 URL
4. 等待解析状态变为完成；失败则查看文件格式与解析相关设置

<Screenshot
  src="/screenshots/product-kb-create.png"
  caption="创建知识库"
  hint="展示创建知识库的表单或对话框（名称、类型等关键字段）。" />

<Screenshot
  src="/screenshots/product-kb-upload.png"
  caption="上传文档与解析状态"
  hint="展示上传入口及文档列表中的解析中/已完成/失败状态。" />

技术参考：[知识库](/03-features/02-knowledge-base)、[文档解析](/03-features/03-document-parsing)。

---

## 配置模型

问答与向量检索都依赖模型。一般由管理员在 **设置 → 模型** 中配置：

1. 准备对话模型（LLM）与向量模型（Embedding）；按需配置重排等
2. 填写服务地址与密钥（或使用本地推理）
3. 在知识库 / 智能体侧选用已配置好的模型

<Screenshot
  src="/screenshots/product-model-settings.png"
  caption="模型管理"
  hint="展示模型列表或新增模型表单（类型、提供商、名称等可见）。" />

技术参考：[模型管理](/03-features/06-models)、[配置详解](/01-getting-started/04-configuration)。

---

## 创建智能体并绑定知识库

1. 打开侧栏 **智能体**，新建智能体
2. 选择模式（如快速问答 / 智能推理），按场景填写说明
3. 绑定要用的知识库（可多库）
4. 保存后，在对话页选择该智能体试问

<Screenshot
  src="/screenshots/product-agent-create.png"
  caption="创建或编辑智能体"
  hint="展示智能体编辑页：模式、知识库绑定、基本信息。" />

技术参考：[Agent](/03-features/07-agent)。

---

## 提问并核对出处

1. 进入对话，确认智能体与知识范围正确
2. 提出业务问题
3. 查看回答是否合理，并点击出处核对原文
4. 若答偏：补文档、改分块，或调整智能体绑定范围后重试

<Screenshot
  src="/screenshots/product-chat-ask.png"
  caption="对话提问与引用"
  hint="展示对话输入、助手回答与引用列表/角标。" />

---

## （可选）开通 IM 机器人

仅 **企业微信、飞书、钉钉**：

1. **设置 → IM 集成** 新建渠道
2. 选择平台，填写应用凭据，绑定智能体
3. 按平台要求配置回调或长连接
4. 在测试群验证后再推广

<Screenshot
  src="/screenshots/product-im-channel.png"
  caption="IM 渠道配置"
  hint="与应用场景中的 IM 截图可共用同一张图。" />

详见 [应用场景 · 群内 IM 问答](./03-scenarios#场景三群内-im-问答)、[IM 集成](/03-features/12-im-integration)。

---

## （可选）网页嵌入

1. **设置 → 网页嵌入**（或约定入口）创建渠道
2. 绑定智能体，按指引获取嵌入脚本 / 配置
3. 在测试页验证后上线到正式站点

<Screenshot
  src="/screenshots/product-embed-snippet.png"
  caption="网页嵌入配置与示例代码"
  hint="展示嵌入渠道配置页，以及可复制的脚本或渠道 ID 区域。" />

技术参考：[网页嵌入](/03-features/13-embed-channel)。

---

## （可选）Wiki / FAQ / 评估

- **Wiki**：适合资料多、需要目录化浏览 → [Wiki](/03-features/14-wiki)
- **FAQ**：适合固定短答 → [FAQ](/03-features/17-faq)
- **评估**：适合上线前或迭代时测效果 → [评估](/03-features/15-evaluation)

---

## 相关阅读

- [产品概述](./01-overview)
- [功能说明](./02-capability-map)
- [角色与权限](./05-roles-delivery)
- [快速上手](/01-getting-started/03-quickstart)
