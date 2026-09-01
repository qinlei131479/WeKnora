package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.CustomAgents;
import com.iptv.business.domain.ImChannels;
import com.iptv.business.domain.KnowledgeBases;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.dto.ImChannelsDTO;
import com.iptv.business.domain.dto.page.ImChannelsPageDTO;
import com.iptv.business.domain.vo.ImChannelsVO;
import com.iptv.business.pgmapper.CustomAgentsMapper;
import com.iptv.business.pgmapper.ImChannelsMapper;
import com.iptv.business.pgmapper.KnowledgeBasesMapper;
import com.iptv.business.pgmapper.TenantsMapper;
import com.iptv.business.service.ImChannelsService;
import com.iptv.common.core.enums.EnableEnum;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.redis.service.RedisService;
import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * <p>
 * IM 渠道：平台凭证、绑定智能体、会话模式与输出模式 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-01
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImChannelsServiceImpl extends ServiceImpl<ImChannelsMapper, ImChannels> implements ImChannelsService {

    /**
     * Redis 频道名：与 Go 端 RedisChannelConfig 保持一致
     */
    private static final String CHANNEL_CONFIG_TOPIC = "im:channel:config";

    /**
     * 广播事件来源实例标识：与 Go 端 instanceID 区分开
     * Go 端订阅者会忽略 SourceInstance == 自身 instanceID 的事件，Java 端用固定前缀保证永远不被 Go 端过滤
     */
    private static final String SOURCE_INSTANCE = "java-" + UUID.randomUUID();

    private final RedisService redisService;

    private final TenantsMapper tenantsMapper;
    private final CustomAgentsMapper customAgentsMapper;
    private final KnowledgeBasesMapper knowledgeBasesMapper;

    @Override
    public TableDataInfo<ImChannelsVO> queryPage(ImChannelsPageDTO dto, PageDTO pg) {
        Page<ImChannelsVO> page = PageUtils.toPage(pg);
        List<ImChannels> list = this.baseMapper.queryPage(dto, page);
        List<ImChannelsVO> voList = BeanUtil.copyToList(list, ImChannelsVO.class);
        buildVO(voList);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public ImChannelsVO queryById(@Nonnull String id) {
        ImChannels entity = this.baseMapper.selectById(id);
        ImChannelsVO vo = BeanUtil.copyProperties(entity, ImChannelsVO.class);
        buildVO(List.of(vo));
        return vo;
    }

    private void buildVO(List<ImChannelsVO> voList) {
        if (CollUtil.isEmpty(voList)) {
            return;
        }
        queryTenants(voList);
        queryAgent(voList);
        queryKnowledgeBase(voList);
    }

    private void queryTenants(List<ImChannelsVO> voList) {
        List<Tenants> tenants = tenantsMapper.selectList(
                new LambdaQueryWrapper<Tenants>()
                    .isNull(Tenants::getDeletedAt)
                    .in(Tenants::getId, voList.stream().map(ImChannelsVO::getTenantId).collect(Collectors.toSet()))
        );
        if(CollUtil.isEmpty(tenants)){
            return;
        }
        voList.forEach(vo ->{
            vo.setTenant(
                    tenants.stream()
                            .filter(t-> ObjectUtil.equals(vo.getTenantId(), t.getId()))
                            .findFirst()
                            .orElse(null)
            );
        });
    }

    private void queryAgent(List<ImChannelsVO> voList) {
        List<CustomAgents> agents = customAgentsMapper.selectList(
                new LambdaQueryWrapper<CustomAgents>()
                        .isNull(CustomAgents::getDeletedAt)
                        .in(CustomAgents::getId, voList.stream().map(ImChannelsVO::getAgentId).collect(Collectors.toSet()))
        );
        if(CollUtil.isEmpty(agents)){
            return;
        }
        voList.forEach(vo ->{
            vo.setAgent(
                    agents.stream()
                            .filter(t->
                                    StrUtil.equals(vo.getAgentId(), t.getId())
                                    && ObjectUtil.equals(vo.getTenantId(), t.getTenantId()))
                            .findFirst()
                            .orElse(null)
            );
        });
    }

    private void queryKnowledgeBase(List<ImChannelsVO> voList) {
        List<KnowledgeBases> knowledgeBases = knowledgeBasesMapper.selectList(
                new LambdaQueryWrapper<KnowledgeBases>()
                        .isNull(KnowledgeBases::getDeletedAt)
                        .in(KnowledgeBases::getId, voList.stream().map(ImChannelsVO::getKnowledgeBaseId).collect(Collectors.toSet()))
        );
        if(CollUtil.isEmpty(knowledgeBases)){
            return;
        }
        voList.forEach(vo ->{
            vo.setKnowledgeBase(
                    knowledgeBases.stream()
                            .filter(t->
                                    StrUtil.equals(vo.getKnowledgeBaseId(), t.getId())
                                            && ObjectUtil.equals(vo.getTenantId(), t.getTenantId()))
                            .findFirst()
                            .orElse(null)
            );
        });
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ImChannelsVO insert(@Nonnull ImChannelsDTO dto) {
        ImChannels entity = BeanUtil.copyProperties(dto, ImChannels.class);
        if (entity.getId() == null || entity.getId().isEmpty()) {
            entity.setId(UUID.randomUUID().toString());
        }
        this.baseMapper.insert(entity);
        // 广播渠道配置变更 → Go 端订阅后从数据库重载并启动适配器
        publishChannelConfigChange(entity.getId());
        return BeanUtil.copyProperties(entity, ImChannelsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ImChannelsVO update(@Nonnull ImChannelsDTO dto) {
        ImChannels entity = this.baseMapper.selectById(dto.getId());
        if (BeanUtil.isEmpty(entity)) {
            throw new ServiceException("IM 渠道：平台凭证、绑定智能体、会话模式与输出模式不存在");
        }
        BeanUtil.copyProperties(dto, entity);
        this.baseMapper.updateById(entity);
        // 广播渠道配置变更 → Go 端订阅后从数据库重载并重启适配器
        publishChannelConfigChange(entity.getId());
        return BeanUtil.copyProperties(entity, ImChannelsVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        ImChannels entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
            // 广播渠道配置变更 → Go 端订阅后从数据库重载（记录不存在）并停止适配器
            publishChannelConfigChange(id);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateEnabledBatch(@Nonnull List<String> ids) {
        if (ids.isEmpty()) return 0;
        int rows = this.baseMapper.update(new LambdaUpdateWrapper<ImChannels>()
                .in(ImChannels::getId, ids)
                .set(ImChannels::getEnabled, EnableEnum.ENABLE.getCode()));
        // 广播渠道配置变更 → Go 端订阅后重载启用适配器
        ids.forEach(this::publishChannelConfigChange);
        return rows;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateDisabledBatch(@Nonnull List<String> ids) {
        if (ids.isEmpty()) return 0;
        int rows = this.baseMapper.update(new LambdaUpdateWrapper<ImChannels>()
                .in(ImChannels::getId, ids)
                .set(ImChannels::getEnabled, EnableEnum.DISABLE.getCode()));
        // 广播渠道配置变更 → Go 端订阅后重载停止适配器
        ids.forEach(this::publishChannelConfigChange);
        return rows;
    }

    /**
     * 广播渠道配置变更事件（与 Go 端 publishChannelConfigChange 语义一致）
     * <p>
     * 说明：Java 端不加载 IM 适配器，适配器的启停由 Go 端负责。Java 端仅写库后向 Redis 频道
     * im:channel:config 发布事件，Go 端订阅者收到后从数据库重载渠道配置并启停适配器。
     *
     * @param channelId 渠道 ID
     */
    private void publishChannelConfigChange(String channelId) {
        if (channelId == null || channelId.isEmpty()) {
            return;
        }
        try {
            Map<String, String> payload = new HashMap<>();
            payload.put("channel_id", channelId);
            payload.put("source_instance", SOURCE_INSTANCE);
            redisService.publish(CHANNEL_CONFIG_TOPIC, JSONUtil.toJsonStr(payload));
            log.info("IM 渠道配置变更已广播: channel_id={}, topic={}", channelId, CHANNEL_CONFIG_TOPIC);
        } catch (Exception e) {
            // 数据库是事实源，广播为尽力而为，失败不影响主流程（与 Go 端一致）
            log.warn("IM 渠道配置变更广播失败: channel_id={}, error={}", channelId, e.getMessage());
        }
    }
}
