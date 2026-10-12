export default {
  modelCatalog: {
    description: 'Каталог моделей определяет, какие модели предлагаются при добавлении модели, и значения по умолчанию, например контекстное окно и поддержку рассуждений. Изменения здесь сразу применяются ко всем рабочим тенантам.',
    layers: {
      explicit: 'Значения, заданные в тенанте в настройках модели, всегда важнее; изменения каталога не перезаписывают сохранённые модели.'
    },
    fieldsHint: 'Значения, заданные в тенанте в настройках модели, по-прежнему важнее. Очистите поле, чтобы вернуть значение по умолчанию.',
    historyRestoreConfirm: 'Восстановить версию {version} и сразу применить её ко всем рабочим тенантам?'
  },
  toolbox: {
    unavailable: 'В текущем тенанте нет доступных инструментов.'
  },
  localBrowser: {
    viewOnly: 'Только просмотр браузера этого диалога',
    windowHint: 'Задачи выполняются в отдельном окне браузера Agentic. Заимствование существующих вкладок требует вашего разрешения.',
    usageStep2Text: 'Вставьте ссылку в «Настройки подключения → Удалённое подключение» расширения и подтвердите сервер. Одно подключение используется во всех диалогах тенанта.'
  },
  platformApiKeys: {
    description: 'Учетные данные для автоматизации между рабочими пространствами. Для API пространства используйте X-Tenant-ID.',
    securityNotice: 'Платформенный ключ может выбрать любое тенант. Выдавайте только необходимые права; секрет показывается один раз.',
    createDescription: 'Ключ не привязан к тенанту, но каждая операция ограничена правами.',
    capabilityHint: 'Права тенанта применяются к X-Tenant-ID, системные права — к API управления платформой.',
    capabilityHints: {
      tenantsRead: 'Список, поиск и просмотр всех тенант.',
      tenantsManage: 'Создание, изменение и удаление тенант.'
    },
    capabilities: {
      tenantsRead: 'Просмотр тенант',
      tenantsManage: 'Управление тенантами'
    }
  },
  tenantInvitation: {
    errors: {
      alreadyMember: 'This user is already an active member of the tenant.'
    },
    myInbox: {
      description: 'Invitations from other tenants. Accept to join with the assigned role.',
      tenantLabel: 'Workspace'
    },
    shareLink: {
      description: 'Generate a multi-use registration link you can drop in a group chat. Anyone who opens it registers with their own email and joins this tenant. Expires in {days} days, or revoke it any time from the list.'
    }
  },
  tenantMember: {
    sectionDescription: 'Добавляйте участников в текущий тенант и назначайте роли. Добавлять, редактировать и удалять может только Владелец.',
    listTitle: 'Участники тенанта',
    empty: 'Участников пока нет. Добавьте участника кнопкой справа сверху.',
    searchPlaceholder: 'Поиск по имени, логину или email',
    audit: {
      description: 'Регистрирует все изменения участников и отказы в доступе в этом тенанте, в обратном хронологическом порядке. Повторные отказы в течение минуты дедуплицируются.',
      outcome: {
        accepted: 'Принято',
        canceled: 'Отменено',
        failed: 'Не выполнено',
        partial: 'Частично'
      }
    },
    errors: {
      emailExists: 'Этот email уже используется',
      usernameRequired: 'Введите имя пользователя',
      usernameMinLength: 'Имя пользователя — не менее 2 символов',
      usernameMaxLength: 'Имя пользователя — не более 20 символов',
      usernameInvalid: 'Имя пользователя может содержать только буквы, цифры, подчёркивания и китайские иероглифы',
      usernameExists: 'Это имя пользователя уже используется',
      accountRequired: 'Введите логин',
      accountInvalid: 'Логин: только буквы и цифры, не более 20 символов',
      accountExists: 'Этот логин уже используется',
      accountLocked: 'Логин уже задан и его нельзя изменить',
      passwordRequired: 'Введите пароль',
      passwordMinLength: 'Пароль — не менее 8 символов',
      passwordMaxLength: 'Пароль — не более 32 символов',
      passwordLetter: 'Пароль должен содержать букву',
      passwordNumber: 'Пароль должен содержать цифру',
      passwordPolicy: 'Пароль: 8–32 символа, буквы и цифры',
      confirmPasswordRequired: 'Повторите пароль',
      passwordMismatch: 'Пароли не совпадают',
      alreadyMember: 'Пользователь уже состоит в этом тенанте'
    },
    leave: {
      confirmTitle: 'Покинуть это тенант?',
      confirmBody: 'Вы потеряете доступ ко всем базам знаний и агентам в этом тенанте. Позже вас можно будет пригласить снова.',
      success: 'Вы покинули тенант'
    },
    remove: {
      confirmBody: 'Вы уверены, что хотите удалить {name} из этого тенанта? Доступ будет отозван немедленно.'
    },
    edit: {
      button: 'Изменить',
      dialogTitle: 'Изменить участника',
      success: 'Участник обновлён',
      accountHintEmpty: 'Сейчас пусто, можно заполнить. После сохранения изменить нельзя',
      accountHintLocked: 'Логин уже задан и его нельзя изменить'
    },
    add: {
      button: 'Добавить участника',
      dialogTitle: 'Добавить участника',
      success: 'Участник добавлен',
      usernameLabel: 'Имя пользователя',
      usernamePlaceholder: 'Введите имя пользователя',
      accountLabel: 'Логин',
      accountPlaceholder: 'Буквы и цифры, до 20 символов',
      accountHint: 'После сохранения изменить нельзя',
      emailPlaceholder: 'Введите email',
      emailHint: 'Email не должен повторяться',
      passwordLabel: 'Пароль',
      passwordPlaceholder: '8–32 символа, буквы и цифры',
      confirmPasswordLabel: 'Подтверждение пароля',
      confirmPasswordPlaceholder: 'Введите пароль ещё раз'
    },
    columns: {
      member: 'Имя и логин'
    },
    permissions: {
      desc: 'Что может делать каждая роль внутри этого тенанта. Контролируется сервером; элементы UI лишь отражают правила.',
      manageTenantConfig: 'Изменение настроек тенанта',
      readAll: 'Чтение содержимого тенанта'
    }
  },
  integrations: {
    cli: {
      title: 'Agentic CLI'
    },
    claw: {
      title: 'Agentic Skill',
      subtitle: 'Импорт документов и гибридный поиск (вектор + ключевые слова) через REST API @:{\'brand.name\'} — загрузки, URL, Markdown и поиск.',
      installCtaHint: 'Установить Agentic Skill · откроется в новой вкладке'
    },
    chrome: {
      subtitle: 'Для self-hosted @:{\'brand.name\'}: вопросы в боковой панели, клиппинг страниц и Markdown-заметки в базы знаний прямо при просмотре.',
      steps: {
        port: {
          desc: 'В @:{\'brand.name\'} Desktop задайте фиксированный порт API (например 37841) в API-информации.'
        }
      }
    },
    api: {
      apiKeyAccessTypeHint: '«База знаний» работает в пределах области БЗ на выбранном ниже уровне прав; «Полный доступ тенанта» дополнительно открывает все API уровня тенанта, такие как модели и источники данных.',
      apiKeyCapabilityGroupCollaboration: 'Участники и тенанта',
      apiKeyCapabilityGroupTenant: 'Настройки тенанта',
      capabilityTenantFull: 'Полный доступ тенанта',
      capabilityTenantFullHint: 'Разрешает все API уровня тенанта, включая модели, векторные хранилища, источники данных и каналы. Диапазон баз знаний не применяется.',
      capabilityIngestHint: 'Позволяет ключу записывать содержимое в разрешённые базы знаний (загрузка документов, редактирование фрагментов/FAQ/тегов/wiki). Нельзя создавать базы знаний или агентов, нельзя очищать базу знаний; действие ограничено выбранными базами знаний.',
      capabilityManageKbsHint: 'Позволяет управлять всем жизненным циклом баз знаний: создавать, копировать, обновлять и удалять базы знаний, а также менять их инициализацию/конфигурацию. Операции над существующими базами знаний (копирование/обновление/удаление) по-прежнему ограничены выбранной областью; создание новой базы знаний не ограничено (новая база знаний принадлежит этому тенанту).',
      capabilityMessageHistoryHint: 'Позволяет искать историю чатов тенанта и читать статистику истории. Не даёт доступ к настройкам тенанта.',
      capabilityManageModelsHint: 'Управление конфигурациями моделей, учётными данными, проверками подключения и данными облачный сервис.',
      capabilityManageStorageBackendsHint: 'Управление экземплярами объектных/файловых хранилищ (например, S3-совместимых или локальных): их CRUD, проверки подключения и выбор хранилища по умолчанию для тенанта.',
      capabilityManageMembersHint: 'Просмотр и управление участниками пространства, ролями, приглашениями и ссылками-приглашениями. Не включает управление API Key, удаление пространства или передачу владения.',
      capabilityManageSpaces: 'Управление пространствами',
      capabilityManageSpacesHint: 'Управление организациями/тенантами, вступлением, участниками, приглашениями и видимостью общих тенант. Не даёт управление шарингом баз знаний или агентов.',
      capabilityManageTenantSettings: 'Управление настройками тенанта',
      capabilityManageTenantSettingsHint: 'Чтение и обновление интеграционных настроек пространства: режим идентификации конечного пользователя API, настройки заголовков запросов и KV пространства. Не включает управление API Key, участниками, удаление пространства или передачу владения.',
      modeTenant: 'Только тенант',
      signedFlowDetail: 'HMAC secret храните только в @:{\'brand.name\'} и на доверенном backend — не передавайте в запросах и не отдавайте браузеру. В заголовке запроса передаётся JWT, подписанный этим secret (меняется при каждой выдаче или после истечения), а не сам secret. JWT должен содержать sub (ID внешнего пользователя), tenant_id, aud=weknora и exp (не более 24 ч).',
      requireDirectHeaderDesc: 'Если включено, запросы без заголовка ID пользователя отклоняются; иначе все запросы обрабатываются как единое тенант без различия конечных пользователей.',
      hmacSecretDesc: 'Тот же secret, что в @:{\'brand.name\'}; только для подписи JWT на backend — не отправляйте его в заголовке запроса.',
      playgroundTenantModeHint: 'Режим только пространства не отправляет внешнего пользователя; все API-сессии используют один субъект пространства.',
      playgroundNeedApiKey: 'У этого тенанта нет API key.',
      editApiKeyScopeHint: 'Оставьте пустым, чтобы разрешить все базы знаний тенанта. Все изменения применяются сразу.'
    },
    mcpserver: {
      subtitle: 'Опубликуйте это тенант как MCP-сервер, к которому напрямую подключаются Claude Desktop, Cursor, Claude Code и другие MCP-клиенты. У каждой конечной точки свой токен, область баз знаний и список инструментов.',
      kbScopePlaceholder: 'Пусто — все базы знаний тенанта',
      kbScopeHint: 'Все инструменты поиска, вопросов и записи ограничены этими базами знаний. Пусто означает всё тенант.'
    }
  },
  datasource: {
    resumeFailed: 'Не удалось возобновить'
  },
  agentEditor: {
    agentType: {
      kbMismatch: {
        quickAnswer: 'Мгновенный ответ требует RAG-поиск'
      }
    },
    im: {
      descriptionRestricted: 'Подключайте агента к корпоративным мессенджерам: WeCom, Feishu и DingTalk'
    },
    desc: {
      memoryEnabled: 'Разрешить этому агенту читать и пополнять вашу долговременную память. При выключении разговоры с ним не читают ваши записи и не добавляют новые. Если память выключена в настройках тенанта или в личных настройках, включение здесь не подействует'
    }
  },
  kbSettings: {
    parser: {
      engines: {
        weknoracloud: {
          name: 'облачный сервис',
          desc: 'Парсинг документов через облачный сервис'
        },
        anydoc: {
          desc: 'Встроенный в процесс парсер документов Office (внешний сервис не требуется)'
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
      tipTenant: 'Членство задаётся на уровне пространства: после присоединения пространства все его пользователи получают доступ к этому пространству. Результаты ниже сгруппированы по пространству.',
      searchTenant: 'ID тенанта',
      searchTenantPlaceholder: 'Введите полный ID тенанта',
      searchTenantHint: 'Укажите точный ID рабочего пространства или поделитесь ссылкой-приглашением.'
    },
    settings: {
      membersDesc: 'Просмотр и управление участниками тенанта и их ролями. Каждый участник представляет одно тенант: все его пользователи получают одинаковый доступ к общему тенанту.'
    },
    join: {
      alreadyMember: 'Вы уже являетесь участником этого общего тенанта',
      confirmTitle: 'Подтвердите присоединение к общему тенанту',
      failed: 'Не удалось присоединиться к общему тенанту',
      goToOrganizations: 'Перейти к списку общих тенант',
      joining: 'Присоединение к общему тенанту...',
      success: 'Вы успешно присоединились к общему тенанту!'
    },
    rbac: {
      needTenantAdminTip: 'Для этого действия требуется роль admin или выше в текущем тенанте. Обратитесь к владельцу тенанта.',
      cannotCreate: 'Недостаточно прав в текущем тенанте для создания общего тенанта',
      cannotJoin: 'Недостаточно прав в текущем тенанте для присоединения к общему тенанту',
      cannotManage: 'Недостаточно прав в текущем тенанте для управления общим тенантм'
    },
    joinFailed: 'Не удалось присоединиться к общему тенанту',
    joinSuccess: 'Вы успешно присоединились к общему тенанту'
  },
  mcpServiceDialog: {
    viewTitle: 'Просмотр сервиса MCP',
    testResultTitle: 'Результат проверки',
    stdioLaunch: 'Команда запуска'
  },
  modelSettings: {
    debug: {
      thinkOff: 'Размышление выкл.',
      thinkOn: 'Размышление вкл.',
      thinking: 'Режим размышления',
      thinkingDesc: 'Применяется только к моделям с поддержкой размышления'
    },
    builtinModels: {
      description: 'Встроенные модели видны всем тенантам. Конфиденциальная информация скрыта, их нельзя редактировать или удалять.',
      descriptionAdmin: 'Встроенные модели видны всем тенантам. Системные администраторы могут изменять конфигурацию и учетные данные; удаление управляется конфигурацией развертывания.'
    }
  },
  mcpSettings: {
    view: 'Просмотр'
  },
  platform: {
    independentTenant: 'Независимое тенант'
  },
  theme: {
    switchToLight: 'Переключить на светлую тему',
    switchToDark: 'Переключить на тёмную тему'
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
          description: 'DeepSeek-R1, DeepSeek-V3, lke-reranker-base и др.'
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
          label: 'Пользовательский (OpenAI-совместимый)',
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
          description: 'Сервис OpenAI на платформе Microsoft Azure'
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
          description: 'Self-hosted прокси к 100+ провайдерам (OpenAI, Anthropic, Gemini, Bedrock и др.). Замените URL-заглушку; localhost нужно добавить в SSRF_WHITELIST.'
        }
      },
      thinkingControl: {
        thinkingType: {
          label: 'thinking.type',
          hint: 'Volcengine Ark; Tencent LKEAP (DeepSeek V3 и др.; по умолчанию для LKEAP; для R1 — «Не отправлять»)'
        },
        enableThinking: {
          label: 'enable_thinking',
          hint: 'Alibaba DashScope: qwen3, qwen-plus, qwen-max, qwen-turbo'
        },
        chatTemplateKwargs: {
          label: 'chat_template_kwargs',
          hint: 'Пользовательские OpenAI-совместимые шлюзы, NVIDIA NIM, vLLM / локальный Qwen'
        },
        none: {
          label: 'Не отправлять параметры размышления',
          hint: 'Переключатель «Режим размышления» агента не действует; параметры размышления не отправляются в запросе'
        }
      },
      thinkingControlDesc: 'Определяет, как переключатель «Режим размышления» агента записывается в API. При возможности выбирается по поставщику/модели; при несоответствии измените по документации API. При выборе «Не отправлять» переключатель «Режим размышления» агента не действует.',
      thinkingControlLabel: 'Формат параметров режима размышления',
      volcengine: {
        accessKeyLabel: 'Access Key ID',
        accessKeyPlaceholder: 'Volcengine Access Key ID',
        secretKeyLabel: 'Secret Access Key',
        secretKeyPlaceholder: 'Volcengine Secret Access Key',
        rerankCredentialHint: 'Rerank использует подпись VikingDB AK/SK, а не Ark API key. Рекомендуемая модель: doubao-seed-rerank.'
      }
    }
  },
  error: {
    tenant: {
      listFailed: 'Не удалось получить список тенант',
      searchFailed: 'Не удалось выполнить поиск тенант',
      updateFailed: 'Не удалось обновить информацию о тенанте',
      deleteFailed: 'Failed to delete tenant',
      createApiKeyFailed: 'Не удалось создать API-ключ',
      createFailed: 'Не удалось создать',
      deleteApiKeyFailed: 'Не удалось удалить API-ключ',
      listApiKeysFailed: 'Не удалось получить список API-ключей'
    },
    auth: {
      getTenantFailed: 'Не удалось получить информацию о тенанте'
    }
  },
  system: {
    versionDescription: 'Версия сервиса приложения (weknora-app)',
    frontendVersionDescription: 'Версия сборки UI (weknora-ui)',
    globalSettings: {
      description: 'Настройки платформы, применяемые в режиме реального времени. Изменения сразу действуют для всех тенант. Доступны только системным администраторам.',
      audit: {
        target: {
          bulkQuotaDiff: 'Применено к {count} тенантам ({gb} ГБ)'
        },
        outcome: {
          accepted: 'Принято',
          canceled: 'Отменено',
          failed: 'Не выполнено',
          partial: 'Частично'
        }
      },
      bulkApply: {
        label: 'Применить ко всем существующим тенантам',
        tooltip: 'По умолчанию сохранённое значение применяется только к новым тенантам. Нажмите, чтобы также перезаписать все существующие.',
        confirmBody: 'Перезаписать квоту хранилища всех существующих пространств значением {value} ГБ. Пространства, чью квоту вручную правили эксплуатация, также будут перезаписаны. Продолжить?',
        success: 'Обновлена квота хранилища у {count} тенант: {gb} ГБ',
        failed: 'Ошибка применения ко всем тенантам'
      },
      passwordReset: {
        validation: {
          emailRequired: 'Введите email пользователя',
          emailInvalid: 'Введите корректный email',
          passwordRequired: 'Введите новый пароль',
          passwordLength: 'Пароль должен содержать от 8 до 32 символов',
          passwordLetter: 'Пароль должен содержать букву',
          passwordNumber: 'Пароль должен содержать цифру',
          confirmRequired: 'Введите новый пароль ещё раз',
          passwordMismatch: 'Пароли не совпадают'
        }
      },
      createUser: {
        description: 'Завести новый локальный аккаунт. Если режим тенанта по умолчанию — «создавать личный тенант», пользователь получит личный тенант так же, как при самостоятельной регистрации.'
      },
      admins: {
        confirm: {
          promote: {
            body: 'Повысить пользователя {email} до системного администратора? Пользователь получит права уровня платформы: доступ ко всем тенантам, изменение системных настроек и управление списком администраторов.'
          }
        }
      },
      confirm: {
        bodySandboxDockerEnabled: 'После включения администраторы тенанта смогут направить песочницу на локальный демон Docker. Локальный docker.sock равносилен root на хосте. Только для частной одноузловой установки с примонтированным демоном или удалённым tcp:// с TLS.'
      },
      enumLabels: {
        auth: {
          default_tenant_mode: {
            create_personal: 'Создавать личное тенант',
            tenantless: 'Не создавать тенант'
          }
        }
      },
      keyDescriptions: {
        tenant: {
          max_owned_per_user: 'Максимальное число тенант, которыми может владеть обычный (не супер) пользователь через самостоятельное создание. Читается при каждом создании тенанта и вступает в силу сразу после сохранения. 0 — встроенное значение по умолчанию 10; отрицательное значение полностью снимает ограничение (не рекомендуется для публичных развёртываний).',
          self_service_creation_enabled: 'Разрешает обычным пользователям самостоятельно создавать пространства. Если отключено, они могут только присоединяться по приглашению; межпространственные суперпользователи не ограничены.',
          default_storage_quota_gb: 'Квота хранилища по умолчанию (ГБ) для нового пространства: векторы, оригиналы, текст, индексы и т.д. Читается только при создании — изменения применяются только к новым пространствам и не перезаписывают существующие. 0 или отрицательное значение — встроенное значение по умолчанию 10 ГБ.',
          auto_create_api_key: 'Автоматически создаёт API-ключ full_access и возвращает его открытый токен при создании тенанта. Включайте только для старых интеграций; по умолчанию отключено.',
          auto_accept_invitation: 'Если включено, приглашение зарегистрированного пользователя по email сразу добавляет его в тенант без подтверждения во входящих. Если выключено, сохраняется схема «отправка приглашения → подтверждение». Вступает в силу сразу после сохранения.'
        },
        auth: {
          default_tenant_mode: 'Политика пространства после открытой регистрации. create_personal создаёт личное пространство с ролью Owner; tenantless создаёт только аккаунт до принятия приглашения или самостоятельного создания пространства.'
        }
      },
      keyLabels: {
        tenant: {
          max_owned_per_user: 'Максимум тенант на пользователя',
          self_service_creation_enabled: 'Разрешить самостоятельное создание тенант',
          default_storage_quota_gb: 'Квота хранилища для новых тенант по умолчанию (ГБ)',
          auto_create_api_key: 'Автоматически создавать API-ключ для новых тенант'
        },
        auth: {
          default_tenant_mode: 'Создание тенанта по умолчанию'
        }
      },
      runtime: {
        tasks: {
          tenantLabel: 'ID тенанта'
        }
      },
      sections: {
        tenant: {
          tab: 'Значения тенанта {count}',
          title: 'Значения тенанта по умолчанию',
          description: 'Начальные квоты и режимы совместимости для новых тенант.'
        },
        access: {
          description: 'Системные администраторы, открытая регистрация и правила создания тенант.'
        }
      }
    }
  },
  tenant: {
    title: 'Информация о тенанте',
    currentTenant: 'Текущий тенант',
    switchTenant: 'Переключить тенант',
    sectionDescription: 'Просмотр подробной конфигурации тенанта',
    searchPlaceholder: 'Поиск по имени или введите ID тенанта...',
    noMatch: 'Не найдено подходящих тенантов',
    switchSuccessTitle: 'Тенант переключён',
    loadTenantsFailed: 'Не удалось загрузить список тенантов',
    messages: {
      fetchFailed: 'Не удалось получить информацию о тенанте'
    },
    deleteDangerZone: {
      title: 'Удалить текущий тенант',
      desc: 'Удаляет весь тенант и его конфигурацию. После удаления участники потеряют доступ к базам знаний, агентам и API-ключу.',
      button: 'Удалить тенант',
      confirmTitle: 'Удалить текущий тенант?',
      confirmBody: 'Будет удалён тенант «{name}», а его базы знаний, агенты, участники и API-ключ станут недоступны. Это действие нельзя отменить.',
      confirmHint: 'Введите название тенанта «{name}» для подтверждения.',
      nameMismatch: 'Название тенанта не совпадает',
      success: 'Тенант удалён',
      failed: 'Не удалось удалить тенант',
      confirm: 'Удалить'
    },
    leaveDangerZone: {
      title: 'Покинуть текущий тенант',
      desc: 'Завершает ваше членство в этом тенанте. Вы потеряете доступ к базам знаний и агентам. Позже вас можно снова пригласить.',
      button: 'Покинуть тенант'
    },
    storage: {
      quotaDescription: 'Общий объём хранилища, выделенный тенанту'
    },
    details: {
      idLabel: 'ID тенанта',
      idDescription: 'Уникальный идентификатор вашего тенанта',
      nameLabel: 'Название тенанта',
      nameDescription: 'Название тенанта, к которому вы принадлежите',
      descriptionLabel: 'Описание тенанта',
      descriptionDescription: 'Подробное описание тенанта',
      businessLabel: 'Бизнес тенанта',
      businessDescription: 'Бизнес-направление, к которому относится тенант',
      statusLabel: 'Статус тенанта',
      statusDescription: 'Текущий рабочий статус тенанта',
      createdAtLabel: 'Время создания тенанта',
      createdAtDescription: 'Дата и время создания тенанта',
      editNamePlaceholder: 'Введите новое имя тенанта',
      editNameRequired: 'Имя тенанта не может быть пустым',
      editNameSuccess: 'Имя тенанта обновлено',
      editNameFailed: 'Не удалось обновить имя тенанта',
      editDescriptionPlaceholder: 'Введите новое описание тенанта',
      editDescriptionSuccess: 'Описание тенанта обновлено',
      editDescriptionFailed: 'Не удалось обновить описание тенанта'
    },
    create: {
      action: 'Создать новый тенант',
      dialogTitle: 'Создать новый тенант',
      dialogSubtitle: 'У тенанта собственные базы знаний и участники. Вы станете его владельцем.',
      nameLabel: 'Название',
      nameRequired: 'Введите название тенанта',
      descriptionPlaceholder: 'Кратко опишите назначение тенанта',
      success: 'Тенант создан',
      failed: 'Не удалось создать тенант',
      disabled: 'В этой системе присоединиться к тенанту можно только по приглашению; создать его самостоятельно нельзя.',
      needAdmin: 'Создавать тенант могут только владелец или администратор.'
    },
    switcher: {
      menuLabel: 'Переключить тенант',
      homeTooltip: 'Ваш основной тенант',
      empty: 'Вы состоите только в одном тенанте'
    }
  },
  chat: {
    sandbox: {
      desktopPlaceholder: 'Визуализация рабочего стола скоро появится'
    },
    scrollToBottom: 'Вниз',
    copyFailed: 'Не удалось скопировать',
    copySuccess: 'Скопировано',
    editorOpened: 'Редактор открыт',
    emptyContentWarning: 'Содержимое пусто',
    imageReadFailed: 'Не удалось прочитать изображение'
  },
  knowledgeEditor: {
    titleCreate: 'Создать базу знаний',
    share: {
      description: 'Share the knowledge base with spaces so members can access and use it',
      tip1: 'After sharing, space members will access this knowledge base based on the assigned permissions'
    },
    postCreateHint: {
      followUpDesc: 'Настройте источники данных слева или опубликуйте базу в тенантах через «Управление общим доступом»'
    },
    wikiBrowser: {
      tabMindmap: 'Интеллект-карта',
      tabMindmapTip: 'Построить иерархию по списку файлов базы знаний'
    }
  },
  embedPublish: {
    originsHint: 'Укажите сайты, которым разрешено встраивание (A), а не адрес Agentic (B). Один полный Origin на строку, например https://shop.example.com; минимум один. Поддерживается *.example.com.',
    webhookUrlPlaceholder: 'https://your-server.example.com/weknora/embed-events',
    webhookUrlDesc: 'Optional. @:{\'brand.name\'} POSTs message_sent / message_received events to this HTTPS endpoint.'
  },
  knowledgeList: {
    create: 'Создать базу знаний',
    sharedToOrgs: 'Shared to {count} space(s)',
    detail: {
      sourceTypeKbShare: 'KB shared directly to this space',
      sourceOrg: 'Space'
    },
    sections: {
      tenantOthers: 'Рабочая область · Другие участники',
      tenantReadonly: 'Рабочая область · Только просмотр'
    },
    empty: {
      description: 'Нажмите «Создать базу знаний» в правом верхнем углу, чтобы добавить первую базу.'
    },
    uploadProgress: {
      uploadingTitle: 'Загрузка документов папки в «{name}»',
      detail: 'Готово {completed} из {total} файлов',
      keepPageOpen: 'Пожалуйста, не закрывайте страницу, пока идет загрузка.',
      completedTitle: 'Загрузка для «{name}» завершена',
      completedDetail: 'Загружено {total} файлов. Обновляем список, чтобы показать статус разбора...',
      refreshing: 'Обновляем список и статусы разбора...',
      errorTip: 'Часть файлов загрузить не удалось. Проверьте уведомления.',
      unknownKb: 'База знаний {id}'
    }
  },
  ext: {
    subtitle: 'Управляйте навыками, инструментами и MCP среды выполнения',
    noDescription: 'Нет описания',
    close: 'Закрыть',
    cancel: 'Отмена',
    mcp: {
      searchPlaceholder: 'Поиск MCP...',
      add: 'Добавить MCP',
      create: 'Создать MCP',
      empty: 'MCP пока нет. Нажмите кнопку выше, чтобы создать.',
      emptySearch: 'Нет подходящих MCP',
      remove: 'Убрать MCP',
      delete: 'Удалить MCP',
      needsMigration: 'Нужна миграция в удалённый MCP',
      unknownTransport: 'Неизвестный транспорт',
      builtin: 'Встроенный',
      description: 'Описание',
      transport: 'Транспорт',
      tags: 'Теги',
      creator: 'Автор',
      addedOk: 'MCP добавлен',
      removedOk: 'MCP убран',
      actionFailed: 'Действие не удалось',
      deleteTitle: 'Удалить MCP?',
      deleteContent: 'Удалить MCP «{name}»? Это нельзя отменить.',
      deleted: 'MCP удалён',
      deleteFailed: 'Не удалось удалить',
      loadFailed: 'Не удалось загрузить список MCP',
      detail: {
        back: 'Назад',
        migrateFirst: 'Сначала перенесите на удалённый MCP',
        test: 'Тест',
        builtinConfigHint: 'Подключение встроенного MCP задаётся в коде',
        edit: 'Изменить',
        delete: 'Удалить',
        add: 'Добавить',
        remove: 'Убрать',
        migrateAlert: 'Этот stdio MCP отключён. Смените на SSE или Streamable HTTP либо удалите.',
        tabInfo: 'Сведения',
        editHeading: 'Изменить MCP',
        editHint: 'Сохранение сразу применяет новую конфигурацию.',
        basicTitle: 'Основные',
        basicHint: 'Имя, описание и отображение MCP.',
        connTitle: 'Подключение',
        connHint: 'Параметры выбранного транспорта.',
        advancedTitle: 'Дополнительно',
        advancedHint: 'Заголовки влияют на подключение MCP.',
        headersHelp: 'Введите JSON-объект. Пусто — без дополнительных заголовков.',
        cancel: 'Отмена',
        save: 'Сохранить',
        seconds: '{count} с',
        command: 'Команда',
        args: 'Аргументы',
        env: 'Переменные среды',
        createdAt: 'Создано',
        updatedAt: 'Обновлено',
        creator: 'Автор',
        tabTools: 'Инструменты ({count})',
        searchTools: 'Поиск инструментов...',
        refresh: 'Обновить',
        noTools: 'Инструментов нет',
        copyToolName: 'Копировать имя инструмента',
        params: 'Параметры',
        required: 'Обязательно',
        notFound: 'MCP-сервер не найден',
        addFirst: 'Сначала добавьте MCP, затем откройте сведения',
        fetchFailed: 'Не удалось загрузить сведения MCP',
        fetchToolsFailed: 'Не удалось загрузить инструменты',
        copied: 'Скопировано',
        copyFailed: 'Не удалось скопировать',
        connectFailed: 'Подключение не удалось',
        testFailed: 'Тест не удался',
        testOk: 'Подключено. Найдено инструментов: {count}.',
        toolEnabled: 'Инструмент {name} включён',
        toolDisabled: 'Инструмент {name} выключен',
        added: 'MCP добавлен',
        removed: 'MCP убран'
      },
      form: {
        slug: 'ID MCP',
        name: 'Имя MCP',
        namePlaceholder: 'Отображаемое имя',
        description: 'Описание',
        descPlaceholder: 'Описание MCP',
        transport: 'Транспорт',
        icon: 'Значок',
        iconPlaceholder: 'Emoji, например 🧠',
        url: 'URL MCP',
        headers: 'HTTP-заголовки',
        headersPlaceholder: 'JSON, например {\'{\'}"Authorization": "Bearer xxx"{\'}\'}',
        httpTimeout: 'Таймаут HTTP (сек)',
        sseTimeout: 'Таймаут чтения SSE (сек)',
        tags: 'Теги',
        tagsPlaceholder: 'Введите тег и нажмите Enter',
        badHeaders: 'Заголовки должны быть корректным JSON',
        nameRequired: 'Нужно имя MCP',
        transportRequired: 'Выберите транспорт',
        urlRequired: 'Для HTTP нужен URL MCP',
        updated: 'MCP обновлён',
        updateFailed: 'Не удалось обновить',
        actionFailed: 'Действие не удалось'
      }
    },
    tools: {
      searchPlaceholder: 'Поиск инструментов...',
      allCategories: 'Все категории',
      allSources: 'Все области',
      empty: 'Инструментов пока нет',
      emptySearch: 'Нет подходящих инструментов',
      noDescription: 'Нет описания',
      detail: 'Сведения об инструменте',
      configGuide: 'Инструкция',
      category: 'Категория',
      tags: 'Теги',
      none: 'Нет',
      args: 'Параметры',
      argName: 'Имя',
      argType: 'Тип',
      argDesc: 'Описание',
      loadFailed: 'Не удалось загрузить инструменты',
      catBuiltin: 'Встроенные',
      catKnowledge: 'База знаний',
      catWiki: 'Wiki',
      catDatabase: 'База данных',
      sourceChat: 'Диалог',
      sourceWork: 'Работа'
    },
    skills: {
      searchPlaceholder: 'Поиск навыков...',
      emptyTitle: 'Навыков пока нет',
      emptySearchTitle: 'Нет подходящих навыков',
      emptyDesc: 'Установите из удалённого репозитория или загрузите локальный файл.',
      emptySearchDesc: 'Попробуйте другое ключевое слово или очистите поиск.',
      groupBuiltin: 'Встроенные',
      groupShared: 'Общие для арендатора',
      builtinWorkNoSandbox: 'Встроенные рабочие навыки не устанавливаются в песочницу',
      sourceCommon: 'Общее',
      scopeAll: 'Все области',
      fileTab: 'Управление файлами',
      depsTab: 'Настройка зависимостей',
      uninstalled: 'Навык удалён',
      uninstallFailed: 'Не удалось удалить навык',
      loadFailed: 'Не удалось загрузить',
      remoteNone: 'Устанавливаемых навыков не найдено',
      detail: {
        back: 'Назад',
        export: 'Экспорт',
        delete: 'Удалить',
        readonlyHint: 'Можно просматривать и использовать навык, но нет права управления.',
        tabCode: 'Файлы',
        projectStructure: 'Структура проекта',
        newFile: 'Новый файл',
        newDir: 'Новая папка',
        refresh: 'Обновить',
        pickFile: 'Выберите файл для правки',
        saveSettings: 'Сохранить',
        enabledTitle: 'Включён',
        enabledDesc: 'Если выключить, навык скроется из выбора и не загрузится в runtime.',
        enabled: 'Включён',
        disabled: 'Выключен',
        tabDeps: 'Зависимости',
        depsTitle: 'Зависимости',
        depsDesc: 'Инструменты, MCP и другие навыки, нужные этому навыку.',
        updateDeps: 'Обновить зависимости',
        selectedCount: 'Выбрано: {count}',
        pickDeps: 'Выбрать',
        searchDeps: 'Поиск: {name}',
        noMatchDeps: 'Нет подходящих зависимостей',
        noDeps: 'Нет доступных зависимостей',
        systemMaintained: 'Системное',
        readonly: 'Только чтение',
        removeAria: 'Убрать {name}',
        notFound: 'Навык не найден',
        pathRelative: 'Путь (относительно корня)',
        content: 'Содержимое',
        statusDisabled: '{source} · Выключен',
        depToolsTitle: 'Зависимости инструментов',
        depToolsShort: 'инструменты',
        depToolsDesc: 'Инструменты, нужные навыку в runtime.',
        depToolsHint: 'Выбранные инструменты загружаются вместе с агентом.',
        depToolsEmpty: 'Нет зависимостей инструментов',
        depMcpTitle: 'Зависимости MCP',
        depMcpDesc: 'MCP-серверы, от которых зависит навык.',
        depMcpHint: 'Выберите MCP, нужные при запуске навыка.',
        depMcpEmpty: 'Нет зависимостей MCP',
        depSkillTitle: 'Зависимости навыков',
        depSkillDesc: 'Другие навыки, которые нужно загрузить вместе.',
        depSkillHint: 'Зависимые навыки будут доступны в том же runtime.',
        depSkillEmpty: 'Нет зависимостей навыков',
        loadFailed: 'Не удалось загрузить',
        treeFailed: 'Не удалось загрузить дерево файлов',
        readFailed: 'Не удалось прочитать файл',
        saved: 'Сохранено',
        saveFailed: 'Не удалось сохранить',
        confirmDeleteTitle: 'Удалить навык «{name}»?',
        confirmDeleteContent: 'Это нельзя отменить. Файлы и настройки будут удалены.',
        confirmDeleteOk: 'Удалить',
        deleted: 'Удалено',
        deleteFailed: 'Не удалось удалить',
        exportFailed: 'Не удалось экспортировать',
        created: 'Создано',
        createFailed: 'Не удалось создать',
        settingsSaved: 'Настройки сохранены',
        settingsSaveFailed: 'Не удалось сохранить настройки',
        depsUpdated: 'Зависимости обновлены',
        depsUpdateFailed: 'Не удалось обновить'
      }
    },
    tabs: {
      skills: 'Навыки',
      tools: 'Инструменты',
      mcp: 'MCP'
    }
  },
  createChat: {
    title: 'Привет! О чём хотите поговорить сегодня?'
  },
  input: {
    agentMode: 'Ответ с рассуждением',
    normalMode: 'Мгновенный ответ',
    messages: {
      agentSwitchedOn: 'Переключено на ответ с рассуждением',
      agentSwitchedOff: 'Переключено на мгновенный ответ'
    },
    webSearch: {
      label: 'Веб-поиск'
    },
    placeholderAgent: 'Спросить {name}',
    placeholderKbAndWeb: 'Введите вопрос, ответ будет основан на базе знаний и веб-поиске',
    placeholderWebOnly: 'Введите вопрос, ответ будет основан на веб-поиске',
    placeholderWithContext: 'Введите вопрос, ответ будет основан на выбранных выше базах знаний/файлах',
    fileUpload: {
      label: 'Загрузить файл',
      tooLarge: 'Файл слишком большой',
      tooMany: 'Слишком много файлов',
      tooltip: 'Нажмите или перетащите файлы для загрузки'
    },
    imageUpload: {
      label: 'Загрузить изображение',
      tooltip: 'Нажмите или перетащите изображения для загрузки'
    }
  },
  manualEditor: {
    section: {
      basic: 'Основная информация'
    },
    view: {
      editLabel: 'Вернуться к редактированию',
      previewLabel: 'Предпросмотр'
    },
    description: 'Пишите знания в Markdown с предпросмотром в реальном времени'
  },
  file: {
    downloadFailed: 'Не удалось загрузить'
  },
  mentionDetail: {
    belongsToOrg: 'Пространство: '
  },
  authStore: {
    errors: {
      parseTenantFailed: 'Не удалось разобрать данные тенанта'
    }
  },
  auth: {
    loginAccount: 'Логин',
    loginAccountPlaceholder: 'Введите логин или email',
    loginAccountRequired: 'Введите логин',
    firstTime: 'Впервые в @:{\'brand.name\'}?',
    registerSubtitle: 'Создайте аккаунт и начните работу с @:{\'brand.name\'}',
    loginError: 'Ошибка входа, проверьте логин или пароль',
    workspaceOnboarding: {
      title: 'Выберите тенант',
      description: 'Создайте тенант, чтобы начать работу, или примите приглашение в уже существующий тенант.',
      create: 'Создать тенант',
      loadingPolicy: 'Проверяем доступные способы присоединения…',
      policyLoadFailed: 'Не удалось загрузить разрешения тенанта. Проверьте подключение и повторите попытку.',
      inviteOnlyTitle: 'Ожидание приглашения в тенант',
      inviteOnlyDescription: 'Создание личных тенантов отключено. Просмотрите и примите приглашение администратора.',
      inviteOnlyNotice: 'Этот аккаунт может присоединиться к существующему тенанту только по приглашению',
      help: 'Вы можете создать тенант сейчас или вернуться позже, чтобы принять приглашение.',
      inviteOnlyHelp: 'Нет приглашения? Сообщите администратору тенанта свой регистрационный адрес электронной почты.'
    }
  },
  inviteRegister: {
    success: 'Registration successful — entering tenant…'
  },
  memorySettings: {
    workspaceDisabled: 'Долговременная память отключена в этом тенанте. Переключатель начнёт действовать, когда её включит администратор.'
  },
  envVarSettings: {
    description: 'Личные ключи для навыков и песочниц, а не системные или деплой-настройки платформа.',
    introPersonalBody: 'Подставляются только в ваши диалоги и запуски. Другие участники их не видят, и их значения не заменяют ваши.',
    noConfigDescription: 'В этом тенанте пока нет песочницы, поэтому задавать ключи не для чего.',
    skillHint: 'Каждый навык объявляет, что ему нужно. Можно сохранить заранее здесь или передать в разговоре. Администратор тенанта может также задать общие значения на карточке навыка.',
    statusWorkspace: 'Используется значение тенанта',
    clearConfirm: 'Удалить ваше значение для {name}? После этого снова применится значение тенанта, если оно задано.'
  },
  memoryWorkspaceSettings: {
    enableLabel: 'Включить долговременную память в этом тенанте',
    enableDescription: 'При выключении ни один разговор в этом тенанте не читает и не пишет память.',
    instructionsDescription: 'Правила тенанта, добавляемые к промпту извлечения, для политик, которые продукт не может угадать — например «никогда не записывать имена клиентов».'
  },
  settings: {
    sandbox: {
      pageHint: 'Песочница — изолированная среда, в которой выполняются скрипты навыков агента. В тенанте можно создать несколько конфигураций (Docker, E2B, CubeSandbox); каждый агент выбирает одну. Навыки устанавливаются на странице «Управление навыками» в образ выбранной конфигурации. Пока конфигурация не выбрана, скрипты не выполняются.',
      editorDescription: 'Configure a tenant runtime. Docker, CubeSandbox, and E2B use the same management flow.',
      scriptPolicyDesc: 'Если выключено, агенты этого тенанта смогут только читать содержимое навыков. Уже запущенные удалённые песочницы освободятся после завершения их сессий.',
      dockerHostRisk: 'Пустое значение или unix:// использует демон Docker на машине платформа — это равносильно root на этой машине. Только для частной одноузловой установки. Если несколько тенантов делят один хост, используйте Cube или E2B. Удалённый tcp:// требует каталог TLS-сертификатов.',
      noConfigs: 'Песочниц пока нет. Агенты без конфигурации тенанта не выполняют скрипты навыков.',
      disableScriptsConfirm: 'All agents in this tenant — will no longer run skill scripts in a sandbox. They can still read skill content. Existing remote sandboxes are not destroyed automatically; end or delete the related sessions to release them. Continue?',
      scriptsDisabled: 'Sandbox execution disabled for this tenant',
      scriptsEnabled: 'Sandbox execution restored for this tenant',
      namedBackendHint: 'Tenant configuration is the only runtime source. Agents without one cannot execute skill scripts.',
      weknoraTemplateTitle: 'платформа standard template',
      weknoraDockerImage: 'платформа standard image',
      weknoraTemplateOverview: 'платформа provides the standard runtime. Templates are discovered after connecting and the standard one is created when missing.',
      weknoraTemplateDescription: 'Includes the Python, Node.js, CLI tools, workspace path, and non-root execution user expected by платформа skills.',
      templateLoadHint: 'Введите подключение к кластеру и обновите список. Если стандартного шаблона платформа нет, нажмите «Создать»; после смены DNS или образа — «Удалить и пересобрать».',
      standardTemplateProvisioning: 'The платформа standard template is being created. Refresh shortly to see its status.',
      templateStepHint: 'На этом шаге только перечисляются шаблоны, уже есть в кластере; ничего не создаётся автоматически. Если стандартного шаблона нет, нажмите «Создать стандартный шаблон платформа»; после смены DNS или образа — «Удалить и пересобрать». Продолжить можно, когда шаблон готов.',
      templateUntaggedHint: 'Сборки завершены, но ни одна не имеет тега default, поэтому при создании песочницы шаблон не находится. Удалите его в E2B и обновите список — платформа пересоберёт шаблон.',
      weknoraStandardTemplate: 'Стандартный шаблон платформа',
      replaceStandardTemplateConfirm: 'Стандартный шаблон платформа будет собран заново с текущими настройками, включая DNS. Предыдущий готовый шаблон не удаляется, пока замена не станет готовой к запуску.',
      cubeDnsServersHelp: 'Необязательно. IP nameserver, которые записываются в стандартный шаблон платформа. Пустое значение оставляет значение кластера по умолчанию (обычно 119.29.29.29). Если UDP/53 до публичных резолверов недоступен, укажите достижимые адреса из /etc/resolv.conf хоста Cube, исключая 10/8, 172.16/12 и 192.168/16. Чтобы изменение вступило в силу, на карточке шаблона нажмите «Пересобрать».',
      dockerTlsCertPathHelp: 'Directory on the платформа host holding ca.pem, cert.pem and key.pem. Required for a remote daemon; certificates are mounted by the deployment, never stored here.',
      dockerIdleTtlHelp: 'The Docker daemon has no idle timeout of its own. A container that runs no command for this long is reclaimed by платформа and rebuilt when the session continues. Empty means 1800 seconds.',
      skillEnv: {
        workspaceTitle: 'Значения для всего тенанта',
        saveSuccess: 'Значения тенанта сохранены',
        saveFailed: 'Не удалось сохранить значения тенанта.',
        clearConfirm: 'Очистить значение тенанта для {name}? Объявление останется. У участников без своего значения его не будет.',
        clearSuccess: 'Значение тенанта очищено.'
      },
      backendDescriptions: {
        docker: 'Держит долгоживущий контейнер на каждую сессию на этом хосте платформа; скрипты и файлы остаются в том же контейнере'
      }
    },
    skills: {
      description: 'Навыки живут в каталоге тенанта. Их можно только зарегистрировать или установить в одну или несколько песочниц. Агент включает только навыки, которые готовы в выбранной песочнице.',
      host: {
        description: 'Навыки лежат в каталоге тенанта. Агент может включить навык после установки на этот компьютер.'
      },
      scope: 'Область применения',
      addStepRegisterDesc: 'Вставьте источник или загрузите zip, чтобы сначала добавить навык в каталог тенанта.'
    },
    tenantInfo: 'Информация о тенанте',
    parser: {
      checking: 'Проверка…'
    },
    weknoraCloud: {
      title: 'облачный сервис',
      credentialConfigured: 'Учётные данные облачный сервис настроены.',
      credentialUnconfigured: 'Учётные данные облачный сервис не настроены. Заполните APPID и APPSECRET.',
      modelHintConfigured: 'Учётные данные облачный сервис настроены. Поддерживаемые модели см. в',
      modelsSection: {
        descReady: 'Зарегистрируйте четыре стандартные модели облачный сервис для чата, поиска, реранкинга и зрения.'
      },
      saveSuccess: 'Учётные данные сохранены'
    },
    roleDenied: {
      desc: 'Ваша роль не позволяет открыть этот раздел настроек. Обратитесь к администратору тенанта, чтобы запросить нужную роль.'
    },
    navGroups: {
      workspace: 'Тенант'
    },
    workspaceSettings: 'Настройки тенанта',
    storage: {
      saveSuccess: 'Сохранено'
    }
  },
  agent: {
    workSubtitle: 'Управление рабочими агентами. Они создают промежуточные файлы и артефакты.',
    builtinWikiQa: 'Wiki-вопросы',
    builtinTableAnalysis: 'Анализ таблиц',
    editor: {
      rerankModelOptionalHint: 'В текущей области нет RAG-базы знаний, поэтому поле необязательное. Если RAG-база будет добавлена позже, будет использоваться модель ReRank по умолчанию для тенанта; всё же рекомендуется настроить её явно.',
      hostSkillsSelectionDesc: 'Здесь навыки каталога тенанта. Установленные на этот компьютер можно использовать сразу; остальные сначала нужно установить.',
      skillsSelectionDesc: 'Здесь все навыки каталога тенанта. Установленные в эту песочницу можно использовать сразу; остальные сначала нужно установить.',
      noSkillsAvailable: 'В каталоге тенанта ещё нет навыков.',
      sandboxNoConfigs: 'В этом тенанте ещё нет песочницы, поэтому скрипты навыков не выполняются.',
      maxCompletionTokensCustom: 'Пользовательский'
    },
    shareScope: {
      desc: 'Space members have read-only access to this agent and will use it according to your current configuration; your changes to the agent will sync to shared spaces. To allow space members to edit knowledge base content, share the knowledge base to the space.',
      skillSecretsWarning: 'This agent uses skills. When space members use it, the skills run in this tenant\'s sandbox with the environment variables admins configured for them (such as API keys), and members can have the agent reveal those values. Share it only if that is acceptable.'
    },
    empty: {
      sharedDescription: 'You can join a space or ask others to share agents with you'
    },
    sections: {
      tenantOthers: 'Рабочая область · Другие участники',
      tenantReadonly: 'Рабочая область · Только просмотр'
    },
    tabs: {
      platform: 'Диалог',
      work: 'Работа'
    },
    mode: {
      normal: 'Мгновенный ответ',
      agent: 'Ответ с рассуждением'
    },
    type: {
      normal: 'Мгновенный ответ',
      agent: 'Ответ с рассуждением'
    },
    workManage: {
      viewSwitch: 'Переключение вида управления агентами',
      sectionAgents: 'Агенты',
      sectionSubagents: 'Субагенты',
      deleteBuiltinWarning: 'Встроенных агентов нельзя удалить',
      modelNotConfigured: 'Модель не настроена',
      deleteConfirmTitle: 'Удалить {name}',
      deleteConfirmContent: 'Это действие нельзя отменить. Существующие диалоги сохранят исходную привязку.',
      deleted: 'Агент удалён',
      deleteFailed: 'Не удалось удалить агента',
      loadFailed: 'Не удалось загрузить агентов',
      loadBackendsFailed: 'Не удалось загрузить бэкенды агентов',
      modelSelector: {
        clear: 'Очистить выбор',
        loading: 'Загрузка...',
        placeholder: 'Выберите модель'
      },
      toolCategories: {
        knowledge: 'База знаний',
        mysql: 'MySQL',
        debug: 'Отладка'
      },
      builtinTools: {
        download_kb_file: {
          name: 'Скачать файл',
          desc: 'Скачать исходный файл базы знаний в рабочую область.'
        },
        search_file: {
          name: 'Поиск файлов',
          desc: 'Искать файлы в доступных базах знаний.'
        },
        find_kb_document: {
          name: 'Найти в документе',
          desc: 'Искать ключевые слова или регулярные выражения в файле базы знаний.'
        },
        open_kb_document: {
          name: 'Открыть документ',
          desc: 'Открыть документ базы знаний по окну строк.'
        },
        query_kb: {
          name: 'Поиск в базе знаний',
          desc: 'Искать релевантное содержимое в базе знаний.'
        },
        get_mindmap: {
          name: 'Получить интеллект-карту',
          desc: 'Получить структуру интеллект-карты базы знаний.'
        },
        list_kbs: {
          name: 'Список баз знаний',
          desc: 'Показать базы знаний, доступные текущему пользователю.'
        },
        calculator: {
          name: 'Калькулятор',
          desc: 'Выполнять базовые числовые вычисления.'
        },
        ask_user_question: {
          name: 'Спросить пользователя',
          desc: 'Задать вопрос пользователю, когда нужно уточнение или ключевое решение.'
        },
        ocr_parse_file: {
          name: 'OCR разбор файла',
          desc: 'Разобрать PDF, Office или изображение в текст Markdown.'
        },
        present_artifacts: {
          name: 'Показать артефакты',
          desc: 'Показать файлы результатов из папки outputs рабочей области, чтобы пользователь мог скачать или просмотреть их.'
        },
        web_search: {
          name: 'Веб-поиск',
          desc: 'Искать в интернете актуальные страницы, новости и содержимое сайтов.'
        },
        install_skill: {
          name: 'Установить skill',
          desc: 'Установить Skill в личное пространство текущего пользователя и активировать в этой сессии.'
        }
      },
      form: {
        emptyConfig: 'У этого агента нет параметров конфигурации',
        knowledgeSkillWarning: 'Базы знаний включены, но Skill knowledge-base не выбран. Агент может не суметь искать знания или открывать документы.',
        defaultPlaceholder: 'По умолчанию: {value}'
      },
      fields: {
        model_retry_times: {
          name: 'Повторы вызова модели',
          desc: 'Максимум повторов при сбое вызова модели. По умолчанию {default}.'
        },
        max_execution_steps: {
          name: 'Максимум шагов выполнения',
          desc: 'Максимум шагов LangGraph за один запуск агента (recursion_limit). По умолчанию {default}.'
        },
        summary_l2_trigger_ratio: {
          name: 'Коэффициент запуска L2',
          desc: 'После уплотнения L1 суммаризация L2 запускается, когда оставшийся контекст превышает порог × этот коэффициент. Диапазон 0.1–1.0; меньшие значения запускают L2 раньше. По умолчанию {default}.'
        },
        summary_tool_result_token_limit: {
          name: 'Лимит токенов результата инструмента',
          desc: 'При очистке L1 результаты инструментов сверх этого числа токенов записываются в outputs, а в контексте остаётся только превью этой длины. По умолчанию {default}.'
        },
        summary_prompt: {
          name: 'Промпт суммаризации контекста',
          desc: 'Промпт, используемый при суммаризации контекста. Он должен принимать {messages} как плейсхолдер сообщений для сжатия.'
        },
        summary_keep_messages: {
          name: 'Сообщения после суммаризации',
          desc: 'После суммаризации сохранять столько недавних сообщений помимо сводки. По умолчанию {default}.'
        },
        summary_threshold: {
          name: 'Порог суммаризации контекста (K)',
          desc: 'Когда размер контекста превышает это значение, включается суммаризация. Единица — K токенов. По умолчанию {default}K.'
        },
        skills: {
          name: 'Skills',
          desc: 'Дополнительные Skills. По умолчанию выбраны все Skills, доступные текущему пользователю. Нужные инструменты и сервисы MCP подключаются автоматически.'
        },
        mcps: {
          name: 'Сервисы MCP',
          desc: 'По умолчанию выбраны все сервисы MCP, доступные текущему пользователю.'
        },
        knowledges: {
          name: 'Базы знаний',
          desc: 'Базы знаний берутся из платформа. Создайте их на странице «Знания». По умолчанию выбраны все доступные базы знаний.'
        },
        tools: {
          name: 'Инструменты',
          desc: 'Встроенные инструменты. По умолчанию выбраны все инструменты, доступные текущему пользователю.'
        },
        tool_approval_mode: {
          name: 'Режим одобрения инструментов',
          desc: 'Обычное одобрение спрашивает перед записью файлов, правкой файлов или запуском команд. Всегда доверять выполняет эти инструменты автоматически.',
          options: {
            default: 'Обычное одобрение',
            always_trust: 'Всегда доверять'
          }
        },
        model: {
          name: 'Модель',
          desc: 'Модель, которая управляет агентом. Выбор обязателен.'
        },
        system_prompt: {
          name: 'Системный промпт',
          desc: 'Опишите роль и поведение агента'
        }
      },
      editor: {
        advanced: 'Дополнительно',
        advancedDesc: 'Остальные параметры, не входящие в модель, подсказку, базу знаний, инструменты, MCP, навыки или субагентов',
        navAdvanced: 'Дополнительно',
        basicInfoDesc: 'Настройте имя, описание и бэкенд агента',
        defaultName: 'Новый агент',
        slug: 'Идентификатор',
        slugPlaceholder: 'Необязательно, будет создан автоматически',
        slugDesc: 'После создания используется как ID агента. Оставьте пустым для автогенерации.',
        backend: 'Тип агента',
        backendDesc: 'Выберите тип агента. После создания его нельзя изменить.',
        backendAssistant: 'Ассистент',
        backendSubagent: 'Субагент',
        backendDescAssistant: 'Диалоговый рабочий агент, который может использовать инструменты, базы знаний и субагентов.',
        backendDescSubagent: 'Субагент, вызываемый родительским агентом для отдельной задачи.',
        subagents: 'Субагенты',
        subagentsDesc: 'Выберите субагентов, которых может вызывать этот агент',
        subagentsSelection: 'Область субагентов',
        subagentsSelectionDesc: 'Выберите, каких субагентов может вызывать этот агент',
        subagentsSelect: 'Выбор субагентов',
        subagentsSelectDesc: 'Выберите субагентов для включения',
        noSubagentsAvailable: 'Нет доступных субагентов',
        builtinTools: 'Встроенные инструменты',
        notEditable: 'Этого агента нельзя редактировать',
        readonlyHint: 'Вы можете просмотреть этого агента, но у вас нет прав на управление.',
        nameRequired: 'Введите имя агента',
        modelRequired: 'Выберите модель агента',
        iconUploadType: 'Можно загружать только изображения',
        iconUploadSize: 'Размер изображения не должен превышать {size} МБ',
        iconUploaded: 'Значок загружен',
        iconUploadFailed: 'Не удалось загрузить значок',
        saved: 'Агент сохранён',
        created: 'Агент создан',
        saveFailed: 'Не удалось сохранить агента'
      },
      share: {
        ownerOnly: 'Только владелец',
        none: 'Нет',
        global: 'Глобально',
        department: 'Отдел ({count})',
        user: 'Пользователи ({count})',
        readManage: 'Чтение {read} · Управление {manage}',
        readonly: 'Только чтение {scope}'
      }
    }
  },
  knowledgeStages: {
    copyFailed: 'Не удалось скопировать, выделите текст вручную',
    errorCode: {
      DOCREADER_UNAVAILABLE_SUGGESTION: 'Для этого типа файла нет парсера, или сервис недоступен. Проверьте настройки парсера и повторите попытку.',
      DOCREADER_TIMEOUT_SUGGESTION: 'Файл большой или сервис разбора занят. Разделите файл и повторите попытку, либо проверьте нагрузку на парсер.',
      DOCREADER_PARSE_FAILED_SUGGESTION: 'Файл может быть повреждён, иметь неверную кодировку, или парсер завершился с ошибкой. Проверьте файл и загрузите его снова.',
      CHUNKING_FAILED: 'Не удалось разбить текст на фрагменты',
      CHUNKING_FAILED_SUGGESTION: 'Текст не был разделён. Измените размер фрагмента и запустите разбор снова.',
      EMBEDDING_RATE_LIMIT: 'Запросы эмбеддинга ограничены по частоте',
      EMBEDDING_RATE_LIMIT_SUGGESTION: 'Модель эмбеддинга вернула ограничение частоты. Повторите попытку позже или увеличьте квоту модели.',
      EMBEDDING_PROVIDER_FAIL: 'Не удалось выполнить эмбеддинг',
      EMBEDDING_PROVIDER_FAIL_SUGGESTION: 'Вызов модели эмбеддинга не удался. Проверьте настройки модели, ключ и имя модели, затем повторите попытку.',
      VECTORSTORE_WRITE_FAILED: 'Не удалось записать векторы',
      VECTORSTORE_WRITE_FAILED_SUGGESTION: 'Эмбеддинги созданы, но запись в векторное хранилище не удалась. Проверьте подключение и объём хранилища, затем повторите попытку.',
      MULTIMODAL_VLM_FAILED: 'Не удалось понять изображение',
      MULTIMODAL_VLM_FAILED_SUGGESTION: 'Распознавание или описание изображения не удалось. Проверьте мультимодальную модель и повторите попытку.',
      MULTIMODAL_ALL_FAILED: 'Не удалось понять все изображения',
      MULTIMODAL_ALL_FAILED_SUGGESTION: 'Все задачи по изображениям завершились с ошибкой. Текст документа по-прежнему доступен для поиска. Проверьте мультимодальную модель и повторите попытку.',
      TASK_TIMEOUT: 'Превышено время задачи обработки',
      TASK_TIMEOUT_SUGGESTION: 'Попытки задачи исчерпаны. Запустите разбор позже или разделите большой файл.',
      UNKNOWN: 'Обработка не удалась',
      SERVER_RESTART: 'Обработка прервана перезапуском',
      SERVER_RESTART_SUGGESTION: 'Задача остановилась при перезапуске приложения. Запустите разбор документа снова.',
      UPSTREAM_FAILED: 'Предыдущий этап не удался, поэтому этот отменён',
      UPSTREAM_FAILED_SUGGESTION: 'Более ранний этап не завершился, поэтому этот этап отменён. Исправьте неудачный этап и повторите попытку.',
      QUESTION_FAILED: 'Не удалось сгенерировать вопросы',
      QUESTION_FAILED_SUGGESTION: 'Не удалось создать вопросы для фрагментов. Проверьте модель диалога и повторите попытку.',
      GRAPH_EXTRACT_FAILED: 'Не удалось извлечь граф знаний',
      GRAPH_EXTRACT_FAILED_SUGGESTION: 'Извлечение графа не завершилось. Проверьте настройки модели и повторите попытку.',
      SUMMARY_FAILED: 'Не удалось создать краткое содержание',
      SUMMARY_FAILED_SUGGESTION: 'Краткое содержание документа не создано. Проверьте модель диалога и повторите попытку.',
      DOCREADER_UNAVAILABLE: 'Сервис разбора документов недоступен',
      DOCREADER_TIMEOUT: 'Превышено время разбора документа',
      DOCREADER_PARSE_FAILED: 'Не удалось разобрать документ'
    },
    head: {
      completedWithActiveTrace: 'Processing completed, but {n} trace task(s) remain active',
      postprocessTasks: 'Postprocess: {running} running / {failed} failed / {completed} completed'
    },
    processConfig: {
      chunking: 'Разбиение',
      chunkSize: 'Размер {n}',
      parentChildOn: 'Родительско-дочернее включено',
      parentChildOff: 'Родительско-дочернее выключено',
      parser: 'Движок разбора',
      multimodal: 'Мультимодальность',
      asr: 'Распознавание речи',
      question: 'Генерация вопросов',
      questionOn: 'Вкл., {n}',
      on: 'Вкл.',
      off: 'Выкл.'
    },
    total: 'Всего {d}'
  },
  knowledgeBase: {
    mindmap: 'Карта знаний',
    mindmapGenerate: 'Создать карту знаний',
    mindmapRegenerate: 'Создать заново',
    mindmapFitView: 'Вписать в экран',
    mindmapZoomIn: 'Увеличить',
    mindmapZoomOut: 'Уменьшить',
    mindmapLoading: 'Загрузка...',
    mindmapGenerating: 'AI генерирует карту знаний...',
    mindmapEmpty: 'Карты знаний пока нет. Создайте её из списка файлов базы знаний.',
    mindmapDescription: 'Создать структуру по списку файлов базы знаний',
    mindmapGenerated: 'Карта знаний создана',
    mindmapLoadFailed: 'Не удалось загрузить карту знаний',
    mindmapGenerateFailed: 'Не удалось создать карту знаний',
    mindmapNotFound: 'API карты знаний не найден. Перезапустите сервер платформа и примените миграции базы данных.',
    tagNameTooLong: 'Название тега не более {max} символов',
    moreFiltersShow: 'Показать фильтры',
    moreFiltersHide: 'Скрыть фильтры',
    accessInfo: {
      fromOrg: 'Из тенанта'
    },
    allUploadFailed: 'Все файлы не удалось загрузить ({count})',
    allUploadSuccess: 'Все файлы загружены ({count})',
    batchTagAvailableSection: 'Доступные',
    batchTagNoSelected: 'Ничего не выбрано',
    batchTagSelectedSection: 'Выбранные',
    fileExists: 'Файл уже существует',
    partialUploadSuccess: 'Частичная загрузка (успешно: {success}, ошибки: {fail})',
    tagClearAction: 'Очистить выбор',
    tagEditAvailableSection: 'Доступные',
    tagEditNoSelected: 'Ничего не выбрано',
    tagEditSearch: 'Поиск тегов...',
    tagEditSelectedSection: 'Выбранные',
    tagNewPlaceholder: 'Название нового тега, Enter для добавления',
    uploadAllFailed: 'Все файлы не удалось загрузить',
    uploadAllSuccess: 'Успешно загружено {count} файлов!',
    uploadFailed: 'Ошибка загрузки файла!',
    uploadPartialSuccess: 'Загрузка завершена: успешно {success}, ошибка {fail}',
    uploadSuccess: 'Файл успешно загружен!',
    uploadingFolder: 'Загрузка {total} файлов из папки...',
    selectKnowledgeBase: 'Выберите базу знаний'
  },
  resourceOrigin: {
    tenant: 'Рабочая область',
    tenantTooltip: 'Создано другим участником рабочей области',
    spaceTooltipWithTenant: 'Через тенант "{space}" · от {tenant}',
    sharedTooltip: 'Доступ из внешнего тенанта через общее тенант'
  },
  listSpaceSidebar: {
    workspace: 'Рабочая область'
  },
  contextualGuide: {
    agentCreate: {
      steps: {
        navTools: {
          desc: 'В режиме умного рассуждения включите встроенные инструменты и MCP для поиска, кода и др.'
        },
        name: {
          desc: 'Укажите узнаваемое имя. В режиме умного рассуждения может подставиться значение по умолчанию.'
        },
        mode: {
          desc: '«Быстрый ответ» для простого Q&A; «Умное рассуждение» — инструменты и многошаговое мышление для сложных задач.'
        }
      }
    },
    kbCreate: {
      steps: {
        storage: {
          desc: 'Где хранятся исходные файлы (локально или объектное хранилище). Обычно достаточно значения тенанта.'
        }
      }
    },
    tenantModels: {
      steps: {
        done: {
          desc: 'После сохранения моделей закройте настройки и нажмите «Создать базу знаний». Мастер проведёт через тип, индексацию и привязку моделей.'
        }
      }
    },
    kbList: {
      steps: {
        create: {
          desc: 'В базах знаний хранятся документы и FAQ. Нажмите выделенную кнопку «Создать базу знаний» ниже — мы проведём вас по форме.'
        }
      }
    }
  },
  newUserGuide: {
    steps: {
      knowledge: {
        desc: 'С этого всё начинается: загружайте документы, веб-страницы или FAQ, и @:{\'brand.name\'} автоматически разберёт и проиндексирует их. Нажмите здесь, чтобы открыть базы знаний.'
      },
      welcome: {
        title: 'Добро пожаловать в @:{\'brand.name\'}'
      }
    }
  },
  chatEngine: {
    switchLabel: 'Выбор типа',
    platform: 'Диалог',
    chatWork: 'Работа',
    lockedHint: 'В этом диалоге уже есть сообщения, тип изменить нельзя'
  },
  harness: {
    history: {
      recent: 'Недавние',
      empty: 'Пока нет диалогов',
      loadMore: 'Загрузить ещё'
    },
    chat: {
      viewState: 'Статус',
      viewFiles: 'Файлы',
      state: 'Статус',
      refreshState: 'Обновить статус',
      loadingMessages: 'Загрузка сообщений...',
      generating: 'Генерация ответа...',
      compressing: 'Сжатие контекста...',
      queuedCount: 'В очереди ({count})...',
      queuedRequests: 'Запросы в очереди',
      queuedRequest: 'Запрос в очереди',
      deleteQueued: 'Удалить запрос в очереди: {content}',
      continueQueue: 'Продолжить очередь',
      queuePausedCancelled: 'Текущая задача остановлена. Последующие запросы приостановлены.',
      queuePausedFailed: 'Предыдущая задача завершилась ошибкой. Последующие запросы приостановлены.',
      queueWaiting: 'Текущая задача ждёт ответа или подтверждения. Остальные запросы продолжатся после этого.',
      steerNext: 'Приоритет · следующий',
      steer: 'Приоритет',
      steerHint: 'Выполнить это сообщение сразу после текущего шага',
      selectModel: 'Выбрать модель',
      todos: 'Задачи',
      files: 'Файлы',
      artifacts: 'Артефакты',
      artifactCount: '{count} артефактов',
      openFile: 'Открыть {name}',
      emptyState: 'Статус пока пуст',
      contextUsage: 'Использование контекста',
      tokenComposition: 'Состав токенов',
      systemPrompt: 'Системный промпт',
      toolDefs: 'Определения инструментов ({count})',
      contentMessages: 'Сообщения содержимого',
      toolMessages: 'Сообщения инструментов',
      summary: 'Сводка',
      compressed: 'Сжато',
      other: 'Другое',
      windowRemaining: 'Окно / остаток',
      unknownFile: 'Неизвестный файл',
      deliveryFile: 'Артефакт',
      deliveryFileExt: 'Артефакт · {ext}',
      subagent: 'Субагент',
      agent: 'Агент',
      assistant: 'Ассистент',
      file: 'Файл',
      attachment: 'Вложение',
      approvalSaveFailed: 'Не удалось сохранить режим подтверждения',
      createFailed: 'Не удалось создать диалог. Попробуйте ещё раз.',
      queuedDeleted: 'Запрос удалён из очереди',
      steered: 'Назначен следующим приоритетным запросом',
      queueContinued: 'Очередь возобновлена',
      cancelSent: 'Запрос на отмену отправлен',
      invalidQuestion: 'Некорректный вопрос',
      threadNotFound: 'Диалог не найден',
      runNotFound: 'Запуск для возобновления не найден',
      approvalRestoreFailed: 'Не удалось восстановить состояние подтверждения. Обновите страницу.',
      mentionEmpty: 'Нечего упомянуть',
      dropToUpload: 'Отпустите, чтобы загрузить',
      addAttachment: 'Добавить вложение',
      uploadedImage: 'Загруженное изображение',
      thinking: 'Думаю...',
      reasoning: 'Рассуждение',
      calledTool: 'Вызов: {name}',
      calledTools: 'Вызвано инструментов: {count}',
      toolCompleted: 'Завершено',
      toolFailedCount: '{count} с ошибкой',
      toolRunningCount: '{count} выполняется',
      toolSucceeded: 'Инструмент {name} выполнен',
      toolFailed: 'Инструмент {name} завершился с ошибкой',
      toolCalling: 'Вызов инструмента: {name}',
      toolParams: 'Параметры',
      toolFailedStatus: 'Ошибка',
      toolRunningStatus: 'Выполняется',
      errorInterrupted: 'Генерация прервана',
      errorGuard: 'Обнаружено чувствительное содержимое. Вывод остановлен.',
      errorUnexpected: 'Ошибка при генерации',
      errorAgent: 'Не удалось загрузить агента',
      unknownError: 'Неизвестная ошибка',
      stoppedHint: 'Вы остановили этот ответ',
      reedit: 'Изменить вопрос',
      switchBound: 'Этот диалог привязан к агенту. Создайте новый диалог, чтобы сменить агента.',
      switchFailed: 'Не удалось сменить агента',
      removeAttachment: 'Удалить вложение {name}',
      download: 'Скачать',
      save: 'Сохранить',
      saving: 'Сохранение',
      cancel: 'Отмена',
      delete: 'Удалить',
      retry: 'Повторить',
      preview: 'Просмотр',
      source: 'Исходный код',
      edit: 'Изменить',
      unsaved: 'Не сохранено',
      fullscreenPreview: 'Полноэкранный просмотр',
      copyCode: 'Копировать код',
      copied: 'Скопировано',
      htmlPreview: 'Просмотр HTML',
      collapsePreview: 'Свернуть просмотр',
      closePreview: 'Закрыть просмотр',
      close: 'Закрыть',
      previewFailed: 'Не удалось открыть файл',
      previewUnsupported: 'Этот тип файла нельзя просмотреть. Скачайте его, чтобы открыть.',
      loading: 'Загрузка',
      saveToWorkspace: 'Сохранить в рабочую область',
      savedToWorkspace: 'Сохранено в рабочую область: {path}',
      downloadFailed: 'Не удалось скачать файл',
      saveToWorkspaceFailed: 'Не удалось сохранить в рабочую область',
      panel: {
        title: 'Файлы',
        hideFileList: 'Скрыть список файлов',
        showFileList: 'Показать список файлов',
        refresh: 'Обновить',
        closePanel: 'Закрыть панель файлов',
        previewEmptyTitle: 'Выберите артефакт, чтобы просмотреть его здесь',
        previewEmptyDesc: 'Можно также открыть список файлов и просмотреть рабочую область.',
        createThreadHint: 'Начните диалог, чтобы увидеть рабочую область',
        loadingFs: 'Загрузка файловой системы...',
        loadFsFailed: 'Не удалось загрузить файловую систему',
        emptyWorkspace: 'Рабочая область пуста',
        downloadFile: 'Скачать файл',
        deleteFile: 'Удалить файл',
        deleteFolder: 'Удалить папку',
        confirmDeleteFile: 'Удалить файл «{name}»?',
        confirmDeleteFolder: 'Удалить папку «{name}»?',
        deleteFolderContent: 'Папка и всё её содержимое будут удалены. Это действие нельзя отменить.',
        deleteIrreversible: 'Это действие нельзя отменить.',
        deleteFileSuccess: 'Файл удалён',
        deleteFolderSuccess: 'Папка удалена',
        deleteFileFailed: 'Не удалось удалить файл',
        deleteFolderFailed: 'Не удалось удалить папку'
      }
    },
    tokenGate: {
      title: 'Подключить работу',
      sidebarHint: 'Войдите, чтобы увидеть рабочие диалоги.',
      sidebarAction: 'Войти'
    }
  },
  menu: {
    skillsTools: 'Навыки · Инструменты',
    workspace: 'Рабочая область',
    dashboard: 'Обзор данных',
    newChat: 'Новый диалог'
  },
  workspacePage: {
    subtitle: 'Управляйте файлами, папками и предпросмотром в личных и рабочих областях баз знаний',
    guide: 'Справка',
    newFolder: 'Новая папка',
    uploadFile: 'Загрузить',
    collapseSidebar: 'Свернуть боковую панель рабочей области',
    expandSidebar: 'Развернуть боковую панель рабочей области',
    rootLabel: 'Рабочая область',
    resizePreview: 'Изменить ширину предпросмотра',
    knowledgeTitle: 'База знаний',
    knowledgePlaceholder: 'Выберите доступную базу знаний, чтобы просмотреть файлы.',
    createFolderTitle: 'Новая папка',
    create: 'Создать',
    cancel: 'Отмена',
    folderNamePlaceholder: 'Введите имя папки',
    folderNameRequired: 'Введите имя папки',
    agentsGuideTitle: 'Справка по папке Agents',
    agentsGuideOk: 'Понятно',
    agentsGuideP1: 'Файлы инструкций в этой папке при необходимости подставляются в процесс агента, чтобы учесть долгосрочные предпочтения, рабочий контекст и правила взаимодействия.',
    agentsGuideP2: 'Поддерживаются AGENTS.md, USER.md и MEMORY.md. Их содержимое добавляется в промпт агента в каждом сеансе: правила поведения, сведения о пользователе и факты, которые агент должен помнить.',
    agentsGuideTipsTitle: 'Рекомендации по заполнению',
    agentsGuideTip1: 'Опишите обычный рабочий контекст: обязанности команды, типичные задачи и использование баз знаний.',
    agentsGuideTip2: 'Опишите предпочтения по ответам: тон, подробность и нужно ли начинать с вывода.',
    agentsGuideTip3: 'Перечислите термины и устойчивые названия, чтобы агент сохранял единый стиль.',
    agentsGuideTip4: 'Опишите правила работы с источниками: какие базы знаний предпочитать и что нужно дополнительно проверять.',
    agentsGuideTip5: 'Задайте границы взаимодействия: спрашивать при неуверенности и предлагать план перед важными действиями.',
    agentsGuideTip6: 'Пишите ясные и выполнимые правила. Избегайте расплывчатых формулировок вроде «сделай как можно лучше».',
    chatsLabel: 'История диалогов',
    loadPreviewFailed: 'Не удалось загрузить предпросмотр файла',
    loadDirFailed: 'Не удалось загрузить папку рабочей области',
    loadKnowledgeDirFailed: 'Не удалось загрузить папку базы знаний',
    knowledgeFallback: 'База знаний',
    readonlyCannotSave: 'Этот файл доступен только для чтения и не может быть сохранён',
    saveSuccess: 'Файл сохранён',
    saveFailed: 'Не удалось сохранить файл',
    createFolderSuccess: 'Папка создана',
    createFolderFailed: 'Не удалось создать папку',
    uploadLimit: 'За один раз можно загрузить не больше {count} файлов',
    uploadSuccess: 'Загружено файлов: {count}',
    uploadFailed: 'Не удалось загрузить файлы',
    confirmDeleteSelected: 'Удалить выбранные элементы ({count})?',
    deleteSelectedSuccess: 'Выбранные элементы удалены',
    deleteSuccess: 'Удалено',
    deleteFailed: 'Не удалось удалить',
    personal: 'Личная рабочая область',
    quickAccess: 'Быстрый доступ',
    savedArtifacts: 'Сохранённые артефакты',
    agentFiles: 'Файлы агента',
    myKnowledge: 'Мои базы знаний',
    sharedKnowledge: 'Общие базы знаний',
    loadingKnowledge: 'Загрузка баз знаний...',
    loadingPreview: 'Загрузка предпросмотра...',
    selectToPreview: 'Выберите файл для предпросмотра',
    previewHint: 'Markdown и TXT можно редактировать. Остальные форматы доступны только для чтения.',
    emptyFolder: 'Эта папка пуста',
    multiSelect: 'Множественный выбор',
    deleteSelected: 'Удалить выбранное',
    moreActions: 'Другие действия',
    name: 'Имя',
    size: 'Размер',
    modifiedAt: 'Изменено',
    actions: 'Действия',
    itemCount: '{count} элем.',
    filePath: 'Путь к файлу',
    refresh: 'Обновить'
  },
  dashboard: {
    subtitle: 'Сводка по платформе: диалоги, агенты, вызовы инструментов и базы знаний',
    loadFailed: 'Не удалось загрузить статистику',
    loadPartial: 'Подробная статистика недоступна, показаны только базовые данные',
    loadNone: 'Не удалось загрузить статистику',
    feedback: {
      title: 'Отзывы пользователей'
    },
    knowledge: {
      title: 'Использование баз знаний',
      total: 'Базы знаний',
      files: 'Файлы',
      storage: 'Хранилище',
      unit: '',
      fileTypes: 'Типы файлов',
      unknownType: 'Неизвестно',
      noData: 'Нет данных',
      sourcePlatform: 'Только базы знаний платформы'
    },
    tools: {
      title: 'Монитор инструментов',
      totalCalls: 'Всего вызовов',
      failedCalls: 'Неуспешные',
      successRate: 'Успешность',
      times: '',
      top10: 'Самые используемые инструменты ТОП 10',
      errorAnalysis: 'Анализ ошибок',
      errorDistribution: 'Распределение ошибок',
      toolName: 'Инструмент',
      errorCount: 'Ошибки'
    },
    agents: {
      title: 'Анализ агентов',
      total: 'Агенты',
      conversations: 'Диалоги',
      toolCalls: 'Вызовы инструментов',
      unit: '',
      times: '',
      distribution: 'Диалоги / вызовы инструментов (ТОП 3)',
      topPerformers: 'ТОП-5 агентов',
      rank: 'Ранг',
      agent: 'Агент',
      score: 'Оценка',
      conversationCount: 'Диалоги',
      toolCallCount: 'Вызовы инструментов'
    },
    users: {
      title: 'Тренд активности пользователей',
      active24h: 'Активны за 24 ч',
      active30d: 'Активны за 30 дн.',
      last7days: 'Последние 7 дней',
      series: 'Активные пользователи'
    },
    calls: {
      title: 'Статистика вызовов',
      hours: 'Последние 14 часов',
      days: 'Последние 14 дней',
      weeks: 'Последние 14 недель',
      weekLabel: 'Неделя {week}',
      models: 'Вызовы моделей',
      agents: 'Вызовы агентов',
      tokens: 'Расход токенов',
      tools: 'Вызовы инструментов',
      unknownModel: 'Неизвестная модель',
      input: 'Ввод',
      output: 'Вывод',
      total: 'Всего: {value}'
    },
    stats: {
      conversations: 'Сессии',
      activeConversations: 'Активные чаты',
      messages: 'Сообщения',
      users: 'Пользователи',
      chat: 'Диалог',
      work: 'Работа'
    }
  },
  brand: {
    name: '智能体操作端'
  },
  mcpMetadata: {
    fullSchema: 'Полное определение',
    refresh: 'Обновить Tools'
  }
}
