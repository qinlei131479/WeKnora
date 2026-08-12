package com.iptv.business.controller;

import com.iptv.business.domain.dto.OllamaCheckModelsDTO;
import com.iptv.business.domain.dto.OllamaCheckRemoteModelDTO;
import com.iptv.business.domain.dto.OllamaDownloadModelDTO;
import com.iptv.business.domain.vo.OllamaCheckModelsVO;
import com.iptv.business.domain.vo.OllamaCheckRemoteModelVO;
import com.iptv.business.domain.vo.OllamaDownloadTaskVO;
import com.iptv.business.domain.vo.OllamaModelVO;
import com.iptv.business.domain.vo.OllamaStatusVO;
import com.iptv.business.service.OllamaService;
import com.iptv.common.core.domain.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Ollama 服务控制器
 *
 * @author kjsc
 * @since 2026-08-12
 */
@Tag(name = "Ollama 服务管理", description = "Ollama 服务状态和模型管理接口")
@RestController
@RequestMapping("/ollama")
@RequiredArgsConstructor
public class OllamaController {

    private final OllamaService ollamaService;

    @Operation(summary = "检查 Ollama 服务状态", description = "检查 Ollama 服务是否可用")
    @GetMapping("/status")
    public R<OllamaStatusVO> checkStatus() {
        return R.ok(ollamaService.checkStatus());
    }

    @Operation(summary = "获取模型列表", description = "获取已安装的 Ollama 模型列表")
    @GetMapping("/models")
    public R<List<OllamaModelVO>> listModels() {
        return R.ok(ollamaService.listModels());
    }

    @Operation(summary = "检查模型是否已安装", description = "批量检查指定模型是否已安装")
    @PostMapping("/models/check")
    public R<OllamaCheckModelsVO> checkModels(@RequestBody OllamaCheckModelsDTO dto) {
        return R.ok(ollamaService.checkModels(dto));
    }

    @Operation(summary = "下载模型", description = "异步下载指定的 Ollama 模型")
    @PostMapping("/models/download")
    public R<OllamaDownloadTaskVO> downloadModel(@RequestBody OllamaDownloadModelDTO dto) {
        return R.ok(ollamaService.downloadModel(dto.getModel()));
    }

    @Operation(summary = "查询下载进度", description = "获取指定下载任务的进度")
    @GetMapping("/download/progress/{taskId}")
    public R<OllamaDownloadTaskVO> getDownloadProgress(@PathVariable String taskId) {
        return R.ok(ollamaService.getDownloadProgress(taskId));
    }

    @Operation(summary = "列出所有下载任务", description = "获取所有下载任务列表")
    @GetMapping("/download/tasks")
    public R<List<OllamaDownloadTaskVO>> listDownloadTasks() {
        return R.ok(ollamaService.listDownloadTasks());
    }

    @Operation(summary = "检查远程模型", description = "检查远程模型 API 是否可访问")
    @PostMapping("/remote/check")
    public R<OllamaCheckRemoteModelVO> checkRemoteModel(@RequestBody OllamaCheckRemoteModelDTO dto) {
        return R.ok(ollamaService.checkRemoteModel(dto));
    }
}
