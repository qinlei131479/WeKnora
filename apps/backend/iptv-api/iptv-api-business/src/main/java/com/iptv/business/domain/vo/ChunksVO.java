package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Date;

/**
 * <p>
 * 知识分块响应对象
 * </p>
 *
 * @author kjsc
 * @since 2026-08-31
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Schema(description = "知识分块响应对象")
public class ChunksVO {

    @Schema(description = "分块ID")
    private String id;

    @Schema(description = "租户ID")
    private Integer tenantId;

    @Schema(description = "知识库ID")
    private String knowledgeBaseId;

    @Schema(description = "知识条目ID")
    private String knowledgeId;

    @Schema(description = "分块内容")
    private String content;

    @Schema(description = "分块索引")
    private Integer chunkIndex;

    @Schema(description = "是否启用")
    private Boolean isEnabled;

    @Schema(description = "起始位置")
    private Integer startAt;

    @Schema(description = "结束位置")
    private Integer endAt;

    @Schema(description = "前一个分块ID")
    private String preChunkId;

    @Schema(description = "后一个分块ID")
    private String nextChunkId;

    @Schema(description = "分块类型")
    private String chunkType;

    @Schema(description = "父分块ID")
    private String parentChunkId;

    @Schema(description = "图片信息")
    private String imageInfo;

    @Schema(description = "关联分块")
    private String relationChunks;

    @Schema(description = "间接关联分块")
    private String indirectRelationChunks;

    @Schema(description = "创建时间")
    private Date createdAt;

    @Schema(description = "更新时间")
    private Date updatedAt;

    @Schema(description = "删除时间")
    private Date deletedAt;

    @Schema(description = "元数据")
    private String metadata;

    @Schema(description = "标签ID")
    private String tagId;

    @Schema(description = "状态")
    private Integer status;

    @Schema(description = "内容哈希")
    private String contentHash;

    @Schema(description = "标志位")
    private Integer flags;

    @Schema(description = "序列号")
    private Long seqId;

    @Schema(description = "视频信息")
    private String videoInfo;

    @Schema(description = "源内容")
    private String sourceContent;

    @Schema(description = "内容修订版本")
    private Integer contentRevision;

    @Schema(description = "索引状态")
    private String indexStatus;

    @Schema(description = "最后编辑者ID")
    private String lastEditorId;

    @Schema(description = "上下文标题")
    private String contextHeader;
}
