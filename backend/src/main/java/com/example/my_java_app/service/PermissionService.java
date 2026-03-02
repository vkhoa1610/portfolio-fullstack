package com.example.my_java_app.service;

import com.example.my_java_app.exception.ApiException;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.repository.PermissionRepository;
import com.example.my_java_app.repository.SystemAdminRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final SystemAdminRepository systemAdminRepository;

    public PermissionService(PermissionRepository permissionRepository,
                             SystemAdminRepository systemAdminRepository) {
        this.permissionRepository = permissionRepository;
        this.systemAdminRepository = systemAdminRepository;
    }

    public List<String> getPermissionsForUser(String cognitoSub) {
        return permissionRepository.findPermissionCodesByUserSub(cognitoSub);
    }

    public boolean hasPermission(String cognitoSub, String permissionCode) {
        List<String> permissions = permissionRepository.findPermissionCodesByUserSub(cognitoSub);
        return permissions.contains(permissionCode);
    }

    public void grantPermission(String adminSub, String userSub, String permissionCode) {
        requireAdmin(adminSub);
        Integer permissionId = permissionRepository.findPermissionIdByCode(permissionCode);
        if (permissionId == null) {
            throw new ApiException("Permission not found: " + permissionCode);
        }
        permissionRepository.grantPermission(userSub, permissionId, adminSub);
    }

    public void revokePermission(String adminSub, String userSub, String permissionCode) {
        requireAdmin(adminSub);
        Integer permissionId = permissionRepository.findPermissionIdByCode(permissionCode);
        if (permissionId == null) {
            throw new ApiException("Permission not found: " + permissionCode);
        }
        permissionRepository.revokePermission(userSub, permissionId);
    }

    private void requireAdmin(String cognitoSub) {
        if (systemAdminRepository.findBySub(cognitoSub).isEmpty()) {
            throw new ForbiddenException("Caller is not a system admin");
        }
    }
}
