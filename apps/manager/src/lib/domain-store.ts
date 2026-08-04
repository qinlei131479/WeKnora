export interface DomainCategory {
  id: string
  label: string
  isFixed?: boolean
  children?: DomainCategory[]
}

const DEFAULT_DOMAINS: DomainCategory[] = [
  {
    id: 'base',
    label: '基础类',
    isFixed: true,
    children: [
      {
        id: 'base-general',
        label: '通用底座',
        children: [
          { id: 'base-general-llm', label: '大模型推理' },
          { id: 'base-general-vector', label: '向量检索库' },
          { id: 'base-general-agent', label: 'Agent协同' },
        ],
      },
      {
        id: 'base-data',
        label: '数据处理',
        children: [
          { id: 'base-data-etl', label: '清洗搬运(ETL)' },
          { id: 'base-data-audit', label: '安全合规审计' },
        ],
      },
      {
        id: 'base-rd',
        label: '研发支撑',
        children: [{ id: 'base-rd-devops', label: '自动化运维(DevOps)' }],
      },
    ],
  },
  {
    id: 'business',
    label: '业务类',
    isFixed: true,
    children: [
      {
        id: 'biz-media',
        label: '融媒体领域',
        children: [
          { id: 'biz-media-news', label: '新闻采编' },
          { id: 'biz-media-gather', label: '全网内容采集' },
          { id: 'biz-media-audit', label: '智能审核' },
          { id: 'biz-media-publish', label: '多渠道分发' },
        ],
      },
      {
        id: 'biz-iptv',
        label: 'IPTV/OTT领域',
        children: [
          { id: 'biz-ott-iptv', label: 'IPTV运营' },
          { id: 'biz-iptv-vas', label: '增值业务' },
          { id: 'biz-iptv-ratings', label: '收视分析' },
          { id: 'biz-iptv-play', label: '播控合规' },
        ],
      },
      {
        id: 'biz-hr',
        label: 'HR领域',
        children: [
          { id: 'biz-hr-recruit', label: '招聘管理' },
          { id: 'biz-hr-kpi', label: '绩效考核' },
        ],
      },
      {
        id: 'biz-mkt',
        label: '营销领域',
        children: [
          { id: 'biz-mkt-ad', label: '广告投放' },
          { id: 'biz-mkt-camp', label: '活动推广' },
        ],
      },
      {
        id: 'biz-fin',
        label: '财务领域',
        children: [
          { id: 'biz-fin-reimburse', label: '报销审批' },
          { id: 'biz-fin-tax', label: '税务风控' },
        ],
      },
    ],
  },
]

export function getDomains(): DomainCategory[] {
  try {
    const data = localStorage.getItem('asset-domains-v4')
    if (data) return JSON.parse(data)
  } catch (e) {
    console.error(e)
  }
  return DEFAULT_DOMAINS
}

export function saveDomains(domains: DomainCategory[]) {
  localStorage.setItem('asset-domains-v4', JSON.stringify(domains))
}

export function getFlatDomains(): { id: string; label: string; path: string; parentId?: string }[] {
  const domains = getDomains()
  const result: { id: string; label: string; path: string; parentId?: string }[] = []
  function traverse(nodes: DomainCategory[], parentPath = '', parentId?: string) {
    for (const node of nodes) {
      const currentPath = parentPath ? `${parentPath} / ${node.label}` : node.label
      result.push({ id: node.id, label: node.label, path: currentPath, parentId })
      if (node.children && node.children.length > 0) {
        traverse(node.children, currentPath, node.id)
      }
    }
  }
  traverse(domains)
  return result
}

export function isDomainMatch(assetDomainId: string, filterDomainId: string): boolean {
  if (!filterDomainId || filterDomainId === 'all') return true
  if (!assetDomainId) return false
  if (assetDomainId === filterDomainId) return true

  const domains = getDomains()
  function findNode(nodes: DomainCategory[], id: string): DomainCategory | null {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findNode(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  const filterNode = findNode(domains, filterDomainId)
  if (!filterNode) return false

  function hasDescendant(node: DomainCategory, id: string): boolean {
    if (!node.children) return false
    for (const child of node.children) {
      if (child.id === id) return true
      if (hasDescendant(child, id)) return true
    }
    return false
  }

  return hasDescendant(filterNode, assetDomainId)
}

export function isDomainInUse(domainId: string): boolean {
  return false
}
