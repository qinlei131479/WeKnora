<template>
  <el-form ref="pwdRef" :model="user" :rules="rules" label-width="80px" style="margin-top: 35px">
    <el-form-item :label="$t('page.system.user.profile.currentPassword', '旧密码')" prop="oldPassword">
      <el-input v-model="user.oldPassword" :placeholder="$t('page.system.user.profile.enterYourCurrentPassword', '请输入旧密码')" type="password" show-password />
    </el-form-item>
    <el-form-item :label="$t('page.system.user.profile.newPassword', '新密码')" prop="newPassword">
      <el-input v-model="user.newPassword" :placeholder="$t('page.system.user.resetPassword.placeholder', '请输入新密码')" type="password" show-password />
    </el-form-item>
    <el-form-item :label="$t('page.register.confirmPassword', '确认密码')" prop="confirmPassword">
      <el-input v-model="user.confirmPassword" :placeholder="$t('page.system.user.profile.confirmYourNewPassword', '请确认新密码')" type="password" show-password />
    </el-form-item>
    <el-form-item>
      <el-form-item>
        <div style="width: 100%; margin-bottom: 50px">
          <div class="showRules" :style="{ color: state.haveLength ? '#68C23A' : '#666' }">
            <el-icon :size="12"><CircleCheck /></el-icon> {{ $t('page.system.user.profile.atLeast6Characters', '至少6个字符') }}
          </div>
          <div class="showRules" :style="{ color: state.haveNum ? '#68C23A' : '#666' }">
            <el-icon :size="12"><CircleCheck /></el-icon> {{ $t('page.system.user.profile.atLeastOneDigit', '至少一个数字') }}
          </div>
          <!-- <div
            class="showRules"
            :style="{ color: state.haveUpperCase ? '#68C23A' : '#666' }"
          >
            <el-icon :size="12"><CircleCheck /></el-icon> 至少一个大写字母
          </div> -->
          <div class="showRules" :style="{ color: state.haveLowerCase ? '#68C23A' : '#666' }">
            <el-icon :size="12"><CircleCheck /></el-icon> {{ $t('page.system.user.profile.atLeastOneLetter', '至少一个字母') }}
          </div>
          <p>
            {{ $t('page.system.user.profile.passwordStrength', '密码强度:') }}
            <span v-show="user.newPassword" class="left5">
              {{ checkPassword(user.newPassword) }}
            </span>
          </p>
          <el-progress style="width: 100%" :percentage="state.totalMark" :show-text="false" :color="customColorMethod(state.totalMark)" />
        </div>
        <!-- <el-button @click="close">关闭</el-button> -->
      </el-form-item>
    </el-form-item>
    <el-form-item>
      <div style="width: 100%; text-align: right">
        <el-button :disabled="!isSubmit" type="primary" @click="submit">{{ $t('page.system.user.profile.changePasswordText', '更改密码') }}</el-button>
      </div>
    </el-form-item>
  </el-form>
  <!-- 登录状态弹框 -->
  <LoginFailureDialog v-model="state.loginFailureDialog" :failureType="state.failureType" @done="done"></LoginFailureDialog>
</template>

<script setup>
import { t } from '@/i18n';
import { updateUserPwd, checkPasswordValue } from '@/api/system/user';
import LoginFailureDialog from '@/components/LoginFailureDialog'; //测试
import { Rsa } from '@/utils/rsa';
const { proxy } = getCurrentInstance();
const props = defineProps({
  userInfo: {
    type: Object
  }
});
const user = reactive({
  oldPassword: undefined,
  newPassword: undefined,
  confirmPassword: undefined
});

const state = reactive({
  totalMark: '', // 密码的进度条分数
  haveLength: false,
  haveLowerCase: false,
  haveNum: false,
  loginFailureDialog: false, //
  failureType: null //
  // haveUpperCase: false,
});

//
const done = () => {
  state.loginFailureDialog = false;
};
const checkPasswordInspect = async (rule, value, callback) => {
  const rsa = new Rsa();
  let password = rsa.encryptWithRSA(user.oldPassword);
  const res = await checkPasswordValue({ password: password, userId: props.userInfo.userId });
  if (!res.data) {
    callback(new Error(t('page.system.user.profile.incorrectPassword', '密码错误')));
  } else {
    callback();
  }
};
const equalToPassword = (rule, value, callback) => {
  if (user.newPassword !== value) {
    callback(new Error(t('page.system.user.profile.theTwoPasswordsDoNotMatch', '两次输入的密码不匹配')));
  } else {
    callback();
  }
};
const equalNewPassword = async (rule, value, callback) => {
  if (user.oldPassword === value) {
    callback(new Error(t('page.system.user.profile.theNewPasswordMustDifferFromTheOldPassword', '新密码与旧密码不能相同')));
    isSubmit.value = false;
  } else {
    callback();
  }
};
const rules = ref({
  oldPassword: [
    { required: true, get message() { return t('page.system.user.profile.currentPasswordIsRequired', '旧密码不能为空'); }, trigger: 'blur' },
    { required: true, validator: checkPasswordInspect, trigger: 'blur' }
  ],
  newPassword: [
    { required: true, get message() { return t('page.system.user.profile.newPasswordIsRequired', '新密码不能为空'); }, trigger: 'blur' },
    { min: 6, get message() { return t('page.system.user.profile.enterAtLeast6Characters', '最少输入6个字符'); }, trigger: 'blur' },
    { required: true, validator: equalNewPassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, get message() { return t('page.system.user.profile.passwordConfirmationIsRequired', '确认密码不能为空'); }, trigger: 'blur' },
    { required: true, validator: equalToPassword, trigger: 'blur' }
  ]
});

