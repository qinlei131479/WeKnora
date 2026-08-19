# 模型管理实现文档

## 概述

本文档记录了从 Go 代码迁移到 Java 的模型管理 API 实现细节，包括数据库设计、API 接口、调试功能和安全性考虑。

## 1. 数据库设计

### 1.1 模型表 (models)

存储用户配置的模型信息，包括连接参数和凭证。

**关键字段：**
- `id`: 主键
- `name`: 模型名称
- `type`: 模型类型 (KnowledgeQA, Embedding, Rerank, VLLM, ASR)
- `parameters`: JSON 格式存储连接参数（baseUrl, apiKey, appSecret 等）
- `is_builtin`: 是否为内置模型
- `tenant_id`: 租户 ID
- `status`: 状态 (active/inactive)

**凭证加密：**
- apiKey 和 appSecret 使用 AES-256-GCM 加密存储
- 加密格式：`enc:v1:<base64-encoded-nonce-ciphertext>`
- 使用 `CryptoUtils.encrypt()` 和 `CryptoUtils.decryptLenient()` 处理

### 1.2 模型提供商表 (amp_model_provider)

存储支持的模型提供商信息。

**关键字段：**
- `id`: 主键
- `name`: 提供商标识（如 openai, aliyun, zhipu）
- `display_name`: 显示名称
- `description`: 描述
- `default_urls`: JSON 格式，按模型类型存储默认 URL
- `model_types`: JSON 数组，支持的模型类型
- `requires_auth`: 是否需要认证
- `extra_fields`: JSON 格式，额外配置字段定义
- `enabled`: 是否启用（布尔值）
- `sort_order`: 排序顺序

**设计说明：**
- 使用 `enabled` 字段控制提供商是否可用
- 查询时自动过滤 `enabled = false` 的提供商
- 支持 26 个主流模型提供商

## 2. Java 实现架构

### 2.1 分层结构

```
Controller (ModelsController)
    ↓
Service (ModelsService / ModelsServiceImpl)
    ↓
Mapper (ModelsMapper)
    ↓
Database (PostgreSQL)
```

### 2.2 DTO 和 VO 设计

**DTO (Data Transfer Object) - 请求对象：**
- `ModelsDTO`: 创建/更新模型
- `ModelParametersDTO`: 模型参数（包含 apiKey, appSecret）
- `ModelDebugDTO`: 调试请求参数
- `ModelCredentialsDTO`: 凭证更新

**VO (Value Object) - 响应对象：**
- `ModelsVO`: 模型信息（脱敏后的参数）
- `ModelParametersVO`: 模型参数（不包含凭证）
- `ModelDebugVO`: 调试结果
- `ModelProviderVO`: 提供商信息

**关键设计：**
- DTO 和 VO 分离，确保凭证不会泄露到响应中
- 使用 `@JsonProperty` 确保 JSON 字段名与 Go 代码一致（snake_case）
- `BeanUtil.copyProperties()` 时排除 `parameters` 字段，手动处理 JSON 转换

### 2.3 核心服务方法

**ModelsServiceImpl 主要方法：**

1. **createModel()**: 创建模型
   - 加密凭证字段
   - 设置默认状态为 active
   - 保存到数据库

2. **updateModel()**: 更新模型
   - 保留原有凭证（不解密）
   - 只更新非凭证字段
   - 重新加密新凭证

3. **listModels()**: 获取模型列表
   - 查询所有模型
   - 转换为 VO（脱敏）

4. **debugModel()**: 调试模型
   - 根据模型类型调用不同 API
   - 返回请求预览、响应、耗时、观察指标

5. **updateCredentials()**: 更新凭证
   - 解密旧凭证
   - 加密新凭证
   - 返回凭证配置状态

## 3. API 接口

### 3.1 模型管理接口

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/v1/models` | 创建模型 |
| GET | `/api/v1/models` | 获取模型列表 |
| GET | `/api/v1/models/{id}` | 获取模型详情 |
| PUT | `/api/v1/models/{id}` | 更新模型 |
| DELETE | `/api/v1/models/{id}` | 删除模型 |

### 3.2 凭证管理接口

| 方法 | 路径 | 功能 |
|------|------|------|
| PUT | `/api/v1/models/{id}/credentials` | 更新凭证 |
| GET | `/api/v1/models/{id}/credentials` | 获取凭证状态 |
| DELETE | `/api/v1/models/{id}/credentials/{field}` | 删除凭证字段 |

### 3.3 提供商接口

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/v1/models/providers` | 获取提供商列表 |

