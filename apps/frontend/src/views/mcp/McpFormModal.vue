<template>
  <t-dialog
    v-model:visible="visible"
    attach="body"
    placement="center"
    :header="editMode ? t('knowledgeList.extensions.mcp.form.editTitle') : t('knowledgeList.extensions.mcp.form.addTitle')"
    :confirm-btn="editMode ? t('knowledgeList.extensions.mcp.detail.save') : t('knowledgeList.extensions.mcp.add')"
    :cancel-btn="t('knowledgeList.extensions.cancel')"
    :confirm-loading="formLoading"
    :close-on-overlay-click="false"
    :width="640"
    class="server-modal mcp-form-dialog"
    @confirm="handleFormSubmit"
    @close="visible = false"
  >
    <t-form label-align="top" class="extension-form mcp-form">
      <t-form-item required class="form-item">
        <template #label>
          <span class="wk-bilingual-label">
            <span>{{ t('knowledgeList.extensions.mcp.form.slug') }}</span>
            <small v-if="showEnHint">Identifier</small>
          </span>
        </template>
        <t-input
          v-model="form.slug"
          :placeholder="t('knowledgeList.extensions.mcp.form.slugPlaceholder')"
          :disabled="editMode"
        />
      </t-form-item>
      <t-form-item required class="form-item">
        <template #label>
          <span class="wk-bilingual-label">
            <span>{{ t('knowledgeList.extensions.mcp.form.name') }}</span>
            <small v-if="showEnHint">Name</small>
          </span>
        </template>
        <t-input v-model="form.name" :placeholder="t('knowledgeList.extensions.mcp.form.namePlaceholder')" />
      </t-form-item>
      <t-form-item class="form-item">
        <template #label>
          <span class="wk-bilingual-label">
            <span>{{ t('knowledgeList.extensions.mcp.form.description') }}</span>
            <small v-if="showEnHint">Description</small>
          </span>
        </template>
        <t-textarea
          v-model="form.description"
          :placeholder="t('knowledgeList.extensions.mcp.form.descPlaceholder')"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </t-form-item>
      <t-form-item required class="form-item">
        <template #label>
          <span class="wk-bilingual-label">
            <span>{{ t('knowledgeList.extensions.mcp.form.transport') }}</span>
            <small v-if="showEnHint">Transport</small>
          </span>
        </template>
        <t-select v-model="form.transport">
          <t-option value="streamable_http" label="Streamable HTTP / streamable_http" />
          <t-option value="sse" label="SSE / sse" />
        </t-select>
      </t-form-item>
      <t-form-item class="form-item">
        <template #label>
          <span class="wk-bilingual-label">
            <span>{{ t('knowledgeList.extensions.mcp.form.icon') }}</span>
            <small v-if="showEnHint">Icon</small>
          </span>
        </template>
        <t-input v-model="form.icon" :placeholder="t('knowledgeList.extensions.mcp.form.iconPlaceholder')" :maxlength="2" />
      </t-form-item>
      <template v-if="form.transport === 'streamable_http' || form.transport === 'sse'">
        <t-form-item required class="form-item">
          <template #label>
            <span class="wk-bilingual-label">
              <span>{{ t('knowledgeList.extensions.mcp.form.url') }}</span>
              <small v-if="showEnHint">URL</small>
            </span>
          </template>
          <t-input v-model="form.url" placeholder="https://example.com/mcp" />
        </t-form-item>
        <t-form-item class="form-item">
          <template #label>
            <span class="wk-bilingual-label">
              <span>{{ t('knowledgeList.extensions.mcp.form.headers') }}</span>
              <small v-if="showEnHint">Headers</small>
            </span>
          </template>
          <t-textarea
            v-model="form.headersText"
            :placeholder="t('knowledgeList.extensions.mcp.form.headersPlaceholder')"
            :autosize="{ minRows: 3 }"
          />
        </t-form-item>
        <t-form-item class="form-item">
          <template #label>
            <span class="wk-bilingual-label">
              <span>{{ t('knowledgeList.extensions.mcp.form.httpTimeout') }}</span>
              <small v-if="showEnHint">HTTP Timeout</small>
            </span>
          </template>
          <t-input-number
            v-model="form.timeout"
            :min="1"
            :max="300"
            style="width: 100%"
          />
        </t-form-item>
        <t-form-item class="form-item">
          <template #label>
            <span class="wk-bilingual-label">
              <span>{{ t('knowledgeList.extensions.mcp.form.sseTimeout') }}</span>
              <small v-if="showEnHint">SSE Read Timeout</small>
            </span>
          </template>
          <t-input-number
            v-model="form.sse_read_timeout"
            :min="1"
            :max="300"
            style="width: 100%"
          />
        </t-form-item>
      </template>
      <t-form-item class="form-item">
        <template #label>
          <span class="wk-bilingual-label">
            <span>{{ t('knowledgeList.extensions.mcp.form.tags') }}</span>
            <small v-if="showEnHint">Tags</small>
          </span>
        </template>
        <t-select
          v-model="form.tags"
          multiple
          creatable
          filterable
          :placeholder="t('knowledgeList.extensions.mcp.form.tagsPlaceholder')"
          class="mcp-tags-select"
          style="width: 100%"
        />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { mcpApi } from '@/api/runtime/mcp'

