<template>
  <div class="right-menu">
    <template v-if="appStore.device !== 'mobile'">
      <!-- <el-tooltip content="源码地址" effect="dark" placement="bottom">
        <ruo-yi-git id="ruoyi-git" class="right-menu-item hover-effect" />
      </el-tooltip>

      <el-tooltip content="文档地址" effect="dark" placement="bottom">
        <ruo-yi-doc id="ruoyi-doc" class="right-menu-item hover-effect" />
      </el-tooltip> -->

      <!-- <Screenfull id="screenfull" class="right-menu-item hover-effect" /> -->

      <!-- <el-tooltip content="主题模式" effect="dark" placement="bottom">
        <div class="right-menu-item hover-effect theme-switch-wrapper" @click="toggleTheme">
          <svg-icon v-if="settingsStore.isDark" icon-class="sunny" />
          <svg-icon v-if="!settingsStore.isDark" icon-class="moon" />
        </div>
      </el-tooltip>

      <el-tooltip content="布局大小" effect="dark" placement="bottom">
        <size-select id="size-select" class="right-menu-item hover-effect" />
      </el-tooltip>

      <el-tooltip content="消息通知" effect="dark" placement="bottom">
        <header-notice id="header-notice" class="right-menu-item hover-effect" />
      </el-tooltip> -->
    </template>

    <el-dropdown @command="handleCommand" class="avatar-container right-menu-item hover-effect" trigger="hover">
      <div class="avatar-wrapper">
        <img :src="userStore.avatar" class="user-avatar" />
        <!-- <span class="user-nickname"> {{ userStore.nickName }} </span> -->
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <router-link to="/user/profile">
            <el-dropdown-item>个人中心</el-dropdown-item>
          </router-link>
          <!-- <el-dropdown-item command="setLayout" v-if="settingsStore.showSettings">
              <span>布局设置</span>
          </el-dropdown-item>
          <el-dropdown-item command="lockScreen">
              <span>锁定屏幕</span>
          </el-dropdown-item> -->
          <el-dropdown-item divided command="logout">
            <span>退出登录</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>
<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
// import Screenfull from '@/components/Screenfull/index.vue'
// import SizeSelect from '@/components/SizeSelect/index.vue'
// import RuoYiGit from '@/components/RuoYi/Git/index.vue'
// import RuoYiDoc from '@/components/RuoYi/Doc/index.vue'
import useAppStore from '@/store/modules/app'
import useUserStore from '@/store/modules/user'
import useLockStore from '@/store/modules/lock'
// import useSettingsStore from '@/store/modules/settings'
// import HeaderNotice from './HeaderNotice'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const lockStore = useLockStore()
// const settingsStore = useSettingsStore()

function handleCommand(command: string): void {
  switch (command) {
    case "setLayout":
      setLayout()
      break
    case "lockScreen":
      lockScreen()
      break
    case "logout":
      logout()
      break
    default:
      break
  }
}

function logout(): void {
  ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logOut().then(() => {
      location.href = '/'
    })
  }).catch(() => { })
}

const emits = defineEmits(['setLayout'])
function setLayout(): void {
  emits('setLayout')
}

function lockScreen() {
  const currentPath = route.fullPath
  lockStore.lockScreen(currentPath)
  router.push('/lock')
}

// async function toggleTheme(event?: MouseEvent): Promise<void> {
//   const x = event?.clientX || window.innerWidth / 2
//   const y = event?.clientY || window.innerHeight / 2
//   const wasDark = settingsStore.isDark

//   const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
//   const isSupported = typeof (document as any).startViewTransition === 'function' && !isReducedMotion

//   if (!isSupported) {
//     settingsStore.toggleTheme()
//     return
//   }

//   try {
//     const transition = document.startViewTransition(async () => {
//       await new Promise((resolve) => setTimeout(resolve, 10))
//       settingsStore.toggleTheme()
//       await nextTick()
//     })
//     await transition.ready

//     const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
//     const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
//     document.documentElement.animate(
//       {
//         clipPath: !wasDark ? [...clipPath].reverse() : clipPath
//       }, {
//       duration: 650,
//       easing: "cubic-bezier(0.4, 0, 0.2, 1)",
//       fill: "forwards",
//       pseudoElement: !wasDark ? "::view-transition-old(root)" : "::view-transition-new(root)"
//     }
//     )
//     await transition.finished
//   } catch (error) {
//     console.warn("View transition failed, falling back to immediate toggle:", error)
//     settingsStore.toggleTheme()
//   }
// }
</script>
<style lang="scss" scoped>
.right-menu {
  height: 100%;
  line-height: var(--navbar-height, 96px);
  display: flex;
  align-items: center;
  flex-shrink: 0;

  &:focus {
    outline: none;
  }

  .right-menu-item {
    display: inline-block;
    padding: 0 8px;
    height: 100%;
    font-size: 18px;
    color: #5a5e66;
    vertical-align: text-bottom;

    &.hover-effect {
      cursor: pointer;
      transition: background 0.3s;

      &:hover {
        background: rgba(0, 0, 0, 0.025);
      }
    }

    &.theme-switch-wrapper {
      display: flex;
      align-items: center;

      svg {
        transition: transform 0.3s;

        &:hover {
          transform: scale(1.15);
        }
      }
    }
  }

  .avatar-container {
    margin-right: 0;
    padding-right: 0;
    flex-shrink: 0;

    .avatar-wrapper {
      margin-top: 0;
      position: relative;
      display: flex;
      align-items: center;
      height: var(--navbar-height, 96px);

      .user-avatar {
        cursor: pointer;
        width: 48px;
        height: 48px;
        margin-right: 8px;
        border-radius: 50%;
      }

      .user-nickname {
        position: relative;
        // left: 0px;
        // bottom: 10px;
        font-size: 14px;
        font-weight: bold;
      }

      i {
        cursor: pointer;
        position: absolute;
        right: -20px;
        top: 25px;
        font-size: 12px;
      }
    }
  }
}
</style>