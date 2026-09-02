package com.iptv.business.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import com.iptv.common.core.domain.R;
import com.iptv.business.domain.vo.EmbedChannelsVO;
import com.iptv.business.domain.dto.EmbedChannelsDTO;
import com.iptv.business.domain.dto.page.EmbedChannelsPageDTO;
import com.iptv.business.service.EmbedChannelsService;
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
 * Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-02
 */
@Tag(name = "Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置管理", description = "Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/embedChannels")
public class EmbedChannelsController {
    @Autowired
    private EmbedChannelsService embedChannelsService;

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:embedChannels:query")
    public R<EmbedChannelsVO> queryById(String id) {
        return R.ok(embedChannelsService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("business:embedChannels:list")
    public TableDataInfo<EmbedChannelsVO> list(EmbedChannelsPageDTO dto, PageDTO pg) {
        return embedChannelsService.queryPage(dto, pg);
    }

    @Log(title = "新增Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置", businessType = BusinessType.INSERT)
    @Operation(summary = "新增", description = "新增")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:embedChannels:add")
    public R<EmbedChannelsVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) EmbedChannelsDTO dto) {
        return R.ok(embedChannelsService.insert(dto));
    }

    @Log(title = "更新Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新")
    @PostMapping("/update/single")
    @RequiresPermissions("business:embedChannels:edit")
    public R<EmbedChannelsVO> update(@RequestBody @Validated(BaseDTO.Update.class) EmbedChannelsDTO dto) {
        return R.ok(embedChannelsService.update(dto));
    }

    @Log(title = "删除Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除")
    @PostMapping("/delete/single")
    @RequiresPermissions("business:embedChannels:remove")
    public R<Void> deleteById(String id) {
        embedChannelsService.deleteById(id);
        return R.ok();
    }

//    @Log(title = "导出Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置", businessType = BusinessType.EXPORT)
//    @Operation(summary = "导出", description = "导出数据到 Excel")
//    @GetMapping("/excel")
//    @RequiresPermissions("business:embedChannels:export")
//    public void export(EmbedChannelsPageDTO dto, PageDTO pg, HttpServletResponse response) {
//        List<EmbedChannelsVO> list = embedChannelsService.queryPage(dto, pg).getRows();
//        ExcelUtil<EmbedChannelsVO> util = new ExcelUtil<>(EmbedChannelsVO.class);
//        util.exportExcel(response, list, "Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置数据.xlsx");
//    }
//
//    @Log(title = "批量启用Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置", businessType = BusinessType.UPDATE)
//    @Operation(summary = "批量启用", description = "批量启用")
//    @PostMapping("/enabled/batch")
//    @RequiresPermissions("business:embedChannels:edit")
//    public R<Void> updateEnabledBatch(@RequestParam List<String> ids) {
//        embedChannelsService.updateEnabledBatch(ids);
//        return R.ok();
//    }
//
//    @Log(title = "批量停用Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置", businessType = BusinessType.UPDATE)
//    @Operation(summary = "批量停用", description = "批量停用")
//    @PostMapping("/disabled/batch")
//    @RequiresPermissions("business:embedChannels:edit")
//    public R<Void> updateDisabledBatch(@RequestParam List<String> ids) {
//        embedChannelsService.updateDisabledBatch(ids);
//        return R.ok();
//    }
}
