package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.StorageBackends;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.dto.StorageBackendsDTO;
import com.iptv.business.domain.dto.page.StorageBackendsPageDTO;
import com.iptv.business.domain.vo.StorageBackendsVO;
import com.iptv.business.enums.StorageBackendsProvider;
import com.iptv.business.pgmapper.StorageBackendsMapper;
import com.iptv.business.pgmapper.TenantsMapper;
import com.iptv.business.service.StorageBackendsService;
import com.iptv.business.util.CryptoUtils;
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
 * 具体对象/文件存储后端实例（可多实例同 provider） 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-21
 */
@Service
public class StorageBackendsServiceImpl extends ServiceImpl<StorageBackendsMapper, StorageBackends> implements StorageBackendsService {
    @Resource
    private TenantsMapper tenantsMapper;


    @Override
    public TableDataInfo<StorageBackendsVO> queryPage(StorageBackendsPageDTO dto, PageDTO pg) {
        Page<StorageBackendsVO> page = PageUtils.toPage(pg);
        List<StorageBackends> list = this.baseMapper.queryPage(dto, page);
        List<StorageBackendsVO> voList = BeanUtil.copyToList(list, StorageBackendsVO.class);

        if (CollUtil.isNotEmpty(voList)) {
            List<Tenants> tenantList = tenantsMapper.selectListByIdsIncludingDeleted(voList.stream().map(StorageBackendsVO::getTenantId).toArray(Integer[]::new));
            voList.forEach(vo ->
                    tenantList.stream()
                            .filter(t -> ObjectUtil.equal(t.getId(), vo.getTenantId()))
                            .findFirst()
                            .ifPresent(t -> {
                                vo.setTenantName(t.getName());
                                vo.setIsDefault(ObjectUtil.equal(vo.getId(), t.getDefaultStorageBackendId()));
                            })
            );
        }

        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public StorageBackendsVO queryById(@Nonnull String id) {
        StorageBackendsVO vo = null;
        StorageBackends entity = this.baseMapper.selectById(id);
        if (entity != null) {
            vo = BeanUtil.copyProperties(entity, StorageBackendsVO.class);
            Tenants tenants = tenantsMapper.selectByIdIncludingDeleted(entity.getTenantId());
            if (tenants != null) {
                vo.setTenantName(tenants.getName());
                vo.setIsDefault(ObjectUtil.equal(vo.getId(), tenants.getDefaultStorageBackendId()));
            }
        }
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public StorageBackendsVO insert(@Nonnull StorageBackendsDTO dto) {
        Tenants tenants = tenantsMapper.selectByIdIncludingDeleted(dto.getTenantId());
        if (tenants == null) {
            throw new ServiceException("租户不存在");
        }

        StorageBackends entity = BeanUtil.copyProperties(dto, StorageBackends.class);
        entity.setId(IdUtil.randomUUID());
        entity.setConfig(encryptConfig(entity.getProvider(), entity.getConfig()));
        entity.setSource(StrUtil.isBlank(entity.getSource()) ? "user" : entity.getSource());
        entity.setStatus("active");
        entity.setLegacyAlias(false);

        this.baseMapper.insert(entity);
        StorageBackendsVO vo = BeanUtil.copyProperties(entity, StorageBackendsVO.class);
        vo.setTenantName(tenants.getName());
        vo.setIsDefault(ObjectUtil.equal(vo.getId(), tenants.getDefaultStorageBackendId()));
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public StorageBackendsVO update(@Nonnull StorageBackendsDTO dto) {
        StorageBackends entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("存储后端实例不存在");
        }
        dto.setTenantId(entity.getTenantId()); // 不允许修改租户ID

        entity.setConfig(encryptConfig(dto.getProvider(), dto.getConfig()));
        BeanUtil.copyProperties(dto, entity);

        this.baseMapper.updateById(entity);
        StorageBackendsVO vo = BeanUtil.copyProperties(entity, StorageBackendsVO.class);
        Tenants tenants = tenantsMapper.selectByIdIncludingDeleted(entity.getTenantId());
        if (tenants != null) {
            vo.setTenantName(tenants.getName());
            vo.setIsDefault(ObjectUtil.equal(vo.getId(), tenants.getDefaultStorageBackendId()));
        }
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        StorageBackends entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }


    //----- private --------------------------------------------------------------------------------------

    /**
     * 加密 config 字段部分成员值
     */
    private String encryptConfig(String provider, String config) {
        StorageBackendsProvider pr = StorageBackendsProvider.codeOf(provider);
        if (pr == null) {
            return config;
        }

        JSONObject configJson = JSONUtil.parseObj(config);
        final String encryptedPrefix = "enc:v1:"; // 已加密前缀
        final String[] encryptKeys = {"access_key_id", "secret_access_key"}; // 需要加密的 keys

        for (String key : encryptKeys) {
            String value = configJson.get(key).toString();
            if (!value.startsWith(encryptedPrefix)) {
                configJson.set(key, CryptoUtils.encrypt(value));
            }
        }

        return configJson.toString();
    }
}
