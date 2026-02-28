package com.example.my_java_app.service;

import com.example.my_java_app.dto.response.ExpenseResponseDto;
import com.example.my_java_app.entity.ExpenseEntity;
import com.example.my_java_app.exception.NotFoundException;
import com.example.my_java_app.repository.ExpenseRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ManagerService {

    private final ExpenseRepository expenseRepository;

    public ManagerService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    public List<ExpenseResponseDto> getPending() {
        return expenseRepository.findPendingForManager()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public void approve(Long id, String managerSub) {
        ExpenseEntity entity = expenseRepository.findById(id);
        if (entity == null) throw new NotFoundException("Expense not found: " + id);
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        expenseRepository.updateReview(id, "APPROVED", managerSub, now, null);
    }

    public void reject(Long id, String managerSub, String reason) {
        ExpenseEntity entity = expenseRepository.findById(id);
        if (entity == null) throw new NotFoundException("Expense not found: " + id);
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        expenseRepository.updateReview(id, "REJECTED", managerSub, now, reason);
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
