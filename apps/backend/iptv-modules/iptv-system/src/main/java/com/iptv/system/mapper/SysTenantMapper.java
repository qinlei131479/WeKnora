package com.iptv.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.iptv.system.api.domain.SysTenant;
import com.iptv.system.api.domain.dto.SysTenantFilterDTO;
import com.iptv.system.api.domain.vo.SysTenantAppSelectVO;
import com.iptv.system.api.domain.vo.SysTenantEchoVO;
import com.iptv.system.api.domain.vo.SysTenantReChangeVO;
import com.iptv.system.api.domain.vo.SysTenantVO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 租户 Mapper 接口
 */
public interface SysTenantMapper extends BaseMapper<SysTenant> {

    /**
     * 条件查询
     */
    List<SysTenant> queryByCondition(SysTenantFilterDTO condition);

    /**
     * 分页查询租户列表
     */
    List<SysTenantVO> getTenantList(@Param("condition") SysTenantFilterDTO condition, Page page);

    /**
     * 获取所有租户信息
     */
    List<SysTenantReChangeVO> getAllTenantList(@Param("tenantId") Long tenantId);

    /**
     * 根据租户id回显编辑数据
     */
    SysTenantEchoVO getTenantData(@Param("tenantId") Long tenantId);

    /**
     * 获取所有租户id
     */
    List<String> getAllTenantIds();

    /**
     * 修改子租户的祖先字段
     */
    void updateChildAncestors(@Param("oldAncestors") String oldAncestors,
                              @Param("newAncestors") String newAncestors,
                              @Param("childAncestors") String childAncestors);

    /**
     * 查询租户树（下拉列表）
     */
    List<SysTenantAppSelectVO> selectTenantApp(@Param("tenantId") Long tenantId,
                                               @Param("ancestors") String ancestors);
}
