import request, { getDownload } from '@/utils/request'
const api = {};
const API = '/media-capital/con-program';

// 模版类型下拉框
api.getTemplateTypeList = () => {
  return request.get(`/system/sys-dict-data/list-by-dic-type?dictType=media_template_import_type`);
};

// 下载模版表格 baseType: 0-全量 1-必填
api.downloadTemplate = (sourceType, baseType, filename) => {
  if (!filename) {
    filename = '表格模版';
  }
  filename += new Date().format('yyyyMMddHHmmss') + '.xlsx';
  const url = `${API}/exportTemplate?sourceType=${sourceType}&baseType=${baseType}`
  getDownload(url, filename)
  // return request
  //   .get(url, {
  //     responseType: 'blob'
  //   })
  //   .then((data) => {
  //     downloadFunction(data, filename);
  //   })
  //   .catch((r) => {
  //     console.error(r);
  //   });
};

// 上传导入媒资
api.uploadFile = (sourceType, params) => {
  return request.uploadFile(`${API}/import?sourceType=${sourceType}`, params);
};

export function downloadFunction(url, filename) {
  const content = url;
  const blob = new Blob([content]);
  if ('download' in document.createElement('a')) {
    const elink = document.createElement('a');
    elink.download = filename;
    elink.style.display = 'none';
    elink.href = URL.createObjectURL(blob);
    document.body.appendChild(elink);
    elink.click();
    URL.revokeObjectURL(elink.href);
    document.body.removeChild(elink);
  } else {
    navigator.msSaveBlob(blob, filename);
  }
}

export default {
  ...api
};
