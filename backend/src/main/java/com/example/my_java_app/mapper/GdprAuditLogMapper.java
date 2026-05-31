package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.GdprAuditLogEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GdprAuditLogMapper {

    void insert(GdprAuditLogEntity entity);

    List<GdprAuditLogEntity> findBySubjectToken(@Param("subjectToken") String subjectToken);

    GdprAuditLogEntity findById(@Param("id") Long id);

    /** All ERASURE_REQUESTED events, newest first. Status derived in Java by looking at follow-ups. */
    List<GdprAuditLogEntity> findAllErasureRequests();

    /** Recent audit events, optionally filtered by subject_token. */
    List<GdprAuditLogEntity> findRecent(@Param("subjectToken") String subjectToken,
                                        @Param("limit") int limit);

    /** Used to compute request status: does a later event of given type exist for this subject? */
    int existsLaterEvent(@Param("subjectToken") String subjectToken,
                         @Param("eventType") String eventType,
                         @Param("after") java.time.LocalDateTime after);

    /**
     * Find ERASURE_FINANCIAL_PSEUDONYMIZED events that have no matching FINANCE_GOBD_CONFIRMED
     * event afterwards — i.e. items still awaiting Finance sign-off.
     */
    List<GdprAuditLogEntity> findPendingFinanceConfirmations();
}
