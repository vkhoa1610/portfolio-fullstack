package com.example.my_java_app.controller;

import com.example.my_java_app.dto.response.UserFunctionStatusDto;
import com.example.my_java_app.dto.response.UserPermissionStatusDto;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.mapper.AdminUserMapper;
import com.example.my_java_app.repository.FunctionRepository;
import com.example.my_java_app.repository.PermissionRepository;
import com.example.my_java_app.repository.SystemAdminRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin APIs — requires caller to be in system_admins table
 *
 * GET  /api/v1/admin/users                          — list all users
 * GET  /api/v1/admin/users/{sub}/permissions/status — all permissions with 3-state
 * GET  /api/v1/admin/users/{sub}/functions/status   — all functions with 3-state
 */
@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminController extends BaseController {

    private final AdminUserMapper adminUserMapper;
    private final PermissionRepository permissionRepository;
    private final FunctionRepository functionRepository;
    private final SystemAdminRepository systemAdminRepository;

    public AdminController(AdminUserMapper adminUserMapper,
                           PermissionRepository permissionRepository,
                           FunctionRepository functionRepository,
                           SystemAdminRepository systemAdminRepository) {
        this.adminUserMapper = adminUserMapper;
        this.permissionRepository = permissionRepository;
        this.functionRepository = functionRepository;
        this.systemAdminRepository = systemAdminRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listUsers(HttpServletRequest request) {
        requireAdmin(request);
        return ok(adminUserMapper.findAllUsers());
    }

    @GetMapping("/{sub}/permissions/status")
    public ResponseEntity<List<UserPermissionStatusDto>> permissionStatus(
            @PathVariable String sub,
            HttpServletRequest request) {
        requireAdmin(request);
        return ok(permissionRepository.findAllWithStateForUser(sub));
    }

    @GetMapping("/{sub}/functions/status")
    public ResponseEntity<List<UserFunctionStatusDto>> functionStatus(
            @PathVariable String sub,
            HttpServletRequest request) {
        requireAdmin(request);
        return ok(functionRepository.findAllWithStateForUser(sub));
    }

    private void requireAdmin(HttpServletRequest request) {
        String sub = (String) request.getAttribute("cognitoSub");
        if (!systemAdminRepository.existsBySub(sub)) {
            throw new ForbiddenException("Not a system admin");
        }
    }
}
