package com.iptv.business.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iptv.business.domain.Tenants;
import com.iptv.business.domain.VectorStores;
import com.iptv.business.domain.dto.page.VectorStoresPageDTO;
import com.iptv.business.domain.vo.VectorStoresVO;
import com.iptv.business.pgmapper.TenantsMapper;
import com.iptv.business.pgmapper.VectorStoresMapper;
import com.iptv.common.core.utils.SpringUtils;
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.MessageSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VectorStoresServiceImplTest {

    @Mock
    private VectorStoresMapper vectorStoresMapper;

    @Mock
    private TenantsMapper tenantsMapper;

    @Mock
    private ConfigurableListableBeanFactory beanFactory;

    @Mock
    private MessageSource messageSource;

    private VectorStoresServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new VectorStoresServiceImpl();
        ReflectionTestUtils.setField(service, "baseMapper", vectorStoresMapper);
        ReflectionTestUtils.setField(service, "tenantsMapper", tenantsMapper);
    }

    @AfterEach
    void tearDown() {
        ReflectionTestUtils.setField(SpringUtils.class, "beanFactory", null);
    }

    @Test
    void queryPageShouldPopulateTenantNameWhenTenantIdsMatch() {
        configureMessageSource();

        VectorStores vectorStore = new VectorStores();
        vectorStore.setTenantId(1);

        Tenants tenant = new Tenants();
        tenant.setId(1);
        tenant.setName("tenant-one");

        when(vectorStoresMapper.queryPage(any(VectorStoresPageDTO.class), any(Page.class)))
                .thenReturn(List.of(vectorStore));
        when(tenantsMapper.selectList(any())).thenReturn(List.of(tenant));

        TableDataInfo<VectorStoresVO> result = service.queryPage(
                new VectorStoresPageDTO(), new PageDTO());

        assertEquals("tenant-one", result.getRows().get(0).getTenantName());
    }

    @Test
    void tenantNameKeyShouldRemainWhenGlobalConfigurationExcludesNulls() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        String json = objectMapper.writeValueAsString(new VectorStoresVO());

        assertTrue(json.contains("\"tenantName\":null"));
    }

    private void configureMessageSource() {
        when(beanFactory.getBean(MessageSource.class)).thenReturn(messageSource);
        when(messageSource.getMessage(anyString(), any(Object[].class), anyString(), any(Locale.class)))
                .thenAnswer(invocation -> invocation.getArgument(2));
        new SpringUtils().postProcessBeanFactory(beanFactory);
    }
}
