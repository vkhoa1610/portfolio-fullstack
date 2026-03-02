package com.example.my_java_app.entity;

import lombok.Data;

/**
 * Maps table `permissions`
 */
@Data
public class PermissionEntity {
    private Integer id;
    private String permissionCode;
    private String description;
}
