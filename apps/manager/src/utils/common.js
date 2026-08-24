import { resolveStaticPath } from './index';
// 图片类型
export const imgTypeArr = ['png', 'jpeg', 'jpg', 'gif', 'PNG', 'JPEG', 'JPG'];
// export const imgTypeArr2 = ['jpg', 'png', 'gif'];
// // 视频类型
// export const videoTypeArr = ['mp4'];
/**
 * 验证文件类型及其大小
 * @param {*} file 文件
 * @param {*} fileSize 限制的大小
 * @param {*} typeArr 允许的文件类型，默认是图片。
 * @returns
 */
export const checkFileTypeAndSize = (file, fileSize, typeArr) => {
  if (!typeArr) {
    typeArr = imgTypeArr;
  }
  const flieArr = file.name.split('.');
  const res = {};
  res.isType = typeArr.indexOf(flieArr[flieArr.length - 1]) > -1;
  res.isLt = file.size / 1024 / 1024 <= fileSize;
  return res;
};

// 静态资源添加前缀
export function getFilesUrl(url) {
  // if (!url) {
  //   return "";
  // }
  // let filesUrl = import.meta.env.VITE_APP_FILES_URL;
  // if (url.startsWith("http")) {
  //   filesUrl = "";
  // } else {
  //   if (!url.startsWith("/")) {
  //     filesUrl += "/";
  //   }
  // }
  // return filesUrl + url;
  return resolveStaticPath(url);
}

// 通过a标签下载文件
export function download(url, filename) {
  const link = document.createElement("a");
  link.style.display = "none";
  link.href = url;
  link.target = "_blank";
  if (filename) {
    link.download = filename;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 只能选择当前时间之后的时间
export const disabledDate = (time) => {
  if (time.getTime() < Date.now() - 8.64e7) {
    return true;
  } else {
    return false;
  }
};

// 时间选择限制3个月内
export const disabledDate3Month = (time) => {
  if (time.getTime() > new Date().getTime()) {
    return time.getTime() >= new Date().getTime(); // 时间范围必须是时间戳
  } else {
    return time.getTime() < Date.now() - 90 * 8.64e7; // 8.64e7就是一天的时间戳
  }
};
// 时间选择限制不可选择一年之前
export const disabledDateLastYear = (time) => {
  // if (time.getTime() > new Date().getTime()) {
  //   // return time.getTime() >= new Date().getTime(); // 时间范围必须是时间戳
  // } else {
  //   return time.getTime() < Date.now() - (daysSinceNewYear()) * 8.64e7; // 8.64e7就是一天的时间戳
  // }
  return time.getTime() < new Date().getTime() - 31536000000;
};
//计算今年过去了多少天
export const daysSinceNewYear = () => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const diff = now - yearStart;
  return diff / (1000 * 60 * 60 * 24);
};
export const getDate = (time) => {
  var dateDay = new Date(time);
  dateDay.setDate(dateDay.getDate() - 89); //获取dayNum天后的日期
  console.log(dateDay);
  var y = dateDay.getFullYear();
  var m =
    dateDay.getMonth() + 1 < 10
      ? "0" + (dateDay.getMonth() + 1)
      : dateDay.getMonth() + 1; //获取当前月份的日期，不足10补0
  var d = dateDay.getDate() < 10 ? "0" + dateDay.getDate() : dateDay.getDate(); //获取当前几号，不足10补0
  return y + "-" + m + "-" + d;
};
export const DateDiff = (start, end) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  let days = 0;
  if (endTime > startTime) {
    days = parseInt(Math.abs(endTime - startTime) / 1000 / 60 / 60 / 24);
  } else {
    days = parseInt(Math.abs(endTime - startTime) / 1000 / 60 / 60 / 24); // 如果不限制对比时间和当前时间大小可以不用if
  }
  return days;
};

