package com.iptv.system.service.impl;

import cn.hutool.core.util.ObjectUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.system.api.domain.SysOperLog;
import com.iptv.system.mapper.SysOperLogMapper;
import com.iptv.system.service.ISysOperLogService;
import com.iptv.system.service.ISysUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 操作日志 服务层处理
 *
 * @author ruoyi
 */
@Service
public class SysOperLogServiceImpl extends ServiceImpl<SysOperLogMapper, SysOperLog> implements ISysOperLogService {

    @Autowired
    private ISysUserService sysUserService;

    /**
     * 新增操作日志
     *
     * @param operLog 操作日志对象
     * @return 结果
     */
    @Override
    public int insertOperlog(SysOperLog operLog) {
        return this.baseMapper.insertOperlog(operLog);
    }

    /**
     * 查询系统操作日志集合
     *
     * @param operLog 操作日志对象
     * @return 操作日志集合
     */
    @Override
    public TableDataInfo<SysOperLog> selectOperLogList(SysOperLog operLog, PageDTO pageDTO) {
        Page page = PageUtils.toPage(pageDTO);
        operLog.setUserIds(sysUserService.getUserIdsByUserId());
        if (ObjectUtil.isNotNull(operLog.getBusinessType()) && 0 == operLog.getBusinessType()) {
            operLog.setBusinessTypes(new Integer[]{0, 4, 5, 6, 7, 8, 9});
            operLog.setBusinessType(null);
        }
        List<SysOperLog> list = this.baseMapper.selectOperLogList(operLog, page);
        return PageUtils.getDataTable(list, page);
    }

    /**
     * 批量删除系统操作日志
     *
     * @param operIds 需要删除的操作日志ID
     * @return 结果
     */
    @Override
    public int deleteOperLogByIds(Long[] operIds) {
        return this.baseMapper.deleteOperLogByIds(operIds);
    }

    /**
     * 查询操作日志详细
     *
     * @param operId 操作ID
     * @return 操作日志对象
     */
    @Override
    public SysOperLog selectOperLogById(Long operId) {
        return this.baseMapper.selectOperLogById(operId);
    }

    /**
     * 清空操作日志
     */
    @Override
    public void cleanOperLog() {
        this.baseMapper.cleanOperLog();
    }
}
