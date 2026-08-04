package com.iptv.auth.constant;

/**
 * 开放平台扫码登录相关常量（对接合作方网关）
 */
public class ScgcConstant {

    /**
     * 获取登录二维码 接口
     */
    final static public String QR_CODE_API_URL = "https://gw.scgchc.com/open/v1/qrCode/generate/aigc";

    /**
     * 获取二维码状态 接口
     */
    final static public String QR_CODE_STATUS_API_URL = "https://gw.scgchc.com/open/v1/qrCode/check/aigc";

    /**
     * 获取用户信息 接口
     */
    final static public String USER_INFO_API_URL = "https://gw.scgchc.com/open/v1/users/current";

    /**
     * 平台类型参数 应用类型(3:AI审核平台)
     */
    final static public Integer APPLICATION_TYPE = 3;
}
