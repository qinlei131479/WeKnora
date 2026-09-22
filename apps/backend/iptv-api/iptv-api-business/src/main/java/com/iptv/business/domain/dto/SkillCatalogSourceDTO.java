package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * <p>
 * 远程技能拉取请求 DTO（对齐 Go 端 skill source：registry / skills-sh / GitHub / GitLab / 直链）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-21
 */
@Data
public class SkillCatalogSourceDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 技能来源：@slug / skills-sh:owner/repo/slug / GitHub URL / GitLab URL / zip 或 SKILL.md 直链
     */
    @Schema(description = "技能来源：@slug、skills-sh:owner/repo/slug、GitHub/GitLab URL、zip 或 SKILL.md 直链")
    @NotBlank(message = "source 不能为空")
    private String source;
}
