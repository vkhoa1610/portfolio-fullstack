package com.example.my_java_app.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateFinanceReportRequestDto {
    private String title;
    private String reportType;
    private String fiscalPeriod;
    private String dueDate;
    private String description;
    private String priority;
    private BigDecimal totalAmount;
    private String currency;
    private String lineItems;     // JSON string
    private String attachments;   // JSON string
    private String approvalRoute; // JSON string
    private String notifyCc;      // JSON string
    private Boolean submitNow;    // true = PENDING_REVIEW, false/null = DRAFT
}