// 获取昨天日期
export const getYesterday = () => {
  let date = new Date();
  const yesterday = new Date(date);
  yesterday.setDate(date.getDate() - 1);
  yesterday.setTime(yesterday.getTime() - 24 * 60 * 60 * 1000);
  let Y1 = yesterday.getFullYear();
  let M1 =
    yesterday.getMonth() + 1 > 10
      ? yesterday.getMonth() + 1
      : yesterday.getMonth() + 1 == 10
      ? yesterday.getMonth() + 1
      : "0" + (yesterday.getMonth() + 1);
  let D1 =
    yesterday.getDate() > 10
      ? yesterday.getDate() + 1
      : yesterday.getDate() + 1 == 10
      ? yesterday.getDate() + 1
      : "0" + (yesterday.getDate() + 1);
  let timer1 = Y1 + "-" + M1 + "-" + D1; // 当前时间
  return [timer1, timer1];
};

// 获取当天日期
export const getToday = () => {
  let today = new Date();

  // 获取年、月、日
  let year = today.getFullYear();
  let month = today.getMonth() + 1; // getMonth() 返回的月份是从0开始的，所以需要+1
  let day = today.getDate();

  // 格式化日期，确保月份和日期为两位数
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  let formattedDate = year + "-" + month + "-" + day;
  return [formattedDate, formattedDate];
};

// 默认获取当前时间前30天的日期，包括当前日期
export const get30Days = () => {
  let date = new Date();
  const oneMonth = new Date(date);
  oneMonth.setDate(date.getDate() - 30); //获取dayNum天后的日期
  let Y1 = oneMonth.getFullYear();
  let M1 =
    oneMonth.getMonth() + 1 > 10

      ? oneMonth.getMonth() + 1 
      : oneMonth.getMonth() + 1 == 10
      ? oneMonth.getMonth() + 1
      : "0" + (oneMonth.getMonth() + 1);
  let D1 =
    oneMonth.getDate() > 10
      ? oneMonth.getDate()
      : oneMonth.getDate() == 10
      ? oneMonth.getDate()
      : "0" + oneMonth.getDate();
  let timer1 = Y1 + "-" + M1 + "-" + D1; // 当前时间

  let time2 = new Date();
  let Y2 = time2.getFullYear();
  let M2 = time2.getMonth() + 1 > 10
      ? time2.getMonth() + 1
      : time2.getMonth() + 1 == 10
      ? time2.getMonth() + 1
      : "0" + (time2.getMonth() + 1);
  let D2 =  time2.getDate() > 10
      ? time2.getDate()
      : time2.getDate() == 10
      ? time2.getDate()
      : "0" + time2.getDate();
  let timer2 = Y2 + "-" + M2 + "-" + D2; // 当前时间
  return [timer1, timer2];
}

// 获取当前时间前7天的日期
export const getSevenDayDate = () => {
  // 拼接时间
  let date = new Date();
  const oneMonth = new Date(date);
  oneMonth.setDate(date.getDate() - 7); //获取dayNum天后的日期
  let Y1 = oneMonth.getFullYear();
  let M1 = oneMonth.getMonth() + 1 > 10
      ? oneMonth.getMonth() + 1
      : oneMonth.getMonth() + 1 == 10
      ? oneMonth.getMonth() + 1
      : "0" + (oneMonth.getMonth() + 1);
  let D1 = oneMonth.getDate() > 10
      ? oneMonth.getDate()
      : oneMonth.getDate() == 10
      ? oneMonth.getDate()
      : "0" + oneMonth.getDate();
  let timer1 = Y1 + "-" + M1 + "-" + D1; // 当前时间

  let time2 = new Date();
  let Y2 = time2.getFullYear();
  let M2 = time2.getMonth() + 1 > 10
      ? time2.getMonth() + 1
      : time2.getMonth() + 1 == 10
      ? time2.getMonth() + 1
      : "0" + (time2.getMonth() + 1);
  let D2 =  time2.getDate() > 10
      ? time2.getDate()
      : time2.getDate() == 10
      ? time2.getDate()
      : "0" + time2.getDate();
  let timer2 = Y2 + "-" + M2 + "-" + D2; // 当前时间
  return [timer1, timer2];
}

