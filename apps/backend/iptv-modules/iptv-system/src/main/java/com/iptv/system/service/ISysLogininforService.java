package com.iptv.system.service;

import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.system.api.domain.SysLogininfor;

/**
 * 系统访问日志情况信息 服务层
 * 
 * @author ruoyi
 */
public interface ISysLogininforService extends com.baomidou.mybatisplus.extension.service.IService<SysLogininfor>
{
    /**
     * 新增系统登录日志
     * 
     * @param logininfor 访问日志对象
     */
    public int insertLogininfor(SysLogininfor logininfor);

    /**
     * 查询系统登录日志集合
     * 
     * @param logininfor 访问日志对象
     * @return 登录记录集合
     */
    public TableDataInfo<SysLogininfor> selectLogininforList(SysLogininfor logininfor, PageDTO dto);

    /**
     * 批量删除系统登录日志
     * 
     * @param infoIds 需要删除的登录日志ID
     * @return 结果
     */
    public int deleteLogininforByIds(Long[] infoIds);

    /**
     * 清空系统登录日志
     */
    public void cleanLogininfor();
}
