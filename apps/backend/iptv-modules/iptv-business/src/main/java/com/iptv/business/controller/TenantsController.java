package com.iptv.business.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import com.iptv.common.core.domain.R;
import com.iptv.business.domain.vo.TenantsVO;
import com.iptv.business.domain.dto.TenantsDTO;
import com.iptv.business.domain.dto.page.TenantsPageDTO;
import com.iptv.business.domain.Users;
import com.iptv.business.service.TenantsService;
import com.iptv.business.service.UsersService;
import com.iptv.common.core.web.domain.dto.BaseDTO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.core.utils.poi.ExcelUtil;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.RequiresPermissions;
import com.iptv.common.security.utils.SecurityUtils;

import java.util.List;

/**
 * <p>
 * 工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Tag(name = "工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置管理",
        description = "工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/tenants")
public class TenantsController {

    @Autowired
    private TenantsService tenantsService;

    @Autowired
    private UsersService usersService;

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:tenants:query")
    public R<TenantsVO> queryById(String id) {
        return R.ok(tenantsService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("business:tenants:list")
    public TableDataInfo<TenantsVO> list(TenantsPageDTO dto, PageDTO pg) {
        return tenantsService.queryPage(dto, pg);
    }

    @Log(title = "新增工作空间", businessType = BusinessType.INSERT)
    @Operation(summary = "新增工作空间", description = "创建新的工作空间，当前用户自动成为Owner")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:tenants:add")
    public R<TenantsVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) TenantsDTO dto) {
        return R.ok(tenantsService.insert(dto));
    }

    @Log(title = "更新工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新")
    @PostMapping("/update/single")
    @RequiresPermissions("business:tenants:edit")
    public R<TenantsVO> update(@RequestBody @Validated(BaseDTO.Update.class) TenantsDTO dto) {
        return R.ok(tenantsService.update(dto));
    }

    @Log(title = "删除工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除")
    @PostMapping("/delete/single")
    @RequiresPermissions("business:tenants:remove")
    public R<Void> deleteById(String id) {
        tenantsService.deleteById(id);
        return R.ok();
    }
}
