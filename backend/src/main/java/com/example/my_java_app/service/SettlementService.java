package com.example.my_java_app.service;

import com.example.my_java_app.annotation.Write;
import com.example.my_java_app.dto.request.CreateSettlementRequestDto;
import com.example.my_java_app.dto.response.CreateSettlementResponseDto;
import com.example.my_java_app.entity.AdmissionProcedureAnyAmountEntity;
import com.example.my_java_app.entity.AdmissionProcedureEntity;
import com.example.my_java_app.exception.ApiException;
import com.example.my_java_app.exception.NotFoundException;
import com.example.my_java_app.repository.AdmissionProcedureAnyAmountRepository;
import com.example.my_java_app.repository.AdmissionProcedureRepository;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class SettlementService {

    private final AdmissionProcedureRepository admissionProcedureRepo;
    private final AdmissionProcedureAnyAmountRepository anyAmountRepo;

    public SettlementService(
            AdmissionProcedureRepository admissionProcedureRepo,
            AdmissionProcedureAnyAmountRepository anyAmountRepo) {
        this.admissionProcedureRepo = admissionProcedureRepo;
        this.anyAmountRepo = anyAmountRepo;
    }

    // ============================
    // 🎯 ENTRY POINT
    // ============================
    @Write
    public CreateSettlementResponseDto handleCreateSettlement(CreateSettlementRequestDto dto) {

        ProcessState state = new ProcessState();
        state.admissionProcedureId = dto.getAdmissionProcedureId();
        state.optionalFeeIds = dto.getAdmissionProcedureAnyAmount();
        state.beforeCode = dto.getBeforeCode();
        state.settTypeFee = dto.getSett_type_fee();
        log.info("Admission source ID = {}");
        log.info("Admission source ID = {}", dto.getAdmissionProcedureId());
        step2_1_loadAdmissionProcedure(state);
        step2_2_loadOptionalFees(state);
        step2_3_calcAdjustmentFee(state);

        return buildResponse(state);
    }

    // ============================
    // STEP 2-1: load nguồn/đích
    // ============================

    public void step2_1_loadAdmissionProcedure(ProcessState state) {

        AdmissionProcedureEntity source = admissionProcedureRepo.findById(state.admissionProcedureId);

        if (source == null) {
            throw new NotFoundException("Source admission_procedure not found");
        }

        state.source = source;
        state.entranceFeeSource = source.getEntranceFee();

        // Destination (transfer)
        if (source.getDestinationAdmissionProcedureId() != null) {

            AdmissionProcedureEntity dest = admissionProcedureRepo
                    .findById(source.getDestinationAdmissionProcedureId());

            if (dest == null) {
                throw new NotFoundException("Destination admission_procedure not found");
            }

            state.destination = dest;
            state.entranceFeeDestination = dest.getEntranceFee();
        } else {
            state.entranceFeeDestination = 0.0;
        }
    }

    // ============================
    // STEP 2-2: load optional fees
    // ============================
    private void step2_2_loadOptionalFees(ProcessState state) {

        if (state.optionalFeeIds == null)
            return;

        for (Long id : state.optionalFeeIds) {
            AdmissionProcedureAnyAmountEntity e = anyAmountRepo.findById(id);
            if (e == null) {
                throw new NotFoundException("Optional fee not found: " + id);
            }
            state.optionalFees.add(e.getEntranceFee());
        }
    }

    // ============================
    // STEP 2-3: tính phí chênh lệch
    // ============================
    private void step2_3_calcAdjustmentFee(ProcessState state) {

        double src = state.entranceFeeSource;
        double dst = state.entranceFeeDestination;

        state.adjustmentFee = dst - src;

        double total = src + state.adjustmentFee;

        for (Double fee : state.optionalFees) {
            total += fee;
        }

        state.totalBaseFee = total;
    }

    // ============================
    // 🎯 BUILD RESPONSE
    // ============================
    private CreateSettlementResponseDto buildResponse(ProcessState state) {
        return new CreateSettlementResponseDto(
                state.source != null ? String.valueOf(state.source.getIdAdmissionProcedure()) : null,
                state.destination != null ? String.valueOf(state.destination.getIdAdmissionProcedure()) : null,
                state.entranceFeeSource,
                state.entranceFeeDestination,
                state.adjustmentFee,
                state.optionalFees,
                state.totalBaseFee);
    }

    // =======================================================
    // 🟦 INNER CLASS ProcessState – dành riêng cho 1 request
    // =======================================================
    private static class ProcessState {

        private Long admissionProcedureId;
        private Long[] optionalFeeIds;
        private Integer settTypeFee;
        private Integer beforeCode;

        private AdmissionProcedureEntity source;
        private AdmissionProcedureEntity destination;

        private Double entranceFeeSource;
        private Double entranceFeeDestination;
        private Double adjustmentFee;

        private List<Double> optionalFees = new ArrayList<>();
        private Double totalBaseFee;
    }
}
