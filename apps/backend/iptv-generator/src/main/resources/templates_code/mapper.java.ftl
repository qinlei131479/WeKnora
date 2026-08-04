package ${package.Mapper};

import ${package.Entity}.${entity};
import ${package.Entity}.dto.page.${entity}PageDTO;
import ${superMapperClassPackage};
import java.util.List;

import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
/**
 * <p>
 * ${table.comment!} Mapper 接口
 * </p>
 *
 * @author ${author}
 * @since ${date}
 */
<#if kotlin>
interface ${table.mapperName} : ${superMapperClass}<${entity}>
<#else>
public interface ${table.mapperName} extends ${superMapperClass}<${entity}> {

    /**
    * 分页查询
    *
    * @param dto
    * @param page
    * @return
    */
    List<${entity}> queryPage(@Param("param") ${entity}PageDTO dto, Page page);
}
</#if>
