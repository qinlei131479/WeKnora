package com.iptv.business.domain.dto.page;

import com.iptv.common.core.web.page.PageDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

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
public class KnowledgesPageDTO implements Serializable {

    private static final long serialVersionUID = 1L;


    /**
     * 知识库 ID
     */
    @Schema(description = "知识库 ID")
    private String knowledgeBaseId;

    /**
     * 解析状态（pending/processing/finalizing/completed/failed/cancelled 等）
     */
    @Schema(description = "解析状态（pending/processing/finalizing/completed/failed/cancelled 等）")
    private String parseStatus;

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
     * 来源渠道（web/api/im 等）
     */
    @Schema(description = "来源渠道（web/api/im 等）")
    private String channel;

    /**
     * 知识库内相对目录路径；空表示根目录（仅导航，非物理路径）
     */
    @Schema(description = "知识库内相对目录路径；空表示根目录（仅导航，非物理路径）")
    private String folderPath;

    @Schema(description = "搜索关键词")
    private String keyword;
}
