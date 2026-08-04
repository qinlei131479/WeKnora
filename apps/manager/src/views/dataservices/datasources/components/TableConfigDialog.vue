<template>
  <el-dialog
    v-model="visible"
    width="92%"
    top="5vh"
    append-to-body
    destroy-on-close
    class="table-config-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="!operationLoading"
    :before-close="handleBeforeClose"
  >
    <template #header>
      <div class="dialog-title">
        <span> 物理元数据架构详情：{{ source?.name || '' }} （类型：{{ typeLabel }} | 库名：{{ source?.dsName || '' }}） </span>
      </div>
    </template>

    <div v-if="operationLoading" class="operation-mask" @wheel.prevent @touchmove.prevent></div>

    <div class="dialog-content">
      <el-card shadow="never" class="terminal-card">
        <div class="terminal-header">
          <template v-if="activeTab === 'tables'">
            <div>
              <span class="terminal-dot"></span>
              <strong>tables_schema.yaml</strong>
            </div>
            <el-tag effect="light" type="info">表及列字段 Schema</el-tag>
          </template>
          <template v-else-if="activeTab === 'terminologies'">
            <div>
              <span class="terminal-dot"></span>
              <strong>industry_terms.yaml</strong>
            </div>
            <el-tag effect="dark" type="info">行业术语 Schema</el-tag>
          </template>
          <template v-else>
            <div>
              <span class="terminal-dot"></span>
              <strong>sql_templates.yaml</strong>
            </div>
            <el-tag effect="dark" type="info">黄金 SQL 模板 Schema</el-tag>
          </template>
        </div>

        <div class="terminal-status" :class="{ error: !isYamlValid }">
          <span>{{ isYamlValid ? 'YAML 语法检测通过（解析正常）' : '语法解析中：发现格式异常' }}</span>
          <el-button text @click="handleFormat">
            [<el-icon><FileText /></el-icon>格式化当前 Tab ]
          </el-button>
        </div>

        <VueMonacoEditor
          v-model:value="yamlContent"
          class="yaml-editor"
          language="yaml"
          path="file:///PHYSICAL_SCHEMA.yaml"
          theme="vs-dark"
          :options="editorOptions"
          @before-mount="handleEditorBeforeMount"
          @validate="handleYamlValidate"
        >
          <div class="editor-loading">YAML 编辑器加载中...</div>
        </VueMonacoEditor>

        <div class="terminal-footer">
          <div class="footer-left">
            <el-button v-if="activeTab === 'tables'" class="footer-secondary-button" :loading="syncLoading" @click="handleSyncTable">
              <el-icon>
                <RefreshCcw />
              </el-icon>
              物理同步
            </el-button>
            <div v-else-if="activeTab === 'terminologies'" class="footer-label">
              <el-icon>
                <BookA />
              </el-icon>
              <span>行业业务词对应</span>
            </div>
            <div v-else class="footer-label">
              <el-icon>
                <CodeXml />
              </el-icon>
              <span>备选 Golden SQL</span>
            </div>
          </div>
          <div class="footer-actions">
            <el-button class="footer-secondary-button" @click="handleRestore">取消</el-button>
            <el-button type="primary" :loading="saveLoading" :disabled="!isYamlValid" @click="handleSave">
              <el-icon>
                <Check />
              </el-icon>
              保存应用
            </el-button>
          </div>
        </div>
      </el-card>

      <section class="preview-panel">
        <el-radio-group v-model="activeTab" class="config-switch" size="large">
          <el-radio-button value="tables">
            <Layers2 class="switch-icon" />
            表结构描述 ({{ previewData.tables?.length || 0 }})
          </el-radio-button>
          <el-radio-button value="terminologies">
            <BookA class="switch-icon" />
            行业术语 ({{ previewData.terminologies?.length || 0 }})
          </el-radio-button>
          <el-radio-button value="sqlTrains">
            <CodeXml class="switch-icon" />
            SQL 模板 ({{ previewData.sqlTrains?.length || 0 }})
          </el-radio-button>
        </el-radio-group>

        <div class="preview-header">
          <div v-if="activeTab === 'tables'" class="preview-heading">
            <div class="preview-title">
              <Layers2 class="preview-icon brand" />
              <h3>数据表结构描述与数据级释义</h3>
            </div>
            <p>智能体直接读取表及字段语义，支持物理字段与注释的双向校验。</p>
          </div>
          <div v-else-if="activeTab === 'terminologies'" class="preview-heading">
            <div class="preview-title">
              <BookA color="#3297a0" />
              <h3>行业特定业务术语与同义词大盘</h3>
            </div>
            <p>建立英文列与中文核心业务名词的映射关系，消除跨域检索歧义。</p>
          </div>
          <div v-else class="preview-heading">
            <div class="preview-title">
              <CodeXml color="#3297a0" />
              <h3>少样本学习 Golden SQL 黄金模板</h3>
            </div>
            <p>提供复杂物理联表、统计窗口查询示范黄金模板，100% 拒绝 SQL 幻觉。</p>
          </div>
          <input-radius
            v-if="activeTab === 'tables'"
            v-model="tableKeyword"
            :suffix-icon="Search"
            clearable
            placeholder="在解析表结构中检索字段或表..."
          />
        </div>

        <div class="config-content">
          <template v-if="activeTab === 'tables'">
            <div v-if="previewData.tables?.length && filteredTables.length" class="table-preview">
              <div class="table-sidebar">
                <div class="table-list-title">物理数据表 ({{ filteredTables.length }})</div>
                <div class="table-list">
                  <button
                    v-for="(table, index) in filteredTables"
                    :key="`${table.name}-${index}`"
                    type="button"
                    :class="{ active: selectedTableIndex === index }"
                    @click="selectedTableIndex = index"
                  >
                    <span class="table-name" :title="table.name">{{ table.name }}</span>
                    <span class="table-status-dot"></span>
                  </button>
                </div>
              </div>

              <div v-if="selectedTable" class="field-panel">
                <div class="field-title">
                  <div class="table-identity">
                    <el-tag type="info" effect="light">物理库表 REAL_TABLE</el-tag>
                    <span>/</span>
                    <strong>{{ selectedTable.name }}</strong>
                  </div>
                  <p>
                    <strong>表业务语义说明：</strong>
                    {{ selectedTable.description || '' }}
                  </p>
                </div>
                <div class="field-table-title">物理字段架构 &amp; 列数据级释义 ({{ selectedTable.columns?.length || 0 }})</div>
                <el-table :data="selectedTable.columns || []" height="100%">
                  <el-table-column prop="name" label="字段名" min-width="130" fixed="left" show-overflow-tooltip>
                    <template #default="{ row }">
                      <span class="field-name" :title="row.name" v-html="highlightFieldName(row.name)"></span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="type" label="类型" min-width="120" show-overflow-tooltip>
                    <template #default="{ row }">
                      <span class="field-type">{{ row.type }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="nullable" label="可空" width="70" align="center" header-align="center">
                    <template #default="{ row }">
                      <span v-if="row.nullable === 'NO'" class="nullable-no">NO</span>
                      <span v-else-if="row.nullable === 'YES'" class="nullable-yes">YES</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="index" label="索引" width="90" align="center" header-align="center">
                    <template #default="{ row }">
                      <el-tag v-if="row.index === 'PRI'" class="index-tag" type="danger" effect="light">PRI</el-tag>
                      <el-tag v-else-if="row.index === 'UNI'" class="index-tag" type="primary2" effect="light">UNI</el-tag>
                      <el-tag v-else-if="row.index === 'MUL'" class="index-tag" type="success" effect="light">MUL</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="description" label="业务描述" min-width="180" show-overflow-tooltip />
                </el-table>
              </div>
            </div>
            <el-empty v-else-if="previewData.tables?.length" description="未找到匹配的数据表" />
            <div v-else class="empty-state">
              <div class="empty-tip brand-tip">
                <div>
                  <el-icon color="var(--el-color-warning)">
                    <Lightbulb />
                  </el-icon>
                  <strong>哪些属性不可以自定义，哪些可以？</strong>
                </div>
                <p>
                  允许自定义修改的属性只有一项：字段描述（description）。其它属性：表名（name）、数据类型（type）、允许空（nullable）、索引类型（index）都是从数据源读取出来的原始信息，这些信息和字段结构强关联，不允许修改。
                </p>
              </div>
              <div class="empty-config">
                <el-icon class="empty-icon">
                  <OctagonAlert />
                </el-icon>
                <strong>未配置任何数据表结构（YAML tables）</strong>
                <p>您可以点击左侧 YAML 代码区下方的 「物理同步」 按钮，从数据源中解析数据表及字段结构。</p>
                <!-- prettier-ignore -->
                <pre>tables:
  - name: t_area
    description: 地区表
    columns:
      - name: parent_area_code
        type: varchar(12)
        nullable: YES
        index: ''
        description: 父级地区编码</pre>
              </div>
            </div>
          </template>

          <template v-else-if="activeTab === 'terminologies'">
            <div class="terminology-content">
              <div class="empty-tip">
                <div>
                  <Lightbulb color="#e6a23c" />
                  <strong>为什么需要物理中台行业术语映射？</strong>
                </div>
                <p>
                  在大模型解析 SQL 前，智能体往往容易遇到业务简称歧义风险。例如：物理数据库字段为 vip_level =
                  3，普通业务人员查询提问“筛选出独角兽级别的对公大户”。由于大模型不知道“独角兽级会员”等同于“vip_level=3”，在这里建立对应行业术语的同义词和定义映射，能
                  100% 打通智能决策的“黑话词典”！
                </p>
              </div>
              <div v-if="previewData.terminologies?.length" class="term-list">
                <article v-for="(term, index) in previewData.terminologies" :key="`${term.term}-${index}`" class="term-card">
                  <header>
                    <el-tag type="primary2" effect="light">{{ term.term }}</el-tag>
                    <el-tag type="info" effect="light">TERM_{{ Number(index) + 1 }}</el-tag>
                  </header>
                  <section>
                    <strong>关联业务关键词 / 多义同义词：</strong>
                    <div class="keyword-list">
                      <el-tag
                        v-for="keyword in (term.keywords || '').split(new RegExp('[,，]')).filter(Boolean)"
                        :key="keyword"
                        type="info"
                        effect="plain"
                      >
                        {{ keyword.trim() }}
                      </el-tag>
                    </div>
                  </section>
                  <section class="term-description">
                    <strong>中台核心场景释义：</strong>
                    <p>{{ term.description || '' }}</p>
                  </section>
                </article>
              </div>
              <div v-else class="empty-config">
                <el-icon class="empty-icon">
                  <OctagonAlert />
                </el-icon>
                <strong>未配置任何行业术语（YAML keywords）</strong>
                <p>您可以在左侧 YAML 代码区中增加 industry_terms 节点，在此处将自动反观并构建大模型词嵌入词包。</p>
                <!-- prettier-ignore -->
                <pre>industry_terms:
  - term: 流水分类
    keywords: 账务拆分，部门共担，分账
    description: 指一笔交易流水 serial_no 中按部门分摊到开发中心的记账</pre>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="sql-content">
              <div class="empty-tip sql-tip">
                <div>
                  <Lightbulb color="#e6a23c" />
                  <strong>黄金 SQL 模板大模型少样本强化学习（Few-Shot Instruction）</strong>
                </div>
                <p>
                  无论大模型如何聪明，在对多表复杂计算、同比环比跨月跨季度聚合（比如 nested queries、partition by 窗口函数）时，很容易生成有偏差的劣质
                  SQL 代码。在此处为特定物理库配备 sql_templates
                  黄金模具。智能体在遇到相关提问时，将直接借鉴此模板拓扑并智能填充参数，使复杂业务统计零差错生成！
                </p>
              </div>
              <div v-if="previewData.sqlTrains?.length" class="sql-list">
                <article v-for="(template, index) in previewData.sqlTrains" :key="`${template.title}-${index}`" class="sql-card">
                  <header>
                    <div>
                      <el-tag type="primary" effect="dark">SQL_{{ Number(index) + 1 }}</el-tag>
                      <strong :title="template.title">{{ template.title }}</strong>
                    </div>
                    <el-tag type="primary2" effect="light">少样本匹配黄金模板</el-tag>
                  </header>
                  <div class="sql-card-body">
                    <p><strong>业务匹配场景：</strong>{{ template.description || '' }}</p>
                    <pre><code>{{ template.sql || '' }}</code><el-button class="sql-copy-button" text circle
                        title="复制 SQL" @click="handleCopySql(template.sql || '')">
                        <el-icon>
                          <Copy />
                        </el-icon>
                      </el-button></pre>
                  </div>
                </article>
              </div>
              <div v-else class="empty-config">
                <el-icon class="empty-icon">
                  <OctagonAlert />
                </el-icon>
                <strong>未配置任意黄金 SQL 模板</strong>
                <p>您可以在左侧 YAML 代码区中增加 sql_templates 段落进行快捷配置，语法示例如下：</p>
                <!-- prettier-ignore -->
                <pre>sql_templates:
  - title: 按币种统计流水
    description: |
      适用：按币种汇总本自然周资金流向。
      输出字段（须与模板一致）：currency, total_amount
    sql: |
      SELECT currency, SUM(amount) AS total_amount
      FROM trade_ledgers
      GROUP BY currency</pre>
              </div>
            </div>
          </template>
        </div>
      </section>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { BookA, Check, CodeXml, Copy, FileText, Layers2, Lightbulb, PencilLine, RefreshCcw, Search } from 'lucide-vue-next';
import { VueMonacoEditor, loader } from '@guolao/vue-monaco-editor';
import { ElMessage } from 'element-plus';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';
import { configureMonacoYaml } from 'monaco-yaml';
import YamlWorker from 'monaco-yaml/yaml.worker?worker';
import { parse, parseDocument, stringify } from 'yaml';
import { agiDatasource } from '@/api/dataservices/datasource';
import type { DatasourceTableDTO, DatasourceVO, SqlTrainDTO, TerminologyDTO } from '@/types';

const visible = defineModel<boolean>({ default: false });
const props = defineProps<{
  source?: DatasourceVO;
}>();
const emit = defineEmits<{
  refresh: [];
}>();

const isYamlValid = ref(true);
const datasourceDetail = ref<DatasourceVO>();
const activeTab = ref('tables');
const yamlContents = reactive<any>({ tables: '', terminologies: '', sqlTrains: '' });
const yamlContent = computed({
  get: () => yamlContents[activeTab.value] || '',
  set: (value: string) => {
    yamlContents[activeTab.value] = value;
  }
});
const tableKeyword = ref('');
const selectedTableIndex = ref(0);
const operationLoading = ref(false);
const syncLoading = ref(false);
const saveLoading = ref(false);
const previewData = ref<any>({ tables: [], terminologies: [], sqlTrains: [] });
const savedYamlContents = reactive<any>({ tables: '', terminologies: '', sqlTrains: '' });
let yamlLanguageService: ReturnType<typeof configureMonacoYaml> | undefined;
let yamlMarkers: monaco.editor.IMarker[] = [];
let yamlValidationTimer: ReturnType<typeof setTimeout> | undefined;

self.MonacoEnvironment = {
  getWorker(_moduleId: string, label: string) {
    return label === 'yaml' ? new YamlWorker() : new EditorWorker();
  }
};

loader.config({ monaco });

const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  fontSize: 12,
  lineHeight: 20,
  minimap: { enabled: false },
  padding: { top: 12, bottom: 12 },
  renderLineHighlight: 'line',
  scrollBeyondLastLine: false,
  tabSize: 2,
  wordWrap: 'on',
  unicodeHighlight: {
    ambiguousCharacters: false,
    invisibleCharacters: false
  }
};

