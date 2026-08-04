import request from "@/utils/request";
import qs from 'qs';

let api = {};
const API = "/audit/system";

let isDev = false;

// 查询列表
api.list = (param,pageInfo,sortInfo) => {
  if (isDev) {
    return {
      code: 200,
      msg: "",
      total: 1,
      data: [
        {
          id: 1,
          name: "系统配置1",
          tenantName: "tenant1",
          tenantId: 0,
          secretKey: 1212313,
          updateTime: "2021-01-01 12:00:00",
        },
      ],
    };
  } else {
    return request({
      url: `${API}/list?${qs.stringify(pageInfo)}&${qs.stringify(sortInfo)}`,
      method: "post",
      data: param,
    });
  }
};

// 新增系统配置
api.add = (params) => {
  if (isDev) {
    return {
      code: 200,
      msg: "success",
      data: {},
    };
  } else {
    return request({
      url: `${API}/insert/single`,
      method: "post",
      data: params,
    });
  }
};

// 编辑系统配置
api.edit = (params) => {
  if (isDev) {
    return {
      code: 200,
      msg: "success",
      data: {},
    };
  } else {
    return request({
      url: `${API}/update/single`,
      method: "post",
      data: params,
    });
  }
};

// 查看系统配置数据
api.getById = (id) => {
  if (isDev) {
    return {
      code: 200,
      msg: "success",
      data: {
        id: 1,
        name: "系统配置1",
        tenantId: 1,
        tenantName: '1',
        secretKey: 1212313,
        updateTime: "2021-01-01 12:00:00",
      },
    };
  } else {
    return request({
      url: `${API}/query?id=${id}`,
      method: "get",
    });
  }
};

// 删除系统配置
api.deleteById = (id) => {
  if (isDev) {
    return {
      code: 200,
      msg: "success",
      data: {},
    };
  } else {
    return request({
      url: `${API}/delete?id=${id}`,
      method: "post",
    });
  }
};

// 更换密钥
api.changeSecretKey = (id) => {
    if (isDev) {
      return {
        code: 200,
        msg: "success",
        data: {},
      };
    } else {
      return request({
        url: `${API}/resetSecretKey?id=${id}`,
        method: "post",
      });
    }
}

export default { ...api };
