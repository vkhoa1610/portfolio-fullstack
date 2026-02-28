package com.example.my_java_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class ScanResponseDto {
    private String vendor;
    private String date;
    private BigDecimal amount;
    private BigDecimal vatAmount;
    private String vatRate;
    private List<String> flags;
}
