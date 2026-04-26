package com.example.my_java_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailResponseDto {
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String languageCode;
}
