package com.iptv.business.service;

import jakarta.annotation.Nonnull;
import com.iptv.business.domain.EmbedChannels;
import com.iptv.business.domain.vo.EmbedChannelsVO;
import com.iptv.business.domain.dto.EmbedChannelsDTO;
import com.iptv.business.domain.dto.page.EmbedChannelsPageDTO;
import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;

/**
 * <p>
 * Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-02
 */
public interface EmbedChannelsService extends IService<EmbedChannels> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<EmbedChannelsVO> queryPage(EmbedChannelsPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    EmbedChannelsVO queryById(@Nonnull String id);

    /**
     * 新增
     *
     * @param dto 实体
     * @return 已保存实体
     */
    EmbedChannelsVO insert(@Nonnull EmbedChannelsDTO dto);

    /**
     * 按 id 更新
     *
     * @param dto 实体
     * @return 已更新实体
     */
    EmbedChannelsVO update(@Nonnull EmbedChannelsDTO dto);

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
