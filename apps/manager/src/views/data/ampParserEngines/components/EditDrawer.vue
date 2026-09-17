<script setup lang="ts">
import modal from '@/plugins/modal';
import { API } from '@/api';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import type { AmpParserEnginesDTO, AmpParserEnginesVO, PageDomain } from '@/types';

interface FormRef {
  clearValidate: (props?: string | string[]) => void;
  validate: (callback: (valid: boolean) => void) => void;
}

interface ParserEngineForm {
  id?: number;
  name: string;
  description: string;
  fileTypes: string[];
  engineConfig: string;
  checkType: string;
  configKey: string;
  sortOrder: number;
  enabled: boolean;
}

type ValidateCallback = (error?: Error) => void;

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    row?: AmpParserEnginesVO;
  }>(),
  {
    modelValue: false
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'success'): void;
}>();

const formRef = ref<FormRef>();
const saving = ref(false);
const loadingSortOrder = ref(false);
const drawerLoading = computed(() => saving.value || loadingSortOrder.value);

const createDefaultForm = (): ParserEngineForm => ({
  id: undefined,
  name: '',
  description: '',
  fileTypes: [],
  engineConfig: '',
  checkType: 'none',
  configKey: '',
  sortOrder: 1,
  enabled: true
});

const form = reactive<ParserEngineForm>(createDefaultForm());

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const isEdit = computed(() => props.row !== undefined);
const drawerTitle = computed(() =>
  isEdit.value ? t('page.data.ampParserEngines.form.editTitle', '编辑解析引擎') : t('page.data.ampParserEngines.form.addTitle', '新增解析引擎')
);

const requiresConfigKey = (checkType: string): boolean => {
  return checkType === 'config' || checkType === 'http_ping';
};

const parseFileTypes = (value?: string): string[] => {
  if (!value) return [];

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue.map(String) : [];
  } catch {
    return [];
  }
};

const formatEngineConfig = (value?: string | null): string => {
  if (!value) return '';

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

const loadNextSortOrder = () => {
  const page = { pageNum: 1, pageSize: 1, orderByColumn: 'sortOrder', isAsc: 'desc' } as PageDomain;
  loadingSortOrder.value = true;
  API.AmpParserEngines.list({}, page)
    .then((res) => {
      if (!visible.value || isEdit.value) return;

      const maxSortOrder = Number(res.rows?.[0]?.sortOrder);
      form.sortOrder = Number.isFinite(maxSortOrder) ? maxSortOrder + 1 : 1;
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
    })
    .finally(() => {
      loadingSortOrder.value = false;
    });
};

const resetForm = () => {
  const row = props.row;
  Object.assign(form, createDefaultForm());
  if (row) {
    Object.assign(form, {
      id: row.id,
      name: row.name || '',
      description: row.description || '',
      fileTypes: parseFileTypes(row.fileTypes),
      engineConfig: formatEngineConfig(row.engineConfig),
      checkType: row.checkType || 'none',
      configKey: row.configKey || '',
      sortOrder: row.sortOrder ?? 0,
      enabled: row.enabled ?? true
    });
  } else {
    loadNextSortOrder();
  }
  nextTick(() => formRef.value?.clearValidate());
};

const validateFileTypes = (_rule: unknown, value: unknown, callback: ValidateCallback) => {
  if (!Array.isArray(value) || value.length === 0) {
    callback(new Error(t('page.data.ampParserEngines.form.validation.fileTypesRequired', '请至少输入一种文件类型')));
    return;
  }
  callback();
};

const validateEngineConfig = (_rule: unknown, value: unknown, callback: ValidateCallback) => {
  if (value === undefined || value === null || value === '') {
    callback();
    return;
  }

  try {
    JSON.parse(String(value));
    callback();
  } catch {
    callback(new Error(t('page.data.ampParserEngines.form.validation.engineConfigJson', '引擎配置必须是有效的 JSON 格式')));
  }
};

const validateConfigKey = (_rule: unknown, value: unknown, callback: ValidateCallback) => {
  if (requiresConfigKey(form.checkType) && !value) {
    callback(new Error(t('page.data.ampParserEngines.form.validation.configKeyRequired', '请输入租户配置项名称')));
    return;
  }
  callback();
};

const rules = {
  name: [
    { required: true, message: t('page.data.ampParserEngines.form.validation.nameRequired', '请输入引擎名称'), trigger: 'blur' },
    { max: 64, message: t('page.data.ampParserEngines.form.validation.nameLength', '引擎名称不能超过 64 个字符'), trigger: 'blur' }
  ],
  description: [
    { max: 255, message: t('page.data.ampParserEngines.form.validation.descriptionLength', '引擎描述不能超过 255 个字符'), trigger: 'blur' }
  ],
  fileTypes: [{ required: true, validator: validateFileTypes, trigger: 'blur' }],
  checkType: [{ required: true, message: t('page.data.ampParserEngines.form.validation.checkTypeRequired', '请选择可用性检测方式') }],
  configKey: [{ validator: validateConfigKey, trigger: 'blur' }],
  engineConfig: [{ validator: validateEngineConfig, trigger: 'blur' }]
};

const buildPayload = (): AmpParserEnginesDTO => {
  const engineConfig = form.engineConfig ? JSON.stringify(JSON.parse(form.engineConfig)) : null;

  return {
    id: form.id,
    name: form.name,
    description: form.description,
    fileTypes: JSON.stringify(form.fileTypes),
    engineConfig,
    checkType: form.checkType,
    configKey: requiresConfigKey(form.checkType) ? form.configKey : '',
    sortOrder: form.sortOrder,
    enabled: form.enabled
  };
};

const submitForm = () => {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) return;

    const editing = isEdit.value;
    saving.value = true;
    const request = editing ? API.AmpParserEngines.update(buildPayload()) : API.AmpParserEngines.insert(buildPayload());
    request
      .then(() => {
        modal.msgSuccess(editing ? t('page.normal.confirmInfo.updateSuccess', '修改成功') : t('page.normal.confirmInfo.addSuccess', '新增成功'));
        emit('success');
        visible.value = false;
      })
      .catch((error) => {
        console.error('--> --> Error:', error);
      })
      .finally(() => {
        saving.value = false;
      });
  });
};

