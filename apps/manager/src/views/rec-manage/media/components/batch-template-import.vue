<template>
  <div class="dialog-style">
    <KJSCDialog
      v-model="state.visible"
      width="45%"
      :title="`${state.title}`"
      :show-subit-btn="false"
      :show-close-btn="false"
      @close="onClose"
      ><div class="content-style">
        <KJSCSteps :active="state.active" :item="state.stepList"></KJSCSteps>
        <div class="steps-conetnt">
          <div v-if="state.active === 0">
            <el-form
              ref="saveForm"
              label-width="120px"
              :model="state.templateInfo"
              :rules="state.rulesFirst"
              enctype="multipart/form-data"
            >
              <el-form-item label="选择类型：" prop="sourceType" class="form-style">
                <el-select v-model="state.templateInfo.sourceType" placeholder="全部">
                  <el-option
                    v-for="item in state.templateTypeData"
                    :key="item.dictValue"
                    :label="item.dictLabel"
                    :value="item.dictValue"
                  />
                </el-select>
                <div style="position: absolute; left: 200px; top: -10px">
                  <el-button text @click="downloadTemplate(0)"
                    ><el-icon> <Download /> </el-icon>点击下载全量字段模板
                  </el-button>
                  <el-button style="position: absolute; left: -12px; top: 25px" type="text" @click="downloadTemplate(1)"
                    ><el-icon> <Download /> </el-icon>点击下载必填字段模板
                  </el-button>
                </div>
              </el-form-item>
              <el-form-item label="文件上传：" prop="fileList" class="file-item-style">
                <el-upload
                  v-model="state.templateInfo.fileList"
                  :action="state.actionUpload"
                  accept="'.xlsx','.xls'"
                  :auto-upload="false"
                  :headers="state.headers"
                  :on-remove="handleRemove"
                  :on-change="handleSuccess"
                >
                  <el-button type="primary" plain
                    ><el-icon style="margin-right: 10px"> <Upload /> </el-icon>选择文件</el-button
                  >
                </el-upload>
                <div>
                  <div class="notice">请完善模版表格内容后上传xls格式的表格，表格大小不超过50MB</div>
                </div>
              </el-form-item>
            </el-form>
          </div>
          <div v-if="state.active === 1" style="text-align: center">
            <div class="progress-style">
              <el-progress :text-inside="true" :stroke-width="24" :percentage="state.progressPercentage" />
            </div>
            <div class="data-deatil">数据正在正在处理中，请勿关闭或刷新页面</div>
          </div>
          <div v-if="state.active === 2">
            <div style="text-align: center">
              <div class="icon-style"><Document class="icon-document" /></div>
              <div class="data-deal">数据处理{{ state.templateInfo.isSuccess ? '完成' : '失败' }}</div>
              <div class="data-deatil">
                <div v-if="state.templateInfo.isSuccess">
                  总计上传节目数据: {{ state.templateInfo.totalCount }}条，处理成功：<span style="color: #4b7902">{{
                    state.templateInfo.successCount
                  }}</span
                  >条，处理失败：<span style="color: #d9001b">{{ state.templateInfo.failCount }}</span
                  >条
                </div>
                <div v-else>上传表格数据格式存在问题，处理数据失败，请重新上传后再试。</div>
              </div>
            </div>
            <div v-if="state.templateInfo.isSuccess && state.templateInfo.failCount > 0" style="margin-left: 40px">
              <div>处理失败节目如下：</div>
              <div class="failed-programma">
                <div class="failed-style">{{ state.templateInfo.failList }}</div>
                <el-button text @click="downloadInventory"
                  ><el-icon> <Download /> </el-icon> 下载清单
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <div v-show="state.active !== 1" class="footer">
          <el-button type="primary" @click="submitClick">{{ state.subitBtnText }}</el-button>
          <el-button v-if="state.active === 0" type="default" @click="closeClick">取消</el-button>
          <el-button v-else type="default" @click="closeClick">关闭</el-button>
        </div>
      </div>
    </KJSCDialog>
  </div>
</template>
<script setup>
import { ref, reactive, defineEmits, watch, defineProps, watchEffect } from 'vue';
import KJSCDialog from '@/components/KJSCCmpt/KJSCDialogV2.vue';
import KJSCSteps from '@/components/KJSCCmpt/KJSCSteps.vue';
import { showMessage } from '@/utils/element-plus-message';
import api from '@/utils/api';
import { uploadFileUrl } from '@/utils/api';

