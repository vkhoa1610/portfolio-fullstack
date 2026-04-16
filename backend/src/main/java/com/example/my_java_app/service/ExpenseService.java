package com.example.my_java_app.service;

import com.example.my_java_app.client.GroqClient;
import com.example.my_java_app.dto.request.CreateExpenseRequestDto;
import com.example.my_java_app.dto.response.ExpenseResponseDto;
import com.example.my_java_app.dto.response.ScanResponseDto;
import com.example.my_java_app.entity.ExpenseEntity;
import com.example.my_java_app.exception.NotFoundException;
import com.example.my_java_app.repository.ExpenseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private static final Logger log = LoggerFactory.getLogger(ExpenseService.class);

    private final ExpenseRepository expenseRepository;
    private final GroqClient groqClient;
    private final StorageService storageService;
    private final ObjectMapper objectMapper;

    public ExpenseService(ExpenseRepository expenseRepository,
                          GroqClient groqClient,
                          StorageService storageService,
                          ObjectMapper objectMapper) {
        this.expenseRepository = expenseRepository;
        this.groqClient = groqClient;
        this.storageService = storageService;
        this.objectMapper = objectMapper;
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

    private static final String RECEIPT_PROMPT =
            "You are a receipt OCR assistant. Extract the following fields from the receipt image.\n" +
            "Respond ONLY with a single valid JSON object — no markdown, no explanation, no extra text.\n\n" +
            "{\n" +
            "  \"vendor\": \"<store or merchant name>\",\n" +
            "  \"date\": \"<date in YYYY-MM-DD format, use today if not visible>\",\n" +
            "  \"amount\": <total amount as decimal number>,\n" +
            "  \"vatAmount\": <VAT amount as decimal number, 0 if not shown>,\n" +
            "  \"vatRate\": \"<VAT rate string e.g. '19%', 'N/A' if unknown>\",\n" +
            "  \"flags\": [\"<optional warnings like high amount, suspicious vendor, etc>\"]\n" +
            "}";

    /**
     * Scan a receipt image using Groq Vision.
     * Falls back to mock data if Groq is unavailable or returns invalid JSON.
     *
     * @param fileUrl the stored B2 URL of the uploaded receipt image
     */
    public ScanResponseDto scan(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            log.warn("scanWithGroq called with null/blank fileUrl — using mock");
            return mockScan();
        }

        try {
            // Generate a time-limited presigned GET URL that Groq can fetch
            String viewUrl = storageService.generateViewUrl(fileUrl);
            log.info("Calling Groq Vision for receipt: {}", fileUrl);

            String raw = groqClient.chatWithVision(viewUrl, RECEIPT_PROMPT);

            // Strip markdown code fences if model wrapped response in ```json ... ```
            String json = raw.trim();
            if (json.startsWith("```")) {
                json = json.replaceAll("(?s)^```[a-z]*\\s*", "").replaceAll("```\\s*$", "").trim();
            }

            JsonNode node = objectMapper.readTree(json);
            String vendor    = node.path("vendor").asText("Unknown Vendor");
            String date      = node.path("date").asText(LocalDateTime.now().toLocalDate().toString());
            double amount    = node.path("amount").asDouble(0.0);
            double vatAmount = node.path("vatAmount").asDouble(0.0);
            String vatRate   = node.path("vatRate").asText("N/A");

            List<String> flags = new ArrayList<>();
            JsonNode flagsNode = node.path("flags");
            if (flagsNode.isArray()) {
                flagsNode.forEach(f -> { if (!f.asText().isBlank()) flags.add(f.asText()); });
            }

            log.info("Groq Vision extracted: vendor={} amount={} date={}", vendor, amount, date);
            return new ScanResponseDto(vendor, date, BigDecimal.valueOf(amount), BigDecimal.valueOf(vatAmount), vatRate, flags);

        } catch (Exception e) {
            log.error("Groq Vision scan failed, falling back to mock: {}", e.getMessage());
            return mockScan();
        }
    }

    /**
     * Fallback mock data when Groq is unavailable.
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