const YAML_CONFIG: any = {
  tables: {
    root: 'tables',
    header: `# -------------------------------------------------------------
# 物理中台元数据架构配置（Tables-as-Code）
# 仅配置物理表和底层字段结构属性
# -------------------------------------------------------------`
  },
  terminologies: {
    root: 'industry_terms',
    header: `# -------------------------------------------------------------
# 行业术语对照元数据配置（Terms-as-Code）
# 辅助 Agent 准确消化分摊、授信等物理专有词汇的含义
# -------------------------------------------------------------`
  },
  sqlTrains: {
    root: 'sql_templates',
    header: `# -------------------------------------------------------------
# 常见常用查询指令的 SQL 模板配置（Templates-as-Code）
# 智能体在面对极复杂联合查询时将直接参考此黄金 SQL 指标范式。
# -------------------------------------------------------------`
  }
};

const createYamlText = (tab: string, data: any[]) => {
  const config = YAML_CONFIG[tab];
  return `${config.header}\n${stringify({ [config.root]: data }, { indent: 2, singleQuote: true })}`;
};

const hasDuplicateValues = (values: string[]) => new Set(values).size !== values.length;
const HTML_ENTITIES: any = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);

const typeLabel = computed(() => (props.source?.dsType === 1 ? 'MySQL' : 'PostgreSQL'));
const filteredTables = computed<any[]>(() => {
  const keyword = tableKeyword.value.trim().toLowerCase();
  const tables = previewData.value.tables || [];
  if (!keyword) {
    return tables;
  }
  return tables.filter(
    (table: any) =>
      String(table.name || '')
        .toLowerCase()
        .includes(keyword) ||
      (table.columns || []).some((field: any) =>
        String(field.name || '')
          .toLowerCase()
          .includes(keyword)
      )
  );
});
const selectedTable = computed(() => filteredTables.value[selectedTableIndex.value]);

