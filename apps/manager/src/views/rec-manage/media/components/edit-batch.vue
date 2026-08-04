<template>
  <div>
    <KJSCDialog v-model="state.dialogVisible" title="批量修改" width="50%" @submit-click="submitClick" @close="onClose">
      <el-form ref="saveForm" :model="state.saveInfo" label-width="100px" style="padding-right: 20px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="节目语种">
              <el-select v-model="state.saveInfo.language" placeholder="请选择节目语种" style="width: 100%">
                <!-- <el-option label="全部" value=""></el-option> -->
                <el-option
                  v-for="item in state.languageData"
                  :key="item.dictValue"
                  :label="item.dictLabel"
                  :value="item.dictValue"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属地区">
              <el-select v-model="state.saveInfo.originalCountry" placeholder="请选择节目所属地区" style="width: 100%">
                <!-- <el-option label="全部" value=""></el-option> -->
                <el-option
                  v-for="item in state.originalCountryData"
                  :key="item.dictValue"
                  :label="item.dictLabel"
                  :value="item.dictValue"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上映年份">
              <el-input v-model="state.saveInfo.releaseYear" clearable placeholder="请输入上映年份,如2022" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="首映日期">
              <el-date-picker
                v-model="state.saveInfo.orgAirDate"
                value-format="YYYYMMDD"
                type="date"
                style="width: 100%"
                placeholder="选择首映日期"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="节目评分" class="labelleft">
              <el-input-number
                v-if="state.isHidden"
                v-model="state.saveInfo.score"
                controls-position="right"
                maxlength="10"
                :min="0"
                style="width: 100%; text-align: left"
                :max="100"
                :precision="1"
                placeholder="请输入节目评分，如9.5"
                @change="handleChangeNumber(state.saveInfo.score, 'score')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="媒资分类">
              <el-select v-model="state.saveInfo.type" placeholder="请选择内容类型，支持多选" style="width: 100%">
                <el-option
                  v-for="item in state.pgmCategoryData"
                  :key="item.dictValue"
                  :label="item.dictLabel"
                  :value="item.dictValue"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="节目标签">
              <el-input
                v-model="state.saveInfo.pgmSndClass"
                clearable
                placeholder="请输入节目标签，多个请用英文分号隔开"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="导演">
              <el-input v-model="state.saveInfo.director" clearable placeholder="请输入导演，多个请用英文分号隔开" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="编剧">
              <el-input
                v-model="state.saveInfo.scriptWriter"
                clearable
                placeholder="请输入编剧，多个请用英文分号隔开"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="主演嘉宾">
              <el-input
                v-model="state.saveInfo.actorDisplay"
                clearable
                placeholder="请输入主演，多个请用英文分号隔开"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="拷贝保护">
              <el-select v-model="state.saveInfo.macrovision" placeholder="请选择有无拷贝保护" style="width: 100%">
                <el-option v-for="item in state.macrovisionData" :key="item.id" :label="item.name" :value="item.id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="清晰度">
              <el-select v-model="state.saveInfo.definitionFlag" placeholder="请选择清晰度" style="width: 100%">
                <el-option
                  v-for="item in state.definitionFlagData"
                  :key="item.dictValue"
                  :label="item.dictLabel"
                  :value="item.dictValue"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="授权时间">
              <el-date-picker
                v-model="state.licensingWindow"
                type="daterange"
                range-separator="-"
                start-placeholder="请选择授权开始时间"
                end-placeholder="请选择授权结束时间"
                format="YYYY-MM-DD"
                value-format="YYYYMMDDHHmmss"
                style="width: 100%"
                :disabled-date="disabledDate"
                @change="changeDate"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内容字号">
              <el-input
                v-model="state.saveInfo.contentCode"
                type="text"
                style="width: 100%"
                clearable
                maxlength="50"
                placeholder="请输入内容字号"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </KJSCDialog>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, reactive, watch, watchEffect, onMounted } from 'vue';
import KJSCDialog from '@/components/KJSCCmpt/KJSCDialogV2.vue';
import api from '@/utils/api';
import { ElMessage } from 'element-plus';
const props = defineProps({
  modelValue: {
    type: [Boolean],
    default: false
  },
  ids: {
    type: Array
  },
  source: {
    // 1单集，2子集，3剧集
    type: [String, Number],
    default: 1
  }
});

const emits = defineEmits(['done', 'update:modelValue']);
const saveForm = ref(null);

