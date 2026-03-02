package com.example.my_java_app.controller;

import com.example.my_java_app.service.ScreenConfigService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Screen config endpoints
 *
 * GET  /api/v1/screen-configs/{screenKey}              — get active CMS JSON for a screen
 * POST /api/v1/admin/screen-configs/{screenKey}/patch  — apply CSV patch (system admin only)
 */
@RestController
public class ScreenConfigController extends BaseController {

    private final ScreenConfigService screenConfigService;

    public ScreenConfigController(ScreenConfigService screenConfigService) {
        this.screenConfigService = screenConfigService;
    }

    @GetMapping("/api/v1/screen-configs/{screenKey}")
    public ResponseEntity<String> getScreenConfig(@PathVariable String screenKey) {
        String configJson = screenConfigService.getActiveConfig(screenKey);
        // Return raw JSON string — Spring will serialize it as a JSON string value.
        // Wrap in a simple object so the response is a proper JSON object.
        return ok(configJson);
    }

    @PostMapping("/api/v1/admin/screen-configs/{screenKey}/patch")
    public ResponseEntity<String> patchScreenConfig(
            HttpServletRequest request,
            @PathVariable String screenKey,
            @RequestBody String csvContent) {
        String adminSub = (String) request.getAttribute("cognitoSub");
        screenConfigService.applyPatch(adminSub, screenKey, csvContent);
        return ok("Screen config patched successfully");
    }
}