const highlightFieldName = (value?: string) => {
  const text = value || '';
  const keyword = tableKeyword.value.trim();
  if (!keyword) {
    return escapeHtml(text);
  }

  const pattern = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  let html = '';
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index || 0;
    html += escapeHtml(text.slice(lastIndex, index));
    html += `<mark class="keyword-highlight">${escapeHtml(match[0])}</mark>`;
    lastIndex = index + match[0].length;
  }
  return html + escapeHtml(text.slice(lastIndex));
};

const handleEditorBeforeMount = () => {
  if (yamlLanguageService) {
    return;
  }
  yamlLanguageService = configureMonacoYaml(monaco, {
    completion: true,
    enableSchemaRequest: false,
    format: {},
    hover: true,
    validate: true,
    yamlVersion: '1.2'
  });
};

const parseCurrentYaml = () => {
  try {
    const selectedTableName = selectedTable.value?.name;
    const parsedYaml = parse(yamlContent.value) || {};
    if (activeTab.value === 'tables') {
      previewData.value.tables = Array.isArray(parsedYaml.tables) ? parsedYaml.tables : [];
      const tableIndex = selectedTableName ? filteredTables.value.findIndex((table: any) => table.name === selectedTableName) : -1;
      selectedTableIndex.value = tableIndex >= 0 ? tableIndex : 0;
    } else if (activeTab.value === 'terminologies') {
      previewData.value.terminologies = Array.isArray(parsedYaml.industry_terms) ? parsedYaml.industry_terms : [];
    } else {
      previewData.value.sqlTrains = Array.isArray(parsedYaml.sql_templates) ? parsedYaml.sql_templates : [];
    }
    isYamlValid.value = !yamlMarkers.some((item) => item.severity === monaco.MarkerSeverity.Error);
  } catch {
    isYamlValid.value = false;
  }
};

