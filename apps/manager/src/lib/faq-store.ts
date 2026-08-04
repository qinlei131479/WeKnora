import { KBPermissions, getDefaultPermissions } from "./kb-store";

// Inside a single FAQ Knowledge Base, each FAQ item can have questions, standard answers, & secondary sub-categories
export interface FAQItem {
  id: string;
  category: string; // Internal sub-categorization (e.g. "硬件故障", "报销限制", "配定规则")
  question: string;
  answer: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
}

export interface FAQCategory {
  id: string;
  name: string;
  parentId: string | null;
}

export interface FAQKnowledgeBase {
  id: string;
  title: string;
  description: string;
  domain: string; // Corporate business domain (mapped to domain tree!)
  wordCount: number;
  embeddingModel: string;
  updatedAt: string;
  createdAt: string;
  status: '解析完成' | '待解析' | '进行中';
  progress: number;
  faqs: FAQItem[];
  categories?: FAQCategory[];
  permissions?: KBPermissions;
}

const STORAGE_KEY = 'ai-faq-kb-list-v2';

const SEED_FAQ_KBS: FAQKnowledgeBase[] = [
  {
    id: "faq-kb-1",
    title: "IPTV 互动大屏配对及遥控故障自检标准 FAQ 库",
    description: "汇聚大屏幕连接质量(RSSI)、蓝牙失配唤醒语、物理按键响应时延控制以及客服坐席专用自主排障口诀。",
    domain: "biz-iptv-vas",
    wordCount: 1240,
    embeddingModel: "text-embedding-004",
    createdAt: "2026-05-28 14:00:00",
    updatedAt: "2026-06-01 10:45:12",
    status: "解析完成",
    progress: 100,
    permissions: {
      manageDepts: ["dept-1"], // 大屏业务运维部
      managePositions: ["pos-3"], // IPTV 播控核验专家
      manageUserGroups: ["group-3"], // IPTV 客服大屏交付组
      accessQueryDepts: ["dept-1", "dept-3", "dept-4"],
      accessQueryPositions: ["pos-3", "pos-4"],
      accessQueryUserGroups: ["group-3", "group-1"],
      accessDownloadDepts: ["dept-1"],
      accessDownloadPositions: ["pos-3"],
      accessDownloadUserGroups: ["group-3"]
    },
    faqs: [
      {
        id: "faq-item-1-1",
        category: "蓝牙配对话术",
        question: "遥控器与盒子配对丢失或信号极弱，标准话术及底层自主排障机制是什么？",
        answer: "当检测到蓝牙信号强度(RSSI)低于-85dBm或连接失配时，遥控器的指示灯会出现高频闪烁。请指导客服坐席严格遵循下列一击即中的排障步骤引导：<br/>1. 先引导用户确认红外/蓝牙指示灯是否电量充足并通电闪亮；<br/>2. 核心沟通话术：<strong>“请同时按住遥控器的 [返回键] 和 [主页键] 并保持5秒以上”</strong>；<br/>3. 随后系统在大屏端检测到复位物理广播，会清除历史连接AP缓存，启动全频段握手重置配对，使连通性直接拉回。该方案已经过154万端实战验证。",
        creator: "播控运维专家 (IPTV-expert)",
        createdAt: "2026-05-29 14:12:00",
        updatedAt: "2026-05-29 15:40:00",
        status: "active"
      },
      {
        id: "faq-item-1-2",
        category: "大屏卡顿降能",
        question: "IPTV 出现蓝屏、偶发黑屏丢包、拒绝播放超高清4K内容怎么引导？",
        answer: "排查规范：首位排查用户光衰值是否正常，<strong>皮线光纤测速不能低于 100Mbps 宽带</strong>。若符合测速仍偶发卡断，代表主控解码器忙，指导客服提示用户：<strong>“进入设置菜单，无损降格将传输信道切回 1080P 超高清极速渲染”</strong>以稳定出流，或申报上门装维测波。",
        creator: "播控运维专家 (IPTV-expert)",
        createdAt: "2026-05-30 09:20:00",
        updatedAt: "2026-05-30 09:20:05",
        status: "active"
      }
    ]
  },
  {
    id: "faq-kb-2",
    title: "集团 2026 年度社会招聘职级核定与绩效强分布 FAQ 规范库",
    description: "涵盖中高层技术专家(T6及以上)入股对齐流水限制、Vesting 锁定期条款、以及 OKRs 配比限制的系统解答。",
    domain: "biz-hr-hire",
    wordCount: 890,
    embeddingModel: "text-embedding-004",
    createdAt: "2026-05-29 09:12:00",
    updatedAt: "2026-05-30 09:05:00",
    status: "解析完成",
    progress: 100,
    permissions: {
      manageDepts: ["dept-5"], // 集团综合人力资源部
      managePositions: ["pos-5"], // 资深人力资源专家
      manageUserGroups: ["group-4"],
      accessQueryDepts: ["dept-5"], // 自用访问，高密
      accessQueryPositions: ["pos-5"],
      accessQueryUserGroups: ["group-4"],
      accessDownloadDepts: ["dept-5"],
      accessDownloadPositions: ["pos-5"],
      accessDownloadUserGroups: ["group-4"]
    },
    faqs: [
      {
        id: "faq-item-2-1",
        category: "绩效评价",
        question: "2026年度社会招聘高管职级定级规范及全员绩效评价系数分配规定是什么？",
        answer: "集团统一政策为：<strong>S级（杰出）绩效评定名额在部门总规模中进行强制比率分布控制，上限不得突破 5%</strong>。若所在业务线当季度 OKR 达成率低于70%，则该业务线管理干部一并剔除评选S级资格，且浮动绩效结算系数降为 0.85 倍。入职签署 T6（专家级）及以上定级人员，必须审查前同业知名公司的24个月银行薪资流水对齐，且<strong>强制附带不少于 18 个月服务锁定期限制条款（Vesting Schedule）</strong>。",
        creator: "资深HR专家 (Recruit)",
        createdAt: "2026-05-28 09:12:00",
        updatedAt: "2026-05-30 09:05:00",
        status: "active"
      },
      {
        id: "faq-item-2-2",
        category: "聘用细则",
        question: "对未通过试用期考核的员工，集团有哪些人文关怀和协商转介政策？",
        answer: "对于表现未及预期的试用员工，集团提供<strong>“延期转正考核双向缓冲区”</strong>，最长不超过 3 个月；同时，支持向中台或关联事业群提出内部自推荐转岗机制；非业务卡点原因离职的，依法补齐待通知补偿金并开具离职推荐函。",
        creator: "资深HR专家 (Recruit)",
        createdAt: "2026-05-29 11:30:00",
        updatedAt: "2026-05-30 14:00:00",
        status: "active"
      }
    ]
  },
  {
    id: "faq-kb-3",
    title: "集团外聘学者与高级技术顾问费报销审计合规 FAQ 库",
    description: "专用于规范中台财务一票否决审计材料（研讨日志、手写委托书、境外双国别印花税完税凭证）的核心标准。",
    domain: "biz-fin-reimburse",
    wordCount: 950,
    embeddingModel: "text-embedding-004",
    createdAt: "2026-05-28 10:15:00",
    updatedAt: "2026-06-02 11:30:20",
    status: "解析完成",
    progress: 100,
    permissions: {
      manageDepts: ["dept-5"],
      managePositions: ["pos-5"],
      manageUserGroups: [],
      accessQueryDepts: ["all_depts"], // 全公司开放问答
      accessQueryPositions: [],
      accessQueryUserGroups: [],
      accessDownloadDepts: ["dept-5"],
      accessDownloadPositions: ["pos-5"],
      accessDownloadUserGroups: []
    },
    faqs: [
      {
        id: "faq-item-3-1",
        category: "报销红线",
        question: "外聘专家顾问费、高级顾问报销审核的核心红线要求及必须配备的附件是什么？",
        answer: "专家顾问费在财务报销时设有一票否决审计要求，必须上传三个核心支持材料：<br/>1. <strong>《顾问服务成果确认书》</strong>：须列出明确交付产品或研讨大纲，并由对应业务P3级别及以上经理签字；<br/>2. <strong>专家个人身份证复印件及亲笔手写划款委托函</strong>：用于个税个缴核查，不接受代替电子签；<br/>3. 专家交付印证物料（包括培训PPT打印件、研讨离线签到表或合影、会签电子日志等）。<strong>涉及境外外汇咨询，另须外管局印花税完税凭证。</strong>",
        creator: "财务稽查合规官 (Finance-audit)",
        createdAt: "2026-05-28 10:15:00",
        updatedAt: "2026-06-02 11:30:20",
        status: "active"
      }
    ]
  },
  {
    id: "faq-kb-4",
    title: "AI 知识库分块检索策略与向量中台阻断 Bypass FAQ 库",
    description: "规定了 text-embedding-004 最新嵌入模型、大面积表格和混排 PDF 切片重叠滑窗设定，以及 FAQ 拦截回复原则。",
    domain: "biz-media-audit",
    wordCount: 1680,
    embeddingModel: "text-embedding-004",
    createdAt: "2026-05-30 11:20:00",
    updatedAt: "2026-06-01 14:00:00",
    status: "解析完成",
    progress: 100,
    permissions: {
      manageDepts: ["dept-2"], // 融媒体新闻中心
      managePositions: ["pos-2"], // 融编辑
      manageUserGroups: ["group-2"], // 联合编审
      accessQueryDepts: ["dept-2", "dept-3"],
      accessQueryPositions: ["pos-2", "pos-4"],
      accessQueryUserGroups: ["group-1", "group-2"],
      accessDownloadDepts: ["dept-2"],
      accessDownloadPositions: ["pos-2"],
      accessDownloadUserGroups: ["group-2"]
    },
    faqs: [
      {
        id: "faq-item-4-1",
        category: "安全阻断机制",
        question: "中台智能体如何保证问答检索的准确性与合规性？",
        answer: "当中台智能体在进行问题检索时，一旦精确匹配到关联的<strong>FAQ标准知识对</strong>，系统将进入<strong>“标准回复物理强制阻断”</strong>机制：会直接提取本FAQ中所登记的富文本标准答案原样抛给前端用户，从而<strong>完全绕过大模型的二次逻辑发散与词序重组</strong>。这样可保障金融、政务及高保密审计场景中，对法规或红线问题做出100%零误差、绝对可控、合规原汁原味的反馈，不留任何由于概率生成产生的幻觉空间。",
        creator: "系统级管理员 (admin)",
        createdAt: "2026-05-30 11:20:00",
        updatedAt: "2026-06-01 10:45:12",
        status: "active"
      },
      {
        id: "faq-item-4-2",
        category: "向量检索模型",
        question: "新接入的知识库在进行“向量检索”时，可以选择哪些模型和切片参数？",
        answer: "系统底层目前内置并推荐使用 <strong>text-embedding-004</strong> 新一代多模高维嵌入模型。用户在接入文档时，可选三种分切分块策略：<br/>1. <em>通用按段换行解析</em>：适合大部分结构良好的 PDF/Word 合规政策；<br/>2. <em>极速纯文本分隔符解析</em>：适用于表格与长字对照数据；<br/>3. <em>高精度图文识别多模解析</em>（耗时增加 30%）：可以有效处理带扫描图表的混排文档。单切片（Chunk）最佳字节窗口支持设置为 512-1000 字符，重叠滑窗设定为 10%。",
        creator: "中台产品经理 (PM-Li)",
        createdAt: "2026-05-31 16:20:00",
        updatedAt: "2026-06-01 14:00:00",
        status: "active"
      }
    ]
  }
];

