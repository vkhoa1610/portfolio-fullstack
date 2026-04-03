package com.example.my_java_app.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class FinanceReportResponseDto {
    private Long id;
    private String userSub;
    private String title;
    private String reportType;
    private String fiscalPeriod;
    private String dueDate;
    private String description;
    private String priority;
    private BigDecimal totalAmount;
    private String currency;
    private String lineItems;
    private String attachments;
    private String approvalRoute;
    private String notifyCc;
    private String status;
    private String submittedAt;
    private String createdAt;
}
