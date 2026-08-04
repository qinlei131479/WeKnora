<template>
  <div class="brain-form">
    <el-card shadow="never" class="brain-select-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :validate-on-rule-change="false">
        <el-form-item label="选择业务半脑" prop="boundAgentId">
          <el-select v-model="form.boundAgentId" clearable filterable placeholder="请选择业务半脑">
            <template #label>
              <span class="selected-brain-label">
                <span class="selected-brain-name">{{ selectedBusinessAgent?.name || '' }}</span>
                <span v-if="getModelNames(selectedBusinessAgent)" class="selected-brain-models"> ({{ getModelNames(selectedBusinessAgent) }}) </span>
              </span>
            </template>
            <el-option v-for="item in businessAgentOptions" :key="item.id" :label="item.name" :value="item.id">
              <span class="brain-option">
                <span class="brain-option-name">{{ item.name }}</span>
                <span v-if="getModelNames(item)" class="brain-option-models">{{ getModelNames(item) }}</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div class="brain-select-actions">
        <btn type="primary" @click="emit('save')">保存</btn>
      </div>
    </el-card>

    <el-card shadow="never" class="brain-matrix-card">
      <div class="matrix-title">智能体大脑配置明细</div>

      <div class="matrix-scroll">
        <table class="brain-matrix">
          <thead>
            <tr>
              <th></th>
              <th class="feature-cap feature-cap-top"></th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <tr class="matrix-heading-row">
              <td>
                <strong>基础半脑（系统默认配置）</strong>
                <span>提供智能体运行的基础核心能力</span>
              </td>
              <td class="feature-heading-bridge">核心功能</td>
              <td>
                <div class="business-heading">
                  <strong>业务半脑</strong>
                  <el-tag type="primary" size="small" effect="light" round>ACTIVE</el-tag>
                </div>
                <span>专为行业场景打造的增强能力</span>
              </td>
            </tr>

            <tr v-for="row in matrixRows" :key="row.key" :class="`${row.key}-row`">
              <!-- 基础半脑 -->
              <td class="matrix-side-cell" :style="{ backgroundColor: row.bgColor }">
                <div class="asset-grid" :style="{ gridTemplateColumns: `repeat(${row.columns}, minmax(0, 1fr))` }">
                  <div v-if="row.key === 'models'" class="asset-model-remark asset-model-remark--base">备用模型</div>
                  <template v-if="getItems('base', row.key).length">
                    <div
                      v-for="(item, index) in getVisibleItems('base', row)"
                      :key="item.id || `${row.key}-base-${index}`"
                      class="asset-item"
                      :class="{ 'auth-item': row.key === 'auths' }"
                    >
                      <div v-if="row.key === 'auths'" class="auth-heading">
                        <el-tag size="small" :type="authTypeMeta[item.authType]?.type" effect="light" round>
                          {{ authTypeMeta[item.authType]?.label || '其它' }}
                        </el-tag>
                        <strong :title="item.authName || ''">{{ item.authName || '' }}</strong>
                      </div>
                      <template v-else>
                        <el-icon v-if="row.key !== 'knowledges'" :style="{ color: row.iconColor }">
                          <component :is="row.icon" />
                        </el-icon>
                        <div class="asset-content">
                          <div class="asset-name">
                            <template v-if="row.key === 'knowledges'">
                              <el-tag v-if="Number(item.knowledgeType) === 0" type="warning" size="small" effect="light" round>FAQ</el-tag>
                              <el-tag v-else-if="Number(item.knowledgeType) === 1" type="success" size="small" effect="light" round>文档</el-tag>
                            </template>
                            <strong :title="getItemName(item, row.label, index)">
                              {{ getItemName(item, row.label, index) }}
                            </strong>
                            <template v-if="row.key == 'models'">
                              <el-tag v-if="baseAgentBrain.slowModel === item" size="small" type="success" effect="light" round>慢思考模型</el-tag>
                              <el-tag v-else size="small" type="primary" effect="light" round>快思考模型</el-tag>
                            </template>
                          </div>
                          <span v-if="row.key !== 'persona' && row.key !== 'tasks'" :title="getItemDescription(item)">
                            {{ getItemDescription(item) }}
                          </span>
                        </div>
                      </template>
                    </div>
                    <div v-if="hasMore('base', row)" class="expand-row">
                      <el-button round @click="toggleExpanded('base', row.key)">
                        {{ expandedRows.base[row.key] ? '收起更多' : '显示更多' }}
                      </el-button>
                    </div>
                  </template>
                  <el-empty v-else description="">
                    <template #image>
                      <el-icon v-if="row.key !== 'knowledges'" :style="{ color: row.iconColor }">
                        <component :is="row.icon" />
                      </el-icon>
                    </template>
                  </el-empty>
                </div>
              </td>

              <td scope="row" class="feature-cell">
                <el-icon>
                  <component :is="row.icon" />
                </el-icon>
                <span>{{ row.label }}</span>
              </td>

              <!-- 业务半脑 -->
              <td class="matrix-side-cell" :style="{ backgroundColor: row.bgColor }">
                <div class="asset-grid" :style="{ gridTemplateColumns: `repeat(${row.columns}, minmax(0, 1fr))` }">
                  <div v-if="row.key === 'models'" class="asset-model-remark asset-model-remark--business">优先使用的模型</div>
                  <template v-if="getItems('business', row.key).length">
                    <div
                      v-for="(item, index) in getVisibleItems('business', row)"
                      :key="item.id || `${row.key}-business-${index}`"
                      class="asset-item"
                      :class="{ 'auth-item': row.key === 'auths' }"
                    >
                      <div v-if="row.key === 'auths'" class="auth-heading">
                        <el-tag size="small" :type="authTypeMeta[item.authType]?.type" effect="light" round>
                          {{ authTypeMeta[item.authType]?.label || '其它' }}
                        </el-tag>
                        <strong :title="item.authName || ''">{{ item.authName || '' }}</strong>
                      </div>
                      <template v-else>
                        <el-icon v-if="row.key !== 'knowledges'" :style="{ color: row.iconColor }">
                          <component :is="row.icon" />
                        </el-icon>
                        <div class="asset-content">
                          <div class="asset-name">
                            <template v-if="row.key === 'knowledges'">
                              <el-tag v-if="Number(item.knowledgeType) === 0" type="warning" size="small" effect="light" round>FAQ</el-tag>
                              <el-tag v-else-if="Number(item.knowledgeType) === 1" type="success" size="small" effect="light" round>文档</el-tag>
                            </template>
                            <strong :title="getItemName(item, row.label, index)">
                              {{ getItemName(item, row.label, index) }}
                            </strong>
                            <template v-if="row.key == 'models'">
                              <el-tag v-if="businessAgentBrain.slowModel === item" size="small" type="success" round>慢思考模型</el-tag>
                              <el-tag v-else size="small" type="primary" round>快思考模型</el-tag>
                            </template>
                          </div>
                          <span v-if="row.key !== 'persona' && row.key !== 'tasks'" :title="getItemDescription(item)">
                            {{ getItemDescription(item) }}
                          </span>
                        </div>
                      </template>
                    </div>
                    <div v-if="hasMore('business', row)" class="expand-row">
                      <el-button round @click="toggleExpanded('business', row.key)">
                        {{ expandedRows.business[row.key] ? '收起更多' : '显示更多' }}
                      </el-button>
                    </div>
                  </template>
                  <el-empty v-else description="">
                    <template #image>
                      <el-icon v-if="row.key !== 'knowledges'" :style="{ color: row.iconColor }">
                        <component :is="row.icon" />
                      </el-icon>
                    </template>
                  </el-empty>
                </div>
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td></td>
              <td class="feature-cap feature-cap-bottom"></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { getBusinessAgentBrainApi, listBusinessAgentBrainApi } from '@/api/agentic/agentBrain';
