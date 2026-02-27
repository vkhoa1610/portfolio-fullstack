package com.example.my_java_app.service;

import com.example.my_java_app.dto.response.UserProfileResponseDto;
import com.example.my_java_app.entity.RoleEntity;
import com.example.my_java_app.entity.UserProfileEntity;
import com.example.my_java_app.exception.NotFoundException;
import com.example.my_java_app.repository.RoleRepository;
import com.example.my_java_app.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service cho endpoint GET /api/v1/users/me
 * 
 * Logic:
 * 1. Query user_profiles để tìm profile của user (quyết định onboardingStatus)
 * 2. Query roles qua user_roles JOIN roles
 * 3. Trả về UserProfileResponseDto khớp với BFF's UserProfile interface
 */
@Service
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final RoleRepository roleRepository;

    public UserProfileService(UserProfileRepository userProfileRepository,
            RoleRepository roleRepository) {
        this.userProfileRepository = userProfileRepository;
        this.roleRepository = roleRepository;
    }

    public UserProfileResponseDto getMyProfile(String cognitoSub) {
        if (cognitoSub == null || cognitoSub.isBlank()) {
            throw new NotFoundException("User not found: missing cognito_sub");
        }

        // ─── 1. Lấy danh sách roles ───────────────────────────────────
        List<RoleEntity> roles = roleRepository.findRolesByUserSub(cognitoSub);

        // Lấy role đầu tiên, mặc định "EMPLOYEE" nếu chưa được gán role
        String role = roles.isEmpty()
                ? "EMPLOYEE"
                : roles.get(0).getRoleName();

        // ─── 2. Kiểm tra profile để xác định onboardingStatus ─────────
        UserProfileEntity profile = userProfileRepository.findByUserSub(cognitoSub);

        // Nếu đã có profile record → onboarding DONE, ngược lại PENDING
        String onboardingStatus = (profile != null) ? "DONE" : "PENDING";

        // ─── 3. Build response DF ──────────────────────────────────────
        // budget = 0 vì chưa có bảng user_budgets trong schema hiện tại
        return new UserProfileResponseDto(role, 0, onboardingStatus);
    }
}
