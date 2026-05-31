package com.example.my_java_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GdprErasureRequestDto {
    /** ID of the {@code ERASURE_REQUESTED} row in gdpr_audit_log. */
    private Long requestId;
    private String subjectSub;
    private String subjectToken;
    /** PENDING | PROCESSING | COMPLETED */
    private String status;
    private String requestedAt;
    private String deadlineAt;
    /** Days remaining until the GDPR Art. 12 30-day deadline. Negative if overdue. */
    private long daysRemaining;
    private String reason;
}
