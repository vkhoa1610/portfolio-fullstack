package com.example.my_java_app.repository;

import com.example.my_java_app.entity.FinanceReportEntity;
import com.example.my_java_app.mapper.FinanceReportMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class FinanceReportRepository {

    private final FinanceReportMapper mapper;

    public FinanceReportRepository(FinanceReportMapper mapper) {
        this.mapper = mapper;
    }

    public void insert(FinanceReportEntity report) {
        mapper.insert(report);
    }

    public List<FinanceReportEntity> findAll() {
        return mapper.findAll();
    }

    public FinanceReportEntity findById(Long id) {
        return mapper.findById(id);
    }

    public void updateStatus(Long id, String status, String submittedAt) {
        mapper.updateStatus(id, status, submittedAt);
    }
}
