export interface ColumnSchema {
  field: string;
  type: string;
  nullable: 'YES' | 'NO';
  index: string;
  desc: string;
  dataDesc?: string; // 数据取值范畴与具体数据描述，例如枚举值详解
}

export interface IndustryTerm {
  term: string;
  keywords: string;
  description: string;
}

export interface SqlTemplate {
  title: string;
  sql: string;
  description: string;
}

export interface TableSchema {
  tableName: string;
  tableDesc: string;
  columns: ColumnSchema[];
}

export interface DataSource {
  id: string;
  name: string;
  type: 'MySQL' | 'PostgreSQL' | 'Kafka' | 'Hadoop' | 'Oracle' | 'MongoDB' | 'SQLServer' | 'Dameng' | 'OceanBase' | 'GenericJDBC' | string;
  domain: string; // classifications from domain-store
  status: '已连接' | '断开' | '连接中' | '异常';
  sessionStatus: '活跃使用中' | '空闲';
  connectivity: '正常' | '异常' | '未验证';
  lastTested?: string;
  host: string;
  port: string;
  databaseName: string;
  username: string;
  tables: TableSchema[];
  schemaText?: string;
  industryTerms?: IndustryTerm[];
  sqlTemplates?: SqlTemplate[];
}

const DEFAULT_SOURCES: DataSource[] = [
  {
    id: "src-1",
    name: "核心业务 MySQL",
    type: "MySQL",
    domain: "biz-fin",
    status: "已连接",
    sessionStatus: "空闲",
    connectivity: "正常",
    lastTested: "2026-05-29 08:30:15",
    host: "db-mysql.internal.net",
    port: "3306",
    databaseName: "finance_trade_db",
    username: "finance_reader",
    tables: [
      {
        tableName: "trade_ledgers",
        tableDesc: "财务交易流水表。记录公司日常资金流向、交易类型、收支状态，为智能体财务凭证、对账工作流提供业务实体引用数据。",
        columns: [
          { field: "ledger_id", type: "bigint(20)", nullable: "NO", index: "PRIMARY", desc: "主键流水号", dataDesc: "自增主键，从 10001 开始自增" },
          { field: "serial_no", type: "varchar(64)", nullable: "NO", index: "UNIQUE", desc: "全局唯一扣款或交易批次号", dataDesc: "格式如: TX_YYYYMMDD_xxxxxx" },
          { field: "amount", type: "decimal(18,4)", nullable: "NO", index: "IDX", desc: "交易发生金额", dataDesc: "采用正负数记录。正数代表用户充值或公司进账；负数代表商户提现或资金消耗支出，保留 4 位小数" },
          { field: "currency", type: "varchar(10)", nullable: "NO", index: "-", desc: "币种", dataDesc: "允许的枚举：CNY (人民币, 占比 95%), USD (美元), EUR (欧元)" },
          { field: "created_at", type: "timestamp", nullable: "NO", index: "IDX", desc: "资金实际入账/出账时间", dataDesc: "标准 ISO 时间格式，索引字段，支持快速范围检索" },
          { field: "department_id", type: "varchar(32)", nullable: "YES", index: "IDX", desc: "归属组织部门编码", dataDesc: "与部门表关联，如: DEP_RD, DEP_HR, DEP_MKT, DEP_FIN" }
        ]
      },
      {
        tableName: "user_accounts",
        tableDesc: "核心用户账单余额汇总表。支持AI智能体分析特定VIP用户的充值行为与资产变动历史。",
        columns: [
          { field: "user_uuid", type: "varchar(64)", nullable: "NO", index: "PRIMARY", desc: "全局唯一用户标识", dataDesc: "格式为 UUIDv4 生存串，如: e5b357f8-6cdb-4ea7" },
          { field: "current_balance", type: "decimal(18,2)", nullable: "NO", index: "-", desc: "当前可用余额（未冻结）", dataDesc: "必须大于等于 0" },
          { field: "frozen_deposit", type: "decimal(18,2)", nullable: "NO", index: "-", desc: "保证金/冻结款，用于风控评估", dataDesc: "代表正在提现审批中或被风控暂时封禁的金额" },
          { field: "vip_level", type: "int(11)", nullable: "NO", index: "IDX", desc: "用户等级", dataDesc: "整数枚举：0 = 普通用户 (占比 80%), 1 = 黄金会员, 2 = 钻石会员, 3 = 独角兽企业VIP (可拉账期授信)" },
          { field: "update_time", type: "timestamp", nullable: "NO", index: "-", desc: "最后一次账单余额变动更新时间", dataDesc: "任一余额变动都会自动触发触发器更新该时间" }
        ]
      }
    ],
    industryTerms: [
      { term: "流水分摊", keywords: "账期拆分, 部门共担, 分账", description: "指一笔交易批次 serial_no 中按 department_id 分摊到各中心的记账方式" },
      { term: "独角兽授信", keywords: "代付, 大额账期, 先用后付, VIP授信", description: "指 vip_level 为 3 级的特殊高净值VIP客户，本月额度可在下个月初统一结算" }
    ],
    sqlTemplates: [
      {
        title: "月度部门流水分摊报表",
        description: "按部门汇总当前自然月的所有正向收入与负向支出，输出净流入额",
        sql: "SELECT department_id, \n       SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS total_income,\n       SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) AS total_expense,\n       SUM(amount) AS net_ledger_amount\nFROM trade_ledgers\nWHERE created_at >= DATE_SUB(LAST_DAY(NOW()), INTERVAL 1 MONTH)\nGROUP BY department_id\nORDER BY net_ledger_amount DESC;"
      },
      {
        title: "查找超额冻结的风控可疑用户",
        description: "筛选冻结保证金占总可用余额比例超过 50% 的非独角兽大额可疑账户",
        sql: "SELECT user_uuid, current_balance, frozen_deposit, \n       (frozen_deposit / (current_balance + frozen_deposit + 0.01)) * 100 AS freeze_ratio\nFROM user_accounts\nWHERE vip_level < 3 AND frozen_deposit > 5000\nHAVING freeze_ratio > 50.0\nORDER BY freeze_ratio DESC;"
      }
    ]
  },
  {
    id: "src-2",
    name: "用户行为 Kafka 流",
    type: "Kafka",
    domain: "base-general",
    status: "已连接",
    sessionStatus: "活跃使用中",
    connectivity: "正常",
    lastTested: "2026-05-29 08:31:02",
    host: "kafka-cluster.internal.net",
    port: "9092",
    databaseName: "user_activity_topic",
    username: "event_subscriber",
    tables: [
      {
        tableName: "user_clickstream_events",
        tableDesc: "前端点击流高通量事件。记录用户点击、收藏、下单、转化等各种实时微观动作，用于AI智能体挖掘意向度与归因推荐。",
        columns: [
          { field: "event_id", type: "bigint(20)", nullable: "NO", index: "PRIMARY", desc: "事件唯一包ID" },
          { field: "user_uuid", type: "varchar(64)", nullable: "NO", index: "IDX", desc: "发起动作的用户全局标识" },
          { field: "action_type", type: "varchar(32)", nullable: "NO", index: "IDX", desc: "事件动作类型：click / hover / buy / exit" },
          { field: "page_url", type: "varchar(255)", nullable: "YES", index: "-", desc: "事件发生的具体页URL" },
          { field: "ip_address", type: "varchar(45)", nullable: "YES", index: "-", desc: "访问端公共可追踪IP" },
          { field: "timestamp", type: "bigint(20)", nullable: "NO", index: "IDX", desc: "毫秒级物理事件戳" }
        ]
      }
    ]
  },
  {
    id: "src-3",
    name: "研发效率统计 Hadoop归档",
    type: "Hadoop",
    domain: "base-rd",
    status: "异常",
    sessionStatus: "空闲",
    connectivity: "异常",
    lastTested: "2026-05-28 23:12:00",
    host: "hadoop-namenode.rd_env",
    port: "8020",
    databaseName: "devops_metrics_warehouse",
    username: "hive_analyst",
    tables: [
      {
        tableName: "git_commit_logs",
        tableDesc: "企业内网大平层研发代码提交记录归档。支持提效智能体分析活跃度、代码产出与发布质量。",
        columns: [
          { field: "commit_hash", type: "varchar(40)", nullable: "NO", index: "PRIMARY", desc: "Git哈希唯一主键" },
          { field: "author_email", type: "varchar(128)", nullable: "NO", index: "IDX", desc: "研发工程师企业内网邮箱" },
          { field: "lines_added", type: "int(11)", nullable: "NO", index: "-", desc: "新增的代码物理行数" },
          { field: "lines_removed", type: "int(11)", nullable: "NO", index: "-", desc: "删除或重构的代码行数" },
          { field: "message", type: "text", nullable: "YES", index: "-", desc: "Git Commit 提交信息注释" },
          { field: "committed_date", type: "timestamp", nullable: "NO", index: "IDX", desc: "物理提交归档时间" }
        ]
      },
      {
        tableName: "ci_build_metrics",
        tableDesc: "CI持续集成任务运行与耗质监控。用于发现代码构建瓶颈及构建成功率统计。",
        columns: [
          { field: "build_id", type: "varchar(32)", nullable: "NO", index: "PRIMARY", desc: "CI任务唯一串流ID" },
          { field: "repo_name", type: "varchar(128)", nullable: "NO", index: "IDX", desc: "GitHub/GitLab 企业制品仓库名" },
          { field: "runner_node", type: "varchar(64)", nullable: "YES", index: "-", desc: "承载物理运行的 K8s 节点容器标识" },
          { field: "duration_seconds", type: "int(11)", nullable: "NO", index: "-", desc: "构建总体消耗的时长（秒）" },
          { field: "build_result", type: "varchar(16)", nullable: "NO", index: "IDX", desc: "构建最终结局：SUCCESS / FAILED" }
        ]
      }
    ]
  },
  {
    id: "src-4",
    name: "人才简历库 PostgreSQL",
    type: "PostgreSQL",
    domain: "biz-hr",
    status: "断开",
    sessionStatus: "空闲",
    connectivity: "未验证",
    lastTested: "2025-12-01 10:00:00",
    host: "hr-pg-cluster.internal.net",
    port: "5432",
    databaseName: "hr_recruit_db",
    username: "hr_analyst",
    tables: [
      {
        tableName: "resume_profiles",
        tableDesc: "人才简历深度结构化表。供HR智能辅助面试、简历初筛及岗位匹配使用。",
        columns: [
          { field: "resume_id", type: "uuid", nullable: "NO", index: "PRIMARY", desc: "主键全局UUID" },
          { field: "candidate_name", type: "varchar(64)", nullable: "NO", index: "IDX", desc: "候选人真实姓名（脱敏显示为*）" },
          { field: "work_years", type: "integer", nullable: "NO", index: "IDX", desc: "累计相关专业工作年限" },
          { field: "highest_degree", type: "varchar(32)", nullable: "NO", index: "-", desc: "最高学位历：大专/本科/硕士/博士" },
          { field: "top_skills", type: "text[]", nullable: "YES", index: "-", desc: "提取的标签技能：如 Java, LLM, Docker" },
          { field: "career_objective", type: "text", nullable: "YES", index: "-", desc: "求职意向与个人发展自述" }
        ]
      }
    ]
  },
  {
    id: "src-iptv-ratings",
    name: "IPTV 终端收视行为特征数仓",
    type: "ClickHouse",
    domain: "biz-iptv-ratings",
    status: "已连接",
    sessionStatus: "空闲",
    connectivity: "正常",
    lastTested: "2026-05-30 11:24:00",
    host: "iptv-olap.broadcasting.internal.net",
    port: "8123",
    databaseName: "iptv_audience_dw",
    username: "ratings_analyst",
    tables: [
      {
        tableName: "iptv_play_events_local",
        tableDesc: "IPTV机顶盒秒级上报的终端播放性能与用户点击行为数据。记录了贴片广告转化、用户快进跳出比率等指标，是增值分析的核心事实表。",
        columns: [
          { field: "log_date", type: "Date", nullable: "NO", index: "PRIMARY", desc: "分区计算日期" },
          { field: "stb_mac", type: "varchar(64)", nullable: "NO", index: "IDX", desc: "机顶盒硬件物理MAC地址" },
          { field: "program_id", type: "bigint(20)", nullable: "NO", index: "IDX", desc: "节目或轮播频道唯一编号" },
          { field: "play_duration_sec", type: "int(11)", nullable: "NO", index: "-", desc: "播放持续时长（秒）" },
          { field: "exit_action", type: "varchar(16)", nullable: "NO", index: "-", desc: "跳出行为类别：AUTO_NEXT / FORCE_BACK" },
          { field: "buffering_duration_ms", type: "int(11)", nullable: "NO", index: "-", desc: "播放卡顿累计时长（毫秒）" }
        ]
      },
      {
        tableName: "stb_subscription_states",
        tableDesc: "机顶盒端当前已开通的增值特权包、限免权益和优惠续订主状态图表。",
        columns: [
          { field: "stb_mac", type: "varchar(64)", nullable: "NO", index: "PRIMARY", desc: "机顶盒物理地址" },
          { field: "package_code", type: "varchar(32)", nullable: "NO", index: "PRIMARY", desc: "特权产品编码" },
          { field: "is_active", type: "smallint", nullable: "NO", index: "IDX", desc: "是否在订购期：0=失效, 1=生效中" },
          { field: "expire_time", type: "timestamp", nullable: "NO", index: "-", desc: "特权扣费到期时间" }
        ]
      }
    ]
  }
];

