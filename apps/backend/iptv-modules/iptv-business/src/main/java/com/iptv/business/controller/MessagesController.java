package com.iptv.business.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import com.iptv.common.core.domain.R;
import com.iptv.business.domain.vo.MessagesVO;
import com.iptv.business.domain.dto.MessagesDTO;
import com.iptv.business.domain.dto.page.MessagesPageDTO;
import com.iptv.business.service.MessagesService;
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
 * 会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-25
 */
@Tag(name = "会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文管理", description = "会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/messages")
public class MessagesController {

    @Autowired
    private MessagesService messagesService;

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:messages:query")
    public R<MessagesVO> queryById(String id) {
        return R.ok(messagesService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("business:messages:list")
    public TableDataInfo<MessagesVO> list(MessagesPageDTO dto, PageDTO pg) {
        return messagesService.queryPage(dto, pg);
    }

    @Log(title = "新增会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文", businessType = BusinessType.INSERT)
    @Operation(summary = "新增", description = "新增")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:messages:add")
    public R<MessagesVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) MessagesDTO dto) {
        return R.ok(messagesService.insert(dto));
    }

    @Log(title = "更新会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新")
    @PostMapping("/update/single")
    @RequiresPermissions("business:messages:edit")
    public R<MessagesVO> update(@RequestBody @Validated(BaseDTO.Update.class) MessagesDTO dto) {
        return R.ok(messagesService.update(dto));
    }

    @Log(title = "删除会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除")
    @PostMapping("/delete/single")
    @RequiresPermissions("business:messages:remove")
    public R<Void> deleteById(String id) {
        messagesService.deleteById(id);
        return R.ok();
    }

    @Log(title = "导出会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文", businessType = BusinessType.EXPORT)
    @Operation(summary = "导出", description = "导出数据到 Excel")
    @GetMapping("/excel")
    @RequiresPermissions("business:messages:export")
    public void export(MessagesPageDTO dto, PageDTO pg, HttpServletResponse response) {
        List<MessagesVO> list = messagesService.queryPage(dto, pg).getRows();
        ExcelUtil<MessagesVO> util = new ExcelUtil<>(MessagesVO.class);
        util.exportExcel(response, list, "会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文数据.xlsx");
    }
}
