package com.iptv.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.domain.vo.SelectVO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.system.api.domain.SysTenant;
import com.iptv.system.api.domain.dto.SysTenantFilterDTO;
import com.iptv.system.api.domain.dto.SysTenantReqDTO;
import com.iptv.system.api.domain.dto.SysTenantSaveDTO;
import com.iptv.system.api.domain.vo.*;

import java.util.List;
import java.util.Set;

/**
 * 租户服务接口
 */
public interface ISysTenantService extends IService<SysTenant> {

    /**
     * 分页查询租户列表
     */
    TableDataInfo<SysTenantVO> queryList(SysTenantFilterDTO condition, PageDTO pg);

    /**
     * 获取所有租户(下拉)
     */
    R<List<SysTenantReChangeVO>> getAlltenant();

    /**
     * 根据id查询
     */
    SysTenantVO queryById(Long id);

    /**
     * 更新租户
     */
    R<SysTenantVO> update(SysTenantSaveDTO saveVO);

    /**
     * 踢出租户下所有用户
     */
    void kickOutUserByTenantId(Long tenantId);

    /**
     * 新增租户
     */
    SysTenantVO insert(SysTenantReqDTO reqVO);

    /**
     * 启停状态改变
     */
    void changeStatus(Long id, String key);

    /**
     * 逻辑删除
     */
    void deleteUpdateById(Long id);

    /**
     * 编辑回显
     */
    SysTenantEchoVO getTenantData(Long tenantId);

    /**
     * BI模块查询租户列表
     */
    List<SysTenantReChangeVO> getAllTenantWhenBi();

    /**
     * 获取租户的所有下级租户id
     */
    Set<Long> getTenantChildrenIds(Long tenantId);

    /**
     * 租户下拉列表-根据用户所属租户查询
     */
    List<SysTenantAppSelectVO> selectTenantByUser();

    /**
     * 通过第三方租户编码查询租户
     */
    SysTenantRemoteVO getTenantByThirdId(String thirdTenantType, String thirdTenantId);

    /**
     * 验证租户名称是否重复
     */
    boolean checkName(Long tenantId, String name);

    /**
     * 验证租户编码是否重复
     */
    boolean checkThirdTenantId(Long tenantId, String thirdTenantType, String thirdTenantId);

    /**
     * 当前用户租户下拉列表
     */
    List<SelectVO<Long>> queryCurrentList(SysTenantFilterDTO condition);
}
