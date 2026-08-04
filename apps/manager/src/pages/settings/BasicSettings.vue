<script setup lang="ts">
import { ref } from 'vue'
import { Save, Upload, RefreshCw, Building2, Globe, Bell, Shield, Palette, Languages, Image as ImageIcon, Check, X, Eye, EyeOff } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const activeTab = ref<'site' | 'login' | 'notify' | 'security' | 'appearance'>('site')

const site = ref({
  name: 'AI 智能体中台',
  shortName: 'AI 中台',
  slogan: '让 AI 助力每个业务场景',
  domain: 'https://ai.example.com',
  logo: '',
  icp: '京 ICP 备 2024xxxxxx 号',
  copyright: '© 2024-2026 XX 科技有限公司',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
})

const login = ref({
  enableAccount: true,
  enableSSO: true,
  enableLDAP: false,
  enableSMS: true,
  enable2FA: true,
  enableCaptcha: true,
  sessionTimeout: 120,
  passwordMinLength: 8,
  passwordComplexity: 'high',
  ssoUrl: 'https://sso.example.com',
  ldapServer: '',
})

const notify = ref({
  enableEmail: true,
  enableSMS: false,
  enableIM: true,
  enableWeb: true,
  emailServer: 'smtp.example.com',
  emailPort: 465,
  emailAccount: 'no-reply@example.com',
  imType: 'dingtalk',
  imWebhook: 'https://oapi.dingtalk.com/robot/send?access_token=xxx',
})

const security = ref({
  passwordPolicy: 'high',
  enableIpWhitelist: true,
  enableRateLimit: true,
  enableAudit: true,
  rateLimit: 1000,
  ipWhitelist: '192.168.0.0/16, 10.0.0.0/8',
  encryption: 'AES-256',
  sessionSecure: true,
  showApiKey: false,
  apiKey: 'sk-aip-xxxxxxxxxxxxxxxxxxxx',
})

const appearance = ref({
  theme: 'light',
  primary: '#2563eb',
  accent: '#8b5cf6',
  layout: 'sidebar',
  density: 'comfortable',
  enableAnimation: true,
  enableDark: true,
})

const themes = [
  { id: 'light', name: '浅色', color: '#f8fafc' },
  { id: 'dark', name: '深色', color: '#0f172a' },
  { id: 'auto', name: '跟随系统', color: 'linear-gradient(135deg, #f8fafc 50%, #0f172a 50%)' },
]

const densities = [
  { id: 'compact', name: '紧凑', desc: '更密集的信息展示' },
  { id: 'comfortable', name: '舒适', desc: '适中的视觉节奏' },
  { id: 'spacious', name: '宽松', desc: '更轻松的浏览体验' },
]

const handleSave = () => {
  alert('系统基本配置已保存(演示)')
}

