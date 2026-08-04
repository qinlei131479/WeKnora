import request from '@/utils/request';
import type { HomeTopData, HomeAgenticStatus, AjaxResult, HomeTodayData, HomeAsset, HomeErrorItem } from '@/types';
const SERVER_NAME = '/business/agiHome';

export function getHomeTopDataApi(): Promise<AjaxResult<HomeTopData>> {
  return request({
    url: `${SERVER_NAME}/top`,
    method: 'get'
  });
}

export function getHomeTodayDataApi(): Promise<AjaxResult<HomeTodayData>> {
  return request({
    url: `${SERVER_NAME}/today`,
    method: 'get'
  });
}

export function getHomeErrorItemsApi(): Promise<AjaxResult<HomeErrorItem[]>> {
  return request({
    url: `${SERVER_NAME}/error`,
    method: 'get'
  });
}

export function getHomeAssetApi(): Promise<AjaxResult<HomeAsset>> {
  return request({
    url: `${SERVER_NAME}/asset`,
    method: 'get'
  });
}

export function getHomeAgenticStatusApi(): Promise<AjaxResult<HomeAgenticStatus>> {
  return request({
    url: `${SERVER_NAME}/agenticStatus`,
    method: 'get'
  });
}
