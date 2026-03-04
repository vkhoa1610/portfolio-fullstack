package com.example.my_java_app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Mapper
public interface AdminUserMapper {

    List<Map<String, Object>> findAllUsers();

    String findCognitoSubByEmail(@Param("email") String email);

    Integer findRoleIdByName(@Param("roleName") String roleName);

    void upsertUserRole(@Param("cognitoSub") String cognitoSub,
                        @Param("roleId") int roleId);

    void upsertUserBudget(@Param("cognitoSub") String cognitoSub,
                          @Param("budget") BigDecimal budget);
}
