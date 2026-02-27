package com.example.my_java_app.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ConsentRequestDto {
    private List<Integer> policyIds;
    private String ipAddress;
    private String userAgent;
}
