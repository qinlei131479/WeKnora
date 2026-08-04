<template>
    <el-dialog
        :model-value="props.modelValue"
        width="500"
        append-to-body
        @update:model-value="emits('update:modelValue', $event)"
        :title="props.limitTitle"
        class="remove-file-dialog"
    >
        <div class="content">
            <div>该知识库有最大容量限制</div>
            <div style="color:red">{{ props.content }}</div>
            <div>届时请联系管理员处理！</div>
        </div>
        <template #footer>
            <span class="dialog-footer">
                <el-button type="danger" @click="submitForm">确定</el-button>
                <el-button @click="cancel">取消</el-button>
            </span>
        </template>
        
    </el-dialog>
</template>

<script setup name="limitFlieDialog">
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    content:{
        type: String,
        default: ''
    },
    limitTitle:{
        type: String,
        default: ''
    }
})

const emits = defineEmits(['update:modelValue', 'limit'])


const cancel = () => {
    emits('update:modelValue', false)
}

const submitForm = () => {
    emits('update:modelValue', false)
    emits('limit')
}
</script>
<style lang="less" scoped>
.content{
    font-weight: 400;
    font-size: 14px;
    color: #333333;
    line-height: 22px;
    text-align: center;
}

</style>
<style>
.remove-file-dialog{
    .el-dialog__header{
        border-bottom: 1px solid #E8E8E8;
        margin-right: 0;
    }
    .el-dialog__body{
        padding: 24px 32px 32px 32px;
    }
    .el-dialog__footer{
        padding: 0 32px 32px 32px;
    }
}
</style>