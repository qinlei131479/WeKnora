package com.iptv.business.domain;

import java.util.Date;
import java.io.Serializable;

import com.iptv.common.core.typehandler.JsonbTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;



/**
 * <p>
 * 知识分块：正文、索引状态、FAQ/图文关系、修订与上下文章节头
 * </p>
 *
 * @author kjsc
 * @since 2026-08-24
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "chunks",autoResultMap = true)
public class Chunks implements java.io.Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */


    @Schema(description = "主键 ID")
    private String id;

    /**
     * 租户 ID（多租户隔离）
     */


    @Schema(description = "租户 ID（多租户隔离）")
    private Integer tenantId;

    /**
     * 知识库 ID
     */


    @Schema(description = "知识库 ID")
    private String knowledgeBaseId;

    /**
     * 知识条目 ID
     */


    @Schema(description = "知识条目 ID")
    private String knowledgeId;

    /**
     * 正文内容
     */


    @Schema(description = "正文内容")
    private String content;

    /**
     * 在原文档中的分块序号
     */


    @Schema(description = "在原文档中的分块序号")
    private Integer chunkIndex;

    /**
     * 该版本/条目是否启用
     */


    @Schema(description = "该版本/条目是否启用")
    private Boolean isEnabled;

    /**
     * 原文起始字符位置
     */


    @Schema(description = "原文起始字符位置")
    private Integer startAt;

    /**
     * 原文结束字符位置
     */


    @Schema(description = "原文结束字符位置")
    private Integer endAt;

    /**
     * 上一分块 ID
     */


    @Schema(description = "上一分块 ID")
    private String preChunkId;

    /**
     * 下一分块 ID
     */


    @Schema(description = "下一分块 ID")
    private String nextChunkId;

    /**
     * 分块类型
     */


    @Schema(description = "分块类型")
    private String chunkType;

    /**
     * 父分块 ID
     */


    @Schema(description = "父分块 ID")
    private String parentChunkId;

    /**
     * 图片信息（JSON）
     */


    @Schema(description = "图片信息（JSON）")
    private String imageInfo;

    /**
     * 关联分块 ID 集合
     */
    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "关联分块 ID 集合")
    private String relationChunks;

    /**
     * 间接关联分块 ID 集合
     */


    @Schema(description = "间接关联分块 ID 集合")
    private String indirectRelationChunks;

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
     * 元数据（JSON）
     */
    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "元数据（JSON）")
    private String metadata;

    /**
     * 标签 ID
     */


    @Schema(description = "标签 ID")
    private String tagId;

    /**
     * 分块业务状态
     */


    @Schema(description = "分块业务状态")
    private Integer status;

    /**
     * 内容哈希
     */


    @Schema(description = "内容哈希")
    private String contentHash;

    /**
     * 位标志集合（如推荐状态）；默认含推荐位
     */


    @Schema(description = "位标志集合（如推荐状态）；默认含推荐位")
    private Integer flags;

    /**
     * 对外自增序号（API 友好）
     */


    @Schema(description = "对外自增序号（API 友好）")
    private Long seqId;

    /**
     * 视频信息（JSON）
     */


    @Schema(description = "视频信息（JSON）")
    private String videoInfo;

    /**
     * 解析器原始输出（不可变）；旧数据可能在首次编辑时回填
     */


    @Schema(description = "解析器原始输出（不可变）；旧数据可能在首次编辑时回填")
    private String sourceContent;

    /**
     * 用户编辑/回滚导致的内容修订号
     */


    @Schema(description = "用户编辑/回滚导致的内容修订号")
    private Integer contentRevision;

    /**
     * 检索索引同步状态（ready/processing/failed）
     */


    @Schema(description = "检索索引同步状态（ready/processing/failed）")
    private String indexStatus;

    /**
     * 当前版本编辑者；流水线可为空
     */


    @Schema(description = "当前版本编辑者；流水线可为空")
    private String lastEditorId;

    /**
     * 索引时前置的 Markdown 标题面包屑
     */


    @Schema(description = "索引时前置的 Markdown 标题面包屑")
    private String contextHeader;
}