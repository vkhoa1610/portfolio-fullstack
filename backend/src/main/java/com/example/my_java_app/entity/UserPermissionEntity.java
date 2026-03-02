package com.example.my_java_app.entity;

import lombok.Data;

/**
 * Maps table `user_permissions`
 */
@Data
public class UserPermissionEntity {
    private String userSub;
    private Integer permissionId;
    private String grantedBy;
    private String createdAt;
}
