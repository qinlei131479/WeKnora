package com.iptv.common.security.utils;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.alibaba.fastjson2.JSONArray;
import com.iptv.common.core.constant.CacheConstants;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.core.utils.SpringUtils;
import com.iptv.common.redis.service.RedisService;
import com.iptv.system.api.domain.SysDictData;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.function.Consumer;

/**
 * 字典工具类
 *
 * @author ruoyi
 */
public class DictUtils {

    private static final List<Locale> LANGUAGE_LISTS = List.of(Locale.SIMPLIFIED_CHINESE, Locale.US);

    /**
     * 组装字典标签 i18n key：{@code dict.{dictType}.{dictValue}}
     *
     * @param dictType  字典类型
     * @param dictValue 字典键值
     * @return i18n key；类型或键值为空时返回 null
     */
    public static String toLabelKey(String dictType, Object dictValue) {
        if (StrUtil.isBlank(dictType) || ObjectUtil.isNull(dictValue)) {
            return null;
        }
        String value = StrUtil.trim(String.valueOf(dictValue));
        if (StrUtil.isBlank(value)) {
            return null;
        }
        return "dict." + dictType + "." + value;
    }

    /**
     * 按字典类型 + 键值解析当前语言标签文案。
     *
     * @param dictType  字典类型
     * @param dictValue 字典键值
     * @return 本地化文案；无法组装 key 时返回键值字符串或空串
     */
    public static String getLabel(String dictType, Object dictValue) {
        List<SysDictData> dictDatas = getDictCache(dictType);
        if (CollUtil.isEmpty(dictDatas)) {
            String labelKey = toLabelKey(dictType, dictValue);
            if (StrUtil.isBlank(labelKey)) {
                return ObjectUtil.isNull(dictValue) ? "" : String.valueOf(dictValue);
            }
            return MessageUtils.message(labelKey);
        }
        SysDictData dictData = dictDatas
                .stream()
                .filter(d -> StrUtil.equals(d.getDictValue(), String.valueOf(dictValue)))
                .findAny()
                .orElse(null);
        return ObjectUtil.isNull(dictData) ? "" : dictData.getDictLabel();
    }

    /**
     * 将字典键值翻译为当前语言文案后交给 {@code labelSetter} 回写。
     * <pre>
     * // 单对象
     * DictConstant.fillLabel(DictConstant.XXX, vo.getScene(), vo::setSceneName);
     * // 列表
     * list.forEach(vo -> DictConstant.fillLabel(DictConstant.XXX, vo.getScene(), vo::setSceneName));
     * </pre>
     *
     * @param dictType    字典类型（建议使用本类常量）
     * @param dictValue   字典键值
     * @param labelSetter 回显文案写入，如 {@code vo::setSceneName}
     */
    public static void fillLabel(String dictType, Object dictValue, Consumer<String> labelSetter) {
        if (ObjectUtil.isNull(labelSetter)) {
            return;
        }
        labelSetter.accept(getLabel(dictType, dictValue));
    }

    /**
     * 设置字典缓存
     *
     * @param key       参数键
     * @param dictDatas 字典数据列表
     */
    public static void setDictCache(String key, List<SysDictData> dictDatas) {
        LANGUAGE_LISTS.forEach(locale -> {
            List<SysDictData> copy = JSONUtil.toList(JSONUtil.toJsonStr(dictDatas), SysDictData.class);
            copy.forEach(dictData -> {
                dictData.setDictLabel(MessageUtils.message(locale,dictData.getDictLabel()));
            });
            SpringUtils.getBean(RedisService.class).setCacheObject(getCacheKey(key,locale), copy);
        });
    }

    /**
     * 获取字典缓存
     *
     * @param key 参数键
     * @return dictDatas 字典数据列表
     */
    public static List<SysDictData> getDictCache(String key) {
        JSONArray arrayCache = SpringUtils.getBean(RedisService.class)
                .getCacheObject(getCacheKey(key,MessageUtils.currentLocale()));
        if (ObjectUtil.isNotEmpty(arrayCache)) {
            return arrayCache.toList(SysDictData.class);
        }
        return null;
    }

    /**
     * 删除指定字典缓存
     *
     * @param key 字典键
     */
    public static void removeDictCache(String key) {
        LANGUAGE_LISTS.forEach(locale -> {
            SpringUtils.getBean(RedisService.class).deleteObject(getCacheKey(key,locale));
        });
    }

    /**
     * 清空字典缓存
     */
    public static void clearDictCache() {
        Collection<String> keys = SpringUtils.getBean(RedisService.class)
                .keys(CacheConstants.SYS_DICT_KEY + "*");
        SpringUtils.getBean(RedisService.class).deleteObject(keys);
    }

    /**
     * 设置cache key
     *
     * @param configKey 参数键
     * @return 缓存键key
     */
    public static String getCacheKey(String configKey,Locale locale) {
        if(ObjectUtil.isNull(locale)){
            locale = MessageUtils.currentLocale();
        }
        return CacheConstants.SYS_DICT_KEY + locale.getLanguage() + ":" + configKey;
    }
}
