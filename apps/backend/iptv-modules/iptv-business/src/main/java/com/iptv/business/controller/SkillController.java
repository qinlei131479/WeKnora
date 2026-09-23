package com.iptv.business.controller;

import com.iptv.business.domain.dto.SkillCatalogFileSaveDTO;
import com.iptv.business.domain.dto.SkillCatalogSourceDTO;
import com.iptv.business.domain.dto.page.SkillCatalogPageDTO;
import com.iptv.business.domain.vo.SkillCatalogVO;
import com.iptv.business.service.SkillCatalogService;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.RequiresPermissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 技能管理控制器
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Tag(name = "技能管理", description = "预装技能查询与技能目录管理接口")
@RestController
@RequestMapping("/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillCatalogService skillCatalogService;

    @Operation(summary = "分页查询技能目录", description = "跨全部租户分页查询技能目录定义，支持按关键字（名称/描述）模糊与租户过滤")
    @GetMapping("/list")
    @RequiresPermissions("business:skills:list")
    public TableDataInfo<SkillCatalogVO> catalogList(SkillCatalogPageDTO dto, PageDTO pg) {
        return skillCatalogService.queryPage(dto, pg);
    }

    @Operation(summary = "查询技能目录详情", description = "按 id 查询技能目录定义详情（元数据 + bundle 文件树）")
    @GetMapping("/single")
    @RequiresPermissions("business:skills:query")
    public R<SkillCatalogVO> catalogDetail(@NotBlank(message = "技能id不能为空") String id) {
        return R.ok(skillCatalogService.detail(id));
    }

    @Operation(summary = "读取技能文件内容", description = "读取 bundle 内文本文件内容（仅根级/白名单文本文件）")
    @GetMapping("/file")
    @RequiresPermissions("business:skills:query")
    public R<Map<String, Object>> catalogFile(@NotBlank(message = "技能id不能为空") String id,
                                              @NotBlank(message = "文件路径不能为空") String path) {
        return R.ok(skillCatalogService.readFile(id, path));
    }

    @Log(title = "上传技能（内置目录）", businessType = BusinessType.IMPORT)
    @Operation(summary = "上传技能", description = "上传 .zip 或 SKILL.md 归一化后写入技能目录（内置技能，tenant_id=1）")
    @PostMapping("/upload")
    @RequiresPermissions("business:skills:add")
    public R<SkillCatalogVO> catalogUpload(@RequestParam("file") MultipartFile file) {
        return R.ok(skillCatalogService.upload(file));
    }

    @Log(title = "远程拉取技能（内置目录）", businessType = BusinessType.IMPORT)
    @Operation(summary = "远程拉取技能", description = "从 registry/skills-sh/github/gitlab/直链来源拉取技能并写入技能目录（内置技能，tenant_id=1）")
    @PostMapping("/remote/pull")
    @RequiresPermissions("business:skills:add")
    public R<SkillCatalogVO> catalogPull(@RequestBody @Valid SkillCatalogSourceDTO dto) {
        return R.ok(skillCatalogService.pullFromSource(dto));
    }

    @Log(title = "修改技能SKILL.md", businessType = BusinessType.UPDATE)
    @Operation(summary = "保存SKILL.md内容", description = "保存根级 SKILL.md 内容并重新打包 bundle 同步元数据")
    @PostMapping("/file/save")
    @RequiresPermissions("business:skills:edit")
    public R<Void> catalogSaveFile(@RequestBody @Valid SkillCatalogFileSaveDTO dto) {
        skillCatalogService.saveSkillMd(dto);
        return R.ok();
    }

    @Log(title = "删除技能目录定义", businessType = BusinessType.DELETE)
    @Operation(summary = "删除技能目录定义", description = "软删除技能目录定义；存在沙箱安装引用时拒绝，并尽力清理 bundle 对象")
    @GetMapping("/delete/single")
    @RequiresPermissions("business:skills:remove")
    public R<Void> catalogDelete(@NotBlank(message = "技能id不能为空") @RequestParam String id) {
        skillCatalogService.delete(id);
        return R.ok();
    }
}
