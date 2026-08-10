package ${package.Mapper};

import ${package.Entity}.${entity};
import ${package.Entity}.dto.page.${entity}PageDTO;
import ${superMapperClassPackage};
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.List;

/**
 * <p>
 * ${table.comment!} Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author ${author}
 * @since ${date}
 */
public interface ${table.mapperName} extends ${superMapperClass}<${entity}> {

    /**
     * 分页查询
     *
     * @param param 查询条件
     * @param page  分页参数
     * @return 数据列表
     */
    List<${entity}> queryPage(@Param("param") ${entity}PageDTO param, Page page);
}