watch(
  () => props.modelValue,
  (isVisible: boolean) => {
    if (isVisible) resetForm();
  },
  { flush: 'post' }
);

watch(
  () => form.checkType,
  (checkType: string) => {
    if (requiresConfigKey(checkType)) return;
    form.configKey = '';
    formRef.value?.clearValidate('configKey');
  }
);
</script>

<template>
  <KjscRtlDrawer
    v-model="visible"
    :size="800"
    :title="drawerTitle"
    :loading="drawerLoading"
    :cancel-text="$t('page.normal.cancel', '取消')"
    :confirm-text="$t('page.normal.confirm', '确认')"
    append-to-body
    @confirm="submitForm"
  >
    <template #header>
      <el-text>{{ drawerTitle }}</el-text>
    </template>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item :label="$t('page.data.ampParserEngines.form.name', '名称')" prop="name">
        <el-input v-model="form.name" maxlength="64" :placeholder="$t('page.data.ampParserEngines.form.namePlaceholder', '请输入引擎名称')" />
      </el-form-item>
      <el-form-item :label="$t('page.data.ampParserEngines.form.description', '描述')" prop="description">
        <el-input
          v-model="form.description"
          maxlength="255"
          :placeholder="$t('page.data.ampParserEngines.form.descriptionPlaceholder', '请输入引擎描述')"
        />
      </el-form-item>
      <el-form-item :label="$t('page.data.ampParserEngines.form.fileTypes', '支持的文件类型')" prop="fileTypes">
        <el-input-tag
          v-model="form.fileTypes"
          clearable
          style="width: 100%"
          :placeholder="$t('page.data.ampParserEngines.form.fileTypesPlaceholder', '输入文件扩展名，按回车生成标签，如 pdf')"
        />
      </el-form-item>
      <el-form-item :label="$t('page.data.ampParserEngines.form.engineConfig', '引擎配置')" prop="engineConfig">
        <el-input
          v-model="form.engineConfig"
          type="textarea"
          :rows="8"
          :placeholder="$t('page.data.ampParserEngines.form.engineConfigPlaceholder', '请输入 JSON 对象')"
        />
      </el-form-item>
      <el-form-item :label="$t('page.data.ampParserEngines.form.checkType', '可用性检测方式')" prop="checkType">
        <el-select
          v-model="form.checkType"
          style="width: 100%"
          :placeholder="$t('page.data.ampParserEngines.form.checkTypePlaceholder', '请选择可用性检测方式')"
        >
          <el-option :label="$t('page.data.ampParserEngines.checkType.none', '无需检测')" value="none" />
          <el-option :label="$t('page.data.ampParserEngines.checkType.docreader', '依赖 DocReader 连接')" value="docreader" />
          <el-option :label="$t('page.data.ampParserEngines.checkType.config', '检查配置项')" value="config" />
          <el-option :label="$t('page.data.ampParserEngines.checkType.httpPing', 'HTTP 探测')" value="http_ping" />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="requiresConfigKey(form.checkType)"
        :label="$t('page.data.ampParserEngines.form.configKey', '租户配置项名称')"
        prop="configKey"
      >
        <el-input v-model="form.configKey" :placeholder="$t('page.data.ampParserEngines.form.configKeyPlaceholder', '请输入租户配置项名称')" />
      </el-form-item>
      <el-form-item :label="$t('page.data.ampParserEngines.form.sortOrder', '排序序号')">
        <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 100%" />
      </el-form-item>
      <el-form-item :label="$t('page.data.ampParserEngines.form.enabled', '状态')">
        <el-switch
          v-model="form.enabled"
          :active-text="$t('page.data.ampParserEngines.status.enabled', '启用')"
          :inactive-text="$t('page.data.ampParserEngines.status.disabled', '禁用')"
        />
      </el-form-item>
    </el-form>
  </KjscRtlDrawer>
</template>
