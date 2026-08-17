package com.iptv.system.controller;

import com.iptv.common.core.constant.TenantConstant;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.core.web.domain.vo.SelectVO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.InnerAuth;
import com.iptv.common.security.annotation.RequiresPermissions;
import com.iptv.common.security.utils.SecurityUtils;
import com.iptv.system.api.domain.dto.SysTenantFilterDTO;
import com.iptv.system.api.domain.dto.SysTenantReqDTO;
import com.iptv.system.api.domain.dto.SysTenantSaveDTO;
import com.iptv.system.api.domain.vo.*;
import com.iptv.system.service.ISysTenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 租户管理
 */
@Tag(name = "租户管理")
@RestController
@RequestMapping("/tenant")
public class SysTenantController {

    @Autowired
    private ISysTenantService sysTenantService;

    @Operation(description = "分页查询租户列表")
    @RequiresPermissions("system:tenant:list")
    @GetMapping("/list")
    public TableDataInfo<SysTenantVO> queryList(SysTenantFilterDTO condition, PageDTO pg) {
        return sysTenantService.queryList(condition, pg);
    }

    @Operation(description = "查询当前用户租户列表")
    @GetMapping("/queryCurrentList")
    public R<List<SelectVO<Long>>> queryCurrentList() {
        SysTenantFilterDTO dto = new SysTenantFilterDTO();
        dto.setUserId(SecurityUtils.getUserId());
        return R.ok(sysTenantService.queryCurrentList(dto));
    }

    @Operation(description = "查询用户租户列表")
    @GetMapping("/queryTenantList")
    public R<List<SelectVO<Long>>> queryTenantList(Long userId) {
        SysTenantFilterDTO dto = new SysTenantFilterDTO();
        dto.setUserId(userId);
        return R.ok(sysTenantService.queryCurrentList(dto));
    }

    @Operation(description = "按id查询")
    @GetMapping("/single")
    public R<SysTenantVO> queryById(Long id) {
        return R.ok(sysTenantService.queryById(id));
    }

    @Operation(description = "获取所有租户(下拉)")
    @GetMapping("/get-alltenant")
    public R<List<SysTenantReChangeVO>> getAlltenant() {
        return sysTenantService.getAlltenant();
    }

    @Operation(description = "下拉列表-查询用户所属租户及下级租户")
    @GetMapping("/select/tenant-app")
    public R<List<SysTenantAppSelectVO>> selectTenantApp() {
        List<SysTenantAppSelectVO> list = sysTenantService.selectTenantByUser();
        return R.ok(list);
    }

    @Operation(description = "新增租户")
    @RequiresPermissions("system:tenant:add")
    @Log(title = "log.title.tenant", businessType = BusinessType.INSERT)
    @PostMapping("/insert/single")
    public R<SysTenantVO> insert(@RequestBody SysTenantReqDTO reqVO) {
        SysTenantVO vo = sysTenantService.insert(reqVO);
        return R.ok(vo);
    }

    @Operation(description = "更新租户")
    @RequiresPermissions("system:tenant:edit")
    @Log(title = "log.title.tenant", businessType = BusinessType.UPDATE)
    @PostMapping("/update/single")
    public R<SysTenantVO> update(@RequestBody SysTenantSaveDTO saveVO) {
        return sysTenantService.update(saveVO);
    }

    @Operation(description = "删除租户")
    @RequiresPermissions("system:tenant:remove")
    @Log(title = "log.title.tenant", businessType = BusinessType.DELETE)
    @DeleteMapping("/single")
    public R<Void> deleteById(Long id) {
        sysTenantService.deleteUpdateById(id);
        return R.ok();
    }

    @Operation(description = "启用租户")
    @RequiresPermissions("system:tenant:edit")
    @Log(title = "log.title.tenant", businessType = BusinessType.UPDATE)
    @PostMapping("/open")
    public R<Void> open(Long id) {
        sysTenantService.changeStatus(id, "0");
        return R.ok();
    }

    @Operation(description = "禁用租户")
    @RequiresPermissions("system:tenant:edit")
    @Log(title = "log.title.tenant", businessType = BusinessType.UPDATE)
    @PostMapping("/cancel")
    public R<Void> cancel(Long id) {
        sysTenantService.changeStatus(id, "1");
        sysTenantService.kickOutUserByTenantId(id);
        return R.ok();
    }

    @Operation(description = "租户数据回显(修改)")
    @GetMapping("/get-tenant-data")
    public R<SysTenantEchoVO> getTenantData(Long tenantId) {
        return R.ok(sysTenantService.getTenantData(tenantId));
    }

    @Operation(description = "通过第三方租户编码查询租户")
    @InnerAuth
    @GetMapping("/get-tenant-by-third-id")
    public R<SysTenantRemoteVO> getTenantByThirdId(@RequestParam("thirdTenantType") String thirdTenantType,
                                                    @RequestParam("thirdTenantId") String thirdTenantId) {
        SysTenantRemoteVO vo = sysTenantService.getTenantByThirdId(thirdTenantType, thirdTenantId);
        return R.ok(vo);
    }

    @Operation(description = "验证租户名称是否重复")
    @GetMapping("/name")
    public R<Void> checkName(@RequestParam(value = "tenantId", required = false) Long tenantId,
                             String name) {
        boolean exists = sysTenantService.checkName(tenantId, name);
        if (exists) {
            return R.ok(null, MessageUtils.message("system.tenant.name.exists"));
        }
        return R.ok();
    }

    @Operation(description = "验证租户编码是否重复")
    @GetMapping("/checkThirdTenantId")
    public R<Void> checkThirdTenantId(@RequestParam(value = "tenantId", required = false) Long tenantId,
                                      String thirdTenantId) {
        boolean exists = sysTenantService.checkThirdTenantId(tenantId,
                TenantConstant.TenantType.THIRD_2_0.getCode(),
                thirdTenantId);
        if (exists) {
            return R.ok(null, MessageUtils.message("system.tenant.code.exists"));
        }
        return R.ok();
    }
}
