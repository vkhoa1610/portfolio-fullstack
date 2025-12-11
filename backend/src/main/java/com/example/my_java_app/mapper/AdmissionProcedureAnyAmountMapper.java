package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.AdmissionProcedureAnyAmountEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdmissionProcedureAnyAmountMapper {

    List<AdmissionProcedureAnyAmountEntity> findAll();

    AdmissionProcedureAnyAmountEntity findById(@Param("id") Long id);

    void insert(AdmissionProcedureAnyAmountEntity entity);

    void update(AdmissionProcedureAnyAmountEntity entity);
}
