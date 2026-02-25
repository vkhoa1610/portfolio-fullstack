package com.example.my_java_app.repository;

import com.example.my_java_app.entity.RoleEntity;
import com.example.my_java_app.mapper.RoleMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class RoleRepository {
    private final RoleMapper mapper;

    public RoleRepository(RoleMapper mapper) {
        this.mapper = mapper;
    }

    public List<RoleEntity> findRolesByUserSub(String cognitoSub) {
        return mapper.findRolesByUserSub(cognitoSub);
    }
}
