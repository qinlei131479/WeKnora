import request from "@/utils/request";
import qs from "qs";

const API = "/business/agiKnowledge";
const API_FILE = "/business/agiKnowledgeFile";
const API_CHECK_TASK = "/business/repeatContentCheckTask";

const isDev = false;

export const exportUrl = `${API}/export`
export const uploadFileUrl = `/business/agiKnowledgeFileTask/upload`
export const batchDownloadUrl = `${API_FILE}/batch/download/`

export const FileStatus = {
  NONE: 0,
  TRANSFORM: 1, // 转换Markdown完成
  RAGFLOW_UPLOAD: 2, // Ragflow上传成功
  PARSE_SUCCESS: 3, // 解析成功
  FAILED: 4, // 解析失败
}

// 获取知识库权限列表
export function queryKnowledgeAuthList(query) {
  return request({
    url: `${API}/purview/list`,
    method: 'get',
    params: query
  })
}

// 提交设置知识库权限
export function postKnowledgeAuth(data) {
  return request({
    url: `${API}/purview/insert/single`,
    method: 'post',
    data: data
  })
}

// 移除知识库成员权限
export function removeKnowledgeAuth(data) {
  return request({
    url: `${API}/purview/remove`,
    method: 'get',
    params: data
  })
}

// 移除知识库成员权限
export function updateKnowledgeAuth(data) {
  return request({
    url: `${API}/purview/update/single`,
    method: 'get',
    params: data
  })
}

// 新建子文件夹
export function addFolder(data) {
  return request({
    url: `${API_FILE}/folder/insert`,
    method: "post",
    data: data,
  });
}
// 列表
export function listLibApi(data, pageInfo, sortInfo) {
  const params = {
    ...pageInfo,
    ...sortInfo,
    ...data,
  };
  return request({
    // url: `${API}/list?${qs.stringify(pageInfo)}&${qs.stringify(sortInfo)}`,
    url: `${API}/list`,
    method: "get",
    params: params,
  });
}

// 新增
export function addLibApi(data) {
  return request({
    url: `${API}/insert/single`,
    method: "post",
    data: data,
  });
}

// 修改
export function updateLibApi(data) {
  return request({
    url: `${API}/update/single`,
    method: "post",
    data: data,
  });
}

// 删除
export function delLibApi(id) {
  if (isDev) {
    return {
      code: 200,
      data: {},
      msg: "",
    };
  } else {
    return request({
      url: `${API}/delete/single?id=${id}`,
      method: "get",
    });
  }
}

// 查询详细
export function getLibApi(id) {
  return request({
    url: `${API}/single?id=${id}`,
    method: "get",
  });
}

