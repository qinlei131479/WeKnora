<template>
  <a-modal
    v-model:open="visible"
    :title="editMode ? t('knowledgeList.extensions.mcp.form.editTitle') : t('knowledgeList.extensions.mcp.form.addTitle')"
    :ok-text="editMode ? t('knowledgeList.extensions.mcp.detail.save') : t('knowledgeList.extensions.mcp.add')"
    :cancel-text="t('knowledgeList.extensions.cancel')"
    @ok="handleFormSubmit"
    :confirmLoading="formLoading"
    @cancel="visible = false"
    :maskClosable="false"
    width="560px"
    class="server-modal"
  >
    <a-form layout="vertical" class="extension-form">
      <a-form-item :label="t('knowledgeList.extensions.mcp.form.slug')" required class="form-item">
        <a-input
          v-model:value="form.slug"
          :placeholder="t('knowledgeList.extensions.mcp.form.slugPlaceholder')"
          :disabled="editMode"
        />
      </a-form-item>
      <a-form-item :label="t('knowledgeList.extensions.mcp.form.name')" required class="form-item">
        <a-input v-model:value="form.name" :placeholder="t('knowledgeList.extensions.mcp.form.namePlaceholder')" />
      </a-form-item>
      <a-form-item :label="t('knowledgeList.extensions.mcp.form.description')" class="form-item">
        <a-input v-model:value="form.description" :placeholder="t('knowledgeList.extensions.mcp.form.descPlaceholder')" />
      </a-form-item>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item :label="t('knowledgeList.extensions.mcp.form.transport')" required class="form-item">
            <a-select v-model:value="form.transport">
              <a-select-option value="streamable_http">streamable_http</a-select-option>
              <a-select-option value="sse">sse</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('knowledgeList.extensions.mcp.form.icon')" class="form-item">
            <a-input v-model:value="form.icon" :placeholder="t('knowledgeList.extensions.mcp.form.iconPlaceholder')" :maxlength="2" />
          </a-form-item>
        </a-col>
      </a-row>
      <template v-if="form.transport === 'streamable_http' || form.transport === 'sse'">
        <a-form-item :label="t('knowledgeList.extensions.mcp.form.url')" required class="form-item">
          <a-input v-model:value="form.url" placeholder="https://example.com/mcp" />
        </a-form-item>
        <a-form-item :label="t('knowledgeList.extensions.mcp.form.headers')" class="form-item">
          <a-textarea
            v-model:value="form.headersText"
            :placeholder="t('knowledgeList.extensions.mcp.form.headersPlaceholder')"
            :rows="3"
          />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('knowledgeList.extensions.mcp.form.httpTimeout')" class="form-item">
              <a-input-number
                v-model:value="form.timeout"
                :min="1"
                :max="300"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('knowledgeList.extensions.mcp.form.sseTimeout')" class="form-item">
              <a-input-number
                v-model:value="form.sse_read_timeout"
                :min="1"
                :max="300"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </template>
      <a-form-item :label="t('knowledgeList.extensions.mcp.form.tags')" class="form-item">
        <a-select
          v-model:value="form.tags"
          mode="tags"
          :placeholder="t('knowledgeList.extensions.mcp.form.tagsPlaceholder')"
          style="width: 100%"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { mcpApi } from '@harness/apis/mcp_api'

const { t } = useI18n()
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
        message.error(t('knowledgeList.extensions.mcp.form.badHeaders'))
        return
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
      message.error(t('knowledgeList.extensions.mcp.form.slugRequired'))
      return
    }
    if (!data.name?.trim()) {
      message.error(t('knowledgeList.extensions.mcp.form.nameRequired'))
      return
    }
    if (!data.transport) {
      message.error(t('knowledgeList.extensions.mcp.form.transportRequired'))
      return
    }
    if (['sse', 'streamable_http'].includes(data.transport)) {
      if (!data.url?.trim()) {
        message.error(t('knowledgeList.extensions.mcp.form.urlRequired'))
        return
      }
    }
    if (props.editMode) {
      const { slug, ...updateData } = data
      const result = await mcpApi.updateMcpServer(props.editData?.slug || slug, updateData)
      if (result.success) {
        message.success(t('knowledgeList.extensions.mcp.form.updated'))
      } else {
        message.error(t('knowledgeList.extensions.mcp.form.updateFailed'))
        return
      }
    } else {
      const result = await mcpApi.createMcpServer(data)
      if (result.success) {
        message.success(t('knowledgeList.extensions.mcp.form.created'))
      } else {
        message.error(t('knowledgeList.extensions.mcp.form.createFailed'))
        return
      }
    }
    visible.value = false
    emit('submitted')
  } catch {
    message.error(t('knowledgeList.extensions.mcp.form.actionFailed'))
  } finally {
    formLoading.value = false
  }
}
</script>

<style lang="less" scoped>
@import '@harness/assets/css/extensions.less';
</style>
