<template>
  <div class="share-config-form" :class="{ disabled }">
    <t-alert
      v-if="hasManageScopeViolation"
      theme="warning"
      :message="t('ext.share.form.manageWider')"
    />

    <section v-for="scope in scopeOptions" :key="scope.key" class="permission-scope-section">
      <div class="permission-scope-header">
        <div>
          <h4>{{ scope.title }}</h4>
          <p>
            <slot v-if="scope.key === 'manage_scope'" name="manage-description">
              {{ scope.description }}
            </slot>
            <template v-else>{{ scope.description }}</template>
          </p>
        </div>
        <t-switch
          v-if="scope.key !== 'read_scope' || !requireReadScope"
          :value="Boolean(scopes[scope.key])"
          :label="[
            t('ext.share.form.on'),
            t('ext.share.form.off')
          ]"
          :disabled="disabled || (scope.key === 'read_scope' && requireReadScope)"
          @change="(enabled) => toggleScope(scope.key, enabled)"
        />
      </div>
      <template v-if="scopes[scope.key]">
        <div
          class="share-mode-cards"
          :class="`active-${scopes[scope.key].access_level}`"
          role="radiogroup"
          :aria-label="scope.title"
        >
          <div
            v-for="option in shareModeOptions"
            :key="option.value"
            role="radio"
            class="share-mode-card"
            :class="{ active: scopes[scope.key].access_level === option.value }"
            :aria-checked="scopes[scope.key].access_level === option.value"
            :tabindex="!disabled && scopes[scope.key].access_level === option.value ? 0 : -1"
            @click="setAccessLevel(scope.key, option.value)"
            @keydown.enter.prevent="setAccessLevel(scope.key, option.value)"
            @keydown.space.prevent="setAccessLevel(scope.key, option.value)"
          >
            <div class="card-main">
              <div class="card-header">
                <div class="card-icon-wrapper" aria-hidden="true">
                  <component :is="option.icon" class="card-icon" :size="20" />
                </div>
                <div class="card-title">{{ option.title }}</div>
                <div
                  v-if="
                    scopes[scope.key].access_level === option.value && option.value !== 'global'
                  "
                  class="card-action"
                  @click.stop
                >
                  <t-popup
                    trigger="click"
                    placement="bottom-right"
                    overlay-class-name="share-selection-popover"
                  >
                    <t-button
                      size="small"
                      variant="outline"
                      class="select-action lucide-icon-btn"
                      :aria-label="option.value === 'department' ? t('ext.share.form.pickDept') : t('ext.share.form.pickUser')"
                      :disabled="disabled"
                    >
                      <UserPlus class="select-action-icon" :size="14" />
                      <span class="access-count">{{
                        getAccessCount(scope.key, option.value)
                      }}</span>
                    </t-button>
                    <template #content>
                      <div class="selection-dropdown" @mousedown.stop @click.stop>
                        <div class="selection-dropdown-header">
                          <div class="selection-dropdown-title">
                            {{ scope.key === 'manage_scope' ? t('ext.share.form.manageable') : t('ext.share.form.readable')
                            }}{{ option.value === 'department' ? t('ext.share.form.dept') : t('ext.share.form.users') }}
                          </div>
                          <div class="selection-dropdown-subtitle">
                            {{ getAccessSummary(scope.key, option.value) }}
                          </div>
                        </div>
                        <t-input
                          v-model="selectionSearch[scope.key][option.value]"
                          size="small"
                          clearable
                          class="selection-search"
                          :placeholder="option.value === 'department' ? t('ext.share.form.searchDept') : t('ext.share.form.searchUser')"
                          @mousedown.stop
                          @click.stop
                        />
                        <div
                          v-if="getSelectionOptions(scope.key, option.value).length"
                          class="selection-list"
                        >
                          <div
                            v-for="item in getSelectionOptions(scope.key, option.value)"
                            :key="item.value"
                            role="checkbox"
                            :aria-checked="isSelected(scope.key, option.value, item.value)"
                            tabindex="0"
                            class="selection-item"
                            :class="{ selected: isSelected(scope.key, option.value, item.value) }"
                            @mousedown.stop
                            @click.stop="
                              toggleSelection(
                                scope.key,
                                option.value,
                                item.value,
                                !isSelected(scope.key, option.value, item.value)
                              )
                            "
                            @keydown.enter.prevent="
                              toggleSelection(
                                scope.key,
                                option.value,
                                item.value,
                                !isSelected(scope.key, option.value, item.value)
                              )
                            "
                            @keydown.space.prevent="
                              toggleSelection(
                                scope.key,
                                option.value,
                                item.value,
                                !isSelected(scope.key, option.value, item.value)
                              )
                            "
                          >
                            <span class="selection-item-content">
                              <t-checkbox
                                :checked="isSelected(scope.key, option.value, item.value)"
                                @click.stop
                                @change="
                                  (checked) =>
                                    toggleSelection(
                                      scope.key,
                                      option.value,
                                      item.value,
                                      checked
                                    )
                                "
                              />
                              <span class="selection-label">{{ item.label }}</span>
                            </span>
                          </div>
                        </div>
                        <div v-else class="selection-empty">{{ t('ext.share.form.emptyOptions') }}</div>
                      </div>
                    </template>
                  </t-popup>
                </div>
              </div>
              <div class="card-description">{{ option.description }}</div>
            </div>
          </div>
        </div>
      </template>
      <p v-else class="permission-scope-empty">
        {{
          scope.key === 'read_scope'
            ? scopes.manage_scope
              ? t('ext.share.form.noExtraRead')
              : t('ext.share.form.noRead')
            : t('ext.share.form.noManage')
        }}
      </p>
    </section>

    <t-alert
      v-if="disabled && disabledReason"
      theme="info"
      class="share-disabled-alert"
      :message="disabledReason"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Globe, Users, UserPlus } from 'lucide-vue-next'
