package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * <p>
 * 技能 SKILL.md 内容保存 DTO
 * </p>
 *
 * @author kjsc
 * @since 2026-09-21
 */
@Data
public class SkillCatalogFileSaveDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 技能目录定义 ID
     */
    @Schema(description = "技能目录定义 ID")
    @NotBlank(message = "id 不能为空")
    private String id;

    /**
     * 相对技能根目录的文件路径（当前仅支持根级 SKILL.md）
     */
    @Schema(description = "相对技能根目录的文件路径（当前仅支持根级 SKILL.md）")
    @NotBlank(message = "path 不能为空")
    private String path;

    /**
     * 文件内容
     */
    @Schema(description = "文件内容")
    @NotBlank(message = "content 不能为空")
    private String content;
}
