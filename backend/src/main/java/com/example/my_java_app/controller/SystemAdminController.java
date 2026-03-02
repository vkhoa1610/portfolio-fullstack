package com.example.my_java_app.controller;

import com.example.my_java_app.service.FunctionService;
import com.example.my_java_app.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * System Admin API — manage user permissions and UI functions
 * Only callable by users in the system_admins table
 *
 * Permissions:
 * GET    /api/v1/admin/users/{sub}/permissions         — list user's permissions
 * POST   /api/v1/admin/users/{sub}/permissions         — grant a permission
 * DELETE /api/v1/admin/users/{sub}/permissions/{code}  — revoke a permission
 *
 * UI Functions:
 * GET    /api/v1/admin/users/{sub}/functions           — list user's function IDs
 * POST   /api/v1/admin/users/{sub}/functions           — grant a function
 * DELETE /api/v1/admin/users/{sub}/functions/{key}     — revoke a function
 */
@RestController
@RequestMapping("/api/v1/admin/users")
public class SystemAdminController extends BaseController {

    private final PermissionService permissionService;
    private final FunctionService functionService;

    public SystemAdminController(PermissionService permissionService,
                                 FunctionService functionService) {
        this.permissionService = permissionService;
        this.functionService = functionService;
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    @GetMapping("/{sub}/permissions")
    public ResponseEntity<List<String>> getUserPermissions(@PathVariable String sub) {
        return ok(permissionService.getPermissionsForUser(sub));
    }

    @PostMapping("/{sub}/permissions")
    public ResponseEntity<String> grantPermission(
            HttpServletRequest request,
            @PathVariable String sub,
            @RequestBody Map<String, String> body) {
        String adminSub = (String) request.getAttribute("cognitoSub");
        permissionService.grantPermission(adminSub, sub, body.get("permissionCode"));
        return ok("Permission granted");
    }

    @DeleteMapping("/{sub}/permissions/{code}")
    public ResponseEntity<String> revokePermission(
            HttpServletRequest request,
            @PathVariable String sub,
            @PathVariable String code) {
        String adminSub = (String) request.getAttribute("cognitoSub");
        permissionService.revokePermission(adminSub, sub, code);
        return ok("Permission revoked");
    }

    // ── UI Functions ──────────────────────────────────────────────────────────

    @GetMapping("/{sub}/functions")
    public ResponseEntity<List<Integer>> getUserFunctions(@PathVariable String sub) {
        return ok(functionService.getFunctionIdsForUser(sub));
    }

    @PostMapping("/{sub}/functions")
    public ResponseEntity<String> grantFunction(
            HttpServletRequest request,
            @PathVariable String sub,
            @RequestBody Map<String, String> body) {
        String adminSub = (String) request.getAttribute("cognitoSub");
        functionService.grantFunction(adminSub, sub, body.get("functionKey"));
        return ok("Function granted");
    }

    @DeleteMapping("/{sub}/functions/{key}")
    public ResponseEntity<String> revokeFunction(
            HttpServletRequest request,
            @PathVariable String sub,
            @PathVariable String key) {
        String adminSub = (String) request.getAttribute("cognitoSub");
        functionService.revokeFunction(adminSub, sub, key);
        return ok("Function revoked");
    }
}
