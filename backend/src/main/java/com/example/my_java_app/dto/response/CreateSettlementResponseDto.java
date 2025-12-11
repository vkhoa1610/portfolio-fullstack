package com.example.my_java_app.dto.response;

import java.util.List;

public class CreateSettlementResponseDto {

    private String sourceAdmissionCode;
    private String destinationAdmissionCode;

    private Double entranceFeeSource;
    private Double entranceFeeDestination;
    private Double adjustmentFee;

    private List<Double> optionalFees;
    private Double totalBaseFee;

    public CreateSettlementResponseDto() {}

    public CreateSettlementResponseDto(
            String sourceAdmissionCode,
            String destinationAdmissionCode,
            Double entranceFeeSource,
            Double entranceFeeDestination,
            Double adjustmentFee,
            List<Double> optionalFees,
            Double totalBaseFee
    ) {
        this.sourceAdmissionCode = sourceAdmissionCode;
        this.destinationAdmissionCode = destinationAdmissionCode;
        this.entranceFeeSource = entranceFeeSource;
        this.entranceFeeDestination = entranceFeeDestination;
        this.adjustmentFee = adjustmentFee;
        this.optionalFees = optionalFees;
        this.totalBaseFee = totalBaseFee;
    }

    public String getSourceAdmissionCode() {
        return sourceAdmissionCode;
    }

    public String getDestinationAdmissionCode() {
        return destinationAdmissionCode;
    }

    public Double getEntranceFeeSource() {
        return entranceFeeSource;
    }

    public Double getEntranceFeeDestination() {
        return entranceFeeDestination;
    }

    public Double getAdjustmentFee() {
        return adjustmentFee;
    }

    public List<Double> getOptionalFees() {
        return optionalFees;
    }

    public Double getTotalBaseFee() {
        return totalBaseFee;
    }
}
