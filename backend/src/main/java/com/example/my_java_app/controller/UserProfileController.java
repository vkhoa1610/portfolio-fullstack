package com.example.my_java_app.controller;

import com.example.my_java_app.dto.response.UserProfileResponseDto;
import com.example.my_java_app.service.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    /**
     * GET /api/v1/users/me
     *
     * Response: { role: string, budget: number, onboardingStatus: string }
     * Matches BFF UserProfile interface at bff/src/common/api/get-user.ts
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponseDto> getMyProfile(HttpServletRequest request) {
        // cognitoSub được inject bởi JwtAuthFilter
        String cognitoSub = (String) request.getAttribute("cognitoSub");
        UserProfileResponseDto profile = userProfileService.getMyProfile(cognitoSub);
        return ok(profile);
    }
}
