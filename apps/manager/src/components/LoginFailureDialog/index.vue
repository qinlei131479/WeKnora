<template>
    <!-- 被强制登录弹窗 -->
    <el-dialog
      v-model="state.visible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      title=""
      width="30%"
      class="loginFailureDialog"
      style="margin-top:30vh !important"
      center
    >
      <div style="text-align: center">
        <img v-if="props.failureType=='1'||props.failureType=='2'||props.failureType=='4'||props.failureType=='5'||props.failureType=='6'||props.failureType=='7'" src="@/assets/images/dialog/warn.png" />
        <img v-if="props.failureType=='3'" src="@/assets/images/dialog/error.png" />
        <img v-if="props.failureType=='8'" src="@/assets/images/dialog/success.png"/>
        <!-- S--登录失效 -->
        <div v-if="props.failureType=='1'">
            <div class="log_title">
            {{ $t('component.loginFailureDialog.youHaveBeenSignedOutDueToInactivity', '账号因长时间未操作，已自动退出') }}<br>
            {{ $t('component.loginFailureDialog.pleaseSignInAgain', '请重新登录') }}
            </div>
        </div>
        <!-- E--登录失效 -->
        <!-- S--登录失效--用户无访问权限 -->
        <div v-if="props.failureType=='2'">
            <div class="log_title">
            {{ $t('component.loginFailureDialog.yourAccountHasBeenDisabledAndYouHaveBeenSigned', '账号已被停用，系统自动退出') }}<br>
            {{ $t('component.loginFailureDialog.contactYourAdministratorIfYouHaveAnyQuestions', '如有疑问请联系管理员') }}
            </div>
        </div>
        <!-- E--登录失效--用户无访问权限 -->
        <!-- S--单点登录登录方 -->
        <div v-if="props.failureType=='3'">
            <div class="log_title">
            {{ $t('component.loginFailureDialog.securityNotice', '安全提示') }}
            </div>
            <div class="log_info">
                {{ $t('component.loginFailureDialog.yourAccountIsSignedInOnAnotherDevice', '检测到当前账户在其它设备已登录') }}<br>
                {{ $t('component.loginFailureDialog.continuingWillSignOutTheOtherDevice', '如果继续登录对方设备会强制下线') }}<br>
                {{ $t('component.loginFailureDialog.continueSigningIn', '是否继续登录') }}
            </div>
        </div>
        <!-- E--单点登录登录方 -->
        <!-- S--单点登录被踢方 -->
        <div v-if="props.failureType=='4'">
            <div class="log_title">
            {{ $t('component.loginFailureDialog.yourAccountWasSignedInOnAnotherDeviceThisDevice', '该账户在其他设备登录，当前设备已下线') }}
            </div>
            <div class="log_info" style="margin-bottom:8px">
            <i18n-t keypath="component.loginFailureDialog.redirectCountdown" scope="global"><template #seconds><span style="color: #6397FF">{{ state.miao }}</span></template></i18n-t><a
                style="color: #6397FF"
                @click="goLogin">
                {{ $t('component.loginFailureDialog.goNow', '立即跳转!') }}</a>
            </div>
        </div>
        <!-- E--单点登录被踢方 -->
        <!-- S--修改租户-被踢方 -->
        <div v-if="props.failureType=='5'">
            <div class="log_title">
            {{ $t('component.loginFailureDialog.yourAccountSTenantHasChangedPleaseSignInAgain', '该账户所属租户发生更改，请重新登陆') }}
            </div>
            <div class="log_info" style="margin-bottom:8px">
            <i18n-t keypath="component.loginFailureDialog.redirectCountdown" scope="global"><template #seconds><span style="color: #336bf5">{{ state.miao }}</span></template></i18n-t><a
                style="color: #336bf5"
                @click="goLogin">
                {{ $t('component.loginFailureDialog.goNow', '立即跳转!') }}</a>
            </div>
        </div>
        <!-- E--修改租户-被踢方 -->
        <!-- S--密码被重置-被踢方 -->
        <div v-if="props.failureType=='6'">
            <p class="log_title">
            {{ $t('component.loginFailureDialog.yourPasswordHasBeenResetPleaseSignInAgain', '该账户密码被重置，请重新登陆') }}
            </p>
            <p>
            <i18n-t keypath="component.loginFailureDialog.redirectCountdown" scope="global"><template #seconds><span style="color: #336bf5">{{ state.miao }}</span></template></i18n-t><a
                style="color: #336bf5"
                @click="goLogin">
                {{ $t('component.loginFailureDialog.goNow', '立即跳转!') }}</a>
            </p>
        </div>
        <!-- E--密码被重置-被踢方 -->
        <!-- S--删除用户或无权限-被踢方 -->
        <div v-if="props.failureType=='7'">
            <p class="log_title">
            {{ $t('component.loginFailureDialog.invalidAccountInformationContactYourAdministrator', '账号信息错误，请联系系统管理员') }}
            </p>
            <p>
            <i18n-t keypath="component.loginFailureDialog.redirectCountdown" scope="global"><template #seconds><span style="color: #336bf5">{{ state.miao }}</span></template></i18n-t><a
                style="color: #336bf5"
                @click="goLogin">
                {{ $t('component.loginFailureDialog.goNow', '立即跳转!') }}</a>
            </p>
        </div>
        <!-- E--删除用户或无权限-被踢方 -->
        <!-- S--密码修改成功 -->
        <div v-if="props.failureType=='8'">
            <p class="log_title">
            {{ $t('component.loginFailureDialog.passwordChangedPleaseSignInWithYourNewPassword', '密码修改成功，请使用新密码登录') }}
            </p>
            <p>
            <i18n-t keypath="component.loginFailureDialog.redirectCountdown" scope="global"><template #seconds><span style="color: #336bf5">{{ state.miao }}</span></template></i18n-t><a
                style="color: #336bf5"
                @click="goLogin">
                {{ $t('component.loginFailureDialog.goNow', '立即跳转!') }}</a>
            </p>
        </div>
        <!-- E--密码修改成功 -->
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button v-if="props.failureType=='1'||props.failureType=='2'" type="primary" @click="goLogin" style="width: 74px;height: 32px;margin-bottom:32px"> {{ $t('component.loginFailureDialog.gotIt', '知道了') }} </el-button>
          <el-button v-if="props.failureType=='3'" @click="cancel" style="width:60px;height:32px;margin-bottom:32px"> {{ $t('page.normal.cancel', '取消') }} </el-button>
          <el-button v-if="props.failureType=='3'" type="primary"  style="width:88px;height:32px;margin-bottom:32px" @click="continueLogin"> {{ $t('component.loginFailureDialog.continueSigningInText', '继续登录') }} </el-button>
        </span>
      </template>
    </el-dialog>
