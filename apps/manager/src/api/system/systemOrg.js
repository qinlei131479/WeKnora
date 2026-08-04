import request from "@/utils/request";
import qs from 'qs';
const API = '/system';

export const listAllOrgManage = (pageInfo, params) => {
  // return request.post(`${API}/sys-organization/list-org-selected-managed?${qs.stringify(pageInfo)}`, params);
  const res = {
    code: 200,
    data: [
      {
        id: '-1',
        name: '所有单位'
      },
      {
        id: '1',
        name: '单位1'
      },
      {
        id: '2',
        name: '单位2'
      },
    ]
  };
  return Promise.resolve(res);
};

export const globalOrgAdd = (orgId) => {
  // return request.post(`${API}/sys-organization/global-org?${qs.stringify({ orgId })}`);
  const res = {
    code: 200,
    data: {}
  };
  return Promise.resolve(res);
};