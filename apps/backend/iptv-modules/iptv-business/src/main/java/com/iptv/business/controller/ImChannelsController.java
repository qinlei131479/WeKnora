package com.iptv.business.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import com.iptv.common.core.domain.R;
import com.iptv.business.domain.vo.ImChannelsVO;
import com.iptv.business.domain.dto.ImChannelsDTO;
import com.iptv.business.domain.dto.page.ImChannelsPageDTO;
import com.iptv.business.service.ImChannelsService;
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
 * IM 渠道：平台凭证、绑定智能体、会话模式与输出模式 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-01
 */
@Tag(name = "IM 渠道：平台凭证、绑定智能体、会话模式与输出模式管理", description = "IM 渠道：平台凭证、绑定智能体、会话模式与输出模式前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/imChannels")
public class ImChannelsController {
    @Autowired
    private ImChannelsService imChannelsService;

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:imChannels:query")
    public R<ImChannelsVO> queryById(String id) {
        return R.ok(imChannelsService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    public TableDataInfo<ImChannelsVO> list(ImChannelsPageDTO dto, PageDTO pg) {
        return imChannelsService.queryPage(dto, pg);
    }

    @Log(title = "新增IM 渠道：平台凭证、绑定智能体、会话模式与输出模式", businessType = BusinessType.INSERT)
    @Operation(summary = "新增", description = "新增",hidden = true)
    @PostMapping("/insert/single")
    @RequiresPermissions("business:imChannels:add")
    public R<ImChannelsVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) ImChannelsDTO dto) {
        return R.ok(imChannelsService.insert(dto));
    }

    @Log(title = "更新IM 渠道：平台凭证、绑定智能体、会话模式与输出模式", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新",hidden = true)
    @PostMapping("/update/single")
    @RequiresPermissions("business:imChannels:edit")
    public R<ImChannelsVO> update(@RequestBody @Validated(BaseDTO.Update.class) ImChannelsDTO dto) {
        return R.ok(imChannelsService.update(dto));
    }

    @Log(title = "删除IM 渠道：平台凭证、绑定智能体、会话模式与输出模式", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除",hidden = true)
    @PostMapping("/delete/single")
    @RequiresPermissions("business:imChannels:remove")
    public R<Void> deleteById(String id) {
        imChannelsService.deleteById(id);
        return R.ok();
    }

//    @Log(title = "批量启用IM 渠道：平台凭证、绑定智能体、会话模式与输出模式", businessType = BusinessType.UPDATE)
//    @Operation(summary = "批量启用", description = "批量启用",hidden = true)
//    @PostMapping("/enabled/batch")
//    @RequiresPermissions("business:imChannels:edit")
//    public R<Void> updateEnabledBatch(@RequestParam List<String> ids) {
//        imChannelsService.updateEnabledBatch(ids);
//        return R.ok();
//    }
//
//    @Log(title = "批量停用IM 渠道：平台凭证、绑定智能体、会话模式与输出模式", businessType = BusinessType.UPDATE)
//    @Operation(summary = "批量停用", description = "批量停用",hidden = true)
//    @PostMapping("/disabled/batch")
//    @RequiresPermissions("business:imChannels:edit")
//    public R<Void> updateDisabledBatch(@RequestParam List<String> ids) {
//        imChannelsService.updateDisabledBatch(ids);
//        return R.ok();
//    }
}
