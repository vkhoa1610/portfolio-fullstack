package com.example.my_java_app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserConsentMapper {
    void insertConsent(
        @Param("userSub") String userSub,
        @Param("policyId") int policyId,
        @Param("ipAddress") String ipAddress,
        @Param("userAgent") String userAgent
    );
}
