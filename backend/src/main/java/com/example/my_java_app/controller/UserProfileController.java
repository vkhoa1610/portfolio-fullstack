package com.example.my_java_app.controller;

import com.example.my_java_app.dto.request.UpdateProfileRequestDto;
import com.example.my_java_app.dto.response.UploadUrlResponseDto;
import com.example.my_java_app.dto.response.UserDetailResponseDto;
import com.example.my_java_app.dto.response.UserProfileResponseDto;
import com.example.my_java_app.service.StorageService;
import com.example.my_java_app.service.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller cho User Profile API (v1).
 *
 * Context: BFF (product-003/controller.ts line 102) gọi `fetchUserProfile`
 * → POST tới /api/v1/users/me với header Authorization: Bearer <idToken>
 *
 * JwtAuthFilter decode idToken → extract cognito_sub → set request attribute.
 * Controller chỉ cần đọc attribute và delegate cho service.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserProfileController extends BaseController {

    private final UserProfileService userProfileService;
    private final StorageService storageService;

    public UserProfileController(UserProfileService userProfileService, StorageService storageService) {
        this.userProfileService = userProfileService;
        this.storageService = storageService;
    }

    /**
     * GET /api/v1/users/me
     *
     * Response: { role: string, budget: number, onboardingStatus: string }
     * Matches BFF UserProfile interface at bff/src/common/api/get-user.ts
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponseDto> getMyProfile(HttpServletRequest request) {
        String cognitoSub = (String) request.getAttribute("cognitoSub");
        UserProfileResponseDto profile = userProfileService.getMyProfile(cognitoSub);
        return ok(profile);
    }

    @GetMapping("/me/detail")
    public ResponseEntity<UserDetailResponseDto> getMyProfileDetail(HttpServletRequest request) {
        String cognitoSub = (String) request.getAttribute("cognitoSub");
        return ok(userProfileService.getMyProfileDetail(cognitoSub));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDetailResponseDto> updateMyProfile(
            HttpServletRequest request,
            @RequestBody UpdateProfileRequestDto body) {
        String cognitoSub = (String) request.getAttribute("cognitoSub");
        return ok(userProfileService.updateProfile(cognitoSub, body));
    }

    @GetMapping("/me/avatar-url")
    public ResponseEntity<UploadUrlResponseDto> getAvatarUploadUrl(
            HttpServletRequest request,
            @RequestParam String filename) {
        return ok(storageService.generateUploadUrl(filename));
    }
}
