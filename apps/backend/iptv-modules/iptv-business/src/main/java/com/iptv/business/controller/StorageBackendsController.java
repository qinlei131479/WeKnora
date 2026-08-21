package com.iptv.business.controller;

import com.iptv.business.domain.dto.StorageBackendsDTO;
import com.iptv.business.domain.dto.page.StorageBackendsPageDTO;
import com.iptv.business.domain.vo.StorageBackendsVO;
import com.iptv.business.service.StorageBackendsService;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.domain.dto.BaseDTO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.RequiresPermissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * <p>
 * 存储后端实例 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-21
 */
@Tag(name = "存储后端实例管理", description = "存储后端实例前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/storageBackends")
public class StorageBackendsController {
    @Resource
    private StorageBackendsService storageBackendsService;


    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:storageBackends:query")
    public R<StorageBackendsVO> queryById(String id) {
        return R.ok(storageBackendsService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("business:storageBackends:list")
    public TableDataInfo<StorageBackendsVO> list(StorageBackendsPageDTO dto, PageDTO pg) {
        return storageBackendsService.queryPage(dto, pg);
    }

    @Log(title = "新增存储后端实例", businessType = BusinessType.INSERT)
    @Operation(summary = "新增", description = "新增")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:storageBackends:add")
    public R<StorageBackendsVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) StorageBackendsDTO dto) {
        return R.ok(storageBackendsService.insert(dto));
    }

    @Log(title = "更新存储后端实例", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新")
    @PostMapping("/update/single")
    @RequiresPermissions("business:storageBackends:edit")
    public R<StorageBackendsVO> update(@RequestBody @Validated(BaseDTO.Update.class) StorageBackendsDTO dto) {
        return R.ok(storageBackendsService.update(dto));
    }

    @Log(title = "删除存储后端实例", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除")
    @PostMapping("/delete/single")
    @RequiresPermissions("business:storageBackends:remove")
    public R<Void> deleteById(String id) {
        storageBackendsService.deleteById(id);
        return R.ok();
    }

//    @Log(title = "导出存储后端实例", businessType = BusinessType.EXPORT)
//    @Operation(summary = "导出", description = "导出数据到 Excel")
//    @GetMapping("/excel")
//    @RequiresPermissions("business:storageBackends:export")
//    public void export(StorageBackendsPageDTO dto, PageDTO pg, HttpServletResponse response) {
//        List<StorageBackendsVO> list = storageBackendsService.queryPage(dto, pg).getRows();
//        ExcelUtil<StorageBackendsVO> util = new ExcelUtil<>(StorageBackendsVO.class);
//        util.exportExcel(response, list, "存储后端实例数据.xlsx");
//    }
}