import { useUserStore } from '@harness/stores/user'
import { authApi } from '@harness/apis/auth_api'

const { t } = useI18n()
const userStore = useUserStore()
const departments = ref([])
const users = ref([])
const syncingFromProps = ref(false)

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      version: 2,
      read_scope: { access_level: 'global', department_ids: [], user_uids: [] },
      manage_scope: null
    })
  },
  autoSelectUserDept: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  disabledReason: { type: String, default: '' },
  requireReadScope: { type: Boolean, default: false },
  allowedAccessLevels: {
    type: Array,
    default: () => ['global', 'user']
  }
})

const emit = defineEmits(['update:modelValue'])

const scopeOptions = computed(() => [
  {
    key: 'read_scope',
    title: t('ext.share.form.readTitle'),
    description: t('ext.share.form.readDesc')
  },
  {
    key: 'manage_scope',
    title: t('ext.share.form.manageTitle'),
    description: t('ext.share.form.manageDesc')
  }
])

const baseShareModeOptions = computed(() => [
  {
    value: 'global',
    title: t('ext.share.form.globalTitle'),
    description: t('ext.share.form.globalDesc'),
    icon: Globe
  },
  {
    value: 'user',
    title: t('ext.share.form.userTitle'),
    description: t('ext.share.form.userDesc'),
    icon: Users
  }
])

const scopes = reactive({ read_scope: null, manage_scope: null })
const selectionSearch = reactive({
  read_scope: { department: '', user: '' },
  manage_scope: { department: '', user: '' }
})

const currentDepartmentId = computed(() =>
  userStore.departmentId ? Number(userStore.departmentId) : null
)
const currentUserUid = computed(() => userStore.uid || '')
const normalizedAllowedAccessLevels = computed(() => {
  const allowed = props.allowedAccessLevels.filter((level) =>
    ['global', 'user'].includes(level)
  )
  return allowed.length ? allowed : ['global']
})
const shareModeOptions = computed(() =>
  baseShareModeOptions.value.filter((option) =>
    normalizedAllowedAccessLevels.value.includes(option.value)
  )
)

const createScope = (scope) => ({
  access_level: scope?.access_level || 'global',
  department_ids: Array.from(
    new Set((scope?.department_ids || []).map(Number).filter(Number.isFinite))
  ),
  user_uids: Array.from(
    new Set((scope?.user_uids || []).map((uid) => String(uid).trim()).filter(Boolean))
  )
})

const normalizeScope = (scope, { includeCurrent = false } = {}) => {
  if (!scope) return null
  const normalized = createScope(scope)
  if (!normalizedAllowedAccessLevels.value.includes(normalized.access_level)) {
    normalized.access_level = normalizedAllowedAccessLevels.value[0]
  }
  if (normalized.access_level === 'global') {
    normalized.department_ids = []
    normalized.user_uids = []
  } else if (normalized.access_level === 'department') {
    normalized.user_uids = []
    if (
      includeCurrent &&
      currentDepartmentId.value &&
      !normalized.department_ids.includes(currentDepartmentId.value)
    ) {
      normalized.department_ids.unshift(currentDepartmentId.value)
    }
  } else {
    normalized.department_ids = []
    if (
      includeCurrent &&
      currentUserUid.value &&
      !normalized.user_uids.includes(currentUserUid.value)
    ) {
      normalized.user_uids.unshift(currentUserUid.value)
    }
  }
  return normalized
}