const regenerateKey = () => {
  if (confirm('确定重新生成 API 密钥?原有密钥将立即失效。')) {
    security.value.apiKey = 'sk-aip-' + Math.random().toString(36).substring(2, 18)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">系统基本配置</h1>
        <p class="mt-1 text-sm text-slate-500">配置站点信息、登录方式、消息通知、安全策略等基础选项</p>
      </div>
      <Button @click="handleSave">
        <Save class="h-4 w-4 mr-1" />
        保存配置
      </Button>
    </div>

    <!-- 标签页 -->
    <div class="flex items-center gap-1 border-b border-slate-200">
      <button
        v-for="tab in [
          { id: 'site', label: '站点信息', icon: Building2 },
          { id: 'login', label: '登录认证', icon: Shield },
          { id: 'notify', label: '消息通知', icon: Bell },
          { id: 'security', label: '安全策略', icon: Shield },
          { id: 'appearance', label: '外观主题', icon: Palette },
        ]"
        :key="tab.id"
        :class="[
          'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
          activeTab === tab.id
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-slate-500 hover:text-slate-700',
        ]"
        @click="activeTab = tab.id as any"
      >
        <component :is="tab.icon" class="h-4 w-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- 站点信息 -->
    <div v-if="activeTab === 'site'" class="space-y-4">
      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">基础信息</h3>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">系统名称</label>
            <Input v-model="site.name" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">系统简称</label>
            <Input v-model="site.shortName" />
          </div>
          <div class="col-span-2">
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">系统标语</label>
            <Input v-model="site.slogan" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">访问域名</label>
            <Input v-model="site.domain" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">默认时区</label>
            <select v-model="site.timezone" class="w-full h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-blue-500">
              <option>Asia/Shanghai (UTC+8)</option>
              <option>Asia/Tokyo (UTC+9)</option>
              <option>Europe/London (UTC+0)</option>
              <option>America/New_York (UTC-5)</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">默认语言</label>
            <select v-model="site.language" class="w-full h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-blue-500">
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">品牌标识</h3>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">站点 Logo</label>
            <div class="flex items-center gap-3">
              <div class="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Logo</div>
              <div class="space-y-1.5">
                <Button variant="outline" size="sm">
                  <Upload class="h-3.5 w-3.5 mr-1" />
                  上传 Logo
                </Button>
                <p class="text-xs text-slate-400">建议 256×256 PNG/SVG</p>
              </div>
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">Favicon</label>
            <div class="flex items-center gap-3">
              <div class="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">ICO</div>
              <div class="space-y-1.5">
                <Button variant="outline" size="sm">
                  <Upload class="h-3.5 w-3.5 mr-1" />
                  上传图标
                </Button>
                <p class="text-xs text-slate-400">建议 32×32 ICO/PNG</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">版权与备案</h3>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">ICP 备案号</label>
            <Input v-model="site.icp" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">版权信息</label>
            <Input v-model="site.copyright" />
          </div>
        </div>
      </Card>
    </div>

    <!-- 登录认证 -->
    <div v-if="activeTab === 'login'" class="space-y-4">
      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">登录方式</h3>
        <div class="space-y-3">
          <label class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
              <div class="text-sm font-medium text-slate-700">账号密码登录</div>
              <div class="text-xs text-slate-500 mt-0.5">用户使用邮箱/手机号 + 密码登录</div>
            </div>
            <input type="checkbox" v-model="login.enableAccount" class="h-4 w-4 rounded text-blue-600" />
          </label>
          <label class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
              <div class="text-sm font-medium text-slate-700">SSO 单点登录</div>
              <div class="text-xs text-slate-500 mt-0.5">企业 SSO / OAuth 2.0 登录</div>
            </div>
            <input type="checkbox" v-model="login.enableSSO" class="h-4 w-4 rounded text-blue-600" />
          </label>
          <label class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
              <div class="text-sm font-medium text-slate-700">LDAP 认证</div>
              <div class="text-xs text-slate-500 mt-0.5">对接企业 AD/LDAP 域账号</div>
            </div>
            <input type="checkbox" v-model="login.enableLDAP" class="h-4 w-4 rounded text-blue-600" />
          </label>
          <label class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
              <div class="text-sm font-medium text-slate-700">短信验证码登录</div>
              <div class="text-xs text-slate-500 mt-0.5">通过短信验证码进行身份验证</div>
            </div>
            <input type="checkbox" v-model="login.enableSMS" class="h-4 w-4 rounded text-blue-600" />
          </label>
          <label class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
              <div class="text-sm font-medium text-slate-700">二次验证 (2FA)</div>
              <div class="text-xs text-slate-500 mt-0.5">登录时强制输入动态验证码</div>
            </div>
            <input type="checkbox" v-model="login.enable2FA" class="h-4 w-4 rounded text-blue-600" />
          </label>
          <label class="flex items-center justify-between py-2">
            <div>
              <div class="text-sm font-medium text-slate-700">图形验证码</div>
              <div class="text-xs text-slate-500 mt-0.5">防暴力破解,登录时输入图形验证码</div>
            </div>
            <input type="checkbox" v-model="login.enableCaptcha" class="h-4 w-4 rounded text-blue-600" />
          </label>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">会话与密码策略</h3>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">会话超时 (分钟)</label>
            <Input v-model="login.sessionTimeout" type="number" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">密码最小长度</label>
            <Input v-model="login.passwordMinLength" type="number" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">密码复杂度</label>
            <select v-model="login.passwordComplexity" class="w-full h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-blue-500">
              <option value="low">低 (字母+数字)</option>
              <option value="medium">中 (大小写+数字)</option>
              <option value="high">高 (大小写+数字+特殊字符)</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">SSO 接入地址</label>
            <Input v-model="login.ssoUrl" />
          </div>
        </div>
      </Card>
    </div>

    <!-- 消息通知 -->
    <div v-if="activeTab === 'notify'" class="space-y-4">
      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">通知渠道</h3>
        <div class="grid grid-cols-2 gap-3">
          <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-blue-300">
            <input type="checkbox" v-model="notify.enableEmail" class="h-4 w-4 rounded text-blue-600" />
            <div>
              <div class="text-sm font-medium text-slate-700">邮件通知</div>
              <div class="text-xs text-slate-500">SMTP 协议发送邮件</div>
            </div>
          </label>
          <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-blue-300">
            <input type="checkbox" v-model="notify.enableSMS" class="h-4 w-4 rounded text-blue-600" />
            <div>
              <div class="text-sm font-medium text-slate-700">短信通知</div>
              <div class="text-xs text-slate-500">对接短信平台</div>
            </div>
          </label>
          <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-blue-300">
            <input type="checkbox" v-model="notify.enableIM" class="h-4 w-4 rounded text-blue-600" />
            <div>
              <div class="text-sm font-medium text-slate-700">IM 机器人</div>
              <div class="text-xs text-slate-500">钉钉/飞书/企微</div>
            </div>
          </label>
          <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-blue-300">
            <input type="checkbox" v-model="notify.enableWeb" class="h-4 w-4 rounded text-blue-600" />
            <div>
              <div class="text-sm font-medium text-slate-700">站内信</div>
              <div class="text-xs text-slate-500">站内消息中心</div>
            </div>
          </label>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">邮件服务器</h3>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">SMTP 服务器</label>
            <Input v-model="notify.emailServer" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">端口</label>
            <Input v-model="notify.emailPort" type="number" />
          </div>
          <div class="col-span-2">
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">发件账户</label>
            <Input v-model="notify.emailAccount" />
          </div>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">IM 机器人</h3>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">机器人类型</label>
            <select v-model="notify.imType" class="w-full h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-blue-500">
              <option value="dingtalk">钉钉</option>
              <option value="feishu">飞书</option>
              <option value="wecom">企业微信</option>
              <option value="slack">Slack</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">Webhook</label>
            <Input v-model="notify.imWebhook" />
          </div>
        </div>
      </Card>
    </div>

    <!-- 安全策略 -->
    <div v-if="activeTab === 'security'" class="space-y-4">
      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">安全防护</h3>
        <div class="space-y-3">
          <label class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
              <div class="text-sm font-medium text-slate-700">IP 白名单</div>
              <div class="text-xs text-slate-500 mt-0.5">仅允许指定 IP 段访问</div>
            </div>
            <input type="checkbox" v-model="security.enableIpWhitelist" class="h-4 w-4 rounded text-blue-600" />
          </label>
          <label class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
              <div class="text-sm font-medium text-slate-700">API 限流</div>
              <div class="text-xs text-slate-500 mt-0.5">防止接口被恶意高频调用</div>
            </div>
            <input type="checkbox" v-model="security.enableRateLimit" class="h-4 w-4 rounded text-blue-600" />
          </label>
          <label class="flex items-center justify-between py-2">
            <div>
              <div class="text-sm font-medium text-slate-700">审计日志</div>
              <div class="text-xs text-slate-500 mt-0.5">记录所有敏感操作</div>
            </div>
            <input type="checkbox" v-model="security.enableAudit" class="h-4 w-4 rounded text-blue-600" />
          </label>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">策略详情</h3>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">限流阈值 (次/分钟)</label>
            <Input v-model="security.rateLimit" type="number" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">加密算法</label>
            <select v-model="security.encryption" class="w-full h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-blue-500">
              <option>AES-128</option>
              <option>AES-256</option>
              <option>SM4 (国密)</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">IP 白名单</label>
            <textarea
              v-model="security.ipWhitelist"
              rows="2"
              class="w-full text-sm rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono resize-none"
            />
          </div>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">系统 API 密钥</h3>
        <div class="flex items-center gap-3">
          <div class="flex-1 flex items-center gap-2 px-3 h-10 rounded-md border border-slate-200 bg-slate-50">
            <code class="text-sm font-mono text-slate-700 flex-1">
              {{ security.showApiKey ? security.apiKey : 'sk-aip-••••••••••••••••••••' }}
            </code>
            <button class="text-slate-400 hover:text-slate-600" @click="security.showApiKey = !security.showApiKey">
              <component :is="security.showApiKey ? EyeOff : Eye" class="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" @click="regenerateKey">
            <RefreshCw class="h-3.5 w-3.5 mr-1" />
            重新生成
          </Button>
        </div>
        <p class="text-xs text-slate-500 mt-2">⚠️ 请妥善保管,密钥泄露可能导致系统被攻击</p>
      </Card>
    </div>

    <!-- 外观主题 -->
    <div v-if="activeTab === 'appearance'" class="space-y-4">
      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">主题模式</h3>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="t in themes"
            :key="t.id"
            :class="[
              'p-4 rounded-lg border-2 transition-all text-left',
              appearance.theme === t.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300',
            ]"
            @click="appearance.theme = t.id"
          >
            <div class="h-16 w-full rounded-md mb-2 border border-slate-200" :style="{ background: t.color }" />
            <div class="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              {{ t.name }}
              <Check v-if="appearance.theme === t.id" class="h-3.5 w-3.5 text-blue-600" />
            </div>
          </button>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">主色调</h3>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">主色</label>
            <div class="flex items-center gap-2">
              <input type="color" v-model="appearance.primary" class="h-10 w-12 rounded cursor-pointer" />
              <Input v-model="appearance.primary" class="flex-1" />
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-600 mb-1.5 block">强调色</label>
            <div class="flex items-center gap-2">
              <input type="color" v-model="appearance.accent" class="h-10 w-12 rounded cursor-pointer" />
              <Input v-model="appearance.accent" class="flex-1" />
            </div>
          </div>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">布局密度</h3>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="d in densities"
            :key="d.id"
            :class="[
              'p-4 rounded-lg border-2 transition-all text-left',
              appearance.density === d.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300',
            ]"
            @click="appearance.density = d.id"
          >
            <div class="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              {{ d.name }}
              <Check v-if="appearance.density === d.id" class="h-3.5 w-3.5 text-blue-600" />
            </div>
            <p class="text-xs text-slate-500 mt-1">{{ d.desc }}</p>
          </button>
        </div>
      </Card>

      <Card class-name="p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">交互选项</h3>
        <div class="space-y-3">
          <label class="flex items-center justify-between">
            <span class="text-sm text-slate-700">启用动画效果</span>
            <input type="checkbox" v-model="appearance.enableAnimation" class="h-4 w-4 rounded text-blue-600" />
          </label>
          <label class="flex items-center justify-between">
            <span class="text-sm text-slate-700">支持暗黑模式</span>
            <input type="checkbox" v-model="appearance.enableDark" class="h-4 w-4 rounded text-blue-600" />
          </label>
        </div>
      </Card>
    </div>
  </div>
</template>
