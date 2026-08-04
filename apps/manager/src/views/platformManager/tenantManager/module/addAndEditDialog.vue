<template>
  <!-- 添加或修改租户对话框 -->
  <KJSCDialogV2
    :title="props.title"
    v-model="visible"
    width="600px"
    append-to-body
    :showCloseBtn="false"
    :showSubitBtn="false"
    @open="openDialog"
    @close="onClose"
  >
    <el-form :model="form" :rules="rules" ref="tenantRef" label-width="120px">
      <el-form-item label="租户名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入中文名称如：通用智能体中台"
          maxlength="15"
          show-word-limit
        />
      </el-form-item>
     
      <!-- <el-form-item label="并发限制" prop="qps">
        <el-input v-model="form.qps" placeholder="0-300整数数字">
          <template #append>次/秒</template>
        </el-input>
        <div>
          <span style="color: #fe595d; margin-right: 10px">!</span
          >系统最大并发上限300次/秒
        </div>
      </el-form-item>

      <el-form-item v-if="!isEdit" label="调用次数" prop="maxCallTimes">
        <el-input v-model="form.maxCallTimes" placeholder="请输入整数数字">
          <template #append>万次</template>
        </el-input>
      </el-form-item> -->

      <el-form-item label="生效时间" prop="effectiveTime">
        <el-date-picker
          v-model="form.effectiveTime"
          type="daterange"
          start-placeholder="起始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledDate"
          @change="handleChangeTime"
        ></el-date-picker>
      </el-form-item>

      <div v-if="!isEdit" class="add-form-create-box">
        <div class="add-form-create">
          <el-switch
            width="33"
            v-model="initialCreate"
            @change="changeInitialCreate"
          />
          <div class="add-form-create-text">租户初始管理员创建</div>
        </div>
        <div v-if="initialCreate">
          <el-form-item label="用户昵称" prop="initAdminUser.nickName">
            <el-input
              v-model="form.initAdminUser.nickName"
              placeholder="支持中文、数字、字母"
              maxlength="6"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="登录账号" prop="initAdminUser.userName">
            <el-input
              v-model="form.initAdminUser.userName"
              placeholder="支持数字、字母，推荐使用手机号"
              :disabled="form.id"
              maxlength="20"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="所属角色" prop="initAdminUser.roleId">
            <el-select
              style="width: 100%"
              v-model="form.initAdminUser.roleId"
              disabled
              placeholder="请选择角色"
            >
              <template #prefix>
                <el-tag
                  v-if="isInternalRole"
                  :key="form.roleKey"
                  size="small"
                  type="info"
                  effect="light"
                  >系统内置</el-tag
                >
              </template>
              <el-option
                v-for="item in roleOptions"
                :key="item.roleId"
                :label="item.roleName"
                :value="item.roleId"
              ></el-option>
            </el-select>
          </el-form-item>
          <div style="margin-left: 42px">
            <span style="color: #fe595d; margin-right: 5px">!</span
            >账号初始密码为{{ orginPwd }}
          </div>
        </div>
      </div>
    </el-form>
    <template #prefixFooter>
      <div class="dialog-footer">
        <kjsc-button @click="cancel">取 消</kjsc-button>
        <kjsc-button
          type="primary"
          @click="submitForm"
          :disabled="submitDisabled"
          >确认{{ isEdit ? "修改" : "新增" }}</kjsc-button
        >
      </div>
    </template>
  </KJSCDialogV2>
</template>

<script setup>
import KJSCDialogV2 from "@/components/KJSCCmpt/KJSCDialogV2.vue";
import api from "@/utils/api";
import { isEmpty, disabledDate } from "@/utils/common.js";
import { getRoleAllList } from "@/api/system/role";
import { getConfigKey } from "@/api/system/config";
import { checkUserNameValue } from "@/api/system/user";

