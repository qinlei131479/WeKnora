import { t } from '@/i18n';
import router from '@/router'
import { ElMessageBox } from 'element-plus'
import { login, logout, getInfo } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { isEmpty } from "@/utils/validate"
import useLockStore from '@/store/modules/lock'
import defAva from '@/assets/images/profile.jpg'
import cache from '@/plugins/cache'
import { LoginInfoResult } from '@/types'
import { resolveStaticPath } from "@/utils";

interface UserState {
  token: string | undefined
  id: string | number
  name: string
  nickName: string
  avatar: string
  avatarTop: string
  roles: string[]
  permissions: string[]
  isPlatformTenant: boolean
}

const useUserStore = defineStore(
  'user',
  {
    state: (): UserState => ({
      token: getToken(),
      id: '',
      name: '',
      nickName: '',
      avatar: '',
      avatarTop: '',
      roles: [],
      permissions: [],
      isPlatformTenant: false
    }),
    actions: {
      // 登录
      login(userInfo: { username: string; password: string; code: string; uuid: string }) {
        const username = userInfo.username.trim()
        const password = userInfo.password
        const code = userInfo.code
        const uuid = userInfo.uuid
        return new Promise<LoginInfoResult>((resolve, reject) => {
          login(username, password, code, uuid).then(res => {
            let data = res.data || res || {};
            setToken(data.access_token)
            this.token = data.access_token
            useLockStore().unlockScreen()
            resolve(res)
          }).catch(error => {
            reject(error)
          })
        })
      },
      // 获取用户信息
      getInfo() {
        return new Promise((resolve, reject) => {
          getInfo().then(res => {
            res = res.data || res || {};
            const user = res.user
            const avatar = (isEmpty(user.avatar)) ? defAva : resolveStaticPath(user.avatar)
            
            cache.session.setJSON('userInfo', res)
            cache.session.setJSON('tenantId', user.tenantId)

            if (res.roles && res.roles.length > 0) { // 验证返回的roles是否是一个非空数组
              this.roles = res.roles
              this.permissions = res.permissions
            } else {
              this.roles = ['ROLE_DEFAULT']
            }
            this.id = user.userId || ''
            this.name = user.userName || ''
            this.nickName = user.nickName || ''
            this.avatar = avatar
            this.avatarTop = avatar;
            this.isPlatformTenant = user.tenantId === 1 ? true : false;
            /* 初始密码提示 */
            if(res.isDefaultModifyPwd) {
              ElMessageBox.confirm(t('common.user.youAreStillUsingYourInitialPasswordPleaseChangeIt', '您的密码还是初始密码，请修改密码！'),  t('component.loginFailureDialog.securityNotice', '安全提示'), {  confirmButtonText: t('component.kJSCCmpt.confirm', '确定'),  cancelButtonText: t('page.normal.cancel', '取消'),  type: 'warning' }).then(() => {
                router.push({ name: 'Profile', params: { activeTab: 'resetPwd' } })
              }).catch(() => {})
            }
            /* 过期密码提示 */
            if(!res.isDefaultModifyPwd && res.isPasswordExpired) {
              ElMessageBox.confirm(t('common.user.yourPasswordHasExpiredPleaseChangeItAsSoonAs', '您的密码已过期，请尽快修改密码！'),  t('component.loginFailureDialog.securityNotice', '安全提示'), {  confirmButtonText: t('component.kJSCCmpt.confirm', '确定'),  cancelButtonText: t('page.normal.cancel', '取消'),  type: 'warning' }).then(() => {
                router.push({ name: 'Profile', params: { activeTab: 'resetPwd' } })
              }).catch(() => {})
            }
            resolve(res)
          }).catch(error => {
            reject(error)
          })
        })
      },
      // 退出系统
      logOut() {
        return new Promise<void>((resolve, reject) => {
          logout().then(() => {
            this.token = ''
            this.roles = []
            this.permissions = []
            this.isPlatformTenant = false;
            removeToken()
            resolve()
          }).catch((error: any) => {
            reject(error)
          })
        })
      }
    }
  })

export default useUserStore
