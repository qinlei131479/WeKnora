<template>
  <div class="user-info-head" @click="editCropper()">
    <!-- /src/assets/user/defalutIcon.jpg -->
    <img :src="options.img" class="img-circle img-lg" />
    <el-dialog :title="title" v-model="open" width="800px" append-to-body @opened="modalOpened" @close="closeDialog">
      <el-row>
        <el-col :xs="24" :md="12" :style="{ height: '350px' }">
          <vue-cropper
            ref="cropper"
            :img="options.img"
            :info="true"
            :autoCrop="options.autoCrop"
            :autoCropWidth="options.autoCropWidth"
            :autoCropHeight="options.autoCropHeight"
            :fixedBox="options.fixedBox"
            :outputType="options.outputType"
            @realTime="realTime"
            v-if="visible"
            @cropend="handleCrop"
          />
        </el-col>
        <el-col :xs="24" :md="12" :style="{ height: '350px' }">
          <div class="avatar-upload-preview">
            <img :src="options.previews.url" :style="options.previews.img" />
          </div>
        </el-col>
      </el-row>
      <br />
      <el-row>
        <el-col :lg="2" :md="2">
          <el-upload action="#" :http-request="requestUpload" :show-file-list="false" :before-upload="beforeUpload">
            <el-button>
              {{ $t('component.headerSearch.select', '选择') }}
              <el-icon class="el-icon--right"><Upload /></el-icon>
            </el-button>
          </el-upload>
        </el-col>
        <el-col :lg="{ span: 1, offset: 2 }" :md="2">
          <el-button icon="Plus" @click="changeScale(1)"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="Minus" @click="changeScale(-1)"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="RefreshLeft" @click="rotateLeft()"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="RefreshRight" @click="rotateRight()"></el-button>
        </el-col>
        <el-col :lg="{ span: 2, offset: 6 }" :md="2">
          <el-button type="primary" @click="uploadImg()" :loading="options.loading">{{ $t('page.system.user.profile.submit', '提 交') }}</el-button>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script setup>
import { t } from '@/i18n';
import 'vue-cropper/dist/index.css';
import { VueCropper } from 'vue-cropper';
import { uploadAvatar } from '@/api/system/user';
import useUserStore from '@/store/modules/user';
import api from '@/utils/api';
import { resolveStaticPath } from '@/utils';
const userStore = useUserStore();
const { proxy } = getCurrentInstance();

const open = ref(false);
const visible = ref(false);
const title = ref(t('page.system.user.profile.changeAvatar', '修改头像'));
const fileData = ref('');
//图片裁剪数据
const options = reactive({
  img: userStore.avatar, // 裁剪图片的地址
  autoCrop: true, // 是否默认生成截图框
  autoCropWidth: 200, // 默认生成截图框宽度
  autoCropHeight: 200, // 默认生成截图框高度
  fixedBox: true, // 固定截图框大小 不允许改变
  outputType: 'png', // 默认生成截图为PNG格式
  previews: {}, //预览数据
  loading: false
});

/** 编辑头像 */
function editCropper() {
  open.value = true;
}
/** 打开弹出层结束时的回调 */
function modalOpened() {
  visible.value = true;
}
/** 覆盖默认上传行为 */
function requestUpload() {}
/** 向左旋转 */
function rotateLeft() {
  proxy.$refs.cropper.rotateLeft();
}
/** 向右旋转 */
function rotateRight() {
  proxy.$refs.cropper.rotateRight();
}
/** 图片缩放 */
function changeScale(num) {
  num = num || 1;
  proxy.$refs.cropper.changeScale(num);
}
/** 上传预处理 */
function beforeUpload(file) {
  if (file.type.indexOf('image/') == -1) {
    proxy.$modal.msgError(t('page.system.user.profile.invalidFileFormatUploadAnImageSuchAsAJpg', '文件格式错误，请上传图片类型,如：JPG，PNG后缀的文件。'));
  } else {
    let type = file.type.split('image/');
    let typeList = ['png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG'];
    if (typeList.indexOf(type[1]) == -1) {
      proxy.$modal.msgError(t('page.system.user.profile.invalidFileFormatSelectAPngJpgOrJpegImage', '文件格式无效，请从新选择PNG、JPG、JPEG格式进行上传。'));
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    console.log(file);
    // debugger
    fileData.value = file;
    reader.onload = () => {
      options.img = reader.result;
    };
  }
}
function handleCrop(data) {}
/** 上传图片 */
// const uploadImg = async () => {
//   proxy.$refs.cropper.getCropBlob(async data => {
//     options.loading = true;
//     const file = new File([data], fileData.value.name, { type: data.type })
//     let res = await api.multimodalExperience.getStsToken();
//     res = res.data;
//     let formData = new FormData();
//     formData.append("success_action_status", "200"); // 指定成功上传时，服务端返回状态码200，默认返回204。
//     formData.append("policy", res.policy);
//     formData.append("signature", res.signature);
//     formData.append("OSSAccessKeyId", res.accessid);
//     formData.append("key", res.dir+file.name); // 文件名
//     formData.append("file", file); // file必须为最后一个表单域
//     const param = {
//         method: "POST",
//         body: formData,
//     };
//     const response = await fetch(res.host, param);
//     // uploadAvatar(formData).then(response => {
//       options.loading = false;
//       open.value = false;
//       options.img = res.host+'/'+res.dir+file.name;
//       userStore.avatar = options.img;
//       proxy.$modal.msgSuccess("更改成功");
//       visible.value = false;
//     // });
//   });
// }
function uploadImg() {
  proxy.$refs.cropper.getCropBlob((data) => {
    const formData = new FormData();
    formData.append('file', data, options.filename);
    options.loading = true;
    uploadAvatar(formData).then((response) => {
      const data = response.data || response || {};
      options.loading = false;
      open.value = false;
      userStore.avatar = resolveStaticPath(data.imgUrl || data.url || '');
      options.img = userStore.avatar;
      proxy.$modal.msgSuccess(t('page.normal.confirmInfo.updateSuccess', '修改成功'));
      visible.value = false;
      // console.log('data', data)
    });
  });
}
/** 实时预览 */
function realTime(data) {
  options.previews = data;
}
/** 关闭窗口 */
function closeDialog() {
  options.img = userStore.avatar;
  options.visible = false;
}
</script>

<style lang="scss" scoped>
.user-info-head {
  position: relative;
  display: inline-block;
  height: 120px;
}

.user-info-head:hover:after {
  content: '+';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  color: #eee;
  background: rgba(0, 0, 0, 0.5);
  font-size: 24px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  cursor: pointer;
  line-height: 110px;
  border-radius: 50%;
}
</style>
