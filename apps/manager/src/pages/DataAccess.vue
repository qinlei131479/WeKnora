<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Database, FileJson, HardDrive, Table, RefreshCw, Trash2, Search, Edit, Check, X, HelpCircle, CheckCircle2, AlertCircle, Layers, ShieldCheck, Cpu } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DomainSidebar from '@/components/common/DomainSidebar.vue'
import { isDomainMatch, getFlatDomains } from '@/lib/domain-store'

interface ColumnSchema {
  field: string
  type: string
  nullable: string
  index: string
  desc: string
}

interface TableSchema {
  tableName: string
  tableDesc: string
  columns: ColumnSchema[]
}

interface DataSource {
  id: string
  name: string
  type: string
  host: string
  port: number
  databaseName: string
  username: string
  connectivity: string
  sessionStatus: string
  status: string
  lastTested: string
  domain: string
  tables: TableSchema[]
  schemaText?: string
}

const selectedDomain = ref('all')
const searchTerm = ref('')
const showConnHelp = ref(false)
const connectivityFilter = ref('all')
const sessionFilter = ref('all')
const typeFilter = ref('all')

const viewSource = ref<DataSource | null>(null)
const testingId = ref<string | null>(null)
const tableSearch = ref('')
const bulkImportResult = ref<string | null>(null)

const yamlText = ref('')
const yamlError = ref<string | null>(null)
const previewTables = ref<TableSchema[]>([])
const activePreviewTableIdx = ref(0)

const sources = ref<DataSource[]>([
  {
    id: 'ds_001',
    name: 'CRM 客户主数据',
    type: 'MySQL',
    host: 'mysql-prod-01.internal',
    port: 3306,
    databaseName: 'crm_prod',
    username: 'ai_platform',
    connectivity: '正常',
    sessionStatus: '活跃使用中',
    status: '已连接',
    lastTested: '2026-06-17 09:30:00',
    domain: 'marketing',
    tables: [
      { tableName: 'customers', tableDesc: '客户主档基础信息', columns: [
        { field: 'customer_id', type: 'bigint(20)', nullable: 'NO', index: 'PRIMARY', desc: '客户唯一标识' },
        { field: 'customer_name', type: 'varchar(128)', nullable: 'NO', index: 'IDX', desc: '客户全称' },
        { field: 'customer_type', type: 'varchar(32)', nullable: 'YES', index: '-', desc: '客户类型（企业/个人）' },
      ]},
      { tableName: 'customer_contacts', tableDesc: '客户联系人信息', columns: [
        { field: 'contact_id', type: 'bigint(20)', nullable: 'NO', index: 'PRIMARY', desc: '联系人ID' },
        { field: 'customer_id', type: 'bigint(20)', nullable: 'NO', index: 'IDX', desc: '所属客户' },
        { field: 'contact_name', type: 'varchar(64)', nullable: 'NO', index: '-', desc: '联系人姓名' },
      ]},
    ]
  },
  {
    id: 'ds_002',
    name: 'ERP 订单系统',
    type: 'PostgreSQL',
    host: 'pg-prod-02.internal',
    port: 5432,
    databaseName: 'erp_orders',
    username: 'erp_reader',
    connectivity: '正常',
    sessionStatus: '空闲',
    status: '已连接',
    lastTested: '2026-06-17 10:15:00',
    domain: 'finance',
    tables: [
      { tableName: 'orders', tableDesc: '销售订单主表', columns: [
        { field: 'order_id', type: 'varchar(64)', nullable: 'NO', index: 'PRIMARY', desc: '订单唯一编号' },
        { field: 'customer_id', type: 'bigint(20)', nullable: 'NO', index: 'IDX', desc: '客户ID' },
        { field: 'order_amount', type: 'decimal(12,2)', nullable: 'NO', index: '-', desc: '订单金额' },
      ]},
    ]
  },
  {
    id: 'ds_003',
    name: 'HR 核心人事库',
    type: 'MySQL',
    host: 'mysql-hr.internal',
    port: 3306,
    databaseName: 'hr_core',
    username: 'hr_query',
    connectivity: '异常',
    sessionStatus: '空闲',
    status: '异常',
    lastTested: '2026-06-15 18:20:00',
    domain: 'general',
    tables: [
      { tableName: 'employees', tableDesc: '员工主档', columns: [
        { field: 'emp_id', type: 'varchar(32)', nullable: 'NO', index: 'PRIMARY', desc: '员工工号' },
        { field: 'emp_name', type: 'varchar(64)', nullable: 'NO', index: '-', desc: '员工姓名' },
      ]},
    ]
  },
  {
    id: 'ds_004',
    name: '实时消息队列',
    type: 'Kafka',
    host: 'kafka-broker-01',
    port: 9092,
    databaseName: 'user_behavior',
    username: 'kafka_producer',
    connectivity: '正常',
    sessionStatus: '活跃使用中',
    status: '已连接',
    lastTested: '2026-06-17 11:00:00',
    domain: 'marketing',
    tables: []
  },
  {
    id: 'ds_005',
    name: '数据仓库集群',
    type: 'Hadoop',
    host: 'hadoop-nn-01',
    port: 8020,
    databaseName: 'dwd_customer',
    username: 'hive_user',
    connectivity: '正常',
    sessionStatus: '空闲',
    status: '已连接',
    lastTested: '2026-06-17 08:00:00',
    domain: 'general',
    tables: []
  },
  {
    id: 'ds_006',
    name: '缓存数据库',
    type: 'MongoDB',
    host: 'mongo-shard-01',
    port: 27017,
    databaseName: 'cache_layer',
    username: 'mongo_reader',
    connectivity: '未验证',
    sessionStatus: '空闲',
    status: '已连接',
    lastTested: '',
    domain: 'rd',
    tables: []
  },
])