import { getBaseAgentBrainApi } from '@/api/agentic/baseAgentBrain';
import { BookOpenCheck, Hexagon, BookMarked, Blocks, LockKeyhole, UserRoundMinus } from 'lucide-vue-next';

const form = (inject('statusContext') as any).form;
const emit = defineEmits<{ save: [] }>();
const formRef = ref();
const rules = {
  boundAgentId: [{ required: true, message: '请选择业务半脑', trigger: 'submit' }]
};
const businessAgentOptions = ref<any[]>([]);
const baseAgentBrain = ref<any>();
const businessAgentBrain = ref<any>();
const authTypeMeta: any = {
  0: { label: '部门', type: 'primary' },
  1: { label: '岗位', type: 'warning' },
  2: { label: '用户组', type: 'success' }
};
const selectedBusinessAgent = computed(() => {
  return businessAgentOptions.value.find((item: any) => String(item.id) === String(form.boundAgentId));
});

const matrixRows = [
  { key: 'persona', label: '人设', icon: UserRoundMinus, iconColor: 'var(--el-color-primary)', bgColor: '#ebf3f5', columns: 1 },
  { key: 'models', label: '模型', icon: Hexagon, iconColor: '#2015B9', bgColor: '#dcebfb', columns: 2 },
  { key: 'knowledges', label: '知识库', icon: BookOpenCheck, iconColor: undefined, bgColor: '#ecfbf5', columns: 2 },
  { key: 'capabilities', label: '能力', icon: Blocks, iconColor: 'var(--el-color-warning)', bgColor: '#fff9f2', columns: 2 },
  { key: 'tasks', label: '任务', icon: BookMarked, iconColor: 'var(--el-color-danger)', bgColor: '#fff6f6', columns: 3 },
  { key: 'auths', label: '权限', icon: LockKeyhole, iconColor: undefined, bgColor: '#dcebfb', columns: 4 }
];

