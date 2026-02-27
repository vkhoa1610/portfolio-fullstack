package com.example.my_java_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSettlementResponseDto {
    private String sourceAdmissionCode;
    private String destinationAdmissionCode;
    private Double entranceFeeSource;
    private Double entranceFeeDestination;
    private Double adjustmentFee;
    private List<Double> optionalFees;
    private Double totalBaseFee;
}