const isManageScopeWithinRead = (manageScope, readScope = scopes.read_scope) => {
  if (!manageScope || !readScope || readScope.access_level === 'global') return true
  if (manageScope.access_level !== readScope.access_level) return false
  if (readScope.access_level === 'user') {
    return (
      manageScope.access_level === 'user' &&
      manageScope.user_uids.every((uid) => readScope.user_uids.includes(uid))
    )
  }
  if (manageScope.access_level === 'department') {
    return manageScope.department_ids.every((id) => readScope.department_ids.includes(id))
  }
  return true
}

const initConfig = () => {
  syncingFromProps.value = true
  const source = props.modelValue || {}
  const isV2 = source.version === 2
  const readScope = isV2 ? source.read_scope : source
  scopes.read_scope = normalizeScope(readScope, { includeCurrent: props.autoSelectUserDept })
  scopes.manage_scope = normalizeScope(isV2 ? source.manage_scope : null)
  const hadMissingRequiredRead = props.requireReadScope && !scopes.read_scope
  if (hadMissingRequiredRead) {
    scopes.read_scope = normalizeScope({ access_level: 'global' })
  }
  nextTick(() => {
    syncingFromProps.value = false
    if (hadMissingRequiredRead) emitConfig()
  })
}

const emitConfig = () => {
  emit('update:modelValue', {
    version: 2,
    read_scope: normalizeScope(scopes.read_scope),
    manage_scope: normalizeScope(scopes.manage_scope)
  })
}

const toggleScope = (scopeKey, enabled) => {
  if (props.disabled) return
  const defaultManageLevel = scopes.read_scope?.access_level || 'global'
  scopes[scopeKey] = enabled
    ? normalizeScope({ access_level: scopeKey === 'read_scope' ? 'global' : defaultManageLevel })
    : null
}

const setAccessLevel = (scopeKey, accessLevel) => {
  if (
    props.disabled ||
    !scopes[scopeKey] ||
    !normalizedAllowedAccessLevels.value.includes(accessLevel)
  )
    return
  scopes[scopeKey].access_level = accessLevel
  scopes[scopeKey] = normalizeScope(scopes[scopeKey], {
    includeCurrent: scopeKey === 'read_scope' && props.autoSelectUserDept
  })
}

const departmentOptions = computed(() =>
  departments.value.map((dept) => ({
    label: dept.name,
    value: Number(dept.id)
  }))
)
const userOptions = computed(() =>
  users.value.map((user) => ({
    label: user.department_name
      ? t('ext.share.form.userWithDept', {
          name: user.username,
          dept: user.department_name
        })
      : user.username,
    value: user.uid,
    department_id: user.department_id
  }))
)

const getAccessCount = (scopeKey, accessLevel) => {
  const scope = scopes[scopeKey]
  if (accessLevel === 'department') return scope?.department_ids.length || 0
  if (accessLevel === 'user') return scope?.user_uids.length || 0
  return ''
}
const getAccessSummary = (scopeKey, accessLevel) => {
  const scope = scopes[scopeKey]
  if (accessLevel === 'global') return t('ext.share.form.allUsers')
  if (accessLevel === 'department') {
    return t('ext.share.form.deptCount', {
      count: scope?.department_ids.length || 0
    })
  }
  return t('ext.share.form.userCount', { count: scope?.user_uids.length || 0 })
}
const getSelectionOptions = (scopeKey, accessLevel) => {
  let options = accessLevel === 'department' ? departmentOptions.value : userOptions.value

  const query = selectionSearch[scopeKey][accessLevel].trim().toLowerCase()
  return query ? options.filter((item) => item.label.toLowerCase().includes(query)) : options
}
const isSelected = (scopeKey, accessLevel, value) => {
  const scope = scopes[scopeKey]
  if (!scope) return false
  return accessLevel === 'department'
    ? scope.department_ids.includes(Number(value))
    : scope.user_uids.includes(String(value))
}
const toggleSelection = (scopeKey, accessLevel, value, checked) => {
  if (props.disabled || !scopes[scopeKey]) return
  const scope = scopes[scopeKey]
  if (accessLevel === 'department') {
    scope.department_ids = Array.from(
      new Set(
        checked
          ? [...scope.department_ids, Number(value)]
          : scope.department_ids.filter((id) => id !== Number(value))
      )
    )
  } else {
    scope.user_uids = Array.from(
      new Set(
        checked
          ? [...scope.user_uids, String(value)]
          : scope.user_uids.filter((uid) => uid !== String(value))
      )
    )
  }
}

