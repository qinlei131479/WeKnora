package com.iptv.business.service;

import com.iptv.business.domain.dto.UserBindTenantsDTO;
import jakarta.annotation.Nonnull;
import com.iptv.business.domain.Users;
import com.iptv.business.domain.vo.UsersVO;
import com.iptv.business.domain.dto.UsersDTO;
import com.iptv.business.domain.dto.page.UsersPageDTO;
import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;

import java.util.List;

/**
 * <p>
 * 用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
public interface UsersService extends IService<Users> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<UsersVO> queryPage(UsersPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    UsersVO queryById(@Nonnull String id);

    /**
     * 新增
     *
     * @param dto 实体
     * @return 已保存实体
     */
    UsersVO insert(@Nonnull UsersDTO dto);

    /**
     * 按 id 更新
     *
     * @param dto 实体
     * @return 已更新实体
     */
    UsersVO update(@Nonnull UsersDTO dto);

    /**
     * 按 id 删除
     *
     * @param id 主键
     */
    void deleteById(@Nonnull String id);

    /**
     * 用户绑定租户
     *
     * @param dto 实体
     */
    void userBindTenants(@Nonnull UserBindTenantsDTO dto);
}
