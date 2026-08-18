package com.iptv.business.controller;

import com.iptv.business.domain.dto.CustomAgentDTO;
import com.iptv.business.domain.vo.CustomAgentVO;
import com.iptv.business.service.CustomAgentService;
import com.iptv.common.core.domain.R;
import com.iptv.common.security.annotation.RequiresPermissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 智能体管理控制器
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Tag(name = "智能体管理", description = "智能体创建、配置和管理接口")
@RestController
@RequestMapping("/customAgent")
@RequiredArgsConstructor
public class CustomAgentController {

    private final CustomAgentService customAgentService;

    @Operation(summary = "创建智能体", description = "创建自定义智能体")
    @PostMapping("/insert/single")
    @RequiresPermissions("business:customAgent:add")
    public R<CustomAgentVO> createAgent(@RequestBody CustomAgentDTO dto) {
        return R.ok(customAgentService.createAgent(dto));
    }

    @Operation(summary = "获取智能体详情", description = "根据ID获取智能体详情")
    @GetMapping("/single")
    @RequiresPermissions("business:customAgent:query")
    public R<CustomAgentVO> getAgentById(
            @Parameter(description = "智能体ID", required = true)
            @RequestParam String id) {
        return R.ok(customAgentService.getAgentById(id));
    }

    @Operation(summary = "获取智能体列表", description = "获取当前租户的智能体列表")
    @GetMapping("/list")
    public R<Map<String, Object>> listAgents(
            @Parameter(description = "创建者过滤条件: mine/others")
            @RequestParam(required = false) String creator) {
        return R.ok(customAgentService.listAgents(creator));
    }

    @Operation(summary = "更新智能体", description = "更新智能体配置")
    @PostMapping("/update/single")
    @RequiresPermissions("business:customAgent:edit")
    public R<CustomAgentVO> updateAgent(@RequestBody CustomAgentDTO dto) {
        return R.ok(customAgentService.updateAgent(dto));
    }

    @Operation(summary = "删除智能体", description = "删除指定的智能体")
    @GetMapping("/delete/single")
    @RequiresPermissions("business:customAgent:remove")
    public R<Void> deleteAgent(
            @Parameter(description = "智能体ID", required = true)
            @RequestParam String id) {
        customAgentService.deleteAgent(id);
        return R.ok();
    }

    @Operation(summary = "复制智能体", description = "复制指定的智能体")
    @GetMapping("/copy")
    @RequiresPermissions("business:customAgent:add")
    public R<CustomAgentVO> copyAgent(
            @Parameter(description = "智能体ID", required = true)
            @RequestParam String id) {
        return R.ok(customAgentService.copyAgent(id));
    }

    @Operation(summary = "获取占位符定义", description = "获取提示词占位符定义")
    @GetMapping("/placeholders")
    public R<Map<String, Object>> getPlaceholders() {
        return R.ok(customAgentService.getPlaceholders());
    }

    @Operation(summary = "获取智能体类型预设", description = "获取智能体类型预设列表")
    @GetMapping("/type-presets")
    public R<List<Map<String, Object>>> getAgentTypePresets() {
        return R.ok(customAgentService.getAgentTypePresets());
    }

    @Operation(summary = "获取推荐问题", description = "根据智能体配置获取推荐问题")
    @GetMapping("/suggested-questions")
    public R<Map<String, Object>> getSuggestedQuestions(
            @Parameter(description = "智能体ID", required = true)
            @RequestParam String id,
            @Parameter(description = "知识库ID列表")
            @RequestParam(required = false) List<String> knowledgeBaseIds,
            @Parameter(description = "知识ID列表")
            @RequestParam(required = false) List<String> knowledgeIds,
            @Parameter(description = "标签范围")
            @RequestParam(required = false) String tagScopes,
            @Parameter(description = "返回数量上限")
            @RequestParam(required = false, defaultValue = "5") Integer limit) {
        return R.ok(customAgentService.getSuggestedQuestions(id, knowledgeBaseIds, knowledgeIds, tagScopes, limit));
    }
}
