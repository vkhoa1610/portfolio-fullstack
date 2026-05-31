package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.UserConsentEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserConsentMapper {
    void insertConsent(
        @Param("userSub") String userSub,
        @Param("policyId") int policyId,
        @Param("ipAddress") String ipAddress,
        @Param("userAgent") String userAgent
    );

    /** Consent history joined with policies (title, type, version). Newest first. */
    List<UserConsentEntity> findByUserSub(@Param("userSub") String userSub);
}
