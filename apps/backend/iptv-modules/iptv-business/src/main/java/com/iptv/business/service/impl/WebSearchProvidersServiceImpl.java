package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.WebSearchProviderType;
import com.iptv.business.domain.WebSearchProviders;
import com.iptv.business.domain.dto.WebSearchCredentialsDTO;
import com.iptv.business.domain.dto.WebSearchProvidersDTO;
import com.iptv.business.domain.dto.WebSearchTestRequestDTO;
import com.iptv.business.domain.dto.page.WebSearchProvidersPageDTO;
import com.iptv.business.domain.vo.*;
import com.iptv.business.pgmapper.WebSearchProviderTypeMapper;
import com.iptv.business.pgmapper.WebSearchProvidersMapper;
import com.iptv.business.service.WebSearchProvidersService;
import com.iptv.business.service.impl.websearch.*;
import com.iptv.business.util.CryptoUtils;
import com.iptv.common.core.constant.TenantConstant;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * <p>
 * 租户级网络搜索提供商配置（密钥加密存储） 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-17
 */
@Slf4j
@Service
public class WebSearchProvidersServiceImpl extends ServiceImpl<WebSearchProvidersMapper, WebSearchProviders> implements WebSearchProvidersService {

    private final WebSearchProviderTypeMapper providerTypeMapper;

    public WebSearchProvidersServiceImpl(WebSearchProvidersMapper mapper, WebSearchProviderTypeMapper providerTypeMapper) {
        this.baseMapper = mapper;
        this.providerTypeMapper = providerTypeMapper;
    }