const emits = defineEmits(['update:modelValue', 'close', 'done']);
const props = defineProps({
  modelValue: {
    type: [Boolean],
    default: false
  },
  info: {
    type: String,
    default: ''
  }
});
let timer = null;
const saveForm = ref(null);

const state = reactive({
  doneRefresh: 0,
  headers: { 'Content-Type': 'multipart/form-data;charset=UTF-8' },
  visible: false,
  title: '批量模版导入',
  subitBtnText: '上传导入媒资',
  actionUpload: uploadFileUrl,

  progressPercentage: 0,

  active: 0,
  stepList: [
    { id: 0, title: '上传文件', description: '完善表格模版后上传' },
    { id: 1, title: '处理数据', description: '批量处理表格中信息' },
    { id: 2, title: '完成处理', description: '显示处理结果' }
  ],

  templateInfo: {},
  templateTypeData: [],
  fileName: '',
  formData: '',
  inventoryBlob: '',
  rulesFirst: {
    sourceType: [
      {
        required: true,
        message: '请选择类型',
        trigger: 'change'
      }
    ],
    fileList: [
      {
        required: true,
        trigger: ['change', 'blur'],
        validator: (rule, value, callback) => {
          if (!value) {
            callback(new Error('请选择文件'));
          } else {
            callback();
          }
        }
      }
    ]
  }
});
watch(
  () => {
    return state.visible;
  },
  (val) => {
    emits('update:modelValue', val);
    if (val) {
      getTemplateTypeData();
    }
  }
);

watchEffect(() => {
  state.visible = props.modelValue;
});

// 类型下拉框
const getTemplateTypeData = async () => {
  const res = await api.templateImport.getTemplateTypeList();
  if (res.code === 200) {
    state.templateTypeData = res.data;
  } else {
    showMessage(res.msg, 'error', true);
  }
};

const onClose = () => {
  if (state.active === 0) {
    saveForm.value.resetFields();
  }
  clearInfo();
  const data = {
    refresh: state.doneRefresh
  };
  emits('done', data);
  state.visible = false;
  state.doneRefresh = 0;
};

// 关闭弹窗
const closeClick = () => {
  state.visible = false;
};

const clearInfo = () => {
  state.subitBtnText = '上传导入媒资';
  state.active = 0;
  state.progressPercentage = 0;
  clearInterval(timer);
  state.templateInfo = {};
  state.fileName = '';
  state.formData = '';
};

const submitClick = async () => {
  if (state.active === 0) {
    saveForm.value.validate(async (valid) => {
      if (valid) {
        state.active++;
        state.subitBtnText = '再次上传';
        const res = await api.templateImport.uploadFile(state.templateInfo.sourceType, state.formData);
        // .then((res) => {
        //   if (res.code === 555) {
        //     state.templateInfo.isSuccess = false;
        //     state.active++;
        //     state.progressPercentage = 0;
        //     clearInterval(timer);
        //   }
        // })
        // .catch(() => {
        //   state.templateInfo.isSuccess = false;
        //   state.active++;
        //   state.progressPercentage = 0;
        //   clearInterval(timer);
        // });
        if (res.code !== 200) {
          state.templateInfo.isSuccess = false;
          state.active++;
          state.progressPercentage = 0;
          clearInterval(timer);
        } else {
          state.doneRefresh = true;
        }
        timer = setInterval(() => {
          if (timer) {
            state.progressPercentage = state.progressPercentage + 10;
            if (state.progressPercentage === 90) {
              state.progressPercentage = 99;
              clearInterval(timer);
            }
            if (res.code === 200) {
              state.progressPercentage = 100;
              state.templateInfo = res?.data;
              state.templateInfo.isSuccess = true;
              clearInterval(timer);

              setTimeout(() => {
                state.active++;
              }, 1000);
            }
          }
        }, 500);
      } else {
        return false;
      }
    });
  } else if (state.active === 2) {
    clearInfo();
  }
};

