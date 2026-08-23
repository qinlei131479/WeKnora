package com.iptv.business.controller;

import com.iptv.business.domain.dto.page.KnowledgesPageDTO;
import com.iptv.business.domain.vo.KnowledgesFolderVO;
import com.iptv.business.domain.vo.KnowledgesVO;
import com.iptv.business.service.KnowledgesService;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.security.annotation.RequiresPermissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 知识条目（文档/FAQ/URL/手工等）：解析状态、文件元数据、目录路径 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-23
 */
@Tag(name = "知识条目（文档/FAQ/URL/手工等）：解析状态、文件元数据、目录路径管理", description = "知识条目（文档/FAQ/URL/手工等）：解析状态、文件元数据、目录路径前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/knowledges")
public class KnowledgesController {

    @Autowired
    private KnowledgesService knowledgesService;

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:knowledges:query")
    public R<KnowledgesVO> queryById(String id) {
        return R.ok(knowledgesService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    public TableDataInfo<KnowledgesVO> list(KnowledgesPageDTO dto, PageDTO pg) {
        return knowledgesService.queryPage(dto, pg);
    }

    @Operation(summary = "文件夹查询", description = "文档知识库文件夹查询")
    @GetMapping("/folders")
    public KnowledgesFolderVO folders(@NotBlank(message = "知识库id不能为空") String knowledgeBaseId) {
        return knowledgesService.queryFolders(knowledgeBaseId);
    }
}
