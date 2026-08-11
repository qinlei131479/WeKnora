package ${package.Controller};

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import com.iptv.common.core.domain.R;
<#if superControllerClassPackage??>
import ${superControllerClassPackage};
</#if>
import ${package.Entity}.vo.${entity}VO;
import ${package.Entity}.dto.${entity}DTO;
import ${package.Entity}.dto.page.${entity}PageDTO;
import ${package.Service}.${table.serviceName};
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
 * ${table.comment!} 前端控制器（PostgreSQL）
 * </p>
 *
 * @author ${author}
 * @since ${date}
 */
@Tag(name = "${table.comment!}管理", description = "${table.comment!}前端控制器（PostgreSQL）")
@RestController
@RequestMapping("<#if package.ModuleName?? && package.ModuleName != "">/${package.ModuleName}</#if>/<#if controllerMappingHyphenStyle??>${controllerMappingHyphen}<#else>${table.entityPath}</#if>")
<#if superControllerClass??>
public class ${table.controllerName} extends ${superControllerClass} {
<#else>
public class ${table.controllerName} {
</#if>

    @Autowired
    private ${table.serviceName} ${table.entityPath}Service;

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:query")
    public R<${entity}VO> queryById(String id) {
        return R.ok(${table.entityPath}Service.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:list")
    public TableDataInfo<${entity}VO> list(${entity}PageDTO dto, PageDTO pg) {
        return ${table.entityPath}Service.queryPage(dto, pg);
    }

    @Log(title = "新增${table.comment!}", businessType = BusinessType.INSERT)
    @Operation(summary = "新增", description = "新增")
    @PostMapping("/insert/single")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:add")
    public R<${entity}VO> insert(@RequestBody @Validated(BaseDTO.Insert.class) ${entity}DTO dto) {
        return R.ok(${table.entityPath}Service.insert(dto));
    }

    @Log(title = "更新${table.comment!}", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新")
    @PostMapping("/update/single")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:edit")
    public R<${entity}VO> update(@RequestBody @Validated(BaseDTO.Update.class) ${entity}DTO dto) {
        return R.ok(${table.entityPath}Service.update(dto));
    }

    @Log(title = "删除${table.comment!}", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除")
    @PostMapping("/delete/single")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:remove")
    public R<Void> deleteById(String id) {
        ${table.entityPath}Service.deleteById(id);
        return R.ok();
    }

    @Log(title = "导出${table.comment!}", businessType = BusinessType.EXPORT)
    @Operation(summary = "导出", description = "导出数据到 Excel")
    @GetMapping("/excel")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:export")
    public void export(${entity}PageDTO dto, PageDTO pg, HttpServletResponse response) {
        List<${entity}VO> list = ${table.entityPath}Service.queryPage(dto, pg).getRows();
        ExcelUtil<${entity}VO> util = new ExcelUtil<>(${entity}VO.class);
        util.exportExcel(response, list, "${table.comment!}数据.xlsx");
    }
<#assign hasEnabled = false>
<#list table.fields as field>
    <#if field.name == "enabled">
        <#assign hasEnabled = true>
    </#if>
</#list>
<#if hasEnabled>

    @Log(title = "批量启用${table.comment!}", businessType = BusinessType.UPDATE)
    @Operation(summary = "批量启用", description = "批量启用")
    @PostMapping("/enabled/batch")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:edit")
    public R<Void> updateEnabledBatch(@RequestParam List<String> ids) {
        ${table.entityPath}Service.updateEnabledBatch(ids);
        return R.ok();
    }

    @Log(title = "批量停用${table.comment!}", businessType = BusinessType.UPDATE)
    @Operation(summary = "批量停用", description = "批量停用")
    @PostMapping("/disabled/batch")
    @RequiresPermissions("${cfg.moduleName}:${table.entityPath}:edit")
    public R<Void> updateDisabledBatch(@RequestParam List<String> ids) {
        ${table.entityPath}Service.updateDisabledBatch(ids);
        return R.ok();
    }
</#if>
}
