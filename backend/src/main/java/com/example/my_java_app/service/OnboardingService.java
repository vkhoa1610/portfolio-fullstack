package com.example.my_java_app.service;

import com.example.my_java_app.dto.request.ConsentRequestDto;
import com.example.my_java_app.dto.request.ProfileSetupRequestDto;
import com.example.my_java_app.repository.UserConsentRepository;
import com.example.my_java_app.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

@Service
public class OnboardingService {

    private final UserConsentRepository userConsentRepository;
    private final UserProfileRepository userProfileRepository;

    public OnboardingService(UserConsentRepository userConsentRepository,
                             UserProfileRepository userProfileRepository) {
        this.userConsentRepository = userConsentRepository;
        this.userProfileRepository = userProfileRepository;
    }

    /**
     * Ghi nhận user đồng ý với các policy
     * Với mỗi policyId → INSERT vào user_consents
     */
    public void saveConsent(String cognitoSub, ConsentRequestDto dto) {
        if (dto.getPolicyIds() == null || dto.getPolicyIds().isEmpty()) {
            return;
        }
        for (int policyId : dto.getPolicyIds()) {
            userConsentRepository.save(cognitoSub, policyId, dto.getIpAddress(), dto.getUserAgent());
        }
    }

    /**
     * Lưu profile sau khi user chọn ngôn ngữ
     * INSERT user_profiles → onboardingStatus trở thành DONE
     */
    public void saveProfile(String cognitoSub, ProfileSetupRequestDto dto) {
        String languageCode = dto.getLanguageCode() != null ? dto.getLanguageCode() : "en-US";
        userProfileRepository.saveProfile(cognitoSub, languageCode);
    }
}
