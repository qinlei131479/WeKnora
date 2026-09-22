package com.iptv.business.controller;

import com.iptv.business.domain.McpToolApprovals;
import com.iptv.business.domain.dto.McpServicesDTO;
import com.iptv.business.domain.dto.McpToolApprovalsDTO;
import com.iptv.business.domain.dto.page.McpServicesPageDTO;
import com.iptv.business.domain.vo.McpServicesVO;
import com.iptv.business.domain.vo.McpTestResultVO;
import com.iptv.business.service.McpServicesService;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.domain.dto.BaseDTO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.RequiresPermissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * <p>
 * MCP service configurations 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-11
 */
@Tag(name = "MCP service configurations管理", description = "MCP service configurations前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/mcpServices")
public class McpServicesController {

    @Autowired
    private McpServicesService mcpServicesService;

    @Operation(summary = "测试MCP service", description = "测试MCP service")
    @GetMapping("/test")
    public R<McpTestResultVO> testMcpService(String id) {
        return R.ok(mcpServicesService.testMcpService(id));
    }


    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:mcp:query")
    public R<McpServicesVO> queryById(String id) {
        return R.ok(mcpServicesService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    public TableDataInfo<McpServicesVO> list(McpServicesPageDTO dto, PageDTO pg) {
        return mcpServicesService.queryPage(dto, pg);
    }

    @Log(title = "新增MCP service configurations", businessType = BusinessType.INSERT)
    @Operation(summary = "新增", description = "新增")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:mcp:add")
    public R<McpServicesVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) McpServicesDTO dto) {
        return R.ok(mcpServicesService.insert(dto));
    }

    @Log(title = "更新MCP service configurations", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新")
    @PostMapping("/update/single")
    @RequiresPermissions("business:mcp:edit")
    public R<McpServicesVO> update(@RequestBody @Validated(BaseDTO.Update.class) McpServicesDTO dto) {
        return R.ok(mcpServicesService.update(dto));
    }

    @Log(title = "删除MCP service configurations", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除")
    @GetMapping("/delete/single")
    @RequiresPermissions("business:mcp:remove")
    public R<Void> deleteById(String id) {
        mcpServicesService.deleteById(id);
        return R.ok();
    }

    @Log(title = "批量启用MCP service configurations", businessType = BusinessType.UPDATE)
    @Operation(summary = "批量启用", description = "批量启用")
    @PostMapping("/enabled/batch")
    @RequiresPermissions("business:mcp:edit")
    public R<Void> updateEnabledBatch(@RequestBody List<String> ids) {
        mcpServicesService.updateEnabledBatch(ids);
        return R.ok();
    }

    @Log(title = "批量停用MCP service configurations", businessType = BusinessType.UPDATE)
    @Operation(summary = "批量停用", description = "批量停用")
    @PostMapping("/disabled/batch")
    @RequiresPermissions("business:mcp:edit")
    public R<Void> updateDisabledBatch(@RequestBody List<String> ids) {
        mcpServicesService.updateDisabledBatch(ids);
        return R.ok();
    }

    @Operation(summary = "获取MCP已启用工具列表", description = "获取MCP service configurations已启用工具列表")
    @PostMapping("/tool/list")
    @RequiresPermissions("business:mcp:list")
    public R<List<McpToolApprovals>> listToolByMcpId(String mcpId) {
        return R.ok(mcpServicesService.listToolByMcpId(mcpId));
    }

    @Log(title = "批量启用工具", businessType = BusinessType.UPDATE)
    @Operation(summary = "批量启用工具", description = "批量启用工具")
    @PostMapping("/tool/enabled/batch")
    @RequiresPermissions("business:mcp:edit")
    public R<Void> updateToolEnabledBatch(@RequestBody List<McpToolApprovalsDTO> dto) {
        mcpServicesService.updateToolEnabledBatch(dto);
        return R.ok();
    }

    @Log(title = "批量停用工具", businessType = BusinessType.UPDATE)
    @Operation(summary = "批量停用工具", description = "批量停用工具")
    @PostMapping("/tool/disabled/batch")
    @RequiresPermissions("business:mcp:edit")
    public R<Void> updateToolDisabledBatch(@RequestBody List<McpToolApprovalsDTO> dto) {
        mcpServicesService.updateToolDisabledBatch(dto);
        return R.ok();
    }
}
