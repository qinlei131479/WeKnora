// 模型类型: 1-大语言模型 2-向量模型 3-排序模型
export const modelType_llm = 1; 
export const modelType_vector = 2;
export const modelType_sort = 3;

export const modelTypeNameMap = {
  [modelType_llm]: '大语言模型',
  [modelType_vector]: '向量模型',
  [modelType_sort]: '排序模型',
}

export const modelTypeOptions = [
  { label: modelTypeNameMap[modelType_llm], value: modelType_llm },
  { label: modelTypeNameMap[modelType_vector], value: modelType_vector },
  { label: modelTypeNameMap[modelType_sort], value: modelType_sort },
]