const scheduleYamlValidation = () => {
  clearTimeout(yamlValidationTimer);
  yamlValidationTimer = setTimeout(parseCurrentYaml, 1000);
};

const handleYamlValidate = (markers: monaco.editor.IMarker[]) => {
  yamlMarkers = markers;
  scheduleYamlValidation();
};

const convertDatasourceToYamlData = (source?: DatasourceVO) => ({
  tables: (source?.tables || []).map((table) => ({
    name: table.tableName || '',
    description: table.customComment || table.tableComment || '',
    columns:
      (table as any).columns ||
      (table.fields || []).map((field: any) => ({
        name: field.fieldName,
        type: field.fieldType,
        nullable: field.nullable,
        index: field.keyType,
        description: field.customComment || field.fieldComment || ''
      }))
  })),
  terminologies: (source?.terminologies || []).map((item) => ({
    term: item.name,
    keywords: item.keywords,
    description: item.description || ''
  })),
  sqlTrains: (source?.sqlTrains || []).map((item) => ({
    title: item.title || '',
    description: item.description || '',
    sql: item.sql || ''
  }))
});

const initializeDialog = () => {
  clearTimeout(yamlValidationTimer);
  yamlMarkers = [];
  datasourceDetail.value = props.source;
  const yamlData = convertDatasourceToYamlData(props.source);
  activeTab.value = 'tables';
  yamlContents.tables = createYamlText('tables', yamlData.tables);
  yamlContents.terminologies = createYamlText('terminologies', yamlData.terminologies);
  yamlContents.sqlTrains = createYamlText('sqlTrains', yamlData.sqlTrains);
  Object.assign(savedYamlContents, yamlContents);
  previewData.value = yamlData;
  isYamlValid.value = true;
  tableKeyword.value = '';
  selectedTableIndex.value = 0;
};

const handleBeforeClose = (done: () => void) => {
  if (operationLoading.value) {
    return;
  }
  done();
};

const handleFormat = () => {
  try {
    const yamlDocument = parseDocument(yamlContent.value);
    if (yamlDocument.errors.length) {
      throw yamlDocument.errors[0];
    }
    yamlContent.value = yamlDocument.toString({ indent: 2, singleQuote: true });
  } catch (err) {
    console.error('--> --> 格式化 YAML 失败', err);
    ElMessage.closeAll();
    ElMessage.warning('格式化 YAML 失败');
  }
};

const handleSyncTable = () => {
  if (operationLoading.value) {
    return;
  }
  const id = props.source?.id;
  if (!id) {
    ElMessage.closeAll();
    ElMessage.warning('缺少数据源 ID，无法同步表结构');
    return;
  }

  operationLoading.value = true;
  syncLoading.value = true;
  agiDatasource
    .syncTable(id)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      return agiDatasource.single(id);
    })
    .then((res) => {
      if (res.code !== 200 || !res.data) {
        return Promise.reject(res.msg);
      }
      datasourceDetail.value = res.data;
      const yamlData = convertDatasourceToYamlData(res.data);
      const tablesYaml = createYamlText('tables', yamlData.tables);
      yamlContents.tables = tablesYaml;
      savedYamlContents.tables = tablesYaml;
      previewData.value.tables = yamlData.tables;
      selectedTableIndex.value = 0;
      tableKeyword.value = '';
      yamlMarkers = [];
      isYamlValid.value = true;
      emit('refresh');
      ElMessage.closeAll();
      ElMessage.success('物理表结构同步成功');
    })
    .catch((err) => {
      console.error('--> --> 物理表结构同步失败', err);
      ElMessage.closeAll();
      ElMessage.warning('物理表结构同步失败');
    })
    .finally(() => {
      syncLoading.value = false;
      operationLoading.value = false;
    });
};

const handleCopySql = async (sql: string) => {
  let copied = false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(sql);
      copied = true;
    } catch (err) {
      console.error('--> --> 复制 SQL 失败', err);
    }
  }

  if (!copied) {
    const textarea = document.createElement('textarea');
    textarea.value = sql;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    try {
      copied = document.execCommand('copy');
    } catch (err) {
      console.error('--> --> 复制 SQL 失败', err);
    } finally {
      document.body.removeChild(textarea);
    }
  }

  ElMessage.closeAll();
  copied ? ElMessage.success('SQL 已复制') : ElMessage.warning('复制 SQL 失败');
};

