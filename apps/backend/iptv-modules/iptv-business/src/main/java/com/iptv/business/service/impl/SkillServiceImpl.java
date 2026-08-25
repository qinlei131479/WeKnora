package com.iptv.business.service.impl;

import cn.hutool.core.util.StrUtil;
import com.iptv.business.config.SkillConfig;
import com.iptv.business.domain.vo.SkillVO;
import com.iptv.business.service.SkillService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.Yaml;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 技能服务实现类
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SkillServiceImpl implements SkillService {

    private final SkillConfig skillConfig;

    /**
     * YAML frontmatter正则表达式
     * 匹配以 --- 开头和结尾的内容
     */
    private static final Pattern FRONTMATTER_PATTERN = Pattern.compile(
            "^---\\s*\\n(.*?)\\n---\\s*\\n",
            Pattern.DOTALL
    );

    /**
     * 技能名称正则表达式
     * 允许任何语言的字母（包括中文）、数字和连字符
     * 与Go代码保持一致：^[\p{L}\p{N}-]+$
     */
    private static final Pattern SKILL_NAME_PATTERN = Pattern.compile("^[\\p{L}\\p{N}-]+$");

    /**
     * 保留字列表
     */
    private static final List<String> RESERVED_WORDS = List.of(
            "anthropic", "claude", "assistant", "help"
    );

    /**
     * 最大名称长度
     */
    private static final int MAX_NAME_LENGTH = 64;

    /**
     * 最大描述长度
     */
    private static final int MAX_DESCRIPTION_LENGTH = 1024;

    @Override
    public List<SkillVO> listPreloadedSkills() {
        log.debug("获取预装技能列表, 目录: {}", skillConfig.getPath());

        List<SkillVO> skills = new ArrayList<>();
        Path skillsDir = Paths.get(skillConfig.getPath());

        if (!Files.exists(skillsDir) || !Files.isDirectory(skillsDir)) {
            log.warn("技能目录不存在: {}", skillsDir);
            return skills;
        }

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(skillsDir)) {
            for (Path skillDir : stream) {
                if (!Files.isDirectory(skillDir)) {
                    continue;
                }

                Path skillFile = skillDir.resolve("SKILL.md");
                if (!Files.exists(skillFile)) {
                    log.debug("技能目录缺少SKILL.md文件: {}", skillDir);
                    continue;
                }

                try {
                    SkillVO skill = parseSkillFile(skillFile);
                    if (skill != null) {
                        skills.add(skill);
                    }
                } catch (Exception e) {
                    log.warn("解析技能文件失败: {}, 错误: {}", skillFile, e.getMessage());
                }
            }
        } catch (IOException e) {
            log.error("读取技能目录失败: {}", e.getMessage(), e);
        }

        log.info("成功加载 {} 个预装技能", skills.size());
        return skills;
    }

    @Override
    public Boolean isSandboxMode() {
        return skillConfig.getSandboxMode();
    }

    /**
     * 解析SKILL.md文件
     *
     * @param skillFile 技能文件路径
     * @return 技能信息
     * @throws IOException 读取文件异常
     */
    private SkillVO parseSkillFile(Path skillFile) throws IOException {
        StringBuilder content = new StringBuilder();
        try (BufferedReader reader = Files.newBufferedReader(skillFile)) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
        }

        String fileContent = content.toString();
        Matcher matcher = FRONTMATTER_PATTERN.matcher(fileContent);

        if (!matcher.find()) {
            log.warn("技能文件缺少YAML frontmatter: {}", skillFile);
            return null;
        }

        String yamlContent = matcher.group(1);
        Yaml yaml = new Yaml();
        Map<String, Object> metadata = yaml.load(yamlContent);

        if (metadata == null) {
            log.warn("技能文件YAML解析为空: {}", skillFile);
            return null;
        }

        String name = getStringValue(metadata, "name");
        String description = getStringValue(metadata, "description");

        // 验证技能名称
        if (!validateSkillName(name)) {
            log.warn("技能名称无效: {}, 文件: {}", name, skillFile);
            return null;
        }

        // 验证描述
        if (!validateSkillDescription(description)) {
            log.warn("技能描述无效: {}, 文件: {}", description, skillFile);
            return null;
        }

        SkillVO skill = new SkillVO();
        skill.setName(name);
        skill.setDescription(description);

        return skill;
    }

    /**
     * 从Map中获取字符串值
     *
     * @param map 数据Map
     * @param key 键名
     * @return 字符串值
     */
    private String getStringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    /**
     * 验证技能名称
     *
     * @param name 技能名称
     * @return 是否有效
     */
    private boolean validateSkillName(String name) {
        if (StrUtil.isBlank(name)) {
            return false;
        }

        if (name.length() > MAX_NAME_LENGTH) {
            return false;
        }

        if (!SKILL_NAME_PATTERN.matcher(name).matches()) {
            return false;
        }

        // 检查保留字
        String lowerName = name.toLowerCase();
        for (String reserved : RESERVED_WORDS) {
            if (lowerName.contains(reserved)) {
                return false;
            }
        }

        // 检查是否包含XML标签
        if (name.contains("<") || name.contains(">")) {
            return false;
        }

        return true;
    }

    /**
     * 验证技能描述
     *
     * @param description 技能描述
     * @return 是否有效
     */
    private boolean validateSkillDescription(String description) {
        if (StrUtil.isBlank(description)) {
            return false;
        }

        if (description.length() > MAX_DESCRIPTION_LENGTH) {
            return false;
        }

        // 检查是否包含XML标签
        if (description.contains("<") || description.contains(">")) {
            return false;
        }

        return true;
    }
}
