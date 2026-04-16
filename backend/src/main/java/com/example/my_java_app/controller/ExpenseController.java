package com.example.my_java_app.controller;

import com.example.my_java_app.dto.request.CreateExpenseRequestDto;
import com.example.my_java_app.dto.response.ExpenseResponseDto;
import com.example.my_java_app.dto.response.ScanResponseDto;
import com.example.my_java_app.dto.response.UploadUrlResponseDto;
import com.example.my_java_app.service.ExpenseService;
import com.example.my_java_app.service.StorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Expense API (v1)
 * JwtAuthFilter tự động inject cognitoSub vào request attribute
 */
@RestController
@RequestMapping("/api/v1/expenses")
public class ExpenseController extends BaseController {

    private final ExpenseService expenseService;
    private final StorageService storageService;

    public ExpenseController(ExpenseService expenseService, StorageService storageService) {
        this.expenseService = expenseService;
        this.storageService = storageService;
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

    /** GET /api/v1/expenses/upload-url?filename=xxx — Presigned PUT URL để upload thẳng lên MinIO */
    @GetMapping("/upload-url")
    public ResponseEntity<UploadUrlResponseDto> getUploadUrl(@RequestParam String filename) {
        return ok(storageService.generateUploadUrl(filename));
    }

    /** GET /api/v1/expenses/view-url?fileUrl=... — Presigned GET URL (1h) for private bucket */
    @GetMapping("/view-url")
    public ResponseEntity<Map<String, String>> getViewUrl(@RequestParam String fileUrl) {
        return ok(Map.of("viewUrl", storageService.generateViewUrl(fileUrl)));
    }

    /** POST /api/v1/expenses/scan — Groq Vision OCR, fallback to mock on error */
    @PostMapping("/scan")
    public ResponseEntity<ScanResponseDto> scan(@RequestBody(required = false) Map<String, String> body) {
        String fileUrl = body != null ? body.get("fileUrl") : null;
        return ok(expenseService.scan(fileUrl));
    }
}