    @Override
    public TableDataInfo<WebSearchProvidersVO> queryPage(WebSearchProvidersPageDTO dto, PageDTO pg) {
        Page<WebSearchProvidersVO> page = PageUtils.toPage(pg);
        List<WebSearchProviders> list = this.baseMapper.queryPage(dto, page);
        List<WebSearchProvidersVO> voList = new ArrayList<>();
        for (WebSearchProviders item : list) {
            voList.add(convertToVO(item));
        }
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public WebSearchProvidersVO queryById(@Nonnull String id) {
        WebSearchProviders entity = this.baseMapper.selectById(id);
        if (entity == null) {
            throw new ServiceException("网络搜索提供商不存在");
        }
        return convertToVO(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WebSearchProvidersVO insert(@Nonnull WebSearchProvidersDTO dto) {
        WebSearchProviders entity = BeanUtil.copyProperties(dto, WebSearchProviders.class);
        entity.setTenantId(Long.valueOf(TenantConstant.BUSINESS_BUILTIN_TENANT_ID));
        entity.setCreatedAt(new Date());
        entity.setUpdatedAt(new Date());
        String parameters = entity.getParameters();
        if (StrUtil.isNotBlank(parameters)) {
            JSONObject params = JSONUtil.parseObj(parameters);
            String apiKey = params.getStr("api_key");
            if (StrUtil.isNotBlank(apiKey)) {
                params.set("api_key", CryptoUtils.encrypt(apiKey));
            }
            entity.setParameters(JSONUtil.toJsonStr(params));
        }
        this.baseMapper.insert(entity);
        return convertToVO(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WebSearchProvidersVO update(@Nonnull WebSearchProvidersDTO dto) {
        WebSearchProviders existing = this.baseMapper.selectById(dto.getId());
        if (existing == null) {
            throw new ServiceException("网络搜索提供商不存在");
        }

        // 解析现有 parameters
        JSONObject existingParams = StrUtil.isNotBlank(existing.getParameters())
                ? JSONUtil.parseObj(existing.getParameters())
                : new JSONObject();

        // 解析新的 parameters
        JSONObject newParams = StrUtil.isNotBlank(dto.getParameters())
                ? JSONUtil.parseObj(dto.getParameters())
                : new JSONObject();

        // 关键：api_key 永远不通过此接口更新，保留原有的 api_key
        if (existingParams.containsKey("api_key")) {
            newParams.set("api_key", existingParams.getStr("api_key"));
        }

        // 部分更新：空字段保留原值
        String mergedName = StrUtil.isNotBlank(dto.getName()) ? dto.getName() : existing.getName();
        String mergedDescription = StrUtil.isNotBlank(dto.getDescription()) ? dto.getDescription() : existing.getDescription();
        Boolean mergedIsDefault = dto.getIsDefault() != null ? dto.getIsDefault() : existing.getIsDefault();

        // 构建更新实体
        WebSearchProviders entity = new WebSearchProviders();
        entity.setId(dto.getId());
        entity.setName(mergedName);
        entity.setDescription(mergedDescription);
        entity.setIsDefault(mergedIsDefault);
        entity.setParameters(JSONUtil.toJsonStr(newParams));
        // provider 类型创建后不可变
        entity.setProvider(existing.getProvider());

        this.baseMapper.updateById(entity);

        // 重新查询获取完整数据
        WebSearchProviders updated = this.baseMapper.selectById(dto.getId());
        return convertToVO(updated);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        WebSearchProviders entity = this.baseMapper.selectById(id);
        if (entity != null) {
            this.baseMapper.deleteById(id);
        }
    }

    @Override
    public List<WebSearchProviderTypeVO> listProviderTypes() {
        // 从数据库查询所有启用的提供商类型
        List<WebSearchProviderType> types = providerTypeMapper.selectAllEnabled();
        
        List<WebSearchProviderTypeVO> result = new ArrayList<>();
        for (WebSearchProviderType type : types) {
            result.add(convertToTypeVO(type));
        }
        return result;
    }

    /**
     * 将数据库实体转换为 VO
     */
    private WebSearchProviderTypeVO convertToTypeVO(WebSearchProviderType entity) {
        WebSearchProviderTypeVO vo = new WebSearchProviderTypeVO();
        vo.setId(entity.getProviderType()); // 使用 provider_type 作为 id
        vo.setName(entity.getName());
        vo.setRequiresApiKey(entity.getRequiresApiKey());
        vo.setSupportsOptionalApiKey(entity.getSupportsOptionalApiKey());
        vo.setRequiresEngineId(entity.getRequiresEngineId());
        vo.setRequiresBaseUrl(entity.getRequiresBaseUrl());
        vo.setSupportsProxy(entity.getSupportsProxy());
        vo.setDescription(entity.getDescription());
        vo.setDocsUrl(entity.getDocsUrl());
        
        // 解析 config_fields JSON
        if (StrUtil.isNotBlank(entity.getConfigFields())) {
            try {
                List<WebSearchProviderConfigFieldVO> configFieldsList = JSONUtil.toList(
                    entity.getConfigFields(), WebSearchProviderConfigFieldVO.class);
                vo.setConfigFields(configFieldsList);
            } catch (Exception e) {
                log.warn("解析 config_fields 失败: {}", entity.getConfigFields(), e);
            }
        }
        
        return vo;
    }

    @Override
    public Map<String, Object> testProviderById(@Nonnull String id) {
        WebSearchProviders provider = this.baseMapper.selectById(id);
        if (provider == null) {
            throw new ServiceException("网络搜索提供商不存在");
        }

        // 从 parameters 中提取凭证
        JSONObject params = StrUtil.isNotBlank(provider.getParameters())
                ? JSONUtil.parseObj(provider.getParameters())
                : new JSONObject();

        // 执行测试
        return doTestSearch(provider.getProvider(), params);
    }

    @Override
    public Map<String, Object> testProviderRaw(@Nonnull WebSearchTestRequestDTO dto) {
        // 解析 parameters
        JSONObject params = StrUtil.isNotBlank(dto.getParameters())
                ? JSONUtil.parseObj(dto.getParameters())
                : new JSONObject();

        // 执行测试
        return doTestSearch(dto.getProvider(), params);
    }

    /**
     * 执行搜索测试
     * 
     * @param providerType 提供商类型
     * @param params 参数（包含凭证）
     * @return 测试结果
     */
    private Map<String, Object> doTestSearch(String providerType, JSONObject params) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 根据提供商类型创建对应的 Provider 实例
            WebSearchProvider searchProvider = createWebSearchProvider(providerType, params);
            
            // 执行测试搜索（固定查询 "test"，返回 1 条结果）
            int resultCount = searchProvider.testSearch("test", 1);
            
            if (resultCount == 0) {
                // 测试结果为空
                String errorMsg = getEmptyResultError(providerType, searchProvider);
                result.put("success", false);
                result.put("error", errorMsg);
                log.warn("[WebSearch][Test] {} returned 0 results", providerType);
            } else {
                // 测试成功
                result.put("success", true);
                result.put("message", "连接测试成功，返回 " + resultCount + " 条结果");
                log.info("[WebSearch][Test] {} succeeded, returned {} results", providerType, resultCount);
            }
            
        } catch (Exception e) {
            // 测试失败
            result.put("success", false);
            result.put("error", e.getMessage());
            log.error("[WebSearch][Test] {} failed: {}", providerType, e.getMessage(), e);
        }
        
        return result;
    }

    /**
     * 根据提供商类型创建对应的 WebSearchProvider 实例
     */
    private WebSearchProvider createWebSearchProvider(String providerType, JSONObject params) {
        String apiKey = CryptoUtils.decryptAesGcm(params.getStr("api_key"),CryptoUtils.getAesKey());
        
        switch (providerType.toLowerCase()) {
            case "bing":
                return new BingProvider(apiKey);
            case "tavily":
                return new TavilyProvider(apiKey);
            case "baidu":
                return new BaiduProvider(apiKey);
            case "duckduckgo":
                return new DuckDuckGoProvider();
            default:
                throw new ServiceException("不支持的搜索提供商类型: " + providerType);
        }
    }

    /**
     * 获取空结果时的错误信息
     */
    private String getEmptyResultError(String providerType, WebSearchProvider provider) {
        String diagnostics = provider.getEmptyResultDiagnostics();
        if (StrUtil.isNotBlank(diagnostics)) {
            return diagnostics;
        }
        
        switch (providerType.toLowerCase()) {
            case "duckduckgo":
                return "DuckDuckGo 返回 0 条结果，请检查网络连接和代理设置";
            case "searxng":
                return "SearXNG 返回 0 条结果，请验证实例 URL 和上游搜索引擎连通性";
            default:
                return "搜索返回 0 条结果，请验证 API 密钥和配置";
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CredentialsResponseVO updateOrQueryCredentials(@Nonnull WebSearchCredentialsDTO dto) {
        WebSearchProviders provider = this.baseMapper.selectById(dto.getId());
        if (provider == null) {
            throw new ServiceException("网络搜索提供商不存在");
        }

        // 解析 parameters
        JSONObject params = StrUtil.isNotBlank(provider.getParameters())
                ? JSONUtil.parseObj(provider.getParameters())
                : new JSONObject();

        // 如果 apiKey 为 null，仅查询配置状态
        if (BeanUtil.isEmpty(dto) || StrUtil.isBlank(dto.getApiKey())) {
            CredentialsResponseVO response = new CredentialsResponseVO();
            Map<String, CredentialFieldMetadataVO> fields = new HashMap<>();
            fields.put("api_key", new CredentialFieldMetadataVO(params.containsKey("api_key") && StrUtil.isNotBlank(params.getStr("api_key"))));
            response.setFields(fields);
            return response;
        }

        // 更新 api_key
        params.set("api_key", CryptoUtils.encrypt(dto.getApiKey()));
        WebSearchProviders updateEntity = new WebSearchProviders();
        updateEntity.setId(dto.getId());
        updateEntity.setParameters(JSONUtil.toJsonStr(params));
        this.baseMapper.updateById(updateEntity);

        // 返回更新后的状态
        CredentialsResponseVO response = new CredentialsResponseVO();
        Map<String, CredentialFieldMetadataVO> fields = new HashMap<>();
        fields.put("api_key", new CredentialFieldMetadataVO(StrUtil.isNotBlank(dto.getApiKey())));
        response.setFields(fields);
        return response;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCredentialField(@Nonnull String id, @Nonnull String field) {
        if (!"api_key".equals(field)) {
            throw new ServiceException("不支持的凭证字段: " + field);
        }

        WebSearchProviders provider = this.baseMapper.selectById(id);
        if (provider == null) {
            throw new ServiceException("网络搜索提供商不存在");
        }

        // 解析 parameters 并删除 api_key
        JSONObject params = StrUtil.isNotBlank(provider.getParameters())
                ? JSONUtil.parseObj(provider.getParameters())
                : new JSONObject();
        params.remove("api_key");

        WebSearchProviders updateEntity = new WebSearchProviders();
        updateEntity.setId(id);
        updateEntity.setParameters(JSONUtil.toJsonStr(params));
        this.baseMapper.updateById(updateEntity);
    }

    /**
     * 将实体转换为VO，并填充 credentials 字段（脱敏）
     */
    private WebSearchProvidersVO convertToVO(WebSearchProviders entity) {
        WebSearchProvidersVO vo = BeanUtil.copyProperties(entity, WebSearchProvidersVO.class);

        // 填充 credentials 字段（脱敏，仅显示配置状态）
        if (vo != null && StrUtil.isNotBlank(entity.getParameters())) {
            try {
                JSONObject params = JSONUtil.parseObj(entity.getParameters());
                Map<String, CredentialFieldMetadataVO> credentials = new HashMap<>();
                credentials.put("api_key", new CredentialFieldMetadataVO(
                        params.containsKey("api_key") && StrUtil.isNotBlank(params.getStr("api_key"))
                ));
                params.remove("api_key");
                vo.setCredentials(credentials);
                vo.setParameters(JSONUtil.toJsonStr(params));
            } catch (Exception e) {
                log.warn("解析 parameters 失败: {}", entity.getParameters(), e);
            }
        }

        return vo;
    }
}
