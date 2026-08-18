package com.iptv.business.pgmapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.iptv.business.domain.CustomAgent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 智能体 Mapper 接口
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Mapper
public interface CustomAgentMapper extends BaseMapper<CustomAgent> {

    /**
     * 查询所有未删除的智能体
     *
     * @return 智能体列表
     */
    List<CustomAgent> listAll();

    /**
     * 根据ID和租户ID查询智能体
     *
     * @param id 智能体ID
     * @return 智能体
     */
    CustomAgent selectByIdAndTenantId(@Param("id") String id);

    /**
     * 查询内置智能体列表
     *
     * @return 内置智能体列表
     */
    List<CustomAgent> selectBuiltinAgents();

    /**
     * 批量查询用户信息
     *
     * @param userIds 用户ID列表
     * @return 用户信息列表
     */
    List<UserInfo> selectUsersByIds(@Param("userIds") List<String> userIds);

    /**
     * 查询租户禁用的智能体ID列表
     *
     * @param tenantId 租户ID
     * @return 禁用的智能体ID列表
     */
    List<String> selectDisabledOwnAgentIds(@Param("tenantId") Integer tenantId);

    /**
     * 用户信息内部类
     */
    class UserInfo {
        private String userId;
        private String userName;
        private String displayName;

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getUserName() {
            return userName;
        }

        public void setUserName(String userName) {
            this.userName = userName;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }
    }
}