const handleDelete = (id: string, name: string) => {
  if (confirm(`确定要移除数据源【${name}】吗？移除后智能体将失去该数据源下所有表字段的自动审计和分析能力。`)) {
    sources.value = sources.value.filter(s => s.id !== id)
  }
}

const handlePingTest = (id: string) => {
  testingId.value = id
  setTimeout(() => {
    const target = sources.value.find(s => s.id === id)
    if (target) {
      target.status = '已连接'
      target.connectivity = '正常'
      target.lastTested = new Date().toISOString().replace('T', ' ').slice(0, 19)
    }
    testingId.value = null
  }, 1000)
}

const serializeSchemaToYaml = (tables: TableSchema[]): string => {
  const lines: string[] = []
  lines.push('# -------------------------------------------------------------')
  lines.push('# 物理中台元数据架构配置（Schema-as-Code）')
  lines.push('# 格式说明：自定义物理表与列字段的业务释义。')
  lines.push('# 智能体在访问物理数据库前，将优先阅读本配置以选择最优最合规的查询路径。')
  lines.push('# -------------------------------------------------------------')
  lines.push('tables:')
  
  ;(tables || []).forEach(table => {
    lines.push(`  - name: ${table.tableName}`)
    lines.push(`    description: "${(table.tableDesc || '').replace(/"/g, '\\"')}"`)
    lines.push(`    columns:`)
    ;(table.columns || []).forEach(col => {
      lines.push(`      - field: ${col.field}`)
      lines.push(`        type: ${col.type || 'varchar(255)'}`)
      lines.push(`        nullable: ${col.nullable || 'YES'}`)
      lines.push(`        index: ${col.index || '-'}`)
      lines.push(`        description: "${(col.desc || '').replace(/"/g, '\\"')}"`)
    })
  })
  
  return lines.join('\n')
}