const handleSave = () => {
  if (operationLoading.value) {
    return;
  }
  let warningMessage = '保存当前编辑内容失败';
  const submitTab = activeTab.value;
  try {
    const yamlDocument = parseDocument(yamlContent.value);
    if (yamlDocument.errors.length) {
      warningMessage = 'YAML 格式不正确，请检查';
      throw yamlDocument.errors[0];
    }
    yamlContent.value = yamlDocument.toString({ indent: 2, singleQuote: true });
    const parsedYaml = yamlDocument.toJS() || {};
    const dsId = Number(datasourceDetail.value?.id || props.source?.id);
    if (!dsId) {
      warningMessage = '缺少数据源 ID，无法保存';
      throw new Error(warningMessage);
    }

    let dtoList: any[] = [];
    if (submitTab === 'tables') {
      const tables = Array.isArray(parsedYaml.tables) ? parsedYaml.tables : [];
      if (!tables.length) {
        warningMessage = '表结构不能为空';
        throw new Error(warningMessage);
      }
      const originalContent = parse(savedYamlContents.tables) || {};
      const originalTables = Array.isArray(originalContent.tables) ? originalContent.tables : [];
      const tableNames = tables.map((table: any) => String(table?.name || '').trim());
      const originalTableNames = originalTables.map((table: any) => String(table?.name || '').trim());
      if (
        tableNames.some((name: string) => !name) ||
        hasDuplicateValues(tableNames) ||
        tableNames.length !== originalTableNames.length ||
        tableNames.some((name: string) => !originalTableNames.includes(name))
      ) {
        warningMessage = '表名不允许新增、删除、修改或重复';
        throw new Error(warningMessage);
      }

      tables.forEach((table: any, tableIndex: number) => {
        if (!Object.prototype.hasOwnProperty.call(table, 'description')) {
          table.description = '';
          yamlDocument.setIn(['tables', tableIndex, 'description'], '');
        }
        const columns = Array.isArray(table.columns) ? table.columns : [];
        if (!columns.length) {
          warningMessage = `数据表「${table.name}」不能没有字段`;
          throw new Error(warningMessage);
        }
        const originalTable = originalTables.find((item: any) => item.name === table.name);
        const originalColumns = Array.isArray(originalTable?.columns) ? originalTable.columns : [];
        const fieldNames = columns.map((field: any) => String(field?.name || '').trim());
        const originalFieldNames = originalColumns.map((field: any) => String(field?.name || '').trim());
        if (
          fieldNames.some((name: string) => !name) ||
          hasDuplicateValues(fieldNames) ||
          fieldNames.length !== originalFieldNames.length ||
          fieldNames.some((name: string) => !originalFieldNames.includes(name))
        ) {
          warningMessage = `数据表「${table.name}」的字段名不允许新增、删除、修改或重复`;
          throw new Error(warningMessage);
        }
      });

      dtoList = tables.map((table: any): DatasourceTableDTO => {
        const sourceTable = (datasourceDetail.value?.tables || []).find((item: any) => item.tableName === table.name);
        return {
          // ...sourceTable,
          // id: Number(sourceTable?.id),
          tableName: sourceTable.tableName,
          dsId,
          customComment: table.description,
          fields: (sourceTable?.fields || []).map((field: any) => ({
            // ...field,
            dsId,
            fieldName: field.fieldName,
            customComment: table.columns.find((item: any) => item.name === field.fieldName)?.description || ''
          }))
        };
      });
      warningMessage = '保存表结构描述失败';
    } else if (submitTab === 'terminologies') {
      const terms = Array.isArray(parsedYaml.industry_terms) ? parsedYaml.industry_terms : [];
      const termNames = terms.map((term: any) => String(term?.term || '').trim());
      if (termNames.some((name: string) => !name)) {
        warningMessage = '行业术语名称必填且不能为空';
        throw new Error(warningMessage);
      }
      if (hasDuplicateValues(termNames)) {
        warningMessage = '行业术语名称不能重复';
        throw new Error(warningMessage);
      }
      terms.forEach((term: any, index: number) => {
        if (!Object.prototype.hasOwnProperty.call(term, 'description')) {
          term.description = '';
          yamlDocument.setIn(['industry_terms', index, 'description'], '');
        }
      });
      dtoList = terms.map((term: any): TerminologyDTO => ({
        dsId,
        name: term.term,
        keywords: term.keywords,
        description: term.description
      }));
      warningMessage = '保存行业术语失败';
    } else {
      const sqlTemplates = Array.isArray(parsedYaml.sql_templates) ? parsedYaml.sql_templates : [];
      const titles = sqlTemplates.map((template: any) => String(template?.title || '').trim());
      if (titles.some((title: string) => !title)) {
        warningMessage = 'SQL 模板标题必填且不能为空';
        throw new Error(warningMessage);
      }
      if (hasDuplicateValues(titles)) {
        warningMessage = 'SQL 模板标题不能重复';
        throw new Error(warningMessage);
      }
      if (sqlTemplates.some((template: any) => !String(template?.sql || '').trim())) {
        warningMessage = 'SQL 模板内容必填且不能为空';
        throw new Error(warningMessage);
      }
      sqlTemplates.forEach((template: any, index: number) => {
        if (!Object.prototype.hasOwnProperty.call(template, 'description')) {
          template.description = '';
          yamlDocument.setIn(['sql_templates', index, 'description'], '');
        }
      });
      dtoList = sqlTemplates.map((template: any): SqlTrainDTO => ({
        dsId,
        title: template.title,
        description: template.description,
        sql: template.sql
      }));
      warningMessage = '保存 SQL 模板失败';
    }

    yamlContent.value = yamlDocument.toString({ indent: 2, singleQuote: true });
    operationLoading.value = true;
    saveLoading.value = true;
    return nextTick()
      .then(() => {
        if (submitTab === 'tables') {
          return agiDatasource.saveTable(dtoList as DatasourceTableDTO[]);
        }
        if (submitTab === 'terminologies') {
          return agiDatasource.saveTerm(dsId, (dtoList || []) as TerminologyDTO[]);
        }
        return agiDatasource.saveSqlTrain(dsId, (dtoList || []) as SqlTrainDTO[]);
      })
      .then((res: any) => {
        if (res.code !== 200) {
          return Promise.reject(res.msg);
        }
        return agiDatasource.single(dsId);
      })
      .then((res: any) => {
        if (res.code !== 200 || !res.data) {
          return Promise.reject(res.msg);
        }
        datasourceDetail.value = res.data;
        const latestData = convertDatasourceToYamlData(res.data);
        let latestYaml: string;
        if (submitTab === 'tables') {
          latestYaml = createYamlText(submitTab, latestData.tables);
          previewData.value.tables = latestData.tables;
        } else if (submitTab === 'terminologies') {
          latestYaml = createYamlText(submitTab, latestData.terminologies);
          previewData.value.terminologies = latestData.terminologies;
        } else {
          latestYaml = createYamlText(submitTab, latestData.sqlTrains);
          previewData.value.sqlTrains = latestData.sqlTrains;
        }
        yamlContents[submitTab] = latestYaml;
        savedYamlContents[submitTab] = latestYaml;
        yamlMarkers = [];
        isYamlValid.value = true;
        emit('refresh');
        ElMessage.closeAll();
        ElMessage.success('当前编辑内容已保存');
      })
      .catch((err: any) => {
        console.error(`--> --> ${warningMessage}`, err);
        ElMessage.closeAll();
        // ElMessage.warning(warningMessage);
        ElMessage.warning({
          dangerouslyUseHTMLString: true,
          message: `<span>${warningMessage}<br/><br/>${err}</span>`
        });
      })
      .finally(() => {
        saveLoading.value = false;
        operationLoading.value = false;
      });
  } catch (err) {
    console.error(`--> --> ${warningMessage}`, err);
    ElMessage.closeAll();
    // ElMessage.warning(warningMessage);
    ElMessage.warning({
      dangerouslyUseHTMLString: true,
      message: `<span>${warningMessage}<br/><br/>${err}</span>`
    });
  }
};

