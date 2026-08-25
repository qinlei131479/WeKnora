package com.iptv.business.service;

import jakarta.annotation.Nonnull;
import com.iptv.business.domain.Messages;
import com.iptv.business.domain.vo.MessagesVO;
import com.iptv.business.domain.dto.MessagesDTO;
import com.iptv.business.domain.dto.page.MessagesPageDTO;
import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;

/**
 * <p>
 * 会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
public interface MessagesService extends IService<Messages> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<MessagesVO> queryPage(MessagesPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    MessagesVO queryById(@Nonnull String id);

    /**
     * 新增
     *
     * @param dto 实体
     * @return 已保存实体
     */
    MessagesVO insert(@Nonnull MessagesDTO dto);

    /**
     * 按 id 更新
     *
     * @param dto 实体
     * @return 已更新实体
     */
    MessagesVO update(@Nonnull MessagesDTO dto);

    /**
     * 按 id 删除
     *
     * @param id 主键
     */
    void deleteById(@Nonnull String id);
}
