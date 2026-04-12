package com.example.my_java_app.service;

import com.example.my_java_app.client.GroqClient;
import com.example.my_java_app.entity.ExpenseEntity;
import com.example.my_java_app.entity.ExpenseReportEntity;
import com.example.my_java_app.mapper.ExpenseMapper;
import com.example.my_java_app.repository.ExpenseReportRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExpenseReportService {

    private static final Logger log = LoggerFactory.getLogger(ExpenseReportService.class);

    private final ExpenseReportRepository reportRepository;
    private final ExpenseMapper expenseMapper;
    private final ObjectMapper objectMapper;
    private final GroqClient groqClient;

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    public ExpenseReportService(ExpenseReportRepository reportRepository,
                                ExpenseMapper expenseMapper,
                                ObjectMapper objectMapper,
                                GroqClient groqClient) {
        this.reportRepository = reportRepository;
        this.expenseMapper    = expenseMapper;
        this.objectMapper     = objectMapper;
        this.groqClient       = groqClient;
    }

    /** Create a PENDING job and return its id — caller fires async runJob() */
    public Long createJob(String period) {
        ExpenseReportEntity entity = new ExpenseReportEntity();
        entity.setPeriod(period);
        reportRepository.save(entity);
        return entity.getId();
    }

    public ExpenseReportEntity findById(Long id) {
        return reportRepository.findById(id);
    }

    public ExpenseReportEntity findLatestDone() {
        return reportRepository.findLatestDone();
    }

    /** Async: aggregate DB → build JSON → call (mock) AI → persist result */
    public void runJob(Long jobId, String period) {
        String now = LocalDateTime.now().format(DT_FMT);
        try {
            // 1. Parse period "2026-03" → year + month
            String[] parts = period.split("-");
            int year  = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);

            // 2. Fetch expenses from DB
            List<ExpenseEntity> expenses = expenseMapper.findApprovedByPeriod(year, month);

            // 3. Aggregate into report payload
            Map<String, Object> payload = buildPayload(period, expenses);
            String reportDataJson = objectMapper.writeValueAsString(payload);

            // 4. Call Ollama (falls back to mock if Ollama unavailable)
            String markdown = callAi(payload);

            // 5. Persist DONE
            reportRepository.markDone(jobId, reportDataJson, markdown, now);

        } catch (Exception e) {
            reportRepository.markFailed(jobId, e.getMessage(), now);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private Map<String, Object> buildPayload(String period, List<ExpenseEntity> expenses) {
        BigDecimal total = expenses.stream()
                .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // By category
        Map<String, List<ExpenseEntity>> byType = expenses.stream()
                .collect(Collectors.groupingBy(ExpenseEntity::getType));

        Map<String, Object> byCategory = new LinkedHashMap<>();
        byType.forEach((type, list) -> {
            BigDecimal sum = list.stream()
                    .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            byCategory.put(type, Map.of("count", list.size(), "amount", sum));
        });

        // By employee (top 5)
        Map<String, List<ExpenseEntity>> bySub = expenses.stream()
                .collect(Collectors.groupingBy(ExpenseEntity::getUserSub));

        List<Map<String, Object>> byEmployee = bySub.entrySet().stream()
                .map(e -> {
                    BigDecimal empTotal = e.getValue().stream()
                            .map(ex -> ex.getAmount() != null ? ex.getAmount() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return (Map<String, Object>) new LinkedHashMap<String, Object>(Map.of(
                            "sub", e.getKey(),
                            "count", e.getValue().size(),
                            "amount", empTotal
                    ));
                })
                .sorted(Comparator.comparing(m -> ((BigDecimal) m.get("amount")).negate()))
                .limit(5)
                .collect(Collectors.toList());

        // Top 3 expenses
        List<Map<String, Object>> topExpenses = expenses.stream()
                .limit(3)
                .map(e -> (Map<String, Object>) new LinkedHashMap<String, Object>(Map.of(
                        "id", e.getId(),
                        "amount", e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO,
                        "type", e.getType(),
                        "title", e.getTitle() != null ? e.getTitle() : ""
                )))
                .collect(Collectors.toList());

        // Anomalies: expenses > 2x average
        BigDecimal avg = expenses.isEmpty() ? BigDecimal.ZERO
                : total.divide(BigDecimal.valueOf(expenses.size()), 2, RoundingMode.HALF_UP);

        List<Map<String, Object>> anomalies = expenses.stream()
                .filter(e -> e.getAmount() != null && e.getAmount().compareTo(avg.multiply(BigDecimal.valueOf(2))) > 0)
                .map(e -> (Map<String, Object>) new LinkedHashMap<String, Object>(Map.of(
                        "id", e.getId(),
                        "amount", e.getAmount(),
                        "avgAmount", avg,
                        "title", e.getTitle() != null ? e.getTitle() : ""
                )))
                .collect(Collectors.toList());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("period", period);
        payload.put("generatedAt", LocalDateTime.now().format(DT_FMT));
        payload.put("summary", Map.of(
                "totalAmount", total,
                "expenseCount", expenses.size(),
                "avgAmount", avg
        ));
        payload.put("byCategory", byCategory);
        payload.put("byEmployee", byEmployee);
        payload.put("topExpenses", topExpenses);
        payload.put("anomalies", anomalies);

        return payload;
    }

    /**
     * Try real Ollama call; fall back to mock if Ollama is unavailable.
     */
    private String callAi(Map<String, Object> payload) {
        try {
            String prompt = buildPrompt(payload);
            String result = groqClient.chat(prompt);
            log.info("AI report generated via Ollama");
            return result;
        } catch (Exception e) {
            log.warn("Ollama unavailable ({}), falling back to mock report", e.getMessage());
            return mockAiCall(payload);
        }
    }

    private String buildPrompt(Map<String, Object> payload) throws Exception {
        String jsonSummary = objectMapper.writeValueAsString(payload);
        return """
                You are a financial analyst assistant. Analyze the following expense report data
                and write a concise financial summary in Markdown format.

                Use these sections:
                ## Executive Summary
                ## Breakdown by Category
                ## Anomalies Detected
                ## Recommendations

                Use **bold** for key numbers. Use bullet lists where appropriate.
                Write in English. Be concise and professional.

                Expense data (JSON):
                """ + jsonSummary;
    }

    /**
     * Mock AI call — used when Ollama is unavailable.
     */
    @SuppressWarnings("unchecked")
    private String mockAiCall(Map<String, Object> payload) {
        Map<String, Object> summary    = (Map<String, Object>) payload.get("summary");
        Map<String, Object> byCategory = (Map<String, Object>) payload.get("byCategory");
        List<?>             anomalies  = (List<?>) payload.get("anomalies");
        String period       = (String) payload.get("period");
        BigDecimal total    = (BigDecimal) summary.get("totalAmount");
        int count           = (int) summary.get("expenseCount");
        BigDecimal avg      = (BigDecimal) summary.get("avgAmount");

        StringBuilder sb = new StringBuilder();

        sb.append("## Executive Summary\n\n");
        sb.append("Period **").append(period).append("** recorded **")
          .append(count).append(" expense(s)** totalling **€")
          .append(total.setScale(2, RoundingMode.HALF_UP)).append("**.\n");
        sb.append("Average expense amount: **€").append(avg.setScale(2, RoundingMode.HALF_UP)).append("**.\n\n");

        sb.append("## Breakdown by Category\n\n");
        if (byCategory.isEmpty()) {
            sb.append("No categorised expenses found for this period.\n\n");
        } else {
            byCategory.forEach((type, data) -> {
                Map<String, Object> d = (Map<String, Object>) data;
                sb.append("- **").append(type).append("**: ")
                  .append(d.get("count")).append(" item(s), €")
                  .append(((BigDecimal) d.get("amount")).setScale(2, RoundingMode.HALF_UP))
                  .append("\n");
            });
            sb.append("\n");
        }

        sb.append("## Anomalies Detected\n\n");
        if (anomalies.isEmpty()) {
            sb.append("No anomalies detected. All expenses are within normal range.\n\n");
        } else {
            sb.append(anomalies.size()).append(" expense(s) exceeded 2× the period average:\n\n");
            anomalies.forEach(a -> {
                Map<String, Object> item = (Map<String, Object>) a;
                sb.append("- Expense #").append(item.get("id"))
                  .append(" **\"").append(item.get("title")).append("\"**")
                  .append(" — €").append(((BigDecimal) item.get("amount")).setScale(2, RoundingMode.HALF_UP))
                  .append(" (avg €").append(((BigDecimal) item.get("avgAmount")).setScale(2, RoundingMode.HALF_UP)).append(")\n");
            });
            sb.append("\n");
        }

        sb.append("## Recommendations\n\n");
        if (count == 0) {
            sb.append("- No expenses submitted this period. Encourage teams to submit outstanding claims.\n");
        } else {
            sb.append("- Review anomalous expenses above for potential policy violations.\n");
            sb.append("- Ensure all RECEIPT expenses have valid vendor receipts attached.\n");
            sb.append("- Consider setting stricter per-category budget limits if RECEIPT spend is high.\n");
        }

        return sb.toString();
    }
}
