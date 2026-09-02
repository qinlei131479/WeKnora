package com.iptv.business.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.iptv.common.core.typehandler.JsonbTypeHandler;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.io.Serializable;
import java.util.Date;

/**
 * 文档解析引擎表
 *
 * @author kjsc
 * @since 2026-09-01
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("amp_parser_engines")
public class AmpParserEngines implements Serializable {
    @Serial
    private static final long serialVersionUID = 6920955313753137185L;

    @TableId(type = IdType.AUTO)
    @Schema(description = "主键 ID")
    private Long id;

    @Schema(description = "引擎名称（唯一标识）")
    private String name;

    @Schema(description = "引擎描述")
    private String description;

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "支持的文件类型列表（JSON 数组）")
    private String fileTypes;

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "引擎配置（JSON 对象）")
    private String engineConfig;

    @Schema(description = "可用性检测方式：none-无需检测/docreader-依赖DocReader连接/config-仅检查配置项存在/http_ping-HTTP探测")
    private String checkType;

    @Schema(description = "检测所需的租户配置项名称（check_type=config/http_ping 时使用）")
    private String configKey;

    @Schema(description = "排序序号")
    private Integer sortOrder;

    @Schema(description = "是否启用")
    private Boolean enabled;

    @Schema(description = "创建时间")
    private Date createdAt;

    @Schema(description = "更新时间")
    private Date updatedAt;
}
