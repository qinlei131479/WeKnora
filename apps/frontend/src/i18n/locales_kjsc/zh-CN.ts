export default {
  modelCatalog: {
    description: '模型目录决定添加模型时可选的模型列表，以及上下文窗口、是否支持思考等默认参数。在这里修改后，所有租户立即生效。',
    layers: {
      explicit: '各租户在模型配置中填写的参数始终优先；修改目录不会改写已保存的模型。'
    },
    fieldsHint: '各租户在模型配置中填写的参数仍然优先。输入框留空即恢复默认值。',
    historyRestoreConfirm: '恢复到版本 {version} 的配置，并立即对所有租户生效？'
  },
  toolbox: {
    unavailable: '当前租户暂无可用的工具。'
  },
  localBrowser: {
    viewOnly: '仅查看本对话的浏览器画面',
    windowHint: '任务在独立的浏览器 Agentic 窗口中运行。借用已有标签页需要你的授权。',
    usageStep2Text: '复制配对链接，在扩展的「连接设置 → 远程连接」中粘贴并确认服务器。配对一次，同一租户的各个对话共用。'
  },
  platformApiKeys: {
    description: '为跨租户自动化创建平台级凭据；调用租户接口时通过 X-Tenant-ID 指定目标租户。',
    securityNotice: '平台 API Key 默认可选择任意租户。请只授予必要能力；密钥明文仅在创建时显示一次。',
    createDescription: '平台 Key 不绑定租户，所有操作仍受能力范围限制。',
    capabilityHint: '租户能力对任意 X-Tenant-ID 生效；系统能力用于平台控制面接口。',
    capabilityHints: {
      tenantsRead: '列出、搜索和查看所有租户。',
      tenantsManage: '创建、更新、删除租户及应用全局租户配置。'
    },
    capabilities: {
      tenantsRead: '查看租户',
      tenantsManage: '管理租户'
    }
  },
  tenantInvitation: {
    errors: {
      alreadyMember: '该用户已是当前租户的成员。'
    },
    myInbox: {
      description: '其他租户发给您的加入邀请。接受后您将以对应角色加入对方租户。',
      tenantLabel: '租户'
    },
    shareLink: {
      description: '生成一条多人可用的注册链接，发到群里就行；谁打开都能用自己的邮箱注册并加入当前租户。链接 {days} 天后过期，或随时可在列表中撤销。'
    }
  },
  tenantMember: {
    sectionDescription: '在当前租户中新增成员并分配角色。只有 Owner 可以新增、编辑或移除成员。',
    listTitle: '租户成员',
    empty: '尚未添加任何成员。点击右上角新增成员。',
    searchPlaceholder: '按姓名、登录账号或邮箱搜索',
    audit: {
      description: '记录当前租户的成员变更与访问拒绝事件，按时间倒序展示。一分钟内的重复拒绝会自动去重。',
      outcome: {
        accepted: '已接受',
        canceled: '已取消',
        failed: '失败',
        partial: '部分成功'
      }
    },
    errors: {
      emailExists: '该邮箱已被使用',
      usernameRequired: '请输入用户名',
      usernameMinLength: '用户名至少 2 个字符',
      usernameMaxLength: '用户名不能超过 20 个字符',
      usernameInvalid: '用户名只能包含字母、数字、下划线和中文',
      usernameExists: '该用户名已被使用',
      accountRequired: '请输入登录账号',
      accountInvalid: '登录账号只能包含字母和数字，且不超过 20 位',
      accountExists: '该登录账号已被使用',
      accountLocked: '登录账号已设置，不能修改',
      passwordRequired: '请输入密码',
      passwordMinLength: '密码至少 8 个字符',
      passwordMaxLength: '密码不能超过 32 个字符',
      passwordLetter: '密码必须包含字母',
      passwordNumber: '密码必须包含数字',
      passwordPolicy: '密码须为 8-32 个字符，且同时包含字母和数字',
      confirmPasswordRequired: '请再次输入密码',
      passwordMismatch: '两次输入的密码不一致',
      alreadyMember: '该用户已是当前租户成员'
    },
    leave: {
      confirmTitle: '确认退出当前租户？',
      confirmBody: '退出后您将无法访问当前租户内的所有知识库和智能体。后续可被再次邀请加入。',
      success: '已退出当前租户'
    },
    remove: {
      confirmBody: '确定要将 {name} 从当前租户中移除吗？该用户会立即失去访问权限。'
    },
    edit: {
      button: '编辑',
      dialogTitle: '编辑成员',
      success: '成员已更新',
      accountHintEmpty: '当前为空，可以补填；保存后不可再修改',
      accountHintLocked: '登录账号已设置，不可修改'
    },
    add: {
      button: '新增成员',
      dialogTitle: '新增成员',
      success: '成员已新增',
      usernameLabel: '用户名',
      usernamePlaceholder: '输入用户名',
      accountLabel: '登录账号',
      accountPlaceholder: '字母和数字，不超过 20 位',
      accountHint: '保存后不可修改',
      emailPlaceholder: '输入邮箱',
      emailHint: '邮箱不可重复',
      passwordLabel: '密码',
      passwordPlaceholder: '8-32 个字符，需包含字母和数字',
      confirmPasswordLabel: '确认密码',
      confirmPasswordPlaceholder: '再次输入密码'
    },
    columns: {
      member: '姓名与登录账号'
    },
    permissions: {
      desc: '每个角色在当前租户内能做的事情。服务端强制执行，UI 控件仅作展示。',
      manageTenantConfig: '修改租户配置',
      readAll: '查看租户内容'
    }
  },
  integrations: {
    cli: {
      title: 'Agentic CLI'
    },
    claw: {
      title: 'Agentic Skill',
      subtitle: '通过 @:{\'brand.name\'} REST API 导入文档并执行混合检索（向量 + 关键词）。适用于上传文件/URL/Markdown 到知识库、跨库检索与浏览知识内容。',
      installCtaHint: '安装 Agentic Skill · 将在新标签页打开'
    },
    chrome: {
      subtitle: '配合 @:{\'brand.name\'} 自建服务使用：在任意网页侧边栏提问、剪藏内容、Markdown 速记，将浏览中的知识沉淀到你的知识库。',
      steps: {
        port: {
          desc: '使用 @:{\'brand.name\'} 桌面版时，在 API 信息中设置固定端口（如 37841），避免每次启动后地址变化导致插件断连。'
        }
      }
    },
    api: {
      apiKeyAccessTypeHint: '「知识库」按下方权限级别在知识库范围内操作；「租户完全访问」额外开放模型、数据源等全部租户级接口。',
      apiKeyCapabilityGroupCollaboration: '成员与租户',
      apiKeyCapabilityGroupTenant: '租户配置',
      capabilityTenantFull: '租户完全访问',
      capabilityTenantFullHint: '允许调用模型、向量库、数据源、渠道等全部租户级接口；知识库范围不再生效。',
      capabilityIngestHint: '允许向授权范围内的知识库写入内容（上传文档、编辑分块/FAQ/标签/wiki）；不能创建知识库、不能新建智能体、不能清空知识库，且仅限所选知识库范围。',
      capabilityManageKbsHint: '允许管理知识库全生命周期：新建、复制、修改、删除知识库并调整初始化/配置信息。针对已有知识库的操作（复制/更新/删除）仍受所选知识库范围限制；新建不受限（新知识库归本租户）。',
      capabilityMessageHistoryHint: '允许检索租户聊天历史并读取聊天历史统计；不授予租户配置权限。',
      capabilityManageModelsHint: '允许管理模型配置、模型凭据、模型连通性测试和云服务凭据。',
      capabilityManageStorageBackendsHint: '允许管理对象/文件存储后端实例（如 S3 兼容或本地文件存储）的增删改查、连通性测试及租户默认存储设置。',
      capabilityManageMembersHint: '允许查看和管理租户成员、角色、邀请和邀请链接；不包含 API Key 管理、租户删除或所有权转移。',
      capabilityManageSpaces: '管理共享空间',
      capabilityManageSpacesHint: '允许管理组织空间、加入流程、租户成员、邀请和共享空间可见性；不授予知识库或智能体分享管理权限。',
      capabilityManageTenantSettings: '管理租户设置',
      capabilityManageTenantSettingsHint: '允许读取和更新租户级集成设置，例如 API 终端用户身份模式、请求头配置、租户 KV 配置等；不包含 API Key 管理、成员管理、租户删除或所有权转移。',
      modeTenant: '仅租户',
      signedFlowDetail: 'HMAC 密钥仅保存在 @:{\'brand.name\'} 与你的可信后端，切勿放入请求或下发给浏览器。请求头里传的是用该密钥签出的 JWT 字符串（每次签发或过期后会变），不是密钥本身。JWT 须包含 sub（外部用户 ID）、tenant_id、aud=weknora、exp（有效期不超过 24 小时）。',
      requireDirectHeaderDesc: '开启后，缺少用户 ID 请求头的 API Key 请求将被拒绝；关闭则按整个租户统一处理，不区分具体终端用户。',
      hmacSecretDesc: '与 @:{\'brand.name\'} 保存的同一份密钥；仅用于后端签发 JWT，不要作为请求头发送。',
      playgroundTenantModeHint: '仅租户模式不会发送外部用户身份，所有 API 会话归属同一个租户级主体。',
      playgroundNeedApiKey: '当前租户没有 API Key。',
      editApiKeyScopeHint: '留空表示允许访问本租户的全部知识库。所有修改保存后立即生效。'
    },
    mcpserver: {
      subtitle: '把当前租户发布为 MCP 服务，供 Claude Desktop、Cursor、Claude Code 等 MCP 客户端直接连接。每个端点有独立的令牌、知识库范围和工具清单。',
      kbScopePlaceholder: '留空表示租户内全部知识库',
      kbScopeHint: '所有检索、问答和写入工具都只在这些知识库内生效。留空时端点可访问租户内的全部知识库。'
    }
  },
  datasource: {
    resumeFailed: '恢复失败'
  },
  agentEditor: {
    agentType: {
      kbMismatch: {
        quickAnswer: '即时问答模式需启用 RAG 检索'
      }
    },
    im: {
      descriptionRestricted: '将智能体接入即时通讯平台，支持企业微信、飞书和钉钉'
    },
    desc: {
      memoryEnabled: '允许该智能体读取并补充你的长期记忆。关闭后，与它的对话既不会读取记忆，也不会新增记忆。租户或个人设置关闭时，这里开启也不会生效'
    }
  },
  kbSettings: {
    parser: {
      engines: {
        weknoracloud: {
          name: '云解析服务',
          desc: '使用云解析服务处理文档'
        },
        anydoc: {
          desc: '进程内运行的 Office 文档解析引擎（无需外部服务）'
        }
      }
    },
    vectorStore: {
      engineDesc: '从全局向量存储配置中选择，或保持系统默认以使用租户的 RETRIEVE_DRIVER 引擎。'
    }
  },
  organization: {
    subtitle: '创建或加入共享空间，让多个租户互相协作，共享知识库与智能体',
    addMember: {
      tipTenant: '共享空间的成员单位是租户：选定一个租户后，其下全部用户都将获得访问权限。下方搜索结果按租户去重。',
      searchTenant: '选择租户',
      searchTenantPlaceholder: '输入租户名搜索...',
      searchTenantHint: '输入至少 2 个字符开始搜索，按租户去重并自动过滤已加入的租户'
    },
    settings: {
      membersDesc: '查看和管理共享空间成员、调整成员角色。成员的最小单位是租户——加入后该租户下的所有用户都将获得访问权限。'
    },
    join: {
      alreadyMember: '您已经是该共享租户的成员',
      confirmTitle: '确认加入共享租户',
      failed: '加入共享租户失败',
      goToOrganizations: '前往共享租户列表',
      joining: '正在加入共享租户...',
      success: '成功加入共享租户！'
    },
    rbac: {
      needTenantAdminTip: '此操作需要当前租户的 admin 或更高角色，请联系租户 Owner 调整权限。',
      cannotCreate: '当前租户角色不足，无法创建共享空间',
      cannotJoin: '当前租户角色不足，无法加入或申请加入共享空间',
      cannotManage: '当前租户角色不足，无法管理共享空间'
    },
    joinFailed: '加入共享租户失败',
    joinSuccess: '成功加入共享租户'
  },
  mcpServiceDialog: {
    viewTitle: '查看 MCP 服务',
    testResultTitle: '测试结果',
    stdioLaunch: '启动命令'
  },
  modelSettings: {
    debug: {
      thinkOff: '思考关闭',
      thinkOn: '思考开启',
      thinking: '思考模式',
      thinkingDesc: '仅对支持思考模式的模型生效'
    },
    builtinModels: {
      description: '内置模型对所有租户可见，敏感信息会被隐藏，且不可编辑或删除。',
      descriptionAdmin: '内置模型对所有租户可见。系统管理员可编辑配置和凭据；删除仍由部署配置管理。'
    }
  },
  mcpSettings: {
    view: '查看'
  },
  platform: {
    independentTenant: '独立租户'
  },
  theme: {
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式'
  },
  model: {
    editor: {
      lkeap: {
        secretIdLabel: 'SecretId',
        secretIdPlaceholder: '腾讯云 API 密钥 SecretId',
        secretKeyLabel: 'SecretKey',
        secretKeyPlaceholder: '腾讯云 API 密钥 SecretKey',
        regionLabel: '地域',
        regionPlaceholder: 'ap-guangzhou',
        regionDesc: 'RunRerank 支持 ap-beijing、ap-guangzhou 等，默认 ap-guangzhou',
        rerankCredentialHint: 'Rerank 使用腾讯云 API 签名（非 OpenAI API Key）。请在云 API 密钥控制台创建 SecretId/SecretKey。'
      },
      providers: {
        novita: {
          label: 'Novita AI',
          description: 'moonshotai/kimi-k2.5, zai-org/glm-5, minimax/minimax-m2.7, qwen/qwen3-embedding-0.6b 等'
        },
        nvidia: {
          label: 'NVIDIA',
          description: 'deepseek-ai-deepseek-v3_1, nv-embed-v1, rerank-qa-mistral-4b, etc.'
        },
        lkeap: {
          label: '腾讯云 LKEAP',
          description: 'DeepSeek-R1、DeepSeek-V3、lke-reranker-base 等'
        },
        longcat: {
          label: 'LongCat AI',
          description: 'LongCat-Flash-Chat, LongCat-Flash-Thinking, etc.'
        },
        qianfan: {
          label: '百度千帆 Baidu Cloud',
          description: 'ernie-5.0-thinking-preview, embedding-v1, bce-reranker-base, etc.'
        },
        moonshot: {
          label: '月之暗面 Moonshot',
          description: 'kimi-k2-turbo-preview, moonshot-v1-8k-vision-preview, etc.'
        },
        qiniu: {
          label: '七牛云 Qiniu',
          description: 'deepseek/deepseek-v3.2-251201, z-ai/glm-4.7, etc.'
        },
        modelscope: {
          label: '魔搭 ModelScope',
          description: 'Qwen/Qwen3-8B, Qwen/Qwen3-Embedding-8B, etc.'
        },
        gpustack: {
          label: 'GPUStack',
          description: 'Choose your deployed model on GPUStack'
        },
        gemini: {
          label: 'Google Gemini',
          description: 'gemini-3-flash-preview, gemini-2.5-pro 等'
        },
        mimo: {
          label: '小米 MiMo',
          description: 'mimo-v2-flash'
        },
        minimax: {
          label: 'MiniMax',
          description: 'MiniMax-M3, MiniMax-M2.7, MiniMax-M2.7-highspeed 等'
        },
        hunyuan: {
          label: '腾讯混元 Hunyuan',
          description: 'hunyuan-pro, hunyuan-standard, hunyuan-embedding, etc.'
        },
        deepseek: {
          label: 'DeepSeek',
          description: 'deepseek-chat, deepseek-reasoner 等'
        },
        volcengine: {
          label: '火山引擎 Volcengine',
          description: 'doubao-1-5-pro-32k-250115, doubao-embedding-vision-250615, etc.'
        },
        jina: {
          label: 'Jina',
          description: 'jina-clip-v1, jina-embeddings-v2-base-zh, etc.'
        },
        siliconflow: {
          label: '硅基流动 SiliconFlow',
          description: 'deepseek-ai/DeepSeek-V3.1, etc.'
        },
        generic: {
          label: '自定义 (OpenAI兼容接口)',
          description: 'Generic API endpoint (OpenAI-compatible)'
        },
        requesty: {
          label: 'Requesty',
          description: 'openai/gpt-4o-mini, anthropic/claude-sonnet-4-5, etc.'
        },
        openrouter: {
          label: 'OpenRouter',
          description: 'openai/gpt-5.2-chat, google/gemini-3-flash-preview, etc.'
        },
        zhipu: {
          label: '智谱 BigModel',
          description: 'glm-4.7, embedding-3, rerank, etc.'
        },
        aliyun: {
          label: '阿里云 DashScope',
          description: 'qwen-plus, tongyi-embedding-vision-plus, qwen3-rerank, etc.'
        },
        azure_openai: {
          label: 'Azure OpenAI',
          description: 'Microsoft Azure 上的 OpenAI 服务'
        },
        anthropic: {
          label: 'Anthropic',
          description: 'Claude models via native Anthropic Messages API'
        },
        openai: {
          label: 'OpenAI',
          description: 'gpt-5.2, gpt-5-mini, etc.'
        },
        litellm: {
          label: 'LiteLLM',
          description: '自托管代理，统一接入 OpenAI、Anthropic、Gemini、Bedrock 等 100+ 厂商。请将占位 URL 换成可访问地址；localhost 需加入 SSRF_WHITELIST。'
        }
      },
      thinkingControl: {
        thinkingType: {
          label: 'thinking.type',
          hint: '火山引擎 Ark；腾讯云 LKEAP（DeepSeek V3 等，选 LKEAP 时默认此项；R1 请改「不写入」）'
        },
        enableThinking: {
          label: 'enable_thinking',
          hint: '阿里云 DashScope：qwen3、qwen-plus、qwen-max、qwen-turbo'
        },
        chatTemplateKwargs: {
          label: 'chat_template_kwargs',
          hint: '自定义 OpenAI 兼容、NVIDIA NIM、vLLM / 本地 Qwen 部署'
        },
        none: {
          label: '不写入思考参数',
          hint: '智能体「思考模式」开关不生效，不会在请求中写入思考相关参数'
        }
      },
      thinkingControlDesc: '决定智能体「思考模式」开/关时如何写入 API。已尝试按厂商/模型预选，若与实际情况不符请按 API 文档手动修改；选「不写入」时，智能体「思考模式」开关不生效。',
      thinkingControlLabel: '思考模式参数格式',
      volcengine: {
        accessKeyLabel: 'Access Key ID',
        accessKeyPlaceholder: '火山引擎访问密钥 Access Key ID',
        secretKeyLabel: 'Secret Access Key',
        secretKeyPlaceholder: '火山引擎访问密钥 Secret Access Key',
        rerankCredentialHint: 'Rerank 使用 VikingDB AK/SK 签名（非方舟 API Key），模型建议填写 doubao-seed-rerank。'
      }
    }
  },
  error: {
    tenant: {
      listFailed: '获取租户列表失败',
      searchFailed: '搜索租户失败',
      updateFailed: '更新租户信息失败',
      deleteFailed: '删除租户失败',
      createApiKeyFailed: '创建 API Key 失败',
      createFailed: '创建失败',
      deleteApiKeyFailed: '删除 API Key 失败',
      listApiKeysFailed: '获取 API Key 列表失败'
    },
    auth: {
      getTenantFailed: '获取租户信息失败'
    }
  },
  system: {
    versionDescription: '当前应用服务的版本号',
    frontendVersionDescription: '当前 UI 界面的构建版本号',
    globalSettings: {
      description: '平台级运行时配置，保存后立即对所有租户生效。仅系统管理员可见可改。',
      audit: {
        target: {
          bulkQuotaDiff: '应用到 {count} 个租户（{gb} GB）'
        },
        outcome: {
          accepted: '已接受',
          canceled: '已取消',
          failed: '失败',
          partial: '部分成功'
        }
      },
      bulkApply: {
        label: '应用到所有现有租户',
        tooltip: '保存的值默认只对之后新建的租户生效；点击此按钮将当前值同步写入所有现有租户。',
        confirmBody: '将把所有现有租户的存储配额覆盖为 {value} GB。如有租户被运维单独调整过的配额，也会一并被覆盖。是否继续？',
        success: '已将 {count} 个租户的存储配额更新为 {gb} GB',
        failed: '应用到所有租户失败'
      },
      passwordReset: {
        validation: {
          emailRequired: '请输入用户邮箱',
          emailInvalid: '请输入有效的邮箱地址',
          passwordRequired: '请输入新密码',
          passwordLength: '密码长度必须为 8-32 个字符',
          passwordLetter: '密码必须包含字母',
          passwordNumber: '密码必须包含数字',
          confirmRequired: '请再次输入新密码',
          passwordMismatch: '两次输入的密码不一致'
        }
      },
      createUser: {
        description: '开通一个新的本地用户账号。如果平台的默认租户模式设置为「自动创建个人租户」，该用户会像自助注册的用户一样，同时获得一个个人租户。'
      },
      admins: {
        confirm: {
          promote: {
            body: '确认将 {email} 提升为系统管理员？该用户将获得平台级权限，可访问所有租户、修改系统设置、管理其他管理员。'
          }
        }
      },
      confirm: {
        bodySandboxDockerEnabled: '打开后，租户管理员可以把沙箱指到本机 Docker。本机 docker.sock 等同宿主机 root，只适合已挂载 daemon 或配了 TLS 远程 tcp:// 的私有化单机。'
      },
      enumLabels: {
        auth: {
          default_tenant_mode: {
            create_personal: '自动创建个人租户',
            tenantless: '不自动创建租户'
          }
        }
      },
      keyDescriptions: {
        tenant: {
          max_owned_per_user: '每个非超管用户通过自助创建可拥有的最大租户数。每次创建租户时实时读取，修改后立即生效。0 表示使用内置默认值 10；负数表示完全关闭限制（不建议在公开部署使用）。',
          self_service_creation_enabled: '是否允许非超管用户主动创建租户。关闭后，普通用户只能通过邀请加入已有租户；跨租户超管仍可创建。修改后立即生效。',
          default_storage_quota_gb: '新建租户时默认分配的存储配额（GB），包含向量、原文、文本、索引等。仅在创建时读取，修改后只对之后新建的租户生效，不会回写已存在的租户。0 或负数表示使用内置默认值 10GB。',
          auto_create_api_key: '为新租户自动生成 full_access API Key，并在创建响应中返回明文 token。仅用于兼容依赖旧行为的集成；默认关闭，建议通过 API Key 管理显式创建。',
          auto_accept_invitation: '开启后，租户管理员通过邮箱邀请已注册用户时，对方会立即成为成员，不再经过收件箱确认。关闭时保持「发出邀请 → 被邀请人确认」流程。修改后立即生效。'
        },
        auth: {
          default_tenant_mode: '公开注册后的租户初始化策略。create_personal 会自动创建个人租户并授予 Owner；tenantless 仅创建账户，用户需要接受邀请或主动创建租户。只影响之后注册的用户。'
        }
      },
      keyLabels: {
        tenant: {
          max_owned_per_user: '每用户最大租户数',
          self_service_creation_enabled: '允许用户自助创建租户',
          default_storage_quota_gb: '新租户默认存储配额 (GB)',
          auto_create_api_key: '创建租户时自动生成 API Key'
        },
        auth: {
          default_tenant_mode: '注册默认租户策略'
        }
      },
      runtime: {
        tasks: {
          tenantLabel: '租户 ID'
        }
      },
      sections: {
        tenant: {
          tab: '租户默认值 {count}',
          title: '租户默认值',
          description: '设置新租户的初始配额与兼容性行为，不会自动改写已有租户。'
        },
        access: {
          description: '管理系统管理员、公开注册与用户创建租户的规则。'
        }
      }
    }
  },
  tenant: {
    title: '租户信息',
    currentTenant: '当前租户',
    switchTenant: '切换租户',
    sectionDescription: '查看租户的详细配置信息',
    searchPlaceholder: '搜索租户名称或输入租户 ID...',
    noMatch: '未找到匹配的租户',
    switchSuccessTitle: '已切换租户',
    loadTenantsFailed: '加载租户列表失败',
    messages: {
      fetchFailed: '获取租户信息失败'
    },
    deleteDangerZone: {
      title: '删除当前租户',
      desc: '删除整个租户及其配置。删除后，租户成员将无法继续访问其中的知识库、智能体与 API Key。',
      button: '删除租户',
      confirmTitle: '删除当前租户？',
      confirmBody: '此操作将删除租户「{name}」，并使其中的知识库、智能体、成员与 API Key 不再可用。此操作不可撤销。',
      confirmHint: '请输入租户名称「{name}」以确认删除。',
      nameMismatch: '租户名称不匹配',
      success: '租户已删除',
      failed: '删除租户失败',
      confirm: '删除'
    },
    leaveDangerZone: {
      title: '退出当前租户',
      desc: '终止您在本租户的成员身份。退出后将无法访问本租户的知识库与智能体，之后可被再次邀请加入。',
      button: '退出租户'
    },
    storage: {
      quotaDescription: '租户的总存储空间配额'
    },
    details: {
      idLabel: '租户 ID',
      idDescription: '您所属租户的唯一标识',
      nameLabel: '租户名称',
      nameDescription: '您所属的租户名称',
      descriptionLabel: '租户描述',
      descriptionDescription: '租户的详细描述信息',
      businessLabel: '租户业务',
      businessDescription: '租户所属的业务类型',
      statusLabel: '租户状态',
      statusDescription: '租户当前的运行状态',
      createdAtLabel: '租户创建时间',
      createdAtDescription: '租户创建的时间',
      editNamePlaceholder: '请输入新的租户名称',
      editNameRequired: '租户名称不能为空',
      editNameSuccess: '租户名称已更新',
      editNameFailed: '更新租户名称失败',
      editDescriptionPlaceholder: '请输入新的租户描述',
      editDescriptionSuccess: '租户描述已更新',
      editDescriptionFailed: '更新租户描述失败'
    },
    create: {
      action: '创建新租户',
      dialogTitle: '创建新租户',
      dialogSubtitle: '租户拥有独立的知识库与成员，你将自动成为新租户的所有者。',
      nameLabel: '租户名称',
      nameRequired: '请输入租户名称',
      descriptionPlaceholder: '简单描述一下这个租户的用途',
      success: '租户创建成功',
      failed: '租户创建失败',
      disabled: '当前系统只允许通过邀请加入租户，不能自行创建租户。',
      needAdmin: '仅租户所有者或管理员可以创建租户。'
    },
    switcher: {
      menuLabel: '切换租户',
      homeTooltip: '我的租户',
      empty: '你目前只属于这一个租户'
    }
  },
  chat: {
    sandbox: {
      desktopPlaceholder: '桌面可视化即将支持'
    },
    scrollToBottom: '回到底部',
    copyFailed: '复制失败',
    copySuccess: '已复制',
    editorOpened: '已打开编辑器',
    emptyContentWarning: '内容为空，无法操作',
    imageReadFailed: '图片读取失败'
  },
  knowledgeEditor: {
    titleCreate: '创建知识库',
    share: {
      description: '将知识库共享给租户，让租户成员可以访问和使用',
      tip1: '共享后，租户成员将根据设定的权限访问此知识库'
    },
    postCreateHint: {
      followUpDesc: '可在左侧配置数据源，或在「共享管理」中发布到租户'
    },
    wikiBrowser: {
      tabMindmap: '思维导图',
      tabMindmapTip: '按知识库文件列表生成层次结构'
    }
  },
  embedPublish: {
    originsHint: '填写允许嵌入的宿主网站来源（A），不是 Agentic 地址（B）。每行一个完整 Origin，如 https://shop.example.com；至少一项，支持 *.example.com 子域通配',
    webhookUrlPlaceholder: 'https://your-server.example.com/embed-events',
    webhookUrlDesc: '可选。访客发消息与助手回复完成时，@:{\'brand.name\'} 会向该 HTTPS 地址 POST 事件（message_sent / message_received）。'
  },
  knowledgeList: {
    create: '创建知识库',
    sharedToOrgs: '已共享给 {count} 个租户',
    detail: {
      sourceTypeKbShare: '知识库直接共享到本租户',
      sourceOrg: '来源租户'
    },
    sections: {
      tenantOthers: '本租户 · 其他成员',
      tenantReadonly: '本租户 · 仅查看'
    },
    empty: {
      description: '点击右上角"创建知识库"按钮创建第一个知识库'
    },
    uploadProgress: {
      uploadingTitle: '正在向「{name}」上传文件夹中的文档',
      detail: '已完成 {completed}/{total} 个文件',
      keepPageOpen: '请保持页面打开，上传完成后会自动刷新解析状态。',
      completedTitle: '「{name}」的上传已完成',
      completedDetail: '共上传 {total} 个文件，正在刷新列表查看解析状态...',
      refreshing: '正在刷新列表并获取最新解析状态...',
      errorTip: '部分文件上传失败，请查看右上角通知详情。',
      unknownKb: '知识库 {id}'
    }
  },
  ext: {
    subtitle: '管理运行时技能、工具与 MCP',
    noDescription: '暂无描述',
    close: '关闭',
    cancel: '取消',
    mcp: {
      searchPlaceholder: '搜索 MCP...',
      add: '添加 MCP',
      create: '创建 MCP',
      empty: '暂无 MCP，点击上方按钮创建',
      emptySearch: '无匹配 MCP',
      remove: '移除 MCP',
      delete: '删除 MCP',
      needsMigration: '需要迁移为远程 MCP',
      unknownTransport: '未知传输类型',
      builtin: '内置',
      description: '描述',
      transport: '传输类型',
      tags: '标签',
      creator: '创建人',
      addedOk: 'MCP 已添加',
      removedOk: 'MCP 已移除',
      actionFailed: '操作失败',
      deleteTitle: '确认删除 MCP',
      deleteContent: '确定要删除 MCP "{name}" 吗？此操作不可撤销。',
      deleted: 'MCP 删除成功',
      deleteFailed: '删除失败',
      loadFailed: '获取 MCP 列表失败',
      detail: {
        back: '返回',
        migrateFirst: '请先迁移为远程 MCP',
        test: '测试',
        builtinConfigHint: '系统内置 MCP 的连接配置由代码管理',
        edit: '编辑',
        delete: '删除',
        add: '添加',
        remove: '移除',
        migrateAlert: '此 stdio MCP 已禁用，请编辑为 SSE 或 Streamable HTTP，或直接删除。',
        tabInfo: '信息',
        editHeading: '编辑 MCP',
        editHint: '修改后保存会立即更新当前 MCP 配置。',
        basicTitle: '基础信息',
        basicHint: '定义 MCP 的名称、描述与展示方式。',
        connTitle: '连接配置',
        connHint: '配置当前传输方式需要的连接参数。',
        advancedTitle: '高级配置',
        advancedHint: '请求头会直接影响 MCP 连接。',
        headersHelp: '请输入合法 JSON 对象，留空表示不发送额外请求头。',
        cancel: '取消',
        save: '保存',
        seconds: '{count} 秒',
        command: '命令',
        args: '参数',
        env: '环境变量',
        createdAt: '创建时间',
        updatedAt: '更新时间',
        creator: '创建人',
        tabTools: '工具 ({count})',
        searchTools: '搜索工具...',
        refresh: '刷新',
        noTools: '暂无工具',
        copyToolName: '复制工具名称',
        params: '参数',
        required: '必填',
        notFound: '未找到 MCP 服务器',
        addFirst: '请先添加 MCP 后再查看详情',
        fetchFailed: '获取 MCP 详情失败',
        fetchToolsFailed: '获取工具列表失败',
        copied: '已复制到剪贴板',
        copyFailed: '复制失败',
        connectFailed: '连接失败',
        testFailed: '测试失败',
        testOk: '连接成功，共发现 {count} 个工具',
        toolEnabled: '工具 {name} 已启用',
        toolDisabled: '工具 {name} 已禁用',
        added: 'MCP 已添加',
        removed: 'MCP 已移除'
      },
      form: {
        slug: 'MCP 标识',
        name: 'MCP 名称',
        namePlaceholder: '请输入展示名称',
        description: '描述',
        descPlaceholder: '请输入 MCP 描述',
        transport: '传输类型',
        icon: '图标',
        iconPlaceholder: '输入 emoji，如 🧠',
        url: 'MCP URL',
        headers: 'HTTP 请求头',
        headersPlaceholder: 'JSON 格式，如：{\'{\'}"Authorization": "Bearer xxx"{\'}\'}',
        httpTimeout: 'HTTP 超时（秒）',
        sseTimeout: 'SSE 读取超时（秒）',
        tags: '标签',
        tagsPlaceholder: '输入标签后回车添加',
        badHeaders: '请求头 JSON 格式错误',
        nameRequired: 'MCP 名称不能为空',
        transportRequired: '请选择传输类型',
        urlRequired: 'HTTP 类型必须填写 MCP URL',
        updated: 'MCP 更新成功',
        updateFailed: '更新失败',
        actionFailed: '操作失败'
      }
    },
    tools: {
      searchPlaceholder: '搜索工具...',
      allCategories: '全部分类',
      allSources: '全部范围',
      empty: '暂无工具',
      emptySearch: '无匹配工具',
      noDescription: '无描述',
      detail: '工具详情',
      configGuide: '配置说明',
      category: '分类',
      tags: '标签',
      none: '无',
      args: '参数',
      argName: '参数名',
      argType: '类型',
      argDesc: '描述',
      loadFailed: '加载工具失败',
      catBuiltin: '内置工具',
      catKnowledge: '知识库',
      catWiki: 'Wiki',
      catDatabase: '数据库',
      sourceChat: '对话',
      sourceWork: '工作'
    },
    skills: {
      searchPlaceholder: '搜索技能...',
      emptyTitle: '还没有添加 Skill',
      emptySearchTitle: '没有匹配的 Skill',
      emptyDesc: '可以从远程仓库安装，或上传本地 Skill 文件。',
      emptySearchDesc: '换个关键词试试，或清空搜索条件。',
      groupBuiltin: '内置',
      groupShared: '租户共享',
      builtinWorkNoSandbox: '内置工作技能不安装到沙箱',
      sourceCommon: '通用',
      scopeAll: '全部范围',
      fileTab: '文件管理',
      depsTab: '依赖配置',
      uninstalled: 'Skill 已卸载',
      uninstallFailed: '卸载 Skill 失败',
      loadFailed: '加载失败',
      remoteNone: '未发现可安装的 Skills',
      detail: {
        back: '返回',
        export: '导出',
        delete: '删除',
        readonlyHint: '你可以查看并使用此 Skill，但没有管理权限。',
        tabCode: '代码管理',
        projectStructure: '项目结构',
        newFile: '新建文件',
        newDir: '新建目录',
        refresh: '刷新',
        pickFile: '选择文件以开始编辑',
        saveSettings: '保存设置',
        enabledTitle: '启用状态',
        enabledDesc: '禁用后此 Skill 不会出现在可选资源中，也不会参与 Agent 运行时加载。',
        enabled: '已启用',
        disabled: '已禁用',
        tabDeps: '依赖管理',
        depsTitle: '依赖声明',
        depsDesc: '配置此 Skill 所需的工具、MCP 及其他 Skill 依赖。',
        updateDeps: '更新依赖',
        selectedCount: '已选择 {count} 项',
        pickDeps: '选择依赖',
        searchDeps: '搜索{name}',
        noMatchDeps: '没有匹配的依赖',
        noDeps: '暂无可选依赖',
        systemMaintained: '系统维护',
        readonly: '只读',
        removeAria: '移除 {name}',
        notFound: '未找到 Skill',
        pathRelative: '路径 (相对于根目录)',
        content: '内容',
        statusDisabled: '{source} · 已禁用',
        depToolsTitle: '工具依赖',
        depToolsShort: '工具',
        depToolsDesc: '声明此 Skill 运行时需要调用的工具能力。',
        depToolsHint: '选择后 Agent 运行时会同时加载这些工具。',
        depToolsEmpty: '未声明工具依赖',
        depMcpTitle: 'MCP 依赖',
        depMcpDesc: '声明此 Skill 依赖的 MCP 服务。',
        depMcpHint: '选择此 Skill 运行时需要的 MCP 服务。',
        depMcpEmpty: '未声明 MCP 依赖',
        depSkillTitle: 'Skill 依赖',
        depSkillDesc: '声明需要一起加载的其他 Skill。',
        depSkillHint: '依赖 Skill 会随当前 Skill 一起进入运行时可读范围。',
        depSkillEmpty: '未声明 Skill 依赖',
        loadFailed: '加载失败',
        treeFailed: '加载目录树失败',
        readFailed: '文件读取失败',
        saved: '已保存',
        saveFailed: '保存失败',
        confirmDeleteTitle: '确认删除技能「{name}」？',
        confirmDeleteContent: '删除后无法恢复，所有文件和配置将永久消失。',
        confirmDeleteOk: '确认删除',
        deleted: '已删除',
        deleteFailed: '删除失败',
        exportFailed: '导出失败',
        created: '创建成功',
        createFailed: '创建失败',
        settingsSaved: '设置已保存',
        settingsSaveFailed: '保存设置失败',
        depsUpdated: '依赖已更新',
        depsUpdateFailed: '更新失败'
      }
    },
    tabs: {
      skills: '技能',
      tools: '工具',
      mcp: 'MCP'
    }
  },
  createChat: {
    title: '嗨！今天想聊些什么？'
  },
  input: {
    agentMode: '推理问答',
    normalMode: '即时问答',
    messages: {
      agentSwitchedOn: '已切换到推理问答',
      agentSwitchedOff: '已切换到即时问答'
    },
    webSearch: {
      label: '联网搜索'
    },
    placeholderAgent: '向 {name} 提问',
    placeholderKbAndWeb: '输入问题，将基于知识库和网络搜索回答',
    placeholderWebOnly: '输入问题，将结合网络搜索回答',
    placeholderWithContext: '输入问题，将基于上方选中的知识库/文件回答',
    fileUpload: {
      label: '上传文件',
      tooLarge: '文件过大',
      tooMany: '文件数量过多',
      tooltip: '点击或拖拽上传文件'
    },
    imageUpload: {
      label: '上传图片',
      tooltip: '点击或拖拽上传图片'
    }
  },
  manualEditor: {
    section: {
      basic: '基本信息'
    },
    view: {
      editLabel: '返回编辑',
      previewLabel: '预览内容'
    },
    description: '使用 Markdown 编写知识内容，支持实时预览'
  },
  file: {
    downloadFailed: '下载失败'
  },
  mentionDetail: {
    belongsToOrg: '所属租户：'
  },
  authStore: {
    errors: {
      parseTenantFailed: '解析租户信息失败'
    }
  },
  auth: {
    loginAccount: '登录账号',
    loginAccountPlaceholder: '输入登录账号或邮箱',
    loginAccountRequired: '请输入登录账号',
    firstTime: '首次使用 @:{\'brand.name\'}？',
    registerSubtitle: '创建账户并开始使用 @:{\'brand.name\'}',
    loginError: '登录错误，请检查登录账号或密码',
    workspaceOnboarding: {
      title: '选择你的租户',
      description: '创建一个租户即可开始使用，或接受邀请加入已有租户。',
      create: '创建租户',
      loadingPolicy: '正在确认可用的租户加入方式…',
      policyLoadFailed: '暂时无法获取租户权限，请检查网络后重试。',
      inviteOnlyTitle: '等待加入租户',
      inviteOnlyDescription: '当前系统不开放个人创建租户。你可以查看并接受管理员发来的租户邀请。',
      inviteOnlyNotice: '此账户只能通过邀请加入已有租户',
      help: '你现在可以创建租户，也可以稍后回来接受邀请。',
      inviteOnlyHelp: '还没有邀请？请把你的注册邮箱提供给租户管理员，由管理员向你发送邀请。'
    }
  },
  inviteRegister: {
    success: '注册成功，正在进入租户…'
  },
  memorySettings: {
    workspaceDisabled: '当前租户尚未开启长期记忆，管理员开启后这里的开关才会生效。'
  },
  envVarSettings: {
    description: '给技能和沙箱用的个人密钥，不是平台的系统或部署配置。',
    introPersonalBody: '只注入到你自己的对话和执行里，租户里的其他人看不到，也不会改成他们的值。',
    noConfigDescription: '这个租户还没有配置沙箱后端，暂时没有可设置的密钥。',
    skillHint: '技能声明需要的值。可以预先保存在这里，也可以在对话里当场提供。租户管理员还可以在技能卡上填租户共用值。',
    statusWorkspace: '正在使用租户共用值',
    clearConfirm: '清除你为 {name} 设置的值？之后会重新使用租户共用值（如果有）。'
  },
  memoryWorkspaceSettings: {
    enableLabel: '在本租户启用长期记忆',
    enableDescription: '关闭后本租户的所有会话都不会读取或写入记忆。',
    instructionsDescription: '追加到挖掘提示词里的租户规则，用来表达产品猜不到的策略，例如「永远不要记录客户姓名」。'
  },
  settings: {
    sandbox: {
      pageHint: '沙箱是智能体执行技能脚本的隔离环境。一个租户可以添加多份配置（Docker、E2B、CubeSandbox），每个智能体选择一份。技能安装在「技能管理」页，写入所选配置的镜像；未选择沙箱时不会执行技能脚本。',
      editorDescription: '配置租户运行环境，Docker、CubeSandbox 和 E2B 使用同一套管理流程。',
      scriptPolicyDesc: '关闭后本租户所有智能体只能阅读技能内容，不再执行脚本；已在运行的远端沙箱需结束会话后才释放。',
      dockerHostRisk: '留空或 unix:// 会使用平台所在机器的 Docker 守护进程，权限等同该机 root，只适合私有化单机。多个租户共用同一主机时请改用 Cube 或 E2B。远程 tcp:// 必须填写 TLS 证书目录。',
      noConfigs: '还没有沙箱配置。智能体未选择租户配置时不会执行技能脚本。',
      disableScriptsConfirm: '禁用后，本租户内所有智能体将无法在沙箱中执行技能脚本；仍可阅读技能内容。已在运行中的远端沙箱不会自动销毁，需结束或删除相关会话后才会释放。是否继续？',
      scriptsDisabled: '已禁用本租户沙箱执行',
      scriptsEnabled: '已恢复本租户沙箱执行',
      namedBackendHint: '租户配置是唯一运行时来源；智能体没有选择配置时不会执行技能脚本。',
      weknoraTemplateTitle: '平台标准模板',
      weknoraDockerImage: '平台标准镜像',
      weknoraTemplateOverview: '平台负责提供标准运行环境。连接集群后会自动发现模板，缺少标准模板时自动创建。',
      weknoraTemplateDescription: '包含平台技能所需的 Python、Node.js、CLI 工具、工作目录和非 root 执行用户。',
      templateLoadHint: '填写集群连接后刷新模板。没有平台标准模板时点「创建」；改 DNS 或镜像后点「删除并重建」。',
      standardTemplateProvisioning: '已开始在集群中创建平台标准模板，请稍后刷新查看状态',
      templateStepHint: '进入此步只会列出集群已有模板，不会自动创建。没有标准模板时点「创建平台标准模板」；改 DNS 或镜像后点「删除并重建」。模板就绪后才能继续。',
      templateUntaggedHint: '构建已完成，但没有构建带 default 标签，创建沙箱时无法解析。请在 E2B 删除该模板，刷新后平台会重新构建。',
      weknoraStandardTemplate: '平台标准模板',
      replaceStandardTemplateConfirm: '将用当前配置（含 DNS）重建平台标准模板。新模板就绪前不会删除仍可启动的旧模板。',
      cubeDnsServersHelp: '可选。写入平台标准模板的 nameserver（须为 IP）。留空则使用集群默认（常见 119.29.29.29）。私网或云上 UDP 53 出不去时，填 Cube 宿主机 /etc/resolv.conf 里能用的地址，并避开 10/8、172.16/12、192.168/16。已有标准模板需在模板卡片上点「重建」才会生效。',
      dockerTlsCertPathHelp: '平台所在主机上包含 ca.pem、cert.pem、key.pem 的目录。远程守护进程必填，证书不入库，由部署方挂载。',
      dockerIdleTtlHelp: 'Docker 守护进程本身没有空闲超时。容器多久没有执行任何命令就会被平台回收，会话继续时重建。留空按 1800 秒。',
      skillEnv: {
        workspaceTitle: '租户共用值',
        saveSuccess: '租户共用值已保存',
        saveFailed: '租户共用值保存失败。',
        clearConfirm: '清除 {name} 的租户共用值？声明会保留，没有自己值的成员之后会缺少这个值。',
        clearSuccess: '已清除租户共用值。'
      },
      backendDescriptions: {
        docker: '在本机 Docker 上为每个会话保留一个长驻容器，脚本和文件都落在同一容器里'
      }
    },
    skills: {
      description: '技能属于租户目录，可以只登记，也可以装到一份或多份沙箱。智能体只能启用当前沙箱里已就绪的技能。',
      host: {
        description: '技能属于租户目录。装到这台电脑上之后，智能体才能启用。'
      },
      scope: '适用范围',
      addStepRegisterDesc: '粘贴来源或上传 zip，先登记到租户目录。'
    },
    tenantInfo: '租户信息',
    parser: {
      checking: '检测中…'
    },
    weknoraCloud: {
      title: '云解析服务',
      credentialConfigured: '云服务凭证已配置',
      credentialUnconfigured: '尚未配置云服务凭证，请先填写 APPID 和 APPSECRET。',
      modelHintConfigured: '云服务凭证已配置。支持的模型可参考',
      modelsSection: {
        descReady: '将 WeKnora Cloud 提供的四类标准模型注册到当前租户，用于对话、向量检索、重排序与多模态理解。'
      },
      saveSuccess: '凭证已保存'
    },
    roleDenied: {
      desc: '你当前的角色无权访问此设置项。请联系本租户的管理员获取所需角色。'
    },
    navGroups: {
      workspace: '租户'
    },
    workspaceSettings: '租户设置',
    storage: {
      saveSuccess: '已保存'
    }
  },
  agent: {
    workSubtitle: '管理工作智能体。它们会在过程中产生中间文件与产物。',
    builtinWikiQa: '维基问答',
    builtinTableAnalysis: '表格分析',
    editor: {
      rerankModelOptionalHint: '当前作用域内暂无 RAG 类型知识库，可不填；后续若加入 RAG 知识库，将自动使用租户默认重排模型，仍建议显式配置。',
      hostSkillsSelectionDesc: '这里列出租户目录中的技能。已经装到这台电脑上的可以直接用；没装的请先点「安装」。',
      skillsSelectionDesc: '这里列出租户目录中的技能。已装到当前沙箱的可以直接用；没装的请先点「安装」。',
      noSkillsAvailable: '租户目录里还没有技能。',
      sandboxNoConfigs: '当前租户还没有沙箱，技能脚本不会执行。',
      maxCompletionTokensCustom: '自定义'
    },
    shareScope: {
      desc: '租户成员以只读方式使用该智能体，将遵循您当前配置的能力与资源；您对智能体的修改会同步给已共享的租户。如需允许租户成员编辑知识库内容，请将知识库共享到租户。',
      skillSecretsWarning: '该智能体启用了技能：租户成员使用时，技能会在本租户的沙箱中运行，并带上管理员为技能配置的环境变量（如 API Key），成员可以让智能体读出这些值。请在可以接受这一点时再共享。'
    },
    empty: {
      sharedDescription: '您可以加入租户或请求他人将智能体共享给您'
    },
    sections: {
      tenantOthers: '本租户 · 其他成员',
      tenantReadonly: '本租户 · 仅查看'
    },
    tabs: {
      platform: '对话',
      work: '工作'
    },
    mode: {
      normal: '即时问答',
      agent: '推理问答'
    },
    type: {
      normal: '即时问答',
      agent: '推理问答'
    },
    workManage: {
      viewSwitch: '智能体管理视图切换',
      sectionAgents: '智能体',
      sectionSubagents: '子智能体',
      deleteBuiltinWarning: '内置智能体不能删除',
      modelNotConfigured: '未配置模型',
      deleteConfirmTitle: '删除 {name}',
      deleteConfirmContent: '删除后不可恢复，已绑定该智能体的历史对话仍保留原始绑定信息。',
      deleted: '智能体已删除',
      deleteFailed: '删除智能体失败',
      loadFailed: '加载智能体失败',
      loadBackendsFailed: '加载智能体后端失败',
      modelSelector: {
        clear: '清空选择',
        loading: '加载中...',
        placeholder: '请选择模型'
      },
      toolCategories: {
        knowledge: '知识库',
        mysql: 'MySQL',
        debug: '调试'
      },
      builtinTools: {
        download_kb_file: {
          name: '下载知识库文件',
          desc: '将知识库原始文件下载到工作区。'
        },
        search_file: {
          name: '搜索文件',
          desc: '在可访问的知识库中搜索文件。'
        },
        find_kb_document: {
          name: '文档内定位',
          desc: '在知识库文件内做关键词或正则定位。'
        },
        open_kb_document: {
          name: '打开知识库文档',
          desc: '按行窗口打开知识库文档原文。'
        },
        query_kb: {
          name: '检索知识库',
          desc: '在指定知识库中检索相关内容。'
        },
        get_mindmap: {
          name: '获取思维导图',
          desc: '获取指定知识库的思维导图结构。'
        },
        list_kbs: {
          name: '列出知识库',
          desc: '列出当前用户可访问的知识库。'
        },
        calculator: {
          name: '计算器',
          desc: '执行基础数值计算。'
        },
        ask_user_question: {
          name: '向用户提问',
          desc: '在关键不确定时向用户提问，以澄清需求或做出选择。'
        },
        ocr_parse_file: {
          name: 'OCR 解析文件',
          desc: '将 PDF、Office 文档或图片解析为 Markdown 文本。'
        },
        present_artifacts: {
          name: '展示交付物',
          desc: '将工作区 outputs 中的结果文件展示给用户，便于下载或预览。'
        },
        web_search: {
          name: '网页搜索',
          desc: '搜索互联网获取实时网页内容、新闻和站点资料。'
        },
        install_skill: {
          name: '安装技能',
          desc: '安装新的 Skill 到当前用户的私有空间，并在当前会话中激活。'
        }
      },
      form: {
        emptyConfig: '该智能体没有配置项',
        knowledgeSkillWarning: '已启用知识库，但未选择 knowledge-base Skill。Agent 可能无法调用知识库检索、打开文档等工具。',
        defaultPlaceholder: '默认: {value}'
      },
      fields: {
        model_retry_times: {
          name: '模型重试次数',
          desc: '模型调用失败时的最大重试次数，默认值为 {default}。'
        },
        max_execution_steps: {
          name: '最大执行步数',
          desc: '单次 Agent 运行允许的最大 LangGraph 执行步数，对应 recursion_limit，默认 {default}。'
        },
        summary_l2_trigger_ratio: {
          name: 'L2 摘要触发比例',
          desc: 'L1 结构精简后，剩余上下文超过摘要触发阈值 × 该比例时才进入 L2 summary。建议范围 0.1 到 1.0，值越小越容易触发 L2，默认 {default}。'
        },
        summary_tool_result_token_limit: {
          name: '摘要工具结果 token 上限',
          desc: '上下文摘要 L1 清洗历史工具结果时，超过该 token 数的 ToolMessage 会写入 outputs，并在上下文中保留不超过该 token 数的预览；未超过则保持原样。默认 {default}。'
        },
        summary_prompt: {
          name: '上下文摘要提示词',
          desc: '触发上下文摘要时使用的提示词，必须能接收 {messages} 作为待摘要消息占位符。'
        },
        summary_keep_messages: {
          name: '摘要后保留消息数',
          desc: '上下文摘要触发后，除摘要消息外保留最近的消息数量，默认 {default} 条。'
        },
        summary_threshold: {
          name: '上下文摘要触发阈值 (K)',
          desc: '当上下文大小超过该值时，启用摘要功能以优化上下文使用。单位为 K，默认值为 {default}K。'
        },
        skills: {
          name: 'Skills',
          desc: '可选 Skill 拓展列表，默认选择当前用户可用的全部 Skill。Skill 依赖的工具和 MCP 服务也会被自动挂载。'
        },
        mcps: {
          name: 'MCP 服务',
          desc: '默认选择当前用户可用的全部 MCP 服务。'
        },
        knowledges: {
          name: '知识库',
          desc: '知识库列表来自平台，请在左侧知识库页面创建。默认选择当前用户可访问的全部知识库。'
        },
        tools: {
          name: '工具',
          desc: '内置工具。默认选择当前用户可用的全部工具。'
        },
        tool_approval_mode: {
          name: '工具审批模式',
          desc: '默认审批会在写文件、编辑文件或执行命令前询问；完全信任会自动执行这些工具。',
          options: {
            default: '默认审批',
            always_trust: '完全信任'
          }
        },
        model: {
          name: '智能体模型',
          desc: '智能体的驱动模型，必须选择。'
        },
        system_prompt: {
          name: '系统提示词',
          desc: '用来描述智能体的角色和行为'
        }
      },
      editor: {
        advanced: '高级配置',
        advancedDesc: '未归入模型、提示词、知识库、工具、MCP、技能或子智能体的其余配置项',
        navAdvanced: '高级',
        basicInfoDesc: '配置智能体的名称、描述与运行后端',
        defaultName: '新建智能体',
        slug: '标识',
        slugPlaceholder: '标识可选，留空自动生成',
        slugDesc: '创建后作为智能体 ID 使用，留空则自动生成',
        backend: '智能体类型',
        backendDesc: '选择智能体类型，创建后不可更改。',
        backendAssistant: '智能助手',
        backendSubagent: '子智能体',
        backendDescAssistant: '对话型工作智能体，可调度工具、知识库与子智能体。',
        backendDescSubagent: '供主智能体调用的子智能体，专注单一任务。',
        subagents: '子智能体',
        subagentsDesc: '配置当前智能体可调度的子智能体',
        subagentsSelection: '子智能体范围',
        subagentsSelectionDesc: '选择当前智能体可调度的子智能体范围',
        subagentsSelect: '选择子智能体',
        subagentsSelectDesc: '选择要启用的子智能体',
        noSubagentsAvailable: '暂无可用子智能体',
        builtinTools: '内置工具',
        notEditable: '当前智能体不可编辑',
        readonlyHint: '你可以查看此智能体的配置，但没有管理权限。',
        nameRequired: '请填写智能体名称',
        modelRequired: '请选择智能体模型',
        iconUploadType: '只能上传图片文件',
        iconUploadSize: '图片大小不能超过 {size}MB',
        iconUploaded: '图标上传成功',
        iconUploadFailed: '图标上传失败',
        saved: '智能体已保存',
        created: '智能体已创建',
        saveFailed: '保存智能体失败'
      },
      share: {
        ownerOnly: '仅所有者',
        none: '无',
        global: '全局',
        department: '部门({count})',
        user: '用户({count})',
        readManage: '读{read} · 管{manage}',
        readonly: '只读{scope}'
      }
    }
  },
  knowledgeStages: {
    copyFailed: '复制失败，请手动选中文本',
    errorCode: {
      DOCREADER_UNAVAILABLE_SUGGESTION: '当前文件类型没有可用的解析引擎，或解析服务无法连接。请检查解析引擎配置后重试。',
      DOCREADER_TIMEOUT_SUGGESTION: '文件较大或解析服务繁忙。可拆分文件后重试，或检查文档解析服务负载。',
      DOCREADER_PARSE_FAILED_SUGGESTION: '文件可能已损坏、编码异常，或解析引擎出错。请检查文件后重新上传。',
      CHUNKING_FAILED: '分块失败',
      CHUNKING_FAILED_SUGGESTION: '文本切分未完成。可调整分块大小后重新解析。',
      EMBEDDING_RATE_LIMIT: '向量化请求过于频繁',
      EMBEDDING_RATE_LIMIT_SUGGESTION: '嵌入模型触发了速率限制。请稍后重试，或提高模型配额。',
      EMBEDDING_PROVIDER_FAIL: '向量化失败',
      EMBEDDING_PROVIDER_FAIL_SUGGESTION: '嵌入模型调用失败。请检查模型配置、密钥和模型名称后重试。',
      VECTORSTORE_WRITE_FAILED: '向量写入失败',
      VECTORSTORE_WRITE_FAILED_SUGGESTION: '向量已生成，但写入向量库失败。请检查向量库连接与容量后重试。',
      MULTIMODAL_VLM_FAILED: '图片理解失败',
      MULTIMODAL_VLM_FAILED_SUGGESTION: '单张图片的识别或描述失败。请检查多模态模型配置后重试。',
      MULTIMODAL_ALL_FAILED: '全部图片理解失败',
      MULTIMODAL_ALL_FAILED_SUGGESTION: '所有图片任务都未成功。文档正文仍可检索，图片理解需要检查多模态模型后重试。',
      TASK_TIMEOUT: '处理任务超时',
      TASK_TIMEOUT_SUGGESTION: '任务重试次数已用尽。请稍后重新解析，或拆分较大的文件。',
      UNKNOWN: '处理失败',
      SERVER_RESTART: '服务重启中断了处理',
      SERVER_RESTART_SUGGESTION: '应用重启时任务被中断。请重新解析该文档。',
      UPSTREAM_FAILED: '前置阶段失败，后续已取消',
      UPSTREAM_FAILED_SUGGESTION: '前面的阶段没有完成，本阶段已取消。请先处理失败的阶段后重试。',
      QUESTION_FAILED: '问题生成失败',
      QUESTION_FAILED_SUGGESTION: '为分块生成问题未成功。请检查对话模型配置后重试。',
      GRAPH_EXTRACT_FAILED: '知识图谱抽取失败',
      GRAPH_EXTRACT_FAILED_SUGGESTION: '图谱抽取未完成。请检查模型配置后重试。',
      SUMMARY_FAILED: '摘要生成失败',
      SUMMARY_FAILED_SUGGESTION: '文档摘要未生成。请检查对话模型配置后重试。',
      DOCREADER_UNAVAILABLE: '文档解析服务不可用',
      DOCREADER_TIMEOUT: '文档解析超时',
      DOCREADER_PARSE_FAILED: '文档解析失败'
    },
    head: {
      completedWithActiveTrace: '处理已完成，但仍有 {n} 个 Trace 任务处于活动状态',
      postprocessTasks: '后台任务：运行中 {running} / 失败 {failed} / 已完成 {completed}'
    },
    processConfig: {
      chunking: '分块',
      chunkSize: '大小 {n}',
      parentChildOn: '父子分块已开启',
      parentChildOff: '父子分块未开启',
      parser: '解析引擎',
      multimodal: '多模态',
      asr: '语音识别',
      question: '问题生成',
      questionOn: '已开启，{n} 个',
      on: '已开启',
      off: '未开启'
    },
    total: '总耗时 {d}'
  },
  knowledgeBase: {
    mindmap: '思维导图',
    mindmapGenerate: '生成思维导图',
    mindmapRegenerate: '重新生成',
    mindmapFitView: '适应视图',
    mindmapZoomIn: '放大',
    mindmapZoomOut: '缩小',
    mindmapLoading: '加载中...',
    mindmapGenerating: 'AI 正在生成思维导图...',
    mindmapEmpty: '还没有思维导图，可按知识库文件列表生成。',
    mindmapDescription: '按知识库文件列表生成层次结构，点击文件名可预览',
    mindmapGenerated: '思维导图已生成',
    mindmapLoadFailed: '加载思维导图失败',
    mindmapGenerateFailed: '生成思维导图失败',
    mindmapNotFound: '思维导图接口不存在。请重启后端服务并确认已执行数据库迁移。',
    tagNameTooLong: '标签名称最多 {max} 个字',
    moreFiltersShow: '展开筛选',
    moreFiltersHide: '收起筛选',
    accessInfo: {
      fromOrg: '来自租户'
    },
    allUploadFailed: '所有文件上传失败（{count}个）',
    allUploadSuccess: '所有文件上传成功（{count}个）',
    batchTagAvailableSection: '可选标签',
    batchTagNoSelected: '暂未选择',
    batchTagSelectedSection: '已选标签',
    fileExists: '文件已存在',
    partialUploadSuccess: '部分文件上传成功（成功：{success}，失败：{fail}）',
    tagClearAction: '清空已选',
    tagEditAvailableSection: '可选标签',
    tagEditNoSelected: '暂未选择',
    tagEditSearch: '搜索标签...',
    tagEditSelectedSection: '已选标签',
    tagNewPlaceholder: '输入新标签名称，回车添加',
    uploadAllFailed: '所有文件上传失败',
    uploadAllSuccess: '成功上传 {count} 个文件！',
    uploadFailed: '文件上传失败！',
    uploadPartialSuccess: '上传完成：成功 {success} 个，失败 {fail} 个',
    uploadSuccess: '文件上传成功！',
    uploadingFolder: '正在上传文件夹中的 {total} 个文件...',
    selectKnowledgeBase: '请选择知识库'
  },
  resourceOrigin: {
    tenant: '本租户',
    tenantTooltip: '本租户其他成员创建',
    spaceTooltipWithTenant: '来自共享空间「{space}」· 源租户 {tenant}',
    sharedTooltip: '通过共享空间从其他租户访问'
  },
  listSpaceSidebar: {
    workspace: '本租户'
  },
  contextualGuide: {
    agentCreate: {
      steps: {
        navTools: {
          desc: '推理问答模式下可勾选内置工具、MCP 服务等，扩展搜索、计算等能力。'
        },
        name: {
          desc: '取一个易识别的名称。推理问答模式下系统可能已预填默认名称，可按需修改。'
        },
        mode: {
          desc: '「即时问答」适合固定流程的直接回答；「推理问答」可调用工具、多步思考，适合复杂任务。'
        }
      }
    },
    kbCreate: {
      steps: {
        storage: {
          desc: '原始文件存放位置（本地或对象存储）。默认跟随租户设置即可。'
        }
      }
    },
    tenantModels: {
      steps: {
        done: {
          desc: '模型保存后关闭设置页，即可点击「创建知识库」；创建向导会引导你完成类型、索引与模型绑定。'
        }
      }
    },
    kbList: {
      steps: {
        create: {
          desc: '知识库用来存放文档与 FAQ。点击下方高亮的「创建知识库」按钮，我们会带你完成表单填写。'
        }
      }
    }
  },
  newUserGuide: {
    steps: {
      knowledge: {
        desc: '知识库是一切的起点：上传文档、网页或 FAQ，@:{\'brand.name\'} 会自动解析并建立索引。点击这里进入知识库。'
      },
      welcome: {
        title: '欢迎使用 @:{\'brand.name\'}'
      }
    }
  },
  chatEngine: {
    switchLabel: '选择类型',
    platform: '对话',
    chatWork: '工作',
    lockedHint: '已有对话内容，无法更改类型'
  },
  harness: {
    history: {
      recent: '最近',
      empty: '暂无对话历史',
      loadMore: '加载更多'
    },
    chat: {
      viewState: '查看状态',
      viewFiles: '查看文件',
      state: '状态',
      refreshState: '刷新状态',
      loadingMessages: '正在加载消息...',
      generating: '正在生成回复...',
      compressing: '正在压缩上下文...',
      queuedCount: '排队中（{count} 条）...',
      queuedRequests: '排队请求',
      queuedRequest: '排队请求',
      deleteQueued: '删除排队请求：{content}',
      continueQueue: '继续队列',
      queuePausedCancelled: '当前任务已停止，后续队列已暂停。',
      queuePausedFailed: '上一个任务失败，后续队列已暂停。',
      queueWaiting: '当前任务正在等待回答或审批，完成后将继续处理后续请求。',
      steerNext: '引导 · 下一条执行',
      steer: '引导',
      steerHint: '当前步骤结束后优先执行这条消息',
      selectModel: '选择模型',
      todos: '待办',
      files: '文件',
      artifacts: '产物',
      artifactCount: '{count} 个产物',
      openFile: '打开 {name}',
      emptyState: '暂无状态内容',
      contextUsage: '上下文使用情况',
      tokenComposition: 'Token 构成',
      systemPrompt: '系统提示',
      toolDefs: '工具定义 ({count})',
      contentMessages: '内容消息',
      toolMessages: '工具消息',
      summary: '摘要',
      compressed: '已压缩',
      other: '其他',
      windowRemaining: '窗口/剩余',
      unknownFile: '未知文件',
      deliveryFile: '产物',
      deliveryFileExt: '产物 · {ext}',
      subagent: '子智能体',
      agent: '智能体',
      assistant: '智能助手',
      file: '文件',
      attachment: '附件',
      approvalSaveFailed: '审批模式保存失败',
      createFailed: '创建对话失败，请重试',
      queuedDeleted: '已删除排队请求',
      steered: '已设为下一条引导请求',
      queueContinued: '队列已继续',
      cancelSent: '已发送取消请求',
      invalidQuestion: '无效的提问请求',
      threadNotFound: '无法找到对应的对话线程',
      runNotFound: '无法找到需要恢复的运行任务',
      approvalRestoreFailed: '审批状态恢复失败，请刷新页面后重试',
      mentionEmpty: '暂无可引用的项',
      dropToUpload: '释放以上传附件',
      addAttachment: '添加附件',
      uploadedImage: '用户上传的图片',
      thinking: '思考中...',
      reasoning: '推理过程',
      calledTool: '调用: {name}',
      calledTools: '已调用 {count} 个工具',
      toolCompleted: '已完成',
      toolFailedCount: '{count} 失败',
      toolRunningCount: '{count} 进行中',
      toolSucceeded: '工具 {name} 执行完成',
      toolFailed: '工具 {name} 执行失败',
      toolCalling: '正在调用工具: {name}',
      toolParams: '参数',
      toolFailedStatus: '失败',
      toolRunningStatus: '运行中',
      errorInterrupted: '回答生成已中断',
      errorGuard: '检测到敏感内容，已中断输出',
      errorUnexpected: '生成过程中出现异常',
      errorAgent: '智能体获取失败',
      unknownError: '未知错误',
      stoppedHint: '你停止生成了本次回答',
      reedit: '重新编辑问题',
      switchBound: '当前对话已绑定智能体，请新建对话后切换',
      switchFailed: '切换智能体失败',
      removeAttachment: '移除附件 {name}',
      download: '下载',
      save: '保存',
      saving: '保存中',
      cancel: '取消',
      delete: '删除',
      retry: '重试',
      preview: '预览',
      source: '源码',
      edit: '编辑',
      unsaved: '未保存',
      fullscreenPreview: '全屏预览',
      copyCode: '复制代码',
      copied: '已复制',
      htmlPreview: 'HTML 预览',
      collapsePreview: '收起预览面板',
      closePreview: '关闭预览',
      close: '关闭',
      previewFailed: '文件预览失败',
      previewUnsupported: '当前文件暂不支持预览，请下载后查看',
      loading: '正在加载',
      saveToWorkspace: '保存到工作区',
      savedToWorkspace: '已保存到工作区：{path}',
      downloadFailed: '下载文件失败',
      saveToWorkspaceFailed: '保存到工作区失败',
      panel: {
        title: '文件',
        hideFileList: '隐藏文件列表',
        showFileList: '查看文件列表',
        refresh: '刷新',
        closePanel: '关闭文件面板',
        previewEmptyTitle: '选择产物后可在此预览',
        previewEmptyDesc: '也可以打开文件列表，浏览当前工作区文件。',
        createThreadHint: '创建对话后可查看工作区',
        loadingFs: '正在加载文件系统...',
        loadFsFailed: '加载文件系统失败',
        emptyWorkspace: '当前工作区为空',
        downloadFile: '下载文件',
        deleteFile: '删除文件',
        deleteFolder: '删除文件夹',
        confirmDeleteFile: '确认删除文件「{name}」？',
        confirmDeleteFolder: '确认删除文件夹「{name}」？',
        deleteFolderContent: '将删除该文件夹及其所有内容，删除后不可恢复。',
        deleteIrreversible: '删除后不可恢复。',
        deleteFileSuccess: '文件删除成功',
        deleteFolderSuccess: '文件夹删除成功',
        deleteFileFailed: '删除文件失败',
        deleteFolderFailed: '删除文件夹失败'
      }
    },
    tokenGate: {
      title: '接入工作',
      sidebarHint: '请先登录后再查看工作对话。',
      sidebarAction: '去登录'
    }
  },
  menu: {
    skillsTools: '技能·工具',
    workspace: '工作区',
    dashboard: '数据总览',
    newChat: '新建对话'
  },
  workspacePage: {
    subtitle: '管理个人与知识库工作区中的文件、文件夹与预览',
    guide: '使用说明',
    newFolder: '新建文件夹',
    uploadFile: '上传文件',
    collapseSidebar: '收起工作区侧边栏',
    expandSidebar: '展开工作区侧边栏',
    rootLabel: '工作区',
    resizePreview: '调整预览宽度',
    knowledgeTitle: '知识库',
    knowledgePlaceholder: '请选择一个可访问知识库以浏览文件。',
    createFolderTitle: '新建文件夹',
    create: '创建',
    cancel: '取消',
    folderNamePlaceholder: '请输入文件夹名称',
    folderNameRequired: '请输入文件夹名',
    agentsGuideTitle: 'Agents 目录说明',
    agentsGuideOk: '我知道了',
    agentsGuideP1: '这个文件夹中的说明文件会在合适的时机注入到 Agent 的执行流程中，用来补充你的长期偏好、业务背景和协作要求。',
    agentsGuideP2: '目前支持 AGENTS.md、USER.md 和 MEMORY.md：其中内容会在每次会话中注入到 Agent Prompt，分别适合写入行为约束、用户信息和希望 Agent 记住的信息。',
    agentsGuideTipsTitle: '填写建议',
    agentsGuideTip1: '写清常用工作背景，例如部门职责、常见任务、知识库使用方式。',
    agentsGuideTip2: '写清回答偏好，例如语言风格、详略程度、是否优先给结论。',
    agentsGuideTip3: '写清业务术语和固定称呼，帮助 Agent 保持表达一致。',
    agentsGuideTip4: '写清资料使用要求，例如优先引用哪些知识库、哪些内容需要谨慎确认。',
    agentsGuideTip5: '写清协作边界，例如不确定时先提问，涉及重要决策时先给方案再执行。',
    agentsGuideTip6: '优先使用明确、可执行的规则，避免“尽量做好”这类模糊描述。',
    chatsLabel: '历史对话',
    loadPreviewFailed: '加载文件预览失败',
    loadDirFailed: '加载工作区目录失败',
    loadKnowledgeDirFailed: '加载知识库目录失败',
    knowledgeFallback: '知识库',
    readonlyCannotSave: '当前文件为只读，无法保存',
    saveSuccess: '文件保存成功',
    saveFailed: '文件保存失败',
    createFolderSuccess: '文件夹创建成功',
    createFolderFailed: '创建文件夹失败',
    uploadLimit: '一次最多上传 {count} 个文件',
    uploadSuccess: '{count} 个文件上传成功',
    uploadFailed: '上传文件失败',
    confirmDeleteSelected: '确认删除选中的 {count} 项？',
    deleteSelectedSuccess: '选中项删除成功',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    personal: '个人工作区',
    quickAccess: '快速访问',
    savedArtifacts: '保存的产物',
    agentFiles: '智能体文件',
    myKnowledge: '我的知识库',
    sharedKnowledge: '共享知识库',
    loadingKnowledge: '正在加载知识库...',
    loadingPreview: '正在加载预览...',
    selectToPreview: '选择文件以预览',
    previewHint: '支持 Markdown、TXT 编辑，其他格式保持只读预览。',
    emptyFolder: '当前文件夹为空',
    multiSelect: '多选',
    deleteSelected: '删除选中',
    moreActions: '更多操作',
    name: '名称',
    size: '大小',
    modifiedAt: '修改时间',
    actions: '操作',
    itemCount: '{count} 项',
    filePath: '文件路径',
    refresh: '刷新'
  },
  dashboard: {
    subtitle: '查看平台运行概况，包括会话、智能体、工具调用与知识库使用情况',
    loadFailed: '加载统计数据失败',
    loadPartial: '详细数据加载失败，仅显示基础统计',
    loadNone: '无法加载任何统计数据',
    feedback: {
      title: '用户反馈详情'
    },
    knowledge: {
      title: '知识库使用情况',
      total: '知识库总数',
      files: '文件总数',
      storage: '存储容量',
      unit: '个',
      fileTypes: '文件类型分布',
      unknownType: '未知',
      noData: '暂无数据',
      sourcePlatform: '仅统计平台知识库'
    },
    tools: {
      title: '工具调用监控',
      totalCalls: '总调用次数',
      failedCalls: '失败调用',
      successRate: '成功率',
      times: '次',
      top10: '最常用工具 TOP 10',
      errorAnalysis: '工具错误分析',
      errorDistribution: '错误分布图',
      toolName: '工具名称',
      errorCount: '错误次数'
    },
    agents: {
      title: 'AI智能体分析',
      total: '智能体总数',
      conversations: '总对话数',
      toolCalls: '工具调用总数',
      unit: '个',
      times: '次',
      distribution: '对话/工具调用分布 (TOP 3)',
      topPerformers: '表现最佳智能体 TOP 5',
      rank: '排名',
      agent: '智能体',
      score: '综合分',
      conversationCount: '对话数',
      toolCallCount: '工具调用数'
    },
    users: {
      title: '用户活跃度趋势',
      active24h: '24h活跃',
      active30d: '30天活跃',
      last7days: '最近7天',
      series: '活跃用户数'
    },
    calls: {
      title: '调用统计',
      hours: '近14小时',
      days: '近14天',
      weeks: '近14周',
      weekLabel: '第{week}周',
      models: '模型调用',
      agents: '智能体调用',
      tokens: 'Token消耗',
      tools: '工具调用',
      unknownModel: '未知模型',
      input: '输入',
      output: '输出',
      total: '总计: {value}'
    },
    stats: {
      conversations: '累计会话',
      activeConversations: '活跃对话',
      messages: '总消息数',
      users: '用户数',
      chat: '对话',
      work: '工作'
    }
  },
  brand: {
    name: '智能体操作端'
  },
  mcpMetadata: {
    fullSchema: '完整定义',
    refresh: '刷新 Tools'
  }
}