</template>
<script setup>
import { onMounted } from "vue"
import { useRouter } from 'vue-router';
import useUserStore from '@/store/modules/user'
    const state = reactive({
        visible:false,
        miao: 3,
        timers:null
    })
    const emit = defineEmits(['done','continueLogin']);
    const props = defineProps({
        failureType:{
            type:String,
            default:'1'
        },
        modelValue: {
            type: Boolean,
            default: false
        },
    })
    const router = useRouter();
    const userStore = useUserStore()
    watch(
      () => {
        return props.modelValue;
      },
      (val) => {
        state.visible = val;
      },
      { immediate:true }
    );
    watchEffect(() => {
        if(props.failureType=='4'||props.failureType=='5'||props.failureType=='6'||props.failureType=='7'||props.failureType=='8'){
            state.timers = setInterval(() => {
                if (state.miao > 0) {
                state.miao--;
                } else {
                clearInterval(state.timers);
                state.visible = false;
                goLogin();
                }
            }, 1000);
        }
    });
    const goLogin = () => {
        if(state.timers){clearInterval(state.timers);}
        userStore.logOut().then(() => {
            location.href = '/index';
        })
    }
    const cancel = () => {
        emit('done');
    }
    const continueLogin = () => {
        emit('continueLogin');
    }
</script>
<style lang="less">
.log_title{
    font-family: 思源黑体 CN;
    font-weight: 500;
    font-size: 20px;
    color: #0C113D;
    line-height: 32px;
    text-align: center;
    font-style: normal;
    text-transform: none;
    margin-top: 20px;
}
.log_info{
    font-family: 思源黑体 CN;
    font-weight: 0;
    font-size: 14px;
    color: #8A8C9D;
    line-height: 20px;
    text-align: center;
    font-style: normal;
    text-transform: none;
    margin-top: 24px;
}
.loginFailureDialog{
    .el-dialog__header{
        display: none;
    }
    .el-dialog__body{
        padding-top: 32px !important;
        padding-bottom: 24px !important;
    }
    .el-dialog__footer{
        padding-top: 0px;
        padding-bottom: 0px;
    }
}
</style>
