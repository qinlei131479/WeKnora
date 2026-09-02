package com.iptv.business.service;

import jakarta.annotation.Nonnull;
import com.iptv.business.domain.AmpParserEngines;
import com.iptv.business.domain.vo.AmpParserEnginesVO;
import com.iptv.business.domain.dto.AmpParserEnginesDTO;
import com.iptv.business.domain.dto.page.AmpParserEnginesPageDTO;
import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;

/**
 * <p>
 * 文档解析引擎表 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-01
 */
public interface AmpParserEnginesService extends IService<AmpParserEngines> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<AmpParserEnginesVO> queryPage(AmpParserEnginesPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    AmpParserEnginesVO queryById(@Nonnull String id);

    /**
     * 新增
     *
     * @param dto 实体
     * @return 已保存实体
     */
    AmpParserEnginesVO insert(@Nonnull AmpParserEnginesDTO dto);

    /**
     * 按 id 更新
     *
     * @param dto 实体
     * @return 已更新实体
     */
    AmpParserEnginesVO update(@Nonnull AmpParserEnginesDTO dto);

    /**
     * 按 id 删除
     *
     * @param id 主键
     */
    void deleteById(@Nonnull String id);

    /**
     * 批量启用
     *
     * @param ids 主键列表
     * @return 影响行数
     */
    int updateEnabledBatch(@Nonnull List<String> ids);

    /**
     * 批量停用
     *
     * @param ids 主键列表
     * @return 影响行数
     */
    int updateDisabledBatch(@Nonnull List<String> ids);
}
