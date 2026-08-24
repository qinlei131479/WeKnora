package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.ObjectUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.VectorStores;
import com.iptv.business.domain.dto.VectorStoresDTO;
import com.iptv.business.domain.dto.page.VectorStoresPageDTO;
import com.iptv.business.domain.vo.StorageBackendsVO;
import com.iptv.business.domain.vo.VectorStoresVO;
import com.iptv.business.pgmapper.TenantsMapper;
import com.iptv.business.pgmapper.VectorStoresMapper;
import com.iptv.business.service.VectorStoresService;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * <p>
 * 向量库连接实例：引擎类型、连接与索引配置 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-24
 */
@Service
public class VectorStoresServiceImpl extends ServiceImpl<VectorStoresMapper, VectorStores> implements VectorStoresService {
    @Resource
    private TenantsMapper tenantsMapper;


    @Override
    public TableDataInfo<VectorStoresVO> queryPage(VectorStoresPageDTO dto, PageDTO pg) {
        Page<VectorStoresVO> page = PageUtils.toPage(pg);
        List<VectorStores> list = this.baseMapper.queryPage(dto, page);
        List<VectorStoresVO> voList = BeanUtil.copyToList(list, VectorStoresVO.class);

        if (CollUtil.isNotEmpty(voList)) {
            List<Tenants> tenantList = tenantsMapper.selectList(new LambdaQueryWrapper<Tenants>()
                    .in(Tenants::getId, voList.stream().map(VectorStoresVO::getTenantId).toList()));
            voList.forEach(vo -> {
                tenantList.stream()
                        .filter(t -> ObjectUtil.equal(t.getId(), vo.getTenantId()))
                        .findFirst()
                        .ifPresent(t ->
                                vo.setTenantName(t.getName())
                        );
            });
        }

        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public VectorStoresVO queryById(@Nonnull String id) {
        VectorStoresVO vo = null;
        VectorStores entity = this.baseMapper.selectById(id);
        if (entity != null) {
            vo = BeanUtil.copyProperties(entity, VectorStoresVO.class);
            Tenants tenants = tenantsMapper.selectById(entity.getTenantId());
            if (tenants != null) {
                vo.setTenantName(tenants.getName());
            }
        }
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public VectorStoresVO insert(@Nonnull VectorStoresDTO dto) {
        Tenants tenants = tenantsMapper.selectById(dto.getTenantId());
        if (tenants == null) {
            throw new ServiceException("租户不存在");
        }

        VectorStores entity = BeanUtil.copyProperties(dto, VectorStores.class);
        entity.setId(IdUtil.randomUUID());

        this.baseMapper.insert(entity);
        VectorStoresVO vo = BeanUtil.copyProperties(entity, VectorStoresVO.class);
        vo.setTenantName(tenants.getName());
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public VectorStoresVO update(@Nonnull VectorStoresDTO dto) {
        VectorStores entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("向量库连接实例不存在");
        }
        dto.setTenantId(entity.getTenantId()); // 不允许修改租户ID

        BeanUtil.copyProperties(dto, entity);

        this.baseMapper.updateById(entity);
        VectorStoresVO vo = BeanUtil.copyProperties(entity, VectorStoresVO.class);
        Tenants tenants = tenantsMapper.selectById(entity.getTenantId());
        if (tenants != null) {
            vo.setTenantName(tenants.getName());
        }
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        VectorStores entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }
}
