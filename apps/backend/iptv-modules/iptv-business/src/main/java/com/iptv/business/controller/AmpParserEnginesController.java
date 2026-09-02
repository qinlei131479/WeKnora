package com.iptv.business.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import com.iptv.common.core.domain.R;
import com.iptv.business.domain.vo.AmpParserEnginesVO;
import com.iptv.business.domain.dto.AmpParserEnginesDTO;
import com.iptv.business.domain.dto.page.AmpParserEnginesPageDTO;
import com.iptv.business.service.AmpParserEnginesService;
import com.iptv.common.core.web.domain.dto.BaseDTO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.core.utils.poi.ExcelUtil;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.RequiresPermissions;

import java.util.List;

/**
 * <p>
 * 文档解析引擎表 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-01
 */
@Tag(name = "文档解析引擎表管理", description = "文档解析引擎表前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/ampParserEngines")
public class AmpParserEnginesController {

    @Autowired
    private AmpParserEnginesService ampParserEnginesService;

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:ampParserEngines:query")
    public R<AmpParserEnginesVO> queryById(Long id) {
        return R.ok(ampParserEnginesService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("business:ampParserEngines:list")
    public TableDataInfo<AmpParserEnginesVO> list(AmpParserEnginesPageDTO dto, PageDTO pg) {
        return ampParserEnginesService.queryPage(dto, pg);
    }

    @Log(title = "新增文档解析引擎表", businessType = BusinessType.INSERT)
    @Operation(summary = "新增", description = "新增")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:ampParserEngines:add")
    public R<AmpParserEnginesVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) AmpParserEnginesDTO dto) {
        return R.ok(ampParserEnginesService.insert(dto));
    }

    @Log(title = "更新文档解析引擎表", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新")
    @PostMapping("/update/single")
    @RequiresPermissions("business:ampParserEngines:edit")
    public R<AmpParserEnginesVO> update(@RequestBody @Validated(BaseDTO.Update.class) AmpParserEnginesDTO dto) {
        return R.ok(ampParserEnginesService.update(dto));
    }

    @Log(title = "删除文档解析引擎表", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除")
    @PostMapping("/delete/single")
    @RequiresPermissions("business:ampParserEngines:remove")
    public R<Void> deleteById(Long id) {
        ampParserEnginesService.deleteById(id);
        return R.ok();
    }

//    @Log(title = "导出文档解析引擎表", businessType = BusinessType.EXPORT)
//    @Operation(summary = "导出", description = "导出数据到 Excel")
//    @GetMapping("/excel")
//    @RequiresPermissions("business:ampParserEngines:export")
//    public void export(AmpParserEnginesPageDTO dto, PageDTO pg, HttpServletResponse response) {
//        List<AmpParserEnginesVO> list = ampParserEnginesService.queryPage(dto, pg).getRows();
//        ExcelUtil<AmpParserEnginesVO> util = new ExcelUtil<>(AmpParserEnginesVO.class);
//        util.exportExcel(response, list, "文档解析引擎表数据.xlsx");
//    }
//
//    @Log(title = "批量启用文档解析引擎表", businessType = BusinessType.UPDATE)
//    @Operation(summary = "批量启用", description = "批量启用")
//    @PostMapping("/enabled/batch")
//    @RequiresPermissions("business:ampParserEngines:edit")
//    public R<Void> updateEnabledBatch(@RequestParam List<String> ids) {
//        ampParserEnginesService.updateEnabledBatch(ids);
//        return R.ok();
//    }
//
//    @Log(title = "批量停用文档解析引擎表", businessType = BusinessType.UPDATE)
//    @Operation(summary = "批量停用", description = "批量停用")
//    @PostMapping("/disabled/batch")
//    @RequiresPermissions("business:ampParserEngines:edit")
//    public R<Void> updateDisabledBatch(@RequestParam List<String> ids) {
//        ampParserEnginesService.updateDisabledBatch(ids);
//        return R.ok();
//    }
}
