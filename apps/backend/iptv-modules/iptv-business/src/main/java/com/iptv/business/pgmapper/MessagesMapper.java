package com.iptv.business.pgmapper;

import com.iptv.business.domain.Messages;
import com.iptv.business.domain.dto.page.MessagesPageDTO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

/**
 * <p>
 * 会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
public interface MessagesMapper extends BaseMapper<Messages> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<Messages> queryPage(@Param("param") MessagesPageDTO param, Page page);
}
