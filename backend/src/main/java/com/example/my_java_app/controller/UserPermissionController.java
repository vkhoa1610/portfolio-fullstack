package com.example.my_java_app.controller;

import com.example.my_java_app.repository.SystemAdminRepository;
import com.example.my_java_app.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * GET /api/v1/users/me/permissions  — permission codes for current user
 * GET /api/v1/users/me/is-admin     — whether current user is a system admin
 */
@RestController
@RequestMapping("/api/v1/users/me")
public class UserPermissionController extends BaseController {

    private final PermissionService permissionService;
    private final SystemAdminRepository systemAdminRepository;

    public UserPermissionController(PermissionService permissionService,
                                    SystemAdminRepository systemAdminRepository) {
        this.permissionService = permissionService;
        this.systemAdminRepository = systemAdminRepository;
    }

    @GetMapping("/permissions")
    public ResponseEntity<List<String>> getMyPermissions(HttpServletRequest request) {
        String cognitoSub = (String) request.getAttribute("cognitoSub");
        return ok(permissionService.getPermissionsForUser(cognitoSub));
    }

    @GetMapping("/is-admin")
    public ResponseEntity<Map<String, Boolean>> isAdmin(HttpServletRequest request) {
        String cognitoSub = (String) request.getAttribute("cognitoSub");
        return ok(Map.of("isAdmin", systemAdminRepository.existsBySub(cognitoSub)));
    }
}
