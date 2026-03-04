package com.example.my_java_app.service;

import com.example.my_java_app.dto.response.ImportResultDto;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.mapper.AdminUserMapper;
import com.example.my_java_app.repository.PermissionRepository;
import com.example.my_java_app.repository.SystemAdminRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * CSV-based import service for bulk user and permission management.
 *
 * User CSV template:    Email,Role,Budget
 * Permission CSV template: User Email,Permission Code,Action
 */
@Service
public class CsvImportService {

    private static final String USER_TEMPLATE_HEADERS = "Email,Role,Budget\n";
    private static final String PERMISSION_TEMPLATE_HEADERS = "User Email,Permission Code,Action\n";

    private final AdminUserMapper adminUserMapper;
    private final PermissionRepository permissionRepository;
    private final SystemAdminRepository systemAdminRepository;

    public CsvImportService(AdminUserMapper adminUserMapper,
                            PermissionRepository permissionRepository,
                            SystemAdminRepository systemAdminRepository) {
        this.adminUserMapper = adminUserMapper;
        this.permissionRepository = permissionRepository;
        this.systemAdminRepository = systemAdminRepository;
    }

    // ── User Import ───────────────────────────────────────────────────────────

    /**
     * CSV format: Email,Role,Budget
     * Finds existing user by email, updates role and/or budget.
     */
    public ImportResultDto importUsers(MultipartFile file, String adminSub) throws IOException {
        requireAdmin(adminSub);

        List<String[]> rows = parseCsv(file);
        int success = 0;
        List<Map<String, String>> errors = new ArrayList<>();

        for (int i = 0; i < rows.size(); i++) {
            String[] cols = rows.get(i);
            String rowNum = String.valueOf(i + 2); // +2 because header is row 1
            try {
                String email = col(cols, 0);
                if (email.isEmpty()) {
                    errors.add(Map.of("row", rowNum, "message", "Email is required"));
                    continue;
                }
                String cognitoSub = adminUserMapper.findCognitoSubByEmail(email);
                if (cognitoSub == null) {
                    errors.add(Map.of("row", rowNum, "message", "User not found: " + email));
                    continue;
                }
                String role = col(cols, 1);
                if (!role.isEmpty()) {
                    Integer roleId = adminUserMapper.findRoleIdByName(role.toUpperCase());
                    if (roleId == null) {
                        errors.add(Map.of("row", rowNum, "message", "Invalid role: " + role));
                        continue;
                    }
                    adminUserMapper.upsertUserRole(cognitoSub, roleId);
                }
                String budgetStr = col(cols, 2);
                if (!budgetStr.isEmpty()) {
                    adminUserMapper.upsertUserBudget(cognitoSub, new BigDecimal(budgetStr));
                }
                success++;
            } catch (NumberFormatException e) {
                errors.add(Map.of("row", rowNum, "message", "Invalid budget value"));
            } catch (Exception e) {
                errors.add(Map.of("row", rowNum, "message", e.getMessage()));
            }
        }
        return new ImportResultDto(success, errors.size(), errors);
    }

    // ── Permission Import ─────────────────────────────────────────────────────

    /**
     * CSV format: User Email,Permission Code,Action (GRANT|REVOKE)
     */
    public ImportResultDto importPermissions(MultipartFile file, String adminSub) throws IOException {
        requireAdmin(adminSub);

        List<String[]> rows = parseCsv(file);
        int success = 0;
        List<Map<String, String>> errors = new ArrayList<>();

        for (int i = 0; i < rows.size(); i++) {
            String[] cols = rows.get(i);
            String rowNum = String.valueOf(i + 2);
            try {
                String email = col(cols, 0);
                String code  = col(cols, 1);
                String action = col(cols, 2).toUpperCase();

                if (email.isEmpty() || code.isEmpty() || action.isEmpty()) {
                    errors.add(Map.of("row", rowNum, "message", "All columns required: User Email, Permission Code, Action"));
                    continue;
                }
                String cognitoSub = adminUserMapper.findCognitoSubByEmail(email);
                if (cognitoSub == null) {
                    errors.add(Map.of("row", rowNum, "message", "User not found: " + email));
                    continue;
                }
                Integer permissionId = permissionRepository.findPermissionIdByCode(code);
                if (permissionId == null) {
                    errors.add(Map.of("row", rowNum, "message", "Unknown permission code: " + code));
                    continue;
                }
                if ("GRANT".equals(action)) {
                    permissionRepository.grantPermission(cognitoSub, permissionId, adminSub);
                } else if ("REVOKE".equals(action)) {
                    permissionRepository.revokePermission(cognitoSub, permissionId);
                } else {
                    errors.add(Map.of("row", rowNum, "message", "Action must be GRANT or REVOKE"));
                    continue;
                }
                success++;
            } catch (Exception e) {
                errors.add(Map.of("row", rowNum, "message", e.getMessage()));
            }
        }
        return new ImportResultDto(success, errors.size(), errors);
    }

    // ── Template Download ─────────────────────────────────────────────────────

    public byte[] generateUserTemplate() {
        return USER_TEMPLATE_HEADERS.getBytes(StandardCharsets.UTF_8);
    }

    public byte[] generatePermissionTemplate() {
        return PERMISSION_TEMPLATE_HEADERS.getBytes(StandardCharsets.UTF_8);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Reads CSV file, skips header row, returns data rows as String[].
     * Handles BOM and trims whitespace per cell.
     */
    private List<String[]> parseCsv(MultipartFile file) throws IOException {
        List<String[]> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            // Skip BOM if present
            reader.mark(1);
            if (reader.read() != '\uFEFF') reader.reset();

            reader.readLine(); // skip header
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.isBlank()) {
                    rows.add(line.split(",", -1));
                }
            }
        }
        return rows;
    }

    /** Safely get a trimmed column value, returns "" if out of bounds. */
    private String col(String[] cols, int index) {
        return (index < cols.length) ? cols[index].trim() : "";
    }

    private void requireAdmin(String adminSub) {
        if (!systemAdminRepository.existsBySub(adminSub)) {
            throw new ForbiddenException("Not a system admin");
        }
    }
}
