package com.example.my_java_app.dto.response;

/**
 * Response DTO cho GET /api/v1/users/me
 * 
 * Khớp với interface UserProfile trong BFF (bff/src/common/api/get-user.ts):
 * { role?, budget?, onboardingStatus? }
 */
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

    public UserProfileResponseDto() {
    }

    public UserProfileResponseDto(String role, int budget, String onboardingStatus) {
        this.role = role;
        this.budget = budget;
        this.onboardingStatus = onboardingStatus;
    }

    public String getRole() {
        return role;
    }

    public int getBudget() {
        return budget;
    }

    public String getOnboardingStatus() {
        return onboardingStatus;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public void setBudget(int budget) {
        this.budget = budget;
    }

    public void setOnboardingStatus(String onboardingStatus) {
        this.onboardingStatus = onboardingStatus;
    }
}
