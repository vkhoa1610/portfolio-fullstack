package com.example.my_java_app.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Maps table `report_templates`
 */
@Data
public class ReportTemplateEntity {
    private Long id;
    private String name;
    private String configJson;   // JSON string — template configuration
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
