package com.example.my_java_app.service;

import com.example.my_java_app.dto.response.ExpenseResponseDto;
import com.example.my_java_app.entity.ExpenseEntity;
import com.example.my_java_app.exception.ApiException;
import com.example.my_java_app.exception.ConflictException;
import com.example.my_java_app.exception.NotFoundException;
import com.example.my_java_app.repository.ExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ManagerService {

    private static final List<String> ALL_REVIEW_STATUSES =
            List.of("PENDING_REVIEW", "APPROVED", "REJECTED", "PAID");
    private static final Set<String> VALID_STATUS_PARAMS =
            Set.of("PENDING_REVIEW", "APPROVED", "REJECTED", "PAID", "ALL");

    private final ExpenseRepository expenseRepository;

    public ManagerService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    /** @param status one of PENDING_REVIEW/APPROVED/REJECTED/PAID/ALL (case-sensitive) */
    @Transactional(readOnly = true)
    public List<ExpenseResponseDto> getByStatus(String status) {
        if (!VALID_STATUS_PARAMS.contains(status)) {
            throw new ApiException("Invalid status filter: " + status);
        }
        List<String> statuses = "ALL".equals(status) ? ALL_REVIEW_STATUSES : List.of(status);
        return expenseRepository.findForManagerByStatus(statuses)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public void approve(Long id, String managerSub) {
        ExpenseEntity entity = expenseRepository.findById(id);
        if (entity == null) throw new NotFoundException("Expense not found: " + id);
        if (!"PENDING_REVIEW".equals(entity.getStatus())) {
            throw new ConflictException("Expense " + id + " is no longer pending review (current status: " + entity.getStatus() + ")");
        }
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        int updated = expenseRepository.updateReview(id, "APPROVED", managerSub, now, null);
        if (updated == 0) {
            throw new ConflictException("Expense " + id + " was reviewed by someone else just now");
        }
    }

    public void reject(Long id, String managerSub, String reason) {
        ExpenseEntity entity = expenseRepository.findById(id);
        if (entity == null) throw new NotFoundException("Expense not found: " + id);
        if (!"PENDING_REVIEW".equals(entity.getStatus())) {
            throw new ConflictException("Expense " + id + " is no longer pending review (current status: " + entity.getStatus() + ")");
        }
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        int updated = expenseRepository.updateReview(id, "REJECTED", managerSub, now, reason);
        if (updated == 0) {
            throw new ConflictException("Expense " + id + " was reviewed by someone else just now");
        }
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
        dto.setSubmitterName(e.getSubmitterName());
        dto.setDuplicateOfId(e.getDuplicateOfId());
        dto.setDuplicateOfStatus(e.getDuplicateOfStatus());
        dto.setReviewerName(e.getReviewerName());
        return dto;
    }
}
