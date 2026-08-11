package com.iptv.business.service.impl;

import cn.hutool.core.date.DateUtil;
import com.iptv.business.pgmapper.McpServicesMapper;
import com.iptv.common.security.service.TokenService;
import com.iptv.system.api.model.LoginUser;
import jakarta.annotation.Nonnull;
import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.common.core.enums.EnableEnum;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.business.domain.McpServices;
import com.iptv.business.domain.vo.McpServicesVO;
import com.iptv.business.domain.dto.McpServicesDTO;
import com.iptv.business.domain.dto.page.McpServicesPageDTO;


import com.iptv.business.service.McpServicesService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

/**
 * <p>
 * MCP service configurations 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-11
 */
@Service
@RequiredArgsConstructor
public class McpServicesServiceImpl extends ServiceImpl<McpServicesMapper, McpServices> implements McpServicesService {

    private final TokenService tokenService;

    @Override
    public TableDataInfo<McpServicesVO> queryPage(McpServicesPageDTO dto, PageDTO pg) {
        Page<McpServicesVO> page = PageUtils.toPage(pg);
        List<McpServices> list = this.baseMapper.queryPage(dto, page);
        List<McpServicesVO> voList = BeanUtil.copyToList(list, McpServicesVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public McpServicesVO queryById(@Nonnull String id) {
        McpServices entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, McpServicesVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public McpServicesVO insert(@Nonnull McpServicesDTO dto) {
        Long tenantId = 1L;
        try{
            LoginUser loginUser = tokenService.getLoginUser();
            tenantId = loginUser.getSysUser().getTenantId();
        }catch (Exception e){
            throw new ServiceException("获取租户ID失败");
        }
        dto.setTenantId(tenantId.intValue());
        McpServices entity = BeanUtil.copyProperties(dto, McpServices.class);
        this.baseMapper.insert(entity);
        return BeanUtil.copyProperties(entity, McpServicesVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public McpServicesVO update(@Nonnull McpServicesDTO dto) {
        McpServices entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("MCP service configurations不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
        return BeanUtil.copyProperties(entity, McpServicesVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        McpServices entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            entity.setDeletedAt(new Date());
            this.baseMapper.updateById(entity);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateEnabledBatch(@Nonnull List<String> ids) {
        if (ids.isEmpty()) return 0;
        return this.baseMapper.update(new LambdaUpdateWrapper<McpServices>()
                .in(McpServices::getId, ids)
                .set(McpServices::getEnabled, true));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateDisabledBatch(@Nonnull List<String> ids) {
        if (ids.isEmpty()) return 0;
        return this.baseMapper.update(new LambdaUpdateWrapper<McpServices>()
                .in(McpServices::getId, ids)
                .set(McpServices::getEnabled, false));
    }
}
