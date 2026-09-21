package com.iptv.business.pgmapper;

import com.iptv.business.domain.AmpBuiltinTools;
import com.iptv.business.domain.dto.page.AmpBuiltinToolsPageDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

/**
 * <p>
 * Harness 内置工具只读目录，用于统一预览、依赖解析和统计 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-21
 */
public interface AmpBuiltinToolsMapper extends BaseMapper<AmpBuiltinTools> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<AmpBuiltinTools> queryPage(@Param("param") AmpBuiltinToolsPageDTO param, Page page);
}
