package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.PolicyEvaluationHistoryEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PolicyEvaluationHistoryMapper {

    void insert(PolicyEvaluationHistoryEntity entity);

    PolicyEvaluationHistoryEntity findLatestByEntityAndEvent(@Param("entityType") String entityType,
                                                             @Param("entityId") Long entityId,
                                                             @Param("eventType") String eventType);
}
