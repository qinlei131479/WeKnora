package com.iptv.business.pgmapper;

import com.iptv.business.domain.CustomAgents;
import com.iptv.business.domain.dto.page.CustomAgentsPageDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

/**
 * <p>
 * 自定义/内置智能体配置（与租户组成复合主键） Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-26
 */
public interface CustomAgentsMapper extends BaseMapper<CustomAgents> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<CustomAgents> queryPage(@Param("param") CustomAgentsPageDTO param, Page page);
}
