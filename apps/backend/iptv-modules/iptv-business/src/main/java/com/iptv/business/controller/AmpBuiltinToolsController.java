package com.iptv.business.controller;

import com.iptv.business.domain.dto.page.AmpBuiltinToolsPageDTO;
import com.iptv.business.domain.vo.AmpBuiltinToolsVO;
import com.iptv.business.service.AmpBuiltinToolsService;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.security.annotation.RequiresPermissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * Harness 内置工具只读目录，用于统一预览、依赖解析和统计 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-21
 */
@Tag(name = "Harness 内置工具只读目录，用于统一预览、依赖解析和统计管理", description = "Harness 内置工具只读目录，用于统一预览、依赖解析和统计前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/ampBuiltinTools")
public class AmpBuiltinToolsController {

    @Resource
    private AmpBuiltinToolsService ampBuiltinToolsService;


    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:ampBuiltinTools:query")
    public R<AmpBuiltinToolsVO> queryById(String id) {
        return R.ok(ampBuiltinToolsService.queryById(id));
    }


    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("business:ampBuiltinTools:list")
    public TableDataInfo<AmpBuiltinToolsVO> list(AmpBuiltinToolsPageDTO dto, PageDTO pg) {
        return ampBuiltinToolsService.queryPage(dto, pg);
    }


//----------------------------------------------------------------------------------------------------
//----- 只读，其它方法都不需要

//    @Log(title = "新增Harness 内置工具只读目录，用于统一预览、依赖解析和统计", businessType = BusinessType.INSERT)
//    @Operation(summary = "新增", description = "新增")
//    @PostMapping("/insert/single")
//    @RequiresPermissions("business:ampBuiltinTools:add")
//    public R<AmpBuiltinToolsVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) AmpBuiltinToolsDTO dto) {
//        return R.ok(ampBuiltinToolsService.insert(dto));
//    }

//    @Log(title = "更新Harness 内置工具只读目录，用于统一预览、依赖解析和统计", businessType = BusinessType.UPDATE)
//    @Operation(summary = "按 id 更新", description = "按 id 更新")
//    @PostMapping("/update/single")
//    @RequiresPermissions("business:ampBuiltinTools:edit")
//    public R<AmpBuiltinToolsVO> update(@RequestBody @Validated(BaseDTO.Update.class) AmpBuiltinToolsDTO dto) {
//        return R.ok(ampBuiltinToolsService.update(dto));
//    }


//    @Log(title = "删除Harness 内置工具只读目录，用于统一预览、依赖解析和统计", businessType = BusinessType.DELETE)
//    @Operation(summary = "按 id 删除", description = "按 id 删除")
//    @PostMapping("/delete/single")
//    @RequiresPermissions("business:ampBuiltinTools:remove")
//    public R<Void> deleteById(String id) {
//        ampBuiltinToolsService.deleteById(id);
//        return R.ok();
//    }

//    @Log(title = "导出Harness 内置工具只读目录，用于统一预览、依赖解析和统计", businessType = BusinessType.EXPORT)
//    @Operation(summary = "导出", description = "导出数据到 Excel")
//    @GetMapping("/excel")
//    @RequiresPermissions("business:ampBuiltinTools:export")
//    public void export(AmpBuiltinToolsPageDTO dto, PageDTO pg, HttpServletResponse response) {
//        List<AmpBuiltinToolsVO> list = ampBuiltinToolsService.queryPage(dto, pg).getRows();
//        ExcelUtil<AmpBuiltinToolsVO> util = new ExcelUtil<>(AmpBuiltinToolsVO.class);
//        util.exportExcel(response, list, "Harness 内置工具只读目录，用于统一预览、依赖解析和统计数据.xlsx");
//    }

//    @Log(title = "批量启用Harness 内置工具只读目录，用于统一预览、依赖解析和统计", businessType = BusinessType.UPDATE)
//    @Operation(summary = "批量启用", description = "批量启用")
//    @PostMapping("/enabled/batch")
//    @RequiresPermissions("business:ampBuiltinTools:edit")
//    public R<Void> updateEnabledBatch(@RequestParam List<String> ids) {
//        ampBuiltinToolsService.updateEnabledBatch(ids);
//        return R.ok();
//    }

//    @Log(title = "批量停用Harness 内置工具只读目录，用于统一预览、依赖解析和统计", businessType = BusinessType.UPDATE)
//    @Operation(summary = "批量停用", description = "批量停用")
//    @PostMapping("/disabled/batch")
//    @RequiresPermissions("business:ampBuiltinTools:edit")
//    public R<Void> updateDisabledBatch(@RequestParam List<String> ids) {
//        ampBuiltinToolsService.updateDisabledBatch(ids);
//        return R.ok();
//    }
}
