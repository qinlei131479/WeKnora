package com.iptv.business.controller;

import com.iptv.business.domain.dto.FAQEntryQueryDTO;
import com.iptv.business.domain.dto.page.KnowledgesPageDTO;
import com.iptv.business.domain.vo.FAQEntryVO;
import com.iptv.business.domain.vo.KnowledgesFolderVO;
import com.iptv.business.domain.vo.KnowledgesVO;
import com.iptv.business.service.KnowledgesService;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.RequiresPermissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public R<KnowledgesFolderVO> folders(@NotBlank(message = "知识库id不能为空") String knowledgeBaseId) {
        return R.ok(knowledgesService.queryFolders(knowledgeBaseId));
    }

    @Log(title = "删除知识条目", businessType = BusinessType.DELETE)
    @Operation(summary = "删除知识条目", description = "删除知识条目及其关联资源（知识条目、分块、向量数据等）")
    @GetMapping("/delete/single")
    @RequiresPermissions("business:knowledges:remove")
    public R<Void> deleteById(@RequestParam String id) {
        knowledgesService.deleteById(id);
        return R.ok();
    }

    @Operation(summary = "文件预览", description = "文件预览")
    @GetMapping("/preview")
    public void previewById(@RequestParam String id, HttpServletResponse response) {
        knowledgesService.previewById(id, response);
    }

    @Operation(summary = "查询标签信息", description = "根据知识库ID查询所有标签")
    @PostMapping("/tags")
    @RequiresPermissions("business:knowledges:query")
    public R<List<FAQEntryVO>> listTags(@RequestBody FAQEntryQueryDTO dto) {
//        return knowledgesService.listTags(dto);
        return R.ok();
    }

    @Operation(summary = "分页查询FAQ条目", description = "根据知识库ID分页查询FAQ条目列表，支持按标签、关键词过滤")
    @PostMapping("/faq/entries")
    @RequiresPermissions("business:knowledges:query")
    public TableDataInfo<FAQEntryVO> listFAQEntries(@RequestBody FAQEntryQueryDTO dto, PageDTO pg) {
        return knowledgesService.listFAQEntries(dto, pg);
    }
}
