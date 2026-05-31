package com.example.my_java_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GdprAuditLogEntryDto {
    private Long id;
    private String eventType;
    private String subjectSub;
    private String subjectToken;
    private String actorSub;
    private String actorRole;
    private String detailsJson;
    private String createdAt;
}
