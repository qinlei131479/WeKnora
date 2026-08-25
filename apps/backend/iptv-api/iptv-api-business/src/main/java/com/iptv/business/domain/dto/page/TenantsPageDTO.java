package com.iptv.business.domain.dto.page;

import java.util.Date;
import java.io.Serializable;
import lombok.Data;
import com.iptv.common.core.web.page.PageDTO;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * 工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class TenantsPageDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */
    @Schema(description = "主键 ID")
    private Integer id;

    /**
     * 工作空间名称
     */
    @Schema(description = "工作空间名称")
    private String name;

    /**
     * 工作空间描述
     */
    @Schema(description = "工作空间描述")
    private String description;

    /**
     * 检索引擎配置列表（JSONB）
     */
    @Schema(description = "检索引擎配置列表（JSONB）")
    private String retrieverEngines;

    /**
     * 工作空间状态（如 active）
     */
    @Schema(description = "工作空间状态（如 active）")
    private String status;

    /**
     * 业务标识
     */
    @Schema(description = "业务标识")
    private String business;

    /**
     * 存储配额（字节）
     */
    @Schema(description = "存储配额（字节）")
    private Long storageQuota;

    /**
     * 已用存储（字节）
     */
    @Schema(description = "已用存储（字节）")
    private Long storageUsed;

    /**
     * 智能体相关配置或会话最近请求状态（历史列名复用）
     */
    @Schema(description = "智能体相关配置或会话最近请求状态（历史列名复用）")
    private String agentConfig;

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
     * 全局上下文管理配置（会话默认）
     */
    @Schema(description = "全局上下文管理配置（会话默认）")
    private String contextConfig;

    /**
     * 全局对话配置（普通模式会话默认）
     */
    @Schema(description = "全局对话配置（普通模式会话默认）")
    private String conversationConfig;

    /**
     * 全局联网搜索配置
     */
    @Schema(description = "全局联网搜索配置")
    private String webSearchConfig;

    /**
     * 解析引擎覆盖配置（如 MinerU），覆盖环境变量
     */
    @Schema(description = "解析引擎覆盖配置（如 MinerU），覆盖环境变量")
    private String parserEngineConfig;

    /**
     * 存储引擎配置（Local/MinIO/COS 等）
     */
    @Schema(description = "存储引擎配置（Local/MinIO/COS 等）")
    private String storageEngineConfig;

    /**
     * 会话历史写入知识库并向量检索的配置
     */
    @Schema(description = "会话历史写入知识库并向量检索的配置")
    private String chatHistoryConfig;

    /**
     * 全局检索参数（知识检索与消息检索共用）
     */
    @Schema(description = "全局检索参数（知识检索与消息检索共用）")
    private String retrievalConfig;

    /**
     * 凭证配置（JSON，通常加密）
     */
    @Schema(description = "凭证配置（JSON，通常加密）")
    private String credentials;

    /**
     * X-API-Key 映射到终端主体的策略配置
     */
    @Schema(description = "X-API-Key 映射到终端主体的策略配置")
    private String apiPrincipalConfig;

    /**
     * 工作空间默认存储后端 ID
     */
    @Schema(description = "工作空间默认存储后端 ID")
    private String defaultStorageBackendId;
}
