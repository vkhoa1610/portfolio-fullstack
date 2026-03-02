package com.example.my_java_app.entity;

import lombok.Data;

/**
 * Maps table `screen_configs`
 */
@Data
public class ScreenConfigEntity {
    private String screenKey;
    private Integer version;
    private String configJson;
    private Integer isActive;
    private String updatedBy;
}
