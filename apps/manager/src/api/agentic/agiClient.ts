import {
  AgiClientAgenticDTO,
  AgiClientDTO,
  AgiClientInfoDTO,
  AgiClientPageDTO,
  AgiClientSecretDTO,
  AgiClientVO,
  AjaxResult,
  PageDomain,
  TableDataInfo
} from '@/types';
import request from '@/utils/request';

const path = '/business/agiClient';

// 列表
const list = (dto: AgiClientPageDTO, pg: PageDomain): Promise<TableDataInfo<AgiClientVO>> => {
  return request({
    url: `${path}/list`,
    method: 'GET',
    params: { ...dto, ...pg }
  });
};

// 查询
const single = (id: number): Promise<AjaxResult<AgiClientVO>> => {
  return request({
    url: `${path}/single`,
    method: 'GET',
    params: { id }
  });
};

// 新增
const insert = (data: AgiClientDTO): Promise<AjaxResult<AgiClientVO>> => {
  return request({
    url: `${path}/insert/single`,
    method: 'POST',
    data
  });
};

// 更新智能体终端基本信息
const updateInfo = (data: AgiClientInfoDTO): Promise<AjaxResult<AgiClientVO>> => {
  return request({
    url: `${path}/update/info`,
    method: 'POST',
    data
  });
};

// 更新智能体终端绑定智能体大脑
const updateAgentic = (data: AgiClientAgenticDTO): Promise<AjaxResult<AgiClientVO>> => {
  return request({
    url: `${path}/update/agentic`,
    method: 'POST',
    data
  });
};

// 更新智能体终端密钥等信息
const updateSecret = (data: AgiClientSecretDTO): Promise<AjaxResult<AgiClientVO>> => {
  return request({
    url: `${path}/update/secret`,
    method: 'POST',
    data
  });
};

// 删除
const deleteById = (id: number): Promise<AjaxResult<AgiClientVO>> => {
  return request({
    url: `${path}/delete/single`,
    method: 'POST',
    params: { id }
  });
};

// 启用
const enable = (id: number): Promise<AjaxResult<AgiClientVO>> => {
  return request({
    url: `${path}/enable`,
    method: 'GET',
    params: { id }
  });
};

// 禁用
const disable = (id: number): Promise<AjaxResult<AgiClientVO>> => {
  return request({
    url: `${path}/disable`,
    method: 'GET',
    params: { id }
  });
};

export const agiClient = {
  list,
  single,
  insert,
  updateInfo,
  updateAgentic,
  updateSecret,
  deleteById,
  enable,
  disable
};

// import request from '@/utils/request'
// import { parseStrEmpty } from "@/utils/ruoyi"
// import type { BusinessAgentTerminalQueryParams, TableDataInfo, BusinessAgentTerminalEntity, AjaxResult } from '@/types'
// const SERVER_NAME = '/agentic';

// // 修改
// export function updateBusinessAgentTerminalApi(data: BusinessAgentTerminalEntity): Promise<AjaxResult<BusinessAgentTerminalEntity>> {
//   return request({
//     url: `${SERVER_NAME}/terminas/update/single`,
//     method: 'post',
//     data: data
//   })
// }
//
// export function getAllRobotTypesApi() {
//   return Promise.resolve({
//     code: 200,
//     msg: 'success',
//     data: [
//       {
//         id: 1,
//         name: '钉钉机器人',
//         type: 'dingtalk',
//         desc: '钉钉网页钩子与卡片'
//       },
//       {
//         id: 2,
//         name: '企业微信机器人',
//         type: 'wecom',
//         desc: '企业微信应用消息与对话'
//       },
//       {
//         id: 3,
//         name: 'H5对话机器人',
//         type: 'h5',
//         desc: '独立网页交互对话沙盒'
//       },
//       {
//         id: 4,
//         name: '数字人互动终端',
//         type: 'digital',
//         desc: '虚拟形象主播声音和合成'
//       }
//     ]
//   });
// }

// export function getSystemBuildInPresetsApi() {
//   return Promise.resolve({
//     code: 200,
//     msg: 'success',
//     data: [
//       {
//         id: 'avatar_smart_zhi',
//         name: '小智',
//         icon: '/client/zhi.png'
//       },
//       {
//         id: 'avatar_smart_hui',
//         name: '小慧',
//         icon: '/client/hui.png'
//       },
//       {
//         id: 'avatar_smart_chuang',
//         name: '小创',
//         icon: '/client/chuang.png'
//       }
//     ]
//   });
// }

