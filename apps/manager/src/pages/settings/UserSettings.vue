<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  KeyRound,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  RefreshCw,
  UserPlus,
  Users,
  Crown,
  Settings,
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

interface UserItem {
  id: number
  name: string
  email: string
  phone: string
  department: string
  position: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  lastLogin: string
  createdAt: string
  avatar?: string
}

const searchTerm = ref('')
const selectedDept = ref('all')
const selectedRole = ref('all')
const selectedStatus = ref('all')
const showAddModal = ref(false)
const selectedUserId = ref<number | null>(null)

const departments = [
  { id: 'all', name: '全部部门' },
  { id: 'tech', name: '技术部' },
  { id: 'product', name: '产品部' },
  { id: 'sales', name: '销售部' },
  { id: 'hr', name: '人力资源部' },
  { id: 'finance', name: '财务部' },
  { id: 'marketing', name: '市场部' },
]

const roles = [
  { id: 'all', name: '全部角色' },
  { id: 'admin', name: '系统管理员' },
  { id: 'manager', name: '部门经理' },
  { id: 'user', name: '普通用户' },
  { id: 'guest', name: '访客' },
]

const users = ref<UserItem[]>([
  { id: 1, name: '张三', email: 'zhangsan@example.com', phone: '138****1234', department: '技术部', position: '高级工程师', role: 'user', status: 'active', lastLogin: '2024-01-15 14:32', createdAt: '2023-06-01' },
  { id: 2, name: '李四', email: 'lisi@example.com', phone: '139****5678', department: '产品部', position: '产品经理', role: 'manager', status: 'active', lastLogin: '2024-01-15 10:15', createdAt: '2023-03-15' },
  { id: 3, name: '王五', email: 'wangwu@example.com', phone: '137****9012', department: '技术部', position: '架构师', role: 'admin', status: 'active', lastLogin: '2024-01-14 18:45', createdAt: '2022-01-10' },
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', phone: '136****3456', department: '销售部', position: '销售经理', role: 'manager', status: 'active', lastLogin: '2024-01-15 09:20', createdAt: '2023-04-20' },
  { id: 5, name: '钱七', email: 'qianqi@example.com', phone: '135****7890', department: '人力资源部', position: 'HR经理', role: 'manager', status: 'inactive', lastLogin: '2024-01-10 11:30', createdAt: '2023-02-28' },
  { id: 6, name: '孙八', email: 'sunba@example.com', phone: '134****1234', department: '财务部', position: '财务专员', role: 'user', status: 'active', lastLogin: '2024-01-15 08:55', createdAt: '2023-07-15' },
  { id: 7, name: '周九', email: 'zhoujiu@example.com', phone: '133****5678', department: '市场部', position: '市场专员', role: 'user', status: 'pending', lastLogin: '-', createdAt: '2024-01-12' },
  { id: 8, name: '吴十', email: 'wushi@example.com', phone: '132****9012', department: '技术部', position: '测试工程师', role: 'user', status: 'active', lastLogin: '2024-01-14 16:20', createdAt: '2023-09-01' },
  { id: 9, name: '郑十一', email: 'zheng11@example.com', phone: '131****3456', department: '技术部', position: '前端工程师', role: 'user', status: 'active', lastLogin: '2024-01-15 11:40', createdAt: '2023-08-15' },
  { id: 10, name: '王十二', email: 'wang12@example.com', phone: '130****7890', department: '产品部', position: '产品助理', role: 'user', status: 'active', lastLogin: '2024-01-13 15:10', createdAt: '2023-10-20' },
])

const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    if (selectedDept.value !== 'all' && u.department !== departments.find(d => d.id === selectedDept.value)?.name) return false
    if (selectedRole.value !== 'all' && u.role !== selectedRole.value) return false
    if (selectedStatus.value !== 'all' && u.status !== selectedStatus.value) return false
    if (searchTerm.value) {
      const t = searchTerm.value.toLowerCase()
      return u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t) || u.department.toLowerCase().includes(t)
    }
    return true
  })
})

const stats = computed(() => ({
  total: users.value.length,
  active: users.value.filter((u) => u.status === 'active').length,
  inactive: users.value.filter((u) => u.status === 'inactive').length,
  pending: users.value.filter((u) => u.status === 'pending').length,
}))

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'active': return { label: '正常', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 }
    case 'inactive': return { label: '停用', color: 'bg-slate-100 text-slate-600', icon: XCircle }
    case 'pending': return { label: '待激活', color: 'bg-amber-100 text-amber-700', icon: AlertCircle }
    default: return { label: status, color: 'bg-slate-100 text-slate-600', icon: AlertCircle }
  }
}

const getRoleInfo = (role: string) => {
  switch (role) {
    case 'admin': return { label: '系统管理员', color: 'bg-rose-100 text-rose-700', icon: Crown }
    case 'manager': return { label: '部门经理', color: 'bg-violet-100 text-violet-700', icon: Shield }
    case 'user': return { label: '普通用户', color: 'bg-blue-100 text-blue-700', icon: User }
    case 'guest': return { label: '访客', color: 'bg-slate-100 text-slate-600', icon: User }
    default: return { label: role, color: 'bg-slate-100 text-slate-600', icon: User }
  }
}

