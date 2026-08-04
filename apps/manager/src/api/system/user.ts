import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi"
import { Rsa } from '@/utils/rsa'
import type { UserQueryParams, UserFormDataResult, UserProfileResult, UserAuthRoleResult, UserProfileAvatarResult, SysUser, SysUserRole, SysUserRoles, AjaxResult, TableDataInfo, TreeSelect } from '@/types'

// 查询用户列表
export function listUser(query: UserQueryParams): Promise<TableDataInfo<SysUser>> {
  return request({
    url: '/system/user/list',
    method: 'get',
    params: query
  })
}

// 查询用户详细
export function getUser(userId?: number): Promise<UserFormDataResult> {
  return request({
    url: '/system/user/' + parseStrEmpty(userId),
    method: 'get'
  })
}

// 新增用户
export function addUser(data: SysUser): Promise<AjaxResult> {
  if (data?.password) {
    const rsa = new Rsa();
    data.password = rsa.encryptWithRSA(data.password) as string;
  }
  return request({
    url: '/system/user',
    method: 'post',
    data: data
  })
}

// 修改用户
export function updateUser(data: SysUser): Promise<AjaxResult> {
  return request({
    url: '/system/user',
    method: 'put',
    data: data
  })
}

// 删除用户
export function delUser(userId: number | number[]): Promise<AjaxResult> {
  return request({
    url: '/system/user/' + userId,
    method: 'delete'
  })
}

// 用户密码重置
export function resetUserPwd(userId: number, password: string): Promise<AjaxResult> {
  if (password) {
    const rsa = new Rsa();
    password = rsa.encryptWithRSA(password) as string;
  }
  const data = {
    userId,
    password
  }
  return request({
    url: '/system/user/resetPwd',
    method: 'put',
    data: data
  })
}

// 用户状态修改
export function changeUserStatus(userId: number, status: string): Promise<AjaxResult> {
  const data = {
    userId,
    status
  }
  return request({
    url: '/system/user/changeStatus',
    method: 'put',
    data: data
  })
}

// 查询用户个人信息
export function getUserProfile(): Promise<UserProfileResult> {
  return request({
    url: '/system/user/profile',
    method: 'get'
  })
}

// 修改用户个人信息
export function updateUserProfile(data: SysUser): Promise<AjaxResult> {
  return request({
    url: '/system/user/profile',
    method: 'put',
    data: data
  })
}

// 用户密码重置
export function updateUserPwd(oldPassword: string, newPassword: string): Promise<AjaxResult> {
  const rsa = new Rsa();
  if (oldPassword) {
    oldPassword = rsa.encryptWithRSA(oldPassword) as string;
  }
  if (newPassword) {
    newPassword = rsa.encryptWithRSA(newPassword) as string;
  }
  const data = {
    oldPassword,
    newPassword
  }
  return request({
    url: '/system/user/profile/updatePwd',
    method: 'put',
    data: data
  })
}

// 用户头像上传
export function uploadAvatar(file: FormData | File): Promise<UserProfileAvatarResult> {
  return request({
    url: '/system/user/profile/avatar',
    // url: '/file/upload',
    method: 'post',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: file
  })
}

// 查询授权角色
export function getAuthRole(userId: number): Promise<UserAuthRoleResult> {
  return request({
    url: '/system/user/authRole/' + userId,
    method: 'get'
  })
}

// 保存授权角色
export function updateAuthRole(data: SysUserRoles): Promise<AjaxResult> {
  return request({
    url: '/system/user/authRole',
    method: 'put',
    params: data
  })
}

// 查询部门下拉树结构
export function deptTreeSelect(): Promise<AjaxResult<TreeSelect>> {
  return request({
    url: '/system/user/deptTree',
    method: 'get'
  })
}

// 检查登录账号唯一
export function checkUserNameValue(params: any) {
  return request({
    url: '/system/user/checkUserName',
    method: 'post',
    data: params
  })
}

// 检查登录账号唯一
export function checkPasswordValue(params: any) {
  return request({
    url: '/system/user/checkPassword',
    method: 'post',
    data: params
  })
}
// 绑定二维码
export function bindQrCode(id: string|number) {
  return request({
    url: '/auth/qrCode/bind?otherUserId='+id,
    method: 'get'
  })
}
//解除绑定
export function unbindQrCode() {
  return request({
    url: '/auth/qrCode/unbind',
    method: 'get'
  })
}
//绑定状态
export function getBindStatus() {
  return request({
    url: '/auth/qrCode/getBindStatus',
    method: 'get'
  })
}