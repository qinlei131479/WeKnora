import {
  AjaxResult,
  PageDomain,
  SkillDTO,
  SkillImportGitDTO,
  SkillImportVO,
  SkillPageDTO,
  SkillVO,
  TableDataInfo
} from '@/types';
import request, { uploadFile } from '@/utils/request';

const path = '/business/agiSkill';

// 列表
const list = (dto: SkillPageDTO, pg: PageDomain): Promise<TableDataInfo<SkillVO>> => {
  return request({
    url: `${path}/list`,
    method: 'GET',
    params: { ...dto, ...pg }
  });
};

// 详情
const single = (id: number): Promise<AjaxResult<SkillVO>> => {
  return request({
    url: `${path}/single`,
    method: 'GET',
    params: { id }
  });
};

// 新增
const insert = (data: SkillDTO, uuid: string): Promise<AjaxResult<SkillVO>> => {
  return request({
    url: `${path}/insert/single`,
    method: 'POST',
    data,
    params: { uuid }
  });
};

// 更新
const update = (data: SkillDTO): Promise<AjaxResult<SkillVO>> => {
  return request({
    url: `${path}/update/single`,
    method: 'POST',
    data
  });
};

// 删除
const deleteById = (id: number): Promise<AjaxResult> => {
  return request({
    url: `${path}/delete/single`,
    method: 'POST',
    params: { id }
  });
};

// 状态变更
const status = (id: number, status: 0 | 1 | 2): Promise<AjaxResult> => {
  return request({
    url: `${path}/status/single`,
    method: 'POST',
    params: { id, status }
  });
};

// 强制下线
const offlineByIdForce = (id: number): Promise<AjaxResult> => {
  return request({
    url: `${path}/offline/force`,
    method: 'POST',
    params: { id }
  });
};

// 导入 SKILL 本地 ZIP 文件
const importZip = (zip: File): Promise<AjaxResult<SkillImportVO>> => {
  const data = new FormData();
  data.append('zip', zip);

  return uploadFile(`${path}/import/zip`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// 导入 SKILL 远端 GIT 仓库
const importGit = (data: SkillImportGitDTO): Promise<AjaxResult<SkillImportVO>> => {
  return request({
    url: `${path}/import/git`,
    method: 'POST',
    data
  });
};

export const agiSkill = {
  list,
  single,
  insert,
  update,
  deleteById,
  status,
  offlineByIdForce,
  importZip,
  importGit
};
