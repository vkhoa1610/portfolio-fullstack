package com.example.my_java_app.repository;

import com.example.my_java_app.entity.UserEntity;
import com.example.my_java_app.mapper.UserMapper;

import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public class  UserRepository{
    private final UserMapper userMapper;

    public UserRepository(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public List<UserEntity> findAll() {
        return userMapper.findAll();
    }

    public UserEntity findById(String id) {
        return userMapper.findById(id);
    }

    public void save(UserEntity user) {
        userMapper.insert(user);
    }
}
