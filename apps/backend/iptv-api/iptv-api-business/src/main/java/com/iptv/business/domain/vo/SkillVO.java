package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 技能信息VO
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Data
@Schema(description = "技能信息")
public class SkillVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "技能名称")
    private String name;

    @Schema(description = "技能描述")
    private String description;
}
