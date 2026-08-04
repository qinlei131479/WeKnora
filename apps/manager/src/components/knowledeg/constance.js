export const libRoleType_Admin = 1;
export const libRoleType_View = 2;
export const libRoleType_Download = 3;
export const libRoleTypes = {
  admin: libRoleType_Admin,
  view: libRoleType_View,
  download: libRoleType_Download,
};

export const parseStatus_unzip = 0;
export const parseStatus_unzipSuccess = 1;
export const parseStatus_unzipFail = 2;
export const parseStatus_waitParse = 3;
export const parseStatus_parsing = 4;
export const parseStatus_parseOver = 5;

export const parseStatus = {
  unzip: parseStatus_unzip,
  zipSuccess: parseStatus_unzipSuccess,
  zipFail: parseStatus_unzipFail,
  waitParse: parseStatus_waitParse,
  parsing: parseStatus_parsing,
  parseOver: parseStatus_parseOver,
};

export const parseStatusList = [
  { label: "文件解压中", value: parseStatus_unzip },
  { label: "文件解压成功", value: parseStatus_unzipSuccess },
  { label: "解压失败", value: parseStatus_unzipFail },
  { label: "待解析", value: parseStatus_waitParse },
  { label: "解析中", value: parseStatus_parsing },
  { label: "解析完成", value: parseStatus_parseOver },
];

export function getParseStatusName(value) {
  for (let i = 0; i < parseStatusList.length; i++) {
    if (parseStatusList[i].value === value) {
      return parseStatusList[i].label;
    }
  }
  return parseStatusList[0].label;
}

export const parseLibStatusList = [
  { label: "待解析", value: 4, color: "#1BB999",progressColor:"#FFFFFF"},
  { label: "解析中", value: 5, color: "#236FD2",progressColor:"#236FD2" },
  { label: "解析失败", value: 7, color: "#E35D5D",progressColor:"#E35D5D"},
  { label: "解析完成", value: 6, color: "#666666" ,progressColor:"#236FD2"},
];

export function getStatusName(value) {
  for (let i = 0; i < parseLibStatusList.length; i++) {
    if (parseLibStatusList[i].value === value) {
      return parseLibStatusList[i].label;
    }
  }
  return parseLibStatusList[0].label;
}

export function getStatusColor(value) {
  for (let i = 0; i < parseLibStatusList.length; i++) {
    if (parseLibStatusList[i].value == value) {
      return parseLibStatusList[i].color;
    }
  }
  return parseLibStatusList[0].color;
}
export function getStatusProgressColor(value) {
  for (let i = 0; i < parseLibStatusList.length; i++) {
    if (parseLibStatusList[i].value == value) {
      return parseLibStatusList[i].progressColor;
    }
  }
  return parseLibStatusList[0].progressColor;
}
/* 
上传文件类型
一、支持文件类型至少包括：
  1）PDF（.pdf)、
  2）Office类（.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv）、
  3）纯文本类（.txt)、
  4）图像类（.jpeg,.jpg,.png,.gif,.bmp,.tiff）、
  5）视频类(.mp4,.avi,.mkv,.mov,.wmv)
  6) 音频类（.mp3,.aac,.wav）
以上类别，若有大模型解析时不支持的，应在导入文件时做转化（如可用ASR将音频转化为文本），以便进行有效解析；
*/
export const fileTypeArr = [
  ".pdf",
  // ".doc",
  ".docx",
  // ".ppt",
  ".pptx",
  // ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".jpeg",
  ".jpg",
  ".png",
  // ".gif",
  // ".bmp",
  // ".tiff",
  // ".mp4",
  // ".avi",
  // ".mkv",
  // ".mov",
  // ".wmv",
  // ".mp3",
  // ".aac",
  // ".wav",
  ".md",
];

export const getIconByFileType = (fileType) => {
  if (!fileType) return "word";
  if (fileType == "pdf") return "pdf";
  if (fileType == "doc" || fileType == "docx") return "word";
  if (fileType == "ppt" || fileType == "pptx") return "ppt";
  if (fileType == "xls" || fileType == "xlsx") return "excel";
  if (fileType == "csv") return "csv";
  if (fileType == "txt" || fileType == "md") return "txt";
  if (
    fileType == "jpeg" ||
    fileType == "jpg" ||
    fileType == "png" ||
    fileType == "gif" ||
    fileType == "bmp" ||
    fileType == "tiff"
  )
    return "image";
  if (
    fileType == "mp4" ||
    fileType == "avi" ||
    fileType == "mkv" ||
    fileType == "mov" ||
    fileType == "wmv"
  )
    return "video";
  if (fileType == "mp3" || fileType == "aac" || fileType == "wav")
    return "audio";
};
