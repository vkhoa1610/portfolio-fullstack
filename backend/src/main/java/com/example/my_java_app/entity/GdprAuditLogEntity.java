package com.example.my_java_app.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GdprAuditLogEntity {
    private Long id;
    private String eventType;
    private String subjectSub;
    private String subjectToken;
    private String actorSub;
    private String actorRole;
    private String detailsJson;
    private LocalDateTime createdAt;
}
