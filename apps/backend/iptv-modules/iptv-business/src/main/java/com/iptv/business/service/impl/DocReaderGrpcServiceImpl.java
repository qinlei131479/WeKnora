package com.iptv.business.service.impl;

import cn.hutool.core.util.StrUtil;
import com.iptv.business.config.DocReaderConfig;
import com.iptv.business.domain.vo.ParserEngineInfoVO;
import com.iptv.business.grpc.docreader.DocReaderGrpc;
import com.iptv.business.grpc.docreader.ListEnginesRequest;
import com.iptv.business.grpc.docreader.ListEnginesResponse;
import com.iptv.business.service.DocReaderGrpcService;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * DocReader gRPC 客户端服务实现
 * 直连 docreader Python 服务（默认 docreader:50051），发现远程解析引擎
 *
 * @author kjsc
 * @since 2026-08-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocReaderGrpcServiceImpl implements DocReaderGrpcService {

    private final DocReaderConfig docReaderConfig;

    private ManagedChannel channel;
    private DocReaderGrpc.DocReaderBlockingStub blockingStub;

    @PostConstruct
    public void init() {
        if (StrUtil.isBlank(docReaderConfig.getUrl())) {
            log.warn("docreader 地址未配置，跳过 gRPC 连接");
            return;
        }
        try {
            // gRPC forTarget 不接受 http:// 前缀，需去掉 URL scheme
            String target = docReaderConfig.getUrl()
                    .replaceFirst("^https?://", "")
                    .replaceFirst("/+$", "");
            channel = ManagedChannelBuilder.forTarget(target)
                    .usePlaintext()
                    .build();
            blockingStub = DocReaderGrpc.newBlockingStub(channel);
            log.info("docreader gRPC channel 已初始化: {}", target);
        } catch (Exception e) {
            log.warn("初始化 docreader gRPC channel 失败: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void destroy() {
        if (channel != null && !channel.isShutdown()) {
            try {
                channel.shutdown().awaitTermination(3, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                channel.shutdownNow();
            }
        }
    }

    @Override
    public List<ParserEngineInfoVO> listRemoteEngines(Map<String, String> overrides) {
        if (blockingStub == null) {
            return Collections.emptyList();
        }
        try {
            ListEnginesRequest.Builder builder = ListEnginesRequest.newBuilder();
            if (overrides != null && !overrides.isEmpty()) {
                builder.putAllConfigOverrides(overrides);
            }
            ListEnginesResponse resp = blockingStub
                    .withDeadlineAfter(10, TimeUnit.SECONDS)
                    .listEngines(builder.build());

            List<ParserEngineInfoVO> result = new ArrayList<>();
            for (com.iptv.business.grpc.docreader.ParserEngineInfo e : resp.getEnginesList()) {
                ParserEngineInfoVO vo = new ParserEngineInfoVO();
                vo.setName(e.getName());
                vo.setDescription(e.getDescription());
                vo.setFileTypes(new ArrayList<>(e.getFileTypesList()));
                vo.setAvailable(e.getAvailable());
                vo.setUnavailableReason(e.getUnavailableReason());
                result.add(vo);
            }
            return result;
        } catch (Exception e) {
            log.warn("调用 docreader ListEngines 失败: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public boolean isConnected() {
        return channel != null && !channel.isShutdown() && !channel.isTerminated();
    }

    @Override
    public String getAddr() {
        return docReaderConfig.getUrl();
    }
}
