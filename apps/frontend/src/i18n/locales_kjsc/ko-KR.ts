export default {
  modelCatalog: {
    description: '모델 카탈로그는 모델 추가 시 선택할 수 있는 모델 목록과 컨텍스트 창, 추론 지원 여부 같은 기본값을 정의합니다. 여기서 변경하면 모든 테넌트에 즉시 적용됩니다.',
    layers: {
      explicit: '테넌트에서 모델 설정에 입력한 값이 항상 우선하며, 저장된 모델은 다시 쓰이지 않습니다.'
    },
    fieldsHint: '테넌트에서 모델 설정에 입력한 값이 계속 우선합니다. 입력란을 비우면 기본값으로 돌아갑니다.',
    historyRestoreConfirm: '버전 {version}의 설정으로 복원하고 모든 테넌트에 즉시 적용할까요?'
  },
  toolbox: {
    unavailable: '현재 테넌트에서 사용할 수 있는 도구가 없습니다.'
  },
  localBrowser: {
    viewOnly: '이 대화의 브라우저 화면은 보기만 가능',
    windowHint: '작업은 별도의 브라우저 Agentic 창에서 실행됩니다. 기존 탭을 빌리려면 권한이 필요합니다.',
    usageStep2Text: '페어링 링크를 확장 프로그램의 연결 설정 → 원격 연결에 붙여넣고 서버를 확인하세요. 한 번 연결하면 테넌트 내 모든 대화에서 공유됩니다.'
  },
  platformApiKeys: {
    description: '워크스페이스 간 자동화를 위한 플랫폼 자격 증명입니다. 워크스페이스 API에는 X-Tenant-ID를 사용하세요.',
    securityNotice: '플랫폼 API 키는 모든 테넌트를 선택할 수 있습니다. 필요한 권한만 부여하고, 한 번 표시되는 키를 안전하게 보관하세요.',
    createDescription: '플랫폼 키는 테넌트에 고정되지 않지만 모든 작업은 권한으로 제한됩니다.',
    capabilityHint: '테넌트 권한은 X-Tenant-ID 대상에, 시스템 권한은 플랫폼 제어 API에 적용됩니다.',
    capabilityHints: {
      tenantsRead: '모든 테넌트를 조회하고 검색합니다.',
      tenantsManage: '테넌트를 생성, 수정, 삭제합니다.'
    },
    capabilities: {
      tenantsRead: '테넌트 조회',
      tenantsManage: '테넌트 관리'
    }
  },
  tenantInvitation: {
    errors: {
      alreadyMember: '이 사용자는 이미 멤버입니다.'
    },
    myInbox: {
      description: '다른 워크스페이스의 초대 목록입니다.',
      tenantLabel: '테넌트'
    },
    shareLink: {
      description: '여러 명이 사용할 수 있는 가입 링크를 생성합니다. 받은 사람이 자신의 이메일로 가입하고 이 테넌트에 합류합니다. {days}일 후 만료되며, 목록에서 언제든지 취소할 수 있습니다.'
    }
  },
  tenantMember: {
    sectionDescription: '현재 테넌트에 멤버를 추가하고 역할을 지정합니다. 소유자만 멤버를 추가, 편집 또는 제거할 수 있습니다.',
    listTitle: '테넌트 멤버',
    empty: '아직 멤버가 없습니다. 오른쪽 위 버튼으로 멤버를 추가하세요.',
    searchPlaceholder: '이름, 로그인 계정 또는 이메일로 검색',
    audit: {
      description: '이 테넌트의 멤버 변경 및 접근 거부 이벤트를 최신순으로 기록합니다. 1분 이내의 반복 거부는 자동으로 중복 제거됩니다.',
      outcome: {
        accepted: '수락됨',
        canceled: '취소됨',
        failed: '실패',
        partial: '일부 완료'
      }
    },
    errors: {
      emailExists: '이미 사용 중인 이메일입니다',
      usernameRequired: '사용자명을 입력하세요',
      usernameMinLength: '사용자명은 2자 이상이어야 합니다',
      usernameMaxLength: '사용자명은 20자를 넘을 수 없습니다',
      usernameInvalid: '사용자명은 문자, 숫자, 밑줄, 한글만 사용할 수 있습니다',
      usernameExists: '이미 사용 중인 사용자명입니다',
      accountRequired: '로그인 계정을 입력하세요',
      accountInvalid: '로그인 계정은 문자와 숫자만 사용할 수 있으며 20자를 넘을 수 없습니다',
      accountExists: '이미 사용 중인 로그인 계정입니다',
      accountLocked: '로그인 계정이 이미 설정되어 변경할 수 없습니다',
      passwordRequired: '비밀번호를 입력하세요',
      passwordMinLength: '비밀번호는 8자 이상이어야 합니다',
      passwordMaxLength: '비밀번호는 32자를 넘을 수 없습니다',
      passwordLetter: '비밀번호에 문자가 포함되어야 합니다',
      passwordNumber: '비밀번호에 숫자가 포함되어야 합니다',
      passwordPolicy: '비밀번호는 8-32자이며 문자와 숫자를 모두 포함해야 합니다',
      confirmPasswordRequired: '비밀번호를 다시 입력하세요',
      passwordMismatch: '두 비밀번호가 일치하지 않습니다',
      alreadyMember: '이미 이 테넌트의 멤버입니다'
    },
    leave: {
      confirmTitle: '이 테넌트에서 나가시겠어요?',
      confirmBody: '이 테넌트의 모든 지식 베이스와 에이전트에 접근할 수 없게 됩니다. 나중에 다시 초대받을 수 있습니다.',
      success: '테넌트에서 나갔습니다'
    },
    remove: {
      confirmBody: '{name} 님을 이 테넌트에서 제거하시겠어요? 즉시 접근 권한이 해제됩니다.'
    },
    edit: {
      button: '편집',
      dialogTitle: '멤버 편집',
      success: '멤버를 업데이트했습니다',
      accountHintEmpty: '현재 비어 있어 입력할 수 있습니다. 저장 후에는 변경할 수 없습니다',
      accountHintLocked: '로그인 계정이 이미 설정되어 변경할 수 없습니다'
    },
    add: {
      button: '멤버 추가',
      dialogTitle: '멤버 추가',
      success: '멤버를 추가했습니다',
      usernameLabel: '사용자명',
      usernamePlaceholder: '사용자명 입력',
      accountLabel: '로그인 계정',
      accountPlaceholder: '문자와 숫자, 20자 이내',
      accountHint: '저장 후에는 변경할 수 없습니다',
      emailPlaceholder: '이메일 입력',
      emailHint: '이메일은 중복될 수 없습니다',
      passwordLabel: '비밀번호',
      passwordPlaceholder: '8-32자, 문자와 숫자 포함',
      confirmPasswordLabel: '비밀번호 확인',
      confirmPasswordPlaceholder: '비밀번호를 다시 입력'
    },
    columns: {
      member: '이름과 로그인 계정'
    },
    permissions: {
      desc: '각 역할이 이 테넌트에서 할 수 있는 작업입니다. 서버에서 적용되며 UI 컨트롤은 표시만 합니다.',
      manageTenantConfig: '테넌트 설정 변경',
      readAll: '테넌트 콘텐츠 조회'
    }
  },
  integrations: {
    cli: {
      title: 'Agentic CLI'
    },
    claw: {
      title: 'Agentic Skill',
      subtitle: '@:{\'brand.name\'} REST API로 문서를 가져오고 하이브리드 검색(벡터+키워드)을 수행합니다. 파일/URL/Markdown 업로드 및 검색에 사용.',
      installCtaHint: 'Agentic Skill 설치 · 새 탭에서 열림'
    },
    chrome: {
      subtitle: '자체 호스팅 @:{\'brand.name\'}와 함께: 사이드바에서 질문하고, 웹 페이지를 클리핑하며, Markdown 메모를 지식베이스에 저장하세요.',
      steps: {
        port: {
          desc: '@:{\'brand.name\'} 데스크톱에서는 API 정보에서 고정 포트(예: 37841)를 설정하세요.'
        }
      }
    },
    api: {
      apiKeyAccessTypeHint: '"지식베이스"는 아래 권한 수준에 따라 지식베이스 범위 내에서 작동합니다. "테넌트 전체 접근"은 모델, 데이터 소스 등 모든 테넌트 수준 API를 추가로 사용할 수 있습니다.',
      apiKeyCapabilityGroupCollaboration: '멤버 및 테넌트',
      apiKeyCapabilityGroupTenant: '테넌트 설정',
      capabilityTenantFull: '테넌트 전체 접근',
      capabilityTenantFullHint: '모델, 벡터 스토어, 데이터 소스, 채널 등 모든 테넌트 수준 API를 허용합니다. 지식베이스 범위는 적용되지 않습니다.',
      capabilityIngestHint: '허용된 지식베이스에 콘텐츠를 작성할 수 있습니다(문서 업로드, 청크/FAQ/태그/wiki 편집). 지식베이스나 에이전트를 새로 만들 수 없고, 지식베이스를 비울 수 없으며, 선택한 지식베이스 범위로 제한됩니다.',
      capabilityManageKbsHint: '지식베이스 전체 수명 주기를 관리할 수 있습니다: 생성, 복사, 수정, 삭제 및 초기화/설정 변경. 기존 지식베이스에 대한 작업(복사/수정/삭제)은 선택한 범위로 제한되며, 새 지식베이스 생성은 제한되지 않습니다(새 지식베이스는 이 테넌트에 속함).',
      capabilityMessageHistoryHint: '테넌트 채팅 기록 검색과 채팅 기록 통계 조회를 허용합니다. 테넌트 설정 권한은 부여하지 않습니다.',
      capabilityManageModelsHint: '모델 설정, 자격 증명, 연결 테스트 및 클라우드 서비스 자격 증명을 관리합니다.',
      capabilityManageStorageBackendsHint: '객체/파일 스토리지 백엔드 인스턴스(예: S3 호환 또는 로컬 파일 스토리지)의 CRUD, 연결 테스트 및 테넌트 기본 스토리지 설정을 관리합니다.',
      capabilityManageMembersHint: '워크스페이스 멤버, 역할, 초대 및 초대 링크를 조회하고 관리할 수 있습니다. API Key 관리, 워크스페이스 삭제 또는 소유권 이전은 포함하지 않습니다.',
      capabilityManageSpaces: '공간 관리',
      capabilityManageSpacesHint: '조직/테넌트, 가입 흐름, 테넌트 멤버, 초대 및 공유 테넌트 표시를 관리할 수 있습니다. 지식베이스 또는 에이전트 공유 관리는 부여하지 않습니다.',
      capabilityManageTenantSettings: '테넌트 설정 관리',
      capabilityManageTenantSettingsHint: 'API 최종 사용자 식별 모드, 요청 헤더 설정, 워크스페이스 KV 설정 등 워크스페이스 수준 통합 설정을 읽고 업데이트합니다. API Key 관리, 멤버 관리, 워크스페이스 삭제 또는 소유권 이전은 포함하지 않습니다.',
      modeTenant: '테넌트만',
      signedFlowDetail: 'HMAC secret은 @:{\'brand.name\'}와 신뢰할 수 있는 백엔드에만 보관하세요. 요청에 넣거나 브라우저에 배포하지 마세요. 요청 헤더에는 secret이 아니라 해당 secret으로 서명한 JWT 문자열을 넣습니다(발급마다 또는 만료 후 변경). JWT에는 sub(외부 사용자 ID), tenant_id, aud=weknora, exp(최대 24시간)가 필요합니다.',
      requireDirectHeaderDesc: '켜면 사용자 ID 헤더가 없는 API Key 요청을 거부하고, 끄면 테넌트 전체로 통일 처리하며 개별 사용자를 구분하지 않습니다.',
      hmacSecretDesc: '@:{\'brand.name\'}에 저장된 것과 동일한 secret. 백엔드에서 JWT 서명에만 사용하며 요청 헤더로 보내지 않습니다.',
      playgroundTenantModeHint: '워크스페이스 전용 모드는 외부 사용자 ID를 보내지 않으며 모든 API 세션이 동일한 워크스페이스 주체에 속합니다.',
      playgroundNeedApiKey: '현재 테넌트에 API Key가 없습니다.',
      editApiKeyScopeHint: '비워 두면 이 테넌트의 모든 지식베이스를 허용합니다. 모든 변경 사항은 즉시 적용됩니다.'
    },
    mcpserver: {
      subtitle: '이 테넌트를 MCP 서버로 게시하여 Claude Desktop, Cursor, Claude Code 등 MCP 클라이언트가 직접 연결하게 합니다. 엔드포인트마다 별도의 토큰, 지식 베이스 범위, 도구 목록을 가집니다.',
      kbScopePlaceholder: '비워 두면 테넌트의 모든 지식 베이스',
      kbScopeHint: '검색, 질문, 쓰기 도구 모두 이 범위 안에서만 동작합니다. 비워 두면 테넌트 전체입니다.'
    }
  },
  datasource: {
    resumeFailed: '재개 실패'
  },
  agentEditor: {
    agentType: {
      kbMismatch: {
        quickAnswer: '즉시 질의 모드는 RAG 검색이 필요합니다'
      }
    },
    im: {
      descriptionRestricted: '에이전트를 기업 WeChat(WeCom), Feishu, DingTalk에 연결'
    },
    desc: {
      memoryEnabled: '이 에이전트가 장기 기억을 읽고 추가하도록 허용합니다. 끄면 이 에이전트와의 대화에서 기억을 읽지도, 새로 추가하지도 않습니다. 테넌트 또는 개인 설정이 꺼져 있으면 여기서 켜도 적용되지 않습니다'
    }
  },
  kbSettings: {
    parser: {
      engines: {
        weknoracloud: {
          name: '클라우드 서비스',
          desc: '클라우드 서비스를 통한 문서 파싱'
        },
        anydoc: {
          desc: '프로세스 내에서 실행되는 Office 문서 파싱 엔진 (외부 서비스 불필요)'
        }
      }
    },
    vectorStore: {
      engineDesc: '전역 벡터 스토어 설정에서 등록한 스토어를 선택하거나, \'시스템 기본값\'을 유지하면 테넌트의 RETRIEVE_DRIVER 엔진을 사용합니다.'
    }
  },
  organization: {
    subtitle: '공유 테넌트를 만들거나 참여하여 여러 테넌트가 함께 협업하고 지식베이스와 에이전트를 공유하세요.',
    addMember: {
      tipTenant: '구성원의 최소 단위는 워크스페이스입니다: 한 워크스페이스가 가입하면 해당 워크스페이스의 모든 사용자가 이 스페이스 접근 권한을 공유합니다. 아래 결과는 워크스페이스 기준으로 중복 제거됩니다.',
      searchTenant: '테넌트 ID',
      searchTenantPlaceholder: '정확한 테넌트 ID 입력',
      searchTenantHint: '정확한 워크스페이스 ID로 조회하거나 초대 링크를 공유하세요.'
    },
    settings: {
      membersDesc: '테넌트 구성원과 역할을 조회·관리합니다. 각 구성원은 하나의 테넌트를 의미하며, 같은 테넌트의 모든 사용자가 이 테넌트 접근 권한을 공유합니다.'
    },
    join: {
      alreadyMember: '귀하는 이미 이 공유 테넌트의 회원입니다.',
      confirmTitle: '공유 테넌트에 참여하려면 확인하세요.',
      failed: '공유 테넌트에 참여하지 못했습니다.',
      goToOrganizations: '공유 테넌트 목록으로 이동',
      joining: '공유 테넌트에 참여하는 중..',
      success: '성공적으로 공유 테넌트에 합류했습니다!'
    },
    rbac: {
      needTenantAdminTip: '이 작업은 현재 테넌트에서 admin 이상 역할이 필요합니다. 테넌트 소유자에게 문의하세요.',
      cannotCreate: '현재 테넌트 역할이 부족하여 공유 테넌트을 만들 수 없습니다',
      cannotJoin: '현재 테넌트 역할이 부족하여 공유 테넌트에 가입하거나 가입을 신청할 수 없습니다',
      cannotManage: '현재 테넌트 역할이 부족하여 공유 테넌트을 관리할 수 없습니다'
    },
    joinFailed: '공유 테넌트에 참여하지 못했습니다.',
    joinSuccess: '공유 테넌트에 성공적으로 참여했습니다.'
  },
  mcpServiceDialog: {
    viewTitle: 'MCP 서비스 보기',
    testResultTitle: '테스트 결과',
    stdioLaunch: '실행 명령'
  },
  modelSettings: {
    debug: {
      thinkOff: '사고 꺼짐',
      thinkOn: '사고 켜짐',
      thinking: '사고 모드',
      thinkingDesc: '사고 모드를 지원하는 모델에만 적용됩니다'
    },
    builtinModels: {
      description: '기본 제공 모델은 모든 테넌트에게 표시됩니다. 민감한 정보는 숨겨지며, 편집하거나 삭제할 수 없습니다.',
      descriptionAdmin: '기본 제공 모델은 모든 테넌트에게 표시됩니다. 시스템 관리자는 구성과 자격 증명을 편집할 수 있으며, 삭제는 배포 구성에서 관리됩니다.'
    }
  },
  mcpSettings: {
    view: '보기'
  },
  platform: {
    independentTenant: '독립 테넌트'
  },
  theme: {
    switchToLight: '라이트 모드로 전환',
    switchToDark: '다크 모드로 전환'
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
          description: 'moonshotai/kimi-k2.5, zai-org/glm-5, minimax/minimax-m2.7, qwen/qwen3-embedding-0.6b 등'
        },
        nvidia: {
          label: 'NVIDIA',
          description: 'deepseek-ai-deepseek-v3_1, nv-embed-v1, rerank-qa-mistral-4b, etc.'
        },
        lkeap: {
          label: '텐센트 클라우드 LKEAP',
          description: 'DeepSeek-R1, DeepSeek-V3, lke-reranker-base 등'
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
          description: 'gemini-3-flash-preview, gemini-2.5-pro 등'
        },
        mimo: {
          label: 'MiMo',
          description: 'mimo-v2-flash'
        },
        minimax: {
          label: 'MiniMax',
          description: 'MiniMax-M3, MiniMax-M2.7, MiniMax-M2.7-highspeed 등'
        },
        hunyuan: {
          label: 'Hunyuan',
          description: 'hunyuan-pro, hunyuan-standard, hunyuan-embedding 등'
        },
        deepseek: {
          label: 'DeepSeek',
          description: 'deepseek-chat, deepseek-reasoner 등'
        },
        volcengine: {
          label: 'Volcengine',
          description: 'doubao-1-5-pro-32k-250115, doubao-embedding-vision-250615 등'
        },
        jina: {
          label: 'Jina',
          description: 'jina-clip-v1, jina-embeddings-v2-base-zh, etc.'
        },
        siliconflow: {
          label: 'SiliconFlow',
          description: 'deepseek-ai/DeepSeek-V3.1 등'
        },
        generic: {
          label: '사용자 정의 (OpenAI 호환)',
          description: 'Generic API endpoint'
        },
        requesty: {
          label: 'Requesty',
          description: 'openai/gpt-4o-mini, anthropic/claude-sonnet-4-5 등'
        },
        openrouter: {
          label: 'OpenRouter',
          description: 'openai/gpt-5.2-chat, google/gemini-3-flash-preview 등'
        },
        zhipu: {
          label: 'Zhipu BigModel',
          description: 'glm-4.7, embedding-3, rerank, etc.'
        },
        aliyun: {
          label: 'Aliyun DashScope',
          description: 'qwen-plus, tongyi-embedding-vision-plus, qwen3-rerank 등'
        },
        azure_openai: {
          label: 'Azure OpenAI',
          description: 'Microsoft Azure에서 호스팅되는 OpenAI 서비스'
        },
        anthropic: {
          label: 'Anthropic',
          description: 'Claude models via native Anthropic Messages API'
        },
        openai: {
          label: 'OpenAI',
          description: 'gpt-5.2, gpt-5-mini 등'
        },
        litellm: {
          label: 'LiteLLM',
          description: '자체 호스팅 프록시로 OpenAI, Anthropic, Gemini, Bedrock 등 100+ 공급자를 연결합니다. 플레이스홀더 URL을 실제 주소로 바꾸세요. localhost는 SSRF_WHITELIST에 추가해야 합니다.'
        }
      },
      thinkingControl: {
        thinkingType: {
          label: 'thinking.type',
          hint: 'Volcengine Ark; Tencent LKEAP (DeepSeek V3 등, LKEAP 기본값; R1은 「전송 안 함」)'
        },
        enableThinking: {
          label: 'enable_thinking',
          hint: 'Alibaba DashScope: qwen3, qwen-plus, qwen-max, qwen-turbo'
        },
        chatTemplateKwargs: {
          label: 'chat_template_kwargs',
          hint: '사용자 정의 OpenAI 호환, NVIDIA NIM, vLLM / 로컬 Qwen 배포'
        },
        none: {
          label: '사고 매개변수 전송 안 함',
          hint: '에이전트 「사고 모드」 스위치가 효과 없음, 요청에 사고 관련 매개변수를 보내지 않음'
        }
      },
      thinkingControlDesc: '에이전트 「사고 모드」 켜기/끄기 시 API에 어떻게 기록할지 결정합니다. 벤더/모델에 따라 미리 선택되며, 실제 API와 다르면 문서에 맞게 수정하세요. 「전송 안 함」을 선택하면 에이전트 「사고 모드」 스위치가 효과가 없습니다.',
      thinkingControlLabel: '사고 모드 매개변수 형식',
      volcengine: {
        accessKeyLabel: 'Access Key ID',
        accessKeyPlaceholder: 'Volcengine Access Key ID',
        secretKeyLabel: 'Secret Access Key',
        secretKeyPlaceholder: 'Volcengine Secret Access Key',
        rerankCredentialHint: 'Rerank은 Ark API 키가 아닌 VikingDB AK/SK 서명을 사용합니다. 권장 모델: doubao-seed-rerank.'
      }
    }
  },
  error: {
    tenant: {
      listFailed: '테넌트 목록 조회 실패',
      searchFailed: '테넌트 검색 실패',
      updateFailed: '테넌트 정보 업데이트 실패',
      deleteFailed: 'Failed to delete tenant',
      createApiKeyFailed: 'API 키 생성 실패',
      createFailed: '생성 실패',
      deleteApiKeyFailed: 'API 키 삭제 실패',
      listApiKeysFailed: 'API 키 목록 조회 실패'
    },
    auth: {
      getTenantFailed: '테넌트 정보 조회 실패'
    }
  },
  system: {
    versionDescription: '애플리케이션 서비스(weknora-app)의 버전 번호',
    frontendVersionDescription: 'UI(weknora-ui) 빌드 버전 번호',
    globalSettings: {
      description: '플랫폼 전역 런타임 설정입니다. 저장하면 모든 테넌트에 즉시 적용됩니다. 시스템 관리자만 보고 수정할 수 있습니다.',
      audit: {
        target: {
          bulkQuotaDiff: '{count}개 테넌트에 적용됨 ({gb} GB)'
        },
        outcome: {
          accepted: '수락됨',
          canceled: '취소됨',
          failed: '실패',
          partial: '일부 완료'
        }
      },
      bulkApply: {
        label: '모든 기존 테넌트에 적용',
        tooltip: '저장한 값은 기본적으로 새로 생성되는 테넌트에만 적용됩니다. 이 버튼을 누르면 현재 값을 모든 기존 테넌트에도 덮어씁니다.',
        confirmBody: '모든 기존 워크스페이스의 저장 용량을 {value} GB로 덮어씁니다. 운영팀이 개별로 조정한 워크스페이스의 용량도 함께 덮어쓰여집니다. 계속하시겠습니까?',
        success: '{count}개 테넌트의 저장 용량을 {gb} GB로 갱신했습니다',
        failed: '모든 테넌트에 적용 실패'
      },
      passwordReset: {
        validation: {
          emailRequired: '사용자 이메일을 입력하세요',
          emailInvalid: '올바른 이메일 주소를 입력하세요',
          passwordRequired: '새 비밀번호를 입력하세요',
          passwordLength: '비밀번호는 8~32자여야 합니다',
          passwordLetter: '비밀번호에 문자가 포함되어야 합니다',
          passwordNumber: '비밀번호에 숫자가 포함되어야 합니다',
          confirmRequired: '새 비밀번호를 다시 입력하세요',
          passwordMismatch: '비밀번호가 일치하지 않습니다'
        }
      },
      createUser: {
        description: '새 로컬 사용자 계정을 개설합니다. 플랫폼의 기본 테넌트 모드가 "개인 테넌트 자동 생성"으로 설정된 경우, 스스로 가입한 사용자와 마찬가지로 개인 테넌트도 함께 만들어집니다.'
      },
      admins: {
        confirm: {
          promote: {
            body: '{email} 사용자를 시스템 관리자로 승격하시겠습니까? 이 사용자는 모든 테넌트 접근, 시스템 설정 변경, 관리자 명단 관리 등 플랫폼 수준의 권한을 갖게 됩니다.'
          }
        }
      },
      confirm: {
        bodySandboxDockerEnabled: '켜면 테넌트 관리자가 로컬 Docker 데몬을 샌드박스로 지정할 수 있습니다. 로컬 docker.sock은 호스트 root와 같습니다. 데몬을 마운트했거나 TLS가 있는 원격 tcp:// 를 쓰는 프라이빗 단일 노드에서만 사용하세요.'
      },
      enumLabels: {
        auth: {
          default_tenant_mode: {
            create_personal: '개인 테넌트 자동 생성',
            tenantless: '테넌트을 자동 생성하지 않음'
          }
        }
      },
      keyDescriptions: {
        tenant: {
          max_owned_per_user: '슈퍼유저가 아닌 사용자가 셀프 서비스로 소유할 수 있는 최대 테넌트 수입니다. 테넌트 생성 시마다 읽으며 저장 즉시 적용됩니다. 0은 내장 기본값 10을 사용하고, 음수는 제한을 완전히 해제합니다(공개 배포에는 권장하지 않음).',
          self_service_creation_enabled: '비슈퍼유저가 공간을 직접 만들 수 있는지 설정합니다. 비활성화하면 일반 사용자는 초대로만 기존 공간에 참여할 수 있으며, 크로스 워크스페이스 슈퍼유저는 계속 만들 수 있습니다.',
          default_storage_quota_gb: '신규 워크스페이스 생성 시 기본으로 할당되는 저장 용량(GB)으로, 벡터·원본·텍스트·인덱스 등을 포함합니다. 생성 시에만 읽으며, 변경은 이후 생성되는 워크스페이스에만 적용되고 기존 워크스페이스에는 소급되지 않습니다. 0 또는 음수는 내장 기본값 10GB를 사용합니다.',
          auto_create_api_key: '신규 테넌트에 full_access API Key를 자동 생성하고 생성 응답에 평문 token을 반환합니다. 기존 동작에 의존하는 연동에만 사용하세요. 기본값은 비활성화입니다.',
          auto_accept_invitation: '켜면 테넌트 관리자가 이메일로 가입된 사용자를 초대할 때 상대가 바로 멤버가 되며, 받은편지함에서 수락할 필요가 없습니다. 끄면 「초대 발송 → 상대가 수락」 흐름을 유지합니다. 저장 즉시 적용됩니다.'
        },
        auth: {
          default_tenant_mode: '공개 가입 후 공간 초기화 정책입니다. create_personal은 개인 공간을 만들고 Owner를 부여하며, tenantless는 초대 수락 또는 직접 공간 생성 전까지 계정만 만듭니다.'
        }
      },
      keyLabels: {
        tenant: {
          max_owned_per_user: '사용자당 최대 테넌트 수',
          self_service_creation_enabled: '사용자 테넌트 직접 생성 허용',
          default_storage_quota_gb: '신규 테넌트 기본 저장 용량 (GB)',
          auto_create_api_key: '신규 테넌트 API Key 자동 생성'
        },
        auth: {
          default_tenant_mode: '기본 테넌트 프로비저닝'
        }
      },
      runtime: {
        tasks: {
          tenantLabel: '테넌트 ID'
        }
      },
      sections: {
        tenant: {
          tab: '테넌트 기본값 {count}',
          title: '테넌트 기본값',
          description: '기존 테넌트를 변경하지 않고 신규 테넌트의 초기 할당량과 호환 동작을 설정합니다.'
        },
        access: {
          description: '시스템 관리자, 공개 가입, 테넌트 생성 규칙을 관리합니다.'
        }
      }
    }
  },
  tenant: {
    title: '테넌트 정보',
    currentTenant: '현재 테넌트',
    switchTenant: '테넌트 전환',
    sectionDescription: '테넌트의 상세 설정 정보 보기',
    searchPlaceholder: '테넌트 이름 검색 또는 테넌트 ID 입력...',
    noMatch: '일치하는 테넌트를 찾을 수 없습니다',
    switchSuccessTitle: '테넌트가 전환되었습니다',
    loadTenantsFailed: '테넌트 목록 로드 실패',
    messages: {
      fetchFailed: '테넌트 정보 가져오기 실패'
    },
    deleteDangerZone: {
      title: 'Delete this tenant',
      desc: 'Delete the whole tenant and its configuration. Members will no longer be able to access its knowledge bases, agents, or API key.',
      button: 'Delete tenant',
      confirmTitle: 'Delete this tenant?',
      confirmBody: 'This will delete "{name}" and make its knowledge bases, agents, members, and API key unavailable. This action cannot be undone.',
      confirmHint: 'Type the tenant name "{name}" to confirm deletion.',
      nameMismatch: 'Workspace name does not match',
      success: 'Workspace deleted',
      failed: 'Failed to delete tenant',
      confirm: 'Delete tenant'
    },
    leaveDangerZone: {
      title: '이 테넌트 나가기',
      desc: '현재 테넌트에서 멤버십을 종료합니다. 지식 베이스 및 에이전트에 접근할 수 없게 되며, 이후 초대되면 다시 참여할 수 있습니다.',
      button: '테넌트 나가기'
    },
    storage: {
      quotaDescription: '테넌트의 총 저장 스페이스 할당량'
    },
    details: {
      idLabel: '테넌트 ID',
      idDescription: '소속 테넌트의 고유 식별자',
      nameLabel: '테넌트 이름',
      nameDescription: '소속 테넌트의 이름',
      descriptionLabel: '테넌트 설명',
      descriptionDescription: '테넌트의 상세 설명',
      businessLabel: '테넌트 비즈니스',
      businessDescription: '테넌트가 속한 비즈니스 유형',
      statusLabel: '테넌트 상태',
      statusDescription: '테넌트의 현재 운영 상태',
      createdAtLabel: '테넌트 생성 시간',
      createdAtDescription: '테넌트가 생성된 시간',
      editNamePlaceholder: '새 테넌트 이름을 입력하세요',
      editNameRequired: '테넌트 이름은 비어 있을 수 없습니다',
      editNameSuccess: '테넌트 이름이 업데이트되었습니다',
      editNameFailed: '테넌트 이름 업데이트 실패',
      editDescriptionPlaceholder: '새 테넌트 설명을 입력하세요',
      editDescriptionSuccess: '테넌트 설명이 업데이트되었습니다',
      editDescriptionFailed: '테넌트 설명 업데이트 실패'
    },
    create: {
      action: '새 테넌트 만들기',
      dialogTitle: '새 테넌트 만들기',
      dialogSubtitle: '테넌트는 자체 지식 베이스와 멤버를 가지며, 사용자가 자동으로 소유자가 됩니다.',
      nameLabel: '테넌트 이름',
      nameRequired: '테넌트 이름을 입력하세요',
      descriptionPlaceholder: '이 테넌트의 용도를 간단히 설명하세요',
      success: '테넌트가 생성되었습니다',
      failed: '테넌트 생성 실패',
      disabled: '현재 시스템에서는 초대를 통해서만 테넌트에 참여할 수 있으며 직접 만들 수 없습니다.',
      needAdmin: '테넌트 소유자 또는 관리자만 테넌트를 만들 수 있습니다.'
    },
    switcher: {
      menuLabel: '테넌트 전환',
      homeTooltip: '기본 테넌트',
      empty: '현재 하나의 테넌트에만 속해 있습니다'
    }
  },
  chat: {
    sandbox: {
      desktopPlaceholder: '데스크톱 시각화는 곧 지원될 예정입니다'
    },
    scrollToBottom: '맨 아래로',
    copyFailed: '복사 실패',
    copySuccess: '복사됨',
    editorOpened: '편집기 열림',
    emptyContentWarning: '내용이 비어 있습니다',
    imageReadFailed: '이미지 읽기 실패'
  },
  knowledgeEditor: {
    titleCreate: '지식베이스 생성',
    share: {
      description: '테넌트 구성원이 접근하고 사용할 수 있도록 지식베이스를 테넌트에 공유합니다.',
      tip1: '공유 후 테넌트 구성원은 설정된 권한에 따라 이 지식베이스에 액세스하게 됩니다.'
    },
    postCreateHint: {
      followUpDesc: '왼쪽에서 데이터 소스를 구성하거나 "공유 관리"에서 테넌트에 게시할 수 있습니다'
    }
  },
  embedPublish: {
    originsHint: 'Agentic 주소(B)가 아닌 임베드를 허용할 호스트 웹사이트(A)를 입력하세요. 한 줄에 하나의 Origin(예: https://shop.example.com), 최소 1개. *.example.com 지원.',
    webhookUrlPlaceholder: 'https://your-server.example.com/weknora/embed-events',
    webhookUrlDesc: 'Optional. @:{\'brand.name\'} POSTs message_sent / message_received events to this HTTPS endpoint.'
  },
  knowledgeList: {
    create: '지식베이스 생성',
    sharedToOrgs: '{count} 테넌트에 공유됨',
    detail: {
      sourceTypeKbShare: '지식베이스는 이 테넌트에 직접 공유됩니다.',
      sourceOrg: '소스 테넌트'
    },
    sections: {
      tenantOthers: '테넌트 · 다른 멤버',
      tenantReadonly: '테넌트 · 읽기 전용'
    },
    empty: {
      description: '오른쪽 위 "지식베이스 생성" 버튼을 클릭하여 첫 번째 지식베이스를 생성하세요'
    },
    uploadProgress: {
      uploadingTitle: '「{name}」에 폴더의 문서 업로드 중',
      detail: '{completed}/{total}개 파일 완료',
      keepPageOpen: '페이지를 열어두세요. 업로드가 완료되면 파싱 상태가 자동으로 새로고침됩니다.',
      completedTitle: '「{name}」 업로드 완료',
      completedDetail: '총 {total}개 파일이 업로드되었습니다. 파싱 상태를 확인하기 위해 목록을 새로고침하는 중...',
      refreshing: '목록을 새로고침하고 최신 파싱 상태를 가져오는 중...',
      errorTip: '일부 파일 업로드에 실패했습니다. 오른쪽 상단의 알림 세부 정보를 확인해주세요.',
      unknownKb: '지식베이스 {id}'
    }
  },
  ext: {
    subtitle: '런타임 스킬, 도구, MCP를 관리합니다',
    noDescription: '설명 없음',
    close: '닫기',
    cancel: '취소',
    mcp: {
      searchPlaceholder: 'MCP 검색...',
      add: 'MCP 추가',
      create: 'MCP 만들기',
      empty: 'MCP가 없습니다. 위 버튼으로 만드세요.',
      emptySearch: '일치하는 MCP가 없습니다',
      remove: 'MCP 제거',
      delete: 'MCP 삭제',
      needsMigration: '원격 MCP로 마이그레이션해야 합니다',
      unknownTransport: '알 수 없는 전송 유형',
      builtin: '내장',
      description: '설명',
      transport: '전송 유형',
      tags: '태그',
      creator: '생성자',
      addedOk: 'MCP가 추가됨',
      removedOk: 'MCP가 제거됨',
      actionFailed: '작업 실패',
      deleteTitle: 'MCP를 삭제할까요?',
      deleteContent: 'MCP "{name}"을(를) 삭제할까요? 이 작업은 되돌릴 수 없습니다.',
      deleted: 'MCP가 삭제됨',
      deleteFailed: '삭제 실패',
      loadFailed: 'MCP 목록을 불러오지 못했습니다',
      detail: {
        back: '뒤로',
        migrateFirst: '먼저 원격 MCP로 마이그레이션하세요',
        test: '테스트',
        builtinConfigHint: '내장 MCP 연결 설정은 코드에서 관리됩니다',
        edit: '편집',
        delete: '삭제',
        add: '추가',
        remove: '제거',
        migrateAlert: '이 stdio MCP는 사용 중지되었습니다. SSE 또는 Streamable HTTP로 바꾸거나 삭제하세요.',
        tabInfo: '정보',
        editHeading: 'MCP 편집',
        editHint: '저장하면 현재 MCP 구성이 바로 적용됩니다.',
        basicTitle: '기본 정보',
        basicHint: '이름, 설명, 표시 방식을 정의합니다.',
        connTitle: '연결',
        connHint: '선택한 전송 방식에 필요한 파라미터입니다.',
        advancedTitle: '고급',
        advancedHint: '헤더는 MCP 연결에 영향을 줍니다.',
        headersHelp: '올바른 JSON 객체를 입력하세요. 비우면 추가 헤더를 보내지 않습니다.',
        cancel: '취소',
        save: '저장',
        seconds: '{count}초',
        command: '명령',
        args: '인자',
        env: '환경 변수',
        createdAt: '생성 시간',
        updatedAt: '업데이트 시간',
        creator: '생성자',
        tabTools: '도구 ({count})',
        searchTools: '도구 검색...',
        refresh: '새로고침',
        noTools: '도구가 없습니다',
        copyToolName: '도구 이름 복사',
        params: '파라미터',
        required: '필수',
        notFound: 'MCP 서버를 찾을 수 없습니다',
        addFirst: '먼저 MCP를 추가한 뒤 상세를 확인하세요',
        fetchFailed: 'MCP 상세를 불러오지 못했습니다',
        fetchToolsFailed: '도구를 불러오지 못했습니다',
        copied: '클립보드에 복사됨',
        copyFailed: '복사 실패',
        connectFailed: '연결 실패',
        testFailed: '테스트 실패',
        testOk: '연결되었습니다. 도구 {count}개를 찾았습니다.',
        toolEnabled: '도구 {name}이(가) 사용 설정되었습니다',
        toolDisabled: '도구 {name}이(가) 사용 중지되었습니다',
        added: 'MCP가 추가됨',
        removed: 'MCP가 제거됨'
      },
      form: {
        slug: 'MCP ID',
        name: 'MCP 이름',
        namePlaceholder: '표시 이름',
        description: '설명',
        descPlaceholder: 'MCP 설명',
        transport: '전송 유형',
        icon: '아이콘',
        iconPlaceholder: '이모지, 예: 🧠',
        url: 'MCP URL',
        headers: 'HTTP 헤더',
        headersPlaceholder: 'JSON, 예: {\'{\'}"Authorization": "Bearer xxx"{\'}\'}',
        httpTimeout: 'HTTP 제한 시간(초)',
        sseTimeout: 'SSE 읽기 제한 시간(초)',
        tags: '태그',
        tagsPlaceholder: '태그를 입력하고 Enter',
        badHeaders: '헤더는 올바른 JSON이어야 합니다',
        nameRequired: 'MCP 이름은 필수입니다',
        transportRequired: '전송 유형을 선택하세요',
        urlRequired: 'HTTP 유형은 MCP URL이 필요합니다',
        updated: 'MCP가 업데이트됨',
        updateFailed: '업데이트 실패',
        actionFailed: '작업 실패'
      }
    },
    tools: {
      searchPlaceholder: '도구 검색...',
      allCategories: '모든 분류',
      allSources: '전체 범위',
      empty: '도구가 없습니다',
      emptySearch: '일치하는 도구가 없습니다',
      noDescription: '설명 없음',
      detail: '도구 상세',
      configGuide: '구성 안내',
      category: '분류',
      tags: '태그',
      none: '없음',
      args: '매개변수',
      argName: '이름',
      argType: '유형',
      argDesc: '설명',
      loadFailed: '도구를 불러오지 못했습니다',
      catBuiltin: '내장 도구',
      catKnowledge: '지식베이스',
      catWiki: 'Wiki',
      catDatabase: '데이터베이스',
      sourceChat: '대화',
      sourceWork: '작업'
    },
    skills: {
      searchPlaceholder: '스킬 검색...',
      emptyTitle: '아직 스킬이 없습니다',
      emptySearchTitle: '일치하는 스킬이 없습니다',
      emptyDesc: '원격 저장소에서 설치하거나 로컬 Skill 파일을 업로드하세요.',
      emptySearchDesc: '다른 키워드를 시도하거나 검색을 지우세요.',
      groupBuiltin: '내장',
      groupShared: '테넌트 공유',
      builtinWorkNoSandbox: '내장 작업 스킬은 샌드박스에 설치하지 않습니다',
      sourceCommon: '공통',
      scopeAll: '전체 범위',
      fileTab: '파일 관리',
      depsTab: '의존성 설정',
      uninstalled: '스킬이 제거됨',
      uninstallFailed: '스킬 제거 실패',
      loadFailed: '불러오기 실패',
      remoteNone: '설치 가능한 스킬이 없습니다',
      detail: {
        back: '뒤로',
        export: '내보내기',
        delete: '삭제',
        readonlyHint: '이 스킬을 보고 사용할 수 있지만 관리 권한은 없습니다.',
        tabCode: '파일',
        projectStructure: '프로젝트 구조',
        newFile: '새 파일',
        newDir: '새 폴더',
        refresh: '새로고침',
        pickFile: '편집할 파일을 선택하세요',
        saveSettings: '설정 저장',
        enabledTitle: '사용 상태',
        enabledDesc: '중지하면 선택 목록에 나타나지 않고 런타임에도 로드되지 않습니다.',
        enabled: '사용 중',
        disabled: '사용 안 함',
        tabDeps: '의존성',
        depsTitle: '의존성 선언',
        depsDesc: '이 스킬에 필요한 도구, MCP, 다른 스킬을 구성합니다.',
        updateDeps: '의존성 업데이트',
        selectedCount: '{count}개 선택됨',
        pickDeps: '선택',
        searchDeps: '{name} 검색',
        noMatchDeps: '일치하는 의존성이 없습니다',
        noDeps: '선택할 의존성이 없습니다',
        systemMaintained: '시스템 관리',
        readonly: '읽기 전용',
        removeAria: '{name} 제거',
        notFound: '스킬을 찾을 수 없습니다',
        pathRelative: '경로 (루트 기준)',
        content: '내용',
        statusDisabled: '{source} · 사용 안 함',
        depToolsTitle: '도구 의존성',
        depToolsShort: '도구',
        depToolsDesc: '런타임에 필요한 도구를 선언합니다.',
        depToolsHint: '선택한 도구는 에이전트 런타임에 함께 로드됩니다.',
        depToolsEmpty: '도구 의존성 없음',
        depMcpTitle: 'MCP 의존성',
        depMcpDesc: '이 스킬이 의존하는 MCP를 선언합니다.',
        depMcpHint: '이 스킬 실행에 필요한 MCP를 선택하세요.',
        depMcpEmpty: 'MCP 의존성 없음',
        depSkillTitle: '스킬 의존성',
        depSkillDesc: '함께 로드할 다른 스킬을 선언합니다.',
        depSkillHint: '의존 스킬은 같은 런타임에서 읽을 수 있습니다.',
        depSkillEmpty: '스킬 의존성 없음',
        loadFailed: '불러오기 실패',
        treeFailed: '디렉터리 트리를 불러오지 못했습니다',
        readFailed: '파일을 읽지 못했습니다',
        saved: '저장됨',
        saveFailed: '저장 실패',
        confirmDeleteTitle: '스킬 “{name}”을(를) 삭제할까요?',
        confirmDeleteContent: '되돌릴 수 없으며 파일과 설정이 모두 삭제됩니다.',
        confirmDeleteOk: '삭제',
        deleted: '삭제됨',
        deleteFailed: '삭제 실패',
        exportFailed: '내보내기 실패',
        created: '생성됨',
        createFailed: '생성 실패',
        settingsSaved: '설정이 저장됨',
        settingsSaveFailed: '설정 저장 실패',
        depsUpdated: '의존성이 업데이트됨',
        depsUpdateFailed: '업데이트 실패'
      }
    },
    tabs: {
      skills: '스킬',
      tools: '도구',
      mcp: 'MCP'
    }
  },
  createChat: {
    title: '안녕하세요! 오늘은 무엇을 이야기해볼까요?'
  },
  input: {
    agentMode: '추론 질의',
    normalMode: '즉시 질의',
    messages: {
      agentSwitchedOn: '추론 질의로 전환되었습니다',
      agentSwitchedOff: '즉시 질의로 전환되었습니다'
    },
    webSearch: {
      label: '웹 검색'
    },
    placeholderAgent: '{name} 질문하기',
    placeholderKbAndWeb: '질문을 입력하면 지식베이스와 웹 검색을 기반으로 답변합니다',
    placeholderWebOnly: '질문을 입력하면 웹 검색을 결합하여 답변합니다',
    placeholderWithContext: '질문을 입력하면 위에서 선택한 지식베이스/파일을 기반으로 답변합니다',
    fileUpload: {
      label: '파일 업로드',
      tooLarge: '파일이 너무 큽니다',
      tooMany: '파일이 너무 많습니다',
      tooltip: '클릭하거나 드래그하여 파일 업로드'
    },
    imageUpload: {
      label: '이미지 업로드',
      tooltip: '클릭하거나 드래그하여 이미지 업로드'
    }
  },
  manualEditor: {
    section: {
      basic: '기본 정보'
    },
    view: {
      editLabel: '편집으로 돌아가기',
      previewLabel: '내용 미리보기'
    },
    description: 'Markdown으로 지식을 작성하고 실시간 미리보기 지원'
  },
  file: {
    downloadFailed: '다운로드 실패'
  },
  mentionDetail: {
    belongsToOrg: '테넌트: '
  },
  authStore: {
    errors: {
      parseTenantFailed: '테넌트 정보 파싱 실패'
    }
  },
  auth: {
    loginAccount: '로그인 계정',
    loginAccountPlaceholder: '로그인 계정 또는 이메일 입력',
    loginAccountRequired: '로그인 계정을 입력하세요',
    firstTime: '@:{\'brand.name\'}가 처음이신가요?',
    registerSubtitle: '계정을 만들고 @:{\'brand.name\'}를 시작하세요',
    loginError: '로그인 오류, 로그인 계정 또는 비밀번호를 확인해주세요',
    workspaceOnboarding: {
      title: '테넌트 선택',
      description: '테넌트를 만들어 시작하거나 기존 테넌트의 초대를 수락하세요.',
      create: '테넌트 만들기',
      loadingPolicy: '사용 가능한 테넌트 참여 방식을 확인하고 있습니다…',
      policyLoadFailed: '테넌트 권한을 불러올 수 없습니다. 네트워크를 확인한 후 다시 시도하세요.',
      inviteOnlyTitle: '테넌트 초대 대기',
      inviteOnlyDescription: '개인 테넌트 만들기가 비활성화되어 있습니다. 관리자가 보낸 초대를 확인하고 수락하세요.',
      inviteOnlyNotice: '이 계정은 초대를 통해서만 기존 테넌트에 참여할 수 있습니다',
      help: '지금 테넌트를 만들거나 나중에 돌아와 초대를 수락할 수 있습니다.',
      inviteOnlyHelp: '초대가 없다면 등록 이메일을 테넌트 관리자에게 전달하고 초대를 요청하세요.'
    }
  },
  inviteRegister: {
    success: '가입 완료, 테넌트로 이동합니다…'
  },
  memorySettings: {
    workspaceDisabled: '이 테넌트에서는 장기 기억이 꺼져 있습니다. 관리자가 켜야 이 스위치가 적용됩니다.'
  },
  envVarSettings: {
    description: '스킬과 샌드박스에 쓰는 개인 키이며, 플랫폼 시스템이나 배포 설정이 아닙니다.',
    introPersonalBody: '내 대화와 실행에만 주입됩니다. 다른 구성원은 볼 수 없고, 그들의 값이 내 값을 대체하지도 않습니다.',
    noConfigDescription: '이 테넌트에는 아직 샌드박스 백엔드가 없어 설정할 키가 없습니다.',
    skillHint: '각 스킬이 필요하다고 선언한 값입니다. 여기에 미리 저장하거나 대화에서 바로 제공할 수 있습니다. 테넌트 관리자는 스킬 카드에서 공용 값을 넣을 수도 있습니다.',
    statusWorkspace: '테넌트 공용 값 사용 중',
    clearConfirm: '{name}에 설정한 내 값을 삭제할까요? 이후에는 테넌트 공용 값이 있으면 다시 적용됩니다.'
  },
  memoryWorkspaceSettings: {
    enableLabel: '이 테넌트에서 장기 기억 사용',
    enableDescription: '끄면 이 테넌트의 모든 대화가 기억을 읽거나 쓰지 않습니다.',
    instructionsDescription: '정리 프롬프트에 덧붙는 테넌트 규칙으로, 제품이 알 수 없는 정책을 표현합니다. 예: "고객 이름은 절대 기록하지 않는다".'
  },
  settings: {
    sandbox: {
      pageHint: '샌드박스는 에이전트 스킬 스크립트가 실행되는 격리 환경입니다. 테넌트에 Docker, E2B, CubeSandbox 설정을 여러 개 둘 수 있고, 각 에이전트가 하나를 선택합니다. 스킬은 「스킬 관리」 페이지에서 선택한 설정의 이미지에 설치됩니다. 선택하지 않으면 스크립트는 실행되지 않습니다.',
      editorDescription: 'Configure a tenant runtime. Docker, CubeSandbox, and E2B use the same management flow.',
      scriptPolicyDesc: '끄면 이 테넌트의 에이전트는 스킬 내용만 읽을 수 있습니다. 이미 실행 중인 원격 샌드박스는 해당 세션이 종료된 후 해제됩니다.',
      dockerHostRisk: '비우거나 unix:// 를 쓰면 플랫폼가 있는 머신의 Docker 데몬을 사용하며, 그 권한은 해당 머신의 root와 같습니다. 프라이빗 단일 노드에만 쓰세요. 여러 테넌트가 같은 호스트를 쓰는 경우에는 Cube 또는 E2B를 쓰세요. 원격 tcp:// 는 TLS 인증서 디렉터리가 필요합니다.',
      noConfigs: '아직 샌드박스가 없습니다. 테넌트 설정을 선택하지 않은 에이전트는 스킬 스크립트를 실행하지 않습니다.',
      disableScriptsConfirm: 'All agents in this tenant — will no longer run skill scripts in a sandbox. They can still read skill content. Existing remote sandboxes are not destroyed automatically; end or delete the related sessions to release them. Continue?',
      scriptsDisabled: 'Sandbox execution disabled for this tenant',
      scriptsEnabled: 'Sandbox execution restored for this tenant',
      namedBackendHint: 'Tenant configuration is the only runtime source. Agents without one cannot execute skill scripts.',
      weknoraTemplateTitle: '플랫폼 standard template',
      weknoraDockerImage: '플랫폼 standard image',
      weknoraTemplateOverview: '플랫폼 provides the standard runtime. Templates are discovered after connecting and the standard one is created when missing.',
      weknoraTemplateDescription: 'Includes the Python, Node.js, CLI tools, workspace path, and non-root execution user expected by 플랫폼 skills.',
      templateLoadHint: '클러스터 연결을 입력한 뒤 새로고침하세요. 플랫폼 표준 템플릿이 없으면 「만들기」를, DNS나 이미지를 바꾼 뒤에는 「삭제 후 재구축」을 누르세요.',
      standardTemplateProvisioning: 'The 플랫폼 standard template is being created. Refresh shortly to see its status.',
      templateStepHint: '이 단계에서는 클러스터에 이미 있는 템플릿만 나열하며 자동으로 만들지 않습니다. 표준 템플릿이 없으면 「플랫폼 표준 템플릿 만들기」를, DNS나 이미지를 바꾼 뒤에는 「삭제 후 재구축」을 누르세요. 템플릿이 준비된 뒤에 계속할 수 있습니다.',
      templateUntaggedHint: '빌드는 끝났지만 default 태그가 붙은 빌드가 없어 샌드박스 생성 시 이 템플릿을 찾을 수 없습니다. E2B에서 템플릿을 삭제하고 새로고침하면 플랫폼가 다시 빌드합니다.',
      weknoraStandardTemplate: '플랫폼 표준 템플릿',
      replaceStandardTemplateConfirm: '현재 설정(DNS 포함)으로 플랫폼 표준 템플릿을 다시 만듭니다. 새 템플릿이 준비되기 전에는 기존에 쓸 수 있는 템플릿을 삭제하지 않습니다.',
      cubeDnsServersHelp: '선택 사항입니다. 플랫폼 표준 템플릿에 기록되는 nameserver IP입니다. 비워 두면 클러스터 기본값(보통 119.29.29.29)을 사용합니다. 공용 DNS로 UDP/53이 나가지 않으면 Cube 호스트 /etc/resolv.conf에서 도달 가능한 주소를 넣고, 10/8, 172.16/12, 192.168/16은 피하세요. 이미 있는 표준 템플릿은 카드에서 「재구축」을 눌러야 변경이 적용됩니다.',
      dockerTlsCertPathHelp: 'Directory on the 플랫폼 host holding ca.pem, cert.pem and key.pem. Required for a remote daemon; certificates are mounted by the deployment, never stored here.',
      dockerIdleTtlHelp: 'The Docker daemon has no idle timeout of its own. A container that runs no command for this long is reclaimed by 플랫폼 and rebuilt when the session continues. Empty means 1800 seconds.',
      skillEnv: {
        workspaceTitle: '테넌트 공용 값',
        saveSuccess: '테넌트 공용 값을 저장했습니다',
        saveFailed: '테넌트 공용 값을 저장하지 못했습니다.',
        clearConfirm: '{name}의 테넌트 공용 값을 삭제할까요? 선언은 유지됩니다. 자기 값이 없는 구성원은 이후 이 값이 비어 있습니다.',
        clearSuccess: '테넌트 공용 값을 삭제했습니다.'
      },
      backendDescriptions: {
        docker: '이 플랫폼 호스트의 Docker에서 세션마다 장수명 컨테이너를 유지합니다. 스크립트와 파일이 같은 컨테이너에 남습니다'
      }
    },
    skills: {
      description: '스킬은 테넌트 카탈로그에 속합니다. 먼저 등록한 뒤 하나 이상의 샌드박스에 설치할 수 있습니다. 에이전트는 현재 샌드박스에서 준비된 스킬만 사용할 수 있습니다.',
      host: {
        description: '스킬은 테넌트 카탈로그에 있습니다. 이 컴퓨터에 설치한 뒤에 에이전트에서 사용할 수 있습니다.'
      },
      scope: '적용 범위',
      addStepRegisterDesc: '소스를 붙여넣거나 zip을 업로드해 먼저 테넌트 카탈로그에 등록합니다.'
    },
    tenantInfo: '테넌트 정보',
    parser: {
      checking: '확인 중…'
    },
    weknoraCloud: {
      title: '클라우드 서비스',
      credentialConfigured: '클라우드 서비스 자격 증명이 설정되었습니다.',
      credentialUnconfigured: '클라우드 서비스 자격 증명이 설정되지 않았습니다. APPID와 APPSECRET을 먼저 설정하세요.',
      modelHintConfigured: '클라우드 서비스 자격 증명이 설정되었습니다. 지원 모델은',
      modelsSection: {
        descReady: '클라우드 서비스의 네 가지 표준 모델을 등록하여 대화, 검색, 재정렬, 비전에 사용합니다.'
      },
      saveSuccess: '자격 증명이 저장되었습니다'
    },
    roleDenied: {
      desc: '현재 역할로는 이 설정 페이지에 접근할 수 없습니다. 이 테넌트의 관리자에게 필요한 역할을 요청하세요.'
    },
    navGroups: {
      workspace: '테넌트'
    },
    workspaceSettings: '테넌트 설정',
    storage: {
      saveSuccess: '저장되었습니다'
    }
  },
  agent: {
    workSubtitle: '작업 에이전트를 관리합니다. 과정에서 중간 파일과 산출물을 생성합니다.',
    builtinWikiQa: '위키 질의',
    builtinTableAnalysis: '표 분석',
    editor: {
      rerankModelOptionalHint: '현재 범위에 RAG 유형의 지식베이스가 없으므로 선택 사항입니다. 이후 RAG 지식베이스가 추가되면 테넌트 기본 ReRank 모델로 자동 폴백되지만, 명시적으로 설정하는 것을 권장합니다.',
      hostSkillsSelectionDesc: '테넌트 카탈로그의 스킬이 표시됩니다. 이 컴퓨터에 설치된 것은 바로 쓸 수 있고, 나머지는 먼저 설치해야 합니다.',
      skillsSelectionDesc: '테넌트 카탈로그의 스킬이 모두 표시됩니다. 이 샌드박스에 설치된 것은 바로 쓸 수 있고, 나머지는 먼저 「설치」해야 합니다.',
      noSkillsAvailable: '테넌트 카탈로그에 스킬이 없습니다.',
      sandboxNoConfigs: '이 테넌트에 샌드박스가 없어 스킬 스크립트가 실행되지 않습니다.',
      maxCompletionTokensCustom: '사용자 지정'
    },
    shareScope: {
      desc: '스페이스 구성원은 읽기 전용 모드로 에이전트를 사용하며 현재 구성된 기능과 리소스를 따릅니다. 에이전트에 대한 수정 사항은 공유 공간에 동기화됩니다. 스페이스 구성원이 지식베이스 콘텐츠를 편집할 수 있도록 허용하려면 지식베이스를 스페이스에 공유하세요.',
      skillSecretsWarning: '이 에이전트는 스킬을 사용합니다. 테넌트 구성원이 사용하면 스킬이 이 테넌트의 샌드박스에서 관리자가 설정한 환경 변수(API 키 등)와 함께 실행되며, 구성원은 에이전트가 그 값을 출력하게 할 수 있습니다. 이를 허용할 수 있는 경우에만 공유하세요.'
    },
    empty: {
      sharedDescription: '테넌트에 참여하거나 다른 사람에게 에이전트를 공유하도록 요청할 수 있습니다.'
    },
    sections: {
      tenantOthers: '테넌트 · 다른 멤버',
      tenantReadonly: '테넌트 · 읽기 전용'
    },
    tabs: {
      platform: '대화',
      work: '작업'
    },
    mode: {
      normal: '즉시 질의',
      agent: '추론 질의'
    },
    type: {
      normal: '즉시 질의',
      agent: '추론 질의'
    },
    workManage: {
      viewSwitch: '에이전트 관리 보기 전환',
      sectionAgents: '에이전트',
      sectionSubagents: '하위 에이전트',
      deleteBuiltinWarning: '내장 에이전트는 삭제할 수 없습니다',
      modelNotConfigured: '모델이 구성되지 않았습니다',
      deleteConfirmTitle: '{name} 삭제',
      deleteConfirmContent: '삭제 후 복구할 수 없습니다. 기존 대화는 원래 에이전트 바인딩을 유지합니다.',
      deleted: '에이전트가 삭제되었습니다',
      deleteFailed: '에이전트를 삭제하지 못했습니다',
      loadFailed: '에이전트를 불러오지 못했습니다',
      loadBackendsFailed: '에이전트 백엔드를 불러오지 못했습니다',
      modelSelector: {
        clear: '선택 지우기',
        loading: '불러오는 중...',
        placeholder: '모델을 선택하세요'
      },
      toolCategories: {
        knowledge: '지식 베이스',
        mysql: 'MySQL',
        debug: '디버그'
      },
      builtinTools: {
        download_kb_file: {
          name: '파일 다운로드',
          desc: '지식 베이스 원본 파일을 작업 공간으로 다운로드합니다.'
        },
        search_file: {
          name: '파일 검색',
          desc: '접근 가능한 지식 베이스에서 파일을 검색합니다.'
        },
        find_kb_document: {
          name: '문서 내 찾기',
          desc: '지식 베이스 파일에서 키워드 또는 정규식을 찾습니다.'
        },
        open_kb_document: {
          name: '문서 열기',
          desc: '지식 베이스 문서를 행 창 단위로 엽니다.'
        },
        query_kb: {
          name: '지식 베이스 검색',
          desc: '지정한 지식 베이스에서 관련 내용을 검색합니다.'
        },
        get_mindmap: {
          name: '마인드맵 가져오기',
          desc: '지정한 지식 베이스의 마인드맵 구조를 가져옵니다.'
        },
        list_kbs: {
          name: '지식 베이스 목록',
          desc: '현재 사용자가 접근할 수 있는 지식 베이스를 나열합니다.'
        },
        calculator: {
          name: '계산기',
          desc: '기본 수치 계산을 수행합니다.'
        },
        ask_user_question: {
          name: '사용자에게 질문',
          desc: '중요한 결정이나 확인이 필요할 때 사용자에게 질문합니다.'
        },
        ocr_parse_file: {
          name: 'OCR 파일 파싱',
          desc: 'PDF, Office 또는 이미지 파일을 Markdown 텍스트로 파싱합니다.'
        },
        present_artifacts: {
          name: '산출물 표시',
          desc: '작업 공간 outputs 폴더의 결과 파일을 보여 주어 사용자가 다운로드하거나 미리볼 수 있게 합니다.'
        },
        web_search: {
          name: '웹 검색',
          desc: '인터넷에서 실시간 웹 페이지, 뉴스 및 사이트 콘텐츠를 검색합니다.'
        },
        install_skill: {
          name: '스킬 설치',
          desc: '현재 사용자의 개인 공간에 Skill을 설치하고 이 세션에서 활성화합니다.'
        }
      },
      form: {
        emptyConfig: '이 에이전트에는 구성 항목이 없습니다',
        knowledgeSkillWarning: '지식 베이스가 활성화되어 있지만 knowledge-base Skill이 선택되지 않았습니다. 에이전트가 지식을 검색하거나 문서를 열지 못할 수 있습니다.',
        defaultPlaceholder: '기본값: {value}'
      },
      fields: {
        model_retry_times: {
          name: '모델 재시도 횟수',
          desc: '모델 호출이 실패했을 때의 최대 재시도 횟수입니다. 기본값은 {default}입니다.'
        },
        max_execution_steps: {
          name: '최대 실행 스텝',
          desc: '한 번의 에이전트 실행에서 허용되는 최대 LangGraph 스텝 수(recursion_limit)입니다. 기본값은 {default}입니다.'
        },
        summary_l2_trigger_ratio: {
          name: 'L2 요약 트리거 비율',
          desc: 'L1 압축 후 남은 컨텍스트가 요약 임계값 × 이 비율을 넘으면 L2 요약이 실행됩니다. 범위 0.1–1.0이며 값이 작을수록 L2가 더 빨리 트리거됩니다. 기본값은 {default}입니다.'
        },
        summary_tool_result_token_limit: {
          name: '요약 도구 결과 토큰 한도',
          desc: 'L1 정리 시 이 토큰 수를 넘는 도구 결과는 outputs에 기록되고, 컨텍스트에는 해당 길이의 미리보기만 남습니다. 기본값은 {default}입니다.'
        },
        summary_prompt: {
          name: '컨텍스트 요약 프롬프트',
          desc: '컨텍스트를 요약할 때 사용하는 프롬프트입니다. 요약할 메시지 자리 표시자로 {messages}를 받을 수 있어야 합니다.'
        },
        summary_keep_messages: {
          name: '요약 후 유지 메시지 수',
          desc: '요약 후 요약 외에 최근 메시지를 이 개수만큼 유지합니다. 기본값은 {default}입니다.'
        },
        summary_threshold: {
          name: '컨텍스트 요약 임계값 (K)',
          desc: '컨텍스트 크기가 이 값을 초과하면 요약이 활성화됩니다. 단위는 K 토큰입니다. 기본값은 {default}K입니다.'
        },
        skills: {
          name: 'Skills',
          desc: '선택적 Skill입니다. 현재 사용자가 사용할 수 있는 모든 Skill이 기본으로 선택됩니다. Skill에 필요한 도구와 MCP 서비스는 자동으로 마운트됩니다.'
        },
        mcps: {
          name: 'MCP 서비스',
          desc: '현재 사용자가 사용할 수 있는 모든 MCP 서비스가 기본으로 선택됩니다.'
        },
        knowledges: {
          name: '지식 베이스',
          desc: '지식 베이스는 플랫폼에서 가져옵니다. 지식 페이지에서 만드세요. 접근 가능한 모든 지식 베이스가 기본으로 선택됩니다.'
        },
        tools: {
          name: '도구',
          desc: '내장 도구입니다. 현재 사용자가 사용할 수 있는 모든 도구가 기본으로 선택됩니다.'
        },
        tool_approval_mode: {
          name: '도구 승인 모드',
          desc: '기본 승인은 파일 쓰기, 편집 또는 명령 실행 전에 확인합니다. 항상 신뢰는 이러한 도구를 자동으로 실행합니다.',
          options: {
            default: '기본 승인',
            always_trust: '항상 신뢰'
          }
        },
        model: {
          name: '모델',
          desc: '이 에이전트를 구동하는 모델입니다. 반드시 선택해야 합니다.'
        },
        system_prompt: {
          name: '시스템 프롬프트',
          desc: '에이전트의 역할과 동작을 설명합니다'
        }
      },
      editor: {
        advanced: '고급 설정',
        advancedDesc: '모델, 프롬프트, 지식 베이스, 도구, MCP, 스킬, 하위 에이전트에 속하지 않는 나머지 설정',
        navAdvanced: '고급',
        basicInfoDesc: '에이전트 이름, 설명, 실행 백엔드를 설정합니다',
        defaultName: '새 에이전트',
        slug: '식별자',
        slugPlaceholder: '선택 사항, 비워 두면 자동 생성',
        slugDesc: '생성 후 에이전트 ID로 사용됩니다. 비워 두면 자동 생성됩니다.',
        backend: '에이전트 유형',
        backendDesc: '에이전트 유형을 선택합니다. 생성 후에는 변경할 수 없습니다.',
        backendAssistant: '어시스턴트',
        backendSubagent: '하위 에이전트',
        backendDescAssistant: '도구, 지식 베이스, 하위 에이전트를 사용할 수 있는 대화형 작업 에이전트입니다.',
        backendDescSubagent: '상위 에이전트가 단일 작업에 호출하는 하위 에이전트입니다.',
        subagents: '하위 에이전트',
        subagentsDesc: '이 에이전트가 호출할 수 있는 하위 에이전트를 구성합니다',
        subagentsSelection: '하위 에이전트 범위',
        subagentsSelectionDesc: '이 에이전트가 호출할 수 있는 하위 에이전트 범위를 선택합니다',
        subagentsSelect: '하위 에이전트 선택',
        subagentsSelectDesc: '사용할 하위 에이전트를 선택합니다',
        noSubagentsAvailable: '사용 가능한 하위 에이전트가 없습니다',
        builtinTools: '내장 도구',
        notEditable: '이 에이전트는 편집할 수 없습니다',
        readonlyHint: '이 에이전트 설정은 볼 수 있지만 관리 권한이 없습니다.',
        nameRequired: '에이전트 이름을 입력하세요',
        modelRequired: '에이전트 모델을 선택하세요',
        iconUploadType: '이미지 파일만 업로드할 수 있습니다',
        iconUploadSize: '이미지 크기는 {size}MB를 초과할 수 없습니다',
        iconUploaded: '아이콘이 업로드되었습니다',
        iconUploadFailed: '아이콘을 업로드하지 못했습니다',
        saved: '에이전트가 저장되었습니다',
        created: '에이전트가 생성되었습니다',
        saveFailed: '에이전트를 저장하지 못했습니다'
      },
      share: {
        ownerOnly: '소유자만',
        none: '없음',
        global: '전역',
        department: '부서({count})',
        user: '사용자({count})',
        readManage: '읽기 {read} · 관리 {manage}',
        readonly: '읽기 전용 {scope}'
      }
    }
  },
  knowledgeStages: {
    copyFailed: '복사 실패. 직접 선택해 주세요',
    errorCode: {
      DOCREADER_UNAVAILABLE_SUGGESTION: '이 파일 형식에 사용할 파서가 없거나 서비스에 연결할 수 없습니다. 파서 설정을 확인한 뒤 다시 시도하세요.',
      DOCREADER_TIMEOUT_SUGGESTION: '파일이 크거나 파싱 서비스가 바쁩니다. 파일을 나눈 뒤 다시 시도하거나 파서 부하를 확인하세요.',
      DOCREADER_PARSE_FAILED_SUGGESTION: '파일이 손상되었거나 인코딩이 맞지 않거나 파서가 실패했습니다. 파일을 확인한 뒤 다시 업로드하세요.',
      CHUNKING_FAILED: '청킹에 실패했습니다',
      CHUNKING_FAILED_SUGGESTION: '텍스트를 나누지 못했습니다. 청크 크기를 조정한 뒤 다시 파싱하세요.',
      EMBEDDING_RATE_LIMIT: '임베딩 요청이 제한되었습니다',
      EMBEDDING_RATE_LIMIT_SUGGESTION: '임베딩 모델이 속도 제한을 반환했습니다. 잠시 후 다시 시도하거나 모델 할당량을 높이세요.',
      EMBEDDING_PROVIDER_FAIL: '임베딩에 실패했습니다',
      EMBEDDING_PROVIDER_FAIL_SUGGESTION: '임베딩 모델 호출에 실패했습니다. 모델 설정, 키, 모델 이름을 확인한 뒤 다시 시도하세요.',
      VECTORSTORE_WRITE_FAILED: '벡터 저장에 실패했습니다',
      VECTORSTORE_WRITE_FAILED_SUGGESTION: '임베딩은 생성되었지만 벡터 저장소에 쓰지 못했습니다. 연결 상태와 용량을 확인한 뒤 다시 시도하세요.',
      MULTIMODAL_VLM_FAILED: '이미지 이해에 실패했습니다',
      MULTIMODAL_VLM_FAILED_SUGGESTION: '이미지 인식 또는 설명이 실패했습니다. 멀티모달 모델 설정을 확인한 뒤 다시 시도하세요.',
      MULTIMODAL_ALL_FAILED: '모든 이미지 이해가 실패했습니다',
      MULTIMODAL_ALL_FAILED_SUGGESTION: '모든 이미지 작업이 실패했습니다. 문서 본문은 계속 검색할 수 있습니다. 멀티모달 모델을 확인한 뒤 다시 시도하세요.',
      TASK_TIMEOUT: '처리 작업 시간이 초과되었습니다',
      TASK_TIMEOUT_SUGGESTION: '재시도 횟수를 모두 사용했습니다. 나중에 다시 파싱하거나 큰 파일을 나누세요.',
      UNKNOWN: '처리에 실패했습니다',
      SERVER_RESTART: '서비스 재시작으로 처리가 중단되었습니다',
      SERVER_RESTART_SUGGESTION: '애플리케이션이 다시 시작되면서 작업이 중단되었습니다. 문서를 다시 파싱하세요.',
      UPSTREAM_FAILED: '이전 단계가 실패하여 이후 단계가 취소되었습니다',
      UPSTREAM_FAILED_SUGGESTION: '앞 단계가 끝나지 않아 이 단계는 취소되었습니다. 실패한 단계를 처리한 뒤 다시 시도하세요.',
      QUESTION_FAILED: '질문 생성에 실패했습니다',
      QUESTION_FAILED_SUGGESTION: '청크에 대한 질문을 만들지 못했습니다. 대화 모델 설정을 확인한 뒤 다시 시도하세요.',
      GRAPH_EXTRACT_FAILED: '지식 그래프 추출에 실패했습니다',
      GRAPH_EXTRACT_FAILED_SUGGESTION: '그래프 추출이 끝나지 않았습니다. 모델 설정을 확인한 뒤 다시 시도하세요.',
      SUMMARY_FAILED: '요약 생성에 실패했습니다',
      SUMMARY_FAILED_SUGGESTION: '문서 요약을 만들지 못했습니다. 대화 모델 설정을 확인한 뒤 다시 시도하세요.',
      DOCREADER_UNAVAILABLE: '문서 파싱 서비스를 사용할 수 없습니다',
      DOCREADER_TIMEOUT: '문서 파싱 시간이 초과되었습니다',
      DOCREADER_PARSE_FAILED: '문서 파싱에 실패했습니다'
    },
    head: {
      completedWithActiveTrace: '처리는 완료되었지만 {n}개의 Trace 작업이 아직 활성 상태입니다',
      postprocessTasks: '후처리: 실행 중 {running} / 실패 {failed} / 완료 {completed}'
    },
    processConfig: {
      chunking: '청킹',
      chunkSize: '크기 {n}',
      parentChildOn: '부모-자식 청킹 켜짐',
      parentChildOff: '부모-자식 청킹 꺼짐',
      parser: '파싱 엔진',
      multimodal: '멀티모달',
      asr: '음성 인식',
      question: '질문 생성',
      questionOn: '켜짐, {n}개',
      on: '켜짐',
      off: '꺼짐'
    },
    total: '총 {d}'
  },
  knowledgeBase: {
    mindmap: '마인드맵',
    mindmapGenerate: '마인드맵 생성',
    mindmapRegenerate: '다시 생성',
    mindmapFitView: '화면에 맞추기',
    mindmapLoading: '로딩 중...',
    mindmapGenerating: 'AI가 마인드맵을 생성하는 중...',
    mindmapEmpty: '아직 마인드맵이 없습니다. 지식베이스 파일 목록에서 생성할 수 있습니다.',
    mindmapDescription: '이 지식베이스의 파일 트리 개요 생성',
    mindmapGenerated: '마인드맵이 생성되었습니다',
    mindmapLoadFailed: '마인드맵을 불러오지 못했습니다',
    mindmapGenerateFailed: '마인드맵을 생성하지 못했습니다',
    mindmapNotFound: '마인드맵 API를 찾을 수 없습니다. 플랫폼 백엔드를 다시 시작하고 데이터베이스 마이그레이션을 적용하세요.',
    tagNameTooLong: '태그 이름은 최대 {max}자입니다',
    moreFiltersShow: '필터 펼치기',
    moreFiltersHide: '필터 숨기기',
    accessInfo: {
      fromOrg: '공유 테넌트에서'
    },
    allUploadFailed: '모든 파일 업로드 실패 ({count}개)',
    allUploadSuccess: '모든 파일 업로드 성공 ({count}개)',
    batchTagAvailableSection: '선택 가능',
    batchTagNoSelected: '선택 없음',
    batchTagSelectedSection: '선택된 태그',
    fileExists: '파일이 이미 존재합니다',
    partialUploadSuccess: '일부 파일 업로드 성공 (성공: {success}, 실패: {fail})',
    tagClearAction: '선택 해제',
    tagEditAvailableSection: '선택 가능',
    tagEditNoSelected: '선택 없음',
    tagEditSearch: '태그 검색...',
    tagEditSelectedSection: '선택된 태그',
    tagNewPlaceholder: '새 태그 이름 입력, Enter로 추가',
    uploadAllFailed: '모든 파일 업로드 실패',
    uploadAllSuccess: '{count}개 파일 업로드 성공!',
    uploadFailed: '파일 업로드 실패!',
    uploadPartialSuccess: '업로드 완료: 성공 {success}개, 실패 {fail}개',
    uploadSuccess: '파일 업로드 성공!',
    uploadingFolder: '폴더의 {total}개 파일 업로드 중...',
    selectKnowledgeBase: '지식 베이스 선택'
  },
  resourceOrigin: {
    tenant: '테넌트',
    tenantTooltip: '테넌트의 다른 멤버가 생성',
    spaceTooltipWithTenant: '공유 테넌트 「{space}」 · 출처 {tenant}',
    sharedTooltip: '공유 테넌트를 통해 외부 테넌트에서 접근'
  },
  listSpaceSidebar: {
    workspace: '테넌트'
  },
  contextualGuide: {
    agentCreate: {
      steps: {
        navTools: {
          desc: '스마트 추론 모드에서 내장 도구와 MCP로 검색·코드 등을 사용할 수 있습니다.'
        },
        name: {
          desc: '알아보기 쉬운 이름을 입력하세요. 스마트 추론 모드는 기본값이 채워질 수 있습니다.'
        },
        mode: {
          desc: '「빠른 답변」은 단순 Q&A용, 「스마트 추론」은 도구와 다단계 사고로 복잡한 작업에 적합합니다.'
        }
      }
    },
    kbCreate: {
      steps: {
        storage: {
          desc: '원본 파일 저장 위치(로컬 또는 객체 스토리지)입니다. 테넌트 기본값을 따르면 됩니다.'
        }
      }
    },
    tenantModels: {
      steps: {
        done: {
          desc: '모델을 저장하고 설정을 닫은 뒤 「새 지식 베이스」를 클릭하세요. 마법사가 유형·색인·모델 연결을 안내합니다.'
        }
      }
    },
    kbList: {
      steps: {
        create: {
          desc: '지식 베이스에 문서와 FAQ를 보관합니다. 아래에 강조된 「새 지식 베이스」 버튼을 누르면 양식 작성을 안내합니다.'
        }
      }
    }
  },
  newUserGuide: {
    steps: {
      knowledge: {
        desc: '모든 것의 시작점입니다. 문서, 웹페이지, FAQ를 업로드하면 @:{\'brand.name\'}가 자동으로 분석하고 색인합니다. 여기를 클릭해 지식 베이스로 이동하세요.'
      },
      welcome: {
        title: '@:{\'brand.name\'}에 오신 것을 환영합니다'
      }
    }
  },
  chatEngine: {
    switchLabel: '유형 선택',
    platform: '대화',
    chatWork: '작업',
    lockedHint: '이미 대화 내용이 있어 유형을 변경할 수 없습니다'
  },
  harness: {
    history: {
      recent: '최근',
      empty: '대화 기록이 없습니다',
      loadMore: '더 보기'
    },
    chat: {
      viewState: '상태 보기',
      viewFiles: '파일 보기',
      state: '상태',
      refreshState: '상태 새로고침',
      loadingMessages: '메시지를 불러오는 중...',
      generating: '답변을 생성하는 중...',
      compressing: '컨텍스트를 압축하는 중...',
      queuedCount: '대기 중 ({count})...',
      queuedRequests: '대기 중인 요청',
      queuedRequest: '대기 요청',
      deleteQueued: '대기 요청 삭제: {content}',
      continueQueue: '대기열 계속',
      queuePausedCancelled: '현재 작업이 중지되어 이후 요청이 일시 중지되었습니다.',
      queuePausedFailed: '이전 작업이 실패하여 이후 요청이 일시 중지되었습니다.',
      queueWaiting: '현재 작업이 답변 또는 승인을 기다리는 중입니다. 완료되면 이후 요청이 계속됩니다.',
      steerNext: '우선 · 다음',
      steer: '우선',
      steerHint: '현재 단계가 끝나면 이 메시지를 먼저 실행합니다',
      selectModel: '모델 선택',
      todos: '할 일',
      files: '파일',
      artifacts: '산출물',
      artifactCount: '산출물 {count}개',
      openFile: '{name} 열기',
      emptyState: '상태 정보가 없습니다',
      contextUsage: '컨텍스트 사용량',
      tokenComposition: '토큰 구성',
      systemPrompt: '시스템 프롬프트',
      toolDefs: '도구 정의 ({count})',
      contentMessages: '내용 메시지',
      toolMessages: '도구 메시지',
      summary: '요약',
      compressed: '압축됨',
      other: '기타',
      windowRemaining: '창 / 남은량',
      unknownFile: '알 수 없는 파일',
      deliveryFile: '산출물',
      deliveryFileExt: '산출물 · {ext}',
      subagent: '서브에이전트',
      agent: '에이전트',
      assistant: '어시스턴트',
      file: '파일',
      attachment: '첨부',
      approvalSaveFailed: '승인 모드를 저장하지 못했습니다',
      createFailed: '대화를 만들지 못했습니다. 다시 시도하세요.',
      queuedDeleted: '대기 요청이 삭제되었습니다',
      steered: '다음 우선 요청으로 설정했습니다',
      queueContinued: '대기열이 재개되었습니다',
      cancelSent: '취소 요청을 보냈습니다',
      invalidQuestion: '잘못된 질문입니다',
      threadNotFound: '대화 스레드를 찾을 수 없습니다',
      runNotFound: '재개할 실행을 찾을 수 없습니다',
      approvalRestoreFailed: '승인 상태를 복원하지 못했습니다. 새로고침 후 다시 시도하세요.',
      mentionEmpty: '멘션할 항목이 없습니다',
      dropToUpload: '놓아서 업로드',
      addAttachment: '첨부 추가',
      uploadedImage: '업로드한 이미지',
      thinking: '생각 중...',
      reasoning: '추론 과정',
      calledTool: '호출: {name}',
      calledTools: '도구 {count}개 호출됨',
      toolCompleted: '완료',
      toolFailedCount: '{count} 실패',
      toolRunningCount: '{count} 진행 중',
      toolSucceeded: '도구 {name} 실행 완료',
      toolFailed: '도구 {name} 실행 실패',
      toolCalling: '도구 호출 중: {name}',
      toolParams: '매개변수',
      toolFailedStatus: '실패',
      toolRunningStatus: '실행 중',
      errorInterrupted: '생성이 중단되었습니다',
      errorGuard: '민감한 내용이 감지되어 출력이 중단되었습니다.',
      errorUnexpected: '생성 중 오류가 발생했습니다',
      errorAgent: '에이전트를 불러오지 못했습니다',
      unknownError: '알 수 없는 오류',
      stoppedHint: '이번 답변 생성을 중지했습니다',
      reedit: '질문 다시 편집',
      switchBound: '이 대화는 에이전트에 연결되어 있습니다. 새 대화에서 전환하세요.',
      switchFailed: '에이전트 전환에 실패했습니다',
      removeAttachment: '첨부 제거 {name}',
      download: '다운로드',
      save: '저장',
      saving: '저장 중',
      cancel: '취소',
      delete: '삭제',
      retry: '다시 시도',
      preview: '미리보기',
      source: '소스',
      edit: '편집',
      unsaved: '저장되지 않음',
      fullscreenPreview: '전체 화면 미리보기',
      copyCode: '코드 복사',
      copied: '복사됨',
      htmlPreview: 'HTML 미리보기',
      collapsePreview: '미리보기 접기',
      closePreview: '미리보기 닫기',
      close: '닫기',
      previewFailed: '파일을 미리보지 못했습니다',
      previewUnsupported: '이 파일 형식은 미리볼 수 없습니다. 다운로드해서 확인하세요.',
      loading: '불러오는 중',
      saveToWorkspace: '워크스페이스에 저장',
      savedToWorkspace: '워크스페이스에 저장됨: {path}',
      downloadFailed: '파일을 다운로드하지 못했습니다',
      saveToWorkspaceFailed: '워크스페이스에 저장하지 못했습니다',
      panel: {
        title: '파일',
        hideFileList: '파일 목록 숨기기',
        showFileList: '파일 목록 보기',
        refresh: '새로고침',
        closePanel: '파일 패널 닫기',
        previewEmptyTitle: '산출물을 선택하면 여기에서 미리볼 수 있습니다',
        previewEmptyDesc: '파일 목록을 열어 워크스페이스 파일을 탐색할 수도 있습니다.',
        createThreadHint: '대화를 시작하면 워크스페이스를 볼 수 있습니다',
        loadingFs: '파일 시스템을 불러오는 중...',
        loadFsFailed: '파일 시스템을 불러오지 못했습니다',
        emptyWorkspace: '워크스페이스가 비어 있습니다',
        downloadFile: '파일 다운로드',
        deleteFile: '파일 삭제',
        deleteFolder: '폴더 삭제',
        confirmDeleteFile: '파일 “{name}”을(를) 삭제할까요?',
        confirmDeleteFolder: '폴더 “{name}”을(를) 삭제할까요?',
        deleteFolderContent: '폴더와 안의 모든 내용이 삭제되며 되돌릴 수 없습니다.',
        deleteIrreversible: '이 작업은 되돌릴 수 없습니다.',
        deleteFileSuccess: '파일이 삭제되었습니다',
        deleteFolderSuccess: '폴더가 삭제되었습니다',
        deleteFileFailed: '파일을 삭제하지 못했습니다',
        deleteFolderFailed: '폴더를 삭제하지 못했습니다'
      }
    },
    tokenGate: {
      title: '작업 연결',
      sidebarHint: '로그인하면 작업 대화를 볼 수 있습니다.',
      sidebarAction: '로그인'
    }
  },
  menu: {
    skillsTools: '스킬 · 도구',
    workspace: '작업 공간',
    dashboard: '데이터 개요',
    newChat: '새 대화'
  },
  workspacePage: {
    subtitle: '개인 및 지식베이스 작업 공간의 파일, 폴더, 미리보기를 관리합니다',
    guide: '사용 안내',
    newFolder: '새 폴더',
    uploadFile: '업로드',
    collapseSidebar: '작업 공간 사이드바 접기',
    expandSidebar: '작업 공간 사이드바 펼치기',
    rootLabel: '작업 공간',
    resizePreview: '미리보기 너비 조절',
    knowledgeTitle: '지식베이스',
    knowledgePlaceholder: '파일을 보려면 접근 가능한 지식베이스를 선택하세요.',
    createFolderTitle: '새 폴더',
    create: '만들기',
    cancel: '취소',
    folderNamePlaceholder: '폴더 이름을 입력하세요',
    folderNameRequired: '폴더 이름을 입력하세요',
    agentsGuideTitle: 'Agents 폴더 안내',
    agentsGuideOk: '확인',
    agentsGuideP1: '이 폴더의 안내 파일은 필요할 때 에이전트 실행 흐름에 주입되어 장기 선호, 업무 배경, 협업 규칙을 보완합니다.',
    agentsGuideP2: 'AGENTS.md, USER.md, MEMORY.md를 지원합니다. 내용은 매 세션 에이전트 프롬프트에 주입되며, 각각 행동 규칙, 사용자 정보, 에이전트가 기억할 정보에 적합합니다.',
    agentsGuideTipsTitle: '작성 팁',
    agentsGuideTip1: '부서 역할, 자주 하는 작업, 지식베이스 사용 방식 등 업무 배경을 명확히 적으세요.',
    agentsGuideTip2: '말투, 상세 정도, 결론을 먼저 제시할지 등 답변 선호를 적으세요.',
    agentsGuideTip3: '업무 용어와 고정 호칭을 적어 에이전트 표현을 일관되게 유지하세요.',
    agentsGuideTip4: '우선 참고할 지식베이스와 신중히 확인할 내용 등 자료 사용 규칙을 적으세요.',
    agentsGuideTip5: '불확실하면 먼저 묻고, 중요한 결정은 실행 전 방안을 제시하는 등 협업 경계를 적으세요.',
    agentsGuideTip6: '“최선을 다하라”처럼 모호한 표현보다 명확하고 실행 가능한 규칙을 사용하세요.',
    chatsLabel: '대화 기록',
    loadPreviewFailed: '파일 미리보기를 불러오지 못했습니다',
    loadDirFailed: '작업 공간 폴더를 불러오지 못했습니다',
    loadKnowledgeDirFailed: '지식베이스 폴더를 불러오지 못했습니다',
    knowledgeFallback: '지식베이스',
    readonlyCannotSave: '읽기 전용 파일이라 저장할 수 없습니다',
    saveSuccess: '파일이 저장되었습니다',
    saveFailed: '파일을 저장하지 못했습니다',
    createFolderSuccess: '폴더가 만들어졌습니다',
    createFolderFailed: '폴더를 만들지 못했습니다',
    uploadLimit: '한 번에 최대 {count}개 파일까지 업로드할 수 있습니다',
    uploadSuccess: '파일 {count}개를 업로드했습니다',
    uploadFailed: '파일을 업로드하지 못했습니다',
    confirmDeleteSelected: '선택한 {count}개 항목을 삭제할까요?',
    deleteSelectedSuccess: '선택한 항목이 삭제되었습니다',
    deleteSuccess: '삭제되었습니다',
    deleteFailed: '삭제하지 못했습니다',
    personal: '개인 작업 공간',
    quickAccess: '빠른 액세스',
    savedArtifacts: '저장된 산출물',
    agentFiles: '에이전트 파일',
    myKnowledge: '내 지식베이스',
    sharedKnowledge: '공유 지식베이스',
    loadingKnowledge: '지식베이스를 불러오는 중...',
    loadingPreview: '미리보기를 불러오는 중...',
    selectToPreview: '미리볼 파일을 선택하세요',
    previewHint: 'Markdown과 TXT는 편집할 수 있고, 다른 형식은 읽기 전용입니다.',
    emptyFolder: '이 폴더는 비어 있습니다',
    multiSelect: '다중 선택',
    deleteSelected: '선택 항목 삭제',
    moreActions: '추가 작업',
    name: '이름',
    size: '크기',
    modifiedAt: '수정됨',
    actions: '작업',
    itemCount: '{count}개 항목',
    filePath: '파일 경로',
    refresh: '새로고침'
  },
  dashboard: {
    subtitle: '세션, 에이전트, 도구 호출, 지식베이스 사용량을 한눈에 확인합니다',
    loadFailed: '통계를 불러오지 못했습니다',
    loadPartial: '상세 통계를 불러오지 못해 기본 수치만 표시합니다',
    loadNone: '통계를 불러올 수 없습니다',
    feedback: {
      title: '사용자 피드백'
    },
    knowledge: {
      title: '지식베이스 사용량',
      total: '지식베이스 수',
      files: '파일 수',
      storage: '저장 용량',
      unit: '개',
      fileTypes: '파일 유형 분포',
      unknownType: '알 수 없음',
      noData: '데이터 없음',
      sourcePlatform: '플랫폼 지식베이스만 집계'
    },
    tools: {
      title: '도구 호출 모니터',
      totalCalls: '총 호출',
      failedCalls: '실패 호출',
      successRate: '성공률',
      times: '회',
      top10: '자주 쓰는 도구 TOP 10',
      errorAnalysis: '도구 오류 분석',
      errorDistribution: '오류 분포',
      toolName: '도구 이름',
      errorCount: '오류 횟수'
    },
    agents: {
      title: '에이전트 분석',
      total: '에이전트 수',
      conversations: '대화 수',
      toolCalls: '도구 호출 수',
      unit: '개',
      times: '회',
      distribution: '대화/도구 호출 분포 (TOP 3)',
      topPerformers: '상위 에이전트 TOP 5',
      rank: '순위',
      agent: '에이전트',
      score: '종합 점수',
      conversationCount: '대화 수',
      toolCallCount: '도구 호출 수'
    },
    users: {
      title: '사용자 활동 추세',
      active24h: '24시간 활성',
      active30d: '30일 활성',
      last7days: '최근 7일',
      series: '활성 사용자'
    },
    calls: {
      title: '호출 통계',
      hours: '최근 14시간',
      days: '최근 14일',
      weeks: '최근 14주',
      weekLabel: '{week}주차',
      models: '모델 호출',
      agents: '에이전트 호출',
      tokens: '토큰 사용량',
      tools: '도구 호출',
      unknownModel: '알 수 없는 모델',
      input: '입력',
      output: '출력',
      total: '합계: {value}'
    },
    stats: {
      conversations: '누적 세션',
      activeConversations: '활성 대화',
      messages: '메시지 수',
      users: '사용자 수',
      chat: '대화',
      work: '작업'
    }
  },
  brand: {
    name: '智能体操作端'
  },
  mcpMetadata: {
    fullSchema: '전체 정의',
    refresh: 'Tools 새로 고침'
  }
}
