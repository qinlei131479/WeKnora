<template>
  <div class="login">
    <aside class="login-brand">
      <div class="login-brand__content">
        <img class="login-brand__logo" src="../../assets/images/login/login_logo@1x.png" alt="空间视创" />
        <div class="login-brand__name">空间视创</div>
        <div class="login-brand__subtitle">管理后台登录</div>

        <div class="login-brand__features">
          <div class="login-feature">
            <div class="login-feature__icon">
              <img src="../../assets/images/login/login_ic_user.png" alt="" />
            </div>
            <div>
              <div class="login-feature__title">用户与岗位管理</div>
              <div class="login-feature__description">求职者、雇主账号全周期管理</div>
            </div>
          </div>
          <div class="login-feature">
            <div class="login-feature__icon">
              <img src="../../assets/images/login/login_ic_shield.png" alt="" />
            </div>
            <div>
              <div class="login-feature__title">风控与内容治理</div>
              <div class="login-feature__description">违规检测、投诉工单一站式处理</div>
            </div>
          </div>
          <div class="login-feature">
            <div class="login-feature__icon">
              <img src="../../assets/images/login/login_ic_report.png" alt="" />
            </div>
            <div>
              <div class="login-feature__title">数据统计看板</div>
              <div class="login-feature__description">实时掌握平台运营核心指标</div>
            </div>
          </div>
        </div>
      </div>

      <div class="copyright">&copy; 2026 空间视创（重庆）科技股份有限公司</div>
    </aside>

    <main class="login-main">
      <div class="login-main-title">
        <div class="login-main-title-text">欢迎回来</div>
        <div class="login-main-title-desc">请登录你的管理员账号</div>
      </div>

      <div class="login-main-content">
        <div class="login-main-content-left">
          <el-form ref="loginRef" :model="loginForm" :rules="loginRules" label-position="top" hide-required-asterisk="true" class="login-form">
            <el-form-item prop="username" label="用户名">
              <el-input v-model="loginForm.username" :prefix-icon="User" type="text" size="large" auto-complete="off" placeholder="请输入账号" />
            </el-form-item>
            <el-form-item prop="password" label="密码">
              <el-input
                v-model="loginForm.password"
                :prefix-icon="LockKeyhole"
                type="password"
                size="large"
                auto-complete="off"
                show-password
                placeholder="6-15位，由字母数字组成"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <div class="row-captcha">
              <el-form-item prop="code" v-if="captchaEnabled" label="验证码">
                <el-input
                  v-model="loginForm.code"
                  :prefix-icon="ShieldCheck"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入验证码"
                  class="login-verific-code"
                  @keyup.enter="handleLogin"
                />
              </el-form-item>
              <div class="login-code">
                <img :src="codeUrl" @click="getCode" class="login-code-img" />
              </div>
            </div>
            <div class="login-form-remember">
              <el-switch width="33" v-model="loginForm.rememberMe" />
              <div class="login-form-remember-text">记住账号密码</div>
            </div>
            <el-form-item class="login-submit">
              <el-button
                :loading="loading"
                size="large"
                type="primary"
                :disabled="loginForm.username === '' || loginForm.password === ''"
                style="width: 100%"
                @click.prevent="handleLogin"
              >
                <div v-if="!loading">登 录</div>
                <div v-else>登 录 中...</div>
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </main>
  </div>
  <LoginFailureDialog
    v-model="state.loginFailureDialog"
    :failureType="state.failureType"
    @done="done"
    @continueLogin="continueLogin"
  ></LoginFailureDialog>
  <AlertComponent v-model="state.alertVisiable" :alertList="state.alertList" />
</template>

<script setup>
import { LockKeyhole, ShieldCheck, User } from 'lucide-vue-next';
import { getCodeImg, checkLogin, getQrCode } from '@/api/login';
import Cookies from 'js-cookie';
import { encrypt, decrypt } from '@/utils/jsencrypt';
import useUserStore from '@/store/modules/user';
import LoginFailureDialog from '@/components/LoginFailureDialog';
import AlertComponent from '@/components/TootipComponent/alertComponent.vue';
import { getToken, setToken, removeToken } from '@/utils/auth';
const userStore = useUserStore();
const router = useRouter();
const { proxy } = getCurrentInstance();

