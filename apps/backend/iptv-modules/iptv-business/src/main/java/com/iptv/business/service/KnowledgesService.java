package com.iptv.business.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.business.domain.KnowledgeTags;
import com.iptv.business.domain.Knowledges;
import com.iptv.business.domain.dto.FAQEntryQueryDTO;
import com.iptv.business.domain.dto.page.KnowledgesPageDTO;
import com.iptv.business.domain.vo.FAQEntryVO;
import com.iptv.business.domain.vo.KnowledgeSpansVO;
import com.iptv.business.domain.vo.KnowledgesFolderVO;
import com.iptv.business.domain.vo.KnowledgesVO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import jakarta.servlet.http.HttpServletResponse;

import java.util.List;

/**
 * <p>
 * 知识条目（文档/FAQ/URL/手工等）：解析状态、文件元数据、目录路径 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-23
 */
public interface KnowledgesService extends IService<Knowledges> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<KnowledgesVO> queryPage(KnowledgesPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    KnowledgesVO queryById(@Nonnull String id);

    /**
     * 文档知识库文件夹查询
     *
     * @param knowledgeBaseId 文档知识库 ID
     * @return 文件夹信息
     */
    KnowledgesFolderVO queryFolders(String knowledgeBaseId);

    /**
     * 按 id 删除
     *
     * @param id 主键
     */
    void deleteById(@Nonnull String id);

    /**
     * 按 id 预览
     *
     * @param id 主键
     */
    void previewById(@Nonnull String id, HttpServletResponse response);

    /**
     * 查询标签信息
     *
     * @param knowledgeBaseId 文档知识库 ID
     * @return 标签信息列表
     */
    List<KnowledgeTags> listTags(String knowledgeBaseId);

    /**
     * 分页查询FAQ条目列表
     *
     * @param dto 查询参数
     * @return 分页结果
     */
    TableDataInfo<FAQEntryVO> listFAQEntries(FAQEntryQueryDTO dto, PageDTO pg);

    /**
     * 按 id 删除FAQ条目
     *
     * @param id 主键
     */
    void deleteFAQById(@Nonnull String id);

    /**
     * 查询知识处理Span树
     *
     * @param id 知识条目ID
     * @param attempt 尝试号（可选，不传则返回最新尝试）
     * @return Span树响应
     */
    KnowledgeSpansVO querySpansByKnowledgeId(@Nonnull String id, Integer attempt);
}
