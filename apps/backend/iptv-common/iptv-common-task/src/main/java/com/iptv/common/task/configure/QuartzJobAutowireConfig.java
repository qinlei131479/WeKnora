package com.iptv.common.task.configure;

import org.quartz.spi.JobFactory;
import org.springframework.boot.autoconfigure.quartz.SchedulerFactoryBeanCustomizer;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.SpringBeanJobFactory;

/**
 * 让 Quartz 创建的 Job 支持 Spring 注入（@Autowired/@Resource）。
 */
@Configuration
public class QuartzJobAutowireConfig {

    @Bean
    public JobFactory jobFactory(ApplicationContext applicationContext) {
        AutowiringSpringBeanJobFactory jobFactory = new AutowiringSpringBeanJobFactory();
        jobFactory.setApplicationContext(applicationContext);
        return jobFactory;
    }

    @Bean
    public SchedulerFactoryBeanCustomizer schedulerFactoryBeanCustomizer(JobFactory jobFactory) {
        return schedulerFactoryBean -> schedulerFactoryBean.setJobFactory(jobFactory);
    }

    static class AutowiringSpringBeanJobFactory extends SpringBeanJobFactory {

        @Override
        public void setApplicationContext(ApplicationContext applicationContext) {
            // 必须调用 super，否则 SpringBeanJobFactory.applicationContext 为 null，
            // createJobInstance 会退化为反射无参构造，导致 NoSuchMethodException
            super.setApplicationContext(applicationContext);
        }
    }
}

