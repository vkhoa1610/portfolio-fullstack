package com.example.my_java_app.repository;

import com.example.my_java_app.entity.SystemAdminEntity;
import com.example.my_java_app.mapper.SystemAdminMapper;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class SystemAdminRepository {

    private final SystemAdminMapper systemAdminMapper;

    public SystemAdminRepository(SystemAdminMapper systemAdminMapper) {
        this.systemAdminMapper = systemAdminMapper;
    }

    public Optional<SystemAdminEntity> findBySub(String cognitoSub) {
        return Optional.ofNullable(systemAdminMapper.findBySub(cognitoSub));
    }
}
