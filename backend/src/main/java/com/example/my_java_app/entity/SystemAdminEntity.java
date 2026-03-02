package com.example.my_java_app.entity;

import lombok.Data;

/**
 * Maps table `system_admins`
 * Uses a separate Cognito pool from regular users
 */
@Data
public class SystemAdminEntity {
    private String cognitoSub;
    private String email;
    private String createdAt;
}
