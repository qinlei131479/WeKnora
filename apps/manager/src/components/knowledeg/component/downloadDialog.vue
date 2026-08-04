<template>
  <div class="libLogDialog_content" v-if="state.isClose">
    <div class="libLogDialog-dialog" id="libLogDialog-dialog">
        <div class="libLogDialog-dialogBox">
            <div class="dialogBox">
                <div class="header">
                    <div class="title">{{state.title}}</div>
                    <div class="iconItem">
                        <ArrowUp class="iconchild" v-if="!state.expand" @click="expandFn(true)"/>
                        <ArrowDown class="iconchild" v-if="state.expand" @click="expandFn(false)"/>
                        <Close  class="iconchild" @click="closeDialogBox"/>
                    </div>
                </div>
                <div class="content" v-if="!state.expand">
                    <div class="line"></div>
                    <div class="status">
                        <div class="status_left">
                            <div style="width:20px;height:22px;margin-right:8px">
                                <Refresh :style="{width:'20px',height:'22px',color:state.status==2?'#666666':'#236FD2'}"/>
                            </div>
                            <div style="margin-right:14px"><span>{{state.status==1?'解压中':(state.status==2?'已上传':'上传中')}}</span></div>
                            <div style="height:14px"><span :style="{color:state.status==2?'#333333':'#236FD2'}">{{state.fileNumSuccess}}</span><span>/{{state.fileNum}}</span></div>
                        </div>
                        <div class="status_right" @click="allOperate">
                            {{state.allStatusName}}
                        </div>
                    </div>
                    <div class="filecontentBorder">
                        <div class="filecontent" v-for="(item,index) in state.file" :key="index">
                            <div style="display: flex;align-items: center;">
                                <div style="width:16px;height:16px;margin-right:8px">
                                    <svg-icon
                                        style="width:16px;height:16px"
                                        :icon-class="getIconByFileType(checkFileType(item.name))"
                                        class="folder-icon"
                                        />
                                </div>
                                <div>
                                    <div>{{ item.name&&(item.name.length > 20? item.name.slice(0,20) + "...": item.name)}}</div>
                                    <div>{{bytesToMB(item.size*(item.percent/100))}}MB / {{bytesToMB(item.size)}}MB</div>
                                </div>
                            </div>
                            <div>
                                <div v-if="item.str==''" style="display: flex;align-items: center;">{{item.percent}}%<el-progress style="margin-left:8px" type="circle" :percentage="item.percent" :show-text="false" width="20" stroke-width="3"/></div>
                                <el-tooltip
                                    v-if="item.str=='上传失败'"
                                    class="box-item"
                                    effect="dark"
                                    content="重试"
                                    placement="top"
                                    >
                                    <el-icon style="width:16px;height:16px;cursor:pointer" @click="reTry(item)"><RefreshRight style="width:16px;height:16px;cursor:pointer"/></el-icon>
                                </el-tooltip>
                                <el-tooltip
                                    v-if="item.str=='上传排队'"
                                    class="box-item"
                                    effect="dark"
                                    content="取消上传"
                                    placement="top"
                                    >
                                    <el-icon style="width:16px;height:16px;cursor:pointer" @click="allOperate(1,index)"><Close  style="width:16px;height:16px;cursor:pointer"/></el-icon>
                                </el-tooltip>
                                <!-- <el-icon v-if="item.str=='上传失败'" ></el-icon>
                                <el-icon v-if="item.str=='上传排队'" ></el-icon> -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <el-dialog
      title="取消上传"
      :model-value="state.modelDialog"
      width="400px"
      append-to-body
    >
      <div>上传尚未完成。要取消所有正在进行的上传吗？</div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="state.modelDialog=false"> 继续上传 </el-button>
          <el-button @click="submitAdd">取消上传</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="downloadDialog">