const expandedRows = reactive<any>({
  base: {},
  business: {}
});

const getItems = (side: 'base' | 'business', key: string) => {
  const brain = side === 'base' ? baseAgentBrain.value : businessAgentBrain.value;
  if (key === 'persona') {
    if (side === 'base' || !selectedBusinessAgent.value?.description) {
      return [];
    }
    return [{ id: selectedBusinessAgent.value.id, name: selectedBusinessAgent.value.description }];
  }
  if (!brain) {
    return [];
  }
  if (key === 'models') {
    return [brain.fastModel, brain.slowModel].filter(Boolean);
  }
  if (key === 'capabilities') {
    return brain.skills || [];
  }
  return brain[key] || [];
};

const getVisibleItems = (side: 'base' | 'business', row: any) => {
  const items = getItems(side, row.key);
  return expandedRows[side][row.key] ? items : items.slice(0, row.columns * 2);
};

const hasMore = (side: 'base' | 'business', row: any) => {
  return getItems(side, row.key).length > row.columns * 2;
};

const toggleExpanded = (side: 'base' | 'business', key: string) => {
  expandedRows[side][key] = !expandedRows[side][key];
};

const getItemName = (item: any, fallback: string, index: number) => {
  return item.name || item.taskName || item.title || item.modelName || item.model || `${fallback} ${index + 1}`;
};

const getItemDescription = (item: any) => {
  return item.description || '';
};

const getModelNames = (item: any) => {
  return [item?.fastModel, item?.slowModel]
    .filter(Boolean)
    .map((model: any) => model.name)
    .filter(Boolean)
    .join(', ');
};

const validate = () => formRef.value.validate();
let businessAgentRequestId = 0;

const loadBusinessAgent = async (id: any) => {
  const requestId = ++businessAgentRequestId;
  businessAgentBrain.value = undefined;
  if (!id) {
    return;
  }

  try {
    const res = await getBusinessAgentBrainApi(Number(id));
    if (res.code !== 200) {
      throw res.msg;
    }
    if (requestId === businessAgentRequestId && String(id) === String(form.boundAgentId)) {
      businessAgentBrain.value = res.data;
    }
  } catch (err) {
    console.error('--> --> 获取业务半脑详情失败', err);
  }
};

