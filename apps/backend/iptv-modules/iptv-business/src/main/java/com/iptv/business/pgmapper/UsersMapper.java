package com.iptv.business.pgmapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.iptv.business.domain.Users;
import com.iptv.business.domain.dto.page.UsersPageDTO;
import org.apache.ibatis.annotations.Param;
import org.jspecify.annotations.NonNull;

import java.util.List;

/**
 * <p>
 * 用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
public interface UsersMapper extends BaseMapper<Users> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<Users> queryPage(@Param("param") UsersPageDTO param, Page page);

    /**
     * 按 id 数组查询包含逻辑删除的数据列表
     *
     * @param ids id 数组（length 为 0 表示查所有数据）
     * @return 数据列表
     */
    List<Users> selectListByIdsIncludingDeleted(@Param("ids") String... ids);

    /**
     * 按 id 查询包含逻辑删除的数据
     *
     * @param id id
     * @return 数据
     */
    Users selectByIdIncludingDeleted(@NonNull @Param("id") String id);
}
