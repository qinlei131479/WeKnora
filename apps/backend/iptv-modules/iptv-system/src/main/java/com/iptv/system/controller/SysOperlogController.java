package com.iptv.system.controller;

import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.core.utils.poi.ExcelUtil;
import com.iptv.common.core.web.controller.BaseController;
import com.iptv.common.core.web.domain.AjaxResult;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.InnerAuth;
import com.iptv.common.security.annotation.RequiresPermissions;
import com.iptv.system.api.domain.SysOperLog;
import com.iptv.system.service.ISysOperLogService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 操作日志记录
 * 
 * @author ruoyi
 */
@RestController
@RequestMapping("/operlog")
public class SysOperlogController extends BaseController
{
    @Autowired
    private ISysOperLogService operLogService;

    @RequiresPermissions("system:operlog:list")
    @GetMapping("/list")
    public TableDataInfo<SysOperLog> list(SysOperLog operLog, PageDTO pageDTO)
    {
        return operLogService.selectOperLogList(operLog, pageDTO);
    }

    @Log(title = "log.title.operlog", businessType = BusinessType.EXPORT)
    @RequiresPermissions("system:operlog:export")
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysOperLog operLog, PageDTO pageDTO)
    {
        TableDataInfo<SysOperLog> list = operLogService.selectOperLogList(operLog, pageDTO);
        List<SysOperLog> records = list.getRows();
        ExcelUtil<SysOperLog> util = new ExcelUtil<SysOperLog>(SysOperLog.class);
        util.exportExcel(response, records, MessageUtils.message("excel.sheet.operlog"));
    }

    @Log(title = "log.title.operlog", businessType = BusinessType.DELETE)
    @RequiresPermissions("system:operlog:remove")
    @DeleteMapping("/{operIds}")
    public AjaxResult remove(@PathVariable Long[] operIds)
    {
        return toAjax(operLogService.deleteOperLogByIds(operIds));
    }

    @RequiresPermissions("system:operlog:remove")
    @Log(title = "log.title.operlog", businessType = BusinessType.CLEAN)
    @DeleteMapping("/clean")
    public AjaxResult clean()
    {
        operLogService.cleanOperLog();
        return success();
    }

    @InnerAuth
    @PostMapping
    public AjaxResult add(@RequestBody SysOperLog operLog)
    {
        return toAjax(operLogService.insertOperlog(operLog));
    }
}
