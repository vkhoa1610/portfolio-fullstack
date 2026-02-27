package com.example.my_java_app.entity;

import lombok.Data;

/**
 * Maps table `user_profiles` from TableMaster.sql
 * PK: user_sub (1-1 với cognito_sub trong users)
 */
@Data
public class UserProfileEntity {
    private String userSub;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String avatarUrl;
    private String address;
    private String languageCode;
}
