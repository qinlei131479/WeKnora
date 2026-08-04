import axios from 'axios'
import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi"
import type { RecSpecialQueryParams, RecSpecial, RecSpecialMedia, AjaxResult, TableDataInfo, RecSpecialAutoBuildMediaData, RecSpecialSaveParams } from '@/types'
const SERVER_NAME = '/work-order';
const CONTROLLE_NAME = 'special-feature-recommend';

// 查询专题列表
export function listSpecial(query: RecSpecialQueryParams): Promise<TableDataInfo<RecSpecial>> {
  return request({
    url: `${SERVER_NAME}/${CONTROLLE_NAME}/list`,
    method: 'get',
    params: query
  })
}

// 查询专题详细
export function getSpecial(id?: number|string): Promise<AjaxResult<RecSpecial>> {
  return request({
    url: `${SERVER_NAME}/${CONTROLLE_NAME}/detail?id=${parseStrEmpty(id)}`,
    method: 'get'
  })
}

// 新增专题
export function addSpecial(data: RecSpecialSaveParams): Promise<AjaxResult<RecSpecial>> {
  return request({
    url: `${SERVER_NAME}/${CONTROLLE_NAME}/saveSpecialInfo`,
    method: 'post',
    data: data
  })
}

// 修改专题
export function updateSpecial(data: RecSpecialSaveParams): Promise<AjaxResult<RecSpecial>> {
  return request({
    url: `${SERVER_NAME}/${CONTROLLE_NAME}`,
    method: 'put',
    data: data
  })
}

// 删除专题
export function delSpecial(idParam: string | number | number[]): Promise<AjaxResult> {
  const id = parseStrEmpty(idParam)
  return request({
    url: `${SERVER_NAME}/${CONTROLLE_NAME}/delete?id=${id}`,
    method: 'post',
    data: {
      id: id
    }
  })
}
// 检查关键词唯一
export function checkKeywordValue(params: any) {
  // return request({
  //   url: `${SERVER_NAME}/${CONTROLLE_NAME}/checkKeyword`,
  //   method: 'post',
  //   data: params
  // })
  return Promise.resolve({
    code: 200
  })
}
const autoBuildSpecialMediaRes = {
    "code": 200,
    "msg": "",
    "data": {
        "specials": {
          "id": 1,
          "names": "专题1#专题2#专题3",
        },
        "programs": [
            {
                "code": "1c5e790a8cb54b1691a83c8e53c41339",
                "name": "湮灭（原声版）"
            },
            {
                "code": "54dc5b3f30d1415b9815ed3bbc5b0f84",
                "name": "湮灭（国语版）"
            },
            {
                "code": "99180001000000010000000041330395",
                "name": "异星觉醒（国语版）"
            },
            {
                "code": "99180001000000010000000081772011",
                "name": "宝莱坞机器人2.0：重生归来（原声版）"
            },
            {
                "code": "99180001000000010000000081772013",
                "name": "宝莱坞机器人2.0：重生归来（国语版）"
            },
            {
                "code": "99180001000000010000000084655896",
                "name": "流浪地球-HD"
            },
            {
                "code": "99180001000000010000000086378088",
                "name": "猪猪侠·不可思议的世界-HD"
            },
            {
                "code": "99180001000000010000000086378095",
                "name": "巧虎大飞船历险记-HD"
            },
            {
                "code": "99180001000000010000000086379946",
                "name": "狮子王-HD"
            },
            {
                "code": "99180001000000010000000086379947",
                "name": "大侦探皮卡丘-HD"
            },
            {
                "code": "99180001000000010000000086380236",
                "name": "哆啦A梦：大雄的月球探险记-HD"
            },
            {
                "code": "99180001000000010000000086380240",
                "name": "冰川时代5-HD"
            },
            {
                "code": "99180001000000010000000087073126",
                "name": "双子杀手（原声版）"
            },
            {
                "code": "99180001000000010000000087073128",
                "name": "双子杀手（国语版）"
            },
            {
                "code": "99180001000000010000000087085360",
                "name": "宝莱坞机器人2.0：重生归来（原声版） 4K"
            },
            {
                "code": "99180001000000010000000087085361",
                "name": "宝莱坞机器人2.0：重生归来（国语版） 4K"
            },
            {
                "code": "99180001000000010000000087085376",
                "name": "猪猪侠·不可思议的世界 4K"
            },
            {
                "code": "99180001000000010000000088396810",
                "name": "黑衣人全球追缉（国语版）-HD"
            },
            {
                "code": "99180001000000010000000088629060",
                "name": "喜羊羊与灰太狼之奇趣外星客-HD"
            },
            {
                "code": "99180001000000010000000088721182",
                "name": "双子杀手-HD"
            }
        ]
    }
}
const autoBuildSpecialMediaTimeout = import.meta.env.DEV ? 5 * 1000 : 120 * 1000
let source: any = null;
// 自动生成专题和媒资
export function autoBuildSpecialMedia(keyword: string, timeout?: number): Promise<AjaxResult<RecSpecialAutoBuildMediaData>> {
  if (!timeout) {
    timeout = autoBuildSpecialMediaTimeout
  }
  if (source) {
    source.cancel()
  }
  source = axios.CancelToken.source();
  return request({
    url: `${SERVER_NAME}/${CONTROLLE_NAME}/createSpecialInfo`,
    method: 'post',
    timeout: timeout,
    cancelToken: source.token,
    data: {
      promptText: keyword
    }
  }).then((res: AjaxResult<RecSpecialAutoBuildMediaData>) => res, (res: any) => {
    if (res) {
        if (res.status == 504 || res.code == 'ECONNABORTED' || (res.message && res.message.indexOf('timeout') != -1)) {
            return autoBuildSpecialMediaRes
        }
        if (axios.isCancel(res)) {
            return {
              code: -999
            }
        }
    }
    // console.log('autoBuildSpecialMedia error', res)
    return {}
  })
//   return Promise.resolve(autoBuildSpecialMediaRes)
}

export function setTheme(id: number) {
  return request({
    url: `${SERVER_NAME}/${CONTROLLE_NAME}/setTheme`,
    method: 'post',
    data: {
      id: id
    }
  })
}
