package com.example.my_java_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UploadUrlResponseDto {
    private String uploadUrl;
    private String fileUrl;
}
