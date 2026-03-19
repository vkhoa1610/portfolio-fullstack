package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.ExpenseReportEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ExpenseReportMapper {

    void insert(ExpenseReportEntity entity);

    ExpenseReportEntity findById(@Param("id") Long id);

    ExpenseReportEntity findLatestDone();

    void updateDone(@Param("id") Long id,
                    @Param("reportData") String reportData,
                    @Param("markdown") String markdown,
                    @Param("generatedAt") String generatedAt);

    void updateFailed(@Param("id") Long id,
                      @Param("errorMsg") String errorMsg,
                      @Param("generatedAt") String generatedAt);
}
