export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = JsonValue[];

export interface JsonParseResult<T = JsonValue> {
  valid: boolean;
  data: T | null;
  error: string;
}

/**
 * 解析 JSON 字符串
 *
 * @param jsonText - 待解析的 JSON 字符串
 * @returns 解析结果
 */
const parse = <T = JsonValue>(jsonText: string): JsonParseResult<T> => {
  const text = jsonText.trim();

  if (!text) {
    return {
      valid: false,
      data: null,
      error: 'JSON 内容不能为空'
    };
  }

  try {
    return {
      valid: true,
      data: JSON.parse(text) as T,
      error: ''
    };
  } catch (error) {
    return {
      valid: false,
      data: null,
      error: error instanceof Error ? error.message : 'JSON 格式错误'
    };
  }
};

/**
 * 校验 JSON 字符串是否合法
 *
 * @param jsonText 待校验的 JSON 字符串
 * @returns 校验通过返回 true，否则返回 false
 */
const validate = (jsonText: string): boolean => {
  return parse(jsonText).valid;
};

/**
 * 格式化 JSON 字符串
 *
 * @param jsonText 待格式化的 JSON 字符串
 * @param space 缩进空格数
 * @returns 格式化结果
 */
const format = (jsonText: string, space = 4): JsonParseResult<string> => {
  const result = parse(jsonText);

  if (!result.valid) {
    return {
      valid: false,
      data: null,
      error: result.error
    };
  }

  return {
    valid: true,
    data: JSON.stringify(result.data, null, space),
    error: ''
  };
};

/**
 * 压缩 JSON 字符串
 *
 * @param jsonText 待压缩的 JSON 字符串
 * @returns 压缩结果
 */
const minify = (jsonText: string): JsonParseResult<string> => {
  const result = parse(jsonText);

  if (!result.valid) {
    return {
      valid: false,
      data: null,
      error: result.error
    };
  }

  return {
    valid: true,
    data: JSON.stringify(result.data),
    error: ''
  };
};

export const JsonFormater = {
  parse,
  validate,
  format,
  minify
};