import { ref } from 'vue';
import { inject,provide} from 'vue'
import { getIconByFileType } from "../constance.js";
const props = defineProps({
  dataInfo: {
    type: Object,
    default: {},
  },
})
const state = reactive({
    title:'上传文件',
    expand:false,
    status:3,//1解压中，2已上传，3上传中,
    // file:[{name:1111,percent:12,str:'上传排队',size:102400}],
    file:[],
    fileNum:0,
    fileTotal:0,
    isClose:false,
    allStatusName:'全部暂停',//全部暂停，继续上传
    fileNumError:0,
    fileNumSuccess:0,
    modelDialog:false,
    currentIndex:0
});
const emit = defineEmits(["changeUploadStatus","reTry"]);
const uploadFileAll = (data) => {
    state.file = data;
    state.isClose = true;
    nextTick(() => {
       document.getElementById("libLogDialog-dialog").style.height = state.file.length>2?'270px':(state.file.length>1?'210px':(state.file.length==1?'170px':'130px'))
    })
    state.fileNum = state.file.length;
}
const uploadFile = (file,percent,str,index) => {
    state.currentIndex = index;
    state.file.forEach(item => {
        if(item.uid === file.uid){
            item.percent = percent;
            item.str = str;
        }
    });
    state.file = state.file.filter(item => item.percent != 100);
    if(str=='上传失败'){
        state.fileNumError = state.fileNumError+1
    }
    state.fileNumSuccess = state.fileNum-state.file.length;
    console.log("status=="+str+"error==="+state.fileNumError+"=success===="+state.fileNumSuccess)
    if((state.fileNumError+state.fileNumSuccess)==state.fileNum){
        state.allStatusName = "继续上传";
        state.status = 2;
    }else{
        state.allStatusName = "全部暂停";
    }
    if(state.file.length==0){
        state.status = 2
    }
    nextTick(() => {
        document.getElementById("libLogDialog-dialog").style.height = state.file.length>2?'270px':(state.file.length>1?'210px':(state.file.length==1?'170px':'130px'))
    })
    // state.isClose = true;
    // state.fileTotal++
    // let item = state.file.filter(item => item.name === file.name);
    // if(item.length!=0){
    //     item.percent = percent;
    // }else{
    //     state.file.unshift({file:file,name:file.name,size:file.size,percent:item.percent})
    // };
    // if(percent==0){
    //     item.str = str;
    // }
    // if(percent==100){
    //     state.file = state.file.filter(item => item.name != file.name);
    //     state.fileNum = state.fileTotal-1;
    // }
    // let item2 = state.file.filter(item => item.str === ''||item.str === '上传排队');
    // if(item2.length==0){
    //     state.allStatusName = "继续上传";
    // }
    // state.fileTotal = state.file.length;
};
const checkFileType = (fileName)=>{
  const flieArr = fileName.split('.');
  const type = flieArr[flieArr.length - 1];
  return type
}
const allOperate = (type,index) => {
    if(type==1){
        emit('changeUploadStatus',index)
        return
    }
    if(state.allStatusName=='继续上传'){
        emit('changeUploadStatus',"going")
    }else{
        state.modelDialog = true
    }
}
const reTry = (file)=>{
    emit('reTry',file)
}
const submitAdd = ()=>{
    state.modelDialog=false
    emit('changeUploadStatus',"stop")
    state.allStatusName = "继续上传";
    state.status = 2;
}
defineExpose({
    uploadFile,
    uploadFileAll
})
const expandFn = (flag) => {
    state.expand = flag;
    if(state.expand){
        nextTick(() => {
            document.getElementById("libLogDialog-dialog").style.height = "60px";
        })
    }else{
        nextTick(() => {
            document.getElementById("libLogDialog-dialog").style.height = state.file.length>2?'270px':(state.file.length>1?'210px':(state.file.length==1?'170px':'130px'))
        })
    }
}
const bytesToMB = (bytes) => {
    return Math.round((bytes / (1024 * 1024)).toFixed(2));
}
const closeDialogBox = () => {
    state.isClose = false;
}
watchEffect(() => {
  state.dataInfo = props.dataInfo;
});
</script>

<style lang="less" scoped>
.libLogDialog_content{
    right: 0;
    bottom: 0;
    position: fixed;
    width: 440px;
    height: auto;
    overflow: auto;
    z-index: 99;
    .libLogDialog-dialog{
        position: fixed;
        right: 60px;
        bottom: 40px;
        width: 440px;
        overflow: auto;
        z-index: 99;
        height: 130px;
        box-shadow: 0px 6px 12px 1px rgba(0,0,0,0.16);
        border-radius: 12px 12px 12px 12px;
        border: 1px solid #F7F7F7;
        .libLogDialog-dialogBox{
            position: absolute;
            bottom: 0;
            right: 0;
            width: 440px;
            min-height: 50px;
            background: #FFFFFF;
            padding: 12px 24px 12px 24px;
            .dialogBox{
                overflow-y: auto;
                width: 100%;
                max-height: 240px;
                .header{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    .title{
                        font-family: Source Han Sans SC, Source Han Sans SC;
                        font-weight: 400;
                        font-size: 16px;
                        color: #333333;
                        text-align: left;
                        font-style: normal;
                        text-transform: none;
                    }
                    .iconItem{
                        :first-child{
                            margin-right: 13px;
                        }
                        svg{
                            color: #666666;
                            width: 20px;
                            height: 20px;
                            cursor: pointer;
                        }
                    }
                }
                .content{
                    margin: 16px 12px 12px;
                    font-weight: 400;
                    font-size: 12px;
                    .line{
                        border: 1px solid #E8E8E8;
                        width: 100%;
                    }
                    .status{
                        margin-top: 16px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        .status_left{
                            display: flex;
                            align-items: center;
                            height: 22px;
                            justify-content: space-between;
                        }
                        .status_right{
                            cursor: pointer;
                            color: #236FD2;
                        }
                    }
                    .filecontentBorder{
                        max-height: 148px;
                        overflow-y: auto;
                        overflow-x: hidden;
                    }
                    .filecontentBorder{

                    }
                    .filecontentBorder::-webkit-scrollbar {
                        width: 0 !important;
                    }
                    .filecontent{
                        display: flex;
                        margin-top: 18px;
                        justify-content: space-between;
                        align-items: center;
                    }
                }
            }
            :deep(.vuepress-markdown-body) {
                padding: 0;
                font-size: 14px;
            }
        }
    }
}
</style>