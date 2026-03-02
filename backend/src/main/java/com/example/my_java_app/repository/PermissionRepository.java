package com.example.my_java_app.repository;

import com.example.my_java_app.mapper.PermissionMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PermissionRepository {

    private final PermissionMapper permissionMapper;

    public PermissionRepository(PermissionMapper permissionMapper) {
        this.permissionMapper = permissionMapper;
    }

    public List<String> findPermissionCodesByUserSub(String userSub) {
        return permissionMapper.findPermissionCodesByUserSub(userSub);
    }

    public Integer findPermissionIdByCode(String permissionCode) {
        return permissionMapper.findPermissionIdByCode(permissionCode);
    }

    public void grantPermission(String userSub, int permissionId, String grantedBy) {
        permissionMapper.grantPermission(userSub, permissionId, grantedBy);
    }

    public void revokePermission(String userSub, int permissionId) {
        permissionMapper.revokePermission(userSub, permissionId);
    }
}
