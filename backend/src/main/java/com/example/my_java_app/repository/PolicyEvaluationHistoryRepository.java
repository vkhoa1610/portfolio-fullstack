package com.example.my_java_app.repository;

import com.example.my_java_app.entity.PolicyEvaluationHistoryEntity;
import com.example.my_java_app.mapper.PolicyEvaluationHistoryMapper;
import org.springframework.stereotype.Repository;

@Repository
public class PolicyEvaluationHistoryRepository {

    private final PolicyEvaluationHistoryMapper mapper;

    public PolicyEvaluationHistoryRepository(PolicyEvaluationHistoryMapper mapper) {
        this.mapper = mapper;
    }

    public void save(PolicyEvaluationHistoryEntity entity) {
        mapper.insert(entity);
    }

    public PolicyEvaluationHistoryEntity findLatestByEntityAndEvent(String entityType, Long entityId, String eventType) {
        return mapper.findLatestByEntityAndEvent(entityType, entityId, eventType);
    }
}
