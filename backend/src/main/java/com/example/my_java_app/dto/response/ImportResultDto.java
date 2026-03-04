package com.example.my_java_app.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response DTO cho Excel import operations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportResultDto {
    private int successCount;
    private int failCount;
    private List<Map<String, String>> errors;   // [{row: "2", message: "email invalid"}]
}
