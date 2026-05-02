package com.example.my_java_app.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PolicyEvaluationHistoryEntity {
    private Long id;
    private String domain;
    private String entityType;
    private Long entityId;
    private String eventType;
    private String screenKey;
    private Integer screenVersion;
    private String resultJson;
    private String inputJson;
    private String createdBy;
    private LocalDateTime createdAt;
    private Integer isDeleted;
}
