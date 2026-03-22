package com.example.my_java_app.controller;

import com.example.my_java_app.entity.ReportTemplateEntity;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.repository.ReportTemplateRepository;
import com.example.my_java_app.repository.SystemAdminRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin-only CRUD for report_templates.
 *
 * GET    /api/v1/admin/report-templates        → list all
 * GET    /api/v1/admin/report-templates/{id}   → get one
 * POST   /api/v1/admin/report-templates        → create
 * PUT    /api/v1/admin/report-templates/{id}   → update
 */
@RestController
@RequestMapping("/api/v1/admin/report-templates")
public class ReportTemplateController extends BaseController {

    private final ReportTemplateRepository templateRepository;
    private final SystemAdminRepository systemAdminRepository;

    public ReportTemplateController(ReportTemplateRepository templateRepository,
                                    SystemAdminRepository systemAdminRepository) {
        this.templateRepository    = templateRepository;
        this.systemAdminRepository = systemAdminRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(HttpServletRequest request) {
        requireAdmin(request);
        List<Map<String, Object>> items = templateRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ok(Map.of("templates", items));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getOne(@PathVariable Long id,
                                                       HttpServletRequest request) {
        requireAdmin(request);
        ReportTemplateEntity entity = templateRepository.findById(id);
        if (entity == null) {
            return notFound(Map.of("error", "Template not found: " + id));
        }
        return ok(toResponse(entity));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body,
                                                       HttpServletRequest request) {
        requireAdmin(request);

        String name       = (String) body.get("name");
        String configJson = (String) body.get("configJson");
        String sub        = (String) request.getAttribute("cognitoSub");

        if (name == null || name.isBlank()) {
            return badRequest(Map.of("error", "name is required"));
        }
        if (configJson == null || configJson.isBlank()) {
            return badRequest(Map.of("error", "configJson is required"));
        }

        ReportTemplateEntity entity = new ReportTemplateEntity();
        entity.setName(name);
        entity.setConfigJson(configJson);
        entity.setCreatedBy(sub);
        templateRepository.save(entity);

        return ok(toResponse(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Long id,
                                                       @RequestBody Map<String, Object> body,
                                                       HttpServletRequest request) {
        requireAdmin(request);

        ReportTemplateEntity existing = templateRepository.findById(id);
        if (existing == null) {
            return notFound(Map.of("error", "Template not found: " + id));
        }

        String name       = (String) body.getOrDefault("name", existing.getName());
        String configJson = (String) body.getOrDefault("configJson", existing.getConfigJson());

        templateRepository.update(id, name, configJson);

        ReportTemplateEntity updated = templateRepository.findById(id);
        return ok(toResponse(updated));
    }

    // ─────────────────────────────────────────────────────────────

    private Map<String, Object> toResponse(ReportTemplateEntity e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",         e.getId());
        map.put("name",       e.getName());
        map.put("configJson", e.getConfigJson());
        map.put("createdBy",  e.getCreatedBy());
        map.put("createdAt",  e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        map.put("updatedAt",  e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : null);
        return map;
    }

    private void requireAdmin(HttpServletRequest request) {
        String sub = (String) request.getAttribute("cognitoSub");
        if (!systemAdminRepository.existsBySub(sub)) {
            throw new ForbiddenException("Not a system admin");
        }
    }
}
