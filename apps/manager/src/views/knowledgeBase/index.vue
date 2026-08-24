<template>
  <section class="manage-page member-manage-page">
    <page-name class="page-name">
      <el-button class="add-btn" type="primary" round v-hasPermi="['business:knowledgeBases:add']" @click="handleAdd" icon="plus">{{
        $t('page.knowledgeBase.add', '添加知识库')
      }}</el-button>
    </page-name>

    <div class="search-bar">
      <div class="search-bar__keyword">
        <el-input v-model="queryParams.username" class="search-bar__input" clearable
          :prefix-icon="Search"
          :placeholder="$t('page.knowledgeBase.searchPlaceholder', '搜索知识库名称')" @keyup.enter="handleQuery" />
        <!-- <button type="button" class="search-bar__icon-btn" @click="handleQuery">
          <svg-icon icon-class="search" class="search-bar__icon" />
        </button> -->
      </div>

      <!-- <div class="search-bar__date-wrap">
        <el-date-picker v-model="dateRange" class="search-bar__date" value-format="YYYY-MM-DD" type="daterange"
          :range-separator="$t('page.mcp.range_separator')"
          :start-placeholder="$t('page.mcp.start_date.placeholder')"
          :end-placeholder="$t('page.mcp.end_date.placeholder')" />
      </div> -->

      <el-button type="button" class="search-bar__reset" @click="resetQuery">{{ $t('page.normal.reset', '重置')
        }}</el-button>
      <el-button type="button" class="search-bar__submit" @click="handleQuery">{{ $t('page.normal.search', '搜索')
        }}</el-button>
    </div>

    <div class="action-toolbar" style="display: none;">
      <div class="action-toolbar__left">
        <!-- <button type="button" class="toolbar-btn" :disabled="multiple" v-hasPermi="['system:dict:remove']"
          @click="handleDelete()">
          {{ $t('page.normal.batchDelete', '批量删除') }}
        </button> -->
        <button type="button" class="toolbar-btn" :disabled="ids.length === 0" v-hasPermi="['business:tenants:edit']"
          @click="handleEnable()">
          {{ $t('page.normal.batchEnable', '批量启用') }}
        </button>
        <button type="button" class="toolbar-btn" :disabled="ids.length === 0" v-hasPermi="['business:tenants:edit']"
          @click="handleDisable()">
          {{ $t('page.normal.batchDisable', '批量停用') }}
        </button>
        <span class="selected-text">{{ $t('page.normal.selected', '共选中') }} <span>{{ ids.length }}</span> {{
          $t('page.normal.items', '条') }}</span>
      </div>

      <div class="action-toolbar__right">
        <!-- <button type="button" class="toolbar-btn" v-hasPermi="['system:dict:export']" @click="handleExport">导出</button> -->
        <!-- <button type="button" class="toolbar-btn" v-hasPermi="['system:dict:remove']"
          @click="handleRefreshCache">刷新缓存</button> -->
        <!-- <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" /> -->
      </div>
    </div>

    <div class="table-pager-area">
      <div class="table-wrap">
        <el-table ref="tableRef" v-loading="loading" :data="tableData" height="100%"
          @row-click="handleRowClick"
          @selection-change="handleSelectionChange">
          <template #empty>
            <kjsc-empty />
          </template>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column :label="$t('page.knowledgeBase.id', '编号')" align="left" key="id" prop="id"
            :width="$dim('page.knowledgeBase.id', 100)" v-if="columns.id.visible" :show-overflow-tooltip="true" />
          <el-table-column :label="$t('page.knowledgeBase.name', '知识库名称')" align="left" key="name" prop="name"
            :width="$dim('page.knowledgeBase.name', 220)" v-if="columns.name.visible" :show-overflow-tooltip="true" />
          <el-table-column :label="$t('page.knowledgeBase.type', '知识库类型')" align="left" key="type"
            prop="type" :width="$dim('page.knowledgeBase.type', 120)" v-if="columns.type.visible" :show-overflow-tooltip="true">
            <template #default="scope">
              <KnowledgeBaseTypeTag :type="scope.row.type" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.knowledgeBase.indexingStrategy', '索引策略')" align="left" key="indexingStrategy"
            prop="indexingStrategy" :width="$dim('page.knowledgeBase.indexingStrategy', 120)" v-if="columns.indexingStrategy.visible" :show-overflow-tooltip="true">
            <template #default="scope">
              <div class="indexingStrategy-cell">
                <el-tag v-if="scope.row.indexingStrategy?.vector_enabled">{{ $t('page.knowledgeBase.indexingStrategys.vector', 'RAG检索') }}</el-tag>
                <el-tag v-if="scope.row.indexingStrategy?.wiki_enabled">{{ $t('page.knowledgeBase.indexingStrategys.wiki', 'Wiki 知识库') }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.knowledgeBase.llmModel', 'LLM语言大模型')" align="left" key="llmModel"
            prop="llmModel" :width="$dim('page.knowledgeBase.llmModel', 200)" v-if="columns.llmModel.visible" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.summaryModel?.name }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.knowledgeBase.embeddingModel', 'Embedding嵌入模型')" align="left" key="embeddingModel"
            prop="embeddingModel" :width="$dim('page.knowledgeBase.embeddingModel', 200)" v-if="columns.embeddingModel.visible" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.embeddingModel?.name }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.knowledgeBase.vectorStore', '向量储存')" align="left" key="vectorStore" prop="vectorStore"
            :width="$dim('page.knowledgeBase.vectorStore', 200)" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ scope.row.vectorStore?.name }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.knowledgeBase.splitStrategy', '分块策略')" align="left" key="splitStrategy" prop="splitStrategy"
            :width="$dim('page.knowledgeBase.splitStrategy', 120)" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ getKBChunkStrategyOptionLabel(scope.row.chunkingConfig?.strategy) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.knowledgeBase.multiModal', '多模态功能')" align="left" key="multiModal" prop="multiModal"
            :width="$dim('page.knowledgeBase.multiModal', 120)" :show-overflow-tooltip="true" />
          <el-table-column :label="$t('page.knowledgeBase.audioRecognition', '音频语音识别')" align="left" key="audioRecognition" prop="audioRecognition"
            :width="$dim('page.knowledgeBase.audioRecognition', 120)" :show-overflow-tooltip="true" />
          <el-table-column :label="$t('page.knowledgeBase.knowledgeGraphs', '知识图谱')" align="left" key="knowledgeGraphs" prop="knowledgeGraphs"
            :width="$dim('page.knowledgeBase.knowledgeGraphs', 120)" :show-overflow-tooltip="true" />
          <el-table-column :label="$t('page.knowledgeBase.aiQuestionGeneration', 'AI问题生成')" align="left" key="aiQuestionGeneration" prop="aiQuestionGeneration"
            :width="$dim('page.knowledgeBase.aiQuestionGeneration', 120)" :show-overflow-tooltip="true" />
          <el-table-column :label="$t('page.knowledgeBase.autoTagAssociation', '自动关联标签')" align="left" key="autoTagAssociation" prop="autoTagAssociation"
            :width="$dim('page.knowledgeBase.autoTagAssociation', 120)" :show-overflow-tooltip="true" />
          <el-table-column :label="$t('page.knowledgeBase.storageEngine', '存储引擎')" align="left" key="storageEngine" prop="storageEngine"
            :width="$dim('page.knowledgeBase.storageEngine', 120)" :show-overflow-tooltip="true" />
          <el-table-column :label="$t('page.knowledgeBase.tenantId', '关联空间')" align="left" key="tenantId"
            prop="tenantId" :width="$dim('page.knowledgeBase.tenantId', 120)" :show-overflow-tooltip="true">
            <template #default="scope">
              <div class="tenant-cell">
                <div class="tenant-cell-name">{{ scope.row.tenantName }}</div>
                <div class="tenant-cell-id">{{ scope.row.tenantId }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.knowledgeBase.updatedAt', '最新修改时间')" align="left" prop="updatedAt" 
            :width="$dim('page.knowledgeBase.updatedAt', 180)">
            <template #default="scope">
              <span>{{ parseTime(scope.row.updatedAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.normal.operation', '操作')" prop="operation"
            align="left" :width="$dim('page.normal.operation', 220)" fixed="right">
            <template #default="scope">
              <el-button link class="action-link action-link--primary" @click="handleUpdate(scope.row)"
                v-hasPermi="['business:knowledge:edit']">
                {{ $t('page.normal.edit') }}
              </el-button>
              <el-button link class="action-link action-link--danger" @click="handleDelete(scope.row)"
                v-hasPermi="['business:knowledge:remove']">
                {{ $t('page.normal.remove') }}
              </el-button>
              <el-button v-if="!scope.row.isActive" link class="action-link action-link--primary"
                @click="handleEnable(scope.row)" v-hasPermi="['business:knowledge:edit']">
                {{ $t('page.normal.enable') }}
              </el-button>
              <el-button v-else link class="action-link action-link--primary" @click="handleDisable(scope.row)"
                v-hasPermi="['business:knowledge:edit']">
                {{ $t('page.normal.disable') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-row">
        <pagination v-show="total > 0" :total="total" v-model:page="pageParams.pageNum"
          v-model:limit="pageParams.pageSize" @pagination="getList" />
      </div>
    </div>

    <KnowledgeBaseEditorModal v-model:visible="open" :mode="mode" :kbId="kbId" />
    <!-- 添加或修改对话框 -->
  </section>
</template>

<script setup lang="ts" name="Models">

import { AjaxResult, KnowledgeBaseEntity, KnowledgeBaseExtends, KnowledgeBaseListReq, TableShowColumns } from "@/types";

import { useI18n } from 'vue-i18n'
import { Search } from 'lucide-vue-next';

import KnowledgeBaseEditorModal from './components/KnowledgeBaseEditorModal.vue'
import KnowledgeBaseTypeTag from './components/KnowledgetBaseTypeTag.vue'
import { deleteKnowledgeBaseSingleApi, getKnowledgeBaseListApi } from "@/api/data/knowledgeBase.js";

import { getKBChunkStrategyOptionLabel } from "@/composables/useKBChunk.js";



const { proxy } = getCurrentInstance()

// const pageLangConfig: Record<string, string> = {
//   'page.mcp.add': '新增MCP',
//   'page.mcp.searchPlaceholder': '通过模型ID、模型名称、创建人进行模糊搜索',
//   'page.mcp.range_separator': '至',
//   'page.mcp.start_date.placeholder': '开始时间',
//   'page.mcp.end_date.placeholder': '结束时间',
//   'page.mcp.reset': '重置',
//   'page.mcp.search': '搜索',
//   'form.button.reset': '重置',
//   'form.button.edit': '编辑',
//   'form.button.delete': '删除',
//   'form.button.enable': '启用',
//   'form.button.disable': '禁用',

//   'mcpServiceDialog.codeImport.toggle': '从代码导入',
//   'mcpServiceDialog.codeImport.hint': '粘贴标准 mcpServers JSON 配置，自动填充表单',
//   'mcpServiceDialog.codeImport.editOverwriteHint': '导入会覆盖当前表单内容（不影响已保存的凭证，需点保存生效）',
//   'mcpServiceDialog.codeImport.parse': '解析并填充',
//   'mcpServiceDialog.codeImport.errors.empty': '请先粘贴配置内容',
//   'mcpServiceDialog.codeImport.errors.invalidJson': '无法解析，请检查 JSON 格式'
// }
// const t = function (key: string, params?: Record<string, string> | string) {
//   let msg = pageLangConfig[key] || key
//   if (params) {
//     if (typeof params == 'string') {
//       msg = pageLangConfig[key] || params
//     } else {
//       Object.keys(params).forEach((key) => {
//         msg = msg.replace(`{${key}}`, params[key])
//       })
//     }
//   }
//   return msg
// }
const { t } = useI18n();
const $t = t;

const tableData = ref<KnowledgeBaseExtends[]>([]) as { value: KnowledgeBaseExtends[] }
const tableRef = ref()
const loading = ref<boolean>(true)
// const showSearch = ref<boolean>(true)
const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)
const total = ref<number>(0)
// 列显隐信息
const columns = ref<Record<string, TableShowColumns>>({
  id: { label: $t('page.knowledgeBase.id', '编号'), visible: true },
  name: { label: $t('page.knowledgeBase.name', '知识库名称'), visible: true },
  type: { label: $t('page.knowledgeBase.type', '知识库类型'), visible: true },
  indexingStrategy: { label: $t('page.knowledgeBase.indexingStrategy', '索引策略'), visible: true },
  llmModel: { label: $t('page.knowledgeBase.llmModel', 'LLM语言大模型'), visible: true },
  embeddingModel: { label: $t('page.knowledgeBase.embeddingModel', 'Embedding嵌入模型'), visible: true },
})


// // 校验登录账号
// const validateUserName = (rule: any, value: string, callback: Function) => {
//   if (!value) {
//     callback(new Error("登录账号不能为空"));
//   } else {
//     if (form.value.userId) {
//       callback();
//     } else {
//       const reg = /^[0-9a-zA-Z]*$/;
//       if (reg.test(value)) {
//         // 接口调用
//         checkUserNameValue({ name: value })
//           .then((res: any) => {
//             if (!res.data) {
//               callback();
//             } else {
//               callback(new Error("该登陆账号已被占用、请重新输入"));
//             }
//           })
//           .catch((err: any) => {
//             console.log(err);
//           });
//       } else {
//         callback(new Error("只能输入数字和字母"));
//       }
//     }
//   }
// };
// // 校验用户昵称
// const validateNickName = (rule: any, value: string, callback: Function) => {
//   if (!value) {
//     callback(new Error("用户昵称不能为空"));
//   } else {
//     const regex = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;
//     if (regex.test(value)) {
//       callback();
//     } else {
//       callback(new Error("只能输入中文、数字、字母"));
//     }
//   }
// };

const open = ref<boolean>(false);
let mode: 'create' | 'edit' = 'create';

const data = reactive({
  queryParams: {
    name: undefined,
  } as KnowledgeBaseListReq,
  pageParams: {
    // orderByColumn: 'createTime',
    // isAsc: 'desc',
    pageNum: 1,
    pageSize: 10,
  }
});

const { queryParams, pageParams } = toRefs(data)

/** 查询知识库列表 */
function getList() {
  loading.value = true
  const params: KnowledgeBaseListReq = queryParams.value;
  getKnowledgeBaseListApi(params, pageParams.value).then(res => {
    loading.value = false
    tableData.value = (res.rows || []).map(parseEntity)
    total.value = +res.total || 0
  }, () => {
    loading.value = false
  });
  handleSelectionChange([])
}

function parseEntity(entity: KnowledgeBaseEntity) {
  parseProperty(entity, 'asrConfig')
  parseProperty(entity, 'autoTagConfig')
  parseProperty(entity, 'chunkingConfig')
  parseProperty(entity, 'cosConfig')
  parseProperty(entity, 'imageProcessingConfig')
  parseProperty(entity, 'indexingStrategy')
  parseProperty(entity, 'questionGenerationConfig')
  parseProperty(entity, 'storageProviderConfig')
  parseProperty(entity, 'vlmConfig')
  parseProperty(entity, 'wikiConfig')
  parseProperty(entity, 'extractConfig')
  console.log('entity', entity)
  return entity as KnowledgeBaseExtends
}
function parseProperty(object: any, property: string) {
  const str = object[property]
  if (str && typeof str === 'string') {
    try {
      const obj = JSON.parse(str);
      object[property] = obj;
    } catch (error) {
      console.log(error);
    }
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  pageParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.value.name = undefined
  handleQuery()
}

/** 删除按钮操作 */
function handleDelete(row: KnowledgeBaseEntity) {
  const id = row.id!
  const message = t('page.tenantMember.deleteConfirm', '是否确认删除知识库编号为"' + id + '"的数据项？')
  proxy.$modal.confirm(message).then(function () {
    return doDelete(id)
  }, () => { });
}

function doDelete(id: number|string) {
  return deleteKnowledgeBaseSingleApi(id).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(t('page.knowledgeBase.deleteSuccess', '删除成功'))
      getList()
    }
  })
}

/** 选择条数  */
function handleSelectionChange(selection: KnowledgeBaseEntity[]) {
  ids.value = selection.map(item => item.id!)
  single.value = selection.length != 1
  multiple.value = !selection.length
}
function handleRowClick(row: KnowledgeBaseEntity, column: any) {
  // if (column.property === 'operation') {
  //   return
  // }
  // showDetail(row.id!)
}

getList()
</script>

<style scoped lang="scss">
  .indexingStrategy-cell {
    .el-tag + .el-tag {
      margin-left: 12px;
    }
  }
</style>

