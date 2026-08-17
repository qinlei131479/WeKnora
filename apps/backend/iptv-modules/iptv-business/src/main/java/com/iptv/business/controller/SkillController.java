package com.iptv.business.controller;

import com.iptv.business.domain.vo.SkillVO;
import com.iptv.business.service.SkillService;
import com.iptv.common.core.domain.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 技能管理控制器
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Tag(name = "技能管理", description = "预装技能查询接口")
@RestController
@RequestMapping("/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @Operation(summary = "获取预装技能列表", description = "获取系统中所有预装技能的列表")
    @GetMapping("/list")
    public R<Map<String, Object>> listSkills() {
        List<SkillVO> skills = skillService.listPreloadedSkills();
        Boolean sandboxMode = skillService.isSandboxMode();

        Map<String, Object> result = new HashMap<>();
        result.put("data", skills);
        result.put("skills_available", sandboxMode);

        return R.ok(result);
    }
}
