<template>
  <div class="app-container">
    <el-row>
      <!-- <el-col :span="9">
        <el-card class="box-card" shadow="never">
          <template v-slot:header>
            <div class="clearfix title-style">
              <span>个人信息</span>
            </div>
          </template>
          <div>
            <div class="text-center avatar-style">
              <userAvatar :user="state.user" />
            </div>
            <div class="list-group list-group-striped">
              <el-row class="list-group-item">
                <el-col :span="9" class="pull-left">
                  <svg-icon icon-class="user" class="icon-style" />用户名称
                </el-col>
                <el-col :span="13" class="pull-right">{{
                  state.user.userName
                }}</el-col>
              </el-row>
              <el-divider style="margin: 5px 0; border-top: none" />
              <el-row class="list-group-item">
                <el-col :span="9" class="pull-left">
                  <svg-icon icon-class="phone" class="icon-style" />手机号码
                </el-col>
                <el-col :span="13" class="pull-right">{{
                  state.user.phonenumber
                }}</el-col>
              </el-row>
              <el-divider style="margin: 5px 0; border-top: none" />
              <el-row class="list-group-item">
                <el-col :span="9" class="pull-left">
                  <svg-icon icon-class="email" class="icon-style" />用户邮箱
                </el-col>
                <el-col :span="13" class="pull-right">{{
                  state.user.email
                }}</el-col>
              </el-row>
              <el-divider style="margin: 5px 0; border-top: none" />
              <el-row class="list-group-item">
                <el-col :span="9" class="pull-left">
                  <svg-icon icon-class="tree" class="icon-style" />所属部门
                </el-col>
                <el-col :span="13" class="pull-right" v-if="state.user.dept">
                  {{ state.user.dept.deptName }} / {{ state.postGroup }}
                </el-col>
              </el-row>
              <el-divider style="margin: 5px 0; border-top: none" />
              <el-row class="list-group-item">
                <el-col :span="9" class="pull-left">
                  <svg-icon icon-class="peoples" class="icon-style" />所属角色
                </el-col>
                <el-col :span="13" class="pull-right">
                  {{ state.roleGroup }}
                </el-col>
              </el-row>
              <el-divider style="margin: 5px 0; border-top: none" />
              <el-row class="list-group-item">
                <el-col :span="9" class="pull-left">
                  <svg-icon icon-class="date" class="icon-style" />创建日期
                </el-col>
                <el-col :span="13" class="pull-right">{{
                  state.user.createTime
                }}</el-col>
              </el-row>
              <el-divider style="margin: 5px 0; border-top: none" />
            </div>
          </div>
        </el-card>
      </el-col> -->
      <el-col :span="12">
        <el-tabs v-model="activeTab" style="height: 100%">
          <el-tab-pane label="个人资料" name="userinfo">
            <userInfo :user="state.user" />
          </el-tab-pane>
          <el-tab-pane label="修改密码" name="resetPwd">
            <resetPwd :userInfo="state.user" />
          </el-tab-pane>
        </el-tabs>
        <!-- <el-card class="right-box" shadow="never">
          <template v-slot:header>
            <div class="clearfix title-style">
              <span>基本资料</span>
            </div>
          </template>
          <el-tabs v-model="activeTab" style="height: 100%">
            <el-tab-pane label="基本资料" name="userinfo">
              <userInfo :user="state.user" />
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="resetPwd">
              <resetPwd />
            </el-tab-pane>
          </el-tabs>
        </el-card> -->
      </el-col>
      <el-col :span="12" style="display: grid; place-items: center">
        <!-- <div style="width:100%">
          <div style="width:100%;text-align:center">登陆绑定</div>
          <div class="profile-main-content-right">
            <div class="loseEfficacy" v-if="state.qrCodeType==1" @click="clickRefleshQrCodeImg()">
              <div style="width:100%;text-align:center">
                <img src="../../../../assets/icons/svg/qrprompt.svg" />
                <div>二维码已失效</div>
                <div style="color:#6397FF">点击刷新</div>
              </div>
            </div>
            <div class="loseEfficacy" v-if="state.qrCodeType==2" @click="unbindQrCodeFn()">
              <div style="width:100%;text-align:center">
                <img style="width:32px;height:32px" src="../../../../assets/icons/svg/qrsuccess.svg" />
                <div>已绑定</div>
                <div style="font-size:12px">登录绑定授权中，你可以<span style="color:#6397FF">解除绑定</span></div>
              </div>
            </div>
            <img :src="qrcodeUrl" v-if="qrcodeUrl"/>
          </div>
          <div class="profile-main-content-right-bottom">
            <div class="desc">请使用<span style="color:#6397FF">通用智能体中台 App</span>扫描二维码</div>
            <div class="desc">进行登陆授权</div>
          </div>
        </div> -->
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Profile">
// import userAvatar from "./userAvatar";
import userInfo from './userInfo';
import resetPwd from './resetPwd';
import { getUserProfile, bindQrCode, unbindQrCode, getBindStatus } from '@/api/system/user';
import { getInfo, getQrCode } from '@/api/login';
import qbimage from '../../../../assets/images/qbCodeImg.png';
const activeTab = ref('userinfo');
const state = reactive({
  user: {},
  roleGroup: {},
  postGroup: {},
  qrCodeType: 0,
  loginFailureDialog: false, //测试
  failureType: null, //测试
  userId: ''
});
let qrCodeKey = '';
const qrcodeUrl = ref('');
//测试
const openLoginFailureDialog = (type) => {
  state.loginFailureDialog = true;
  state.failureType = type;
};
//测试
const done = () => {
  state.loginFailureDialog = false;
};
const { proxy } = getCurrentInstance();
top.state = state;
const ssePath = import.meta.env.VITE_APP_SSE_PATH;
let eventSource = null;
function sseConnect() {
  eventSource = new EventSource(ssePath + '?qrCodeKey=' + qrCodeKey + '&type=bind');
  eventSource.onopen = () => {
    console.log('Connection to server opened.');
  };
  // eventSource.onmessage = (event) => {
  //   console.log('event===',event);
  // };
  eventSource.addEventListener('bind', (event) => {
    console.log('event===', event);
    const res = JSON.parse(event.data);
    if (res.code == 200) {
      if (res.userId) {
        state.userId = res.userId;
        bindQrCodeFn(state.userId);
        eventSource.close();
      }
    }
    if (res.code == 500 || res.code == 410) {
      state.qrCodeType = 1;
      eventSource.close();
      proxy.$modal.msgError(res.msg);
    }
  });
  eventSource.onerror = (error) => {
    console.log('EventSource failed:', error);
    if (eventSource.readyState === EventSource.CLOSED) {
      console.log('Connection to server closed.');
      eventSource.close();
    }
  };
}
onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
  }
});
// 绑定二维码
function bindQrCodeFn(userId) {
  bindQrCode(userId).then((res) => {
    if (res.code == 200) {
      state.qrCodeType = 2;
      qrcodeUrl.value = qbimage;
    } else {
      proxy.$modal.msgError(res.msg);
      getQrCodeImg();
    }
  });
}
// 解除绑定
function unbindQrCodeFn() {
  unbindQrCode().then((res) => {
    if (res.code == 200) {
      state.qrCodeType = 0;
    } else {
      proxy.$modal.msgError(res.msg);
    }
    getQrCodeImg();
  });
}
// 查询绑定状态
function getBindStatusFn() {
  getBindStatus().then((res) => {
    if (res.code == 200) {
      if (res.data) {
        state.qrCodeType = 2;
        qrcodeUrl.value = qbimage;
        return;
      }
    } else {
      proxy.$modal.msgError(res.msg);
    }
    getQrCodeImg();
  });
}
function clickRefleshQrCodeImg() {
  state.qrCodeType = 0;
  getQrCodeImg();
}
// 获取扫描二维码图片
function getQrCodeImg() {
  getQrCode().then((res) => {
    if (res.code == 200) {
      res = res.data;
      qrCodeKey = res.key;
      qrcodeUrl.value = res.qrCode;
      sseConnect();
    }
  });
}
function getUser() {
  getInfo().then((res) => {
    const data = res.data || res;
    let tenantName = (data.tenant && data.tenant.name) || '';
    let response = data;
    state.user = response.user || {};
    let roleNameList = [];
    if (state.user.roles && state.user.roles.length != 0) {
      roleNameList = state.user.roles.map((obj) => obj.roleName);
    }
    state.user.tenantName = tenantName;
    state.user.roleName = roleNameList.join('、');
    // state.roleGroup = response.roleGroup;
    // state.postGroup = response.postGroup;
  });
}

