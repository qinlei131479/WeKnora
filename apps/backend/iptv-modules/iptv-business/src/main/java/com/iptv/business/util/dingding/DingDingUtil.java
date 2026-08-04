package com.iptv.business.util.dingding;

import cn.hutool.json.JSONUtil;
import com.dingtalk.api.DefaultDingTalkClient;
import com.dingtalk.api.DingTalkClient;
import com.dingtalk.api.request.OapiGettokenRequest;
import com.dingtalk.api.request.OapiV2DepartmentListsubRequest;
import com.dingtalk.api.request.OapiV2UserListRequest;
import com.dingtalk.api.response.OapiGettokenResponse;
import com.dingtalk.api.response.OapiV2DepartmentListsubResponse;
import com.dingtalk.api.response.OapiV2UserListResponse;
import com.iptv.business.config.DingDingConfig;
import com.taobao.api.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * @Description: 钉钉接口工具类
 * @Author qinlei
 * @Date 2025/9/1 15:40
 * @Version 1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DingDingUtil {

    private final DingDingConfig dingDingConfig;

    /**
     * 获取企业accessToken
     */
    private final static String ACCESS_TOKEN_URL = "https://oapi.dingtalk.com/gettoken";
    /**
     * 获取部门列表
     */
    private final static String DEPT_LIST_URL = "https://oapi.dingtalk.com/topapi/v2/department/listsub";
    /**
     * 获取部门下用户列表
     */
    private final static String USER_LIST_URL = "https://oapi.dingtalk.com/topapi/v2/user/list";

    /**
     * 获取企业accessToken
     * <p>
     * accessToken的有效期为7200秒（2小时），有效期内重复获取会返回相同结果并自动续期，过期后获取会返回新的accessToken。
     * 开发者需要缓存accessToken，用于后续接口的调用。因为每个应用的accessToken是彼此独立的，所以进行缓存时需要区分应用来进行存储。
     * 不能频繁调用getAccessToken接口，否则会受到频率拦截。
     *
     * @return
     */
    public String getAccessToken() {
        DingTalkClient client = new DefaultDingTalkClient(ACCESS_TOKEN_URL);
        OapiGettokenRequest req = new OapiGettokenRequest();
        req.setAppkey(dingDingConfig.getAppKey());
        req.setAppsecret(dingDingConfig.getAppSecret());
        req.setHttpMethod("GET");
        OapiGettokenResponse rsp = null;
        try {
            rsp = client.execute(req);
            return rsp.getAccessToken();
        } catch (ApiException e) {
            log.error("获取accessToken失败", e);
        }
        return null;
    }

    /**
     * 获取部门列表,默认获取顶级部门，其他部门需要传部门id，并且需要开通查询权限，具体的可以查看钉钉文档
     *
     * @param deptId
     * @return
     */
    public List<OapiV2DepartmentListsubResponse.DeptBaseResponse> queryDeptById(Long deptId, String accessToken) {
        try {
            DingTalkClient client = new DefaultDingTalkClient(DEPT_LIST_URL);
            OapiV2DepartmentListsubRequest req = new OapiV2DepartmentListsubRequest();
            req.setDeptId(deptId);
            req.setLanguage("zh_CN");
            OapiV2DepartmentListsubResponse rsp = client.execute(req, accessToken);
            if (rsp.isSuccess()) {
                log.info("获取部门列表成功:{}", JSONUtil.toJsonStr(rsp.getResult()));
                return rsp.getResult();
            }
        } catch (ApiException e) {
            log.info("获取部门列表失败");
        }
        return Collections.emptyList();
    }

    /**
     * 查询部门下用户信息
     *
     * @param deptId
     * @param accessToken
     * @return
     */
    public List<OapiV2UserListResponse.ListUserResponse> queryDeptUserInfo(Long deptId, String accessToken) {
        DingTalkClient client = new DefaultDingTalkClient(USER_LIST_URL);
        OapiV2UserListRequest req = new OapiV2UserListRequest();
        req.setDeptId(deptId);
        req.setCursor(0L);
        req.setSize(100L);
        req.setOrderField("modify_desc");
        req.setContainAccessLimit(false);
        req.setLanguage("zh_CN");
        OapiV2UserListResponse rsp = null;
        try {
            rsp = client.execute(req, accessToken);
            if (rsp.isSuccess()) {
                log.info("获取用户列表成功:{}", JSONUtil.toJsonStr(rsp.getResult().getList()));
                return rsp.getResult().getList();
            }
        } catch (ApiException e) {
            e.printStackTrace();
            log.info("获取部门下用户列表失败");
        }
        return Collections.emptyList();
    }

}