const emits = defineEmits(["update:modelValue", "submitClick", "cancleClick"]);
const props = defineProps({
  modelValue: {
    type: [Boolean],
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
  dataId: {
    type: [String, Number],
    default: "",
  },
});

// 是否是内置角色
const isInternalRole = computed(() => {
  return form.value.builtin === 0;
});

const { proxy } = getCurrentInstance();

// 校验租户名称
const validateName = async (rule, value, callback) => {
  if (!value) {
    callback(new Error("租户名称不能为空"));
  } else {
    const regex = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;
    if (regex.test(value)) {
      // 接口调用
      let res = await api.tenantManager.isCheck(value, dataId.value);
      if (res.code == 200) {
        if (!res.data) {
          callback();
        } else {
          callback(new Error("租户名称重复，请重新输入"));
        }
      } else {
        callback(new Error(res.msg));
      }
    } else {
      callback(new Error("只能输入中文、数字、字母"));
    }
  }
};

// 校验调用次数
const validateMaxCallTimes = (rule, value, callback) => {
  if (!value) {
    callback(new Error("调用次数不能为空"));
  } else {
    const regex = /[^\d]/g;
    if (!regex.test(value)) {
      callback();
    } else {
      callback(new Error("只能输入整数数字"));
    }
  }
};

// 校验并发限制
const validateQps = (rule, value, callback) => {
  if (!value) {
    callback(new Error("并发限制不能为空"));
  } else {
    const pattern = /^(\d{1,3})?$/;
    if (!pattern.test(value)) {
      value = value.replace(/[^\d]/g, "");
      callback(new Error("只能输入0-300整数数字"));
    } else {
      if (value > 300) {
        value = 300;
      } else if (value < 0) {
        value = 0;
      }
      form.value.qps = value;
      callback();
    }
  }
};

// 校验登录账号
const validateUserName = async (rule, value, callback) => {
  if (!value) {
    callback(new Error("登录账号不能为空"));
  } else {
    if (form.value.userId) {
      callback();
    } else {
      const reg = /^[0-9a-zA-Z]*$/;
      if (reg.test(value)) {
        let res = await checkUserNameValue({ userName: value });
        if (res.code == 200) {
          if (!res.data) {
            callback();
          } else {
            callback(new Error("该登陆账号已被占用、请重新输入"));
          }
        } else {
          callback(new Error(res.msg));
        }
      } else {
        callback(new Error("只能输入数字和字母"));
      }
    }
  }
};

// 校验用户昵称
const validateNickName = (rule, value, callback) => {
  if (!value) {
    callback(new Error("用户昵称不能为空"));
  } else {
    const regex = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;
    if (regex.test(value)) {
      callback();
    } else {
      callback(new Error("只能输入中文、数字、字母"));
    }
  }
};

const roleOptions = ref([]);
const visible = ref(false);
const dataId = ref("");

const data = reactive({
  form: {
    name: undefined,
    maxCallTimes: undefined,
    effectiveTime: [],
    qps: undefined,
    initAdminUser: {
      nickName: undefined,
      userName: undefined,
      roleId: 152,
    },
  },
  initialCreate: false,
  orginPwd: "a123456",
  rules: {
    name: [{ required: true, validator: validateName, trigger: "blur" }],
    // maxCallTimes: [
    //   { required: true, validator: validateMaxCallTimes, trigger: "blur" },
    // ],
    // qps: [{ required: true, validator: validateQps, trigger: "blur" }],
    initAdminUser: {
      nickName: [
        { required: true, validator: validateNickName, trigger: "blur" },
      ],
      userName: {
        required: true,
        validator: validateUserName,
        trigger: "blur",
      },
      roleId: [
        {
          required: true,
          message: "所属角色不能为空",
          trigger: "change",
        },
      ],
    },
  },
});
const { form, rules, initialCreate, orginPwd } = toRefs(data);


// 时间选择
const handleChangeTime = (dates) => {
  if (dates == null ) {
    form.value.effectiveTime = [];
  }
};


watch(
  () => {
    return visible.value;
  },
  (val) => {
    emits("update:modelValue", val);
  }
);

watchEffect(() => {
  visible.value = props.modelValue;
  dataId.value = props.dataId || "";
  console.log("dataId", dataId.value);
});

watchEffect(() => {
  if (dataId.value) {
    getDetail();
  } else {
    form.value = {
      id: undefined,
      name: undefined,
      // maxCallTimes: undefined,
      // qps: undefined,
      effectiveTime: [],
      initAdminUser: {
        nickName: undefined,
        userName: undefined,
        roleId: 152,
      },
    };
    initialCreate.value = false;
    orginPwd.value = "";
  }
});

// 是否必填为空
const submitDisabled = computed(() => {
  if (isEdit.value) {
    // return isEmpty(form.value.name) || isEmpty(form.value.qps);
    return isEmpty(form.value.name);
  } else {
    return (
      isEmpty(form.value.name) ||
      // isEmpty(form.value.maxCallTimes) ||
      // isEmpty(form.value.qps)
      //  ||
      (initialCreate.value === true &&
        (isEmpty(form.value.initAdminUser.nickName) ||
          isEmpty(form.value.initAdminUser.userName) ||
          isEmpty(form.value.initAdminUser.roleId)))
    );
  }
});

// 是否是编辑
const isEdit = computed(() => {
  return dataId.value ? true : false;
});

const changeInitialCreate = () => {
  if (initialCreate.value === false) {
    form.value.initAdminUser = {
      nickName: undefined,
      userName: undefined,
      roleId: 152,
    };
  }
};

// 获取角色下拉
const getRoleList = async () => {
  let res = await getRoleAllList();
  if (res.code === 200) {
    roleOptions.value = res.data;
  }
};

/** 重置操作表单 */
const reset = () => {
  form.value = {
    id: undefined,
    name: "",
    // maxCallTimes: undefined,
    // qps: undefined,
    effectiveTime: [],
    initAdminUser: {
      nickName: undefined,
      userName: undefined,
      roleId: 152,
    },
  };
  initialCreate.value = false;
  orginPwd.value = "";
  dataId.value = "";
  proxy.resetForm("tenantRef");
};

/** 取消按钮 */
const cancel = () => {
  visible.value = false;
  emits("cancleClick");
};

/** 提交按钮 */
const submitForm = () => {
  proxy.$refs["tenantRef"].validate(async (valid) => {
    if (valid) {
      let res = {};
      if (form.value.effectiveTime && form.value.effectiveTime.length > 0) {
        form.value.auditServiceValidityStart = form.value.effectiveTime[0] + " 00:00:00";
        form.value.auditServiceValidityEnd = form.value.effectiveTime[1] + " 23:59:59";
      }else {
        form.value.auditServiceValidityStart = "";
        form.value.auditServiceValidityEnd = "";
      }

      if (form.value.id != undefined) {
        res = await api.tenantManager.edit(form.value);
      } else {
        res = await api.tenantManager.add(form.value);
      }
      if (res.code === 200) {
        proxy.$modal.msgSuccess("操作成功");
        emits("update:modelValue", false);
        emits("submitClick");
      } else {
        proxy.$modal.msgSuccess(res.msg || "操作失败，请重新提交");
      }
    }
  });
};

const openDialog = () => {
  getRoleList();
  getInitPassword();
};
const onClose = () => {
  reset();
}

const getDetail = async () => {
  let res = await api.tenantManager.getById(dataId.value);
  if (res.code === 200) {
    form.value = res.data;
    if(form.value.auditServiceValidityStart && form.value.auditServiceValidityEnd) {
      form.value.effectiveTime = [
        form.value.auditServiceValidityStart,
        form.value.auditServiceValidityEnd,
      ];
    }else {
      form.value.effectiveTime = [];
    }
  }
};

// 获取初始密码
const getInitPassword = async () => {
  let res = await getConfigKey("sys.user.initPassword");
  if (res.code === 200) {
    orginPwd.value = res.data || res.msg || "";
  }
};
</script>
<style lang="less" scoped>
.add-form-create-box {
  background: rgb(240, 240, 240);
  padding: 20px;
  box-sizing: border-box;
}
.add-form-create {
  height: 40px;
  margin-left: 20px;
  display: flex;
  ::v-deep .el-switch {
    width: 36px;
    height: 20px;
  }
}
.add-form-create-text {
  font-family: "思源黑体 CN";
  font-weight: 0;
  font-size: 14px;
  color: #8a8c9d;
  margin-left: 12px;
}
</style>
