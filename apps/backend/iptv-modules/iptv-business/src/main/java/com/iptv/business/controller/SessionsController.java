package com.iptv.business.controller;

import com.iptv.business.domain.dto.SessionsDTO;
import com.iptv.business.domain.dto.page.SessionsPageDTO;
import com.iptv.business.domain.vo.SessionsVO;
import com.iptv.business.service.SessionsService;
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
 * 对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列） 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
@Tag(name = "对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列）管理", description = "对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列）前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/sessions")
public class SessionsController {
    @Resource
    private SessionsService sessionsService;


    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:sessions:query")
    public R<SessionsVO> queryById(String id) {
        return R.ok(sessionsService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("business:sessions:list")
    public TableDataInfo<SessionsVO> list(SessionsPageDTO dto, PageDTO pg) {
        return sessionsService.queryPage(dto, pg);
    }

    @Log(title = "新增对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列）", businessType = BusinessType.INSERT)
    @Operation(summary = "新增", description = "新增")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:sessions:add")
    public R<SessionsVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) SessionsDTO dto) {
        return R.ok(sessionsService.insert(dto));
    }

    @Log(title = "更新对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列）", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新")
    @PostMapping("/update/single")
    @RequiresPermissions("business:sessions:edit")
    public R<SessionsVO> update(@RequestBody @Validated(BaseDTO.Update.class) SessionsDTO dto) {
        return R.ok(sessionsService.update(dto));
    }

    @Log(title = "删除对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列）", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除")
    @PostMapping("/delete/single")
    @RequiresPermissions("business:sessions:remove")
    public R<Void> deleteById(String id) {
        sessionsService.deleteById(id);
        return R.ok();
    }

//    @Log(title = "导出对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列）", businessType = BusinessType.EXPORT)
//    @Operation(summary = "导出", description = "导出数据到 Excel")
//    @GetMapping("/excel")
//    @RequiresPermissions("business:sessions:export")
//    public void export(SessionsPageDTO dto, PageDTO pg, HttpServletResponse response) {
//        List<SessionsVO> list = sessionsService.queryPage(dto, pg).getRows();
//        ExcelUtil<SessionsVO> util = new ExcelUtil<>(SessionsVO.class);
//        util.exportExcel(response, list, "对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列）数据.xlsx");
//    }
}
