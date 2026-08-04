export function useTextareaPopup() {
  // 弹窗定位坐标
  const popLeft = ref(0);
  const popTop = ref(0);
  // 弹窗显示状态
  const showPopup = ref(false);
  const keyChar = ref('');

  /**
   * 获取光标屏幕坐标 + 行高
   */
  const getCaretScreenPos = (textareaEl: HTMLTextAreaElement) => {
    const rect = textareaEl.getBoundingClientRect();
    const style = getComputedStyle(textareaEl);
    const lineHeight = parseFloat(style.lineHeight) || 24;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;

    return {
      x: rect.left + paddingLeft,
      y: rect.top + paddingTop,
      lineHeight
    };
  };

  /**
   * 监听输入，判断光标前是否为 @，控制弹窗显隐+定位
   */
  const watchInput = (value: string, textareaEl: HTMLTextAreaElement) => {
    // debugger
    const selStart = textareaEl.selectionStart;
    const preChar = value.charAt(selStart - 1);

    console.log('watchInput', selStart, preChar);
    keyChar.value = preChar;
    if (preChar === '@' || preChar === '/') {
      const pos = getCaretScreenPos(textareaEl);
      popLeft.value = pos.x;
      popTop.value = pos.y + pos.lineHeight;
      showPopup.value = true;
    } else {
      showPopup.value = false;
    }
  };

  /**
   * 选中选项，替换 @ 并插入文本
   */
  const appendAfter = (textareaEl: HTMLTextAreaElement, originText: string, insertStr: string, char: string="@") => {
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    console.log('appendAfter', start, end, originText.substring(start, end));

    // 删掉@拼接内容
    let startText = originText.slice(0, start);
    const endText = originText.slice(end);
    if (startText.endsWith(char)) {
      startText = startText.slice(0, -char.length);
    }
    const newText = startText + char + insertStr + endText;
    // 重新聚焦
    setTimeout(() => textareaEl.focus(), 0);
    // showPopup.value = false
    return newText;
  };

  return {
    popLeft,
    popTop,
    showPopup,
    keyChar,
    getCaretScreenPos,
    watchInput,
    appendAfter
  };
}
