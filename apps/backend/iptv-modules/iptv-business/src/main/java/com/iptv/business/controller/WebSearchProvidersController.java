package com.iptv.business.controller;

import com.iptv.business.domain.dto.WebSearchCredentialsDTO;
import com.iptv.business.domain.dto.WebSearchProvidersDTO;
import com.iptv.business.domain.dto.WebSearchTestRequestDTO;
import com.iptv.business.domain.dto.page.WebSearchProvidersPageDTO;
import com.iptv.business.domain.vo.CredentialsResponseVO;
import com.iptv.business.domain.vo.WebSearchProviderTypeVO;
import com.iptv.business.domain.vo.WebSearchProvidersVO;
import com.iptv.business.service.WebSearchProvidersService;
import com.iptv.common.core.domain.R;
import com.iptv.common.core.web.domain.dto.BaseDTO;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import com.iptv.common.log.annotation.Log;
import com.iptv.common.log.enums.BusinessType;
import com.iptv.common.security.annotation.RequiresPermissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * <p>
 * 租户级网络搜索提供商配置（密钥加密存储） 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-17
 */
@Tag(name = "租户级网络搜索提供商配置（密钥加密存储）管理", description = "租户级网络搜索提供商配置（密钥加密存储）前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/webSearchProviders")
public class WebSearchProvidersController {

    @Autowired
    private WebSearchProvidersService webSearchProvidersService;

    @Operation(summary = "获取提供商类型元数据", description = "返回 UI 表单需要的提供商类型及参数定义")
    @GetMapping("/types")
    public R<List<WebSearchProviderTypeVO>> listProviderTypes() {
        return R.ok(webSearchProvidersService.listProviderTypes());
    }

    @Operation(summary = "按 id 查询", description = "按 id 查询")
    @GetMapping("/single")
    @RequiresPermissions("business:webSearchProviders:query")
    public R<WebSearchProvidersVO> queryById(String id) {
        return R.ok(webSearchProvidersService.queryById(id));
    }

    @Operation(summary = "分页查询", description = "按条件分页查询")
    @GetMapping("/list")
    @RequiresPermissions("business:webSearchProviders:list")
    public TableDataInfo<WebSearchProvidersVO> list(WebSearchProvidersPageDTO dto, PageDTO pg) {
        return webSearchProvidersService.queryPage(dto, pg);
    }

    @Log(title = "新增租户级网络搜索提供商配置（密钥加密存储）", businessType = BusinessType.INSERT)
    @Operation(summary = "新增", description = "新增")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:webSearchProviders:add")
    public R<WebSearchProvidersVO> insert(@RequestBody @Validated(BaseDTO.Insert.class) WebSearchProvidersDTO dto) {
        return R.ok(webSearchProvidersService.insert(dto));
    }

    @Log(title = "更新租户级网络搜索提供商配置（密钥加密存储）", businessType = BusinessType.UPDATE)
    @Operation(summary = "按 id 更新", description = "按 id 更新（忽略 api_key，凭证走独立接口）")
    @PostMapping("/update/single")
    @RequiresPermissions("business:webSearchProviders:edit")
    public R<WebSearchProvidersVO> update(@RequestBody @Validated(BaseDTO.Update.class) WebSearchProvidersDTO dto) {
        return R.ok(webSearchProvidersService.update(dto));
    }

    @Log(title = "删除租户级网络搜索提供商配置（密钥加密存储）", businessType = BusinessType.DELETE)
    @Operation(summary = "按 id 删除", description = "按 id 删除")
    @PostMapping("/delete/single")
    @RequiresPermissions("business:webSearchProviders:remove")
    public R<Void> deleteById(String id) {
        webSearchProvidersService.deleteById(id);
        return R.ok();
    }

    @Operation(summary = "测试已保存的提供商", description = "使用数据库中已保存的凭证测试连通性")
    @PostMapping("/{id}/test")
    @RequiresPermissions("business:webSearchProviders:query")
    public R<Map<String, Object>> testProviderById(@PathVariable String id) {
        return R.ok(webSearchProvidersService.testProviderById(id));
    }

    @Operation(summary = "测试原始凭证（不落库）", description = "使用前端表单中尚未保存的凭证测试连通性，用于'测试连接'按钮")
    @PostMapping("/test")
    @RequiresPermissions("business:webSearchProviders:query")
    public R<Map<String, Object>> testProviderRaw(@RequestBody @Validated WebSearchTestRequestDTO dto) {
        return R.ok(webSearchProvidersService.testProviderRaw(dto));
    }

    @Operation(summary = "更新/查询凭证", description = "body 含 api_key 则更新，不含则仅返回配置状态")
    @PostMapping("/credentials")
    @RequiresPermissions("business:webSearchProviders:edit")
    public R<CredentialsResponseVO> updateOrQueryCredentials(
            @RequestBody WebSearchCredentialsDTO dto) {
        return R.ok(webSearchProvidersService.updateOrQueryCredentials(dto));
    }

    @Log(title = "删除凭证字段", businessType = BusinessType.DELETE)
    @Operation(summary = "删除凭证字段", description = "目前仅支持 api_key")
    @DeleteMapping("/{id}/credentials/{field}")
    @RequiresPermissions("business:webSearchProviders:edit")
    public R<Void> deleteCredentialField(@PathVariable String id, @PathVariable String field) {
        webSearchProvidersService.deleteCredentialField(id, field);
        return R.ok();
    }
}
