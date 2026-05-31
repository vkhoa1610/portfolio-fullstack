Tất cả wiring đầy đủ. Tổng kết Phase 2:

Backend
File	Vai trò
GdprController.java	4 endpoints dưới /api/v1/admin/gdpr, requireAdmin từng method
GdprErasureRequestDto / GdprDataMapDto / GdprAuditLogEntryDto	Response shapes
GdprMapper.java + XML	Thêm 4 count query (profiles, roles, policy_eval, users) cho data-map
GdprAuditLogMapper.java + XML	Thêm findById, findAllErasureRequests, findRecent, existsLaterEvent để derive status
GdprService.java	Fix bug nhỏ: ERASURE_COMPLETED giờ giữ subject_sub (thay vì null) để token nhất quán; expose subjectTokenFor thành public cho controller dùng
Logic chính trong controller:

listRequests → query toàn bộ ERASURE_REQUESTED → mỗi row derive status bằng hasLaterEvent (PENDING / PROCESSING / COMPLETED) và compute daysRemaining = (requestedAt + 30 days) - today
dataMap/{sub} → 6 count query song song, gắn classification từng table
process/{id} → fetch request row → gọi pseudonymizeFinancialData rồi hardDeletePersonalData → trả về summary
audit-log?subjectSub= → backend tự hash sang subject_token (frontend không bao giờ thấy hash)
BFF
4 endpoints mới: adm-018 → adm-021 (GET requests, GET data-map/:sub, POST process/:id, GET audit-log)

Frontend
File	Vai trò
adminApi.ts	4 endpoints + 3 cache tags + invalidation chain khi process
types.ts	5 type mới (GdprErasureRequest, GdprDataMap, GdprAuditEntry, ...)
admin-user-detail-view.tsx	Wrap 2 section cũ thành 3 tabs: Permissions / UI Functions / Privacy & GDPR
gdpr-privacy-panel.tsx	3 section: erasure request status + countdown, data map accordion, audit timeline
gdpr-confirm-modal.tsx	Modal với 4-item checklist, nút disable đến khi tất cả ticked
Schema
TableMaster.sql cập nhật đầy đủ Phase 1 + Phase 2 changes (policies.policy_type, user_consents drop FK + consent_method, expenses widen + paid_at + retention_expires_at, table mới gdpr_audit_log).

db_fix.sql thêm 1 row demo ERASURE_REQUESTED cho Anna Müller — sau khi recreate DB, queue sẽ hiển thị ngay 1 pending request để demo.

Demo flow
Login as admin → vào /admin/users → click vào Anna Müller
Tab "Privacy & GDPR" → thấy pending request (~30 ngày remaining)
Bấm "Process erasure" → modal hiện checklist 4 mục
Tick hết → bấm "Confirm erasure" → backend chạy 2-phase erasure → audit log timeline xuất hiện thêm 3 events (PSEUDONYMIZED → PII_DELETED → COMPLETED)
Data map sau đó hiển thị 0 rows cho users/user_profiles/user_roles; consents/expenses vẫn còn nhưng user_sub đã anonymized
Phase 3 (employee /profile/privacy) và Phase 4 (finance retention badge) sẽ làm sau khi user yêu cầu.