const handleRestore = async () => {
  if (operationLoading.value) {
    return;
  }
  operationLoading.value = true;
  await nextTick();
  try {
    clearTimeout(yamlValidationTimer);
    yamlContent.value = savedYamlContents[activeTab.value] || '';
    yamlMarkers = [];
    parseCurrentYaml();
    const tabLabel = activeTab.value === 'tables' ? '表结构描述' : activeTab.value === 'terminologies' ? '行业术语' : 'SQL 模板';
    ElMessage.closeAll();
    ElMessage.success(`对「${tabLabel}」的修改已被还原`);
  } finally {
    operationLoading.value = false;
  }
};

watch(
  visible,
  (open: boolean) => {
    if (open) {
      initializeDialog();
    }
  },
  { immediate: true }
);

watch(yamlContent, scheduleYamlValidation);

watch(activeTab, () => {
  clearTimeout(yamlValidationTimer);
  yamlMarkers = [];
  isYamlValid.value = true;
  scheduleYamlValidation();
});

watch(tableKeyword, () => {
  selectedTableIndex.value = 0;
});

onBeforeUnmount(() => {
  clearTimeout(yamlValidationTimer);
});
</script>

<style lang="less" scoped>
.dialog-title {
  min-width: 0;

  span {
    display: block;
    overflow: hidden;
    color: #2b2f33;
    font-size: 18px;
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 24px 40px 20px;
  }
}

.operation-mask {
  position: fixed;
  z-index: 9999;
  inset: 0;
  background: transparent;
}

.dialog-content {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(380px, 5fr) minmax(520px, 7fr);
  gap: 16px;
}

.terminal-card {
  min-width: 0;
  height: 100%;
  overflow: hidden;
  border-color: var(--el-border-color);
  border-radius: 12px;
  background: rgba(235, 243, 245, 0.6);

  :deep(.el-card__body) {
    display: flex;
    height: 100%;
    box-sizing: border-box;
    flex-direction: column;
    padding: 0 !important;
  }

  .terminal-header,
  .terminal-status,
  .terminal-footer {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
  }

  .terminal-header {
    height: 50px;
    padding: 0 20px;
    border-bottom: 1px solid var(--el-border-color);
    background: rgba(235, 243, 245, 0.6);

    > div {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    strong {
      color: #2b2f33;
      font-size: 14px;
      font-weight: bold;
    }

    .terminal-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--el-color-primary);
    }
  }

  .terminal-status {
    padding: 12px 20px;
    border-bottom: 1px solid var(--el-border-color);
    background: rgba(235, 243, 245, 0.6);
    color: var(--el-color-primary);
    font-size: 12px;

    &.error {
      color: var(--el-color-danger);
    }

    :deep(.el-button) {
      height: auto;
      padding: 0;
      color: var(--el-color-primary);
      font-size: 12px;

      &:hover,
      &:focus {
        background: transparent;
        color: var(--el-color-primary);
      }

      .el-icon {
        margin: 0 0.5em;
      }
    }
  }

  .terminal-footer {
    padding: 20px;
    border-top: 1px solid var(--el-border-color);
    background: rgba(235, 243, 245, 0.6);

    .footer-left {
      display: flex;
      min-width: 0;
      flex: 1;
      align-items: center;

      :deep(.footer-secondary-button) {
        min-width: 124px;
      }
    }

    .footer-actions {
      display: flex;
      flex: none;
      align-items: center;
      gap: 16px;
    }

    .footer-label {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 0.5em;
      color: #77838f;
      font-size: 12px;
    }

    :deep(.el-button > span) {
      gap: 0.5em;
    }

    :deep(.footer-secondary-button) {
      min-width: 74px;
      border-color: var(--el-border-color);
      border-radius: 999px;
      background: var(--el-color-white);
      color: #77838f;

      &:hover,
      &:focus {
        border-color: #77838f;
        background: var(--el-color-white);
        color: #77838f;
      }
    }

    :deep(.el-button--primary) {
      min-width: 124px;
      border-radius: 999px;
    }
  }

  .yaml-editor {
    min-height: 0;
    flex: 1;
  }

  .editor-loading {
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
    background: #020617;
    color: var(--el-text-color-placeholder);
    font-size: 12px;
  }
}

