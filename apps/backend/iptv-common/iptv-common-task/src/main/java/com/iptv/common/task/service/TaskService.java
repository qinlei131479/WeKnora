package com.iptv.common.task.service;

import cn.hutool.core.util.ObjectUtil;
import org.quartz.*;
import org.quartz.impl.triggers.CronTriggerImpl;
import org.quartz.spi.OperableTrigger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

/**
 * 拨测任务调度
 */
@Service
public class TaskService {

    @Autowired
    private Scheduler scheduler;

    /**
     * 创建单次任务
     *
     * @param object      任务数据
     * @param clazz       任务类
     * @param jobName     任务名称
     * @param triggerName 触发器名称
     * @param startTime   任务开始时间
     */
    public void createOnceTask(Object object, Class<? extends Job> clazz, String jobName, String triggerName, Date startTime) throws SchedulerException {
        JobDataMap jobDataMap = new JobDataMap();
        jobDataMap.put("data", object);

        JobDetail jobDetail = JobBuilder.newJob(clazz)
                .withIdentity(jobName)
                .usingJobData(jobDataMap) // 如果需要传递参数，这里可以添加
                .storeDurably() // 任务持久化存储
                .build();

        SimpleScheduleBuilder simpleScheduleBuilder = SimpleScheduleBuilder
                .simpleSchedule()
                .withRepeatCount(0);

        SimpleTrigger trigger = TriggerBuilder.newTrigger()
                .withIdentity(triggerName)
                .startAt(startTime)
                .withSchedule(simpleScheduleBuilder)
                .build();

        scheduler.scheduleJob(jobDetail, trigger);
    }

    /**
     * 创建循环任务
     *
     * @param object         任务数据
     * @param clazz          任务类
     * @param jobName        任务名称
     * @param triggerName    触发器名称
     * @param startTime      任务开始时间
     * @param intervalMillis 间隔毫秒数
     */
    public void createPeriodicTask(Object object, Class<? extends Job> clazz,
                                   String jobName, String triggerName, Date startTime, Date endTime, long intervalMillis) throws SchedulerException {

        JobDataMap jobDataMap = new JobDataMap();
        jobDataMap.put("data", object);

        JobDetail jobDetail = JobBuilder.newJob(clazz)
                .withIdentity(jobName)
                .usingJobData(jobDataMap) // 如果需要传递参数，这里可以添加
                .storeDurably() // 任务持久化存储
                .build();

        SimpleScheduleBuilder simpleScheduleBuilder =
                SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInMilliseconds(intervalMillis)
                        .repeatForever();

        TriggerBuilder<SimpleTrigger> simpleTriggerTriggerBuilder = TriggerBuilder.newTrigger()
                .withIdentity(triggerName)
                .startAt(startTime)
                .withSchedule(simpleScheduleBuilder);
        if(ObjectUtil.isNotNull(endTime)){
            simpleTriggerTriggerBuilder.endAt(endTime);
        }

        SimpleTrigger trigger = simpleTriggerTriggerBuilder.build();
        scheduler.scheduleJob(jobDetail, trigger);
    }

    public void createCronTask(Object object, Class<? extends Job> clazz,
                               String jobName, String triggerName, Date startTime, Date endTime, String cronExpression) throws SchedulerException {

        JobDataMap jobDataMap = new JobDataMap();
        jobDataMap.put("data", object);

        JobDetail jobDetail = JobBuilder.newJob(clazz)
                .withIdentity(jobName)
                .usingJobData(jobDataMap) // 如果需要传递参数，这里可以添加
                .storeDurably() // 任务持久化存储
                .build();

        CronTrigger trigger = TriggerBuilder.newTrigger()
                .withIdentity(triggerName)
                .startAt(startTime)
                .endAt(endTime)
                .withSchedule(CronScheduleBuilder.cronSchedule(cronExpression))
                .build();
        scheduler.scheduleJob(jobDetail, trigger);
    }

    /**
     * 删除任务（同时会删除关联的触发器）
     */
    public boolean deleteSchedule(String jobName) throws SchedulerException {
        JobKey jobKey = JobKey.jobKey(jobName);
        return scheduler.deleteJob(jobKey);
    }

    public List<Date> getFireTimes(String triggerName, Date startTime, Date endTime) throws SchedulerException {
        TriggerKey triggerKey = TriggerKey.triggerKey(triggerName);
        Trigger trigger = scheduler.getTrigger(triggerKey);
        if (ObjectUtil.isNotNull(trigger)) {
            OperableTrigger operableTrigger = (OperableTrigger) trigger;
            return TriggerUtils.computeFireTimesBetween(operableTrigger, null, startTime, endTime);
        }
        return null;
    }
}