// 数据流下载
export function downloadDataStream(url, fileName) {
  const a = document.createElement("a");
  a.download = fileName || `下载`;
  a.style.display = "none";
  a.target = "_blank";
  // a.href = window.location.origin + url;
  console.log("process.env.VITE_APP_ENV=>", import.meta.env.VITE_APP_ENV);
  a.href =
    (import.meta.env.VITE_APP_ENV === "development"
      ? "http://192.168.180.249:8899"
      : window.location.protocol +
        "//" +
        window.location.hostname +
        ":" +
        window.location.port) + url;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href); // 释放URL 对象
  document.body.removeChild(a);
}

// 判断字符串是否为空
export const isEmpty = (val) => {
  return val === null || val === undefined || val === "";
};


// 日期范围选择，快捷选择配置 带上时分秒
export const daterangeShortcuts2 = [
  {
    text: '一周内',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 6);
      const date = start.getFullYear() + '-' + (start.getMonth() + 1) + '-' + start.getDate();
      const date2 = end.getFullYear() + '-' + (end.getMonth() + 1) + '-' + end.getDate();
      const start2 = date + ' 00:00:00';
      const end2 = date2 + ' 23:59:59';
      return [start2, end2];
    }
  },
  {
    text: '一个月内',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 29);
      const date = start.getFullYear() + '-' + (start.getMonth() + 1) + '-' + start.getDate();
      const date2 = end.getFullYear() + '-' + (end.getMonth() + 1) + '-' + end.getDate();
      const start2 = date + ' 00:00:00';
      const end2 = date2 + ' 23:59:59';
      return [start2, end2];
    }
  },
  {
    text: '三个月内',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 89);
      const date = start.getFullYear() + '-' + (start.getMonth() + 1) + '-' + start.getDate();
      const date2 = end.getFullYear() + '-' + (end.getMonth() + 1) + '-' + end.getDate();
      const start2 = date + ' 00:00:00';
      const end2 = date2 + ' 23:59:59';
      return [start2, end2];
    }
  }
];

export const toHump = (str) => {
    return str.replace(/\-(\w)/g, function(all, letter){
        return letter.toUpperCase();
    });
}



export function downloadFile(url, fileName) {
  var xmlHttp = null;
  if (window.ActiveXObject) {
    // IE6, IE5 浏览器执行代码
    xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
  } else if (window.XMLHttpRequest) {
    // IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
    xmlHttp = new XMLHttpRequest();
  }
  //2.如果实例化成功，就调用open（）方法：
  if (xmlHttp != null) {
    xmlHttp.open("get", url, true);
    xmlHttp.responseType = 'blob';//关键
    xmlHttp.send();
    xmlHttp.onreadystatechange = function doResult() {
      if (xmlHttp.readyState == 4) { //4表示执行完成
        if (xmlHttp.status == 200) { //200表示执行成功
          var strMimeType = getFileTypeByName(fileName);
          downloadData(xmlHttp.response, fileName, strMimeType);
        }
      }
    };
  }
  
}
/*
 * 根据文件名的尾缀 返回文件类型
 * @param {any} fileName 文件名
 */
