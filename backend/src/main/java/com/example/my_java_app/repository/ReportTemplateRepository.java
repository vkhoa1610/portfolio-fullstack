package com.example.my_java_app.repository;

import com.example.my_java_app.entity.ReportTemplateEntity;
import com.example.my_java_app.mapper.ReportTemplateMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ReportTemplateRepository {

    private final ReportTemplateMapper mapper;

    public ReportTemplateRepository(ReportTemplateMapper mapper) {
        this.mapper = mapper;
    }

    public List<ReportTemplateEntity> findAll() {
        return mapper.findAll();
    }

    public ReportTemplateEntity findById(Long id) {
        return mapper.findById(id);
    }

    public void save(ReportTemplateEntity entity) {
        mapper.insert(entity);
    }

    public void update(Long id, String name, String configJson) {
        mapper.update(id, name, configJson);
    }
}
