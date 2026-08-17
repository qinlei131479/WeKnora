package com.iptv.business.service;

import com.iptv.business.domain.vo.SkillVO;

import java.util.List;

/**
 * 技能服务接口
 *
 * @author kjsc
 * @since 2026-08-13
 */
public interface SkillService {

    /**
     * 获取预装技能列表
     *
     * @return 技能列表
     */
    List<SkillVO> listPreloadedSkills();

    /**
     * 获取沙箱模式状态
     *
     * @return 是否启用沙箱模式
     */
    Boolean isSandboxMode();
}
