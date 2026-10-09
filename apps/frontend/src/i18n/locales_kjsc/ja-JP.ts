export default {
  modelCatalog: {
    description: 'モデルカタログは、モデル追加時に選べるモデル一覧と、コンテキスト長や思考対応などの既定値を定義します。ここでの変更はすべてのテナントに即時反映されます。',
    layers: {
      explicit: '各テナントのモデル設定で指定した値が常に優先され、保存済みモデルは書き換えられません。'
    },
    fieldsHint: '各テナントのモデル設定で指定した値が引き続き優先されます。入力を空にすると既定値に戻ります。',
    historyRestoreConfirm: 'バージョン {version} の設定に戻し、すべてのテナントに即時適用しますか？'
  },
  toolbox: {
    unavailable: '現在のテナントで利用できるツールはありません。'
  },
  localBrowser: {
    viewOnly: 'この会話のブラウザー画面は閲覧のみ',
    windowHint: 'タスクは独立したブラウザーの Agentic ウィンドウで実行されます。既存のタブを借りるには許可が必要です。',
    usageStep2Text: 'ペアリングリンクを拡張機能の「接続設定 → リモート接続」に貼り付け、サーバーを確認します。同じテナントのすべての会話で共有されます。'
  },
  platformApiKeys: {
    description: 'ワークスペース横断の自動化のためのプラットフォーム認証情報を作成します。ワークスペースAPIを呼び出す際は、X-Tenant-IDで対象のワークスペースを指定します。',
    securityNotice: 'プラットフォームAPIキーは任意のテナントを対象にできます。必要な権限のみを付与してください。平文は一度だけ表示されます。',
    createDescription: 'プラットフォームキーは特定のテナントに紐づきませんが、すべての操作は付与された権限の範囲に制限されます。',
    capabilityHint: 'テナント権限はX-Tenant-IDで指定した対象に適用され、システム権限はコントロールプレーンAPIに適用されます。',
    capabilityHints: {
      tenantsRead: 'すべてのテナントの一覧表示、検索、詳細確認を行います。',
      tenantsManage: 'テナントの作成、更新、削除と、グローバルなテナント設定の適用を行います。'
    },
    capabilities: {
      tenantsRead: 'テナントの読み取り',
      tenantsManage: 'テナントの管理'
    }
  },
  tenantInvitation: {
    errors: {
      alreadyMember: 'このユーザはすでにテナントの有効なメンバーです。'
    },
    myInbox: {
      description: '他のワークスペースからの招待です。承諾すると、割り当てられたロールで参加します。',
      tenantLabel: 'テナント'
    },
    shareLink: {
      description: 'グループチャットなどに貼れる、複数人が使える登録リンクを生成します。リンクを開いた人は自分のメールアドレスで登録し、このテナントに参加できます。有効期限は{days}日で、一覧からいつでも取り消せます。'
    }
  },
  tenantMember: {
    sectionDescription: '現在のテナントにメンバーを追加し、ロールを割り当てます。追加、編集、削除はオーナーのみ行えます。',
    listTitle: 'テナントメンバー',
    empty: 'まだメンバーがいません。右上のボタンから追加してください。',
    searchPlaceholder: '名前、ログインアカウント、またはメールアドレスで検索',
    audit: {
      description: 'このテナント内のメンバー変更とアクセス拒否をすべて記録します。新しい順に表示され、1分以内に繰り返された拒否はまとめられます。',
      outcome: {
        accepted: '承認済み',
        canceled: 'キャンセル済み',
        failed: '失敗',
        partial: '一部完了'
      }
    },
    errors: {
      emailExists: 'このメールアドレスは既に使われています',
      usernameRequired: 'ユーザ名を入力してください',
      usernameMinLength: 'ユーザ名は2文字以上にしてください',
      usernameMaxLength: 'ユーザ名は20文字以内にしてください',
      usernameInvalid: 'ユーザ名に使えるのは英数字、アンダースコア、漢字のみです',
      usernameExists: 'このユーザ名は既に使われています',
      accountRequired: 'ログインアカウントを入力してください',
      accountInvalid: 'ログインアカウントは英数字のみ、20文字以内です',
      accountExists: 'このログインアカウントは既に使われています',
      accountLocked: 'ログインアカウントは設定済みのため変更できません',
      passwordRequired: 'パスワードを入力してください',
      passwordMinLength: 'パスワードは8文字以上にしてください',
      passwordMaxLength: 'パスワードは32文字以内にしてください',
      passwordLetter: 'パスワードには英字を含めてください',
      passwordNumber: 'パスワードには数字を含めてください',
      passwordPolicy: 'パスワードは8-32文字で、英字と数字の両方を含めてください',
      confirmPasswordRequired: 'パスワードを再入力してください',
      passwordMismatch: 'パスワードが一致しません',
      alreadyMember: 'このユーザは既にテナントのメンバーです'
    },
    leave: {
      confirmTitle: 'このテナントから退出しますか？',
      confirmBody: 'このテナント内のすべてのナレッジベースとエージェントにアクセスできなくなります。後で再度招待してもらうことは可能です。',
      success: 'テナントから退出しました'
    },
    remove: {
      confirmBody: '{name}をこのテナントから削除してもよろしいですか？このユーザはすぐにアクセスできなくなります。'
    },
    edit: {
      button: '編集',
      dialogTitle: 'メンバーを編集',
      success: 'メンバーを更新しました',
      accountHintEmpty: '現在は空なので入力できます。保存後は変更できません',
      accountHintLocked: 'ログインアカウントは設定済みのため変更できません'
    },
    add: {
      button: 'メンバーを追加',
      dialogTitle: 'メンバーを追加',
      success: 'メンバーを追加しました',
      usernameLabel: 'ユーザ名',
      usernamePlaceholder: 'ユーザ名を入力',
      accountLabel: 'ログインアカウント',
      accountPlaceholder: '英数字、20文字以内',
      accountHint: '保存後は変更できません',
      emailPlaceholder: 'メールアドレスを入力',
      emailHint: 'メールアドレスは重複できません',
      passwordLabel: 'パスワード',
      passwordPlaceholder: '8-32文字、英字と数字を含む',
      confirmPasswordLabel: 'パスワードの確認',
      confirmPasswordPlaceholder: 'パスワードを再入力'
    },
    columns: {
      member: '名前とログインアカウント'
    },
    permissions: {
      desc: '各ロールがこのテナント内でできることを示します。サーバ側で強制され、UIの表示はそのルールを反映したものにすぎません。',
      manageTenantConfig: 'テナント設定の編集',
      readAll: 'テナント内のコンテンツの閲覧'
    }
  },
  integrations: {
    cli: {
      title: 'Agentic CLI'
    },
    claw: {
      title: 'Agentic Skill',
      subtitle: 'プラットフォーム REST API経由でドキュメントをインポートし、ハイブリッド検索（ベクトル＋キーワード）を実行します。ファイルのアップロード、URLインポート、Markdownでの登録、ナレッジベース横断検索に対応します。',
      installCtaHint: 'Agentic Skillをインストール · 新しいタブで開きます'
    },
    chrome: {
      subtitle: 'セルフホスト版プラットフォーム向け: ブラウジング中にサイドバーで質問したり、Webページをクリップしたり、Markdownメモをナレッジベースに保存したりできます。',
      steps: {
        port: {
          desc: 'プラットフォームデスクトップ版では、API情報で固定ポート（例: 37841）を設定すると、再起動してもURLが変わりません。'
        }
      }
    },
    api: {
      apiKeyAccessTypeHint: '「ナレッジベース」は下記の権限レベルでナレッジベースの範囲内のみ操作します。「テナント全体」はモデルやデータソースなど、すべてのテナントレベルAPIも利用できます。',
      apiKeyCapabilityGroupCollaboration: 'メンバーとテナント',
      apiKeyCapabilityGroupTenant: 'テナント設定',
      capabilityTenantFull: 'テナント全体へのアクセス',
      capabilityTenantFullHint: 'モデル、ベクトルストア、データソース、チャネルを含むすべてのテナントレベルAPIを許可します。ナレッジベースの範囲指定は適用されません。',
      capabilityIngestHint: '許可されたナレッジベースにコンテンツを書き込めます（ドキュメントのアップロード、チャンク・FAQ・タグ・Wikiの編集）。ナレッジベースやエージェントの作成、ナレッジベースの中身の一括削除はできず、選択したナレッジベースの範囲に限定されます。',
      capabilityManageKbsHint: 'ナレッジベースのライフサイクル全体（作成、コピー、更新、削除、初期化・設定の変更）を管理できます。既存のナレッジベースへの操作（コピー・更新・削除）は選択した範囲に限定されます。新規作成に制限はありません（新しいナレッジベースはこのテナントに属します）。',
      capabilityMessageHistoryHint: 'テナントのチャット履歴の検索と、チャット履歴の統計の読み取りができます。テナント設定へのアクセス権は付与されません。',
      capabilityManageModelsHint: 'モデル定義、認証情報、接続確認、クラウドサービスの認証情報を管理します。',
      capabilityManageStorageBackendsHint: 'オブジェクト/ファイルストレージのバックエンドインスタンス（S3互換やローカルファイルストレージなど）について、作成・更新・削除、接続テスト、テナントデフォルトの選択を管理します。',
      capabilityManageMembersHint: 'ワークスペースのメンバー、ロール、招待、招待リンクの一覧表示と管理を行います。APIキーの管理、ワークスペースの削除、オーナー権限の移譲は含まれません。',
      capabilityManageSpaces: 'スペースの管理',
      capabilityManageSpacesHint: '組織テナント、参加フロー、テナントのメンバー、招待、共有テナントの公開範囲を管理します。ナレッジベースやエージェントの共有管理権限は付与されません。',
      capabilityManageTenantSettings: 'テナント設定の管理',
      capabilityManageTenantSettingsHint: 'APIのエンドユーザ識別モード、リクエストヘッダー設定、ワークスペースのKV設定など、ワークスペースレベルの連携設定を読み取り・更新します。APIキーの管理、メンバー管理、ワークスペースの削除、オーナー権限の移譲は含まれません。',
      modeTenant: 'テナントのみ',
      signedFlowDetail: 'HMACシークレットはプラットフォームと信頼できる自社バックエンドにのみ保存し、リクエストに含めたりブラウザに配布したりしないでください。リクエストヘッダーで送るのは、そのシークレットで署名したJWT文字列（発行ごと、または有効期限切れ後に変わります）であり、シークレット自体ではありません。JWTにはsub（外部ユーザID）、tenant_id、aud=weknora、exp（有効期間は最大24時間）を含める必要があります。',
      requireDirectHeaderDesc: '有効にすると、ユーザIDヘッダーのないAPIキーリクエストは拒否されます。無効の場合、すべてのリクエストはユーザを区別せずテナント全体として扱われます。',
      hmacSecretDesc: 'プラットフォームに保存されているものと同じシークレットです。JWTの署名のためバックエンドでのみ使用し、リクエストヘッダーとして送信しないでください。',
      playgroundTenantModeHint: 'ワークスペースのみモードでは外部ユーザの識別情報を送信しません。すべてのAPIセッションが同じワークスペースレベルのプリンシパルを使用します。',
      playgroundNeedApiKey: 'このテナントにはAPIキーがありません。',
      editApiKeyScopeHint: '空欄の場合はこのテナント内のすべてのナレッジベースを許可します。変更はすべて即座に反映されます。'
    },
    mcpserver: {
      subtitle: 'このテナントを MCP サーバーとして公開し、Claude Desktop、Cursor、Claude Code などの MCP クライアントから直接接続できます。エンドポイントごとにトークン、ナレッジベース範囲、ツール一覧を設定します。',
      kbScopePlaceholder: '空欄でテナント内のすべて',
      kbScopeHint: '検索・質問応答・書き込みのすべてのツールはこの範囲に限定されます。空欄の場合はテナント全体です。'
    }
  },
  datasource: {
    resumeFailed: '再開に失敗しました'
  },
  agentEditor: {
    agentType: {
      kbMismatch: {
        quickAnswer: 'クイック回答モードにはRAG検索が必要です'
      }
    },
    im: {
      descriptionRestricted: 'エージェントをインスタントメッセージングプラットフォームに接続：WeCom、Feishu、DingTalkに対応'
    },
    desc: {
      memoryEnabled: 'このエージェントが長期メモリを読み取り、追記できるようにします。無効にすると、このエージェントとの会話はメモリを読み取らず、新しいメモリも追加しません。テナントまたは個人の設定が無効の場合、ここで有効にしても反映されません'
    }
  },
  kbSettings: {
    parser: {
      engines: {
        weknoracloud: {
          name: 'クラウドサービス',
          desc: 'クラウドサービスによるドキュメント解析'
        },
        anydoc: {
          desc: 'プロセス内で動作するOfficeドキュメントの解析エンジン（外部サービス不要）'
        }
      }
    },
    vectorStore: {
      engineDesc: 'グローバルのベクトルストア設定からストアを選択します。システムデフォルトのままにすると、テナント全体のRETRIEVE_DRIVERエンジンが使用されます。'
    }
  },
  organization: {
    subtitle: '共有テナントを作成したり参加したりすることで、複数のテナントがナレッジベースやエージェントを共有して協働できます',
    addMember: {
      tipTenant: 'メンバーの単位はワークスペースです。ワークスペースが参加すると、そのすべてのユーザがこの共有スペースへのアクセス権を持ちます。以下の検索結果はワークスペース単位で重複を除いています。',
      searchTenant: 'テナント ID',
      searchTenantPlaceholder: '完全なテナント ID を入力',
      searchTenantHint: '完全なワークスペース ID で検索するか、招待リンクを共有してください。'
    },
    settings: {
      membersDesc: '共有テナントのメンバーとロールを確認・管理します。各メンバーは1つのテナントを表し、同じテナントのすべてのユーザがこの共有テナントへのアクセスを共有します。'
    },
    join: {
      alreadyMember: 'すでにこの共有テナントのメンバーです',
      confirmTitle: '共有テナントへの参加を確認',
      failed: '共有テナントへの参加に失敗しました',
      goToOrganizations: '共有テナント一覧へ移動',
      joining: '共有テナントに参加しています...',
      success: '共有テナントに参加しました！'
    },
    rbac: {
      needTenantAdminTip: 'この操作には、現在のテナントで管理者以上のロールが必要です。テナントのオーナーにお問い合わせください。',
      cannotCreate: 'このテナントでのロールでは権限が不足しているため、共有テナントを作成できません',
      cannotJoin: 'このテナントでのロールでは権限が不足しているため、共有テナントへの参加や参加申請ができません',
      cannotManage: 'このテナントでのロールでは権限が不足しているため、この共有テナントを管理できません'
    },
    joinFailed: '共有テナントへの参加に失敗しました',
    joinSuccess: '共有テナントに参加しました'
  },
  mcpServiceDialog: {
    viewTitle: 'MCPサービスを表示',
    testResultTitle: 'テスト結果',
    stdioLaunch: '起動コマンド'
  },
  modelSettings: {
    debug: {
      thinkOff: '思考オフ',
      thinkOn: '思考オン',
      thinking: '思考モード',
      thinkingDesc: '思考に対応したモデルにのみ適用されます'
    },
    builtinModels: {
      description: '組み込みモデルはすべてのテナントに表示されます。機密情報は非表示で、編集や削除はできません。',
      descriptionAdmin: '組み込みモデルはすべてのテナントに表示されます。システム管理者は設定と認証情報を編集できますが、削除はデプロイ側で管理されます。'
    }
  },
  mcpSettings: {
    view: '表示'
  },
  platform: {
    independentTenant: '独立したテナント'
  },
  theme: {
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode'
  },
  model: {
    editor: {
      lkeap: {
        secretIdLabel: 'SecretId',
        secretIdPlaceholder: 'Tencent Cloud APIのSecretId',
        secretKeyLabel: 'SecretKey',
        secretKeyPlaceholder: 'Tencent Cloud APIのSecretKey',
        regionLabel: 'リージョン',
        regionPlaceholder: 'ap-guangzhou',
        regionDesc: 'RunRerankはap-beijing、ap-guangzhouなどに対応しています。デフォルト値: ap-guangzhou',
        rerankCredentialHint: 'リランクはTencent CloudのAPI署名（OpenAI形式のLKEAP APIキーではありません）を使用します。SecretId/SecretKeyはCAMコンソールで作成してください。'
      },
      providers: {
        novita: {
          label: 'Novita AI',
          description: 'moonshotai/kimi-k2.5、zai-org/glm-5、minimax/minimax-m2.7、qwen/qwen3-embedding-0.6bなど'
        },
        nvidia: {
          label: 'NVIDIA',
          description: 'deepseek-ai-deepseek-v3_1、nv-embed-v1、rerank-qa-mistral-4bなど'
        },
        lkeap: {
          label: 'Tencent Cloud LKEAP',
          description: 'DeepSeek-R1、DeepSeek-V3、lke-reranker-baseなど'
        },
        longcat: {
          label: 'LongCat AI',
          description: 'LongCat-Flash-Chat、LongCat-Flash-Thinkingなど'
        },
        qianfan: {
          label: 'Baidu Qianfan',
          description: 'ernie-5.0-thinking-preview、embedding-v1、bce-reranker-baseなど'
        },
        moonshot: {
          label: 'Moonshot',
          description: 'kimi-k2-turbo-preview、moonshot-v1-8k-vision-previewなど'
        },
        qiniu: {
          label: 'Qiniu Cloud',
          description: 'deepseek/deepseek-v3.2-251201、z-ai/glm-4.7など'
        },
        modelscope: {
          label: 'ModelScope',
          description: 'Qwen/Qwen3-8B、Qwen/Qwen3-Embedding-8Bなど'
        },
        gpustack: {
          label: 'GPUStack',
          description: 'GPUStackにデプロイ済みのモデルを選択してください'
        },
        gemini: {
          label: 'Google Gemini',
          description: 'gemini-3-flash-preview、gemini-2.5-proなど'
        },
        mimo: {
          label: 'MiMo',
          description: 'mimo-v2-flash'
        },
        minimax: {
          label: 'MiniMax',
          description: 'MiniMax-M3、MiniMax-M2.7、MiniMax-M2.7-highspeedなど'
        },
        hunyuan: {
          label: 'Hunyuan',
          description: 'hunyuan-pro、hunyuan-standard、hunyuan-embeddingなど'
        },
        deepseek: {
          label: 'DeepSeek',
          description: 'deepseek-chat、deepseek-reasonerなど'
        },
        volcengine: {
          label: 'Volcengine',
          description: 'doubao-1-5-pro-32k-250115、doubao-embedding-vision-250615など'
        },
        jina: {
          label: 'Jina',
          description: 'jina-clip-v1、jina-embeddings-v2-base-zhなど'
        },
        siliconflow: {
          label: 'SiliconFlow',
          description: 'deepseek-ai/DeepSeek-V3.1など'
        },
        generic: {
          label: 'カスタム（OpenAI互換）',
          description: '汎用のAPIエンドポイント'
        },
        requesty: {
          label: 'Requesty',
          description: 'openai/gpt-4o-mini、anthropic/claude-sonnet-4-5など'
        },
        openrouter: {
          label: 'OpenRouter',
          description: 'openai/gpt-5.2-chat、google/gemini-3-flash-previewなど'
        },
        zhipu: {
          label: 'Zhipu BigModel',
          description: 'glm-4.7、embedding-3、rerankなど'
        },
        aliyun: {
          label: 'Aliyun DashScope',
          description: 'qwen-plus、tongyi-embedding-vision-plus、qwen3-rerankなど'
        },
        azure_openai: {
          label: 'Azure OpenAI',
          description: 'Microsoft AzureでホストされるOpenAIサービス'
        },
        anthropic: {
          label: 'Anthropic',
          description: 'ネイティブのAnthropic Messages API経由のClaudeモデル'
        },
        openai: {
          label: 'OpenAI',
          description: 'gpt-5.2、gpt-5-miniなど'
        },
        litellm: {
          label: 'LiteLLM',
          description: '100以上のプロバイダ（OpenAI、Anthropic、Gemini、Bedrockなど）へのセルフホスト型プロキシです。プレースホルダのURLを置き換えてください。ループバックのホストにはSSRF_WHITELISTの設定が必要です。'
        }
      },
      thinkingControl: {
        thinkingType: {
          label: 'thinking.type',
          hint: 'Volcengine Ark、Tencent LKEAP（DeepSeek V3など。LKEAPのデフォルト値。R1では「送信しない」を使用）'
        },
        enableThinking: {
          label: 'enable_thinking',
          hint: 'Alibaba DashScope: qwen3、qwen-plus、qwen-max、qwen-turbo'
        },
        chatTemplateKwargs: {
          label: 'chat_template_kwargs',
          hint: 'OpenAI互換のカスタムゲートウェイ、NVIDIA NIM、vLLM / ローカルのQwen'
        },
        none: {
          label: '思考関連のフィールドを送信しない',
          hint: 'エージェントの「思考モード」の切り替えは効果がなく、リクエストに思考パラメータは送信されません'
        }
      },
      thinkingControlDesc: 'エージェントの「思考モード」のオン/オフをAPIにどう送信するかを設定します。可能な場合はベンダやモデルに応じて自動選択されます。お使いのAPIドキュメントに合わせて変更してください。「送信しない」を選ぶと、エージェントの思考モードの切り替えは効果がありません。',
      thinkingControlLabel: '思考モードのリクエスト形式',
      volcengine: {
        accessKeyLabel: 'Access Key ID',
        accessKeyPlaceholder: 'VolcengineのAccess Key ID',
        secretKeyLabel: 'Secret Access Key',
        secretKeyPlaceholder: 'VolcengineのSecret Access Key',
        rerankCredentialHint: 'リランクはArkのAPIキーではなく、VikingDBのAK/SK署名を使用します。推奨モデル: doubao-seed-rerank。'
      }
    }
  },
  error: {
    tenant: {
      listFailed: 'テナント一覧の取得に失敗しました',
      searchFailed: 'テナントの検索に失敗しました',
      updateFailed: 'テナント情報の更新に失敗しました',
      deleteFailed: 'テナントの削除に失敗しました',
      createApiKeyFailed: 'APIキーの作成に失敗しました',
      createFailed: '作成に失敗しました',
      deleteApiKeyFailed: 'APIキーの削除に失敗しました',
      listApiKeysFailed: 'APIキー一覧の取得に失敗しました'
    },
    auth: {
      getTenantFailed: 'テナント情報の取得に失敗しました'
    }
  },
  system: {
    versionDescription: 'アプリケーションサービス（weknora-app）のバージョン',
    frontendVersionDescription: 'UI（weknora-ui）のビルドバージョン',
    globalSettings: {
      description: 'プラットフォーム全体のランタイム設定です。保存するとすべてのテナントに即座に反映されます。システム管理者のみが表示・編集できます。',
      audit: {
        target: {
          bulkQuotaDiff: '{count}件のテナントに適用（{gb}GB）'
        },
        outcome: {
          accepted: '承認済み',
          canceled: 'キャンセル済み',
          failed: '失敗',
          partial: '一部完了'
        }
      },
      bulkApply: {
        label: '既存のすべてのテナントに適用',
        tooltip: '値を保存してもデフォルトでは新規テナントにのみ適用されます。ここをクリックすると既存のすべてのテナントも上書きします。',
        confirmBody: '既存のすべてのワークスペースのストレージクォータを{value}GBに上書きします。運用担当者が個別に調整したワークスペースも上書きされます。続行しますか？',
        success: '{count}件のテナントのストレージクォータを{gb}GBに更新しました',
        failed: 'すべてのテナントへの適用に失敗しました'
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
        description: 'ローカルユーザアカウントを新規に作成します。プラットフォームのデフォルトのテナントモードが「個人テナントを作成」の場合、自分で登録したユーザと同様に個人テナントが作成されます。'
      },
      admins: {
        confirm: {
          promote: {
            body: '{email}をシステム管理者に昇格しますか？このユーザはプラットフォームレベルの権限（すべてのテナント、システム設定、管理者一覧へのアクセス）を得ます。'
          }
        }
      },
      confirm: {
        bodySandboxDockerEnabled: '有効にすると、テナント管理者がサンドボックスをローカルのDockerデーモンに接続できるようになります。ローカルのdocker.sockはホストのroot権限に相当します。デーモンをマウントするプライベートな単一ノード環境、またはTLSで保護されたリモートのtcp://エンドポイントを使用する場合にのみ利用してください。'
      },
      enumLabels: {
        auth: {
          default_tenant_mode: {
            create_personal: '個人テナントを作成',
            tenantless: 'テナントを作成しない'
          }
        }
      },
      keyDescriptions: {
        tenant: {
          max_owned_per_user: 'スーパーユーザ以外がセルフサービスで所有できるテナント数の上限です。テナント作成のたびに参照され、保存後すぐに反映されます。0を指定すると組み込みのデフォルト値10が使われ、負の値を指定すると上限が無効になります（公開環境では非推奨）。',
          self_service_creation_enabled: 'スーパーユーザ以外が自分でワークスペースを作成できるかどうかです。無効にすると、一般ユーザは招待によって既存のワークスペースに参加することしかできません。ワークスペース横断のスーパーユーザは対象外です。すぐに反映されます。',
          default_storage_quota_gb: '新規ワークスペースの作成時に割り当てられるデフォルトのストレージクォータ（GB）です。ベクトル、原本、テキスト、インデックスなどのデータが対象です。作成時にのみ参照されるため、変更は新規作成のワークスペースにのみ適用され、既存のワークスペースには遡って反映されません。0または負の値の場合は組み込みのデフォルト値10GBが使われます。',
          auto_create_api_key: '新規テナントにfull_accessのAPIキーを自動作成し、作成レスポンスで平文のトークンを返します。従来の動作に依存する連携でのみ利用してください。デフォルトでは無効で、APIキーは明示的に作成することを推奨します。',
          auto_accept_invitation: '有効にすると、登録済みユーザをメールで招待した際に、受信確認を待たずにすぐメンバーとして追加されます。無効の場合、招待された側がメールから承諾する必要があります。すぐに反映されます。'
        },
        auth: {
          default_tenant_mode: '公開登録後のワークスペース作成方式です。create_personalはオーナー権限のワークスペースを作成し、tenantlessはアカウントのみを作成して、ユーザが招待を承諾するかワークスペースを作成するまで待ちます。新規ユーザにのみ適用されます。'
        }
      },
      keyLabels: {
        tenant: {
          max_owned_per_user: 'ユーザごとの所有テナント数の上限',
          self_service_creation_enabled: 'ユーザによるテナント作成を許可',
          default_storage_quota_gb: '新規テナントのデフォルトストレージクォータ（GB）',
          auto_create_api_key: '新規テナントにAPIキーを自動作成'
        },
        auth: {
          default_tenant_mode: 'デフォルトのテナント作成方式'
        }
      },
      runtime: {
        tasks: {
          tenantLabel: 'テナントID'
        }
      },
      sections: {
        tenant: {
          tab: 'テナントのデフォルト値{count}',
          title: 'テナントのデフォルト値',
          description: '既存のテナントを変更せずに、新規テナントの初期クォータと互換動作を設定します。'
        },
        access: {
          description: 'システム管理者、公開登録、テナント作成のルールを管理します。'
        }
      }
    }
  },
  tenant: {
    title: 'テナント情報',
    currentTenant: '現在のテナント',
    switchTenant: 'テナントを切り替え',
    sectionDescription: 'テナントの詳細な設定を表示します',
    searchPlaceholder: '名前で検索、またはテナントIDを入力...',
    noMatch: '一致するテナントが見つかりません',
    switchSuccessTitle: 'テナントを切り替えました',
    loadTenantsFailed: 'テナント一覧の読み込みに失敗しました',
    messages: {
      fetchFailed: 'テナント情報の取得に失敗しました'
    },
    deleteDangerZone: {
      title: 'このテナントを削除',
      desc: 'テナント全体とその設定を削除します。メンバーはナレッジベース、エージェント、APIキーにアクセスできなくなります。',
      button: 'テナントを削除',
      confirmTitle: 'このテナントを削除しますか？',
      confirmBody: '「{name}」を削除し、そのナレッジベース、エージェント、メンバー、APIキーが利用できなくなります。この操作は取り消せません。',
      confirmHint: '削除を確認するには、テナント名「{name}」を入力してください。',
      nameMismatch: 'テナント名が一致しません',
      success: 'テナントを削除しました',
      failed: 'テナントの削除に失敗しました',
      confirm: 'ワークスペースを削除'
    },
    leaveDangerZone: {
      title: 'このテナントから退出',
      desc: 'このテナントのメンバーから外れます。ナレッジベースやエージェントにアクセスできなくなります。後から再度招待を受けることは可能です。',
      button: 'テナントから退出'
    },
    storage: {
      quotaDescription: 'テナントに割り当てられた合計ストレージ容量'
    },
    details: {
      idLabel: 'テナントID',
      idDescription: 'テナントの一意の識別子',
      nameLabel: 'テナント名',
      nameDescription: 'テナントの名前',
      descriptionLabel: 'テナントの説明',
      descriptionDescription: 'テナントの詳細な説明',
      businessLabel: 'テナントの業種',
      businessDescription: 'テナントが属する業務領域',
      statusLabel: 'テナントのステータス',
      statusDescription: 'テナントの現在の稼働ステータス',
      createdAtLabel: 'テナントの作成日時',
      createdAtDescription: 'テナントが作成された日時',
      editNamePlaceholder: '新しいテナント名を入力してください',
      editNameRequired: 'テナント名は空にできません',
      editNameSuccess: 'テナント名を更新しました',
      editNameFailed: 'テナント名の更新に失敗しました',
      editDescriptionPlaceholder: '新しいテナントの説明を入力してください',
      editDescriptionSuccess: 'テナントの説明を更新しました',
      editDescriptionFailed: 'テナントの説明の更新に失敗しました'
    },
    create: {
      action: 'テナントを新規作成',
      dialogTitle: 'テナントを新規作成',
      dialogSubtitle: 'テナントは独自のナレッジベースとメンバーを持ちます。作成するとあなたが新しいテナントのオーナーになります。',
      nameLabel: 'テナント名',
      nameRequired: 'テナント名を入力してください',
      descriptionPlaceholder: 'このテナントの用途を簡単に入力してください',
      success: 'テナントを作成しました',
      failed: 'テナントの作成に失敗しました',
      disabled: 'このシステムでは招待によるテナントへの参加のみが許可されています。自分で作成することはできません。',
      needAdmin: 'Only tenant owners or admins can create a tenant.'
    },
    switcher: {
      menuLabel: 'テナントを切り替え',
      homeTooltip: '自分のテナント',
      empty: '所属しているテナントは1つだけです'
    }
  },
  chat: {
    sandbox: {
      desktopPlaceholder: 'デスクトップの可視化は近日対応予定です'
    },
    scrollToBottom: '一番下へ',
    copyFailed: 'コピーに失敗しました',
    copySuccess: 'コピーしました',
    editorOpened: 'エディタを開きました',
    emptyContentWarning: '内容が空です',
    imageReadFailed: '画像の読み込みに失敗しました'
  },
  knowledgeEditor: {
    titleCreate: 'ナレッジベースを作成',
    share: {
      description: 'ナレッジベースを共有テナントに共有して、メンバーが利用できるようにします',
      tip1: '共有すると、共有テナントのメンバーは付与された権限に応じてこのナレッジベースを利用できます'
    },
    postCreateHint: {
      followUpDesc: '左側でデータソースを設定するか、共有管理から共有テナントに公開してください'
    }
  },
  embedPublish: {
    originsHint: 'Agentic の URL（B）ではなく、埋め込みを許可するホストサイト（A）を入力します。1 行に 1 つの Origin（例: https://shop.example.com）。1 件以上必須。*.example.com に対応。',
    webhookUrlPlaceholder: 'https://your-server.example.com/weknora/embed-events',
    webhookUrlDesc: '任意。プラットフォームがmessage_sent / message_receivedイベントをこのHTTPSエンドポイントにPOSTします。'
  },
  knowledgeList: {
    create: 'ナレッジベースを作成',
    sharedToOrgs: '{count}件の共有テナントに共有中',
    detail: {
      sourceTypeKbShare: 'ナレッジベースがこの共有テナントに直接共有されています',
      sourceOrg: '共有テナント'
    },
    sections: {
      tenantOthers: 'テナント・他のメンバー',
      tenantReadonly: 'テナント・閲覧のみ'
    },
    empty: {
      description: '右上の「ナレッジベースを作成」をクリックして、最初のナレッジベースを追加してください。'
    },
    uploadProgress: {
      uploadingTitle: '「{name}」にフォルダ内のドキュメントをアップロード中',
      detail: '{completed}/{total}ファイル完了',
      keepPageOpen: 'アップロード中はこのページを開いたままにしてください。',
      completedTitle: '「{name}」へのアップロードが完了しました',
      completedDetail: '{total}件のファイルをすべてアップロードしました。解析ステータスを表示するため一覧を更新しています...',
      refreshing: '解析ステータスを表示するため一覧を更新しています...',
      errorTip: '一部のファイルのアップロードに失敗しました。通知を確認してください。',
      unknownKb: 'ナレッジベース{id}'
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
      addedOk: 'MCP を追加しました',
      removedOk: 'MCP を削除しました',
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
        toolEnabled: 'ツール {name} を有効にしました',
        toolDisabled: 'ツール {name} を無効にしました',
        added: 'MCP を追加しました',
        removed: 'MCP を削除しました'
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
      allSources: 'すべての範囲',
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
      catBuiltin: '組み込みツール',
      catKnowledge: 'ナレッジベース',
      catWiki: 'Wiki',
      catDatabase: 'データベース',
      sourceChat: '会話',
      sourceWork: 'ワーク'
    },
    skills: {
      searchPlaceholder: 'Search skills...',
      emptyTitle: 'No skills yet',
      emptySearchTitle: 'No matching skills',
      emptyDesc: 'Install from a remote repo or upload a local skill file.',
      emptySearchDesc: 'Try another keyword or clear the search.',
      groupBuiltin: '組み込み',
      groupShared: 'テナント共有',
      builtinWorkNoSandbox: '組み込みのワークスキルはサンドボックスにインストールしません',
      sourceCommon: '共通',
      scopeAll: 'すべての範囲',
      fileTab: 'ファイル管理',
      depsTab: '依存関係の設定',
      uninstalled: 'スキルをアンインストールしました',
      uninstallFailed: 'スキルのアンインストールに失敗しました',
      loadFailed: 'Failed to load',
      remoteNone: 'インストールできるスキルが見つかりません',
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
    title: 'やあ！今日は何について話しましょうか？'
  },
  input: {
    agentMode: 'スマート推論',
    normalMode: 'クイック回答',
    messages: {
      agentSwitchedOn: 'スマート推論に切り替えました',
      agentSwitchedOff: 'クイック回答に切り替えました'
    },
    webSearch: {
      label: 'ウェブ検索'
    },
    placeholderAgent: '{name}に質問',
    placeholderKbAndWeb: '質問を入力してください。ナレッジベースとWeb検索に基づいて回答します',
    placeholderWebOnly: '質問を入力してください。Web検索に基づいて回答します',
    placeholderWithContext: '質問を入力してください。上で選択したナレッジベース／ファイルに基づいて回答します',
    fileUpload: {
      label: 'ファイルをアップロード',
      tooLarge: 'ファイルが大きすぎます',
      tooMany: 'ファイル数が多すぎます',
      tooltip: 'クリックまたはドラッグでファイルをアップロード'
    },
    imageUpload: {
      label: '画像をアップロード',
      tooltip: 'クリックまたはドラッグで画像をアップロード'
    }
  },
  manualEditor: {
    section: {
      basic: '基本情報'
    },
    view: {
      editLabel: '編集に戻る',
      previewLabel: '内容をプレビュー'
    },
    description: 'Markdownでナレッジを記述し、リアルタイムでプレビューできます'
  },
  file: {
    downloadFailed: 'ダウンロードに失敗しました'
  },
  mentionDetail: {
    belongsToOrg: '共有テナント: '
  },
  authStore: {
    errors: {
      parseTenantFailed: 'テナント情報の解析に失敗しました'
    }
  },
  auth: {
    loginAccount: 'ログインアカウント',
    loginAccountPlaceholder: 'ログインアカウントまたはメールアドレスを入力',
    loginAccountRequired: 'ログインアカウントを入力してください',
    firstTime: 'プラットフォームは初めてですか？',
    registerSubtitle: 'アカウントを作成してプラットフォームを使い始めましょう',
    loginError: 'ログインに失敗しました。ログインアカウントまたはパスワードを確認してください',
    workspaceOnboarding: {
      title: 'テナントを選択',
      description: 'テナントを作成して始めるか、招待を承諾して既存のテナントに参加してください。',
      create: 'テナントを作成',
      loadingPolicy: '利用できるテナントの選択肢を確認中…',
      policyLoadFailed: 'テナントの権限を読み込めませんでした。接続を確認して再試行してください。',
      inviteOnlyTitle: 'テナントへの招待待ち',
      inviteOnlyDescription: '個人テナントの作成は無効になっています。テナント管理者からの招待を確認して承諾してください。',
      inviteOnlyNotice: 'このアカウントは招待によってのみ既存のテナントに参加できます',
      help: '今すぐテナントを作成することも、後で戻って招待を承諾することもできます。',
      inviteOnlyHelp: 'まだ招待がありませんか？登録したメールアドレスをテナント管理者に伝えて、招待を依頼してください。'
    }
  },
  inviteRegister: {
    success: '登録が完了しました。テナントに移動します…'
  },
  memorySettings: {
    workspaceDisabled: 'このテナントでは長期メモリが無効です。この切り替えは、管理者が有効にした後に反映されます。'
  },
  envVarSettings: {
    description: 'スキルとサンドボックスで使う個人用のキーです。プラットフォームのシステム設定やデプロイ設定ではありません。',
    introPersonalBody: 'あなた自身のチャットや実行にのみ注入されます。他のメンバーからは見えず、他のメンバーの値があなたの値を上書きすることもありません。',
    noConfigDescription: 'このテナントにはまだサンドボックスのバックエンドがないため、キーを設定する対象がありません。',
    skillHint: 'スキルごとに必要な項目が宣言されています。ここで事前に保存するか、会話の中で渡してください。テナントの管理者がスキルのカードで共通の値を設定することもできます。',
    statusWorkspace: 'テナントの値を使用中',
    clearConfirm: '{name}に設定した自分の値を削除しますか？テナントの値がある場合は、以後そちらが適用されます。'
  },
  memoryWorkspaceSettings: {
    enableLabel: 'このテナントで長期メモリを有効にする',
    enableDescription: 'オフにすると、このテナントのどの会話でもメモリの読み書きは行われません。',
    instructionsDescription: '抽出プロンプトに追加されるテナントのルールです。「顧客名は記録しない」など、製品側では判断できないポリシーを指定します。'
  },
  settings: {
    sandbox: {
      pageHint: 'サンドボックスは、エージェントのスキルスクリプトが実行される隔離環境です。テナントには複数の設定（Docker、E2B、CubeSandbox）を持たせることができ、各エージェントが1つを選択します。スキルは「スキル管理」ページから、選択した設定のイメージにインストールされます。設定を選択するまでスクリプトは無効のままです。',
      editorDescription: 'テナントのランタイムを設定します。Docker、CubeSandbox、E2Bは同じ管理フローを使用します。',
      scriptPolicyDesc: 'オフにすると、このテナントのエージェントはスキルの内容を読むことしかできません。すでに実行中のリモートサンドボックスは、セッション終了時に解放されます。',
      dockerHostRisk: '空欄またはunix://を指定するとプラットフォームホストのDockerデーモンを使用します。これはそのマシンのroot権限に相当します。単一ノードのプライベート環境でのみ使用してください。複数のテナントがホストを共有する場合はCubeまたはE2Bを推奨します。リモートのtcp://エンドポイントにはTLS証明書ディレクトリが必要です。',
      noConfigs: 'サンドボックスがまだありません。テナント設定のないエージェントはスキルスクリプトを実行できません。',
      disableScriptsConfirm: 'このテナントのすべてのエージェントが、サンドボックスでスキルスクリプトを実行しなくなります。スキルの内容を読むことは引き続き可能です。既存のリモートサンドボックスは自動的には破棄されません。関連するセッションを終了または削除して解放してください。続行しますか？',
      scriptsDisabled: 'このテナントのサンドボックス実行を無効にしました',
      scriptsEnabled: 'このテナントのサンドボックス実行を再開しました',
      namedBackendHint: 'テナント設定が唯一のランタイムの供給元です。設定のないエージェントはスキルスクリプトを実行できません。',
      weknoraTemplateTitle: 'プラットフォーム標準テンプレート',
      weknoraDockerImage: 'プラットフォーム標準イメージ',
      weknoraTemplateOverview: 'プラットフォームが標準ランタイムを提供します。テンプレートは接続後に検出され、存在しない場合は標準テンプレートが作成されます。',
      weknoraTemplateDescription: 'プラットフォームのスキルが必要とするPython、Node.js、CLIツール、ワークスペースパス、非root実行ユーザが含まれます。',
      templateLoadHint: 'クラスタの接続情報を入力して更新してください。プラットフォーム標準テンプレートがない場合は「作成」をクリックし、DNSやイメージを変更した場合は「再構築」をクリックしてください。',
      standardTemplateProvisioning: 'プラットフォーム標準テンプレートを作成しています。しばらくしてから更新してステータスを確認してください。',
      templateStepHint: 'このステップではクラスタのテンプレートを表示し、公式のCLIイメージがなければHubから構築します。デスクトップ（XFCE）テンプレートはサイズが大きいため、「作成」を押したときだけ構築します。DNSやイメージを変更した場合は該当カードから「再構築」してください。テンプレートの準備ができたら次へ進めます。',
      templateUntaggedHint: 'ビルドは完了しましたが、デフォルトタグが付いたものがないため、サンドボックス作成時にこのテンプレートを解決できません。E2Bで削除して更新すると、プラットフォームが再構築します。',
      weknoraStandardTemplate: 'プラットフォーム標準テンプレート',
      replaceStandardTemplateConfirm: 'DNSを含む現在の設定でプラットフォーム標準テンプレートを再構築します。既存の起動可能なテンプレートは、新しいテンプレートの準備が整うまで削除されません。',
      cubeDnsServersHelp: '任意。プラットフォーム標準テンプレートに書き込まれるネームサーバのIPです。空欄の場合はクラスタのデフォルト（通常は119.29.29.29）を使用します。パブリックリゾルバへのUDP/53がブロックされている場合は、Cubeホストの/etc/resolv.confから到達可能なアドレス（10/8、172.16/12、192.168/16を除く）を指定してください。既存の標準テンプレートには、テンプレートカードで「再構築」を実行した後にのみ反映されます。',
      dockerTlsCertPathHelp: 'プラットフォームホスト上でca.pem、cert.pem、key.pemを格納しているディレクトリです。リモートデーモンでは必須です。証明書はデプロイ側でマウントされ、ここには保存されません。',
      dockerIdleTtlHelp: 'Dockerデーモン自体にはアイドルタイムアウトがありません。この時間コマンドが実行されなかったコンテナはプラットフォームが回収し、セッションが続く場合は再作成します。空欄の場合は1800秒です。',
      skillEnv: {
        workspaceTitle: 'テナント共通の値',
        saveSuccess: 'テナントの値を保存しました',
        saveFailed: 'テナントの値を保存できませんでした。',
        clearConfirm: '{name}のテナントの値をクリアしますか？宣言自体は残ります。独自の値を持たないメンバーは、この値を参照できなくなります。',
        clearSuccess: 'テナントの値をクリアしました。'
      },
      backendDescriptions: {
        docker: 'このプラットフォームホスト上でセッションごとに長時間稼働するコンテナを保持します。スクリプトとファイルはそのコンテナ内に残ります'
      }
    },
    skills: {
      description: 'スキルはテナントのカタログに登録されます。まず登録し、その後1つ以上のサンドボックスにインストールしてください。エージェントは、自身のサンドボックスで準備完了しているスキルのみ有効化できます。',
      host: {
        description: 'スキルはテナントのカタログにあります。このコンピューターにインストールしてから、エージェントで有効にできます。'
      },
      scope: '適用範囲',
      addStepRegisterDesc: 'ソースを貼り付けるかzipをアップロードして、テナントのカタログにスキルを追加します。'
    },
    tenantInfo: 'テナント情報',
    parser: {
      checking: '確認中…'
    },
    weknoraCloud: {
      title: 'クラウドサービス',
      credentialConfigured: 'クラウドサービスの認証情報は設定済みです。',
      credentialUnconfigured: 'クラウドサービスの認証情報が未設定です。先にAPPIDとAPPSECRETを設定してください。',
      modelHintConfigured: 'クラウドサービスの認証情報は設定済みです。対応モデルは以下を参照してください:',
      modelsSection: {
        descReady: 'チャット、検索、リランク、画像理解（VLM）の4種類のクラウドサービス標準モデルを登録します。'
      },
      saveSuccess: '資格情報を保存しました'
    },
    roleDenied: {
      desc: '現在のロールではこの設定ページにアクセスできません。このテナントの管理者に必要なロールの付与を依頼してください。'
    },
    navGroups: {
      workspace: 'テナント'
    },
    workspaceSettings: 'テナント設定',
    storage: {
      saveSuccess: '保存しました'
    }
  },
  agent: {
    workSubtitle: 'Manage work agents. They produce intermediate files and artifacts.',
    builtinWikiQa: 'Wiki Q&A',
    builtinTableAnalysis: 'Table Analysis',
    editor: {
      rerankModelOptionalHint: '現在の範囲にRAG型のナレッジベースがないため任意です。後からRAG型ナレッジベースを追加した場合は、テナントのデフォルトリランクモデルが自動的に使用されます。明示的に設定することを推奨します。',
      hostSkillsSelectionDesc: 'テナントのスキルが一覧されます。このコンピューターにインストール済みのものはすぐ使え、それ以外は先にインストールしてください。',
      skillsSelectionDesc: 'テナントのスキルがすべて表示されます。インストール済みのものはすぐに使用でき、それ以外は先にインストールが必要です。',
      noSkillsAvailable: 'テナントのカタログにスキルがまだありません。',
      sandboxNoConfigs: 'このテナントにはサンドボックスがないため、スキルのスクリプトは実行されません。',
      maxCompletionTokensCustom: 'カスタム'
    },
    shareScope: {
      desc: 'スペースのメンバーはこのエージェントを読み取り専用で利用し、現在の設定がそのまま適用されます。エージェントへの変更は共有先のスペースにも反映されます。スペースのメンバーがナレッジベースの内容を編集できるようにするには、ナレッジベースをスペースに共有してください。',
      skillSecretsWarning: 'このエージェントはスキルを使用します。テナントのメンバーが利用すると、スキルはこのテナントのサンドボックスで、管理者が設定した環境変数（API キーなど）とともに実行され、メンバーはエージェントにその値を出力させることができます。これを許容できる場合にのみ共有してください。'
    },
    empty: {
      sharedDescription: 'テナントに参加するか、他のユーザにエージェントの共有を依頼してください'
    },
    sections: {
      tenantOthers: 'テナント · 他のメンバー',
      tenantReadonly: 'テナント · 閲覧のみ'
    },
    tabs: {
      platform: 'Chat',
      work: 'Work'
    },
    mode: {
      normal: 'クイック回答',
      agent: 'スマート推論'
    },
    type: {
      normal: 'クイック回答',
      agent: 'スマート推論'
    },
    workManage: {
      viewSwitch: 'Agent management view switch',
      sectionAgents: 'Agents',
      sectionSubagents: 'Subagents',
      deleteBuiltinWarning: 'Built-in agents cannot be deleted',
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
          desc: 'The model that drives this agent. Leave empty to use the system default.'
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
      DOCREADER_UNAVAILABLE_SUGGESTION: 'このファイル形式に使える解析エンジンがないか、サービスに接続できません。設定を確認して再試行してください。',
      DOCREADER_TIMEOUT_SUGGESTION: 'ファイルが大きい、または解析サービスが混雑しています。ファイルを分割して再試行するか、解析サービスの負荷を確認してください。',
      DOCREADER_PARSE_FAILED_SUGGESTION: 'ファイルが破損している、文字コードが対応外、または解析エンジンでエラーが発生した可能性があります。ファイルを確認して再アップロードしてください。',
      CHUNKING_FAILED: 'チャンク分割に失敗しました',
      CHUNKING_FAILED_SUGGESTION: 'テキストを分割できませんでした。チャンクサイズを調整して再解析してください。',
      EMBEDDING_RATE_LIMIT: '埋め込みリクエストが制限されています',
      EMBEDDING_RATE_LIMIT_SUGGESTION: '埋め込みモデルがレート制限を返しました。しばらくしてから再試行するか、モデルの上限を上げてください。',
      EMBEDDING_PROVIDER_FAIL: 'ベクトル化に失敗しました',
      EMBEDDING_PROVIDER_FAIL_SUGGESTION: '埋め込みモデルの呼び出しに失敗しました。モデル設定、キー、モデル名を確認して再試行してください。',
      VECTORSTORE_WRITE_FAILED: 'ベクトルストアへの書き込みに失敗しました',
      VECTORSTORE_WRITE_FAILED_SUGGESTION: '埋め込みは作成されましたが、ベクトルストアへの書き込みに失敗しました。接続と容量を確認して再試行してください。',
      MULTIMODAL_VLM_FAILED: '画像理解に失敗しました',
      MULTIMODAL_VLM_FAILED_SUGGESTION: '画像の認識または説明に失敗しました。マルチモーダルモデルを確認して再試行してください。',
      MULTIMODAL_ALL_FAILED: 'すべての画像処理に失敗しました',
      MULTIMODAL_ALL_FAILED_SUGGESTION: 'すべての画像タスクが失敗しました。本文の検索は引き続き利用できます。マルチモーダルモデルを確認して再試行してください。',
      TASK_TIMEOUT: '処理タスクがタイムアウトしました',
      TASK_TIMEOUT_SUGGESTION: 'タスクの再試行回数を使い切りました。後で再解析するか、大きなファイルは分割してください。',
      UNKNOWN: '処理に失敗しました',
      SERVER_RESTART: '再起動により処理が中断されました',
      SERVER_RESTART_SUGGESTION: 'アプリケーション再起動時にタスクが中断されました。ドキュメントを再解析してください。',
      UPSTREAM_FAILED: '前の段階が失敗したため、この段階はキャンセルされました',
      UPSTREAM_FAILED_SUGGESTION: '前の段階が完了しなかったため、この段階はキャンセルされました。失敗した段階を対処してから再試行してください。',
      QUESTION_FAILED: '質問生成に失敗しました',
      QUESTION_FAILED_SUGGESTION: 'チャンクの質問を生成できませんでした。対話モデルの設定を確認して再試行してください。',
      GRAPH_EXTRACT_FAILED: 'ナレッジグラフの抽出に失敗しました',
      GRAPH_EXTRACT_FAILED_SUGGESTION: 'グラフ抽出が完了しませんでした。モデル設定を確認して再試行してください。',
      SUMMARY_FAILED: '要約の生成に失敗しました',
      SUMMARY_FAILED_SUGGESTION: 'ドキュメントの要約を作成できませんでした。対話モデルの設定を確認して再試行してください。',
      DOCREADER_UNAVAILABLE: 'ドキュメント解析サービスを利用できません',
      DOCREADER_TIMEOUT: 'ドキュメント解析がタイムアウトしました',
      DOCREADER_PARSE_FAILED: 'ドキュメント解析に失敗しました'
    },
    head: {
      completedWithActiveTrace: '処理は完了しましたが、{n}件のトレースタスクがまだ実行中です',
      postprocessTasks: '後処理: 実行中{running}件／失敗{failed}件／完了{completed}件'
    },
    processConfig: {
      chunking: 'チャンク',
      chunkSize: 'サイズ {n}',
      parentChildOn: '親子チャンクオン',
      parentChildOff: '親子チャンクオフ',
      parser: '解析エンジン',
      multimodal: 'マルチモーダル',
      asr: '音声認識',
      question: '質問生成',
      questionOn: 'オン、{n}件',
      on: 'オン',
      off: 'オフ'
    },
    total: '合計{d}'
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
      fromOrg: '提供元テナント'
    },
    allUploadFailed: 'すべてのファイルのアップロードに失敗しました（{count}件）',
    allUploadSuccess: 'すべてのファイルをアップロードしました（{count}件）',
    batchTagAvailableSection: '選択可能',
    batchTagNoSelected: '未選択',
    batchTagSelectedSection: '選択中',
    fileExists: 'ファイルは既に存在します',
    partialUploadSuccess: '一部のファイルをアップロードしました（成功: {success}件、失敗: {fail}件）',
    tagClearAction: '選択を解除',
    tagEditAvailableSection: '選択可能',
    tagEditNoSelected: '未選択',
    tagEditSearch: 'タグを検索...',
    tagEditSelectedSection: '選択中',
    tagNewPlaceholder: '新しいタグ名を入力し、Enterキーで追加',
    uploadAllFailed: 'すべてのファイルのアップロードに失敗しました',
    uploadAllSuccess: '{count}件のファイルをアップロードしました。',
    uploadFailed: 'ファイルのアップロードに失敗しました。',
    uploadPartialSuccess: 'アップロード完了: 成功{success}件、失敗{fail}件',
    uploadSuccess: 'ファイルをアップロードしました。',
    uploadingFolder: 'フォルダ内の{total}件のファイルをアップロード中...',
    selectKnowledgeBase: 'ナレッジベースを選択'
  },
  resourceOrigin: {
    tenant: 'テナント',
    tenantTooltip: 'このテナントの他のメンバーが作成',
    spaceTooltipWithTenant: '共有テナント「{space}」から共有 · 提供元{tenant}',
    sharedTooltip: '共有テナント経由で外部テナントからアクセス'
  },
  listSpaceSidebar: {
    workspace: 'テナント'
  },
  contextualGuide: {
    agentCreate: {
      steps: {
        navTools: {
          desc: 'スマート推論モードでは、検索やコード実行などの組み込みツールとMCPサービスを有効にできます。'
        },
        name: {
          desc: '分かりやすい名前を付けてください。スマート推論モードではデフォルトの名前が入力される場合があります。必要に応じて編集してください。'
        },
        mode: {
          desc: 'シンプルなQ&Aには「クイック回答」、ツールと多段階の思考が必要な複雑なタスクには「スマート推論」を使用します。'
        }
      }
    },
    kbCreate: {
      steps: {
        storage: {
          desc: '元ファイルの保存先（ローカルまたはオブジェクトストレージ）です。通常はテナントのデフォルト値で問題ありません。'
        }
      }
    },
    tenantModels: {
      steps: {
        done: {
          desc: 'モデルを保存したら設定を閉じ、「ナレッジベースを作成」をクリックしてください。ウィザードでタイプ、インデックス、モデルの紐付けを設定できます。'
        }
      }
    },
    kbList: {
      steps: {
        create: {
          desc: 'ナレッジベースにはドキュメントやFAQを格納します。下のハイライトされた「ナレッジベースを作成」ボタンをクリックすると、入力手順をご案内します。'
        }
      }
    }
  },
  newUserGuide: {
    steps: {
      knowledge: {
        desc: 'すべてはここから始まります。ドキュメント、Webページ、FAQをアップロードすると、プラットフォームが自動で解析してインデックスを作成します。ここをクリックしてナレッジベースを開いてください。'
      },
      welcome: {
        title: 'プラットフォームへようこそ'
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
    newChat: '新しいチャット'
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
      score: '総合スコア',
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
      input: '入力',
      output: '出力',
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
    fullSchema: '完全な定義',
    refresh: '今すぐ更新'
  }
}
