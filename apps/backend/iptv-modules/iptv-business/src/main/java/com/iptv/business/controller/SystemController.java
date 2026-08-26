package com.iptv.business.controller;

import com.iptv.business.domain.dto.ParserEngineCheckDTO;
import com.iptv.business.domain.vo.ParserEnginesVO;
import com.iptv.business.service.TenantsService;
import com.iptv.common.core.domain.R;
import com.iptv.common.security.annotation.RequiresPermissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 系统信息控制器
 * 对应 Go 语言 /api/v1/system/* 路由组
 *
 * @author iptv
 * @since 2026-08-26
 */
@Tag(name = "系统信息", description = "系统信息：解析引擎、存储引擎等系统状态查询")
@RestController
@RequestMapping("/system")
public class SystemController {

    @Autowired
    private TenantsService tenantsService;

    @Operation(summary = "列出可用的文档解析引擎", description = "返回当前租户可用的解析引擎列表及 DocReader 连接状态")
    @GetMapping("/parser-engines")
    public R<ParserEnginesVO> listParserEngines(Integer tenantId) {
        return R.ok(tenantsService.listParserEngines(tenantId));
    }

    @Operation(summary = "使用当前参数检测解析引擎可用性", description = "使用给定配置参数检测解析引擎可用性（不保存）")
    @PostMapping("/parser-engines/check")
    public R<ParserEnginesVO> checkParserEngines(@RequestBody ParserEngineCheckDTO dto) {
        return R.ok(tenantsService.checkParserEngines(dto));
    }
}
