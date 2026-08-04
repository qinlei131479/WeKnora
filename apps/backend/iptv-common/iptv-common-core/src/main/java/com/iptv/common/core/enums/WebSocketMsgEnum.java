package com.iptv.common.core.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

/**
 * 消息常量
 *
 * @author GongJie
 * @date 2022/10/31
 */
public class WebSocketMsgEnum {

    /**
     * 消息类型
     */
    @AllArgsConstructor
    @Getter
    public enum Type {

        /**
         * 同一账户只能一个浏览器登录
         */
        LOGOUT("logout", "退出登录"),

        REQUEST_TREND_EXPORT("request_trend_export", "数据调用趋势数据导出"),
        MULTIMODAL_AUDIT_LIST_EXPORT("multimodal_audit_list_export", "多模态列表数据导出"),

        MULTIMODAL_AUDIT_SUBMIT_SUCCESS("multimodal_audit_submit_success", "多模态审核发起成功"),

        TOPIC_AUDIT_EXPERIENCE_TASK_MSG("topic_audit_experience_task_msg", "审核体验任务消息");;

        private final String code;
        private final String name;
    }

    @Getter
    @AllArgsConstructor
    public enum Msg {
        // 注销
        // 账号因长时间未操作的逻辑在前端处理
        // LOGOUT_TIMEOUT("logout_timeout", "账号因长时间未操作，已自动退出\n请重新登录"),
        LOGOUT_DISABLE("logout_disable", "账号已被停用，系统自动退出\n如有疑河请联系系统管理员"),
        LOGOUT_UPDATE_TENANT("logout_update_tenant", "该账户所属租户发生更改，请重新登录"),
        LOGOUT_UPDATE_PWD("logout_update_pwd", "密码修改成功，请使用新密码登录"),
        LOGOUT_RESET_PWD("logout_reset_pwd", "该账户密码被重置，请重新登录"),
        LOGOUT_DELETE("logout_delete", "账号信息错误，请联系系统管理员"),
        LOGOUT_OTHER_LOGIN("logout_other_login", "该账号已在其他设备登录，当前设备已下线"),
        ;

        private final String code;
        private final String msg;

        public Map<String, Object> toRes() {
            HashMap<String, Object> map = new HashMap<>(2);
            map.put("code", code);
            map.put("msg", msg);
            return map;
        }
    }

}
