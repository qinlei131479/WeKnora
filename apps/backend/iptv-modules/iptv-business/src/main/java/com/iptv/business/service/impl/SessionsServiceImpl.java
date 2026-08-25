package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.ObjectUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.Sessions;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.Users;
import com.iptv.business.domain.dto.SessionsDTO;
import com.iptv.business.domain.dto.page.SessionsPageDTO;
import com.iptv.business.domain.vo.SessionsVO;
import com.iptv.business.pgmapper.SessionsMapper;
import com.iptv.business.pgmapper.TenantsMapper;
import com.iptv.business.pgmapper.UsersMapper;
import com.iptv.business.service.SessionsService;
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
 * 对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列） 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
@Service
public class SessionsServiceImpl extends ServiceImpl<SessionsMapper, Sessions> implements SessionsService {
    @Resource
    private TenantsMapper tenantsMapper;
    @Resource
    private UsersMapper usersMapper;


    @Override
    public TableDataInfo<SessionsVO> queryPage(SessionsPageDTO dto, PageDTO pg) {
        Page<SessionsVO> page = PageUtils.toPage(pg);
        List<Sessions> list = this.baseMapper.queryPage(dto, page);
        List<SessionsVO> voList = BeanUtil.copyToList(list, SessionsVO.class);

        if (CollUtil.isNotEmpty(voList)) {
            List<Tenants> tenantList = tenantsMapper.selectListByIdsIncludingDeleted(voList.stream().map(SessionsVO::getTenantId).toArray(Integer[]::new));
            List<Users> userList = usersMapper.selectListByIdsIncludingDeleted(voList.stream().map(SessionsVO::getUserId).toArray(String[]::new));
            voList.forEach(vo -> {
                tenantList.stream()
                        .filter(t -> ObjectUtil.equal(t.getId(), vo.getTenantId()))
                        .findFirst()
                        .ifPresent(t -> vo.setTenantName(t.getName()));
                userList.stream()
                        .filter(u -> ObjectUtil.equal(u.getId(), vo.getUserId()))
                        .findFirst()
                        .ifPresent(u -> vo.setUsername(u.getUsername()));
            });
        }

        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public SessionsVO queryById(@Nonnull String id) {
        SessionsVO vo = null;
        Sessions entity = this.baseMapper.selectById(id);
        if (entity != null) {
            vo = BeanUtil.copyProperties(entity, SessionsVO.class);
            Tenants tenant = tenantsMapper.selectByIdIncludingDeleted(entity.getTenantId());
            if (tenant != null) {
                vo.setTenantName(tenant.getName());
            }
            Users user = usersMapper.selectByIdIncludingDeleted(entity.getUserId());
            if (user != null) {
                vo.setUsername(user.getUsername());
            }
        }
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SessionsVO insert(@Nonnull SessionsDTO dto) {
        Tenants tenant = tenantsMapper.selectByIdIncludingDeleted(dto.getTenantId());
        if (tenant == null) {
            throw new ServiceException("租户不存在");
        }
        Users user = usersMapper.selectByIdIncludingDeleted(dto.getUserId());
        if (user == null) {
            throw new ServiceException("用户不存在");
        }

        Sessions entity = BeanUtil.copyProperties(dto, Sessions.class);
        entity.setId(IdUtil.randomUUID());

        this.baseMapper.insert(entity);
        SessionsVO vo = BeanUtil.copyProperties(entity, SessionsVO.class);
        vo.setTenantName(tenant.getName());
        vo.setUsername(user.getUsername());
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SessionsVO update(@Nonnull SessionsDTO dto) {
        Sessions entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("对话会话不存在");
        }

        dto.setTenantId(entity.getTenantId()); // 不允许修改租户ID
        dto.setUserId(entity.getUserId());

        BeanUtil.copyProperties(dto, entity);

        this.baseMapper.updateById(entity);
        SessionsVO vo = BeanUtil.copyProperties(entity, SessionsVO.class);
        Tenants tenant = tenantsMapper.selectByIdIncludingDeleted(entity.getTenantId());
        if (tenant != null) {
            vo.setTenantName(tenant.getName());
        }
        Users user = usersMapper.selectByIdIncludingDeleted(dto.getUserId());
        if (user != null) {
            vo.setUsername(user.getUsername());
        }
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        Sessions entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }
}
