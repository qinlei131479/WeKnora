import request from "@/utils/request";
import qs from 'qs';
const API = "/business/aiDialogRecords";
var isDev = true;

// 列表
export function queryTable(data,pageInfo) {
  return request({
      url: `${API}/list?${qs.stringify(pageInfo)}`,
      method: "post",
      data: data,
  });
}

// 批量删除
export function batchDelete(params) {
  return request({
    url: `${API}/batchDelete`,
    method: "post",
    data: params,
  })
}

// 日志详情
export function getSessionLogDetail(remindId) {
  return request({
    url: `${API}/detail?id=${remindId}`,
    method: "get",
  });
}

// 话题类别
export function getThemeTypeList() {
  return request({
    url: `${API}/`,
    method: "get",
  });
}

// 话题类别
export function getFeedbackTypeList() {
  return request({
    url: `${API}/`,
    method: "get",
  });
}
// 按id查询对话
export function getAiDialogRecordsDetail(id) {
  return request({
    url: `/business/aiDialogRecords/single?id=${id}`,
    method: "get",
  });
}
// 按id查询
export function getAiDialogRecordsHistory(params) {
  return request({
    url: `/business/aiDialogRecords/listByHistory`,
    method: "post",
    data: params,
  });
}