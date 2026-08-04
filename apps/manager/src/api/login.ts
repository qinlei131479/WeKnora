import request from '@/utils/request'
import type { SysRegister, LoginInfoResult, UserInfoResult, CaptchaInfoResult, AjaxResult } from '@/types'
import { Rsa } from '@/utils/rsa'

// 登录方法
export function login(username: string, password: string, code: string, uuid: string): Promise<LoginInfoResult> {
  const rsa = new Rsa();
  password = rsa.encryptWithRSA(password) as string;
  return request({
    url: '/auth/login',
    headers: {
      isToken: false,
      repeatSubmit: false
    },
    method: 'post',
    data: { username, password, code, uuid }
  })
}
// 检验登录
export function checkLogin(username: string, password: string, code: string, uuid: string): Promise<AjaxResult> {
  const rsa = new Rsa();
  password = rsa.encryptWithRSA(password) as string;
  return request({
    url: '/auth/checkLogin',
    headers: {
      isToken: false
    },
    method: 'post',
    data: { username, password, code, uuid }
  })
}
// 注册方法
export function register(data: SysRegister): Promise<AjaxResult> {
  return request({
    url: '/auth/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 刷新方法
export function refreshToken(): Promise<AjaxResult> {
  return request({
    url: '/auth/refresh',
    method: 'post'
  })
}

// 获取用户详细信息
export function getInfo(): Promise<UserInfoResult> {
  return request({
    url: '/system/user/getInfo',
    method: 'get'
  })
}

// 解锁屏幕
export function unlockScreen(password: string) {
  return request({
    url: '/auth/unlockscreen',
    method: 'post',
    data: { password }
  })
}

// 退出方法
export function logout(): Promise<AjaxResult> {
  return request({
    url: '/auth/logout',
    method: 'delete'
  })
}

// 获取验证码
export function getCodeImg(): Promise<CaptchaInfoResult> {
  return request({
    url: '/code',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}

// 获取验证码
export function getQrCode() {
  return request({
    url: '/auth/qrCode/get',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}