// 下载当前类型模版
const downloadTemplate = async (baseType) => {
  /** 单独验证选择类型 */
  let valid = false;
  await saveForm.value.validateField('sourceType', (error) => {
    valid = error;
  });
  const fileName = state.templateTypeData.filter((item) => {
    return item.dictValue === state.templateInfo.sourceType;
  });
  const curFileName = `${fileName[0].dictLabel}${baseType === 0 ? '全量字段' : '必填字段'}模版`;
  if (valid) {
    await api.templateImport.downloadTemplate(state.templateInfo.sourceType, baseType, curFileName);
  }
};

// 上传成功之后
const handleSuccess = (uploadFile, uploadFiles) => {
  state.templateInfo.fileList = uploadFile;
  const formData = new FormData(); // 声明一个FormDate对象
  formData.append('file', uploadFile.raw);
  state.formData = formData;
  state.fileName = uploadFile.raw.name;
};

const handleRemove = (file, fileList) => {
  state.templateInfo.fileList = [];
  state.templateInfo.fileList = fileList;
};

const convertBase64ToBlob = (base64Info) => {
  const base64Arr = base64Info.split(',');
  let base64String = '';
  if (base64Arr.length > 1) {
    base64String = base64Arr[1];
  } else {
    base64String = base64Arr[0];
  }
  // 将base64解码
  const bytes = atob(base64String);
  const bytesCode = new ArrayBuffer(bytes.length);
  // 转换为类型化数组
  const byteArray = new Uint8Array(bytesCode);
  // 将base64转换为ascii码
  for (let i = 0; i < bytes.length; i++) {
    byteArray[i] = bytes.charCodeAt(i);
  }
  // 生成Blob对象（文件对象）
  return new Blob([bytesCode], { type: 'application/vnd.ms-excel;charset=utf-8' });
};

const downFileToLocal = (blob, fileName) => {
  const d = document.createElement('a');
  d.href = window.URL.createObjectURL(blob);
  d.download = fileName;
  d.style.display = 'none';
  document.body.appendChild(d);
  d.click();
  document.body.removeChild(d);
  window.URL.revokeObjectURL(d.href);
};

// 下载清单
const downloadInventory = async () => {
  const data = convertBase64ToBlob(state.templateInfo.failListBase64);
  downFileToLocal(data, state.fileName);
};
</script>
<style lang="less" scoped>
.dialog-style {
  ::v-deep(.el-dialog__footer) {
    padding: 0 !important;
  }
}
.content-style {
  padding: 0 20px;
  box-sizing: border-box;
  height: 450px;
}
.steps-conetnt {
  padding: 70px 0;
  box-sizing: border-box;
  height: calc(100% - 110px);
}
.footer {
  text-align: center;
  width: 100%;
}
.notice {
  font-size: 12px;
}
.form-style {
  padding: 10px 0;
  box-sizing: border-box;
  ::v-deep(.el-form-item__content) {
    display: grid;
  }
}
.icon-style {
  margin-bottom: 20px;
}
.icon-document {
  width: 40px;
  height: 40px;
  color: #409eff;
}
.data-deal {
  margin-bottom: 20px;
  font-size: 18px;
  color: #999999;
  font-weight: 200;
}
.data-deatil {
  margin-bottom: 30px;
  font-size: 13px;
  color: #797979;
  font-weight: 400;
}
.progress-style {
  margin-bottom: 20px;
  width: calc(100% - 20px);
  text-align: center;
}
.failed-programma {
  display: flex;
  align-items: center;
}
.failed-style {
  text-overflow: -o-ellipsis-lastline;
  overflow: hidden; //溢出内容隐藏
  text-overflow: ellipsis; //文本溢出部分用省略号表示
  display: -webkit-box; //特别显示模式
  -webkit-line-clamp: 1; //行数
  line-clamp: 1;
  -webkit-box-orient: vertical;
  margin: 0 10px;
}
.remove-close {
  margin-left: 10px;
  cursor: pointer;
  &:hover {
    color: #409eff;
  }
}
.file-item-style {
  ::v-deep(.el-form-item__content > div) {
    display: flex;
  }
  ::v-deep(.el-form-item__content > div > ul) {
    max-height: 120px;
    overflow: auto;
    margin: 0 0 5px 10px;
    align-items: center;
  }
  ::v-deep(.el-form-item__content > div > ul .el-upload-list__item:first-child) {
    margin-top: 0px;
  }
}
</style>
