package ${cfg.packageParent}.controller;

import jakarta.annotation.Resource;
import ${package.Service}.${table.serviceName};
import ${package.Mapper}.${table.mapperName};
import ${package.Entity}.${entity};
import com.iptv.common.core.web.page.PageDTO;
import com.iptv.common.core.web.page.TableDataInfo;
import cn.hutool.core.util.ObjectUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * ${table.comment!} 控制器测试（PostgreSQL）
 *
 * @author ${author}
 * @since ${date}
 */
@Transactional(transactionManager = "postgresTransactionManager", rollbackFor = Exception.class)
@SpringBootTest
public class ${table.controllerName}Test {

    @Resource
    private ${table.serviceName} ${table.entityPath}Service;
    @Resource
    private ${table.mapperName} ${table.entityPath}Mapper;

    /** 新增基础数据，供其他测试复用 */
    public ${entity} save() {
        ${entity} data = new ${entity}();
        ${table.entityPath}Mapper.insert(data);
        return data;
    }

    @Test
    @DisplayName("分页查询")
    void list() {
        ${entity} dto = new ${entity}();
        TableDataInfo<${entity}> result = ${table.entityPath}Service.queryPage(dto, new PageDTO());
        assert ObjectUtil.isNotNull(result);
    }

    @Test
    @DisplayName("按 id 查询")
    void queryById() {
        ${entity} data = save();
        ${entity} found = ${table.entityPath}Service.queryById(data.getId());
        assert ObjectUtil.isNotNull(found);
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
