# Backend — Finance Reports

> Cập nhật: 2026-03-26 (Session 8 — Flow 11)

## DB Table: `finance_reports`

```sql
CREATE TABLE finance_reports (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_sub        VARCHAR(36)  NOT NULL,
    title           VARCHAR(255) NOT NULL,
    report_type     ENUM('FINANCIAL','ANALYTICS','OPERATIONS','COMPLIANCE') NOT NULL,
    fiscal_period   VARCHAR(20),
    due_date        DATE,
    description     TEXT,
    priority        ENUM('LOW','NORMAL','HIGH','URGENT') DEFAULT 'NORMAL',
    total_amount    DECIMAL(15,2),
    currency        VARCHAR(3)   DEFAULT 'EUR',
    line_items      JSON,        -- [{description, category: OPEX|CAPEX, amount}]
    attachments     JSON,        -- [{fileUrl, fileName, fileSize, fileType: PRIMARY|SUPPORTING}]
    approval_route  JSON,        -- [{level, reviewerName, deadlineDays}]
    notify_cc       JSON,        -- [{name}]
    status          ENUM('DRAFT','PENDING_REVIEW','APPROVED','REJECTED') DEFAULT 'DRAFT',
    submitted_at    TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1)   DEFAULT 0,
    CONSTRAINT fk_fr_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub)
);
```

**Lý do dùng JSON**: portfolio project — tránh tạo thêm 3-4 tables liên kết; đủ để demo, dễ parse với Gson.

## Java Files

| File | Mô tả |
|------|-------|
| `entity/FinanceReportEntity.java` | Map `finance_reports` table |
| `dto/request/CreateFinanceReportRequestDto.java` | Input từ BFF — JSON fields là String |
| `dto/response/FinanceReportResponseDto.java` | Output về BFF |
| `mapper/FinanceReportMapper.java` | Interface: `insert`, `findAll`, `findById`, `updateStatus` |
| `mapper/FinanceReportMapper.xml` | MyBatis XML |
| `repository/FinanceReportRepository.java` | Wrapper gọi mapper |
| `service/FinanceReportService.java` | `create(sub, req)` + `listAll()` |

## POST `/api/v1/finance/reports`

**Permission guard**: `FINANCE_VIEW`

**Request Body**: `CreateFinanceReportRequestDto`
- `title` (required), `reportType` (required)
- `fiscalPeriod`, `dueDate`, `description`, `priority`
- `totalAmount`, `currency`
- `lineItems` — JSON string
- `attachments` — JSON string
- `approvalRoute` — JSON string
- `notifyCc` — JSON string
- `submitNow` — boolean: `true` → status=PENDING_REVIEW; `false` → status=DRAFT

**Response**: `FinanceReportResponseDto`

## GET `/api/v1/finance/reports`

**Permission guard**: `FINANCE_VIEW`

**Response**: `List<FinanceReportResponseDto>`, order by `created_at DESC`, `is_deleted = 0`
