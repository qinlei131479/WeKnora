package com.iptv.business.util;

import cn.hutool.core.date.DateUtil;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.Date;

public class TaskUtil {
    public static boolean isWeekTaskExec(Date startDate, Integer repeatPeriod) {
        // 1. 将两个日期都对齐到它们所在周的“周一”
        LocalDate start = startDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate now = DateUtil.date().toInstant().atZone(ZoneId.systemDefault()).toLocalDate()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        long daysDiff = ChronoUnit.DAYS.between(start, now);
        // 3. 检查是否是第N周
        if (daysDiff % repeatPeriod == 0) {
            // 是第N周，执行任务
            return true;
        }
        return false;
    }
}
