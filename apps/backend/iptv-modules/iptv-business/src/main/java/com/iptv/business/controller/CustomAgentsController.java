package com.iptv.business.controller;

import com.iptv.business.domain.dto.page.CustomAgentsPageDTO;
import com.iptv.business.domain.vo.CustomAgentsVO;
import com.iptv.business.service.CustomAgentsService;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.RequiresPermissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 自定义/内置智能体配置（与租户组成复合主键） 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-26
 */
@Tag(name = "自定义/内置智能体配置（与租户组成复合主键）管理", description = "自定义/内置智能体配置（与租户组成复合主键）前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/customAgents")
public class CustomAgentsController {

    @Autowired
    private CustomAgentsService customAgentsService;

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:customAgents:query")
    public R<CustomAgentsVO> queryById(String id,Integer tenantId) {
        return R.ok(customAgentsService.queryById(id,tenantId));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("business:customAgents:list")
    public TableDataInfo<CustomAgentsVO> list(CustomAgentsPageDTO dto, PageDTO pg) {
        return customAgentsService.queryPage(dto, pg);
    }

    @Log(title = "删除自定义/内置智能体配置（与租户组成复合主键）", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除")
    @PostMapping("/delete/single")
    @RequiresPermissions("business:customAgents:remove")
    public R<Void> deleteById(String id) {
        customAgentsService.deleteById(id);
        return R.ok();
    }
}
