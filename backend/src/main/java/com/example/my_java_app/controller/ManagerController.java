package com.example.my_java_app.controller;

import com.example.my_java_app.dto.request.ReviewExpenseRequestDto;
import com.example.my_java_app.dto.response.ExpenseResponseDto;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.service.ManagerService;
import com.example.my_java_app.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Manager Approval API (v1)
 * Role MANAGER (BFF layer) + permission EXPENSE_APPROVE/EXPENSE_REJECT (this layer)
 */
@RestController
@RequestMapping("/api/v1/manager/expenses")
public class ManagerController extends BaseController {

    private final ManagerService managerService;
    private final PermissionService permissionService;

    public ManagerController(ManagerService managerService, PermissionService permissionService) {
        this.managerService = managerService;
        this.permissionService = permissionService;
    }

    /** GET /api/v1/manager/expenses — danh sách PENDING_REVIEW */
    @GetMapping
    public ResponseEntity<List<ExpenseResponseDto>> getPending() {
        return ok(managerService.getPending());
    }

    /** PUT /api/v1/manager/expenses/{id}/approve */
    @PutMapping("/{id}/approve")
    public ResponseEntity<Void> approve(
            HttpServletRequest request,
            @PathVariable Long id) {
        String managerSub = (String) request.getAttribute("cognitoSub");
        if (!permissionService.hasPermission(managerSub, "EXPENSE_APPROVE")) {
            throw new ForbiddenException("Missing permission: EXPENSE_APPROVE");
        }
        managerService.approve(id, managerSub);
        return ResponseEntity.ok().build();
    }

    /** PUT /api/v1/manager/expenses/{id}/reject */
    @PutMapping("/{id}/reject")
    public ResponseEntity<Void> reject(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody ReviewExpenseRequestDto dto) {
        String managerSub = (String) request.getAttribute("cognitoSub");
        if (!permissionService.hasPermission(managerSub, "EXPENSE_REJECT")) {
            throw new ForbiddenException("Missing permission: EXPENSE_REJECT");
        }
        managerService.reject(id, managerSub, dto.getRejectionReason());
        return ResponseEntity.ok().build();
    }
}
