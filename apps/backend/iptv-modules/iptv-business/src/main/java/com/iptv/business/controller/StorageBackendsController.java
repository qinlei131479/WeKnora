package com.iptv.business.controller;

import cn.hutool.core.util.ObjectUtil;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.dto.StorageBackendsDTO;
import com.iptv.business.domain.dto.page.StorageBackendsPageDTO;
import com.iptv.business.domain.vo.StorageBackendsVO;
import com.iptv.business.domain.vo.TenantsVO;
import com.iptv.business.service.StorageBackendsService;
import com.iptv.business.service.TenantsService;
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

import java.util.List;

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
    @Resource
    private TenantsService tenantsService;

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:storageBackends:query")
    public R<StorageBackendsVO> queryById(String id) {
        StorageBackendsVO vo = storageBackendsService.queryById(id);
        if (vo != null) {
            TenantsVO tenantsVO = tenantsService.queryById(vo.getTenantId());
            if (tenantsVO != null) {
                vo.setTenantName(tenantsVO.getName());
            }
        }
        return R.ok(vo);
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("business:storageBackends:list")
    public TableDataInfo<StorageBackendsVO> list(StorageBackendsPageDTO dto, PageDTO pg) {
        TableDataInfo<StorageBackendsVO> tableDataInfo = storageBackendsService.queryPage(dto, pg);
        List<Tenants> tenantsList = tenantsService.list();
        tableDataInfo.getRows().forEach(vo -> {
            tenantsList.stream()
                    .filter(t -> ObjectUtil.equal(t.getId(), vo.getTenantId()))
                    .findFirst()
                    .ifPresent(tenants -> vo.setTenantName(tenants.getName()));
        });
        return tableDataInfo;
    }

    @Log(title = "新增存储后端实例", businessType = BusinessType.INSERT)
    @Operation(summary = "新增", description = "新增")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:storageBackends:add")
    public R<StorageBackendsVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) StorageBackendsDTO dto) {
        StorageBackendsVO vo = storageBackendsService.insert(dto);
        if (vo != null) {
            TenantsVO tenantsVO = tenantsService.queryById(vo.getTenantId());
            if (tenantsVO != null) {
                vo.setTenantName(tenantsVO.getName());
            }
        }
        return R.ok(vo);
    }

    @Log(title = "更新存储后端实例", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新")
    @PostMapping("/update/single")
    @RequiresPermissions("business:storageBackends:edit")
    public R<StorageBackendsVO> update(@RequestBody @Validated(BaseDTO.Update.class) StorageBackendsDTO dto) {
        StorageBackendsVO vo = storageBackendsService.update(dto);
        if (vo != null) {
            TenantsVO tenantsVO = tenantsService.queryById(vo.getTenantId());
            if (tenantsVO != null) {
                vo.setTenantName(tenantsVO.getName());
            }
        }
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
