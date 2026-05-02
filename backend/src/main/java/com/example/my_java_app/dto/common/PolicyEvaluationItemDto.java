package com.example.my_java_app.dto.common;

import lombok.Data;

@Data
public class PolicyEvaluationItemDto {
    private String id;
    private String severity;
    private String state;

    private String titleKey;
    private String pendingDescKey;
    private String okDescKey;
    private String triggeredDescKey;

    private String resolvedTitle;
    private String resolvedDesc;

    private Boolean blocksSave;
}
