package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSON;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.AmpParserEngines;
import com.iptv.business.domain.StorageBackends;
import com.iptv.business.domain.TenantMembers;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.Users;
import com.iptv.business.domain.dto.ParserEngineCheckDTO;
import com.iptv.business.domain.dto.TenantBindUsersDTO;
import com.iptv.business.domain.dto.TenantsDTO;
import com.iptv.business.domain.dto.page.TenantsPageDTO;
import com.iptv.business.domain.vo.ParserEngineInfoVO;
import com.iptv.business.domain.vo.ParserEnginesVO;
import com.iptv.business.domain.vo.TenantsVO;
import com.iptv.business.domain.vo.UsersVO;
import com.iptv.business.enums.BusinessStatusEnum;
import com.iptv.business.pgmapper.AmpParserEnginesMapper;
import com.iptv.business.pgmapper.StorageBackendsMapper;
import com.iptv.business.pgmapper.TenantMembersMapper;
import com.iptv.business.pgmapper.TenantsMapper;
import com.iptv.business.pgmapper.UsersMapper;
import com.iptv.business.service.DocReaderGrpcService;
import com.iptv.business.service.TenantMembersService;
import com.iptv.business.service.TenantsService;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.security.utils.SecurityUtils;
import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * <p>
 * 工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Slf4j
@Service
public class TenantsServiceImpl extends ServiceImpl<TenantsMapper, Tenants> implements TenantsService {

    @Autowired
    private TenantMembersMapper tenantMembersMapper;

    @Autowired
    private UsersMapper usersMapper;

    @Autowired
    private TenantMembersService tenantMembersService;

    @Autowired
    private StorageBackendsMapper storageBackendsMapper;

    @Autowired
    private AmpParserEnginesMapper ampParserEnginesMapper;

    @Autowired
    private DocReaderGrpcService docReaderGrpcService;

    // 默认存储配额：10GB
    private static final Long DEFAULT_STORAGE_QUOTA = 10L * 1024 * 1024 * 1024;

