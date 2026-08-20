package com.iptv.business.controller;

import com.iptv.business.domain.dto.ModelCredentialsDTO;
import com.iptv.business.domain.dto.ModelDebugDTO;
import com.iptv.business.domain.dto.ModelTestRequestDTO;
import com.iptv.business.domain.dto.ModelsDTO;
import com.iptv.business.domain.dto.page.ModelsPageDTO;
import com.iptv.business.domain.vo.CredentialsResponseVO;
import com.iptv.business.domain.vo.ModelProviderVO;
import com.iptv.business.domain.vo.ModelTestResultVO;
import com.iptv.business.domain.vo.ModelsVO;
import com.iptv.business.service.ModelsService;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * <p>
 * 模型配置 前端控制器（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Tag(name = "模型配置管理", description = "模型配置前端控制器（PostgreSQL）")
@RestController
@RequestMapping("/models")
public class ModelsController {

    @Autowired
    private ModelsService modelsService;

    @Operation(summary = "获取模型厂商列表", description = "根据模型类型获取支持的厂商列表及配置信息")
    @GetMapping("/providers")
    public R<List<ModelProviderVO>> listProviders(@RequestParam(required = false) String modelType) {
        return R.ok(modelsService.listProviders(modelType));
    }

    @Operation(summary = "分页查询", description = "分页查询模型列表")
    @GetMapping("/list")
    public TableDataInfo<ModelsVO> listModels(ModelsPageDTO dto, PageDTO pg) {
        return modelsService.listModels(dto, pg);
    }

    @Operation(summary = "获取模型详情", description = "根据ID获取模型详情")
    @GetMapping("/single")
    @RequiresPermissions("business:models:query")
    public R<ModelsVO> getModelById(@RequestParam String id) {
        return R.ok(modelsService.getModelById(id));
    }

    @Log(title = "新增模型配置", businessType = BusinessType.INSERT)
    @Operation(summary = "创建模型", description = "创建新的模型配置")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:models:add")
    public R<ModelsVO> createModel(@RequestBody @Validated(BaseDTO.Insert.class) ModelsDTO dto) {
        return R.ok(modelsService.createModel(dto));
    }

    @Log(title = "更新模型配置", businessType = BusinessType.UPDATE)
    @Operation(summary = "更新模型", description = "更新模型配置信息（忽略凭证字段，凭证走独立接口）")
    @PostMapping("/update/single")
    @RequiresPermissions("business:models:edit")
    public R<ModelsVO> updateModel(@RequestBody @Validated(BaseDTO.Update.class) ModelsDTO dto) {
        return R.ok(modelsService.updateModel(dto));
    }

    @Log(title = "删除模型配置", businessType = BusinessType.DELETE)
    @Operation(summary = "删除模型", description = "删除指定的模型")
    @GetMapping("/delete/single")
    @RequiresPermissions("business:models:remove")
    public R<Void> deleteModel(@RequestParam String id) {
        modelsService.deleteModel(id);
        return R.ok();
    }

    @Operation(summary = "更新/查询凭证", description = "body 含 api_key 或 app_secret 则更新，不含则仅返回配置状态")
    @PostMapping("/credentials/update")
    @RequiresPermissions("business:models:edit")
    public R<CredentialsResponseVO> updateCredentials(@RequestBody ModelCredentialsDTO dto) {
        return R.ok(modelsService.updateCredentials(dto));
    }

    @Operation(summary = "查询凭证状态", description = "查询模型凭证的配置状态")
    @GetMapping("/credentials/single")
    @RequiresPermissions("business:models:query")
    public R<CredentialsResponseVO> getCredentials(@RequestParam String id) {
        return R.ok(modelsService.getCredentials(id));
    }

    @Log(title = "删除模型凭证字段", businessType = BusinessType.DELETE)
    @Operation(summary = "删除凭证字段", description = "删除指定的凭证字段（api_key 或 app_secret）")
    @GetMapping("/credentials/delete")
    @RequiresPermissions("business:models:edit")
    public R<Void> deleteCredentialField(@RequestParam String id, @RequestParam String field) {
        modelsService.deleteCredentialField(id, field);
        return R.ok();
    }

    @Log(title = "调试模型", businessType = BusinessType.OTHER)
    @Operation(summary = "调试模型", description = "测试模型的连通性和功能")
    @PostMapping("/debug")
    @RequiresPermissions("business:models:edit")
    public R<Object> debugModel(@RequestBody @Validated ModelDebugDTO dto,
                                @RequestParam(required = false) MultipartFile file) {
        return R.ok(modelsService.debugModel(dto, file));
    }

    // ==================== 远程模型测试接口 ====================

    @Log(title = "测试Chat模型连接", businessType = BusinessType.OTHER)
    @Operation(summary = "测试Chat模型连接", description = "检查远程Chat模型连接是否正常")
    @PostMapping("/test/chat")
    public R<ModelTestResultVO> testRemoteModel(@RequestBody @Validated ModelTestRequestDTO dto) {
        return R.ok(modelsService.testRemoteModel(dto));
    }

    @Log(title = "测试Embedding模型", businessType = BusinessType.OTHER)
    @Operation(summary = "测试Embedding模型", description = "测试Embedding接口是否可用并返回向量维度")
    @PostMapping("/test/embedding")
    public R<ModelTestResultVO> testEmbeddingModel(@RequestBody @Validated ModelTestRequestDTO dto) {
        return R.ok(modelsService.testEmbeddingModel(dto));
    }

    @Log(title = "测试Rerank模型", businessType = BusinessType.OTHER)
    @Operation(summary = "测试Rerank模型", description = "检查Rerank模型连接和功能是否正常")
    @PostMapping("/test/rerank")
    public R<ModelTestResultVO> testRerankModel(@RequestBody @Validated ModelTestRequestDTO dto) {
        return R.ok(modelsService.testRerankModel(dto));
    }

    @Log(title = "测试ASR模型", businessType = BusinessType.OTHER)
    @Operation(summary = "测试ASR模型", description = "检查ASR（语音识别）模型连接是否正常")
    @PostMapping("/test/asr")
    public R<ModelTestResultVO> testASRModel(@RequestBody @Validated ModelTestRequestDTO dto) {
        return R.ok(modelsService.testASRModel(dto));
    }

    @Log(title = "测试多模态模型", businessType = BusinessType.OTHER)
    @Operation(summary = "测试多模态模型", description = "测试多模态（VLM）模型连接和功能是否正常")
    @PostMapping("/test/multimodal")
    public R<ModelTestResultVO> testMultimodalModel(@RequestBody @Validated ModelTestRequestDTO dto,
                                                     @RequestParam("file") MultipartFile file) {
        return R.ok(modelsService.testMultimodalModel(dto, file));
    }
}