const handleAdd = () => {
  showAddModal.value = true
}

const handleEdit = (id: number) => {
  selectedUserId.value = id
}

const handleDelete = (id: number) => {
  if (confirm('确定删除该用户账号？')) {
    users.value = users.value.filter((u) => u.id !== id)
  }
}

const handleResetPassword = (id: number) => {
  if (confirm('确定重置该用户的密码？')) {
    alert('密码已重置为默认密码，已发送邮件通知用户')
  }
}

const handleToggleStatus = (id: number) => {
  const user = users.value.find((u) => u.id === id)
  if (user) {
    user.status = user.status === 'active' ? 'inactive' : 'active'
  }
}

const handleExport = () => {
  alert('导出用户列表(演示)')
}

const handleImport = () => {
  alert('导入用户(演示)')
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">用户账号管理</h1>
        <p class="mt-1 text-sm text-slate-500">管理系统用户账号、角色权限与访问控制</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="handleImport">
          <Upload class="h-4 w-4 mr-1" />
          导入
        </Button>
        <Button variant="outline" @click="handleExport">
          <Download class="h-4 w-4 mr-1" />
          导出
        </Button>
        <Button @click="handleAdd">
          <UserPlus class="h-4 w-4 mr-1" />
          新增用户
        </Button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-4 gap-4">
      <Card class-name="p-4 flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Users class="h-5 w-5" />
        </span>
        <div>
          <div class="text-xs text-slate-500">总用户数</div>
          <div class="text-xl font-bold text-slate-800">{{ stats.total }}</div>
        </div>
      </Card>
      <Card class-name="p-4 flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <CheckCircle2 class="h-5 w-5" />
        </span>
        <div>
          <div class="text-xs text-slate-500">正常用户</div>
          <div class="text-xl font-bold text-slate-800">{{ stats.active }}</div>
        </div>
      </Card>
      <Card class-name="p-4 flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <XCircle class="h-5 w-5" />
        </span>
        <div>
          <div class="text-xs text-slate-500">停用用户</div>
          <div class="text-xl font-bold text-slate-800">{{ stats.inactive }}</div>
        </div>
      </Card>
      <Card class-name="p-4 flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <AlertCircle class="h-5 w-5" />
        </span>
        <div>
          <div class="text-xs text-slate-500">待激活</div>
          <div class="text-xl font-bold text-slate-800">{{ stats.pending }}</div>
        </div>
      </Card>
    </div>

    <!-- 筛选栏 -->
    <Card class-name="p-4">
      <div class="flex items-center gap-3">
        <div class="flex-1 relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input v-model="searchTerm" placeholder="搜索用户名、邮箱、部门..." class="pl-9" />
        </div>
        <select v-model="selectedDept" class="h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-blue-500">
          <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
        <select v-model="selectedRole" class="h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-blue-500">
          <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
        <select v-model="selectedStatus" class="h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-blue-500">
          <option value="all">全部状态</option>
          <option value="active">正常</option>
          <option value="inactive">停用</option>
          <option value="pending">待激活</option>
        </select>
        <Button variant="outline" size="icon">
          <Filter class="h-4 w-4" />
        </Button>
      </div>
    </Card>

    <!-- 用户列表 -->
    <Card class-name="overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 border-b">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-slate-600">用户</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-slate-600">部门</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-slate-600">职位</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-slate-600">角色</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-slate-600">状态</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-slate-600">最后登录</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-slate-600">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-slate-50 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold">
                  {{ user.name.charAt(0) }}
                </div>
                <div>
                  <div class="text-sm font-semibold text-slate-800">{{ user.name }}</div>
                  <div class="text-xs text-slate-500 flex items-center gap-1">
                    <Mail class="h-3 w-3" />
                    {{ user.email }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1.5 text-sm text-slate-700">
                <Building2 class="h-3.5 w-3.5 text-slate-400" />
                {{ user.department }}
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-slate-700">{{ user.position }}</td>
            <td class="px-4 py-3">
              <span :class="['inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium', getRoleInfo(user.role).color]">
                <component :is="getRoleInfo(user.role).icon" class="h-3 w-3" />
                {{ getRoleInfo(user.role).label }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="['inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium', getStatusInfo(user.status).color]">
                <component :is="getStatusInfo(user.status).icon" class="h-3 w-3" />
                {{ getStatusInfo(user.status).label }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="text-sm text-slate-700 flex items-center gap-1">
                <Clock class="h-3.5 w-3.5 text-slate-400" />
                {{ user.lastLogin }}
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" @click="handleEdit(user.id)">
                  <Edit class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" @click="handleResetPassword(user.id)">
                  <KeyRound class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" @click="handleToggleStatus(user.id)">
                  <component :is="user.status === 'active' ? XCircle : CheckCircle2" class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" class="text-rose-500 hover:text-rose-600" @click="handleDelete(user.id)">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="flex items-center justify-between px-4 py-3 border-t">
        <div class="text-sm text-slate-500">显示 {{ filteredUsers.length }} 条，共 {{ users.length }} 条</div>
        <div class="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled>上一页</Button>
          <Button variant="outline" size="sm" class="bg-blue-50 border-blue-200 text-blue-600">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">下一页</Button>
        </div>
      </div>
    </Card>
  </div>
</template>