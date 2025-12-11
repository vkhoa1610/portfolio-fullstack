package com.example.my_java_app.repository;

import com.example.my_java_app.entity.AdmissionProcedureAnyAmountEntity;
import com.example.my_java_app.mapper.AdmissionProcedureAnyAmountMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class AdmissionProcedureAnyAmountRepository {

    private final AdmissionProcedureAnyAmountMapper mapper;

    public AdmissionProcedureAnyAmountRepository(AdmissionProcedureAnyAmountMapper mapper) {
        this.mapper = mapper;
    }

    public List<AdmissionProcedureAnyAmountEntity> findAll() {
        return mapper.findAll();
    }

    public AdmissionProcedureAnyAmountEntity findById(Long id) {
        return mapper.findById(id);
    }

    public void save(AdmissionProcedureAnyAmountEntity entity) {
        mapper.insert(entity);
    }

    public void update(AdmissionProcedureAnyAmountEntity entity) {
        mapper.update(entity);
    }
}
