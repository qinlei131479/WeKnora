import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi"
import type { RecUserQueryParams, RecUser, AjaxResult, TableDataInfo } from '@/types'
const SERVER_NAME = '/work-order';

// 查询用户列表
export function listUser(query: RecUserQueryParams): Promise<TableDataInfo<RecUser[]>> {
  return request({
    url: `${SERVER_NAME}/epgUser/list`,
    method: 'get',
    params: query
  })
}

// 查询用户详细
export function getUser(userId?: number|string): Promise<AjaxResult<RecUser>> {
  return request({
    url: `${SERVER_NAME}/epgUser/single?id=${parseStrEmpty(userId)}`,
    method: 'get'
  })
}

// 新增用户
export function addUser(data: RecUser): Promise<AjaxResult<RecUser>> {
  return request({
    url: `${SERVER_NAME}/epgUser`,
    method: 'post',
    data: data
  })
}

// 修改用户
export function updateUser(data: RecUser): Promise<AjaxResult<RecUser>> {
  return request({
    url: `${SERVER_NAME}/epgUser`,
    method: 'put',
    data: data
  })
}

// 删除用户
export function delUser(userId: number | number[]): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/epgUser?id=${parseStrEmpty(userId)}`,
    method: 'delete'
  })
}
// 检查登录账号唯一
export function checkUserNameValue(params: any) {
  return request({
    url: `${SERVER_NAME}/epgUser/checkUserName`,
    method: 'post',
    data: params
  })
}