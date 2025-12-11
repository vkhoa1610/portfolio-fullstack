package com.example.my_java_app.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateSettlementRequestDto {

    @NotNull(message = "admissionProcedureId is required")
    private Long admissionProcedureId;

    @NotNull(message = "admissionProcedureAnyAmount list is required")
    private Long[] admissionProcedureAnyAmount;

    @NotNull(message = "beforeCode is required")
    private Integer beforeCode;   // 0 = before payment, 1 = return from provider

    @NotNull(message = "sett_type_fee is required")
    private Integer sett_type_fee; // 1 = credit, 2 = ibanking
}
