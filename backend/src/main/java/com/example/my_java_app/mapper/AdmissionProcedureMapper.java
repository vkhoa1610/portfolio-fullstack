package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.AdmissionProcedureEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdmissionProcedureMapper {

    List<AdmissionProcedureEntity> findAll();

    AdmissionProcedureEntity findById(@Param("id") Long id);

    void insert(AdmissionProcedureEntity entity);

    void update(AdmissionProcedureEntity entity);
}
