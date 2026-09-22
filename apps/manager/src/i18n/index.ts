import { createI18n } from 'vue-i18n';
import dimensEnUS from './dimens/en-US.json';
import dimensZhCN from './dimens/zh-CN.json';
import messagesEnUS from './messages/en-US.json';
import messagesZhCN from './messages/zh-CN.json';

export const DEFAULT_LANGUAGE = 'zh-CN';

//----- 语言控制 -------------------------------------------------------------------------------------

let lang = localStorage.getItem('language');
if (!lang) {
  lang = DEFAULT_LANGUAGE;
  localStorage.setItem('language', lang);
}

export const i18n = createI18n({
  flatJson: true,
  legacy: false,
  locale: lang,
  fallbackLocale: DEFAULT_LANGUAGE,
  messages: {
    'en-US': messagesEnUS,
    'zh-CN': messagesZhCN
  }
});

export const { locale, t, te, tm } = i18n.global;

//----- 语言引起的 UI 变化控制 -----------------------------------------------------------------------

// 从嵌套 JSON 中生成 dim() 可使用的完整叶子 Key 类型
type DimensPath<T> = {
  [Key in keyof T & string]: T[Key] extends number ? Key : T[Key] extends Record<string, unknown> ? `${Key}.${DimensPath<T[Key]>}` : never;
}[keyof T & string];

export type DimensKey = DimensPath<typeof dimensZhCN>;

// dimens 不经过 createI18n 的 flatJson 处理，需要先展开为完整 Key 映射
const flattenDimens = (source: Record<string, unknown>, parentKey = ''): Record<string, number> => {
  return Object.entries(source).reduce<Record<string, number>>((result, [key, value]) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof value === 'number') {
      result[fullKey] = value;
    } else {
      Object.assign(result, flattenDimens(value as Record<string, unknown>, fullKey));
    }

    return result;
  }, {});
};

const DIMENS = {
  'en-US': flattenDimens(dimensEnUS),
  'zh-CN': flattenDimens(dimensZhCN)
} as const;

type DimensLocale = keyof typeof DIMENS;

// 将当前语言解析为已配置的尺寸语言，其他语言回退到默认语言
const resolveDimensLocale = (value: string): DimensLocale => {
  return value === 'en-US' ? 'en-US' : DEFAULT_LANGUAGE;
};

// 读取当前语言的宽度，缺少对应 Key 时依次回退到默认语言和调用方提供的默认宽度
export const dim = (key: DimensKey, defaultWidth?: number): number | undefined => {
  const currentLocale = resolveDimensLocale(locale.value);

  return DIMENS[currentLocale][key] ?? DIMENS[DEFAULT_LANGUAGE][key] ?? defaultWidth;
};
