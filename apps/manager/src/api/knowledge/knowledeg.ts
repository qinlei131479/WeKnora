import request from '@/utils/request'
import type { AjaxResult } from '@/types'
export function getAllKnowledgeApi(): Promise<AjaxResult> {
  return request({
    url: '/knowledge/knowledge/all',
    method: 'get'
  })
}

export function queryKnowledgeAndFilesApi(searchValue: string): Promise<AjaxResult> {
  return request({
    url: `/knowledge/knowledge/query?search=${searchValue}`,
    method: 'get'
  })
}