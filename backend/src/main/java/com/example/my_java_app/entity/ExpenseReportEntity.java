package com.example.my_java_app.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Maps table `expense_reports`
 */
@Data
public class ExpenseReportEntity {
    private Long id;
    private String period;
    private String status;       // PENDING | DONE | FAILED
    private String reportData;   // JSON string — aggregated expense payload
    private String markdown;     // AI-generated markdown output
    private String errorMsg;
    private LocalDateTime generatedAt;
    private LocalDateTime createdAt;
}
