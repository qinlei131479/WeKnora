package com.iptv.business.service;

import com.iptv.business.domain.McpToolApprovals;
import com.iptv.business.domain.dto.McpToolApprovalsDTO;
import jakarta.annotation.Nonnull;
import com.iptv.business.domain.McpServices;
import com.iptv.business.domain.vo.McpServicesVO;
import com.iptv.business.domain.vo.McpTestResultVO;
import com.iptv.business.domain.dto.McpServicesDTO;
import com.iptv.business.domain.dto.page.McpServicesPageDTO;
import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;

/**
 * <p>
 * MCP service configurations 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-11
 */
public interface McpServicesService extends IService<McpServices> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<McpServicesVO> queryPage(McpServicesPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    McpServicesVO queryById(@Nonnull String id);

    /**
     * 新增
     *
     * @param dto 实体
     * @return 已保存实体
     */
    McpServicesVO insert(@Nonnull McpServicesDTO dto);

    /**
     * 按 id 更新
     *
     * @param dto 实体
     * @return 已更新实体
     */
    McpServicesVO update(@Nonnull McpServicesDTO dto);

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

    /**
     * 获取MCP已启用工具列表
     *
     * @param mcpId MCP service configurations ID
     * @return 工具审批记录列表
     */
    List<McpToolApprovals> listToolByMcpId(String mcpId);

    /**
     * 批量启用工具
     *
     * @param dto 工具审批记录DTO列表
     * @return 影响行数
     */
    void updateToolEnabledBatch(@Nonnull List<McpToolApprovalsDTO> dto);

    /**
     * 批量停用工具
     *
     * @param dto 工具审批记录DTO列表
     * @return 影响行数
     */
    void updateToolDisabledBatch(@Nonnull List<McpToolApprovalsDTO> dto);

    /**
     * 测试MCP服务连接
     *
     * @param id MCP服务ID
     * @return 测试结果
     */
    McpTestResultVO testMcpService(@Nonnull String id);
}
