package ${cfg.packageParent}.controller;

import jakarta.annotation.Resource;

import ${package.Service}.${table.serviceName};
import ${package.Mapper}.${table.mapperName};
import ${package.Entity}.${entity};

import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import cn.hutool.core.util.ObjectUtil;
import org.springframework.transaction.annotation.Transactional;

/**
* 当模块中存在websocket的时候，需要使用下方注解配置，方可启动成功（以下配置会启动服务）
*
* @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)*
* @author ${author}
* @since ${date}
*/
@Transactional(rollbackFor = Exception.class)
@SpringBootTest
public class ${table.controllerName}Test {

    @Resource
    private ${table.serviceName} ${table.entityPath}Service;
    @Resource
    private ${table.mapperName} ${table.entityPath}Mapper;
    /**
    * 新增数据，模拟验证测试用例
    *
    * @return data
    */
    public ${entity} save() {
        ${entity} data = new ${entity}();
        ${table.entityPath}Mapper.insert(data);
        return data;
    }
    @Test
    @DisplayName("分页查询")
    void list() {
        ${entity} dto = new ${entity}();
        TableDataInfo<${entity}> listVo = ${table.entityPath}Service.queryPage(dto, new PageDTO());
        assert ObjectUtil.isNotNull(listVo);
    }

    @Test
    @DisplayName("按id查询")
    void queryById() {
        ${entity} data = save();
        ${entity} dataById = ${table.entityPath}Service.queryById(data.getId());
        assert ObjectUtil.isNotNull(dataById);
    }

    @Test
    @DisplayName("新增")
    void insert() {
        ${entity} dto = new ${entity}();
        ${table.entityPath}Service.insert(dto);
    }

    @Test
    @DisplayName("更新")
    void update() {
        ${entity} data = save();
        ${entity} dto = new ${entity}();
        dto.setId(data.getId());
        ${table.entityPath}Service.update(dto);
    }

    @Test
    @DisplayName("删除")
    void delete() {
        ${entity} data = save();
        ${table.entityPath}Service.deleteById(data.getId());
    }
}