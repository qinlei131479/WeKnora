package com.iptv.business.service.impl;

import com.iptv.business.domain.vo.*;
import com.iptv.business.pgmapper.DashboardMapper;
import com.iptv.business.service.DashboardService;
import com.iptv.common.core.exception.ServiceException;
import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.IsoFields;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;

/**
 * <p>
 * 总览看板服务实现
 * </p>
 *
 * @author kjsc
 * @since 2026-09-01
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    @Resource
    private DashboardMapper mapper;


    @Override
    public DashboardStatsVO queryStats() {
        DashboardStatsVO vo = new DashboardStatsVO();

        vo.setWeknoraSessions(mapper.recordCountWeknoraSessions()); // 对话式会话数
        vo.setYuxiConversations(mapper.recordCountYuxiConversations()); // 生成式会话数
        vo.setTotalConversations(vo.getWeknoraSessions() + vo.getYuxiConversations()); // 总对话数
        vo.setActiveConversations(mapper.recordCountActiveConversations()); // 活跃对话数
        vo.setWeknoraMessages(mapper.recordCountWeknoraMessages()); // 对话式会话消息数
        vo.setYuxiMessages(mapper.recordCountYuxiMessages()); // 生成式会话消息数
        vo.setTotalMessages(vo.getWeknoraMessages() + vo.getYuxiMessages()); // 总消息数
        vo.setTotalUsers(mapper.recordCountTotalUsers()); // 总用户数
        vo.setSplitBySystem(Boolean.TRUE); // 是否按系统分类

        Long totalFeedbacks = mapper.recordCountFeedbacks(null); // 总反馈数
        Long likeFeedbacks = mapper.recordCountFeedbacks("like"); // 点赞反馈数
        BigDecimal satisfactionRate = null;
        if (totalFeedbacks > 0L) {
            satisfactionRate = BigDecimal.valueOf(likeFeedbacks)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalFeedbacks), 2, RoundingMode.HALF_UP)
                    .stripTrailingZeros();

            if (satisfactionRate.scale() < 0) {
                satisfactionRate = satisfactionRate.setScale(0, RoundingMode.HALF_UP);
            }
        }
        vo.setFeedbackStats(new DashboardStatsVO.FeedbackStats(totalFeedbacks, satisfactionRate)); // 反馈统计

        return vo;
    }

    @Override
    public DashboardTimeSeriesStatsVO queryCallsTimeseries(String type, String timeRange) {
        if (!"models".equals(type) && !"agents".equals(type)
                && !"tokens".equals(type) && !"tools".equals(type)) {
            throw new ServiceException("Invalid type: " + type, 422);
        }

        final int intervals = 14;
        ZonedDateTime baseTime = ZonedDateTime.now(ZoneId.of("Asia/Shanghai"));
        if ("14hours".equalsIgnoreCase(timeRange)) {
            baseTime = baseTime.minusHours(intervals - 1L);
        } else if ("14weeks".equalsIgnoreCase(timeRange)) {
            baseTime = baseTime.minusWeeks(intervals - 1L)
                    .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                    .truncatedTo(ChronoUnit.DAYS);
        } else {
            baseTime = baseTime.minusDays(intervals - 1L);
        }

        LocalDateTime startTime = baseTime.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        List<Map<String, Object>> rows = mapper.selectCallTimeseries(type, timeRange, startTime);

        Set<String> categories = new TreeSet<>();
        Map<String, Map<String, Long>> timeData = new HashMap<>();
        Map<String, Long> timeTotals = new HashMap<>();
        for (Map<String, Object> row : rows) {
            String date = Objects.toString(row.get("date"), "");
            long count = ((Number) row.get("count")).longValue();
            timeTotals.merge(date, count, Long::sum);

            Object categoryValue = row.get("category");
            if (categoryValue != null) {
                String category = categoryValue.toString();
                if (!category.isEmpty()) {
                    categories.add(category);
                    timeData.computeIfAbsent(date, key -> new HashMap<>()).merge(category, count, Long::sum);
                }
            }
        }
        if (categories.isEmpty()) {
            if ("tokens".equals(type)) {
                categories.add("input_tokens");
                categories.add("output_tokens");
            } else {
                categories.add(defaultCategory(type));
            }
        }

        List<DashboardTimeSeriesStatsVO.DataStats> data = new ArrayList<>(intervals);
        ZonedDateTime currentTime = baseTime;
        long seriesTotal = 0L;
        long peakCount = -1L;
        String peakDate = "";
        for (int i = 0; i < intervals; i++) {
            String date = formatTimeKey(currentTime, timeRange);
            Map<String, Long> counts = timeData.getOrDefault(date, Map.of());
            List<DashboardTimeSeriesStatsVO.CategoryCount> categoryCounts = new ArrayList<>(categories.size());
            long pointTotal = timeTotals.getOrDefault(date, 0L);
            for (String category : categories) {
                long count = counts.getOrDefault(category, 0L);
                categoryCounts.add(new DashboardTimeSeriesStatsVO.CategoryCount(category, count));
            }
            data.add(new DashboardTimeSeriesStatsVO.DataStats(pointTotal, date, categoryCounts));
            seriesTotal += pointTotal;
            if (pointTotal > peakCount) {
                peakCount = pointTotal;
                peakDate = date;
            }
            currentTime = incrementTime(currentTime, timeRange);
        }

        long totalCount = "tools".equals(type) ? mapper.recordCountToolCalls(null, null, null) : seriesTotal;
        double averageCount = BigDecimal.valueOf(totalCount)
                .divide(BigDecimal.valueOf(intervals), 2, RoundingMode.HALF_UP)
                .doubleValue();

        DashboardTimeSeriesStatsVO vo = new DashboardTimeSeriesStatsVO();
        vo.setData(data);
        vo.setCategories(new ArrayList<>(categories));
        vo.setTotalCount(totalCount);
        vo.setAverageCount(averageCount);
        vo.setPeakCount(peakCount);
        vo.setPeakDate(peakDate);
        if ("agents".equals(type)) {
            List<String> slugs = categories.stream()
                    .filter(category -> !"unknown_agent".equals(category))
                    .toList();
            List<DashboardTimeSeriesStatsVO.AgentName> agentNames = new ArrayList<>();
            if (!slugs.isEmpty()) {
                for (Map<String, Object> row : mapper.selectAgentNames(slugs)) {
                    agentNames.add(new DashboardTimeSeriesStatsVO.AgentName(
                            Objects.toString(row.get("agentId"), ""),
                            Objects.toString(row.get("name"), "")
                    ));
                }
            }
            vo.setAgentNames(agentNames);
        }
        return vo;
    }

    @Override
    public DashboardUserActiveStatsVO queryStatsUsers() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS);
        DashboardUserActiveStatsVO vo = new DashboardUserActiveStatsVO();
        // Python 此接口使用有效成员关系数，不复用顶部总览的 users 表计数。
        vo.setTotalUsers(mapper.recordCountWeknoraMembers());
        vo.setActiveUsers24h(mapper.recordCountWeknoraActiveUsers(now.minusDays(1), null));
        vo.setActiveUsers30d(mapper.recordCountWeknoraActiveUsers(now.minusDays(30), null));
        vo.setActiveUsers(mapper.selectWeknoraActiveUsers(now.minusDays(30), null));

        // 对齐 Python：每日明细单独取 UTC 当前时间，按滚动 24 小时窗口统计。
        OffsetDateTime dailyNow = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS);
        List<DashboardUserActiveStatsVO.DailyActiveUser> dailyActiveUsers = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            OffsetDateTime since = dailyNow.minusDays(i + 1L);
            OffsetDateTime until = dailyNow.minusDays(i);
            Long count = mapper.recordCountWeknoraActiveUsers(since, until);
            dailyActiveUsers.add(0, new DashboardUserActiveStatsVO.DailyActiveUser(
                    since.toLocalDate().toString(), count));
        }
        vo.setDailyActiveUsers(dailyActiveUsers);
        return vo;
    }

    @Override
    public DashboardToolCallStatsVO queryStatsTools() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS);
        long totalCalls = mapper.recordCountToolCalls(null, null, null);
        long successfulCalls = mapper.recordCountToolCalls("success", null, null);

        DashboardToolCallStatsVO vo = new DashboardToolCallStatsVO();
        vo.setTotalCalls(totalCalls);
        vo.setSuccessfulCalls(successfulCalls);
        // Python 将所有非 success 状态都计入失败数，包括 pending。
        vo.setFailedCalls(totalCalls - successfulCalls);
        vo.setSuccessRate(pythonPercentage(successfulCalls, totalCalls, 0));
        vo.setMostUsedTools(mapper.selectMostUsedTools());

        Map<String, Long> errors = new LinkedHashMap<>();
        for (Map<String, Object> row : mapper.selectToolErrorCounts()) {
            errors.put((String) row.get("toolName"), countValue(row, "errorCount"));
        }
        vo.setToolErrorDistribution(errors);

        List<DashboardToolCallStatsVO.DailyToolCall> dailyToolCalls = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            LocalDateTime since = now.minusDays(i + 1L);
            LocalDateTime until = now.minusDays(i);
            Long count = mapper.recordCountToolCalls(null, since, until);
            dailyToolCalls.add(0, new DashboardToolCallStatsVO.DailyToolCall(since.toLocalDate().toString(), count));
        }
        vo.setDailyToolCalls(dailyToolCalls);
        return vo;
    }

    @Override
    public DashboardKnowledgeStatsVO queryStatsKnowledge() {
        DashboardKnowledgeStatsVO vo = new DashboardKnowledgeStatsVO();
        vo.setTotalDatabases(mapper.recordCountKnowledgeBases());

        Map<String, Long> databasesByType = new LinkedHashMap<>();
        for (Map<String, Object> row : mapper.selectKnowledgeBaseTypeCounts()) {
            String label = knowledgeBaseTypeLabel((String) row.get("kbType"));
            databasesByType.merge(label, countValue(row, "count"), Long::sum);
        }

        long totalFiles = 0L;
        long totalStorageSize = 0L;
        Map<String, Long> fileTypeDistribution = new LinkedHashMap<>();
        for (Map<String, Object> row : mapper.selectKnowledgeFileTypeStats()) {
            long count = countValue(row, "count");
            totalFiles += count;
            totalStorageSize += countValue(row, "storageSize");
            String label = knowledgeFileTypeLabel((String) row.get("fileType"));
            fileTypeDistribution.merge(label, count, Long::sum);
        }

        vo.setTotalFiles(totalFiles);
        vo.setTotalStorageSize(totalStorageSize);
        vo.setTotalNodes(0L); // Python 固定返回 0，不查询 chunks。
        vo.setDatabasesByType(databasesByType);
        vo.setFileTypeDistribution(fileTypeDistribution);
        vo.setSplitBySystem(Boolean.TRUE);
        vo.setSource("weknora");

        vo.setActiveKnowledgeBases(mapper.selectActiveKnowledgeBases());
        return vo;
    }

    @Override
    public DashboardAgentAnalyticsVO queryStatsAgents() {
        List<DashboardAgentAnalyticsVO.AgentConversationCount> agents = mapper.selectYuxiAgentConversationCounts();
        Map<String, Map<String, Object>> feedbackCounts = new HashMap<>();
        Map<String, Long> toolCounts = new HashMap<>();
        if (!agents.isEmpty()) {
            for (Map<String, Object> row : mapper.selectYuxiAgentFeedbackCounts()) {
                feedbackCounts.put((String) row.get("agentId"), row);
            }
            for (DashboardAgentAnalyticsVO.AgentToolUsage usage : mapper.selectYuxiAgentToolUsage()) {
                toolCounts.put(usage.getAgentId(), usage.getToolUsageCount());
            }
        }

        List<DashboardAgentAnalyticsVO.AgentSatisfactionRate> satisfactionRates = new ArrayList<>(agents.size());
        List<DashboardAgentAnalyticsVO.AgentToolUsage> toolUsage = new ArrayList<>(agents.size());
        List<DashboardAgentAnalyticsVO.TopPerformingAgent> topAgents = new ArrayList<>(agents.size());
        for (DashboardAgentAnalyticsVO.AgentConversationCount agent : agents) {
            String agentId = agent.getAgentId();
            Map<String, Object> feedback = feedbackCounts.get(agentId);
            long totalFeedbacks = feedback == null ? 0L : countValue(feedback, "totalFeedbacks");
            long likes = feedback == null ? 0L : countValue(feedback, "likeFeedbacks");
            // 此接口按 Python 保留无反馈时 100 的规则，不沿用顶部总览的 null。
            BigDecimal rate = pythonPercentage(likes, totalFeedbacks, 100);
            satisfactionRates.add(new DashboardAgentAnalyticsVO.AgentSatisfactionRate(agentId, rate, totalFeedbacks));
            toolUsage.add(new DashboardAgentAnalyticsVO.AgentToolUsage(agentId, toolCounts.getOrDefault(agentId, 0L)));
            topAgents.add(new DashboardAgentAnalyticsVO.TopPerformingAgent(agentId, agent.getConversationCount(), rate));
        }
        topAgents.sort(Comparator.comparing(DashboardAgentAnalyticsVO.TopPerformingAgent::getConversationCount).reversed());

        Map<String, DashboardAgentAnalyticsVO.AgentName> agentNames = new LinkedHashMap<>();
        List<String> slugs = agents.stream().map(DashboardAgentAnalyticsVO.AgentConversationCount::getAgentId)
                .filter(slug -> slug != null && !slug.isEmpty()).toList();
        if (!slugs.isEmpty()) {
            for (DashboardAgentAnalyticsVO.AgentName agentName : mapper.selectAnalyticsAgentNames(slugs)) {
                // 保留原有按 slug 合并的规则，同 slug 由后读到的记录覆盖。
                agentNames.put(agentName.getId(), agentName);
            }
        }

        long weknoraTotalAgents = mapper.recordCountWeknoraAgents();
        Map<String, String> weknoraAgentNames = new LinkedHashMap<>();
        for (Map<String, Object> row : mapper.selectWeknoraAgentNames()) {
            String agentId = Objects.toString(row.get("agentId"));
            String name = (String) row.get("name");
            weknoraAgentNames.put(agentId, name == null || name.isEmpty() ? agentId : name);
        }

        DashboardAgentAnalyticsVO vo = new DashboardAgentAnalyticsVO();
        vo.setTotalAgents(agents.size() + weknoraTotalAgents);
        vo.setYuxiTotalAgents((long) agents.size());
        vo.setWeknoraTotalAgents(weknoraTotalAgents);
        vo.setAgentConversationCounts(agents);
        vo.setAgentSatisfactionRates(satisfactionRates);
        vo.setAgentToolUsage(toolUsage);
        vo.setTopPerformingAgents(new ArrayList<>(topAgents.subList(0, Math.min(5, topAgents.size()))));
        vo.setAgentNames(new ArrayList<>(agentNames.values()));
        vo.setWeknoraAgentConversationCounts(mapper.selectWeknoraAgentConversationCounts());
        vo.setWeknoraAgentNames(weknoraAgentNames);
        vo.setSplitBySystem(Boolean.TRUE);
        return vo;
    }

    @Override
    public List<DashboardConversationVO> queryStatsConversations() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS);
        return mapper.selectStatsConversations(now.minusDays(30L), null);
    }


    //----- private --------------------------------------------------------------------------------------

    /**
     * 获取无数据时的默认统计分类。
     */
    private String defaultCategory(String type) {
        if ("agents".equals(type)) {
            return "unknown_agent";
        }
        if ("tools".equals(type)) {
            return "unknown_tool";
        }
        return "unknown_model";
    }

    /**
     * 根据时间范围生成时间序列键。
     */
    private String formatTimeKey(ZonedDateTime time, String timeRange) {
        if ("14hours".equals(timeRange)) {
            return time.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:00"));
        }
        if ("14weeks".equals(timeRange)) {
            return String.format("%d-%02d", time.get(IsoFields.WEEK_BASED_YEAR),
                    time.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
        }
        return time.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }

    /**
     * 根据时间范围推进一个统计周期。
     */
    private ZonedDateTime incrementTime(ZonedDateTime time, String timeRange) {
        if ("14hours".equals(timeRange)) {
            return time.plusHours(1);
        }
        if ("14weeks".equals(timeRange)) {
            return time.plusWeeks(1);
        }
        return time.plusDays(1);
    }

    /**
     * 读取查询结果中的计数或汇总值。
     */
    private long countValue(Map<String, Object> row, String key) {
        Number value = (Number) row.get(key);
        return value instanceof BigDecimal decimal ? decimal.longValueExact() : value.longValue();
    }

    /**
     * 计算百分比，总数为零时使用指定默认值。
     */
    private BigDecimal pythonPercentage(long part, long total, long emptyValue) {
        if (total == 0L) {
            return BigDecimal.valueOf(emptyValue);
        }
        // 保留 Python 先以 double 求百分比、再 round(value, 2) 的舍入语义。
        BigDecimal rate = new BigDecimal((double) part / total * 100)
                .setScale(2, RoundingMode.HALF_UP).stripTrailingZeros();
        return rate.scale() < 0 ? rate.setScale(0, RoundingMode.HALF_UP) : rate;
    }

    /**
     * 将知识库类型转换为展示名称。
     */
    private String knowledgeBaseTypeLabel(String type) {
        String normalized = type == null ? "" : type.strip().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "", "document" -> "文档库";
            case "faq" -> "FAQ";
            case "wiki" -> "Wiki";
            default -> type;
        };
    }

    /**
     * 将文件扩展名转换为文件类型展示名称。
     */
    private String knowledgeFileTypeLabel(String type) {
        String ext = type == null ? "" : type.strip().toLowerCase(Locale.ROOT).replaceFirst("^\\.+", "");
        return switch (ext) {
            case "" -> "其他";
            case "txt" -> "文本文件";
            case "pdf" -> "PDF文档";
            case "docx", "doc" -> "Word文档";
            case "md" -> "Markdown";
            case "html", "htm" -> "HTML网页";
            case "json" -> "JSON数据";
            case "csv" -> "CSV表格";
            case "xlsx", "xls" -> "Excel表格";
            case "pptx", "ppt" -> "PowerPoint";
            case "png" -> "PNG图片";
            case "jpg", "jpeg" -> "JPEG图片";
            case "gif" -> "GIF图片";
            case "svg" -> "SVG图片";
            case "mp4" -> "MP4视频";
            case "mp3" -> "MP3音频";
            case "zip" -> "ZIP压缩包";
            case "rar" -> "RAR压缩包";
            case "7z" -> "7Z压缩包";
            default -> ext.toUpperCase(Locale.ROOT) + "文件";
        };
    }
}
