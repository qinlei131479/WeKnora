<template>
  <div>
    <div class="lib-folder-upload">
      <!-- <div v-if="state.isUploadLimit" style="text-align: center;padding: 24px;background: #f6f9ff;border-radius: 12px 12px 12px 12px;border: 1px solid #7ea1ff;">
        <el-button type="primary"
        @click="isshowLimit"
          ><el-icon style="margin-right: 8px"><Plus /></el-icon
          >选择文件</el-button
        >
        <div style="margin-top: 8px;font-weight: 400;font-size: 12px;color: #666666;">
          可直接拖拽文件至此次，支持批量导入，支持文本、图片、视频、音频、表格文件等常用文件类型
        </div>
      </div> -->
      <el-upload
          ref="upload"
          action="#"
          multiple
          drag
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleChange"
          v-model="state.fileList"
          class="upload-demo"
      >
        <template #trigger>
            <el-button type="primary"
              id="limitFileUpload"
            ><el-icon style="margin-right: 8px"><Plus /></el-icon
            >选择文件</el-button
          >
          <div class="el-upload__text">
            可直接拖拽文件至此次，支持批量导入，支持文本、图片、视频、音频、表格文件等常用文件类型
          </div>
        </template>
      </el-upload>
    </div>
    
    <!-- 限制提示弹窗 -->
    <LimitFlieDialog
      v-model="state.limitDialog"
      :content="state.limitContent"
      :limitTitle ="state.limitTitle"
      @limit="limitFile"
    />
    <!-- 进度显示 -->
    <!-- <div class="progress-box">
      <span>上传进度：{{ state.percent.toFixed() }}%</span>
      <el-button type="primary" size="small" @click="handleClickBtn">{{ state.upload ? '暂停' : '继续'}}</el-button>
    </div> -->
  </div>
</template>