getUser();
// getBindStatusFn();
</script>
<style lang="less" scoped>
.box-card {
  height: 654px;
  margin-right: 24px;
  padding: 24px 26px 0 30px;
  box-sizing: border-box;
}
.right-box {
  height: 654px;
  padding: 24px 60px 0 30px;
  box-sizing: border-box;
}
.avatar-style {
  width: 100%;
  height: 156px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.list-group-item {
  font-size: 14px;
  font-family: '思源黑体 CN';
  font-weight: 0;
  color: #666666;
  line-height: 22px;
  padding-bottom: 12px;
  height: 32px;
  line-height: 32px;
}
.pull-right {
  color: #999999;
  text-align: end;
}
.icon-style {
  margin-right: 10px;
}
.title-style {
  width: 96px;
  height: 32px;
  font-size: 24px;
  font-family: '思源黑体 CN';
  font-weight: 0;
  color: rgba(0, 0, 0, 0.65);
  line-height: 24px;
  margin-bottom: 24px;
}
.profile-main-content-right {
  position: relative;
  width: 100%;
  height: calc(100% - 83px);
  display: flex;
  justify-content: center;
  img {
    width: 240px;
    height: 240px;
  }
  .loseEfficacy {
    position: absolute;
    cursor: pointer;
    // top: 0px;
    // left: 0px;
    width: 240px;
    height: 240px;
    background: rgba(255, 255, 255, 0.95);
    font-size: 14px;
    display: grid;
    place-items: center;
    img {
      width: 15px;
      height: 15px;
    }
  }
}
.profile-main-content-right-bottom {
  width: 100%;
  height: 83px;
  padding-top: 15px;
  .desc {
    width: 100%;
    text-align: center;
    font-size: 14px;
    color: #0c113d;
  }
}
</style>
