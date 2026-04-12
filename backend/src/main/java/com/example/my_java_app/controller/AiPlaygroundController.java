package com.example.my_java_app.controller;

import com.example.my_java_app.client.GroqClient;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.repository.SystemAdminRepository;
import com.example.my_java_app.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin-only endpoint to test the AI model (Ollama) with custom prompts.
 *
 * POST /api/v1/admin/ai-playground/chat
 *   Body: { systemPrompt?: string, userPrompt: string }
 *   Returns: { response, model, durationMs }
 */
@RestController
@RequestMapping("/api/v1/admin/ai-playground")
public class AiPlaygroundController extends BaseController {

    private final GroqClient groqClient;
    private final SystemAdminRepository systemAdminRepository;
    private final PermissionService permissionService;

    public AiPlaygroundController(GroqClient groqClient,
                                  SystemAdminRepository systemAdminRepository,
                                  PermissionService permissionService) {
        this.groqClient           = groqClient;
        this.systemAdminRepository  = systemAdminRepository;
        this.permissionService      = permissionService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        requireAdmin(request);

        String userPrompt   = body.getOrDefault("userPrompt", "").trim();
        String systemPrompt = body.getOrDefault("systemPrompt", "").trim();

        if (userPrompt.isBlank()) {
            return badRequest(Map.of("error", "userPrompt is required"));
        }

        long start = System.currentTimeMillis();
        try {
            String response = groqClient.chatWithSystem(
                    systemPrompt.isBlank() ? null : systemPrompt,
                    userPrompt);
            long durationMs = System.currentTimeMillis() - start;
            return ok(Map.of(
                    "response",   response,
                    "model",      groqClient.getModel(),
                    "durationMs", durationMs));
        } catch (Exception e) {
            long durationMs = System.currentTimeMillis() - start;
            return ok(Map.of(
                    "error",      e.getMessage(),
                    "model",      groqClient.getModel(),
                    "durationMs", durationMs));
        }
    }

    private void requireAdmin(HttpServletRequest request) {
        String sub = (String) request.getAttribute("cognitoSub");
        boolean isAdmin   = systemAdminRepository.existsBySub(sub);
        boolean isManager = permissionService.hasPermission(sub, "EXPENSE_APPROVE");
        if (!isAdmin && !isManager) {
            throw new ForbiddenException("Access restricted to Admin or Manager");
        }
    }
}