const initialize = async () => {
  expandedRows.base = {};
  expandedRows.business = {};
  formRef.value?.clearValidate?.();

  try {
    const listRes = await listBusinessAgentBrainApi({ pageSize: 9999, pageNum: 1 });
    if (listRes.code !== 200) {
      throw listRes.msg;
    }
    businessAgentOptions.value = listRes.rows || [];

    const baseRes = await getBaseAgentBrainApi();
    if (baseRes.code !== 200) {
      throw baseRes.msg;
    }
    baseAgentBrain.value = baseRes.data;
    await loadBusinessAgent(form.boundAgentId);
  } catch (err) {
    console.error('--> --> 获取智能体大脑配置失败', err);
  }
};

watch(
  () => form.boundAgentId,
  (id: any) => {
    void loadBusinessAgent(id);
  }
);

defineExpose({ validate, initialize });
</script>

<style lang="scss" scoped>
.brain-form {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 20px;
  font-size: 12px;

  .brain-select-card,
  .brain-matrix-card {
    border: 0;
    border-radius: 24px;
    background: var(--el-color-white);
  }

  .brain-select-card {
    :deep(.el-card__body) {
      padding: 24px 40px 28px;
    }

    :deep(.el-form-item) {
      margin-bottom: 0;

      .el-form-item__label {
        height: auto;
        padding-bottom: 8px;
        color: #2b2f33;
        font-size: 14px;
        font-weight: bold;
        line-height: 20px;
      }
    }

    .el-select {
      width: 100%;
    }

    :deep(.el-select__wrapper) {
      min-height: 36px;
      border-radius: 8px;
    }
  }

  .brain-select-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 36px;

    :deep(.btn) {
      min-width: 84px;
    }
  }

  .brain-matrix-card {
    :deep(.el-card__body) {
      width: 100%;
      padding: 24px 40px 32px;
    }
  }

  .matrix-title {
    margin-bottom: 20px;
    color: #2b2f33;
    font-size: 16px;
    font-weight: bold;
    line-height: 24px;
  }

  .matrix-scroll {
    width: 100%;
    overflow-x: auto;
    overflow-y: visible;
  }

  .brain-matrix {
    width: 100%;
    min-width: 920px;
    border-spacing: 0;
    border-collapse: separate;
    table-layout: fixed;

    th,
    td {
      padding: 12px;
      font-size: 12px;
      vertical-align: middle;
    }

    thead,
    tfoot {
      th,
      td {
        padding: 0;
      }
    }

    tbody {
      tr > td {
        &:first-child,
        &:last-child {
          vertical-align: top;
        }
      }

      .matrix-heading-row {
        td {
          background: var(--el-fill-color-blank);
          text-align: center;

          > strong,
          > span {
            display: block;
          }

          > strong {
            color: var(--el-color-primary);
            font-size: 14px;
          }

          > span {
            margin-top: 5px;
            color: var(--el-text-color-secondary);
            font-size: 12px;
            font-weight: 400;
          }

          .business-heading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1em;

            strong {
              color: #2015b9;
              font-size: 14px;
              line-height: 22px;
            }

            .el-tag {
              display: inline-flex;
              height: 18px;
              align-items: center;
              justify-content: center;
              padding: 0 6px;

              :deep(.el-tag__content) {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
              }
            }
          }
        }

        .feature-heading-bridge {
          width: 104px;
          padding: 0;
          background: var(--el-color-primary);
          color: var(--el-color-white);
          font-size: 14px;
          font-weight: 700;
          text-align: center;
        }
      }

      .auths-row {
        > td {
          &:first-child,
          &:last-child {
            vertical-align: middle;
          }
        }

        .asset-grid {
          align-items: center;
          min-height: 0;
        }

        .auth-item {
          padding-top: 0;
          padding-bottom: 0;
        }
      }
    }
  }

  .feature-cap {
    width: 100px;
    background: var(--el-color-primary);
    color: var(--el-color-white);
    text-align: center;

    &-top {
      height: 16px;
      padding: 0;
      border-radius: 16px 16px 0 0;
    }

    &-bottom {
      height: 16px;
      border-radius: 0 0 16px 16px;
    }
  }

  .feature-cell {
    width: 100px;
    background-color: var(--el-color-primary) !important;
    color: var(--el-color-white);
    text-align: center;

    .el-icon {
      display: block;
      margin: 0 auto 6px;
      font-size: 24px;
    }

    span {
      font-size: 12px;
      font-weight: 700;
    }
  }

  .matrix-side-cell {
    border-top: 1px solid var(--el-color-white);
    border-bottom: 1px solid var(--el-color-white);
  }

  .persona-row > .matrix-side-cell:first-child {
    border-top-left-radius: 16px;
  }

  .persona-row > .matrix-side-cell:last-child {
    border-top-right-radius: 16px;
  }

  .auths-row > .matrix-side-cell:first-child {
    border-bottom-left-radius: 16px;
  }

  .auths-row > .matrix-side-cell:last-child {
    border-bottom-right-radius: 16px;
  }

  .asset-grid {
    display: grid;
    align-items: stretch;
    gap: 8px;
    min-height: 48px;

    .asset-item {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 7px;
      padding: 7px 8px;

      &:has(.asset-content > span) {
        align-items: flex-start;
      }

      .el-icon {
        flex: none;
        font-size: 24px;
      }

      .asset-content {
        display: flex;
        min-width: 0;
        flex: 1;
        flex-direction: column;
        gap: 3px;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        strong {
          font-size: 14px;
        }

        > span {
          font-size: 12px;
        }

        strong {
          color: #000000;
          font-weight: 700;
        }

        > span {
          color: var(--el-text-color-secondary);
          font-weight: 400;
        }
      }

      &.auth-item {
        display: block;
      }

      .auth-heading {
        display: flex;
        min-width: 0;
        align-items: center;
        gap: 0.5em;

        > .el-tag {
          flex: none;
          border: 1px solid var(--el-tag-border-color);
          background-color: var(--el-tag-bg-color);
          color: var(--el-tag-text-color);
          font-weight: 400;
        }

        strong {
          overflow: hidden;
          min-width: 0;
          color: #000000;
          font-size: 12px;
          font-weight: 700;
          line-height: 24px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .expand-row {
      grid-column: 1 / -1;
      text-align: right;

      .el-button {
        height: 26px;
        padding: 0 12px;
        border: 1px solid rgba(255, 255, 255, 0.6);
        background: rgba(255, 255, 255, 0.6);
        color: #77838f;
        font-size: 12px;

        &:hover {
          border: 1px solid #77838f;
          background: #ffffff;
          color: #77838f;
        }
      }
    }

    :deep(.el-empty) {
      grid-column: 1 / -1;
      width: 100%;
      min-height: 48px;
      justify-self: center;
      padding: 0;

      .el-empty__image {
        width: auto;
        height: auto;

        .el-icon {
          color: var(--el-text-color-placeholder);
          font-size: 24px;
        }
      }

      .el-empty__description {
        display: none;
      }
    }
  }

  :deep(.el-empty__image svg) {
    fill: none;
  }
}

.selected-brain-label,
.brain-option {
  display: inline-flex;
  width: 100%;
  min-width: 0;
  align-items: flex-end;
  gap: 1em;
}

.selected-brain-name,
.brain-option-name {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-brain-name {
  max-width: 50%;
  flex: 0 1 auto;
}

.brain-option-name {
  flex: 1;
}

.selected-brain-models,
.brain-option-models {
  overflow: hidden;
  max-width: 60%;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-brain-models {
  min-width: 0;
  flex: 0 1 auto;
}

.brain-option {
  justify-content: space-between;

  .brain-option-models {
    flex: none;
  }
}
.asset-name {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  white-space: nowrap;

  > strong {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    color: #000000;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > .el-tag {
    flex: none;
    color: var(--el-tag-text-color);
  }
}

.asset-model-remark {
  grid-column: 1 / -1;
  font-weight: bold;
  font-size: 14px;

  &--base {
    color: #3297a0;
  }
  &--business {
    color: #2015b9;
  }
}
</style>
