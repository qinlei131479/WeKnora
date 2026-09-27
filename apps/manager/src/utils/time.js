import { t } from '@/i18n';
export function formatTime(millisecond) {
    // console.log(millisecond)
    var seconds = ~~(millisecond / 1000)
    var millis = millisecond - seconds * 1000
    var hours = ~~(seconds / 3600)
    seconds = seconds - hours * 3600
    var mins = ~~(seconds / 60)
    seconds = seconds - mins * 60
    millis = Math.round(millis / 10)
    // console.log(hours, mins, seconds, millis)
    if (hours < 10) hours = '0' + hours
    if (mins < 10) mins = '0' + mins
    if (seconds < 10) seconds = '0' + seconds
    if (millis < 10) millis = '0' + millis
    // console.log(`${hours}:${mins}:${seconds}`)
    // return `${hours}:${mins}:${seconds}:${millis}`
    return `${hours}:${mins}:${seconds}`
}
export function str2millisecond(formatedTime) {
    var parts = formatedTime.split(':')
    var hours = +parts[0]
    var mins = +parts[1]
    var seconds = +parts[2]
    var millis = 0
    if (parts.length > 3) {
        millis = +parts[3]
        millis *= 10
    }
    millis = millis + (seconds + mins * 60 + hours * 3600) * 1000
    return millis
}
export function str2Second(formatedTime) {
    var parts = formatedTime.split(':')
    var hours = +parts[0]
    var mins = +parts[1]
    var seconds = +parts[2]
    seconds = seconds + (mins * 60 + hours * 3600)
    return seconds
}
export function formatSecond(seconds) {
    seconds = ~~seconds
    var hours = ~~(seconds / 3600)
    seconds = seconds - hours * 3600
    var mins = ~~(seconds / 60)
    seconds = seconds - mins * 60
    if (hours < 10) hours = '0' + hours
    if (mins < 10) mins = '0' + mins
    if (seconds < 10) seconds = '0' + seconds
    return `${hours}:${mins}:${seconds}`
}
// secondsValue: 带小数的秒数,小数只有前两位有效，后面的四舍五入 如：132.186 =》00:02:12:19
export function formatSecond2(secondsValue) {
    let seconds = ~~secondsValue;
    let ms = Math.round((secondsValue - seconds) * 100);
    if (ms === 100) {
      ms = '00';
      seconds++;
    } else if (ms < 10) ms = '0' + ms;
    let hours = ~~(seconds / 3600);
    seconds = seconds - hours * 3600;
    let mins = ~~(seconds / 60);
    seconds = seconds - mins * 60;
    if (hours < 10) hours = '0' + hours;
    if (mins < 10) mins = '0' + mins;
    if (seconds < 10) seconds = '0' + seconds;
    return `${hours}:${mins}:${seconds}:${ms}`;
  }
  export function formatSecond3(secondsValue) {
    let seconds = Math.round(secondsValue);
    let mins = ~~(seconds / 60);
    seconds = seconds - mins * 60;
    if (mins < 10) mins = '0' + mins;
    if (seconds < 10) seconds = '0' + seconds;
    return `${mins}:${seconds}`;
  }
  export function str2Second2(formatedTime) {
    const parts = formatedTime.split(':');
    const hours = +parts[0];
    const mins = +parts[1];
    let seconds = +parts[2];
    const millseconds = +parts[3] / 100;
    seconds = seconds + (mins * 60 + hours * 3600) + millseconds;
    return seconds;
  }
export function millisecond2min(millisecond) {
    let seconds = ~~(millisecond / 1000)
    const mins = Math.ceil(seconds / 60);
    return mins;
}

// 秒数转化为时分秒
export function convertSecondsToHMS(seconds) {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let remainingSeconds = Math.floor(seconds % 60);
  
    // 格式化为两位数的格式
    hours = hours < 10 ? ("0" + hours).slice(-2) : hours.toString().slice(-2);
    minutes =
      minutes < 10 ? ("0" + minutes).slice(-2) : minutes.toString().slice(-2);
    remainingSeconds =
      remainingSeconds < 10
        ? ("0" + remainingSeconds).slice(-2)
        : remainingSeconds.toString().slice(-2);
  
    return hours + ":" + minutes + ":" + remainingSeconds;
  }

  export function getTimeState(){
    // 获取当前时间
    let timeNow = new Date();
    // 获取当前小时
    let hours = timeNow.getHours();
    // 设置默认文字
    let state = ``;
    // 判断当前时间段
    if (hours >= 0 && hours <= 10) {
      state = t('common.time.goodMorning', '早上好');
    } else if (hours > 10 && hours <= 14) {
      state = t('common.time.goodAfternoon', '中午好');
    } else if (hours > 14 && hours <= 18) {
      state = t('common.time.goodAfternoonText', '下午好');
    } else if (hours > 18 && hours <= 24) {
      state = t('common.time.goodEvening', '晚上好');
    }
    return state;
  }