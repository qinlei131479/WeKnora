<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { TOKEN_KEY } from '@harness/stores/user'

const { t } = useI18n()
const draft = ref(localStorage.getItem(TOKEN_KEY) || '')
const saved = ref(false)

const save = () => {
  const value = draft.value.trim()
  if (!value) return
  localStorage.setItem(TOKEN_KEY, value)
  saved.value = true
  window.location.reload()
}
</script>

<template>
  <div class="harness-token-gate">
    <h2>{{ t('harness.tokenGate.title') }}</h2>
    <p>{{ t('harness.tokenGate.description') }}</p>
    <a-textarea v-model:value="draft" :rows="4" :placeholder="t('harness.tokenGate.placeholder')" />
    <a-button type="primary" :disabled="!draft.trim()" @click="save">{{ t('harness.tokenGate.save') }}</a-button>
  </div>
</template>

<style scoped>
.harness-token-gate {
  max-width: 560px;
  margin: 48px auto;
  padding: 24px;
}
.harness-token-gate h2 {
  margin-bottom: 12px;
}
.harness-token-gate p {
  margin-bottom: 16px;
  color: var(--gray-600, #666);
}
.harness-token-gate .ant-btn {
  margin-top: 12px;
}
</style>
