# Admin — AI Expense Report (Flow 6)

> Chỉ dành cho `system_admins`. 3 endpoints để trigger, poll, và lấy kết quả report.

## Process Flow

```
Admin POST /generate?period=2026-03
  → ExpenseReportController.generate()
  → validate period format (yyyy-MM)
  → reportService.createJob("2026-03")
      → INSERT expense_reports (status=PENDING) → trả jobId
  → return { jobId, status: "PENDING" } ngay lập tức
  → CompletableFuture.runAsync → reportService.runJob(jobId, period)

Background thread (runJob):
  → findApprovedByPeriod(2026, 3) — query DB expenses
  → buildPayload() — aggregate totalAmount, byCategory, byEmployee, anomalies
  → mockAiCall(payload) — sinh markdown (TODO: thay bằng LM Studio)
  → markDone(jobId, reportDataJson, markdown)
  → nếu lỗi → markFailed(jobId, errorMsg)
```

---

## DB Table

**`expense_reports`**

| Cột | Type | Ghi chú |
|-----|------|---------|
| id | BIGINT AUTO_INCREMENT | PK |
| period | VARCHAR(7) | Định dạng "yyyy-MM" |
| status | ENUM(PENDING, DONE, FAILED) | Default PENDING |
| report_data | JSON | Payload aggregate gửi cho AI |
| markdown | LONGTEXT | Kết quả AI sinh ra |
| error_msg | VARCHAR(500) | Lý do thất bại (nếu FAILED) |
| generated_at | DATETIME | Thời điểm hoàn thành job |
| created_at | TIMESTAMP | Thời điểm tạo job |

---

## API Endpoints

### POST `/api/v1/admin/reports/generate?period=2026-03`

Tạo job mới và trigger async.

**Input**: query param `period` (bắt buộc, format `yyyy-MM`)

**Output**:
```json
{ "jobId": 42, "status": "PENDING" }
```

---

### GET `/api/v1/admin/reports/status/{jobId}`

Poll trạng thái job.

**Output (PENDING)**:
```json
{ "id": 42, "period": "2026-03", "status": "PENDING", "markdown": null, "generatedAt": null }
```

**Output (DONE)**:
```json
{
  "id": 42, "period": "2026-03", "status": "DONE",
  "markdown": "## Executive Summary\n...",
  "reportData": "{\"period\":\"2026-03\",...}",
  "generatedAt": "2026-03-19T14:30:00"
}
```

---

### GET `/api/v1/admin/reports/latest`

Lấy report DONE mới nhất.

**Output (có report)**:
```json
{ "exists": true, "id": 42, "period": "2026-03", "status": "DONE", "markdown": "..." }
```

**Output (chưa có)**:
```json
{ "exists": false }
```

---

## Java Files

| File | Mô tả |
|------|-------|
| `ExpenseReportEntity.java` | Maps table `expense_reports` |
| `ExpenseReportMapper.java` | Interface: insert, findById, findLatestDone, updateDone, updateFailed |
| `ExpenseReportMapper.xml` | SQL queries |
| `ExpenseReportRepository.java` | Wrapper service layer |
| `ExpenseReportService.java` | createJob, runJob, buildPayload, mockAiCall |
| `ExpenseReportController.java` | 3 REST endpoints |

---

## Lỗi

| Status | Trường hợp |
|--------|-----------|
| 400 | period không đúng format yyyy-MM |
| 403 | cognitoSub không có trong system_admins |
| 404 | jobId không tồn tại (GET status) |

---

## TODO

- Thay `mockAiCall()` bằng real POST đến LM Studio (`http://localhost:1234/v1/chat/completions`)
- Thêm pagination cho `findLatestDone` → `findAllDone`
