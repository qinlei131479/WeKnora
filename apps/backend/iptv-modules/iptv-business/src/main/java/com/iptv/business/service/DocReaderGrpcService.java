package com.iptv.business.service;

import com.iptv.business.domain.vo.ParserEngineInfoVO;

import java.util.List;
import java.util.Map;

/**
 * DocReader gRPC 客户端服务接口
 * 直连 docreader Python 服务，用于发现远程解析引擎
 *
 * @author kjsc
 * @since 2026-08-26
 */
public interface DocReaderGrpcService {

    /**
     * 调用 docreader 的 ListEngines RPC 获取远程引擎列表
     *
     * @param overrides 租户配置覆盖参数
     * @return 远程引擎列表，连接失败或无引擎时返回空列表
     */
    List<ParserEngineInfoVO> listRemoteEngines(Map<String, String> overrides);

    /**
     * 判断 docreader 服务是否已连接
     *
     * @return true 表示已连接
     */
    boolean isConnected();

    /**
     * 获取 docreader 服务地址
     *
     * @return 服务地址
     */
    String getAddr();
}
