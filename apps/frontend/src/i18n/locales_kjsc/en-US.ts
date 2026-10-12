export default {
  modelCatalog: {
    description: 'The model catalog defines which models are offered when adding a model, along with defaults such as context window and reasoning support. Changes here apply to all tenants immediately.',
    layers: {
      explicit: 'Values a tenant sets in model settings always win; catalog changes never rewrite saved models.'
    },
    fieldsHint: 'Values a tenant sets in model settings still take precedence. Clear a field to restore its default.',
    historyRestoreConfirm: 'Restore version {version} and apply it to all tenants immediately?'
  },
  toolbox: {
    unavailable: 'No tools are available in the current tenant.'
  },
  localBrowser: {
    viewOnly: 'View only for this conversation’s browser',
    windowHint: 'Tasks run in a separate browser Agentic Window. Borrowing existing tabs requires your permission.',
    usageStep2Text: 'Copy the pairing link into Connection settings → Remote connection in the extension and confirm the server. Pair once for all conversations in this tenant.'
  },
  platformApiKeys: {
    description: 'Create platform credentials for cross-tenant automation. Use X-Tenant-ID for tenant APIs.',
    securityNotice: 'Platform API keys can target any tenant. Grant only required capabilities; plaintext is shown once.',
    createDescription: 'Platform keys are not bound to a tenant; capabilities still limit every operation.',
    capabilityHint: 'Tenant capabilities apply to the X-Tenant-ID target; system capabilities apply to control-plane APIs.',
    capabilityHints: {
      tenantsRead: 'List, search, and inspect every tenant.',
      tenantsManage: 'Create, update, delete tenants and apply global tenant settings.'
    },
    capabilities: {
      tenantsRead: 'Read tenants',
      tenantsManage: 'Manage tenants'
    }
  },
  tenantInvitation: {
    errors: {
      alreadyMember: 'This user is already an active member of the tenant.'
    },
    myInbox: {
      description: 'Invitations from other tenants. Accept to join with the assigned role.',
      tenantLabel: 'Tenant'
    },
    shareLink: {
      description: 'Generate a multi-use registration link you can drop in a group chat. Anyone who opens it registers with their own email and joins this tenant. Expires in {days} days, or revoke it any time from the list.'
    }
  },
  tenantMember: {
    sectionDescription: 'Add members to this tenant and assign roles. Only the Owner can add, edit, or remove members.',
    listTitle: 'Tenant members',
    empty: 'No members yet. Use the button above to add one.',
    searchPlaceholder: 'Search by name, login account, or email',
    audit: {
      description: 'Records every membership change and access denial in this tenant. Newest first. Repeated denials within a minute are deduplicated.',
      outcome: {
        accepted: 'Accepted',
        canceled: 'Canceled',
        failed: 'Failed',
        partial: 'Partial'
      }
    },
    errors: {
      emailExists: 'This email is already in use',
      usernameRequired: 'Username is required',
      usernameMinLength: 'Username must be at least 2 characters',
      usernameMaxLength: 'Username cannot exceed 20 characters',
      usernameInvalid: 'Username can only contain letters, numbers, underscores, and Chinese characters',
      usernameExists: 'This username is already in use',
      accountRequired: 'Enter a login account',
      accountInvalid: 'Login account can only contain letters and digits, up to 20 characters',
      accountExists: 'This login account is already in use',
      accountLocked: 'The login account is already set and cannot be changed',
      passwordRequired: 'Password is required',
      passwordMinLength: 'Password must be at least 8 characters',
      passwordMaxLength: 'Password cannot exceed 32 characters',
      passwordLetter: 'Password must contain a letter',
      passwordNumber: 'Password must contain a digit',
      passwordPolicy: 'Password must be 8-32 characters and include both letters and digits',
      confirmPasswordRequired: 'Confirm the password',
      passwordMismatch: 'The two passwords do not match',
      alreadyMember: 'This user is already a member of the tenant'
    },
    leave: {
      confirmTitle: 'Leave this tenant?',
      confirmBody: 'You will lose access to all knowledge bases and agents in this tenant. You can be re-invited later.',
      success: 'You have left the tenant'
    },
    remove: {
      confirmBody: 'Are you sure you want to remove {name} from this tenant? They will lose access immediately.'
    },
    edit: {
      button: 'Edit',
      dialogTitle: 'Edit member',
      success: 'Member updated',
      accountHintEmpty: 'Empty now and can be filled in. It cannot be changed after saving.',
      accountHintLocked: 'The login account is already set and cannot be changed'
    },
    add: {
      button: 'Add member',
      dialogTitle: 'Add member',
      success: 'Member added',
      usernameLabel: 'Username',
      usernamePlaceholder: 'Enter username',
      accountLabel: 'Login account',
      accountPlaceholder: 'Letters and digits, up to 20',
      accountHint: 'Cannot be changed after it is saved',
      emailPlaceholder: 'Enter email',
      emailHint: 'Email must be unique',
      passwordLabel: 'Password',
      passwordPlaceholder: '8-32 characters, with letters and digits',
      confirmPasswordLabel: 'Confirm password',
      confirmPasswordPlaceholder: 'Enter the password again'
    },
    columns: {
      member: 'Name & login account'
    },
    permissions: {
      desc: 'What each role can do inside this tenant. Server-enforced; UI controls reflect the rules but are not the source of truth.',
      manageTenantConfig: 'Edit tenant settings',
      readAll: 'Read tenant content'
    }
  },
  integrations: {
    cli: {
      title: 'Agentic CLI'
    },
    claw: {
      title: 'Agentic Skill',
      subtitle: 'Import documents and run hybrid retrieval (vector + keyword) via the @:{\'brand.name\'} REST API—for uploads, URL imports, Markdown entries, and cross-KB search.',
      installCtaHint: 'Install Agentic Skill · opens in a new tab'
    },
    chrome: {
      subtitle: 'For self-hosted @:{\'brand.name\'}: ask questions in a sidebar, clip web pages, and save Markdown notes into your knowledge bases while you browse.',
      steps: {
        port: {
          desc: 'On @:{\'brand.name\'} Desktop, set a fixed API port (e.g. 37841) in API Info so the URL stays stable across restarts.'
        }
      }
    },
    api: {
      apiKeyAccessTypeHint: '"Knowledge base" operates within the KB scope at the permission level below; "Tenant full" additionally unlocks every tenant-level API such as models and data sources.',
      apiKeyCapabilityGroupCollaboration: 'Members and tenants',
      apiKeyCapabilityGroupTenant: 'Tenant configuration',
      capabilityTenantFull: 'Tenant full access',
      capabilityTenantFullHint: 'Allow every tenant-level API, including models, vector stores, data sources and channels. Knowledge-base scope does not apply.',
      capabilityIngestHint: 'Let this key write content into its allowed knowledge bases (upload documents, edit chunks/FAQ/tags/wiki). It cannot create knowledge bases or agents, cannot clear a knowledge base, and stays bounded to the selected knowledge bases.',
      capabilityManageKbsHint: 'Let this key manage the full knowledge-base lifecycle: create, copy, update, and delete knowledge bases and change their initialization/configuration. Operations on existing knowledge bases (copy/update/delete) stay bounded by the selected scope; creating a new knowledge base is unrestricted (the new KB belongs to this tenant).',
      capabilityMessageHistoryHint: 'Let this key search tenant chat history and read chat-history stats. It does not grant tenant configuration access.',
      capabilityManageModelsHint: 'Manage model definitions, credentials, connectivity checks, and Cloud service credentials.',
      capabilityManageStorageBackendsHint: 'Manage object/file storage backend instances (e.g. S3-compatible or local file storage): their CRUD lifecycle, connectivity tests, and the tenant default selection.',
      capabilityManageMembersHint: 'List and manage tenant members, roles, invitations, and invite links. Does not include API key management, tenant deletion, or ownership transfer.',
      capabilityManageSpaces: 'Manage spaces',
      capabilityManageSpacesHint: 'Manage organization tenants, join flows, tenant membership, invitations, and shared-tenant visibility. Does not grant KB or agent share management.',
      capabilityManageTenantSettings: 'Manage tenant settings',
      capabilityManageTenantSettingsHint: 'Read and update tenant-level integration settings such as API end-user identity mode, request header configuration, and tenant KV settings. Does not include API key management, member management, tenant deletion, or ownership transfer.',
      modeTenant: 'Tenant only',
      signedFlowDetail: 'Keep the HMAC secret only on @:{\'brand.name\'} and your trusted backend—never put it in requests or ship it to browsers. The request header carries the JWT string signed with that secret (it changes on each issuance or after expiry), not the secret itself. JWT must include sub (external user ID), tenant_id, aud=weknora, and exp (max 24h lifetime).',
      requireDirectHeaderDesc: 'When enabled, API Key requests without the user ID header are rejected; when disabled, all requests are treated as the whole tenant with no per-user distinction.',
      hmacSecretDesc: 'Same secret stored in @:{\'brand.name\'}; used only on your backend to sign JWTs—never send it as a request header.',
      playgroundTenantModeHint: 'Tenant-only mode does not send an external user identity; all API sessions use the same tenant-level principal.',
      playgroundNeedApiKey: 'This tenant has no API key.',
      editApiKeyScopeHint: 'Leave empty to allow all knowledge bases in this tenant. All changes take effect immediately.'
    },
    mcpserver: {
      subtitle: 'Publish this tenant as an MCP server that Claude Desktop, Cursor, Claude Code and other MCP clients connect to directly. Each endpoint has its own token, knowledge-base scope and tool list.',
      kbScopePlaceholder: 'Leave empty for every knowledge base in the tenant',
      kbScopeHint: 'Every retrieval, ask and write tool is confined to these knowledge bases. Empty means the whole tenant.'
    }
  },
  datasource: {
    resumeFailed: 'Failed to resume'
  },
  agentEditor: {
    agentType: {
      kbMismatch: {
        quickAnswer: 'Instant Q&A mode requires RAG retrieval'
      }
    },
    im: {
      descriptionRestricted: 'Connect agent to instant messaging platforms: WeCom, Feishu and DingTalk'
    },
    desc: {
      memoryEnabled: 'Let this agent read and add to your long-term memory. When off, conversations with it neither read your memories nor add new ones. Turning it on here has no effect while the tenant or personal switch is off'
    }
  },
  kbSettings: {
    parser: {
      engines: {
        weknoracloud: {
          name: 'Cloud Parsing Service',
          desc: 'Document parsing via the cloud service'
        },
        anydoc: {
          desc: 'In-process Office document parsing engine (no external service required)'
        }
      }
    },
    vectorStore: {
      engineDesc: 'Pick a store from the global Vector Stores configuration, or leave as System default to use the tenant-wide RETRIEVE_DRIVER engine.'
    }
  },
  organization: {
    subtitle: 'Create or join shared spaces so multiple tenants can collaborate and share knowledge bases and agents',
    addMember: {
      tipTenant: 'Membership is at the tenant level: once a tenant joins, all of its users share access to this space. Results below are deduplicated by tenant.',
      searchTenant: 'Select Tenant',
      searchTenantPlaceholder: 'Search by tenant name...',
      searchTenantHint: 'Type at least 2 characters; results are deduplicated by tenant and exclude tenants already in this space'
    },
    settings: {
      membersDesc: 'View and manage shared space members and their roles. Each member represents a tenant — all users in the same tenant share access to this shared space.'
    },
    join: {
      alreadyMember: 'You are already a member of this shared tenant',
      confirmTitle: 'Confirm Join Shared Space',
      failed: 'Failed to join shared tenant',
      goToOrganizations: 'Go to Shared Spaces',
      joining: 'Joining shared tenant...',
      success: 'Successfully joined shared tenant!'
    },
    rbac: {
      needTenantAdminTip: 'This action requires the admin role (or higher) in the current tenant. Please contact the tenant owner.',
      cannotCreate: 'Your tenant role is insufficient to create a shared space',
      cannotJoin: 'Your tenant role is insufficient to join or request to join a shared space',
      cannotManage: 'Your tenant role is insufficient to manage this shared space'
    },
    joinFailed: 'Failed to join shared tenant',
    joinSuccess: 'Joined shared tenant successfully'
  },
  mcpServiceDialog: {
    viewTitle: 'View MCP Service',
    testResultTitle: 'Test result',
    stdioLaunch: 'Launch command'
  },
  modelSettings: {
    debug: {
      thinkOff: 'Thinking off',
      thinkOn: 'Thinking on',
      thinking: 'Thinking mode',
      thinkingDesc: 'Only applies to models that support thinking'
    },
    builtinModels: {
      description: 'Built-in models are visible to all tenants. Sensitive information is hidden, and they cannot be edited or deleted.',
      descriptionAdmin: 'Built-in models are visible to all tenants. System administrators can edit configuration and credentials; deletion remains deployment-managed.'
    }
  },
  mcpSettings: {
    view: 'View'
  },
  platform: {
    independentTenant: 'Independent Tenant'
  },
  theme: {
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode'
  },
  model: {
    editor: {
      lkeap: {
        secretIdLabel: 'SecretId',
        secretIdPlaceholder: 'Tencent Cloud API SecretId',
        secretKeyLabel: 'SecretKey',
        secretKeyPlaceholder: 'Tencent Cloud API SecretKey',
        regionLabel: 'Region',
        regionPlaceholder: 'ap-guangzhou',
        regionDesc: 'RunRerank supports ap-beijing, ap-guangzhou, etc. Default: ap-guangzhou',
        rerankCredentialHint: 'Rerank uses Tencent Cloud API signature (not the OpenAI-style LKEAP API key). Create SecretId/SecretKey in the CAM console.'
      },
      providers: {
        novita: {
          label: 'Novita AI',
          description: 'moonshotai/kimi-k2.5, zai-org/glm-5, minimax/minimax-m2.7, qwen/qwen3-embedding-0.6b, etc.'
        },
        nvidia: {
          label: 'NVIDIA',
          description: 'deepseek-ai-deepseek-v3_1, nv-embed-v1, rerank-qa-mistral-4b, etc.'
        },
        lkeap: {
          label: 'Tencent Cloud LKEAP',
          description: 'DeepSeek-R1, DeepSeek-V3, lke-reranker-base, etc.'
        },
        longcat: {
          label: 'LongCat AI',
          description: 'LongCat-Flash-Chat, LongCat-Flash-Thinking, etc.'
        },
        qianfan: {
          label: 'Baidu Qianfan',
          description: 'ernie-5.0-thinking-preview, embedding-v1, bce-reranker-base, etc.'
        },
        moonshot: {
          label: 'Moonshot',
          description: 'kimi-k2-turbo-preview, moonshot-v1-8k-vision-preview, etc.'
        },
        qiniu: {
          label: 'Qiniu Cloud',
          description: 'deepseek/deepseek-v3.2-251201, z-ai/glm-4.7, etc.'
        },
        modelscope: {
          label: 'ModelScope',
          description: 'Qwen/Qwen3-8B, Qwen/Qwen3-Embedding-8B, etc.'
        },
        gpustack: {
          label: 'GPUStack',
          description: 'Choose your deployed model on GPUStack'
        },
        gemini: {
          label: 'Google Gemini',
          description: 'gemini-3-flash-preview, gemini-2.5-pro, etc.'
        },
        mimo: {
          label: 'MiMo',
          description: 'mimo-v2-flash'
        },
        minimax: {
          label: 'MiniMax',
          description: 'MiniMax-M3, MiniMax-M2.7, MiniMax-M2.7-highspeed, etc.'
        },
        hunyuan: {
          label: 'Hunyuan',
          description: 'hunyuan-pro, hunyuan-standard, hunyuan-embedding, etc.'
        },
        deepseek: {
          label: 'DeepSeek',
          description: 'deepseek-chat, deepseek-reasoner, etc.'
        },
        volcengine: {
          label: 'Volcengine',
          description: 'doubao-1-5-pro-32k-250115, doubao-embedding-vision-250615, etc.'
        },
        jina: {
          label: 'Jina',
          description: 'jina-clip-v1, jina-embeddings-v2-base-zh, etc.'
        },
        siliconflow: {
          label: 'SiliconFlow',
          description: 'deepseek-ai/DeepSeek-V3.1, etc.'
        },
        generic: {
          label: 'Custom (OpenAI-compatible)',
          description: 'Generic API endpoint'
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
          label: 'Zhipu BigModel',
          description: 'glm-4.7, embedding-3, rerank, etc.'
        },
        aliyun: {
          label: 'Aliyun DashScope',
          description: 'qwen-plus, tongyi-embedding-vision-plus, qwen3-rerank, etc.'
        },
        azure_openai: {
          label: 'Azure OpenAI',
          description: 'OpenAI service hosted on Microsoft Azure'
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
          description: 'Self-hosted proxy to 100+ providers (OpenAI, Anthropic, Gemini, Bedrock, etc.). Replace the placeholder URL; loopback hosts need SSRF_WHITELIST.'
        }
      },
      thinkingControl: {
        thinkingType: {
          label: 'thinking.type',
          hint: 'Volcengine Ark; Tencent LKEAP (DeepSeek V3, etc.; default for LKEAP; use “Do not send” for R1)'
        },
        enableThinking: {
          label: 'enable_thinking',
          hint: 'Alibaba DashScope: qwen3, qwen-plus, qwen-max, qwen-turbo'
        },
        chatTemplateKwargs: {
          label: 'chat_template_kwargs',
          hint: 'Custom OpenAI-compatible gateways, NVIDIA NIM, vLLM / local Qwen'
        },
        none: {
          label: 'Do not send thinking fields',
          hint: 'Agent “Thinking mode” switch has no effect; thinking parameters are not sent in requests'
        }
      },
      thinkingControlDesc: 'Controls how the agent’s “Thinking mode” on/off switch is written to the API. We pre-select based on vendor/model when possible; change it to match your API docs. With “Do not send”, the agent Thinking mode switch has no effect.',
      thinkingControlLabel: 'Thinking mode request format',
      volcengine: {
        accessKeyLabel: 'Access Key ID',
        accessKeyPlaceholder: 'Volcengine Access Key ID',
        secretKeyLabel: 'Secret Access Key',
        secretKeyPlaceholder: 'Volcengine Secret Access Key',
        rerankCredentialHint: 'Rerank uses VikingDB AK/SK signing, not an Ark API key. Recommended model: doubao-seed-rerank.'
      }
    }
  },
  error: {
    tenant: {
      listFailed: 'Failed to list tenants',
      searchFailed: 'Failed to search tenants',
      updateFailed: 'Failed to update tenant information',
      deleteFailed: 'Failed to delete tenant',
      createApiKeyFailed: 'Failed to create API key',
      createFailed: 'Creation failed',
      deleteApiKeyFailed: 'Failed to delete API key',
      listApiKeysFailed: 'Failed to list API keys'
    },
    auth: {
      getTenantFailed: 'Failed to get tenant info'
    }
  },
  system: {
    versionDescription: 'Version of the application service',
    frontendVersionDescription: 'Build version of the UI',
    globalSettings: {
      description: 'Platform-wide runtime configuration. Saves take effect immediately for every tenant. Visible and editable by system administrators only.',
      audit: {
        target: {
          bulkQuotaDiff: 'Applied to {count} tenants ({gb} GB)'
        },
        outcome: {
          accepted: 'Accepted',
          canceled: 'Canceled',
          failed: 'Failed',
          partial: 'Partial'
        }
      },
      bulkApply: {
        label: 'Apply to all existing tenants',
        tooltip: 'Saving the value only affects new tenants by default; click here to also overwrite every existing tenant.',
        confirmBody: 'Overwrite the storage quota of every existing tenant to {value} GB. Tenants whose quota was tuned manually by operations will also be overwritten. Continue?',
        success: 'Updated storage quota for {count} tenants to {gb} GB',
        failed: 'Failed to apply to all tenants'
      },
      passwordReset: {
        validation: {
          emailRequired: 'Enter the user email',
          emailInvalid: 'Enter a valid email address',
          passwordRequired: 'Enter a new password',
          passwordLength: 'Password must be 8-32 characters',
          passwordLetter: 'Password must contain a letter',
          passwordNumber: 'Password must contain a number',
          confirmRequired: 'Enter the new password again',
          passwordMismatch: 'The passwords do not match'
        }
      },
      createUser: {
        description: 'Provision a new local user account. If the platform\'s default tenant mode is set to "create personal", the user gets a personal tenant just like a self-registered user would.'
      },
      admins: {
        confirm: {
          promote: {
            body: 'Promote {email} to system administrator? This user will gain platform-level privileges: access to every tenant, system settings, and the admin roster itself.'
          }
        }
      },
      confirm: {
        bodySandboxDockerEnabled: 'Once on, tenant admins can point a sandbox at the local Docker daemon. A local docker.sock is equivalent to root on the host. Use this only on a private single-node install that mounts the daemon or uses a TLS-protected remote tcp:// endpoint.'
      },
      enumLabels: {
        auth: {
          default_tenant_mode: {
            create_personal: 'Create personal tenant',
            tenantless: 'Do not create a tenant'
          }
        }
      },
      keyDescriptions: {
        tenant: {
          max_owned_per_user: 'Maximum number of tenants a non-superuser may own via self-service creation. Read on every tenant creation and takes effect immediately after saving. 0 uses the built-in default of 10; a negative value disables the cap entirely (not recommended on public deployments).',
          self_service_creation_enabled: 'Whether non-superusers may create tenants themselves. When disabled, regular users can only join existing tenants by invitation; cross-tenant superusers remain exempt. Takes effect immediately.',
          default_storage_quota_gb: 'Default storage quota (GB) assigned when a new tenant is created, covering vectors, originals, text, indexes, and related data. Read only at creation time — changes apply to newly created tenants only and do not retroactively update existing tenants. 0 or a negative value uses the built-in default of 10 GB.',
          auto_create_api_key: 'Automatically creates a full_access API key for a new tenant and returns its plaintext token in the create response. Use only for integrations that depend on the legacy behavior; it is disabled by default and explicit API-key creation is recommended.',
          auto_accept_invitation: 'When enabled, inviting a registered user by email adds them as a member immediately instead of waiting for inbox confirmation. When off, the invitee must accept from their inbox. Takes effect immediately.'
        },
        auth: {
          default_tenant_mode: 'Tenant provisioning after public registration. create_personal creates an Owner tenant; tenantless creates only the account until the user accepts an invitation or creates a tenant. Applies to new users only.'
        }
      },
      keyLabels: {
        tenant: {
          max_owned_per_user: 'Max tenants owned per user',
          self_service_creation_enabled: 'Allow self-service tenant creation',
          default_storage_quota_gb: 'Default storage quota for new tenants (GB)',
          auto_create_api_key: 'Automatically create an API key for new tenants'
        },
        auth: {
          default_tenant_mode: 'Default tenant provisioning'
        }
      },
      runtime: {
        tasks: {
          tenantLabel: 'Tenant ID'
        }
      },
      sections: {
        tenant: {
          tab: 'Tenant defaults {count}',
          title: 'Tenant defaults',
          description: 'Set initial quotas and compatibility behavior for new tenants without rewriting existing tenants.'
        },
        access: {
          description: 'Manage system administrators, public registration, and tenant-creation rules.'
        }
      }
    }
  },
  tenant: {
    title: 'Tenant Information',
    currentTenant: 'Current Tenant',
    switchTenant: 'Switch tenant',
    sectionDescription: 'View detailed configuration for the tenant',
    searchPlaceholder: 'Search by name or enter tenant ID...',
    noMatch: 'No matching tenants found',
    switchSuccessTitle: 'Tenant switched',
    loadTenantsFailed: 'Failed to load tenant list',
    messages: {
      fetchFailed: 'Failed to fetch tenant information'
    },
    deleteDangerZone: {
      title: 'Delete this tenant',
      desc: 'Delete the whole tenant and its configuration. Members will no longer be able to access its knowledge bases, agents, or API key.',
      button: 'Delete tenant',
      confirmTitle: 'Delete this tenant?',
      confirmBody: 'This will delete "{name}" and make its knowledge bases, agents, members, and API key unavailable. This action cannot be undone.',
      confirmHint: 'Type the tenant name "{name}" to confirm deletion.',
      nameMismatch: 'Tenant name does not match',
      success: 'Tenant deleted',
      failed: 'Failed to delete tenant',
      confirm: 'Delete tenant'
    },
    leaveDangerZone: {
      title: 'Leave this tenant',
      desc: 'Ends your membership in this tenant. You will lose access to its knowledge bases and agents. You can be invited again later.',
      button: 'Leave tenant'
    },
    storage: {
      quotaDescription: 'Total storage capacity allocated to the tenant'
    },
    details: {
      idLabel: 'Tenant ID',
      idDescription: 'Unique identifier of your tenant',
      nameLabel: 'Tenant Name',
      nameDescription: 'Name of your tenant',
      descriptionLabel: 'Tenant Description',
      descriptionDescription: 'Detailed description of the tenant',
      businessLabel: 'Tenant Business',
      businessDescription: 'Business domain that the tenant belongs to',
      statusLabel: 'Tenant Status',
      statusDescription: 'Current operational status of the tenant',
      createdAtLabel: 'Tenant Creation Time',
      createdAtDescription: 'Time when the tenant was created',
      editNamePlaceholder: 'Enter the new tenant name',
      editNameRequired: 'Tenant name cannot be empty',
      editNameSuccess: 'Tenant name updated',
      editNameFailed: 'Failed to update tenant name',
      editDescriptionPlaceholder: 'Enter the new tenant description',
      editDescriptionSuccess: 'Tenant description updated',
      editDescriptionFailed: 'Failed to update tenant description'
    },
    create: {
      action: 'Create new tenant',
      dialogTitle: 'Create new tenant',
      dialogSubtitle: 'A tenant has its own knowledge bases and members. You will become the owner of the new tenant.',
      nameLabel: 'Tenant name',
      nameRequired: 'Please enter a tenant name',
      descriptionPlaceholder: 'Briefly describe what this tenant is for',
      success: 'Tenant created successfully',
      failed: 'Failed to create tenant',
      disabled: 'This system only allows joining tenants by invitation. You cannot create one yourself.',
      needAdmin: 'Only tenant owners or admins can create a tenant.'
    },
    switcher: {
      menuLabel: 'Switch tenant',
      homeTooltip: 'Your home tenant',
      empty: 'You only belong to one tenant'
    }
  },
  chat: {
    sandbox: {
      desktopPlaceholder: 'Desktop visualization coming soon'
    },
    scrollToBottom: 'Back to bottom',
    copyFailed: 'Copy failed',
    copySuccess: 'Copied',
    editorOpened: 'Editor opened',
    emptyContentWarning: 'Content is empty',
    imageReadFailed: 'Failed to read image'
  },
  knowledgeEditor: {
    titleCreate: 'Create Knowledge Base',
    share: {
      description: 'Share the knowledge base with tenants so members can access and use it',
      tip1: 'After sharing, tenant members will access this knowledge base based on the assigned permissions'
    },
    postCreateHint: {
      followUpDesc: 'Configure data sources on the left, or use Share Management to publish to tenants'
    }
  },
  embedPublish: {
    originsHint: 'Enter the host websites allowed to embed this channel (A), not the Agentic address (B). One full origin per line, e.g. https://shop.example.com; at least one required. Supports *.example.com.',
    webhookUrlPlaceholder: 'https://your-server.example.com/embed-events',
    webhookUrlDesc: 'Optional. @:{\'brand.name\'} POSTs message_sent / message_received events to this HTTPS endpoint.'
  },
  knowledgeList: {
    create: 'Create Knowledge Base',
    sharedToOrgs: 'Shared to {count} tenant(s)',
    detail: {
      sourceTypeKbShare: 'KB shared directly to this tenant',
      sourceOrg: 'Space'
    },
    sections: {
      tenantOthers: 'Tenant · Other members',
      tenantReadonly: 'Tenant · View only'
    },
    empty: {
      description: 'Click "Create Knowledge Base" in the top-right corner to add your first one.'
    },
    uploadProgress: {
      uploadingTitle: 'Uploading folder documents to "{name}"',
      detail: '{completed}/{total} files finished',
      keepPageOpen: 'Please keep this page open while files upload.',
      completedTitle: 'Upload finished for "{name}"',
      completedDetail: 'All {total} files uploaded. Refreshing list to show parsing status...',
      refreshing: 'Refreshing list to show parsing status...',
      errorTip: 'Some files failed to upload. Please check the notifications.',
      unknownKb: 'Knowledge Base {id}'
    }
  },
  ext: {
    subtitle: 'Manage runtime skills, tools, and MCP servers',
    noDescription: 'No description',
    close: 'Close',
    cancel: 'Cancel',
    mcp: {
      searchPlaceholder: 'Search MCP...',
      add: 'Add MCP',
      create: 'Create MCP',
      empty: 'No MCP yet. Click the button above to create one.',
      emptySearch: 'No matching MCP',
      remove: 'Remove MCP',
      delete: 'Delete MCP',
      needsMigration: 'Needs migration to a remote MCP',
      unknownTransport: 'Unknown transport',
      builtin: 'Built-in',
      description: 'Description',
      transport: 'Transport',
      tags: 'Tags',
      creator: 'Created by',
      addedOk: 'MCP added',
      removedOk: 'MCP removed',
      actionFailed: 'Action failed',
      deleteTitle: 'Delete MCP?',
      deleteContent: 'Delete MCP "{name}"? This cannot be undone.',
      deleted: 'MCP deleted',
      deleteFailed: 'Failed to delete',
      loadFailed: 'Failed to load MCP list',
      detail: {
        back: 'Back',
        migrateFirst: 'Migrate to a remote MCP first',
        test: 'Test',
        builtinConfigHint: 'Built-in MCP connection settings are managed in code',
        edit: 'Edit',
        delete: 'Delete',
        add: 'Add',
        remove: 'Remove',
        migrateAlert: 'This stdio MCP is disabled. Edit it to SSE or Streamable HTTP, or delete it.',
        tabInfo: 'Info',
        editHeading: 'Edit MCP',
        editHint: 'Saving applies the new MCP configuration immediately.',
        basicTitle: 'Basics',
        basicHint: 'Name, description, and how this MCP is shown.',
        connTitle: 'Connection',
        connHint: 'Parameters required by the selected transport.',
        advancedTitle: 'Advanced',
        advancedHint: 'Headers affect the MCP connection.',
        headersHelp: 'Enter a valid JSON object. Leave empty to send no extra headers.',
        cancel: 'Cancel',
        save: 'Save',
        seconds: '{count} sec',
        command: 'Command',
        args: 'Arguments',
        env: 'Environment',
        createdAt: 'Created',
        updatedAt: 'Updated',
        creator: 'Created by',
        tabTools: 'Tools ({count})',
        searchTools: 'Search tools...',
        refresh: 'Refresh',
        noTools: 'No tools yet',
        copyToolName: 'Copy tool name',
        params: 'Parameters',
        required: 'Required',
        notFound: 'MCP server not found',
        addFirst: 'Add the MCP first, then open its details',
        fetchFailed: 'Failed to load MCP details',
        fetchToolsFailed: 'Failed to load tools',
        copied: 'Copied to clipboard',
        copyFailed: 'Failed to copy',
        connectFailed: 'Connection failed',
        testFailed: 'Test failed',
        testOk: 'Connected. Found {count} tool(s).',
        toolEnabled: 'Tool {name} enabled',
        toolDisabled: 'Tool {name} disabled',
        added: 'MCP added',
        removed: 'MCP removed'
      },
      form: {
        slug: 'MCP ID',
        name: 'MCP name',
        namePlaceholder: 'Display name',
        description: 'Description',
        descPlaceholder: 'MCP description',
        transport: 'Transport',
        icon: 'Icon',
        iconPlaceholder: 'Emoji, e.g. 🧠',
        url: 'MCP URL',
        headers: 'HTTP headers',
        headersPlaceholder: 'JSON, e.g. {\'{\'}"Authorization": "Bearer xxx"{\'}\'}',
        httpTimeout: 'HTTP timeout (sec)',
        sseTimeout: 'SSE read timeout (sec)',
        tags: 'Tags',
        tagsPlaceholder: 'Type a tag and press Enter',
        badHeaders: 'Headers must be valid JSON',
        nameRequired: 'MCP name is required',
        transportRequired: 'Select a transport',
        urlRequired: 'HTTP transports require an MCP URL',
        updated: 'MCP updated',
        updateFailed: 'Failed to update',
        actionFailed: 'Action failed'
      }
    },
    tools: {
      searchPlaceholder: 'Search tools...',
      allCategories: 'All categories',
      allSources: 'All scopes',
      empty: 'No tools yet',
      emptySearch: 'No matching tools',
      noDescription: 'No description',
      detail: 'Tool details',
      configGuide: 'Setup guide',
      category: 'Category',
      tags: 'Tags',
      none: 'None',
      args: 'Arguments',
      argName: 'Name',
      argType: 'Type',
      argDesc: 'Description',
      loadFailed: 'Failed to load tools',
      catBuiltin: 'Built-in',
      catKnowledge: 'Knowledge base',
      catWiki: 'Wiki',
      catDatabase: 'Database',
      sourceChat: 'Chat',
      sourceWork: 'Work'
    },
    skills: {
      searchPlaceholder: 'Search skills...',
      emptyTitle: 'No skills yet',
      emptySearchTitle: 'No matching skills',
      emptyDesc: 'Install from a remote repo or upload a local skill file.',
      emptySearchDesc: 'Try another keyword or clear the search.',
      groupBuiltin: 'Built-in',
      groupShared: 'Tenant shared',
      builtinWorkNoSandbox: 'Built-in work skills are not installed into a sandbox',
      sourceCommon: 'Common',
      scopeAll: 'All scopes',
      fileTab: 'File management',
      depsTab: 'Dependency setup',
      uninstalled: 'Skill uninstalled',
      uninstallFailed: 'Failed to uninstall skill',
      loadFailed: 'Failed to load',
      remoteNone: 'No installable skills found',
      detail: {
        back: 'Back',
        export: 'Export',
        delete: 'Delete',
        readonlyHint: 'You can view and use this skill, but you do not have manage permission.',
        tabCode: 'Files',
        projectStructure: 'Project structure',
        newFile: 'New file',
        newDir: 'New folder',
        refresh: 'Refresh',
        pickFile: 'Select a file to start editing',
        saveSettings: 'Save settings',
        enabledTitle: 'Enabled',
        enabledDesc: 'When disabled, this skill is hidden from selectable resources and is not loaded at runtime.',
        enabled: 'Enabled',
        disabled: 'Disabled',
        tabDeps: 'Dependencies',
        depsTitle: 'Dependencies',
        depsDesc: 'Configure the tools, MCP servers, and other skills this skill needs.',
        updateDeps: 'Update dependencies',
        selectedCount: '{count} selected',
        pickDeps: 'Select',
        searchDeps: 'Search {name}',
        noMatchDeps: 'No matching dependencies',
        noDeps: 'No dependencies available',
        systemMaintained: 'System managed',
        readonly: 'Read-only',
        removeAria: 'Remove {name}',
        notFound: 'Skill not found',
        pathRelative: 'Path (relative to root)',
        content: 'Content',
        statusDisabled: '{source} · Disabled',
        depToolsTitle: 'Tool dependencies',
        depToolsShort: 'tools',
        depToolsDesc: 'Declare tools this skill needs at runtime.',
        depToolsHint: 'Selected tools are loaded with the agent at runtime.',
        depToolsEmpty: 'No tool dependencies',
        depMcpTitle: 'MCP dependencies',
        depMcpDesc: 'Declare MCP servers this skill depends on.',
        depMcpHint: 'Select MCP servers needed when this skill runs.',
        depMcpEmpty: 'No MCP dependencies',
        depSkillTitle: 'Skill dependencies',
        depSkillDesc: 'Declare other skills that should load together.',
        depSkillHint: 'Dependent skills become readable in the same runtime.',
        depSkillEmpty: 'No skill dependencies',
        loadFailed: 'Failed to load',
        treeFailed: 'Failed to load the file tree',
        readFailed: 'Failed to read the file',
        saved: 'Saved',
        saveFailed: 'Failed to save',
        confirmDeleteTitle: 'Delete skill “{name}”?',
        confirmDeleteContent: 'This cannot be undone. All files and settings will be removed.',
        confirmDeleteOk: 'Delete',
        deleted: 'Deleted',
        deleteFailed: 'Failed to delete',
        exportFailed: 'Failed to export',
        created: 'Created',
        createFailed: 'Failed to create',
        settingsSaved: 'Settings saved',
        settingsSaveFailed: 'Failed to save settings',
        depsUpdated: 'Dependencies updated',
        depsUpdateFailed: 'Failed to update'
      }
    },
    tabs: {
      skills: 'Skills',
      tools: 'Tools',
      mcp: 'MCP'
    }
  },
  createChat: {
    title: 'Hi! What would you like to talk about today?'
  },
  input: {
    agentMode: 'Reasoning Q&A',
    normalMode: 'Instant Q&A',
    messages: {
      agentSwitchedOn: 'Switched to Reasoning Q&A',
      agentSwitchedOff: 'Switched to Instant Q&A'
    },
    webSearch: {
      label: 'Web search'
    },
    placeholderAgent: 'Ask {name}',
    placeholderKbAndWeb: 'Enter your question, will answer based on knowledge base and web search',
    placeholderWebOnly: 'Enter your question, will answer with web search',
    placeholderWithContext: 'Enter your question, will answer based on selected knowledge bases/files above',
    fileUpload: {
      label: 'Upload file',
      tooLarge: 'File is too large',
      tooMany: 'Too many files',
      tooltip: 'Click or drag files to upload'
    },
    imageUpload: {
      label: 'Upload image',
      tooltip: 'Click or drag images to upload'
    }
  },
  manualEditor: {
    section: {
      basic: 'Basic Info'
    },
    view: {
      editLabel: 'Back to edit',
      previewLabel: 'Preview content'
    },
    description: 'Write knowledge in Markdown with live preview'
  },
  file: {
    downloadFailed: 'Download failed'
  },
  mentionDetail: {
    belongsToOrg: 'Space: '
  },
  authStore: {
    errors: {
      parseTenantFailed: 'Failed to parse tenant information'
    }
  },
  auth: {
    loginAccount: 'Login account',
    loginAccountPlaceholder: 'Enter login account or email',
    loginAccountRequired: 'Enter a login account',
    firstTime: 'New to @:{\'brand.name\'}?',
    registerSubtitle: 'Create your account and start using @:{\'brand.name\'}',
    loginError: 'Login error, please check the login account or password',
    workspaceOnboarding: {
      title: 'Choose your tenant',
      description: 'Create a tenant to get started, or accept an invitation to join one that already exists.',
      create: 'Create tenant',
      loadingPolicy: 'Checking the available tenant options…',
      policyLoadFailed: 'Tenant permissions could not be loaded. Check your connection and try again.',
      inviteOnlyTitle: 'Waiting for a tenant invitation',
      inviteOnlyDescription: 'Personal tenant creation is disabled. View and accept an invitation from a tenant administrator.',
      inviteOnlyNotice: 'This account can only join an existing tenant by invitation',
      help: 'You can create a tenant now or return later to accept an invitation.',
      inviteOnlyHelp: 'No invitation yet? Send your registered email address to a tenant administrator and ask them to invite you.'
    }
  },
  inviteRegister: {
    success: 'Registration successful — entering tenant…'
  },
  memorySettings: {
    workspaceDisabled: 'Long-term memory is off for this tenant. This switch takes effect once an admin turns it on.'
  },
  envVarSettings: {
    description: 'Personal keys for skills and sandboxes, not platform system or deployment settings.',
    introPersonalBody: 'Injected into your own chats and runs. Other members cannot see them, and theirs will not replace yours.',
    noConfigDescription: 'This tenant has no sandbox backend yet, so there is nothing to set keys for.',
    skillHint: 'Each skill declares what it needs. Save them here ahead of time, or supply them in the conversation. Tenant admins can also fill in shared values on the skill card.',
    statusWorkspace: 'Using the tenant value',
    clearConfirm: 'Remove your own value for {name}? The tenant value, if there is one, applies again afterwards.'
  },
  memoryWorkspaceSettings: {
    enableLabel: 'Enable long-term memory in this tenant',
    enableDescription: 'When off, no conversation in this tenant reads or writes memory.',
    instructionsDescription: 'Tenant rules appended to the distillation prompt, for policies the product cannot guess — for example "never record customer names".'
  },
  settings: {
    sandbox: {
      pageHint: 'A sandbox is the isolated environment where agent skill scripts run. A tenant can have several configs (Docker, E2B, CubeSandbox); each agent picks one. Skills are installed on the Skill Management page into the selected config\'s image. Scripts stay disabled until a config is selected.',
      editorDescription: 'Configure a tenant runtime. Docker, CubeSandbox, and E2B use the same management flow.',
      scriptPolicyDesc: 'When off, agents in this tenant can only read skill content. Remote sandboxes already running are released once their sessions end.',
      dockerHostRisk: 'Empty or unix:// uses the Docker daemon on the Platform host, which is equivalent to root on that machine. Use this only for a private single-node install. Prefer Cube or E2B when multiple tenants share a host. Remote tcp:// endpoints require a TLS certificate directory.',
      noConfigs: 'No sandbox yet. Agents without a tenant configuration will not run skill scripts.',
      disableScriptsConfirm: 'All agents in this tenant — will no longer run skill scripts in a sandbox. They can still read skill content. Existing remote sandboxes are not destroyed automatically; end or delete the related sessions to release them. Continue?',
      scriptsDisabled: 'Sandbox execution disabled for this tenant',
      scriptsEnabled: 'Sandbox execution restored for this tenant',
      namedBackendHint: 'Tenant configuration is the only runtime source. Agents without one cannot execute skill scripts.',
      weknoraTemplateTitle: 'Platform standard template',
      weknoraDockerImage: 'Platform standard image',
      weknoraTemplateOverview: 'The platform provides the standard runtime. Templates are discovered after connecting and the standard one is created when missing.',
      weknoraTemplateDescription: 'Includes the Python, Node.js, CLI tools, workspace path, and non-root execution user expected by platform skills.',
      templateLoadHint: 'Enter the cluster connection and refresh. If there is no platform standard template, click Create; after changing DNS or the image, click Delete and rebuild.',
      standardTemplateProvisioning: 'The platform standard template is being created. Refresh shortly to see its status.',
      templateStepHint: 'This step only lists templates already on the cluster; it does not create one automatically. Click Create platform standard template if none exists, or Delete and rebuild after changing DNS or the image. You can continue after a template is ready.',
      templateUntaggedHint: 'The builds finished but none carries the default tag, so sandbox creation cannot resolve this template. Delete it in E2B and refresh; Platform will rebuild it.',
      weknoraStandardTemplate: 'Platform standard template',
      replaceStandardTemplateConfirm: 'Rebuild the platform standard template with the current settings, including DNS. The previous spawnable template is not deleted until the replacement is ready.',
      cubeDnsServersHelp: 'Optional. Nameserver IPs written into the platform standard template. Leave empty to use the cluster default (commonly 119.29.29.29). If UDP/53 to public resolvers is blocked, use reachable addresses from the Cube host\'s /etc/resolv.conf, excluding 10/8, 172.16/12, and 192.168/16. Existing standard templates take effect only after Rebuild on the template card.',
      dockerTlsCertPathHelp: 'Directory on the Platform host holding ca.pem, cert.pem and key.pem. Required for a remote daemon; certificates are mounted by the deployment, never stored here.',
      dockerIdleTtlHelp: 'The Docker daemon has no idle timeout of its own. A container that runs no command for this long is reclaimed by Platform and rebuilt when the session continues. Empty means 1800 seconds.',
      skillEnv: {
        workspaceTitle: 'Tenant-wide values',
        saveSuccess: 'Tenant values saved',
        saveFailed: 'Could not save the tenant values.',
        clearConfirm: 'Clear the tenant value for {name}? The declaration stays. Members without their own value will then be missing it.',
        clearSuccess: 'Tenant value cleared.'
      },
      backendDescriptions: {
        docker: 'Keep a long-lived container per session on this Platform host; scripts and files stay in that container'
      }
    },
    skills: {
      description: 'Skills live in the tenant catalog. Register them first, then install onto one or more sandboxes. An agent can only enable skills that are ready on its sandbox.',
      host: {
        description: 'Skills live in the tenant catalog. An agent can enable one after it is installed on this computer.'
      },
      scope: 'Scope',
      addStepRegisterDesc: 'Paste a source or upload a zip to add the skill to the tenant catalog.'
    },
    tenantInfo: 'Tenant Info',
    parser: {
      checking: 'Checking…'
    },
    weknoraCloud: {
      title: 'Cloud Parsing Service',
      credentialConfigured: 'Cloud service credentials configured.',
      credentialUnconfigured: 'Cloud service credentials not configured. Please set up APPID and APPSECRET first.',
      modelHintConfigured: 'Cloud service credentials configured. See supported models in',
      modelsSection: {
        descReady: 'Register the four standard WeKnora Cloud models for chat, retrieval, reranking, and vision.'
      },
      saveSuccess: 'Credentials saved'
    },
    roleDenied: {
      desc: 'Your role can\'t access this settings page. Ask an admin of this tenant to grant the required role.'
    },
    navGroups: {
      workspace: 'Tenant'
    },
    workspaceSettings: 'Tenant Settings',
    storage: {
      saveSuccess: 'Saved'
    }
  },
  agent: {
    workSubtitle: 'Manage work agents. They produce intermediate files and artifacts.',
    builtinWikiQa: 'Wiki Q&A',
    builtinTableAnalysis: 'Table Analysis',
    editor: {
      rerankModelOptionalHint: 'No RAG knowledge base in current scope, so this is optional. If a RAG knowledge base is added later, the tenant default rerank model will be used as a fallback. Configuring it explicitly is still recommended.',
      hostSkillsSelectionDesc: 'Tenant skills are listed here. Ones installed on this computer can be used now; install the others first.',
      skillsSelectionDesc: 'All tenant skills are listed here. Installed ones can be used now; others need Install first.',
      noSkillsAvailable: 'The tenant catalog has no skills yet.',
      sandboxNoConfigs: 'This tenant has no sandbox yet, so skill scripts will not run.',
      maxCompletionTokensCustom: 'Custom'
    },
    shareScope: {
      desc: 'Space members have read-only access to this agent and will use it according to your current configuration; your changes to the agent will sync to shared spaces. To allow space members to edit knowledge base content, share the knowledge base to the space.',
      skillSecretsWarning: 'This agent uses skills. When tenant members use it, the skills run in this tenant\'s sandbox with the environment variables admins configured for them (such as API keys), and members can have the agent reveal those values. Share it only if that is acceptable.'
    },
    empty: {
      sharedDescription: 'You can join a tenant or ask others to share agents with you'
    },
    sections: {
      tenantOthers: 'Tenant · Other members',
      tenantReadonly: 'Tenant · View only'
    },
    tabs: {
      platform: 'Chat',
      work: 'Work'
    },
    mode: {
      normal: 'Instant Q&A',
      agent: 'Reasoning Q&A'
    },
    type: {
      normal: 'Instant Q&A',
      agent: 'Reasoning Q&A'
    },
    workManage: {
      viewSwitch: 'Agent management view switch',
      sectionAgents: 'Agents',
      sectionSubagents: 'Subagents',
      deleteBuiltinWarning: 'Built-in agents cannot be deleted',
      modelNotConfigured: 'Model is not configured',
      deleteConfirmTitle: 'Delete {name}',
      deleteConfirmContent: 'This cannot be undone. Existing conversations stay bound to the original agent.',
      deleted: 'Agent deleted',
      deleteFailed: 'Failed to delete agent',
      loadFailed: 'Failed to load agents',
      loadBackendsFailed: 'Failed to load agent backends',
      modelSelector: {
        clear: 'Clear selection',
        loading: 'Loading...',
        placeholder: 'Select a model'
      },
      toolCategories: {
        knowledge: 'Knowledge',
        mysql: 'MySQL',
        debug: 'Debug'
      },
      builtinTools: {
        download_kb_file: {
          name: 'Download file',
          desc: 'Download an original knowledge-base file into the workspace.'
        },
        search_file: {
          name: 'Search files',
          desc: 'Search files across accessible knowledge bases.'
        },
        find_kb_document: {
          name: 'Find in document',
          desc: 'Locate keywords or regex patterns inside a knowledge-base file.'
        },
        open_kb_document: {
          name: 'Open document',
          desc: 'Open a knowledge-base document by line window.'
        },
        query_kb: {
          name: 'Search knowledge base',
          desc: 'Search a knowledge base for relevant content.'
        },
        get_mindmap: {
          name: 'Get mind map',
          desc: 'Get the mind-map structure of a knowledge base.'
        },
        list_kbs: {
          name: 'List knowledge bases',
          desc: 'List knowledge bases the current user can access.'
        },
        calculator: {
          name: 'Calculator',
          desc: 'Perform basic numeric calculations.'
        },
        ask_user_question: {
          name: 'Ask user',
          desc: 'Ask the user a question when a key decision or clarification is needed.'
        },
        ocr_parse_file: {
          name: 'OCR parse file',
          desc: 'Parse PDF, Office, or image files into Markdown text.'
        },
        present_artifacts: {
          name: 'Present artifacts',
          desc: 'Show result files from the workspace outputs folder so the user can download or preview them.'
        },
        web_search: {
          name: 'Web search',
          desc: 'Search the internet for live web pages, news, and site content.'
        },
        install_skill: {
          name: 'Install skill',
          desc: 'Install a Skill into the current user’s private space and activate it in this session.'
        }
      },
      form: {
        emptyConfig: 'This agent has no configuration items',
        knowledgeSkillWarning: 'Knowledge bases are enabled, but the knowledge-base Skill is not selected. The agent may be unable to search knowledge or open documents.',
        defaultPlaceholder: 'Default: {value}'
      },
      fields: {
        model_retry_times: {
          name: 'Model retry count',
          desc: 'Maximum retries when a model call fails. Default is {default}.'
        },
        max_execution_steps: {
          name: 'Max execution steps',
          desc: 'Maximum LangGraph steps allowed in a single agent run (recursion_limit). Default is {default}.'
        },
        summary_l2_trigger_ratio: {
          name: 'L2 summary trigger ratio',
          desc: 'After L1 compaction, L2 summary runs when remaining context exceeds the summary threshold × this ratio. Range 0.1–1.0; lower values trigger L2 sooner. Default is {default}.'
        },
        summary_tool_result_token_limit: {
          name: 'Summary tool-result token limit',
          desc: 'During L1 cleanup, tool results over this token count are written to outputs and only a preview of that length is kept in context. Default is {default}.'
        },
        summary_prompt: {
          name: 'Context summary prompt',
          desc: 'Prompt used when summarizing context. It must accept {messages} as the placeholder for messages to summarize.'
        },
        summary_keep_messages: {
          name: 'Messages kept after summary',
          desc: 'After summarization, keep this many recent messages in addition to the summary. Default is {default}.'
        },
        summary_threshold: {
          name: 'Context summary threshold (K)',
          desc: 'When context size exceeds this value, summarization is enabled to save context. Unit is K tokens. Default is {default}K.'
        },
        skills: {
          name: 'Skills',
          desc: 'Optional Skills. All Skills available to the current user are selected by default. Tools and MCP services required by a Skill are mounted automatically.'
        },
        mcps: {
          name: 'MCP services',
          desc: 'All MCP services available to the current user are selected by default.'
        },
        knowledges: {
          name: 'Knowledge bases',
          desc: 'Knowledge bases come from the platform. Create them on the Knowledge page. All accessible knowledge bases are selected by default.'
        },
        tools: {
          name: 'Tools',
          desc: 'Built-in tools. All tools available to the current user are selected by default.'
        },
        tool_approval_mode: {
          name: 'Tool approval mode',
          desc: 'Default approval asks before writing files, editing files, or running commands. Always trust runs these tools automatically.',
          options: {
            default: 'Default approval',
            always_trust: 'Always trust'
          }
        },
        model: {
          name: 'Model',
          desc: 'The model that drives this agent. A model is required.'
        },
        system_prompt: {
          name: 'System prompt',
          desc: 'Describe the agent’s role and behavior'
        }
      },
      editor: {
        advanced: 'Advanced',
        advancedDesc: 'Remaining settings not covered by model, prompt, knowledge, tools, MCP, skills, or subagents',
        navAdvanced: 'Advanced',
        basicInfoDesc: 'Configure the agent name, description, and backend',
        defaultName: 'New agent',
        slug: 'ID',
        slugPlaceholder: 'Optional ID, generated if empty',
        slugDesc: 'Used as the agent ID after creation. Leave empty to generate one.',
        backend: 'Agent type',
        backendDesc: 'Choose the agent type. This cannot be changed after creation.',
        backendAssistant: 'Assistant',
        backendSubagent: 'Subagent',
        backendDescAssistant: 'A conversational work agent that can use tools, knowledge bases, and subagents.',
        backendDescSubagent: 'A subagent invoked by a parent agent for a focused task.',
        subagents: 'Subagents',
        subagentsDesc: 'Choose subagents this agent can invoke',
        subagentsSelection: 'Subagent scope',
        subagentsSelectionDesc: 'Choose which subagents this agent can invoke',
        subagentsSelect: 'Select subagents',
        subagentsSelectDesc: 'Choose the subagents to enable',
        noSubagentsAvailable: 'No subagents available',
        builtinTools: 'Built-in tools',
        notEditable: 'This agent cannot be edited',
        readonlyHint: 'You can view this agent, but you do not have manage permission.',
        nameRequired: 'Please enter an agent name',
        modelRequired: 'Select an agent model',
        iconUploadType: 'Only image files are allowed',
        iconUploadSize: 'Image size cannot exceed {size}MB',
        iconUploaded: 'Icon uploaded',
        iconUploadFailed: 'Failed to upload icon',
        saved: 'Agent saved',
        created: 'Agent created',
        saveFailed: 'Failed to save agent'
      },
      share: {
        ownerOnly: 'Owner only',
        none: 'None',
        global: 'Global',
        department: 'Department ({count})',
        user: 'Users ({count})',
        readManage: 'Read {read} · Manage {manage}',
        readonly: 'Read-only {scope}'
      }
    }
  },
  knowledgeStages: {
    copyFailed: 'Copy failed; please select the text manually',
    errorCode: {
      DOCREADER_UNAVAILABLE_SUGGESTION: 'No parser is available for this file type, or the service cannot be reached. Check the parser configuration and retry.',
      DOCREADER_TIMEOUT_SUGGESTION: 'The file is large or the parser is busy. Split the file and retry, or check parser load.',
      DOCREADER_PARSE_FAILED_SUGGESTION: 'The file may be corrupt, use an unsupported encoding, or the parser failed. Check the file and upload it again.',
      CHUNKING_FAILED: 'Chunking failed',
      CHUNKING_FAILED_SUGGESTION: 'The text could not be split. Adjust the chunk size and parse again.',
      EMBEDDING_RATE_LIMIT: 'Embedding requests are being rate limited',
      EMBEDDING_RATE_LIMIT_SUGGESTION: 'The embedding model returned a rate limit. Retry later, or raise the model quota.',
      EMBEDDING_PROVIDER_FAIL: 'Embedding failed',
      EMBEDDING_PROVIDER_FAIL_SUGGESTION: 'The embedding model call failed. Check the model configuration, key, and model name, then retry.',
      VECTORSTORE_WRITE_FAILED: 'Vector store write failed',
      VECTORSTORE_WRITE_FAILED_SUGGESTION: 'Embeddings were created, but writing them to the vector store failed. Check the store connection and capacity, then retry.',
      MULTIMODAL_VLM_FAILED: 'Image understanding failed',
      MULTIMODAL_VLM_FAILED_SUGGESTION: 'Recognition or captioning failed for an image. Check the multimodal model and retry.',
      MULTIMODAL_ALL_FAILED: 'All image tasks failed',
      MULTIMODAL_ALL_FAILED_SUGGESTION: 'Every image task failed. The document text can still be searched. Check the multimodal model and retry.',
      TASK_TIMEOUT: 'Processing task timed out',
      TASK_TIMEOUT_SUGGESTION: 'The task used up its retries. Parse the document again later, or split a large file.',
      UNKNOWN: 'Processing failed',
      SERVER_RESTART: 'Processing was interrupted by a restart',
      SERVER_RESTART_SUGGESTION: 'The task stopped when the application restarted. Parse the document again.',
      UPSTREAM_FAILED: 'A previous stage failed, so this one was cancelled',
      UPSTREAM_FAILED_SUGGESTION: 'An earlier stage did not finish, so this stage was cancelled. Fix the failed stage and retry.',
      QUESTION_FAILED: 'Question generation failed',
      QUESTION_FAILED_SUGGESTION: 'Questions could not be generated for the chunks. Check the chat model and retry.',
      GRAPH_EXTRACT_FAILED: 'Knowledge graph extraction failed',
      GRAPH_EXTRACT_FAILED_SUGGESTION: 'Graph extraction did not finish. Check the model configuration and retry.',
      SUMMARY_FAILED: 'Summary generation failed',
      SUMMARY_FAILED_SUGGESTION: 'The document summary was not created. Check the chat model and retry.',
      DOCREADER_UNAVAILABLE: 'Document parser unavailable',
      DOCREADER_TIMEOUT: 'Document parsing timed out',
      DOCREADER_PARSE_FAILED: 'Document parsing failed'
    },
    head: {
      completedWithActiveTrace: 'Processing completed, but {n} trace task(s) remain active',
      postprocessTasks: 'Postprocess: {running} running / {failed} failed / {completed} completed'
    },
    processConfig: {
      chunking: 'Chunking',
      chunkSize: 'Size {n}',
      parentChildOn: 'Parent-child chunking on',
      parentChildOff: 'Parent-child chunking off',
      parser: 'Parser engine',
      multimodal: 'Multimodal',
      asr: 'Speech recognition',
      question: 'Question generation',
      questionOn: 'On, {n}',
      on: 'On',
      off: 'Off'
    },
    total: 'Total {d}'
  },
  knowledgeBase: {
    mindmap: 'Mind map',
    mindmapGenerate: 'Generate mind map',
    mindmapRegenerate: 'Regenerate',
    mindmapFitView: 'Fit view',
    mindmapLoading: 'Loading...',
    mindmapGenerating: 'AI is generating the mind map...',
    mindmapEmpty: 'No mind map yet. Generate one from the file list.',
    mindmapDescription: 'Generate a file-tree outline from this knowledge base',
    mindmapGenerated: 'Mind map generated',
    mindmapLoadFailed: 'Failed to load mind map',
    mindmapGenerateFailed: 'Failed to generate mind map',
    mindmapNotFound: 'Mind map API was not found. Restart the backend service and apply database migrations.',
    tagNameTooLong: 'Tag name can be at most {max} characters',
    moreFiltersShow: 'Show more filters',
    moreFiltersHide: 'Hide filters',
    accessInfo: {
      fromOrg: 'From tenant'
    },
    allUploadFailed: 'All files failed to upload ({count} files)',
    allUploadSuccess: 'All files uploaded successfully ({count} files)',
    batchTagAvailableSection: 'Available',
    batchTagNoSelected: 'None selected',
    batchTagSelectedSection: 'Selected',
    fileExists: 'File already exists',
    partialUploadSuccess: 'Partial upload success (success: {success}, failed: {fail})',
    tagClearAction: 'Clear selection',
    tagEditAvailableSection: 'Available',
    tagEditNoSelected: 'None selected',
    tagEditSearch: 'Search tags...',
    tagEditSelectedSection: 'Selected',
    tagNewPlaceholder: 'New tag name, press Enter to add',
    uploadAllFailed: 'All files failed to upload',
    uploadAllSuccess: 'Successfully uploaded {count} files!',
    uploadFailed: 'File upload failed!',
    uploadPartialSuccess: 'Upload completed: {success} succeeded, {fail} failed',
    uploadSuccess: 'File uploaded successfully!',
    uploadingFolder: 'Uploading {total} files from folder...',
    selectKnowledgeBase: 'Select a knowledge base'
  },
  resourceOrigin: {
    tenant: 'Tenant',
    tenantTooltip: 'Created by another member of this tenant',
    spaceTooltipWithTenant: 'Shared via tenant "{tenant}" · from {tenant}',
    sharedTooltip: 'Accessed from an external tenant via a shared space'
  },
  listSpaceSidebar: {
    workspace: 'This tenant'
  },
  contextualGuide: {
    agentCreate: {
      steps: {
        navTools: {
          desc: 'In smart-reasoning mode, enable built-in tools and MCP services for search, code, and more.'
        },
        name: {
          desc: 'Pick a recognizable name. Smart-reasoning mode may pre-fill a default you can edit.'
        },
        mode: {
          desc: '"Quick answer" for straightforward Q&A; "Smart reasoning" uses tools and multi-step thinking for complex tasks.'
        }
      }
    },
    kbCreate: {
      steps: {
        storage: {
          desc: 'Where raw files are stored (local or object storage). The tenant default is usually fine.'
        }
      }
    },
    tenantModels: {
      steps: {
        done: {
          desc: 'After saving models, close settings and click "Create knowledge base". The wizard will walk you through type, indexing, and model binding.'
        }
      }
    },
    kbList: {
      steps: {
        create: {
          desc: 'Knowledge bases hold documents and FAQs. Click the highlighted "Create knowledge base" button below and we will walk you through the form.'
        }
      }
    }
  },
  newUserGuide: {
    steps: {
      knowledge: {
        desc: 'Everything starts here: upload documents, web pages or FAQs and @:{\'brand.name\'} parses and indexes them automatically. Click here to open knowledge bases.'
      },
      welcome: {
        title: 'Welcome to @:{\'brand.name\'}'
      }
    }
  },
  chatEngine: {
    switchLabel: 'Choose type',
    platform: 'Chat',
    chatWork: 'Work',
    lockedHint: 'This conversation already has messages, so its type cannot be changed.'
  },
  harness: {
    history: {
      recent: 'Recent',
      empty: 'No conversations yet',
      loadMore: 'Load more'
    },
    chat: {
      viewState: 'View status',
      viewFiles: 'View files',
      state: 'Status',
      refreshState: 'Refresh status',
      loadingMessages: 'Loading messages...',
      generating: 'Generating a reply...',
      compressing: 'Compressing context...',
      queuedCount: 'Queued ({count})...',
      queuedRequests: 'Queued requests',
      queuedRequest: 'Queued request',
      deleteQueued: 'Delete queued request: {content}',
      continueQueue: 'Continue queue',
      queuePausedCancelled: 'The current task was stopped. Later requests are paused.',
      queuePausedFailed: 'The previous task failed. Later requests are paused.',
      queueWaiting: 'The current task is waiting for an answer or approval. Later requests will continue after that.',
      steerNext: 'Steer · next',
      steer: 'Steer',
      steerHint: 'Run this message first after the current step finishes',
      selectModel: 'Select model',
      todos: 'Todos',
      files: 'Files',
      artifacts: 'Artifacts',
      artifactCount: '{count} artifacts',
      openFile: 'Open {name}',
      emptyState: 'No status yet',
      contextUsage: 'Context usage',
      tokenComposition: 'Token breakdown',
      systemPrompt: 'System prompt',
      toolDefs: 'Tool definitions ({count})',
      contentMessages: 'Content messages',
      toolMessages: 'Tool messages',
      summary: 'Summary',
      compressed: 'Compressed',
      other: 'Other',
      windowRemaining: 'Window / remaining',
      unknownFile: 'Unknown file',
      deliveryFile: 'Artifact',
      deliveryFileExt: 'Artifact · {ext}',
      subagent: 'Subagent',
      agent: 'Agent',
      assistant: 'Assistant',
      file: 'File',
      attachment: 'Attachment',
      approvalSaveFailed: 'Failed to save approval mode',
      createFailed: 'Failed to create conversation. Please try again.',
      queuedDeleted: 'Queued request deleted',
      steered: 'Set as the next steered request',
      queueContinued: 'Queue resumed',
      cancelSent: 'Cancel request sent',
      invalidQuestion: 'Invalid question',
      threadNotFound: 'Conversation thread not found',
      runNotFound: 'Run to resume was not found',
      approvalRestoreFailed: 'Failed to restore approval state. Please refresh and try again.',
      mentionEmpty: 'Nothing to mention',
      dropToUpload: 'Drop to upload',
      addAttachment: 'Add attachment',
      uploadedImage: 'Uploaded image',
      thinking: 'Thinking...',
      reasoning: 'Reasoning',
      calledTool: 'Called: {name}',
      calledTools: 'Called {count} tools',
      toolCompleted: 'Completed',
      toolFailedCount: '{count} failed',
      toolRunningCount: '{count} running',
      toolSucceeded: 'Tool {name} completed',
      toolFailed: 'Tool {name} failed',
      toolCalling: 'Calling tool: {name}',
      toolParams: 'Parameters',
      toolFailedStatus: 'Failed',
      toolRunningStatus: 'Running',
      errorInterrupted: 'Generation was interrupted',
      errorGuard: 'Sensitive content detected. Output stopped.',
      errorUnexpected: 'An error occurred while generating',
      errorAgent: 'Failed to load the agent',
      unknownError: 'Unknown error',
      stoppedHint: 'You stopped this reply',
      reedit: 'Edit the question',
      switchBound: 'This conversation is bound to an agent. Start a new chat to switch.',
      switchFailed: 'Failed to switch agent',
      removeAttachment: 'Remove attachment {name}',
      download: 'Download',
      save: 'Save',
      saving: 'Saving',
      cancel: 'Cancel',
      delete: 'Delete',
      retry: 'Retry',
      preview: 'Preview',
      source: 'Source',
      edit: 'Edit',
      unsaved: 'Unsaved',
      fullscreenPreview: 'Fullscreen preview',
      copyCode: 'Copy code',
      copied: 'Copied',
      htmlPreview: 'HTML preview',
      collapsePreview: 'Collapse preview',
      closePreview: 'Close preview',
      close: 'Close',
      previewFailed: 'Failed to preview the file',
      previewUnsupported: 'This file type cannot be previewed. Download it to view.',
      loading: 'Loading',
      saveToWorkspace: 'Save to workspace',
      savedToWorkspace: 'Saved to workspace: {path}',
      downloadFailed: 'Failed to download the file',
      saveToWorkspaceFailed: 'Failed to save to workspace',
      panel: {
        title: 'Files',
        hideFileList: 'Hide file list',
        showFileList: 'Show file list',
        refresh: 'Refresh',
        closePanel: 'Close files panel',
        previewEmptyTitle: 'Select an artifact to preview it here',
        previewEmptyDesc: 'You can also open the file list to browse workspace files.',
        createThreadHint: 'Start a conversation to view the workspace',
        loadingFs: 'Loading file system...',
        loadFsFailed: 'Failed to load the file system',
        emptyWorkspace: 'This workspace is empty',
        downloadFile: 'Download file',
        deleteFile: 'Delete file',
        deleteFolder: 'Delete folder',
        confirmDeleteFile: 'Delete file “{name}”?',
        confirmDeleteFolder: 'Delete folder “{name}”?',
        deleteFolderContent: 'This will delete the folder and all of its contents. This cannot be undone.',
        deleteIrreversible: 'This cannot be undone.',
        deleteFileSuccess: 'File deleted',
        deleteFolderSuccess: 'Folder deleted',
        deleteFileFailed: 'Failed to delete the file',
        deleteFolderFailed: 'Failed to delete the folder'
      }
    },
    tokenGate: {
      title: 'Connect work',
      sidebarHint: 'Sign in to load work conversations.',
      sidebarAction: 'Sign in'
    }
  },
  menu: {
    skillsTools: 'Skills · Tools',
    workspace: 'Workspace',
    dashboard: 'Overview',
    newChat: 'New Chat'
  },
  workspacePage: {
    subtitle: 'Manage files, folders, and previews in personal and knowledge-base workspaces',
    guide: 'Guide',
    newFolder: 'New folder',
    uploadFile: 'Upload',
    collapseSidebar: 'Collapse workspace sidebar',
    expandSidebar: 'Expand workspace sidebar',
    rootLabel: 'Workspace',
    resizePreview: 'Resize preview',
    knowledgeTitle: 'Knowledge base',
    knowledgePlaceholder: 'Select an accessible knowledge base to browse files.',
    createFolderTitle: 'New folder',
    create: 'Create',
    cancel: 'Cancel',
    folderNamePlaceholder: 'Enter a folder name',
    folderNameRequired: 'Enter a folder name',
    agentsGuideTitle: 'Agents folder guide',
    agentsGuideOk: 'Got it',
    agentsGuideP1: 'Instruction files in this folder are injected into the agent workflow when needed, to capture long-term preferences, business context, and collaboration rules.',
    agentsGuideP2: 'AGENTS.md, USER.md, and MEMORY.md are supported. Their contents are injected into the agent prompt for each session, and are best used for behavior rules, user information, and facts the agent should remember.',
    agentsGuideTipsTitle: 'Writing tips',
    agentsGuideTip1: 'Describe the usual work context, such as team duties, common tasks, and how knowledge bases are used.',
    agentsGuideTip2: 'Describe answer preferences, such as tone, level of detail, and whether to lead with the conclusion.',
    agentsGuideTip3: 'List business terms and fixed names so the agent stays consistent.',
    agentsGuideTip4: 'Describe how sources should be used, such as which knowledge bases to prefer and what needs extra confirmation.',
    agentsGuideTip5: 'Set collaboration boundaries, such as asking first when unsure, and proposing a plan before acting on important decisions.',
    agentsGuideTip6: 'Prefer clear, actionable rules. Avoid vague instructions like “do your best”.',
    chatsLabel: 'Chat history',
    loadPreviewFailed: 'Failed to load the file preview',
    loadDirFailed: 'Failed to load the workspace folder',
    loadKnowledgeDirFailed: 'Failed to load the knowledge-base folder',
    knowledgeFallback: 'Knowledge base',
    readonlyCannotSave: 'This file is read-only and cannot be saved',
    saveSuccess: 'File saved',
    saveFailed: 'Failed to save the file',
    createFolderSuccess: 'Folder created',
    createFolderFailed: 'Failed to create the folder',
    uploadLimit: 'You can upload up to {count} files at a time',
    uploadSuccess: '{count} files uploaded',
    uploadFailed: 'Failed to upload files',
    confirmDeleteSelected: 'Delete the {count} selected items?',
    deleteSelectedSuccess: 'Selected items deleted',
    deleteSuccess: 'Deleted',
    deleteFailed: 'Failed to delete',
    personal: 'Personal workspace',
    quickAccess: 'Quick access',
    savedArtifacts: 'Saved artifacts',
    agentFiles: 'Agent files',
    myKnowledge: 'My knowledge bases',
    sharedKnowledge: 'Shared knowledge bases',
    loadingKnowledge: 'Loading knowledge bases...',
    loadingPreview: 'Loading preview...',
    selectToPreview: 'Select a file to preview',
    previewHint: 'Markdown and TXT can be edited. Other formats stay read-only.',
    emptyFolder: 'This folder is empty',
    multiSelect: 'Multi-select',
    deleteSelected: 'Delete selected',
    moreActions: 'More actions',
    name: 'Name',
    size: 'Size',
    modifiedAt: 'Modified',
    actions: 'Actions',
    itemCount: '{count} items',
    filePath: 'File path',
    refresh: 'Refresh'
  },
  dashboard: {
    subtitle: 'View platform usage at a glance, including conversations, agents, tool calls, and knowledge bases',
    loadFailed: 'Failed to load statistics',
    loadPartial: 'Detailed stats failed to load; showing basic numbers only',
    loadNone: 'Unable to load any statistics',
    feedback: {
      title: 'User feedback'
    },
    knowledge: {
      title: 'Knowledge base usage',
      total: 'Knowledge bases',
      files: 'Files',
      storage: 'Storage',
      unit: '',
      fileTypes: 'File type distribution',
      unknownType: 'Unknown',
      noData: 'No data',
      sourcePlatform: 'Platform knowledge bases only'
    },
    tools: {
      title: 'Tool call monitor',
      totalCalls: 'Total calls',
      failedCalls: 'Failed calls',
      successRate: 'Success rate',
      times: '',
      top10: 'Most used tools TOP 10',
      errorAnalysis: 'Tool error analysis',
      errorDistribution: 'Error distribution',
      toolName: 'Tool',
      errorCount: 'Errors'
    },
    agents: {
      title: 'Agent analysis',
      total: 'Agents',
      conversations: 'Conversations',
      toolCalls: 'Tool calls',
      unit: '',
      times: '',
      distribution: 'Conversations / tool calls (TOP 3)',
      topPerformers: 'Top 5 agents',
      rank: 'Rank',
      agent: 'Agent',
      score: 'Score',
      conversationCount: 'Conversations',
      toolCallCount: 'Tool calls'
    },
    users: {
      title: 'User activity trend',
      active24h: 'Active 24h',
      active30d: 'Active 30d',
      last7days: 'Last 7 days',
      series: 'Active users'
    },
    calls: {
      title: 'Call statistics',
      hours: '14 hours',
      days: '14 days',
      weeks: '14 weeks',
      weekLabel: 'Week {week}',
      models: 'Models',
      agents: 'Agents',
      tokens: 'Tokens',
      tools: 'Tools',
      unknownModel: 'Unknown model',
      input: 'Input',
      output: 'Output',
      total: 'Total: {value}'
    },
    stats: {
      conversations: 'Conversations',
      activeConversations: 'Active chats',
      messages: 'Messages',
      users: 'Users',
      chat: 'Chat',
      work: 'Work'
    }
  },
  brand: {
    name: '智能体操作端'
  },
  mcpMetadata: {
    fullSchema: 'Full schema',
    refresh: 'Refresh tools'
  }
}
