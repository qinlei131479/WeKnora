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

      <div class="login-brand__copyright">&copy; Copyright Reserved 空间视创（重庆）科技股份有限公司 版权所有</div>
    </aside>

    <main class="login-main">
      <div class="login-main-title">
        <div class="login-main-title-text">智能体中台 2.0</div>
        <div class="login-main-title-desc">请登录你的管理员账号</div>
      </div>

      <div class="login-main-content">
        <div class="login-main-content-left">
          <el-form ref="loginRef" :model="loginForm" :rules="loginRules" label-position="top" hide-required-asterisk="true" class="login-form">
            <el-form-item prop="username" label="用户名">
              <el-input v-model="loginForm.username" type="text" size="large" auto-complete="off" placeholder="请输入用户名">
                <template #prefix>🤵</template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password" label="密码">
              <el-input
                v-model="loginForm.password"
                type="password"
                size="large"
                show-password
                auto-complete="off"
                placeholder="6-15位，由字母数字组成"
                @keyup.enter="handleLogin"
              >
                <template #prefix>🔒</template>
                <template #password-icon="{ visible }">
                  {{ visible ? '🚫' : '👁️' }}
                </template>
              </el-input>
            </el-form-item>
            <div class="row-captcha">
              <el-form-item prop="code" v-if="captchaEnabled" label="验证码">
                <el-input
                  v-model="loginForm.code"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入验证码"
                  class="login-verific-code"
                  @keyup.enter="handleLogin"
                >
                  <template #prefix>🛡️</template>
                </el-input>
              </el-form-item>
              <div class="login-code">
                <img :src="codeUrl" @click="getCode" class="login-code-img" />
              </div>
            </div>
            <div class="login-form-remember">
              <el-checkbox v-model="loginForm.rememberMe" label="记住账号密码" />
            </div>
            <el-form-item class="login-submit">
              <el-button :loading="loading" type="success" @click.prevent="handleLogin">
                <div v-if="!loading">登 录</div>
                <div v-else>登 录 中...</div>
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider content-position="center">其他登录方式</el-divider>
          <el-button>
            钉钉扫码登录
            <template #icon>
              <span style="font-size: 20px; margin-right: 8px">💬</span>
            </template>
          </el-button>
          <div class="login-policy">
            <div class="login-policy-text">
              登录即代表您同意
              <el-link type="success" underline="never">《系统使用协议》</el-link> 及
              <el-link type="success" underline="never">《隐私政策》</el-link>
            </div>
          </div>
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
import { getCodeImg, checkLogin, getQrCode } from '@/api/login';
import Cookies from 'js-cookie';
import { encrypt, decrypt } from '@/utils/jsencrypt';
import useUserStore from '@/store/modules/user';
import LoginFailureDialog from '@/components/LoginFailureDialog';
import AlertComponent from '@/components/TootipComponent/alertComponent.vue';
import { setToken, removeToken } from '@/utils/auth';
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
  width: 100%;
  min-width: 0;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  background: #f4f6f6;
}

.login-brand {
  position: relative;
  display: flex;
  flex: 0 0 52%;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  color: #ffffff;
  background: #00ab6b url('../../assets/images/login/login_bg_left.png') center / cover no-repeat;
}

.login-brand__content {
  width: min(400px, calc(100% - 64px));
  transform: translateY(-25px);
  text-align: center;
}

.login-brand__logo {
  display: block;
  width: 72px;
  height: 72px;
  margin: 0 auto;
}

.login-brand__name {
  color: #fff;
  margin-top: 26px;
  font-size: 40px;
  font-weight: bold;
  line-height: 40px;
}

.login-brand__subtitle {
  color: #ccc;
  margin-top: 8px;
  font-size: 16px;
  line-height: 24px;
}

.login-brand__features {
  display: flex;
  width: 272px;
  max-width: 100%;
  margin: 48px auto 0;
  flex-direction: column;
  gap: 20px;
  text-align: left;
}

.login-feature {
  display: grid;
  grid-template-columns: 3em minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.login-feature__icon {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.3);

  img {
    display: block;
    max-width: 18px;
    max-height: 18px;
  }
}

.login-feature__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.login-feature__description {
  margin-top: 2px;
  color: #ccc;
  font-size: 13px;
  line-height: 18px;
}

