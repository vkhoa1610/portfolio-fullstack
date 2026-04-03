package com.example.my_java_app.service;

import com.example.my_java_app.dto.request.CreateFinanceReportRequestDto;
import com.example.my_java_app.dto.response.FinanceReportResponseDto;
import com.example.my_java_app.entity.FinanceReportEntity;
import com.example.my_java_app.repository.FinanceReportRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FinanceReportService {

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final FinanceReportRepository repository;

    public FinanceReportService(FinanceReportRepository repository) {
        this.repository = repository;
    }

    public FinanceReportResponseDto create(String userSub, CreateFinanceReportRequestDto req) {
        FinanceReportEntity entity = new FinanceReportEntity();
        entity.setUserSub(userSub);
        entity.setTitle(req.getTitle());
        entity.setReportType(req.getReportType());
        entity.setFiscalPeriod(req.getFiscalPeriod());
        entity.setDueDate(req.getDueDate() != null ? LocalDate.parse(req.getDueDate()) : null);
        entity.setDescription(req.getDescription());
        entity.setPriority(req.getPriority() != null ? req.getPriority() : "NORMAL");
        entity.setTotalAmount(req.getTotalAmount());
        entity.setCurrency(req.getCurrency() != null ? req.getCurrency() : "EUR");
        entity.setLineItems(req.getLineItems());
        entity.setAttachments(req.getAttachments());
        entity.setApprovalRoute(req.getApprovalRoute());
        entity.setNotifyCc(req.getNotifyCc());

        boolean submit = Boolean.TRUE.equals(req.getSubmitNow());
        entity.setStatus(submit ? "PENDING_REVIEW" : "DRAFT");
        entity.setSubmittedAt(submit ? LocalDateTime.now() : null);

        repository.insert(entity);
        return toDto(entity);
    }

    public List<FinanceReportResponseDto> listAll() {
        return repository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────

    private FinanceReportResponseDto toDto(FinanceReportEntity e) {
        FinanceReportResponseDto dto = new FinanceReportResponseDto();
        dto.setId(e.getId());
        dto.setUserSub(e.getUserSub());
        dto.setTitle(e.getTitle());
        dto.setReportType(e.getReportType());
        dto.setFiscalPeriod(e.getFiscalPeriod());
        dto.setDueDate(e.getDueDate() != null ? e.getDueDate().toString() : null);
        dto.setDescription(e.getDescription());
        dto.setPriority(e.getPriority());
        dto.setTotalAmount(e.getTotalAmount());
        dto.setCurrency(e.getCurrency());
        dto.setLineItems(e.getLineItems());
        dto.setAttachments(e.getAttachments());
        dto.setApprovalRoute(e.getApprovalRoute());
        dto.setNotifyCc(e.getNotifyCc());
        dto.setStatus(e.getStatus());
        dto.setSubmittedAt(e.getSubmittedAt() != null ? e.getSubmittedAt().format(DT_FMT) : null);
        dto.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().format(DT_FMT) : null);
        return dto;
    }
}
