package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 智能体配置DTO
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Data
@Schema(description = "智能体配置")
public class CustomAgentConfigDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "智能体模式: quick-answer(RAG) 或 smart-reasoning(ReAct)")
    private String agentMode;

    @Schema(description = "智能体类型预设: rag-qa, wiki-qa, hybrid-rag-wiki, custom")
    private String agentType;

    @Schema(description = "系统提示词")
    private String systemPrompt;

    @Schema(description = "系统提示词模板ID")
    private String systemPromptId;

    @Schema(description = "上下文模板")
    private String contextTemplate;

    @Schema(description = "上下文模板ID")
    private String contextTemplateId;

    @Schema(description = "模型ID")
    private String modelId;

    @Schema(description = "重排序模型ID")
    private String rerankModelId;

    @Schema(description = "温度参数(0-1)")
    private Double temperature;

    @Schema(description = "最大完成token数")
    private Integer maxCompletionTokens;

    @Schema(description = "是否启用思考模式")
    private Boolean thinking;

    @Schema(description = "是否启用引用")
    private Boolean citationEnabled;

    @Schema(description = "ReAct循环最大迭代次数")
    private Integer maxIterations;

    @Schema(description = "LLM调用超时时间(秒)")
    private Integer llmCallTimeout;

    @Schema(description = "允许使用的工具列表")
    private List<String> allowedTools;

    @Schema(description = "MCP服务选择模式: all/selected/none")
    private String mcpSelectionMode;

    @Schema(description = "选中的MCP服务ID列表")
    private List<String> mcpServices;

    @Schema(description = "MCP授权等待超时(秒)")
    private Integer mcpAuthWaitTimeout;

    @Schema(description = "技能选择模式: all/selected/none")
    private String skillsSelectionMode;

    @Schema(description = "选中的技能列表")
    private List<String> selectedSkills;

    @Schema(description = "知识库选择模式: all/selected/none")
    private String kbSelectionMode;

    @Schema(description = "关联的知识库ID列表")
    private List<String> knowledgeBases;

    @Schema(description = "是否仅在@提及时检索知识库")
    private Boolean retrieveKbOnlyWhenMentioned;

    @Schema(description = "是否保留检索历史")
    private Boolean retainRetrievalHistory;

    @Schema(description = "是否启用图片上传")
    private Boolean imageUploadEnabled;

    @Schema(description = "VLM模型ID")
    private String vlmModelId;

    @Schema(description = "是否启用音频上传")
    private Boolean audioUploadEnabled;

    @Schema(description = "ASR模型ID")
    private String asrModelId;

    @Schema(description = "图片存储提供者")
    private String imageStorageProvider;

    @Schema(description = "支持的文件类型列表")
    private List<String> supportedFileTypes;

    @Schema(description = "聊天解析引擎规则")
    private List<ParserEngineRuleDTO> chatParserEngineRules;

    @Schema(description = "是否启用附件图片理解")
    private Boolean attachmentImageUnderstanding;

    @Schema(description = "附件OCR最大页数")
    private Integer attachmentOcrMaxPages;

    @Schema(description = "附件解析等待超时(秒)")
    private Integer attachmentParseWaitTimeoutSec;

    @Schema(description = "是否启用数据分析")
    private Boolean dataAnalysisEnabled;

    @Schema(description = "是否启用FAQ优先级")
    private Boolean faqPriorityEnabled;

    @Schema(description = "FAQ直接回答阈值")
    private Double faqDirectAnswerThreshold;

    @Schema(description = "FAQ分数提升倍数")
    private Double faqScoreBoost;

    @Schema(description = "是否启用网络搜索")
    private Boolean webSearchEnabled;

    @Schema(description = "网络搜索最大结果数")
    private Integer webSearchMaxResults;

    @Schema(description = "网络搜索提供者ID")
    private String webSearchProviderId;

    @Schema(description = "是否启用网页抓取")
    private Boolean webFetchEnabled;

    @Schema(description = "网页抓取Top N")
    private Integer webFetchTopN;

    @Schema(description = "是否启用多轮对话")
    private Boolean multiTurnEnabled;

    @Schema(description = "历史轮次数")
    private Integer historyTurns;

    @Schema(description = "向量检索Top K")
    private Integer embeddingTopK;

    @Schema(description = "关键词检索阈值")
    private Double keywordThreshold;

    @Schema(description = "向量检索阈值")
    private Double vectorThreshold;

    @Schema(description = "重排序Top K")
    private Integer rerankTopK;

    @Schema(description = "重排序阈值")
    private Double rerankThreshold;

    @Schema(description = "是否启用查询扩展")
    private Boolean enableQueryExpansion;

    @Schema(description = "是否启用查询重写")
    private Boolean enableRewrite;

    @Schema(description = "重写提示词系统消息")
    private String rewritePromptSystem;

    @Schema(description = "重写提示词用户消息")
    private String rewritePromptUser;

    @Schema(description = "查询理解模型ID")
    private String queryUnderstandModelId;

    @Schema(description = "回退策略: fixed/model")
    private String fallbackStrategy;

    @Schema(description = "固定回退响应")
    private String fallbackResponse;

    @Schema(description = "回退提示词")
    private String fallbackPrompt;

    @Schema(description = "意图提示词映射")
    private java.util.Map<String, String> intentPrompts;

    @Schema(description = "问题建议配置")
    private QuestionSuggestionConfigDTO questionSuggestions;
}
