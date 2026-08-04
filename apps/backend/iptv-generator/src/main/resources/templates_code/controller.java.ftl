package ${package.Controller};

import java.util.List;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
<#if restControllerStyle>
import org.springframework.web.bind.annotation.RestController;
<#else>
import org.springframework.stereotype.Controller;
</#if>
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
<#if superControllerClassPackage??>
import ${superControllerClassPackage};
</#if>
import ${package.Entity}.${entity};
import ${package.Entity}.vo.${entity}VO;
import ${package.Entity}.dto.${entity}DTO;
import ${package.Entity}.dto.page.${entity}PageDTO;
import ${package.Service}.${table.serviceName};

import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.domain.dto.BaseDTO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.core.utils.poi.ExcelUtil;
import jakarta.servlet.http.HttpServletResponse;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.RequiresPermissions;
/**
* <p>
* ${table.comment!} 前端控制器
* </p>
*
* @author ${author}
* @since ${date}
*/
@Tag(name = "${table.comment!}前端控制器",description = "${table.comment!}前端控制器")
<#if restControllerStyle>
@RestController
<#else>
@Controller
</#if>
@RequestMapping("<#if package.ModuleName?? && package.ModuleName != "">/${package.ModuleName}</#if>/<#if controllerMappingHyphenStyle??>${controllerMappingHyphen}<#else>${table.entityPath}</#if>")
<#if kotlin>
class ${table.controllerName}<#if superControllerClass??> : ${superControllerClass}()</#if>
<#else>
<#if superControllerClass??>
public class ${table.controllerName} extends ${superControllerClass} {
<#else>
public class ${table.controllerName} {
</#if>
    @Autowired
    private ${table.serviceName} ${table.entityPath}Service;

    @Operation(summary = "按id查询")
    @GetMapping("/single")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:query")
    public R<${entity}VO> queryById(Long id) {
        return R.ok(${table.entityPath}Service.queryById(id));
    }

    @Operation(summary = "按条件查询")
    @GetMapping("/list")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:list")
    public TableDataInfo<${entity}VO> list(${entity}PageDTO dto, PageDTO pg) {
        return ${table.entityPath}Service.queryPage(dto, pg);
    }

    @Log(title = "新增${table.comment!}", businessType = BusinessType.INSERT)
    @Operation(summary = "新增")
    @PostMapping("/insert/single")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:add")
    public R<${entity}> insert(@RequestBody @Validated(BaseDTO.Insert.class) ${entity}DTO dto) {
        return R.ok(${table.entityPath}Service.insert(dto));
    }

    @Log(title = "更新${table.comment!}", businessType = BusinessType.UPDATE)
    @Operation(summary = "按id更新")
    @PostMapping("/update/single")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:edit")
    public R<${entity}> update(@RequestBody @Validated(BaseDTO.Update.class) ${entity}DTO dto) {
        return R.ok(${table.entityPath}Service.update(dto));
    }

    @Log(title = "删除${table.comment!}", businessType = BusinessType.DELETE)
    @Operation(summary = "按id删除")
    @PostMapping("/delete/single")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:remove")
    public R deleteById(Long id) {
        ${table.entityPath}Service.deleteById(id);
        return R.ok();
    }

    @Log(title = "导出数据", businessType = BusinessType.EXPORT)
    @Operation(summary = "导出数据")
    @GetMapping("/excel")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:export")
    public void export(${entity}PageDTO dto, PageDTO pg, HttpServletResponse response) {
        List<${entity}VO> list = ${table.entityPath}Service.queryPage(dto, pg).getRows();
        ExcelUtil<${entity}VO> util = new ExcelUtil<>(${entity}VO.class);
        util.exportExcel(response, list, "${table.comment!}数据.xlsx");
    }
<#-- 检测表中是否存在 enabled 字段，有则生成批量启用/停用方法 -->
<#assign hasEnabled = false>
<#list table.fields as field>
    <#if field.name == "enabled">
        <#assign hasEnabled = true>
    </#if>
</#list>
<#if hasEnabled>

    @Log(title = "批量启用", businessType = BusinessType.UPDATE)
    @Operation(summary = "批量启用", description = "批量启用")
    @PostMapping("/enabled/batch")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:edit")
    public R updateEnabledBatch(@RequestParam List<Long> ids) {
        return R.ok(${table.entityPath}Service.updateEnabledBatch(ids));
    }

    @Log(title = "批量停用", businessType = BusinessType.UPDATE)
    @Operation(summary = "批量停用", description = "批量停用")
    @PostMapping("/disabled/batch")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:edit")
    public R updateDisabledBatch(@RequestParam List<Long> ids) {
        return R.ok(${table.entityPath}Service.updateDisabledBatch(ids));
    }
</#if>
}
</#if>