// 查询是否需要文件提示
export function getFileConfig() {
  return request({
    url: `${API}/file/config`,
    method: "post",
  });
}
// 列表
export function listLibFileList(params) {
  return request({
    // url: `${API_FILE}/fileListByCode?knowledgeId=${knowledgeId}&code=${code}&fileCode=${fileCode}&${qs.stringify(
    //   pageInfo
    // )}`,
    url: `${API_FILE}/fileListByCode`,
    method: "get",
    params: params,
  });
}
export function querySearchTreeList(knowledgeId, keyWord) {
  return request({
    url: `${API_FILE}/searchTree?knowledgeId=${knowledgeId}&keyWord=${keyWord}`,
    method: "get",
  });
}
export function listLibFileApi(knowledgeId) {
  if (isDev) {
    return Promise.resolve({
      code: 200,
      msg: "success",
      pages: 0,
      data: [
        {
          admin: 0,
          birthday: "333",
          boss: 0,
          city: "",
          contractExpireDate: "",
          createBy: "",
          createTime: "",
          delFlag: 0,
          email: "",
          hiredDate: "111",
          id: 1,
          jobNumber: "",
          mobile: "",
          name: "李芮",
          orgEmail: "",
          otherId: "",
          regularDate: "222",
          senior: 0,
          unionId: "",
          updateBy: "",
          updateTime: "",
          userId: "",
        },
        {
          admin: 0,
          birthday: "",
          boss: 0,
          city: "",
          contractExpireDate: "",
          createBy: "",
          createTime: "",
          delFlag: 0,
          email: "",
          hiredDate: "",
          id: 2,
          jobNumber: "",
          mobile: "",
          name: "黄黎",
          orgEmail: "",
          otherId: "",
          regularDate: "",
          senior: 0,
          unionId: "",
          updateBy: "",
          updateTime: "",
          userId: "",
        },
      ],
      total: 0,
    });
  } else {
    return request({
      url: `${API_FILE}/fileTree?id=${knowledgeId}`,
      method: "get",
    });
  }
}
// 删除
export function delLibFileApi(id) {
  return request({
    url: `${API_FILE}/delete/single?id=${id}`,
    method: "post",
    // params: { id }
  });
}
// 文件-文件夹批量删除
export function delBatchLibFileApi(id, params) {
  return request({
    url: `${API_FILE}/batch/delete/${id}`,
    method: "post",
    data: params,
  });
}
// 重命名
export function renameFileApi(params) {
  return request({
    url: `${API_FILE}/update/single`,
    method: "post",
    data: params,
  });
}
// 文件夹树查询
export function queryFileTree(knowledgeId) {
  // return {
  //   "code": 200,
  //   "data": [{
  //       "children": [
  //         {
  //           "children": [{
  //             "code": "1-1-1",
  //             "createBy": "",
  //             "createTime": "",
  //             "deleteTime": "",
  //             "fileName": "测试1的子集的子集",
  //             "filePath": "",
  //             "fileType": 0,
  //             "id": 0,
  //             "knowledgeId": 0,
  //             "message": "",
  //             "parentCode": "",
  //             "status": 0,
  //             "statusName": "",
  //             "updateBy": "",
  //             "updateTime": "",
  //             "uploadRagStatus": 0
  //             }],
  //           "code": "1-1",
  //           "createBy": "",
  //           "createTime": "",
  //           "deleteTime": "",
  //           "fileName": "测试1的子集",
  //           "filePath": "",
  //           "fileType": 0,
  //           "id": 0,
  //           "knowledgeId": 0,
  //           "message": "",
  //           "parentCode": "",
  //           "status": 0,
  //           "statusName": "",
  //           "updateBy": "",
  //           "updateTime": "",
  //           "uploadRagStatus": 0
  //         }
  //       ],
  //       "code": "1",
  //       "createBy": "",
  //       "createTime": "",
  //       "deleteTime": "",
  //       "fileName": "测试1",
  //       "filePath": "",
  //       "fileType": 0,
  //       "id": 0,
  //       "knowledgeId": 0,
  //       "message": "",
  //       "parentCode": "",
  //       "status": 0,
  //       "statusName": "",
  //       "updateBy": "",
  //       "updateTime": "",
  //       "uploadRagStatus": 0
  //     },{
  //       "children": [
  //         {
  //           "children": [],
  //           "code": "2-1",
  //           "createBy": "",
  //           "createTime": "",
  //           "deleteTime": "",
  //           "fileName": "测试2的子集",
  //           "filePath": "",
  //           "fileType": 0,
  //           "id": 0,
  //           "knowledgeId": 0,
  //           "message": "",
  //           "parentCode": "",
  //           "status": 0,
  //           "statusName": "",
  //           "updateBy": "",
  //           "updateTime": "",
  //           "uploadRagStatus": 0
  //         }
  //       ],
  //       "code": "2",
  //       "createBy": "",
  //       "createTime": "",
  //       "deleteTime": "",
  //       "fileName": "测试2",
  //       "filePath": "",
  //       "fileType": 0,
  //       "id": 0,
  //       "knowledgeId": 0,
  //       "message": "",
  //       "parentCode": "",
  //       "status": 0,
  //       "statusName": "",
  //       "updateBy": "",
  //       "updateTime": "",
  //       "uploadRagStatus": 0
  //     },{
  //       "children": [
  //         {
  //           "children": [],
  //           "code": "3-1",
  //           "createBy": "",
  //           "createTime": "",
  //           "deleteTime": "",
  //           "fileName": "测试3的子集",
  //           "filePath": "",
  //           "fileType": 0,
  //           "id": 0,
  //           "knowledgeId": 0,
  //           "message": "",
  //           "parentCode": "",
  //           "status": 0,
  //           "statusName": "",
  //           "updateBy": "",
  //           "updateTime": "",
  //           "uploadRagStatus": 0
  //         }
  //       ],
  //       "code": "3",
  //       "createBy": "",
  //       "createTime": "",
  //       "deleteTime": "",
  //       "fileName": "测试3",
  //       "filePath": "",
  //       "fileType": 0,
  //       "id": 0,
  //       "knowledgeId": 0,
  //       "message": "",
  //       "parentCode": "",
  //       "status": 0,
  //       "statusName": "",
  //       "updateBy": "",
  //       "updateTime": "",
  //       "uploadRagStatus": 0
  //     },{
  //       "children": [
  //         {
  //           "children": [],
  //           "code": "4-1",
  //           "createBy": "",
  //           "createTime": "",
  //           "deleteTime": "",
  //           "fileName": "测试4的子集",
  //           "filePath": "",
  //           "fileType": 0,
  //           "id": 0,
  //           "knowledgeId": 0,
  //           "message": "",
  //           "parentCode": "",
  //           "status": 0,
  //           "statusName": "",
  //           "updateBy": "",
  //           "updateTime": "",
  //           "uploadRagStatus": 0
  //         }
  //       ],
  //       "code": "4",
  //       "createBy": "",
  //       "createTime": "",
  //       "deleteTime": "",
  //       "fileName": "测试4",
  //       "filePath": "",
  //       "fileType": 0,
  //       "id": 0,
  //       "knowledgeId": 0,
  //       "message": "",
  //       "parentCode": "",
  //       "status": 0,
  //       "statusName": "",
  //       "updateBy": "",
  //       "updateTime": "",
  //       "uploadRagStatus": 0
  //     },{
  //       "children": [
  //         {
  //           "children": [],
  //           "code": "5-1",
  //           "createBy": "",
  //           "createTime": "",
  //           "deleteTime": "",
  //           "fileName": "测试5的子集",
  //           "filePath": "",
  //           "fileType": 0,
  //           "id": 0,
  //           "knowledgeId": 0,
  //           "message": "",
  //           "parentCode": "",
  //           "status": 0,
  //           "statusName": "",
  //           "updateBy": "",
  //           "updateTime": "",
  //           "uploadRagStatus": 0
  //         }
  //       ],
  //       "code": "5",
  //       "createBy": "",
  //       "createTime": "",
  //       "deleteTime": "",
  //       "fileName": "测试5",
  //       "filePath": "",
  //       "fileType": 0,
  //       "id": 0,
  //       "knowledgeId": 0,
  //       "message": "",
  //       "parentCode": "",
  //       "status": 0,
  //       "statusName": "",
  //       "updateBy": "",
  //       "updateTime": "",
  //       "uploadRagStatus": 0
  //     }],
  //   "msg": ""
  // }
  return request({
    url: `${API_FILE}/fileTree?knowledgeId=${knowledgeId}`,
    method: "get",
  });
}
// 成员列表
export function listMemberApi(data, pageInfo, sortInfo) {
  const url = data.knowledgeId ? `${API}/userList` : `${API_FILE}/userList`;
  return request({
    // url: `${url}?${qs.stringify(pageInfo)}&${qs.stringify(sortInfo)}`,
    url: url,
    method: "get",
    params: data,
  });
}