const loadUsers = async () => {
  try {
    users.value = await authApi.getUserAccessOptions()
  } catch (error) {
    console.error('加载用户列表失败:', error)
  }
}

watch(() => props.modelValue, initConfig, { deep: true })
watch(normalizedAllowedAccessLevels, initConfig)
watch(
  scopes,
  () => {
    if (!syncingFromProps.value) emitConfig()
  },
  { deep: true }
)

const validateScope = (scope, title) => {
  if (!scope || scope.access_level === 'global') return { valid: true, message: '' }
  if (scope.access_level === 'department' && !scope.department_ids.length) {
    return { valid: false, message: t('ext.share.form.needDept', { title }) }
  }
  if (scope.access_level === 'user' && !scope.user_uids.length) {
    return { valid: false, message: t('ext.share.form.needUser', { title }) }
  }
  return { valid: true, message: '' }
}

const validate = () => {
  const readResult = validateScope(scopes.read_scope, t('ext.share.form.readTitle'))
  if (!readResult.valid) return readResult
  const manageResult = validateScope(scopes.manage_scope, t('ext.share.form.manageTitleShort'))
  if (!manageResult.valid) return manageResult
  if (!isManageScopeWithinRead(scopes.manage_scope)) {
    return { valid: false, message: t('ext.share.form.manageMustSubset') }
  }
  return manageResult
}

const hasManageScopeViolation = computed(() =>
  Boolean(scopes.manage_scope && !isManageScopeWithinRead(scopes.manage_scope))
)

onMounted(() => {
  initConfig()
  loadUsers()
})

defineExpose({ scopes, validate })
</script>

<style lang="less" scoped>
.share-config-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.permission-scope-section {
  padding: 14px;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  background: var(--gray-0);
}

.permission-scope-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.permission-scope-header h4 {
  margin: 0;
  color: var(--gray-800);
  font-size: 14px;
}

.permission-scope-header p,
.permission-scope-empty {
  margin: 4px 0 0;
  color: var(--gray-500);
  font-size: 12px;
  line-height: 1.5;
}

.share-mode-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.share-mode-card {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--gray-200);
  border-radius: 10px;
  background: var(--gray-0);
  cursor: pointer;
}

.share-mode-card:hover,
.share-mode-card.active {
  border-color: var(--main-color);
  background: var(--main-10);
}

.card-header,
.card-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-main {
  align-items: stretch;
  flex-direction: column;
}

.card-title {
  flex: 1;
  color: var(--gray-800);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  height: 20px;
  display: flex;
  align-items: center;
}

.card-description {
  color: var(--gray-500);
  font-size: 12px;
  line-height: 1.45;
}

.card-icon-wrapper {
  display: inline-flex;
  align-items: center;
  color: var(--main-color);
  height: 20px;
}

.card-action {
  margin-left: auto;
  display: flex;
  align-items: center;
  height: 20px;

  :deep(.select-action) {
    height: 20px;
    padding: 0 8px;
    font-size: 12px;
    line-height: 1;
  }
}

.access-count {
  margin-left: 3px;
}

.share-disabled-alert {
  margin-top: 2px;
}

.selection-dropdown {
  width: 280px;
  padding: 10px;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  background: var(--gray-0);
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
}

.selection-dropdown-header {
  margin-bottom: 8px;
}

.selection-dropdown-title {
  color: var(--gray-800);
  font-size: 13px;
  font-weight: 600;
}

.selection-dropdown-subtitle,
.selection-empty {
  color: var(--gray-500);
  font-size: 12px;
}

.selection-search {
  margin-bottom: 8px;
}

.selection-list {
  max-height: 240px;
  overflow-y: auto;
}

.selection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 4px;
  border-radius: 6px;
  cursor: pointer;
}

.selection-item:hover,
.selection-item.selected {
  background: var(--main-10);
}

.selection-item-content {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.selection-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .share-mode-cards {
    grid-template-columns: 1fr;
  }
}
</style>