    @Override
    public TableDataInfo<TenantsVO> queryPage(TenantsPageDTO dto, PageDTO pg) {
        Page<TenantsVO> page = PageUtils.toPage(pg);
        List<Tenants> list = this.baseMapper.queryPage(dto, page);
        List<TenantsVO> voList = BeanUtil.copyToList(list, TenantsVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public TenantsVO queryById(@Nonnull Integer id) {
        Tenants entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, TenantsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TenantsVO insert(@Nonnull TenantsDTO dto) {
        log.info("Start creating tenant...");

        Tenants entity = BeanUtil.copyProperties(dto, Tenants.class);
        entity.setStatus("active");
        entity.setBusiness("");

        // 设置默认存储配额（如果未提供）
        if (entity.getStorageQuota() == null || entity.getStorageQuota() <= 0) {
            entity.setStorageQuota(DEFAULT_STORAGE_QUOTA);
        }

        // 设置已用存储为0
        if (entity.getStorageUsed() == null) {
            entity.setStorageUsed(0L);
        }
        // 设置默认检索引擎配置列表（JSONB）
        Map<String, Object> retrieverEngines = new HashMap<>();
        retrieverEngines.put("engines", new ArrayList<>());
        entity.setRetrieverEngines(JSONUtil.toJsonStr(retrieverEngines));

        // 配置默认解析引擎
        List<AmpParserEngines> defaultParserEngines = ampParserEnginesMapper.selectList(new LambdaQueryWrapper<AmpParserEngines>()
                .eq(AmpParserEngines::getEnabled, true));
        if(CollUtil.isNotEmpty(defaultParserEngines)){
            Map<String, Object> defaultParserEnginesConfig = new HashMap<>();
            defaultParserEngines.forEach(engine -> {
                String engineConfig = engine.getEngineConfig();
                if(StrUtil.isNotBlank(engineConfig)){
                    try{
                        JSONObject entries = JSONUtil.parseObj(engineConfig);
                        defaultParserEnginesConfig.putAll(entries);
                    }catch (Exception e){
                        log.error("解析引擎配置失败，引擎名称：{}，错误信息：{}", engine.getName(), e.getMessage(), e);
                    }
                }
            });
            entity.setParserEngineConfig(JSONUtil.toJsonStr(defaultParserEnginesConfig));
        }

        // 保存到数据库
        this.baseMapper.insert(entity);
        log.info("Tenant created successfully, ID: {}, name: {}", entity.getId(), entity.getName());

        return BeanUtil.copyProperties(entity, TenantsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TenantsVO update(@Nonnull TenantsDTO dto) {
        Tenants entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
        return BeanUtil.copyProperties(entity, TenantsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull Integer id) {
        Tenants entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
            // 删除存储
            storageBackendsMapper.delete(new LambdaQueryWrapper<StorageBackends>()
                    .eq(StorageBackends::getTenantId, id));
        }
    }

    @Override
    public List<UsersVO> bindUsers(Integer tenantId) {
        List<TenantMembers> tenantMembers = tenantMembersMapper.selectList(new LambdaQueryWrapper<TenantMembers>()
                .eq(TenantMembers::getTenantId, tenantId)
                .eq(TenantMembers::getStatus, BusinessStatusEnum.ACTIVE.getCode()));
        if (CollUtil.isEmpty(tenantMembers)) {
            return Collections.emptyList();
        }
        // 查询用户信息
        List<Users> userList = usersMapper.selectList(new LambdaQueryWrapper<Users>()
                .in(Users::getId, tenantMembers.stream().map(TenantMembers::getUserId).collect(Collectors.toList())));
        if (CollUtil.isEmpty(userList)) {
            return Collections.emptyList();
        }
        return BeanUtil.copyToList(userList, UsersVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void tenantBindUsers(@Nonnull TenantBindUsersDTO dto) {
        // 1. 检查用户是否存在
        Tenants tenant = this.baseMapper.selectById(dto.getTenantId());
        if (BeanUtil.isEmpty(tenant)) {
            throw new ServiceException("租户不存在");
        }
        // 2. 检查租户是否存在
        List<Users> userList = usersMapper.selectList(new LambdaQueryWrapper<Users>()
                .in(Users::getId, dto.getUserIds()));
        if (CollUtil.isEmpty(userList)) {
            throw new ServiceException("用户不存在");
        }

        List<TenantMembers> tenantMembersList = new ArrayList<>();
        userList.forEach(user -> {
            TenantMembers tenantMember = TenantMembers.create(user, tenant, dto.getRole());
            tenantMembersList.add(tenantMember);
        });
        tenantMembersService.saveBatch(tenantMembersList);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void enable(Integer tenantId) {
        Tenants tenant = this.baseMapper.selectById(tenantId);
        if (BeanUtil.isEmpty(tenant)) {
            throw new ServiceException("租户不存在");
        }
        this.baseMapper.update(null,new LambdaUpdateWrapper<Tenants>()
                .eq(Tenants::getId, tenantId)
                .set(Tenants::getStatus, "active"));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void disable(Integer tenantId) {
        Tenants tenant = this.baseMapper.selectById(tenantId);
        if (BeanUtil.isEmpty(tenant)) {
            throw new ServiceException("租户不存在");
        }
        this.baseMapper.update(null,new LambdaUpdateWrapper<Tenants>()
                .eq(Tenants::getId, tenantId)
                .set(Tenants::getStatus, "inactive"));
    }

    // ==================== 解析引擎相关 ====================

    private static final String MINERU_CLOUD_BASE_URL = "https://mineru.net/api/v4";
    private static final String REDACTED_PLACEHOLDER = "***";

    @Override
    public ParserEnginesVO listParserEngines(Integer tenantId) {
        Tenants tenant = this.baseMapper.selectById(tenantId);
        Map<String, String> overrides = buildOverridesFromTenant(tenant);
        return doListParserEngines(overrides);
    }

    @Override
    public ParserEnginesVO checkParserEngines(@Nonnull ParserEngineCheckDTO dto) {
        Long tenantId = SecurityUtils.getTenantId();
        Tenants tenant = this.baseMapper.selectById(tenantId.intValue());
        Map<String, String> overrides = buildOverridesFromDTO(dto, tenant);
        return doListParserEngines(overrides);
    }

    /**
     * 从租户配置构建解析引擎覆盖参数
     */
    private Map<String, String> buildOverridesFromTenant(Tenants tenant) {
        Map<String, String> overrides = new LinkedHashMap<>();
        if (tenant == null) {
            return overrides;
        }
        // 解析 parserEngineConfig JSONB
        if (StrUtil.isNotBlank(tenant.getParserEngineConfig())) {
            try {
                JSONObject config = JSONUtil.parseObj(tenant.getParserEngineConfig());
                putIfNotBlank(overrides, "mineru_endpoint", config.getStr("mineru_endpoint"));
                putIfNotBlank(overrides, "mineru_api_key", config.getStr("mineru_api_key"));
                putIfNotBlank(overrides, "mineru_model", config.getStr("mineru_model"));
                putIfNotBlank(overrides, "mineru_vlm_server_url", config.getStr("mineru_vlm_server_url"));
                putIfNotBlank(overrides, "mineru_parse_method", config.getStr("mineru_parse_method"));
                putIfNotBlank(overrides, "mineru_language", config.getStr("mineru_language"));
                putIfNotBlank(overrides, "mineru_cloud_model", config.getStr("mineru_cloud_model"));
                putIfNotBlank(overrides, "mineru_cloud_language", config.getStr("mineru_cloud_language"));
                putIfNotBlank(overrides, "odl_hybrid", config.getStr("odl_hybrid"));
                putIfNotBlank(overrides, "odl_hybrid_url", config.getStr("odl_hybrid_url"));
                putIfNotBlank(overrides, "odl_hybrid_mode", config.getStr("odl_hybrid_mode"));
                putIfNotBlank(overrides, "paddleocr_vl_endpoint", config.getStr("paddleocr_vl_endpoint"));
                putIfNotBlank(overrides, "paddleocr_vl_cloud_token", config.getStr("paddleocr_vl_cloud_token"));
                putIfNotBlank(overrides, "paddleocr_vl_cloud_model", config.getStr("paddleocr_vl_cloud_model"));
            } catch (Exception e) {
                log.warn("解析 parserEngineConfig 失败: {}", e.getMessage());
            }
        }
        // 解析 credentials 中的 weknoracloud app_id
        if (StrUtil.isNotBlank(tenant.getCredentials())) {
            try {
                JSONObject creds = JSONUtil.parseObj(tenant.getCredentials());
                JSONObject weknora = creds.getJSONObject("weknoracloud");
                if (weknora != null && StrUtil.isNotBlank(weknora.getStr("app_id"))) {
                    overrides.put("weknoracloud_app_id", weknora.getStr("app_id"));
                }
            } catch (Exception e) {
                log.warn("解析 credentials 失败: {}", e.getMessage());
            }
        }
        return overrides;
    }

    /**
     * 从请求DTO构建覆盖参数（合并已有租户配置中的密钥）
     */
    private Map<String, String> buildOverridesFromDTO(ParserEngineCheckDTO dto, Tenants tenant) {
        Map<String, String> overrides = new LinkedHashMap<>();
        putIfNotBlank(overrides, "mineru_endpoint", dto.getMineruEndpoint());
        putIfNotBlank(overrides, "mineru_api_key", dto.getMineruApiKey());
        putIfNotBlank(overrides, "mineru_model", dto.getMineruModel());
        putIfNotBlank(overrides, "mineru_vlm_server_url", dto.getMineruVlmServerUrl());
        putIfNotBlank(overrides, "mineru_parse_method", dto.getMineruParseMethod());
        putIfNotBlank(overrides, "mineru_language", dto.getMineruLanguage());
        putIfNotBlank(overrides, "mineru_cloud_model", dto.getMineruCloudModel());
        putIfNotBlank(overrides, "mineru_cloud_language", dto.getMineruCloudLanguage());
        putIfNotBlank(overrides, "odl_hybrid", dto.getOdlHybrid());
        putIfNotBlank(overrides, "odl_hybrid_url", dto.getOdlHybridUrl());
        putIfNotBlank(overrides, "odl_hybrid_mode", dto.getOdlHybridMode());
        putIfNotBlank(overrides, "paddleocr_vl_endpoint", dto.getPaddleocrVlEndpoint());
        putIfNotBlank(overrides, "paddleocr_vl_cloud_token", dto.getPaddleocrVlCloudToken());
        putIfNotBlank(overrides, "paddleocr_vl_cloud_model", dto.getPaddleocrVlCloudModel());

        // 如果密钥字段为脱敏占位符，从已有配置中恢复
        if (tenant != null && StrUtil.isNotBlank(tenant.getParserEngineConfig())) {
            try {
                JSONObject existing = JSONUtil.parseObj(tenant.getParserEngineConfig());
                if (REDACTED_PLACEHOLDER.equals(overrides.get("mineru_api_key"))) {
                    putIfNotBlank(overrides, "mineru_api_key", existing.getStr("mineru_api_key"));
                }
                if (REDACTED_PLACEHOLDER.equals(overrides.get("paddleocr_vl_cloud_token"))) {
                    putIfNotBlank(overrides, "paddleocr_vl_cloud_token", existing.getStr("paddleocr_vl_cloud_token"));
                }
            } catch (Exception e) {
                log.warn("解析已有 parserEngineConfig 失败: {}", e.getMessage());
            }
        }

        // 补充 weknoracloud_app_id
        if (tenant != null && StrUtil.isNotBlank(tenant.getCredentials())) {
            try {
                JSONObject creds = JSONUtil.parseObj(tenant.getCredentials());
                JSONObject weknora = creds.getJSONObject("weknoracloud");
                if (weknora != null && StrUtil.isNotBlank(weknora.getStr("app_id"))) {
                    overrides.put("weknoracloud_app_id", weknora.getStr("app_id"));
                }
            } catch (Exception e) {
                log.warn("解析 credentials 失败: {}", e.getMessage());
            }
        }
        return overrides;
    }

    /**
     * 核心逻辑：合并本地引擎（DB）+ 远程引擎（gRPC），返回完整列表
     */
    private ParserEnginesVO doListParserEngines(Map<String, String> overrides) {
        String docreaderAddr = docReaderGrpcService.getAddr();
        boolean connected = docReaderGrpcService.isConnected();

        // 通过 gRPC 直连 docreader 获取远程引擎
        List<ParserEngineInfoVO> remoteEngines = docReaderGrpcService.listRemoteEngines(overrides);

        List<ParserEngineInfoVO> engines = mergeEngines(connected, overrides, remoteEngines);

        ParserEnginesVO vo = new ParserEnginesVO();
        vo.setEngines(engines);
        vo.setDocreaderAddr(StrUtil.trimToEmpty(docreaderAddr));
        vo.setDocreaderTransport("grpc");
        vo.setConnected(connected);
        return vo;
    }

    /**
     * 合并本地引擎（来自 amp_parser_engines 表）与远程发现引擎
     * 合并规则与 Go ListAllEngines 一致：
     * - 本地引擎始终包含，按 check_type 进行可用性检测
     * - 远程同名引擎覆盖 file_types 和 description
     * - 远程独有引擎追加到末尾
     */
    private List<ParserEngineInfoVO> mergeEngines(boolean docreaderConnected, Map<String, String> overrides, List<ParserEngineInfoVO> remoteEngines) {
        Map<String, ParserEngineInfoVO> remoteMap = new LinkedHashMap<>();
        for (ParserEngineInfoVO re : remoteEngines) {
            remoteMap.put(re.getName(), re);
        }

        // 从数据库加载已启用的本地引擎，按排序序号排列
        List<AmpParserEngines> localEngines = ampParserEnginesMapper.selectList(
                new LambdaQueryWrapper<AmpParserEngines>()
                        .eq(AmpParserEngines::getEnabled, true)
                        .orderByAsc(AmpParserEngines::getSortOrder));

        List<ParserEngineInfoVO> result = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (AmpParserEngines engine : localEngines) {
            seen.add(engine.getName());

            List<String> fileTypes = parseFileTypes(engine.getFileTypes());
            String description = engine.getDescription();

            // 远程同名引擎覆盖描述和文件类型
            ParserEngineInfoVO remote = remoteMap.get(engine.getName());
            if (remote != null) {
                if (CollUtil.isNotEmpty(remote.getFileTypes())) {
                    fileTypes = remote.getFileTypes();
                }
                if (StrUtil.isNotBlank(remote.getDescription())) {
                    description = remote.getDescription();
                }
            }

            // 按 check_type 检测可用性
            String[] checkResult = checkAvailability(engine, docreaderConnected, overrides);

            ParserEngineInfoVO info = new ParserEngineInfoVO();
            info.setName(engine.getName());
            info.setDescription(description);
            info.setFileTypes(fileTypes);
            info.setAvailable("true".equals(checkResult[0]));
            info.setUnavailableReason(checkResult[1]);
            result.add(info);
        }

        // 追加远程独有引擎
        for (ParserEngineInfoVO re : remoteEngines) {
            if (!seen.contains(re.getName())) {
                result.add(re);
            }
        }
        return result;
    }

    /**
     * 解析 file_types JSONB 字段为字符串列表
     */
    private List<String> parseFileTypes(String fileTypesJson) {
        if (StrUtil.isBlank(fileTypesJson)) {
            return Collections.emptyList();
        }
        try {
            return JSONUtil.parseArray(fileTypesJson).toList(String.class);
        } catch (Exception e) {
            log.warn("解析 file_types 失败: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * 根据引擎的 check_type 检测可用性
     *
     * @return [available("true"/"false"), unavailableReason]
     */
    private String[] checkAvailability(AmpParserEngines engine, boolean docreaderConnected, Map<String, String> overrides) {
        String checkType = StrUtil.trimToEmpty(engine.getCheckType());
        String configKey = StrUtil.trimToEmpty(engine.getConfigKey());
        switch (checkType) {
            case "none":
                // 无需检测，始终可用
                return new String[]{"true", ""};
            case "docreader":
                // 依赖 DocReader 连接
                if (docreaderConnected) {
                    return new String[]{"true", ""};
                }
                return new String[]{"false", "DocReader service not connected"};
            case "config":
                // 仅检查配置项是否存在
                if (StrUtil.isNotBlank(overrides.get(configKey))) {
                    return new String[]{"true", ""};
                }
                return new String[]{"false", engine.getDescription() + " 未配置"};
            case "http_ping":
                // HTTP 探测
                return pingByEngineName(engine.getName(), overrides.get(configKey));
            default:
                return new String[]{"true", ""};
        }
    }

    /**
     * 根据引擎名称执行对应的 HTTP 探测
     */
    private String[] pingByEngineName(String engineName, String configValue) {
        if (StrUtil.isBlank(configValue)) {
            return new String[]{"false", engineName + " 未配置"};
        }
        switch (engineName) {
            case "mineru":
                return pingMinerU(configValue);
            case "mineru_cloud":
                return pingMinerUCloud(configValue);
            case "paddleocr_vl":
                return pingPaddleOCRVL(configValue);
            default:
                // 其他 http_ping 引擎仅检查配置存在
                return new String[]{"true", ""};
        }
    }

    /**
     * Ping MinerU 自建服务
     */
    private String[] pingMinerU(String endpoint) {
        try {
            String url = StrUtil.removeSuffix(endpoint, "/") + "/docs";
            HttpResponse resp = HttpRequest.get(url).timeout(5000).execute();
            if (resp.getStatus() >= 400) {
                return new String[]{"false", "MinerU 服务返回状态 " + resp.getStatus()};
            }
            return new String[]{"true", ""};
        } catch (Exception e) {
            return new String[]{"false", "MinerU 服务不可达: " + e.getMessage()};
        }
    }

    /**
     * Ping MinerU Cloud API
     */
    private String[] pingMinerUCloud(String apiKey) {
        try {
            String url = MINERU_CLOUD_BASE_URL + "/file-urls/batch";
            HttpResponse resp = HttpRequest.post(url)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body("{\"files\":[],\"model_version\":\"pipeline\"}")
                    .timeout(10000)
                    .execute();
            if (resp.getStatus() == 401 || resp.getStatus() == 403) {
                return new String[]{"false", "MinerU Cloud API Key 无效"};
            }
            return new String[]{"true", ""};
        } catch (Exception e) {
            return new String[]{"false", "MinerU Cloud 不可达: " + e.getMessage()};
        }
    }

    /**
     * Ping PaddleOCR-VL 自建服务
     */
    private String[] pingPaddleOCRVL(String endpoint) {
        try {
            String url = StrUtil.removeSuffix(endpoint, "/") + "/layout-parsing";
            HttpResponse resp = HttpRequest.get(url).timeout(5000).execute();
            if (resp.getStatus() >= 500) {
                return new String[]{"false", "PaddleOCR-VL 服务返回状态 " + resp.getStatus()};
            }
            return new String[]{"true", ""};
        } catch (Exception e) {
            return new String[]{"false", "PaddleOCR-VL 服务不可达: " + e.getMessage()};
        }
    }

    private void putIfNotBlank(Map<String, String> map, String key, String value) {
        if (StrUtil.isNotBlank(value)) {
            map.put(key, value);
        }
    }
}
