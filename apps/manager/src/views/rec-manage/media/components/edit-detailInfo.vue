<template>
  <div class="edit-detailInfo" style="padding-right: 20px">
    <el-form ref="saveForm" :model="state.saveInfo" :rules="rules" label-width="80px" :disabled="state.disabled">
      <el-row>
        <el-col :span="12">
          <el-form-item label="节目语种" class="labelleft">
            <el-select v-model="state.saveInfo.language" placeholder="请选择节目语种" style="width: 100%">
              <el-option
                v-for="item in state.languageData"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属地区">
            <el-select v-model="state.saveInfo.originalCountry" placeholder="请选择节目所属地区" style="width: 100%">
              <el-option
                v-for="item in state.originalCountryData"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="上映年份" class="labelleft">
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
      </el-row>
      <el-row justify="space-between">
        <el-col :span="12">
          <el-form-item label="节目评分" class="labelleft">
            <el-input-number
              v-model="state.saveInfo.score"
              controls-position="right"
              clearable
              :min="0"
              :max="100"
              style="width: 100%; text-align: left"
              placeholder="请输入节目评分，如9.5"
              type="number"
              :precision="1"
              @change="handleChangeNumber(state.saveInfo.score, 'score')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="媒资分类" prop="type">
            <el-select v-model="state.saveInfo.type" placeholder="请选择媒资分类" style="width: 100%">
              <el-option
                v-for="item in state.pgmCategoryData"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="属性类型" class="labelleft">
            <el-select v-model="state.saveInfo.propertyType" placeholder="请选择属性类型" style="width: 100%">
              <el-option
                v-for="item in state.propertyTypeData"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="二级分类" class="labelleft">
            <el-input
              v-model="state.saveInfo.secondaryClassification"
              clearable
              placeholder="请输入媒资二级分类，多个请用英文分号隔开"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <!-- <el-col :span="24">
          <el-form-item label="节目标签" class="labelleft">
            <el-input v-model="state.saveInfo.tags" clearable placeholder="请输入节目标签，多个请用英文分号隔开" />
          </el-form-item>
        </el-col> -->
        <el-col :span="24">
          <el-form-item label="关键词" class="labelleft">
            <el-input v-model="state.saveInfo.keywords" clearable placeholder="请输入关键词，多个请用英文分号隔开" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="导演" class="labelleft">
            <el-input v-model="state.saveInfo.writerDisplay" clearable placeholder="请输入导演，多个请用英文分号隔开" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="编剧" class="labelleft">
            <el-input v-model="state.saveInfo.scriptWriter" clearable placeholder="请输入编剧，多个请用英文分号隔开" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="主演嘉宾" class="labelleft">
            <el-input v-model="state.saveInfo.actorDisplay" clearable placeholder="请输入主演，多个请用英文分号隔开" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="拷贝保护" class="labelleft">
            <el-select v-model="state.saveInfo.macrovision" placeholder="请选择有无拷贝保护" style="width: 100%">
              <el-option v-for="item in state.macrovisionData" :key="item.id" :label="item.name" :value="item.id">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="清晰度" prop="definitionFlag" class="labelleft2">
            <el-select v-model="state.saveInfo.definitionFlag" placeholder="请选择清晰度" style="width: 100%">
              <el-option
                v-for="item in state.definitionFlagData"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="片头" class="labelleft">
            <el-input-number
              v-model="state.saveInfo.headTime"
              style="width: 100%"
              placeholder="请输入片头，单位秒"
              :min="0"
              controls-position="right"
              @change="handleChangeNumber(state.saveInfo.headTime, 'headTime')"
            ></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="片尾" class="labelleft">
            <el-input-number
              v-model="state.saveInfo.endTime"
              style="width: 100%"
              placeholder="请输入片尾，单位秒"
              :min="0"
              controls-position="right"
              @change="handleChangeNumber(state.saveInfo.endTime, 'endTime')"
            ></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
      <!-- <el-row>
          <el-col :span="12">
            <el-form-item label="视屏字幕">
              <el-select v-model="saveInfo.ww" placeholder="请选择有无视屏字幕">
                <el-option 
                  v-for="item in date1"
                  :key="item.code"
                  :label="item.name"
                  :value="item.code"  
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分辨率类型">
              <el-select v-model="saveInfo.nn" placeholder="请选择分辨率">
                <el-option 
                  v-for="item in date1"
                  :key="item.code"
                  :label="item.name"
                  :value="item.code"  
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row> -->
    </el-form>
  </div>
</template>
<script setup>
import { ref, reactive, watchEffect, onMounted, defineProps } from 'vue';
import api from '@/utils/api';
const emits = defineEmits(['callBack']);
const props = defineProps({
  saveInfo: {
    type: [Object]
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const saveForm = ref(null);
const state = reactive({
  disabled: false,
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
  saveInfo: {},
  componentsData: [],
  contentJSON: [],
  languageData: [],
  originalCountryData: [],
  pgmCategoryData: [],
  definitionFlagData: [],
  propertyTypeData: []
});
const rules = {
  type: [
    {
      required: true,
      message: '请选择媒资分类',
      trigger: ['change']
    }
  ],
  definitionFlag: [
    {
      required: true,
      message: '请选择清晰度',
      trigger: ['change']
    }
  ]
};
// watch(() => {
//   return state.saveInfo;
// });
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
// 获取媒资分类
const getPgmCategoryType = async () => {
  await api.dict.getDicByType('pgmCategory').then((res) => {
    state.pgmCategoryData = res.data;
  });
};
// 获取属性类型
const getPropertyType = async () => {
  await api.dict.getDicByType('property_type').then((res) => {
    state.propertyTypeData = res.data;
  });
};
// 获取清晰度
const getDefinitionFlagType = async () => {
  await api.dict.getDicByType('definitionFlag').then((res) => {
    state.definitionFlagData = res.data;
  });
};
const handleChangeNumber = (e, param) => {
  if (param === 'score') {
    state.saveInfo[param] = e;
  } else {
    let value = e + '';
    value = value.replace(/[^\d]/g, '$1'); // 只能输入数字
    value = value.replace(/^0+(\d)/, '$1'); // 第一位0开头，0后面为数字，则过滤掉，取后面的数字
    value = value.replace(/(\d{15})\d*/, '$1'); // 最多保留15位整数
    state.saveInfo[param] = parseInt(value);
  }
};
watchEffect(() => {
  state.saveInfo = props.saveInfo;
  state.disabled = props.disabled;
});

onMounted(() => {
  getLanguageType();
  getOriginalCountryType();
  getPgmCategoryType();
  getPropertyType();
  getDefinitionFlagType();
});
const submitForm = () => {
  saveForm.value.validate(async (valid) => {
    emits('callBack', valid, 'detailInfo');
  });
};
// 抛出方法
defineExpose({
  submitForm
});
</script>

<style lang="less" scoped>
.labelleft {
  /deep/ .el-form-item__label {
    text-align: left;
    // padding-left: 5px;
  }
  /deep/ .el-input__inner {
    text-align: left;
  }
}

::v-deep input:disabled::-webkit-input-placeholder {
  -webkit-text-fill-color: rgba(255, 255, 255, 0);
}
</style>
