package com.example.my_java_app.entity;

import lombok.Data;

/**
 * Maps table `functions`
 */
@Data
public class FunctionEntity {
    private Integer functionId;
    private String functionKey;
    private String module;
    private String description;
}
