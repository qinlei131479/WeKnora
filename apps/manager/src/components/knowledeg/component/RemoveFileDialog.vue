<template>
    <el-dialog
        :model-value="props.modelValue"
        width="500"
        append-to-body
        @update:model-value="emits('update:modelValue', $event)"
        title="删除文件"
        class="remove-file-dialog"
    >
        <div class="content">
            <div>{{ props.content }}</div>
            <div>删除的内容将进入【回收站】，30天内可选择恢复</div>
        </div>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="cancel">取消</el-button>
                <el-button type="danger" @click="submitForm">删除</el-button>
            </span>
        </template>
        
    </el-dialog>
</template>

<script setup name="RemoveFileDialog">
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    content:{
        type: String,
        default: ''
    }
})

const emits = defineEmits(['update:modelValue', 'remove'])


const cancel = () => {
    emits('update:modelValue', false)
}

const submitForm = () => {
    emits('update:modelValue', false)
    emits('remove')
}
</script>
<style lang="less" scoped>
.content{
    font-weight: 400;
    font-size: 14px;
    color: #333333;
    line-height: 22px;
    text-align: left;
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