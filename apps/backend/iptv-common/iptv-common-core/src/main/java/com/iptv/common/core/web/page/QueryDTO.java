package com.iptv.common.core.web.page;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.util.Date;

/**
 * 查询DTO
 *
 * @author apple
 */
@Data
@Tag(name = "时间范围查询参数")
public class QueryDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "关键字查询")
    private String keyWord;

    @Schema(description = "开始时间")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date beginTime;

    @Schema(description = "结束时间")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date endTime;
}
