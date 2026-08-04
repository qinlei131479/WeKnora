package com.iptv.common.redis.constant;

/**
 * <p>
 * </p>
 *
 * @author tanjx
 * @since 2026/04/21
 */
public class RedisConstant {
    public static final long USER_TIMEOUT = 300L;
    public static final long CRAWLER_RECOMMEND_TIMEOUT = 300L;
    public static final long PERSONALIZATION_RECOMMEND_TIMEOUT = 300L;
    public static final String HIGH_VALUE_USER = "recommend:high_value_user:";
    public static final String VIEW_RECORD = "recommend:view_record:";
    public static final String CRAWLER_RECOMMEND = "recommend:crawler_recommend:";
    public static final String PERSONALIZATION_RECOMMEND = "recommend:personalization_recommend:";
    public static final String HOT_VOD = "recommend:hot_vod:";
    public static final String PERSONALIZED = "recommend:personalized:";
    public static final String VIEWING_HISTORY = "recommend:viewing_history:";
    public static final String SPECIAL_FEATURE = "recommend:special_feature:";


    public static final long SPECIAL_NAME_TIMEOUT = 300L;
    public static final String SPECIAL_NAME = "recommend:special_name:";

    /**
     * 搜索记录key
     */
    public static final String SEARCH_HISTORY_KEY = "search_history_key";

    /**
     * 文件tokens数key
     */
    public static final String FILE_TOKEN_KEY = "rag_knowledge_file_token_key_";

}
