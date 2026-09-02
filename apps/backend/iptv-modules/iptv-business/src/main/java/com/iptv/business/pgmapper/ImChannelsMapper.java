package com.iptv.business.pgmapper;

import com.iptv.business.domain.ImChannels;
import com.iptv.business.domain.dto.page.ImChannelsPageDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

/**
 * <p>
 * IM 渠道：平台凭证、绑定智能体、会话模式与输出模式 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-01
 */
public interface ImChannelsMapper extends BaseMapper<ImChannels> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<ImChannels> queryPage(@Param("param") ImChannelsPageDTO param, Page page);
}
