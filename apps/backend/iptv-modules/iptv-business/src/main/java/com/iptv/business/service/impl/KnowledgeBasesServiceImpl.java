package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.*;
import com.iptv.business.domain.dto.page.KnowledgeBasesPageDTO;
import com.iptv.business.domain.vo.KnowledgeBasesVO;
import com.iptv.business.pgmapper.*;
import com.iptv.business.service.ChunksService;
import com.iptv.business.service.KnowledgeBasesService;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * <p>
 * 知识库主表：分块、向量库绑定、Wiki/FAQ/自动打标等配置 服务实现类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-23
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeBasesServiceImpl extends ServiceImpl<KnowledgeBasesMapper, KnowledgeBases> implements KnowledgeBasesService {

    private final ModelsMapper modelsMapper;
    private final KnowledgesMapper knowledgesMapper;
    private final VectorStoresMapper vectorStoresMapper;
    private final TenantsMapper tenantsMapper;
    private final ChunksMapper chunksMapper;

    @Override
    public TableDataInfo<KnowledgeBasesVO> queryPage(KnowledgeBasesPageDTO dto, PageDTO pg) {
        Page<KnowledgeBasesVO> page = PageUtils.toPage(pg);
        List<KnowledgeBases> list = this.baseMapper.queryPage(dto, page);
        List<KnowledgeBasesVO> voList = BeanUtil.copyToList(list, KnowledgeBasesVO.class);
        queryTenants(voList);
        queryModel(voList);
        queryVector(voList);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public KnowledgeBasesVO queryById(@Nonnull String id) {
        KnowledgeBases entity = this.baseMapper.selectById(id);
        KnowledgeBasesVO vo = BeanUtil.copyProperties(entity, KnowledgeBasesVO.class);
        queryTenants(List.of(vo));
        queryModel(List.of(vo));
        queryVector(List.of(vo));
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        log.info("开始删除知识库: {}", id);

        // 1. 查询知识库是否存在
        KnowledgeBases knowledgeBase = this.baseMapper.selectById(id);
        if (knowledgeBase == null) {
            throw new ServiceException("知识库不存在");
        }

        // 2. 软删除知识库记录（设置 deleted_at）
        knowledgeBase.setDeletedAt(new Date());
        this.baseMapper.updateById(knowledgeBase);
        log.info("知识库软删除完成: {}", id);

        // 3. 删除关联的知识条目和分块数据
        deleteRelatedKnowledgesAndChunks(id);

        // TODO: 4. 删除向量数据（如有向量库集成）
        // 需要实现向量库删除逻辑
        // deleteVectorData(id);

        // TODO: 5. 删除物理文件（如有文件存储）
        // 需要实现文件存储删除逻辑
        // deletePhysicalFiles(id);

        log.info("知识库删除完成: {}", id);
    }

    /**
     * 删除关联的知识条目和分块数据（软删除）
     * 参照Go代码逻辑：先删除chunks，再删除knowledges
     */
    private void deleteRelatedKnowledgesAndChunks(String knowledgeBaseId) {
        // 1. 查询知识库下的所有知识条目
        LambdaQueryWrapper<Knowledges> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Knowledges::getKnowledgeBaseId, knowledgeBaseId)
                .isNull(Knowledges::getDeletedAt);

        List<Knowledges> knowledges = knowledgesMapper.selectList(queryWrapper);
        if (knowledges.isEmpty()) {
            log.info("知识库 {} 无关联知识条目", knowledgeBaseId);
            return;
        }

        log.info("开始删除知识库 {} 的 {} 个知识条目", knowledgeBaseId, knowledges.size());

        // 2. 获取知识条目ID列表
        List<String> knowledgeIds = knowledges.stream()
                .map(Knowledges::getId)
                .collect(Collectors.toList());

        // 3. 删除关联的分块数据（软删除）
        int deletedChunks = chunksMapper.deleteByKnowledgeIds(knowledgeIds);
        log.info("已删除 {} 个分块数据", deletedChunks);

        // 4. 软删除知识条目
        Date now = new Date();
        for (Knowledges knowledge : knowledges) {
            knowledge.setDeletedAt(now);
            knowledgesMapper.updateById(knowledge);
        }

        log.info("知识条目删除完成: {}", knowledgeBaseId);
    }

    private void queryModel(List<KnowledgeBasesVO> voList) {
        List<Models> modelList = modelsMapper.selectAllModels();
        voList.forEach(vo -> {
            if(StrUtil.isNotBlank(vo.getEmbeddingModelId())){
                vo.setEmbeddingModel(modelList.stream()
                        .filter(model -> StrUtil.equals(model.getId(), vo.getEmbeddingModelId()))
                        .findFirst()
                        .orElse(null));
            }
            if(StrUtil.isNotBlank(vo.getSummaryModelId())){
                vo.setSummaryModel(modelList.stream()
                        .filter(model -> StrUtil.equals(model.getId(), vo.getSummaryModelId()))
                        .findFirst()
                        .orElse(null));
            }
        });
    }

    private void queryVector(List<KnowledgeBasesVO> voList) {
        List<VectorStores> vectorLibraryList = vectorStoresMapper.selectList(new LambdaQueryWrapper<VectorStores>()
                .isNull(VectorStores::getDeletedAt));
        voList.forEach(vo -> {
            if(StrUtil.isNotBlank(vo.getVectorStoreId())){
                vo.setVectorStore(vectorLibraryList.stream()
                        .filter(vectorLibrary -> StrUtil.equals(vectorLibrary.getId(), vo.getVectorStoreId()))
                        .findFirst()
                        .orElse(null));
            }
        });
    }

    private void queryTenants(List<KnowledgeBasesVO> voList) {
        List<Tenants> tenantList = tenantsMapper.selectList(new LambdaQueryWrapper<Tenants>()
                .isNull(Tenants::getDeletedAt));
        voList.forEach(vo -> {
            if(ObjectUtil.isNotEmpty(vo.getTenantId())){
                vo.setTenant(tenantList.stream()
                        .filter(tenant -> ObjectUtil.equals(tenant.getId(), vo.getTenantId()))
                        .findFirst()
                        .orElse(null));
            }
        });
    }
}
