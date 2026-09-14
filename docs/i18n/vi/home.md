# FintechSaaS Expense Platform — Tài liệu kỹ thuật

Nền tảng quản lý chi phí doanh nghiệp với OCR chạy bằng AI,
xuất dữ liệu DATEV / SEPA / XRechnung, và xử lý dữ liệu tuân thủ GDPR.

## Liên kết nhanh

- [Kiến trúc hệ thống](./architecture.md) — Sơ đồ C4, tech stack
- [Vòng đời chi phí](./expense-lifecycle.md) — State machine, sequence diagram
- [GDPR / DSGVO](./gdpr-compliance.md) — Phân loại dữ liệu, quy trình xoá dữ liệu
- [Ghi chú GoBD](./gobd-notes.md) — Lưu trữ 10 năm, tính bất biến
- [Tham chiếu API](./api-reference.md) — Toàn bộ endpoint theo vai trò
- [Xuất thuế](./tax-export.md) — DATEV CSV, SEPA XML, XRechnung
- [Hướng dẫn demo](./demo-guide.md) — Đăng nhập demo 1-click, kịch bản test

## Tài khoản demo

| Vai trò   | Tên            | Cách đăng nhập                |
|-----------|----------------|-------------------------------|
| Nhân viên | Anna Müller    | Bấm 1 lần trên /auth/login    |
| Quản lý   | Thomas Weber   | Bấm 1 lần trên /auth/login    |
| Kế toán   | Sarah Chen     | Bấm 1 lần trên /auth/login    |
| Quản trị  | David Kim      | Bấm 1 lần trên /auth/login    |
