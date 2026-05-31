package com.example.my_java_app.service;

import com.example.my_java_app.entity.GdprAuditLogEntity;
import com.example.my_java_app.mapper.GdprMapper;
import com.example.my_java_app.repository.GdprAuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Orchestrates the GDPR erasure workflow for a user (data subject).
 *
 * Two-phase model:
 *   1. {@link #pseudonymizeFinancialData} — keeps GoBD-required financial records,
 *      replaces user_sub with a non-reversible token. Required first because expenses
 *      no longer reference the user once their PII is deleted.
 *   2. {@link #hardDeletePersonalData}   — removes all PII tables for the user.
 *
 * Every action is recorded in {@code gdpr_audit_log} keyed by {@code subject_token}
 * (SHA-256 of original sub) so the workflow remains traceable after the original
 * sub no longer exists in the {@code users} table.
 */
@Service
public class GdprService {

    private static final Logger log = LoggerFactory.getLogger(GdprService.class);

    private final GdprMapper gdprMapper;
    private final GdprAuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public GdprService(GdprMapper gdprMapper,
                       GdprAuditLogRepository auditLogRepository,
                       ObjectMapper objectMapper) {
        this.gdprMapper = gdprMapper;
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Record that an employee has requested erasure. Does not perform any deletion.
     * Used to seed the admin's processing queue and start the 30-day Art. 12 clock.
     */
    @Transactional
    public void recordErasureRequest(String subjectSub, String reason) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("reason", reason == null ? "" : reason);
        writeAudit("ERASURE_REQUESTED", subjectSub, subjectSub, "EMPLOYEE", details);
    }

    /**
     * Phase 1 of erasure: pseudonymize financial records (GoBD-protected).
     * Replaces {@code user_sub} on expenses + user_consents with a stable anonymized
     * token derived from SHA-256 of the original sub. Nullifies
     * {@code policy_evaluation_history.created_by} since it is just an audit attribution.
     *
     * Idempotent: running twice is a no-op on the second call (rows already anonymized).
     */
    @Transactional
    public PseudonymizationResult pseudonymizeFinancialData(String subjectSub, String actorSub, String actorRole) {
        String anonymized = anonymizedTokenFor(subjectSub);

        int expensesAffected = gdprMapper.pseudonymizeExpenses(subjectSub, anonymized);
        int consentsAffected = gdprMapper.anonymizeUserConsents(subjectSub, anonymized);
        int policyHistoryAffected = gdprMapper.nullifyPolicyEvalHistoryCreatedBy(subjectSub);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("anonymized_sub", anonymized);
        details.put("expenses_pseudonymized", expensesAffected);
        details.put("user_consents_anonymized", consentsAffected);
        details.put("policy_eval_history_nullified", policyHistoryAffected);
        writeAudit("ERASURE_FINANCIAL_PSEUDONYMIZED", subjectSub, actorSub, actorRole, details);

        log.info("GDPR pseudonymize: sub={} expenses={} consents={} policyEval={}",
                subjectSub, expensesAffected, consentsAffected, policyHistoryAffected);

        return new PseudonymizationResult(anonymized, expensesAffected, consentsAffected, policyHistoryAffected);
    }

    /**
     * Phase 2 of erasure: hard-delete personally identifiable info.
     * Must be called AFTER {@link #pseudonymizeFinancialData} so that no remaining
     * row references the user_sub being deleted.
     *
     * Caller responsibility: also delete avatar / receipt files from object storage
     * (handled by Phase 2 admin tooling, not in this service).
     */
    @Transactional
    public void hardDeletePersonalData(String subjectSub, String actorSub, String actorRole) {
        int profilesDeleted = gdprMapper.deleteUserProfile(subjectSub);
        int rolesDeleted    = gdprMapper.deleteUserRoles(subjectSub);
        int usersDeleted    = gdprMapper.deleteUser(subjectSub);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("user_profiles_deleted", profilesDeleted);
        details.put("user_roles_deleted", rolesDeleted);
        details.put("users_deleted", usersDeleted);
        writeAudit("ERASURE_PII_DELETED", subjectSub, actorSub, actorRole, details);

        // Keep subjectSub in COMPLETED event so subject_token stays consistent — there is no FK
        // anymore, so the value is just a trace label, not a reference. The user row is already gone.
        writeAudit("ERASURE_COMPLETED", subjectSub, actorSub, actorRole, Map.of("note", "all PII purged"));

        log.info("GDPR hard delete: sub={} profiles={} roles={} users={}",
                subjectSub, profilesDeleted, rolesDeleted, usersDeleted);
    }

    /**
     * Finance sign-off on a GoBD pseudonymization (post-hoc separation of duties).
     * The actual pseudonymization already ran in {@link #pseudonymizeFinancialData}; this method
     * just records Finance's audit confirmation that the action was kosher from an accounting
     * standpoint. Idempotent: writing twice produces two audit rows, which is intentional
     * (each confirmation has its own actor + timestamp).
     *
     * @param pseudoEventId  ID of the {@code ERASURE_FINANCIAL_PSEUDONYMIZED} audit row being confirmed.
     */
    @Transactional
    public void confirmFinanceGobd(String subjectSub, String subjectToken, Long pseudoEventId,
                                   String actorSub, String actorRole) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("pseudo_event_id", pseudoEventId);
        details.put("note", "Finance acknowledged GoBD-compliant pseudonymization");

        GdprAuditLogEntity entity = new GdprAuditLogEntity();
        entity.setEventType("FINANCE_GOBD_CONFIRMED");
        entity.setSubjectSub(subjectSub);
        entity.setSubjectToken(subjectToken);
        entity.setActorSub(actorSub);
        entity.setActorRole(actorRole);
        try {
            entity.setDetailsJson(objectMapper.writeValueAsString(details));
        } catch (Exception ex) {
            log.warn("Failed to serialize FINANCE_GOBD_CONFIRMED details: {}", ex.getMessage());
            entity.setDetailsJson("{}");
        }
        auditLogRepository.save(entity);

        log.info("GDPR: Finance confirmed GoBD compliance for pseudo event {} (actor={})", pseudoEventId, actorSub);
    }

    /**
     * Record that a data export ZIP was generated for the subject (GDPR Art. 20).
     */
    @Transactional
    public void recordDataExport(String subjectSub, String actorSub, String actorRole, int recordCount) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("record_count", recordCount);
        writeAudit("DATA_EXPORTED", subjectSub, actorSub, actorRole, details);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void writeAudit(String eventType,
                            String subjectSub,
                            String actorSub,
                            String actorRole,
                            Map<String, Object> details) {
        GdprAuditLogEntity entity = new GdprAuditLogEntity();
        entity.setEventType(eventType);
        entity.setSubjectSub(subjectSub);
        entity.setSubjectToken(subjectTokenFor(subjectSub == null ? actorSub : subjectSub));
        entity.setActorSub(actorSub);
        entity.setActorRole(actorRole);
        try {
            entity.setDetailsJson(objectMapper.writeValueAsString(details == null ? Map.of() : details));
        } catch (Exception ex) {
            log.warn("Failed to serialize GDPR audit details for event {}: {}", eventType, ex.getMessage());
            entity.setDetailsJson("{}");
        }
        auditLogRepository.save(entity);
    }

    /** Returns the {@code 'DELETED-<sha256>'} token used to replace user_sub in financial rows. */
    public static String anonymizedTokenFor(String originalSub) {
        return "DELETED-" + sha256Hex(originalSub);
    }

    /** Returns the 64-char SHA-256 hex digest used as {@code subject_token} in the audit log. */
    public static String subjectTokenFor(String originalSub) {
        return sha256Hex(originalSub);
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(64);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }

    public record PseudonymizationResult(
            String anonymizedSub,
            int expensesAffected,
            int consentsAffected,
            int policyHistoryAffected
    ) {}
}