.preview-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  padding: 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: #f5f5f5;
}

.config-switch {
  display: flex;
  width: 100%;
  flex: none;
  overflow: hidden;
  border-radius: 12px;
  background: var(--el-color-white);
  margin-bottom: 20px;

  :deep(.el-radio-button) {
    flex: 1;
  }

  :deep(.el-radio-button__inner) {
    display: inline-flex;
    width: 100%;
    height: 40px;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    border: 0 !important;
    outline: none;
    background: var(--el-color-white);
    box-shadow: none !important;
    color: #77838f;
    font-size: 14px;
    font-weight: 300;
  }

  :deep(.el-radio-button.is-active .el-radio-button__inner) {
    border-radius: 12px !important;
    background: var(--el-color-primary);
    color: var(--el-color-white);
  }

  .switch-icon {
    width: 16px;
    height: 16px;
  }
}

.preview-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;

  .preview-heading {
    min-width: 0;

    .preview-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h3,
    p {
      margin: 0;
    }

    h3 {
      color: #2b2f33;
      font-size: 14px;
      font-weight: bold;
    }

    p {
      margin-top: 4px;
      color: #b0bac6;
      font-size: 12px;
    }
  }

  .el-input {
    width: 224px;
    flex: none;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }
}

.config-content {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.empty-state,
.terminology-content,
.sql-content {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 14px;

  .empty-tip {
    flex: none;
    box-sizing: border-box;
    padding: 12px 14px;
    border: 1px solid #bbdfe8;
    border-radius: 10px;
    background: rgba(235, 243, 245, 0.6);
    color: #77838f;

    > div {
      display: flex;
      align-items: center;
      gap: 0.5em;

      .el-icon {
        color: var(--el-color-success);
      }

      strong {
        color: #2b2f33;
        font-size: 14px;
        font-weight: bold;
      }
    }

    p {
      margin: 6px 0 0;
      font-size: 12px;
      line-height: 1.6;
    }

    &.sql-tip,
    &.brand-tip {
      border-color: #bbdfe8;
      background: rgba(235, 243, 245, 0.6);
    }

    &.sql-tip {
      > div .el-icon {
        color: var(--el-color-warning);
      }
    }

    &.brand-tip {
      > div .el-icon {
        color: var(--el-color-primary);
      }
    }
  }
}

.terminology-content,
.sql-content {
  .term-list,
  .sql-list {
    min-height: 0;
    flex: 1;
    padding: 0 2px 2px;
    overflow-y: auto;
    scrollbar-color: var(--el-color-primary) transparent;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 999px;
      background: var(--el-color-primary);
    }
  }

  .term-card,
  .sql-card {
    border: 0;
    border-radius: 12px;
    background: var(--el-color-white);
    box-shadow: none;
  }
}

.terminology-content {
  .term-list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-auto-rows: auto;
    align-content: start;
    gap: 16px;

    .term-card {
      display: flex;
      min-width: 0;
      box-sizing: border-box;
      flex-direction: column;
      padding: 14px;

      header {
        display: flex;
        min-width: 0;
        align-items: center;
        justify-content: space-between;
        gap: 12px;

        .term-title-tag {
          height: 24px;
          max-width: calc(100% - 74px);
          flex: none;
          padding: 0 8px;
          border: 0;
          border-radius: 8px;
          background: rgba(235, 243, 245, 0.6);
          color: var(--el-color-primary);
          font-family: inherit;
          font-size: 12px;
          font-weight: bold;
          line-height: 22px;
          white-space: nowrap;

          :deep(.el-tag__content) {
            display: flex;
            min-width: 0;
            align-items: center;
            flex-wrap: nowrap;
            gap: 0.5em;
            font: inherit;
          }

          .el-icon {
            flex: none;
            margin-right: 0;
          }

          span {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        > span:not(.el-tag) {
          flex: none;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          background: var(--el-fill-color);
          color: var(--el-text-color-secondary);
          font-family: Consolas, Monaco, monospace;
          font-size: 9px;
          line-height: 16px;
        }
      }

      section {
        margin-top: 16px;

        > strong {
          display: block;
          margin-bottom: 7px;
          color: var(--el-text-color-secondary);
          font-size: 14px;
        }

        .keyword-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px 7px;
        }

        &.term-description {
          margin-top: 12px;
          padding-top: 11px;
          border-top: 1px solid var(--el-border-color-lighter);
          font-size: 12px;

          p {
            margin: 0;
            color: #2b2f33;
            font-size: 14px;
          }
        }
      }
    }
  }
}

