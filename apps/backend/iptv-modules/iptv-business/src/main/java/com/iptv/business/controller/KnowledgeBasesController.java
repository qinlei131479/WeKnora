package com.iptv.business.controller;

import com.iptv.business.domain.AuditLogs;
import com.iptv.business.domain.dto.page.KnowledgeBasesPageDTO;
import com.iptv.business.domain.vo.KnowledgeBasesVO;
import com.iptv.business.service.KnowledgeBasesService;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.RequiresPermissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * <p>
 * 知识库主表：分块、向量库绑定、Wiki/FAQ/自动打标等配置 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-23
 */
@Tag(name = "知识库主表：分块、向量库绑定、Wiki/FAQ/自动打标等配置管理", description = "知识库主表：分块、向量库绑定、Wiki/FAQ/自动打标等配置前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/knowledgeBases")
public class KnowledgeBasesController {

    @Autowired
    private KnowledgeBasesService knowledgeBasesService;

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:knowledgeBases:query")
    public R<KnowledgeBasesVO> queryById(String id) {
        return R.ok(knowledgeBasesService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    public TableDataInfo<KnowledgeBasesVO> list(KnowledgeBasesPageDTO dto, PageDTO pg) {
        return knowledgeBasesService.queryPage(dto, pg);
    }

    @Log(title = "删除知识库", businessType = BusinessType.DELETE)
    @Operation(summary = "删除知识库", description = "删除知识库及其关联资源（知识条目、分块、向量数据等）")
    @GetMapping("/delete/single")
    @RequiresPermissions("business:knowledgeBases:remove")
    public R<Void> deleteById(@RequestParam String id) {
        knowledgeBasesService.deleteById(id);
        return R.ok();
    }

    @Operation(summary = "查询知识库活动记录", description = "查询知识库活动记录")
    @GetMapping("/activity/list")
    @RequiresPermissions("business:knowledgeBases:query")
    public TableDataInfo<AuditLogs> activity(String knowledgeBaseId, PageDTO pg) {
        return knowledgeBasesService.listActivity(knowledgeBaseId, pg);
    }
}
