export interface AgentSkill {
  id: string;
  name: string;
  type: string;
  desc: string;
  status: string;
  version: string;
  owner: string;
  calls: number;
  latency: string;
  domain: string;
}

export interface WorkflowItem {
  id: string;
  title: string;
  type: string;
  status: string;
  updated: string;
  author: string;
  domain: string;
}

const DEFAULT_SKILLS: AgentSkill[] = [
  { 
    id: "microsoft/azure-deployment", 
    name: "Azure Deployment Master", 
    type: "官方认证", 
    desc: "封装了将应用自动化部署到 Microsoft Azure 各种服务（App Service, AKS 等）的知识库和 GitHub Actions 脚本的 Agent 能力包。", 
    status: "已上线", 
    version: "v1.5.0", 
    owner: "系统管理员", 
    calls: 8652, 
    latency: "N/A", 
    domain: "base-rd-devops" 
  },
  { 
    id: "internal/seo-writer", 
    name: "SEO Expert Persona", 
    type: "私有知识区", 
    desc: "包含企业最新的 SEO 优化指南、大厂爆款模板以及特定长尾关键词挖掘的 Python 脚本，直接赋予模型顶级文案专家角色。", 
    status: "已上线", 
    version: "v4.2.1", 
    owner: "内容架构组", 
    calls: 145020, 
    latency: "N/A", 
    domain: "biz-mkt-ad" 
  },
  { 
    id: "community/stripe-payment", 
    name: "Stripe Payment Integration", 
    type: "社区生态", 
    desc: "社区贡献的完整 Stripe 结算与账单对接流程集，内置沙箱测试密钥注入机制，实现即插即用的电商模块搭建。", 
    status: "已停用", 
    version: "v0.9.0", 
    owner: "架构部门", 
    calls: 125, 
    latency: "N/A", 
    domain: "biz-fin-reimburse" 
  },
  { 
    id: "iptv/stream-validator", 
    name: "IPTV 播控合规智能校验包", 
    type: "官方认证", 
    desc: "对接国家广电总局安全播出标准，自动抽样检测直播源、极速巡检审核敏感画面，守卫电视大屏端合规播放底线。", 
    status: "已上线", 
    version: "v2.1.2", 
    owner: "播控中心系统", 
    calls: 48920, 
    latency: "N/A", 
    domain: "biz-iptv-play" 
  },
];

const DEFAULT_WORKFLOWS: WorkflowItem[] = [
  { 
    id: "wf-1",
    title: "送货机器人规划路线工作流", 
    type: "MCP 控件组合", 
    status: "已上线", 
    updated: "2小时前", 
    author: "系统", 
    domain: "base-rd-devops" 
  },
  { 
    id: "wf-2",
    title: "行政巡检并生成报告", 
    type: "工作流编排", 
    status: "草稿", 
    updated: "1天前", 
    author: "张三", 
    domain: "biz-hr-kpi" 
  },
  { 
    id: "wf-3",
    title: "自动互联网热点调研报告生成", 
    type: "工作流编排", 
    status: "已上线", 
    updated: "3天前", 
    author: "李四", 
    domain: "biz-mkt-camp" 
  },
  { 
    id: "wf-iptv-ratings",
    title: "IPTV 增值业务收视与用户付费行为漏斗分析流", 
    type: "工作流编排", 
    status: "已上线", 
    updated: "10分钟前", 
    author: "数据科学部", 
    domain: "biz-iptv-ratings" 
  },
];

export function getSkills(): AgentSkill[] {
  try {
    const data = localStorage.getItem('ai-agent-skills-v2');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_SKILLS;
}

export function saveSkills(skills: AgentSkill[]) {
  localStorage.setItem('ai-agent-skills-v2', JSON.stringify(skills));
}

export function addSkill(skill: Omit<AgentSkill, 'calls' | 'latency'>): AgentSkill {
  const skills = getSkills();
  const newSkill: AgentSkill = {
    ...skill,
    calls: 0,
    latency: 'N/A'
  };
  skills.push(newSkill);
  saveSkills(skills);
  return newSkill;
}

export function getWorkflows(): WorkflowItem[] {
  try {
    const data = localStorage.getItem('ai-workflows-v2');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_WORKFLOWS;
}

export function saveWorkflows(workflows: WorkflowItem[]) {
  localStorage.setItem('ai-workflows-v2', JSON.stringify(workflows));
}

export function addWorkflow(wf: Omit<WorkflowItem, 'id' | 'updated' | 'author'>): WorkflowItem {
  const workflows = getWorkflows();
  const newWf: WorkflowItem = {
    ...wf,
    id: `wf-${Date.now()}`,
    updated: "刚刚",
    author: "当前用户"
  };
  workflows.push(newWf);
  saveWorkflows(workflows);
  return newWf;
}
