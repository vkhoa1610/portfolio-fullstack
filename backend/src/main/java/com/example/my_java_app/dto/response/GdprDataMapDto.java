package com.example.my_java_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class GdprDataMapDto {
    private String subjectSub;
    private List<TableInfo> tables;

    @Data
    @AllArgsConstructor
    public static class TableInfo {
        private String name;
        private int rowCount;
        /** PII_HARD_DELETE | FINANCIAL_PSEUDONYMIZE | AUDIT_NULLIFY */
        private String classification;
        private String note;
    }
}
