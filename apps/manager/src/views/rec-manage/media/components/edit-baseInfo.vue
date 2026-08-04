<template>
  <div>
    <el-form ref="saveForm" :model="state.saveInfo" label-width="120px" :rules="state.rules" :disabled="state.disabled">
      <el-row>
        <el-col :span="12">
          <el-form-item label="媒资名称" prop="name" class="labelleft">
            <el-input v-model="state.saveInfo.name" clearable placeholder="请输入媒资名称" maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属CP单位" class="is-required">
            <el-select
              v-if="!state.disabled"
              v-model="state.saveInfo.cpId"
              placeholder="请选择所属CP单位"
              disabled
              style="width: 100%"
            >
              <el-option v-for="item in state.cpData" :key="item.id" :label="item.name" :value="item.id"> </el-option>
            </el-select>
            <el-select
              v-else
              v-model="state.saveInfo.cpName"
              placeholder="请选择所属CP单位"
              disabled
              style="width: 100%"
            >
              <el-option v-for="item in state.cpData" :key="item.id" :label="item.name" :value="item.id"> </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <template v-if="state.source != 2">
        <!-- 单集、剧集 -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="索引字母" class="labelleft2">
              <el-input
                v-model="state.saveInfo.sortName"
                maxlength="100"
                clearable
                placeholder="请输入媒资名称数字或字母"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内容提供商" prop="contentProvider">
              <el-select v-model="state.saveInfo.contentProvider" placeholder="请选择内容提供商" style="width: 100%">
                <el-option
                  v-for="item in state.contentData"
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
          <el-col :span="24">
            <el-form-item label="搜索别名" class="labelleft2">
              <el-input
                v-model="state.saveInfo.searchName"
                clearable
                maxlength="100"
                placeholder="请输入节目别名，多个以英文逗号隔开"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>
      <template v-else>
        <!-- 子集 -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="集数" prop="volumnCount" class="labelleft">
              <el-input-number
                v-model="state.saveInfo.volumnCount"
                style="width: 100%"
                placeholder="请输入集数"
                :min="0"
                :max="9999999999"
                controls-position="right"
                @change="handleChangeNumber(state.saveInfo.volumnCount, 'volumnCount')"
              ></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <template v-if="state.source != 2">
        <el-row>
          <el-col :span="24">
            <el-form-item label="节目看点" prop="watchAttractive" class="labelleft">
              <el-input
                v-model="state.saveInfo.watchAttractive"
                :autosize="{ minRows: 4, maxRows: 8 }"
                type="textarea"
                maxlength="128"
                placeholder="请输入节目介绍，限128字以内"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <el-row>
        <el-col :span="24">
          <el-form-item label="节目介绍" prop="description" class="labelleft">
            <el-input
              v-model="state.saveInfo.description"
              :autosize="{ minRows: 4, maxRows: 8 }"
              type="textarea"
              maxlength="1000"
              placeholder="请输入节目介绍，限1000字以内"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="state.source != 2">
        <!-- 单集、剧集 -->
        <el-col :span="12">
          <el-form-item label="费用类型" class="labelleft2" prop="chargeType">
            <el-select v-model="state.saveInfo.chargeType" placeholder="请选择费用类型" style="width: 100%">
              <el-option v-for="item in state.chargeTypeData" :key="item.key" :label="item.value" :value="item.key">
              </el-option>
            </el-select> </el-form-item
        ></el-col>
        <el-col :span="12">
          <el-form-item label="列表定价" class="labelleft2">
            <el-input
              v-model="state.saveInfo.priceTaxIn"
              type="text"
              :min="0"
              style="width: 100%"
              placeholder="请输入订购全额，单位元支持2位小数"
              @input="
                state.saveInfo.priceTaxIn = state.saveInfo.priceTaxIn
                  .replace(/[^\d.]/g, '')
                  .replace(/^\./g, '')
                  .replace(/\.{2,}/g, '.')
                  .replace(/(\.\d+)\./g, '$1')
                  .replace(/(-)\./g, '$1')
                  .replace(/\-{2,}/g, '-')
                  .replace(/(\.\d+)\./g, '$1')
                  .replace(/(\d+|\.)-/g, '$1')
                  .replace(/(-)0+(\d+)/g, '$1$2')
                  .replace(/^0+(\d)/, '$1')
                  .replace(/(\d{15})\d*/, '$1')
                  .replace(/(\.\d{2})\d*/, '$1')
              "
            />
            <!-- <span style="color: #9a9a9a; font-size: 12px; margin-top: 8px">元，支持两位小数</span> -->
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-else>
        <!-- 子集 -->
        <el-col :span="12">
          <el-form-item label="内容字号" prop="contentCode" class="labelleft2">
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

      <el-row>
        <el-col :span="12">
          <el-form-item v-if="state.source == 3" label="总集数" class="labelleft2" prop="volumnCount">
            <el-input-number
              v-model="state.saveInfo.volumnCount"
              style="width: 100%"
              placeholder="请输入总集数(集)"
              :min="0"
              controls-position="right"
            ></el-input-number>
          </el-form-item>
          <el-form-item v-else label="时长(分钟)" class="labelleft2">
            <el-input-number
              v-model="state.saveInfo.duration"
              style="width: 100%"
              placeholder="请输入时长(分钟)"
              :min="0"
              controls-position="right"
              @change="handleChangeNumber(state.saveInfo.duration, 'duration')"
            ></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="state.source != 3" label="VR标识" class="labelleft2">
            <el-select v-model="state.saveInfo.vrFlag" placeholder="请选择VR标识" style="width: 100%">
              <el-option label="否" value="0" />
              <el-option label="是" value="1" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="state.source == 2">
        <el-col :span="12">
          <el-form-item label="片头" class="labelleft2">
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
          <el-form-item label="片尾" class="labelleft2">
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

      <el-row>
        <el-col :span="12">
          <el-form-item label="排序权重" class="labelleft2">
            <el-input
              v-model="state.saveInfo.sortWeight"
              type="text"
              :min="0"
              style="width: 100%"
              placeholder="请输入排序权重"
              @input="state.saveInfo.sortWeight = state.saveInfo.sortWeight.replace(/[^\d]/g, '')"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="state.disabled" :span="12">
          <el-form-item label="来源" class="labelleft2">
            <el-select v-model="state.saveInfo.mediaSourceType">
              <el-option
                v-for="item in state.mediaSourceTypeData"
                :key="'mediaSourceType_' + item.dictValue"
                :label="item.dictLabel"
                :value="+item.dictValue"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="媒资生效状态" class="labelleft2">
            <el-select v-model="state.saveInfo.status" clearable>
              <el-option label="失效" value="0"></el-option>
              <el-option label="生效" value="1"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col v-if="state.disabled" :span="12">
          <el-form-item label="更新人" class="labelleft2">
            <el-input :value="state.saveInfo.updateBy" type="text" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>
