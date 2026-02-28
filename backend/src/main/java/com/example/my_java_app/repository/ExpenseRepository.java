package com.example.my_java_app.repository;

import com.example.my_java_app.entity.ExpenseEntity;
import com.example.my_java_app.mapper.ExpenseMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ExpenseRepository {

    private final ExpenseMapper mapper;

    public ExpenseRepository(ExpenseMapper mapper) {
        this.mapper = mapper;
    }

    public void save(ExpenseEntity expense) {
        mapper.insert(expense);
    }

    public List<ExpenseEntity> findByUserSub(String userSub) {
        return mapper.findByUserSub(userSub);
    }

    public ExpenseEntity findById(Long id) {
        return mapper.findById(id);
    }

    public void updateStatus(Long id, String status, String submittedAt) {
        mapper.updateStatus(id, status, submittedAt);
    }

    public void updateReview(Long id, String status, String reviewedBy, String reviewedAt, String rejectionReason) {
        mapper.updateReview(id, status, reviewedBy, reviewedAt, rejectionReason);
    }

    public List<ExpenseEntity> findPendingForManager() {
        return mapper.findPendingForManager();
    }
}
