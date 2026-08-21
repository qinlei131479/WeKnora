package com.iptv.business.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import com.iptv.common.core.domain.R;
import com.iptv.business.domain.vo.UsersVO;
import com.iptv.business.domain.dto.UsersDTO;
import com.iptv.business.domain.dto.page.UsersPageDTO;
import com.iptv.business.service.UsersService;
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
 * 用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Tag(name = "用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好管理", description = "用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/users")
public class UsersController {

    @Autowired
    private UsersService usersService;

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:users:query")
    public R<UsersVO> queryById(String id) {
        return R.ok(usersService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("business:users:list")
    public TableDataInfo<UsersVO> list(UsersPageDTO dto, PageDTO pg) {
        return usersService.queryPage(dto, pg);
    }

    @Log(title = "新增用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好", businessType = BusinessType.INSERT)
    @Operation(summary = "新增", description = "新增")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:users:add")
    public R<UsersVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) UsersDTO dto) {
        return R.ok(usersService.insert(dto));
    }

    @Log(title = "更新用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新")
    @PostMapping("/update/single")
    @RequiresPermissions("business:users:edit")
    public R<UsersVO> update(@RequestBody @Validated(BaseDTO.Update.class) UsersDTO dto) {
        return R.ok(usersService.update(dto));
    }

    @Log(title = "删除用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除")
    @PostMapping("/delete/single")
    @RequiresPermissions("business:users:remove")
    public R<Void> deleteById(String id) {
        usersService.deleteById(id);
        return R.ok();
    }

    @Log(title = "导出用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好", businessType = BusinessType.EXPORT)
    @Operation(summary = "导出", description = "导出数据到 Excel")
    @GetMapping("/excel")
    @RequiresPermissions("business:users:export")
    public void export(UsersPageDTO dto, PageDTO pg, HttpServletResponse response) {
        List<UsersVO> list = usersService.queryPage(dto, pg).getRows();
        ExcelUtil<UsersVO> util = new ExcelUtil<>(UsersVO.class);
        util.exportExcel(response, list, "用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好数据.xlsx");
    }
}