.login-brand__copyright {
  position: absolute;
  right: 32px;
  bottom: 54px;
  left: 32px;
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

.login-main {
  display: flex;
  min-width: 0;
  min-height: 100vh;
  min-height: 100dvh;
  padding: clamp(32px, 6vh, 72px) clamp(24px, 5vw, 96px);
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  box-sizing: border-box;
  background: #f4f6f6;
}

.login-main-title,
.login-main-content {
  width: min(400px, 100%);
}

.login-main-title {
  margin-bottom: 36px;
}

.login-main-title-text {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #1e293b;
}

.login-main-title-desc {
  color: #64748b;
  font-size: 14px;
}

.login-main-content-left,
.login-form {
  width: 100%;
  min-width: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    height: auto;
    padding: 0;
    margin: 0px;
    font-weight: normal;
    color: #1e293b;
  }
}

.row-captcha {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px;
  align-items: start;
  gap: 10px;

  :deep(.el-form-item) {
    min-width: 0;
  }
}

.login-code {
  position: relative;
  height: 40px;
  margin-top: 22px;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  border: var(--el-border-width) var(--el-border-style) var(--el-border-color);

  img {
    position: absolute;
    inset: -4px;
    display: block;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    max-width: none;
    cursor: pointer;
    object-fit: cover;
  }
}

.login-verific-code {
  width: 100%;
}

.login-form-remember {
  .el-checkbox {
    --el-checkbox-font-size: 14px;
    --el-checkbox-font-weight: normal;
    --el-checkbox-input-height: 15px;
    --el-checkbox-input-width: 15px;
    --el-checkbox-text-color: #64748b;
    --el-checkbox-border-radius: 3px;
    --el-checkbox-bg-color: #fff;
    --el-checkbox-input-border: 1px solid #1a1f2e;
    --el-checkbox-checked-text-color: #64748b;
    --el-checkbox-checked-input-border-color: #40916c;
    --el-checkbox-checked-bg-color: #40916c;
    --el-checkbox-checked-icon-color: #fff;
    --el-checkbox-input-border-color-hover: #1a1f2e;
    color: #64748b;
  }
}

.login-submit {
  width: 100%;
  margin-bottom: 0;

  :deep(.el-button) {
    --el-button-bg-color: #00ab6b;
    --el-button-hover-bg-color: #008251;
    font-size: 15px;
    font-weight: 600;
    color: #fff;

    .el-icon.is-loading + span > div {
      color: #c0c0c0;
    }
  }
}

:deep(.el-button) {
  width: 100%;
  height: 46px;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  transition:
    background 0.15s,
    transform 0.1s;

  --el-button-hover-text-color: var(--el-color-success);
  --el-button-hover-bg-color: var(--el-color-success-light-9);
  --el-button-hover-border-color: var(--el-color-success-light-7);
  --el-button-active-border-color: var(--el-color-success);
  --el-button-outline-color: var(--el-color-success-light-5);
}

:deep(i.el-icon) {
  font-style: normal;
}

:deep(.el-divider) {
  margin: 37px 0 29px;

  .el-divider__text {
    line-height: 18px;
    color: #94a3b8;
    background-color: transparent;
  }
}

.login-policy {
  display: flex;
  justify-content: center;
  margin-top: 32px;

  .login-policy-text {
    display: flex;
    align-items: center;
    color: #94a3b8;
    font-size: 12px;

    :deep(.el-link) {
      font-size: 12px;
      font-weight: normal;
      --el-link-text-color: #00ab6b;
      --el-link-hover-text-color: #008251;
    }
  }
}

@media (max-width: 1280px) {
  .login-brand {
    flex-basis: 48%;
  }

  .login-main {
    padding-right: 48px;
    padding-left: 48px;
  }
}

@media (max-width: 980px) {
  .login-brand {
    flex-basis: 44%;
  }

  .login-brand__content {
    width: min(340px, calc(100% - 48px));
  }

  .login-brand__features {
    width: 300px;
  }

  .login-main {
    padding-right: 32px;
    padding-left: 32px;
  }
}

@media (max-width: 900px) {
  .login {
    overflow-y: auto;
  }

  .login-brand {
    display: none;
  }

  .login-main {
    width: 100%;
    min-height: 100vh;
    padding: 48px 24px;
  }
}

@media (max-width: 520px) {
  .login-main {
    padding: 32px 20px;
  }

  .login-main-title {
    margin-bottom: 28px;
  }

  .row-captcha {
    grid-template-columns: minmax(0, 1fr) 112px;
    gap: 8px;
  }
}

@media (max-height: 720px) and (min-width: 901px) {
  .login-brand__logo {
    width: 64px;
    height: 64px;
  }

  .login-brand__name {
    margin-top: 18px;
  }

  .login-brand__features {
    margin-top: 30px;
    gap: 14px;
  }

  .login-brand__copyright {
    bottom: 24px;
  }

  .login-main-title {
    margin-bottom: 24px;
  }

  .login-form {
    :deep(.el-form-item) {
      margin-bottom: 14px;
    }
  }
}
</style>
