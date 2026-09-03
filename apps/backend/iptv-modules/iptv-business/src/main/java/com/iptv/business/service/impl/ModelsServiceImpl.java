package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.Models;
import com.iptv.business.domain.dto.*;
import com.iptv.business.domain.dto.page.ModelsPageDTO;
import com.iptv.business.domain.vo.*;
import com.iptv.business.pgmapper.ModelsMapper;
import com.iptv.business.service.AmpModelProviderService;
import com.iptv.business.service.ModelsService;
import com.iptv.business.util.CryptoUtils;
import com.iptv.common.core.constant.TenantConstant;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.security.utils.SecurityUtils;
import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

/**
 * <p>
 * 模型配置 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ModelsServiceImpl extends ServiceImpl<ModelsMapper, Models> implements ModelsService {

    private final AmpModelProviderService ampModelProviderService;

    @Override
    public List<ModelProviderVO> listProviders(String modelType) {
        // 从数据库读取厂商列表
        return ampModelProviderService.listProvidersByModelType(modelType);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ModelsVO createModel(@Nonnull ModelsDTO dto) {
        // TODO: SSRF 校验（需要后续实现 SSRFValidator 工具类）
        // if (StrUtil.isNotBlank(dto.getParameters().getBaseUrl())) {
        //     SSRFValidator.validate(dto.getParameters().getBaseUrl());
        // }

        Models entity = BeanUtil.copyProperties(dto, Models.class, "parameters");
        entity.setTenantId(TenantConstant.BUSINESS_BUILTIN_TENANT_ID);
        entity.setStatus("active");
        entity.setIsBuiltin(true);
        entity.setParameters(JSONUtil.toJsonStr(dto.getParameters()));

        // 加密凭证字段
        if (entity.getParameters() != null) {
            try {
                ModelParametersDTO params = dto.getParameters();
                if (StrUtil.isNotBlank(params.getApiKey())) {
                    params.setApiKey(CryptoUtils.encrypt(params.getApiKey()));
                }
                if (StrUtil.isNotBlank(params.getAppSecret())) {
                    params.setAppSecret(CryptoUtils.encrypt(params.getAppSecret()));
                }
                entity.setParameters(JSONUtil.toJsonStr(params));
            } catch (Exception e) {
                log.error("Failed to serialize parameters", e);
                throw new ServiceException("参数序列化失败");
            }
        }

        this.baseMapper.insert(entity);
        return convertToVO(entity);
    }

    @Override
    public TableDataInfo<ModelsVO> listModels(@Nonnull ModelsPageDTO dto, PageDTO pg) {

        Page<McpServicesVO> page = PageUtils.toPage(pg);

        List<Models> models = this.baseMapper.queryPage(dto, page);
        List<ModelsVO> voList = models.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public ModelsVO getModelById(@Nonnull String id) {
        Models entity = this.baseMapper.selectById(id);
        if (entity == null) {
            throw new ServiceException("模型不存在");
        }
        return convertToVO(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ModelsVO updateModel(@Nonnull ModelsDTO dto) {
        Models entity = this.baseMapper.selectById(dto.getId());
        if (entity == null) {
            throw new ServiceException("模型不存在");
        }

        // TODO: SSRF 校验（需要后续实现 SSRFValidator 工具类）
        // if (dto.getParameters() != null && StrUtil.isNotBlank(dto.getParameters().getBaseUrl())) {
        //     SSRFValidator.validate(dto.getParameters().getBaseUrl());
        // }

        // 保留原有凭证
        ModelParametersDTO oldParams = null;
        try {
            if (StrUtil.isNotBlank(entity.getParameters())) {
                oldParams = JSONUtil.toBean(entity.getParameters(), ModelParametersDTO.class);
                // 解密（使用宽松模式）
                if (StrUtil.isNotBlank(oldParams.getApiKey())) {
                    CryptoUtils.DecryptResult result = CryptoUtils.decryptLenient(oldParams.getApiKey());
                    if (result.isSuccess()) {
                        oldParams.setApiKey(result.getPlaintext());
                    }
                }
                if (StrUtil.isNotBlank(oldParams.getAppSecret())) {
                    CryptoUtils.DecryptResult result = CryptoUtils.decryptLenient(oldParams.getAppSecret());
                    if (result.isSuccess()) {
                        oldParams.setAppSecret(result.getPlaintext());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to deserialize old parameters", e);
        }

        // 更新字段
        if (StrUtil.isNotBlank(dto.getName())) {
            entity.setName(dto.getName());
        }
        if (dto.getDisplayName() != null) {
            entity.setDisplayName(dto.getDisplayName());
        }
        if (StrUtil.isNotBlank(dto.getDescription())) {
            entity.setDescription(dto.getDescription());
        }
        if (StrUtil.isNotBlank(dto.getSource())) {
            entity.setSource(dto.getSource());
        }
        if (StrUtil.isNotBlank(dto.getType())) {
            entity.setType(dto.getType());
        }

        // 更新参数，保留凭证
        if (dto.getParameters() != null) {
            ModelParametersDTO newParams = dto.getParameters();
            if (oldParams != null) {
                newParams.setApiKey(oldParams.getApiKey());
                newParams.setAppSecret(oldParams.getAppSecret());
            }

            try {
                // 加密凭证
                if (StrUtil.isNotBlank(newParams.getApiKey())) {
                    newParams.setApiKey(CryptoUtils.encrypt(newParams.getApiKey()));
                }
                if (StrUtil.isNotBlank(newParams.getAppSecret())) {
                    newParams.setAppSecret(CryptoUtils.encrypt(newParams.getAppSecret()));
                }
                entity.setParameters(JSONUtil.toJsonStr(newParams));
            } catch (Exception e) {
                log.error("Failed to serialize parameters", e);
                throw new ServiceException("参数序列化失败");
            }
        }

        this.baseMapper.updateById(entity);
        return convertToVO(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteModel(@Nonnull String id) {
        Models entity = this.baseMapper.selectById(id);
        if (entity == null) {
            throw new ServiceException("模型不存在");
        }

        // 逻辑删除
        this.baseMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CredentialsResponseVO updateCredentials(@Nonnull ModelCredentialsDTO dto) {
        Models entity = this.baseMapper.selectById(dto.getModelId());
        if (entity == null) {
            throw new ServiceException("模型不存在");
        }

        try {
            ModelParametersDTO params = JSONUtil.toBean(entity.getParameters(), ModelParametersDTO.class);

            // 更新凭证
            if (dto.getApiKey() != null) {
                if (StrUtil.isNotBlank(dto.getApiKey())) {
                    params.setApiKey(CryptoUtils.encrypt(dto.getApiKey()));
                } else {
                    params.setApiKey(null);
                }
            }
            if (dto.getAppSecret() != null) {
                if (StrUtil.isNotBlank(dto.getAppSecret())) {
                    params.setAppSecret(CryptoUtils.encrypt(dto.getAppSecret()));
                } else {
                    params.setAppSecret(null);
                }
            }

            entity.setParameters(JSONUtil.toJsonStr(params));
            this.baseMapper.updateById(entity);

            return buildCredentialsResponse(params);
        } catch (Exception e) {
            log.error("Failed to update credentials", e);
            throw new ServiceException("更新凭证失败");
        }
    }

    @Override
    public CredentialsResponseVO getCredentials(@Nonnull String id) {
        Models entity = this.baseMapper.selectById(id);
        if (entity == null) {
            throw new ServiceException("模型不存在");
        }

        try {
            ModelParametersDTO params = JSONUtil.toBean(entity.getParameters(), ModelParametersDTO.class);
            // 解密（使用宽松模式）
            if (StrUtil.isNotBlank(params.getApiKey())) {
                CryptoUtils.DecryptResult result = CryptoUtils.decryptLenient(params.getApiKey());
                if (result.isSuccess()) {
                    params.setApiKey(result.getPlaintext());
                }
            }
            if (StrUtil.isNotBlank(params.getAppSecret())) {
                CryptoUtils.DecryptResult result = CryptoUtils.decryptLenient(params.getAppSecret());
                if (result.isSuccess()) {
                    params.setAppSecret(result.getPlaintext());
                }
            }
            return buildCredentialsResponse(params);
        } catch (Exception e) {
            log.error("Failed to get credentials", e);
            throw new ServiceException("获取凭证失败");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCredentialField(@Nonnull String id, @Nonnull String field) {
        Models entity = this.baseMapper.selectById(id);
        if (entity == null) {
            throw new ServiceException("模型不存在");
        }

        // 使用 snake_case 与 Go 接口保持一致
        if (!"api_key".equals(field) && !"app_secret".equals(field)) {
            throw new ServiceException("不支持的凭证字段");
        }

        try {
            ModelParametersDTO params = JSONUtil.toBean(entity.getParameters(), ModelParametersDTO.class);

            if (StrUtil.equals(field, "api_key")) {
                params.setApiKey(null);
            } else if (StrUtil.equals(field, "app_secret")) {
                params.setAppSecret(null);
            }

            entity.setParameters(JSONUtil.toJsonStr(params));
            this.baseMapper.updateById(entity);
        } catch (Exception e) {
            log.error("Failed to delete credential field", e);
            throw new ServiceException("删除凭证字段失败");
        }
    }

    @Override
    public Object debugModel(@Nonnull ModelDebugDTO dto, MultipartFile file) {
        Models entity = this.baseMapper.selectById(dto.getModelId());
        if (entity == null) {
            throw new ServiceException("模型不存在");
        }

        long startTime = System.currentTimeMillis();
        ModelDebugVO result = new ModelDebugVO();
        Map<String, Object> requestPreview = new HashMap<>();
        Map<String, Object> observations = new HashMap<>();

        try {
            // 解析参数并解密凭证
            ModelParametersDTO params = JSONUtil.toBean(entity.getParameters(), ModelParametersDTO.class);
            String apiKey = null;
            String appSecret = null;

            if (StrUtil.isNotBlank(params.getApiKey())) {
                CryptoUtils.DecryptResult decryptResult = CryptoUtils.decryptLenient(params.getApiKey());
                if (decryptResult.isSuccess()) {
                    apiKey = decryptResult.getPlaintext();
                }
            }
            if (StrUtil.isNotBlank(params.getAppSecret())) {
                CryptoUtils.DecryptResult decryptResult = CryptoUtils.decryptLenient(params.getAppSecret());
                if (decryptResult.isSuccess()) {
                    appSecret = decryptResult.getPlaintext();
                }
            }

            String baseUrl = params.getBaseUrl();
            String modelType = entity.getType();

            // 构建请求预览（脱敏）
            requestPreview.put("model", entity.getName());
            requestPreview.put("type", modelType);
            requestPreview.put("baseUrl", baseUrl);
            requestPreview.put("input", dto.getInput());
            if (dto.getDocuments() != null) {
                requestPreview.put("documents", dto.getDocuments());
            }

            // 根据模型类型调用不同的 API
            Object response = null;
            switch (modelType) {
                case "KnowledgeQA":
                    response = debugKnowledgeQA(baseUrl, apiKey, dto, observations);
                    break;
                case "Embedding":
                    response = debugEmbedding(baseUrl, apiKey, dto, observations);
                    break;
                case "Rerank":
                    response = debugRerank(baseUrl, apiKey, dto, observations);
                    break;
                case "VLLM":
                    response = debugVLLM(baseUrl, apiKey, dto, file, observations);
                    break;
                case "ASR":
                    response = debugASR(baseUrl, apiKey, dto, file, observations);
                    break;
                default:
                    throw new ServiceException("不支持的模型类型: " + modelType);
            }

            result.setResponse(response);
            result.setObservations(observations);

        } catch (Exception e) {
            log.error("模型调试失败", e);
            result.setError(e.getMessage());
        }

        long elapsedMs = System.currentTimeMillis() - startTime;
        result.setRequestPreview(requestPreview);
        result.setElapsedMs(elapsedMs);

        return result;
    }

    /**
     * 调试 KnowledgeQA 模型（聊天对话）
     */
    private Object debugKnowledgeQA(String baseUrl, String apiKey, ModelDebugDTO dto, Map<String, Object> observations) {
        if (StrUtil.isBlank(dto.getInput())) {
            throw new ServiceException("输入不能为空");
        }

        String url = baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", dto.getModelId());

        // 构建消息
        List<Map<String, String>> messages = new ArrayList<>();
        if (StrUtil.isNotBlank(dto.getSystemPrompt())) {
            Map<String, String> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content", dto.getSystemPrompt());
            messages.add(systemMsg);
        }
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", dto.getInput());
        messages.add(userMsg);

        requestBody.put("messages", messages);

        // 添加可选参数
        if (dto.getTemperature() != null) {
            requestBody.put("temperature", dto.getTemperature());
        }
        if (dto.getTopP() != null) {
            requestBody.put("top_p", dto.getTopP());
        }
        if (dto.getMaxTokens() != null) {
            requestBody.put("max_tokens", dto.getMaxTokens());
        }
        if (dto.getThinking() != null) {
            requestBody.put("thinking", dto.getThinking());
        }

        observations.put("stream", false);

        // 调用 API
        String response = HttpRequest.post(url)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(JSONUtil.toJsonStr(requestBody))
                .timeout(60000)
                .execute()
                .body();

        Map<String, Object> result = JSONUtil.toBean(response, Map.class);

        // 提取响应内容
        if (result.containsKey("choices") && !((List<?>) result.get("choices")).isEmpty()) {
            Map<String, Object> choice = (Map<String, Object>) ((List<?>) result.get("choices")).get(0);
            Map<String, Object> message = (Map<String, Object>) choice.get("message");
            String content = (String) message.get("content");

            observations.put("answer_characters", content != null ? content.length() : 0);

            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("content", content);
            return responseMap;
        }

        return result;
    }

    /**
     * 调试 Embedding 模型（向量化）
     */
    private Object debugEmbedding(String baseUrl, String apiKey, ModelDebugDTO dto, Map<String, Object> observations) {
        if (StrUtil.isBlank(dto.getInput())) {
            throw new ServiceException("输入不能为空");
        }

        String url = baseUrl.endsWith("/") ? baseUrl + "embeddings" : baseUrl + "/embeddings";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", dto.getModelId());
        requestBody.put("input", dto.getInput());

        // 调用 API
        String response = HttpRequest.post(url)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(JSONUtil.toJsonStr(requestBody))
                .timeout(60000)
                .execute()
                .body();

        Map<String, Object> result = JSONUtil.toBean(response, Map.class);

        // 提取向量维度
        if (result.containsKey("data") && !((List<?>) result.get("data")).isEmpty()) {
            Map<String, Object> data = (Map<String, Object>) ((List<?>) result.get("data")).get(0);
            List<?> embedding = (List<?>) data.get("embedding");
            if (embedding != null) {
                observations.put("dimension", embedding.size());
            }
        }

        return result;
    }

    /**
     * 调试 Rerank 模型（重排序）
     */
    private Object debugRerank(String baseUrl, String apiKey, ModelDebugDTO dto, Map<String, Object> observations) {
        if (StrUtil.isBlank(dto.getInput())) {
            throw new ServiceException("查询不能为空");
        }
        if (dto.getDocuments() == null || dto.getDocuments().isEmpty()) {
            throw new ServiceException("文档列表不能为空");
        }

        String url = baseUrl.endsWith("/") ? baseUrl + "rerank" : baseUrl + "/rerank";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", dto.getModelId());
        requestBody.put("query", dto.getInput());
        requestBody.put("documents", dto.getDocuments());

        // 调用 API
        String response = HttpRequest.post(url)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(JSONUtil.toJsonStr(requestBody))
                .timeout(60000)
                .execute()
                .body();

        Map<String, Object> result = JSONUtil.toBean(response, Map.class);

        // 统计结果数量
        if (result.containsKey("results")) {
            List<?> results = (List<?>) result.get("results");
            observations.put("result_count", results.size());
        }

        return result;
    }

    /**
     * 调试 VLLM 模型（视觉语言模型）
     */
    private Object debugVLLM(String baseUrl, String apiKey, ModelDebugDTO dto, MultipartFile file, Map<String, Object> observations) {
        if (file == null || file.isEmpty()) {
            throw new ServiceException("图片文件不能为空");
        }

        String url = baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";

        try {
            // 将图片转为 base64
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
            String imageDataUrl = "data:" + file.getContentType() + ";base64," + base64Image;

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", dto.getModelId());

            // 构建包含图片的消息
            List<Map<String, Object>> messages = new ArrayList<>();
            Map<String, Object> userMsg = new HashMap<>();
            userMsg.put("role", "user");

            List<Map<String, Object>> content = new ArrayList<>();
            Map<String, Object> textContent = new HashMap<>();
            textContent.put("type", "text");
            textContent.put("text", dto.getInput());
            content.add(textContent);

            Map<String, Object> imageContent = new HashMap<>();
            imageContent.put("type", "image_url");
            Map<String, String> imageUrl = new HashMap<>();
            imageUrl.put("url", imageDataUrl);
            imageContent.put("image_url", imageUrl);
            content.add(imageContent);

            userMsg.put("content", content);
            messages.add(userMsg);

            requestBody.put("messages", messages);

            // 调用 API
            String response = HttpRequest.post(url)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(JSONUtil.toJsonStr(requestBody))
                    .timeout(120000)
                    .execute()
                    .body();

            Map<String, Object> result = JSONUtil.toBean(response, Map.class);

            // 提取响应内容
            if (result.containsKey("choices") && !((List<?>) result.get("choices")).isEmpty()) {
                Map<String, Object> choice = (Map<String, Object>) ((List<?>) result.get("choices")).get(0);
                Map<String, Object> message = (Map<String, Object>) choice.get("message");
                String contentStr = (String) message.get("content");

                observations.put("answer_characters", contentStr != null ? contentStr.length() : 0);

                Map<String, Object> responseMap = new HashMap<>();
                responseMap.put("content", contentStr);
                return responseMap;
            }

            return result;
        } catch (Exception e) {
            throw new ServiceException("处理图片失败: " + e.getMessage());
        }
    }

    /**
     * 调试 ASR 模型（语音识别）
     */
    private Object debugASR(String baseUrl, String apiKey, ModelDebugDTO dto, MultipartFile file, Map<String, Object> observations) {
        if (file == null || file.isEmpty()) {
            throw new ServiceException("音频文件不能为空");
        }

        String url = baseUrl.endsWith("/") ? baseUrl + "audio/transcriptions" : baseUrl + "/audio/transcriptions";

        try {
            // 构建 multipart/form-data 请求
            HttpRequest request = HttpRequest.post(url)
                    .header("Authorization", "Bearer " + apiKey)
                    .form("file", file.getBytes(), file.getOriginalFilename())
                    .form("model", dto.getModelId())
                    .timeout(120000);

            String response = request.execute().body();
            Map<String, Object> result = JSONUtil.toBean(response, Map.class);

            // 统计字符数和片段数
            if (result.containsKey("text")) {
                String text = (String) result.get("text");
                observations.put("text_characters", text != null ? text.length() : 0);
            }
            if (result.containsKey("segments")) {
                List<?> segments = (List<?>) result.get("segments");
                observations.put("segment_count", segments.size());
            }

            return result;
        } catch (Exception e) {
            throw new ServiceException("处理音频失败: " + e.getMessage());
        }
    }

    /**
     * 转换为 VO
     */
    private ModelsVO convertToVO(Models entity) {
        // 排除 parameters 字段，因为 Entity 中是 String，VO 中是对象，需要手动转换
        ModelsVO vo = BeanUtil.copyProperties(entity, ModelsVO.class, "parameters");

        // 解析并脱敏参数
        if (StrUtil.isNotBlank(entity.getParameters())) {
            try {
                ModelParametersDTO params = JSONUtil.toBean(entity.getParameters(), ModelParametersDTO.class);
                ModelParametersVO paramsVO = convertToParametersVO(params, entity);
                vo.setParameters(paramsVO);

                // 添加凭证状态（使用 snake_case 与 Go 接口保持一致）
                if (!Boolean.TRUE.equals(entity.getIsBuiltin())) {
                    Map<String, CredentialFieldMetadataVO> credentials = new HashMap<>();
                    credentials.put("api_key", new CredentialFieldMetadataVO(StrUtil.isNotBlank(params.getApiKey())));
                    credentials.put("app_secret", new CredentialFieldMetadataVO(StrUtil.isNotBlank(params.getAppSecret())));
                    vo.setCredentials(credentials);
                }
            } catch (Exception e) {
                log.error("Failed to deserialize parameters", e);
            }
        }

        return vo;
    }

    /**
     * 转换为参数 VO（脱敏）
     */
    private ModelParametersVO convertToParametersVO(ModelParametersDTO params, Models entity) {
        ModelParametersVO vo = new ModelParametersVO();

        // 内置模型脱敏处理
        boolean isBuiltin = Boolean.TRUE.equals(entity.getIsBuiltin());
        boolean isAdmin = SecurityUtils.isAdmin();

        if (!isBuiltin || isAdmin) {
            vo.setBaseUrl(params.getBaseUrl());
            vo.setExtraConfig(params.getExtraConfig());
            vo.setCustomHeaders(params.getCustomHeaders());
        }

        if (!isBuiltin) {
            vo.setAppId(params.getAppId());
        }

        vo.setInterfaceType(params.getInterfaceType());
        vo.setParameterSize(params.getParameterSize());
        vo.setProvider(params.getProvider());
        vo.setSupportsVision(params.getSupportsVision());
        vo.setMaxConcurrency(params.getMaxConcurrency());

        // 转换嵌入参数
        if (params.getEmbeddingParameters() != null) {
            EmbeddingParametersVO embeddingVO = new EmbeddingParametersVO();
            embeddingVO.setDimension(params.getEmbeddingParameters().getDimension());
            embeddingVO.setTruncatePromptTokens(params.getEmbeddingParameters().getTruncatePromptTokens());
            embeddingVO.setSupportsDimensionOverride(params.getEmbeddingParameters().getSupportsDimensionOverride());
            vo.setEmbeddingParameters(embeddingVO);
        }

        // 注意: 不包含 apiKey 和 appSecret

        return vo;
    }

    /**
     * 构建凭证响应（使用 snake_case 与 Go 接口保持一致）
     */
    private CredentialsResponseVO buildCredentialsResponse(ModelParametersDTO params) {
        CredentialsResponseVO response = new CredentialsResponseVO();
        Map<String, CredentialFieldMetadataVO> fields = new HashMap<>();
        fields.put("api_key", new CredentialFieldMetadataVO(StrUtil.isNotBlank(params.getApiKey())));
        fields.put("app_secret", new CredentialFieldMetadataVO(StrUtil.isNotBlank(params.getAppSecret())));
        response.setFields(fields);
        return response;
    }

    // ==================== 远程模型测试接口实现 ====================

    @Override
    public ModelTestResultVO testRemoteModel(@Nonnull ModelTestRequestDTO dto) {
        log.info("Testing remote Chat model: {}", dto.getModelName());

        // 如果提供了 modelId，从已存储模型中补齐密钥
        if (StrUtil.isNotBlank(dto.getModelId())) {
            fillSecretsFromStoredModel(dto);
        }

        String baseUrl = dto.getBaseUrl();
        String apiKey = dto.getApiKey();

        if (StrUtil.isBlank(baseUrl)) {
            throw new ServiceException("Base URL 不能为空");
        }

        // 构建测试请求 URL
        // Chat 接口：所有 provider 都追加 /chat/completions
        String url = buildChatUrl(baseUrl);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", dto.getModelName());

        // 构建最小化测试消息
        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", "test");
        messages.add(userMsg);

        requestBody.put("messages", messages);
        requestBody.put("max_tokens", 1);

        try {
            String response = HttpRequest.post(url)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(JSONUtil.toJsonStr(requestBody))
                    .timeout(60000)
                    .execute()
                    .body();

            Map<String, Object> result = JSONUtil.toBean(response, Map.class);

            // 检查是否有错误
            if (result.containsKey("error")) {
                Map<String, Object> error = (Map<String, Object>) result.get("error");
                String errorMsg = (String) error.get("message");
                return new ModelTestResultVO(false, classifyConnectionError(errorMsg) + "：" + errorMsg);
            }

            // 检查是否有 choices
            if (result.containsKey("choices")) {
                return new ModelTestResultVO(true, "连接正常，模型可用");
            }

            return new ModelTestResultVO(false, "响应格式异常");
        } catch (Exception e) {
            log.error("Chat model test failed", e);
            return new ModelTestResultVO(false, classifyConnectionError(e.getMessage()) + "：" + e.getMessage());
        }
    }

    @Override
    public ModelTestResultVO testEmbeddingModel(@Nonnull ModelTestRequestDTO dto) {
        log.info("Testing Embedding model: {}", dto.getModelName());

        if (StrUtil.isNotBlank(dto.getModelId())) {
            fillSecretsFromStoredModel(dto);
        }

        String baseUrl = dto.getBaseUrl();
        String apiKey = dto.getApiKey();
        String provider = dto.getProvider();

        if (StrUtil.isBlank(baseUrl)) {
            throw new ServiceException("Base URL 不能为空");
        }

        String url = buildEmbeddingUrl(baseUrl, provider);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", dto.getModelName());
        requestBody.put("input", "hello");

        try {
            String response = HttpRequest.post(url)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(JSONUtil.toJsonStr(requestBody))
                    .timeout(60000)
                    .execute()
                    .body();

            Map<String, Object> result = JSONUtil.toBean(response, Map.class);

            // 检查是否有错误
            if (result.containsKey("error")) {
                Map<String, Object> error = (Map<String, Object>) result.get("error");
                String errorMsg = (String) error.get("message");
                return new ModelTestResultVO(false, classifyConnectionError(errorMsg) + "：" + errorMsg, 0);
            }

            // 提取向量维度
            if (result.containsKey("data")) {
                List<?> dataList = (List<?>) result.get("data");
                if (!dataList.isEmpty()) {
                    Map<String, Object> data = (Map<String, Object>) dataList.get(0);
                    List<?> embedding = (List<?>) data.get("embedding");
                    if (embedding != null) {
                        int dimension = embedding.size();
                        return new ModelTestResultVO(true, "测试成功，向量维度=" + dimension, dimension);
                    }
                }
            }

            return new ModelTestResultVO(false, "响应格式异常", 0);
        } catch (Exception e) {
            log.error("Embedding model test failed", e);
            return new ModelTestResultVO(false, classifyConnectionError(e.getMessage()) + "：" + e.getMessage(), 0);
        }
    }

    @Override
    public ModelTestResultVO testRerankModel(@Nonnull ModelTestRequestDTO dto) {
        log.info("Testing Rerank model: {}", dto.getModelName());

        if (StrUtil.isNotBlank(dto.getModelId())) {
            fillSecretsFromStoredModel(dto);
        }

        String baseUrl = dto.getBaseUrl();
        String apiKey = dto.getApiKey();
        String provider = dto.getProvider();

        if (StrUtil.isBlank(baseUrl)) {
            throw new ServiceException("Base URL 不能为空");
        }

        String url = buildRerankUrl(baseUrl, provider);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", dto.getModelName());

        // 阿里云 DashScope 使用特殊的请求体格式
        if ("aliyun".equalsIgnoreCase(provider) || "dashscope".equalsIgnoreCase(provider)) {
            // 阿里云格式: { "model": "...", "input": { "query": "...", "documents": [...] } }
            Map<String, Object> input = new HashMap<>();
            input.put("query", "ping");
            input.put("documents", Arrays.asList("pong"));
            requestBody.put("input", input);
        } else {
            // OpenAI/Jina 等格式: { "model": "...", "query": "...", "documents": [...] }
            requestBody.put("query", "ping");
            requestBody.put("documents", Arrays.asList("pong"));
        }

        try {
            String response = HttpRequest.post(url)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(JSONUtil.toJsonStr(requestBody))
                    .timeout(60000)
                    .execute()
                    .body();

            Map<String, Object> result = JSONUtil.toBean(response, Map.class);

            // 检查是否有错误
            if (result.containsKey("error")) {
                Map<String, Object> error = (Map<String, Object>) result.get("error");
                String errorMsg = (String) error.get("message");
                return new ModelTestResultVO(false, classifyConnectionError(errorMsg) + "：" + errorMsg);
            }

            // 检查是否有错误（阿里云格式）
            if (result.containsKey("code")) {
                String errorCode = (String) result.get("code");
                String errorMsg = (String) result.get("message");
                return new ModelTestResultVO(false, classifyConnectionError(errorMsg) + "：" + errorMsg);
            }

            // 根据 provider 解析不同的响应格式
            List<?> results = null;

            if (StrUtil.equalsIgnoreCase(provider, "aliyun") || StrUtil.equalsIgnoreCase(provider, "dashscope")) {
                // 阿里云格式: { "output": { "results": [...] } }
                if (result.containsKey("output")) {
                    Map<String, Object> output = (Map<String, Object>) result.get("output");
                    if (output.containsKey("results")) {
                        results = (List<?>) output.get("results");
                    }
                }
            } else {
                // OpenAI/Jina 格式: { "results": [...] }
                if (result.containsKey("results")) {
                    results = (List<?>) result.get("results");
                }
            }

            // 检查是否有结果
            if (results != null && !results.isEmpty()) {
                return new ModelTestResultVO(true, "重排功能正常，返回" + results.size() + "个结果");
            }

            return new ModelTestResultVO(false, "重排接口连接成功，但未返回重排结果");
        } catch (Exception e) {
            log.error("Rerank model test failed", e);
            return new ModelTestResultVO(false, classifyConnectionError(e.getMessage()) + "：" + e.getMessage());
        }
    }

    @Override
    public ModelTestResultVO testASRModel(@Nonnull ModelTestRequestDTO dto) {
        log.info("Testing ASR model: {}", dto.getModelName());

        if (StrUtil.isNotBlank(dto.getModelId())) {
            fillSecretsFromStoredModel(dto);
        }

        String baseUrl = dto.getBaseUrl();
        String apiKey = dto.getApiKey();

        if (StrUtil.isBlank(baseUrl)) {
            throw new ServiceException("Base URL 不能为空");
        }

        String url = buildASRUrl(baseUrl);

        try {
            // 构建 multipart/form-data 请求
            // 使用内置静默 WAV 测试音频（与 Go 端 assets/asr_test.wav 行为一致）
            ClassPathResource wavResource = new ClassPathResource("asr_test.wav");
            byte[] testAudio = wavResource.getInputStream().readAllBytes();
            String fileName = "asr_test.wav";

            HttpRequest request = HttpRequest.post(url)
                    .header("Authorization", "Bearer " + apiKey)
                    .form("file", testAudio, fileName)
                    .form("model", dto.getModelName())
                    .timeout(60000);

            // 注入自定义请求头（部分厂商要求，类似 OpenAI SDK 的 extra_headers）
            if (dto.getCustomHeaders() != null) {
                for (Map.Entry<String, String> entry : dto.getCustomHeaders().entrySet()) {
                    if (StrUtil.isNotBlank(entry.getKey()) && entry.getValue() != null) {
                        request.header(entry.getKey(), entry.getValue());
                    }
                }
            }

            // 可选转写语言（与 Go 端 req.Language 行为一致）
            if (StrUtil.isNotBlank(dto.getLanguage())) {
                request.form("language", dto.getLanguage());
            }

            HttpResponse httpResponse = request.execute();
            int statusCode = httpResponse.getStatus();
            String responseBody = httpResponse.body();

            // 响应体可能不是 JSON（如网关纯文本错误 "Error request, response status: 404"），需要容错
            Map<String, Object> result = null;
            if (StrUtil.isNotBlank(responseBody)) {
                try {
                    result = JSONUtil.toBean(responseBody, Map.class);
                } catch (Exception ex) {
                    log.warn("ASR test response is not JSON, status={}, body={}", statusCode, responseBody);
                }
            }

            // 提取错误消息：兼容 OpenAI 风格 {"error":{"message":...}} 与厂商直返 {"code":...,"message":...}
            String errorMsg = null;
            if (result != null) {
                Object errorObj = result.get("error");
                if (errorObj instanceof Map) {
                    Map<String, Object> error = (Map<String, Object>) errorObj;
                    Object errMessage = error.get("message");
                    errorMsg = errMessage != null ? errMessage.toString() : null;
                } else if (result.containsKey("code") && result.containsKey("message")) {
                    Object errMessage = result.get("message");
                    errorMsg = errMessage != null ? errMessage.toString() : null;
                }
            }
            // 非 JSON 错误体，直接按文本错误处理
            if (errorMsg == null && (result == null || statusCode >= 400)) {
                errorMsg = responseBody;
            }

            if (StrUtil.isNotBlank(errorMsg)) {
                return classifyASRError(statusCode, errorMsg);
            }

            // 如果有转写结果，说明连接成功
            if (result != null && result.containsKey("text")) {
                String text = (String) result.get("text");
                if (StrUtil.isNotBlank(text)) {
                    return new ModelTestResultVO(true, "ASR连接成功，转写结果: " + text);
                }
            }

            return new ModelTestResultVO(true, "ASR连接成功");
        } catch (Exception e) {
            log.error("ASR model test failed", e);
            String errorMsg = e.getMessage();
            return classifyASRError(0, errorMsg);
        }
    }

    /**
     * 按 Go 端 CheckASRModel 语义分类 ASR 连通性检查错误：
     * 结合 HTTP 状态码与错误消息，401/403/404/连接失败/模型不存在 判不可用，其余视为端点可达（非致命错误）
     */
    private ModelTestResultVO classifyASRError(int statusCode, String errorMsg) {
        String msg = errorMsg == null ? "" : errorMsg;
        // 认证失败：401/403 状态码或错误消息特征
        if (statusCode == 401 || statusCode == 403
                || msg.contains("401") || msg.contains("Unauthorized") || msg.contains("authentication")) {
            return new ModelTestResultVO(false, "认证失败，请检查API Key：" + msg);
        }
        // 模型不存在：如 {"code":"InvalidParameter","message":"Model not exist."}
        if (msg.contains("model") && (msg.contains("not exist") || msg.contains("not found"))) {
            return new ModelTestResultVO(false, "模型不存在，请检查模型名称：" + msg);
        }
        // 端点不存在：404 状态码或错误消息特征（如纯文本 "Error request, response status: 404"）
        if (statusCode == 404 || msg.contains("404") || msg.contains("Not Found")) {
            return new ModelTestResultVO(false, "API端点不存在，请检查Base URL：" + msg);
        }
        // 连接失败
        if (msg.contains("connection refused") || msg.contains("no such host") || msg.contains("dial tcp")) {
            return new ModelTestResultVO(false, "无法连接到服务器，请检查Base URL：" + msg);
        }
        // 端点可达但存在非致命错误（如音频过短、格式提示等），视为可用
        return new ModelTestResultVO(true, "ASR端点可达（非致命错误: " + msg + "）");
    }

    @Override
    public ModelTestResultVO testMultimodalModel(@Nonnull ModelTestRequestDTO dto, MultipartFile file) {
        log.info("Testing Multimodal model: {}", dto.getModelName());

        if (file == null || file.isEmpty()) {
            throw new ServiceException("图片文件不能为空");
        }

        if (StrUtil.isNotBlank(dto.getModelId())) {
            fillSecretsFromStoredModel(dto);
        }

        String baseUrl = dto.getBaseUrl();
        String apiKey = dto.getApiKey();

        if (StrUtil.isBlank(baseUrl)) {
            throw new ServiceException("Base URL 不能为空");
        }

        String url = buildMultimodalUrl(baseUrl);

        try {
            // 将图片转为 base64
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
            String imageDataUrl = "data:" + file.getContentType() + ";base64," + base64Image;

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", dto.getModelName());

            // 构建包含图片的消息
            List<Map<String, Object>> messages = new ArrayList<>();
            Map<String, Object> userMsg = new HashMap<>();
            userMsg.put("role", "user");

            List<Map<String, Object>> content = new ArrayList<>();
            Map<String, Object> textContent = new HashMap<>();
            textContent.put("type", "text");
            textContent.put("text", "Describe this image");
            content.add(textContent);

            Map<String, Object> imageContent = new HashMap<>();
            imageContent.put("type", "image_url");
            Map<String, String> imageUrl = new HashMap<>();
            imageUrl.put("url", imageDataUrl);
            imageContent.put("image_url", imageUrl);
            content.add(imageContent);

            userMsg.put("content", content);
            messages.add(userMsg);

            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 100);

            String response = HttpRequest.post(url)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(JSONUtil.toJsonStr(requestBody))
                    .timeout(120000)
                    .execute()
                    .body();

            Map<String, Object> result = JSONUtil.toBean(response, Map.class);

            // 检查是否有错误
            if (result.containsKey("error")) {
                Map<String, Object> error = (Map<String, Object>) result.get("error");
                String errorMsg = (String) error.get("message");
                return new ModelTestResultVO(false, classifyConnectionError(errorMsg) + "：" + errorMsg);
            }

            // 检查是否有响应
            if (result.containsKey("choices")) {
                return new ModelTestResultVO(true, "多模态模型连接正常");
            }

            return new ModelTestResultVO(false, "响应格式异常");
        } catch (Exception e) {
            log.error("Multimodal model test failed", e);
            return new ModelTestResultVO(false, classifyConnectionError(e.getMessage()) + "：" + e.getMessage());
        }
    }

    /**
     * 从已存储模型中补齐密钥
     */
    private void fillSecretsFromStoredModel(ModelTestRequestDTO dto) {
        if (dto == null || StrUtil.isBlank(dto.getModelId())) {
            return;
        }

        try {
            Models storedModel = this.baseMapper.selectById(dto.getModelId());
            if (BeanUtil.isEmpty(storedModel)) {
                log.warn("Stored model {} not found, leaving secrets empty", dto.getModelId());
                return;
            }

            ModelParametersDTO params = JSONUtil.toBean(storedModel.getParameters(), ModelParametersDTO.class);

            // 解密凭证
            String apiKey = null;
            String appSecret = null;
            String baseUrl = null;

            if (StrUtil.isNotBlank(params.getApiKey())) {
                CryptoUtils.DecryptResult result = CryptoUtils.decryptLenient(params.getApiKey());
                if (result.isSuccess()) {
                    apiKey = result.getPlaintext();
                }
            }
            if (StrUtil.isNotBlank(params.getAppSecret())) {
                CryptoUtils.DecryptResult result = CryptoUtils.decryptLenient(params.getAppSecret());
                if (result.isSuccess()) {
                    appSecret = result.getPlaintext();
                }
            }

            if (StrUtil.isNotBlank(params.getBaseUrl())) {
                baseUrl = params.getBaseUrl();
            }

            // 补齐缺失的密钥
            if (StrUtil.isBlank(dto.getApiKey()) && StrUtil.isNotBlank(apiKey)) {
                dto.setApiKey(apiKey);
            }
            if (StrUtil.isBlank(dto.getAppSecret()) && StrUtil.isNotBlank(appSecret)) {
                dto.setAppSecret(appSecret);
            }
            if (StrUtil.isBlank(dto.getBaseUrl()) && StrUtil.isNotBlank(baseUrl)) {
                dto.setBaseUrl(baseUrl);
            }
            if (StrUtil.isBlank(dto.getModelName())) {
                dto.setModelName(storedModel.getName());
            }
            if (StrUtil.isBlank(dto.getProvider())) {
                dto.setProvider(params.getProvider());
            }

        } catch (Exception e) {
            log.warn("Failed to fill secrets from stored model: {}", e.getMessage());
        }
    }

    /**
     * 分类连接错误，返回人类可读的提示
     */
    private String classifyConnectionError(String errMsg) {
        if (errMsg == null) {
            return "连接失败";
        }

        if (errMsg.contains("401") || errMsg.contains("unauthorized") || errMsg.contains("Unauthorized")) {
            return "认证失败，请检查API Key";
        }
        if (errMsg.contains("403") || errMsg.contains("forbidden")) {
            return "权限不足，请检查API Key权限";
        }
        if (errMsg.contains("404") || errMsg.contains("not found") || errMsg.contains("Not Found")) {
            return "API端点不存在，请检查Base URL";
        }
        if (errMsg.contains("timeout") || errMsg.contains("deadline exceeded")) {
            return "连接超时，请检查网络连接";
        }
        if (errMsg.contains("connection refused") || errMsg.contains("no such host") || errMsg.contains("dial tcp")) {
            return "无法连接到服务器，请检查Base URL";
        }

        return "连接失败";
    }

    /**
     * 去除 URL 末尾的斜杠
     */
    private String trimTrailingSlash(String url) {
        if (url == null) {
            return null;
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    /**
     * 构建 Chat API URL
     * 所有 provider 都追加 /chat/completions
     */
    private String buildChatUrl(String baseUrl) {
        String url = trimTrailingSlash(baseUrl);
        return url + "/chat/completions";
    }

    /**
     * 构建 Embedding API URL
     * - 阿里云: 追加 /api/v1/services/embeddings/multimodal-embedding/multimodal-embedding
     * - 其他: 追加 /embeddings
     */
    private String buildEmbeddingUrl(String baseUrl, String provider) {
        String url = trimTrailingSlash(baseUrl);
        // 使用 OpenAI 兼容的 /embeddings 端点
        return url + "/embeddings";
    }

    /**
     * 构建 Rerank API URL
     * - 阿里云、NVIDIA: 直接使用 baseUrl（已经是完整端点）
     * - OpenAI、Jina 等: 追加 /rerank
     */
    private String buildRerankUrl(String baseUrl, String provider) {
        String url = trimTrailingSlash(baseUrl);

        // 阿里云 DashScope 和 NVIDIA 的 baseUrl 已经是完整的 rerank 端点
        if (StrUtil.equalsIgnoreCase(provider, "aliyun") || StrUtil.equalsIgnoreCase(provider, "dashscope")
                || StrUtil.equalsIgnoreCase(provider, "nvidia")) {
            return url;
        }

        // OpenAI、Jina 等 provider 需要追加 /rerank
        return url + "/rerank";
    }

    /**
     * 构建 ASR API URL
     * 使用 OpenAI 兼容的 /audio/transcriptions 端点
     */
    private String buildASRUrl(String baseUrl) {
        String url = trimTrailingSlash(baseUrl);
        //  + "/audio/asr/transcriptions"
        return url;
    }

    /**
     * 构建多模态 API URL
     * 与 Chat 相同，追加 /chat/completions
     */
    private String buildMultimodalUrl(String baseUrl) {
        return buildChatUrl(baseUrl);
    }
}
