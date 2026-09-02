package com.iptv.business.pgmapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.iptv.business.domain.AmpParserEngines;
import com.iptv.business.domain.dto.page.AmpParserEnginesPageDTO;
import com.iptv.business.domain.vo.AmpParserEnginesVO;
import com.iptv.common.core.web.page.PageDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 文档解析引擎 Mapper
 *
 * @author kjsc
 * @since 2026-08-26
 */
@Mapper
public interface AmpParserEnginesMapper extends BaseMapper<AmpParserEngines> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<AmpParserEngines> queryPage(@Param("param") AmpParserEnginesPageDTO param, Page page);
}