// 成员删除
export function delMemberApi(params) {
  if (isDev) {
    return Promise.resolve({});
  }
  const api = params.knowledgeId
    ? `${API}/userRemove`
    : `${API_FILE}/userRemove`;
  return request({
    url: api,
    method: "post",
    data: params,
  });
}
// 添加成员
export function addMemberApi(params) {
  if (isDev) {
    return Promise.resolve({
      code: 200,
    });
  }
  const api = params.knowledgeId ? `${API}/userAdd` : `${API_FILE}/userAdd`;
  return request({
    url: api,
    method: "post",
    data: params,
  });
}
// 更新成员权限
export function updateMemberRoleApi(params) {
  if (isDev) {
    return Promise.resolve({
      code: 200,
    });
  }
  // return request({
  //   url: `${API}/member/updaterole`,
  //   method: "post",
  //   data: params
  // });
  return addMemberApi(params);
}

// 知识库设置
export function saveLibBaseInfoApi(params) {
  return updateLibApi(params);
}
export function saveLibVisibleApi(params) {
  return updateLibApi(params);
}
export function ragKnowledgeFileTree(userId) {
  return request({
    url: `/business/ragKnowledge/fileTree?userId=${userId}`,
    method: "get",
  });
}

export function userSelect(keyword) {
  return request({
    url: `/system/user/select?keyword=${keyword}`,
    method: "get",
  });
}
// 知识库置顶
export function ragKnowledgeTop(id) {
  return request({
    url: `/business/ragKnowledge/top?id=${id}`,
    method: "post",
  });
}
// 取消知识库置顶
export function ragKnowledgeCancelTop(id) {
  return request({
    url: `/business/ragKnowledge/top/cancel?id=${id}`,
    method: "post",
  });
}
// 文件上传任务创建
export function createUploadTask(params) {
  return request({
    url: `/business/agiKnowledgeFileTask/create-upload-task`,
    method: "post",
    data: params,
  });
  // return {
  //   "code": 200,
  //   "data": {},
  //   "msg": ""
  // }
}
// 断点文件上传
export function breakpointUpload(params) {
  return request({
    url: `/business/agiKnowledgeFileTask/breakpoint-upload`,
    method: "post",
    data: params,
    headers: {
      'Content-Type': 'multipart/form-data',
      repeatSubmit: false,
    }
  });
  // return Promise.resolve({
  //   code: 200,
  //   date:{
  //     id:0
  //   }
  // })
}
// 合并， 上传完成之后合并
export function uploadTaskMerge(params) {
  return request({
    url: `/business/agiKnowledgeFileTask/merge`,
    method: "post",
    data: params,
  });
  // return Promise.resolve({
  //   code: 200,
  //   date:{
  //     id:0
  //   }
  // })
}
// 上传管理-取消上传
export function uploadCancel(params) {
  return request({
    url: `/business/agiKnowledgeFileTask/upload/cancel`,
    method: "post",
    data: params,
  });
}

