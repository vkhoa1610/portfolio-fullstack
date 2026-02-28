package com.example.my_java_app.service;

import com.example.my_java_app.dto.request.CreateExpenseRequestDto;
import com.example.my_java_app.dto.response.ExpenseResponseDto;
import com.example.my_java_app.dto.response.ScanResponseDto;
import com.example.my_java_app.entity.ExpenseEntity;
import com.example.my_java_app.exception.NotFoundException;
import com.example.my_java_app.repository.ExpenseRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    public ExpenseResponseDto create(String cognitoSub, CreateExpenseRequestDto dto) {
        ExpenseEntity entity = new ExpenseEntity();
        entity.setUserSub(cognitoSub);
        entity.setType(dto.getType());
        entity.setTitle(dto.getTitle());
        entity.setAmount(dto.getAmount());
        entity.setCurrency(dto.getCurrency() != null ? dto.getCurrency() : "EUR");
        entity.setVendorName(dto.getVendorName());
        entity.setVatAmount(dto.getVatAmount());
        entity.setReceiptFileUrl(dto.getReceiptFileUrl());
        entity.setAiExtractedData(dto.getAiExtractedData());
        entity.setAiFlags(dto.getAiFlags());
        entity.setCountryCode(dto.getCountryCode());
        entity.setPerDiemRate(dto.getPerDiemRate());
        entity.setPerDiemDays(dto.getPerDiemDays());
        entity.setDistanceKm(dto.getDistanceKm());
        entity.setRatePerKm(dto.getRatePerKm() != null ? dto.getRatePerKm() : new BigDecimal("0.30"));

        expenseRepository.save(entity);
        return toDto(entity);
    }

    public List<ExpenseResponseDto> listByUser(String cognitoSub) {
        return expenseRepository.findByUserSub(cognitoSub)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ExpenseResponseDto getById(Long id) {
        ExpenseEntity entity = expenseRepository.findById(id);
        if (entity == null) throw new NotFoundException("Expense not found: " + id);
        return toDto(entity);
    }

    public void submit(Long id) {
        ExpenseEntity entity = expenseRepository.findById(id);
        if (entity == null) throw new NotFoundException("Expense not found: " + id);
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        expenseRepository.updateStatus(id, "PENDING_REVIEW", now);
    }

    /**
     * Mock OCR — trả về dữ liệu giả để frontend test split-view
     */
    public ScanResponseDto mockScan() {
        return new ScanResponseDto(
                "REWE GmbH",
                LocalDateTime.now().toLocalDate().toString(),
                new BigDecimal("47.80"),
                new BigDecimal("7.63"),
                "19%",
                List.of()
        );
    }

    private ExpenseResponseDto toDto(ExpenseEntity e) {
        ExpenseResponseDto dto = new ExpenseResponseDto();
        dto.setId(e.getId());
        dto.setUserSub(e.getUserSub());
        dto.setType(e.getType());
        dto.setTitle(e.getTitle());
        dto.setAmount(e.getAmount());
        dto.setCurrency(e.getCurrency());
        dto.setStatus(e.getStatus());
        dto.setVendorName(e.getVendorName());
        dto.setReceiptDate(e.getReceiptDate() != null ? e.getReceiptDate().toString() : null);
        dto.setVatAmount(e.getVatAmount());
        dto.setReceiptFileUrl(e.getReceiptFileUrl());
        dto.setAiExtractedData(e.getAiExtractedData());
        dto.setAiFlags(e.getAiFlags());
        dto.setTripFrom(e.getTripFrom() != null ? e.getTripFrom().toString() : null);
        dto.setTripTo(e.getTripTo() != null ? e.getTripTo().toString() : null);
        dto.setCountryCode(e.getCountryCode());
        dto.setPerDiemRate(e.getPerDiemRate());
        dto.setPerDiemDays(e.getPerDiemDays());
        dto.setDistanceKm(e.getDistanceKm());
        dto.setRatePerKm(e.getRatePerKm());
        dto.setSubmittedAt(e.getSubmittedAt() != null ? e.getSubmittedAt().toString() : null);
        dto.setReviewedAt(e.getReviewedAt() != null ? e.getReviewedAt().toString() : null);
        dto.setReviewedBy(e.getReviewedBy());
        dto.setRejectionReason(e.getRejectionReason());
        dto.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return dto;
    }
}
