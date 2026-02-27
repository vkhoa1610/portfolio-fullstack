package com.example.my_java_app.repository;

import com.example.my_java_app.entity.UserProfileEntity;
import com.example.my_java_app.mapper.UserProfileMapper;
import org.springframework.stereotype.Repository;

@Repository
public class UserProfileRepository {
    private final UserProfileMapper mapper;

    public UserProfileRepository(UserProfileMapper mapper) {
        this.mapper = mapper;
    }

    public UserProfileEntity findByUserSub(String userSub) {
        return mapper.findByUserSub(userSub);
    }

    public void saveProfile(String userSub, String languageCode) {
        mapper.insertProfile(userSub, languageCode);
    }
}
