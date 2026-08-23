package com.iptv.business.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.iptv.business.domain.Knowledges;
import com.iptv.business.domain.dto.page.KnowledgesPageDTO;
import com.iptv.business.domain.vo.KnowledgesFolderVO;
import com.iptv.business.domain.vo.KnowledgesVO;
import com.iptv.business.pgmapper.KnowledgesMapper;
import com.iptv.business.service.KnowledgesService;
import com.iptv.common.core.utils.PageUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 知识条目（文档/FAQ/URL/手工等）：解析状态、文件元数据、目录路径 服务实现类（PostgreSQL）
 *
 * @author kjsc
 * @since 2026-08-23
 */
@Service
public class KnowledgesServiceImpl extends ServiceImpl<KnowledgesMapper, Knowledges> implements KnowledgesService {

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
