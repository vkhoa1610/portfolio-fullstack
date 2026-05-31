package com.example.my_java_app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * Cross-cutting DB operations for GDPR erasure workflow.
 * Kept separate from entity-specific mappers so all GDPR SQL lives in one place.
 */
@Mapper
public interface GdprMapper {

    // ── Pseudonymization (preserves financial records per GoBD §14) ──────────
    int pseudonymizeExpenses(@Param("originalSub") String originalSub,
                             @Param("anonymizedSub") String anonymizedSub);

    int anonymizeUserConsents(@Param("originalSub") String originalSub,
                              @Param("anonymizedSub") String anonymizedSub);

    int nullifyPolicyEvalHistoryCreatedBy(@Param("originalSub") String originalSub);

    // ── Hard delete of PII (GDPR Art. 17) ─────────────────────────────────────
    int deleteUserProfile(@Param("userSub") String userSub);

    int deleteUserRoles(@Param("userSub") String userSub);

    int deleteUser(@Param("userSub") String userSub);

    // ── Counts (for data-map / audit details) ────────────────────────────────
    int countExpensesByUser(@Param("userSub") String userSub);

    int countConsentsByUser(@Param("userSub") String userSub);

    int countUserProfilesByUser(@Param("userSub") String userSub);

    int countUserRolesByUser(@Param("userSub") String userSub);

    int countPolicyEvalHistoryByUser(@Param("userSub") String userSub);

    int countUsersBySub(@Param("userSub") String userSub);
}
