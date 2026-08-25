package com.iptv.business.pgmapper;

import com.iptv.business.domain.Sessions;
import com.iptv.business.domain.dto.page.SessionsPageDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

/**
 * <p>
 * 对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列） Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
public interface SessionsMapper extends BaseMapper<Sessions> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<Sessions> queryPage(@Param("param") SessionsPageDTO param, Page page);
}
