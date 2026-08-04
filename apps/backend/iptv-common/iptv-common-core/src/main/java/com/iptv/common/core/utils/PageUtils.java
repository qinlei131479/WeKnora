package com.iptv.common.core.utils;

import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.metadata.OrderItem;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.iptv.common.core.constant.HttpStatus;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.enums.OrderByStatusEnum;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;

/**
 * 分页工具类
 *
 * @author ruoyi
 */
public class PageUtils {

    public static Page toPage(PageDTO pg) {
        if (pg == null) {
            return null;
        }
        // 分页参数设置默认值
        Integer pageSize = ObjectUtil.isNull(pg.getPageNum()) ? 10 : pg.getPageSize();
        Page page = ObjectUtil.isNull(pg.getPageNum()) ? new Page<>() : new Page<>(pg.getPageNum(), pageSize);
        // 排序参数设置默认值及排序字段转下划线
        String orderByColumn = pg.getOrderByColumn();
        if (StrUtil.isNotEmpty(orderByColumn)) {
            orderByColumn = StrUtil.toUnderlineCase(orderByColumn);
            if (OrderByStatusEnum.ASC.getCode().equalsIgnoreCase(pg.getIsAsc())) {
                page.addOrder(OrderItem.asc(orderByColumn));
            } else {
                page.addOrder(OrderItem.desc(orderByColumn));
            }
        }
        return page;
    }

    public static Page toPageOrDefault(PageDTO pg, int defaultPageNum, int defaultPageSize) {
        Page page = toPage(pg);
        if (page == null) {
            page = new Page(defaultPageNum, defaultPageSize);
        }
        return page;
    }

    public static <T> TableDataInfo<T> getDataTable(List<T> list, Page page) {
        TableDataInfo<T> rspData = new TableDataInfo<>();
        rspData.setCode(HttpStatus.SUCCESS);
        rspData.setRows(list);
        rspData.setMsg("查询成功");
        if (page != null) {
            rspData.setTotal(page.getTotal());
        }
        return rspData;
    }
}
