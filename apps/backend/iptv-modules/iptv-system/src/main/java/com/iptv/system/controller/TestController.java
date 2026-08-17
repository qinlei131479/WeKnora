package com.iptv.system.controller;

import com.iptv.common.core.domain.R;
import com.iptv.common.core.utils.MessageUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class TestController {
    @Autowired
    private MessageSource messageSource;

    @GetMapping("/i18n")
    public R<String> testI18n() {
        // 打印出当前 MessageSource 的真实类名
        System.out.println("当前 MessageSource 类型: " + messageSource.getClass().getName());

        String msg = MessageUtils.message("common.success");
        return R.ok(msg);
    }
}