<script  setup name="FileUploadDd">
import { createUploadTask,breakpointUpload,uploadTaskMerge,uploadCancel } from "@/api/knowledge/knowledgeApi";
import { fileTypeArr } from "../constance.js";
import LimitFlieDialog from "./limitFlieDialog.vue";
const props = defineProps({
  limitInfo: {
    type: Object,
    default: () => ({}),
  },
  libItem: {
    type: Object,
  },
  parentCode: {
    type: String,
  },
});
const state = reactive({
  percent: 0,
  fileUrl: '',
  upload: true,
  percentCount: 0,
  file: "",
  id:'',
  // 文件类型
  accept: fileTypeArr,
  fileList:[],
  loadIndex:0,
  loadStatus:'going',
  limitInfo:{},
  isUploadLimit:false,
  limitDialog:false,
  limitContent:'',
  limitTitle:'',
  timer:null,
  libItem:{}, 
  parentCode:''
})
const upload = ref(null);
const emit = defineEmits(["uploadFile","uploadFileAll","reflesh"]);
let isUploading = false;
let currentIndex = 0;
const { proxy } = getCurrentInstance();
const handleChange = async(file,fileList) => {
    if (!file) return
    const flieArr = file.name.split('.');
    const isType = state.accept.indexOf("."+flieArr[flieArr.length - 1]) > -1;
    if (!isType) {
      proxy.$modal.msgError('只能上传【' + state.accept.join('、') + '】类型的文件!');
      return
    }
    file.str = '上传排队';
    file.percent = 0;
    state.fileList.push(file);
    clearTimeout(state.time)
    state.timer = setTimeout(() => {
      state.timer = null
      console.log('防抖 高频触发后n秒内只会执行一次  再次触发重新计时')
      submitFiles()//说明此时change了所有文件了 可以上传了
    }, 1500)
}
async function submitFiles() {
  emit('uploadFileAll',state.fileList)
  if (!isUploading &state.fileList.length > 0) {
    isUploading = true;
    currentIndex = 0;
    uploadNextFile();
  }
}
async function uploadNextFile(param) {
  let file = {};
  if(param){
    file = param
  }else{
    file = state.fileList[currentIndex];
  }
  state.percent = 0
  state.percentCount = 0
  state.videoUrl = ''
  // 获取文件并转成 ArrayBuffer 对象
  const fileObj = file.raw
  state.file = fileObj
  let buffer
  try {
    buffer = await fileToBuffer(fileObj)
  } catch (e) {
    console.log(e)
  }
  // 将文件按固定大小（1M=1048576）进行切片，注意此处同时声明了多个常量
  const chunkSize = 1048576,
  chunkList = [], // 保存所有切片的数组
  chunkListLength = Math.ceil(fileObj.size / chunkSize), // 计算总共多个切片
  suffix = /\.([0-9A-z]+)$/.exec(fileObj.name)[1] // 文件后缀名
  // 根据文件内容生成 hash 值
  // const spark = new SparkMD5.ArrayBuffer()
  // spark.append(buffer)
  // const hash = spark.end()

  // 生成切片，这里后端要求传递的参数为字节数据块（chunk）和每个数据块的文件名（fileName）
  let curChunk = 0 // 切片时的初始位置
  for (let i = 0; i < chunkListLength; i++) {
    const item = {
      chunk: i,
      file: fileObj.slice(curChunk, curChunk + chunkSize)
    }
    curChunk += chunkSize
    chunkList.push(item)
  }
  state.chunkList = chunkList // sendRequest 要用到
  // state.hash = hash // sendRequest 要用到
  createUpload();
}
function finishAllUploads() {
  isUploading = false;
  currentIndex = 0;
  console.log('全部文件已上传完毕');
  state.fileList = [];
}
const fileToBuffer = async(file) => {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = e => {
      resolve(e.target.result)
    }
    fr.readAsArrayBuffer(file)
    fr.onerror = () => {
      reject(new Error('转换文件格式发生错误'))
    }
  })
}
const changeUploadStatusFn = async(type) => {
  state.loadStatus = (type=='going'?'going':'stop');
  if(type=='going'){
    if (currentIndex < state.fileList.length) {
      uploadNextFile(); // 如果还有未处理的文件，则调用本函数
    } else {
      finishAllUploads();
    }
    if(state.fileList.length==0){
      upload.value.clearFiles();
      document.getElementById("limitFileUpload").click();
    }
  }else if(type=='stop'){
    const flag = state.fileList[currentIndex].percent!=100;
    state.fileList = [];
    currentIndex = 0;
    emit('uploadFileAll',state.fileList)
    if(flag&&state.id){
      await uploadCancel({dataList:[state.id]});
    }
  }else{
    state.loadStatus = "going";
    state.fileList.splice(type, 1);
    emit('uploadFileAll',state.fileList)
    if(state.fileList[type].id){
      state.loadStatus = "stop";
      await uploadCancel({dataList:[state.id]});
    }
  }
}
const createUpload = async(file) => {
  if(state.file.size==0){
    emit('uploadFile',state.file,0,'上传失败',currentIndex)
    currentIndex = currentIndex+1;
    if (currentIndex < state.fileList.length) {
      uploadNextFile(); // 如果还有未处理的文件，则调用本函数
    } else {
      finishAllUploads();
    }
    return
  }
  let params= {
    "fileName": state.file.name,
    "knowledgeId": props.libItem?.id,
    "parentCode": state.parentCode
  }
  let res = await createUploadTask(params);
  if(res.code==200){
    state.id = res.data.id;
    state.fileList[currentIndex].id = state.id ;
    sendRequest();
  }
}
const sendRequest = async(res) => {
    const requestList = [] // 请求集合
    for (let index = 0; index < state.chunkList.length; index++) {
      const item = state.chunkList[index];
      const fn = () => {
        const formData = new FormData()
        formData.append('chunk', item.chunk)
        formData.append('file', item.file)
        formData.append('id', state.id)
        return breakpointUpload(formData).then(res => {
            console.log("file========",index)
            if (res.code === 200) { // 成功
              if (state.percentCount === 0) { // 避免上传成功后会删除切片改变 chunkList 的长度影响到 percentCount 的值
                state.percentCount = 100 / state.chunkList.length
              }
              if (state.percent >= 100) {
                state.percent = 100;
              }else {
                state.percent += state.percentCount // 改变进度
              }
              if (state.percent >= 100) {
                state.percent = 100;
              }
              state.chunkList.splice({},index, 1) // 一旦上传成功就删除这一个 chunk，方便断点续传
              emit('uploadFile',state.file,state.percent,'',currentIndex)
            }else{
              emit('uploadFile',state.file,state.percent,'上传失败',currentIndex)
              currentIndex = currentIndex+1;
              if (currentIndex < state.fileList.length) {
                uploadNextFile(); // 如果还有未处理的文件，则调用本函数
              } else {
                finishAllUploads();
              }
            }
        }).catch(() => { 
            emit('uploadFile',state.file,state.percent,'上传失败',currentIndex)
            currentIndex = currentIndex+1;
            if (currentIndex < state.fileList.length) {
              uploadNextFile(); // 如果还有未处理的文件，则调用本函数
            } else {
              finishAllUploads();
            }
        });
      }
      requestList.push(fn)
    }
    let i = 0;// 记录发送的请求个数
    // 文件切片全部发送完毕后，需要请求 '/merge' 接口，把文件的 hash 传递给服务器
    const complete = async() => {
      await uploadTaskMerge({id:state.id}).then(res => {
        emit('reflesh')
        currentIndex = currentIndex+1;
        if (currentIndex < state.fileList.length) {
          uploadNextFile(); // 如果还有未处理的文件，则调用本函数
        } else {
          finishAllUploads();
        }
      })
    }
    const send = async () => {
      if (!state.upload) return
      if(state.loadStatus=='stop'){
        return;
      }
      if (i >= requestList.length) {
        // 发送完毕
        complete()
        return
      }
      await requestList[i]()
      i++
      send()
    }
    send() // 发送请求
}
const importFile = () => {
   if(state.limitInfo.maxLevel==-1&&state.limitInfo.maxFolder==-1&&state.limitInfo.maxSize==-1){
      state.isUploadLimit = false;
    }else{
      state.isUploadLimit = true;
    }
}
const isshowLimit = () => {
  state.limitDialog = true;
  state.limitTitle = "上传提示";
  state.limitContent = `若超出最大容量，将无法成功上传文件`;
}
const limitFile = () => {
  state.limitDialog = false;
  state.isUploadLimit = false;
  nextTick(() => {
      document.getElementById('limitFileUpload').click();
    })
}
const reTryFn = (row) => {
  if(row.size==0){
    proxy.$modal.msgError(row.str);
    return
  }
  if(isUploading){
    proxy.$modal.msgError('队列中的文件暂未上传完毕，请稍后重试');
    return
  }
  uploadNextFile(row)
}
watchEffect(() => {
  if(props.limitInfo){
    state.limitInfo = props.limitInfo;
    if(state.limitInfo.maxLevel==-1&&state.limitInfo.maxFolder==-1&&state.limitInfo.maxSize==-1){
      state.isUploadLimit = false;
    }else{
      state.isUploadLimit = true;
    }
  }
  if(props.parentCode){
    state.parentCode = props.parentCode;
  }
  state.isUploadLimit = false
})
defineExpose({
    changeUploadStatusFn,
    reTryFn
})
</script>

<style scoped>
.lib-folder-upload {
  width: 100%;
  height: 109px;
}
.progress-box {
  box-sizing: border-box;
  width: 360px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding: 8px 10px;
  background-color: #ecf1ff;
  font-size: 14px;
  border-radius: 4px;
}
.uploadWrapper {
  width: 360px;
}
</style>
<style>
.upload-demo {
  width: 100%;
  height: 109px;
  margin-top: 32px;
  .el-upload {
    .el-upload-dragger {
      padding: 24px;
      background: #f6f9ff;
      border-radius: 12px 12px 12px 12px;
      border: 1px solid #7ea1ff;
    }
  }
  .el-upload__text {
    margin-top: 8px;
    font-weight: 400;
    font-size: 12px;
    color: #666666;
  }
}
</style>