<script setup>
import { ref, reactive, watchEffect, onMounted, defineEmits, defineProps, defineExpose, nextTick } from 'vue';
import api from '@/utils/api';
import { chargeTypeData } from '@/utils/dict';
import { getMediaSourceTypeList } from '@/service/dict';

import useAppStore from "@/store/modules/app"
const appStore = useAppStore()

const emits = defineEmits(['callBack']);
const props = defineProps({
  saveInfo: {
    type: [Object]
  },
  disabled: {
    type: Boolean,
    default: false
  },
  source: {
    /**
     * 1单集，2子集，3剧集
     *
     * 2023年7月11日10:40:07补充：
     * 这是前端自己定义的，媒资那边后端定义的012
     * yuans
     */
    type: [String, Number],
    default: 1
  }
});

const saveForm = ref(null);
const state = reactive({
  testvalue: '',
  date1: [],
  labelPosition: 'center',
  saveInfo: {},
  componentsData: [],
  contentJSON: [],
  contentData: [],
  cpData: [],
  chargeTypeData,
  mediaSourceTypeData: getMediaSourceTypeList(),
  sortInfo: { orderByColumn: 'createTime', isAsc: 'desc' },
  rules: {
    name: [
      {
        required: true,
        message: '请输入媒资名称',
        trigger: ['blur', 'change']
      }
    ],
    cpId: [
      {
        required: true,
        message: '请选择所属CP单位',
        trigger: ['blur', 'change']
      }
    ],
    contentProvider: [
      {
        required: true,
        message: '请选择内容提供商',
        trigger: ['blur', 'change']
      }
    ],
    description: [
      {
        required: true,
        message: '请输入节目介绍',
        trigger: ['blur', 'change']
      }
    ],
    volumnCount: [
      {
        required: true,
        message: '请输入集数',
        trigger: ['blur', 'change']
      }
    ]
  },

  source: 1
});

