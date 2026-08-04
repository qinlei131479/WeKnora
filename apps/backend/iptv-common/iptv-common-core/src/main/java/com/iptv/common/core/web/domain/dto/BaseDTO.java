package com.iptv.common.core.web.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * 基础DTO
 */
@Data
public class BaseDTO implements Serializable {

    public interface Insert {

    }

    public interface Update {

    }

    @Schema(description = "创建人", hidden = true)
    private String createBy = "admin";

    @Schema(description = "创建时间", hidden = true)
//	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;

    @Schema(description = "更新人", hidden = true)
    private String updateBy = "admin";

    @Schema(description = "更新时间", hidden = true)
//	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date updateTime;

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    @Schema(description = "变量参数map", hidden = true)
    private Map<String, Object> params;

    public Map<String, Object> getParams() {
        if (params == null) {
            params = new HashMap<>();
        }
        return params;
    }

    public void setParams(Map<String, Object> params) {
        this.params = params;
    }
}
