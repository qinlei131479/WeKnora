package com.iptv.common.security.handler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingPathVariableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import com.iptv.common.core.constant.HttpStatus;
import com.iptv.common.core.exception.DemoModeException;
import com.iptv.common.core.exception.InnerAuthException;
import com.iptv.common.core.exception.ServiceException;
import com.iptv.common.core.exception.auth.NotPermissionException;
import com.iptv.common.core.exception.auth.NotRoleException;
import com.iptv.common.core.text.Convert;
import com.iptv.common.core.utils.MessageUtils;
import com.iptv.common.core.utils.StringUtils;
import com.iptv.common.core.utils.html.EscapeUtil;
import com.iptv.common.core.web.domain.AjaxResult;

/**
 * 全局异常处理器
 *
 * @author ruoyi
 */
@RestControllerAdvice
public class GlobalExceptionHandler
{
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 权限码异常
     */
    @ExceptionHandler(NotPermissionException.class)
    public AjaxResult handleNotPermissionException(NotPermissionException e, HttpServletRequest request)
    {
        String requestURI = request.getRequestURI();
        log.error("请求地址'{}',权限码校验失败'{}'", requestURI, e.getMessage());
        return AjaxResult.error(HttpStatus.FORBIDDEN, MessageUtils.message("error.permission.denied"));
    }

    /**
     * 角色权限异常
     */
    @ExceptionHandler(NotRoleException.class)
    public AjaxResult handleNotRoleException(NotRoleException e, HttpServletRequest request)
    {
        String requestURI = request.getRequestURI();
        log.error("请求地址'{}',角色权限校验失败'{}'", requestURI, e.getMessage());
        return AjaxResult.error(HttpStatus.FORBIDDEN, MessageUtils.message("error.permission.denied"));
    }

    /**
     * 请求方式不支持
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public AjaxResult handleHttpRequestMethodNotSupported(HttpRequestMethodNotSupportedException e, HttpServletRequest request)
    {
        String requestURI = request.getRequestURI();
        log.error("请求地址'{}',不支持'{}'请求", requestURI, e.getMethod());
        return AjaxResult.error(MessageUtils.message("error.method.not.supported", e.getMethod()));
    }

    /**
     * 业务异常
     */
    @ExceptionHandler(ServiceException.class)
    public AjaxResult handleServiceException(ServiceException e, HttpServletRequest request)
    {
        String message = resolveMessage(e.getMessage(), e.getArgs());
        log.error(message, e);
        Integer code = e.getCode();
        return StringUtils.isNotNull(code) ? AjaxResult.error(code, message) : AjaxResult.error(message);
    }

    /**
     * 请求路径中缺少必需的路径变量
     */
    @ExceptionHandler(MissingPathVariableException.class)
    public AjaxResult handleMissingPathVariableException(MissingPathVariableException e, HttpServletRequest request)
    {
        String requestURI = request.getRequestURI();
        log.error("请求路径中缺少必需的路径变量'{}',发生系统异常.", requestURI, e);
        return AjaxResult.error(MessageUtils.message("error.path.variable.missing", e.getVariableName()));
    }

    /**
     * 请求参数类型不匹配
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public AjaxResult handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e, HttpServletRequest request)
    {
        String requestURI = request.getRequestURI();
        String value = Convert.toStr(e.getValue());
        if (StringUtils.isNotEmpty(value))
        {
            value = EscapeUtil.clean(value);
        }
        log.error("请求参数类型不匹配'{}',发生系统异常.", requestURI, e);
        return AjaxResult.error(MessageUtils.message("error.argument.type.mismatch",
                e.getName(), e.getRequiredType().getName(), value));
    }

    /**
     * 拦截未知的运行时异常
     */
    @ExceptionHandler(RuntimeException.class)
    public AjaxResult handleRuntimeException(RuntimeException e, HttpServletRequest request,
                                             HttpServletResponse response)
    {
        String requestURI = request.getRequestURI();
        if (isEventStreamRequest(request, response)) {
            log.error("请求地址'{}',SSE 流式异常已由异步 emitter 处理.", requestURI, e);
            return null;
        }
        log.error("请求地址'{}',发生未知异常.", requestURI, e);
        return AjaxResult.error(resolveRuntimeMessage(e.getMessage()));
    }

    /**
     * 系统异常
     */
    @ExceptionHandler(Exception.class)
    public AjaxResult handleException(Exception e, HttpServletRequest request,
                                      HttpServletResponse response)
    {
        String requestURI = request.getRequestURI();
        if (isEventStreamRequest(request, response)) {
            log.error("请求地址'{}',SSE 流式异常已由异步 emitter 处理.", requestURI, e);
            return null;
        }
        log.error("请求地址'{}',发生系统异常.", requestURI, e);
        return AjaxResult.error(resolveRuntimeMessage(e.getMessage()));
    }

    /**
     * 是否为 SSE 流式请求；此类响应由 SseEmitter 异步写入，全局异常处理器不应再写 JSON。
     *
     * @param request  HTTP 请求
     * @param response HTTP 响应
     * @return SSE 请求返回 true
     */
    private static boolean isEventStreamRequest(HttpServletRequest request, HttpServletResponse response)
    {
        if (response.isCommitted()) {
            return true;
        }
        String accept = request.getHeader("Accept");
        if (StringUtils.isNotEmpty(accept) && accept.contains("text/event-stream")) {
            return true;
        }
        String requestURI = request.getRequestURI();
        return StringUtils.isNotEmpty(requestURI) && requestURI.contains("chat-stream");
    }

    /**
     * 自定义验证异常
     */
    @ExceptionHandler(BindException.class)
    public AjaxResult handleBindException(BindException e)
    {
        log.error(e.getMessage(), e);
        String message = e.getAllErrors().get(0).getDefaultMessage();
        return AjaxResult.error(resolveMessage(message));
    }

    /**
     * 自定义验证异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Object handleMethodArgumentNotValidException(MethodArgumentNotValidException e)
    {
        log.error(e.getMessage(), e);
        String message = e.getBindingResult().getFieldError().getDefaultMessage();
        return AjaxResult.error(resolveMessage(message));
    }

    /**
     * 内部认证异常
     */
    @ExceptionHandler(InnerAuthException.class)
    public AjaxResult handleInnerAuthException(InnerAuthException e)
    {
        return AjaxResult.error(resolveMessage(e.getMessage()));
    }

    /**
     * 演示模式异常
     */
    @ExceptionHandler(DemoModeException.class)
    public AjaxResult handleDemoModeException(DemoModeException e)
    {
        return AjaxResult.error(MessageUtils.message("error.demo.mode"));
    }

    private static String resolveMessage(String code, Object... args)
    {
        return StringUtils.isNotNull(code) ? MessageUtils.message(code, args) : null;
    }

    private static String resolveRuntimeMessage(String code)
    {
        return MessageUtils.messageOrDefault(code, MessageUtils.message("error.internal"));
    }
}
