import { t } from '@/i18n';
import { showMessage } from '@/utils/element-plus-message';
// 复制通用方法
export function fastCopy(text, msg) {
  const domInput = document.createElement('input');
  domInput.value = text || '';
  document.body.appendChild(domInput); // 添加input节点
  domInput.select(); // 选择对象;
  document.execCommand('Copy'); // 执行浏览器复制命令
  if (msg) {
    showMessage(msg, 'success');
  } else showMessage(t('common.fastCopy.nameCopied', '复制名称成功'), 'success');
  domInput.remove();
}
