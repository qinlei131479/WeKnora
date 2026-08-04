package com.iptv.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.iptv.system.api.domain.SysUserDept;

/**
 * <p>
 * 用户与部门关联表 Mapper 接口
 * </p>
 *
 * @author kjsc
 * @since 2024-12-23
 */
public interface SysUserDeptMapper extends BaseMapper<SysUserDept> {

    /**
     * 通过用户ID删除用户和部门关联
     *
     * @param userId 用户ID
     * @return 结果
     */
    public int deleteUserDeptByUserId(Long userId);

    /**
     * 批量删除用户和岗位关联
     *
     * @param ids 需要删除的数据ID
     * @return 结果
     */
    public int deleteUserDept(Long[] ids);
}
