package com.example.my_java_app.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserConsentEntity {
    private Long id;
    private String userSub;
    private Integer policyId;
    private String ipAddress;
    private String userAgent;
    private String consentMethod;
    private LocalDateTime createdAt;
    private LocalDateTime revokedAt;

    // Joined from policies table (read-only)
    private String policyTitle;
    private String policySlug;
    private String policyType;
    private String policyVersion;
}
