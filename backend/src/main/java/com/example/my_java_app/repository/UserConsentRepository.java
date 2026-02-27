package com.example.my_java_app.repository;

import com.example.my_java_app.mapper.UserConsentMapper;
import org.springframework.stereotype.Repository;

@Repository
public class UserConsentRepository {
    private final UserConsentMapper mapper;

    public UserConsentRepository(UserConsentMapper mapper) {
        this.mapper = mapper;
    }

    public void save(String userSub, int policyId, String ipAddress, String userAgent) {
        mapper.insertConsent(userSub, policyId, ipAddress, userAgent);
    }
}
