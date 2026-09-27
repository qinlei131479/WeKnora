import { t } from '@/i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { h } from 'vue';

export const showConfirm = (title = t('page.system.user.resetPassword.title', '提示'), message, successCallback, errorCallback) => {
  ElMessageBox.confirm(message, title, {
    confirmButtonText: t('component.kJSCCmpt.confirm', '确定'),
    cancelButtonText: t('page.normal.cancel', '取消'),
    type: 'warning'
    // confirmButtonClass: "el-button--danger"
  })
    .then(() => {
      successCallback?.();
    })
    .catch(() => {
      errorCallback?.();
    });
};


/**
 * 消息提示
 * @param {*} message 消息内容
 * @param {*} type 消息类型 success/warning/info/error
 * @param {*} showClose 是否显示关闭按钮
 */
export const showMessage = (message, type = 'success', showClose) => {
  ElMessage({
    message,
    type,
    showClose
  });
};

/**
 * titleContent: 弹窗标题
 * titleFirst: 变量之前的文字描述
 * titlevariate: 需要传入的变量
 * titleBehind: 变量之后的内容
 * titleHint: 操作之后的结果提示
 * confirmStyle: 确定按钮的样式自定义
 * cancelStyle: 取消按钮的样式自定义
 * successOperate: 成功之后所需的操作
 * errorOperate： 失败之后所需的操作
 */

export const showMessageBox = (
  titleContent,
  titleFirst,
  titlevariate,
  titleBehind,
  titleHint,
  confirmStyle,
  cancelStyle,
  successOperate,
  errorOperate,
  variateColor = '#D01010'
) => {
  ElMessageBox({
    title: titleContent,
    message: h(
      'div',
      {
        style:
          'width:370px;max-height:100px;font-size:14px;line-height: 24px;display: flex;flex-direction: column;justify-content: center;'
      },
      [
        h('div', null, [
          h('span', null, titleFirst),
          h(
            'span',
            {
              style: `color: ${variateColor}`
            },
            `${titlevariate}`
          ),
          h('span', null, titleBehind)
        ]),
        h('div', null, titleHint)
      ]
    ),
    showCancelButton: true,
    confirmButtonText: t('component.kJSCCmpt.confirm', '确定'),
    cancelButtonText: t('page.normal.cancel', '取消'),
    // center: true,
    confirmButtonClass: confirmStyle,
    cancelButtonClass: cancelStyle,
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true;
        instance.confirmButtonText = 'Loading...';
        successOperate?.();
        done();
        instance.confirmButtonLoading = false;
      } else {
        errorOperate?.();
        done();
      }
    }
  }).catch((err) => {
    console.log(err);
  });
};