package com.example.my_java_app.dto.request;

import lombok.Data;

@Data
public class ReviewExpenseRequestDto {
    private String rejectionReason; // chỉ dùng khi reject
}
