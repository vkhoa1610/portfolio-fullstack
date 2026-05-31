package com.example.my_java_app.repository;

import com.example.my_java_app.entity.GdprAuditLogEntity;
import com.example.my_java_app.mapper.GdprAuditLogMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class GdprAuditLogRepository {

    private final GdprAuditLogMapper mapper;

    public GdprAuditLogRepository(GdprAuditLogMapper mapper) {
        this.mapper = mapper;
    }

    public void save(GdprAuditLogEntity entity) {
        mapper.insert(entity);
    }

    public List<GdprAuditLogEntity> findBySubjectToken(String subjectToken) {
        return mapper.findBySubjectToken(subjectToken);
    }

    public GdprAuditLogEntity findById(Long id) {
        return mapper.findById(id);
    }

    public List<GdprAuditLogEntity> findAllErasureRequests() {
        return mapper.findAllErasureRequests();
    }

    public List<GdprAuditLogEntity> findRecent(String subjectToken, int limit) {
        return mapper.findRecent(subjectToken, limit);
    }

    public boolean hasLaterEvent(String subjectToken, String eventType, java.time.LocalDateTime after) {
        return mapper.existsLaterEvent(subjectToken, eventType, after) > 0;
    }

    public List<GdprAuditLogEntity> findPendingFinanceConfirmations() {
        return mapper.findPendingFinanceConfirmations();
    }
}