const state = reactive({
  doneRefresh: 0,
  dialogVisible: false,
  saveInfo: {},
  date1: [],
  licensingWindow: '', // 授权时间
  languageData: [],
  originalCountryData: [],
  definitionFlagData: [],
  pgmCategoryData: [],
  macrovisionData: [
    {
      id: 0,
      name: '无拷贝保护'
    },
    {
      id: 1,
      name: '有拷贝保护'
    }
  ],
  source: '',
  isHidden: false
});

const maxDateTime = new Date(2100, 0, 1, 0, 0, 0, 0).getTime();
const disabledDate = (time) => {
  return time.getTime() >= maxDateTime;
};

onMounted(() => {
  getLanguageType();
  getOriginalCountryType();
  getDefinitionFlagType();
  getPgmCategoryType();
});
// 获取媒资分类
const getPgmCategoryType = async () => {
  await api.dict.getDicByType('pgmCategory').then((res) => {
    state.pgmCategoryData = res.data;
  });
};
// 获取节目语种
const getLanguageType = async () => {
  await api.dict.getDicByType('language').then((res) => {
    state.languageData = res.data;
  });
};
// 获取所属地区
const getOriginalCountryType = async () => {
  await api.dict.getDicByType('originalCountry').then((res) => {
    state.originalCountryData = res.data;
  });
};
// 获取清晰度
const getDefinitionFlagType = async () => {
  await api.dict.getDicByType('definitionFlag').then((res) => {
    state.definitionFlagData = res.data;
  });
};
const handleChangeNumber = (e, param) => {
  //   // let value = e + '';
  //   // value = value.replace(/[^\-\d.]/g, ''); // 只能输入.和-和数字
  //   // value = value.replace(/^\./g, ''); // 第一个字符不能是.
  //   // value = value.replace(/\.{2,}/g, '.'); // 不能连续输入.
  //   // value = value.replace(/(\.\d+)\./g, '$1'); // .后面不能再输入.
  //   // value = value.replace(/(-)\./g, '$1'); // -后面不能输入.
  //   // value = value.replace(/(\d+|\.)-/g, '$1'); // 数字和.后面不能接-,不能出现类似11-, 12.-
  //   // value = value.replace(/-(0){2,}/g, '$1'); // 不能出现-00,-001,-0001类似
  //   // value = value.replace(/(-)0+(\d+)/g, '$1$2'); // 不能出现-01,-02类似
  //   // value = value.replace(/^0+(\d)/, '$1'); // 第一位0开头，0后面为数字，则过滤掉，取后面的数字
  //   // value = value.replace(/(\d{15})\d*/, '$1'); // 最多保留15位整数
  //   // value = value.replace(/(\.\d{1})\d*/, '$1'); // 最多保留1位小数
  state.saveInfo[param] = e;
};

const submitClick = () => {
  const params = { ...state.saveInfo };
  saveForm.value.validate(async (valid) => {
    if (valid) {
      if (state.source === 3) {
        await api.mediaCapital.batchUpdateDetailInfoBySeries(params).then((res) => {
          if (res.code === 200) {
            ElMessage({
              message: '修改成功',
              type: 'success'
            });
            state.doneRefresh = 1;
            closeClick();
          } else {
            ElMessage.error('修改失败');
          }
        });
      } else {
        await api.mediaCapital.batchUpdateDetailInfo(params).then((res) => {
          if (res.code === 200) {
            ElMessage({
              message: '修改成功',
              type: 'success'
            });
            state.doneRefresh = 1;
            closeClick();
          } else {
            ElMessage.error('修改失败');
          }
        });
      }
    }
  });
};

const closeClick = () => {
  state.dialogVisible = false;
};
const changeDate = (arr) => {
  state.saveInfo.licensingWindowStart = arr[0];
  state.saveInfo.licensingWindowEnd = arr[1];
};
const onClose = () => {
  state.saveInfo = {};
  state.licensingWindow = [];
  state.isHidden = false;
  const data = {
    refresh: state.doneRefresh
  };
  emits('done', data);
  state.doneRefresh = 0;
};
watch(
  () => {
    return state.visible;
  },
  (val) => {
    emits('update:modelValue', val);
  }
);

watchEffect(() => {
  state.dialogVisible = props.modelValue;
  state.saveInfo.ids = props.ids;
  state.source = props.source;
  if (props.modelValue) {
    state.saveInfo.score = undefined;
    setTimeout(() => {
      state.isHidden = true;
    }, 100);
  }
});
</script>
<script>
export default {
  name: 'EditBatch'
};
</script>

<style lang="less" scoped>
.labelleft {
  /deep/ .el-input__inner {
    text-align: left;
  }
}
</style>
