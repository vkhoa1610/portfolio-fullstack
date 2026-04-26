package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.UserProfileEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserProfileMapper {
    UserProfileEntity findByUserSub(@Param("userSub") String userSub);
    void insertProfile(@Param("userSub") String userSub, @Param("languageCode") String languageCode);
    void updateProfile(
        @Param("userSub") String userSub,
        @Param("firstName") String firstName,
        @Param("lastName") String lastName,
        @Param("avatarUrl") String avatarUrl,
        @Param("languageCode") String languageCode
    );
}
