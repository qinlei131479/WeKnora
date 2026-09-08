import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { harnessUrl } from '../apis/prefix'

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

  async function login(credentials) {
    const formData = new FormData()
    formData.append('username', credentials.loginId)
    formData.append('password', credentials.password)

    const response = await fetch(harnessUrl('/api/auth/token'), {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      if (response.status === 423) {
        const lockError = new Error(error.detail || '账户被锁定')
        lockError.status = 423
        lockError.headers = response.headers
        throw lockError
      }
      throw new Error(error.detail || '登录失败')
    }

    const data = await response.json()
    dropLegacyHarnessToken()
    localStorage.setItem(TOKEN_KEY, data.access_token)
    syncToken()
    userId.value = data.user_id
    username.value = data.username
    uid.value = data.uid
    phoneNumber.value = data.phone_number || ''
    avatar.value = data.avatar || ''
    userRole.value = data.role
    departmentId.value = data.department_id || null
    departmentName.value = data.department_name || ''
    return true
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

  async function initialize(admin) {
    const response = await fetch(harnessUrl('/api/auth/initialize'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admin)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '初始化管理员失败')
    }
    const data = await response.json()
    dropLegacyHarnessToken()
    localStorage.setItem(TOKEN_KEY, data.access_token)
    syncToken()
    userId.value = data.user_id
    username.value = data.username
    uid.value = data.uid
    phoneNumber.value = data.phone_number || ''
    avatar.value = data.avatar || ''
    userRole.value = data.role
    departmentId.value = data.department_id || null
    departmentName.value = data.department_name || ''
    return true
  }

  function getAuthHeaders() {
    const headers = {
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

  async function getUsers({ pageSize = 100 } = {}) {
    try {
      const users = []
      let skip = 0

      while (true) {
        const params = new URLSearchParams({
          skip: String(skip),
          limit: String(pageSize)
        })
        const response = await fetch(harnessUrl(`/api/auth/users?${params.toString()}`), {
          headers: {
            ...getAuthHeaders()
          }
        })

        if (!response.ok) {
          throw new Error('获取用户列表失败')
        }

        const batch = await response.json()
        users.push(...batch)

        if (batch.length < pageSize) {
          break
        }

        skip += pageSize
      }

      return users
    } catch (error) {
      console.error('获取用户列表错误:', error)
      throw error
    }
  }

  async function createUser(userData) {
    const response = await fetch(harnessUrl('/api/auth/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(userData)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '创建用户失败')
    }
    return await response.json()
  }

  async function updateUser(id, userData) {
    const response = await fetch(harnessUrl(`/api/auth/users/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(userData)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '更新用户失败')
    }
    return await response.json()
  }

  async function deleteUser(id) {
    const response = await fetch(harnessUrl(`/api/auth/users/${id}`), {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '删除用户失败')
    }
    return await response.json()
  }

  async function validateUsernameAndGenerateUid(usernameValue) {
    const response = await fetch(harnessUrl('/api/auth/validate-username'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ username: usernameValue })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '用户名验证失败')
    }
    return await response.json()
  }

  async function uploadAvatar(file) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(harnessUrl('/api/auth/upload-avatar'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '头像上传失败')
      }

      const data = await response.json()

      avatar.value = data.avatar_url

      return data
    } catch (error) {
      console.error('头像上传错误:', error)
      throw error
    }
  }

  async function getCurrentUser() {
    try {
      const response = await fetch(harnessUrl('/api/auth/me'), {
        headers: {
          ...getAuthHeaders()
        }
      })

      if (!response.ok) {
        throw new Error('获取用户信息失败')
      }

      const userData = await response.json()

      userId.value = userData.id
      username.value = userData.username
      uid.value = userData.uid
      phoneNumber.value = userData.phone_number || ''
      avatar.value = userData.avatar || ''
      userRole.value = userData.role
      departmentId.value = userData.department_id || null
      departmentName.value = userData.department_name || ''

      return userData
    } catch (error) {
      console.error('获取用户信息错误:', error)
      throw error
    }
  }

  async function updateProfile(profileData) {
    try {
      const response = await fetch(harnessUrl('/api/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '更新个人资料失败')
      }

      const userData = await response.json()

      if (typeof userData.username === 'string') {
        username.value = userData.username
      }
      if (typeof userData.phone_number !== 'undefined') {
        phoneNumber.value = userData.phone_number || ''
      }

      return userData
    } catch (error) {
      console.error('更新个人资料错误:', error)
      throw error
    }
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

    login,
    logout,
    syncToken,
    initialize,
    getAuthHeaders,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    validateUsernameAndGenerateUid,
    uploadAvatar,
    getCurrentUser,
    updateProfile
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
