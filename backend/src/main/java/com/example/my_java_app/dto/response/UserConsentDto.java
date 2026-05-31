package com.example.my_java_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserConsentDto {
    private Long id;
    private Integer policyId;
    private String policyTitle;
    private String policyType;
    private String policyVersion;
    private String consentMethod;
    private String createdAt;
    private String revokedAt;
    /** ACTIVE if revokedAt is null, WITHDRAWN otherwise. */
    private String status;
}
