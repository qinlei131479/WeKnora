package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.Chunks;
import com.iptv.business.domain.Knowledges;
import com.iptv.business.domain.dto.page.KnowledgesPageDTO;
import com.iptv.business.domain.vo.KnowledgesFolderVO;
import com.iptv.business.domain.vo.KnowledgesVO;
import com.iptv.business.pgmapper.ChunksMapper;
import com.iptv.business.pgmapper.KnowledgesMapper;
import com.iptv.business.service.KnowledgesService;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

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

    @Override
    public TableDataInfo<KnowledgesVO> queryPage(KnowledgesPageDTO dto, PageDTO pg) {
        Page<KnowledgesVO> page = PageUtils.toPage(pg);
        List<Knowledges> list = this.baseMapper.queryPage(dto, page);
        List<KnowledgesVO> voList = BeanUtil.copyToList(list, KnowledgesVO.class);
        return PageUtils.getDataTable(voList, page);
    }

    @Override
    public KnowledgesVO queryById(@Nonnull String id) {
        Knowledges entity = this.baseMapper.selectById(id);
        return BeanUtil.copyProperties(entity, KnowledgesVO.class);
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
        this.baseMapper.update(null,new LambdaUpdateWrapper<Knowledges>()
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
