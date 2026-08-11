package com.iptv.business;

import com.iptv.common.mybatisplus.config.MybatisPlusConfig;
import com.iptv.common.security.annotation.EnableCustomConfig;
import com.iptv.common.security.annotation.EnableRyFeignClients;
import lombok.Getter;
import org.dromara.easyes.spring.annotation.EsMapperScan;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@EnableCustomConfig
@EnableRyFeignClients
@SpringBootApplication
@Import(MybatisPlusConfig.class)
@EnableScheduling
@MapperScan(basePackages = "com.iptv.business.pgmapper",
        sqlSessionFactoryRef = "postgresSqlSessionFactory")
public class IptvBusinessApplication {

    @Getter
    private static final ScheduledExecutorService POOL;

    static {
        int cpuCores = Runtime.getRuntime().availableProcessors();
        POOL = Executors.newScheduledThreadPool(cpuCores);
    }

    public static void main(String[] args) {
        SpringApplication.run(IptvBusinessApplication.class, args);
        System.out.println("(♥◠‿◠)ﾉﾞ  业务模块启动成功   ლ(´ڡ`ლ)ﾞ  \n" +
                " .-------.       ____     __        \n" +
                " |  _ _   \\      \\   \\   /  /    \n" +
                " | ( ' )  |       \\  _. /  '       \n" +
                " |(_ o _) /        _( )_ .'         \n" +
                " | (_,_).' __  ___(_ o _)'          \n" +
                " |  |\\ \\  |  ||   |(_,_)'         \n" +
                " |  | \\ `'   /|   `-'  /           \n" +
                " |  |  \\    /  \\      /           \n" +
                " ''-'   `'-'    `-..-'              ");
    }
}
