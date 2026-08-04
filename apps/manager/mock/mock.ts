
import { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'

// 模拟生成用户列表数据
const createUserList = (count: number) => {
  const list = []
  for (let i = 0; i < count; i++) {
    list.push(
      Mock.mock({
        id: '@increment', // 自增ID
        username: '@cname', // 随机中文姓名
        email: '@email', // 随机邮箱
        phone: /^1[3-9]\d{9}$/, // 随机手机号正则
        avatar: '@image("200x200", "@color", "#fff", "@cname")', // 随机头像
        address: '@province @city @county', // 随机地址
        createTime: '@datetime("yyyy-MM-dd HH:mm:ss")', // 随机时间
        status: '@boolean', // 随机状态
      })
    )
  }
  return list
}

export default [
  // 获取用户列表接口
  {
    url: '/api/user/list',
    method: 'get',
    response: () => {
      return {
        code: 200,
        message: 'success',
        data: createUserList(10), // 生成10条数据
      }
    },
  },
  // 获取用户详情接口
  {
    url: '/api/user/detail',
    method: 'get',
    response: ({ query }) => {
      const { id } = query
      // 模拟根据ID查找用户
      const user = Mock.mock({
        id: id || '@increment',
        username: '@cname',
        email: '@email',
        bio: '@csentence(10, 20)', // 随机简介
      })
      return {
        code: 200,
        message: 'success',
        data: user,
      }
    },
  },
  // 登录接口
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }) => {
      const { username, password } = body
      // 简单模拟验证
      if (username === 'admin' && password === '123456') {
        return {
          code: 200,
          message: '登录成功',
          data: {
            token: Mock.Random.guid(),
            userInfo: {
              username: 'Admin',
              roles: ['admin'],
            },
          },
        }
      } else {
        return {
          code: 401,
          message: '账号或密码错误',
          data: null,
        }
      }
    },
  },
] as MockMethod[]