const { t, locale } = useI18n()
const showEnHint = computed(() => !String(locale.value || '').toLowerCase().startsWith('en'))
const props = defineProps({
  open: { type: Boolean, default: false },
  editMode: { type: Boolean, default: false },
  editData: { type: Object, default: null }
})

const emit = defineEmits(['update:open', 'submitted'])

const visible = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const formLoading = ref(false)

const form = reactive({
  slug: '',
  name: '',
  description: '',
  transport: 'streamable_http',
  url: '',
  headersText: '',
  timeout: null,
  sse_read_timeout: null,
  tags: [],
  icon: ''
})

watch(
  () => props.open,
  (val) => {
    if (val && props.editData) {
      Object.assign(form, {
        slug: props.editData.slug || '',
        name: props.editData.name || '',
        description: props.editData.description || '',
        transport: props.editData.transport || 'streamable_http',
        url: props.editData.url || '',
        headersText: props.editData.headers ? JSON.stringify(props.editData.headers, null, 2) : '',
        timeout: props.editData.timeout,
        sse_read_timeout: props.editData.sse_read_timeout,
        tags: props.editData.tags || [],
        icon: props.editData.icon || ''
      })
    } else if (val && !props.editData) {
      Object.assign(form, {
        slug: '',
        name: '',
        description: '',
        transport: 'streamable_http',
        url: '',
        headersText: '',
        timeout: null,
        sse_read_timeout: null,
        tags: [],
        icon: ''
      })
    }
  },
  { immediate: true }
)

const handleFormSubmit = async () => {
  try {
    formLoading.value = true
    let headers = null
    if (form.headersText.trim()) {
      try {
        headers = JSON.parse(form.headersText)
      } catch {
        MessagePlugin.error(t('knowledgeList.extensions.mcp.form.badHeaders'))
        return false
      }
    }
    const data = {
      slug: form.slug,
      name: form.name,
      description: form.description || null,
      transport: form.transport,
      url: form.url || null,
      headers,
      timeout: form.timeout || null,
      sse_read_timeout: form.sse_read_timeout || null,
      tags: form.tags.length > 0 ? form.tags : null,
      icon: form.icon || null
    }
    if (!data.slug?.trim()) {
      MessagePlugin.error(t('knowledgeList.extensions.mcp.form.slugRequired'))
      return false
    }
    if (!data.name?.trim()) {
      MessagePlugin.error(t('knowledgeList.extensions.mcp.form.nameRequired'))
      return false
    }
    if (!data.transport) {
      MessagePlugin.error(t('knowledgeList.extensions.mcp.form.transportRequired'))
      return false
    }
    if (['sse', 'streamable_http'].includes(data.transport)) {
      if (!data.url?.trim()) {
        MessagePlugin.error(t('knowledgeList.extensions.mcp.form.urlRequired'))
        return false
      }
    }
    if (props.editMode) {
      const { slug, ...updateData } = data
      const result = await mcpApi.updateMcpServer(props.editData?.slug || slug, updateData)
      if (result.success) {
        MessagePlugin.success(t('knowledgeList.extensions.mcp.form.updated'))
      } else {
        MessagePlugin.error(t('knowledgeList.extensions.mcp.form.updateFailed'))
        return false
      }
    } else {
      const result = await mcpApi.createMcpServer(data)
      if (result.success) {
        MessagePlugin.success(t('knowledgeList.extensions.mcp.form.created'))
      } else {
        MessagePlugin.error(t('knowledgeList.extensions.mcp.form.createFailed'))
        return false
      }
    }
    visible.value = false
    emit('submitted')
  } catch {
    MessagePlugin.error(t('knowledgeList.extensions.mcp.form.actionFailed'))
    return false
  } finally {
    formLoading.value = false
  }
}
</script>

<style lang="less" scoped>
@import '@harness/assets/css/extensions.less';

.mcp-form {
  max-height: min(64vh, 640px);
  overflow-y: auto;
  padding-right: 4px;

  .form-item {
    margin-bottom: 16px;
  }

  :deep(.t-form-item__label) {
    padding-bottom: 6px;
  }

  :deep(.mcp-tags-select .t-input__prefix),
  :deep(.mcp-tags-select .t-tag-input__prefix) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  :deep(.mcp-tags-select .t-tag) {
    margin: 0;
  }
}

.wk-bilingual-label {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  line-height: 20px;

  small {
    font-size: 12px;
    font-weight: 400;
    color: var(--td-text-color-placeholder, var(--gray-500));
  }
}
</style>
