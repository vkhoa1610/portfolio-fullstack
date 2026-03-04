package com.example.my_java_app.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Admin response DTO cho UI function với 3 trạng thái:
 * ACTIVE | INACTIVE | NEVER_GRANTED
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserFunctionStatusDto {
    private Integer functionId;
    private String functionKey;
    private String module;
    private String description;
    private String state;       // "ACTIVE" | "INACTIVE" | "NEVER_GRANTED"
    private String grantedBy;
    private String createdAt;
}
