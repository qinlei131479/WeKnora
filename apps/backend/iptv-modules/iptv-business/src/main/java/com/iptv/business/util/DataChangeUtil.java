package com.iptv.business.util;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import lombok.Data;
import org.springframework.lang.Nullable;

import java.util.*;
import java.util.stream.Collectors;

/**
 *
 * 获取变更的数据
 *
 * @author GongJie
 * @date 2024/12/19
 */
public class DataChangeUtil {

    @Data
    public static class UpdateInfo<T> {

        /**
         * 新增的数据
         */
        private Set<T> insertData;

        /**
         * 删除的数据
         */
        private Set<T> deleteData;

        /**
         * 未变化的数据
         */
        private Set<T> updateData;

        public static <T> UpdateInfo<T> newUpdateInfo(int initialCapacity) {
            UpdateInfo<T> info = new UpdateInfo<>();
            info.setInsertData(new LinkedHashSet<>(initialCapacity));
            info.setDeleteData(new LinkedHashSet<>(initialCapacity));
            info.setUpdateData(new LinkedHashSet<>(initialCapacity));

            return info;
        }
    }

    /**
     * 获取数据变更信息
     *
     * @param newColl 最新数据
     * @param oldColl 原有数据
     * @param <T>
     * @return 数据变更信息
     */
    public static <T> UpdateInfo<T> getUpdateInfo(@Nullable Collection<T> newColl, @Nullable Collection<T> oldColl) {

        //需要保存的数据
        Set<T> newData = (newColl == null) ? Collections.emptySet() : new LinkedHashSet<>(newColl);
        //数据库已有的数据
        Set<T> oldData = (oldColl == null) ? Collections.emptySet() : new LinkedHashSet<>(oldColl);

        UpdateInfo<T> result = UpdateInfo.newUpdateInfo(Math.max(newData.size(), oldData.size()));
        for (T t : newData) {
            if (!oldData.contains(t)) {
                //不存在，待插入
                result.getInsertData().add(t);
            } else {
                //存在，未变化
                result.getUpdateData().add(t);
            }
        }

        for (T t : oldData) {
            if (!newData.contains(t)) {
                //待删除，数据库中存在，保存参数中不存在
                result.getDeleteData().add(t);
            }
        }

        return result;
    }

    /**
     * 获取数据变更信息
     *
     * @param newColl 最新数据
     * @param oldColl 原有数据
     * @param <T>
     * @return 数据变更信息
     */
    public static <T> UpdateInfo<T> getUpdateInfoMap(@Nullable List<Map<Long, String>> newColl, @Nullable List<Map<Long, Integer>> oldColl) {
        // 转换newColl 将map所有的value 判断为空 的 为2 不为空 1
        List<Map<Long, Integer>> newCollMap = newColl.stream().map(newMap -> {
            Map<Long, Integer> newMapMap = new HashMap<>();
            newMap.forEach((key, value) -> {
                if (value == null || StrUtil.isEmptyIfStr(value) || "1".equalsIgnoreCase(value)) {
                    newMapMap.put(key, 1);
                } else {
                    newMapMap.put(key, Integer.valueOf(value));
                }
            });
            return newMapMap;
        }).collect(Collectors.toList());
        UpdateInfo<T> result = UpdateInfo.newUpdateInfo(Math.max(newColl.size(), oldColl.size()));

        for (Map<Long, Integer> newMap : newCollMap) {
            for (Long key : newMap.keySet()) {
                Map<Long, Integer> kyeOldMap = oldColl.stream().filter(tempOldMap -> tempOldMap.containsKey(key))
                        .findFirst().orElse(null);
                if (kyeOldMap != null) {
                    if (Objects.equals(newMap.get(key), kyeOldMap.get(key))) {
                        // 存在，待插入
                        Map<Long, Integer> updateMap = new HashMap<>();
                        updateMap.put(key, newMap.get(key));
                        result.getUpdateData().add((T) updateMap);
                    } else {
                        // 不存在
                        Map<Long, Integer> insertMap = new HashMap<>();
                        insertMap.put(key, newMap.get(key));
                        result.getInsertData().add((T) insertMap);
                    }
                } else {
                    //不存在，未变化
                    Map<Long, Integer> insertMap = new HashMap<>();
                    insertMap.put(key, newMap.get(key));
                    result.getInsertData().add((T) insertMap);
                }
            }
        }

        for (Map<Long, Integer> oldMap : oldColl) {
            for (Long key : oldMap.keySet()) {
                for (Map<Long, Integer> newMap : newCollMap) {
                    Integer i = newMap.get(key);
                    if (i != null) {
                        if (!Objects.equals(i, oldMap.get(key))) {
                            Map<Long, Integer> deleteMap = new HashMap<>();
                            deleteMap.put(key, oldMap.get(key));
                            result.getDeleteData().add((T) deleteMap);
                        }
                    }
                    else {
                        Map<Long, Integer> deleteMap = new HashMap<>();
                        deleteMap.put(key, oldMap.get(key));
                        result.getDeleteData().add((T) deleteMap);
                    }
                }
            }
        }
        return result;
    }


    public static void main1(String[] args) {
        UpdateInfo<Integer> updateInfo = getUpdateInfo(
                CollUtil.newArrayList(1, 2, 3),
                CollUtil.newArrayList(2, 3, 4)
        );

        System.out.println(updateInfo.getInsertData());
        System.out.println(updateInfo.getDeleteData());
        System.out.println(updateInfo.getUpdateData());

    }

    public static void main(String[] args) {
        HashMap<Long, String> map = new HashMap<>();
        map.put(1L, "0");
        map.put(2L, "1");
        HashMap<Long, Integer> map2 = new HashMap<>();
        map2.put(1L, 1);
        List<Map<Long, Integer>> list2 = new ArrayList<>();
        list2.add(map2);
        List<Map<Long, String>> list = new ArrayList<>();
        list.add( map);


        UpdateInfo updateInfo = getUpdateInfoMap(
                list, list2
        );

        System.out.println(updateInfo.getInsertData());
        System.out.println(updateInfo.getDeleteData());
        System.out.println(updateInfo.getUpdateData());

    }

}