watchEffect(() => {
  state.saveInfo = props.saveInfo;
  // state.saveInfo.status = state.saveInfo.status ? state.saveInfo.status : '1';
  // state.saveInfo.sortWeight = state.saveInfo.sortWeight ? state.saveInfo.sortWeight : 0;
  state.saveInfo.status =
    state.saveInfo.status !== '' && state.saveInfo.status !== null && state.saveInfo.status !== undefined
      ? state.saveInfo.status + ''
      : '1';
  state.disabled = props.disabled;
  state.source = props.source;
  state.saveInfo.cpId = state.saveInfo.cpId === undefined ? appStore.companyId : state.saveInfo.cpId;

  console.log(state.saveInfo);
});
const handleChangeNumber = (e, param) => {
  let value = e + '';
  value = value.replace(/[^\d]/g, '$1'); // 只能输入数字
  value = value.replace(/^0+(\d)/, '$1'); // 第一位0开头，0后面为数字，则过滤掉，取后面的数字
  value = value.replace(/(\d{15})\d*/, '$1'); // 最多保留15位整数
  state.saveInfo[param] = parseInt(value);
};

// 获取cp
const getCPData = async (value) => {
  const pageInfo = {
    pageSize: 50,
    pageNum: 1
  };
  const params = {
    keyWord: value,
    getAllData: true
  };
  await api.systemOrg.listAllOrgManage(params, pageInfo, state.sortInfo).then((res) => {
    state.cpData = res.data;
    if (!state.saveInfo.cpId) {
      state.saveInfo.cpId = appStore.companyId;
    }
    // if (!state.saveInfo.code) {
    //   state.saveInfo.cpId = appStore.companyId;
    // }
  });
};
// 获取内容提供商
const getContent = async () => {
  await api.dict.getContentProviderDict().then((res) => {
    state.contentData = res.data;
  });
};
const submitForm = () => {
  saveForm.value.validate(async (valid) => {
    emits('callBack', valid, 'baseInfo');
  });
};
onMounted(() => {
  state.saveInfo.sortWeight = state.saveInfo.sortWeight ? state.saveInfo.sortWeight : 0;
  nextTick(async () => {
    await getContent();
    await getCPData();
  });
});

// 抛出方法
defineExpose({
  submitForm
});
</script>

<style lang="less" scoped>
.labelleft {
  /deep/ .el-form-item__label {
    text-align: left;
    padding-left: 5px;
  }
  /deep/ .el-input__inner {
    text-align: left;
  }
}
.labelleft2 {
  /deep/ .el-form-item__label {
    text-align: left;
    padding-left: 15px;
  }
  /deep/ .el-input__inner {
    text-align: left;
  }
}

::v-deep input:disabled::-webkit-input-placeholder {
  -webkit-text-fill-color: rgba(255, 255, 255, 0);
}
::v-deep textarea:disabled::-webkit-input-placeholder {
  -webkit-text-fill-color: rgba(255, 255, 255, 0);
}
</style>
