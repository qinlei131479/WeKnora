import request from "@/utils/request";
import qs from 'qs';
let api = {};
const API = "/audit";
const isDev = false
export function queryTable(params,pageInfo,sort) {
    if(isDev){
        return{
            msg: "success",
            pages: 1,
            code:200,
            total:5,
            rows: [{
                id:11,
                tag:'c测试',
                createTime:'2024-06-18 00:00:00',
                enabled:'0',
            },{
                id:22,
                tag:'c测试22',
                createTime:'2024-06-18 00:00:00',
                enabled:'1',
            },{
                id:33,
                tag:'c测试33',
                createTime:'2024-06-18 00:00:00',
                enabled:'0',
            },{
                id:44,
                tag:'c测试44',
                createTime:'2024-06-18 00:00:00',
                enabled:'1',
            },{
                id:55,
                tag:'c测试55',
                createTime:'2024-06-18 00:00:00',
                enabled:'1',
            }]
        }
    }else{
        return request({
            url: `${API}/blackWhiteList/list?${qs.stringify(pageInfo)}&${qs.stringify(sort)}`,
            method: "post",
            data: params,
        });
    }
}
// 停用启用
export function batchChangeStatus(data) {
  debugger
    if(isDev){
      return {
        code: 200,
        data: data,
        msg: "",
      };
    }else{
      return request({
        url: `${API}/blackWhiteList/batchChangeStatus`,
        method: "post",
        data: data,
      });
    }
}
// 删除
export function deletewhite(data) {
    if(isDev){
      return {
        code: 200,
        data: data,
        msg: "",
      };
    }else{
      return request({
        url: `${API}/blackWhiteList/delete`,
        method: "post",
        data: data,
      });
    }
}

// 批量删除
export function batchDeletewhite(data) {
    if(isDev){
      return {
        code: 200,
        data: data,
        msg: "",
      };
    }else{
      return request({
        url: `${API}/blackWhiteList/delete`,
        method: "post",
        data: data,
      });
    }
}

// 批量启用
export function batchStartwhite(data) {
    if(isDev){
      return {
        code: 200,
        data: data,
        msg: "",
      };
    }else{
      return request({
        url: `${API}/blackWhiteList/batchChangeStatus`,
        method: "post",
        data: data,
      });
    }
}
// 批量停用
export function batchStopwhite(data) {
    if(isDev){
      return {
        code: 200,
        data: data,
        msg: "",
      };
    }else{
      return request({
        url: `${API}/blackWhiteList/batchChangeStatus`,
        method: "post",
        data: data,
      });
    }
}

// 白名单新增
export function whiteAdd(data) {
  if(isDev){
    return {
      code: 200,
      data: data,
      msg: "",
    };
  }else{
    return request({
      url: `${API}/blackWhiteList/insert`,
      method: "post",
      data: data,
    });
  }
}

// 白名单修改
export function whiteEdit(data) {
  if(isDev){
    return {
      code: 200,
      data: data,
      msg: "",
    };
  }else{
    return request({
      url: `${API}/`,
      method: "post",
      data: data,
    });
  }
}

// 导入
export function importBlackWhiteList(file,params) {
  return request({
    url: `${API}/blackWhiteList/import?${qs.stringify(params)}`,
    method: 'post',
    data: file
  })
}