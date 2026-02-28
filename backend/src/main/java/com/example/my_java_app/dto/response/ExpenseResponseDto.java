package com.example.my_java_app.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ExpenseResponseDto {
    private Long id;
    private String userSub;
    private String type;
    private String title;
    private BigDecimal amount;
    private String currency;
    private String status;

    // Receipt
    private String vendorName;
    private String receiptDate;
    private BigDecimal vatAmount;
    private String receiptFileUrl;
    private String aiExtractedData;
    private String aiFlags;

    // Per Diem
    private String tripFrom;
    private String tripTo;
    private String countryCode;
    private BigDecimal perDiemRate;
    private Integer perDiemDays;

    // Mileage
    private BigDecimal distanceKm;
    private BigDecimal ratePerKm;

    // Workflow
    private String submittedAt;
    private String reviewedAt;
    private String reviewedBy;
    private String rejectionReason;

    private String createdAt;
}