### 3.4 调试接口

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/v1/models/{id}/debug` | 调试模型 |

## 4. 调试功能实现

### 4.1 支持的模型类型

**1. KnowledgeQA (知识问答)**
- 调用 OpenAI 兼容的 chat completions API
- 支持参数：temperature, top_p, max_tokens, thinking
- 返回：响应内容、字符数

**2. Embedding (向量化)**
- 调用 embeddings API
- 返回：向量、维度信息

**3. Rerank (重排序)**
- 调用 rerank API
- 输入：query + documents 列表
- 返回：重排序结果、结果数量

**4. VLLM (视觉语言模型)**
- 调用 chat completions API（支持图片）
- 图片转 base64 编码
- 返回：响应内容、字符数

**5. ASR (语音识别)**
- 调用 audio/transcriptions API
- 使用 multipart/form-data 上传音频
- 返回：转录文本、片段数量

### 4.2 调试流程

```
1. 接收调试请求（modelId, input, options, file）
2. 查询模型配置
3. 解密凭证（apiKey, appSecret）
4. 构建请求预览（脱敏）
5. 根据模型类型调用对应 API
6. 收集观察指标（维度、字符数等）
7. 返回调试结果（requestPreview, response, elapsedMs, observations）
```

### 4.3 请求预览（脱敏）

调试结果中的 `requestPreview` 包含：
- model: 模型名称
- type: 模型类型
- baseUrl: API 地址
- input: 用户输入
- documents: 文档列表（如果有）

**不包含：** apiKey, appSecret 等敏感信息

## 5. 安全性考虑

### 5.1 凭证加密

**加密算法：** AES-256-GCM
- 对称加密，使用 32 字节密钥
- GCM 模式提供认证加密
- 每次加密使用随机 nonce

**加密流程：**
```
plaintext → generateNonce() → encrypt() → "enc:v1:" + base64(nonce + ciphertext)
```

**解密流程：**
```
"enc:v1:" + base64 → decode → split(nonce, ciphertext) → decrypt() → plaintext
```

**宽松模式 (decryptLenient)：**
- 如果解密失败，返回原始字符串
- 用于读取历史数据（可能未加密）

### 5.2 SSRF 防护（Go 实现参考）

Go 代码中的 SSRF 防护机制（Java 暂未实现）：

**1. URL 校验 (isSSRFSafeUrl)**
- 检查协议（仅允许 http/https）
- 检查主机名（禁止 localhost, 127.0.0.1 等）
- 检查端口（禁止 22, 3306, 5432 等）
- DNS 解析检查（防止 DNS rebinding）

**2. 白名单机制**
- 环境变量：`SSRF_WHITELIST`, `SSRF_WHITELIST_EXTRA`
- 支持精确匹配、通配符、CIDR
- 运行时可动态更新

**3. HTTP 客户端防护**
- 自定义 DialContext，连接前检查 IP
- 重定向检查，防止跳转到内网地址

**Java 实现建议：**
- 使用 `SSRFValidator.validate(url)` 在创建/更新模型时校验 baseUrl
- 实现白名单机制
- 使用安全的 HTTP 客户端

### 5.3 响应脱敏

**模型列表/详情响应：**
- 不包含 apiKey, appSecret
- 内置模型不显示 baseUrl, extraConfig, customHeaders

**凭证状态响应：**
- 只返回字段是否配置（configured: true/false）
- 不返回实际值

## 6. 关键代码片段

### 6.1 凭证加密/解密

```java
// 加密
String encrypted = CryptoUtils.encrypt(apiKey);

// 解密（宽松模式）
CryptoUtils.DecryptResult result = CryptoUtils.decryptLenient(encrypted);
if (result.isSuccess()) {
    String plaintext = result.getPlaintext();
}
```

### 6.2 JSON 参数处理

```java
// Entity → VO（排除 parameters，手动转换）
ModelsVO vo = BeanUtil.copyProperties(entity, ModelsVO.class, "parameters");
ModelParametersDTO params = JSONUtil.toBean(entity.getParameters(), ModelParametersDTO.class);
ModelParametersVO paramsVO = convertToParametersVO(params, entity);
vo.setParameters(paramsVO);

