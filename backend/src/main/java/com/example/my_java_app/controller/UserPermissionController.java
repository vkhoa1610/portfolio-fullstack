package com.example.my_java_app.controller;

import com.example.my_java_app.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * GET /api/v1/users/me/permissions
 * Returns permission codes for the current authenticated user (from JWT sub)
 */
@RestController
@RequestMapping("/api/v1/users/me")
public class UserPermissionController extends BaseController {

    private final PermissionService permissionService;

    public UserPermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @GetMapping("/permissions")
    public ResponseEntity<List<String>> getMyPermissions(HttpServletRequest request) {
        String cognitoSub = (String) request.getAttribute("cognitoSub");
        List<String> permissions = permissionService.getPermissionsForUser(cognitoSub);
        return ok(permissions);
    }
}
