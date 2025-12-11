package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.UserEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface UserMapper {
    List<UserEntity> findAll();
    UserEntity findById(@Param("id") String id);
    void insert(UserEntity user);
}
