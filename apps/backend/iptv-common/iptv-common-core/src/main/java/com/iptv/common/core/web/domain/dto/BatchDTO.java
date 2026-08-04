package com.iptv.common.core.web.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 批量操作DTO
 *
 * @author apple
 */
@Data
public class BatchDTO<T> implements Serializable {
    private static final long serialVersionUID = 1L;

    @Schema(description = "数据集合")
    private List<T> dataList;

}
