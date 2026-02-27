package com.example.my_java_app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO cho GET /api/v1/users/me
 *
 * Khớp với interface UserProfile trong BFF (bff/src/common/api/get-user.ts):
 * { role?, budget?, onboardingStatus? }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponseDto {

    /** Role của user: "ADMIN" hoặc "MEMBER" (từ bảng roles) */
    private String role;

    /**
     * Budget của user. Chưa có bảng riêng trong TableMaster.sql,
     * tạm thời hardcode 0. Sẽ cập nhật khi có bảng user_budgets.
     */
    private int budget;

    /**
     * Trạng thái onboarding:
     * - "DONE" : user đã có user_profile record
     * - "PENDING" : chưa hoàn thành profile
     */
    private String onboardingStatus;
}
