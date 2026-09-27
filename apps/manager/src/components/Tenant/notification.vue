<template>
    <div></div>
</template>
<script setup name="notification" >
import { ElNotification } from 'element-plus'
import { t } from '@/i18n';
const props = defineProps({
    msg:{
        type:String,
        default:""
    },
    type:{
        type:Number,
        default:0
    },
    id:{
        type:String,
        default:''
    }
})
const state = reactive({
    type:0
})
const router = useRouter();
const emit = defineEmits(['done']);
watch(
    () => {
    return props.msg;
    },
    (val) => {},
    { immediate:true }
);
watchEffect(() => {
    if(props.msg){
        if(props.type==1){
            const ElNotification1 = ElNotification({
                title: '',
                message: props.msg,
                type: 'success',
                duration: 10000,
                onClick:function(){
                    // let routeUrl = router.resolve({path:'/exportManager'});
                    // window.open(routeUrl.href, '_blank');
                    router.replace({path:'/exportManager',query:{}});
                    ElNotification1.close();
                }
            })
        }else if(props.type==2){
            const ElNotification2 = ElNotification({
                title: '',
                message: props.msg+'<span style="color:#5677fc;cursor: pointer;">' + t('component.tenant.viewDetails', '点击查看') + '</span>',
                type: 'success',
                dangerouslyUseHTMLString: true,
                duration: 10000,
                onClick:function(){
                    router.replace({path:'/dataQuery',query:{id:props.id}});
                    ElNotification2.close();
                }
            })
        }
    }
    state.type = props.type;
    emit('done');
    // console.log(props.type,'==================props.type==========',props.msg,'=====================',state.type)
    // 处理中
    // if(props.type==0){
    //     ElNotification.closeAll();
    //     state.type = props.type;
    // }
    // ElNotification.closeAll();
    // if(props.type==1){
    //     ElNotification({
    //         title: '',
    //         message: props.msg,
    //         type: 'success',
    //         duration: 10000,
    //     })
    // }else if(props.type==2){//处理完成
    //     ElNotification({
    //         title: 'Success',
    //         message: props.msg,
    //         type: 'success',
    //         duration: 10000,
    //     })
    // }
});
</script>
<style lang="less">
    .el-notification{
        background: #FFFFFF;
        box-shadow: 0px 3px 10px 1px #CCCCDA;
        border-radius: 2px 2px 2px 2px;
        border: 1px solid #F3F3F4;
    }
    .el-notification__content{
        font-family: 思源黑体 CN;
        font-weight: 0;
        font-size: 14px;
        color: #8A8C9D;
        line-height: 22px;
        text-align: left;
        font-style: normal;
        text-transform: none;
    }
</style>
