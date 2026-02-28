package com.example.my_java_app.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateExpenseRequestDto {
    private String type;        // RECEIPT | PER_DIEM | MILEAGE
    private String title;
    private BigDecimal amount;
    private String currency;

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
}
