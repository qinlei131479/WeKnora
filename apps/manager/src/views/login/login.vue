<template>
  <div class="login">
    <aside class="login-brand">
      <div class="login-brand__content" :style="{ width: `min(${$dim('page.login.brandContentWidth', 400)}px, calc(100% - 64px))` }">
        <img class="login-brand__logo" src="../../assets/images/login/login_logo@1x.png" :alt="$t('app.company', '空间视创')" />
        <div class="login-brand__name">{{ $t('app.company', '空间视创') }}</div>
        <div class="login-brand__subtitle">{{ $t('page.login.brandSubtitle', '管理后台登录') }}</div>

        <div class="login-brand__features" :style="{ width: `${$dim('page.login.brandFeaturesWidth', 272)}px` }">
          <div class="login-feature">
            <div class="login-feature__icon">
              <img src="../../assets/images/login/login_ic_user.png" alt="" />
            </div>
            <div>
              <div class="login-feature__title">{{ $t('page.login.usersManagementTitle', '用户与岗位管理') }}</div>
              <div class="login-feature__description">{{ $t('page.login.usersManagementDescription', '求职者、雇主账号全周期管理') }}</div>
            </div>
          </div>
          <div class="login-feature">
            <div class="login-feature__icon">
              <img src="../../assets/images/login/login_ic_shield.png" alt="" />
            </div>
            <div>
              <div class="login-feature__title">{{ $t('page.login.riskControlTitle', '风控与内容治理') }}</div>
              <div class="login-feature__description">{{ $t('page.login.riskControlDescription', '违规检测、投诉工单一站式处理') }}</div>
            </div>
          </div>
          <div class="login-feature">
            <div class="login-feature__icon">
              <img src="../../assets/images/login/login_ic_report.png" alt="" />
            </div>
            <div>
              <div class="login-feature__title">{{ $t('page.login.statisticsTitle', '数据统计看板') }}</div>
              <div class="login-feature__description">{{ $t('page.login.statisticsDescription', '实时掌握平台运营核心指标') }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="login-brand__copyright" v-html="$t('app.copyright', { current_year: new Date().getFullYear() })"></div>
    </aside>

    <main class="login-main">
      <div class="login-main-title">
        <div class="login-main-title-text">{{ $t('app.title', '智能体中台 2.0') }}</div>
        <div class="login-main-title-desc">{{ $t('page.login.loginPrompt', '请登录你的管理员账号') }}</div>
      </div>

      <div class="login-main-content">
        <div class="login-main-content-left">
          <el-form ref="loginRef" :model="loginForm" :rules="loginRules" label-position="top" hide-required-asterisk="true" class="login-form">
            <el-form-item prop="username" :label="$t('page.login.username', '用户名')">
              <el-input
                v-model="loginForm.username"
                type="text"
                size="large"
                auto-complete="off"
                clearable
                :prefix-icon="User"
                :placeholder="$t('page.login.usernamePlaceholder', '请输入用户名')"
              />
            </el-form-item>
            <el-form-item prop="password" :label="$t('page.login.password', '密码')">
              <el-input
                v-model="loginForm.password"
                type="password"
                size="large"
                show-password
                auto-complete="off"
                clearable
                :prefix-icon="Lock"
                :placeholder="$t('page.login.passwordPlaceholder', '6-15位，由字母数字组成')"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <div class="row-captcha">
              <el-form-item prop="code" v-if="captchaEnabled" :label="$t('page.login.captcha', '验证码')">
                <el-input
                  v-model="loginForm.code"
                  size="large"
                  auto-complete="off"
                  clearable
                  :prefix-icon="Shield"
                  :placeholder="$t('page.login.captchaPlaceholder', '请输入验证码')"
                  class="login-captcha"
                  @keyup.enter="handleLogin"
                />
              </el-form-item>
              <div class="login-code">
                <img :src="codeUrl" @click="getCode" class="login-code-img" />
              </div>
            </div>
            <div class="login-form-remember">
              <el-checkbox v-model="loginForm.rememberMe" :label="$t('page.login.rememberMe', '记住账号密码')" />
            </div>
            <el-form-item class="login-submit">
              <el-button :loading="loading" type="success" @click.prevent="handleLogin">
                <span v-if="!loading">{{ $t('page.login.submit', '登 录') }}</span>
                <span v-else>{{ $t('page.login.submitting', '登 录 中...') }}</span>
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider content-position="center">{{ $t('page.login.otherMethods', '其他登录方式') }}</el-divider>
          <el-button>
            {{ $t('page.login.dingTalkLogin', '钉钉扫码登录') }}
            <template #icon>
              <span style="font-size: 20px; margin-right: 8px">
                <el-icon><MessageCircle /></el-icon>
              </span>
            </template>
          </el-button>
          <div class="login-policy">
            <i18n-t keypath="page.login.agreement" tag="div" scope="global" class="login-policy-text">
              <template #terms>
                <el-link type="success" underline="never">{{ $t('page.login.termsOfUse', '《系统使用协议》') }}</el-link>
              </template>
              <template #privacy>
                <el-link type="success" underline="never">{{ $t('page.login.privacyPolicy', '《隐私政策》') }}</el-link>
              </template>
            </i18n-t>
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
import { Lock, MessageCircle, Shield, User } from 'lucide-vue-next';
import { t } from '@/i18n';
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
const loginRules = computed(() => ({
  username: [{ required: true, trigger: 'blur', message: t('page.login.usernameRequired', '请输入您的账号') }],
  password: [{ required: true, trigger: 'blur', message: t('page.login.passwordRequired', '请输入您的密码') }],
  code: [{ required: true, trigger: 'change', message: t('page.login.captchaPlaceholder', '请输入验证码') }]
}));

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
  background: rgba(255, 255, 255, 0.1);

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

.login-captcha {
  width: 100%;
}

.el-input {
  --el-input-focus-border-color: #1ea76f;
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
    --el-checkbox-checked-input-border-color: #1ea76f;
    --el-checkbox-checked-bg-color: #1ea76f;
    --el-checkbox-checked-icon-color: #fff;
    --el-checkbox-input-border-color-hover: #1a1f2e;
    color: #64748b;
  }
}

.login-submit {
  width: 100%;
  margin-bottom: 0;

  :deep(.el-button) {
    --el-button-bg-color: #1ea76f;
    --el-button-hover-bg-color: #36b481;
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

  --el-button-hover-text-color: #1ea76f;
  --el-button-hover-bg-color: #defff2;
  --el-button-hover-border-color: #1ea76f;
  --el-button-active-border-color: #1ea76f;
  --el-button-outline-color: #1ea76f;
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
    white-space: break-spaces;
    color: #94a3b8;
    font-size: 12px;

    :deep(.el-link) {
      font-size: 12px;
      font-weight: normal;
      --el-link-text-color: #1ea76f;
      --el-link-hover-text-color: #36b481;
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
