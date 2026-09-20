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

    /** @return rows actually updated — 0 means the expense was no longer
     *  PENDING_REVIEW when this ran (already reviewed by someone else, or a
     *  stale client retrying a review). */
    public int updateReview(Long id, String status, String reviewedBy, String reviewedAt, String rejectionReason) {
        return mapper.updateReview(id, status, reviewedBy, reviewedAt, rejectionReason);
    }

    public List<ExpenseEntity> findForManagerByStatus(List<String> statuses) {
        return mapper.findForManagerByStatus(statuses);
    }
}
