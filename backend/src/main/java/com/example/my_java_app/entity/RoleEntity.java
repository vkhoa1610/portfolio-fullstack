package com.example.my_java_app.entity;

import lombok.Data;

/**
 * Maps table `roles` from TableMaster.sql
 */
@Data
public class RoleEntity {
    private Integer id;
    private String roleName;
    private String description;
}
