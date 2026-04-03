package com.example.my_java_app.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Maps table `finance_reports`
 */
@Data
public class FinanceReportEntity {
    private Long id;
    private String userSub;
    private String title;
    private String reportType;       // FINANCIAL | ANALYTICS | OPERATIONS | COMPLIANCE
    private String fiscalPeriod;     // e.g. "Q1 2026"
    private LocalDate dueDate;
    private String description;
    private String priority;         // LOW | NORMAL | HIGH | URGENT
    private BigDecimal totalAmount;
    private String currency;
    private String lineItems;        // JSON string
    private String attachments;      // JSON string
    private String approvalRoute;    // JSON string
    private String notifyCc;         // JSON string
    private String status;           // DRAFT | PENDING_REVIEW | APPROVED | REJECTED
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
