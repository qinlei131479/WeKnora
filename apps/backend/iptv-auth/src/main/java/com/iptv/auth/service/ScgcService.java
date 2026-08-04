package com.iptv.auth.service;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.date.TimeInterval;
import cn.hutool.core.thread.ThreadUtil;
import cn.hutool.core.util.NumberUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.http.HttpStatus;
import cn.hutool.json.JSONUtil;
import com.iptv.auth.constant.ScgcConstant;
import com.iptv.auth.enums.GetQrCodeStatusTypeEnum;
import com.iptv.auth.enums.QrCodeStatusEnum;
import com.iptv.auth.form.QrBody;
import com.iptv.auth.util.SseUtil;
import com.iptv.auth.vo.QrCodeResultVO;
import com.iptv.common.core.constant.SecurityConstants;
import com.iptv.common.core.domain.R;
import com.iptv.common.security.service.TokenService;
import com.iptv.system.api.RemoteUserService;
import com.iptv.system.api.domain.SysUser;
import com.iptv.system.api.model.LoginUser;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Component
public class ScgcService {

    @Resource
    private RemoteUserService remoteUserService;
    @Resource
    private SysLoginService sysLoginService;
    @Resource
    private TokenService tokenService;

    public QrBody getLoginQrCode() {
        HttpResponse response = HttpRequest.get(ScgcConstant.QR_CODE_API_URL)
                .form("applicationType", ScgcConstant.APPLICATION_TYPE)
                .execute();

        if (!response.isOk()) {
            log.info("获取二维码失败：{}", JSONUtil.toJsonStr(response));
            throw new RuntimeException("获取二维码失败, 请稍后重试！");
        }

        Map<String, Object> body = JSONUtil.toBean(response.body(), Map.class);
        if (HttpStatus.HTTP_OK != (int) body.get("rs")) {
            log.info("获取二维码失败：{}", JSONUtil.toJsonStr(body));
            throw new RuntimeException("获取二维码失败, 请稍后重试！");
        }

        return BeanUtil.copyProperties(body.get("data"), QrBody.class);
    }

    /**
     * 获取二维码状态 SSE
     *
     * @param qrCodeKey 二维码key
     * @param type      操作类型
     * @return
     */
    public SseEmitter getQrCodeStatusBySse(String qrCodeKey, String type) {
        if (StrUtil.isBlank(qrCodeKey)) {
            SseEmitter emitter = new SseEmitter();
            emitter.complete();
            return emitter;
        }

        ScheduledThreadPoolExecutor scheduler = ThreadUtil.createScheduledExecutor(1);
        // 超时时间 60秒
        final int timeout = 60;
        // 创建一个新的SseEmitter实例，超时时间为100秒
        SseEmitter emitter = new SseEmitter(100_000L);
        // 计时器
        TimeInterval timer = DateUtil.timer();
        AtomicBoolean isCompleted = new AtomicBoolean(false);
        AtomicReference<QrCodeResultVO> qrCodeResult = new AtomicReference<>(new QrCodeResultVO());

        // 首发一条
        SseUtil.send(emitter, type, qrCodeResult.get());

        scheduler.scheduleWithFixedDelay(() -> {
            // 完成了就要关闭
            if (isCompleted.get()) {
                closeEmitter(emitter, scheduler);
                return;
            }
            try {
                // 获取二维码状态
                qrCodeResult.set(getQrCodeStatus(qrCodeKey, type));

                // 错误完成
                QrCodeResultVO resultVO = qrCodeResult.get();
                if (resultVO.getCode().equals(QrCodeStatusEnum.ERROR.getStatus()) || StrUtil.isNotBlank(resultVO.getMsg())) {
                    isCompleted.set(true);
                }

                // 检查 user_id 是否有值
                boolean noAnswer = ObjectUtil.isAllNotEmpty(resultVO, resultVO.getUserId());
                if (noAnswer) {
                    isCompleted.set(true);
                }

                // 完成了 或首次请求才推消息
                if (isCompleted.get()) {
                    SseUtil.send(emitter, type, resultVO);
                }

                // 如果超时，则修改状态为超时
                if (timer.intervalSecond() > timeout) {
                    qrCodeResult.get().toExpired();
                    isCompleted.set(true);
                }

            } catch (Exception e) {
                log.error("Error sending SSE event: ", e);
                // 发送失败时完成该Emitter
                emitter.completeWithError(e);
                qrCodeResult.get().toError("获取登录状态失败，请稍后重试！");
                try {
                    emitter.send(SseEmitter.event().name(type).data(qrCodeResult));
                } catch (Exception ex) {
                    log.error("Sending Error SSE event fail: ", ex);
                } finally {
                    isCompleted.set(true);
                    emitter.completeWithError(e);
                }
            }
        }, 0, 1, TimeUnit.SECONDS);

        // 在65秒后完成该Emitter
        scheduler.schedule(emitter::complete, 65, TimeUnit.SECONDS);

        // 确保线程池在适当的时候关闭
        emitter.onCompletion(() -> {
            closeEmitter(emitter, scheduler);
        });
        return emitter;
    }

    private static void closeEmitter(SseEmitter emitter, ScheduledExecutorService scheduler) {
        try {
            emitter.complete();
            // 关闭线程池
            scheduler.shutdownNow();
        } catch (Exception e) {
            log.error("Error completing SSE request: ", e);
        }
    }

