import request from "@/utils/request";
import qs from 'qs';
const API = "/business/ragFileManagementRecyle";
var isDev = true;

// 列表
export function listRecycle(knowledgeId,data,pageInfo,sortInfo) {
    return request({
        url: `${API}/list/${knowledgeId}?${qs.stringify(pageInfo)}&${qs.stringify(data)}&${qs.stringify(sortInfo)}`,
        method: "get",
        params: {},
    });
}

// 批量删除
export function batchDelete(knowledgeId,ids) {
    return request({
        url: `${API}/batchDelete/${knowledgeId}`,
        method: "post",
        data: ids,
    })
}

// 批量还原
export function batchRestore(knowledgeId,ids) {
    return request({
        url: `${API}/batchRestore/${knowledgeId}`,
        method: "post",
        data: ids,
    })
}

// 清空
export function clearRecycle(knowledgeId) {
    return request({
        url: `${API}/clear/${knowledgeId}`,
        method: "post"
    })
}