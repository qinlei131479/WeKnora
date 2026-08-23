package com.iptv.business.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.iptv.business.domain.KnowledgeBases;
import com.iptv.business.domain.dto.page.KnowledgeBasesPageDTO;
import com.iptv.business.domain.vo.KnowledgeBasesVO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;

/**
 * <p>
 * 知识库主表：分块、向量库绑定、Wiki/FAQ/自动打标等配置 服务类（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-23
 */
public interface KnowledgeBasesService extends IService<KnowledgeBases> {

    /**
     * 分页查询
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<KnowledgeBasesVO> queryPage(KnowledgeBasesPageDTO dto, PageDTO pg);

    /**
     * 按 id 查询
     *
     * @param id 主键
     * @return 实体
     */
    KnowledgeBasesVO queryById(@Nonnull String id);

    /**
     * 删除知识库及其关联资源
     * <p>
     * 删除流程（参照Go代码）：
     * 1. 软删除知识库记录（设置 deleted_at）
     * 2. 删除关联的知识条目（knowledges）
     * 3. 删除关联的分块数据（chunks）
     * 4. 删除向量数据（如有向量库集成）
     * 5. 删除物理文件（如有文件存储）
     * </p>
     *
     * @param id 知识库ID
     */
    void deleteById(@Nonnull String id);
}
