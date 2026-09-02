package com.iptv.business.pgmapper;

import com.iptv.business.domain.EmbedChannels;
import com.iptv.business.domain.dto.page.EmbedChannelsPageDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

/**
 * <p>
 * Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-02
 */
public interface EmbedChannelsMapper extends BaseMapper<EmbedChannels> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<EmbedChannels> queryPage(@Param("param") EmbedChannelsPageDTO param, Page page);
}