// VO → Entity（手动序列化）
entity.setParameters(JSONUtil.toJsonStr(params));
```

### 6.3 HTTP 请求（Hutool）

```java
// POST JSON
String response = HttpRequest.post(url)
    .header("Authorization", "Bearer " + apiKey)
    .header("Content-Type", "application/json")
    .body(JSONUtil.toJsonStr(requestBody))
    .timeout(60000)
    .execute()
    .body();

// POST multipart（文件上传）
String response = HttpRequest.post(url)
    .header("Authorization", "Bearer " + apiKey)
    .form("file", fileBytes, fileName)
    .form("model", modelName)
    .timeout(120000)
    .execute()
    .body();
```

### 6.4 提供商查询（过滤已禁用）

```java
@Override
public List<ModelProviderVO> listProviders(String modelType) {
    LambdaQueryWrapper<AmpModelProvider> queryWrapper = new LambdaQueryWrapper<>();
    queryWrapper.eq(AmpModelProvider::getEnabled, true);  // 只查询启用的
    if (StrUtil.isNotBlank(modelType)) {
        queryWrapper.like(AmpModelProvider::getModelTypes, modelType);
    }
    queryWrapper.orderByAsc(AmpModelProvider::getSortOrder);
    
    List<AmpModelProvider> providers = ampModelProviderMapper.selectList(queryWrapper);
    return providers.stream()
        .map(this::convertToVO)
        .collect(Collectors.toList());
}
```

## 7. 常见问题与解决方案

### 7.1 BeanUtil.copyProperties 类型转换错误

**问题：**
```
Cannot convert String to ModelParametersVO
```

**原因：**
- Entity 中 parameters 是 String（JSON）
- VO 中 parameters 是 ModelParametersVO 对象
- BeanUtil 无法自动转换

**解决方案：**
```java
// 排除 parameters 字段，手动转换
ModelsVO vo = BeanUtil.copyProperties(entity, ModelsVO.class, "parameters");
ModelParametersDTO params = JSONUtil.toBean(entity.getParameters(), ModelParametersDTO.class);
vo.setParameters(convertToParametersVO(params, entity));
```

### 7.2 凭证更新时保留原值

**问题：**
- 更新模型时，如果不传凭证，会清空原有凭证

**解决方案：**
```java
// 1. 读取旧参数（不解密）
ModelParametersDTO oldParams = JSONUtil.toBean(entity.getParameters(), ModelParametersDTO.class);

// 2. 合并新参数
if (newParams.getApiKey() == null) {
    newParams.setApiKey(oldParams.getApiKey());  // 保留加密的旧值
}

// 3. 保存
entity.setParameters(JSONUtil.toJsonStr(newParams));
```

### 7.3 JSON 字段名不一致

**问题：**
- Go 代码使用 snake_case（api_key, app_secret）
- Java 默认使用 camelCase（apiKey, appSecret）

**解决方案：**
```java
// 在 DTO/VO 中使用 @JsonProperty
@JsonProperty("api_key")
private String apiKey;

@JsonProperty("app_secret")
private String appSecret;
```

## 8. 测试建议

### 8.1 单元测试

- 测试凭证加密/解密
- 测试 JSON 序列化/反序列化
- 测试各种模型类型的调试逻辑

### 8.2 集成测试

- 测试完整的 CRUD 流程
- 测试凭证更新流程
- 测试调试接口（使用真实 API）

### 8.3 安全测试

- 测试 SSRF 防护（如果实现）
- 测试凭证不会泄露到响应中
- 测试内置模型的保护逻辑

## 9. 后续优化建议

1. **实现 SSRF 防护**
   - 参考 Go 代码实现 SSRFValidator
   - 在创建/更新模型时校验 baseUrl

2. **流式响应**
   - KnowledgeQA 调试支持流式输出
   - 使用 SSE (Server-Sent Events)

3. **缓存优化**
   - 缓存提供商列表
   - 缓存模型配置

4. **审计日志**
   - 记录模型创建/更新/删除操作
   - 记录调试请求（不包含敏感信息）

5. **限流控制**
   - 调试接口限流
   - 防止滥用

## 10. 参考资源

- Go 代码：`internal/handler/model.go`
- Go 代码：`internal/models/provider/provider.go`
- Go 代码：`internal/utils/security.go` (SSRF 防护)
- Java 实现：`ModelsServiceImpl.java`
- Java 实现：`ModelsController.java`
- 数据库脚本：`amp_model_provider.sql`, `amp_model_provider_data.sql`

---

**文档版本：** v1.0  
**最后更新：** 2026-08-19  
**作者：** kjsc
