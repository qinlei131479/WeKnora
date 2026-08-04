package com.iptv.auth.vo;

import com.iptv.auth.enums.QrCodeStatusEnum;
import lombok.Data;

@Data
public class QrCodeResultVO {

    /**
     * <p>二维码状态码</p>
     * 200（各方面正常，未扫码也是），500（其他错误） 410（二维码失效，需要刷新）
     * <p>见枚举 {@link com.iptv.auth.enums.QrCodeStatusEnum}</p>
     */
    private Integer code;

    /**
     * <p>用户 id，即开放平台返回的 userId</p>
     * <p>绑定时传参</p>
     */
    private String userId;

    /**
     * <p>我方平台的登录token</p>
     * <p>绑定不返回</p>
     */
    private String token;

    /**
     * <p>返回提示信息</p>
     */
    private String msg;

    public QrCodeResultVO() {
        this.code = QrCodeStatusEnum.SUCCESS.getStatus();
    }

    public void toSuccess() {
        this.code = QrCodeStatusEnum.SUCCESS.getStatus();
    }

    public void toError(String errorMsg) {
        this.code = QrCodeStatusEnum.ERROR.getStatus();
        this.msg = errorMsg;
    }

    public void toError(Integer status, String errorMsg) {
        this.code = status;
        this.msg = errorMsg;
    }

    public void toExpired() {
        this.code = QrCodeStatusEnum.EXPIRED.getStatus();
    }
}
