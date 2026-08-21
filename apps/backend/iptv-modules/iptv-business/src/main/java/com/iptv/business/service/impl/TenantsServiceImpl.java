package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.dto.TenantsDTO;
import com.iptv.business.domain.dto.page.TenantsPageDTO;
import com.iptv.business.domain.vo.TenantsVO;
import com.iptv.business.pgmapper.TenantsMapper;
import com.iptv.business.service.TenantsService;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

/**
 * <p>
 * 工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Slf4j
@Service
public class TenantsServiceImpl extends ServiceImpl<TenantsMapper, Tenants> implements TenantsService {

    // 默认存储配额：10GB
    private static final Long DEFAULT_STORAGE_QUOTA = 10L * 1024 * 1024 * 1024;

    @Override
    public TableDataInfo<TenantsVO> queryPage(TenantsPageDTO dto, PageDTO pg) {
        Page<TenantsVO> page = PageUtils.toPage(pg);
        List<Tenants> list = this.baseMapper.queryPage(dto, page);
        List<TenantsVO> voList = BeanUtil.copyToList(list, TenantsVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public TenantsVO queryById(@Nonnull String id) {
        Tenants entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, TenantsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TenantsVO insert(@Nonnull TenantsDTO dto) {
        log.info("Start creating tenant...");

        // 2. 创建租户实体
        Tenants entity = BeanUtil.copyProperties(dto, Tenants.class);

        // 3. 设置状态为active
        entity.setStatus("active");

        // 4. 设置创建时间和更新时间
        Date now = new Date();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        // 5. 设置默认存储配额（如果未提供）
        if (entity.getStorageQuota() == null || entity.getStorageQuota() <= 0) {
            entity.setStorageQuota(DEFAULT_STORAGE_QUOTA);
        }

        // 6. 设置已用存储为0
        if (entity.getStorageUsed() == null) {
            entity.setStorageUsed(0L);
        }

        // 7. 保存到数据库
        this.baseMapper.insert(entity);
        log.info("Tenant created successfully, ID: {}, name: {}", entity.getId(), entity.getName());

        return BeanUtil.copyProperties(entity, TenantsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TenantsVO update(@Nonnull TenantsDTO dto) {
        Tenants entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
        return BeanUtil.copyProperties(entity, TenantsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        Tenants entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }
}
