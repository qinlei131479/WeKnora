package com.iptv.business.pgmapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.iptv.business.domain.SkillCatalog;
import com.iptv.business.domain.dto.page.SkillCatalogPageDTO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * <p>
 * 技能目录定义 Mapper（PostgreSQL，与 Go 端共享 tenant_skill_catalog 表）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-21
 */
public interface SkillCatalogMapper extends BaseMapper<SkillCatalog> {

    /**
     * 分页查询技能目录定义（跨全部租户，软删除记录除外）
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 技能目录列表
     */
    List<SkillCatalog> queryPage(@Param("param") SkillCatalogPageDTO param, Page<SkillCatalog> page);

    /**
     * 统计某技能目录定义在 tenant_skills 中的安装引用数（只读检查，不修改安装数据）
     *
     * @param catalogId 技能目录定义 ID
     * @return 安装引用数
     */
    long countInstallRefs(@Param("catalogId") String catalogId);

    long countDependencies(@Param("skillName") String skillName);

    long countAgentRefs(@Param("skillName") String skillName);
}
