package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.*;
import com.iptv.business.domain.dto.FAQEntryQueryDTO;
import com.iptv.business.domain.dto.page.KnowledgesPageDTO;
import com.iptv.business.domain.vo.FAQEntryVO;
import com.iptv.business.domain.vo.KnowledgeSpansVO;
import com.iptv.business.domain.vo.KnowledgesFolderVO;
import com.iptv.business.domain.vo.KnowledgesVO;
import com.iptv.business.pgmapper.*;
import com.iptv.business.service.KnowledgesService;
import com.iptv.business.service.StorageBackendFileServiceFactory;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Writer;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * 知识条目（文档/FAQ/URL/手工等）：解析状态、文件元数据、目录路径 服务实现类（PostgreSQL）
 *
 * @author kjsc
 * @since 2026-08-23
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgesServiceImpl extends ServiceImpl<KnowledgesMapper, Knowledges> implements KnowledgesService {

    private final ChunksMapper chunksMapper;
    private final KnowledgeBasesMapper knowledgeBasesMapper;
    private final StorageBackendsMapper storageBackendsMapper;
    private final ResourcesMapper resourcesMapper;
    private final KnowledgeTagsMapper knowledgeTagsMapper;
    private final KnowledgeTagRelationsMapper knowledgeTagRelationsMapper;
    private final StorageBackendFileServiceFactory storageBackendFileServiceFactory;
    private final KnowledgeProcessingSpansMapper knowledgeProcessingSpansMapper;

    @Override
    public TableDataInfo<KnowledgesVO> queryPage(KnowledgesPageDTO dto, PageDTO pg) {
        Page<KnowledgesVO> page = PageUtils.toPage(pg);
        List<Knowledges> list = this.baseMapper.queryPage(dto, page);
        List<KnowledgesVO> voList = BeanUtil.copyToList(list, KnowledgesVO.class);
        buildVO(voList);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public KnowledgesVO queryById(@Nonnull String id) {
        Knowledges entity = this.baseMapper.selectById(id);
        KnowledgesVO vo = BeanUtil.copyProperties(entity, KnowledgesVO.class);
        buildVO(List.of(vo));
        return vo;
    }

    private void buildVO(List<KnowledgesVO> voList) {
        queryTags(voList);
    }

    private void queryTags(List<KnowledgesVO> voList){
        Set<String> knowledgeIds = voList.stream().map(KnowledgesVO::getId).collect(Collectors.toSet());
        if(CollUtil.isEmpty(knowledgeIds)){
            return;
        }
        List<KnowledgeTagRelations> tags = knowledgeTagRelationsMapper.selectList(new LambdaQueryWrapper<KnowledgeTagRelations>()
                .in(KnowledgeTagRelations::getKnowledgeId, knowledgeIds));

        Map<String, List<KnowledgeTagRelations>> tagMap = tags.stream()
                .collect(Collectors.groupingBy(KnowledgeTagRelations::getKnowledgeId, Collectors.toList()));

        Set<String> tagIds = tags.stream().map(KnowledgeTagRelations::getTagId).collect(Collectors.toSet());

        if(CollUtil.isEmpty(tagIds)){
            return;
        }
        List<KnowledgeTags> tagList = knowledgeTagsMapper.selectList(new LambdaQueryWrapper<KnowledgeTags>()
                .in(KnowledgeTags::getId, tagIds));

        voList.forEach(vo ->{
            List<KnowledgeTagRelations> vTagsRelations = tagMap.get(vo.getId());
            List<KnowledgeTags> knowledgeTags = Collections.emptyList();
            if(CollUtil.isNotEmpty(vTagsRelations)){
                knowledgeTags = tagList.stream().filter(t -> CollUtil.contains(
                         vTagsRelations.stream().map(KnowledgeTagRelations::getTagId).collect(Collectors.toSet()),
                        t.getId()
                )).toList();
            }
            vo.setTags(knowledgeTags);
        });
    }

    @Override
    public KnowledgesFolderVO queryFolders(String knowledgeBaseId) {
        // 1. 查询每个文件夹路径的文档数量
        List<Map<String, Object>> folderCounts = this.baseMapper.selectFolderCounts(knowledgeBaseId);

        // 2. 构建文件夹树
        return buildFolderTree(folderCounts);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(@Nonnull String id) {
        log.info("开始删除知识条目: {}", id);

        // 1. 查找知识条目
        Knowledges knowledge = this.baseMapper.selectById(id);
        if (knowledge == null) {
            throw new ServiceException("知识条目不存在");
        }

        // 2. 标记状态为 deleting（防止并发访问）
        this.baseMapper.update(null, new LambdaUpdateWrapper<Knowledges>()
                .set(Knowledges::getParseStatus, "deleting")
                .eq(Knowledges::getId, id));
        log.info("知识条目标记为删除中: {}", id);

        // 3. 删除关联的分块数据（chunks）
        deleteRelatedChunks(id);

        // TODO: 4. 删除向量数据（embeddings）
        // 需要实现向量库集成
        // deleteVectorData(id);

        // TODO: 5. 清理 wiki 数据
        // 需要实现 wiki 集成
        // deleteWikiData(id);

        // TODO: 6. 删除知识图谱数据
        // 需要实现知识图谱集成
        // deleteGraphData(id);

        // TODO: 7. 删除 tag 关系
        // 需要实现 tag 关系表
        // deleteTagRelations(id);

        // 8. 删除知识条目记录（硬删除）
        this.baseMapper.deleteById(id);
        log.info("知识条目删除完成: {}", id);

        // TODO: 9. 删除物理文件和提取的图片
        // 需要实现文件存储集成
        // deletePhysicalFiles(knowledge);

        // TODO: 10. 调整租户存储空间
        // 需要实现租户存储调整
        // adjustTenantStorage(knowledge);
    }

    @Override
    public List<KnowledgeTags> listTags(String knowledgeBaseId) {
        List<KnowledgeTags> knowledgeTags = knowledgeTagsMapper.selectList(new LambdaQueryWrapper<KnowledgeTags>()
                .isNull(KnowledgeTags::getDeletedAt)
                .eq(KnowledgeTags::getKnowledgeBaseId, knowledgeBaseId));
        return knowledgeTags;
    }

    @Override
    public void previewById(@Nonnull String id, HttpServletResponse response) {
        log.info("开始预览知识条目: {}", id);

        // 1. 查找知识条目
        Knowledges knowledge = this.baseMapper.selectById(id);
        if (knowledge == null) {
            throw new ServiceException("知识条目不存在");
        }

        // 2. 判断是否为 manual 类型（手工录入）
        if (StrUtil.equals(knowledge.getType(), "manual")) {
            // 从 metadata 中读取内容
            String content = extractContentFromMetadata(knowledge.getMetadata());
            String fileName = extractFileNameFromMetadata(knowledge.getMetadata());
            if (StrUtil.isBlank(fileName)) {
                fileName = "manual_content.md";
            }

            // 设置响应头
            response.setContentType("text/markdown; charset=UTF-8");
            response.setHeader("X-Content-Type-Options", "nosniff");
            response.setHeader("Content-Disposition", "inline; filename=\"" + fileName + "\"");
            response.setHeader("Cache-Control", "private, max-age=3600");

            // 写入内容
            try (Writer writer = response.getWriter()) {
                writer.write(content != null ? content : "");
                writer.flush();
            } catch (IOException e) {
                log.error("写入预览内容失败", e);
                throw new ServiceException("预览失败");
            }
            return;
        }

        // 3. 非 manual 类型，根据知识库的存储后端获取文件
        String filePath = knowledge.getFilePath();
        if (StrUtil.isBlank(filePath)) {
            throw new ServiceException("文件路径为空");
        }

        // 解析 resource:// 路径格式
        StorageBackends storageBackend;
        String actualFilePath;

        if (filePath.startsWith("resource://")) {
            // 从 resource:// 路径解析实际文件信息
            String handle = filePath.substring("resource://".length());
            Resources resource = resourcesMapper.selectOne(
                    new LambdaQueryWrapper<Resources>()
                            .eq(Resources::getHandle, handle)
            );
            if (resource == null) {
                throw new ServiceException("资源不存在: " + handle);
            }

            // 获取存储后端配置
            storageBackend = storageBackendsMapper.selectById(resource.getStorageBackendId());
            if (storageBackend == null) {
                throw new ServiceException("存储后端不存在: " + resource.getStorageBackendId());
            }

            // 解析 physical_path 格式: storage://backendId/provider://actualPath
            String physicalPath = resource.getPhysicalPath();
            if (physicalPath.startsWith("storage://")) {
                // 去掉 storage://backendId/ 前缀
                String afterStorage = physicalPath.substring("storage://".length());
                int slashIndex = afterStorage.indexOf('/');
                if (slashIndex > 0) {
                    actualFilePath = afterStorage.substring(slashIndex + 1);
                    // 去掉 provider:// 前缀（如 local://, minio://）
                    int providerSlashIndex = actualFilePath.indexOf("://");
                    if (providerSlashIndex > 0) {
                        actualFilePath = actualFilePath.substring(providerSlashIndex + 3);
                    }
                } else {
                    actualFilePath = afterStorage;
                }
            } else {
                actualFilePath = physicalPath;
            }
        } else {
            // 获取知识库信息
            KnowledgeBases knowledgeBase = knowledgeBasesMapper.selectById(knowledge.getKnowledgeBaseId());
            if (knowledgeBase == null) {
                throw new ServiceException("知识库不存在");
            }

            // 获取存储后端配置
            storageBackend = null;
            if (StrUtil.isNotBlank(knowledgeBase.getStorageBackendId())) {
                storageBackend = storageBackendsMapper.selectById(knowledgeBase.getStorageBackendId());
            }
            actualFilePath = filePath;
        }

        // 使用工厂类根据存储后端获取文件流
        try (InputStream inputStream = storageBackendFileServiceFactory.getFileStream(storageBackend, actualFilePath);
             OutputStream outputStream = response.getOutputStream()) {

            String fileName = StrUtil.isNotBlank(knowledge.getFileName())
                    ? knowledge.getFileName()
                    : filePath.substring(filePath.lastIndexOf('/') + 1);

            String contentType = getContentType(fileName);
            boolean isInline = isInlineContentType(contentType);

            // 设置响应头
            response.setContentType(contentType);
            response.setHeader("X-Content-Type-Options", "nosniff");
            String disposition = isInline ? "inline" : "attachment";
            try {
                String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8.name());
                response.setHeader("Content-Disposition", disposition + "; filename=\"" + encodedFileName + "\"");
            } catch (Exception e) {
                response.setHeader("Content-Disposition", disposition + "; filename=\"" + fileName + "\"");
            }
            response.setHeader("Cache-Control", "private, max-age=3600");

            // 流式传输文件内容
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            outputStream.flush();
        } catch (IOException e) {
            log.error("流式传输文件失败", e);
            throw new ServiceException("预览失败");
        } catch (Exception e) {
            log.error("获取文件失败", e);
            throw new ServiceException("获取文件失败: " + e.getMessage());
        }
    }

    @Override
    public TableDataInfo<FAQEntryVO> listFAQEntries(FAQEntryQueryDTO dto, PageDTO pg) {
        // 1. 验证知识库是否存在且为FAQ类型
        KnowledgeBases kb = knowledgeBasesMapper.selectById(dto.getKnowledgeBaseId());
        if (BeanUtil.isEmpty(kb)) {
            throw new ServiceException("知识库不存在");
        }
        if (!StrUtil.equals(kb.getType(), "faq")) {
            throw new ServiceException("该知识库不是FAQ类型");
        }
        Page page = PageUtils.toPage(pg);
        List<Chunks> chunks = chunksMapper.selectFAQEntries(dto, page);

        // 7. 转换为VO
        List<FAQEntryVO> voList = chunks.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public void deleteFAQById(@Nonnull String id) {
        chunksMapper.deleteById(id);
    }

    @Override
    public KnowledgeSpansVO querySpansByKnowledgeId(@Nonnull String id, Integer attempt) {
        log.info("开始查询知识处理Span树: {}, attempt={}", id, attempt);

        // 1. 查询知识条目
        Knowledges knowledge = this.baseMapper.selectById(id);
        if (BeanUtil.isEmpty(knowledge)) {
            throw new ServiceException("知识条目不存在");
        }

        // 2. 获取最新尝试号
        Integer latestAttempt = knowledgeProcessingSpansMapper.selectLatestAttempt(id);
        if (ObjectUtil.isNull(latestAttempt)) {
            latestAttempt = 0;
        }

        // 3. 确定当前尝试号
        int currentAttempt = (attempt != null && attempt > 0) ? attempt : latestAttempt;

        // 4. 查询Span列表
        List<KnowledgeProcessingSpans> spanList = Collections.emptyList();
        if (currentAttempt > 0) {
            spanList = knowledgeProcessingSpansMapper.selectListByAttempt(id, currentAttempt);
            if (CollUtil.isEmpty(spanList)) {
                spanList = Collections.emptyList();
            }
        }

        // 5. 构建Span树
        SpanTreeBuildResult result = buildSpanTree(id, currentAttempt, spanList, knowledge.getParseStatus());

        // 6. 构建响应VO
        KnowledgeSpansVO vo = new KnowledgeSpansVO();
        vo.setKnowledgeId(id);
        vo.setAttempt(currentAttempt);
        vo.setLatestAttempt(latestAttempt);
        vo.setParseStatus(knowledge.getParseStatus());
        vo.setCurrentAttempt(currentAttempt);
        vo.setCurrentStage(result.currentStage);
        vo.setTrace(convertToTreeNode(result.root));

        // 7. 构建错误信息
        KnowledgeSpansVO.SpanErrorVO lastError = buildLastError(
                currentAttempt,
                latestAttempt,
                knowledge.getParseStatus(),
                knowledge.getErrorMessage(),
                result.lastFailure
        );
        vo.setLastError(lastError);

        log.info("知识处理Span树查询完成: {}, attempt={}", id, currentAttempt);
        return vo;
    }

    /**
     * Span树构建结果
     */
    private static class SpanTreeBuildResult {
        KnowledgeProcessingSpans root;
        String currentStage;
        KnowledgeProcessingSpans lastFailure;
        Map<String, List<KnowledgeProcessingSpans>> childrenMap;

        SpanTreeBuildResult(KnowledgeProcessingSpans root, String currentStage,
                           KnowledgeProcessingSpans lastFailure,
                           Map<String, List<KnowledgeProcessingSpans>> childrenMap) {
            this.root = root;
            this.currentStage = currentStage;
            this.lastFailure = lastFailure;
            this.childrenMap = childrenMap;
        }
    }

    /**
     * 构建Span树（参照Go代码buildSpanTree）
     */
    private SpanTreeBuildResult buildSpanTree(String knowledgeId, int attempt,
                                              List<KnowledgeProcessingSpans> rows,
                                              String parseStatus) {
        Date now = new Date();

        // 构建节点查找表，识别根节点
        Map<String, KnowledgeProcessingSpans> nodes = new HashMap<>();
        KnowledgeProcessingSpans rootRow = null;
        Map<String, KnowledgeProcessingSpans> stageRowByName = new HashMap<>();
        String currentStage = null;
        KnowledgeProcessingSpans lastFailure = null;

        for (KnowledgeProcessingSpans span : rows) {
            nodes.put(span.getSpanId(), span);

            // 识别根节点
            if ("root".equals(span.getKind()) && rootRow == null) {
                rootRow = span;
            }

            // 识别阶段节点
            if ("stage".equals(span.getKind())) {
                stageRowByName.put(span.getName(), span);
            }

            // 识别当前运行中的阶段
            if ("running".equals(span.getStatus()) && "stage".equals(span.getKind()) && currentStage == null) {
                currentStage = span.getName();
            }

            // 识别最后一个失败的节点
            if ("failed".equals(span.getStatus())) {
                lastFailure = span;
            }
        }

        // 根据parse_status确定合成阶段的状态
        String syntheticStatus = "pending";
        if ("completed".equals(parseStatus)) {
            syntheticStatus = "done";
        } else if ("failed".equals(parseStatus)) {
            syntheticStatus = "failed";
        }

        // 如果没有根节点，合成一个
        if (rootRow == null) {
            rootRow = new KnowledgeProcessingSpans();
            rootRow.setKnowledgeId(knowledgeId);
            rootRow.setAttempt(attempt);
            rootRow.setSpanId("");
            rootRow.setName("knowledge_processing");
            rootRow.setKind("root");
            rootRow.setStatus(syntheticStatus);
            rootRow.setCreatedAt(now);
            rootRow.setUpdatedAt(now);
        }

        // 构建子节点映射
        Map<String, List<KnowledgeProcessingSpans>> childrenMap = new HashMap<>();

        // 链接真实子节点到父节点
        for (KnowledgeProcessingSpans span : rows) {
            if (span == rootRow) {
                continue;
            }

            String parentSpanId = span.getParentSpanId();
            if (parentSpanId == null || parentSpanId.isEmpty()) {
                // 没有父节点的顶层节点，附加到根节点
                childrenMap.computeIfAbsent(rootRow.getSpanId(), k -> new ArrayList<>()).add(span);
                continue;
            }

            KnowledgeProcessingSpans parent = nodes.get(parentSpanId);
            if (parent == null) {
                // 孤儿节点，附加到根节点
                childrenMap.computeIfAbsent(rootRow.getSpanId(), k -> new ArrayList<>()).add(span);
            } else {
                childrenMap.computeIfAbsent(parentSpanId, k -> new ArrayList<>()).add(span);
            }
        }

        // 合成缺失的阶段节点作为根节点的子节点
        List<String> allStages = Arrays.asList("docreader", "chunking", "embedding", "multimodal", "postprocess");
        for (String stageName : allStages) {
            if (stageRowByName.containsKey(stageName)) {
                continue;
            }

            KnowledgeProcessingSpans placeholder = new KnowledgeProcessingSpans();
            placeholder.setKnowledgeId(knowledgeId);
            placeholder.setAttempt(attempt);
            placeholder.setName(stageName);
            placeholder.setKind("stage");
            placeholder.setStatus(syntheticStatus);
            placeholder.setCreatedAt(now);
            placeholder.setUpdatedAt(now);

            childrenMap.computeIfAbsent(rootRow.getSpanId(), k -> new ArrayList<>()).add(placeholder);
        }

        return new SpanTreeBuildResult(rootRow, currentStage, lastFailure, childrenMap);
    }

    /**
     * 将Span实体转换为树节点VO
     */
    private KnowledgeSpansVO.SpanTreeNodeVO convertToTreeNode(KnowledgeProcessingSpans span) {
        return convertToTreeNode(span, new HashMap<>());
    }

    /**
     * 递归转换Span树为VO树
     */
    private KnowledgeSpansVO.SpanTreeNodeVO convertToTreeNode(KnowledgeProcessingSpans span,
                                                               Map<String, List<KnowledgeProcessingSpans>> childrenMap) {
        if (span == null) {
            return null;
        }

        KnowledgeSpansVO.SpanTreeNodeVO node = new KnowledgeSpansVO.SpanTreeNodeVO();
        node.setSpanId(span.getSpanId());
        node.setParentSpanId(span.getParentSpanId());
        node.setName(span.getName());
        node.setKind(span.getKind());
        node.setStatus(span.getStatus());
        node.setInput(parseJsonField(span.getInput()));
        node.setOutput(parseJsonField(span.getOutput()));
        node.setMetadata(parseJsonField(span.getMetadata()));
        node.setErrorCode(span.getErrorCode());
        node.setErrorMessage(span.getErrorMessage());
        node.setStartedAt(span.getStartedAt());
        node.setFinishedAt(span.getFinishedAt());
        node.setDurationMs(span.getDurationMs());
        node.setCreatedAt(span.getCreatedAt());
        node.setUpdatedAt(span.getUpdatedAt());

        // 递归转换子节点
        List<KnowledgeProcessingSpans> children = childrenMap.get(span.getSpanId());
        if (children != null && !children.isEmpty()) {
            List<KnowledgeSpansVO.SpanTreeNodeVO> childNodes = new ArrayList<>();
            for (KnowledgeProcessingSpans child : children) {
                childNodes.add(convertToTreeNode(child, childrenMap));
            }
            node.setChildren(childNodes);
        }

        return node;
    }

    /**
     * 解析JSON字段为Object
     */
    private Object parseJsonField(String json) {
        if (StrUtil.isBlank(json)) {
            return null;
        }
        try {
            return JSONUtil.parse(json);
        } catch (Exception e) {
            log.warn("解析JSON字段失败: {}", e.getMessage());
            return json;
        }
    }

    /**
     * 构建最后错误信息
     */
    private KnowledgeSpansVO.SpanErrorVO buildLastError(int currentAttempt, int latestAttempt,
                                                         String parseStatus, String errorMessage,
                                                         KnowledgeProcessingSpans spanFailure) {
        // 如果有Span失败，优先使用Span的错误信息
        if (spanFailure != null) {
            KnowledgeSpansVO.SpanErrorVO error = new KnowledgeSpansVO.SpanErrorVO();
            error.setStage(spanFailure.getName());
            error.setCode(spanFailure.getErrorCode());
            error.setMessage(spanFailure.getErrorMessage());
            error.setName(spanFailure.getName());
            error.setErrorCode(spanFailure.getErrorCode());
            error.setErrorMessage(spanFailure.getErrorMessage());
            error.setFinishedAt(spanFailure.getFinishedAt());
            return error;
        }

        // 否则，如果是最终尝试且parse_status为failed，使用knowledge的错误信息
        if (currentAttempt != latestAttempt || !"failed".equals(parseStatus) || StrUtil.isBlank(errorMessage)) {
            return null;
        }

        String errorCode = "UNKNOWN";
        if ("Task interrupted due to application restart".equalsIgnoreCase(errorMessage.trim())) {
            errorCode = "SERVER_RESTART";
        }

        KnowledgeSpansVO.SpanErrorVO error = new KnowledgeSpansVO.SpanErrorVO();
        error.setStage("knowledge");
        error.setCode(errorCode);
        error.setMessage(errorMessage);
        error.setName("knowledge");
        error.setErrorCode(errorCode);
        error.setErrorMessage(errorMessage);
        return error;
    }

    /**
     * 将Chunks转换为FAQEntryVO
     */
    private FAQEntryVO convertToVO(Chunks chunk) {
        FAQEntryVO vo = new FAQEntryVO();
        vo.setId(chunk.getId());
        vo.setTagId(chunk.getTagId());
        vo.setCreatedAt(chunk.getCreatedAt());
        vo.setUpdatedAt(chunk.getUpdatedAt());

        // 解析metadata中的FAQ字段
        if (StrUtil.isNotBlank(chunk.getMetadata())) {
            try {
                JSONObject metadata = JSONUtil.parseObj(chunk.getMetadata());

                // 标准问题
                vo.setStandardQuestion(metadata.getStr("standard_question"));

                // 相似问题列表
                JSONArray similarQuestions = metadata.getJSONArray("similar_questions");
                if (similarQuestions != null) {
                    vo.setSimilarQuestions(similarQuestions.toList(String.class));
                } else {
                    vo.setSimilarQuestions(new ArrayList<>());
                }

                // 反例子问题列表
                JSONArray negativeQuestions = metadata.getJSONArray("negative_questions");
                if (negativeQuestions != null) {
                    vo.setNegativeQuestions(negativeQuestions.toList(String.class));
                } else {
                    vo.setNegativeQuestions(new ArrayList<>());
                }

                // 答案列表
                JSONArray answers = metadata.getJSONArray("answers");
                if (answers != null) {
                    vo.setAnswers(answers.toList(String.class));
                } else {
                    vo.setAnswers(new ArrayList<>());
                }
            } catch (Exception e) {
                log.warn("解析FAQ metadata失败: {}", chunk.getId(), e);
                vo.setSimilarQuestions(new ArrayList<>());
                vo.setAnswers(new ArrayList<>());
            }
        } else {
            vo.setSimilarQuestions(new ArrayList<>());
            vo.setAnswers(new ArrayList<>());
        }

        return vo;
    }

    /**
     * 从 metadata JSON 中提取 content 字段
     */
    private String extractContentFromMetadata(String metadata) {
        if (StrUtil.isBlank(metadata)) {
            return null;
        }
        try {
            JSONObject json = JSONUtil.parseObj(metadata);
            return json.getStr("content");
        } catch (Exception e) {
            log.warn("解析 metadata 失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 从 metadata JSON 中提取 file_name 字段
     */
    private String extractFileNameFromMetadata(String metadata) {
        if (StrUtil.isBlank(metadata)) {
            return null;
        }
        try {
            JSONObject json = JSONUtil.parseObj(metadata);
            return json.getStr("file_name");
        } catch (Exception e) {
            log.warn("解析 metadata 失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 根据文件名获取 Content-Type
     */
    private String getContentType(String fileName) {
        if (StrUtil.isBlank(fileName)) {
            return "application/octet-stream";
        }

        String extension = FileUtil.extName(fileName);
        if (StrUtil.isBlank(extension)) {
            return "application/octet-stream";
        }

        switch (extension.toLowerCase()) {
            case "pdf":
                return "application/pdf";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "gif":
                return "image/gif";
            case "txt":
                return "text/plain";
            case "md":
                return "text/markdown";
            case "doc":
                return "application/msword";
            case "docx":
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xls":
                return "application/vnd.ms-excel";
            case "xlsx":
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "ppt":
                return "application/vnd.ms-powerpoint";
            case "pptx":
                return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "html":
            case "htm":
                return "application/octet-stream"; // HTML 作为下载处理，防止 XSS
            default:
                return "application/octet-stream";
        }
    }

    /**
     * 判断 Content-Type 是否支持内联显示
     */
    private boolean isInlineContentType(String contentType) {
        if (StrUtil.isBlank(contentType)) {
            return false;
        }
        // 文本、图片、PDF 等支持内联显示
        return contentType.startsWith("text/")
                || contentType.startsWith("image/")
                || contentType.equals("application/pdf");
    }

    /**
     * 删除关联的分块数据
     */
    private void deleteRelatedChunks(String knowledgeId) {
        LambdaQueryWrapper<Chunks> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Chunks::getKnowledgeId, knowledgeId);

        List<Chunks> chunks = chunksMapper.selectList(queryWrapper);
        if (chunks.isEmpty()) {
            log.info("知识条目 {} 无关联分块数据", knowledgeId);
            return;
        }

        log.info("开始删除知识条目 {} 的 {} 个分块", knowledgeId, chunks.size());

        // 硬删除分块
        chunksMapper.delete(queryWrapper);

        log.info("分块数据删除完成: {}", knowledgeId);
    }

    /**
     * 构建文件夹树（参照Go代码 BuildKnowledgeFolderTree）
     */
    private KnowledgesFolderVO buildFolderTree(List<Map<String, Object>> folderCounts) {
        KnowledgesFolderVO result = new KnowledgesFolderVO();
        result.setRootDocumentCount(0);
        result.setTotalDocumentCount(0);
        result.setFolders(new ArrayList<>());

        // 存储所有文件夹节点
        Map<String, KnowledgesFolderVO.FolderNode> nodes = new HashMap<>();
        // 存储子节点关系
        Map<String, List<KnowledgesFolderVO.FolderNode>> children = new HashMap<>();

        // 处理每个文件夹计数
        for (Map<String, Object> count : folderCounts) {
            String folderPath = (String) count.get("folderPath");
            int docCount = ((Number) count.get("count")).intValue();

            result.setTotalDocumentCount(result.getTotalDocumentCount() + docCount);

            // 规范化路径
            String normalizedPath = normalizeFolderPath(folderPath);

            // 根目录文档
            if (StrUtil.isBlank(normalizedPath)) {
                result.setRootDocumentCount(result.getRootDocumentCount() + docCount);
                continue;
            }

            // 确保节点存在并累加文档数
            KnowledgesFolderVO.FolderNode node = ensureNode(normalizedPath, nodes, children);
            node.setDocumentCount(node.getDocumentCount() + docCount);
        }

        // 计算总文档数（包含子文件夹）
        // 按路径深度降序排序，确保先处理深层路径
        List<String> paths = new ArrayList<>(nodes.keySet());
        paths.sort((a, b) -> {
            int depthA = countCharOccurrences(a, '/');
            int depthB = countCharOccurrences(b, '/');
            if (depthA != depthB) {
                return depthB - depthA; // 降序
            }
            return a.compareTo(b);
        });

        for (String path : paths) {
            KnowledgesFolderVO.FolderNode node = nodes.get(path);
            node.setTotalCount(node.getDocumentCount());

            String parent = getFolderParent(path);
            if (StrUtil.isNotBlank(parent) && nodes.containsKey(parent)) {
                nodes.get(parent).setTotalCount(nodes.get(parent).getTotalCount() + node.getTotalCount());
            }
        }

        // 对子节点排序并设置
        for (Map.Entry<String, List<KnowledgesFolderVO.FolderNode>> entry : children.entrySet()) {
            List<KnowledgesFolderVO.FolderNode> childList = entry.getValue();
            sortNodes(childList);
            // 只有当节点存在于 nodes 中时才设置 children
            // 根级文件夹（空字符串 key）不在 nodes 中
            KnowledgesFolderVO.FolderNode node = nodes.get(entry.getKey());
            if (node != null) {
                node.setChildren(childList);
            }
        }

        // 设置根级文件夹
        List<KnowledgesFolderVO.FolderNode> rootFolders = children.getOrDefault("", new ArrayList<>());
        sortNodes(rootFolders);
        result.setFolders(rootFolders);

        return result;
    }

    /**
     * 确保文件夹节点存在
     */
    private KnowledgesFolderVO.FolderNode ensureNode(String path,
                                                     Map<String, KnowledgesFolderVO.FolderNode> nodes,
                                                     Map<String, List<KnowledgesFolderVO.FolderNode>> children) {
        if (nodes.containsKey(path)) {
            return nodes.get(path);
        }

        KnowledgesFolderVO.FolderNode node = new KnowledgesFolderVO.FolderNode();
        node.setPath(path);
        node.setName(getFolderName(path));
        node.setDocumentCount(0);
        node.setTotalCount(0);
        node.setChildren(new ArrayList<>());
        nodes.put(path, node);

        String parent = getFolderParent(path);
        if (StrUtil.isBlank(parent)) {
            // 根级文件夹
            children.computeIfAbsent("", k -> new ArrayList<>()).add(node);
        } else {
            // 确保父节点存在
            ensureNode(parent, nodes, children);
            children.computeIfAbsent(parent, k -> new ArrayList<>()).add(node);
        }

        return node;
    }

    /**
     * 规范化文件夹路径
     */
    private String normalizeFolderPath(String path) {
        if (StrUtil.isBlank(path)) {
            return "";
        }
        // 移除开头和结尾的斜杠
        path = path.replaceAll("^/+|/+$", "");
        return path;
    }

    /**
     * 获取文件夹名称（路径的最后一段）
     */
    private String getFolderName(String path) {
        if (StrUtil.isBlank(path)) {
            return "";
        }
        int lastSlash = path.lastIndexOf('/');
        if (lastSlash >= 0) {
            return path.substring(lastSlash + 1);
        }
        return path;
    }

    /**
     * 获取父文件夹路径
     */
    private String getFolderParent(String path) {
        if (StrUtil.isBlank(path)) {
            return "";
        }
        int lastSlash = path.lastIndexOf('/');
        if (lastSlash > 0) {
            return path.substring(0, lastSlash);
        }
        return "";
    }

    /**
     * 对文件夹节点排序（按名称不区分大小写）
     */
    private void sortNodes(List<KnowledgesFolderVO.FolderNode> nodes) {
        nodes.sort((a, b) -> {
            String nameA = a.getName() != null ? a.getName().toLowerCase() : "";
            String nameB = b.getName() != null ? b.getName().toLowerCase() : "";
            return nameA.compareTo(nameB);
        });
    }

    /**
     * 计算字符串中指定字符的出现次数
     */
    private int countCharOccurrences(String str, char ch) {
        if (str == null || str.isEmpty()) {
            return 0;
        }
        int count = 0;
        for (int i = 0; i < str.length(); i++) {
            if (str.charAt(i) == ch) {
                count++;
            }
        }
        return count;
    }
}
