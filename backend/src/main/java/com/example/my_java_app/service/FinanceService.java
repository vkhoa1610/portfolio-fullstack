package com.example.my_java_app.service;

import com.example.my_java_app.dto.response.ExpenseResponseDto;
import com.example.my_java_app.entity.ExpenseEntity;
import com.example.my_java_app.exception.NotFoundException;
import com.example.my_java_app.mapper.ExpenseMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FinanceService {

    private static final Logger log = LoggerFactory.getLogger(FinanceService.class);

    private final ExpenseMapper expenseMapper;

    public FinanceService(ExpenseMapper expenseMapper) {
        this.expenseMapper = expenseMapper;
    }

    /** Finance overview — returns all APPROVED + PAID expenses */
    @Transactional(readOnly = true)
    public List<ExpenseResponseDto> listAll() {
        return expenseMapper.findAllApprovedAndPaid()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /** Mark single expense as PAID */
    public void pay(Long id) {
        ExpenseEntity entity = expenseMapper.findById(id);
        if (entity == null) throw new NotFoundException("Expense not found: " + id);
        if (!"APPROVED".equals(entity.getStatus())) {
            throw new IllegalStateException("Expense " + id + " is not APPROVED (status=" + entity.getStatus() + ")");
        }
        expenseMapper.markPaid(id);
        log.info("Expense {} marked as PAID", id);
    }

    /** Bulk mark list of expenses as PAID */
    public int batchPay(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return 0;
        expenseMapper.markBatchPaid(ids);
        log.info("Batch-paid {} expense(s): {}", ids.size(), ids);
        return ids.size();
    }

    /**
     * Scheduled job: auto batch-pay all APPROVED expenses.
     * Runs on day 15 and last day of every month at 08:00.
     *   "0 0 8 15 * ?"        → 15th of every month
     *   "0 0 8 L  * ?"        → last day of every month
     * Using two @Scheduled triggers via a combined cron is not possible in
     * standard Spring, so we use day-of-month check inside a daily trigger.
     */
    @Scheduled(cron = "0 0 8 * * ?")   // run every day at 08:00 — filter inside
    public void scheduledBatchPay() {
        int day = LocalDateTime.now().getDayOfMonth();
        int lastDay = LocalDateTime.now().toLocalDate().lengthOfMonth();
        if (day != 15 && day != lastDay) return;

        List<ExpenseEntity> approved = expenseMapper.findAllApproved();
        if (approved.isEmpty()) {
            log.info("[ScheduledBatchPay] No APPROVED expenses to process.");
            return;
        }
        List<Long> ids = approved.stream().map(ExpenseEntity::getId).collect(Collectors.toList());
        expenseMapper.markBatchPaid(ids);
        log.info("[ScheduledBatchPay] Auto-paid {} expense(s) on day {}", ids.size(), day);
    }

    // ─────────────────────────────────────────────────────────────

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
        dto.setPaidAt(e.getPaidAt() != null ? e.getPaidAt().toString() : null);
        dto.setRetentionExpiresAt(e.getRetentionExpiresAt() != null ? e.getRetentionExpiresAt().toString() : null);
        dto.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return dto;
    }
}
