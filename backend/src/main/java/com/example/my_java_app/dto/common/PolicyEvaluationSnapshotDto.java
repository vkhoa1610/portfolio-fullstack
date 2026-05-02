package com.example.my_java_app.dto.common;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class PolicyEvaluationSnapshotDto {
    private String screenKey;
    private Integer screenVersion;
    private List<PolicyEvaluationItemDto> items;
    private Map<String, Object> inputSnapshot;
}
