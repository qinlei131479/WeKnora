// 知识库搜索
import request from "@/utils/request";
import qs from "qs";
// 知识库搜素-查询搜索记录
export function searchRecord(params) {
    return request({
        url: "/business/agiKnowledgeSearch/searchRecord",
        method: "get",
        params: params
    });
}
// 知识库搜素-搜索
export function listSearch(query, pageInfo) {
    return request({
        url: `/business/agiKnowledgeSearch/search?${qs.stringify(pageInfo)}`,
        method: "post",
        data: query,
    });
}