const loginForm = ref({
  username: '',
  password: '',
  rememberMe: false,
  code: '',
  uuid: ''
});
const state = reactive({
  loginFailureDialog: false, //测试
  failureType: null, //测试
  alertVisiable: false,
  alertList: [],
  qrCodeType: 0
});
const loginRules = {
  username: [{ required: true, trigger: 'blur', message: '请输入您的账号' }],
  password: [{ required: true, trigger: 'blur', message: '请输入您的密码' }],
  code: [{ required: true, trigger: 'change', message: '请输入验证码' }]
};

const loginTitle = import.meta.env.VITE_APP_TITLE;

const codeUrl = ref('');
const qrcodeUrl = ref('');
const loading = ref(false);
let eventSource = null;
let qrCodeKey = '';
const ssePath = import.meta.env.VITE_APP_SSE_PATH;
function sseConnect() {
  eventSource = new EventSource(ssePath + '?qrCodeKey=' + qrCodeKey + '&type=login', { withCredentials: false });
  eventSource.onopen = () => {
    console.log('Connection to server opened.');
  };
  eventSource.addEventListener('login', (event) => {
    console.log('event===', event);
    const res = JSON.parse(event.data);
    if (res.code == 200) {
      if (res.token) {
        state.qrCodeType = 2;
        setToken(res.token);
        eventSource.close();
        router.push({ path: redirect.value || '/' });
      }
    } else {
      removeToken();
    }
    if (res.code == 500 || res.code == 410) {
      eventSource.close();
      state.qrCodeType = 1;
      state.alertList.push({
        alertTitle: res.msg,
        alertType: 'error',
        alertEffect: 'dark',
        closable: false
      });
      state.alertVisiable = true;
    }
  });
  // eventSource.addEventListener("message", (event) => {
  //   console.log('event===',event);
  // });
  eventSource.onerror = (error) => {
    console.log('EventSource failed:', error);
    if (eventSource.readyState === EventSource.CLOSED) {
      console.log('Connection to server closed.');
      eventSource.close();
      state.qrCodeType = 1;
    }
  };
}
onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
  }
});
// 验证码开关
const captchaEnabled = ref(true);
// 注册开关
const register = ref(false);
const redirect = ref(undefined);
const checkLoginAgain = async (userInfo) => {
  const username = userInfo.username.trim();
  const password = userInfo.password;
  const code = userInfo.code;
  const uuid = userInfo.uuid;
  await checkLogin(username, password, code, uuid)
    .then((res) => {
      if (res.data && res.code == 200) {
        state.loginFailureDialog = true;
        state.failureType = 3;
      } else {
        login();
      }
    })
    .catch((err) => {
      getCode();
      if (err.code === 512) {
        state.alertVisiable = true;
        state.alertList.push({
          alertTitle: err.msg,
          alertType: 'error',
          alertEffect: 'dark',
          closable: false
        });
      }
      console.log(err);
      loading.value = false;
    });
};
const continueLogin = () => {
  done();
  login();
};
const done = () => {
  state.loginFailureDialog = false;
  loading.value = false;
};
function handleLogin() {
  proxy.$refs.loginRef.validate((valid) => {
    if (valid) {
      loading.value = true;
      // 勾选了需要记住密码设置在 cookie 中设置记住用户名和密码
      if (loginForm.value.rememberMe) {
        Cookies.set('username', loginForm.value.username, { expires: 30 });
        Cookies.set('password', encrypt(loginForm.value.password), {
          expires: 30
        });
        Cookies.set('rememberMe', loginForm.value.rememberMe, { expires: 30 });
      } else {
        // 否则移除
        Cookies.remove('username');
        Cookies.remove('password');
        Cookies.remove('rememberMe');
      }
      checkLoginAgain(loginForm.value);
    }
  });
}
function login() {
  // 调用action的登录方法
  userStore
    .login(loginForm.value)
    .then((res) => {
      console.log('login', res);
      if (res.code === 200) {
        router.push({ path: redirect.value || '/' });
      } else if (res.code === 512 || res.code === 500) {
        loading.value = false;
        state.alertVisiable = true;
        state.alertList.push({
          alertTitle: res.msg,
          alertType: 'error',
          alertEffect: 'dark',
          closable: false
        });
        if (captchaEnabled.value) {
          getCode();
        }
      } else {
        proxy.$modal.msgError(res.msg);
      }
    })
    .catch(() => {
      console.log('login err');
      loading.value = false;
      // 重新获取验证码
      if (captchaEnabled.value) {
        getCode();
      }
    });
}
function getCode() {
  getCodeImg().then((res) => {
    // console.log(res);
    res = res.data || res || {};
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled;
    if (captchaEnabled.value) {
      codeUrl.value = 'data:image/gif;base64,' + res.img;
      loginForm.value.uuid = res.uuid;
    }
  });
}
// 获取扫描二维码图片
function getQrCodeImg() {
  state.qrCodeType = 0;
  state.alertVisiable = false;
  state.alertList = [];
  getQrCode().then((res) => {
    if (res.code == 200) {
      res = res.data;
      qrCodeKey = res.key;
      qrcodeUrl.value = res.qrCode;
      sseConnect();
    }
  });
}
function getCookie() {
  const username = Cookies.get('username');
  const password = Cookies.get('password');
  const rememberMe = Cookies.get('rememberMe');
  loginForm.value = {
    username: username === undefined ? loginForm.value.username : username,
    password: password === undefined ? loginForm.value.password : decrypt(password),
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
  };
}

