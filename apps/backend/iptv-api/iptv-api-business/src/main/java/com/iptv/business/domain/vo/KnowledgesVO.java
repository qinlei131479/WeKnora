package com.iptv.business.domain.vo;

import java.io.Serializable;
import java.util.Date;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * 知识条目（文档/FAQ/URL/手工等）：解析状态、文件元数据、目录路径
 * </p>
 *
 * @author kjsc
 * @since 2026-08-23
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class KnowledgesVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */
    @Schema(description = "主键 ID")
    private String id;

    /**
     * 所属工作空间（租户）ID
     */
    @Schema(description = "所属工作空间（租户）ID")
    private Integer tenantId;

    /**
     * 知识库 ID
     */
    @Schema(description = "知识库 ID")
    private String knowledgeBaseId;

    /**
     * 知识类型（document/faq/manual/url 等）
     */
    @Schema(description = "知识类型（document/faq/manual/url 等）")
    private String type;

    /**
     * 知识标题
     */
    @Schema(description = "知识标题")
    private String title;

    /**
     * 知识描述
     */
    @Schema(description = "知识描述")
    private String description;

    /**
     * 知识来源（URL 或 manual 等）
     */
    @Schema(description = "知识来源（URL 或 manual 等）")
    private String source;

    /**
     * 解析状态（pending/processing/finalizing/completed/failed/cancelled 等）
     */
    @Schema(description = "解析状态（pending/processing/finalizing/completed/failed/cancelled 等）")
    private String parseStatus;

    /**
     * 启用状态
     */
    @Schema(description = "启用状态")
    private String enableStatus;

    /**
     * 嵌入模型 ID
     */
    @Schema(description = "嵌入模型 ID")
    private String embeddingModelId;

    /**
     * 文件名（不含目录；目录见 folder_path）
     */
    @Schema(description = "文件名（不含目录；目录见 folder_path）")
    private String fileName;

    /**
     * 文件类型
     */
    @Schema(description = "文件类型")
    private String fileType;

    /**
     * 文件大小（字节）
     */
    @Schema(description = "文件大小（字节）")
    private Long fileSize;

    /**
     * 文件存储路径
     */
    @Schema(description = "文件存储路径")
    private String filePath;

    /**
     * 文件内容哈希
     */
    @Schema(description = "文件内容哈希")
    private String fileHash;

    /**
     * 占用存储大小（字节）
     */
    @Schema(description = "占用存储大小（字节）")
    private Long storageSize;

    /**
     * 元数据（JSON）
     */
    @Schema(description = "元数据（JSON）")
    private String metadata;

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
     * 处理完成时间
     */
    @Schema(description = "处理完成时间")
    private Date processedAt;

    /**
     * 错误信息
     */
    @Schema(description = "错误信息")
    private String errorMessage;

    /**
     * 软删除时间；非空表示已删除
     */
    @Schema(description = "软删除时间；非空表示已删除")
    private Date deletedAt;

    /**
     * 摘要异步任务状态
     */
    @Schema(description = "摘要异步任务状态")
    private String summaryStatus;

    /**
     * 最近一次 FAQ 导入结果
     */
    @Schema(description = "最近一次 FAQ 导入结果")
    private String lastFaqImportResult;

    /**
     * 来源渠道（web/api/im 等）
     */
    @Schema(description = "来源渠道（web/api/im 等）")
    private String channel;

    /**
     * 富化子任务未完成计数（finalizing 时有意义）
     */
    @Schema(description = "富化子任务未完成计数（finalizing 时有意义）")
    private Integer pendingSubtasksCount;

    /**
     * 用户可读的自定义元数据（与内部 metadata 分离）
     */
    @Schema(description = "用户可读的自定义元数据（与内部 metadata 分离）")
    private String customMetadata;

    /**
     * 知识库内相对目录路径；空表示根目录（仅导航，非物理路径）
     */
    @Schema(description = "知识库内相对目录路径；空表示根目录（仅导航，非物理路径）")
    private String folderPath;
}