const parseYamlToSchema = (yaml: string): TableSchema[] => {
  const tables: TableSchema[] = []
  const lines = yaml.split('\n')
  let currentTable: TableSchema | null = null
  let currentColumn: ColumnSchema | null = null
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    
    if (trimmed.startsWith('- name:') || (trimmed.startsWith('name:') && line.trim().startsWith('-'))) {
      const parts = trimmed.split(':')
      parts.shift()
      const rawName = parts.join(':').trim().replace(/^['"]|['"]$/g, '')
      if (!rawName) continue
      
      currentTable = { tableName: rawName, tableDesc: '', columns: [] }
      tables.push(currentTable)
      currentColumn = null
      continue
    }
    
    if (currentTable) {
      if (trimmed === 'columns:') {
        currentColumn = null
        continue
      }
      
      if (trimmed.startsWith('description:') && !currentColumn) {
        const parts = trimmed.split(':')
        parts.shift()
        currentTable.tableDesc = parts.join(':').trim().replace(/^['"]|['"]$/g, '').replace(/\\"/g, '"')
        continue
      }
      
      if (trimmed.startsWith('- field:') || (trimmed.startsWith('field:') && line.trim().startsWith('-'))) {
        const parts = trimmed.split(':')
        parts.shift()
        const fieldName = parts.join(':').trim().replace(/^['"]|['"]$/g, '')
        if (!fieldName) continue
        
        currentColumn = { field: fieldName, type: 'varchar(255)', nullable: 'YES', index: '-', desc: '' }
        currentTable.columns.push(currentColumn)
        continue
      }
      
      if (currentColumn) {
        if (trimmed.startsWith('type:')) {
          const parts = trimmed.split(':')
          parts.shift()
          currentColumn.type = parts.join(':').trim().replace(/^['"]|['"]$/g, '')
        } else if (trimmed.startsWith('nullable:')) {
          const parts = trimmed.split(':')
          parts.shift()
          const nullVal = parts.join(':').trim().replace(/^['"]|['"]$/g, '').toUpperCase()
          currentColumn.nullable = nullVal === 'NO' ? 'NO' : 'YES'
        } else if (trimmed.startsWith('index:')) {
          const parts = trimmed.split(':')
          parts.shift()
          currentColumn.index = parts.join(':').trim().replace(/^['"]|['"]$/g, '')
        } else if (trimmed.startsWith('description:') || trimmed.startsWith('desc:')) {
          const parts = trimmed.split(':')
          parts.shift()
          currentColumn.desc = parts.join(':').trim().replace(/^['"]|['"]$/g, '').replace(/\\"/g, '"')
        }
      }
    }
  }
  
  return tables
}

const handleOpenSchema = (src: DataSource) => {
  viewSource.value = src
  bulkImportResult.value = null
  tableSearch.value = ''
  if (src.schemaText) {
    yamlText.value = src.schemaText
  } else {
    yamlText.value = serializeSchemaToYaml(src.tables)
  }
  yamlError.value = null
  activePreviewTableIdx.value = 0
}

const handleSaveSchemaCode = () => {
  if (!viewSource.value) return
  try {
    const parsed = parseYamlToSchema(yamlText.value)
    viewSource.value.tables = parsed
    viewSource.value.schemaText = yamlText.value
    const idx = sources.value.findIndex(s => s.id === viewSource.value!.id)
    if (idx !== -1) {
      sources.value[idx] = { ...viewSource.value }
    }
    bulkImportResult.value = '💾 Schema-as-Code 配置成功保存！已被底层 Agent 安全审计脑订阅，智能体决策上下文立刻生效。'
  } catch (err: any) {
    alert(`解析保存失败，请核实 YAML 格式：${err.message}`)
  }
}

const handleSimulatedPhysicalSync = () => {
  if (!viewSource.value) return
  
  try {
    const baseTables = parseYamlToSchema(yamlText.value)
    
    const updatedTables = baseTables.map(tbl => {
      const hasIsDeleted = tbl.columns.some(col => col.field === 'is_deleted')
      const updatedCols = [...tbl.columns]
      if (!hasIsDeleted) {
        updatedCols.push({
          field: 'is_deleted',
          type: 'tinyint(1)',
          nullable: 'NO',
          index: 'IDX',
          desc: '物理逻辑删除标记 (0=活跃, 1=逻辑删除) [物理库同步引入]'
        })
      }
      return { ...tbl, columns: updatedCols }
    })
    
    const hasAuditLogs = updatedTables.some(tbl => tbl.tableName === 'system_audit_logs')
    if (!hasAuditLogs) {
      updatedTables.push({
        tableName: 'system_audit_logs',
        tableDesc: '物理库系统变更审计安全日志表 [物理通道自动同步引入]',
        columns: [
          { field: 'audit_id', type: 'varchar(64)', nullable: 'NO', index: 'PRIMARY', desc: '安全审计链主键流水号' },
          { field: 'operator_user', type: 'varchar(128)', nullable: 'NO', index: 'IDX', desc: '操作执行域账号' },
          { field: 'sql_statement', type: 'text', nullable: 'NO', index: '-', desc: '落标物理审计执行快照' },
          { field: 'record_timestamp', type: 'bigint(20)', nullable: 'NO', index: 'IDX', desc: '物理发生毫秒戳' }
        ]
      })
    }
    
    yamlText.value = serializeSchemaToYaml(updatedTables)
    bulkImportResult.value = '🔄 物理元数据通道全景同步成功！系统自动在对应表追加了「is_deleted」等物理库表级变更，并智能感应连通了「system_audit_logs」审计流水表。'
  } catch (err: any) {
    bulkImportResult.value = `❌ 物理同步失败：解析现有 YAML 时出错，请先修正语法。`
  }
}

watch(yamlText, () => {
  if (!yamlText.value) {
    previewTables.value = []
    yamlError.value = null
    return
  }
  try {
    previewTables.value = parseYamlToSchema(yamlText.value)
    yamlError.value = null
  } catch (err: any) {
    yamlError.value = err.message || '语法解析异常，请核对 YAML 缩进与字符对齐。'
  }
})

watch(viewSource, () => {
  if (viewSource.value) {
    if (viewSource.value.schemaText) {
      yamlText.value = viewSource.value.schemaText
    } else {
      yamlText.value = serializeSchemaToYaml(viewSource.value.tables)
    }
    yamlError.value = null
    activePreviewTableIdx.value = 0
  }
})

const getDomainLabel = (domainId: string) => {
  if (domainId === 'all') return '全域 / 通用'
  const flat = getFlatDomains()
  const found = flat.find((f: any) => f.id === domainId)
  return found ? found.label : domainId
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'Kafka': return FileJson
    case 'Hadoop': return HardDrive
    case 'MongoDB': return Layers
    case 'Oracle': return Cpu
    case 'Dameng':
    case 'OceanBase': return ShieldCheck
    default: return Database
  }
}

const getTypeColorClass = (type: string) => {
  switch (type) {
    case 'Kafka': return 'text-purple-600 bg-purple-50 border-purple-100'
    case 'Hadoop': return 'text-amber-600 bg-amber-50 border-amber-100'
    case 'MongoDB': return 'text-green-600 bg-green-50 border-green-100'
    case 'Oracle': return 'text-rose-600 bg-rose-50 border-rose-100'
    case 'PostgreSQL': return 'text-blue-600 bg-blue-50 border-blue-100'
    case 'Dameng':
    case 'OceanBase': return 'text-indigo-600 bg-indigo-50 border-indigo-100'
    case 'SQLServer': return 'text-cyan-600 bg-cyan-50 border-cyan-100'
    case 'GenericJDBC': return 'text-teal-600 bg-teal-50 border-teal-100'
    default: return 'text-emerald-700 bg-emerald-50 border-emerald-100'
  }
}

const getTypeTopBarColor = (type: string) => {
  switch (type) {
    case 'MySQL': return '#10B981'
    case 'Kafka': return '#8B5CF6'
    case 'Hadoop': return '#F59E0B'
    case 'PostgreSQL': return '#3B82F6'
    case 'MongoDB': return '#059669'
    case 'Oracle': return '#DC2626'
    case 'Dameng': return '#4F46E5'
    case 'OceanBase': return '#2563EB'
    case 'SQLServer': return '#0891B2'
    case 'GenericJDBC': return '#0D9488'
    default: return '#3B82F6'
  }
}

const filteredSources = computed(() => {
  return sources.value.filter(src => {
    if (selectedDomain.value !== 'all' && !isDomainMatch(src.domain || '', selectedDomain.value)) return false
    if (typeFilter.value !== 'all' && src.type !== typeFilter.value) return false

    const currentConn = src.connectivity || (src.status === '已连接' ? '正常' : src.status === '异常' ? '异常' : '未验证')
    if (connectivityFilter.value !== 'all' && currentConn !== connectivityFilter.value) return false

    const currentSession = src.sessionStatus || '空闲'
    if (sessionFilter.value !== 'all' && currentSession !== sessionFilter.value) return false

    if (searchTerm.value) {
      const q = searchTerm.value.toLowerCase()
      const nameMatch = src.name.toLowerCase().includes(q)
      const hostMatch = src.host.toLowerCase().includes(q)
      const dbMatch = src.databaseName.toLowerCase().includes(q)
      const typeMatch = src.type.toLowerCase().includes(q)
      return nameMatch || hostMatch || dbMatch || typeMatch
    }
    return true
  })
})

const filteredPreviewTables = computed(() => {
  return previewTables.value.filter(tbl => {
    if (!tableSearch.value) return true
    const q = tableSearch.value.toLowerCase()
    const nameMatch = tbl.tableName.toLowerCase().includes(q)
    const descMatch = (tbl.tableDesc || '').toLowerCase().includes(q)
    const colsMatch = tbl.columns?.some(c => 
      c.field.toLowerCase().includes(q) || (c.desc || '').toLowerCase().includes(q)
    )
    return nameMatch || descMatch || colsMatch
  })
})

const formatYaml = () => {
  try {
    const parsed = parseYamlToSchema(yamlText.value)
    yamlText.value = serializeSchemaToYaml(parsed)
  } catch (err: any) {
    alert('格式化失败，请先修正语法错误。')
  }
}

const typeOptions = [
  { id: 'all', label: '全部类型 (ALL)' },
  { id: 'MySQL', label: 'MySQL' },
  { id: 'PostgreSQL', label: 'PostgreSQL' },
  { id: 'SQLServer', label: 'SQL Server' },
  { id: 'Oracle', label: 'Oracle DB' },
  { id: 'MongoDB', label: 'MongoDB' },
  { id: 'Dameng', label: '达梦数据库 (DM)' },
  { id: 'OceanBase', label: 'OceanBase' },
  { id: 'Kafka', label: 'Kafka' },
  { id: 'Hadoop', label: 'Hadoop (Hive)' },
  { id: 'GenericJDBC', label: '通用 JDBC/ODBC' },
]
</script>

<template>
  <div class="h-full flex flex-col space-y-6 p-6">
    <!-- Schema 编辑器弹窗 -->
    <Dialog :open="!!viewSource" @update:open="(open: boolean) => !open && (viewSource = null)">
      <DialogContent 
        :title="`物理元数据架构详情: ${viewSource?.name || ''} （类型: ${viewSource?.type || ''} | 库名: ${viewSource?.databaseName || ''}）`"
        class="max-w-7xl w-[95vw] h-[90vh] md:p-8 p-6 flex flex-col justify-between"
      >
        <div class="grid grid-cols-12 gap-6 flex-1 min-h-0 mt-5 overflow-hidden text-slate-800">
          <div class="col-span-5 flex flex-col h-full overflow-hidden border border-slate-800 rounded-xl bg-slate-950 relative">
            <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
                <span class="text-xs font-mono font-bold text-slate-200">PHYSICAL_SCHEMA.yaml</span>
              </div>
              <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                YAML 架构即代码
              </span>
            </div>

            <div class="px-4 py-2 bg-slate-950/80 border-b border-slate-900 flex items-center justify-between shrink-0">
              <span v-if="yamlError" class="text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                语法解析中: 发现对齐/格式异常
              </span>
              <span v-else class="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 class="w-3.5 h-3.5 shrink-0" />
                YAML 语法检测通过 (解析正常)
              </span>
              
              <button
                @click="formatYaml"
                class="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline font-mono"
              >
                [ 💅 格式化 YAML Code ]
              </button>
            </div>

            <textarea
              v-model="yamlText"
              placeholder="# 正在等待加载或解析元数据..."
              class="w-full flex-1 p-4 bg-slate-950 text-slate-200 font-mono text-xs focus:outline-none resize-none leading-relaxed overflow-y-auto"
              spellcheck="false"
            ></textarea>

            <div v-if="yamlError" class="p-3 bg-rose-950/90 text-rose-200 text-xs border-t border-rose-900 shrink-0 font-mono leading-normal max-h-24 overflow-y-auto">
              <span class="font-bold text-rose-300 block mb-0.5">⚠️ PARSE_EXCEPTION:</span>
              {{ yamlError }}
            </div>

            <div class="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <Button
                @click="handleSimulatedPhysicalSync"
                class="bg-transparent hover:bg-slate-800 text-indigo-400 border border-slate-700/60 font-semibold h-9 text-xs px-3 rounded-lg flex items-center gap-1"
              >
                <RefreshCw class="w-3.5 h-3.5 mr-0.5" />
                🔄 同步与刷新物理层表结构
              </Button>

              <Button
                @click="handleSaveSchemaCode"
                :disabled="!!yamlError"
                class="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold h-9 text-xs px-4 rounded-lg flex items-center gap-1"
              >
                <Check class="w-3.5 h-3.5 mr-0.5" />
                确定并应用 Schema 配置
              </Button>
            </div>
          </div>

          <div class="col-span-7 flex flex-col h-full overflow-hidden bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4 shrink-0">
              <div>
                <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers class="w-4 h-4 text-slate-500" />
                  架构状态实时反观 (同步解包预览)
                </h3>
                <p class="text-[11px] text-slate-500 mt-0.5">
                  图形为只读演示渲染。若需调整架构，请直接在左侧 YAML 代码区中增加或修改。
                </p>
              </div>

              <div class="relative w-56 sm:w-64">
                <Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  v-model="tableSearch"
                  placeholder="在解析架构中检索表/字段物理名..."
                  class="w-full pl-8 pr-8 h-9 text-xs"
                />
                <button 
                  v-if="tableSearch"
                  @click="tableSearch = ''"
                  class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div v-if="filteredPreviewTables.length > 0" class="flex flex-1 min-h-0 gap-4 mt-4 overflow-hidden">
              <div class="w-48 border-r border-slate-200 pr-3 flex flex-col space-y-1.5 overflow-y-auto shrink-0">
                <button
                  v-for="(tbl, idx) in filteredPreviewTables"
                  :key="idx"
                  @click="activePreviewTableIdx = idx"
                  :class="[
                    'w-full text-left px-3 py-2 rounded-lg transition-colors text-xs',
                    activePreviewTableIdx === idx 
                      ? 'bg-blue-100 text-blue-700 font-semibold border border-blue-200' 
                      : 'hover:bg-slate-100 text-slate-600 border border-transparent'
                  ]"
                >
                  <div class="font-mono font-medium truncate">{{ tbl.tableName }}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5 truncate">{{ tbl.tableDesc || '(无描述)' }}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">{{ tbl.columns.length }} 列</div>
                </button>
              </div>

              <div class="flex-1 overflow-y-auto" v-if="filteredPreviewTables[activePreviewTableIdx]">
                <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div class="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h4 class="font-mono font-semibold text-slate-800">
                      {{ filteredPreviewTables[activePreviewTableIdx].tableName }}
                    </h4>
                    <p class="text-[11px] text-slate-500 mt-1">
                      {{ filteredPreviewTables[activePreviewTableIdx].tableDesc || '(无描述)' }}
                    </p>
                  </div>
                  <table class="w-full text-xs">
                    <thead class="bg-slate-100 text-slate-500">
                      <tr>
                        <th class="px-4 py-2 text-left font-medium">字段名</th>
                        <th class="px-4 py-2 text-left font-medium">类型</th>
                        <th class="px-4 py-2 text-left font-medium">可空</th>
                        <th class="px-4 py-2 text-left font-medium">索引</th>
                        <th class="px-4 py-2 text-left font-medium">业务描述</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr v-for="(col, ci) in filteredPreviewTables[activePreviewTableIdx].columns" :key="ci" class="hover:bg-slate-50">
                        <td class="px-4 py-2 font-mono font-medium text-slate-700">{{ col.field }}</td>
                        <td class="px-4 py-2 font-mono text-slate-500">{{ col.type }}</td>
                        <td class="px-4 py-2">
                          <span :class="col.nullable === 'YES' ? 'text-emerald-600' : 'text-amber-600'">
                            {{ col.nullable }}
                          </span>
                        </td>
                        <td class="px-4 py-2 text-slate-500">{{ col.index }}</td>
                        <td class="px-4 py-2 text-slate-600 max-w-[200px] truncate">{{ col.desc }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div v-else class="flex-1 flex-col items-center justify-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl my-4 py-16">
              <AlertCircle class="w-12 h-12 mb-3 stroke-1 text-slate-300" />
              <span class="text-xs font-bold text-slate-600">正在等待有效的 YAML 格式输入...</span>
              <p class="text-[11px] text-slate-400 mt-1 max-w-xs text-center leading-relaxed">
                您可以在左边文本框修改 YAML 内容，系统将自动进行语法合法性验证并在此处提供交互大盘图。
              </p>
            </div>

            <!-- Status report panel -->
            <div v-if="bulkImportResult" :class="['p-3 rounded-xl text-xs gap-3.5 border flex items-start shrink-0 mt-4 leading-normal', bulkImportResult.includes('失败') ? 'bg-red-50 border-red-100 text-red-800 animate-pulse' : 'bg-emerald-50 border-emerald-100 text-emerald-800']">
              <CheckCircle2 class="w-4 h-4 mt-0.5 shrink-0" />
              <div class="flex-1">
                <strong class="font-bold flex items-center justify-between pb-1 border-b border-black/5 mb-1 text-[11px]">
                  <span>🔔 物理架构合并与处理回执:</span>
                  <button @click="bulkImportResult = null" class="hover:underline text-[9px] opacity-75">清除提示</button>
                </strong>
                <p class="opacity-95 text-[11px] leading-relaxed">{{ bulkImportResult }}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 主内容 -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold text-slate-800">底座多源数据接入</h1>
          <button 
            @click="showConnHelp = !showConnHelp"
            :class="['p-1 rounded-full transition-colors', showConnHelp ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100']"
            title="关于生命周期连接网络解耦说明"
          >
            <HelpCircle class="w-4 h-4" />
          </button>
        </div>
        <p class="text-sm text-slate-500">
          管理底座支持的数据源，包含物理数据库、API、消息中间件等，为您的 AI 智能体编排与执行引擎匹配底层的分析实体元数据。
        </p>
      </div>
      <div class="flex gap-2">
        <router-link to="/data/access/new">
          <Button class="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9">
            <Plus class="w-4 h-4 mr-1.5"/> 绑定物理数据源
          </Button>
        </router-link>
      </div>
    </div>

    <!-- Concept Clarification Warning Box -->
    <Card v-if="showConnHelp" class="p-4 border-blue-200 bg-blue-50/40 text-slate-800 rounded-xl flex items-start gap-4 text-xs relative">
      <div class="bg-blue-100 p-2 text-blue-700 rounded-full shrink-0">
        <Layers class="w-4 h-4" />
      </div>
      <div class="space-y-1 leading-normal flex-1 max-w-4xl">
        <h4 class="font-semibold text-blue-950">📡 物理数据源：为什么将等效「生命周期连通性」与「活跃会话状态」解耦？</h4>
        <p class="opacity-90 leading-relaxed text-slate-600">
          这是一个企业级的安全最佳实践。常驻直连句柄（通常所称 of 数据库长连接）不仅会持续占用和浪费物理主机的连接池资源，还容易产生阻塞。为此，我们对底座接入层的链路控制进行了架构解耦：
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-blue-100 text-slate-700">
          <div>
            <strong class="text-emerald-700 flex items-center gap-1">🟢 连通性健康状况 (正常 / 异常 / 未验证)</strong>
            <p class="text-slate-500 mt-0.5 leading-relaxed">
              表示底座中台与物理数据库的网络握手与安全密码校验是否畅通。若显示<strong>“正常”</strong>，代表当前随时能按需打开物理通道，处于高可用修复完备状态。
            </p>
          </div>
          <div>
            <strong class="text-blue-700 flex items-center gap-1">⚡ 连接使用率/活跃会话 (使用中 / 空闲释放)</strong>
            <p class="text-slate-500 mt-0.5 leading-relaxed">
              表示当前秒级活动中是否有 Agent 的执行图或报表查询计划正在占用握手实例。平时呈<strong>“释放中 (空闲)”</strong>，按需开启、阅后即焚，实现物理层零挂起和零耗损！
            </p>
          </div>
        </div>
      </div>
      <button 
        @click="showConnHelp = false"
        class="text-blue-400 hover:text-blue-600 font-medium text-xs hover:bg-blue-100/55 p-1 rounded-full absolute right-2 top-2"
        title="隐藏提示"
      >
        ✕
      </button>
    </Card>

    <div class="flex flex-1 gap-6 min-h-0">
      <!-- 领域分类侧边栏 -->
      <div class="hidden lg:block w-56 shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <DomainSidebar v-model="selectedDomain" class="h-full border-none bg-white font-medium" />
      </div>

      <!-- 主列表区 -->
      <div class="flex-1 flex flex-col space-y-4 overflow-hidden">
        <!-- 筛选器 -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap lg:flex-nowrap gap-4 items-center justify-between shadow-sm">
          <div class="relative flex-1 min-w-[200px]">
            <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              v-model="searchTerm"
              placeholder="搜索数据源连接名、Host主机网关、应用数据库名..." 
              class="pl-9 bg-slate-50 border-none h-9 text-xs" 
            />
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2 text-xs">
              <span class="text-slate-500 whitespace-nowrap font-medium">资源类型:</span>
              <select 
                v-model="typeFilter"
                class="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-3 rounded-lg focus:outline-none"
              >
                <option v-for="opt in typeOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
              </select>
            </div>

            <div class="flex items-center gap-2 text-xs">
              <span class="text-slate-500 whitespace-nowrap">连通性健康:</span>
              <div class="flex bg-slate-100 rounded-lg border border-slate-200 p-0.5">
                <button
                  v-for="tab in [{ id: 'all', label: '全部' }, { id: '正常', label: '开通正常' }, { id: '异常', label: '检测异常' }, { id: '未验证', label: '未验证' }]"
                  :key="tab.id"
                  @click="connectivityFilter = tab.id"
                  :class="['px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-all', connectivityFilter === tab.id ? 'bg-white text-slate-800 font-semibold shadow' : 'text-slate-500 hover:text-slate-800']"
                >
                  {{ tab.label }}
                </button>
              </div>
            </div>

            <div class="flex items-center gap-2 text-xs">
              <span class="text-slate-500 whitespace-nowrap">连接使用率:</span>
              <div class="flex bg-slate-100 rounded-lg border border-slate-200 p-0.5">
                <button
                  v-for="tab in [{ id: 'all', label: '全部' }, { id: '活跃使用中', label: '活跃运行' }, { id: '空闲', label: '释放空闲' }]"
                  :key="tab.id"
                  @click="sessionFilter = tab.id"
                  :class="['px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-all', sessionFilter === tab.id ? 'bg-white text-slate-800 font-semibold shadow' : 'text-slate-500 hover:text-slate-800']"
                >
                  {{ tab.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据源卡片列表 -->
        <div class="flex-1 overflow-y-auto">
          <Card v-if="filteredSources.length === 0" class="flex flex-col items-center justify-center p-16 text-center border-slate-200 bg-white shadow-sm">
            <Database class="w-12 h-12 text-slate-300 stroke-1 mb-3" />
            <h3 class="text-sm font-semibold text-slate-700">没有查找到相应底座数据源</h3>
            <p class="text-xs text-slate-400 mt-1 max-w-sm">
              您可以切换左侧分类、调整连通性过滤器，或者直接绑定一个新的物理数据源。
            </p>
            <router-link to="/data/access/new" class="mt-4">
              <Button size="sm" class="bg-blue-600 text-white hover:bg-blue-700 text-xs">
                <Plus class="w-3.5 h-3.5 mr-1" /> 自定义绑定物理数据源
              </Button>
            </router-link>
          </Card>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <Card 
              v-for="src in filteredSources" 
              :key="src.id" 
              class="p-5 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden"
            >
              <div class="absolute top-0 left-0 right-0 h-[3.5px]" :style="{ backgroundColor: getTypeTopBarColor(src.type) }"></div>

              <div>
                <div class="flex items-start justify-between mb-3.5">
                  <div :class="['p-2.5 rounded-xl border', getTypeColorClass(src.type)]">
                    <component :is="getTypeIcon(src.type)" class="h-5 w-5" />
                  </div>
                  <div class="flex flex-col items-end gap-1.5">
                    <span :class="[
                      'text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 shadow-sm leading-none',
                      src.sessionStatus === '活跃使用中' 
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    ]">
                      <span :class="[
                        'w-1.5 h-1.5 rounded-full',
                        src.sessionStatus === '活跃使用中' ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'
                      ]"></span>
                      {{ src.sessionStatus === '活跃使用中' ? '1个活跃会话' : '空闲 (无连接)' }}
                    </span>

                    <span class="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {{ src.type }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center justify-between gap-1.5 mb-1">
                  <h3 class="text-sm font-bold text-slate-800 truncate" :title="src.name">
                    {{ src.name }}
                  </h3>
                  
                  <button
                    @click="handleDelete(src.id, src.name)"
                    class="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded transition-colors shrink-0"
                    title="断开并永久移除该底座源"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div class="grid grid-cols-2 gap-y-2 gap-x-1 border-t border-slate-50 pt-2.5 mt-2.5 text-xs text-slate-500 font-medium">
                  <div class="truncate">
                    <span class="text-slate-400">Host:</span> <span class="font-mono text-slate-700">{{ src.host }}</span>
                  </div>
                  <div class="truncate text-right">
                    <span class="text-slate-400">Port:</span> <span class="font-mono text-slate-700">{{ src.port }}</span>
                  </div>
                  <div class="truncate" :title="src.databaseName">
                    <span class="text-slate-400">数据库_Topic:</span> <span class="font-mono text-slate-700">{{ src.databaseName }}</span>
                  </div>
                  <div class="truncate text-right">
                    <span class="text-slate-400">表格树:</span> <span class="text-slate-800 font-bold">{{ src.tables?.length || 0 }} 张</span>
                  </div>
                </div>

                <div class="mt-3.5 py-1.5 px-2 bg-slate-50 rounded-lg text-[10px] text-slate-400 flex items-center justify-between border border-slate-100 font-semibold">
                  <span class="text-indigo-600 bg-indigo-50/50 px-1 py-0.5 rounded border border-indigo-100/50">{{ getDomainLabel(src.domain) }}</span>
                  <span>最近检测: {{ src.lastTested ? src.lastTested.slice(11, 16) : '未测试' }}</span>
                </div>
              </div>

              <div class="mt-5 border-t border-slate-100 pt-3.5 flex items-center justify-between gap-2 shrink-0">
                <button 
                  @click="handlePingTest(src.id)"
                  :disabled="testingId === src.id"
                  :class="[
                    'flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all',
                    src.connectivity === '正常' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800 hover:bg-emerald-100/50' 
                      : src.connectivity === '异常' 
                        ? 'bg-red-50 border-red-100 text-red-800 hover:bg-red-100/50' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  ]"
                  title="诊断此数据库的连接参数"
                >
                  <span :class="[
                    'w-1.5 h-1.5 rounded-full',
                    src.connectivity === '正常' ? 'bg-emerald-500 animate-pulse' : src.connectivity === '异常' ? 'bg-rose-500' : 'bg-slate-400'
                  ]"></span>
                  <span v-if="testingId === src.id">
                    <RefreshCw class="w-3 h-3 animate-spin" />
                  </span>
                  <span v-else>功能通路: {{ src.connectivity || '未验证' }}</span>
                </button>

                <Button 
                  variant="ghost" 
                  @click="handleOpenSchema(src)"
                  class="h-8 text-[11px] font-bold text-indigo-750 hover:bg-indigo-50 px-2 rounded-lg"
                >
                  表配置与描述 ({{ src.tables?.length || 0 }})
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
