package com.iptv.business.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.iptv.business.domain.CustomAgent;
import com.iptv.business.domain.dto.CustomAgentConfigDTO;
import com.iptv.business.domain.dto.CustomAgentDTO;
import com.iptv.business.domain.dto.QuestionSuggestionConfigDTO;
import com.iptv.business.domain.vo.CustomAgentVO;
import com.iptv.business.domain.vo.PlaceholderVO;
import com.iptv.business.domain.vo.SuggestedQuestionVO;
import com.iptv.business.pgmapper.CustomAgentMapper;
import com.iptv.business.service.CustomAgentService;
import com.iptv.common.core.constant.SecurityConstants;
import com.iptv.common.core.constant.TenantConstant;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.StringUtils;
import com.iptv.common.security.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 智能体服务实现类
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomAgentServiceImpl implements CustomAgentService {

    private final CustomAgentMapper customAgentMapper;

    // 内置智能体ID常量
    private static final String BUILTIN_QUICK_ANSWER_ID = "builtin-quick-answer";
    private static final String BUILTIN_SMART_REASONING_ID = "builtin-smart-reasoning";
    private static final String BUILTIN_WIKI_RESEARCHER_ID = "builtin-wiki-researcher";
    private static final String BUILTIN_DEEP_RESEARCHER_ID = "builtin-deep-researcher";
    private static final String BUILTIN_DATA_ANALYST_ID = "builtin-data-analyst";
    private static final String BUILTIN_KNOWLEDGE_GRAPH_EXPERT_ID = "builtin-knowledge-graph-expert";
    private static final String BUILTIN_DOCUMENT_ASSISTANT_ID = "builtin-document-assistant";
    
    // 内置智能体ID列表（按显示顺序）
    private static final List<String> BUILTIN_AGENT_IDS = List.of(
            BUILTIN_QUICK_ANSWER_ID,
            BUILTIN_SMART_REASONING_ID,
            BUILTIN_WIKI_RESEARCHER_ID,
            BUILTIN_DEEP_RESEARCHER_ID,
            BUILTIN_DATA_ANALYST_ID,
            BUILTIN_KNOWLEDGE_GRAPH_EXPERT_ID,
            BUILTIN_DOCUMENT_ASSISTANT_ID
    );

    // 智能体模式常量
    private static final String AGENT_MODE_QUICK_ANSWER = "quick-answer";
    private static final String AGENT_MODE_SMART_REASONING = "smart-reasoning";

    // 智能体类型常量
    private static final String AGENT_TYPE_RAG_QA = "rag-qa";
    private static final String AGENT_TYPE_WIKI_QA = "wiki-qa";
    private static final String AGENT_TYPE_HYBRID_RAG_WIKI = "hybrid-rag-wiki";
    private static final String AGENT_TYPE_CUSTOM = "custom";

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomAgentVO createAgent(CustomAgentDTO dto) {
        log.info("创建智能体: {}", dto.getName());

        // 验证名称
        if (StrUtil.isBlank(dto.getName())) {
            throw new ServiceException("智能体名称不能为空");
        }

        // 验证配置
        CustomAgentConfigDTO config = dto.getConfig();
        if (config == null) {
            config = new CustomAgentConfigDTO();
        }
        validateQuestionSuggestions(config.getQuestionSuggestions());

        // 生成UUID
        String agentId = UUID.randomUUID().toString();

        CustomAgent agent = new CustomAgent();
        agent.setId(agentId);
        agent.setName(dto.getName());
        agent.setDescription(dto.getDescription());
        agent.setAvatar(dto.getAvatar());
        agent.setIsBuiltin(true);
        agent.setTenantId(TenantConstant.BUSINESS_BUILTIN_TENANT_ID);
        agent.setCreatedBy(SecurityUtils.getUsername());
        agent.setCreatedAt(new Date());
        agent.setUpdatedAt(new Date());
        agent.setRunnableByViewer(true);

        // 应用默认值
        applyConfigDefaults(config);
        agent.setConfig(JSONUtil.toJsonStr(config));

        customAgentMapper.insert(agent);
        log.info("智能体创建成功: id={}, name={}", agentId, dto.getName());

        return convertToVO(agent);
    }

    @Override
    public CustomAgentVO getAgentById(String id) {
        log.info("获取智能体详情: id={}", id);

        if (StrUtil.isBlank(id)) {
            throw new ServiceException("智能体ID不能为空");
        }
        CustomAgent agent;

        // 如果是内置智能体ID，优先从数据库查询自定义配置
        if (isBuiltinAgentId(id)) {
            agent = customAgentMapper.selectByIdAndTenantId(id);
            if (agent != null) {
                // 数据库中有自定义配置，应用默认值后返回
                CustomAgentConfigDTO config = JSONUtil.toBean(agent.getConfig(), CustomAgentConfigDTO.class);
                applyConfigDefaults(config);
                agent.setConfig(JSONUtil.toJsonStr(config));
                return convertToVO(agent);
            }
            // 数据库中没有，返回默认内置配置
            agent = getBuiltinAgent(id);
        } else {
            // 查询自定义智能体
            agent = customAgentMapper.selectByIdAndTenantId(id);
            if (agent != null) {
                // 应用默认值
                CustomAgentConfigDTO config = JSONUtil.toBean(agent.getConfig(), CustomAgentConfigDTO.class);
                applyConfigDefaults(config);
                agent.setConfig(JSONUtil.toJsonStr(config));
            }
        }

        if (agent == null) {
            throw new ServiceException("智能体不存在");
        }

        return convertToVO(agent);
    }

    @Override
    public Map<String, Object> listAgents(String creator) {
        log.info("获取智能体列表, creator={}", creator);

        List<CustomAgent> agents = customAgentMapper.listAll();

        // 收集数据库中已存在的内置智能体ID
        Set<String> existingBuiltinIds = agents.stream()
                .filter(CustomAgent::getIsBuiltin)
                .map(CustomAgent::getId)
                .collect(Collectors.toSet());

        // 添加数据库中不存在的内置智能体（使用默认配置）
        List<CustomAgent> builtinAgents = getBuiltinAgents();
        for (CustomAgent builtinAgent : builtinAgents) {
            if (!existingBuiltinIds.contains(builtinAgent.getId())) {
                agents.add(builtinAgent);
            }
        }

        // 按创建者过滤
        if (StringUtils.isNotEmpty(creator)) {
            String currentUserName = SecurityUtils.getUsername();
            if ("mine".equals(creator)) {
                agents = agents.stream()
                        .filter(a -> a.getIsBuiltin() || StrUtil.equals(a.getCreatedBy(), currentUserName))
                        .collect(Collectors.toList());
            } else if ("others".equals(creator)) {
                agents = agents.stream()
                        .filter(a -> a.getIsBuiltin() || !StrUtil.equals(a.getCreatedBy(), currentUserName))
                        .collect(Collectors.toList());
            }
        }

        // 按内置智能体的固定顺序排序
        agents.sort((a, b) -> {
            if (a.getIsBuiltin() && b.getIsBuiltin()) {
                int indexA = BUILTIN_AGENT_IDS.indexOf(a.getId());
                int indexB = BUILTIN_AGENT_IDS.indexOf(b.getId());
                if (indexA == -1) indexA = Integer.MAX_VALUE;
                if (indexB == -1) indexB = Integer.MAX_VALUE;
                return Integer.compare(indexA, indexB);
            }
            // 内置智能体排在前面
            if (a.getIsBuiltin()) return -1;
            if (b.getIsBuiltin()) return 1;
            // 非内置智能体按创建时间倒序
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        // 批量回填创建者名称
        enrichAgentCreatorNames(agents);

        // 转换为VO
        List<CustomAgentVO> voList = agents.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        // 获取当前租户禁用的智能体ID列表
        List<String> disabledOwnAgentIds = customAgentMapper.selectDisabledOwnAgentIds(TenantConstant.BUSINESS_BUILTIN_TENANT_ID);

        Map<String, Object> result = new HashMap<>();
        result.put("data", voList);
        result.put("disabled_own_agent_ids", disabledOwnAgentIds);
        return result;
    }

    private void enrichAgentCreatorNames(List<CustomAgent> agents) {
        if (agents == null || agents.isEmpty()) {
            return;
        }

        // 收集所有创建者ID
        Set<String> creatorIds = agents.stream()
                .filter(a -> !a.getIsBuiltin() && StrUtil.isNotEmpty(a.getCreatedBy()))
                .map(CustomAgent::getCreatedBy)
                .collect(Collectors.toSet());

        if (creatorIds.isEmpty()) {
            return;
        }

        // 批量查询用户信息
        List<CustomAgentMapper.UserInfo> users = customAgentMapper.selectUsersByIds(new ArrayList<>(creatorIds));
        Map<String, String> userMap = users.stream()
                .collect(Collectors.toMap(
                        CustomAgentMapper.UserInfo::getUserId,
                        u -> StrUtil.isNotEmpty(u.getUserName()) ? u.getUserName() : u.getDisplayName(),
                        (a, b) -> a
                ));

        // 回填创建者名称
        for (CustomAgent agent : agents) {
            if (!agent.getIsBuiltin() && StrUtil.isNotEmpty(agent.getCreatedBy())) {
                agent.setCreatorName(userMap.get(agent.getCreatedBy()));
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomAgentVO updateAgent(CustomAgentDTO dto) {
        log.info("更新智能体: id={}", dto.getId());

        // 内置智能体特殊处理：只允许更新配置，不允许更新基本信息
        if (isBuiltinAgentId(dto.getId())) {
            return updateBuiltinAgent(dto, TenantConstant.BUSINESS_BUILTIN_TENANT_ID);
        }

        CustomAgent agent = customAgentMapper.selectByIdAndTenantId(dto.getId());

        if (agent == null) {
            throw new ServiceException("智能体不存在");
        }

        // 验证名称
        if (StrUtil.isBlank(dto.getName())) {
            throw new ServiceException("智能体名称不能为空");
        }

        // 更新字段
        agent.setName(dto.getName());
        agent.setDescription(dto.getDescription());
        agent.setAvatar(dto.getAvatar());

        if (dto.getConfig() != null) {
            CustomAgentConfigDTO config = dto.getConfig();
            applyConfigDefaults(config);
            validateQuestionSuggestions(config.getQuestionSuggestions());
            agent.setConfig(JSONUtil.toJsonStr(config));
        }
        agent.setUpdatedAt(new Date());

        customAgentMapper.updateById(agent);
        log.info("智能体更新成功: id={}", dto.getId());

        return convertToVO(agent);
    }

    /**
     * 更新内置智能体配置（只更新配置，保持基本信息不变）
     */
    private CustomAgentVO updateBuiltinAgent(CustomAgentDTO dto, Integer tenantId) {
        // 获取内置智能体默认配置
        CustomAgent defaultAgent = getBuiltinAgent(dto.getId());
        if (defaultAgent == null) {
            throw new ServiceException("内置智能体不存在");
        }

        // 尝试从数据库获取已存在的自定义配置
        CustomAgent existingAgent = customAgentMapper.selectByIdAndTenantId(dto.getId());

        if (existingAgent != null) {
            // 更新已存在的配置记录
            if (dto.getConfig() != null) {
                CustomAgentConfigDTO config = dto.getConfig();
                applyConfigDefaults(config);
                validateQuestionSuggestions(config.getQuestionSuggestions());
                existingAgent.setConfig(JSONUtil.toJsonStr(config));
            }
            existingAgent.setUpdatedAt(new Date());

            customAgentMapper.updateById(existingAgent);
            log.info("内置智能体配置更新成功: id={}", dto.getId());

            return convertToVO(existingAgent);
        }

        // 创建新的配置记录
        CustomAgent newAgent = new CustomAgent();
        newAgent.setId(defaultAgent.getId());
        newAgent.setName(defaultAgent.getName());
        newAgent.setDescription(defaultAgent.getDescription());
        newAgent.setAvatar(defaultAgent.getAvatar());
        newAgent.setIsBuiltin(true);
        newAgent.setTenantId(tenantId);

        if (dto.getConfig() != null) {
            CustomAgentConfigDTO config = dto.getConfig();
            applyConfigDefaults(config);
            validateQuestionSuggestions(config.getQuestionSuggestions());
            newAgent.setConfig(JSONUtil.toJsonStr(config));
        } else {
            newAgent.setConfig(defaultAgent.getConfig());
        }

        newAgent.setCreatedAt(new Date());
        newAgent.setUpdatedAt(new Date());

        customAgentMapper.insert(newAgent);
        log.info("内置智能体配置记录创建成功: id={}", dto.getId());

        return convertToVO(newAgent);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteAgent(String id) {
        log.info("删除智能体: id={}", id);

        // 内置智能体不允许删除
        if (isBuiltinAgentId(id)) {
            throw new ServiceException("无法删除内置智能体");
        }

        CustomAgent agent = customAgentMapper.selectByIdAndTenantId(id);

        if (agent == null) {
            throw new ServiceException("智能体不存在");
        }

        // 删除关联的IM渠道（如果存在）
        // TODO: 需要注入 IM 渠道服务并调用删除方法
        // imService.deleteChannelsByAgent(id, tenantId);

        // 软删除
        agent.setDeletedAt(new Date());
        customAgentMapper.updateById(agent);
        log.info("智能体删除成功: id={}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomAgentVO copyAgent(String id) {
        log.info("复制智能体: id={}", id);

        CustomAgent sourceAgent;

        // 支持复制内置智能体
        if (isBuiltinAgentId(id)) {
            sourceAgent = getBuiltinAgent(id);
        } else {
            sourceAgent = customAgentMapper.selectByIdAndTenantId(id);
        }

        if (sourceAgent == null) {
            throw new ServiceException("智能体不存在");
        }

        // 创建副本
        String newId = UUID.randomUUID().toString();
        CustomAgent newAgent = new CustomAgent();
        BeanUtils.copyProperties(sourceAgent, newAgent);
        newAgent.setId(newId);
        newAgent.setName(sourceAgent.getName() + " (副本)");
        newAgent.setIsBuiltin(false);
        newAgent.setCreatedBy(SecurityUtils.getUsername());
        newAgent.setCreatedAt(new Date());
        newAgent.setUpdatedAt(new Date());
        newAgent.setDeletedAt(null);

        customAgentMapper.insert(newAgent);
        log.info("智能体复制成功: sourceId={}, newId={}", id, newId);

        return convertToVO(newAgent);
    }

    @Override
    public Map<String, Object> getPlaceholders() {
        log.info("获取占位符定义");

        // 定义所有占位符
        List<PlaceholderVO> allPlaceholders = new ArrayList<>();
        allPlaceholders.add(createPlaceholder("query", "用户问题", "用户当前的问题或查询内容"));
        allPlaceholders.add(createPlaceholder("contexts", "检索内容", "从知识库检索到的相关内容列表"));
        allPlaceholders.add(createPlaceholder("current_time", "当前时间", "当前系统时间（格式：yyyy-MM-dd HH:mm:ss）"));
        allPlaceholders.add(createPlaceholder("current_week", "当前星期", "当前星期几（如：星期一、Monday）"));
        allPlaceholders.add(createPlaceholder("conversation", "历史对话", "格式化的历史对话内容，用于多轮对话改写"));
        allPlaceholders.add(createPlaceholder("yesterday", "昨天日期", "昨天的日期（格式：yyyy-MM-dd）"));
        allPlaceholders.add(createPlaceholder("answer", "助手回答", "助手的回答内容（用于对话历史格式化）"));
        allPlaceholders.add(createPlaceholder("knowledge_bases", "知识库列表", "自动格式化的知识库列表，包含名称、描述、文档数量等信息"));
        allPlaceholders.add(createPlaceholder("web_search_status", "网络搜索状态", "网络搜索工具是否启用的状态（Enabled 或 Disabled）"));
        allPlaceholders.add(createPlaceholder("language", "用户语言", "用户界面的语言偏好，如 Chinese (Simplified)、English 等"));

        // 按字段类型分组
        Map<String, Object> result = new HashMap<>();
        result.put("all", allPlaceholders);
        result.put("system_prompt", getPlaceholdersByField("system_prompt"));
        result.put("agent_system_prompt", getPlaceholdersByField("agent_system_prompt"));
        result.put("context_template", getPlaceholdersByField("context_template"));
        result.put("rewrite_system_prompt", getPlaceholdersByField("rewrite_system_prompt"));
        result.put("rewrite_prompt", getPlaceholdersByField("rewrite_prompt"));
        result.put("fallback_prompt", getPlaceholdersByField("fallback_prompt"));

        return result;
    }

    private List<PlaceholderVO> getPlaceholdersByField(String fieldType) {
        List<PlaceholderVO> placeholders = new ArrayList<>();
        switch (fieldType) {
            case "system_prompt":
                placeholders.add(createPlaceholder("query", "用户问题", "用户当前的问题或查询内容"));
                placeholders.add(createPlaceholder("contexts", "检索内容", "从知识库检索到的相关内容列表"));
                placeholders.add(createPlaceholder("current_time", "当前时间", "当前系统时间"));
                placeholders.add(createPlaceholder("current_week", "当前星期", "当前星期几"));
                placeholders.add(createPlaceholder("language", "用户语言", "用户界面的语言偏好"));
                break;
            case "agent_system_prompt":
                placeholders.add(createPlaceholder("knowledge_bases", "知识库列表", "自动格式化的知识库列表"));
                placeholders.add(createPlaceholder("web_search_status", "网络搜索状态", "网络搜索工具是否启用"));
                placeholders.add(createPlaceholder("current_time", "当前时间", "当前系统时间"));
                placeholders.add(createPlaceholder("language", "用户语言", "用户界面的语言偏好"));
                break;
            case "context_template":
                placeholders.add(createPlaceholder("query", "用户问题", "用户当前的问题或查询内容"));
                placeholders.add(createPlaceholder("contexts", "检索内容", "从知识库检索到的相关内容列表"));
                placeholders.add(createPlaceholder("current_time", "当前时间", "当前系统时间"));
                placeholders.add(createPlaceholder("current_week", "当前星期", "当前星期几"));
                placeholders.add(createPlaceholder("language", "用户语言", "用户界面的语言偏好"));
                break;
            case "rewrite_system_prompt":
            case "rewrite_prompt":
                placeholders.add(createPlaceholder("query", "用户问题", "用户当前的问题或查询内容"));
                placeholders.add(createPlaceholder("conversation", "历史对话", "格式化的历史对话内容"));
                placeholders.add(createPlaceholder("current_time", "当前时间", "当前系统时间"));
                placeholders.add(createPlaceholder("yesterday", "昨天日期", "昨天的日期"));
                placeholders.add(createPlaceholder("language", "用户语言", "用户界面的语言偏好"));
                break;
            case "fallback_prompt":
                placeholders.add(createPlaceholder("query", "用户问题", "用户当前的问题或查询内容"));
                placeholders.add(createPlaceholder("language", "用户语言", "用户界面的语言偏好"));
                break;
        }
        return placeholders;
    }

    @Override
    public List<Map<String, Object>> getAgentTypePresets() {
        log.info("获取智能体类型预设列表");

        List<Map<String, Object>> presets = new ArrayList<>();

        // RAG QA 预设
        Map<String, Object> ragQa = new HashMap<>();
        ragQa.put("id", AGENT_TYPE_RAG_QA);
        Map<String, Object> ragQaI18n = new HashMap<>();
        ragQaI18n.put("default", Map.of("label", "RAG Q&A", "description", "Evidence-based retrieval over document chunks. Best for document or FAQ KBs without Wiki."));
        ragQaI18n.put("zh-CN", Map.of("label", "RAG 问答", "description", "基于文档分块的检索式问答，适合未启用 Wiki 的文档 / FAQ 知识库。"));
        ragQa.put("i18n", ragQaI18n);
        Map<String, Object> ragQaConfig = new HashMap<>();
        ragQaConfig.put("system_prompt_id", "progressive_rag_agent");
        ragQaConfig.put("temperature", 0.7);
        ragQaConfig.put("max_iterations", 30);
        ragQaConfig.put("allowed_tools", List.of("knowledge_search", "grep_chunks", "list_knowledge_chunks", "get_document_info"));
        ragQaConfig.put("retain_retrieval_history", false);
        ragQaConfig.put("faq_priority_enabled", true);
        ragQaConfig.put("kb_selection_mode", "all");
        ragQa.put("config", ragQaConfig);
        presets.add(ragQa);

        // Wiki QA 预设
        Map<String, Object> wikiQa = new HashMap<>();
        wikiQa.put("id", AGENT_TYPE_WIKI_QA);
        Map<String, Object> wikiQaI18n = new HashMap<>();
        wikiQaI18n.put("default", Map.of("label", "Wiki Q&A", "description", "Wiki-first answering: search, read and follow links across wiki pages. Requires a Wiki-enabled KB."));
        wikiQaI18n.put("zh-CN", Map.of("label", "Wiki 问答", "description", "以 Wiki 为主的检索与图谱跳转回答，必须绑定已启用 Wiki 的知识库。"));
        wikiQa.put("i18n", wikiQaI18n);
        Map<String, Object> wikiQaConfig = new HashMap<>();
        wikiQaConfig.put("system_prompt_id", "wiki_researcher");
        wikiQaConfig.put("temperature", 0.7);
        wikiQaConfig.put("max_iterations", 30);
        wikiQaConfig.put("allowed_tools", List.of("wiki_search", "wiki_read_page", "wiki_read_source_doc", "wiki_flag_issue"));
        wikiQaConfig.put("retain_retrieval_history", false);
        wikiQaConfig.put("kb_selection_mode", "all");
        wikiQa.put("config", wikiQaConfig);
        presets.add(wikiQa);

        // Hybrid RAG Wiki 预设
        Map<String, Object> hybrid = new HashMap<>();
        hybrid.put("id", AGENT_TYPE_HYBRID_RAG_WIKI);
        Map<String, Object> hybridI18n = new HashMap<>();
        hybridI18n.put("default", Map.of("label", "Hybrid (Wiki + RAG)", "description", "Uses wiki pages for navigation and context, then drills into chunks for precise quotes. Requires KBs with BOTH Wiki and chunk indexing."));
        hybridI18n.put("zh-CN", Map.of("label", "Wiki + RAG 混合", "description", "先用 Wiki 建立导航和背景，再用分块检索精确引用。需绑定同时启用 Wiki 与向量/关键词索引的知识库。"));
        hybrid.put("i18n", hybridI18n);
        Map<String, Object> hybridConfig = new HashMap<>();
        hybridConfig.put("system_prompt_id", "hybrid_rag_wiki_agent");
        hybridConfig.put("temperature", 0.7);
        hybridConfig.put("max_iterations", 40);
        hybridConfig.put("allowed_tools", List.of("wiki_search", "wiki_read_page", "knowledge_search", "grep_chunks", "list_knowledge_chunks", "get_document_info", "wiki_flag_issue"));
        hybridConfig.put("retain_retrieval_history", false);
        hybridConfig.put("faq_priority_enabled", true);
        hybridConfig.put("kb_selection_mode", "all");
        hybrid.put("config", hybridConfig);
        presets.add(hybrid);

        // Data Analysis 预设
        Map<String, Object> dataAnalysis = new HashMap<>();
        dataAnalysis.put("id", "data-analysis");
        Map<String, Object> dataAnalysisI18n = new HashMap<>();
        dataAnalysisI18n.put("default", Map.of("label", "Data Analysis", "description", "SQL queries and statistics over tabular files (CSV / Excel). Pair with a KB that holds data files."));
        dataAnalysisI18n.put("zh-CN", Map.of("label", "数据分析", "description", "对 CSV / Excel 等表格文件执行 SQL 查询和统计分析。请绑定包含数据文件的知识库。"));
        dataAnalysis.put("i18n", dataAnalysisI18n);
        Map<String, Object> dataAnalysisConfig = new HashMap<>();
        dataAnalysisConfig.put("system_prompt_id", "data_analyst");
        dataAnalysisConfig.put("temperature", 0.3);
        dataAnalysisConfig.put("max_iterations", 30);
        dataAnalysisConfig.put("allowed_tools", List.of("data_schema", "data_analysis"));
        dataAnalysisConfig.put("web_search_enabled", false);
        dataAnalysisConfig.put("supported_file_types", List.of("csv", "xlsx"));
        dataAnalysisConfig.put("kb_selection_mode", "all");
        dataAnalysis.put("config", dataAnalysisConfig);
        Map<String, Object> dataAnalysisKbFilter = new HashMap<>();
        dataAnalysisKbFilter.put("none_of", List.of("faq"));
        dataAnalysis.put("kb_filter", dataAnalysisKbFilter);
        presets.add(dataAnalysis);

        // Custom 预设
        Map<String, Object> custom = new HashMap<>();
        custom.put("id", AGENT_TYPE_CUSTOM);
        Map<String, Object> customI18n = new HashMap<>();
        customI18n.put("default", Map.of("label", "Custom", "description", "Full control. Manually pick tools, prompt and KB scope."));
        customI18n.put("zh-CN", Map.of("label", "自定义", "description", "完全自定义：自行选择工具、提示词和知识库。"));
        custom.put("i18n", customI18n);
        presets.add(custom);

        return presets;
    }

    @Override
    public Map<String, Object> getSuggestedQuestions(
            String id,
            List<String> knowledgeBaseIds,
            List<String> knowledgeIds,
            String tagScopes,
            Integer limit) {
        log.info("获取推荐问题: agentId={}, kbIds={}, knowledgeIds={}, limit={}",
                id, knowledgeBaseIds, knowledgeIds, limit);

        // 限制参数处理
        final int SUGGESTION_DEFAULT_LIMIT = 6;
        final int SUGGESTION_MAX_LIMIT = 30;

        boolean limitProvided = limit != null && limit > 0;
        int effectiveLimit = limitProvided ? limit : SUGGESTION_DEFAULT_LIMIT;
        if (effectiveLimit > SUGGESTION_MAX_LIMIT) {
            effectiveLimit = SUGGESTION_MAX_LIMIT;
        }

        // 获取智能体
        CustomAgent agent;
        if (isBuiltinAgentId(id)) {
            agent = getBuiltinAgent(id);
        } else {
            agent = customAgentMapper.selectByIdAndTenantId(id);
        }

        if (agent == null) {
            throw new ServiceException("智能体不存在");
        }

        // 解析配置
        CustomAgentConfigDTO config = JSONUtil.toBean(agent.getConfig(), CustomAgentConfigDTO.class);
        if (config == null || config.getQuestionSuggestions() == null) {
            return Map.of("questions", new ArrayList<>());
        }

        var questionSuggestions = config.getQuestionSuggestions();
        var starters = questionSuggestions.getStarters();

        // 如果未启用，返回空
        if (starters == null || !starters.getEnabled()) {
            return Map.of("questions", new ArrayList<>());
        }

        // 如果未提供limit，使用配置的count
        if (!limitProvided && starters.getCount() != null && starters.getCount() > 0) {
            effectiveLimit = starters.getCount();
        }

        String starterMode = starters.getMode();
        if (StrUtil.isEmpty(starterMode)) {
            starterMode = "hybrid";
        }

        // 1. 收集预设问题（curated模式）
        List<SuggestedQuestionVO> curatedQuestions = new ArrayList<>();
        if ("curated".equals(starterMode) || "hybrid".equals(starterMode)) {
            if (starters.getItems() != null) {
                for (String item : starters.getItems()) {
                    if (StrUtil.isNotBlank(item)) {
                        SuggestedQuestionVO question = new SuggestedQuestionVO();
                        question.setQuestion(item.trim());
                        question.setSource("agent_config");
                        curatedQuestions.add(question);
                    }
                }
            }
        }

        // 如果是纯curated模式，直接返回
        if ("curated".equals(starterMode)) {
            return Map.of("questions", truncateQuestions(curatedQuestions, effectiveLimit));
        }

        // 2. 从知识库获取问题（knowledge/hybrid模式）
        // TODO: 需要实现以下功能以完全对齐Go代码：
        // - 根据knowledgeBaseIds、knowledgeIds、tagScopes查询FAQ chunks
        // - 查询Document chunks中的生成问题
        // - 查询Wiki pages作为补充来源
        // - 实现轮询选择算法确保多样性
        // - 需要创建ChunkMapper、WikiPageMapper等相关Mapper

        List<SuggestedQuestionVO> knowledgeQuestions = new ArrayList<>();

        // 临时实现：返回空的知识库问题列表
        // 实际应该从数据库查询FAQ、Document、Wiki等来源的问题

        // 3. 根据模式合并结果
        List<SuggestedQuestionVO> result;
        if ("knowledge".equals(starterMode)) {
            result = truncateQuestions(knowledgeQuestions, effectiveLimit);
        } else {
            // hybrid模式：优先curated，预留1/3给knowledge
            result = mergeHybridSuggestions(curatedQuestions, knowledgeQuestions, effectiveLimit);
        }

        return Map.of("questions", result);
    }

    /**
     * 截断问题列表到指定数量
     */
    private List<SuggestedQuestionVO> truncateQuestions(List<SuggestedQuestionVO> questions, int limit) {
        if (questions.size() <= limit) {
            return questions;
        }
        return questions.subList(0, limit);
    }

    /**
     * 混合模式合并建议：优先curated，预留约1/3给knowledge
     */
    private List<SuggestedQuestionVO> mergeHybridSuggestions(
            List<SuggestedQuestionVO> curated,
            List<SuggestedQuestionVO> knowledge,
            int limit) {
        if (limit <= 0) {
            return new ArrayList<>();
        }

        // 计算knowledge预留位置
        int knowledgeSlots = 0;
        if (limit > 1) {
            knowledgeSlots = (limit + 1) / 3;
        }
        int curatedSlots = limit - knowledgeSlots;

        List<SuggestedQuestionVO> result = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        // 添加curated问题（优先）
        int curatedAdded = 0;
        for (SuggestedQuestionVO q : curated) {
            if (result.size() >= limit || curatedAdded >= curatedSlots) {
                break;
            }
            String key = q.getQuestion().toLowerCase().trim();
            if (key.isEmpty() || seen.contains(key)) {
                continue;
            }
            seen.add(key);
            result.add(q);
            curatedAdded++;
        }

        // 添加knowledge问题
        int knowledgeAdded = 0;
        for (SuggestedQuestionVO q : knowledge) {
            if (result.size() >= limit || knowledgeAdded >= knowledgeSlots) {
                break;
            }
            String key = q.getQuestion().toLowerCase().trim();
            if (key.isEmpty() || seen.contains(key)) {
                continue;
            }
            seen.add(key);
            result.add(q);
            knowledgeAdded++;
        }

        // 继续添加剩余的curated问题
        for (SuggestedQuestionVO q : curated) {
            if (result.size() >= limit) {
                break;
            }
            String key = q.getQuestion().toLowerCase().trim();
            if (key.isEmpty() || seen.contains(key)) {
                continue;
            }
            seen.add(key);
            result.add(q);
        }

        // 继续添加剩余的knowledge问题
        for (SuggestedQuestionVO q : knowledge) {
            if (result.size() >= limit) {
                break;
            }
            String key = q.getQuestion().toLowerCase().trim();
            if (key.isEmpty() || seen.contains(key)) {
                continue;
            }
            seen.add(key);
            result.add(q);
        }

        return result;
    }

    // ========== 辅助方法 ==========

    private boolean isBuiltinAgentId(String id) {
        return BUILTIN_AGENT_IDS.contains(id);
    }

    private CustomAgent getBuiltinAgent(String id) {
        CustomAgent agent = new CustomAgent();
        agent.setId(id);
        agent.setIsBuiltin(true);
        agent.setTenantId(TenantConstant.BUSINESS_BUILTIN_TENANT_ID);
        agent.setCreatedAt(new Date());
        agent.setUpdatedAt(new Date());
        agent.setRunnableByViewer(true);

        CustomAgentConfigDTO config = new CustomAgentConfigDTO();

        switch (id) {
            case BUILTIN_QUICK_ANSWER_ID:
                agent.setName("快速问答");
                agent.setDescription("基于知识库的 RAG 问答，快速准确地回答问题");
                agent.setAvatar("⚡");
                config.setAgentMode(AGENT_MODE_QUICK_ANSWER);
                config.setWebSearchEnabled(true);
                config.setFaqPriorityEnabled(true);
                break;
            case BUILTIN_SMART_REASONING_ID:
                agent.setName("智能推理");
                agent.setDescription("ReAct 推理框架，支持多步思考与工具调用");
                agent.setAvatar("🧠");
                config.setAgentMode(AGENT_MODE_SMART_REASONING);
                config.setAgentType(AGENT_TYPE_RAG_QA);
                config.setMaxIterations(50);
                config.setAllowedTools(List.of(
                        "knowledge_search", "grep_chunks", "list_knowledge_chunks",
                        "query_knowledge_graph", "get_document_info"
                ));
                break;
            case BUILTIN_WIKI_RESEARCHER_ID:
                agent.setName("维基问答");
                agent.setDescription("专注于在 Wiki 知识库中回答问题的智能体");
                agent.setAvatar("📚");
                config.setAgentMode(AGENT_MODE_SMART_REASONING);
                config.setAgentType(AGENT_TYPE_WIKI_QA);
                config.setAllowedTools(List.of(
                        "wiki_search", "wiki_read_page", "wiki_read_source_doc", "wiki_flag_issue"
                ));
                config.setWebSearchEnabled(false);
                break;
            case BUILTIN_DEEP_RESEARCHER_ID:
                agent.setName("深度研究");
                agent.setDescription("深度研究智能体，支持复杂问题的多步骤分析");
                agent.setAvatar("🔬");
                config.setAgentMode(AGENT_MODE_SMART_REASONING);
                config.setAgentType(AGENT_TYPE_RAG_QA);
                config.setMaxIterations(100);
                break;
            case BUILTIN_DATA_ANALYST_ID:
                agent.setName("数据分析师");
                agent.setDescription("专业的数据分析智能体，支持对 CSV/Excel 文件进行 SQL 查询和统计分析");
                agent.setAvatar("📊");
                config.setAgentMode(AGENT_MODE_SMART_REASONING);
                config.setAgentType("data-analysis");
                config.setTemperature(0.3);
                config.setMaxCompletionTokens(4096);
                config.setMaxIterations(30);
                config.setSupportedFileTypes(List.of("csv", "xlsx"));
                config.setAllowedTools(List.of("data_schema", "data_analysis"));
                config.setWebSearchEnabled(false);
                break;
            case BUILTIN_KNOWLEDGE_GRAPH_EXPERT_ID:
                agent.setName("知识图谱专家");
                agent.setDescription("专注于知识图谱查询和分析的智能体");
                agent.setAvatar("🕸️");
                config.setAgentMode(AGENT_MODE_SMART_REASONING);
                config.setAllowedTools(List.of("query_knowledge_graph", "get_document_info"));
                break;
            case BUILTIN_DOCUMENT_ASSISTANT_ID:
                agent.setName("文档助手");
                agent.setDescription("文档处理和分析的智能体");
                agent.setAvatar("📄");
                config.setAgentMode(AGENT_MODE_SMART_REASONING);
                config.setAllowedTools(List.of("get_document_info", "knowledge_search"));
                break;
            default:
                return null;
        }

        applyConfigDefaults(config);
        agent.setConfig(JSONUtil.toJsonStr(config));
        return agent;
    }

    private List<CustomAgent> getBuiltinAgents() {
        List<CustomAgent> agents = new ArrayList<>();
        for (String agentId : BUILTIN_AGENT_IDS) {
            CustomAgent agent = getBuiltinAgent(agentId);
            if (agent != null) {
                agents.add(agent);
            }
        }
        return agents;
    }

    private void applyConfigDefaults(CustomAgentConfigDTO config) {
        if (config.getTemperature() == null) {
            config.setTemperature(0.7);
        }
        if (config.getMaxIterations() == null) {
            config.setMaxIterations(10);
        }
        if (config.getWebSearchMaxResults() == null) {
            config.setWebSearchMaxResults(5);
        }
        if (config.getHistoryTurns() == null) {
            config.setHistoryTurns(5);
        }
        if (config.getEmbeddingTopK() == null) {
            config.setEmbeddingTopK(10);
        }
        if (config.getKeywordThreshold() == null) {
            config.setKeywordThreshold(0.3);
        }
        if (config.getVectorThreshold() == null) {
            config.setVectorThreshold(0.5);
        }
        if (config.getRerankTopK() == null) {
            config.setRerankTopK(5);
        }
        if (StringUtils.isEmpty(config.getFallbackStrategy())) {
            config.setFallbackStrategy("model");
        }
        if (config.getMaxCompletionTokens() == null) {
            config.setMaxCompletionTokens(2048);
        }

        // 智能推理模式默认启用多轮对话
        if (AGENT_MODE_SMART_REASONING.equals(config.getAgentMode())) {
            config.setMultiTurnEnabled(true);
        }

        // 确保问题建议配置有默认值
        ensureQuestionSuggestionDefaults(config.getQuestionSuggestions());
    }

    /**
     * 确保问题建议配置有默认值（对应Go代码的EnsureDefaults）
     */
    private void ensureQuestionSuggestionDefaults(QuestionSuggestionConfigDTO config) {
        if (config == null) {
            return;
        }

        // 初始问题配置默认值
        if (config.getStarters() != null) {
            var starters = config.getStarters();
            if (StrUtil.isEmpty(starters.getMode())) {
                starters.setMode("hybrid");
            }
            if (starters.getCount() == null || starters.getCount() <= 0) {
                starters.setCount(6);
            }
            if (starters.getItems() == null) {
                starters.setItems(new ArrayList<>());
            }
        }

        // 后续问题配置默认值
        if (config.getFollowUps() != null) {
            var followUps = config.getFollowUps();
            if (StrUtil.isEmpty(followUps.getMode())) {
                followUps.setMode("hybrid");
            }
            if (followUps.getCount() == null || followUps.getCount() <= 0) {
                followUps.setCount(3);
            }
            if (followUps.getMaxContextTurns() == null || followUps.getMaxContextTurns() <= 0) {
                followUps.setMaxContextTurns(2);
            }
            if (followUps.getCategories() == null || followUps.getCategories().isEmpty()) {
                followUps.setCategories(List.of("clarify", "deepen", "action"));
            }
        }
    }

    private CustomAgentVO convertToVO(CustomAgent agent) {
        CustomAgentVO vo = new CustomAgentVO();
        BeanUtils.copyProperties(agent, vo);
        vo.setConfig(JSONUtil.toBean(agent.getConfig(), CustomAgentConfigDTO.class));
        return vo;
    }

    private PlaceholderVO createPlaceholder(String name, String label, String description) {
        PlaceholderVO placeholder = new PlaceholderVO();
        placeholder.setName(name);
        placeholder.setLabel(label);
        placeholder.setDescription(description);
        return placeholder;
    }

    /**
     * 验证问题建议配置
     */
    private void validateQuestionSuggestions(QuestionSuggestionConfigDTO config) {
        if (config == null) {
            return;
        }

        // 验证初始问题配置
        if (config.getStarters() != null) {
            var starters = config.getStarters();

            // 验证数量范围
            if (starters.getCount() != null) {
                if (starters.getCount() < 1 || starters.getCount() > 8) {
                    throw new ServiceException("初始问题数量必须在 1-8 之间");
                }
            }

            // 验证模式
            if (StrUtil.isNotEmpty(starters.getMode())) {
                String mode = starters.getMode();
                if (!"curated".equals(mode) && !"knowledge".equals(mode) && !"hybrid".equals(mode)) {
                    throw new ServiceException("无效的初始问题模式: " + mode);
                }
            }

            // 验证预设问题列表
            if (starters.getItems() != null) {
                for (int i = 0; i < starters.getItems().size(); i++) {
                    String item = starters.getItems().get(i);
                    if (StrUtil.isBlank(item)) {
                        throw new ServiceException("第 " + (i + 1) + " 个初始问题不能为空");
                    }
                    if (item.length() > 200) {
                        throw new ServiceException("第 " + (i + 1) + " 个初始问题不能超过 200 字符");
                    }
                }
            }
        }

        // 验证后续问题配置
        if (config.getFollowUps() != null) {
            var followUps = config.getFollowUps();

            // 验证数量范围
            if (followUps.getCount() != null) {
                if (followUps.getCount() < 1 || followUps.getCount() > 5) {
                    throw new ServiceException("后续问题数量必须在 1-5 之间");
                }
            }

            // 验证最大上下文轮数
            if (followUps.getMaxContextTurns() != null) {
                if (followUps.getMaxContextTurns() < 1 || followUps.getMaxContextTurns() > 5) {
                    throw new ServiceException("最大上下文轮数必须在 1-5 之间");
                }
            }

            // 验证模式
            if (StrUtil.isNotEmpty(followUps.getMode())) {
                String mode = followUps.getMode();
                if (!"generated".equals(mode) && !"knowledge".equals(mode) && !"hybrid".equals(mode)) {
                    throw new ServiceException("无效的后续问题模式: " + mode);
                }
            }

            // 验证额外指令长度
            if (StrUtil.isNotEmpty(followUps.getAdditionalInstruction())) {
                if (followUps.getAdditionalInstruction().length() > 2000) {
                    throw new ServiceException("后续问题额外指令不能超过 2000 字符");
                }
            }

            // 验证问题类别
            if (followUps.getCategories() != null) {
                for (String category : followUps.getCategories()) {
                    if (!"clarify".equals(category) && !"deepen".equals(category) && !"action".equals(category)) {
                        throw new ServiceException("无效的后续问题类别: " + category);
                    }
                }
            }
        }
    }
}
