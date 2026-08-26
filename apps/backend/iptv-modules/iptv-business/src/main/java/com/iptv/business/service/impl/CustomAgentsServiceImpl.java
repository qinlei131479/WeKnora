package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.*;
import com.iptv.business.domain.dto.page.CustomAgentsPageDTO;
import com.iptv.business.domain.vo.CustomAgentsVO;
import com.iptv.business.domain.vo.KnowledgeBasesVO;
import com.iptv.business.pgmapper.*;
import com.iptv.business.service.CustomAgentsService;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * <p>
 * 自定义/内置智能体配置（与租户组成复合主键） 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-26
 */
@Service
@RequiredArgsConstructor
public class CustomAgentsServiceImpl extends ServiceImpl<CustomAgentsMapper, CustomAgents> implements CustomAgentsService {

    private final TenantsMapper tenantsMapper;
    private final ModelsMapper modelsMapper;
    private final KnowledgeBasesMapper knowledgeBasesMapper;
    private final McpServicesMapper mcpServicesMapper;

    @Override
    public TableDataInfo<CustomAgentsVO> queryPage(CustomAgentsPageDTO dto, PageDTO pg) {
        Page<CustomAgentsVO> page = PageUtils.toPage(pg);
        List<CustomAgents> list = this.baseMapper.queryPage(dto, page);
        List<CustomAgentsVO> voList = BeanUtil.copyToList(list, CustomAgentsVO.class);
        buildVO(voList);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public CustomAgentsVO queryById(@Nonnull String id,Integer tenantId) {
        CustomAgents entity = this.baseMapper.selectOne(new LambdaQueryWrapper<CustomAgents>()
                .eq(CustomAgents::getId, id)
                .eq(CustomAgents::getTenantId, tenantId)
                .isNull(CustomAgents::getDeletedAt)
                .orderByDesc(CustomAgents::getCreatedAt)
                .last("limit 1"));
        CustomAgentsVO vo = BeanUtil.copyProperties(entity, CustomAgentsVO.class);
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        CustomAgents entity = this.baseMapper.selectById(id);
        if (BeanUtil.isNotEmpty(entity)) {
            this.baseMapper.deleteById(id);
        }
    }

    private void buildVO(List<CustomAgentsVO> voList) {
        queryTenants(voList);
        queryModel(voList);
        queryKnowledgeBase(voList);
        queryMcpServices(voList);
    }

    private void queryMcpServices(List<CustomAgentsVO> voList){
        List<McpServices> mcpServiceList = mcpServicesMapper.selectList(new LambdaQueryWrapper<McpServices>()
                .isNull(McpServices::getDeletedAt));
        voList.forEach(vo -> {
            if (StrUtil.isNotBlank(vo.getConfig())) {
                JSONObject config = JSONUtil.parseObj(vo.getConfig());
                if(config.containsKey("mcp_services") && CollUtil.isNotEmpty(config.getJSONArray("mcp_services"))){
                    vo.setMcpServicesList(mcpServiceList.stream()
                            .filter(mcpService -> CollUtil.contains(config.getJSONArray("mcp_services"), mcpService.getId()))
                            .toList());
                }
            }
        });
    }

    private void queryKnowledgeBase(List<CustomAgentsVO> voList) {
        List<KnowledgeBases> knowledgeBaseList = knowledgeBasesMapper.selectList(new LambdaQueryWrapper<KnowledgeBases>()
                .isNull(KnowledgeBases::getDeletedAt));
        voList.forEach(vo -> {
            if (StrUtil.isNotBlank(vo.getConfig())) {
                JSONObject config = JSONUtil.parseObj(vo.getConfig());
                if(config.containsKey("knowledge_bases") && CollUtil.isNotEmpty(config.getJSONArray("knowledge_bases"))){
                    vo.setKnowledgeBasesList(knowledgeBaseList.stream()
                            .filter(knowledgeBase -> CollUtil.contains(config.getJSONArray("knowledge_bases"), knowledgeBase.getId()))
                            .toList());
                }
            }
        });
    }

    private void queryTenants(List<CustomAgentsVO> voList) {
        List<Tenants> tenantList = tenantsMapper.selectList(new LambdaQueryWrapper<Tenants>()
                .isNull(Tenants::getDeletedAt));
        voList.forEach(vo -> {
            if (ObjectUtil.isNotEmpty(vo.getTenantId())) {
                vo.setTenant(tenantList.stream()
                        .filter(tenant -> ObjectUtil.equals(tenant.getId(), vo.getTenantId()))
                        .findFirst()
                        .orElse(null));
            }
        });
    }

    private void queryModel(List<CustomAgentsVO> voList) {
        List<Models> modelList = modelsMapper.selectAllModels();
        voList.forEach(vo -> {
            if (StrUtil.isNotBlank(vo.getConfig())) {
                JSONObject config = JSONUtil.parseObj(vo.getConfig());
                if (config.containsKey("model_id") && StrUtil.isNotBlank(config.getStr("model_id"))) {
                    vo.setModel(modelList.stream()
                            .filter(model -> StrUtil.equals(model.getId(), config.getStr("model_id")))
                            .findFirst()
                            .orElse(null));
                }

                if (config.containsKey("asr_model_id") && StrUtil.isNotBlank(config.getStr("asr_model_id"))) {
                    vo.setAsrModel(modelList.stream()
                            .filter(model -> StrUtil.equals(model.getId(), config.getStr("asr_model_id")))
                            .findFirst()
                            .orElse(null));
                }

                if (config.containsKey("vlm_model_id") && StrUtil.isNotBlank(config.getStr("vlm_model_id"))) {
                    vo.setVlmModel(modelList.stream()
                            .filter(model -> StrUtil.equals(model.getId(), config.getStr("vlm_model_id")))
                            .findFirst()
                            .orElse(null));
                }

                if (config.containsKey("rerank_model_id") && StrUtil.isNotBlank(config.getStr("rerank_model_id"))) {
                    vo.setReRankModel(modelList.stream()
                            .filter(model -> StrUtil.equals(model.getId(), config.getStr("rerank_model_id")))
                            .findFirst()
                            .orElse(null));
                }
            }
        });
    }
}
