package com.iptv.business.service;

import jakarta.annotation.Nonnull;
import com.iptv.business.domain.CustomAgents;
import com.iptv.business.domain.vo.CustomAgentsVO;
import com.iptv.business.domain.dto.CustomAgentsDTO;
import com.iptv.business.domain.dto.page.CustomAgentsPageDTO;
import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;

/**
 * <p>
 * 自定义/内置智能体配置（与租户组成复合主键） 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-26
 */
public interface CustomAgentsService extends IService<CustomAgents> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<CustomAgentsVO> queryPage(CustomAgentsPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    CustomAgentsVO queryById(@Nonnull String id);

    /**
     * 按 id 删除
     *
     * @param id 主键
     */
    void deleteById(@Nonnull String id);
}
