package com.example.my_java_app.controller;

import com.example.my_java_app.dto.request.ConsentRequestDto;
import com.example.my_java_app.dto.request.ProfileSetupRequestDto;
import com.example.my_java_app.service.OnboardingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Onboarding API (v1)
 *
 * Được gọi từ BFF product-008 và product-009
 * JwtAuthFilter tự động inject cognitoSub vào request attribute
 */
@RestController
@RequestMapping("/api/v1/onboarding")
public class OnboardingController extends BaseController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    /**
     * POST /api/v1/onboarding/consent
     * Ghi nhận user đồng ý GDPR và Terms of Service
     */
    @PostMapping("/consent")
    public ResponseEntity<Void> saveConsent(
            HttpServletRequest request,
            @RequestBody ConsentRequestDto dto) {
        String cognitoSub = (String) request.getAttribute("cognitoSub");
        onboardingService.saveConsent(cognitoSub, dto);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/v1/onboarding/profile
     * Lưu ngôn ngữ user chọn → tạo user_profiles record → onboardingStatus = DONE
     */
    @PostMapping("/profile")
    public ResponseEntity<Void> saveProfile(
            HttpServletRequest request,
            @RequestBody ProfileSetupRequestDto dto) {
        String cognitoSub = (String) request.getAttribute("cognitoSub");
        onboardingService.saveProfile(cognitoSub, dto);
        return ResponseEntity.ok().build();
    }
}
