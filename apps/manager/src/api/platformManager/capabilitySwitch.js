import request from "@/utils/request";

let api = {};
const API = "/system/tenant";

let isDev = false;

// 查询列表
api.list = (tenantId) => {
  if (isDev) {
    return {
      code: 200,
      msg: "",
      total: 1,
      data: [
        {
          value: 1,
          label: "智能审核A",
          other: '精准高效识别识别涉黄、涉暴、涉政、广告、违禁违规信息。',
          used: true,
        },
        {
          value: 2,
          label: "智能审核B",
          other: '精准高效识别识别涉黄、涉暴、涉政、广告、违禁违规信息。',
          used: false
        },
      ],
    };
  } else {
    return request({
      url: `${API}/abilityList?tenantId=${tenantId}`,
      method: "get",
    });
  }
};

// 编辑
api.edit = (param) => {
    if (isDev) {
      return {
        code: 200,
        msg: "",
      };
    } else {
      return request({
        url: `${API}/changeAbility`,
        method: "post",
        data: param,
      });
    }
}

export default { ...api };