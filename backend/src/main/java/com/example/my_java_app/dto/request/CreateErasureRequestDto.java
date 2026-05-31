package com.example.my_java_app.dto.request;

import lombok.Data;

@Data
public class CreateErasureRequestDto {
    /** Optional reason for the erasure request (free text). */
    private String reason;
}
