package com.iptv.business.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.iptv.common.core.typehandler.JsonbTypeHandler;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 模型厂商配置表
 */
@Data
@TableName(value = "amp_model_provider", autoResultMap = true)
@Schema(description = "模型厂商配置")
public class AmpModelProvider implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId
    @Schema(description = "主键ID")
    private String id;

    @Schema(description = "厂商标识，如 openai, aliyun, zhipu")
    private String name;

    @Schema(description = "显示名称，如 OpenAI, 阿里云 DashScope")
    private String displayName;

    @Schema(description = "厂商描述，包含代表性模型")
    private String description;

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "JSON格式，按模型类型区分的默认URL")
    private String defaultUrls;

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "JSON格式，支持的模型类型列表")
    private String modelTypes;

    @Schema(description = "是否需要API Key认证")
    private Boolean requiresAuth;

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "JSON格式，额外配置字段定义")
    private String extraFields;

    @Schema(description = "是否启用，false表示该厂商不可用")
    private Boolean enabled;

    @Schema(description = "排序序号，用于前端展示顺序")
    private Integer sortOrder;

    @Schema(description = "创建时间")
    private Date createdAt;

    @Schema(description = "更新时间")
    private Date updatedAt;
}