export function getDataSources(): DataSource[] {
  try {
    const data = localStorage.getItem('ai-data-sources-v3');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_SOURCES;
}

export function saveDataSources(sources: DataSource[]) {
  localStorage.setItem('ai-data-sources-v3', JSON.stringify(sources));
}

export function addDataSource(src: Omit<DataSource, 'id' | 'status' | 'sessionStatus' | 'connectivity' | 'tables'> & { tables?: TableSchema[] }): DataSource {
  const sources = getDataSources();
  const newSource: DataSource = {
    ...src,
    id: `src-${Date.now()}`,
    status: '断开', // legacy status
    sessionStatus: '空闲',
    connectivity: '未验证',
    tables: src.tables || [
      {
        tableName: "sample_table_1",
        tableDesc: "系统初始化的样例结构表，可在连接成功后获取真实物理表结构。",
        columns: [
          { field: "id", type: "bigint(20)", nullable: "NO", index: "PRIMARY", desc: "逻辑自增ID" },
          { field: "name", type: "varchar(255)", nullable: "YES", index: "IDX", desc: "样本名称属性" },
          { field: "created_at", type: "timestamp", nullable: "NO", index: "-", desc: "入库审计时间" }
        ]
      }
    ]
  };
  sources.push(newSource);
  saveDataSources(sources);
  return newSource;
}

export function deleteDataSource(id: string) {
  const sources = getDataSources();
  const filtered = sources.filter(s => s.id !== id);
  saveDataSources(filtered);
}

export function updateDataSource(updated: DataSource) {
  const sources = getDataSources();
  const index = sources.findIndex(s => s.id === updated.id);
  if (index >= 0) {
    sources[index] = updated;
    saveDataSources(sources);
  }
}
