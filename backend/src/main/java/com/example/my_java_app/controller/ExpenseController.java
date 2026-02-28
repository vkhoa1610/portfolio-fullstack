package com.example.my_java_app.controller;

import com.example.my_java_app.dto.request.CreateExpenseRequestDto;
import com.example.my_java_app.dto.response.ExpenseResponseDto;
import com.example.my_java_app.dto.response.ScanResponseDto;
import com.example.my_java_app.service.ExpenseService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Expense API (v1)
 * JwtAuthFilter tự động inject cognitoSub vào request attribute
 */
@RestController
@RequestMapping("/api/v1/expenses")
public class ExpenseController extends BaseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    /** POST /api/v1/expenses — tạo expense (lưu DRAFT) */
    @PostMapping
    public ResponseEntity<ExpenseResponseDto> create(
            HttpServletRequest request,
            @RequestBody CreateExpenseRequestDto dto) {
        String cognitoSub = (String) request.getAttribute("cognitoSub");
        return created(expenseService.create(cognitoSub, dto));
    }

    /** GET /api/v1/expenses — list expense của user hiện tại */
    @GetMapping
    public ResponseEntity<List<ExpenseResponseDto>> list(HttpServletRequest request) {
        String cognitoSub = (String) request.getAttribute("cognitoSub");
        return ok(expenseService.listByUser(cognitoSub));
    }

    /** GET /api/v1/expenses/{id} — chi tiết */
    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponseDto> getById(@PathVariable Long id) {
        return ok(expenseService.getById(id));
    }

    /** POST /api/v1/expenses/{id}/submit — submit → PENDING_REVIEW */
    @PostMapping("/{id}/submit")
    public ResponseEntity<Void> submit(@PathVariable Long id) {
        expenseService.submit(id);
        return ResponseEntity.ok().build();
    }

    /** POST /api/v1/expenses/scan — Mock OCR: trả dữ liệu giả từ ảnh */
    @PostMapping("/scan")
    public ResponseEntity<ScanResponseDto> scan() {
        return ok(expenseService.mockScan());
    }
}