/** 提交按钮 */
const submit = async () => {
  proxy.$refs.pwdRef.validate((valid) => {
    if (valid) {
      // const res = updateUserPwd(user.oldPassword, user.newPassword);
      // debugger
      // if(res.code==200){
      //   proxy.$modal.msgSuccess("修改成功");
      //   state.loginFailureDialog = true;
      //   state.failureType = 8;
      // }else{
      //   proxy.$modal.msgError(res.msg?res.msg:"更改失败、请重新提交");
      // }
      updateUserPwd(user.oldPassword, user.newPassword)
        .then((response) => {
          state.loginFailureDialog = true;
          state.failureType = 8;
        })
        .catch((err) => {
          proxy.$modal.msgError(t('page.system.user.profile.updateFailedPleaseTryAgain', '更改失败、请重新提交'));
        });
    }
  });
};
/** 关闭按钮 */
function close() {
  proxy.$tab.closePage();
}

const isSubmit = computed(() => {
  return (
    state.haveLength &&
    state.haveNum &&
    state.haveLowerCase &&
    user.confirmPassword == user.newPassword &&
    user.confirmPassword != '' &&
    user.newPassword != ''
  );
});

const customColorMethod = (percentage) => {
  if (percentage < 30) {
    return '#FA5555';
  }
  if (percentage < 60) {
    return '#e6a23c';
  }
  return '#67c23a';
};
const checkPassword = (str) => {
  if (str) {
    // 第一步先判断各分类长度
    let num = 0; // 数字
    let lowerCase = 0; // 小写字母
    let upperCase = 0; // 大写字母
    let special = 0; // 特殊字符
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c >= 48 && c <= 57) {
        // 数字
        num++;
      } else if (c >= 65 && c <= 122) {
        // 大写字母
        upperCase++;
        lowerCase++;
      } else {
        special++;
      }
    }

    if (num !== 0) {
      state.haveNum = true;
    } else {
      state.haveNum = false;
    }
    // if (upperCase !== 0) {
    //   state.haveUpperCase = true;
    // } else {
    //   state.haveUpperCase = false;
    // }
    if (lowerCase !== 0) {
      state.haveLowerCase = true;
    } else {
      state.haveLowerCase = false;
    }
    if (str.length >= 6) {
      state.haveLength = true;
    } else {
      state.haveLength = false;
    }

    // 第二步 计算分数
    let wholeMark = 0;
    let numMark = 0;
    let caseMark = 0;
    let specialMark = 0;
    let reward = 0;
    // 整长度分数
    if (str.length < 6) {
      wholeMark = 0;
    } else if (str.length >= 6 && str.length <= 8) {
      wholeMark = 10;
    } else if (str.length >= 9 && str.length <= 12) {
      wholeMark = 15;
    } else {
      wholeMark = 25;
    }
    // 奖励分数
    if ((lowerCase || upperCase) && num) {
      reward = 2;
      if (special) {
        reward = 3;
      }
      if (lowerCase && upperCase) {
        reward = 10;
      }
      if (lowerCase && upperCase && special) {
        reward = 15;
      }
    }
    // 字母分数
    if (lowerCase || upperCase) {
      caseMark = 10;
      if (lowerCase && upperCase) {
        caseMark = 25;
      }
    }
    // 数字分数
    if (num) {
      numMark = 15;
      if (num >= 3) {
        numMark = 20;
      }
    }
    // 符号分数
    if (special) {
      specialMark = 10;
      if (special > 1) {
        specialMark = 15;
      }
    }
    const totalMark = wholeMark + numMark + caseMark + specialMark + reward;
    state.totalMark = totalMark;
    let strength = '';
    if (totalMark < 25) {
      strength = t('page.system.user.profile.veryWeak', '非常弱');
    } else if (totalMark >= 25 && totalMark < 50) {
      strength = t('page.system.user.profile.weak', '弱');
    } else if (totalMark >= 50 && totalMark < 60) {
      strength = t('page.system.user.profile.fair', '一般');
    } else if (totalMark >= 60 && totalMark < 70) {
      strength = t('page.system.user.profile.strong', '强');
    } else if (totalMark >= 70 && totalMark < 80) {
      strength = t('page.system.user.profile.veryStrong', '非常强');
    } else if (totalMark >= 86 && totalMark < 90) {
      strength = t('page.system.user.profile.secure', '安全');
    } else {
      strength = t('page.system.user.profile.verySecure', '非常安全');
    }
    return strength;
  }
};
</script>
<style lang="less" scoped>
.showRules {
  display: flex;
  align-items: center;
}
</style>
