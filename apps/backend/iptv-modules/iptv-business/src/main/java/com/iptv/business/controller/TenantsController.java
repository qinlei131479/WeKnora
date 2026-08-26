package com.iptv.business.controller;

import com.iptv.business.domain.dto.ParserEngineCheckDTO;
import com.iptv.business.domain.dto.TenantBindUsersDTO;
import com.iptv.business.domain.dto.TenantsDTO;
import com.iptv.business.domain.dto.page.TenantsPageDTO;
import com.iptv.business.domain.vo.ParserEnginesVO;
import com.iptv.business.domain.vo.TenantsVO;
import com.iptv.business.domain.vo.UsersVO;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

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

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:tenants:query")
    public R<TenantsVO> queryById(Integer id) {
        return R.ok(tenantsService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
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
    public R<Void> deleteById(Integer id) {
        tenantsService.deleteById(id);
        return R.ok();
    }

    @Operation(summary = "该租户下用户列表", description = "查询该租户下绑定的用户列表")
    @GetMapping("/bindUsers")
    @RequiresPermissions("business:tenants:query")
    public R<List<UsersVO>> bindUsers(Integer tenantId) {
        return R.ok(tenantsService.bindUsers(tenantId));
    }

    @Operation(summary = "绑定用户", description = "绑定用户")
    @PostMapping("/bind")
    @RequiresPermissions("business:tenants:edit")
    public R<Void> tenantBindUsers(@RequestBody @Validated(BaseDTO.Update.class) TenantBindUsersDTO dto) {
        tenantsService.tenantBindUsers(dto);
        return R.ok();
    }

    @Operation(summary = "启用", description = "启用租户")
    @GetMapping("/enable")
    @RequiresPermissions("business:tenants:edit")
    public R<Void> enable(Integer tenantId) {
        tenantsService.enable(tenantId);
        return R.ok();
    }

    @Operation(summary = "停用", description = "停用租户")
    @GetMapping("/disable")
    @RequiresPermissions("business:tenants:edit")
    public R<Void> disable(Integer tenantId) {
        tenantsService.disable(tenantId);
        return R.ok();
    }

    @Operation(summary = "列出可用的文档解析引擎", description = "返回当前租户可用的解析引擎列表及 DocReader 连接状态")
    @GetMapping("/parser-engines")
    @RequiresPermissions("business:tenants:query")
    public R<ParserEnginesVO> listParserEngines(Integer tenantId) {
        return R.ok(tenantsService.listParserEngines(tenantId));
    }

    @Operation(summary = "使用当前参数检测解析引擎可用性", description = "使用给定配置参数检测解析引擎可用性（不保存）")
    @PostMapping("/parser-engines/check")
    @RequiresPermissions("business:tenants:edit")
    public R<ParserEnginesVO> checkParserEngines(@RequestBody ParserEngineCheckDTO dto) {
        return R.ok(tenantsService.checkParserEngines(dto));
    }
}
