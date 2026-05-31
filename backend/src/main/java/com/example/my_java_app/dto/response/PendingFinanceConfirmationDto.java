package com.example.my_java_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * One pending GoBD pseudonymization awaiting Finance's audit confirmation.
 * Maps from a row in {@code gdpr_audit_log} where event_type = ERASURE_FINANCIAL_PSEUDONYMIZED
 * and no matching FINANCE_GOBD_CONFIRMED exists afterwards.
 */
@Data
@AllArgsConstructor
public class PendingFinanceConfirmationDto {
    /** ID of the ERASURE_FINANCIAL_PSEUDONYMIZED audit row. Used as the confirm path parameter. */
    private Long pseudoEventId;
    private String subjectSub;
    private String subjectToken;
    private String pseudonymizedAt;
    private String actorSub;
    private String actorRole;
    private String detailsJson;
}
