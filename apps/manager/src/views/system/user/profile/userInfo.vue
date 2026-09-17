<template>
  <el-form style="margin-top: 35px" ref="userRef" :model="user" :rules="rules" label-width="80px">
    <div class="text-center avatar-style">
      <userAvatar />
    </div>
    <div class="userid">用户ID&nbsp;{{ user.userId }}</div>
    <el-form-item label="用户昵称" prop="nickName">
      <el-input v-model="user.nickName" maxlength="6" show-word-limit />
    </el-form-item>
    <el-form-item label="登录账号" prop="userName">
      <el-input v-model="user.userName" maxlength="30" disabled />
    </el-form-item>
    <el-form-item label="所属租户" prop="tenantName">
      <el-input v-model="user.tenantName" maxlength="50" disabled />
    </el-form-item>
    <el-form-item label="所属角色" prop="roleName">
      <el-input v-model="user.roleName" maxlength="50" disabled />
    </el-form-item>
    <el-form-item>
      <div style="text-align: right; width: 100%">
        <el-button style="border-radius: 50px" type="primary" @click="submit" :disabled="user.nickName == ''" :loading="loading">更改资料</el-button>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup>
import userAvatar from './userAvatar';
import { updateUserProfile } from '@/api/system/user';
import { encrypt, decrypt } from '@/utils/jsencrypt';
import useUserStore from '@/store/modules/user';
import { removeFirstStaticPath } from '@/utils';

const props = defineProps({
  user: {
    type: Object
  }
});

const userStore = useUserStore();
const loading = ref(false);
const { proxy } = getCurrentInstance();

const rules = ref({
  nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  userName: [{ required: true, message: '登录账号不能为空', trigger: 'blur' }],
  tenantName: [{ required: true, message: '所属租户不能为空', trigger: 'blur' }],
  roleName: [{ required: true, message: '所属角色不能为空', trigger: 'blur' }]
});

/** 提交按钮 */
function submit() {
  loading.value = true;
  // decrypt(props.user.password)
  proxy.$refs.userRef.validate((valid) => {
    if (valid) {
      props.user.avatar = userStore.avatar;
      updateUserProfile(props.user).then(
        (response) => {
          userStore.avatarTop = userStore.avatar;
          loading.value = false;
          proxy.$modal.msgSuccess('更改成功');
        },
        (error) => {
          loading.value = false;
        }
      );
    } else {
      loading.value = false;
    }
  });
}
/** 关闭按钮 */
function close() {
  proxy.$tab.closePage();
}
</script>
<style scoped>
.avatar-style {
  width: 100%;
  height: 156px;
  display: flex;
  /* justify-content: center; */
  align-items: center;
}
.userid {
  margin-left: 90px;
  margin-top: -10px;
  margin-bottom: 20px;
  color: #747578;
  font-size: 14px;
}
</style>