getCode();
// getQrCodeImg();
getCookie();
</script>

<style lang="scss" scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-image: url('../../assets/images/bg-login.png');
  background-size: cover;
}

.manufacturer-img {
  width: 153px;
  height: 53px;
  background: url('../../assets/images/manufacturer.png') no-repeat;
  background-size: 100% 100%;
  position: absolute;
  left: 80px;
  top: 60px;
}

.login-main {
  width: 640px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0px 3px 8px 1px rgba(85, 88, 113, 0.1);
  border-radius: 40px;
  position: absolute;
  right: 200px;
  top: 160px;
}

.login-main-title {
  // font-family: '思源黑体 CN';
  font-weight: bold;
  font-size: 36px;
  color: #2b2f33;
  text-align: left;
  font-style: normal;
  text-transform: none;
  text-align: center;
  padding: 70px 0 0 50px;
  box-sizing: border-box;
}

.login-main-title-text {
  font-weight: bold;
  font-size: 40px;
  color: #0c113d;
}

.login-main-content {
  // margin-top: 50px;
  padding: 40px 88px 80px 88px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  height: calc(100% - 160px);
}

.login-main-content-left {
  width: 400px;
}

.login-main-content-right {
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

.login-main-content-right-bottom {
  width: 100%;
  height: 83px;
  padding-top: 25px;

  .desc {
    width: 100%;
    text-align: center;
    font-size: 14px;
    color: #0c113d;
  }
}

.login-form {
  width: 400px;

  .el-input {
    height: 48px;

    input {
      height: 48px;
    }
  }

  .input-icon {
    height: 24px;
    width: 24px;
    margin-left: 0px;
  }
}

.login-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
}

.login-code {
  // width: 50%;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0;
  margin-top: 30px;
  height: 48px;
  // float: right;
  // border-radius: 0 4px 4px 0;
  position: relative;
  overflow: hidden;
  border-radius: 16px;

  img {
    cursor: pointer;
    // vertical-align: middle;
    position: absolute;
    inset: -4px;
    display: block;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    max-width: none;
  }
}

.login-verific-code {
  // width: 50%;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0;
  border-radius: 16px;

  :deep(.el-input__wrapper) {
    border-radius: 16px;
  }
}

.login-code-img {
  height: 48px;
  width: 100%;
}

.login-form-remember {
  display: flex;
  margin-bottom: 30px;

  :deep(.el-switch) {
    width: 36px;
    height: 20px;
  }
}

.login-form-remember-text {
  // font-family: '思源黑体 CN';
  font-weight: 400;
  font-size: 14px;
  color: #8a8c9d;
  margin-left: 12px;
}

.login-submit {
  margin-bottom: 0px;
  width: 100%;
}

.login-main-logo {
  position: absolute;
  left: 165px;
  top: 80px;
  width: 40px;
  height: 40px;
  background: url('../../assets/logo/logo@1x.png') no-repeat;
  background-size: 100% 100%;
  // border-radius: 8px;
  z-index: 999;
}

.copyright {
  position: absolute;
  width: 100vw;
  bottom: 30px;
  text-align: center;
  font-weight: 400;
  font-size: 16px;
  color: #77838f;
}

:deep(.input-radius) {
  height: 48px;
  border-radius: 16px;
}

.row-captcha {
  display: flex;
  flex-direction: row;
  gap: 20px;
}

.el-button {
  height: 48px;
  font-size: 16px;
}
</style>
