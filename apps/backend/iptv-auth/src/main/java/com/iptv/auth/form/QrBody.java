package com.iptv.auth.form;

import lombok.Data;

@Data
public class QrBody {

    private String key;

    /**
     * 二维码 base64
     * data:image/png;base64,iVBOR
     */
    private String qrCode;
}
