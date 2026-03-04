package com.example.my_java_app.mapper;

import com.example.my_java_app.dto.response.UserPermissionStatusDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PermissionMapper {

    List<String> findPermissionCodesByUserSub(@Param("userSub") String userSub);

    Integer findPermissionIdByCode(@Param("permissionCode") String permissionCode);

    void grantPermission(@Param("userSub") String userSub,
                         @Param("permissionId") int permissionId,
                         @Param("grantedBy") String grantedBy);

    void revokePermission(@Param("userSub") String userSub,
                          @Param("permissionId") int permissionId);

    List<UserPermissionStatusDto> findAllPermissionsWithStateForUser(@Param("userSub") String userSub);
}
