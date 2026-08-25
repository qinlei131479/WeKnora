package com.iptv.business.service;

import com.iptv.business.domain.dto.ParserEngineCheckDTO;
import com.iptv.business.domain.dto.TenantBindUsersDTO;
import com.iptv.business.domain.dto.UserBindTenantsDTO;
import com.iptv.business.domain.vo.ParserEnginesVO;
import com.iptv.business.domain.vo.UsersVO;
import jakarta.annotation.Nonnull;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.Users;
import com.iptv.business.domain.vo.TenantsVO;
import com.iptv.business.domain.dto.TenantsDTO;
import com.iptv.business.domain.dto.page.TenantsPageDTO;
import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;

/**
 * <p>
 * 工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
public interface TenantsService extends IService<Tenants> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<TenantsVO> queryPage(TenantsPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    TenantsVO queryById(@Nonnull Integer id);

    /**
     * 新增工作空间
     *
     * @param dto 工作空间信息
     * @return 已保存实体
     */
    TenantsVO insert(@Nonnull TenantsDTO dto);

    /**
     * 按 id 更新
     *
     * @param dto 实体
     * @return 已更新实体
     */
    TenantsVO update(@Nonnull TenantsDTO dto);

    /**
     * 按 id 删除
     *
     * @param id 主键
     */
    void deleteById(@Nonnull Integer id);

    /**
     * 查询该租户下绑定的用户列表
     *
     * @param tenantId 租户 ID
     * @return 用户列表
     */
    List<UsersVO> bindUsers(Integer tenantId);

    /**
     * 绑定用户到工作空间
     *
     * @param dto 绑定信息
     */
    void tenantBindUsers(@Nonnull TenantBindUsersDTO dto);

    /**
     * 启用租户
     *
     * @param tenantId 租户 ID
     */
    void enable(Integer tenantId);

    /**
     * 禁用租户
     *
     * @param tenantId 租户 ID
     */
    void disable(Integer tenantId);

    /**
     * 列出当前租户可用的文档解析引擎
     *
     * @return 解析引擎列表及 DocReader 连接状态
     */
    ParserEnginesVO listParserEngines();

    /**
     * 使用给定配置参数检测解析引擎可用性（不保存）
     *
     * @param dto 解析引擎配置
     * @return 解析引擎列表及 DocReader 连接状态
     */
    ParserEnginesVO checkParserEngines(@Nonnull ParserEngineCheckDTO dto);
}
