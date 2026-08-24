package com.iptv.business.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import com.iptv.common.core.domain.R;
import com.iptv.business.domain.vo.VectorStoresVO;
import com.iptv.business.domain.dto.VectorStoresDTO;
import com.iptv.business.domain.dto.page.VectorStoresPageDTO;
import com.iptv.business.service.VectorStoresService;
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
 * 向量库连接实例：引擎类型、连接与索引配置 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-24
 */
@Tag(name = "向量库连接实例：引擎类型、连接与索引配置管理", description = "向量库连接实例：引擎类型、连接与索引配置前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/vectorStores")
public class VectorStoresController {

    @Autowired
    private VectorStoresService vectorStoresService;

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:vectorStores:query")
    public R<VectorStoresVO> queryById(String id) {
        return R.ok(vectorStoresService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("business:vectorStores:list")
    public TableDataInfo<VectorStoresVO> list(VectorStoresPageDTO dto, PageDTO pg) {
        return vectorStoresService.queryPage(dto, pg);
    }

    @Log(title = "新增向量库连接实例：引擎类型、连接与索引配置", businessType = BusinessType.INSERT)
    @Operation(summary = "新增", description = "新增")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:vectorStores:add")
    public R<VectorStoresVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) VectorStoresDTO dto) {
        return R.ok(vectorStoresService.insert(dto));
    }

    @Log(title = "更新向量库连接实例：引擎类型、连接与索引配置", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新")
    @PostMapping("/update/single")
    @RequiresPermissions("business:vectorStores:edit")
    public R<VectorStoresVO> update(@RequestBody @Validated(BaseDTO.Update.class) VectorStoresDTO dto) {
        return R.ok(vectorStoresService.update(dto));
    }

    @Log(title = "删除向量库连接实例：引擎类型、连接与索引配置", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除")
    @PostMapping("/delete/single")
    @RequiresPermissions("business:vectorStores:remove")
    public R<Void> deleteById(String id) {
        vectorStoresService.deleteById(id);
        return R.ok();
    }

    @Log(title = "导出向量库连接实例：引擎类型、连接与索引配置", businessType = BusinessType.EXPORT)
    @Operation(summary = "导出", description = "导出数据到 Excel")
    @GetMapping("/excel")
    @RequiresPermissions("business:vectorStores:export")
    public void export(VectorStoresPageDTO dto, PageDTO pg, HttpServletResponse response) {
        List<VectorStoresVO> list = vectorStoresService.queryPage(dto, pg).getRows();
        ExcelUtil<VectorStoresVO> util = new ExcelUtil<>(VectorStoresVO.class);
        util.exportExcel(response, list, "向量库连接实例：引擎类型、连接与索引配置数据.xlsx");
    }
}
