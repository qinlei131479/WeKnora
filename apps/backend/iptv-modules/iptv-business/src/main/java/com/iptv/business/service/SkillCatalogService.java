package com.iptv.business.service;

import com.iptv.business.domain.dto.SkillCatalogFileSaveDTO;
import com.iptv.business.domain.dto.SkillCatalogSourceDTO;
import com.iptv.business.domain.dto.page.SkillCatalogPageDTO;
import com.iptv.business.domain.vo.SkillCatalogVO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import jakarta.annotation.Nonnull;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 技能目录定义服务接口（对齐 Go 端 tenant_skill_catalog 能力：上传 / 远程拉取 / 列表 / 详情 / SKILL.md 修改 / 删除）
 *
 * @author kjsc
 * @since 2026-09-21
 */
public interface SkillCatalogService {

    /**
     * 分页查询技能目录定义（跨全部租户，并关联租户信息）
     *
     * @param dto 查询条件
     * @param pg  分页参数
     * @return 分页结果
     */
    TableDataInfo<SkillCatalogVO> queryPage(@Nonnull SkillCatalogPageDTO dto, PageDTO pg);

    /**
     * 查询技能目录详情（元数据 + bundle 文件树）
     *
     * @param id 技能目录定义 ID
     * @return 技能详情
     */
    SkillCatalogVO detail(@Nonnull String id);

    /**
     * 读取 bundle 内文本文件内容
     *
     * @param id   技能目录定义 ID
     * @param path 相对技能根目录的文件路径
     * @return path + content
     */
    Map<String, Object> readFile(@Nonnull String id, @Nonnull String path);

    /**
     * 上传技能（.zip 或 SKILL.md），归一化后写入技能目录（tenant_id=1 内置）
     *
     * @param file 上传文件
     * @return 技能目录定义
     */
    SkillCatalogVO upload(@Nonnull MultipartFile file);

    /**
     * 从远程来源拉取技能并写入技能目录（tenant_id=1 内置）
     *
     * @param dto 来源描述
     * @return 技能目录定义
     */
    SkillCatalogVO pullFromSource(@Nonnull SkillCatalogSourceDTO dto);

    /**
     * 保存根级 SKILL.md 内容（重新打包 bundle 并同步元数据）
     *
     * @param dto 文件保存参数
     */
    void saveSkillMd(@Nonnull SkillCatalogFileSaveDTO dto);

    /**
     * 删除技能目录定义（存在沙箱安装引用时拒绝；软删除并尽力清理 bundle 对象）
     *
     * @param id 技能目录定义 ID
     */
    void delete(@Nonnull String id);
}
