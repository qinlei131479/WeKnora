import { toHump } from "./common";
const files = import.meta.glob("../api/**/*.js", { eager: true });
let api: Record<string, Record<string, any>> = {};
Object.keys(files).forEach((fileName) => {
  let k = fileName.replace(/(.*\/)*([^.]+).*/gi, "$2");
  k = toHump(k);
  const exportObj = files[fileName] as Record<string, Record<string, any>>;
  api[k] = exportObj.default;
});

// 文件上传路径
const uploadUrl = "/file/upload";
const uploadBatchUrl = "/file/upload/batch";
const baseURL = import.meta.env.VITE_APP_BASE_API;
export const uploadFileUrl = baseURL + uploadUrl;
export const uploadBatchFileUrl = baseURL + uploadBatchUrl;

// // akp上传路径
// const uploadUrlApk = "/file/upload-apk";
// export const uploadFileUrlApk = baseURL + uploadUrlApk;

// const uploadUrlApkByZip = "/file/upload-apk-zip";
// export const uploadFileUrlApkByZip = baseURL + uploadUrlApkByZip;

// 图片上传路径
const uploadPhoto = "/file/upload-photo";
export const uploadFilePhoto = baseURL + uploadPhoto;

// // 用户组导入
// export const groupFileUrl = baseURL + "/business/epg-group/import";

// // 活动组导入
// export const activeFileUrl = baseURL + "/business/epg-activity-group/import";

// // 黑白名单导入
// export const blackWhiteFileUrl = baseURL + "/business/orderUserBlackWhite/import";

// // APK策略文件导入
// export const apkStrategyFileUrl = baseURL + "/epg-desktop/conApkPolicy/import";

export default {
  uploadFileUrl,
  uploadFilePhoto,
//   groupFileUrl,
//   blackWhiteFileUrl,
//   apkStrategyFileUrl,
//   activeFileUrl,
  ...api
} as Record<string, any>;