export function getFAQKBs(): FAQKnowledgeBase[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data) as FAQKnowledgeBase[];
      return parsed.map(kb => ({
        ...kb,
        permissions: kb.permissions || getDefaultPermissions()
      }));
    }
  } catch (e) {
    console.error(e);
  }
  // Safe Fallback and store seed list
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_FAQ_KBS));
  } catch (e) {
    console.error(e);
  }
  return SEED_FAQ_KBS;
}

export function saveFAQKBs(kbs: FAQKnowledgeBase[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kbs));
}

export function addFAQKB(kb: Omit<FAQKnowledgeBase, 'id' | 'updatedAt' | 'createdAt' | 'status' | 'progress' | 'wordCount'>): FAQKnowledgeBase {
  const kbs = getFAQKBs();
  const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  const newKB: FAQKnowledgeBase = {
    ...kb,
    id: `faq-kb-${Date.now()}`,
    createdAt: dateStr,
    updatedAt: dateStr,
    wordCount: 0,
    status: "解析完成",
    progress: 100,
    faqs: kb.faqs || [],
    permissions: kb.permissions || getDefaultPermissions()
  };
  kbs.push(newKB);
  saveFAQKBs(kbs);
  return newKB;
}

export function deleteFAQKB(id: string) {
  const kbs = getFAQKBs();
  const filtered = kbs.filter(kb => kb.id !== id);
  saveFAQKBs(filtered);
}