.sql-content {
  .sql-list {
    display: flex;
    flex-direction: column;
    gap: 14px;

    .sql-card {
      flex: none;
      overflow: hidden;

      > header {
        display: flex;
        min-width: 0;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 14px 0;
        border-bottom: 0;
        background: var(--el-color-white);

        > div {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 8px;

          span {
            flex: none;
            padding: 3px 6px;
            border-radius: var(--radius-sm);
            background: var(--el-color-primary);
            color: var(--color-white);
            font-weight: 700;
          }

          strong {
            min-width: 0;
            overflow: hidden;
            color: var(--el-text-color-primary);
            font-size: 12px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .el-tag {
          flex: none;
        }
      }

      .sql-card-body {
        padding: 14px;

        > p {
          margin: 0;
          color: #2b2f33;

          strong {
            margin-right: 0.5em;
            color: #77838f;
          }
        }

        pre {
          position: relative;
          min-height: 40px;
          box-sizing: border-box;
          margin: 12px 0 0;
          padding: 10px 46px 10px 14px;
          border-radius: 8px;
          background: rgba(235, 243, 245, 0.6);
          color: #77838f;
          word-wrap: break-word;
          word-break: break-all;
          white-space: normal;

          code {
            color: #2b2f33;
          }

          .sql-copy-button {
            position: absolute;
            top: 7px;
            right: 7px;
            color: #77838f;

            &:hover,
            &:focus {
              background: rgb(119 131 143 / 10%);
              color: #2b2f33;
            }
          }
        }
      }
    }
  }
}

.empty-config {
  display: flex;
  width: 100%;
  min-height: 0;
  flex: 1;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 28px;
  border: 2px dashed var(--el-color-primary-light-5);
  border-radius: var(--radius-lg);
  background: var(--color-white);
  color: var(--el-text-color-secondary);
  text-align: center;

  .empty-icon {
    margin-bottom: 12px;
    color: var(--el-border-color);
    font-size: 38px;
  }

  strong {
    color: var(--el-text-color-regular);
    font-size: 14px;
  }

  p {
    margin: 6px 0 16px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  pre {
    width: min(78%, 520px);
    box-sizing: border-box;
    margin: 0;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    background: #0f172a;
    color: #cbd5e1;
    text-align: left;
    white-space: pre-wrap;
  }
}

.table-preview {
  display: flex;
  height: 100%;
  min-height: 0;
  gap: 14px;

  .table-sidebar {
    display: flex;
    width: 250px;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    flex: none;
    flex-direction: column;
    border: 0;
    border-radius: 12px;
    background: var(--el-color-white);

    .table-list {
      width: 100%;
      min-height: 0;
      box-sizing: border-box;
      flex: 1;
      padding-right: 0;
      overflow-x: hidden;
      overflow-y: auto;
    }

    .table-list-title {
      padding: 14px;
      color: #77838f;
      font-size: 12px;
    }

    button {
      display: flex;
      width: calc(100% - 24px);
      margin-left: 12px;
      box-sizing: border-box;
      align-items: center;
      gap: 2px;
      margin-top: 6px;
      padding: 6 12px;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--el-text-color-regular);
      cursor: pointer;
      text-align: left;

      &:hover {
        background: var(--el-fill-color);
      }

      &.active {
        border-color: transparent;
        background: rgba(235, 243, 245, 0.8);
        color: #2b2f33;
        font-weight: bold;
      }

      .table-name {
        display: block;
        min-width: 0;
        flex: 1;
        overflow: hidden;
        font-family: Consolas, Monaco, monospace;
        font-size: 12px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .table-status-dot {
        display: none;
      }
    }
  }

  .field-panel {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    overflow: hidden;

    .field-title {
      display: flex;
      flex: none;
      flex-direction: column;
      gap: 8px;
      padding: 14px;
      border: 0;
      border-radius: 12px;
      background: var(--el-color-white);
      font-size: 12px;

      .table-identity {
        display: flex;
        min-width: 0;
        align-items: center;
        gap: 10px;

        .el-tag {
          flex: none;
          color: var(--el-text-color-regular);
          font-size: 12px;
          font-weight: 700;
        }

        span {
          color: var(--el-border-color-darker);
        }

        strong {
          min-width: 0;
          overflow: hidden;
          color: var(--el-text-color-primary);
          font-family: Consolas, Monaco, monospace;
          font-size: 12px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      p {
        margin: 0;
        color: var(--el-text-color-regular);
        font-size: 12px;
        line-height: 1.7;

        strong {
          font-weight: 700;
        }
      }
    }

    .field-table-title {
      flex: none;
      padding: 14px 0 8px;
      color: #77838f;
      font-size: 12px;
      font-weight: 400;
    }

    .el-table {
      min-height: 0;
      flex: 1;
      border: 0;
      border-radius: 12px;
      --el-table-header-bg-color: #ebf3f5;
      --el-table-row-hover-bg-color: rgba(235, 243, 245, 0.6);

      :deep(.el-table__inner-wrapper) {
        border-radius: 12px;
      }

      :deep(.el-table__header-wrapper tr),
      :deep(.el-table__header-wrapper th.el-table__cell) {
        background-color: #ebf3f5 !important;
      }

      :deep(.el-table__header-wrapper th.el-table__cell) {
        color: #77838f;
        font-weight: 400;
      }


      .index-tag {
        border-radius: 999px;
        font-weight: 400;
      }

      .field-name {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      :deep(.keyword-highlight) {
        padding: 0 1px;
        border-radius: 2px;
        background: var(--el-color-danger-light-8);
        color: var(--el-color-danger);
        font-weight: inherit;
      }

      .field-type {
        color: var(--el-color-primary);
      }

      .nullable-no {
        color: var(--el-color-danger);
        font-weight: 400;
      }

      .nullable-yes {
        color: var(--el-color-success);
      }
    }
  }
}

@media (max-width: 1100px) {
  .dialog-content {
    height: auto;
    grid-template-columns: 1fr;
  }

  .terminal-card,
  .preview-panel {
    height: 560px;
  }
}

:global(.table-config-dialog) {
  height: 90vh;
  margin-bottom: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 24px;
  background: var(--el-color-white);
  box-shadow: var(--el-box-shadow);
}

:global(.table-config-dialog .el-dialog__header) {
  position: relative;
  display: flex;
  min-height: 58px;
  box-sizing: border-box;
  align-items: center;
  margin: 0;
  padding: 0;
}

:global(.table-config-dialog .el-dialog__header::after) {
  position: absolute;
  right: calc(var(--el-dialog-padding-primary) * -1);
  bottom: 0;
  left: calc(var(--el-dialog-padding-primary) * -1);
  height: 1px;
  background: var(--el-border-color);
  content: '';
}

:global(.table-config-dialog .el-dialog__headerbtn) {
  top: 13px;
  right: 24px;
  width: 32px;
  height: 32px;
}

:global(.table-config-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #77838f;
  font-size: 20px;
}

:global(.table-config-dialog .el-dialog__body) {
  height: calc(100% - 58px);
  box-sizing: border-box;
  padding: 16px 32px 32px;
}
</style>