// 批量删除文件
export function batchDeleteLibFileApi(dataList) {
  return request({
    url: `${API_FILE}/batch/delete/file`,
    method: "post",
    data: {
      dataList,
    },
  });
}
// 批量修改状态
export function batchUpdateLibFileStatusApi(dataList, status) {
  return request({
    url: `${API_FILE}/batch/update/status?status=${status}`,
    method: "post",
    data: {
      dataList,
      status,
    },
  });
}
// 批量修改状态为启用
export function batchUpdateLibFileStatusEnableApi(dataList) {
  return batchUpdateLibFileStatusApi(dataList, 0);
}
// 批量修改状态为停用
export function batchUpdateLibFileStatusDisableApi(dataList) {
  return batchUpdateLibFileStatusApi(dataList, 1);
}

/* 重复内容检测任务 begin */
// 查询任务状态
export function repeatContentCheckTaskStatus() {
  return request({
    url: `${API_CHECK_TASK}/status`,
    method: "get",
  });
}
// 执行任务
export function repeatContentCheckTaskStart(knowledgeIds) {
  // const data = {knowledgeIds};
  return request({
    url: `${API_CHECK_TASK}/start`,
    method: "post",
    data: {
      knowledgeIds,
    },
  });
}
// 停止任务
export function repeatContentCheckTaskStop() {
  return request({
    url: `${API_CHECK_TASK}/stop`,
    method: "get",
  });
}
// 结果
export function repeatContentCheckTaskList(searchParams, queryParams) {
  queryParams.pageSize = 999999;
  const data = { ...searchParams, ...queryParams };
  return request({
    url: `${API_CHECK_TASK}/list`,
    method: "get",
    params: data,
  });
}
// 暂停
export function repeatContentCheckTaskPause() {
  const data = void 0;
  return request({
    url: `${API_CHECK_TASK}/pause`,
    method: "get",
    params: data,
  });
}
// 暂停后恢复
export function repeatContentCheckTaskResume() {
  const data = void 0;
  return request({
    url: `${API_CHECK_TASK}/resume`,
    method: "get",
    params: data,
  });
}
// 重新检测
export function repeatContentCheckTaskRecheck() {
  const data = void 0;
  return request({
    url: `${API_CHECK_TASK}/recheck`,
    method: "get",
    params: data,
  });
}
/* 重复内容检测任务 end */

// 权限继承
export function folderPermission(data) {
  return request({
    url: `${API_FILE}/update/folder/permission`,
    method: "post",
    data: data,
  });
}

// 重新解析文件
export function reparseFile(data) {
  return request({
    url: `${API_FILE}/reparse`,
    method: "post",
    data: {
      dataList: data,
    },
  });
}

export function singleFile(id) {
  return request({
    url: `${API_FILE}/single?id=${id}`,
    method: "get",
  });
}

export function queryBelongList() {
  return request({
    url: `${API}/deptBelong`,
    method: 'get'
  })
}

export function getMdContent(knowledgeId, fileId) {
  return request({
    url: `${API_FILE}/md/single?knowledgeId=${knowledgeId}&fileId=${fileId}`,
    method: "get",
  });
}
export function updateMdContent(fileId, content) {
  return request({
    url: `${API_FILE}/md/update?fileId=${fileId}`,
    method: "post",
    data: {
      id: fileId,
      content,
    },
  });
}

