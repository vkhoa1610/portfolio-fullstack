package com.example.my_java_app.repository;

import com.example.my_java_app.entity.AdmissionProcedureEntity;
import com.example.my_java_app.mapper.AdmissionProcedureMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class AdmissionProcedureRepository {

    private final AdmissionProcedureMapper mapper;

    public AdmissionProcedureRepository(AdmissionProcedureMapper mapper) {
        this.mapper = mapper;
    }

    public List<AdmissionProcedureEntity> findAll() {
        return mapper.findAll();
    }

    public AdmissionProcedureEntity findById(Long id) {
        return mapper.findById(id);
    }

    public void save(AdmissionProcedureEntity entity) {
        mapper.insert(entity);
    }

    public void update(AdmissionProcedureEntity entity) {
        mapper.update(entity);
    }
}
