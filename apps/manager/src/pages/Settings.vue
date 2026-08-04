<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  Settings,
  FolderTree,
  Users,
  Network,
  Award,
  KeyRound,
  ScrollText,
  ChevronRight,
  Building2,
  Globe,
  Shield,
  ServerCog,
  Database,
  Sparkles,
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'

const router = useRouter()

const settings = [
  {
    id: 'basic',
    title: '系统基本配置',
    desc: '站点名称、Logo、主题、登录方式、消息推送等基础配置',
    icon: Settings,
    color: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    to: '/settings/basic',
  },
  {
    id: 'domains',
    title: '归属领域分类',
    desc: '维护企业业务领域分类，用于智能体和知识库归属管理',
    icon: FolderTree,
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    to: '/settings/domains',
  },
  {
    id: 'departments',
    title: '部门组织架构',
    desc: '维护企业部门层级与人员归属,支持多级组织树形管理',
    icon: Network,
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    to: '/settings/departments',
  },
  {
    id: 'positions',
    title: '岗位体系设置',
    desc: '定义企业岗位层级与职级序列,作为权限分配的依据',
    icon: Award,
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    to: '/settings/positions',
  },
  {
    id: 'users',
    title: '用户账号管理',
    desc: '管理用户账号、角色与权限,支持批量导入与 SSO 接入',
    icon: Users,
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    to: '/settings/users',
  },
  {
    id: 'api',
    title: '全局接口参数',
    desc: '配置全局 API 密钥、调用限额、代理地址等接口级参数',
    icon: KeyRound,
    color: 'from-cyan-500 to-sky-600',
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    to: '/settings/api-keys',
  },
  {
    id: 'audit',
    title: '系统审计日志',
    desc: '记录系统所有敏感操作与变更,满足合规审计要求',
    icon: ScrollText,
    color: 'from-slate-500 to-slate-700',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    to: '/settings/audit',
  },
]

const stats = [
  { label: '总用户数', value: '1,286', icon: Users, color: 'text-blue-600' },
  { label: '部门数量', value: '42', icon: Network, color: 'text-violet-600' },
  { label: '业务领域', value: '18', icon: FolderTree, color: 'text-emerald-600' },
  { label: 'API 密钥', value: '12', icon: KeyRound, color: 'text-cyan-600' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">系统设置</h1>
        <p class="mt-1 text-sm text-slate-500">管理系统基础配置、组织架构、用户权限与审计日志</p>
      </div>
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <span class="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        系统运行正常 · v 2.4.1
      </div>
    </div>

    <!-- 概览卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card v-for="(s, i) in stats" :key="i" class-name="p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-500">{{ s.label }}</div>
            <div class="text-2xl font-bold text-slate-800 mt-1">{{ s.value }}</div>
          </div>
          <span :class="['flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50', s.color]">
            <component :is="s.icon" class="h-5 w-5" />
          </span>
        </div>
      </Card>
    </div>

    <!-- 设置项入口 -->
    <div>
      <div class="mb-3 text-sm font-semibold text-slate-700">功能模块</div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          v-for="item in settings"
          :key="item.id"
          class="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 text-left transition-all hover:border-blue-300 hover:shadow-md"
          @click="router.push(item.to)"
        >
          <div class="flex items-start gap-4">
            <span
              :class="[
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
                item.color,
              ]"
            >
              <component :is="item.icon" class="h-6 w-6" />
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <h3 class="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {{ item.title }}
                </h3>
                <ChevronRight class="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p class="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{{ item.desc }}</p>
            </div>
          </div>
          <div
            :class="['absolute -right-6 -bottom-6 h-24 w-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br', item.color]"
          />
        </button>
      </div>
    </div>

    <!-- 系统信息 -->
    <Card class-name="p-5">
      <div class="flex items-center gap-2 mb-4">
        <ServerCog class="h-4 w-4 text-slate-500" />
        <h3 class="text-sm font-semibold text-slate-700">系统信息</h3>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
        <div>
          <div class="text-xs text-slate-400">系统版本</div>
          <div class="text-slate-700 font-medium mt-0.5">v 2.4.1 (20260617)</div>
        </div>
        <div>
          <div class="text-xs text-slate-400">部署模式</div>
          <div class="text-slate-700 font-medium mt-0.5 flex items-center gap-1">
            <Building2 class="h-3.5 w-3.5 text-slate-400" />
            企业私有化
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-400">部署区域</div>
          <div class="text-slate-700 font-medium mt-0.5 flex items-center gap-1">
            <Globe class="h-3.5 w-3.5 text-slate-400" />
            华东 1 (杭州)
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-400">许可证</div>
          <div class="text-slate-700 font-medium mt-0.5 flex items-center gap-1">
            <Sparkles class="h-3.5 w-3.5 text-amber-500" />
            企业旗舰版 · 至 2027-12-31
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-400">数据库</div>
          <div class="text-slate-700 font-medium mt-0.5 flex items-center gap-1">
            <Database class="h-3.5 w-3.5 text-slate-400" />
            PostgreSQL 15.4
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-400">消息队列</div>
          <div class="text-slate-700 font-medium mt-0.5">Kafka 3.5.1</div>
        </div>
        <div>
          <div class="text-xs text-slate-400">对象存储</div>
          <div class="text-slate-700 font-medium mt-0.5">MinIO (自建)</div>
        </div>
        <div>
          <div class="text-xs text-slate-400">安全等级</div>
          <div class="text-slate-700 font-medium mt-0.5 flex items-center gap-1">
            <Shield class="h-3.5 w-3.5 text-emerald-500" />
            等保三级
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
