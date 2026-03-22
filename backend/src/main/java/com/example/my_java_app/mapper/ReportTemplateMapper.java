package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.ReportTemplateEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReportTemplateMapper {

    List<ReportTemplateEntity> findAll();

    ReportTemplateEntity findById(@Param("id") Long id);

    void insert(ReportTemplateEntity entity);

    void update(@Param("id") Long id,
                @Param("name") String name,
                @Param("configJson") String configJson);
}
