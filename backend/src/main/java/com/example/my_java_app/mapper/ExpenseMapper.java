package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.ExpenseEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ExpenseMapper {

    void insert(ExpenseEntity expense);

    List<ExpenseEntity> findByUserSub(@Param("userSub") String userSub);

    ExpenseEntity findById(@Param("id") Long id);

    void updateStatus(@Param("id") Long id,
                      @Param("status") String status,
                      @Param("submittedAt") String submittedAt);

    void updateReview(@Param("id") Long id,
                      @Param("status") String status,
                      @Param("reviewedBy") String reviewedBy,
                      @Param("reviewedAt") String reviewedAt,
                      @Param("rejectionReason") String rejectionReason);

    List<ExpenseEntity> findPendingForManager();
}
