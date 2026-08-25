package com.iptv.business.service;

import jakarta.annotation.Nonnull;
import com.iptv.business.domain.Sessions;
import com.iptv.business.domain.vo.SessionsVO;
import com.iptv.business.domain.dto.SessionsDTO;
import com.iptv.business.domain.dto.page.SessionsPageDTO;
import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;

/**
 * <p>
 * 对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列） 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
public interface SessionsService extends IService<Sessions> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<SessionsVO> queryPage(SessionsPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    SessionsVO queryById(@Nonnull String id);

    /**
     * 新增
     *
     * @param dto 实体
     * @return 已保存实体
     */
    SessionsVO insert(@Nonnull SessionsDTO dto);

    /**
     * 按 id 更新
     *
     * @param dto 实体
     * @return 已更新实体
     */
    SessionsVO update(@Nonnull SessionsDTO dto);

    /**
     * 按 id 删除
     *
     * @param id 主键
     */
    void deleteById(@Nonnull String id);
}