    private QrCodeResultVO getQrCodeStatus(String qrCodeKey, String type) {
        QrCodeResultVO resultVO = new QrCodeResultVO();
        HashMap<String, Object> body = new HashMap<>();
        body.put("key", qrCodeKey);
        body.put("applicationType", ScgcConstant.APPLICATION_TYPE);
        HttpResponse response = HttpRequest.post(ScgcConstant.QR_CODE_STATUS_API_URL)
                .body(JSONUtil.toJsonStr(body))
                .execute();
        log.info("获取二维码状态：{}", JSONUtil.toJsonStr(response.body()));

        Map<String, Object> map;
        try {
            map = JSONUtil.toBean(response.body(), Map.class);
        } catch (Exception e) {
            log.info("获取二维码状态失败：{}", JSONUtil.toJsonStr(response.body()));
            resultVO.toError("获取二维码状态失败, 请稍后重试！");
            return resultVO;
        }
        if (map.containsKey("status")) {
            if (response.body().contains("失效")) {
                resultVO.toError("二维码已失效！");
                return resultVO;
            }
            // 未扫码
            return resultVO;
        }

        if (GetQrCodeStatusTypeEnum.LOGIN.getType().equals(type)) {
            // 登录 检查用户 生成token
            resultVO = createToken(map);
        } else if (GetQrCodeStatusTypeEnum.BIND.getType().equals(type)) {
            // 绑定
            resultVO.setUserId(map.get("user_id").toString());
        }
        return resultVO;
    }

    /**
     * 创建token
     *
     * @param map
     * @return
     */
    private QrCodeResultVO createToken(Map<String, Object> map) {
        QrCodeResultVO resultVO = new QrCodeResultVO();
        Long scgcUserId = NumberUtil.toBigInteger((String) map.get("user_id")).longValue();
        R<SysUser> userR = remoteUserService.selectByScgcUserId(scgcUserId, SecurityConstants.INNER);
        log.info("获取用户信息：{}", JSONUtil.toJsonStr(userR));
        if (userR.getCode() != R.ok().getCode() || ObjectUtil.isNull(userR.getData())) {
            resultVO.toError("该开放平台用户暂未绑定平台账号，请先绑定账号！");
            return resultVO;
        }
        SysUser user = userR.getData();

        // 登录检查弹窗怎么办？ 不管 直接强退
        try {
            // 用户登录
            LoginUser userInfo = sysLoginService.login(user.getUserName(), user.getPassword());
            // 获取登录token 判断是否存在未过期的token 如果有就代表已在别处登录
            Map<String, Object> token = tokenService.createToken(userInfo);
            resultVO.setUserId(scgcUserId.toString());
            resultVO.setToken(token.get("access_token").toString());
        } catch (Exception e) {
            log.error("用户登录失败：{}", e.getMessage());
            resultVO.toError(e.getMessage());
        }

        return resultVO;
    }

    /**
     * 获取当前登录用户ID
     *
     * @return 用户ID或错误响应
     */
    private R getLoginUserId() {
        try {
            LoginUser loginUser = tokenService.getLoginUser();
            return R.ok(loginUser.getSysUser().getUserId());
        } catch (Exception ex) {
            return R.fail("获取用户信息失败，请重试！");
        }
    }

    /**
     * 二维码绑定
     *
     * @param otherUserId 要绑定的其他用户的ID
     * @return 绑定结果
     */
    public R bindQrCode(Long otherUserId) {
        R userIdResult = getLoginUserId();
        if (R.ok().getCode() != userIdResult.getCode()) {
            // 直接返回错误信息
            return userIdResult;
        }
        Long userId = (Long) userIdResult.getData();
        return remoteUserService.bindScgcUser(userId, otherUserId, SecurityConstants.INNER);
    }

    /**
     * 二维码解绑
     *
     * @return 解绑结果
     */
    public R unbindQrCode() {
        R userIdResult = getLoginUserId();
        if (R.ok().getCode() != userIdResult.getCode()) {
            // 直接返回错误信息
            return userIdResult;
        }
        Long userId = (Long) userIdResult.getData();
        return remoteUserService.bindScgcUser(userId, null, SecurityConstants.INNER);
    }

    public R<Boolean> getBindStatus() {
        boolean isBind;
        try {
            LoginUser loginUser = tokenService.getLoginUser();
            R<?> userInfoR = remoteUserService.getUserInfo(loginUser.getSysUser().getUserName(), SecurityConstants.INNER);
            if (userInfoR.getCode() == R.ok().getCode()) {
                LoginUser userInfo = BeanUtil.toBean(userInfoR.getData(), LoginUser.class);
                SysUser sysUser = userInfo.getSysUser();
                isBind = ObjectUtil.isNotNull(sysUser.getScgcUserId());
            } else {
                log.error("获取用户信息失败：{}", JSONUtil.toJsonStr(userInfoR));
                return R.fail("获取用户信息失败，请重试！");
            }
        } catch (Exception e) {
            log.error("获取用户信息失败,原因：{}", e.getMessage());
            return R.fail("获取用户信息失败，请重试！");
        }
        return R.ok(isBind);
    }
}
