package com.iptv.common.core.web.page;

import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 分页数据
 *
 * @author ruoyi
 */
@Data
public class PageDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    // 当前记录起始索引
    @Schema(description = "页数")
    private Integer pageNum;

    // 每页显示记录数
    @Schema(description = "页大小")
    private Integer pageSize;

    // 排序列
    @Schema(description = "排序列名")
    private String orderByColumn;

    // 排序的方向
    @Schema(description = "正序倒序 asc/desc")
    private String isAsc = "desc";

    /**
     * 分页参数合理化
     */
    private Boolean reasonable = true;

    @Deprecated // 以后删除
    public String getOrderBy() {
        if (StrUtil.isEmpty(orderByColumn)) {
            return "";
        }
        return StrUtil.toUnderlineCase(orderByColumn) + " " + isAsc;
    }

    public void setIsAsc(String isAsc) {
        if (StrUtil.isNotEmpty(isAsc)) {
            // 兼容前端排序类型
            if ("ascending".equals(isAsc)) {
                isAsc = "asc";
            } else if ("descending".equals(isAsc)) {
                isAsc = "desc";
            }
            this.isAsc = isAsc;
        }
    }

    public Boolean getReasonable() {
        if (ObjectUtil.isNull(reasonable)) {
            return Boolean.TRUE;
        }
        return reasonable;
    }

    public void setReasonable(Boolean reasonable) {
        this.reasonable = reasonable;
    }
}
