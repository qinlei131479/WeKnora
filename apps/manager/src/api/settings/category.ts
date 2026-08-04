import { AjaxResult, CategoryDTO, CategoryVO } from '@/types';
import request from '@/utils/request';

const path = '/business/agiCategory';

export const baseCategoryId = 1; // 基础脑领域ID
export const businessCategoryId = 2; // 业务脑领域ID

// 列表树
const tree = (): Promise<AjaxResult<CategoryVO[]>> => {
  return request({
    url: `${path}/tree`,
    method: 'GET'
  });
};

// 新增
const insert = (data: CategoryDTO): Promise<AjaxResult<CategoryVO>> => {
  return request({
    url: `${path}/insert/single`,
    method: 'POST',
    data
  });
};

// 更新
const update = (data: CategoryDTO): Promise<AjaxResult<CategoryVO>> => {
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
    method: 'GET',
    params: { id }
  });
};

export const agiCategory = {
  tree,
  insert,
  update,
  deleteById
};
