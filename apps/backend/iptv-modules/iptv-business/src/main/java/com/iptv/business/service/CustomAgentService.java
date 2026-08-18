package com.iptv.business.service;

import com.iptv.business.domain.dto.CustomAgentDTO;
import com.iptv.business.domain.vo.CustomAgentVO;
import com.iptv.business.domain.vo.PlaceholderVO;
import com.iptv.business.domain.vo.SuggestedQuestionVO;

import java.util.List;
import java.util.Map;

/**
 * 智能体服务接口
 *
 * @author kjsc
 * @since 2026-08-13
 */
public interface CustomAgentService {

    /**
     * 创建智能体
     *
     * @param dto 智能体信息
     * @return 创建的智能体
     */
    CustomAgentVO createAgent(CustomAgentDTO dto);

    /**
     * 获取智能体详情
     *
     * @param id 智能体ID
     * @return 智能体详情
     */
    CustomAgentVO getAgentById(String id);

    /**
     * 获取智能体列表
     *
     * @param creator 创建者过滤条件（mine/others）
     * @return 智能体列表
     */
    Map<String, Object> listAgents(String creator);

    /**
     * 更新智能体
     *
     * @param dto 智能体信息
     * @return 更新后的智能体
     */
    CustomAgentVO updateAgent(CustomAgentDTO dto);

    /**
     * 删除智能体
     *
     * @param id 智能体ID
     */
    void deleteAgent(String id);

    /**
     * 复制智能体
     *
     * @param id 智能体ID
     * @return 复制后的智能体
     */
    CustomAgentVO copyAgent(String id);

    /**
     * 获取占位符定义
     *
     * @return 占位符定义（按字段类型分组）
     */
    Map<String, Object> getPlaceholders();

    /**
     * 获取智能体类型预设列表
     *
     * @return 预设列表
     */
    List<Map<String, Object>> getAgentTypePresets();

    /**
     * 获取推荐问题
     *
     * @param id 智能体ID
     * @param knowledgeBaseIds 知识库ID列表
     * @param knowledgeIds 知识ID列表
     * @param tagScopes 标签范围
     * @param limit 返回数量上限
     * @return 包含推荐问题列表的Map，格式为 {questions: [...]}
     */
    Map<String, Object> getSuggestedQuestions(
            String id,
            List<String> knowledgeBaseIds,
            List<String> knowledgeIds,
            String tagScopes,
            Integer limit
    );
}
