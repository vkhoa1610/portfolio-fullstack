package com.example.my_java_app.dto.request;

import lombok.Data;

@Data
public class UpdateProfileRequestDto {
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String languageCode;
}