// export function getSystemBuildInPresetsApi(){
//   // return request({
//   //   url: `${SERVER_NAME}/terminas/systemBuildInPresets`,
//   //   method: 'get'
//   // })
//   return Promise.resolve({
//     code: 200,
//     msg: 'success',
//     data: [
//       {
//         id: "avatar_smart_blue",
//         name: "小智 (智能常识专家)",
//         icon: "🤖",
//         themeClass: "from-blue-600 via-indigo-600 to-indigo-805",
//         svg: () => h('svg', { viewBox: '0 0 100 100', class: 'w-16 h-16' }, [
//           h('defs', [
//             h('linearGradient', { id: 'blue_bot_grad', x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, [
//               h('stop', { offset: '0%', stopColor: '#4F46E5' }),
//               h('stop', { offset: '100%', stopColor: '#06B6D4' })
//             ])
//           ]),
//           h('rect', { x: '20', y: '25', width: '60', height: '50', rx: '15', fill: 'url(#blue_bot_grad)', stroke: '#ffffff', strokeWidth: '2.5' }),
//           h('circle', { cx: '16', cy: '50', r: '6', fill: '#1E293B' }),
//           h('circle', { cx: '84', cy: '50', r: '6', fill: '#1E293B' }),
//           h('line', { x1: '50', y1: '25', x2: '50', y2: '12', stroke: '#4F46E5', strokeWidth: '3' }),
//           h('circle', { cx: '50', cy: '10', r: '4', fill: '#06B6D4', class: 'animate-ping', style: { transformOrigin: '50% 10%' } }),
//           h('circle', { cx: '50', cy: '10', r: '3', fill: '#ffffff' }),
//           h('rect', { x: '28', y: '33', width: '44', height: '26', rx: '8', fill: '#020617' }),
//           h('circle', { cx: '40', cy: '45', r: '4.5', fill: '#22D3EE' }),
//           h('circle', { cx: '60', cy: '45', r: '4.5', fill: '#22D3EE' }),
//           h('path', { d: 'M 44 52 Q 50 56 56 52', stroke: '#22D3EE', strokeWidth: '2', fill: 'none', strokeLinecap: 'round' })
//         ])
//       },
//       {
//         id: "avatar_wise_green",
//         name: "小慧 (常理通识专家)",
//         icon: "🔋",
//         themeClass: "from-emerald-600 via-teal-650 to-emerald-805",
//         svg: () => h('svg', { viewBox: '0 0 100 100', class: 'w-16 h-16' }, [
//           h('defs', [
//             h('linearGradient', { id: 'green_bot_grad', x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, [
//               h('stop', { offset: '0%', stopColor: '#059669' }),
//               h('stop', { offset: '100%', stopColor: '#10B981' })
//             ])
//           ]),
//           h('rect', { x: '22', y: '22', width: '56', height: '52', rx: '20', fill: 'url(#green_bot_grad)', stroke: '#ffffff', strokeWidth: '2.5' }),
//           h('circle', { cx: '16', cy: '48', r: '7', fill: '#34D399' }),
//           h('circle', { cx: '84', cy: '48', r: '7', fill: '#34D399' }),
//           h('ellipse', { cx: '50', cy: '12', rx: '12', ry: '5', stroke: '#10B981', strokeWidth: '2', fill: 'none' }),
//           h('line', { x1: '50', y1: '22', x2: '50', y2: '15', stroke: '#FFFFFF', strokeWidth: '2' }),
//           h('rect', { x: '30', y: '32', width: '40', height: '26', rx: '10', fill: '#000000' }),
//           h('path', { d: 'M36,44 L39,44 L37.5,41 Z', fill: '#34D399' }),
//           h('circle', { cx: '37.5', cy: '44', r: '2.5', fill: '#34D399' }),
//           h('path', { d: 'M60,44 L63,44 L61.5,41 Z', fill: '#34D399' }),
//           h('circle', { cx: '61.5', cy: '44', r: '2.5', fill: '#34D399' }),
//           h('path', { d: 'M 46 51 Q 50 54 54 51', stroke: '#34D399', strokeWidth: '2', fill: 'none' })
//         ])
//       },
//       {
//         id: "avatar_creative_red",
//         name: "小创 (党政思政专篇)",
//         icon: "🔥",
//         themeClass: "from-rose-600 via-red-500 to-amber-600",
//         svg: () => h('svg', { viewBox: '0 0 100 100', class: 'w-16 h-16' }, [
//           h('defs', [
//             h('linearGradient', { id: 'red_bot_grad', x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, [
//               h('stop', { offset: '0%', stopColor: '#E11D48' }),
//               h('stop', { offset: '100%', stopColor: '#F59E0B' })
//             ])
//           ]),
//           h('path', { d: 'M22,30 C22,22 40,16 50,16 C60,16 78,22 78,30 L74,60 C74,68 50,78 50,78 C50,78 26,68 26,60 Z', fill: 'url(#red_bot_grad)', stroke: '#ffffff', strokeWidth: '2.5' }),
//           h('path', { d: 'M50,22 L51.5,25 L55,25 L52,27 L53,30 L50,28 L47,30 L48,27 L45,25 L48.5,25 Z', fill: '#FBBF24' }),
//           h('path', { d: 'M32,38 L68,38 L64,58 L36,58 Z', fill: '#0F172A' }),
//           h('ellipse', { cx: '43', cy: '47', rx: '5', ry: '3.5', fill: '#F59E0B' }),
//           h('ellipse', { cx: '57', cy: '47', rx: '5', ry: '3.5', fill: '#F59E0B' }),
//           h('line', { x1: '48', y1: '47', x2: '52', y2: '47', stroke: '#F59E0B', strokeWidth: '2' }),
//           h('path', { d: 'M 45 53 T 50 54 T 55 53', stroke: '#FFFFFF', strokeWidth: '2', fill: 'none' })
//         ])
//       }
//     ]
//   })
// }
