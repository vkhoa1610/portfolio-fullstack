package com.example.my_java_app.controller;

import com.example.my_java_app.dto.response.ImportResultDto;
import com.example.my_java_app.service.CsvImportService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * CSV import/export endpoints — admin only (checked inside service).
 *
 * POST /api/v1/admin/import/users        — import users (Email,Role,Budget)
 * POST /api/v1/admin/import/permissions  — import permissions (User Email,Permission Code,Action)
 * GET  /api/v1/admin/import/template/users
 * GET  /api/v1/admin/import/template/permissions
 */
@RestController
@RequestMapping("/api/v1/admin/import")
public class CsvImportController extends BaseController {

    private final CsvImportService csvImportService;

    public CsvImportController(CsvImportService csvImportService) {
        this.csvImportService = csvImportService;
    }

    @PostMapping("/users")
    public ResponseEntity<ImportResultDto> importUsers(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) throws IOException {
        String adminSub = (String) request.getAttribute("cognitoSub");
        return ok(csvImportService.importUsers(file, adminSub));
    }

    @PostMapping("/permissions")
    public ResponseEntity<ImportResultDto> importPermissions(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) throws IOException {
        String adminSub = (String) request.getAttribute("cognitoSub");
        return ok(csvImportService.importPermissions(file, adminSub));
    }

    @GetMapping("/template/users")
    public ResponseEntity<byte[]> userTemplate() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"users_template.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvImportService.generateUserTemplate());
    }

    @GetMapping("/template/permissions")
    public ResponseEntity<byte[]> permissionTemplate() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"permissions_template.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvImportService.generatePermissionTemplate());
    }
}
