package com.iptv.business.domain.vo;

import java.io.Serializable;
import java.util.Date;
import java.io.Serializable;

import com.iptv.business.domain.Models;
import com.iptv.business.domain.StorageBackends;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.VectorStores;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * 知识库主表：分块、向量库绑定、Wiki/FAQ/自动打标等配置
 * </p>
 *
 * @author kjsc
 * @since 2026-08-23
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class KnowledgeBasesVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */
    @Schema(description = "主键 ID")
    private String id;

    /**
     * 知识库名称
     */
    @Schema(description = "知识库名称")
    private String name;

    /**
     * 知识库描述
     */
    @Schema(description = "知识库描述")
    private String description;

    /**
     * 所属工作空间（租户）ID
     */
    @Schema(description = "所属工作空间（租户）ID")
    private Integer tenantId;

    /**
     * 所属工作空间
     */
    @Schema(description = "所属工作空间")
    private Tenants tenant;

    /**
     * 分块配置
     */
    @Schema(description = "分块配置")
    private String chunkingConfig;

    /**
     * 图片处理配置
     */
    @Schema(description = "图片处理配置")
    private String imageProcessingConfig;

    /**
     * 嵌入模型 ID
     */
    @Schema(description = "嵌入模型 ID")
    private String embeddingModelId;

    @Schema(description = "嵌入模型")
    private Models embeddingModel;

    /**
     * 摘要模型 ID
     */
    @Schema(description = "摘要模型 ID")
    private String summaryModelId;

    @Schema(description = "摘要模型")
    private Models summaryModel;

    /**
     * 遗留存储配置列（JSON）；兼容旧数据，新逻辑优先 storage_backend_id
     */
    @Schema(description = "遗留存储配置列（JSON）；兼容旧数据，新逻辑优先 storage_backend_id")
    private String cosConfig;

    /**
     * 视觉语言模型配置
     */
    @Schema(description = "视觉语言模型配置")
    private String vlmConfig;

    /**
     * 信息抽取配置
     */
    @Schema(description = "信息抽取配置")
    private String extractConfig;

    /**
     * 创建时间
     */
    @Schema(description = "创建时间")
    private Date createdAt;

    /**
     * 最后更新时间
     */
    @Schema(description = "最后更新时间")
    private Date updatedAt;

    /**
     * 软删除时间；非空表示已删除
     */
    @Schema(description = "软删除时间；非空表示已删除")
    private Date deletedAt;

    /**
     * 是否临时知识库（UI 通常隐藏）
     */
    @Schema(description = "是否临时知识库（UI 通常隐藏）")
    private Boolean isTemporary;

    /**
     * 知识库类型（document/faq/wiki 等）
     */
    @Schema(description = "知识库类型（document/faq/wiki 等）")
    private String type;

    /**
     * FAQ 专用配置
     */
    @Schema(description = "FAQ 专用配置")
    private String faqConfig;

    /**
     * 问题生成配置
     */
    @Schema(description = "问题生成配置")
    private String questionGenerationConfig;

    /**
     * 知识库存储提供商选择；凭证来自租户 StorageEngineConfig
     */
    @Schema(description = "知识库存储提供商选择；凭证来自租户 StorageEngineConfig")
    private String storageProviderConfig;

    /**
     * 是否置顶
     */
    @Schema(description = "是否置顶")
    private Boolean isPinned;

    /**
     * 置顶时间；未置顶时为空
     */
    @Schema(description = "置顶时间；未置顶时为空")
    private Date pinnedAt;

    /**
     * 语音识别（ASR）配置
     */
    @Schema(description = "语音识别（ASR）配置")
    private String asrConfig;

    /**
     * 绑定的向量库实例 ID（创建后通常不可改）
     */
    @Schema(description = "绑定的向量库实例 ID（创建后通常不可改）")
    private String vectorStoreId;

    @Schema(description = "向量库实例")
    private VectorStoresVO vectorStore;

    /**
     * Wiki 类型知识库配置
     */
    @Schema(description = "Wiki 类型知识库配置")
    private String wikiConfig;

    /**
     * Wiki合成模型
     */
    @Schema(description = "Wiki合成模型")
    private Models wikiSynthesisModel;

    /**
     * 索引管线开关（向量/关键词/Wiki/知识图谱等）
     */
    @Schema(description = "索引管线开关（向量/关键词/Wiki/知识图谱等）")
    private String indexingStrategy;

    /**
     * 创建者用户 ID
     */
    @Schema(description = "创建者用户 ID")
    private String creatorId;

    /**
     * 绑定的存储后端实例 ID
     */
    @Schema(description = "绑定的存储后端实例 ID")
    private String storageBackendId;

    @Schema(description = "绑定的存储后端实例")
    private StorageBackends storageBackend;

    /**
     * 解析后异步关联已有标签的配置
     */
    @Schema(description = "解析后异步关联已有标签的配置")
    private String autoTagConfig;

    /**
     * 知识库文件数量
     */
    @Schema(description = "知识库文件数量")
    private Long fileCount;
}
