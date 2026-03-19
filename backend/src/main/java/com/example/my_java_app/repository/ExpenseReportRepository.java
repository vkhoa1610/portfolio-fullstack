package com.example.my_java_app.repository;

import com.example.my_java_app.entity.ExpenseReportEntity;
import com.example.my_java_app.mapper.ExpenseReportMapper;
import org.springframework.stereotype.Repository;

@Repository
public class ExpenseReportRepository {

    private final ExpenseReportMapper mapper;

    public ExpenseReportRepository(ExpenseReportMapper mapper) {
        this.mapper = mapper;
    }

    public void save(ExpenseReportEntity entity) {
        mapper.insert(entity);
    }

    public ExpenseReportEntity findById(Long id) {
        return mapper.findById(id);
    }

    public ExpenseReportEntity findLatestDone() {
        return mapper.findLatestDone();
    }

    public void markDone(Long id, String reportData, String markdown, String generatedAt) {
        mapper.updateDone(id, reportData, markdown, generatedAt);
    }

    public void markFailed(Long id, String errorMsg, String generatedAt) {
        mapper.updateFailed(id, errorMsg, generatedAt);
    }
}
