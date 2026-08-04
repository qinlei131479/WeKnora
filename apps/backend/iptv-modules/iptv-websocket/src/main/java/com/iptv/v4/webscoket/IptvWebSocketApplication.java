package com.iptv.v4.webscoket;

import com.iptv.common.security.annotation.EnableCustomConfig;
import com.iptv.common.security.annotation.EnableRyFeignClients;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@EnableCustomConfig
@EnableRyFeignClients
@SpringBootApplication(exclude = {
        DataSourceAutoConfiguration.class,
        DataSourceTransactionManagerAutoConfiguration.class
})
public class IptvWebSocketApplication {
    public static void main(String[] args) {
        SpringApplication.run(IptvWebSocketApplication.class, args);
        System.out.println("(♥◠‿◠)ﾉﾞ  WS模块启动成功   ლ(´ڡ`ლ)ﾞ  \n");
    }
}
