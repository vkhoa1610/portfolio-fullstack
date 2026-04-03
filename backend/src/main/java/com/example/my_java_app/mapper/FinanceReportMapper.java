package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.FinanceReportEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FinanceReportMapper {

    void insert(FinanceReportEntity report);

    List<FinanceReportEntity> findAll();

    FinanceReportEntity findById(@Param("id") Long id);

    void updateStatus(@Param("id") Long id,
                      @Param("status") String status,
                      @Param("submittedAt") String submittedAt);
}