export function getFileTypeByName(fileName) {
  // 后缀获取
  let suffix = '';
  // 获取类型结果
  let result = '';
  try {
    const flieArr = fileName.split('.');
    suffix = flieArr[flieArr.length - 1];
  } catch (err) {
    suffix = '';
  }
  // fileName无后缀返回 false
  if (!suffix) { return false; }
  suffix = suffix.toLocaleLowerCase();
  // 图片格式
  const imglist = ['png', 'jpg', 'jpeg', 'bmp', 'gif'];
  // 进行图片匹配
  result = imglist.find(item => item === suffix);
  if (result) {
    return 'image';
  }
  // 匹配txt
  const txtlist = ['txt'];
  result = txtlist.find(item => item === suffix);
  if (result) {
    return 'txt';
  }
  // 匹配 excel
  const excelist = ['xls', 'xlsx'];
  result = excelist.find(item => item === suffix);
  if (result) {
    return 'excel';
  }
  // 匹配 word
  const wordlist = ['doc', 'docx'];
  result = wordlist.find(item => item === suffix);
  if (result) {
    return 'word';
  }
  // 匹配 pdf
  const pdflist = ['pdf'];
  result = pdflist.find(item => item === suffix);
  if (result) {
    return 'pdf';
  }
  // 匹配 ppt
  const pptlist = ['ppt', 'pptx'];
  result = pptlist.find(item => item === suffix);
  if (result) {
    return 'ppt';
  }
  // 匹配 视频
  const videolist = ['mp4', 'm2v', 'mkv', 'rmvb', 'wmv', 'avi', 'flv', 'mov', 'm4v'];
  result = videolist.find(item => item === suffix);
  if (result) {
    return 'video';
  }
  // 匹配 音频
  const radiolist = ['mp3', 'wav', 'wmv'];
  result = radiolist.find(item => item === suffix);
  if (result) {
    return 'radio';
  }
  // 其他 文件类型
  return 'other';
}
export function downloadData(data, strFileName, strMimeType) {
  var self = window, // this script is only for browsers anyway...
    u = "application/octet-stream", // this default mime also triggers iframe downloads
    m = strMimeType || u,
    x = data,
    D = document,
    a = D.createElement("a"),
    z = function (a) {
      return String(a);
    },
    B = self.Blob || self.MozBlob || self.WebKitBlob || z,
    BB = self.MSBlobBuilder || self.WebKitBlobBuilder || self.BlobBuilder,
    fn = strFileName || "download",
    blob,
    b,
    ua,
    fr;

  //if(typeof B.bind === 'function' ){ B=B.bind(self); }

  if (String(this) === "true") {
    //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
    x = [x, m];
    m = x[0];
    x = x[1];
  }

  //go ahead and download dataURLs right away
  if (String(x).match(/^data\:[\w+\-]+\/[\w+\-]+[,;]/)) {
    return navigator.msSaveBlob // IE10 can't do a[download], only Blobs:
      ? navigator.msSaveBlob(d2b(x), fn)
      : saver(x); // everyone else can save dataURLs un-processed
  } //end if dataURL passed?

  try {
    blob = x instanceof B ? x : new B([x], { type: m });
  } catch (y) {
    if (BB) {
      b = new BB();
      b.append([x]);
      blob = b.getBlob(m); // the blob
    }
  }

  function d2b(u) {
    var p = u.split(/[:;,]/),
      t = p[1],
      dec = p[2] == "base64" ? atob : decodeURIComponent,
      bin = dec(p.pop()),
      mx = bin.length,
      i = 0,
      uia = new Uint8Array(mx);

    for (i; i < mx; ++i) uia[i] = bin.charCodeAt(i);

    return new B([uia], { type: t });
  }

  function saver(url, winMode) {
    if ("download" in a) {
      //html5 A[download]
      a.href = url;
      a.setAttribute("download", fn);
      a.innerHTML = "downloading...";
      D.body.appendChild(a);
      setTimeout(function () {
        a.click();
        D.body.removeChild(a);
        if (winMode === true) {
          setTimeout(function () {
            self.URL.revokeObjectURL(a.href);
          }, 250);
        }
      }, 66);
      return true;
    }

    //do iframe dataURL download (old ch+FF):
    var f = D.createElement("iframe");
    D.body.appendChild(f);
    if (!winMode) {
      // force a mime that will download:
      url = "data:" + url.replace(/^data:([\w\/\-\+]+)/, u);
    }

    f.src = url;
    setTimeout(function () {
      D.body.removeChild(f);
    }, 333);
  } //end saver

  if (navigator.msSaveBlob) {
    // IE10+ : (has Blob, but not a[download] or URL)
    return navigator.msSaveBlob(blob, fn);
  }

  if (self.URL) {
    // simple fast and modern way using Blob and URL:
    saver(self.URL.createObjectURL(blob), true);
  } else {
    // handle non-Blob()+non-URL browsers:
    if (typeof blob === "string" || blob.constructor === z) {
      try {
        return saver("data:" + m + ";base64," + self.btoa(blob));
      } catch (y) {
        return saver("data:" + m + "," + encodeURIComponent(blob));
      }
    }

    // Blob but not URL:
    fr = new FileReader();
    fr.onload = function (e) {
      saver(this.result);
    };
    fr.readAsDataURL(blob);
  }
  return true;
}
