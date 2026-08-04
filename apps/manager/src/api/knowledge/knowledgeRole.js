// 知识库角色
import request from "@/utils/request";
import qs from "qs";
const API = "/work";

// 查询角色列表
export function listRole(query, pageInfo) {
  return request({
    url: `/business/agiBusinessRole/list?${qs.stringify(pageInfo)}`,
    method: "post",
    data: query,
  });
}

// 查询角色详细
export function getRole(roleId) {
  return request({
    url: "/business/agiBusinessRole/single?id=" + roleId,
    method: "get",
  });
}

// 新增角色
export function addRole(data) {
  return request({
    url: "/business/agiBusinessRole/insert/single",
    method: "post",
    data: data,
  });
}

// 修改角色
export function updateRole(data) {
  return request({
    url: "/business/agiBusinessRole/update/single",
    method: "post",
    data: data,
  });
}

// 角色数据权限
export function dataScope(data) {
  return request({
    url: "/business/agiBusinessRole/dataScope",
    method: "put",
    data: data,
  });
}

// 角色状态修改
export function changeRoleStatus(roleId, status) {
  const data = {
    roleId,
    status,
  };
  return request({
    url: "/business/agiBusinessRole/changeStatus",
    method: "post",
    data: data,
  });
}

// 删除角色
export function delRole(roleId) {
  return request({
    url: "/business/agiBusinessRole/delete/single?id=" + roleId,
    method: "post",
  });
}

// 查询角色已授权用户列表
export function allocatedUserList(query) {
  return request({
    url: "/business/agiBusinessRole/authUser/allocatedList",
    method: "get",
    params: query,
  });
}

// 查询角色未授权用户列表
export function unallocatedUserList(query) {
  return request({
    url: "/business/agiBusinessRole/authUser/unallocatedList",
    method: "get",
    params: query,
  });
}

// 取消用户授权角色
export function authUserCancel(data) {
  return request({
    url: "/business/agiBusinessRole/authUser/cancel",
    method: "put",
    data: data,
  });
}

// 批量取消用户授权角色
export function authUserCancelAll(data) {
  return request({
    url: "/business/agiBusinessRole/authUser/cancelAll",
    method: "put",
    params: data,
  });
}

// 授权用户选择
export function authUserSelectAll(data) {
  return request({
    url: "/business/agiBusinessRole/authUser/selectAll",
    method: "put",
    params: data,
  });
}

// 根据角色ID查询部门树结构
export function deptTreeSelect(roleId) {
  return request({
    url: "/business/agiBusinessRole/deptTree/" + roleId,
    method: "get",
  });
}
// 根据角色ID查询部门树结构
export function getRoleUserList(roleId) {
  return request({
    url: "/business/agiBusinessRole/getRoleUserList",
    method: "post",
  });
}
// 根据角色ID查询部门树结构
export function getUserDeptTree() {
  return request({
    url: "/system/user/userDeptTree",
    method: "get",
  });
}

export function getByUserId(userId) {
  return request({
    url: "/business/agiBusinessRole/getByUserId?userId=" + userId,
    method: "get",
  });
}

