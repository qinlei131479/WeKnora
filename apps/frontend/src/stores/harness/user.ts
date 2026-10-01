import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TOKEN_KEY = 'weknora_token'
const LEGACY_HARNESS_TOKEN_KEY = 'harness_user_token'
export { TOKEN_KEY }

function dropLegacyHarnessToken() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(LEGACY_HARNESS_TOKEN_KEY)
}

function readHarnessToken() {
  if (typeof localStorage === 'undefined') return ''
  dropLegacyHarnessToken()
  return localStorage.getItem(TOKEN_KEY) || ''
}

export const useUserStore = defineStore('harness-user', () => {
  const tokenTick = ref(0)
  const token = computed(() => {
    tokenTick.value
    return readHarnessToken()
  })
  const userId = ref(null)
  const username = ref('')
  const uid = ref('')
  const phoneNumber = ref('')
  const avatar = ref('')
  const userRole = ref('')
  const departmentId = ref(null)
  const departmentName = ref('')

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userRole.value === 'admin' || userRole.value === 'superadmin')
  const isSuperAdmin = computed(() => userRole.value === 'superadmin')

  function syncToken() {
    tokenTick.value += 1
    return token.value
  }

  function logout() {
    userId.value = null
    username.value = ''
    uid.value = ''
    phoneNumber.value = ''
    avatar.value = ''
    userRole.value = ''
    departmentId.value = null
    departmentName.value = ''
    dropLegacyHarnessToken()
    if (!localStorage.getItem('weknora_user')) {
      localStorage.removeItem(TOKEN_KEY)
    }
    syncToken()

    import('./agent').then(({ useAgentStore }) => {
      useAgentStore().reset()
    }).catch(() => {})
  }

  function getAuthHeaders() {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${syncToken()}`
    }
    if (typeof localStorage !== 'undefined') {
      const selectedTenantId = localStorage.getItem('weknora_selected_tenant_id')
      if (selectedTenantId) {
        headers['X-Tenant-ID'] = selectedTenantId
      }
    }
    return headers
  }

  return {
    token,
    userId,
    username,
    uid,
    phoneNumber,
    avatar,
    userRole,
    departmentId,
    departmentName,

    isLoggedIn,
    isAdmin,
    isSuperAdmin,

    logout,
    syncToken,
    getAuthHeaders
  }
})

export const checkAdminPermission = () => {
  const userStore = useUserStore()
  if (!userStore.isAdmin) {
    throw new Error('需要管理员权限')
  }
  return true
}

export const checkSuperAdminPermission = () => {
  const userStore = useUserStore()
  return userStore.isSuperAdmin
}
